#!/usr/bin/env python3
"""Hard membership gate on the generated feeds: what must be absent, and what must be present.

Tim, 2026-10-02, Phase 2 thread:

  * "add the hard validation so the run fails if ANY of the full 28 excluded products
    appears in generated output" -> feeds/must-exclude.csv
  * "Proof that all three approved hex sets are present in the generated French Fitness
    output" -> the required rows of feeds/catalog-additions.csv

This does not replace the rules that do the excluding (the Other Machine Attachments
collection rule and the SKU blocklist in feeds/feed-rules.json). It is the check that
fails loudly if one of those rules ever stops working.

A row matches a must-exclude entry on its SKU (old_id or mpn) or on its offer id, where
the offer id may be the SKU, the bare product id, or a <product>-<variant> composite.

    python3 scripts/check_feed_membership.py \\
        --feed googleshoppingfrenchfitness=build/feeds/googleshoppingfrenchfitness.csv \\
        --feed googleshoppingfs=build/feeds/googleshoppingfs.csv

Reads only. Exit 1 on any must-exclude hit or any missing required roster SKU.
"""
import argparse
import csv
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MUST_EXCLUDE = ROOT / "feeds" / "must-exclude.csv"
ROSTER = ROOT / "feeds" / "catalog-additions.csv"


def read_commented_csv(path):
    path = pathlib.Path(path)
    if not path.exists():
        raise SystemExit(f"missing {path}")
    lines = [l for l in path.read_text(encoding="utf-8-sig").splitlines()
             if l.strip() and not l.lstrip().startswith("#")]
    return [r for r in csv.DictReader(lines) if (r.get("sku") or "").strip()]


def read_feed(path):
    path = pathlib.Path(path)
    with path.open(encoding="utf-8-sig", newline="") as fh:
        head = fh.readline()
        fh.seek(0)
        delimiter = "\t" if head.count("\t") > head.count(",") else ","
        return list(csv.DictReader(fh, delimiter=delimiter))


def row_keys(row):
    """Every identifier a row can be matched on."""
    keys = set()
    for field in ("old_id", "mpn", "id"):
        value = (row.get(field) or "").strip()
        if value:
            keys.add(value)
    offer = (row.get("id") or "").strip()
    if "-" in offer and offer.split("-", 1)[0].isdigit():
        keys.add(offer.split("-", 1)[0])
    return keys


def check(feeds, must_exclude, roster):
    failures, notes = [], []
    keys_by_feed = {name: [row_keys(r) for r in rows] for name, rows in feeds.items()}

    leaked = 0
    for entry in must_exclude:
        sku = entry["sku"].strip()
        pid = (entry.get("product_id") or "").strip()
        hits = [name for name, rows in keys_by_feed.items()
                if any(sku in k or (pid and pid in k) for k in rows)]
        if hits:
            leaked += 1
            failures.append(f"{sku} ({entry.get('reason', '').strip()}) is in {', '.join(hits)}")
    if not leaked:
        notes.append(f"absent: all {len(must_exclude)} must-exclude products are absent from "
                     f"{', '.join(sorted(feeds))}")

    present = []
    for row in roster:
        if (row.get("required") or "").strip().lower() not in ("yes", "true", "1"):
            continue
        sku = row["sku"].strip()
        feed = (row.get("feed") or "").strip()
        targets = [feed] if feed in keys_by_feed else list(keys_by_feed)
        if any(sku in k for name in targets for k in keys_by_feed[name]):
            present.append(sku)
        else:
            failures.append(f"required roster SKU {sku} is missing from {feed or 'every feed'}")
    if present:
        notes.append(f"present: {', '.join(present)}")
    return failures, notes


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--feed", action="append", required=True, metavar="NAME=PATH",
                        help="a generated feed; repeat for each")
    parser.add_argument("--must-exclude", default=str(MUST_EXCLUDE))
    parser.add_argument("--roster", default=str(ROSTER))
    args = parser.parse_args()

    feeds = {}
    for raw in args.feed:
        name, _, path = raw.partition("=")
        if not path:
            raise SystemExit(f"--feed wants NAME=PATH, got {raw!r}")
        feeds[name.strip()] = read_feed(path.strip())

    failures, notes = check(feeds, read_commented_csv(args.must_exclude),
                            read_commented_csv(args.roster))
    for note in notes:
        print(f"  {note}")
    if failures:
        print(f"\nFAIL ({len(failures)}) - feed membership does not match Tim's rulings")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\nPASS - every must-exclude product absent, every required roster SKU present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
