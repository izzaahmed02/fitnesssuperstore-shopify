#!/usr/bin/env python3
"""Phase 2 primary feed generator - Shopify Admin API to googleshoppingfs /
googleshoppingfrenchfitness.

Replaces the MultiFeeds manual exports. Reproduces the SOP inclusion ruleset
(feeds/feed-rules.json) so cutover does not silently change feed scope, and
applies the five spec deltas from Tim's 2026-09-06 email:

  1. custom_label_3 / custom_label_4 joined from the v2 supplemental lookup,
     committed at feeds/supplemental_priority_labels_v2.csv because Merchant Center
     will not export a File (manual) source back. Series labels only where
     price >= $1,000. HARD GATES: refuses to run if the lookup has no
     custom_label_4 column, or if it has a duplicate id, because a feed that drops
     the series values takes the Product Lines asset groups dark. Resolution is
     SKU first, then the emitted offer id, then the bare product id, and every
     offer that resolves to nothing or to two disagreeing rows is written to
     label_resolution.csv rather than silently blanked.
  2. Titles from feeds/hero-title-overrides.csv override the Shopify title, so
     cutover cannot revert the ten approved hero retitles.
  3. shipping is NOT populated here - it is owned by the missing-shipping pass
     (scripts/feed_missing_shipping_fix.py) and 50 rows are still waiting on
     rates from Qash. This generator carries whatever the shipping lookup
     supplies and leaves the rest blank rather than guessing.
  4. One row per sellable VARIANT keyed <productID>-<variantID>, which is what
     actually carries the SKUs currently absent from the feeds.
  5. price / sale_price derived from Shopify, and all three tax columns dropped
     (`tax`, the long `tax(...)` form, and `tax_category`).

Read-only against Shopify. Writes CSVs to --out-dir; uploads nothing.

    export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
    export SHOPIFY_ADMIN_TOKEN=shpat_...
    python3 scripts/phase2_feed_generator.py \
        --shipping-lookup shipping_by_id.csv \
        --out-dir build/feeds

Validate the label lookup on its own first, offline and against live Shopify:

    python3 scripts/validate_label_lookup.py --shop "$SHOPIFY_SHOP" --token "$SHOPIFY_ADMIN_TOKEN"

Then diff against the live exports before repointing anything:

    python3 scripts/feed_id_diff.py \
        --old googleshoppingfrenchfitness.csv --new build/feeds/googleshoppingfrenchfitness.csv
"""
import argparse
import collections
import csv
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request
from decimal import Decimal

ROOT = pathlib.Path(__file__).resolve().parent.parent
RULES = ROOT / "feeds" / "feed-rules.json"
TITLE_OVERRIDES = ROOT / "feeds" / "hero-title-overrides.csv"
# The canonical v2 label lookup, committed because Merchant Center will not export
# a File (manual) source back. Tim's attachment of 2026-09-07 / 2026-09-08, which is
# byte-for-byte the file live on the supplemental source since 2026-09-05 18:46 PDT.
LABEL_LOOKUP = ROOT / "feeds" / "supplemental_priority_labels_v2.csv"

API_VERSION = "2025-07"

# Column order, verbatim from the SOP tabs for each feed, with ALL THREE tax
# columns removed per delta 5: the bare `tax`, the long
# `tax(country:location_group_name:...)` form, and `tax_category`. There are three,
# not two - Izza's 2026-09-07 pass on the live rows. A feed-level tax attribute
# overrides the Merchant Center account tax settings, and the live rows carry a
# hardcoded `US:CA:8.375:n` that predates the 23-state nexus change. Dropping the
# columns hands tax back to the account settings, which is the only place it is
# maintained - so account-level tax must be confirmed configured in Merchant
# Center BEFORE these feeds are repointed.
_TAX_COLUMNS = {
    "tax",
    "tax(country:location_group_name:location_id:postal_code:region:rate:tax_ship)",
    "tax_category",
}

FS_COLUMNS = [
    "id", "shipping", "tax", "sale_price", "title", "brand", "google_product_category",
    "image_link", "additional_image_link", "material", "color", "size", "price_tiers",
    "top_seller", "compare_price", "old_id", "availability_date", "processing_time",
    "processing_time_long", "pmax_ff_product_lines_1000plus_scope",
    "std_shopping_ff_product_lines_1000plus_control", "short_title", "description", "link",
    "virtual_model_link", "price", "canonical_link", "product_type", "gtin", "mpn",
    "product_detail", "product_highlight", "identifier_exists", "condition", "availability",
    "adult", "sell_on_google_quantity", "item_group_id", "age_group", "gender", "pattern",
    "size_type", "size_system", "promotion_id", "custom_label_0", "custom_label_1",
    "custom_label_2", "custom_label_3", "custom_label_4",
    "shipping(country:region:postal_code:location_id:location_group_name:service:price:"
    "min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
    "free_shipping_threshold",
    "certification(certification_authority:certification_name:certification_code:certification_value)",
    "included_destination", "excluded_destination", "energy_efficiency_class",
    "min_energy_efficiency_class", "max_energy_efficiency_class", "shipping_label",
    "cost_of_goods_sold", "auto_pricing_min_price", "multipack", "is_bundle",
    "shopping_ads_excluded_country", "transit_time_label", "shipping_weight",
    "unit_pricing_measure", "unit_pricing_base_measure", "installment", "shipping_length",
    "shipping_width", "shipping_height", "min_handling_time", "max_handling_time",
    "tax(country:location_group_name:location_id:postal_code:region:rate:tax_ship)",
    "tax_category", "pickup_sla", "pickup_method", "link_template", "ads_redirect",
    "question_and_answer", "document_link", "related_product", "item_group_title",
    "variant_option", "popularity_rank", "expiration_date",
]

FF_COLUMNS = [
    "id", "shipping", "tax", "sale_price", "availability", "availability_date", "price_tiers",
    "top_seller", "title", "old_id", "processing_time", "processin_time_long", "short_title",
    "description", "link", "image_link", "virtual_model_link", "additional_image_link", "price",
    "canonical_link", "google_product_category", "product_type", "gtin", "brand", "mpn",
    "product_detail", "product_highlight", "identifier_exists", "condition", "adult",
    "sell_on_google_quantity", "item_group_id", "age_group", "gender", "color", "size",
    "material", "pattern", "size_type", "size_system", "promotion_id", "custom_label_0",
    "custom_label_1", "custom_label_2", "custom_label_3", "custom_label_4",
    "shipping(country:region:postal_code:location_id:location_group_name:service:price:"
    "min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
    "free_shipping_threshold",
    "certification(certification_authority:certification_name:certification_code:certification_value)",
    "included_destination", "excluded_destination", "energy_efficiency_class",
    "min_energy_efficiency_class", "max_energy_efficiency_class", "shipping_label",
    "cost_of_goods_sold", "auto_pricing_min_price", "multipack", "is_bundle",
    "shopping_ads_excluded_country", "transit_time_label", "shipping_weight",
    "unit_pricing_measure", "unit_pricing_base_measure", "installment", "shipping_length",
    "shipping_width", "shipping_height", "min_handling_time", "max_handling_time",
    "tax(country:location_group_name:location_id:postal_code:region:rate:tax_ship)",
    "tax_category", "pickup_sla", "pickup_method", "link_template", "ads_redirect",
    "question_and_answer", "document_link", "related_product", "item_group_title",
    "variant_option", "popularity_rank", "expiration_date",
]

# `processin_time_long` really is spelled that way in the live FF feed. Keeping the
# typo keeps the header byte-identical, which is what makes the cutover a repoint
# rather than a schema change.

# Columns this generator does NOT yet populate. They are present in the live rows
# and nothing in Shopify maps to them one-to-one, so they are emitted blank and
# printed at the end of every run. A blank here is DATA LOSS at cutover, not a
# harmless gap - do not repoint until each one is either mapped or signed off as
# intentionally dropped.
UNMAPPED = [
    "google_product_category",   # live rows carry a full Google taxonomy string
    "custom_label_0",            # live rows carry the product-type taxonomy
    "custom_label_1",
    "custom_label_2",            # live rows carry price tiers, e.g. T3_1000+
    "price_tiers",               # e.g. aov_4000
    "top_seller",                # e.g. LongTail
    "cost_of_goods_sold",
    "pmax_ff_product_lines_1000plus_scope",
    "std_shopping_ff_product_lines_1000plus_control",
    "product_detail",
    "product_highlight",
    "promotion_id",              # supplied today by a separate supplemental
    "virtual_model_link",
]

PRODUCT_QUERY = """
query Products($cursor: String) {
  products(first: 50, after: $cursor, query: "status:active") {
    pageInfo { hasNextPage endCursor }
    nodes {
      id title handle status vendor productType tags onlineStoreUrl descriptionHtml
      featuredMedia { preview { image { url } } }
      media(first: 10) { nodes { preview { image { url } } } }
      collections(first: 50) { nodes { title } }
      metafields(first: 60, namespace: "custom") {
        nodes {
          key value
          reference {
            ... on Metaobject {
              id type
              excludePpLt1000: field(key: "exclude_pp_lt1000") { value }
              estimatedShippingGround: field(key: "estimated_shipping_ground") { value }
            }
          }
        }
      }
      variants(first: 100) {
        nodes {
          id sku title price compareAtPrice inventoryQuantity
          selectedOptions { name value }
          inventoryItem { measurement { weight { value unit } } }
        }
      }
    }
  }
}
"""


class ShopifyError(RuntimeError):
    pass


def graphql(shop, token, query, variables):
    body = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        f"https://{shop}/admin/api/{API_VERSION}/graphql.json",
        data=body,
        headers={"Content-Type": "application/json", "X-Shopify-Access-Token": token},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        raise ShopifyError(f"HTTP {exc.code}: {exc.read()[:400].decode(errors='replace')}") from exc
    if payload.get("errors"):
        raise ShopifyError(json.dumps(payload["errors"])[:800])
    return payload["data"]


def fetch_products(shop, token):
    cursor = None
    while True:
        data = graphql(shop, token, PRODUCT_QUERY, {"cursor": cursor})
        page = data["products"]
        yield from page["nodes"]
        if not page["pageInfo"]["hasNextPage"]:
            return
        cursor = page["pageInfo"]["endCursor"]


def numeric_id(gid):
    return gid.rsplit("/", 1)[-1]


def money(value):
    """Google wants `1234.00 USD`. Shopify hands back a bare decimal string."""
    if value in (None, ""):
        return ""
    return f"{Decimal(str(value)):.2f} USD"


def load_title_overrides():
    if not TITLE_OVERRIDES.exists():
        raise SystemExit(
            f"missing {TITLE_OVERRIDES}. Without it the generator emits Shopify titles and "
            "silently reverts the ten approved hero retitles at cutover."
        )
    with TITLE_OVERRIDES.open(encoding="utf-8") as fh:
        return {row["sku"]: row["title"] for row in csv.DictReader(fh)}


def load_labels(path):
    """The v2 supplemental, used as the label lookup.

    Refuses a file without custom_label_4. That is the exact mistake Tim's
    coordination warning is about: a labels file that has lost the series values
    takes the Product Lines asset groups dark the moment it processes.

    Also refuses duplicate ids, because a duplicate means one of the two rows is
    silently discarded and nobody finds out which until the asset group empties.
    """
    with pathlib.Path(path).open(encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        fields = [f.strip() for f in (reader.fieldnames or [])]
        if "custom_label_4" not in fields:
            raise SystemExit(
                f"{path} has no custom_label_4 column (found {fields}). That is the "
                "labels-only file, not v2. Uploading a feed built from it wipes the series "
                "labels and takes the Product Lines asset groups dark. Refusing to build."
            )
        if "custom_label_3" not in fields:
            raise SystemExit(f"{path} has no custom_label_3 column (found {fields}).")

        labels, seen = {}, []
        for row in reader:
            key = (row.get("id") or "").strip()
            if not key:
                continue
            if key in labels:
                seen.append(key)
            labels[key] = (
                (row.get("custom_label_3") or "").strip(),
                (row.get("custom_label_4") or "").strip(),
            )
        if seen:
            raise SystemExit(
                f"{path} has {len(seen)} duplicate id(s), e.g. {seen[:5]}. One row per id "
                "or the label that survives is whichever happened to be last. Refusing to build."
            )
        return labels


def labels_for(labels, sku, offer_id, product_id, label_report):
    """Resolve one offer's labels against the lookup, explicitly and in order.

    Tim, 2026-09-08: "the ten hero rows use SKUs, but the full lookup also
    contains numeric and composite IDs. Preserve the exact source IDs and validate
    the label mappings rather than assuming every row is SKU-keyed."

    So the order is stated rather than implied:

      1. the variant SKU
      2. the offer id the generator is about to emit (<productID>-<variantID> for
         a multi-variant product, the bare product id otherwise)
      3. the bare product id, for a lookup row written before this product grew a
         second variant

    SKU first for two reasons. Three ids in the file - 931, 933, 935 - are Precor
    SKUs that look like product ids. And five hex-dumbbell variants are addressed
    twice, once by SKU and once by composite id; the SKU row carries the
    hand-assigned tier (p1_hero, p2_core) while the composite row carries the bulk
    p4_tail default, so SKU-first is what keeps those three offers in their asset
    groups. Every double hit is reported so the ambiguity stays visible.
    """
    for source, key in (("sku", sku), ("offer_id", offer_id), ("product_id", product_id)):
        if key and key in labels:
            others = [
                (s, k) for s, k in (("sku", sku), ("offer_id", offer_id), ("product_id", product_id))
                if k and k != key and k in labels and labels[k] != labels[key]
            ]
            for other_source, other_key in others:
                label_report.append((
                    offer_id, sku,
                    f"lookup conflict: {source} {key} -> {labels[key]} used; "
                    f"{other_source} {other_key} -> {labels[other_key]} ignored"
                ))
            return labels[key], source
    return ("", ""), None


def load_shipping(path):
    if not path:
        return {}
    with pathlib.Path(path).open(encoding="utf-8-sig") as fh:
        return {
            (row["id"] or "").strip(): (row.get("shipping") or "").strip()
            for row in csv.DictReader(fh)
            if (row.get("id") or "").strip()
        }


def metafields(product):
    return {node["key"]: node["value"] for node in product["metafields"]["nodes"]}


def exclude_pp_lt1000(product):
    """The SOP's third-party exclusion: `exclude_pp_lt1000 (3rd party) == 1`.

    custom.3rd_party is a metaobject REFERENCE, and every one of the 3,750 active
    products carries one, so the presence of the metafield says nothing at all.
    The flag lives on the referenced metaobject and has to be read from there.
    Testing presence instead of value excludes the entire catalogue: it took
    googleshoppingfs from ~1,537 live rows to 2.
    """
    for node in product["metafields"]["nodes"]:
        if node["key"] != "3rd_party":
            continue
        ref = node.get("reference") or {}
        field = ref.get("excludePpLt1000") or {}
        value = (field.get("value") or "").strip()
        if not value:
            return False
        try:
            return int(float(value)) == 1
        except ValueError:
            return value.lower() in {"true", "yes"}
    return False


def load_ground_estimates(path):
    """Optional OVERRIDE for the SOP's $1,000 estimated-ground-shipping exclusion.

    The rule no longer depends on this file. Shopify does hold the figure, on the
    custom.3rd_party metaobject as `estimated_shipping_ground` - see
    ground_estimate() - and that is what the rule reads by default.

    An earlier note here said Shopify did not hold it. That was true of the
    delivery profiles: the store runs one profile whose four zones are all
    carrier-calculated through Intuitive Shipping with no rate definitions, so
    per-cart rates only exist at checkout. The stored freight estimate is a
    different thing and it is in the catalogue.

    Supply an `id,estimate_usd` file to override the stored values, keyed on either
    the offer id or the SKU - useful for applying a freight re-quote without
    waiting on a catalogue edit. It is still NOT approximated from product weight:
    weight is not a dollar amount, and a wrong proxy silently changes feed scope in
    both directions.
    """
    if not path:
        return None
    with pathlib.Path(path).open(encoding="utf-8-sig") as fh:
        return {
            (row["id"] or "").strip(): Decimal(row["estimate_usd"])
            for row in csv.DictReader(fh)
            if (row.get("id") or "").strip() and (row.get("estimate_usd") or "").strip()
        }


def ground_estimate(product):
    """Estimated ground shipping in dollars, off the custom.3rd_party metaobject.

    Correcting the earlier note on load_ground_estimates: Shopify DOES hold this.
    It is not a delivery-profile rate - those really are carrier-calculated per
    cart with no rate definitions - it is a stored freight figure on the
    3rd_party metaobject, `estimated_shipping_ground`, populated on 4,566 of the
    4,653 3rd_party metaobjects as of 2026-09-09. It is the same number the live
    feed rows carry, so reading it here is what makes the SOP's $1,000
    ground-shipping exclusion applicable without an external file.
    """
    for node in product["metafields"]["nodes"]:
        if node["key"] != "3rd_party":
            continue
        ref = node.get("reference") or {}
        field = ref.get("estimatedShippingGround") or {}
        value = (field.get("value") or "").strip()
        if not value:
            return None
        try:
            return Decimal(value)
        except Exception:
            return None
    return None


def excluded_by_shared_rules(product, rules):
    shared = rules["shared"]["always_exclude"]
    collections = {node["title"] for node in product["collections"]["nodes"]}
    if collections & set(shared["collections"]):
        return "collection"
    if product["productType"] in shared["product_types"]:
        return "product_type"
    if product["productType"] != rules["shared"]["include_product_type"]:
        return "not_product_index"
    title = product["title"]
    if any(bad.lower() in title.lower() for bad in shared["products_by_title"]):
        return "title_blocklist"
    return None


def feed_for(product, rules):
    """Which primary a product belongs in, or None.

    The SOP splits one catalogue across two files: French Fitness + condition_state
    New is googleshoppingfrenchfitness, and googleshoppingfs is "everything else" -
    all Remanufactured, plus other-brand New from any vendor not on the 14-vendor
    new-only exclusion list. It is NOT remanufactured-only.
    """
    mf = metafields(product)
    condition_state = (mf.get("condition_state") or "").strip().lower()
    vendor = product["vendor"]

    if vendor == "French Fitness" and condition_state == "new":
        return "googleshoppingfrenchfitness"

    fs = rules["googleshoppingfs"]["exclude"]
    if condition_state in {c.lower() for c in fs["condition_state"]}:
        return None  # "as is" never goes to Shopping
    if condition_state == "new" and vendor in fs["vendors_new_only"]:
        return None
    if any(bad.lower() in product["title"].lower() for bad in fs["products_by_title"]):
        return None
    tags = {t.strip().lower() for t in product["tags"]}
    if tags & {t.lower() for t in fs["tags"]}:
        return None
    if exclude_pp_lt1000(product):
        # SOP: exclude_pp_lt1000 (3rd party) == 1. Read off the referenced
        # metaobject, not off the presence of the reference - every active product
        # has one, so presence excludes everything.
        return None
    if condition_state not in {"new", "remanufactured"}:
        return None
    return "googleshoppingfs"


def variant_rows(product, feed, rules, labels, titles, shipping, ground_estimates, report,
                 label_report=None, label_sources=None):
    """One row per sellable variant, keyed <productID>-<variantID>.

    A bare product id can only carry one offer, which is why multi-variant
    products lose every variant but one. FF-RIT24-Middle / -Edge / -Corner all
    sit on product 9878680535356 at the same price, and the Monster Universal
    Storage rows all shared id 10269254254908. The composite key is what makes
    those SKUs representable at all.
    """
    mf = metafields(product)
    product_id = numeric_id(product["id"])
    rows = []
    variants = product["variants"]["nodes"]
    multi = len(variants) > 1
    cfg = rules[feed]["exclude"]

    for variant in variants:
        sku = (variant["sku"] or "").strip()
        offer_id = f"{product_id}-{numeric_id(variant['id'])}" if multi else product_id

        price = Decimal(variant["price"] or "0")
        if price < Decimal(str(cfg["price_usd_below"])):
            report.append((offer_id, sku, "excluded: price below $%s" % cfg["price_usd_below"]))
            continue
        if cfg.get("out_of_stock") and (variant["inventoryQuantity"] or 0) <= 0:
            report.append((offer_id, sku, "excluded: out of stock"))
            continue
        # An explicit --ground-shipping-estimates file overrides the metaobject, so
        # a freight re-quote can be applied without waiting on a catalogue edit.
        est = None
        if ground_estimates is not None:
            est = ground_estimates.get(offer_id) or ground_estimates.get(sku)
        if est is None:
            est = ground_estimate(product)
        if est is not None and est >= Decimal(str(cfg["estimated_ground_shipping_usd_min"])):
            report.append((offer_id, sku,
                           f"excluded: estimated ground shipping ${est} >= $1000"))
            continue
        other_brand_floor = cfg.get("price_usd_at_or_below_other_brand_new_only")
        condition_state = (mf.get("condition_state") or "").strip().lower()
        if other_brand_floor and condition_state == "new" and price <= Decimal(str(other_brand_floor)):
            report.append((offer_id, sku, f"excluded: other-brand new at or below ${other_brand_floor}"))
            continue

        # Delta 5. Google reads `price` as the regular price and `sale_price` as
        # what the customer pays today. Shopify is the other way round, so the two
        # swap - but only when compare-at is a real, higher was-price. compare-at
        # equal to price, below price, or 0.00 is stale data, not a sale, and
        # emitting a sale_price for it is the deceptive-savings pattern Google
        # already flagged on this account.
        compare_at = variant["compareAtPrice"]
        sale_price = ""
        list_price = price
        if compare_at not in (None, ""):
            compare_at = Decimal(compare_at)
            if compare_at > price:
                list_price, sale_price = compare_at, money(price)
            elif compare_at > 0:
                report.append((offer_id, sku, f"compare-at {compare_at} not above price {price}; no sale_price"))

        if not product["onlineStoreUrl"]:
            # Unlisted in Shopify, so there is no landing page. StudioWall
            # 10414127087932 is the known case: no shipping value fixes it,
            # publishing the product does, and that is a catalogue call.
            report.append((offer_id, sku, "excluded: not published to the online store"))
            continue

        title = titles.get(sku) or product["title"]
        (tier, series), source = labels_for(
            labels, sku, offer_id, product_id,
            label_report if label_report is not None else [])
        if label_sources is not None:
            label_sources.append((offer_id, sku, source))
        if series and price < Decimal("1000"):
            # Series labels only on items $1,000+. The lookup already reflects
            # this, verified against live prices by scripts/validate_label_lookup.py,
            # so this only catches a price that moved after the last re-issue.
            (label_report if label_report is not None else []).append((
                offer_id, sku,
                f"series {series!r} dropped: price {price} is below the $1,000 floor"))
            series = ""

        images = [n["preview"]["image"]["url"] for n in product["media"]["nodes"]
                  if n.get("preview") and n["preview"].get("image")]
        link = product["onlineStoreUrl"] or ""
        if link and multi:
            link = f"{link}?variant={numeric_id(variant['id'])}"

        weight = (variant["inventoryItem"] or {}).get("measurement", {}).get("weight") or {}
        options = {o["name"].lower(): o["value"] for o in variant["selectedOptions"]}

        rows.append({
            "id": offer_id,
            "shipping": shipping.get(offer_id, ""),
            "sale_price": sale_price,
            "title": title,
            "brand": mf.get("brand") or product["vendor"],
            "link": link,
            "canonical_link": product["onlineStoreUrl"] or "",
            "image_link": images[0] if images else "",
            "additional_image_link": ",".join(images[1:10]),
            "price": money(list_price),
            "compare_price": money(compare_at) if sale_price else "",
            "old_id": sku,
            "mpn": mf.get("mpn") or sku,
            "gtin": mf.get("upc_code") or mf.get("ean") or "",
            "identifier_exists": "yes" if (mf.get("upc_code") or mf.get("ean") or sku) else "no",
            # Google's condition enum. "refurbished" is the enum value for our
            # remanufactured line; other-brand new rows in the same file stay "new".
            "condition": "refurbished" if (mf.get("condition_state") or "").strip().lower() == "remanufactured" else "new",
            "availability": "in stock" if (variant["inventoryQuantity"] or 0) > 0 else "out of stock",
            "product_type": product["productType"],
            "processing_time": mf.get("processing_time") or "",
            "processin_time_long": mf.get("processing_time") or "",
            "processing_time_long": mf.get("processing_time") or "",
            "short_title": mf.get("productnameshort") or "",
            "description": mf.get("short_description") or "",
            "item_group_id": product_id if multi else "",
            "item_group_title": product["title"] if multi else "",
            "variant_option": variant["title"] if multi else "",
            "color": mf.get("product_color") or options.get("color", ""),
            "size": options.get("size", ""),
            "material": options.get("material", ""),  # no custom.material metafield exists
            "shipping_weight": f"{weight.get('value')} lb" if weight.get("value") else "",
            "custom_label_3": tier,
            "custom_label_4": series,
            "sell_on_google_quantity": str(variant["inventoryQuantity"] or 0),
        })
    return rows


def write_feed(path, columns, rows):
    columns = [c for c in columns if c not in _TAX_COLUMNS]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in columns})
    return columns


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--labels-lookup", default=str(LABEL_LOOKUP),
                        help="the v2 label lookup. Defaults to the canonical copy committed at "
                             "feeds/supplemental_priority_labels_v2.csv, which is the file Tim "
                             "uploaded to the GMC supplemental source on 2026-09-05 18:46 PDT. "
                             "Merchant Center will not export a File (manual) source back, so do "
                             "not try to reconstruct it from GMC.")
    parser.add_argument("--shipping-lookup", help="id,shipping CSV from the missing-shipping pass")
    parser.add_argument("--ground-shipping-estimates",
                        help="OPTIONAL id,estimate_usd CSV that overrides the stored freight "
                             "figures. Without it the SOP's $1,000 ground-shipping exclusion "
                             "still applies, read from custom.3rd_party -> "
                             "estimated_shipping_ground.")
    parser.add_argument("--out-dir", default="build/feeds")
    parser.add_argument("--shop", default=os.environ.get("SHOPIFY_SHOP"))
    parser.add_argument("--token", default=os.environ.get("SHOPIFY_ADMIN_TOKEN"))
    args = parser.parse_args()

    if not args.shop or not args.token:
        parser.error("set SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN, or pass --shop/--token")

    rules = json.loads(RULES.read_text(encoding="utf-8"))
    labels = load_labels(args.labels_lookup)
    titles = load_title_overrides()
    shipping = load_shipping(args.shipping_lookup)
    ground_estimates = load_ground_estimates(args.ground_shipping_estimates)

    out = pathlib.Path(args.out_dir)
    buckets = {"googleshoppingfs": [], "googleshoppingfrenchfitness": []}
    report = []
    label_report = []
    label_sources = []
    scanned = 0

    for product in fetch_products(args.shop, args.token):
        scanned += 1
        reason = excluded_by_shared_rules(product, rules)
        if reason:
            continue
        feed = feed_for(product, rules)
        if not feed:
            continue
        buckets[feed].extend(
            variant_rows(product, feed, rules, labels, titles, shipping, ground_estimates, report,
                         label_report, label_sources))

    ff_cols = write_feed(out / "googleshoppingfrenchfitness.csv", FF_COLUMNS, buckets["googleshoppingfrenchfitness"])
    fs_cols = write_feed(out / "googleshoppingfs.csv", FS_COLUMNS, buckets["googleshoppingfs"])

    with (out / "excluded_rows.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["id", "sku", "reason"])
        writer.writerows(report)

    with (out / "label_resolution.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["id", "sku", "note"])
        writer.writerows(label_report)

    by_source = collections.Counter(source for _, _, source in label_sources)
    unlabelled = [(oid, sku) for oid, sku, source in label_sources if source is None]

    missing_titles = sorted(set(titles) - {r["old_id"] for rows in buckets.values() for r in rows})
    missing_shipping = [r["id"] for rows in buckets.values() for r in rows if not r["shipping"]]

    print(f"scanned {scanned} active products")
    print(f"googleshoppingfrenchfitness  {len(buckets['googleshoppingfrenchfitness']):>5} rows, {len(ff_cols)} columns")
    print(f"googleshoppingfs             {len(buckets['googleshoppingfs']):>5} rows, {len(fs_cols)} columns")
    print(f"excluded rows logged         {len(report):>5}  -> {out / 'excluded_rows.csv'}")
    print(f"rows with blank shipping     {len(missing_shipping):>5}  (owned by the missing-shipping pass)")
    print(f"tax columns emitted              0  (all three dropped per delta 5)")
    print(f"labels resolved by SKU       {by_source.get('sku', 0):>6}")
    print(f"labels resolved by offer id  {by_source.get('offer_id', 0):>6}")
    print(f"labels resolved by product id{by_source.get('product_id', 0):>6}")
    print(f"rows with NO lookup match    {len(unlabelled):>6}  -> blank custom_label_3/4")
    print(f"label notes logged           {len(label_report):>6}  -> {out / 'label_resolution.csv'}")
    if unlabelled:
        print("\nWARNING: the rows above carry no priority tier and no series, so they fall")
        print("outside every label-targeted asset group. That is a scope question for Tim,")
        print("not something this generator should invent. See label_resolution.csv.")
    if ground_estimates is None:
        print("\nNote: no --ground-shipping-estimates override supplied, so the SOP's $1,000")
        print("ground-shipping exclusion was applied from custom.3rd_party ->")
        print("estimated_shipping_ground. 87 of 4,653 metaobjects have no value there; those")
        print("products are NOT excluded by the rule and are listed in excluded_rows.csv by")
        print("their other exclusion reason, if any.")
    print(f"\n{len(UNMAPPED)} columns emitted BLANK and carried in the live rows today:")
    print("  " + ", ".join(UNMAPPED))
    print("  Each blank is data loss at cutover. Map or sign off before repointing.")
    if missing_titles:
        print(f"\nWARNING: hero SKUs not present in either feed: {', '.join(missing_titles)}")
        print("Those retitles cannot land until the SKU is in scope. Do not repoint until resolved.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
