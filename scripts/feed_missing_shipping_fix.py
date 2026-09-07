#!/usr/bin/env python3
"""Corrected-feed pass for the missing-shipping / duplicate-id fixes.

Applied to the primary feed exports as part of the feed repoint, not as a
separate upload. Three independent transforms plus one report:

1. Monster Universal Storage re-key. All 10 rows share the bare product id
   10269254254908. Re-keyed to 10269254254908-<variantID> per the composite
   rule. The variant id is read from the row's own `link` (`?variant=`) and
   cross-checked against `old_id` (the variant SKU), so the mapping is
   derived from the row, never inferred from price.

2. googleshoppingfs duplicate ids 9878900179260 and 9878898540860. Each id
   carries two rows: the standard offer and an open-box (`-OOB`) offer at a
   lower sale price. `--dedupe-mode drop-oob` keeps the standard row and drops
   the open-box one; `--dedupe-mode rekey-oob` keeps both by re-keying the
   open-box row composite-style. See docs/feed-missing-shipping-fix.md.

3. `shipping` region strings, for the ids that have an exact-SKU sibling
   already carrying shipping in the same feed. Copied verbatim from that
   sibling row. Nothing is interpolated: a row with no exact-SKU sibling is
   left blank and reported instead.

4. Worklist of every row still missing shipping after (3), for the rate-table
   owner to fill from the live freight tables.

Usage:
    python3 scripts/feed_missing_shipping_fix.py \
        --ff  googleshoppingfrenchfitness.tsv \
        --fs  googleshoppingfs.tsv \
        --out-dir out/
"""

import argparse
import csv
import os
import sys
from collections import Counter, defaultdict
from urllib.parse import parse_qs, urlparse

MONSTER_ID = "10269254254908"
FS_DUPLICATE_IDS = ("9878900179260", "9878898540860")
OOB_SKU_SUFFIX = "-OOB"


def read_feed(path):
    with open(path, newline="", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        return reader.fieldnames, list(reader)


def write_feed(path, fieldnames, rows):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, delimiter="\t",
                                extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def variant_id_from_link(link):
    """The variant id the row actually points at, or None."""
    if not link:
        return None
    values = parse_qs(urlparse(link).query).get("variant")
    return values[0] if values else None


def rekey_monster(rows, log):
    """Transform 1: bare Monster id -> composite id."""
    changed = 0
    for row in rows:
        if row.get("id") != MONSTER_ID:
            continue
        variant_id = variant_id_from_link(row.get("link"))
        if not variant_id:
            log.append(
                f"SKIP monster row sku={row.get('old_id')!r}: no ?variant= in link"
            )
            continue
        row["id"] = f"{MONSTER_ID}-{variant_id}"
        log.append(f"rekey {MONSTER_ID} -> {row['id']} (sku {row.get('old_id')})")
        changed += 1
    return changed


def resolve_fs_duplicates(rows, mode, log):
    """Transform 2: make FS_DUPLICATE_IDS unique."""
    by_id = defaultdict(list)
    for row in rows:
        if row.get("id") in FS_DUPLICATE_IDS:
            by_id[row["id"]].append(row)

    dropped = []
    for feed_id, group in by_id.items():
        if len(group) < 2:
            log.append(f"NOTE {feed_id}: only {len(group)} row, nothing to resolve")
            continue
        oob = [r for r in group if (r.get("old_id") or "").endswith(OOB_SKU_SUFFIX)]
        if len(oob) != len(group) - 1:
            log.append(
                f"SKIP {feed_id}: {len(group)} rows but {len(oob)} open-box — "
                "not the expected standard+open-box shape, resolve by hand"
            )
            continue
        for row in oob:
            if mode == "drop-oob":
                dropped.append(id(row))
                log.append(f"drop  {feed_id} open-box row (sku {row.get('old_id')})")
            else:
                variant_id = variant_id_from_link(row.get("link"))
                if not variant_id:
                    log.append(
                        f"SKIP {feed_id} open-box row (sku {row.get('old_id')}): "
                        "no ?variant= in link, cannot re-key"
                    )
                    continue
                row["id"] = f"{feed_id}-{variant_id}"
                log.append(
                    f"rekey {feed_id} -> {row['id']} (open-box, sku {row.get('old_id')})"
                )

    if not dropped:
        return rows, 0
    keep = [r for r in rows if id(r) not in set(dropped)]
    return keep, len(rows) - len(keep)


def sibling_shipping_index(rows):
    """SKU -> shipping string, for rows that already carry shipping.

    Only unambiguous SKUs are indexed: if two rows share a SKU with different
    shipping strings there is no single sibling to copy from.
    """
    by_sku = defaultdict(set)
    for row in rows:
        sku = (row.get("old_id") or "").strip()
        shipping = (row.get("shipping") or "").strip()
        if sku and shipping:
            by_sku[sku].add(shipping)
    return {sku: vals.pop() for sku, vals in by_sku.items() if len(vals) == 1}


def fill_from_siblings(rows, log):
    """Transform 3: copy shipping from the exact-SKU sibling, or leave blank."""
    index = sibling_shipping_index(rows)
    filled = 0
    for row in rows:
        if (row.get("shipping") or "").strip():
            continue
        sku = (row.get("old_id") or "").strip()
        shipping = index.get(sku)
        if not shipping:
            continue
        row["shipping"] = shipping
        log.append(f"fill  {row['id']} (sku {sku}) from exact-SKU sibling")
        filled += 1
    return filled


def worklist(feed_name, rows):
    """Transform 4: every row still missing shipping."""
    out = []
    for row in rows:
        if (row.get("shipping") or "").strip():
            continue
        out.append({
            "id": row.get("id", ""),
            "feed": feed_name,
            "sku": row.get("old_id", ""),
            "title": row.get("title", ""),
            "price": row.get("price", ""),
            "sale_price": row.get("sale_price", ""),
            "shipping_weight": row.get("shipping_weight", ""),
            "shipping_region_string_to_add": "",
        })
    return out


def duplicate_ids(rows):
    counts = Counter(row.get("id") for row in rows)
    return {i: n for i, n in counts.items() if n > 1}


def process(path, feed_name, out_dir, dedupe_mode, is_fs):
    fieldnames, rows = read_feed(path)
    log = []
    before_blank = sum(1 for r in rows if not (r.get("shipping") or "").strip())
    before_dupes = duplicate_ids(rows)

    monster = rekey_monster(rows, log)
    dropped = 0
    if is_fs:
        rows, dropped = resolve_fs_duplicates(rows, dedupe_mode, log)
    filled = fill_from_siblings(rows, log)

    out_path = os.path.join(out_dir, os.path.basename(path))
    write_feed(out_path, fieldnames, rows)

    remaining = worklist(feed_name, rows)
    after_dupes = duplicate_ids(rows)

    print(f"\n=== {feed_name} ({len(rows)} rows) -> {out_path}")
    print(f"  monster rows re-keyed        : {monster}")
    if is_fs:
        print(f"  duplicate rows dropped       : {dropped} (mode {dedupe_mode})")
    print(f"  shipping filled from sibling : {filled}")
    print(f"  blank shipping before/after  : {before_blank} -> {len(remaining)}")
    print(f"  duplicate ids before/after   : {len(before_dupes)} -> {len(after_dupes)}")
    if after_dupes:
        print(f"  REMAINING duplicate ids      : {sorted(after_dupes)}")
    for line in log:
        print(f"    {line}")
    return remaining


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--ff", required=True,
                        help="googleshoppingfrenchfitness export (TSV)")
    parser.add_argument("--fs", required=True,
                        help="googleshoppingfs export (TSV)")
    parser.add_argument("--out-dir", default="out",
                        help="where corrected feeds and the worklist are written")
    parser.add_argument("--dedupe-mode", choices=("drop-oob", "rekey-oob"),
                        default="drop-oob",
                        help="how to make the two googleshoppingfs duplicate ids unique")
    args = parser.parse_args(argv)

    os.makedirs(args.out_dir, exist_ok=True)
    remaining = []
    remaining += process(args.ff, "googleshoppingfrenchfitness", args.out_dir,
                         args.dedupe_mode, is_fs=False)
    remaining += process(args.fs, "googleshoppingfs", args.out_dir,
                         args.dedupe_mode, is_fs=True)

    worklist_path = os.path.join(args.out_dir, "missing_shipping_worklist.csv")
    with open(worklist_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[
            "id", "feed", "sku", "title", "price", "sale_price",
            "shipping_weight", "shipping_region_string_to_add",
        ])
        writer.writeheader()
        writer.writerows(remaining)

    print(f"\n=== worklist: {len(remaining)} rows still missing shipping "
          f"-> {worklist_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
