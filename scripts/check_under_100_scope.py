#!/usr/bin/env python3
"""QA gate for the p_under_100 campaign exception.

Tim's ruling of 2026-09-19 ("Phase 2 feed build" thread, OPTION A SCOPED):

  1. custom_label_0 = p_under_100 is assigned only to French Fitness in-stock rows
     priced $25.00-$99.99. Variants under $25.00 do not get the label.
  2. Rows carrying that label survive the $100 floor in the Phase 2 generator and
     emit with shipping. The floor holds absolute for everything else.

This gate exists because the exception is the only hole in a floor that otherwise
protects the feed from hundreds of sub-$100 rows: live Shopify carries 431 in-stock
French Fitness variants under $100 catalogue-wide (read 2026-09-19), against the 12
the ruling covers. A widened roster, a price drift below $25.00, or a label landing
on the FS feed all show up here rather than in Merchant Center.

    python3 scripts/check_under_100_scope.py
    python3 scripts/check_under_100_scope.py build/feeds/googleshoppingfrenchfitness.csv \
                                             build/feeds/googleshoppingfs.csv
"""
import csv
import pathlib
import sys
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parent.parent
ROSTER = ROOT / "feeds" / "under-100-campaign.csv"
LABEL = "p_under_100"
MIN = Decimal("25.00")
MAX = Decimal("99.99")
FF_FEED = "googleshoppingfrenchfitness"
FS_FEED = "googleshoppingfs"


def load_roster(path=ROSTER):
    with path.open(encoding="utf-8-sig") as fh:
        lines = [ln for ln in fh if not ln.lstrip().startswith("#")]
    return [r for r in csv.DictReader(lines) if (r.get("sku") or "").strip()]


# Read live from Shopify on 2026-09-19: product 10247596147004, the 17 in-stock
# variants under $100 that Tim's 2026-09-17 heads-up named, with the price each
# carried. Evidence, not invented fixtures. The 5 under $25.00 must stay out.
LIVE_UNDER_100 = [
    ("FF-RCHD2-5", "4.50"), ("FF-RCHD5", "9.90"), ("FF-RCHD7-5", "14.40"),
    ("FF-RCHD10", "18.90"), ("FF-RCHD12-5", "23.40"),
    ("FF-RCHD15", "28.80"), ("FF-RCHD17-5", "32.40"), ("FF-RCHD20", "37.80"),
    ("FF-RCHD22-5", "42.30"), ("FF-RCHD25", "46.80"), ("FF-RCHD27-5", "51.30"),
    ("FF-RCHD30", "56.70"), ("FF-RCHD35", "65.70"), ("FF-RCHD40", "75.60"),
    ("FF-RCHD45", "84.60"), ("FF-RCHD50", "93.60"), ("FF-RCHD55", "98.10"),
]


def check_roster(roster):
    failures = []
    skus = [r["sku"].strip() for r in roster]
    for dup in {s for s in skus if skus.count(s) > 1}:
        failures.append(f"{dup}: listed twice in the roster")
    for row in roster:
        sku, price = row["sku"].strip(), Decimal(row["price_2026_09_19"])
        if not (MIN <= price <= MAX):
            failures.append(f"{sku}: {price} is outside ${MIN}-${MAX}")
        if (row.get("custom_label_0") or "").strip() != LABEL:
            failures.append(f"{sku}: custom_label_0 is not {LABEL!r}")

    want = {sku for sku, price in LIVE_UNDER_100 if MIN <= Decimal(price) <= MAX}
    got = set(skus)
    for sku in sorted(want - got):
        failures.append(f"{sku}: qualifies on the 2026-09-19 live read but is not rostered")
    for sku in sorted(got - want):
        failures.append(f"{sku}: rostered but not in the scoped under-$100 set")
    return failures


def check_feed(path, roster):
    """Every p_under_100 row must be rostered, in band, and carry a shipping rate."""
    failures = []
    rostered = {r["sku"].strip() for r in roster}
    name = pathlib.Path(path).stem
    seen = set()
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            if (row.get("custom_label_0") or "").strip() != LABEL:
                continue
            offer, sku = row.get("id", ""), (row.get("old_id") or "").strip()
            seen.add(sku)
            if name == FS_FEED:
                failures.append(f"{offer}: {LABEL} on {name}; the ruling is French Fitness only")
            if sku not in rostered:
                failures.append(f"{offer} ({sku}): labelled {LABEL} but not in the roster")
            # The band is what the customer pays. In the feed that is sale_price
            # when a compare-at applies - `price` carries the regular figure, and
            # for three of these rows it is over $100 (FF-RCHD45 109.00, FF-RCHD50
            # and FF-RCHD55 129.00) while the selling price is not.
            paid = (row.get("sale_price") or "").strip() or (row.get("price") or "").strip()
            price = Decimal((paid or "0 USD").split()[0])
            if not (MIN <= price <= MAX):
                failures.append(f"{offer} ({sku}): selling price {price} is outside "
                                f"${MIN}-${MAX}")
            if (row.get("availability") or "").strip() != "in stock":
                failures.append(f"{offer} ({sku}): labelled {LABEL} but not in stock")
            if not (row.get("shipping") or "").strip():
                failures.append(f"{offer} ({sku}): no shipping rate; the ruling is emit WITH "
                                "shipping, so feed Monday's handback via --shipping-lookup")
    if name == FF_FEED:
        for sku in sorted(rostered - seen):
            failures.append(f"{sku}: rostered but carries no {LABEL} row in {name}")
    return failures


def main():
    roster = load_roster()
    failures = check_roster(roster)
    scope = f"roster ({len(roster)} SKUs)"
    for path in sys.argv[1:]:
        failures += check_feed(path, roster)
        scope += f" + {path}"
    if failures:
        print(f"FAIL ({len(failures)}) - {scope}")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"PASS - {scope}; {len(LIVE_UNDER_100)} live under-$100 cases, "
          f"{len(LIVE_UNDER_100) - len(roster)} correctly held out below ${MIN}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
