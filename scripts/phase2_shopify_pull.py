#!/usr/bin/env python3
"""Pull the live Shopify catalogue for the Phase 2 feed generator.

Writes one JSON object per variant to a JSONL snapshot. The generator reads
that snapshot, so a feed build is reproducible and diffable: the same snapshot
always produces the same feed, and two snapshots show exactly what drifted.

Every field the generator needs comes from here. Nothing is derived at pull
time — the transforms all live in phase2_feed_generator.py.

Credentials come from the environment, never from a flag:

    export SHOPIFY_STORE=fitnesssuperstore.myshopify.com
    export SHOPIFY_ADMIN_TOKEN=shpat_...

Usage:
    python3 scripts/phase2_shopify_pull.py --out out/shopify_catalog.jsonl
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API_VERSION = "2025-07"

# Variant-level pagination: products carry up to 100 variants, and paging by
# variant avoids the nested-connection truncation that bites multi-variant
# products like the hex dumbbells (45 variants) and Monster storage (10).
QUERY = """
query Variants($cursor: String) {
  productVariants(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes {
      legacyResourceId
      sku
      title
      price
      compareAtPrice
      availableForSale
      inventoryQuantity
      barcode
      image { url }
      inventoryItem { measurement { weight { value unit } } }
      variantProcessingTime: metafield(
        namespace: "custom", key: "processing_time_long_variant") { value }
      product {
        legacyResourceId
        title
        handle
        vendor
        productType
        status
        onlineStoreUrl
        totalVariants
        description
        featuredMedia { preview { image { url } } }
        legacyCode: metafield(
          namespace: "custom", key: "old_legacy_product_code") { value }
        googleProductCategory: metafield(
          namespace: "mm-google-shopping", key: "google_product_category") { value }
        condition: metafield(namespace: "custom", key: "condition") { value }
      }
    }
  }
}
"""


def admin_post(store, token, query, variables):
    url = f"https://{store}/admin/api/{API_VERSION}/graphql.json"
    body = json.dumps({"query": query, "variables": variables}).encode()
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if "errors" in payload:
        raise SystemExit(f"GraphQL errors: {json.dumps(payload['errors'], indent=2)}")
    return payload["data"]


def flatten(node):
    """One variant -> one flat record. No feed logic here."""
    product = node.get("product") or {}
    measurement = (node.get("inventoryItem") or {}).get("measurement") or {}
    weight = measurement.get("weight") or {}
    featured = ((product.get("featuredMedia") or {}).get("preview") or {}).get("image") or {}
    return {
        "variant_id": node.get("legacyResourceId"),
        "product_id": product.get("legacyResourceId"),
        "sku": (node.get("sku") or "").strip(),
        "variant_title": node.get("title"),
        "product_title": product.get("title"),
        "handle": product.get("handle"),
        "vendor": product.get("vendor"),
        "product_type": product.get("productType"),
        "status": product.get("status"),
        "online_store_url": product.get("onlineStoreUrl"),
        "total_variants": product.get("totalVariants"),
        "description": product.get("description"),
        "price": node.get("price"),
        "compare_at_price": node.get("compareAtPrice"),
        "available_for_sale": node.get("availableForSale"),
        "inventory_quantity": node.get("inventoryQuantity"),
        "barcode": node.get("barcode"),
        "image_url": (node.get("image") or {}).get("url") or featured.get("url"),
        "weight_value": weight.get("value"),
        "weight_unit": weight.get("unit"),
        "legacy_product_code": (product.get("legacyCode") or {}).get("value"),
        "google_product_category": (product.get("googleProductCategory") or {}).get("value"),
        "condition": (product.get("condition") or {}).get("value"),
        "processing_time_variant": (node.get("variantProcessingTime") or {}).get("value"),
    }


def pull(store, token, limit=None):
    cursor = None
    seen = 0
    while True:
        for attempt in range(5):
            try:
                data = admin_post(store, token, QUERY, {"cursor": cursor})
                break
            except urllib.error.HTTPError as exc:
                # 429 and 5xx are the throttle/transient cases worth retrying.
                if exc.code not in (429, 500, 502, 503, 504) or attempt == 4:
                    raise
                time.sleep(2 ** attempt)
        else:  # pragma: no cover - the loop always breaks or raises
            raise SystemExit("exhausted retries")

        connection = data["productVariants"]
        for node in connection["nodes"]:
            yield flatten(node)
            seen += 1
            if limit and seen >= limit:
                return
        if not connection["pageInfo"]["hasNextPage"]:
            return
        cursor = connection["pageInfo"]["endCursor"]


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--out", default="out/shopify_catalog.jsonl",
                        help="JSONL snapshot to write")
    parser.add_argument("--limit", type=int,
                        help="stop after N variants (smoke tests only)")
    args = parser.parse_args(argv)

    store = os.environ.get("SHOPIFY_STORE")
    token = os.environ.get("SHOPIFY_ADMIN_TOKEN")
    if not store or not token:
        raise SystemExit(
            "set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN in the environment"
        )

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    count = 0
    with open(args.out, "w", encoding="utf-8") as fh:
        for record in pull(store, token, args.limit):
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
            if count % 1000 == 0:
                print(f"  {count} variants...", file=sys.stderr)

    print(f"{count} variants -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
