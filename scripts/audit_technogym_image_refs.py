#!/usr/bin/env python3
"""Inventory Technogym-related image references in a Shopify theme checkout.

This script is read-only. It scans text-based theme files and writes a CSV
that can be attached to the legal/IP remediation record. It does not contact
Shopify, delete assets, rewrite files, or publish a theme.

Example:
    python scripts/audit_technogym_image_refs.py \
        --root . \
        --output technogym-theme-asset-audit.csv
"""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator


TEXT_EXTENSIONS = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".liquid",
    ".md",
    ".scss",
    ".txt",
}

DEFAULT_EXCLUDES = {
    ".git",
    ".idea",
    ".shopify",
    ".vscode",
    "node_modules",
    "vendor",
}

ASSET_PATTERN = re.compile(
    r"(?:shopify://shop_images/|https://cdn\.shopify\.com/)[^\"'\s)>,]+",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Finding:
    path: str
    line_number: int
    match_type: str
    asset_reference: str
    context: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scan a Shopify theme for Technogym-related brand and image "
            "references and export a review CSV."
        )
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path.cwd(),
        help="Theme checkout root. Defaults to the current directory.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("technogym-theme-asset-audit.csv"),
        help="CSV output path.",
    )
    parser.add_argument(
        "--brand",
        default="Technogym",
        help="Case-insensitive brand token to scan for. Defaults to Technogym.",
    )
    parser.add_argument(
        "--context-lines",
        type=int,
        default=1,
        help="Number of surrounding lines to include in each finding.",
    )
    return parser.parse_args()


def iter_theme_files(root: Path) -> Iterator[Path]:
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        if any(part in DEFAULT_EXCLUDES for part in path.parts):
            continue
        yield path


def compact_context(lines: list[str], index: int, radius: int) -> str:
    start = max(0, index - radius)
    end = min(len(lines), index + radius + 1)
    selected = [line.strip() for line in lines[start:end] if line.strip()]
    return " | ".join(selected)[:1200]


def scan_file(path: Path, root: Path, brand_pattern: re.Pattern[str], radius: int) -> Iterable[Finding]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        print(f"WARN: could not read {path}: {exc}")
        return []

    lines = text.splitlines()
    relative_path = str(path.relative_to(root))
    findings: list[Finding] = []

    for index, line in enumerate(lines):
        assets = ASSET_PATTERN.findall(line)
        brand_found = bool(brand_pattern.search(line))
        relevant_assets = [asset for asset in assets if brand_pattern.search(asset)]

        if brand_found:
            findings.append(
                Finding(
                    path=relative_path,
                    line_number=index + 1,
                    match_type="brand_reference",
                    asset_reference="; ".join(assets),
                    context=compact_context(lines, index, radius),
                )
            )

        for asset in relevant_assets:
            findings.append(
                Finding(
                    path=relative_path,
                    line_number=index + 1,
                    match_type="asset_filename",
                    asset_reference=asset,
                    context=compact_context(lines, index, radius),
                )
            )

    return findings


def deduplicate(findings: Iterable[Finding]) -> list[Finding]:
    unique: dict[tuple[str, int, str, str], Finding] = {}
    for finding in findings:
        key = (
            finding.path,
            finding.line_number,
            finding.match_type,
            finding.asset_reference,
        )
        unique[key] = finding
    return sorted(
        unique.values(),
        key=lambda item: (item.path.lower(), item.line_number, item.match_type),
    )


def write_csv(path: Path, findings: list[Finding]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "path",
                "line_number",
                "match_type",
                "asset_reference",
                "context",
                "provenance_status",
                "recommended_action",
                "review_owner",
                "approval_status",
            ],
        )
        writer.writeheader()
        for finding in findings:
            writer.writerow(
                {
                    "path": finding.path,
                    "line_number": finding.line_number,
                    "match_type": finding.match_type,
                    "asset_reference": finding.asset_reference,
                    "context": finding.context,
                    "provenance_status": "UNVERIFIED",
                    "recommended_action": "PRESERVE THEN REVIEW / REPLACE IF UNLICENSED",
                    "review_owner": "",
                    "approval_status": "PENDING TIM / COUNSEL AS APPLICABLE",
                }
            )


def main() -> int:
    args = parse_args()
    root = args.root.expanduser().resolve()
    output = args.output.expanduser()
    if not output.is_absolute():
        output = root / output

    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Theme root is not a directory: {root}")
    if args.context_lines < 0:
        raise SystemExit("--context-lines must be zero or greater")

    brand_pattern = re.compile(re.escape(args.brand), re.IGNORECASE)
    collected: list[Finding] = []

    for theme_file in iter_theme_files(root):
        collected.extend(
            scan_file(theme_file, root, brand_pattern, args.context_lines)
        )

    findings = deduplicate(collected)
    write_csv(output, findings)

    print(f"Scanned root: {root}")
    print(f"Findings: {len(findings)}")
    print(f"CSV: {output}")
    print("No theme files or Shopify assets were modified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
