#!/usr/bin/env python3
"""Build the corrected Matrixify Group C update/rollback CSVs.

The prior 58-row XLSX used the legacy/wide columns `Type` and
`Field: help_text`. Matrixify's current Metaobjects import expects the row-based
layout `Definition: Handle`, `Field`, and `Value`. This script converts the
already-approved 74-row update/rollback CSV pair, excludes the 16 records already
updated live, and writes an UPDATE-only 58-row pair.

No Shopify credentials or network access are used. Stdlib only.
"""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE_UPDATE = HERE / "optionhelp_REMAINING.csv"
SOURCE_ROLLBACK = HERE / "optionhelp_ROLLBACK.csv"
OUT_UPDATE = HERE / "groupC_REMAINING58_Matrixify_v2.csv"
OUT_ROLLBACK = HERE / "groupC_ROLLBACK58_Matrixify_v2.csv"

APPLIED_IDS = {
    "223151948092",
    "223153914172",
    "223155749180",
    "223156732220",
    "223157256508",
    "223157780796",
    "223158599996",
    "223158731068",
    "223159189820",
    "223159681340",
    "223159910716",
    "223160435004",
    "223160533308",
    "223160631612",
    "223161942332",
    "223161975100",
}

OLD_HANDLES = (
    "french-fitness-rack-rig-systems",
    "french-fitness-pre-configured-rigs",
    "french-fitness-rig-frame-pieces-customize-your-rig",
    "french-fitness-rig-attachments-accessories",
    "french-fitness-racks-w-rig-rack-attachment-compatibility",
)

SOURCE_COLUMNS = ["ID", "Handle", "Type", "Field: help_text"]
OUTPUT_COLUMNS = ["ID", "Handle", "Command", "Definition: Handle", "Field", "Value"]


def read_source(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != SOURCE_COLUMNS:
            raise ValueError(
                f"{path.name}: expected columns {SOURCE_COLUMNS!r}; got {reader.fieldnames!r}"
            )
        rows = list(reader)

    if len(rows) != 74:
        raise ValueError(f"{path.name}: expected 74 rows; got {len(rows)}")
    if len({row['ID'] for row in rows}) != 74:
        raise ValueError(f"{path.name}: duplicate ID")
    if len({row['Handle'] for row in rows}) != 74:
        raise ValueError(f"{path.name}: duplicate Handle")
    if any(row["Type"] != "product_option_help_text" for row in rows):
        raise ValueError(f"{path.name}: unexpected Type value")
    if any(not row["ID"].isdigit() for row in rows):
        raise ValueError(f"{path.name}: non-numeric ID")
    return rows


def convert(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    remaining = [row for row in rows if row["ID"] not in APPLIED_IDS]
    if len(remaining) != 58:
        raise ValueError(f"Expected 58 remaining rows; got {len(remaining)}")

    return [
        {
            "ID": row["ID"],
            "Handle": row["Handle"],
            "Command": "UPDATE",
            "Definition: Handle": "product_option_help_text",
            "Field": "help_text",
            "Value": row["Field: help_text"],
        }
        for row in remaining
    ]


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=OUTPUT_COLUMNS,
            quoting=csv.QUOTE_ALL,
            lineterminator="\r\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    update_source = read_source(SOURCE_UPDATE)
    rollback_source = read_source(SOURCE_ROLLBACK)

    update_identity = [(row["ID"], row["Handle"]) for row in update_source]
    rollback_identity = [(row["ID"], row["Handle"]) for row in rollback_source]
    if update_identity != rollback_identity:
        raise ValueError("Approved update and rollback identities/order do not match")
    if not APPLIED_IDS.issubset({row["ID"] for row in update_source}):
        raise ValueError("One or more already-applied IDs are absent from the 74-row source")

    update = convert(update_source)
    rollback = convert(rollback_source)
    if [(r["ID"], r["Handle"]) for r in update] != [
        (r["ID"], r["Handle"]) for r in rollback
    ]:
        raise ValueError("58-row update and rollback identities/order do not match")

    update_old_refs = sum(
        row["Value"].count(handle) for row in update for handle in OLD_HANDLES
    )
    rollback_old_refs = sum(
        row["Value"].count(handle) for row in rollback for handle in OLD_HANDLES
    )
    if update_old_refs != 0:
        raise ValueError(f"Update output still contains {update_old_refs} obsolete references")
    if rollback_old_refs != 123:
        raise ValueError(
            f"Rollback reference count changed: expected 123, got {rollback_old_refs}"
        )

    write_csv(OUT_UPDATE, update)
    write_csv(OUT_ROLLBACK, rollback)

    print(f"PASS: {OUT_UPDATE.name}: 58 UPDATE-only rows; sha256={sha256(OUT_UPDATE)}")
    print(f"PASS: {OUT_ROLLBACK.name}: 58 rollback rows; sha256={sha256(OUT_ROLLBACK)}")
    print("Required Matrixify dry run: 58 updates / 0 new / 0 deletes / 0 failed / 0 unknown columns")


if __name__ == "__main__":
    main()
