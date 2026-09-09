#!/usr/bin/env python3
"""QA gate for delta 5 - price / sale_price / tax on a generated primary feed.

Run with no arguments to exercise the rule table against the live Shopify cases
recorded on 2026-09-07. Pass a generated feed to validate the real output:

    python3 scripts/check_feed_prices.py
    python3 scripts/check_feed_prices.py build/feeds/googleshoppingfrenchfitness.csv

Rules enforced:
  1. None of the three tax columns may appear (`tax`, the long `tax(...)` form,
     `tax_category`). A feed-level tax attribute overrides the
     Merchant Center account tax settings, and the live rows carry a hardcoded
     `US:CA:8.375:n` that predates the 23-state nexus change.
  2. `price` is Google's REGULAR price and `sale_price` is what the customer pays
     today. Shopify is the other way round, so they swap - but only when
     compare-at is genuinely above price.
  3. compare-at equal to price, below price, or 0.00 is stale data, not a sale.
     Emitting sale_price for it is the deceptive-savings pattern Google already
     flagged on this account ("Save 40%" thread, 2026-04-25).
  4. Every money value is `<amount> USD` with two decimals, matching the live rows.
  5. sale_price must be strictly below price when present.
"""
import csv
import pathlib
import re
import sys
from decimal import Decimal

MONEY = re.compile(r"^\d+\.\d{2} USD$")
TAX_COLUMNS = {
    "tax",
    "tax(country:location_group_name:location_id:postal_code:region:rate:tax_ship)",
    # Three, not two. Izza's 2026-09-07 pass on the live rows found tax_category
    # alongside the bare and long-form tax columns.
    "tax_category",
}


def resolve(price, compare_at):
    """Return (price, sale_price, note) as they should be written to the feed."""
    price = Decimal(str(price))
    if compare_at in (None, "", "0", "0.00"):
        return price, None, "no compare-at"
    compare_at = Decimal(str(compare_at))
    if compare_at <= 0:
        return price, None, "compare-at is zero"
    if compare_at == price:
        return price, None, "compare-at equals price, not a sale"
    if compare_at < price:
        return price, None, "compare-at below price, stale data"
    return compare_at, price, "sale"


# Every case below is a real variant read from live Shopify on 2026-09-07 via the
# Admin API, so the table is evidence, not invented fixtures.
LIVE_CASES = [
    # sku,                 price,      compare_at,  expect_price, expect_sale
    ("PP-My5",             "4796.00",  "5995.00",   "5995.00",    "4796.00"),
    ("FF-WMRFT11",         "2899.00",  "3799.00",   "3799.00",    "2899.00"),
    ("FF-RCHD5-100",       "3329.10",  "4329.00",   "4329.00",    "3329.10"),
    ("FF-MSS-48-3T",        "218.00",   "729.00",    "729.00",     "218.00"),
    ("ST-8RDE-16-ATSC",   "10999.00", "12799.00",  "12799.00",   "10999.00"),
    # compare-at == price: Dynamic Cold Therapy carries three of these.
    ("DCT-IR-040",          "899.00",   "899.00",    "899.00",     None),
    ("DCT-SV-08DO3",       "3499.00",  "3499.00",   "3499.00",     None),
    ("DCT-SV-10DO3",       "3699.00",  "3699.00",   "3699.00",     None),
    # compare-at 0.00 written into the field.
    ("FF-VAIL-SAC",        "2999.00",     "0.00",   "2999.00",     None),
    # No compare-at at all - the overwhelming majority of the catalogue.
    ("FF-RIT24-Middle",      "16.00",       None,     "16.00",     None),
]


def check_rules():
    failures = []
    for sku, price, compare_at, want_price, want_sale in LIVE_CASES:
        got_price, got_sale, note = resolve(price, compare_at)
        if f"{got_price:.2f}" != want_price:
            failures.append(f"{sku}: price {got_price} != {want_price} ({note})")
        got_sale_s = f"{got_sale:.2f}" if got_sale is not None else None
        if got_sale_s != want_sale:
            failures.append(f"{sku}: sale_price {got_sale_s} != {want_sale} ({note})")
    return failures


def check_feed(path):
    failures = []
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        columns = set(reader.fieldnames or [])
        for tax in TAX_COLUMNS & columns:
            failures.append(f"tax column still present: {tax!r}")
        for line, row in enumerate(reader, start=2):
            offer = row.get("id", f"line {line}")
            price, sale = (row.get("price") or "").strip(), (row.get("sale_price") or "").strip()
            if not MONEY.match(price):
                failures.append(f"{offer}: price {price!r} is not '<amount> USD'")
                continue
            if not sale:
                continue
            if not MONEY.match(sale):
                failures.append(f"{offer}: sale_price {sale!r} is not '<amount> USD'")
                continue
            if Decimal(sale.split()[0]) >= Decimal(price.split()[0]):
                failures.append(f"{offer}: sale_price {sale} is not below price {price}")
    return failures


def main():
    failures = check_rules()
    scope = "rule table"
    if len(sys.argv) > 1:
        failures += check_feed(sys.argv[1])
        scope = f"rule table + {sys.argv[1]}"
    if failures:
        print(f"FAIL ({len(failures)}) - {scope}")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"PASS - {scope}; {len(LIVE_CASES)} live price cases, tax columns absent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
