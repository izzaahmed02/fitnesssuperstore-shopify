#!/usr/bin/env python3
"""Turn the Product Lines exports into the two-week hero retitle read.

Tim's 2026-09-15 assignment: a 2026-09-10 to 2026-09-24 read on the Product
Lines campaign after the hero retitles. He does the decision-making; this
produces the numbers and the reconciliations, so nothing is eyeballed out of
six-figure-row spreadsheets.

  python3 scripts/hero_retitle_ads_read.py \
      --products "Product report.csv" \
      --search-terms "Search terms report.csv" \
      [--asset-groups "Asset group report.csv"] \
      [--campaign "Campaign report.csv"]

Every argument is optional. The script identifies each file from its own
columns and says so, and refuses a file that is the wrong report rather than
reporting nonsense from it.

Nothing here touches the Ads account. It reads downloaded files only.
"""
import argparse
import csv
import io
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
V2 = ROOT / "feeds" / "supplemental_priority_labels_v2.csv"
HEROES = ROOT / "feeds" / "hero-title-overrides.csv"

PRIMARY_MERCHANT = "9453531"          # the account Tim named
PRODUCT_LINES = "PMAX FF Product Lines $1000+"
OLD_ELIGIBLE_BASELINE = 33
EXPECTED_ELIGIBLE = 230
ASSET_GROUP_BASELINES = {"tahoe": 23000, "ffb": 32000}
CAMPAIGN_DAILY_CAP = 200.0
WATCHED_TERMS = ["leg press sled", "45 degree leg press",
                 "leg extension and curl machine"]


def read_ads_csv(path):
    """Google Ads exports put a title row and a date row above the header."""
    lines = path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    start = 0
    for i, line in enumerate(lines):
        cells = next(csv.reader([line]), [])
        if len([c for c in cells if c.strip()]) >= 3:
            start = i
            break
    out = []
    for r in csv.DictReader(io.StringIO("\n".join(lines[start:]))):
        r = {(k or "").strip(): (v or "").strip() for k, v in r.items()}
        first = next(iter(r.values()), "")
        if first.lower().startswith("total") or not any(r.values()):
            continue
        out.append(r)
    return out


def num(value):
    v = (value or "").replace(",", "").replace("$", "").replace("%", "").strip()
    if v in ("", "--", "-", "N/A"):
        return 0.0
    try:
        return float(v)
    except ValueError:
        return 0.0


def load_reference():
    v2 = {r["id"].lower(): r for r in csv.DictReader(V2.open(encoding="utf-8"))}
    series = {k: v for k, v in v2.items() if v["custom_label_4"].strip()}
    heroes = list(csv.DictReader(HEROES.open(encoding="utf-8")))
    return v2, series, heroes


def require(rows, needed, label, path):
    missing = [c for c in needed if c not in (rows[0] if rows else {})]
    if missing:
        print(f"WRONG REPORT: {path.name} is not {label}. It has no "
              f"{', '.join(missing)} column.", file=sys.stderr)
        if rows:
            print(f"  columns present: {', '.join(list(rows[0])[:12])}",
                  file=sys.stderr)
        return False
    return True


def report_products(path):
    rows = read_ads_csv(path)
    if not require(rows, ["Item ID", "Status", "Title"], "a Product report", path):
        return
    _, series, heroes = load_reference()

    main = {r["Item ID"]: r for r in rows if r.get("Merchant ID") == PRIMARY_MERCHANT}
    other = {r.get("Merchant ID") for r in rows} - {PRIMARY_MERCHANT, None, ""}

    print("=" * 74)
    print("1. PRODUCT REPORT")
    print("=" * 74)
    print(f"  rows {len(rows):,}, of which merchant {PRIMARY_MERCHANT}: {len(main):,} unique offers")
    if other:
        print(f"  NOTE: the export also spans merchant {', '.join(sorted(other))}; "
              f"those rows are excluded from everything below.")

    # --- the retitles, checked against serving data ---
    print("\n  -- Are the approved titles the ones serving? --")
    approved = {h["sku"].lower(): h["title"] for h in heroes}
    matched = mismatched = absent = 0
    detail = []
    for h in heroes:
        r = main.get(h["sku"].lower())
        if not r:
            absent += 1
            detail.append((h["sku"], "ABSENT", "", None))
            continue
        if r["Title"].strip() == h["title"].strip():
            matched += 1
            detail.append((h["sku"], "approved", r["Status"], r))
        else:
            mismatched += 1
            detail.append((h["sku"], "OLD TITLE", r["Status"], r))
    print(f"     showing the approved string : {matched}/10")
    print(f"     showing the old string      : {mismatched}/10")
    print(f"     absent                      : {absent}/10")
    if mismatched:
        print("\n     STOP. The product report is showing pre-retitle titles. Two")
        print("     possibilities and they are not the same problem:")
        print("       a) the Title column here renders the PRIMARY feed title and")
        print("          not the supplemental-merged serving title, in which case")
        print("          this is a reporting artifact and the read stands;")
        print("       b) hero_titles_supplemental.csv has stopped applying, in")
        print("          which case the retitles are dead and this window measures")
        print("          nothing.")
        print("     Resolve in Merchant Center before sending any of this on.")

    print(f"\n  {'SKU':<12}{'title':<11}{'status':<14}{'impr':>8}{'clicks':>8}"
          f"{'cost':>9}{'conv':>6}{'value':>10}")
    ti = tc = tcost = tconv = tval = 0.0
    for sku, state, status, r in detail:
        if r is None:
            print(f"  {sku:<12}{state:<11}")
            continue
        i, c = num(r.get("Impr.")), num(r.get("Product clicks", r.get("Clicks")))
        co, cv = num(r.get("Cost")), num(r.get("Conv. value"))
        cn = num(r.get("Conversions"))
        ti += i; tc += c; tcost += co; tconv += cn; tval += cv
        print(f"  {sku:<12}{state:<11}{status:<14}{i:>8,.0f}{c:>8,.0f}"
              f"{co:>9,.2f}{cn:>6,.1f}{cv:>10,.2f}")
    print(f"  {'TOTAL':<12}{'':<11}{'':<14}{ti:>8,.0f}{tc:>8,.0f}"
          f"{tcost:>9,.2f}{tconv:>6,.1f}{tval:>10,.2f}")

    # --- eligibility against the designed universe ---
    print("\n  -- Eligibility of the series-labelled universe --")
    present = [k for k in series if k in main]
    elig = [k for k in present if main[k]["Status"] == "Eligible"]
    print(f"     designed (v2 series rows)   {len(series)}")
    print(f"     present in the report       {len(present)}")
    print(f"     Eligible                    {len(elig)}")
    print(f"     present but not eligible    {len(present)-len(elig)}")
    print(f"     absent entirely             {len(series)-len(present)}")
    print(f"\n     Tim's expectation {EXPECTED_ELIGIBLE}, old baseline {OLD_ELIGIBLE_BASELINE}.")
    gap = len(series) - len(elig)
    print(f"     designed minus eligible = {gap}, and every one is accounted for below,")
    print("     so this is not an unexplained shortfall.")
    reasons = {}
    for k in present:
        if main[k]["Status"] != "Eligible":
            reasons.setdefault(main[k].get("Issues", "").replace("\n", "; "), []).append(k)
    for reason, ks in sorted(reasons.items(), key=lambda kv: -len(kv[1])):
        print(f"       {len(ks):>3}  {reason or '(no issue given)'}")
    miss = [k for k in series if k not in main]
    if miss:
        print(f"       {len(miss):>3}  absent from the report: "
              f"{', '.join(sorted(m.upper() for m in miss))}")
    print()


def report_search_terms(path):
    rows = read_ads_csv(path)
    if not require(rows, ["Search term", "Campaign"], "a Search terms report", path):
        return
    pl = [r for r in rows if r.get("Campaign") == PRODUCT_LINES]

    print("=" * 74)
    print("2. SEARCH TERMS")
    print("=" * 74)
    print(f"  {len(rows):,} terms across the account, {len(pl):,} in {PRODUCT_LINES}")
    if pl:
        print(f"  Product Lines totals over the window: "
              f"impr {sum(num(r['Impr.']) for r in pl):,.0f}, "
              f"clicks {sum(num(r['Clicks']) for r in pl):,.0f}, "
              f"cost {sum(num(r['Cost']) for r in pl):,.2f}, "
              f"conv {sum(num(r['Conversions']) for r in pl):,.1f}")
        print("  (search-terms totals cover only terms Google chose to report, so")
        print("   they undercount the campaign. The campaign report is the exact one.)")

    print(f"\n  -- Tim's three phrases, inside Product Lines --")
    for phrase in WATCHED_TERMS:
        hits = [r for r in pl if phrase in r["Search term"].lower()]
        print(f"\n  \"{phrase}\"  {len(hits)} term(s), "
              f"impr {sum(num(r['Impr.']) for r in hits):,.0f}, "
              f"clicks {sum(num(r['Clicks']) for r in hits):,.0f}, "
              f"conv {sum(num(r['Conversions']) for r in hits):,.1f}")
        for r in sorted(hits, key=lambda x: -num(x["Impr."]))[:5]:
            print(f"     {r['Search term'][:52]:<54}impr {num(r['Impr.']):>6,.0f}"
                  f"  clicks {num(r['Clicks']):>4,.0f}")
    if "Item ID" not in (rows[0] if rows else {}):
        print("\n  NOTE: this report carries no Item ID, so it cannot say which SKU a")
        print("  term landed on. The FFT-SLCLE versus FFT-PLCLE question is not")
        print("  answerable from it; that needs the product-level search term view.")
    print()


def report_asset_groups(path):
    rows = read_ads_csv(path)
    cols = rows[0] if rows else {}
    if "Asset group" not in cols:
        print("=" * 74)
        print("3. ASSET GROUPS  -  NOT SUPPLIED")
        print("=" * 74)
        print(f"  {path.name} is an Asset ASSOCIATION report, not an Asset GROUP")
        print("  report. It lists sitelinks, callouts and images at ad-group and")
        print("  campaign level, with no asset group name and no campaign column,")
        print("  so it cannot give Tahoe or FFB impressions against the 23K and 32K")
        print("  baselines.")
        print("\n  Re-pull: Campaigns > PMAX FF Product Lines $1000+ > Asset groups")
        print("  tab > download. Columns: Asset group, Impressions, Clicks, Cost,")
        print("  Conversions, Conv. value.")
        print()
        return
    print("=" * 74)
    print("3. ASSET GROUPS")
    print("=" * 74)
    print(f"  {'asset group':<30}{'impr':>10}{'baseline':>10}{'change':>9}{'clicks':>8}{'conv':>7}")
    for r in rows:
        name = r.get("Asset group", "")
        if not name:
            continue
        impr = num(r.get("Impressions", r.get("Impr.")))
        base = next((v for k, v in ASSET_GROUP_BASELINES.items() if k in name.lower()), None)
        chg = f"{(impr-base)/base*100:+.0f}%" if base else ""
        print(f"  {name[:29]:<30}{impr:>10,.0f}{(f'{base:,}' if base else ''):>10}"
              f"{chg:>9}{num(r.get('Clicks')):>8,.0f}{num(r.get('Conversions')):>7,.1f}")
    print()


def report_campaign(path):
    rows = read_ads_csv(path)
    if not require(rows, ["Campaign"], "a Campaign report", path):
        return
    print("=" * 74)
    print("4. CAMPAIGN")
    print("=" * 74)
    for r in rows:
        name = r.get("Campaign", "")
        if "product lines" not in name.lower():
            continue
        cost = num(r.get("Cost"))
        lost = num(r.get("Search lost IS (budget)") or r.get("Impr. share lost (budget)"))
        print(f"  {name}")
        print(f"    cost over window          {cost:,.2f}")
        print(f"    daily cap                 {CAMPAIGN_DAILY_CAP:,.2f}")
        print(f"    impr share lost (budget)  {lost:.1f}%")
        print("    -> cap IS binding" if lost > 0 else "    -> cap is not binding")
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--products", type=pathlib.Path)
    ap.add_argument("--asset-groups", type=pathlib.Path)
    ap.add_argument("--search-terms", type=pathlib.Path)
    ap.add_argument("--campaign", type=pathlib.Path)
    a = ap.parse_args()
    if not any([a.products, a.asset_groups, a.search_terms, a.campaign]):
        ap.error("supply at least one export")

    print("\nHERO RETITLE TWO-WEEK ADS READ   window 2026-09-10 to 2026-09-24")
    print("Titles live 2026-09-08, freeze to 2026-10-06.\n")
    for path, fn in ((a.products, report_products),
                     (a.search_terms, report_search_terms),
                     (a.asset_groups, report_asset_groups),
                     (a.campaign, report_campaign)):
        if path:
            if not path.exists():
                print(f"SKIPPED: {path} not found", file=sys.stderr)
                continue
            fn(path)
    if not a.campaign:
        print("=" * 74)
        print("4. CAMPAIGN  -  NOT SUPPLIED")
        print("=" * 74)
        print("  Needed for the $200 cap question. Campaigns view, Product Lines row,")
        print("  columns Campaign, Budget, Cost, Search lost IS (budget), Search")
        print("  impression share. Cost alone does not answer it: a campaign can end")
        print("  under its cap on total spend and still be throttled on peak days.")
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
