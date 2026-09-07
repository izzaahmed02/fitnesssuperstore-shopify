#!/usr/bin/env python3
"""Build the generator's catalogue snapshot from Shopify product-export CSVs.

An alternative to phase2_shopify_pull.py for when you have the admin CSV export
(Products > Export) but no Admin API token. Same output shape, so the generator
does not care which produced it.

Two limits of the CSV export, both structural rather than fixable here:

  * It carries no variant id. Every offer already in a feed keeps the id the
    feed gives it, so that only matters for a NEW multi-variant SKU, which needs
    a composite `<product>-<variant>` id that cannot be minted without one.
    Those rows are reported by the generator rather than guessed.
  * `Shopify Product ID` is a metafield, not a native column, and is populated
    on roughly three quarters of rows.

Product-level fields (Title, Vendor, Status, ...) appear only on the first row
of each handle; the export repeats the handle for extra variants and images with
those cells blank. They are forward-filled per handle here.

Usage:
    python3 scripts/phase2_catalog_from_export.py \\
        --export products_export_1.csv products_export_2.csv \\
        --out out/shopify_catalog.jsonl
"""

import argparse
import csv
import json
import os
import sys
from collections import defaultdict

csv.field_size_limit(sys.maxsize)

PRODUCT_ID_COLUMN = "Shopify Product ID (product.metafields.custom.shopify_product_id)"
LEGACY_GMC_ID_COLUMN = "Legacy GMC ID (product.metafields.custom.legacy_gmc_id)"
GMC_ROLLOUT_COLUMN = "GMC ID Rollout Status (product.metafields.custom.gmc_id_rollout_status)"

# Product-level cells that are blank on continuation rows.
CARRY_FORWARD = (
    "Title", "Vendor", "Type", "Status", "Published", "Body (HTML)",
    "Google Shopping / Google Product Category", "Google Shopping / Condition",
    PRODUCT_ID_COLUMN, LEGACY_GMC_ID_COLUMN, GMC_ROLLOUT_COLUMN,
)


def clean_sku(value):
    """Strip the leading apostrophe Excel adds to numeric-looking SKUs.

    Three Precor SKUs (931, 933, 935) come out of the export as `\'931` and
    stop matching the feed's `old_id` without this.
    """
    return (value or "").strip().lstrip("'").strip()


def grams_to_pounds(value):
    try:
        return round(float(value) / 453.59237, 2)
    except (TypeError, ValueError):
        return None


def read_rows(paths):
    """Every row of every export, product-level cells forward-filled by handle."""
    held = defaultdict(dict)
    for path in paths:
        with open(path, newline="", encoding="utf-8", errors="replace") as fh:
            for row in csv.DictReader(fh):
                handle = (row.get("Handle") or "").strip()
                if not handle:
                    continue
                carried = held[handle]
                for column in CARRY_FORWARD:
                    value = (row.get(column) or "").strip()
                    if value:
                        carried[column] = value
                    elif column in carried:
                        row[column] = carried[column]
                yield row


def build(paths):
    rows = [r for r in read_rows(paths) if clean_sku(r.get("Variant SKU"))]

    # A product's variant count decides whether a new offer gets a composite id.
    variants_per_handle = defaultdict(set)
    for row in rows:
        variants_per_handle[row["Handle"].strip()].add(clean_sku(row["Variant SKU"]))

    records, seen = [], set()
    for row in rows:
        sku = clean_sku(row["Variant SKU"])
        handle = row["Handle"].strip()
        if (handle, sku) in seen:
            continue
        seen.add((handle, sku))

        status = (row.get("Status") or "").strip().upper()
        published = (row.get("Published") or "").strip().lower() == "true"
        quantity = row.get("Variant Inventory Qty") or ""
        policy = (row.get("Variant Inventory Policy") or "").strip().lower()
        try:
            quantity = int(float(quantity))
        except (TypeError, ValueError):
            quantity = None

        # The export has no availableForSale. In-stock, or out of stock but
        # allowed to oversell, is sellable; anything else is not.
        available = status == "ACTIVE" and published and (
            (quantity or 0) > 0 or policy == "continue")

        records.append({
            "variant_id": None,  # not in the CSV export - see the docstring
            "product_id": (row.get(PRODUCT_ID_COLUMN) or "").strip() or None,
            "sku": sku,
            "variant_title": row.get("Option1 Value") or "Default Title",
            "product_title": row.get("Title") or "",
            "handle": handle,
            "vendor": row.get("Vendor") or "",
            "product_type": row.get("Type") or "",
            "status": status,
            "online_store_url": (
                f"https://www.fitnesssuperstore.com/products/{handle}"
                if published else None),
            "total_variants": len(variants_per_handle[handle]),
            "description": "",
            "price": (row.get("Variant Price") or "").strip() or None,
            "compare_at_price": (row.get("Variant Compare At Price") or "").strip() or None,
            "available_for_sale": available,
            "inventory_quantity": quantity,
            "barcode": (row.get("Variant Barcodes") or "").strip() or None,
            "image_url": (row.get("Variant Image") or row.get("Image Src") or "").strip() or None,
            "weight_value": grams_to_pounds(row.get("Variant Grams")),
            "weight_unit": "POUNDS",
            "legacy_product_code": (row.get(LEGACY_GMC_ID_COLUMN) or "").strip() or None,
            "google_product_category": (
                row.get("Google Shopping / Google Product Category") or "").strip() or None,
            "condition": (row.get("Google Shopping / Condition") or "").strip() or None,
            "processing_time_variant": None,
            "gmc_id_rollout_status": (row.get(GMC_ROLLOUT_COLUMN) or "").strip() or None,
            "source": "products_export_csv",
        })
    return records


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--export", nargs="+", required=True,
                        help="products_export_*.csv files from Shopify admin")
    parser.add_argument("--out", default="out/shopify_catalog.jsonl")
    args = parser.parse_args(argv)

    records = build(args.export)
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")

    no_product_id = sum(1 for r in records if not r["product_id"])
    print(f"{len(records)} variants -> {args.out}")
    print(f"  ACTIVE           : {sum(1 for r in records if r['status'] == 'ACTIVE')}")
    print(f"  no product id    : {no_product_id}")
    print(f"  multi-variant    : {sum(1 for r in records if r['total_variants'] > 1)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
