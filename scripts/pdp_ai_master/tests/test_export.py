#!/usr/bin/env python3
"""Smoke test for the PDP AI Master export harness.

Runs the real harness end to end against a synthetic fixture and asserts the
governance guarantees we report to the business:

  * read-only enforcement actually aborts on a write token
  * durable vs volatile separation holds
  * cost_internal never reaches a shared artifact
  * every conflict rule fires on the values it is supposed to catch
  * the overlay gate blocks by default and stamps everything unapproved
  * the manifest checksums every output

No network. No Shopify credentials. Run:

    python3 scripts/pdp_ai_master/tests/test_export.py
"""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PKG = HERE.parent
REPO = PKG.parent.parent

sys.path.insert(0, str(PKG))

from guardrails import ReadOnlyViolation, assert_read_only  # noqa: E402

FIXTURE_SCOPE = {
    "list_name": "fixture scope",
    "source": "test_export.py",
    "products": [
        {
            "shopify_product_id": "1111111111111",
            "product_code": "FIXTURE-1",
            "handle": "fixture-conflict-product",
        }
    ],
}

# Overlay row that matches on SKU but must still be blocked by the gate.
FIXTURE_OVERLAY = (
    "sku,product_url,recommendation_tier,autonomous_recommendation_ok,"
    "needs_human_review,do_not_lead_flag,do_not_recommend_flag,tim_approval\n"
    "FIXTURE-1-A,,Tier 2,Yes,Yes,No,No,seed\n"
)

failures: list[str] = []

# The harness runs without Python's UTF-8 mode so a Windows (cp1252) run
# proves the explicit encodings, not the PYTHONUTF8 workaround.
HARNESS_ENV = {k: v for k, v in os.environ.items() if k != "PYTHONUTF8"}

TEXT_IO_CALLS = ("read_text", "write_text", "open")


def text_io_without_encoding(path: Path) -> list[str]:
    """Return file:line for every text-mode read_text/write_text/open call
    that does not pass encoding=. Binary modes are exempt."""
    missing = []
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if isinstance(func, ast.Attribute) and func.attr in TEXT_IO_CALLS:
            name, mode_pos = func.attr, 0  # Path.open(mode, ...)
        elif isinstance(func, ast.Name) and func.id == "open":
            name, mode_pos = "open", 1  # open(file, mode, ...)
        else:
            continue
        if name == "open":
            mode = node.args[mode_pos] if len(node.args) > mode_pos else None
            for kw in node.keywords:
                if kw.arg == "mode":
                    mode = kw.value
            if isinstance(mode, ast.Constant) and "b" in str(mode.value):
                continue
        if not any(kw.arg == "encoding" for kw in node.keywords):
            missing.append(f"{path.name}:{node.lineno}")
    return missing


def find_warranty(node):
    """Return the custom.warranty metafield value from a capture payload."""
    if isinstance(node, dict):
        if node.get("key") == "warranty" and "value" in node:
            return node["value"]
        node = list(node.values())
    if isinstance(node, list):
        for item in node:
            found = find_warranty(item)
            if found is not None:
                return found
    return None


def check(condition: bool, label: str) -> None:
    if condition:
        print(f"  ok   {label}")
    else:
        print(f"  FAIL {label}")
        failures.append(label)


def main() -> int:
    print("read-only guardrails")
    try:
        assert_read_only("mutation productUpdate { id }", "test")
        check(False, "a mutation document is rejected")
    except ReadOnlyViolation:
        check(True, "a mutation document is rejected")

    try:
        assert_read_only("query Ok { shop { name } }", "test")
        check(True, "a plain query is accepted")
    except ReadOnlyViolation:
        check(False, "a plain query is accepted")

    real_query = (PKG / "queries" / "product_v5.graphql").read_text(encoding="utf-8")
    try:
        assert_read_only(real_query, "product_v5.graphql")
        check(True, "the shipped query document passes read-only")
    except ReadOnlyViolation as exc:
        check(False, f"the shipped query document passes read-only ({exc})")

    print("\nleast-privilege scope discipline")
    from export import API_VERSION, REQUIRED_SCOPES  # noqa: E402
    check(API_VERSION == "2026-07", f"API version is 2026-07 (got {API_VERSION})")
    check(set(REQUIRED_SCOPES) == {"read_products", "read_metaobjects",
                                   "read_inventory"},
          "scope set is exactly the three validated read scopes")
    check("read_product_listings" not in real_query
          and "read_product_listings" not in (PKG / "export.py").read_text(encoding="utf-8"),
          "read_product_listings is not claimed anywhere")
    # `media` costs six extra scopes including read_orders. If someone
    # reintroduces it, this fails and the scope review happens again.
    # Comments are stripped first: the scope note legitimately names the
    # fields it is telling you not to use.
    query_body = "\n".join(
        line for line in real_query.splitlines()
        if not line.lstrip().startswith("#")
    )
    check("media(first" not in query_body and "featuredMedia" not in query_body,
          "the query does not use media/featuredMedia (six extra scopes)")
    for forbidden in ("read_orders", "read_draft_orders", "read_themes"):
        check(f'"{forbidden}"' not in (PKG / "export.py").read_text(encoding="utf-8"),
              f"{forbidden} is not requested")

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        scope_path = tmpdir / "scope.json"
        scope_path.write_text(json.dumps(FIXTURE_SCOPE), encoding="utf-8")
        overlay_path = tmpdir / "overlay_fixture.csv"
        overlay_path.write_text(FIXTURE_OVERLAY, encoding="utf-8")
        out = tmpdir / "out"

        print("\nharness run (replay mode, no network)")
        proc = subprocess.run(
            [
                sys.executable, str(PKG / "export.py"),
                "--from-capture", str(HERE / "fixtures"),
                "--scope", str(scope_path),
                "--overlay", str(overlay_path),
                "--out", str(out),
                "--commit", "test",
            ],
            capture_output=True, text=True, cwd=str(REPO), env=HARNESS_ENV,
        )
        check(proc.returncode == 0, f"exit 0 on a complete run (got {proc.returncode})")
        if proc.returncode != 0:
            print(proc.stdout)
            print(proc.stderr)

        expected = [
            "sample.jsonl", "sample_with_overlay_PREVIEW.jsonl",
            "overlay_preview_join.csv", "unmatched_conflict_report.csv",
            "manifest.json", "field_source_matrix_V5.csv",
            "README_P0P1_sample.md",
        ]
        for name in expected:
            check((out / name).exists(), f"emitted {name}")

        record = json.loads((out / "sample.jsonl").read_text(encoding="utf-8").splitlines()[0])

        print("\ndurable / volatile separation")
        d, v = record["durable"], record["volatile_live_fetch_required"]
        check("price" not in d, "price is not in the durable block")
        check("warranty" not in d, "warranty is not in the durable block")
        check(v["variant_pricing_and_stock"][0]["price"] == "100.00",
              "price is present in the volatile block for QA")
        check(record["embed_policy"]["volatile_embed_ok"] is False,
              "volatile embed_ok is false")
        check(record["snapshot"]["seed_origin_flag"] is False,
              "seed_origin_flag is false")
        check(record["snapshot"]["source_status"] == "SHOPIFY_ADMIN_GRAPHQL_LIVE_READ",
              "source_status records the read path")

        print("\ncost containment")
        check("cost_internal" not in json.dumps(d),
              "cost_internal is absent from the entire durable block")
        check(all("cost_internal" in row for row in v["variant_pricing_and_stock"]),
              "cost_internal is present in the volatile block for internal QA")

        print("\nmetaobject resolution")
        check(d["pdp_content"]["features"] == "Fixture feature line.",
              "rich_text_field is flattened to plain text")
        check(d["breadcrumb_paths"][0]["fields"]["title"] == "Fixture > Crumb",
              "metaobject list references resolve to fields")
        check(d["related_products"][0]["handle"] == "fixture-related",
              "product references resolve to handle and title")
        check(d["pdp_content_needs_approval"]["comparison_chart_table"] is not None,
              "comparison chart is held in the needs-approval block")

        print("\nconflict rules")
        conflicts = (out / "unmatched_conflict_report.csv").read_text(encoding="utf-8")
        for label, needle in (
            ("inventory 0 but buyable is HIGH", "would publish InStock"),
            ("placeholder buffer inventory is flagged", "placeholder buffer"),
            ("80% implied discount is flagged", "Implied discount 80%"),
            ("blank barcode with a upc_code on file is flagged",
             "blank, and the Google feed reads barcode"),
            ("missing SKU is flagged", "no SKU"),
            ("unverifiable warranty is flagged", "cannot be stated"),
            ("competitor naming in the chart is flagged", "Rogue"),
            ("missing SEO is flagged", "Missing SEO"),
            ("thin media is flagged", "Thin media"),
            ("unauthored set_includes is flagged", "set_includes is unauthored"),
            ("missing manuals is flagged", "No manuals or downloads"),
            ("REMOVE FROM FEEDS tag is surfaced", "tagged out of the Google feeds"),
            ("invisible characters are reported not stripped", "U+200B"),
        ):
            check(needle in conflicts, label)

        print("\noverlay gate")
        join = (out / "overlay_preview_join.csv").read_text(encoding="utf-8")
        check("EXACT_SKU" in join, "overlay matched on an exact SKU key")
        check(",NO," in join or "gate_passed" in join, "gate result is recorded")
        check("PREVIEW_UNAPPROVED_DO_NOT_USE" in join,
              "every overlay row is stamped unapproved")
        preview = json.loads(
            (out / "sample_with_overlay_PREVIEW.jsonl").read_text(encoding="utf-8").splitlines()[0]
        )
        gate = preview["recommendation_overlay"]
        check(gate["gate_passed"] is False, "gate blocks the matched row")
        check("needs_human_review is set" in gate["gate_block_reasons"],
              "gate reports needs_human_review as a block reason")
        check("tim_approval is not granted" in gate["gate_block_reasons"],
              "gate reports missing Tim approval as a block reason")
        check(record["recommendation_overlay"] is None,
              "the clean sample keeps the overlay null")

        print("\nmanifest")
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        check(manifest["status"] == "COMPLETE", "status is COMPLETE")
        check(manifest["harness"]["write_path_exists"] is False,
              "manifest records that no write path exists")
        check(manifest["harness"]["shopify_writes_made"] == 0,
              "manifest records zero writes")
        check(manifest["governance"]["recurring_schedule"]
              == "NOT_APPROVED_NOT_SCHEDULED",
              "manifest records that no schedule is approved")
        check(manifest["governance"]["overlay_rows_moved_off_seed"] == 0,
              "manifest records zero overlay rows moved off seed")
        check(manifest["governance"]["overlay_gate_passes"] == 0,
              "manifest records zero gate passes")
        check(len(manifest["outputs"]) == 6
              and all("sha256" in o for o in manifest["outputs"].values()),
              "manifest checksums every other output")
        check(manifest["scope"]["expansion_beyond_scope"] is False,
              "manifest records no scope expansion")

        print("\npartial-run behaviour")
        bad_scope = tmpdir / "bad_scope.json"
        bad_scope.write_text(json.dumps({
            "list_name": "missing capture",
            "products": [
                *FIXTURE_SCOPE["products"],
                {"shopify_product_id": "9999999999999", "product_code": "MISSING"},
            ],
        }), encoding="utf-8")
        out2 = tmpdir / "out2"
        proc2 = subprocess.run(
            [
                sys.executable, str(PKG / "export.py"),
                "--from-capture", str(HERE / "fixtures"),
                "--scope", str(bad_scope),
                "--out", str(out2), "--commit", "test",
            ],
            capture_output=True, text=True, cwd=str(REPO), env=HARNESS_ENV,
        )
        check(proc2.returncode == 2, f"exit 2 on a partial run (got {proc2.returncode})")
        manifest2 = json.loads((out2 / "manifest.json").read_text(encoding="utf-8"))
        check(manifest2["status"] == "PARTIAL", "partial run is marked PARTIAL")
        check(len(manifest2["failures"]) == 1, "the failed product is recorded")
        check("__run__" in (out2 / "unmatched_conflict_report.csv").read_text(encoding="utf-8"),
              "the failure is visible in the conflict report")

        print("\nUTF-8 file I/O (U+200B preserved, no PYTHONUTF8)")
        check(v["warranty"].startswith("\u200b"),
              "replay read keeps the fixture's leading U+200B in warranty")
        cap1, out3, out4 = tmpdir / "cap1", tmpdir / "out3", tmpdir / "out4"
        proc3 = subprocess.run(
            [
                sys.executable, str(PKG / "export.py"),
                "--from-capture", str(HERE / "fixtures"),
                "--capture-to", str(cap1),
                "--scope", str(scope_path),
                "--out", str(out3), "--commit", "test",
            ],
            capture_output=True, text=True, cwd=str(REPO), env=HARNESS_ENV,
        )
        check(proc3.returncode == 0,
              f"capture write with U+200B completes (got {proc3.returncode})")
        if proc3.returncode != 0:
            print(proc3.stdout)
            print(proc3.stderr)
        capture = cap1 / "product_1111111111111.json"
        raw = capture.read_bytes() if capture.exists() else b""
        check(b"\xe2\x80\x8b" in raw, "capture file holds U+200B as UTF-8 bytes")
        check(b"\\u200b" not in raw.lower(),
              "capture file does not escape U+200B")
        try:
            cap_warranty = find_warranty(json.loads(raw.decode("utf-8")))
        except (UnicodeDecodeError, ValueError):
            cap_warranty = None
        check(cap_warranty is not None and cap_warranty.startswith("\u200b"),
              "capture decodes as UTF-8 with warranty starting U+200B")

        proc4 = subprocess.run(
            [
                sys.executable, str(PKG / "export.py"),
                "--from-capture", str(cap1),
                "--scope", str(scope_path),
                "--out", str(out4), "--commit", "test",
            ],
            capture_output=True, text=True, cwd=str(REPO), env=HARNESS_ENV,
        )
        check(proc4.returncode == 0,
              f"replay from the new capture completes (got {proc4.returncode})")
        replay_path = out4 / "sample.jsonl"
        replayed = (
            json.loads(replay_path.read_text(encoding="utf-8").splitlines()[0])
            if replay_path.exists() else {}
        )
        check(replayed.get("volatile_live_fetch_required", {}).get("warranty")
              == v["warranty"],
              "capture round-trip returns the identical warranty value")

        for name in ("manifest.json", "README_P0P1_sample.md",
                     "field_source_matrix_V5.csv"):
            try:
                (out / name).read_bytes().decode("utf-8")
                decoded = True
            except UnicodeDecodeError:
                decoded = False
            check(decoded, f"{name} is valid UTF-8")

    print("\nstatic guard: text I/O always names an encoding")
    for path in (PKG / "export.py", HERE / "test_export.py"):
        missing = text_io_without_encoding(path)
        check(not missing, f"{path.name} has no text I/O without encoding="
                           + (f" (missing: {', '.join(missing)})" if missing else ""))

    print()
    if failures:
        print(f"{len(failures)} check(s) FAILED")
        for label in failures:
            print(f"  - {label}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
