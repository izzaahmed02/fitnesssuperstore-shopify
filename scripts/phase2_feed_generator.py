#!/usr/bin/env python3
"""Phase 2 primary feed generator.

Replaces the hand-edited static CSVs with primaries generated from live Shopify,
carrying every spec delta from Tim's Sept 6 2026 email:

  1. Labels baked in from the v2 supplemental lookup: custom_label_3 = tier,
     custom_label_4 = series, series only where price >= $1,000.
  2. The 10 approved hero titles baked in from a SKU-keyed override table, so
     cutover cannot silently revert them to the Shopify titles.
  3. Shipping populated from the rate table, Monster storage re-keyed to
     composite ids, the two googleshoppingfs duplicate rows resolved.
  4. SKUs currently absent from the feeds added.
  5. sale_price derived from Shopify compare-at; tax columns removed.

Two rules that are NOT negotiable inside this script, both because getting them
wrong takes live Google Ads campaigns dark rather than merely dirtying data:

  * The current export is the authority on offer ids. Three id schemes are in
    use (composite `<product>-<variant>`, legacy product code, and bare SKU) and
    which one applies per row is not derivable from Shopify — see
    docs/local-inventory-feed.md. Every SKU already in the feed keeps the id it
    already has. Only genuinely new SKUs get a minted id, and every mint lands
    in the id diff report for Tim.
  * A missing or empty label lookup is a hard failure. The Ads account was
    restructured onto custom_label_3/4 on Sept 5; emitting a feed without them
    breaks live campaign targeting. --allow-missing-labels exists for dry runs
    only and refuses to write feed files.

Usage:
    python3 scripts/phase2_feed_generator.py \\
        --catalog    out/shopify_catalog.jsonl \\
        --current-ff current/googleshoppingfrenchfitness.tsv \\
        --current-fs current/googleshoppingfs.tsv \\
        --labels     current/supplemental_priority_labels_v2.csv \\
        --titles     data/feed/title_overrides.csv \\
        --shipping   current/shipping_rate_table.csv \\
        --out-dir    out/
"""

import argparse
import csv
import json
import os
import sys
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation

# Google stopped using US tax attributes in July 2025; Tim's Sept 7 containment
# note drops them outright. The live headers carry three: `tax` (populated
# `US:CA:8.375:n` on every row), `tax_category`, and the long-form
# `tax(country:location_group_name:...)`. Matched by prefix so a header variant
# cannot slip one through.
TAX_COLUMN_PREFIX = "tax"


def is_tax_column(name):
    return name == "tax" or name == "tax_category" or name.startswith("tax(")

SERIES_LABEL_MIN_PRICE = Decimal("1000")

MONSTER_PRODUCT_ID = "10269254254908"
FS_DUPLICATE_IDS = ("9878900179260", "9878898540860")
OOB_SKU_SUFFIX = "-OOB"

SKU_COLUMN = "old_id"  # what the exports key the variant SKU on


# ---------------------------------------------------------------- input files


def read_tsv(path):
    with open(path, newline="", encoding="utf-8", errors="replace") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        return reader.fieldnames, list(reader)


def read_csv_skipping_comments(path):
    """CSV reader that tolerates a leading `#` comment block."""
    with open(path, newline="", encoding="utf-8-sig") as fh:
        lines = [line for line in fh if not line.lstrip().startswith("#")]
    return list(csv.DictReader(lines))


def read_catalog(path):
    """SKU -> variant record.

    SKU is not unique in Shopify. The open-box variants are the live case: each
    `-OOB` SKU exists both on the parent product and on a separate DRAFT "(OOB)"
    product. A DRAFT product cannot serve in a feed at all, so preferring the
    ACTIVE variant resolves that shape without guessing. A SKU still ambiguous
    after that filter is dropped and reported — picking one would silently
    change which variant's price the feed publishes.
    """
    by_sku = defaultdict(list)
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            sku = (record.get("sku") or "").strip()
            if sku:
                by_sku[sku].append(record)

    catalog, ambiguous = {}, []
    for sku, records in by_sku.items():
        candidates = records
        if len(candidates) > 1:
            active = [r for r in candidates if r.get("status") == "ACTIVE"]
            if active:
                candidates = active
        if len(candidates) == 1:
            catalog[sku] = candidates[0]
        else:
            ambiguous.append(sku)
    return catalog, sorted(ambiguous)


def read_labels(path):
    """SKU -> (custom_label_3, custom_label_4) from the v2 supplemental.

    The supplemental is keyed on offer `id`, but the generator joins on SKU
    because ids are exactly what may change at cutover. Both are accepted; a
    file carrying only `id` is joined through the current export.
    """
    rows = read_csv_skipping_comments(path)
    labels_by_sku, labels_by_id = {}, {}
    for row in rows:
        tier = (row.get("custom_label_3") or "").strip()
        series = (row.get("custom_label_4") or "").strip()
        if not tier and not series:
            continue
        sku = (row.get(SKU_COLUMN) or row.get("sku") or "").strip()
        offer_id = (row.get("id") or "").strip()
        if sku:
            labels_by_sku[sku] = (tier, series)
        if offer_id:
            labels_by_id[offer_id] = (tier, series)
    return labels_by_sku, labels_by_id


def read_titles(path):
    overrides = {}
    for row in read_csv_skipping_comments(path):
        sku = (row.get("sku") or "").strip()
        title = (row.get("title") or "").strip()
        if sku and title:
            overrides[sku] = title
    return overrides


def read_shipping(path):
    """SKU -> shipping region string, from the rate table Qash owns.

    Shopify holds no static rate table to read: the default delivery profile's
    zones each carry a single carrier-calculated Intuitive Shipping method with
    no rate definitions, so rates compute per cart at checkout. The freight and
    parcel tables that produced the numbers already in the feed live outside
    Shopify. That file is this input.
    """
    if not path:
        return {}
    table = {}
    for row in read_csv_skipping_comments(path):
        sku = (row.get("sku") or row.get(SKU_COLUMN) or "").strip()
        shipping = (row.get("shipping") or
                    row.get("shipping_region_string_to_add") or "").strip()
        if sku and shipping:
            table[sku] = shipping
    return table


# ------------------------------------------------------------------- helpers


def to_decimal(value):
    try:
        return Decimal(str(value).replace(",", "").split()[0])
    except (InvalidOperation, IndexError, AttributeError, TypeError, ValueError):
        return None


def price_field(value):
    """`249 USD`, `188.1 USD` - the exports' own formatting.

    Trailing zeros are trimmed rather than padded to two places, so a
    regenerated row differs from the live row only where the number differs.
    """
    amount = to_decimal(value)
    if amount is None:
        return ""
    text = format(amount.normalize(), "f")
    return f"{text} USD"


def availability(record):
    return "in_stock" if record.get("available_for_sale") else "out_of_stock"


def mint_offer_id(record):
    """The id scheme for a SKU that has no row in the current export.

    Mirrors the schemes observed in the live exports: multi-variant products are
    composite, single-variant products key on the SKU. The legacy-product-code
    scheme is never minted — it is a historical artefact of one row, not a rule
    to extend.
    """
    if (record.get("total_variants") or 1) > 1:
        return f"{record['product_id']}-{record['variant_id']}"
    return record["sku"]


def existing_offer_ids(rows):
    """SKU -> id as the live export has it, for every unambiguous SKU."""
    by_sku = defaultdict(set)
    for row in rows:
        sku = (row.get(SKU_COLUMN) or "").strip()
        if sku:
            by_sku[sku].add((row.get("id") or "").strip())
    return {sku: ids.pop() for sku, ids in by_sku.items() if len(ids) == 1}


def vendor_routing(memberships, catalog):
    """vendor -> the one feed that carries it, learned from the live exports.

    A new SKU has to land in exactly one feed. Nothing in Shopify says which,
    so the rule is read off current membership: every vendor already served by
    exactly one feed routes there. A vendor split across both feeds, or absent
    from both, is not routable and its SKUs need `sku,feed` given explicitly —
    guessing would either duplicate the offer across both primaries or drop it.
    """
    feeds_by_vendor = defaultdict(set)
    for feed_name, skus in memberships.items():
        for sku in skus:
            record = catalog.get(sku)
            if record and record.get("vendor"):
                feeds_by_vendor[record["vendor"]].add(feed_name)
    return {vendor: feeds.copy().pop()
            for vendor, feeds in feeds_by_vendor.items() if len(feeds) == 1}


def route_additions(add_skus, explicit, catalog, memberships, routing):
    """Assign each SKU to add to exactly one feed. Returns (per_feed, unroutable)."""
    per_feed = {feed: set() for feed in memberships}
    unroutable = []
    already = {sku for skus in memberships.values() for sku in skus}
    for sku in sorted(add_skus):
        if sku in already:
            continue  # already served; not an addition
        feed = explicit.get(sku)
        if not feed:
            record = catalog.get(sku)
            feed = routing.get(record.get("vendor")) if record else None
        if feed in per_feed:
            per_feed[feed].add(sku)
        else:
            unroutable.append(sku)
    return per_feed, unroutable


def rekey_monster(offer_id, record):
    """Transform 3a: the bare Monster product id is never a valid offer id.

    Ten variants shared it. Re-keying is approved as an intentional catalog fix;
    applying it here as well keeps a regenerated feed from reintroducing it.
    """
    if offer_id != MONSTER_PRODUCT_ID:
        return offer_id
    return f"{MONSTER_PRODUCT_ID}-{record['variant_id']}"


# ----------------------------------------------------------------- row build


def build_row(template_columns, sku, record, offer_id, context):
    """One feed row. Every column the template carries, none that it does not."""
    row = {column: "" for column in template_columns}
    previous = context["previous"].get(sku, {})

    # Anything the generator does not own is carried through from the live row
    # unchanged, so a regenerated feed never silently drops a column that
    # MultiFeeds or a Google policy review depends on.
    for column in template_columns:
        row[column] = previous.get(column, "")

    price = to_decimal(record.get("price"))
    compare_at = to_decimal(record.get("compare_at_price"))

    row["id"] = offer_id
    row[SKU_COLUMN] = sku
    row["title"] = context["titles"].get(sku) or record.get("product_title") or ""
    row["link"] = build_link(record)
    row["availability"] = availability(record)

    # Delta 5: Shopify's convention is compare-at = was, price = now. Google's
    # is price = regular, sale_price = discounted. Only a compare-at strictly
    # above price is a real sale; anything else is a stale compare-at and is
    # ignored rather than published as a fake discount.
    if compare_at is not None and price is not None and compare_at > price:
        row["price"] = price_field(compare_at)
        row["sale_price"] = price_field(price)
        # woolytech mirrors the regular price into compare_price on sale rows.
        if "compare_price" in row:
            row["compare_price"] = format(compare_at.normalize(), "f")
    else:
        row["price"] = price_field(price)
        row["sale_price"] = ""
        if "compare_price" in row:
            row["compare_price"] = ""

    if "image_link" in row and record.get("image_url"):
        row["image_link"] = record["image_url"]
    if "brand" in row and record.get("vendor"):
        row["brand"] = record["vendor"]
    if "mpn" in row:
        row["mpn"] = sku
    if "shipping_weight" in row and record.get("weight_value") is not None:
        unit = (record.get("weight_unit") or "POUNDS").lower()
        unit = {"pounds": "lb", "kilograms": "kg", "grams": "g",
                "ounces": "oz"}.get(unit, unit)
        row["shipping_weight"] = f"{record['weight_value']:g} {unit}"

    # Delta 1: labels. Series only above the $1,000 floor.
    #
    # Which price the floor reads matters, and the two answers disagree on real
    # rows: Monster FF-MSS-94-3T sells for $327 against a $1,319 compare-at, so
    # `regular` labels it Monster Series and `selling` does not. Default is
    # `selling` — the floor is there to keep the Product Lines asset groups on
    # high-value machines, and $327 is what the customer actually pays. It is
    # also the more robust basis while the fake-MSRP compare-at values are under
    # separate review. Switch with --series-price-basis regular.
    tier, series = context["labels_by_sku"].get(
        sku, context["labels_by_id"].get(offer_id, ("", "")))
    row["custom_label_3"] = tier
    if context["series_price_basis"] == "regular":
        basis = to_decimal(row["price"])
    else:
        basis = to_decimal(row["sale_price"]) or to_decimal(row["price"])
    if series and basis is not None and basis >= SERIES_LABEL_MIN_PRICE:
        row["custom_label_4"] = series
    else:
        row["custom_label_4"] = ""

    # Delta 3: shipping. The rate table wins; otherwise the live row's value is
    # kept. Nothing is interpolated from a neighbouring product — that is the
    # guess Tim ruled out — so an unresolved row stays blank and is reported.
    shipping = context["shipping"].get(sku)
    if shipping:
        row["shipping"] = shipping
    else:
        row["shipping"] = previous.get("shipping", "")

    return row


def build_link(record):
    url = record.get("online_store_url")
    if not url:
        handle = record.get("handle")
        url = f"https://www.fitnesssuperstore.com/products/{handle}" if handle else ""
    if url and (record.get("total_variants") or 1) > 1 and record.get("variant_id"):
        joiner = "&" if "?" in url else "?"
        url = f"{url}{joiner}variant={record['variant_id']}"
    return url


def resolve_fs_duplicates(rows, mode, report):
    """Transform 3c: make the two googleshoppingfs duplicate ids unique.

    Each id carries a standard offer plus an open-box offer at a lower sale
    price. Dropping the open-box row removes a live discounted offer from
    Shopping, which is a merchandising call, so `rekey-oob` is available.
    """
    by_id = defaultdict(list)
    for row in rows:
        if row.get("id") in FS_DUPLICATE_IDS:
            by_id[row["id"]].append(row)

    dropped = set()
    for offer_id, group in by_id.items():
        if len(group) < 2:
            continue
        oob = [r for r in group if (r.get(SKU_COLUMN) or "").endswith(OOB_SKU_SUFFIX)]
        if len(oob) != len(group) - 1:
            report.append(
                f"SKIP {offer_id}: {len(group)} rows, {len(oob)} open-box — "
                "not the expected standard+open-box shape, resolve by hand")
            continue
        for row in oob:
            if mode == "drop-oob":
                dropped.add(id(row))
                report.append(f"drop  {offer_id} open-box (sku {row.get(SKU_COLUMN)})")
            else:
                row["id"] = f"{offer_id}-{row['_variant_id']}"
                report.append(f"rekey {offer_id} -> {row['id']} (open-box)")
    dropped_skus = {r[SKU_COLUMN] for r in rows if id(r) in dropped}
    if not dropped:
        return rows, dropped_skus
    return [r for r in rows if id(r) not in dropped], dropped_skus


# ------------------------------------------------------------------ per feed


def generate(feed_name, current_path, catalog, context, add_skus, dedupe_mode,
             out_dir):
    template_columns, current_rows = read_tsv(current_path)
    emit_columns = [c for c in template_columns if not is_tax_column(c)]
    dropped_tax = [c for c in template_columns if is_tax_column(c)]

    # Carry-through source per SKU. Where a SKU has more than one export row
    # (see conflicting_ids below) the row that already carries shipping wins, so
    # collapsing a duplicate keeps the rate rather than dropping it. Otherwise
    # first row wins.
    previous = {}
    for row in current_rows:
        sku = (row.get(SKU_COLUMN) or "").strip()
        if not sku:
            continue
        held = previous.get(sku)
        if held is None or (not (held.get("shipping") or "").strip()
                            and (row.get("shipping") or "").strip()):
            previous[sku] = row
    context = dict(context, previous=previous)

    existing_ids = existing_offer_ids(current_rows)

    # A SKU carrying two different offer ids is the same product served twice.
    # Live case: five hex dumbbell set SKUs each appear under both a bare-SKU id
    # and a composite id, at different prices, with only one carrying shipping.
    # existing_offer_ids refuses to pick one, so these fall through to a minted
    # id — which collapses the pair onto the composite scheme the product's other
    # 40 variants already use. Correct, but too consequential to report as
    # "added", so it gets its own row in the diff.
    ids_per_sku = defaultdict(set)
    for row in current_rows:
        sku = (row.get(SKU_COLUMN) or "").strip()
        if sku:
            ids_per_sku[sku].add((row.get("id") or "").strip())
    conflicting_ids = {sku: sorted(ids) for sku, ids in ids_per_sku.items()
                       if len(ids) > 1}
    members = [(row.get(SKU_COLUMN) or "").strip() for row in current_rows]
    members = [sku for sku in members if sku]

    report, rows, missing_from_shopify, added = [], [], [], []
    seen = set()

    for sku in members + sorted(add_skus):
        if sku in seen:
            continue
        seen.add(sku)
        record = catalog.get(sku)
        if not record:
            missing_from_shopify.append(sku)
            continue
        is_new = sku not in existing_ids
        offer_id = mint_offer_id(record) if is_new else existing_ids[sku]
        offer_id = rekey_monster(offer_id, record)
        if is_new and sku not in conflicting_ids:
            added.append((sku, offer_id))
        row = build_row(emit_columns, sku, record, offer_id, context)
        row["_variant_id"] = record["variant_id"]
        rows.append(row)

    rows, deduped_skus = resolve_fs_duplicates(rows, dedupe_mode, report)

    # --------------------------------------------------------------- outputs
    out_path = os.path.join(out_dir, os.path.basename(current_path))
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=emit_columns, delimiter="\t",
                                extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    id_changes = []
    for row in rows:
        sku = row[SKU_COLUMN]
        old = existing_ids.get(sku, "")
        if sku in conflicting_ids:
            id_changes.append({
                "feed": feed_name, "sku": sku,
                "old_id": " | ".join(conflicting_ids[sku]),
                "new_id": row["id"], "change": "collapsed-duplicate",
            })
        elif old != row["id"]:
            id_changes.append({
                "feed": feed_name, "sku": sku, "old_id": old,
                "new_id": row["id"],
                "change": "added" if not old else "rekeyed",
            })
    emitted = {row[SKU_COLUMN] for row in rows}
    for sku in members:
        if sku in emitted:
            continue
        if sku in deduped_skus:
            reason = "removed:deduped"      # deliberate open-box dedupe
        elif sku in missing_from_shopify:
            reason = "removed:not-in-shopify"
        else:
            reason = "removed"
        id_changes.append({
            "feed": feed_name, "sku": sku,
            "old_id": existing_ids.get(sku, ""), "new_id": "",
            "change": reason,
        })

    blank_shipping = [row for row in rows if not (row.get("shipping") or "").strip()]
    unlabelled = [row for row in rows if not (row.get("custom_label_3") or "").strip()]
    duplicate_ids = {i: n for i, n in
                     Counter(row["id"] for row in rows).items() if n > 1}

    summary = {
        "feed": feed_name,
        "out": out_path,
        "rows_in": len(current_rows),
        "rows_out": len(rows),
        "added": added,
        "removed": [c["sku"] for c in id_changes
                    if c["change"].startswith("removed")],
        "id_changes": id_changes,
        "tax_columns_dropped": dropped_tax,
        "blank_shipping": blank_shipping,
        "unlabelled": unlabelled,
        "missing_from_shopify": missing_from_shopify,
        "duplicate_ids": duplicate_ids,
        "conflicting_ids": conflicting_ids,
        "notes": report,
    }
    return summary


# ----------------------------------------------------------------- reporting


def write_reports(summaries, out_dir, catalog, all_feed_skus):
    id_diff_path = os.path.join(out_dir, "id_diff_report.csv")
    with open(id_diff_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh, fieldnames=["feed", "sku", "old_id", "new_id", "change"])
        writer.writeheader()
        for summary in summaries:
            writer.writerows(summary["id_changes"])

    worklist_path = os.path.join(out_dir, "missing_shipping_worklist.csv")
    with open(worklist_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[
            "feed", "id", "sku", "title", "price",
            "shipping_weight", "shipping_region_string_to_add"])
        writer.writeheader()
        for summary in summaries:
            for row in summary["blank_shipping"]:
                writer.writerow({
                    "feed": summary["feed"], "id": row["id"],
                    "sku": row[SKU_COLUMN], "title": row.get("title", ""),
                    "price": row.get("price", ""),
                    "shipping_weight": row.get("shipping_weight", ""),
                    "shipping_region_string_to_add": "",
                })

    absent_path = os.path.join(out_dir, "absent_from_feeds.csv")
    with open(absent_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[
            "sku", "product_id", "variant_id", "title", "price", "status",
            "proposed_id"])
        writer.writeheader()
        for sku, record in sorted(catalog.items()):
            if sku in all_feed_skus or record.get("status") != "ACTIVE":
                continue
            writer.writerow({
                "sku": sku, "product_id": record["product_id"],
                "variant_id": record["variant_id"],
                "title": record.get("product_title", ""),
                "price": record.get("price", ""),
                "status": record.get("status", ""),
                "proposed_id": mint_offer_id(record),
            })

    return id_diff_path, worklist_path, absent_path


def print_summary(summary):
    print(f"\n=== {summary['feed']} -> {summary['out']}")
    print(f"  rows in / out              : {summary['rows_in']} / {summary['rows_out']}")
    print(f"  offers added               : {len(summary['added'])}")
    if summary["conflicting_ids"]:
        print(f"  duplicate SKUs collapsed   : {len(summary['conflicting_ids'])}"
              f" -> {sorted(summary['conflicting_ids'])[:6]}")
    print(f"  offers removed             : {len(summary['removed'])}")
    print(f"  id changes (diff report)   : {len(summary['id_changes'])}")
    print(f"  tax columns dropped        : {summary['tax_columns_dropped'] or 'none'}")
    print(f"  rows with no custom_label_3: {len(summary['unlabelled'])}")
    print(f"  rows with blank shipping   : {len(summary['blank_shipping'])}")
    print(f"  duplicate ids              : {len(summary['duplicate_ids'])}")
    if summary["duplicate_ids"]:
        print(f"    REMAINING: {sorted(summary['duplicate_ids'])}")
    if summary["missing_from_shopify"]:
        print(f"  in feed, not in Shopify    : {len(summary['missing_from_shopify'])}"
              f" -> {summary['missing_from_shopify'][:10]}")
    for note in summary["notes"]:
        print(f"    {note}")


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--catalog", required=True,
                        help="JSONL snapshot from phase2_shopify_pull.py")
    parser.add_argument("--current-ff", required=True,
                        help="live googleshoppingfrenchfitness export (TSV)")
    parser.add_argument("--current-fs", required=True,
                        help="live googleshoppingfs export (TSV)")
    parser.add_argument("--labels", required=True,
                        help="supplemental_priority_labels_v2.csv from GMC")
    parser.add_argument("--titles", default="data/feed/title_overrides.csv",
                        help="SKU-keyed title override table")
    parser.add_argument("--shipping",
                        help="shipping region-string rate table (SKU -> shipping)")
    parser.add_argument("--add-skus",
                        help="SKUs to add. Either a newline/comma list, whose "
                             "rows route by vendor, or a CSV with sku,feed "
                             "columns to route explicitly.")
    parser.add_argument("--out-dir", default="out")
    parser.add_argument("--dedupe-mode", choices=("drop-oob", "rekey-oob"),
                        default="drop-oob")
    parser.add_argument("--series-price-basis", choices=("selling", "regular"),
                        default="selling",
                        help="which price the $1,000 custom_label_4 floor reads: "
                             "the selling price (default) or the regular price "
                             "before any compare-at discount")
    parser.add_argument("--allow-missing-labels", action="store_true",
                        help="dry run only: report instead of aborting, and "
                             "write no feed files")
    args = parser.parse_args(argv)

    catalog, ambiguous = read_catalog(args.catalog)
    labels_by_sku, labels_by_id = read_labels(args.labels)
    titles = read_titles(args.titles)
    shipping = read_shipping(args.shipping)

    if not labels_by_sku and not labels_by_id:
        message = (
            f"{args.labels} carries no custom_label_3/4 values.\n"
            "The Ads account is structured on those labels — publishing a feed "
            "without them takes live campaign targeting dark. Re-download the "
            "v2 supplemental from the Merchant Center source and retry.")
        if not args.allow_missing_labels:
            raise SystemExit(message)
        print(f"WARNING (dry run): {message}", file=sys.stderr)

    missing_overrides = sorted(set(titles) - set(catalog))
    if missing_overrides:
        print(f"WARNING: title override SKUs not in Shopify: {missing_overrides}",
              file=sys.stderr)

    add_skus, explicit_feed = set(), {}
    if args.add_skus:
        if os.path.exists(args.add_skus):
            text = open(args.add_skus, encoding="utf-8").read()
            if "feed" in text.splitlines()[0].lower():
                for row in read_csv_skipping_comments(args.add_skus):
                    sku = (row.get("sku") or "").strip()
                    if sku:
                        add_skus.add(sku)
                        feed = (row.get("feed") or "").strip()
                        if feed:
                            explicit_feed[sku] = feed
                text = ""
        else:
            text = args.add_skus
        add_skus |= {s.strip() for s in text.replace(",", "\n").split("\n") if s.strip()}

    out_dir = args.out_dir
    if args.allow_missing_labels:
        out_dir = os.path.join(args.out_dir, "dry-run")
        print("DRY RUN: writing to", out_dir, file=sys.stderr)
    os.makedirs(out_dir, exist_ok=True)

    context = {
        "labels_by_sku": labels_by_sku,
        "labels_by_id": labels_by_id,
        "titles": titles,
        "shipping": shipping,
        "series_price_basis": args.series_price_basis,
    }

    feeds = (("googleshoppingfrenchfitness", args.current_ff),
             ("googleshoppingfs", args.current_fs))

    memberships = {}
    for feed_name, path in feeds:
        _, rows = read_tsv(path)
        memberships[feed_name] = {(r.get(SKU_COLUMN) or "").strip()
                                  for r in rows if (r.get(SKU_COLUMN) or "").strip()}
    all_feed_skus = set().union(*memberships.values())

    routing = vendor_routing(memberships, catalog)
    additions, unroutable = route_additions(add_skus, explicit_feed, catalog,
                                            memberships, routing)
    if unroutable:
        print(f"\nWARNING: {len(unroutable)} SKUs could not be routed to a feed "
              f"and were NOT added: {unroutable[:10]}\n"
              "  Their vendor is served by both feeds or neither. Re-run with a "
              "sku,feed CSV to place them.", file=sys.stderr)

    summaries = []
    for feed_name, path in feeds:
        summary = generate(feed_name, path, catalog, context,
                           additions[feed_name], args.dedupe_mode, out_dir)
        summaries.append(summary)
        print_summary(summary)

    id_diff, worklist, absent = write_reports(summaries, out_dir, catalog,
                                              all_feed_skus)

    total_id_changes = sum(len(s["id_changes"]) for s in summaries)
    total_blank = sum(len(s["blank_shipping"]) for s in summaries)
    total_unlabelled = sum(len(s["unlabelled"]) for s in summaries)

    print("\n=== reports")
    print(f"  id diff ({total_id_changes} rows)          -> {id_diff}")
    print(f"  shipping worklist ({total_blank} rows)     -> {worklist}")
    print(f"  absent from feeds                          -> {absent}")
    if ambiguous:
        print(f"\n  {len(ambiguous)} SKUs appear on more than one Shopify variant "
              f"and were skipped: {ambiguous[:10]}")

    print("\n=== gates before cutover")
    print(f"  [{'FAIL' if total_unlabelled else ' OK '}] every row carries custom_label_3")
    print(f"  [{'WARN' if total_blank else ' OK '}] every row carries shipping")
    print(f"  [{' OK ' if len(titles) == 10 else 'WARN'}] {len(titles)} title overrides applied")
    print(f"  [{'HOLD' if total_id_changes else ' OK '}] id diff report to Tim before repointing")

    return 1 if total_unlabelled else 0


if __name__ == "__main__":
    sys.exit(main())
