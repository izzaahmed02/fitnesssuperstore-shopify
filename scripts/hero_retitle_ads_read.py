#!/usr/bin/env python3
"""Turn the four Product Lines exports into the two-week retitle read.

Tim's 2026-09-15 assignment: a 9/10 to 9/24 read on the Product Lines campaign
after the hero retitles. He does the decision-making; this produces the numbers
he asked for and the reconciliations he did not, so nothing has to be eyeballed
out of four spreadsheets.

  python3 scripts/hero_retitle_ads_read.py \
      --products products.csv \
      --asset-groups asset_groups.csv \
      --search-terms search_terms.csv \
      --campaign campaign.csv

Every argument is optional; whatever is supplied gets reported. Google Ads CSV
exports carry a title row and a blank row before the real header and a totals
row at the bottom, and render empty metrics as "--". All of that is handled.

Nothing here touches the Ads account. It reads downloaded files only.
"""
import argparse
import csv
import io
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
V2 = ROOT / "feeds" / "supplemental_priority_labels_v2.csv"
HEROES = ROOT / "feeds" / "hero-title-overrides.csv"

# Tim's stated baselines, 2026-09-15.
OLD_ELIGIBLE_BASELINE = 33
EXPECTED_ELIGIBLE = 230
ASSET_GROUP_BASELINES = {"tahoe": 23000, "ffb": 32000}
CAMPAIGN_DAILY_CAP = 200.0

# The three phrases Tim named, and the hero each should be pulling.
WATCHED_TERMS = {
    "leg press sled": ["FFT-LPSCR"],
    "45 degree leg press": ["FFB-45DLLP"],
    # Ambiguous by construction: two heroes carry these words in opposite
    # order, seated selectorized vs prone. Which one it lands on is the answer,
    # not whether it matched.
    "leg extension and curl machine": ["FFT-SLCLE", "FFT-PLCLE"],
}


def read_ads_csv(path: pathlib.Path) -> list[dict[str, str]]:
    """Parse a Google Ads CSV export, skipping its preamble and totals rows."""
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    lines = text.splitlines()

    # The real header is the first line that parses to 2+ non-empty cells and
    # is not the report title or the date-range line.
    start = 0
    for i, line in enumerate(lines):
        cells = next(csv.reader([line]), [])
        nonempty = [c for c in cells if c.strip()]
        if len(nonempty) >= 2:
            start = i
            break

    rows = list(csv.DictReader(io.StringIO("\n".join(lines[start:]))))

    # Google appends Total rows; they have a first cell starting with "Total".
    cleaned = []
    for r in rows:
        first = (list(r.values())[0] or "").strip().lower()
        if first.startswith("total") or not any((v or "").strip() for v in r.values()):
            continue
        cleaned.append({(k or "").strip(): (v or "").strip() for k, v in r.items()})
    return cleaned


def col(row: dict[str, str], *names: str) -> str:
    """Fetch a column by any of several possible header spellings."""
    lowered = {k.lower(): v for k, v in row.items()}
    for n in names:
        if n.lower() in lowered:
            return lowered[n.lower()]
    for n in names:
        for k, v in lowered.items():
            if n.lower() in k:
                return v
    return ""


def num(value: str) -> float:
    """Google renders blanks as '--' and uses thousands separators and %."""
    v = (value or "").strip().replace(",", "").replace("%", "").replace("$", "")
    if v in ("", "--", "-", "N/A"):
        return 0.0
    try:
        return float(v)
    except ValueError:
        m = re.search(r"-?\d+(\.\d+)?", v)
        return float(m.group()) if m else 0.0


def designed_series() -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in csv.DictReader(V2.open(encoding="utf-8")):
        s = (r.get("custom_label_4") or "").strip()
        if s:
            counts[s] = counts.get(s, 0) + 1
    return counts


def hero_skus() -> dict[str, str]:
    return {r["sku"]: r["title"] for r in csv.DictReader(HEROES.open(encoding="utf-8"))}


def report_products(path: pathlib.Path) -> None:
    rows = read_ads_csv(path)
    designed = designed_series()
    total_designed = sum(designed.values())

    served_ids, served_series = set(), {}
    for r in rows:
        oid = col(r, "Item ID", "Item Id", "Offer ID", "id")
        if not oid:
            continue
        served_ids.add(oid)
        s = col(r, "Custom label 4", "custom_label_4").strip()
        if s:
            served_series[s] = served_series.get(s, 0) + 1

    print("=" * 72)
    print("1. PRODUCT REPORT  -  eligibility")
    print("=" * 72)
    print(f"  offers in export            {len(served_ids)}")
    print(f"  Tim's stated expectation    {EXPECTED_ELIGIBLE}")
    print(f"  designed universe (v2)      {total_designed}   series-labelled rows")
    print(f"  old baseline                {OLD_ELIGIBLE_BASELINE}")
    gap = total_designed - len(served_ids)
    print(f"  designed minus served       {gap}")
    if gap > 0:
        print(f"\n  {gap} designed offers are not in the export. Per series:")
        for s in sorted(designed, key=lambda k: -designed[k]):
            short = designed[s] - served_series.get(s, 0)
            if short:
                print(f"    {s:<32} designed {designed[s]:>3}  served "
                      f"{served_series.get(s,0):>3}  short {short:>3}")
        print("\n  Tim flagged on 2026-09-20 that the automated local feed served 46")
        print("  offers short for two weeks because nothing compared matched against")
        print("  designed. Worth checking whether this is the same class of gap.")
    elif gap == 0:
        print("\n  Served matches designed exactly.")

    heroes = hero_skus()
    missing = [s for s in heroes if s not in served_ids]
    print(f"\n  hero SKUs present           {len(heroes)-len(missing)}/10")
    if missing:
        print(f"  MISSING: {', '.join(missing)}")
    print()
    print(f"  {'hero':<12}{'impr':>10}{'clicks':>9}{'cost':>11}{'conv':>7}{'conv value':>13}")
    for r in rows:
        oid = col(r, "Item ID", "Item Id", "Offer ID", "id")
        if oid in heroes:
            print(f"  {oid:<12}{num(col(r,'Impressions')):>10,.0f}"
                  f"{num(col(r,'Clicks')):>9,.0f}{num(col(r,'Cost')):>11,.2f}"
                  f"{num(col(r,'Conversions')):>7,.1f}"
                  f"{num(col(r,'Conv. value','Conversion value')):>13,.2f}")
    print()


def report_asset_groups(path: pathlib.Path) -> None:
    rows = read_ads_csv(path)
    print("=" * 72)
    print("2. ASSET GROUPS  -  impressions vs baseline")
    print("=" * 72)
    print(f"  {'asset group':<28}{'impr':>10}{'baseline':>10}{'change':>10}{'clicks':>9}{'conv':>7}")
    for r in rows:
        name = col(r, "Asset group", "Asset group name")
        if not name:
            continue
        impr = num(col(r, "Impressions"))
        base = next((v for k, v in ASSET_GROUP_BASELINES.items() if k in name.lower()), None)
        if base:
            pct = (impr - base) / base * 100
            change = f"{pct:+.0f}%"
            baseline = f"{base:,.0f}"
        else:
            change, baseline = "", ""
        print(f"  {name[:27]:<28}{impr:>10,.0f}{baseline:>10}{change:>10}"
              f"{num(col(r,'Clicks')):>9,.0f}{num(col(r,'Conversions')):>7,.1f}")
    print("\n  Baselines are Tim's: Tahoe 23K, FFB 32K. Those two carry six and two")
    print("  retitled heroes. Monster (3 rows) and FSR (10) are too small to read")
    print("  as a signal on their own.")
    print()


def report_search_terms(path: pathlib.Path) -> None:
    rows = read_ads_csv(path)
    print("=" * 72)
    print("3. SEARCH TERMS  -  did the retitles win the phrases")
    print("=" * 72)
    for phrase, expected in WATCHED_TERMS.items():
        hits = [r for r in rows if phrase in col(r, "Search term", "Search terms").lower()]
        print(f"\n  \"{phrase}\"   expected: {' or '.join(expected)}")
        if not hits:
            print("    no matching search term in the window")
            continue
        for r in hits:
            term = col(r, "Search term", "Search terms")
            landed = col(r, "Item ID", "Item Id", "Product", "Offer ID")
            note = ""
            if len(expected) > 1 and landed:
                note = ("  <-- which of the two matters, these are not "
                        "substitutes") if landed in expected else ""
            print(f"    {term[:44]:<46} impr {num(col(r,'Impressions')):>7,.0f}"
                  f"  clicks {num(col(r,'Clicks')):>5,.0f}"
                  f"  conv {num(col(r,'Conversions')):>4,.1f}"
                  f"{('  landed: ' + landed) if landed else ''}{note}")
    print()


def report_campaign(path: pathlib.Path) -> None:
    rows = read_ads_csv(path)
    print("=" * 72)
    print("4. CAMPAIGN  -  is the cap binding")
    print("=" * 72)
    for r in rows:
        name = col(r, "Campaign", "Campaign name")
        if not name:
            continue
        cost = num(col(r, "Cost"))
        lost = num(col(r, "Search lost IS (budget)", "Impr. share lost (budget)",
                       "lost IS (budget)", "budget"))
        print(f"  {name}")
        print(f"    cost over window          {cost:,.2f}")
        print(f"    daily cap                 {CAMPAIGN_DAILY_CAP:,.2f}")
        print(f"    impr share lost (budget)  {lost:.1f}%")
        if lost > 0:
            print("    -> budget IS being lost, the cap is binding on at least some days.")
            print("       Per Tim that triggers the Reman budget shift, which is his call.")
        else:
            print("    -> no budget-lost impression share, the cap is not binding.")
        print("\n    Cost alone does not answer this: a campaign can finish under its")
        print("    cap on total spend and still be throttled on peak days, which is")
        print("    why lost IS (budget) is the column that decides it.")
    print()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--products", type=pathlib.Path)
    ap.add_argument("--asset-groups", type=pathlib.Path)
    ap.add_argument("--search-terms", type=pathlib.Path)
    ap.add_argument("--campaign", type=pathlib.Path)
    args = ap.parse_args()

    if not any([args.products, args.asset_groups, args.search_terms, args.campaign]):
        ap.error("supply at least one export")

    print("\nHERO RETITLE TWO-WEEK ADS READ   window 2026-09-10 to 2026-09-24")
    print("Titles live 2026-09-08, freeze to 2026-10-06, so no approved string")
    print("changed inside the window.\n")

    for path, fn in ((args.products, report_products),
                     (args.asset_groups, report_asset_groups),
                     (args.search_terms, report_search_terms),
                     (args.campaign, report_campaign)):
        if path:
            if not path.exists():
                print(f"SKIPPED: {path} not found", file=sys.stderr)
                continue
            fn(path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
