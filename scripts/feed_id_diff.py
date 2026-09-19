#!/usr/bin/env python3
"""Reason-coded offer-id diff between the live primary export and a generated feed.

This is the cutover gate. Per Tim, 2026-09-09: "every add and every drop must
appear in the id diff with a reason code. No repoint until I have read that diff."

The sequence it gates is id diff to Tim -> repoint the existing feed registrations
-> 48h Needs-attention watch -> his GO on the woolytech pause. Nothing is repointed
until the report is read, because an id that changes shape processes as a brand new
offer and drops its performance history. That is what happened in January when the
identifier moved from product code to a numeric value.

    python3 scripts/feed_id_diff.py \\
        --old "googleshoppingfrenchfitness (3).tsv" \\
        --new build/feeds/googleshoppingfrenchfitness.csv \\
        --excluded build/feeds/excluded_rows.csv \\
        --out build/feeds/id_diff_ff.csv

Accepts CSV or TSV on either side; the delimiter is sniffed per file, so the
Merchant Center .tsv exports go in as they arrive.

Exit 1 if ANY row lands on `dropped:unexplained` or `added:unexplained`. Those are
the rows nobody has a reason for, and they are exactly what must be zero before a
repoint. A drop with a known reason code is a decision to review, not a blocker.
"""
import argparse
import collections
import csv
import pathlib
import sys
from decimal import Decimal, InvalidOperation

# Maps a line out of the generator's excluded_rows.csv onto a stable reason code,
# so the report reads the same way every week.
EXCLUSION_CODES = [
    ("price below", "dropped:below_price_floor"),
    ("out of stock", "dropped:out_of_stock"),
    ("ground shipping", "dropped:ground_shipping_over_1000"),
    ("other-brand new", "dropped:other_brand_new_floor"),
    ("not published", "dropped:not_published_online"),
    ("third party", "dropped:third_party_flag"),
    ("duplicate", "dropped:duplicate_sku"),
]


def sniff_read(path):
    """Read a feed export as CSV or TSV. Merchant Center hands out .tsv."""
    p = pathlib.Path(path)
    with p.open(encoding="utf-8-sig", newline="") as fh:
        head = fh.readline()
        fh.seek(0)
        delimiter = "\t" if head.count("\t") > head.count(",") else ","
        return list(csv.DictReader(fh, delimiter=delimiter))


def money(raw):
    """`4399 USD` / `4399.00 USD` / `4399.00` -> Decimal, or None."""
    if not raw:
        return None
    try:
        return Decimal(str(raw).replace("USD", "").strip())
    except (InvalidOperation, ValueError):
        return None


def index(rows):
    """offer id -> {sku, price, title}. `old_id` carries the variant SKU in both
    the live exports and the generated feeds."""
    out = {}
    for row in rows:
        offer = (row.get("id") or "").strip()
        if not offer:
            continue
        out[offer] = {
            "sku": (row.get("old_id") or "").strip(),
            "price": money(row.get("price")),
            "title": (row.get("title") or "").strip(),
        }
    return out


def scheme_of(offer_id):
    if "-" in offer_id and all(part.isdigit() for part in offer_id.split("-", 1)):
        return "composite"
    if offer_id.isdigit():
        return "product_id"
    return "sku"


def load_exclusions(path):
    """id/sku -> reason code, from the generator's excluded_rows.csv."""
    if not path:
        return {}
    reasons = {}
    for row in sniff_read(path):
        raw = (row.get("reason") or "").lower()
        code = "dropped:excluded_other"
        for needle, mapped in EXCLUSION_CODES:
            if needle in raw:
                code = mapped
                break
        for key in ((row.get("id") or "").strip(), (row.get("sku") or "").strip()):
            if key:
                reasons.setdefault(key, (code, (row.get("reason") or "").strip()))
    return reasons


def classify(old, new, exclusions):
    """Every id on either side gets exactly one row and one reason code."""
    old_by_sku = collections.defaultdict(list)
    for oid, rec in old.items():
        if rec["sku"]:
            old_by_sku[rec["sku"]].append(oid)
    new_by_sku = collections.defaultdict(list)
    for nid, rec in new.items():
        if rec["sku"]:
            new_by_sku[rec["sku"]].append(nid)

    # Product ids that survive into the new feed as composites. A sibling variant
    # appearing for the first time is an expansion, not an unexplained new offer.
    old_product_ids = {oid for oid in old if scheme_of(oid) == "product_id"}

    rows = []

    for nid in sorted(set(new) - set(old)):
        rec = new[nid]
        sku = rec["sku"]
        prior = [o for o in old_by_sku.get(sku, []) if o != nid]
        base = nid.split("-", 1)[0] if scheme_of(nid) == "composite" else None
        if prior:
            code = f"rekeyed:{scheme_of(prior[0])}_to_{scheme_of(nid)}"
            note = f"same SKU previously served as {', '.join(prior)}"
        elif base and base in old_product_ids:
            code, note = "added:variant_expansion", f"sibling variant of product {base}, previously unrepresentable"
        elif sku:
            code, note = "added:new_offer", "SKU not present in the live export"
        else:
            code, note = "added:unexplained", "new id with no SKU to trace"
        rows.append((code, "", nid, sku, rec["price"], rec["title"], note))

    for oid in sorted(set(old) - set(new)):
        rec = old[oid]
        sku = rec["sku"]
        successors = [n for n in new_by_sku.get(sku, []) if n != oid]
        if successors:
            if any(n not in old for n in successors):
                continue  # already reported as a rekey from the new side
            # The SKU still ships, under an id that ALSO existed in the old export.
            # That is the one-row-per-SKU rule collapsing a catalogue duplicate -
            # the 198 SKUs carried by both the combined parent and a legacy
            # standalone product. Tim needs every one of these coded, not skipped.
            rows.append(("dropped:duplicate_sku", oid, "", sku, rec["price"], rec["title"],
                         f"SKU also served by {', '.join(successors)}; one row per SKU, "
                         "serving legacy row wins while the combined-listing HOLD is in force"))
            continue
        hit = exclusions.get(oid) or exclusions.get(sku)
        if hit:
            code, note = hit
        else:
            code, note = "dropped:unexplained", "no exclusion logged and the SKU is absent from the new feed"
        rows.append((code, oid, "", sku, rec["price"], rec["title"], note))

    for oid in sorted(set(old) & set(new)):
        o, n = old[oid], new[oid]
        if o["price"] is not None and n["price"] is not None and o["price"] != n["price"]:
            direction = "up" if n["price"] > o["price"] else "down"
            rows.append(("price_changed", oid, oid, n["sku"], n["price"], n["title"],
                         f"{o['price']} -> {n['price']} ({direction}); live Shopify variant price wins"))
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--old", required=True, help="the live Merchant Center export (.csv or .tsv)")
    parser.add_argument("--new", required=True, help="the generated feed")
    parser.add_argument("--excluded", help="the generator's excluded_rows.csv, which supplies drop reasons")
    parser.add_argument("--out", help="write the full reason-coded diff here")
    args = parser.parse_args()

    old, new = index(sniff_read(args.old)), index(sniff_read(args.new))
    exclusions = load_exclusions(args.excluded)
    rows = classify(old, new, exclusions)
    counts = collections.Counter(r[0] for r in rows)

    print(f"old  {args.old}: {len(old)} offers")
    print(f"new  {args.new}: {len(new)} offers")
    print(f"     net {len(new) - len(old):+d}")
    print(f"     id scheme old  {', '.join(sorted({scheme_of(o) for o in old}))}")
    print(f"     id scheme new  {', '.join(sorted({scheme_of(o) for o in new}))}")
    print("\nreason codes")
    for code, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {n:>6}  {code}")
    if not rows:
        print("  (no changes)")

    if args.out:
        out = pathlib.Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        with out.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(["reason_code", "old_id", "new_id", "sku", "price", "title", "detail"])
            for code, oid, nid, sku, price, title, note in sorted(
                    rows, key=lambda r: (r[0], r[3], r[1], r[2])):
                writer.writerow([code, oid, nid, sku, "" if price is None else f"{price}", title, note])
        print(f"\nwrote {out}")

    unexplained = [r for r in rows if r[0].endswith("unexplained")]
    if unexplained:
        print(f"\n{len(unexplained)} UNEXPLAINED rows. These must be zero before the repoint:")
        for code, oid, nid, sku, price, title, note in unexplained[:25]:
            print(f"  {code}  {oid or nid}  {sku}  {title[:60]}")
        if len(unexplained) > 25:
            print(f"  ... and {len(unexplained) - 25} more (see --out)")
        return 1
    print("\nEvery add and every drop carries a reason code.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
