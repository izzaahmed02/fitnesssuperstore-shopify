#!/usr/bin/env python3
"""The no-tier list, sorted by price descending.

Tim, 2026-09-09: "Send me the full no-tier list sorted by price descending, and I
will assign tiers to the high-value gap - starting with both $16,498 jungle gyms -
in the same re-issue."

A generated row with no `custom_label_3` sits outside every label-targeted asset
group on the Ads side, so it cannot be bid on by tier. This report is the input to
Tim's next lookup re-issue; it does not change any feed.

    python3 scripts/no_tier_report.py \\
        build/feeds/googleshoppingfrenchfitness.csv \\
        build/feeds/googleshoppingfs.csv \\
        --out build/feeds/no_tier_by_price.csv

The generated row's own `custom_label_3` is the ground truth for whether a row
ships with a tier, so that is what decides membership. The lookup is then consulted
only to explain WHY the tier is missing - no lookup row at all, or a lookup row with
a blank tier - which is the difference between Tim adding a SKU and Tim filling one
in. Resolution for that diagnosis matches the generator: SKU first, then the emitted
offer id, then the bare product id.
"""
import argparse
import collections
import csv
import pathlib
import sys
from decimal import Decimal, InvalidOperation

ROOT = pathlib.Path(__file__).resolve().parent.parent
LABEL_LOOKUP = ROOT / "feeds" / "supplemental_priority_labels_v2.csv"


def money(raw):
    if not raw:
        return None
    try:
        return Decimal(str(raw).replace("USD", "").strip())
    except (InvalidOperation, ValueError):
        return None


def sniff_read(path):
    p = pathlib.Path(path)
    with p.open(encoding="utf-8-sig", newline="") as fh:
        head = fh.readline()
        fh.seek(0)
        delimiter = "\t" if head.count("\t") > head.count(",") else ","
        return list(csv.DictReader(fh, delimiter=delimiter))


def load_lookup():
    tiers = {}
    for row in sniff_read(LABEL_LOOKUP):
        key = (row.get("id") or "").strip()
        if key:
            tiers[key] = (row.get("custom_label_3") or "").strip()
    return tiers


def diagnose(tiers, sku, offer_id):
    """Why does this row have no tier? SKU first, then the emitted offer id, then
    the bare product id - the generator's own resolution order."""
    for key in (sku, offer_id, offer_id.split("-", 1)[0] if "-" in offer_id else None):
        if key and key in tiers:
            if tiers[key]:
                return f"lookup row {key} has tier {tiers[key]} but the feed row does not carry it"
            return f"lookup row {key} exists with a blank custom_label_3"
    return "no lookup row for this SKU or id"


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("feeds", nargs="+", help="generated feed CSVs")
    parser.add_argument("--out", help="write the list here")
    args = parser.parse_args()

    tiers = load_lookup()
    rows, total, by_feed = [], 0, collections.Counter()

    for path in args.feeds:
        feed = pathlib.Path(path).stem
        for row in sniff_read(path):
            offer = (row.get("id") or "").strip()
            if not offer:
                continue
            total += 1
            sku = (row.get("old_id") or "").strip()
            if (row.get("custom_label_3") or "").strip():
                continue
            by_feed[feed] += 1
            rows.append({
                "price": money(row.get("price")) or Decimal(0),
                "feed": feed,
                "id": offer,
                "sku": sku,
                "title": (row.get("title") or "").strip(),
                "series": (row.get("custom_label_4") or "").strip(),
                "why": diagnose(tiers, sku, offer),
            })

    rows.sort(key=lambda r: (-r["price"], r["sku"]))

    print(f"{total} generated rows, {len(rows)} with no custom_label_3")
    for feed, n in sorted(by_feed.items()):
        print(f"  {n:>6}  {feed}")
    if rows:
        print("\nwhy the tier is missing")
        for why, n in collections.Counter(r["why"].split(" ")[0] + " " + r["why"].split(" ")[1]
                                          for r in rows).most_common():
            print(f"  {n:>6}  {why}...")
    if rows:
        print(f"\ntop 20 by price:")
        for r in rows[:20]:
            print(f"  ${r['price']:>12,.2f}  {r['feed'][:28]:<28} {r['sku'][:22]:<22} {r['title'][:52]}")

    if args.out:
        out = pathlib.Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["price_usd", "feed", "id", "sku", "title",
                             "custom_label_4", "custom_label_3", "why_missing"])
            for r in rows:
                writer.writerow([f"{r['price']:.2f}", r["feed"], r["id"], r["sku"], r["title"],
                                 r["series"], "", r["why"]])
        print(f"\nwrote {out}  (custom_label_3 left blank for Tim to fill)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
