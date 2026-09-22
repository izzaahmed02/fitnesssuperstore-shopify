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

import json
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

    real_query = (PKG / "queries" / "product_v5.graphql").read_text()
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
          and "read_product_listings" not in (PKG / "export.py").read_text(),
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
        check(f'"{forbidden}"' not in (PKG / "export.py").read_text(),
              f"{forbidden} is not requested")

    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        scope_path = tmpdir / "scope.json"
        scope_path.write_text(json.dumps(FIXTURE_SCOPE))
        overlay_path = tmpdir / "overlay_fixture.csv"
        overlay_path.write_text(FIXTURE_OVERLAY)
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
            capture_output=True, text=True, cwd=str(REPO),
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

        record = json.loads((out / "sample.jsonl").read_text().splitlines()[0])

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
        conflicts = (out / "unmatched_conflict_report.csv").read_text()
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
        join = (out / "overlay_preview_join.csv").read_text()
        check("EXACT_SKU" in join, "overlay matched on an exact SKU key")
        check(",NO," in join or "gate_passed" in join, "gate result is recorded")
        check("PREVIEW_UNAPPROVED_DO_NOT_USE" in join,
              "every overlay row is stamped unapproved")
        preview = json.loads(
            (out / "sample_with_overlay_PREVIEW.jsonl").read_text().splitlines()[0]
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
        manifest = json.loads((out / "manifest.json").read_text())
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
        }))
        out2 = tmpdir / "out2"
        proc2 = subprocess.run(
            [
                sys.executable, str(PKG / "export.py"),
                "--from-capture", str(HERE / "fixtures"),
                "--scope", str(bad_scope),
                "--out", str(out2), "--commit", "test",
            ],
            capture_output=True, text=True, cwd=str(REPO),
        )
        check(proc2.returncode == 2, f"exit 2 on a partial run (got {proc2.returncode})")
        manifest2 = json.loads((out2 / "manifest.json").read_text())
        check(manifest2["status"] == "PARTIAL", "partial run is marked PARTIAL")
        check(len(manifest2["failures"]) == 1, "the failed product is recorded")
        check("__run__" in (out2 / "unmatched_conflict_report.csv").read_text(),
              "the failure is visible in the conflict report")

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
