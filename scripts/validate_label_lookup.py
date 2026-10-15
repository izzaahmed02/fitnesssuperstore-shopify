#!/usr/bin/env python3
"""Validate the v2 priority-label lookup, offline and against live Shopify.

The lookup is `feeds/supplemental_priority_labels_v2.csv`, the file Tim uploaded
to the Merchant Center supplemental source on 2026-09-05 18:46 PDT and sent as an
attachment on 2026-09-07 / 2026-09-08. Merchant Center will not export a File
(manual) source back, so this repo copy is the only recoverable canonical copy.
Do not reconstruct it from GMC and do not substitute the older labels-only file.

Two passes:

  offline   structure and self-consistency - row count, unique ids, both label
            columns, the tier histogram Tim published, the $1,000 series floor as
            far as the file itself can attest, and the ten approved hero SKUs.

  live      every lookup id resolved against live Shopify. Tim's 2026-09-08 note:
            "the ten hero rows use SKUs, but the full lookup also contains numeric
            and composite IDs. Preserve the exact source IDs and validate the label
            mappings rather than assuming every row is SKU-keyed." So resolution is
            explicit and ordered, and anything that does not resolve is reported
            rather than silently blanked.

Resolution order, deliberately SKU-first:

  1. exact SKU on a live variant
  2. <productID>-<variantID> composite
  3. bare Shopify product id

SKU first because three ids in the file - 931, 933, 935 - are Precor SKUs that
look like numbers, and because where a variant is addressed twice (see below) the
bare-SKU row is the one carrying the hand-assigned tier.

Usage:
    python3 scripts/validate_label_lookup.py                     # offline only
    python3 scripts/validate_label_lookup.py --shopify-jsonl X   # + live pass
    python3 scripts/validate_label_lookup.py --shop S --token T  # + live pass

The live pass needs one row per product and one per variant. Either hand it a
bulkOperationRunQuery JSONL, or let it run the bulk operation itself:

    { products { edges { node { id status handle title
        variants { edges { node { id sku price compareAtPrice } } } } } } }

Exits non-zero on any failure so it can gate a build.
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import os
import pathlib
import re
import sys
import time
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
LOOKUP = REPO / "feeds" / "supplemental_priority_labels_v2.csv"
TITLE_OVERRIDES = REPO / "feeds" / "hero-title-overrides.csv"

# Published by Tim, 2026-09-07, "v2 label lookup file for the Phase 2 generator".
EXPECTED_ROWS = 2196
EXPECTED_TIERS = {"p1_hero": 64, "p2_core": 111, "p3_catalog": 123, "p4_tail": 1898}
# Series values Tim called out as new in the same email. Their presence is what
# separates v2 from the older labels-only file.
EXPECTED_NEW_SERIES = {
    "SM200 Series", "T900 Series", "UBE100 Series", "Telluride Series",
    "Diablo Series", "Stretch Cage Series", "FFS Silver Series",
}
SERIES_PRICE_FLOOR = 1000.0

COMPOSITE_RE = re.compile(r"\d+-\d+\Z")
NUMERIC_RE = re.compile(r"\d+\Z")

API_VERSION = "2025-07"


class Report:
    def __init__(self):
        self.failures: list[str] = []
        self.warnings: list[str] = []

    def ok(self, msg):
        print(f"  PASS  {msg}")

    def fail(self, msg):
        print(f"  FAIL  {msg}")
        self.failures.append(msg)

    def warn(self, msg):
        print(f"  WARN  {msg}")
        self.warnings.append(msg)


def load_lookup(path):
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        fields = [f.strip() for f in (reader.fieldnames or [])]
        rows = [
            {
                "id": (r.get("id") or "").strip(),
                "tier": (r.get("custom_label_3") or "").strip(),
                "series": (r.get("custom_label_4") or "").strip(),
            }
            for r in reader
        ]
    return fields, rows


def offline_checks(fields, rows, rep):
    print("\nOffline: structure and self-consistency")

    for col in ("id", "custom_label_3", "custom_label_4"):
        if col in fields:
            rep.ok(f"column {col} present")
        else:
            rep.fail(
                f"column {col} missing (found {fields}). A lookup without "
                "custom_label_4 is the older labels-only file; building a feed from "
                "it wipes the series labels and takes the Product Lines asset groups dark."
            )

    if len(rows) == EXPECTED_ROWS:
        rep.ok(f"{len(rows)} data rows, matching the {EXPECTED_ROWS} Tim published")
    else:
        rep.fail(f"{len(rows)} data rows, expected {EXPECTED_ROWS}")

    ids = [r["id"] for r in rows]
    blank = sum(1 for i in ids if not i)
    if blank:
        rep.fail(f"{blank} rows have a blank id")
    else:
        rep.ok("no blank ids")

    dups = [i for i, c in collections.Counter(ids).items() if c > 1]
    if dups:
        rep.fail(f"{len(dups)} duplicate ids, e.g. {dups[:5]}")
    else:
        rep.ok(f"{len(set(ids))} unique ids, one row each")

    tiers = collections.Counter(r["tier"] for r in rows)
    if dict(tiers) == EXPECTED_TIERS:
        rep.ok("tier histogram matches: " + ", ".join(f"{k} {v}" for k, v in EXPECTED_TIERS.items()))
    else:
        rep.fail(f"tier histogram is {dict(tiers)}, expected {EXPECTED_TIERS}")

    series = {r["series"] for r in rows if r["series"]}
    missing = EXPECTED_NEW_SERIES - series
    if missing:
        rep.fail(f"series values Tim listed as new are absent: {sorted(missing)}")
    else:
        rep.ok(f"all 7 new series values present ({len(series)} distinct series in total)")

    with_series = sum(1 for r in rows if r["series"])
    rep.ok(f"{with_series} rows carry a series, {len(rows) - with_series} do not")

    # Keying mix. Tim, 2026-09-08: do not assume every row is SKU-keyed.
    shape = collections.Counter(
        "composite" if COMPOSITE_RE.match(r["id"])
        else "all-digits" if NUMERIC_RE.match(r["id"])
        else "sku-like"
        for r in rows
    )
    rep.ok("id shapes: " + ", ".join(f"{k} {v}" for k, v in sorted(shape.items())))

    titles = {}
    if TITLE_OVERRIDES.exists():
        with TITLE_OVERRIDES.open(encoding="utf-8-sig", newline="") as fh:
            titles = {r["sku"].strip(): r["title"] for r in csv.DictReader(fh)}
    by_id = {r["id"]: r for r in rows}
    absent = [s for s in titles if s not in by_id]
    if titles and absent:
        rep.fail(f"approved hero SKUs missing from the lookup: {absent}")
    elif titles:
        not_hero = [s for s in titles if by_id[s]["tier"] != "p1_hero"]
        if not_hero:
            rep.warn(f"approved hero SKUs not tiered p1_hero: {not_hero}")
        else:
            rep.ok(f"all {len(titles)} approved hero SKUs present and tiered p1_hero")


def run_bulk(shop, token):
    """Kick off the products+variants bulk export and return the JSONL text."""
    endpoint = f"https://{shop}/admin/api/{API_VERSION}/graphql.json"

    def call(query, variables=None):
        body = json.dumps({"query": query, "variables": variables or {}}).encode()
        req = urllib.request.Request(
            endpoint, data=body,
            headers={"Content-Type": "application/json", "X-Shopify-Access-Token": token},
        )
        with urllib.request.urlopen(req) as resp:
            payload = json.load(resp)
        if payload.get("errors"):
            raise SystemExit(f"Shopify API error: {payload['errors']}")
        return payload["data"]

    inner = ("{ products { edges { node { id status handle title "
             "variants { edges { node { id sku price compareAtPrice } } } } } } }")
    started = call(
        "mutation($q: String!) { bulkOperationRunQuery(query: $q) "
        "{ bulkOperation { id status } userErrors { field message } } }",
        {"q": inner},
    )["bulkOperationRunQuery"]
    if started["userErrors"]:
        raise SystemExit(f"bulkOperationRunQuery: {started['userErrors']}")

    print("  bulk export running", end="", flush=True)
    for _ in range(180):
        time.sleep(3)
        op = call("{ currentBulkOperation { status url errorCode objectCount } }")["currentBulkOperation"]
        if op["status"] == "COMPLETED":
            print(f" done, {op['objectCount']} objects")
            with urllib.request.urlopen(op["url"]) as resp:
                return resp.read().decode()
        if op["status"] in ("FAILED", "CANCELED"):
            raise SystemExit(f"bulk export {op['status']}: {op['errorCode']}")
        print(".", end="", flush=True)
    raise SystemExit("bulk export did not finish in time")


def index_shopify(jsonl_text):
    products, variants = {}, []
    for line in jsonl_text.splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        if obj["id"].startswith("gid://shopify/Product/"):
            products[obj["id"].rsplit("/", 1)[1]] = obj
        else:
            variants.append(obj)

    per_product = collections.Counter(v["__parentId"] for v in variants)
    by_sku, by_pid, by_pair = collections.defaultdict(list), collections.defaultdict(list), {}
    for v in variants:
        pid = v["__parentId"].rsplit("/", 1)[1]
        vid = v["id"].rsplit("/", 1)[1]
        product = products[pid]
        rec = {
            "pid": pid, "vid": vid,
            "sku": (v.get("sku") or "").strip(),
            "price": float(v.get("price") or 0),
            "status": product["status"],
            "title": product["title"],
            "variant_count": per_product[v["__parentId"]],
        }
        if rec["sku"]:
            by_sku[rec["sku"]].append(rec)
        by_pid[pid].append(rec)
        by_pair[(pid, vid)] = rec
    return by_sku, by_pid, by_pair


def resolve(lookup_id, by_sku, by_pid, by_pair):
    """Explicit, ordered resolution. Returns (how, [variant records])."""
    if lookup_id in by_sku:
        return "sku", by_sku[lookup_id]
    if COMPOSITE_RE.match(lookup_id):
        pid, vid = lookup_id.split("-", 1)
        rec = by_pair.get((pid, vid))
        return "composite", ([rec] if rec else [])
    if lookup_id in by_pid:
        return "product-id", by_pid[lookup_id]
    return "unresolved", []


def live_checks(rows, jsonl_text, rep):
    print("\nLive: every lookup id resolved against Shopify")
    by_sku, by_pid, by_pair = index_shopify(jsonl_text)

    resolved, unresolved = [], []
    how_counts = collections.Counter()
    for row in rows:
        how, matches = resolve(row["id"], by_sku, by_pid, by_pair)
        row["_how"], row["_matches"] = how, matches
        how_counts[how] += 1
        (resolved if matches else unresolved).append(row)

    rep.ok(
        f"{len(resolved)} of {len(rows)} ids resolve: "
        + ", ".join(f"{k} {v}" for k, v in sorted(how_counts.items()) if k != "unresolved")
    )
    if unresolved:
        rep.warn(f"{len(unresolved)} ids match nothing in Shopify (any status):")
        for row in unresolved:
            print(f"          {row['id']}  {row['tier']}  {row['series'] or '-'}")
        print("        These contribute no labels to any generated row. Tim needs to "
              "drop them or name their replacement before the lookup is re-issued.")

    statuses = collections.Counter(m["status"] for r in resolved for m in r["_matches"])
    if set(statuses) == {"ACTIVE"}:
        rep.ok(f"every resolved id lands on an ACTIVE product ({statuses['ACTIVE']} variants)")
    else:
        rep.warn(f"resolved ids land on non-ACTIVE products too: {dict(statuses)}")

    # The $1,000 series floor, against live prices rather than the file's word.
    violations = [
        (r["id"], r["series"], m["price"])
        for r in resolved for m in r["_matches"]
        if r["series"] and m["price"] < SERIES_PRICE_FLOOR
    ]
    if violations:
        rep.fail(f"{len(violations)} series labels sit below the ${SERIES_PRICE_FLOOR:,.0f} floor:")
        for v in violations[:20]:
            print(f"          {v[0]}  {v[1]}  ${v[2]:,.2f}")
    else:
        rep.ok(f"no series label sits below the ${SERIES_PRICE_FLOOR:,.0f} floor")

    # The one that actually bites at cutover. Same live variant addressed twice,
    # once by its SKU and once by a composite id, with different tiers. Today the
    # bare-SKU row wins by resolution order; if that order ever flips, three hero
    # and core offers silently drop to p4_tail and out of their asset groups.
    composite_pairs = {
        tuple(r["id"].split("-", 1)) for r in rows if COMPOSITE_RE.match(r["id"])
    }
    by_lookup_id = {r["id"]: r for r in rows}
    collisions = []
    for row in rows:
        if row["_how"] != "sku":
            continue
        for m in row["_matches"]:
            key = f"{m['pid']}-{m['vid']}"
            if (m["pid"], m["vid"]) in composite_pairs:
                other = by_lookup_id[key]
                collisions.append((row["id"], row["tier"], key, other["tier"], m["price"]))
    conflicting = [c for c in collisions if c[1] != c[3]]
    if collisions:
        rep.warn(
            f"{len(collisions)} live variants are addressed twice in the lookup "
            f"(once by SKU, once by composite id); {len(conflicting)} disagree on tier:"
        )
        for sku_id, sku_tier, comp_id, comp_tier, price in collisions:
            mark = "  <-- conflict" if sku_tier != comp_tier else ""
            print(f"          {sku_id} {sku_tier}  vs  {comp_id} {comp_tier}  ${price:,.2f}{mark}")
        print("        SKU-first resolution keeps the hand-assigned tier. Tim should "
              "collapse these to one row per variant on the next re-issue.")
    else:
        rep.ok("no variant is addressed twice in the lookup")

    covered = {(m["pid"], m["vid"]) for r in resolved for m in r["_matches"]}
    return covered


def coverage_note(covered, jsonl_text):
    """How many live offers the lookup does not reach.

    Not a pass/fail: the inclusion ruleset in feeds/feed-rules.json narrows the
    feed well past a bare price floor, so this is an upper bound, printed so the
    gap is visible rather than discovered after cutover.
    """
    by_sku, by_pid, _ = index_shopify(jsonl_text)
    eligible = [
        m for recs in by_pid.values() for m in recs
        if m["status"] == "ACTIVE" and m["price"] >= 100
    ]
    uncovered = [m for m in eligible if (m["pid"], m["vid"]) not in covered]
    print("\nCoverage (informational)")
    print(f"  {len(eligible)} ACTIVE variants sit at or above the $100 feed floor.")
    print(f"  {len(eligible) - len(uncovered)} are reached by the lookup; "
          f"{len(uncovered)} across {len({m['pid'] for m in uncovered})} products are not.")
    print("  Rows the lookup does not reach emit blank custom_label_3/4. The ruleset "
          "narrows the feed further, so treat this as an upper bound on the gap, not "
          "a row count.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--lookup", default=str(LOOKUP))
    parser.add_argument("--shopify-jsonl", help="bulkOperationRunQuery output, products + variants")
    parser.add_argument("--shop", default=os.environ.get("SHOPIFY_SHOP"))
    parser.add_argument("--token", default=os.environ.get("SHOPIFY_ADMIN_TOKEN"))
    args = parser.parse_args()

    rep = Report()
    print(f"Lookup: {args.lookup}")
    fields, rows = load_lookup(args.lookup)
    offline_checks(fields, rows, rep)

    jsonl_text = None
    if args.shopify_jsonl:
        jsonl_text = pathlib.Path(args.shopify_jsonl).read_text(encoding="utf-8")
    elif args.shop and args.token:
        jsonl_text = run_bulk(args.shop, args.token)
    else:
        print("\nLive pass skipped: pass --shopify-jsonl, or --shop and --token.")

    if jsonl_text:
        covered = live_checks(rows, jsonl_text, rep)
        coverage_note(covered, jsonl_text)

    print()
    if rep.failures:
        print(f"FAILED: {len(rep.failures)} check(s), {len(rep.warnings)} warning(s)")
        return 1
    print(f"OK: all checks passed, {len(rep.warnings)} warning(s) to read")
    return 0


if __name__ == "__main__":
    sys.exit(main())
