#!/usr/bin/env python3
"""Add the approved hero-SKU title column to the live v2 supplemental, producing v3.

Context (Tim, 2026-09-06 coordination warning): the GMC supplemental source now
hosts supplemental_priority_labels_v2.csv, which carries BOTH custom_label_3
(priority tiers) and custom_label_4 (series). The Ads account is restructured on
those labels, so re-uploading any older labels-only file to that source wipes the
series values and takes the Product Lines asset groups dark.

So the titles are ADDED to v2, never applied to the earlier file. This script does
that mechanically instead of by hand, and refuses to write anything if the input
is not the v2 file or if any approved offer id is missing.

Usage:
    python3 scripts/build_supplemental_v3.py <downloaded_v2.csv> [-o out.csv]

Default output: supplemental_priority_labels_v3.csv next to the input.
"""
import argparse
import csv
import pathlib
import sys

TABLE = pathlib.Path(__file__).resolve().parent.parent / "feeds" / "hero-title-overrides.csv"

REQUIRED_V2_COLUMNS = ("custom_label_3", "custom_label_4")


def load_overrides() -> list[dict[str, str]]:
    return list(csv.DictReader(TABLE.open(encoding="utf-8")))


def candidate_keys(row: dict[str, str]) -> list[tuple[str, str]]:
    """Every id form the primary feed could plausibly be using for this offer.

    The feed has been keyed on the bare SKU (current, per the 2026-09 exports)
    and on the numeric Shopify product ID (the April supplementals were built
    that way). Both are checked rather than assumed, so the file's own ids win.
    """
    pid, vid = row["shopify_product_id"], row["shopify_variant_id"]
    return [
        ("sku", row["sku"]),
        ("product_id", pid),
        ("product-variant", f"{pid}-{vid}"),
        ("variant_id", vid),
    ]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", type=pathlib.Path, help="the v2 CSV downloaded from the GMC source")
    ap.add_argument("-o", "--out", type=pathlib.Path, default=None)
    args = ap.parse_args()

    overrides = load_overrides()
    out_path = args.out or args.source.with_name("supplemental_priority_labels_v3.csv")

    with args.source.open(newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    problems = []

    if "id" not in fieldnames:
        problems.append("input has no 'id' column - this is not a Merchant Center supplemental")

    # Guard against someone downloading the older labels-only file by mistake.
    missing_v2 = [c for c in REQUIRED_V2_COLUMNS if c not in fieldnames]
    if missing_v2:
        problems.append(
            "input is missing " + ", ".join(missing_v2)
            + " - this is NOT supplemental_priority_labels_v2.csv. Uploading a file built "
              "from it would wipe the series labels and take the Product Lines asset groups dark."
        )

    if problems:
        for p in problems:
            print(f"REFUSING TO WRITE: {p}", file=sys.stderr)
        return 2

    # Resolve each approved SKU to whichever id form this file actually uses.
    ids_in_file = {r["id"] for r in rows}
    resolved: dict[str, str] = {}
    schemes: dict[str, str] = {}
    unmatched = []
    ambiguous = []

    for row in overrides:
        hits = [(name, key) for name, key in candidate_keys(row) if key in ids_in_file]
        if not hits:
            unmatched.append(row["sku"])
        elif len(hits) > 1:
            ambiguous.append(f"{row['sku']} matches {', '.join(k for _, k in hits)}")
        else:
            name, key = hits[0]
            resolved[key] = row["title"]
            schemes[row["sku"]] = name

    if unmatched or ambiguous:
        # Tim's rule: if any id errors, stop and reply - do not improvise ids.
        if unmatched:
            print(
                "REFUSING TO WRITE: no id in the supplemental matches these approved SKUs "
                "under any known scheme (SKU, product ID, product-variant, variant ID): "
                + ", ".join(unmatched),
                file=sys.stderr,
            )
        for a in ambiguous:
            print(f"REFUSING TO WRITE: ambiguous id match - {a}", file=sys.stderr)
        print("Stop and reply to Tim rather than inventing ids or adding new rows.", file=sys.stderr)
        return 3

    distinct = sorted(set(schemes.values()))
    if len(distinct) > 1:
        print(
            "REFUSING TO WRITE: the ten offers resolve under mixed id schemes ("
            + "; ".join(f"{s}={sorted(k for k, v in schemes.items() if v == s)}" for s in distinct)
            + "). That is unexpected for ten single-variant products - stop and reply to Tim.",
            file=sys.stderr,
        )
        return 5

    if "title" not in fieldnames:
        fieldnames.append("title")

    applied = 0
    for row in rows:
        # Empty title = untouched in a supplemental feed. Every non-hero row stays empty.
        title = resolved.get(row["id"], "")
        row["title"] = title
        if title:
            applied += 1

    if applied != len(resolved):
        print(f"REFUSING TO WRITE: applied {applied} titles, expected {len(overrides)}", file=sys.stderr)
        return 4

    with out_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(rows)

    labelled_3 = sum(1 for r in rows if r.get("custom_label_3"))
    labelled_4 = sum(1 for r in rows if r.get("custom_label_4"))

    print(f"Wrote {out_path}")
    print(f"  rows            {len(rows)}  (unchanged from input)")
    print(f"  columns         {', '.join(fieldnames)}")
    print(f"  titles set      {applied} (all other title cells empty = untouched)")
    print(f"  id scheme       {distinct[0]} - matched against the file's own ids, not assumed")
    print(f"  custom_label_3  {labelled_3} rows still populated")
    print(f"  custom_label_4  {labelled_4} rows still populated")
    print("\nUpload this file via the Update button on the existing supplemental source.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
