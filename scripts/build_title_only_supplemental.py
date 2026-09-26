#!/usr/bin/env python3
"""Emit a 10-row, title-only supplemental for the approved hero SKUs.

An alternative to rebuilding the 2,196-row v2 file. A supplemental source only
contributes the attributes it carries, so a source containing just `id` and
`title` cannot affect custom_label_3 or custom_label_4 at all - those keep coming
from supplemental_priority_labels_v2.csv, untouched.

This is the pattern already in use in the account: the "FSR Final Upload -
7 rows (id, title)" source is a title-only supplemental on the same primary.

The id scheme must be confirmed in Merchant Center first (Products > find one of
the ten > read its ID), because the account has used the bare SKU and the numeric
Shopify product ID at different times. Pass whichever it is.

Usage:
    python3 scripts/build_title_only_supplemental.py --id-scheme sku
    python3 scripts/build_title_only_supplemental.py --id-scheme product_id
"""
import argparse
import csv
import pathlib
import sys

TABLE = pathlib.Path(__file__).resolve().parent.parent / "feeds" / "hero-title-overrides.csv"

SCHEMES = {
    "sku": "sku",
    "product_id": "shopify_product_id",
    "variant_id": "shopify_variant_id",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id-scheme", required=True, choices=sorted(SCHEMES),
                    help="the id format the primary feed uses - confirm in GMC, do not guess")
    ap.add_argument("-o", "--out", type=pathlib.Path,
                    default=pathlib.Path("hero_titles_supplemental.csv"))
    args = ap.parse_args()

    column = SCHEMES[args.id_scheme]
    rows = list(csv.DictReader(TABLE.open(encoding="utf-8")))

    if len(rows) != 10:
        print(f"REFUSING TO WRITE: expected 10 approved rows, found {len(rows)}", file=sys.stderr)
        return 1

    ids = [r[column] for r in rows]
    if len(set(ids)) != len(ids):
        print("REFUSING TO WRITE: duplicate ids under this scheme", file=sys.stderr)
        return 2
    if any(not i for i in ids):
        print(f"REFUSING TO WRITE: blank {column} on one or more rows", file=sys.stderr)
        return 3

    # Quoted fields, matching the source's existing "Using quoted fields" setting.
    with args.out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, quoting=csv.QUOTE_ALL)
        writer.writerow(["id", "title"])
        for r in rows:
            writer.writerow([r[column], r["title"]])

    print(f"Wrote {args.out}  ({len(rows)} rows, id scheme: {args.id_scheme})")
    print("\nThis file carries only id and title. It cannot alter custom_label_3 or")
    print("custom_label_4, so v2 and the Product Lines asset groups are untouched.")
    print("\nUpload as a NEW supplemental source, linked to the same primaries as v2.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
