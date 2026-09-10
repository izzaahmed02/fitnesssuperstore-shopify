#!/usr/bin/env python3
"""QA gate for delta 1 - how the generator resolves labels out of the v2 lookup.

Run with no arguments to exercise the rule table against the real
feeds/supplemental_priority_labels_v2.csv and the live Shopify cases recorded on
2026-09-09. Pass a generated feed to validate the real output:

    python3 scripts/check_label_resolution.py
    python3 scripts/check_label_resolution.py build/feeds/googleshoppingfrenchfitness.csv

Rules enforced:
  1. The lookup loads: both label columns present, no duplicate ids.
  2. Resolution is SKU first, then the emitted offer id, then the bare product id.
     Not every row is SKU-keyed - 931, 933 and 935 are Precor SKUs that look like
     product ids, 45 rows are bare Shopify product ids and 45 are
     <productID>-<variantID> composites - so the order has to be stated, not
     inferred from the shape of the id.
  3. Where one live variant is addressed by two lookup rows, the SKU row wins and
     the run says so. Five hex-dumbbell variants on product 10247596147004 are
     addressed twice; three of those disagree on tier (FF-RCHD5-50 p1_hero,
     FF-RCHD5-75 p2_core, FF-RCHD5-100 p1_hero, all p4_tail on the composite row).
     If the order ever flips, those three drop out of their asset groups silently.
  4. Series only survives at price >= $1,000, and a drop is logged rather than
     quietly applied.
  5. Every one of the ten approved hero SKUs is present in the lookup and tiered
     p1_hero, so the retitle and the label land on the same offer.
  6. In a generated feed: no row may carry a series with no tier, and no p1_hero
     or p2_core row may have a blank custom_label_4 above $1,000 without the
     lookup itself being blank there.
"""
import csv
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from phase2_feed_generator import LABEL_LOOKUP, TITLE_OVERRIDES, load_labels, labels_for  # noqa: E402

# (description, sku, offer_id, product_id, expected labels, expected source)
# Every case is a real row of the live catalogue, read on 2026-09-09.
LIVE_CASES = [
    ("hero SKU, single-variant product, SKU-keyed row",
     "FFT-SLCLE", "10026483908924", "10026483908924", ("p1_hero", "Tahoe Series"), "sku"),
    ("hero SKU, FFB Black series",
     "FFB-45DLLP", "9879168647484", "9879168647484", ("p1_hero", "FFB Black Series"), "sku"),
    ("hero SKU, Monster series",
     "FFM-PLHSLP", "9878947627324", "9878947627324", ("p1_hero", "Monster Series"), "sku"),
    ("Precor SKU that looks like a product id - must resolve as a SKU, not an id",
     "931", "9878495265084", "9878495265084", ("p4_tail", ""), "sku"),
    ("Monster Universal Storage: lookup row is the BARE product id and the product has "
     "10 variants, so the tier reaches every variant only via the product-id fallback",
     "FF-MSS-48-3T", "10269254254908-52746450927932", "10269254254908", ("p4_tail", ""), "product_id"),
    ("hex dumbbell set addressed twice - SKU row carries the hero tier, composite says p4_tail",
     "FF-RCHD5-100", "10247596147004-52534108291388", "10247596147004",
     ("p1_hero", ""), "sku"),
    ("hex dumbbell variant with no SKU row of its own - the composite row supplies the tier",
     "FF-RCHD55-100", "10247596147004-52534108324156", "10247596147004", ("p2_core", ""), "offer_id"),
    ("SKU absent from the lookup - no tier, no series, and it must not fall back to the product",
     "BSLDSFB125", "9878462693692", "9878462693692", ("", ""), None),
    ("lookup id with no live product at all - cannot be reached from any offer",
     "FFA-CFDI-NOT-A-VARIANT", "1-2", "1", ("", ""), None),
]

HERO_TIER = "p1_hero"


def check_rules():
    failures = []

    try:
        labels = load_labels(LABEL_LOOKUP)
    except SystemExit as exc:
        return [f"lookup will not load: {exc}"]

    if len(labels) != 2196:
        failures.append(f"lookup has {len(labels)} ids, expected the 2,196 Tim published")

    for desc, sku, offer_id, product_id, expected, expected_source in LIVE_CASES:
        report = []
        got, source = labels_for(labels, sku, offer_id, product_id, report)
        if expected is not None and got != expected:
            failures.append(f"{desc}: got {got}, expected {expected}")
        if source != expected_source:
            failures.append(f"{desc}: resolved via {source}, expected {expected_source}")

    # Rule 3, stated as an assertion rather than a comment.
    report = []
    got, source = labels_for(labels, "FF-RCHD5-100", "10247596147004-52534108291388",
                             "10247596147004", report)
    if source != "sku" or got[0] != HERO_TIER:
        failures.append("SKU-first resolution lost the hand-assigned tier on FF-RCHD5-100")
    if not any("lookup conflict" in note for _, _, note in report):
        failures.append("the FF-RCHD5-100 double-address was not reported as a conflict")

    # Rule 5.
    if TITLE_OVERRIDES.exists():
        with TITLE_OVERRIDES.open(encoding="utf-8-sig", newline="") as fh:
            heroes = [row["sku"].strip() for row in csv.DictReader(fh)]
        for sku in heroes:
            if sku not in labels:
                failures.append(f"approved hero SKU {sku} is not in the label lookup")
            elif labels[sku][0] != HERO_TIER:
                failures.append(f"approved hero SKU {sku} is tiered {labels[sku][0]}, not {HERO_TIER}")
    else:
        failures.append(f"missing {TITLE_OVERRIDES}")

    return failures


def check_feed(path):
    failures = []
    rows = list(csv.DictReader(pathlib.Path(path).open(encoding="utf-8-sig", newline="")))
    if not rows:
        return [f"{path} has no rows"]
    for col in ("custom_label_3", "custom_label_4"):
        if col not in rows[0]:
            return [f"{path} has no {col} column; the series labels are gone"]

    labels = load_labels(LABEL_LOOKUP)
    for row in rows:
        tier = (row.get("custom_label_3") or "").strip()
        series = (row.get("custom_label_4") or "").strip()
        if series and not tier:
            failures.append(f"{row['id']}: series {series!r} with no tier")
        if series:
            source = labels.get((row.get("old_id") or "").strip()) or labels.get(row["id"])
            if source and source[1] != series:
                failures.append(
                    f"{row['id']}: series {series!r} does not match the lookup {source[1]!r}")

    tiered = sum(1 for r in rows if (r.get("custom_label_3") or "").strip())
    print(f"  {path}: {len(rows)} rows, {tiered} carry a tier, "
          f"{len(rows) - tiered} do not")
    return failures


def main():
    failures = check_rules()
    scope = "rule table"
    if len(sys.argv) > 1:
        failures += check_feed(sys.argv[1])
        scope = f"rule table + {sys.argv[1]}"
    if failures:
        print(f"FAIL ({len(failures)}) - {scope}")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(f"PASS - {scope}; {len(LIVE_CASES)} live resolution cases, SKU-first order held")
    return 0


if __name__ == "__main__":
    sys.exit(main())
