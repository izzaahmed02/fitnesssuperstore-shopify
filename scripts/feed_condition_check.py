#!/usr/bin/env python3
"""QA the `condition` column of a Multifeeds primary feed export.

Usage:
    python3 scripts/feed_condition_check.py <feed.tsv> [<feed.tsv> ...] \
        [--expected docs/google-feed-condition-expected.csv --feed googleshoppingfs]

Per Tim's Sept 9 direction the condition column must contain **exactly**
lowercase `new` or lowercase `refurbished` and nothing else: no blanks, no
padding, no other value. This script asserts that and prints the row counts of
each value, which is the number Tim asked for.

Two levels of checking:

1. Without `--expected` it is a shape check. It proves only that every value is
   one of the two allowed strings. It does NOT prove the values are on the right
   rows - a feed that emitted `new` on all 2,505 rows would pass.

2. With `--expected` it is a correctness check. Every row is joined against the
   expectation derived from live Shopify (`custom.condition_state`, the only
   condition source in the catalogue) and the value has to match that row's
   expected condition. Rows in the feed with no expectation, and expected rows
   missing from the feed, are both reported.

`--expected` is the check that matters. Run it that way unless the expectation
file cannot be refreshed; see docs/google-feed-condition.md for how it is
regenerated.

The join key is `(item_group_id, old_id)` and falls back to `(id,)` when a feed
carries neither. `old_id` alone is not unique: five hex-dumbbell SKUs also exist
as standalone Set products in googleshoppingfrenchfitness - the same reason
scripts/feed_offer_id_diff.py joins on the pair.

Exit status is 0 only when every file passes every check.
"""

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

ALLOWED = ("new", "refurbished")


def read_rows(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="\t")
        rows = list(reader)
    if not rows:
        raise SystemExit(f"{path}: no data rows")
    if "condition" not in reader.fieldnames:
        raise SystemExit(
            f"{path}: no `condition` column; columns are {reader.fieldnames}"
        )
    return reader.fieldnames, rows


def row_key(row, fieldnames):
    """The join key for a row.

    The Google primaries carry `item_group_id` and `old_id`, and the pair is the
    only unique key: `old_id` alone is not, because five hex-dumbbell SKUs also
    exist as standalone Set products in googleshoppingfrenchfitness.

    The Bing primaries carry neither (`item_group_id` is present but empty, and
    there is no `old_id`), so they fall back to `id`, which on those feeds is the
    variant SKU. See `sku_index` for how that is resolved.
    """
    if "item_group_id" in fieldnames and "old_id" in fieldnames:
        return (row["item_group_id"].strip(), row["old_id"].strip())
    return (row.get("id", "").strip(),)


def sku_index(expected):
    """sku -> expected condition, for feeds that can only be joined on the SKU.

    A SKU that appears on more than one product is kept only when every
    expectation for it agrees; where they disagree the SKU is dropped, so an
    ambiguous row is reported as unexpected rather than silently checked against
    the wrong product.
    """
    by_sku = {}
    for (_product, sku), want in expected.items():
        by_sku.setdefault(sku, set()).add(want)
    return {sku: wants.pop() for sku, wants in by_sku.items() if len(wants) == 1}


def classify(value):
    """Why a condition value is not acceptable, in Tim's own categories."""
    if value == "":
        return "blank"
    if value.strip() == "":
        return "whitespace only"
    if value != value.strip():
        inner = value.strip()
        if inner in ALLOWED:
            return f"padded, trimmed value valid ({inner!r})"
        if inner.lower() in ALLOWED:
            return f"padded and wrong case ({inner!r})"
        return f"padded and unmapped ({inner!r})"
    if value.lower() in ALLOWED:
        return f"wrong case ({value!r})"
    return f"unmapped value ({value!r})"


def load_expected(path, feed):
    """(item_group_id, sku) -> expected condition, from the Shopify-derived CSV.

    The file covers every feed, so a single feed has to be selected: checking one
    export against all feeds' expectations reports the other feed's rows as
    missing. `feed` may be omitted only when the file covers exactly one feed.
    """
    with Path(path).open(encoding="utf-8-sig", newline="") as handle:
        all_rows = list(csv.DictReader(handle))
    if not all_rows:
        raise SystemExit(f"{path}: no expectation rows")

    feeds = sorted({r["feed"].strip() for r in all_rows})
    if feed is None:
        if len(feeds) > 1:
            raise SystemExit(
                f"{path} covers {len(feeds)} feeds ({', '.join(feeds)}); "
                f"pass --feed to pick one"
            )
        feed = feeds[0]
    elif feed not in feeds:
        raise SystemExit(f"{path}: no rows for feed {feed!r}; it has {', '.join(feeds)}")

    expected = {}
    for row in all_rows:
        if row["feed"].strip() != feed:
            continue
        key = (row["product_id"].strip(), row["sku"].strip())
        if key in expected:
            raise SystemExit(f"{path}: duplicate expectation for {key}")
        expected[key] = row["expected_condition"].strip()
    print(f"expectation    {len(expected)} rows for {feed}\n")
    return expected


def check_file(path, expected):
    fieldnames, rows = read_rows(path)
    strong_key = "item_group_id" in fieldnames and "old_id" in fieldnames

    counts = Counter(r["condition"] for r in rows)
    bad = [r for r in rows if r["condition"] not in ALLOWED]

    print(f"=== {path}")
    print(f"rows            {len(rows)}")
    for value in ALLOWED:
        print(f"{value:<15} {counts.get(value, 0)}")
    other = sum(v for k, v in counts.items() if k not in ALLOWED)
    print(f"{'other':<15} {other}")

    failures = 0

    if bad:
        failures += 1
        print(f"\nFAIL  {len(bad)} rows are not exactly 'new' or 'refurbished':")
        for reason, n in Counter(classify(r["condition"]) for r in bad).most_common():
            print(f"  {n:5d}  {reason}")
        print("\n  row detail (id, key, raw value):")
        for row in bad:
            key = row_key(row, fieldnames)
            print(f"    {row.get('id', '?'):<40} {key}  {row['condition']!r}")

    if expected is None:
        print("\n  shape check only - pass --expected to verify the values are on")
        print("  the right rows. Two allowed values is not the same as correct.")
        return failures == 0

    by_sku = None if strong_key else sku_index(expected)
    if by_sku is not None:
        print(
            f"\n  no item_group_id/old_id pair in this export - joining on `id` as "
            f"the SKU ({len(by_sku)} of {len(expected)} expectations unambiguous)"
        )

    seen = set()
    mismatched = []
    unexpected = []
    for row in rows:
        key = row_key(row, fieldnames)
        seen.add(key)
        want = expected.get(key) if strong_key else by_sku.get(key[0])
        if want is None:
            unexpected.append(row)
            continue
        if row["condition"] != want:
            mismatched.append((row, want))

    if strong_key:
        missing = sorted(set(expected) - seen)
    else:
        found = {k[0] for k in seen}
        missing = sorted((sku,) for sku in by_sku if sku not in found)
        expected = {(sku,): want for sku, want in by_sku.items()}

    if mismatched:
        failures += 1
        print(f"\nFAIL  {len(mismatched)} rows carry the wrong condition for the row:")
        for row, want in mismatched:
            key = row_key(row, fieldnames)
            print(f"    {key}  got {row['condition']!r}  want {want!r}")
    if unexpected:
        failures += 1
        print(f"\nFAIL  {len(unexpected)} feed rows have no expectation:")
        for row in unexpected:
            print(f"    {row_key(row, fieldnames)}  {row['condition']!r}")
        print("  a row here means the feed cohort moved; refresh the expectation file")
    if missing:
        failures += 1
        print(f"\nFAIL  {len(missing)} expected rows are absent from the feed:")
        for key in missing:
            print(f"    {key}  want {expected[key]!r}")

    if failures == 0:
        print(f"\nPASS  every row matches its expected condition ({len(rows)} rows)")
    return failures == 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("feeds", nargs="+", help="primary feed exports (TSV)")
    parser.add_argument(
        "--expected",
        help="Shopify-derived expectation CSV "
        "(product_id, sku, condition_state, expected_condition, feed)",
    )
    parser.add_argument(
        "--feed",
        help="which feed's expectations to use, e.g. googleshoppingfs. Required "
        "when the expectation file covers more than one feed.",
    )
    args = parser.parse_args(argv)

    if args.feed and not args.expected:
        parser.error("--feed only means something with --expected")

    expected = load_expected(args.expected, args.feed) if args.expected else None

    ok = True
    for path in args.feeds:
        ok = check_file(path, expected) and ok
        print()
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
