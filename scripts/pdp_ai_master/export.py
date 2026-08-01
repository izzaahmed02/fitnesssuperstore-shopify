#!/usr/bin/env python3
"""FSS PDP AI Master - V5 read-only export harness.

Produces the seven-file V5 package for the approved P0/P1 sample:

    sample.jsonl                      durable record per product, AI-consumable
    sample_with_overlay_PREVIEW.jsonl same records + REV9 overlay, unapproved
    overlay_preview_join.csv          per-SKU match + governance flags + gate
    unmatched_conflict_report.csv     every conflict, visible not resolved
    manifest.json                     run provenance + sha256 per output
    field_source_matrix_V5.csv        field -> source classification
    README_P0P1_sample.md             walkthrough for reviewers

Design rules this harness enforces, not just documents:

  * Read-only. No mutation path exists (see guardrails.py). Verified before
    the first HTTP request.
  * Shopify is the only factual source. Nothing is seeded from the starter
    CSV, so seed_origin_flag is false because it was never populated.
  * Durable vs volatile is structural. Volatile fields live under
    `volatile_live_fetch_required` and carry embed_ok=false. Nothing there is
    ever written into the durable block AI embeds.
  * cost is internal-only and is stripped from every non-internal artifact.
  * Conflicts stay visible. Nothing is silently normalised.
  * A partial run is reported as PARTIAL and exits non-zero. It still emits
    the package so reviewers can see how far it got.

Usage
-----
Live run against Shopify Admin GraphQL (read-only):

    export SHOPIFY_SHOP=fitness-superstore.myshopify.com
    export SHOPIFY_ADMIN_TOKEN=shpat_...          # read scopes only
    python3 scripts/pdp_ai_master/export.py --out out/run_$(date -u +%Y%m%dT%H%M%SZ)

Replay from captured GraphQL responses (no network, byte-identical output):

    python3 scripts/pdp_ai_master/export.py \
        --from-capture captures/2026-07-29 \
        --out out/run_2026-07-29

Attach the REV9 overlay as a preview only:

    ... --overlay path/to/Product_Recommendation_Matrix_REV9_*.csv

Required Shopify scopes: read_products, read_metaobjects, read_inventory.
Nothing else, and no write scope. That set was established by validating the
exact shipped query against the 2026-07 schema, not by assumption.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from guardrails import (  # noqa: E402
    VOLATILE_FIELDS,
    ReadOnlyViolation,
    assert_no_seed_input,
    assert_read_only,
    scrub_internal,
)

HERE = Path(__file__).resolve().parent
API_VERSION = "2026-07"
SCHEMA_VERSION = "V5"

# Least-privilege scope set, established by validating the exact shipped
# query against the 2026-07 schema rather than by assumption. Do not widen
# this without re-validating - see the scope note in
# queries/product_v5.graphql, which explains why `media` is not used.
REQUIRED_SCOPES = ("read_products", "read_metaobjects", "read_inventory")

# Inventory at or above this is a placeholder buffer, not stock on hand.
PLACEHOLDER_INVENTORY_FLOOR = 9000

# Implied discount at or above this is the pattern Google called deception in
# the "Save 40%" cleanup.
DISCOUNT_RISK_THRESHOLD = 0.40

# Third-party brands. Used only to detect competitor naming inside authored
# comparison charts so it can be routed for approval.
THIRD_PARTY_BRANDS = (
    "Rogue", "Titan", "REP Fitness", "Sorinex", "Eleiko", "Technogym",
    "Hammer Strength", "Nautilus", "Matrix", "Life Fitness", "Precor",
    "Cybex", "Stairmaster", "Woodway", "Body-Solid", "PowerBlock",
)

# Warranty phrasing that asserts coverage without stating terms. We cannot
# repeat these as fact.
UNVERIFIABLE_WARRANTY = re.compile(
    r"full\s+manufacturer|manufacturer'?s?\s+warranty\s*$|full\s+warranty",
    re.IGNORECASE,
)

# Zero-width and bidi control characters. Present as a leading U+200B on most
# warranty values in the sample. Reported rather than stripped, per the rule
# that nothing is silently normalised.
INVISIBLE_CHARS = re.compile(r"[​-‏  ﻿]")


# --------------------------------------------------------------------------
# transport
# --------------------------------------------------------------------------

class AdminClient:
    """Minimal read-only Admin GraphQL client.

    There is deliberately no `mutate()` method. The only way to send a
    document is through `query()`, which re-asserts read-only every call.
    """

    def __init__(self, shop: str, token: str) -> None:
        self.endpoint = f"https://{shop}/admin/api/{API_VERSION}/graphql.json"
        self._token = token
        self.request_count = 0

    def query(self, document: str, variables: dict[str, Any]) -> dict[str, Any]:
        assert_read_only(document, "AdminClient.query")
        payload = json.dumps({"query": document, "variables": variables}).encode()
        req = urllib.request.Request(
            self.endpoint,
            data=payload,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": self._token,
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode())
        self.request_count += 1
        if body.get("errors"):
            raise RuntimeError(f"GraphQL errors: {body['errors']}")
        return body["data"]


class CaptureClient:
    """Replays captured responses. Same interface, no network."""

    def __init__(self, capture_dir: Path) -> None:
        self.dir = capture_dir
        self.request_count = 0

    def query(self, document: str, variables: dict[str, Any]) -> dict[str, Any]:
        assert_read_only(document, "CaptureClient.query")
        pid = str(variables["id"]).rsplit("/", 1)[-1]
        path = self.dir / f"product_{pid}.json"
        if not path.exists():
            raise FileNotFoundError(f"no capture for product {pid} at {path}")
        self.request_count += 1
        blob = json.loads(path.read_text())
        return blob.get("data", blob)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def gid_num(gid: str | None) -> str | None:
    return gid.rsplit("/", 1)[-1] if gid else None


def index_metafields(*connections: dict[str, Any] | None) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for conn in connections:
        for node in (conn or {}).get("nodes", []) or []:
            out[node["key"]] = node
    return out


def mf_value(mfs: dict[str, dict], key: str) -> Any:
    node = mfs.get(key)
    return node.get("value") if node else None


def metaobject_fields(node: dict | None) -> dict[str, Any]:
    """Flatten a resolved metaobject into {field_key: value}."""
    if not node:
        return {}
    return {f["key"]: f.get("value") for f in node.get("fields", []) or []}


def resolve_metaobject(mfs: dict[str, dict], key: str) -> dict[str, Any]:
    node = mfs.get(key) or {}
    return metaobject_fields(node.get("reference"))


def resolve_metaobject_list(mfs: dict[str, dict], key: str) -> list[dict[str, Any]]:
    node = mfs.get(key) or {}
    refs = (node.get("references") or {}).get("nodes") or []
    out = []
    for ref in refs:
        if ref.get("type"):
            out.append(
                {
                    "id": gid_num(ref.get("id")),
                    "handle": ref.get("handle"),
                    "type": ref.get("type"),
                    "fields": metaobject_fields(ref),
                }
            )
    return out


def resolve_product_refs(mfs: dict[str, dict], key: str) -> list[dict[str, str]]:
    node = mfs.get(key) or {}
    refs = (node.get("references") or {}).get("nodes") or []
    return [
        {"id": gid_num(r.get("id")), "handle": r.get("handle"), "title": r.get("title")}
        for r in refs
        if r.get("handle")
    ]


def strip_html(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text)


def rich_text_to_plain(value: str | None) -> str:
    """Shopify rich_text_field is a JSON tree. Flatten it to readable text."""
    if not value:
        return ""
    try:
        tree = json.loads(value)
    except (ValueError, TypeError):
        return str(value)

    chunks: list[str] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if node.get("type") == "text" and node.get("value"):
                chunks.append(node["value"])
            for child in node.get("children", []) or []:
                walk(child)
        elif isinstance(node, list):
            for child in node:
                walk(child)

    walk(tree)
    return " ".join(chunks).strip()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


# --------------------------------------------------------------------------
# normalisation
# --------------------------------------------------------------------------

def build_record(product: dict[str, Any], run_ts: str) -> dict[str, Any]:
    """Map one Shopify product onto the V5 record shape."""
    mfs = index_metafields(
        product.get("customFields"),
        product.get("optionFields"),
        product.get("googleFields"),
        product.get("reviewFields"),
    )
    specs = resolve_metaobject(mfs, "features_specs")
    extra = resolve_metaobject(mfs, "extra_info")
    downloads = resolve_metaobject(mfs, "downloads_other_info")

    attr_key = next(
        (k for k in mfs if k.startswith("product_attributes_")), None
    )
    attributes = resolve_metaobject(mfs, attr_key) if attr_key else {}

    # `images` rather than `media`: same image data for read_products alone,
    # where `media` would cost six more scopes including read_orders. Video
    # links are therefore not exported in this lane. See the scope note in
    # queries/product_v5.graphql.
    images = [
        node["url"]
        for node in (product.get("images") or {}).get("nodes", []) or []
        if node.get("url")
    ]
    featured = (product.get("featuredImage") or {}).get("url")
    if featured and featured in images:
        # Keep the featured image first so image_link is the PDP's main image
        # rather than whichever image happens to sort first.
        images = [featured] + [url for url in images if url != featured]

    variants: list[dict[str, Any]] = []
    volatile_variants: list[dict[str, Any]] = []
    for v in (product.get("variants") or {}).get("nodes", []) or []:
        inv_item = v.get("inventoryItem") or {}
        weight = ((inv_item.get("measurement") or {}).get("weight")) or {}
        variants.append(
            {
                "variant_id": gid_num(v.get("id")),
                "sku": v.get("sku"),
                "variant_title": v.get("title"),
                "barcode": v.get("barcode"),
                "selected_options": v.get("selectedOptions") or [],
                "shipping_weight_value": weight.get("value"),
                "shipping_weight_unit": weight.get("unit"),
            }
        )
        # Pricing and stock deliberately do NOT hang off the variant record.
        # Mirroring them here would put cost and price inside the durable
        # block, which is the block that gets cached and embedded. They live
        # only under volatile_live_fetch_required.
        volatile_variants.append(
            {
                "variant_id": gid_num(v.get("id")),
                "sku": v.get("sku"),
                "price": v.get("price"),
                "compare_at_price": v.get("compareAtPrice"),
                "inventory_quantity": v.get("inventoryQuantity"),
                "inventory_policy": v.get("inventoryPolicy"),
                "available_for_sale": v.get("availableForSale"),
                "cost_internal": (inv_item.get("unitCost") or {}).get("amount"),
            }
        )

    durable = {
        "shopify_product_id": gid_num(product.get("id")),
        "handle": product.get("handle"),
        "title": product.get("title"),
        "product_url": product.get("onlineStoreUrl"),
        "product_canonical_url": mf_value(mfs, "product_canonical_url"),
        "status": product.get("status"),
        "vendor": product.get("vendor"),
        "product_type": product.get("productType"),
        "tags": product.get("tags") or [],
        "collections": [
            {"id": gid_num(c["id"]), "handle": c["handle"], "title": c["title"]}
            for c in (product.get("collections") or {}).get("nodes", []) or []
        ],
        "taxonomy_category": (product.get("category") or {}).get("fullName"),
        "google_product_category": mf_value(mfs, "google_product_category"),
        "seo_title": (product.get("seo") or {}).get("title"),
        "seo_description": (product.get("seo") or {}).get("description"),
        "description_html": product.get("descriptionHtml"),
        "short_description": mf_value(mfs, "short_description"),
        "product_code": mf_value(mfs, "product_code"),
        "brand": mf_value(mfs, "brand"),
        "grade": mf_value(mfs, "grade"),
        "condition_state": mf_value(mfs, "condition_state"),
        "mpn": mf_value(mfs, "mpn"),
        "upc_code": mf_value(mfs, "upc_code"),
        "ean": mf_value(mfs, "ean"),
        "vendor_part_no": mf_value(mfs, "vendor_part_no"),
        "main_category": mf_value(mfs, "main_category"),
        "sub_category": mf_value(mfs, "sub_category"),
        "dimensions_in": {
            "length": mf_value(mfs, "length_in"),
            "width": mf_value(mfs, "width_in"),
            "height": mf_value(mfs, "height_in"),
            "product_weight_lbs": mf_value(mfs, "product_weight_lbs"),
        },
        "image_link": images[0] if images else None,
        "additional_image_links": images[1:],
        "video_links_not_exported": "media field not queried - see scope note",
        "breadcrumbs": mf_value(mfs, "breadcrumbs"),
        "breadcrumb_paths": resolve_metaobject_list(mfs, "breadcrumb_paths"),
        "product_options": resolve_metaobject_list(mfs, "product_options"),
        "product_attributes": attributes,
        "related_products": resolve_product_refs(mfs, "related_products"),
        "pdp_content": {
            "features": rich_text_to_plain(specs.get("features")),
            "benefits": rich_text_to_plain(specs.get("benefits")),
            "tech_specs": rich_text_to_plain(specs.get("tech_specs")),
            "tech_specs_html": specs.get("other_features"),
            "weight_stacks": rich_text_to_plain(specs.get("weight_stacks")),
            "buying_guide": specs.get("buying_guide"),
            "faqs": specs.get("frequently_asked_questions"),
            "set_includes": specs.get("set_includes"),
            "accessories_included": specs.get("accessories_included"),
            "shipping_dims_weight": specs.get("shipping_dims_weight")
            or specs.get("shipping_dims_weight_2"),
        },
        # Held out of the embeddable block: competitor-naming content needs
        # sign-off before any AI surface quotes it.
        "pdp_content_needs_approval": {
            "comparison_chart_title": specs.get("comparison_chart_title"),
            "comparison_chart_table": specs.get("comparison_chart_table"),
        },
        "manuals_downloads": {
            "extra_info": extra,
            "downloads_other_info": downloads,
        },
        # scrub_internal is belt-and-braces: nothing internal should be here
        # by construction, and this guarantees it stays that way.
        "variants": [scrub_internal(v) for v in variants],
    }

    volatile = {
        "warranty": mf_value(mfs, "warranty"),
        "warranty_info": rich_text_to_plain(specs.get("warranty_info")),
        "ships": mf_value(mfs, "ships"),
        "processing_time": mf_value(mfs, "processing_time"),
        "processing_time_long": mf_value(mfs, "processing_time_long"),
        "retail_price": mf_value(mfs, "retail_price"),
        "review_rating": mf_value(mfs, "rating"),
        "review_count": mf_value(mfs, "rating_count"),
        "variant_pricing_and_stock": volatile_variants,
    }

    return {
        "schema_version": SCHEMA_VERSION,
        "snapshot": {
            "last_refreshed_utc": run_ts,
            "snapshot_age_hours": 0,
            "source_status": "SHOPIFY_ADMIN_GRAPHQL_LIVE_READ",
            "shopify_updated_at": product.get("updatedAt"),
            "seed_origin_flag": False,
            "verification_status": "API_POPULATED",
        },
        "durable": durable,
        "volatile_live_fetch_required": volatile,
        "embed_policy": {
            "durable_embed_ok": True,
            "volatile_embed_ok": False,
            "needs_approval_block_embed_ok": False,
            "volatile_fields": sorted(VOLATILE_FIELDS),
        },
        # Populated only in the PREVIEW artifact, and only ever as preview.
        "recommendation_overlay": None,
    }


# --------------------------------------------------------------------------
# conflicts
# --------------------------------------------------------------------------

def detect_conflicts(record: dict[str, Any]) -> list[dict[str, str]]:
    d = record["durable"]
    v = record["volatile_live_fetch_required"]
    code = d.get("product_code") or d.get("handle")
    rows: list[dict[str, str]] = []

    def add(severity: str, field: str, issue: str, evidence: str, owner: str,
            status: str) -> None:
        rows.append(
            {
                "product_code": code or "",
                "handle": d.get("handle") or "",
                "shopify_product_id": d.get("shopify_product_id") or "",
                "severity": severity,
                "field": field,
                "issue": issue,
                "evidence": evidence,
                "suggested_owner": owner,
                "status": status,
            }
        )

    tags = {t.lower() for t in d.get("tags") or []}

    for var in v["variant_pricing_and_stock"]:
        sku = var.get("sku") or "(no sku)"
        qty = var.get("inventory_quantity")
        avail = var.get("available_for_sale")
        price = var.get("price")
        compare = var.get("compare_at_price")

        if var.get("sku") in (None, ""):
            add("HIGH", "sku", "Variant has no SKU, which breaks the overlay "
                "and feed join keys",
                f"variant {var.get('sku')!r} on {d.get('handle')}",
                "Larianne / Product", "BLOCKED")

        if qty is not None and qty <= 0 and avail is True:
            add("HIGH", "inventory_quantity/available_for_sale",
                "Inventory is not positive but the variant is still buyable, "
                "so schema and feed would publish InStock",
                f"{sku}: inventory_quantity={qty}, available_for_sale=true",
                "Ops / Product", "LIVE-FETCH")

        if qty is not None and qty >= PLACEHOLDER_INVENTORY_FLOOR:
            add("HIGH", "inventory_quantity",
                "Inventory is a placeholder buffer, not stock on hand",
                f"{sku}: inventory_quantity={qty}",
                "Ops", "LIVE-FETCH")

        if avail is False:
            add("INFO", "available_for_sale",
                "Correctly held unbuyable. Feed and schema output must match "
                "OutOfStock",
                f"{sku}: available_for_sale=false, status={d.get('status')}",
                "Kevin / Yusra (feed)", "LIVE-FETCH")

        if price and compare:
            try:
                p, c = float(price), float(compare)
                if c > 0 and (1 - p / c) >= DISCOUNT_RISK_THRESHOLD:
                    add("HIGH", "compare_at_price",
                        f"Implied discount {round((1 - p / c) * 100)}% - same "
                        "pattern flagged in the Google deceptive-pricing cleanup",
                        f"{sku}: price={price} vs compare_at={compare}",
                        "Tim (decision) / Larianne", "BLOCKED")
            except (TypeError, ValueError):
                pass

        if not var.get("barcode"):
            if d.get("upc_code") or d.get("ean"):
                add("HIGH", "barcode",
                    "GTIN exists on the product record but variant.barcode is "
                    "blank, and the Google feed reads barcode",
                    f"{sku}: barcode empty, custom.upc_code="
                    f"{d.get('upc_code')}, custom.ean={d.get('ean')}",
                    "Kevin / Yusra (feed mapping)", "BLOCKED")
            else:
                add("MEDIUM", "barcode",
                    "No usable GTIN on the variant or the product record - "
                    "Merchant Center will warn",
                    f"{sku}: barcode, upc_code and ean all empty",
                    "Larianne / Product", "BLOCKED")

    # Operational tags that must agree with feed and schema output.
    for flag, note in (
        ("remove from feeds", "Product is tagged out of the Google feeds"),
        ("out_of_stock_hold", "Product is on an out-of-stock hold"),
        ("hidden", "Product is tagged hidden"),
    ):
        if flag in tags:
            add("INFO", "tags", note,
                f"tag present: {flag}; status={d.get('status')}",
                "Kevin / Yusra (feed)", "RESOLVED")

    warranty_text = f"{d.get('condition_state') or ''} {v.get('warranty') or ''}"
    if v.get("warranty") and UNVERIFIABLE_WARRANTY.search(v["warranty"]):
        add("HIGH", "warranty",
            "Warranty asserts coverage without stating terms, so it is not "
            "verifiable and cannot be stated",
            f"warranty={v['warranty']!r}",
            "Larianne / Product", "BLOCKED")

    for label, text in (
        ("warranty", v.get("warranty")),
        ("condition_state", d.get("condition_state")),
        ("grade", d.get("grade")),
        ("product_code", d.get("product_code")),
    ):
        if text and INVISIBLE_CHARS.search(text):
            found = sorted({f"U+{ord(c):04X}" for c in INVISIBLE_CHARS.findall(text)})
            add("LOW", label,
                "Value contains invisible characters, which break exact-match "
                "comparison and join keys",
                f"{label}={text!r} contains {', '.join(found)}",
                "Larianne / Product", "BLOCKED")

    chart = (d.get("pdp_content_needs_approval") or {}).get("comparison_chart_table")
    chart_title = (d.get("pdp_content_needs_approval") or {}).get(
        "comparison_chart_title"
    )
    if chart or chart_title:
        haystack = f"{chart_title or ''} {strip_html(chart)}"
        own_brand = (d.get("brand") or "").lower()
        named = [
            b for b in THIRD_PARTY_BRANDS
            if b.lower() != own_brand and re.search(rf"\b{re.escape(b)}\b",
                                                    haystack, re.IGNORECASE)
        ]
        if named:
            add("HIGH", "comparison_chart",
                "Comparison chart names a third-party brand directly and needs "
                "sign-off before any AI surface quotes it",
                f"named: {', '.join(sorted(set(named)))}",
                "Tim (approval) / Larianne", "BLOCKED")

    if not d.get("seo_title") or not d.get("seo_description"):
        add("MEDIUM", "seo_title/seo_description",
            "Missing SEO title or description",
            f"seo_title={d.get('seo_title')!r}, "
            f"seo_description={d.get('seo_description')!r}",
            "Yusra / Content", "BLOCKED")

    image_count = (1 if d.get("image_link") else 0) + len(
        d.get("additional_image_links") or []
    )
    if image_count <= 2:
        add("MEDIUM", "image_link",
            "Thin media coverage for a PDP",
            f"{image_count} image(s)",
            "Larianne / Product", "BLOCKED")

    if not d["pdp_content"].get("set_includes"):
        add("LOW", "set_includes",
            "set_includes is unauthored on the metaobject entry - authoring "
            "gap, not a resolver gap",
            "features_specs.set_includes is null",
            "Shikha (metaobject) / Content", "BLOCKED")

    if not (d["manuals_downloads"].get("extra_info")
            or d["manuals_downloads"].get("downloads_other_info")):
        add("MEDIUM", "manuals_downloads",
            "No manuals or downloads metaobject attached",
            "custom.extra_info and custom.downloads_other_info both absent",
            "Larianne / Product", "BLOCKED")

    if not d.get("google_product_category"):
        add("MEDIUM", "google_product_category",
            "No Google product category on the product record",
            "mm-google-shopping.google_product_category absent",
            "Kevin / Yusra (feed)", "BLOCKED")

    if warranty_text.strip() and d.get("condition_state") in (None, ""):
        add("MEDIUM", "condition_state",
            "Condition is unset, which matters for new vs remanufactured "
            "claims",
            "custom.condition_state absent",
            "Larianne / Product", "BLOCKED")

    return rows


# --------------------------------------------------------------------------
# overlay (preview only)
# --------------------------------------------------------------------------

PREVIEW_STAMP = "PREVIEW_UNAPPROVED_DO_NOT_USE"

OVERLAY_FIELDS = (
    "recommendation_tier", "ai_eligibility", "gorgias_use_tier",
    "gorgias_ai_ingestion_status", "customer_facing_safe",
    "autonomous_recommendation_ok", "needs_human_review", "do_not_lead_flag",
    "do_not_recommend_flag", "preferred_model_flag", "caution_model_flag",
    "discount_rule", "approved_comparison_language", "why_recommend",
    "best_for", "not_for", "handoff_triggers", "customer_questions_to_ask",
    "fact_owner", "sales_reviewer", "tim_approval", "last_reviewed",
    "source_status", "open_recommendation_issues",
)


def load_overlay(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return [
            {(k or "").strip().lower().replace(" ", "_"): (v or "").strip()
             for k, v in row.items()}
            for row in csv.DictReader(fh)
        ]


def _norm(value: str | None) -> str:
    return (value or "").strip().lower()


def _handle_from_url(url: str | None) -> str:
    if not url:
        return ""
    match = re.search(r"/products/([^/?#]+)", url)
    return match.group(1).lower() if match else ""


def match_overlay(record: dict, overlay_rows: list[dict]) -> tuple[dict | None, str]:
    """Trusted keys only: exact product URL, exact handle from URL, exact SKU.

    Name and model-family matching is deliberately not implemented. It
    produced false positives in V3 and is not permitted for production.
    """
    d = record["durable"]
    skus = {_norm(v["sku"]) for v in d.get("variants", []) if v.get("sku")}
    handle = _norm(d.get("handle"))
    url = _norm(d.get("product_url"))

    for row in overlay_rows:
        row_url = _norm(row.get("product_url") or row.get("url"))
        if row_url and url and row_url == url:
            return row, "EXACT_PRODUCT_URL"

    for row in overlay_rows:
        row_handle = _norm(row.get("handle")) or _handle_from_url(
            row.get("product_url") or row.get("url")
        )
        if row_handle and handle and row_handle == handle:
            return row, "EXACT_HANDLE_FROM_URL"

    for row in overlay_rows:
        row_sku = _norm(row.get("sku") or row.get("product_code") or row.get("model"))
        if row_sku and row_sku in skus:
            return row, "EXACT_SKU"

    return None, "NO_MATCH"


def _is_true(value: str | None) -> bool:
    return _norm(value) in ("true", "yes", "y", "1", "approved")


def gate_result(row: dict | None, record: dict) -> tuple[bool, list[str]]:
    """Conservative gate. Every condition must pass or the row is not usable.

    Mirrors Tim's 2026-06-09 direction exactly.
    """
    if row is None:
        return False, ["no overlay row"]

    reasons: list[str] = []
    if record["snapshot"].get("verification_status") != "HUMAN_VERIFIED":
        reasons.append("verification_status is not HUMAN_VERIFIED")
    if record["snapshot"].get("snapshot_age_hours", 0) > 24:
        reasons.append("snapshot is stale")
    if not _is_true(row.get("autonomous_recommendation_ok")):
        reasons.append("autonomous_recommendation_ok is not true")
    if _is_true(row.get("do_not_lead_flag")):
        reasons.append("do_not_lead_flag is set")
    if _is_true(row.get("do_not_recommend_flag")):
        reasons.append("do_not_recommend_flag is set")
    if _is_true(row.get("needs_human_review")):
        reasons.append("needs_human_review is set")
    if not _is_true(row.get("tim_approval")):
        reasons.append("tim_approval is not granted")
    return (not reasons), reasons


# --------------------------------------------------------------------------
# outputs
# --------------------------------------------------------------------------

def write_jsonl(path: Path, records: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")


def write_csv(path: Path, rows: list[dict], columns: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


README_TEMPLATE = """# FSS PDP AI Master - V5 P0/P1 sample package

Run: `{run_id}`
Generated: `{run_ts}`
Mode: `{mode}`
Status: **{status}**
Schema: `{schema}`  ·  Admin API: `{api}`
Harness: `scripts/pdp_ai_master/export.py` @ commit `{commit}`

## What this run did

Read-only pull of the {approved} approved P0/P1 products from Shopify Admin
GraphQL. {ok} produced, {failed} failed. {variants} variants. No Shopify
writes. Nothing seeded from the ChatGPT starter CSV, so `seed_origin_flag`
is false on every row because it was never populated from one.

## Read this before using any field

* This package is a **refreshable snapshot, not a live source of truth.**
  Every record carries `last_refreshed_utc`, `snapshot_age_hours` and
  `source_status`.
* `durable` is safe to cache and embed. `volatile_live_fetch_required` is
  **not** - price, compare-at, inventory, availability, cost, warranty,
  ships, processing time and review counts are fetched live at answer time,
  never embedded as persistent facts.
* `cost_internal` is internal-only and is stripped from every non-internal
  artifact.
* `pdp_content_needs_approval` holds comparison-chart content that names
  third-party brands. It is held out of the embeddable block and needs
  sign-off before any AI surface quotes it.
* Everything in `sample_with_overlay_PREVIEW.jsonl` is stamped
  `{stamp}`. Nothing has been moved off seed status.

## Files

| file | what it is |
| --- | --- |
| `sample.jsonl` | one V5 record per product, overlay left null |
| `sample_with_overlay_PREVIEW.jsonl` | same records with REV9 attached, unapproved |
| `overlay_preview_join.csv` | per-SKU match key, governance flags, gate result |
| `unmatched_conflict_report.csv` | every conflict, visible not silently resolved |
| `manifest.json` | run provenance and sha256 per output file |
| `field_source_matrix_V5.csv` | field -> source_type, volatility, embed policy |
| `README_P0P1_sample.md` | this file |

## Conflicts in this run

{conflict_summary}

Conflicts are reported, never auto-resolved. Each row carries a suggested
owner and a status of BLOCKED, LIVE-FETCH or RESOLVED.

## Reproducing this run

```
python3 scripts/pdp_ai_master/export.py \\
    --from-capture {capture_hint} \\
    --out out/{run_id}
```

Live equivalent, read scopes only
(`read_products`, `read_metaobjects`, `read_inventory`):

```
SHOPIFY_SHOP=... SHOPIFY_ADMIN_TOKEN=... \\
python3 scripts/pdp_ai_master/export.py --out out/{run_id}
```

There is no mutation path in this lane. `guardrails.assert_read_only` scans
every GraphQL document before a request is sent and aborts the run on any
write token; the client object has no mutate method to call.
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path,
                        help="output directory for the package")
    parser.add_argument("--from-capture", type=Path, default=None,
                        help="replay captured GraphQL responses, no network")
    parser.add_argument("--capture-to", type=Path, default=None,
                        help="write raw responses here for later replay")
    parser.add_argument("--overlay", type=Path, default=None,
                        help="REV9 matrix CSV, attached as preview only")
    parser.add_argument("--scope", type=Path,
                        default=HERE / "config" / "p0p1_skus.json",
                        help="approved SKU scope file")
    parser.add_argument("--commit", default=os.environ.get("GIT_COMMIT", "unknown"),
                        help="commit recorded in the manifest")
    args = parser.parse_args()

    run_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    run_id = f"run_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"

    query_path = HERE / "queries" / "product_v5.graphql"
    document = query_path.read_text()
    try:
        assert_read_only(document, str(query_path))
        assert_no_seed_input([str(args.overlay)] if args.overlay else [])
    except ReadOnlyViolation as exc:
        print(f"ABORT: {exc}", file=sys.stderr)
        return 3

    scope = json.loads(args.scope.read_text())
    targets = scope["products"]

    if args.from_capture:
        client: Any = CaptureClient(args.from_capture)
        mode = f"replay from {args.from_capture}"
    else:
        shop = os.environ.get("SHOPIFY_SHOP")
        token = os.environ.get("SHOPIFY_ADMIN_TOKEN")
        if not shop or not token:
            print("ABORT: set SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN, or pass "
                  "--from-capture", file=sys.stderr)
            return 3
        client = AdminClient(shop, token)
        mode = f"live read {shop} (Admin GraphQL {API_VERSION})"

    args.out.mkdir(parents=True, exist_ok=True)
    if args.capture_to:
        args.capture_to.mkdir(parents=True, exist_ok=True)

    records: list[dict] = []
    failures: list[dict[str, str]] = []
    conflicts: list[dict[str, str]] = []

    for target in targets:
        pid = target["shopify_product_id"]
        gid = f"gid://shopify/Product/{pid}"
        try:
            data = client.query(document, {"id": gid})
            product = data.get("product")
            if not product:
                raise RuntimeError("product not found or not readable")
            if args.capture_to:
                (args.capture_to / f"product_{pid}.json").write_text(
                    json.dumps({"data": data}, ensure_ascii=False, indent=1)
                )
            record = build_record(product, run_ts)
            records.append(record)
            conflicts.extend(detect_conflicts(record))
        except (RuntimeError, urllib.error.URLError, FileNotFoundError,
                KeyError, TypeError) as exc:
            failures.append(
                {
                    "shopify_product_id": pid,
                    "product_code": target.get("product_code", ""),
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )
            print(f"  ! {target.get('product_code')} ({pid}): {exc}",
                  file=sys.stderr)

    status = "COMPLETE" if not failures else "PARTIAL"

    # sample.jsonl - clean path, overlay null.
    write_jsonl(args.out / "sample.jsonl", records)

    # Overlay preview. Only ever preview.
    overlay_rows = load_overlay(args.overlay) if args.overlay else []
    join_rows: list[dict] = []
    preview_records: list[dict] = []
    for record in records:
        row, key = match_overlay(record, overlay_rows) if overlay_rows else (None, "NO_OVERLAY_FILE")
        passed, reasons = gate_result(row, record)
        preview = json.loads(json.dumps(record))
        preview["recommendation_overlay"] = {
            "approval_state": PREVIEW_STAMP,
            "match_key": key,
            "gate_passed": passed,
            "gate_block_reasons": reasons,
            "fields": {f: (row or {}).get(f) for f in OVERLAY_FIELDS} if row else None,
        }
        preview_records.append(preview)
        d = record["durable"]
        join_rows.append(
            {
                "product_code": d.get("product_code") or "",
                "handle": d.get("handle") or "",
                "product_url": d.get("product_url") or "",
                "match_key": key,
                "matched": "YES" if row else "NO",
                "approval_state": PREVIEW_STAMP,
                "gate_passed": "YES" if passed else "NO",
                "gate_block_reasons": "; ".join(reasons),
                **{f: (row or {}).get(f, "") for f in OVERLAY_FIELDS},
            }
        )
    write_jsonl(args.out / "sample_with_overlay_PREVIEW.jsonl", preview_records)
    write_csv(
        args.out / "overlay_preview_join.csv",
        join_rows,
        ["product_code", "handle", "product_url", "match_key", "matched",
         "approval_state", "gate_passed", "gate_block_reasons",
         *OVERLAY_FIELDS],
    )

    # Conflicts plus any per-product failures, so a partial run is visible.
    for failure in failures:
        conflicts.append(
            {
                "product_code": failure["product_code"],
                "handle": "",
                "shopify_product_id": failure["shopify_product_id"],
                "severity": "HIGH",
                "field": "__run__",
                "issue": "Product failed to export in this run",
                "evidence": failure["error"],
                "suggested_owner": "Zafran (harness)",
                "status": "BLOCKED",
            }
        )
    write_csv(
        args.out / "unmatched_conflict_report.csv",
        conflicts,
        ["product_code", "handle", "shopify_product_id", "severity", "field",
         "issue", "evidence", "suggested_owner", "status"],
    )

    # Field source matrix travels with the package.
    matrix_src = HERE / "config" / "field_source_matrix_v5.csv"
    (args.out / "field_source_matrix_V5.csv").write_text(matrix_src.read_text())

    by_sev: dict[str, int] = {}
    for row in conflicts:
        by_sev[row["severity"]] = by_sev.get(row["severity"], 0) + 1
    summary_lines = [
        f"* **{sev}**: {by_sev[sev]}"
        for sev in ("HIGH", "MEDIUM", "LOW", "INFO") if sev in by_sev
    ] or ["* none"]

    variant_count = sum(len(r["durable"]["variants"]) for r in records)

    (args.out / "README_P0P1_sample.md").write_text(
        README_TEMPLATE.format(
            run_id=run_id, run_ts=run_ts, mode=mode, status=status,
            schema=SCHEMA_VERSION, api=API_VERSION, commit=args.commit,
            approved=len(targets), ok=len(records), failed=len(failures),
            variants=variant_count, stamp=PREVIEW_STAMP,
            conflict_summary="\n".join(summary_lines),
            capture_hint=args.from_capture or "captures/<date>",
        )
    )

    # Manifest last so it can checksum everything else.
    outputs = [
        "sample.jsonl", "sample_with_overlay_PREVIEW.jsonl",
        "overlay_preview_join.csv", "unmatched_conflict_report.csv",
        "field_source_matrix_V5.csv", "README_P0P1_sample.md",
    ]
    manifest = {
        "run_id": run_id,
        "generated_utc": run_ts,
        "status": status,
        "schema_version": SCHEMA_VERSION,
        "admin_api_version": API_VERSION,
        "mode": mode,
        "harness": {
            "path": "scripts/pdp_ai_master/export.py",
            "commit": args.commit,
            "query_document": str(query_path.relative_to(HERE.parent.parent)),
            "query_document_sha256": hashlib.sha256(document.encode()).hexdigest(),
            "scopes_required": list(REQUIRED_SCOPES),
            "scopes_validated_against": f"Admin GraphQL {API_VERSION} schema",
            "write_path_exists": False,
            "shopify_writes_made": 0,
        },
        "scope": {
            "name": scope.get("list_name"),
            "source": scope.get("source"),
            "approved_products": len(targets),
            "products_exported": len(records),
            "products_failed": len(failures),
            "variants_exported": variant_count,
            "expansion_beyond_scope": False,
        },
        "governance": {
            "seed_origin_flag_all_false": all(
                r["snapshot"]["seed_origin_flag"] is False for r in records
            ),
            "volatile_fields_embedded": False,
            "cost_internal_in_shared_outputs": False,
            "overlay_approval_state": PREVIEW_STAMP,
            "overlay_rows_moved_off_seed": 0,
            "overlay_source": str(args.overlay) if args.overlay else None,
            "overlay_gate_passes": sum(
                1 for r in join_rows if r["gate_passed"] == "YES"
            ),
            "recurring_schedule": "NOT_APPROVED_NOT_SCHEDULED",
        },
        "conflicts_by_severity": by_sev,
        "failures": failures,
        "outputs": {},
    }
    for name in outputs:
        path = args.out / name
        manifest["outputs"][name] = {
            "sha256": sha256_file(path),
            "bytes": path.stat().st_size,
        }
    (args.out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )

    print(f"{status}: {len(records)}/{len(targets)} products, "
          f"{variant_count} variants, {len(conflicts)} conflicts "
          f"({by_sev.get('HIGH', 0)} HIGH) -> {args.out}")
    return 0 if status == "COMPLETE" else 2


if __name__ == "__main__":
    sys.exit(main())
