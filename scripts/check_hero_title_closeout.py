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
Exit 0 = 10/10, safe to send the closeout.
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

        problems = []
        if row["observed_title_matches"].strip().lower() != "yes":
            problems.append("title does not match the approved string")
        for col, label in (("custom_label_3", "priority tier"), ("custom_label_4", "series")):
            want, got = row[f"expected_{col}"], row[f"observed_{col}"].strip()
            if got != want:
                problems.append(f"{label} is {got or 'blank'!r}, expected {want!r}")
        if row["item_status"].strip() != "Approved":
            problems.append(f"item status is {row['item_status'].strip() or 'blank'}, expected Approved")
        na = row["needs_attention_count"].strip()
        if na != "0":
            problems.append(f"Needs attention is {na or 'blank'}, expected 0")

        if problems:
            exceptions.append(f"{sku}: " + "; ".join(problems))
        else:
            passed.append(sku)

    for sku in [r["sku"] for r in rows]:
        state = "PASS" if sku in passed else ("NOT CHECKED" if sku in unchecked else "EXCEPTION")
        print(f"{sku:<11} {state}")

    print()
    if unchecked:
        print(f"INCOMPLETE - {len(unchecked)} of 10 not yet checked in Merchant Center: "
              + ", ".join(unchecked))
        return 2
    if exceptions:
        print(f"EXCEPTIONS - {len(passed)}/10 clean:")
        for e in exceptions:
            print(f"  - {e}")
        return 1
    print("10/10 - all ten titles live, both label columns intact, all Approved, "
          "Needs attention 0 on every one.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
