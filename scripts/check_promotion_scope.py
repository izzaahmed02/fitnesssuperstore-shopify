#!/usr/bin/env python3
"""Three-way scope check for a running promotion.

Tim's launch rule, 2026-09-14: "The GMC mapping, the Shopify automatic discount,
and the list must be the same 16 SKUs - any product badged 10% OFF in ads that
does not discount at checkout is a disapproval and an account-quality hit."

Three things have to agree and each drifts independently:

  1. feeds/promotion-map.csv   what the Phase 2 generator will bake into the feeds
  2. the GMC supplemental       what Google is badging today (SUPPLEMENTAL SOURCE 20)
  3. the Shopify discount       what actually comes off at checkout

This compares 1 and 3 against live Shopify, and 2 as well if you pass the
supplemental export. Two failure directions, and they are not equally bad:

  badged but not discounted  -> Google disapproval and an account-quality hit
  discounted but not badged  -> no disapproval, just a promotion nobody sees

Both are reported. Only the first is treated as a hard failure.

    export SHOPIFY_SHOP=79ef8b-5e.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_...
    python3 scripts/check_promotion_scope.py
    python3 scripts/check_promotion_scope.py --gmc-supplemental source20.csv

Read-only. Changes nothing anywhere.
"""
import argparse
import collections
import csv
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROMO_MAP = ROOT / "feeds" / "promotion-map.csv"
API_VERSION = "2025-07"

DISCOUNT_QUERY = """
query Discount($id: ID!) {
  automaticDiscountNode(id: $id) {
    automaticDiscount {
      ... on DiscountAutomaticBasic {
        title status startsAt endsAt
        customerGets {
          value { ... on DiscountPercentage { percentage } }
          items {
            ... on DiscountProducts {
              products(first: 250) {
                pageInfo { hasNextPage }
                nodes { id title variants(first: 100) { nodes { sku } } }
              }
            }
            ... on DiscountCollections { collections(first: 50) { nodes { title } } }
            ... on AllDiscountItems { allItems }
          }
        }
      }
    }
  }
}
"""


def graphql(shop, token, query, variables):
    req = urllib.request.Request(
        f"https://{shop}/admin/api/{API_VERSION}/graphql.json",
        data=json.dumps({"query": query, "variables": variables}).encode(),
        headers={"Content-Type": "application/json", "X-Shopify-Access-Token": token},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"HTTP {exc.code}: {exc.read()[:400].decode(errors='replace')}")
    if payload.get("errors"):
        raise SystemExit(json.dumps(payload["errors"])[:800])
    return payload["data"]


def read_csv(path):
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        head = fh.readline()
        fh.seek(0)
        delimiter = "\t" if head.count("\t") > head.count(",") else ","
        return list(csv.DictReader(fh, delimiter=delimiter))


def load_map():
    by_promo = collections.defaultdict(dict)
    for row in read_csv(PROMO_MAP):
        sku = (row.get("sku") or "").strip()
        if sku:
            by_promo[(row["promotion_id"].strip(), row["shopify_discount_node"].strip())][sku] = row
    return by_promo


def discount_skus(shop, token, node_id):
    data = graphql(shop, token, DISCOUNT_QUERY, {"id": node_id})
    node = (data.get("automaticDiscountNode") or {}).get("automaticDiscount")
    if not node:
        raise SystemExit(f"no automatic discount at {node_id}")
    items = (node.get("customerGets") or {}).get("items") or {}
    if items.get("allItems"):
        raise SystemExit(f"{node['title']!r} targets ALL items; a promotion roster cannot be derived from it")
    if items.get("collections"):
        names = ", ".join(n["title"] for n in items["collections"]["nodes"])
        raise SystemExit(
            f"{node['title']!r} targets collections ({names}), not a product list. "
            "Collection membership changes without notice, so map the promotion from the "
            "collection rather than a fixed SKU list, or pin the discount to products.")
    products = items.get("products") or {"nodes": [], "pageInfo": {}}
    if products["pageInfo"].get("hasNextPage"):
        raise SystemExit("discount targets more than 250 products; paginate before trusting this check")
    skus = {}
    for p in products["nodes"]:
        for v in p["variants"]["nodes"]:
            if v["sku"]:
                skus[v["sku"]] = (p["id"].rsplit("/", 1)[-1], p["title"])
    return node, skus


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--gmc-supplemental",
                        help="export of the live GMC promotion supplemental (id,promotion_id)")
    parser.add_argument("--shop", default=os.environ.get("SHOPIFY_SHOP"))
    parser.add_argument("--token", default=os.environ.get("SHOPIFY_ADMIN_TOKEN"))
    args = parser.parse_args()
    if not args.shop or not args.token:
        parser.error("set SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN, or pass --shop/--token")

    gmc = None
    if args.gmc_supplemental:
        gmc = collections.defaultdict(set)
        for row in read_csv(args.gmc_supplemental):
            pid = (row.get("promotion_id") or "").strip()
            offer = (row.get("id") or "").strip()
            if pid and offer:
                gmc[pid].add(offer)

    hard_failures = 0
    for (promotion_id, node_id), mapped in sorted(load_map().items()):
        node, live = discount_skus(args.shop, args.token, node_id)
        pct = ((node.get("customerGets") or {}).get("value") or {}).get("percentage")
        print(f"== {promotion_id} ==")
        print(f"   discount   {node['title']}")
        print(f"   status     {node['status']}  {node['startsAt']} -> {node['endsAt']}")
        print(f"   amount     {pct * 100 if pct else '?'}%")
        print(f"   repo map   {len(mapped)} SKUs   (feeds/promotion-map.csv)")
        print(f"   checkout   {len(live)} SKUs   (live Shopify)")

        badged_not_discounted = sorted(set(mapped) - set(live))
        discounted_not_badged = sorted(set(live) - set(mapped))

        if badged_not_discounted:
            hard_failures += len(badged_not_discounted)
            print(f"\n   FAIL: badged in the feed but NOT discounted at checkout "
                  f"({len(badged_not_discounted)}). Google disapproval risk:")
            for sku in badged_not_discounted:
                print(f"     {sku}")
        if discounted_not_badged:
            print(f"\n   WARN: discounted at checkout but NOT badged ({len(discounted_not_badged)}). "
                  "No disapproval risk, but the promotion is invisible on these:")
            for sku in discounted_not_badged:
                pid, title = live[sku]
                print(f"     {sku:<20} {pid}  {title[:58]}")

        if gmc is not None:
            live_gmc = gmc.get(promotion_id, set())
            print(f"\n   GMC        {len(live_gmc)} offers mapped to {promotion_id}")
            missing = sorted(set(mapped) - live_gmc)
            extra = sorted(live_gmc - set(mapped))
            if missing:
                print(f"   repo map has {len(missing)} not in the GMC supplemental: {', '.join(missing)}")
            if extra:
                hard_failures += len(extra)
                print(f"   FAIL: GMC badges {len(extra)} not in the repo map, so a repoint would "
                      f"strip them: {', '.join(extra)}")
        if not badged_not_discounted and not discounted_not_badged:
            print("\n   OK: the feed roster and the checkout discount are the same set.")
        print()

    if hard_failures:
        print(f"{hard_failures} row(s) would be badged without discounting. Fix before the feeds serve.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
