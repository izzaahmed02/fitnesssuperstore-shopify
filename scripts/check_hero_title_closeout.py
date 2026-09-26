#!/usr/bin/env python3
"""Closeout gate for the 10 approved hero-SKU feed titles.

check_hero_titles.py validates the approved strings. This script validates the
*observed* Merchant Center state recorded in
feeds/hero-title-closeout-checklist.csv against what the approval and the v2
label lookup say it should be, and prints a 10/10 line or the exact exceptions
so the closeout reply to Tim is generated rather than hand-written.

Fill the observed_* columns from GMC > Products > each offer id:
  observed_title_matches    yes | no
  observed_custom_label_3   the value shown in raw data source attributes
  observed_custom_label_4   the value shown in raw data source attributes
  item_status               Approved | Disapproved | Pending | Expiring
  needs_attention_count     integer

Expected label values come from supplemental_priority_labels_v2.csv, the file
Tim issued on 2026-09-08. The title supplemental carries only id and title, so
any drift in these two columns means something other than this work touched v2.

Run: python3 scripts/check_hero_title_closeout.py
Exit 0 = 10/10 on both. Exit 1 separates a retitle exception (a title or a
label is wrong) from a serving exception (the item is not Approved, or carries
Needs attention), because a title-only supplemental cannot cause the second.
"""
import csv
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHECKLIST = ROOT / "feeds" / "hero-title-closeout-checklist.csv"
OVERRIDES = ROOT / "feeds" / "hero-title-overrides.csv"


def main() -> int:
    approved = {r["sku"]: r["title"] for r in csv.DictReader(OVERRIDES.open(encoding="utf-8"))}
    rows = list(csv.DictReader(CHECKLIST.open(encoding="utf-8")))

    exceptions: list[str] = []
    serving: list[str] = []
    unchecked: list[str] = []
    passed: list[str] = []

    if len(rows) != 10:
        exceptions.append(f"checklist has {len(rows)} rows, expected 10")

    for row in rows:
        sku = row["sku"]

        # The checklist must not drift from the approved table.
        if approved.get(sku) != row["expected_title"]:
            exceptions.append(f"{sku}: checklist expected_title does not match the approved table")

        observed = [row["observed_title_matches"], row["observed_custom_label_3"],
                    row["observed_custom_label_4"], row["item_status"], row["needs_attention_count"]]
        if not any(v.strip() for v in observed):
            unchecked.append(sku)
            continue

        # The retitle itself and the item's serving state are reported separately.
        # A title lands or it does not; a Limited item is a different problem that
        # this work cannot cause, and conflating the two hides which is which.
        retitle_problems = []
        if row["observed_title_matches"].strip().lower() != "yes":
            retitle_problems.append("title does not match the approved string")
        for col, label in (("custom_label_3", "priority tier"), ("custom_label_4", "series")):
            want, got = row[f"expected_{col}"], row[f"observed_{col}"].strip()
            if got != want:
                retitle_problems.append(f"{label} is {repr(got) if got else 'blank'}, expected {want!r}")

        serving_problems = []
        if row["item_status"].strip() != "Approved":
            serving_problems.append(
                f"item status is {row['item_status'].strip() or 'blank'}, expected Approved")
        na = row["needs_attention_count"].strip()
        if na != "0":
            serving_problems.append(f"Needs attention is {na or 'blank'}, expected 0")

        if retitle_problems:
            exceptions.append(f"{sku}: " + "; ".join(retitle_problems))
        if serving_problems:
            serving.append(f"{sku}: " + "; ".join(serving_problems))
        if not retitle_problems and not serving_problems:
            passed.append(sku)

    retitle_failed = {e.split(":")[0] for e in exceptions}
    serving_failed = {s.split(":")[0] for s in serving}

    for sku in [r["sku"] for r in rows]:
        if sku in unchecked:
            state = "NOT CHECKED"
        elif sku in retitle_failed:
            state = "RETITLE EXCEPTION"
        elif sku in serving_failed:
            state = "retitle ok, serving exception"
        else:
            state = "PASS"
        print(f"{sku:<11} {state}")

    print()
    if unchecked:
        print(f"INCOMPLETE - {len(unchecked)} of 10 not yet checked in Merchant Center: "
              + ", ".join(unchecked))
        return 2

    clean_retitles = len(rows) - len(retitle_failed)
    if exceptions:
        print(f"RETITLE - {clean_retitles}/10 clean:")
        for e in exceptions:
            print(f"  - {e}")
    else:
        print(f"RETITLE - {clean_retitles}/10. Every approved title live, "
              "both label columns intact on all ten.")

    if serving:
        print()
        print(f"SERVING STATE - {len(rows) - len(serving_failed)}/10 Approved with "
              "Needs attention 0. Not caused by a title-only supplemental, so read the "
              "Needs attention tab on each before attributing it to this work:")
        for s in serving:
            print(f"  - {s}")

    return 1 if (exceptions or serving) else 0


if __name__ == "__main__":
    sys.exit(main())
