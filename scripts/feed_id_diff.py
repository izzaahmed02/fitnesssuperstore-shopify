#!/usr/bin/env python3
"""Offer-id diff between the live primary export and a generated feed.

This is the cutover gate from the rebuild handoff: id diff report to Tim ->
repoint the existing feed registrations -> 48h Needs-attention watch -> only then
the woolytech pause. Nothing is repointed until this report is read, because an
id that changes shape processes as a brand new offer and drops its performance
history, which is exactly what happened in January when the identifier moved from
product code to a numeric value.

It also answers spec delta 4 from the other direction: run it against the current
export and the ADDED list is the set of SKUs the live feeds do not carry.

    python3 scripts/feed_id_diff.py \\
        --old googleshoppingfrenchfitness.csv \\
        --new build/feeds/googleshoppingfrenchfitness.csv \\
        --out build/feeds/id_diff_ff.csv

Exit 1 if any offer is dropped, because a dropped offer is a live ad going dark.
"""
import argparse
import csv
import pathlib
import sys


def read_offers(path):
    """id -> sku, tolerant of either id scheme. `old_id` carries the variant SKU
    in both live exports."""
    offers = {}
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            offer = (row.get("id") or "").strip()
            if offer:
                offers[offer] = (row.get("old_id") or "").strip()
    return offers


def scheme_of(offer_id):
    if "-" in offer_id and all(part.isdigit() for part in offer_id.split("-", 1)):
        return "composite"
    if offer_id.isdigit():
        return "product_id"
    return "sku"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--old", required=True, help="the live Merchant Center export")
    parser.add_argument("--new", required=True, help="the generated feed")
    parser.add_argument("--out", help="write the full diff here as CSV")
    args = parser.parse_args()

    old, new = read_offers(args.old), read_offers(args.new)
    dropped = sorted(set(old) - set(new))
    added = sorted(set(new) - set(old))
    kept = sorted(set(old) & set(new))

    # A SKU can survive a change of id scheme. Those are re-keys, not real
    # drops, and they are the rows that lose their history if repointed blind.
    old_by_sku = {sku: oid for oid, sku in old.items() if sku}
    new_by_sku = {sku: oid for oid, sku in new.items() if sku}
    rekeyed = sorted(
        (old_by_sku[sku], new_by_sku[sku], sku)
        for sku in set(old_by_sku) & set(new_by_sku)
        if old_by_sku[sku] != new_by_sku[sku]
    )
    rekeyed_old = {r[0] for r in rekeyed}
    rekeyed_new = {r[1] for r in rekeyed}
    real_dropped = [o for o in dropped if o not in rekeyed_old]
    real_added = [o for o in added if o not in rekeyed_new]

    print(f"old {args.old}: {len(old)} offers")
    print(f"new {args.new}: {len(new)} offers")
    print(f"  unchanged ids   {len(kept)}")
    print(f"  re-keyed        {len(rekeyed)}  (same SKU, new id - these lose history if repointed blind)")
    print(f"  added           {len(real_added)}  (SKUs the live feed does not carry)")
    print(f"  dropped         {len(real_dropped)}")

    old_schemes = sorted({scheme_of(o) for o in old})
    new_schemes = sorted({scheme_of(o) for o in new})
    print(f"  id scheme old   {', '.join(old_schemes)}")
    print(f"  id scheme new   {', '.join(new_schemes)}")

    if args.out:
        out = pathlib.Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["change", "old_id", "new_id", "sku"])
            for oid, nid, sku in rekeyed:
                writer.writerow(["rekeyed", oid, nid, sku])
            for oid in real_dropped:
                writer.writerow(["dropped", oid, "", old[oid]])
            for nid in real_added:
                writer.writerow(["added", "", nid, new[nid]])
        print(f"\nwrote {out}")

    if real_dropped:
        print("\nDROPPED OFFERS - each one is a live ad going dark. Do not repoint:")
        for oid in real_dropped[:25]:
            print(f"  {oid}  {old[oid]}")
        if len(real_dropped) > 25:
            print(f"  ... and {len(real_dropped) - 25} more (see --out)")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
