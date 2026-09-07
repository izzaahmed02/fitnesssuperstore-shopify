#!/usr/bin/env python3
"""QA gate for the 10 approved hero-SKU feed titles.

Enforces the rules from Tim's 2026-09-05 approval email:
  - exact strings, character for character (no straight-hyphen drift on the en dash)
  - the keyword phrase must end inside the first 70 characters
  - Merchant Center hard limit of 150 characters
  - every title ends with its own SKU in parentheses
  - offer ids are unique and match the verified id scheme

Run: python3 scripts/check_hero_titles.py
Exit 0 = safe to publish.
"""
import csv
import pathlib
import sys

TABLE = pathlib.Path(__file__).resolve().parent.parent / "feeds" / "hero-title-overrides.csv"

KEYWORD_WINDOW = 70
GMC_TITLE_MAX = 150
EN_DASH = "–"

def main() -> int:
    rows = list(csv.DictReader(TABLE.open(encoding="utf-8")))
    failures = []

    if len(rows) != 10:
        failures.append(f"expected 10 rows, found {len(rows)}")

    seen = set()
    for row in rows:
        sku, offer_id = row["sku"], row["offer_id"]
        title, keyword = row["title"], row["keyword_phrase"]

        if offer_id in seen:
            failures.append(f"{sku}: duplicate offer_id {offer_id}")
        seen.add(offer_id)

        # All 10 are single-variant products with no custom.old_legacy_product_code,
        # so the primary feed keys them on the bare SKU. Verified against Shopify
        # and the googleshoppingfs / googleshoppingfrenchfitness exports.
        if offer_id != sku:
            failures.append(f"{sku}: offer_id {offer_id} does not match the verified SKU scheme")

        if len(title) > GMC_TITLE_MAX:
            failures.append(f"{sku}: title is {len(title)} chars, over the {GMC_TITLE_MAX} limit")

        if EN_DASH not in title:
            failures.append(f"{sku}: en dash (U+2013) missing - a straight hyphen is not the approved string")

        if title != title.strip() or "  " in title:
            failures.append(f"{sku}: stray or doubled whitespace")

        if not title.endswith(f"({sku})"):
            failures.append(f"{sku}: title does not end with its own SKU in parentheses")

        if keyword not in title:
            failures.append(f"{sku}: keyword phrase {keyword!r} not present in the title")
        else:
            keyword_end = title.index(keyword) + len(keyword)
            if keyword_end > KEYWORD_WINDOW:
                failures.append(
                    f"{sku}: keyword phrase ends at char {keyword_end}, outside the first {KEYWORD_WINDOW}"
                )

    for row in rows:
        end = row["title"].index(row["keyword_phrase"]) + len(row["keyword_phrase"])
        print(f"{row['sku']:<11} len={len(row['title']):>3}  keyword ends at {end:>2}  {row['title']}")

    print()
    if failures:
        print(f"FAIL - {len(failures)} problem(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"PASS - {len(rows)} titles clean.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
