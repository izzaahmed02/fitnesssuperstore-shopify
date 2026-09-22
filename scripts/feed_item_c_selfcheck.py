"""Item C self-check for the fresh four-source Multifeeds regeneration.

Run against the regenerated files before they are posted on the offer-ID
Split #1 thread. Every check below is a line of Tim's item C spec (freight
Split #1, Sept 21-22) or a named addition to it:

    blank        no blank shipping, no region with an empty price
    regional     regional breakdown on every row (a US:CA:: entry at least)
    free-ship    free-shipping ids carry $0.00 in every region, CA included
    ca-tier      paid CA values sit on the 199/249/349 tiers; the stale $149
                 constant is a hard fail, any other value is listed for review
    tax          no tax attribute
    retired      no processing_time / processing_time_long (either spelling)
    availability in_stock / out_of_stock / preorder / backorder only
    duplicate    no duplicated ids
    variant      within an item group, US shipping never drops as weight rises
                 (catches the blanket-$399 hex pattern)
    drift        named live products present, named dead products absent
    hex          every in-scope FF hex cohort row at or above the captured
                 checkout quote for its zone (Iqra/Saliha's table)
    territory    reports whether the output carries any US Territories entry

Usage:
    python3 scripts/feed_item_c_selfcheck.py \
        --feed googleshoppingfrenchfitness.tsv --feed googleshoppingfs.tsv \
        --feed <numeric FF source>.tsv --feed <numeric FS source>.tsv \
        [--free-ship-ids free_ship_ids.txt] \
        [--hex-quotes hex_quotes.csv] \
        [--report out/item_c_report.txt]

--hex-quotes is a CSV with columns sku,dallas,seattle,la (the highest option
per zone, as captured). Without it the hex check lists the cohort rows and
their feed values so the comparison can be run by hand.

Exit code is 0 only when no check FAILs.
"""

import argparse
import csv
import hashlib
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone

CA_TIERS = {199.0, 249.0, 349.0}
STALE_CA = 149.0
RETIRED_COLUMNS = ("processing_time", "processing_time_long", "processin_time_long")
VALID_AVAILABILITY = {"in_stock", "out_of_stock", "preorder", "backorder"}
US_TERRITORIES = {"PR", "GU", "VI", "AS", "MP", "UM", "AA", "AE", "AP"}
WEST_COAST = ("WA", "OR", "NV", "AZ")

# Catalog drift named in Tim's Sept 22 01:11 ruling, plus FF-STW-WB-3 per the
# Split #1 note (its absence closes the REMOVE FROM FEEDS verification).
MUST_BE_PRESENT = ("WW-4FrontPS21", "pro7HC", "FF-WMR20")
MUST_BE_ABSENT = ("E420T", "FF-STW-WB-3")

# Hex cohort: every FF-RCHD variant except the five sub-$25 singles Tim kept
# out on Sept 19 (quotes kept as evidence only).
HEX_PREFIX = "FF-RCHD"
HEX_EXCLUDED = {"FF-RCHD2-5", "FF-RCHD5", "FF-RCHD7-5", "FF-RCHD10", "FF-RCHD12-5"}

SEGMENT = re.compile(r"^\s*([A-Z]{2})?:([^:]*):([^:]*):(.*)$")


def read_feed(path):
    with open(path, newline="", encoding="utf-8", errors="replace") as fh:
        sample = fh.read(8192)
        fh.seek(0)
        delimiter = "\t" if "\t" in sample.splitlines()[0] else ","
        reader = csv.DictReader(fh, delimiter=delimiter)
        return reader.fieldnames or [], list(reader)


def parse_price(text):
    match = re.search(r"-?\d+(?:\.\d+)?", text or "")
    return float(match.group()) if match else None


def parse_shipping(value):
    """[(country, region, price-or-None)] from a Merchant Center shipping string.

    Handles both `US:CA::149 USD` (country:region:postal:price) and the
    service-labelled `US:CA:Ground:149 USD` form.
    """
    segments = []
    for part in (value or "").split(","):
        part = part.strip()
        if not part:
            continue
        match = SEGMENT.match(part)
        if not match:
            segments.append(("?", "?", None))
            continue
        country, region, _postal_or_service, price = match.groups()
        segments.append(((country or "").upper(), region.strip().upper(),
                         parse_price(price)))
    return segments


def sku_of(row):
    return (row.get("old_id") or row.get("sku") or row.get("mpn") or "").strip()


def weight_of(row):
    return parse_price(row.get("shipping_weight"))


def zone_price(segments, region):
    for country, seg_region, price in segments:
        if country == "US" and seg_region == region:
            return price
    return None


def national_price(segments):
    return zone_price(segments, "")


class Report:
    def __init__(self):
        self.lines = []
        self.fails = 0

    def result(self, name, failures, detail_limit=25, warn=False):
        if not failures:
            self.lines.append(f"PASS  {name}")
            return
        label = "WARN" if warn else "FAIL"
        if not warn:
            self.fails += 1
        self.lines.append(f"{label}  {name}: {len(failures)}")
        for item in failures[:detail_limit]:
            self.lines.append(f"        {item}")
        if len(failures) > detail_limit:
            self.lines.append(f"        ... {len(failures) - detail_limit} more")

    def note(self, text):
        self.lines.append(text)


def file_header(path, rows):
    with open(path, "rb") as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()[:16]
    mtime = datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)
    return (f"{os.path.basename(path)}  rows={len(rows)}  "
            f"mtime={mtime:%Y-%m-%d %H:%M:%S} UTC  sha256={digest}")


def check_feed(path, fieldnames, rows, free_ship_ids, report):
    report.note("")
    report.note("=== " + file_header(path, rows))

    blank, regional, free_ship, ca_stale, ca_off = [], [], [], [], []
    availability, duplicates, variant = [], [], []
    by_id = defaultdict(int)
    groups = defaultdict(list)

    for row in rows:
        feed_id = (row.get("id") or "").strip()
        label = f"{feed_id} ({sku_of(row)})"
        by_id[feed_id] += 1
        segments = parse_shipping(row.get("shipping"))

        if not segments or any(price is None for _, _, price in segments):
            blank.append(f"{label}: shipping={row.get('shipping')!r}")
            continue
        if zone_price(segments, "CA") is None:
            regional.append(f"{label}: no US:CA entry ({row.get('shipping')})")

        ca = zone_price(segments, "CA")
        if feed_id in free_ship_ids:
            nonzero = [f"{c}:{r or '*'}={p}" for c, r, p in segments if p != 0]
            if nonzero:
                free_ship.append(f"{label}: {' '.join(nonzero)}")
        elif ca is not None and ca != 0:
            if ca == STALE_CA:
                ca_stale.append(f"{label}: US:CA {ca:g}")
            elif ca not in CA_TIERS:
                ca_off.append(f"{label}: US:CA {ca:g}")

        avail = (row.get("availability") or "").strip()
        if avail not in VALID_AVAILABILITY:
            availability.append(f"{label}: {avail!r}")

        group = (row.get("item_group_id") or "").strip() or feed_id.split("-")[0]
        groups[group].append((weight_of(row), national_price(segments), label))

    for feed_id, count in by_id.items():
        if count > 1:
            duplicates.append(f"{feed_id} x{count}")

    for group, members in groups.items():
        members = [m for m in members if m[0] is not None and m[1] is not None]
        members.sort(key=lambda m: m[0])
        for lighter, heavier in zip(members, members[1:]):
            if heavier[0] > lighter[0] and heavier[1] < lighter[1]:
                variant.append(
                    f"group {group}: {heavier[2]} {heavier[0]:g} lb US {heavier[1]:g}"
                    f" < {lighter[2]} {lighter[0]:g} lb US {lighter[1]:g}")

    tax = []
    if "tax" in fieldnames:
        taxed = [r for r in rows if (r.get("tax") or "").strip()]
        if taxed:
            tax.append(f"tax column populated on {len(taxed)} rows")
    retired = [c for c in RETIRED_COLUMNS if c in fieldnames
               and any((r.get(c) or "").strip() for r in rows)]

    report.result("blank shipping", blank)
    report.result("regional breakdown (US:CA present)", regional)
    if free_ship_ids:
        report.result("free-ship $0.00 in every region", free_ship)
    else:
        report.note("SKIP  free-ship $0.00: no --free-ship-ids list given")
    report.result("stale CA $149 constant", ca_stale)
    report.result("CA value off the 199/249/349 tiers (review)", ca_off, warn=True)
    report.result("tax attribute", tax)
    report.result("retired processing_time columns", retired)
    report.result("availability values", availability)
    report.result("duplicate ids", duplicates)
    report.result("variant shipping scales with weight", variant)


def check_catalog(all_rows, report):
    skus = {sku_of(r) for r in all_rows} | {(r.get("id") or "") for r in all_rows}
    titles = " ".join((r.get("title") or "") for r in all_rows)

    def present(token):
        return token in skus or token in titles

    report.note("")
    report.note("=== Catalog drift (all sources)")
    report.result("named live products present",
                  [t for t in MUST_BE_PRESENT if not present(t)])
    report.result("named dead products absent",
                  [t for t in MUST_BE_ABSENT if present(t)])


def check_territories(all_rows, report):
    countries, territory_rows = defaultdict(int), []
    for row in all_rows:
        for country, region, _ in parse_shipping(row.get("shipping")):
            countries[country] += 1
            if country in US_TERRITORIES or (country == "US" and region in US_TERRITORIES):
                territory_rows.append(f"{row.get('id')} ({sku_of(row)})")
    report.note("")
    report.note("=== US Territories")
    summary = ", ".join(f"{c}={n}" for c, n in sorted(countries.items()))
    report.note(f"INFO  shipping segments by country: {summary}")
    if territory_rows:
        report.note(f"INFO  territory entries on {len(territory_rows)} rows "
                    f"(first: {territory_rows[0]}) -> PR lane applies")
    else:
        report.note("INFO  no territory entry on any row -> output is US only, "
                    "PR lane skipped")


def load_quotes(path):
    quotes = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            quotes[row["sku"].strip()] = {
                zone: parse_price(row.get(zone)) for zone in ("dallas", "seattle", "la")
            }
    return quotes


def check_hex(ff_rows, quotes, report):
    cohort = [r for r in ff_rows if sku_of(r).startswith(HEX_PREFIX)
              and sku_of(r) not in HEX_EXCLUDED]
    report.note("")
    report.note(f"=== Hex cohort ({len(cohort)} FF rows, sub-$25 singles excluded)")
    if not cohort:
        report.result("hex cohort present in FF file", ["no FF-RCHD rows found"])
        return

    misses, no_quote, listing = [], [], []
    for row in sorted(cohort, key=lambda r: weight_of(r) or 0):
        sku = sku_of(row)
        segments = parse_shipping(row.get("shipping"))
        feed = {
            "dallas": national_price(segments),
            "seattle": min((p for p in (zone_price(segments, s) for s in WEST_COAST)
                            if p is not None), default=national_price(segments)),
            "la": zone_price(segments, "CA"),
        }
        listing.append(f"{sku}: US {feed['dallas']} / West {feed['seattle']} "
                       f"/ CA {feed['la']}")
        if quotes is None:
            continue
        quote = quotes.get(sku)
        if not quote:
            no_quote.append(sku)
            continue
        for zone, captured in quote.items():
            if captured is None:
                continue
            if feed[zone] is None or feed[zone] < captured:
                misses.append(f"{sku} {zone}: feed {feed[zone]} < quote {captured:g}")

    if quotes is None:
        report.note("SKIP  quote comparison: no --hex-quotes table given; "
                    "feed values per cohort row:")
        for line in listing:
            report.note(f"        {line}")
        return
    report.result("hex row at or above captured quote", misses, detail_limit=60)
    report.result("hex row with no captured quote (review)", no_quote, warn=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--feed", action="append", required=True,
                        help="a regenerated source file; pass once per source")
    parser.add_argument("--free-ship-ids", help="file with one free-shipping id per line")
    parser.add_argument("--hex-quotes", help="CSV sku,dallas,seattle,la")
    parser.add_argument("--report", help="also write the report here")
    args = parser.parse_args(argv)

    free_ship_ids = set()
    if args.free_ship_ids:
        with open(args.free_ship_ids, encoding="utf-8") as fh:
            free_ship_ids = {line.strip() for line in fh if line.strip()}
    quotes = load_quotes(args.hex_quotes) if args.hex_quotes else None

    report = Report()
    report.note(f"Item C self-check, run {datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S} UTC")
    all_rows, ff_rows = [], []
    for path in args.feed:
        fieldnames, rows = read_feed(path)
        check_feed(path, fieldnames, rows, free_ship_ids, report)
        all_rows.extend(rows)
        if any(sku_of(r).startswith("FF-") for r in rows):
            ff_rows.extend(rows)

    check_catalog(all_rows, report)
    check_territories(all_rows, report)
    check_hex(ff_rows, quotes, report)

    report.note("")
    report.note("RESULT: " + ("PASS" if report.fails == 0 else f"HOLD ({report.fails} failing checks)"))
    text = "\n".join(report.lines) + "\n"
    sys.stdout.write(text)
    if args.report:
        os.makedirs(os.path.dirname(args.report) or ".", exist_ok=True)
        with open(args.report, "w", encoding="utf-8") as fh:
            fh.write(text)
    return 0 if report.fails == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
