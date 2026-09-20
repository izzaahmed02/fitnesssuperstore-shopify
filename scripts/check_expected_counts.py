#!/usr/bin/env python3
"""Matched-vs-designed count guard for the Phase 2 generator outputs.

Tim, 2026-09-20: "The automated local feed just served 46 offers short for two
weeks, silently, because nothing compared Merchant Center's matched count against
the designed count. Every generator output gets an expected-count check that fails
the publish loudly instead of shipping short."

Three comparisons, each catching a different way a feed goes short:

  1. READ completeness   Shopify's productsCount for the generator's own filter
                         against the number of products the page loop returned.
                         This is the 250-item pagination clamp class of bug, and
                         the generator already refuses to build when it fails.
  2. DESIGNED vs EXPECTED  the row counts in the run manifest against the bands in
                         feeds/expected-counts.json, plus the exact roster counts.
                         Catches a rule change or a lookup slip that quietly drops
                         a few hundred rows.
  3. MATCHED vs DESIGNED   Merchant Center's matched count against what the run
                         designed. The generator has no Merchant Center access, so
                         the matched figure is supplied here, from the source page
                         after a fetch. Zero tolerance: matched must equal designed.

    python3 scripts/check_expected_counts.py
    python3 scripts/check_expected_counts.py \
        --matched googleshoppingfrenchfitness=970 --matched googleshoppingfs=1537

Reads only. Publishes nothing.
"""
import argparse
import csv
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXPECTED = ROOT / "feeds" / "expected-counts.json"
DEFAULT_MANIFEST = ROOT / "build" / "feeds" / "run_manifest.json"
# Tim, 2026-09-20 item 4: "Counts prove quantity; the roster proves identity."
# Empty until Izza posts the 31 SKUs; the guard reports which mode it is in.
CATALOG_ADDITIONS = ROOT / "feeds" / "catalog-additions.csv"


def load_json(path, what):
    path = pathlib.Path(path)
    if not path.exists():
        raise SystemExit(f"no {what} at {path}. Run the generator first.")
    return json.loads(path.read_text(encoding="utf-8"))


def count_reason_codes(path):
    """{reason_code: n} from an id diff written by scripts/feed_id_diff.py."""
    path = pathlib.Path(path)
    if not path.exists():
        raise SystemExit(f"no id diff at {path}")
    counts = {}
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            code = (row.get("reason_code") or "").strip()
            if code:
                counts[code] = counts.get(code, 0) + 1
    return counts


def new_offer_skus(path):
    """{sku} for the rows an id diff codes added:new_offer.

    Counting those rows proves the right NUMBER of catalog additions landed.
    Naming them proves they are the right ones, which is the difference between
    31 additions and the 31 additions Tim GO'd.
    """
    skus = set()
    with pathlib.Path(path).open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            if (row.get("reason_code") or "").strip() == "added:new_offer":
                sku = (row.get("sku") or "").strip()
                if sku:
                    skus.add(sku)
    return skus


def load_roster():
    """[{sku, feed, required, ...}] from feeds/catalog-additions.csv, comments stripped."""
    if not CATALOG_ADDITIONS.exists():
        return []
    lines = [l for l in CATALOG_ADDITIONS.read_text(encoding="utf-8-sig").splitlines()
             if not l.lstrip().startswith("#")]
    return [r for r in csv.DictReader(lines) if (r.get("sku") or "").strip()]


def check_roster(roster, landed_by_feed, failures, notes):
    """Identity check: every rostered SKU must actually land as a catalog addition."""
    everywhere = set().union(*landed_by_feed.values()) if landed_by_feed else set()
    missing_required, missing_optional = [], []
    for row in roster:
        sku = row["sku"].strip()
        feed = (row.get("feed") or "").strip()
        expected_in = landed_by_feed.get(feed, everywhere) if feed else everywhere
        if sku in expected_in:
            continue
        required = (row.get("required") or "").strip().lower() in ("yes", "true", "1")
        (missing_required if required else missing_optional).append((sku, feed))

    if missing_required:
        failures.append(
            f"{len(missing_required)} required catalog additions did not land: "
            + ", ".join(f"{s} ({f or 'either feed'})" for s, f in missing_required[:20])
            + ("" if len(missing_required) <= 20 else f" and {len(missing_required) - 20} more"))
    if missing_optional:
        notes.append(
            f"WARN: {len(missing_optional)} non-required roster SKUs did not land: "
            + ", ".join(s for s, _ in missing_optional[:20])
            + ". Check excluded_rows.csv; a correct floor drop looks exactly like this.")

    rostered = {r["sku"].strip() for r in roster}
    unexpected = sorted(everywhere - rostered)
    if unexpected:
        notes.append(
            f"WARN: {len(unexpected)} catalog additions are not on the roster: "
            + ", ".join(unexpected[:20])
            + ". Additions nobody signed off are how scope grows quietly.")
    notes.append(f"roster: IDENTITY mode, {len(roster)} SKUs "
                 f"({sum(1 for r in roster if (r.get('required') or '').strip().lower() in ('yes','true','1'))} required)")


def check(manifest, expected, matched, id_diffs=None):
    id_diffs = id_diffs or {}
    failures = []
    notes = []

    cat = expected.get("catalogue", {})
    want_filter = cat.get("product_filter")
    if want_filter and manifest.get("product_filter") != want_filter:
        failures.append(
            f"product filter drifted: manifest {manifest.get('product_filter')!r}, "
            f"expected {want_filter!r}. The completeness count is meaningless if the "
            "two ask about different sets.")

    reported = manifest.get("catalogue_count_reported")
    fetched = manifest.get("products_fetched")
    precision = manifest.get("catalogue_count_precision")
    if precision != "EXACT":
        failures.append(f"Shopify reported an {precision} product count; a completeness "
                        "gate cannot run on an approximate figure.")
    elif reported != fetched:
        failures.append(f"incomplete read: {fetched} products fetched over "
                        f"{manifest.get('pages')} pages against {reported} reported. "
                        "This is the pagination-clamp failure.")
    else:
        notes.append(f"read complete: {fetched}/{reported} products, {manifest.get('pages')} pages")

    floor = cat.get("min_products")
    if floor is not None and isinstance(fetched, int) and fetched < floor:
        failures.append(f"only {fetched} products read, below the {floor} floor. The "
                        "catalogue does not shrink like that; something is filtering.")

    for feed, want in (expected.get("feeds") or {}).items():
        got = (manifest.get("feeds") or {}).get(feed)
        if got is None:
            failures.append(f"{feed}: missing from the run manifest")
            continue
        designed, written = got.get("designed"), got.get("written")
        if designed != written:
            failures.append(f"{feed}: designed {designed} rows, wrote {written}. Short file.")
        lo, hi = want.get("min_rows"), want.get("max_rows")
        if lo is not None and designed < lo:
            failures.append(f"{feed}: {designed} rows is below the expected floor of {lo}. "
                            "Do not publish a short feed; find what dropped first.")
        if hi is not None and designed > hi:
            failures.append(f"{feed}: {designed} rows is above the expected ceiling of {hi}. "
                            "A scope change needs feeds/expected-counts.json updated in the "
                            "same commit.")
        if lo is not None and hi is not None and lo <= designed <= hi:
            notes.append(f"{feed}: {designed} rows, inside {lo}-{hi}")

    for key, want in (expected.get("rosters") or {}).items():
        got = manifest.get(key)
        if got is None:
            failures.append(f"{key}: missing from the run manifest")
            continue
        bad = False
        if "exact" in want and got != want["exact"]:
            failures.append(f"{key}: {got}, expected exactly {want['exact']}")
            bad = True
        if "min" in want and got < want["min"]:
            failures.append(f"{key}: {got}, expected at least {want['min']}")
            bad = True
        if not bad:
            notes.append(f"{key}: {got}")

    adds = expected.get("catalog_additions") or {}
    if id_diffs:
        total_new = 0
        landed_by_feed = {}
        for feed, path in id_diffs.items():
            counts = count_reason_codes(path)
            landed_by_feed[feed] = new_offer_skus(path)
            new_offers = counts.get("added:new_offer", 0)
            total_new += new_offers
            unexplained = sum(v for k, v in counts.items() if k.endswith(":unexplained"))
            if unexplained:
                failures.append(f"{feed}: {unexplained} unexplained rows in the id diff. "
                                "Unexplained must be zero before anyone repoints.")
            want = adds.get(feed) or {}
            floor = want.get("min_new_offers")
            if floor is not None and new_offers < floor:
                failures.append(
                    f"{feed}: {new_offers} catalog additions (added:new_offer) against an "
                    f"expected {floor}. Part of the GO'd additions scope did not land.")
            else:
                notes.append(f"{feed}: {new_offers} catalog additions, "
                             f"{counts.get('added:variant_expansion', 0)} variant expansions, "
                             f"{sum(v for k, v in counts.items() if k.startswith('rekeyed:'))} rekeys")
        # Combined is a WARNING, not a failure. The 31 are unconditional, but the 55
        # queued master SKUs pre-date this GO and at least one of them cannot emit -
        # FF-RIT24 is $16 and the floor drops it - so a hard combined floor would
        # false-fail a correct run. Loud enough to look at, not loud enough to block.
        roster = load_roster()
        if roster:
            check_roster(roster, landed_by_feed, failures, notes)
        else:
            notes.append("roster: COUNT mode. feeds/catalog-additions.csv has no rows yet, so "
                         "this run proves the NUMBER of catalog additions, not their identity. "
                         "Drop Izza's 31 SKUs in and it becomes an identity check with no code "
                         "change.")

        combined = adds.get("combined_expected_new_offers")
        if combined is not None and total_new < combined:
            notes.append(f"WARN: {total_new} catalog additions across both feeds against an "
                         f"expected {combined} (31 French Fitness at $100 and over plus the 55 "
                         "queued master SKUs). Some of the 55 are legitimately dropped by the "
                         "floor, so check excluded_rows.csv before treating this as a defect.")
    elif adds:
        notes.append("catalog additions not checked: pass --id-diff <feed>=<path> for the "
                     "diffs run_cutover_diff.sh writes")

    tolerance = (expected.get("matched_vs_designed") or {}).get("tolerance_rows", 0)
    for feed, count in matched.items():
        got = (manifest.get("feeds") or {}).get(feed)
        if got is None:
            failures.append(f"--matched {feed}: that feed is not in the run manifest")
            continue
        designed = got["designed"]
        if abs(count - designed) > tolerance:
            short = designed - count
            failures.append(
                f"{feed}: Merchant Center matched {count} against a designed {designed}, "
                f"{abs(short)} {'short' if short > 0 else 'over'}. "
                "Do not treat this as settled; find the missing rows.")
        else:
            notes.append(f"{feed}: matched {count} equals designed {designed}")
    if not matched:
        notes.append("matched-vs-designed not run: pass --matched <feed>=<count> from the "
                     "Merchant Center source page after a fetch")
    return failures, notes


def parse_matched(values):
    out = {}
    for raw in values or []:
        if "=" not in raw:
            raise SystemExit(f"--matched wants <feed>=<count>, got {raw!r}")
        feed, _, count = raw.partition("=")
        try:
            out[feed.strip()] = int(count.strip())
        except ValueError:
            raise SystemExit(f"--matched {raw!r}: {count!r} is not a number")
    return out


def parse_id_diffs(values):
    out = {}
    for raw in values or []:
        if "=" not in raw:
            raise SystemExit(f"--id-diff wants <feed>=<path>, got {raw!r}")
        feed, _, path = raw.partition("=")
        out[feed.strip()] = path.strip()
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST),
                        help="the generator's run_manifest.json")
    parser.add_argument("--expected", default=str(EXPECTED),
                        help="the committed expectations")
    parser.add_argument("--matched", action="append", metavar="FEED=COUNT",
                        help="Merchant Center's matched product count for a feed. Repeatable.")
    parser.add_argument("--id-diff", action="append", metavar="FEED=PATH", dest="id_diff",
                        help="a reason-coded id diff, to check the GO'd catalog additions "
                             "actually landed. Repeatable.")
    args = parser.parse_args()

    manifest = load_json(args.manifest, "run manifest")
    expected = load_json(args.expected, "expected-counts file")
    failures, notes = check(manifest, expected, parse_matched(args.matched),
                            parse_id_diffs(args.id_diff))

    for note in notes:
        print(f"  {note}")
    if failures:
        print(f"\nFAIL ({len(failures)}) - counts do not agree; do not publish")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\nPASS - read complete, every output inside its expected band, "
          "matched agrees with designed where supplied")
    return 0


if __name__ == "__main__":
    sys.exit(main())
