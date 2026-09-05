#!/usr/bin/env python3
"""Build the Klaviyo hosted custom-catalog feed from a Shopify Admin bulk export.

Offline only. Reads a Shopify bulk-operation JSONL file and emits the hosted-feed
JSON candidate, a variant-level review CSV, an exceptions CSV, the emitted-id list
and a validation/hash report. No network calls, no Klaviyo key, no writes to
Shopify or Klaviyo.

Scope: every active, published product in the export, one feed item per variant
(Klaviyo hosted custom feeds treat variants as separate items). Feed ids are the
legacy variant SKUs.

Usage:
    python3 build_klaviyo_feed.py --jsonl <bulk.jsonl> --out ./out [--min-items N]
"""

import argparse
import csv
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

# Rubber Coated Hex Dumbbell SKUs exist twice in Shopify: once as standalone
# single-SKU products and once as variants of this multi-variant parent. Both
# versions stay live on the site; the duplication is resolved in the feed only.
# Per the 2026-09-05 decision the parent's variant row wins and the standalone
# row is dropped, so all 45 SKUs reach the feed exactly once.
PREFERRED_PARENT_PRODUCT_IDS = {
    "gid://shopify/Product/10247596147004",  # French Fitness Rubber Coated Hex Dumbbell (New)
}

DUPLICATE_PARENT_PREFERRED = "duplicate_sku_parent_preferred"

# Fields the source 24138 mapping requires. A blank risks an item-level sync
# failure, so a blank excludes the row instead of merely warning. Verified
# against the live catalog: all 3,221 items carry product_type and
# product_category populated, while upc, mpn and condition are blank on some.
REQUIRED_MAPPED_FIELDS = ("description", "product_type", "product_category")

# Gift certificates are not products and are absent from the current catalog.
# They must not enter a product-recommendation feed.
GIFT_CERTIFICATE_SKU_PREFIX = "GFT-"


def is_gift_certificate(row):
    return row["id"].upper().startswith(GIFT_CERTIFICATE_SKU_PREFIX) or (
        "gift certificate" in row["title"].lower()
    )

# Feed keys, in the order the existing source 24138 mapping consumes them.
FEED_KEYS = [
    "id",
    "title",
    "description",
    "link",
    "image_link",
    "price",
    "availability",
    "condition",
    "mpn",
    "upc",
    "sku",
    "product_type",
    "product_category",
    "inventory_quantity",
    "inventory_policy",
    "published",
]

TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def plain_text(value):
    """Collapse HTML/whitespace the way the legacy feed stored descriptions."""
    if not value:
        return ""
    return WS_RE.sub(" ", TAG_RE.sub(" ", value)).strip()


def mf(node, key):
    """Read one aliased single-metafield selection from the bulk export."""
    field = node.get(key)
    if not field:
        return ""
    return (field.get("value") or "").strip()


def load_bulk_jsonl(path):
    """Return (products, variants_by_parent, malformed_lines).

    Shopify emits one JSON object per line; nested connection nodes carry
    __parentId pointing at the product they belong to.
    """
    products = {}
    variants = defaultdict(list)
    malformed = 0

    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                node = json.loads(line)
            except json.JSONDecodeError:
                malformed += 1
                continue

            gid = node.get("id", "")
            if "/ProductVariant/" in gid:
                variants[node.get("__parentId", "")].append(node)
            elif "/Product/" in gid:
                products[gid] = node
            else:
                malformed += 1

    return products, variants, malformed


def availability_of(variant):
    """Legacy feed wording for stock state, derived from Admin data only."""
    quantity = variant.get("inventoryQuantity")
    policy = (variant.get("inventoryPolicy") or "").upper()
    if variant.get("availableForSale"):
        if policy == "CONTINUE" and isinstance(quantity, int) and quantity <= 0:
            return "Backorder"
        return "In Stock"
    return "Out of Stock"


def product_type_of(product):
    """Legacy breadcrumb-style category path.

    Rebuilt from the curated custom.main_category / custom.sub_category
    metafields, which are the Shopify-side successors of the legacy path.
    """
    parts = [mf(product, "mf_main_category"), mf(product, "mf_sub_category")]
    return " > ".join(part for part in parts if part)


def product_category_of(product):
    """Shopify Standard Product Taxonomy full name."""
    category = product.get("category") or {}
    return (category.get("fullName") or "").strip()


def image_of(product, variant):
    image = variant.get("image") or {}
    url = (image.get("url") or "").strip()
    if url:
        return url
    media = (product.get("featuredMedia") or {}).get("preview") or {}
    return ((media.get("image") or {}).get("url") or "").strip()


def link_of(product, variant=None, variant_count=1):
    """Product PDP, deep-linked to the variant when the product has several.

    A variant-level feed needs one distinct link per row; without the variant
    parameter every variant of a product would share the parent's URL and land
    the reader on whichever variant Shopify defaults to.
    """
    url = mf(product, "mf_canonical") or (product.get("onlineStoreUrl") or "").strip()
    if not url or variant_count <= 1 or not variant:
        return url

    variant_id = (variant.get("id") or "").rsplit("/", 1)[-1]
    if not variant_id.isdigit():
        return url
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}variant={variant_id}"


def build_row(product, variant, legacy_taxonomy=None, variant_count=1):
    sku = (variant.get("sku") or "").strip()
    price_raw = variant.get("price")
    try:
        price = float(price_raw)
    except (TypeError, ValueError):
        price = None

    condition = mf(product, "mf_condition").lower()
    upc = mf(product, "mf_upc")
    mpn = mf(product, "mf_mpn") or mf(product, "mf_product_code") or sku

    # product_type and product_category are the only two fields whose wording the
    # legacy feed owns rather than Shopify. Carry the live catalog's strings
    # forward where we have them so the mapping and downstream category filters
    # keep working; fall back to Shopify-derived values for new SKUs.
    legacy = (legacy_taxonomy or {}).get(sku) or {}
    product_type = legacy.get("product_type") or product_type_of(product)
    product_category = legacy.get("product_category") or product_category_of(product)
    taxonomy_source = "legacy_carry_forward" if legacy.get("product_type") else "shopify_derived"

    return {
        "id": sku,
        "title": product.get("title") or "",
        "description": plain_text(product.get("description")),
        "link": link_of(product, variant, variant_count),
        "image_link": image_of(product, variant),
        "price": price,
        "availability": availability_of(variant),
        "condition": condition,
        "mpn": mpn,
        "upc": upc,
        "sku": sku,
        "product_type": product_type,
        "product_category": product_category,
        "inventory_quantity": variant.get("inventoryQuantity"),
        "inventory_policy": 0 if (variant.get("inventoryPolicy") or "").upper() == "DENY" else 1,
        "published": True,
        # Provenance, carried in the review CSV only — not part of the feed payload.
        "_shopify_product_id": product.get("id", ""),
        "_shopify_variant_id": variant.get("id", ""),
        "_variant_title": variant.get("title") or "",
        "_product_status": product.get("status") or "",
        "_compare_at_price": variant.get("compareAtPrice"),
        "_barcode": variant.get("barcode") or "",
        "_taxonomy_source": taxonomy_source,
    }


def resolve_duplicates(candidates, sku_counts):
    """Decide, deterministically, which row wins for each duplicated SKU.

    A SKU carried both by a standalone product and by a preferred multi-variant
    parent resolves to the parent's variant row; the standalone row is dropped.
    Duplicates that do not involve a preferred parent are left unresolved so
    they surface as an unexpected identity problem instead of being absorbed.

    Mutates each row's `_dup_resolution` in place.
    """
    by_sku = defaultdict(list)
    for row in candidates:
        row["_dup_resolution"] = ""
        if row["id"] and sku_counts[row["id"]] > 1:
            by_sku[row["id"]].append(row)

    for rows in by_sku.values():
        preferred = [r for r in rows if r["_shopify_product_id"] in PREFERRED_PARENT_PRODUCT_IDS]
        # Exactly one parent claim is required; zero or several is not resolvable.
        if len(preferred) != 1:
            continue
        for row in rows:
            row["_dup_resolution"] = "preferred" if row is preferred[0] else "dropped"


def classify(row, sku_counts):
    """Return (blocking_reasons, warning_reasons) for one candidate row.

    Blocking reasons keep the row out of the feed. Warnings are emitted but
    reported so every exception line stays individually explainable.
    """
    blocking = []
    warnings = []
    sku = row["id"]

    if not sku:
        blocking.append("BLANK_SKU")
    elif sku_counts[sku] > 1:
        resolution = row.get("_dup_resolution")
        if resolution == "dropped":
            blocking.append(DUPLICATE_PARENT_PREFERRED)
        elif resolution != "preferred":
            blocking.append("DUPLICATE_SKU_UNEXPECTED")

    if row["price"] is None:
        blocking.append("UNPARSEABLE_PRICE")
    elif row["price"] <= 0:
        blocking.append("ZERO_OR_NEGATIVE_PRICE")

    if not row["link"]:
        blocking.append("MISSING_PRODUCT_URL")
    if not row["image_link"]:
        blocking.append("MISSING_IMAGE")

    if is_gift_certificate(row):
        blocking.append("GIFT_CERTIFICATE")

    # description, product_type and product_category are required by the source
    # 24138 mapping, so a blank would risk an item-level sync failure. All 3,221
    # items in the live catalog carry both taxonomy fields populated, which is
    # consistent with that. Exclude rather than gamble at cutover.
    for field in REQUIRED_MAPPED_FIELDS:
        if not row[field]:
            blocking.append(f"BLANK_REQUIRED_FIELD_{field.upper()}")

    # upc, condition and mpn are demonstrably optional: the live catalog holds
    # items with those blank today, so a blank is reported but not excluded.
    if not row["upc"]:
        warnings.append("BLANK_UPC")
    if not row["condition"]:
        warnings.append("BLANK_CONDITION")

    return blocking, warnings


def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_csv(path, fieldnames, rows):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jsonl", required=True, help="Shopify bulk-operation JSONL export")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument(
        "--min-items",
        type=int,
        default=3000,
        help="Minimum-count guard; a feed smaller than this fails reconciliation",
    )
    parser.add_argument(
        "--legacy-taxonomy",
        help=(
            "JSON map of legacy SKU -> {product_type, product_category}, taken from a "
            "read-only pull of the current catalog. Preserves the legacy wording of "
            "those two fields; without it both are derived from Shopify instead."
        ),
    )
    args = parser.parse_args(argv)

    os.makedirs(args.out, exist_ok=True)

    legacy_taxonomy = {}
    if args.legacy_taxonomy:
        with open(args.legacy_taxonomy, "r", encoding="utf-8") as handle:
            legacy_taxonomy = json.load(handle)

    products, variants_by_parent, malformed = load_bulk_jsonl(args.jsonl)

    candidates = []
    products_without_variants = []
    for gid, product in products.items():
        variants = variants_by_parent.get(gid, [])
        if not variants:
            products_without_variants.append(gid)
            continue
        for variant in variants:
            candidates.append(build_row(product, variant, legacy_taxonomy, len(variants)))

    sku_counts = Counter(row["id"] for row in candidates if row["id"])
    resolve_duplicates(candidates, sku_counts)

    feed = []
    exceptions = []
    review = []
    for row in candidates:
        blocking, warnings = classify(row, sku_counts)
        emitted = not blocking
        review.append(dict(row, _emitted=emitted, _reasons=";".join(blocking + warnings)))
        if blocking or warnings:
            exceptions.append(
                {
                    "sku": row["id"],
                    "shopify_product_id": row["_shopify_product_id"],
                    "shopify_variant_id": row["_shopify_variant_id"],
                    "title": row["title"],
                    "variant_title": row["_variant_title"],
                    "price": row["price"],
                    "disposition": "EXCLUDED" if blocking else "EMITTED_WITH_WARNING",
                    "reasons": ";".join(blocking + warnings),
                }
            )
        if emitted:
            feed.append({key: row[key] for key in FEED_KEYS})

    emitted_ids = [item["id"] for item in feed]
    duplicate_emitted = sorted(sku for sku, count in Counter(emitted_ids).items() if count > 1)

    feed_path = os.path.join(args.out, "klaviyo_feed.json")
    with open(feed_path, "w", encoding="utf-8") as handle:
        json.dump(feed, handle, ensure_ascii=False, indent=1)
        handle.write("\n")

    review_path = os.path.join(args.out, "review.csv")
    write_csv(
        review_path,
        FEED_KEYS
        + [
            "_shopify_product_id",
            "_shopify_variant_id",
            "_variant_title",
            "_product_status",
            "_compare_at_price",
            "_barcode",
            "_taxonomy_source",
            "_dup_resolution",
            "_emitted",
            "_reasons",
        ],
        review,
    )

    exceptions_path = os.path.join(args.out, "exceptions.csv")
    write_csv(
        exceptions_path,
        [
            "sku",
            "shopify_product_id",
            "shopify_variant_id",
            "title",
            "variant_title",
            "price",
            "disposition",
            "reasons",
        ],
        exceptions,
    )

    ids_path = os.path.join(args.out, "emitted_ids.txt")
    with open(ids_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(emitted_ids))
        handle.write("\n")

    excluded = [row for row in exceptions if row["disposition"] == "EXCLUDED"]

    # Every excluded duplicate has to be individually explainable, so record which
    # Shopify records each duplicated SKU is claimed by.
    duplicated_skus = sorted(sku for sku, count in sku_counts.items() if count > 1)
    duplicate_owners = defaultdict(set)
    for row in candidates:
        if row["id"] in sku_counts and sku_counts[row["id"]] > 1:
            duplicate_owners[row["id"]].add(
                (row["_shopify_product_id"], row["title"], row["_variant_title"])
            )
    duplicate_parents = Counter()
    for owners in duplicate_owners.values():
        for product_id, title, _ in owners:
            duplicate_parents[f"{product_id} | {title}"] += 1

    blank_sku_rows = [
        {
            "shopify_product_id": row["_shopify_product_id"],
            "shopify_variant_id": row["_shopify_variant_id"],
            "title": row["title"],
            "variant_title": row["_variant_title"],
            "price": row["price"],
        }
        for row in candidates
        if not row["id"]
    ]
    reason_counts = Counter()
    for row in exceptions:
        for reason in row["reasons"].split(";"):
            if reason:
                reason_counts[reason] += 1

    accounted = len(feed) + len(excluded)
    reconciliation_clean = (
        malformed == 0
        and not products_without_variants
        and accounted == len(candidates)
        and not duplicate_emitted
        and len(feed) >= args.min_items
    )

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "input": {
            "jsonl": os.path.abspath(args.jsonl),
            "bytes": os.path.getsize(args.jsonl),
            "sha256": sha256_of(args.jsonl),
            "malformed_lines": malformed,
        },
        "scope": "Shopify Admin, active + published products, one feed item per variant",
        "counts": {
            "products": len(products),
            "products_without_variants": len(products_without_variants),
            "variant_rows": len(candidates),
            "emitted": len(feed),
            "excluded": len(excluded),
            "emitted_with_warning": len(exceptions) - len(excluded),
            "accounted": accounted,
        },
        "exception_reason_counts": dict(sorted(reason_counts.items())),
        "taxonomy_source_counts": dict(
            Counter(row["_taxonomy_source"] for row in review if row["_emitted"])
        ),
        "duplicate_emitted_ids": duplicate_emitted,
        "duplicate_sku_analysis": {
            "distinct_duplicated_skus": len(duplicated_skus),
            "excluded_rows": sum(sku_counts[sku] for sku in duplicated_skus),
            "resolved_parent_preferred": sorted(
                sku
                for sku in duplicated_skus
                if any(
                    r["id"] == sku and r["_dup_resolution"] == "preferred" for r in candidates
                )
            ),
            "unresolved": sorted(
                sku
                for sku in duplicated_skus
                if not any(
                    r["id"] == sku and r["_dup_resolution"] == "preferred" for r in candidates
                )
            ),
            "claiming_shopify_products": dict(duplicate_parents.most_common()),
        },
        "blank_sku_rows": blank_sku_rows,
        "min_items_guard": args.min_items,
        "reconciliation_clean": reconciliation_clean,
        "outputs": {
            os.path.basename(path): {"bytes": os.path.getsize(path), "sha256": sha256_of(path)}
            for path in (feed_path, review_path, exceptions_path, ids_path)
        },
        "boundaries": [
            "read-only: no Shopify write, no Klaviyo write, no source URL change",
            "Admin base prices preserved verbatim; no promotional discount inferred",
            "no credentials, API keys or signed URLs recorded in any output",
        ],
    }

    report_path = os.path.join(args.out, "build_report.json")
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report["counts"], indent=2))
    print("reconciliation_clean:", reconciliation_clean)
    return 0 if reconciliation_clean else 1


if __name__ == "__main__":
    sys.exit(main())
