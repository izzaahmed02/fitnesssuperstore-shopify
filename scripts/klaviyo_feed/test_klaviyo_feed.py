#!/usr/bin/env python3
"""Offline tests for the Klaviyo feed builder and the catalog backup.

No network, no credentials, no Klaviyo or Shopify access. Run with:
    python3 scripts/klaviyo_feed/test_klaviyo_feed.py
"""

import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build_klaviyo_feed as builder  # noqa: E402
import klaviyo_backup as backup  # noqa: E402
import shopify_bulk_export as exporter  # noqa: E402


def product(pid, sku, price, **overrides):
    node = {
        "id": f"gid://shopify/Product/{pid}",
        "title": f"Product {pid}",
        "status": "ACTIVE",
        "vendor": "French Fitness",
        "description": "<p>Hello  world</p>",
        "handle": f"p{pid}",
        "onlineStoreUrl": f"https://www.fitnesssuperstore.com/products/p{pid}",
        "featuredMedia": {"preview": {"image": {"url": "https://cdn.shopify.com/hero.webp"}}},
        "category": {"fullName": "Sporting Goods > Weight Lifting"},
        "mf_mpn": {"value": sku},
        "mf_upc": {"value": "012345678905"},
        "mf_condition": {"value": "New"},
        "mf_main_category": {"value": "Strength"},
        "mf_sub_category": {"value": "Racks"},
    }
    node.update(overrides)
    variant = {
        "id": f"gid://shopify/ProductVariant/{pid}1",
        "__parentId": node["id"],
        "sku": sku,
        "title": "Default Title",
        "price": price,
        "availableForSale": True,
        "inventoryQuantity": 5,
        "inventoryPolicy": "DENY",
    }
    return node, variant


def write_jsonl(path, nodes):
    with open(path, "w", encoding="utf-8") as handle:
        for node in nodes:
            handle.write(json.dumps(node) + "\n")


class BuilderTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def build(self, nodes, **kwargs):
        jsonl = os.path.join(self.tmp, "bulk.jsonl")
        write_jsonl(jsonl, nodes)
        out = os.path.join(self.tmp, kwargs.pop("out", "out"))
        argv = ["--jsonl", jsonl, "--out", out, "--min-items", str(kwargs.pop("min_items", 1))]
        for key, value in kwargs.items():
            argv += [f"--{key.replace('_', '-')}", value]
        code = builder.main(argv)
        with open(os.path.join(out, "build_report.json"), encoding="utf-8") as handle:
            report = json.load(handle)
        with open(os.path.join(out, "klaviyo_feed.json"), encoding="utf-8") as handle:
            feed = json.load(handle)
        return code, report, feed

    def test_happy_path_emits_admin_price_and_shopify_url(self):
        node, variant = product(1, "SKU-1", "2799.00")
        code, report, feed = self.build([node, variant])
        self.assertEqual(code, 0)
        self.assertTrue(report["reconciliation_clean"])
        self.assertEqual(len(feed), 1)
        self.assertEqual(feed[0]["price"], 2799.0)
        self.assertEqual(feed[0]["condition"], "new")
        self.assertEqual(feed[0]["availability"], "In Stock")
        self.assertNotIn("vspfiles", feed[0]["image_link"])
        self.assertNotIn(".htm", feed[0]["link"])
        # description is flattened to plain text with collapsed whitespace
        self.assertEqual(feed[0]["description"], "Hello world")

    def test_feed_keys_are_exactly_the_mapped_keys(self):
        node, variant = product(1, "SKU-1", "10.00")
        _, _, feed = self.build([node, variant])
        self.assertEqual(list(feed[0].keys()), builder.FEED_KEYS)

    def test_duplicate_with_no_preferred_parent_stays_unresolved(self):
        a, av = product(1, "DUP", "10.00")
        b, bv = product(2, "DUP", "20.00")
        code, report, feed = self.build([a, av, b, bv])
        # neither row is the preferred parent, so neither wins and both are held
        self.assertEqual(feed, [])
        self.assertEqual(report["counts"]["excluded"], 2)
        self.assertEqual(report["counts"]["accounted"], report["counts"]["variant_rows"])
        self.assertEqual(report["duplicate_sku_analysis"]["unresolved"], ["DUP"])
        self.assertEqual(report["exception_reason_counts"]["DUPLICATE_SKU_UNEXPECTED"], 2)
        self.assertEqual(code, 1)

    def test_parent_preferred_wins_and_standalone_is_dropped(self):
        parent_id = int(
            sorted(builder.PREFERRED_PARENT_PRODUCT_IDS)[0].rsplit("/", 1)[-1]
        )
        standalone, sv = product(1, "FF-RCHD5-50", "10.00")
        parent, pv = product(parent_id, "FF-RCHD5-50", "12.00")
        # give the parent a second variant so it looks like the real multi-variant product
        extra = dict(pv, id=f"gid://shopify/ProductVariant/{parent_id}2", sku="FF-RCHD10")
        _, report, feed = self.build([standalone, sv, parent, pv, extra])

        by_sku = {item["id"]: item for item in feed}
        # the surviving row is the parent's, at the parent's price, deep-linked
        self.assertEqual(by_sku["FF-RCHD5-50"]["price"], 12.0)
        self.assertIn(f"?variant={parent_id}1", by_sku["FF-RCHD5-50"]["link"])
        self.assertEqual(
            report["exception_reason_counts"][builder.DUPLICATE_PARENT_PREFERRED], 1
        )
        self.assertEqual(
            report["duplicate_sku_analysis"]["resolved_parent_preferred"],
            ["FF-RCHD5-50"],
        )
        self.assertEqual(report["duplicate_sku_analysis"]["unresolved"], [])
        # the SKU reaches the feed exactly once
        self.assertEqual(report["duplicate_emitted_ids"], [])

    def test_blank_sku_and_zero_price_are_excluded(self):
        node, variant = product(1, "", "0.00")
        _, report, feed = self.build([node, variant])
        self.assertEqual(feed, [])
        self.assertEqual(len(report["blank_sku_rows"]), 1)
        self.assertIn("ZERO_OR_NEGATIVE_PRICE", report["exception_reason_counts"])

    def test_blank_required_mapped_field_excludes_the_row(self):
        node, variant = product(1, "SKU-1", "10.00")
        node["description"] = ""
        _, report, feed = self.build([node, variant])
        self.assertEqual(feed, [])
        self.assertIn(
            "BLANK_REQUIRED_FIELD_DESCRIPTION", report["exception_reason_counts"]
        )

    def test_blank_optional_field_only_warns(self):
        node, variant = product(1, "SKU-1", "10.00")
        node["mf_upc"] = {"value": ""}
        _, report, feed = self.build([node, variant])
        # upc is blank on live catalog items, so it must not exclude the row
        self.assertEqual(len(feed), 1)
        self.assertEqual(report["counts"]["excluded"], 0)
        self.assertIn("BLANK_UPC", report["exception_reason_counts"])

    def test_gift_certificates_never_enter_the_feed(self):
        by_sku, sv = product(1, "GFT-100", "100.00")
        by_title, tv = product(2, "OTHER-1", "100.00")
        by_title["title"] = "Fitness Superstore Gift Certificate"
        _, report, feed = self.build([by_sku, sv, by_title, tv])
        self.assertEqual(feed, [])
        self.assertEqual(report["exception_reason_counts"]["GIFT_CERTIFICATE"], 2)

    def test_backorder_when_overselling_at_zero_stock(self):
        node, variant = product(1, "SKU-1", "10.00")
        variant["inventoryPolicy"] = "CONTINUE"
        variant["inventoryQuantity"] = 0
        _, _, feed = self.build([node, variant])
        self.assertEqual(feed[0]["availability"], "Backorder")

    def test_legacy_taxonomy_is_carried_forward_verbatim(self):
        node, variant = product(1, "SKU-1", "10.00")
        new_node, new_variant = product(2, "SKU-NEW", "10.00")
        legacy_path = os.path.join(self.tmp, "legacy.json")
        with open(legacy_path, "w", encoding="utf-8") as handle:
            json.dump(
                {"SKU-1": {"product_type": "Home > Home > Legacy", "product_category": "Legacy Cat"}},
                handle,
            )
        _, report, feed = self.build(
            [node, variant, new_node, new_variant], legacy_taxonomy=legacy_path
        )
        by_sku = {item["id"]: item for item in feed}
        self.assertEqual(by_sku["SKU-1"]["product_type"], "Home > Home > Legacy")
        self.assertEqual(by_sku["SKU-1"]["product_category"], "Legacy Cat")
        # a SKU with no legacy row falls back to Shopify-derived wording
        self.assertEqual(by_sku["SKU-NEW"]["product_type"], "Strength > Racks")
        self.assertEqual(
            report["taxonomy_source_counts"],
            {"legacy_carry_forward": 1, "shopify_derived": 1},
        )

    def test_min_items_guard_blocks_a_short_feed(self):
        node, variant = product(1, "SKU-1", "10.00")
        code, report, _ = self.build([node, variant], min_items=500)
        self.assertEqual(code, 1)
        self.assertFalse(report["reconciliation_clean"])

    def test_outputs_carry_hashes_and_no_credentials(self):
        node, variant = product(1, "SKU-1", "10.00")
        _, report, _ = self.build([node, variant])
        for meta in report["outputs"].values():
            self.assertEqual(len(meta["sha256"]), 64)
        self.assertNotIn("pk_", json.dumps(report))


class SuppressionTests(unittest.TestCase):
    """Whole-product suppression, applied before duplicate counting."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def build(self, nodes):
        jsonl = os.path.join(self.tmp, "bulk.jsonl")
        write_jsonl(jsonl, nodes)
        out = os.path.join(self.tmp, "out")
        code = builder.main(["--jsonl", jsonl, "--out", out, "--min-items", "0"])
        with open(os.path.join(out, "build_report.json"), encoding="utf-8") as handle:
            report = json.load(handle)
        with open(os.path.join(out, "klaviyo_feed.json"), encoding="utf-8") as handle:
            feed = json.load(handle)
        return code, report, feed

    def test_remove_from_feeds_tag_suppresses_the_product(self):
        node, variant = product(801, "TAG-1", "100.00", tags=["Flooring", "REMOVE FROM FEEDS"])
        _, report, feed = self.build([node, variant])
        self.assertEqual(feed, [])
        self.assertEqual(report["counts"]["suppressed_products"], 1)
        self.assertEqual(report["counts"]["suppressed_variant_rows"], 1)

    def test_tag_match_ignores_case_and_padding(self):
        node, variant = product(802, "TAG-2", "100.00", tags=["  remove from feeds  "])
        _, _, feed = self.build([node, variant])
        self.assertEqual(feed, [])

    def test_suppressed_product_does_not_make_its_sku_look_duplicated(self):
        """The Turf case: a zero-inventory combined listing carrying the same
        SKUs as live standalones must not drag those standalones out of the feed.
        """
        live, live_variant = product(803, "FF-AGSL", "669.00")
        combined, combined_variant = product(
            804, "FF-AGSL", "669.00", tags=["REMOVE FROM FEEDS"]
        )
        code, report, feed = self.build([live, live_variant, combined, combined_variant])

        # the standalone survives, exactly once, and reconciliation still balances
        self.assertEqual([r["id"] for r in feed], ["FF-AGSL"])
        self.assertEqual(feed[0]["link"], live["onlineStoreUrl"])
        self.assertEqual(report["duplicate_sku_analysis"]["unresolved"], [])
        self.assertTrue(report["reconciliation_clean"])
        self.assertEqual(code, 0)

    def test_multi_variant_suppression_counts_products_and_rows_apart(self):
        """An option carrier is one product but many rows; the report must not
        conflate them."""
        node, variant = product(807, "MV-1", "10.00", tags=["REMOVE FROM FEEDS"])
        extra = dict(variant, id="gid://shopify/ProductVariant/8072", sku="MV-2")
        third = dict(variant, id="gid://shopify/ProductVariant/8073", sku="MV-3")
        ok_node, ok_variant = product(808, "OK-9", "10.00")
        _, report, _ = self.build([node, variant, extra, third, ok_node, ok_variant])
        counts = report["counts"]
        self.assertEqual(counts["suppressed_products"], 1)
        self.assertEqual(counts["suppressed_variant_rows"], 3)
        self.assertEqual(counts["variant_rows"], 4)
        self.assertEqual(counts["accounted"], 4)
        self.assertTrue(report["reconciliation_clean"])

    def test_option_carrier_product_is_suppressed_by_id(self):
        pid = 10278798000444
        node, variant = product(pid, "FF-ACC-APU", "439.00")
        self.assertIn(f"gid://shopify/Product/{pid}", builder.OPTION_CARRIER_PRODUCT_IDS)
        _, report, feed = self.build([node, variant])
        self.assertEqual(feed, [])
        self.assertEqual(report["exception_reason_counts"]["option_carrier_excluded"], 1)

    def test_suppressed_rows_are_still_accounted_for(self):
        ok_node, ok_variant = product(805, "OK-1", "10.00")
        sup_node, sup_variant = product(806, "SUP-1", "10.00", tags=["REMOVE FROM FEEDS"])
        _, report, _ = self.build([ok_node, ok_variant, sup_node, sup_variant])
        counts = report["counts"]
        self.assertEqual(counts["variant_rows"], 2)
        self.assertEqual(counts["accounted"], 2)
        self.assertTrue(report["reconciliation_clean"])

    def test_excluded_sku_is_dropped_from_an_otherwise_feedable_product(self):
        """The standing guard: an excluded SKU is dropped even when its product
        is feedable, so neither the option-carrier list nor a product tag is
        needed to keep it out."""
        node, variant = product(809, "FFT-DCC", "3499.00")
        apu = dict(variant, id="gid://shopify/ProductVariant/8092", sku="FFT-DCC-APU")
        _, report, feed = self.build([node, variant, apu])
        self.assertEqual([r["id"] for r in feed], ["FFT-DCC"])
        self.assertEqual(report["exception_reason_counts"]["sku_excluded"], 1)
        # the product itself is not suppressed, so only the row count moves
        self.assertEqual(report["counts"]["sku_excluded_rows"], 1)
        self.assertEqual(report["counts"]["suppressed_products"], 0)
        self.assertEqual(report["counts"]["accounted"], 2)
        self.assertTrue(report["reconciliation_clean"])

    def test_excluded_sku_match_ignores_case(self):
        node, variant = product(810, "fft-dcc-apu", "159.00")
        _, _, feed = self.build([node, variant])
        self.assertEqual(feed, [])


class CanonicalUrlFallbackTests(unittest.TestCase):
    """2026-09-17 ruling 1: honour custom.product_canonical_url only while it
    resolves to a product that is itself in the feed."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def build(self, nodes):
        jsonl = os.path.join(self.tmp, "bulk.jsonl")
        write_jsonl(jsonl, nodes)
        out = os.path.join(self.tmp, "out")
        builder.main(["--jsonl", jsonl, "--out", out, "--min-items", "0"])
        with open(os.path.join(out, "klaviyo_feed.json"), encoding="utf-8") as handle:
            return json.load(handle)

    def test_canonical_to_a_feedable_product_is_honoured(self):
        target, target_variant = product(901, "TARGET-1", "10.00")
        node, variant = product(
            902,
            "SRC-1",
            "10.00",
            mf_canonical={"value": target["onlineStoreUrl"]},
        )
        feed = self.build([target, target_variant, node, variant])
        link = next(r["link"] for r in feed if r["id"] == "SRC-1")
        self.assertEqual(link, target["onlineStoreUrl"])

    def test_canonical_to_a_suppressed_product_falls_back_to_own_url(self):
        """The Turf case: the combined listing carries REMOVE FROM FEEDS, so the
        three standalones must link to their own handles, not to it."""
        combined, combined_variant = product(
            903, "COMBINED-1", "669.00", tags=["REMOVE FROM FEEDS"]
        )
        standalone, standalone_variant = product(
            904,
            "FF-AGSL-V2",
            "899.00",
            mf_canonical={"value": combined["onlineStoreUrl"]},
        )
        feed = self.build(
            [combined, combined_variant, standalone, standalone_variant]
        )
        link = next(r["link"] for r in feed if r["id"] == "FF-AGSL-V2")
        self.assertEqual(link, standalone["onlineStoreUrl"])

    def test_canonical_to_a_product_outside_the_export_falls_back(self):
        node, variant = product(
            905,
            "SRC-2",
            "10.00",
            mf_canonical={"value": "https://www.fitnesssuperstore.com/products/gone"},
        )
        feed = self.build([node, variant])
        self.assertEqual(feed[0]["link"], node["onlineStoreUrl"])

    def test_fallback_keeps_the_variant_deep_link(self):
        combined, combined_variant = product(
            906, "COMBINED-2", "10.00", tags=["REMOVE FROM FEEDS"]
        )
        node, variant = product(
            907,
            "MV-A",
            "10.00",
            mf_canonical={"value": combined["onlineStoreUrl"]},
        )
        second = dict(variant, id="gid://shopify/ProductVariant/9072", sku="MV-B")
        feed = self.build([combined, combined_variant, node, variant, second])
        links = {r["id"]: r["link"] for r in feed}
        self.assertEqual(links["MV-A"], f"{node['onlineStoreUrl']}?variant=9071")
        self.assertEqual(links["MV-B"], f"{node['onlineStoreUrl']}?variant=9072")

    def test_handle_is_read_from_the_url_path(self):
        self.assertEqual(
            builder.handle_from_product_url(
                "https://www.fitnesssuperstore.com/products/Some-Handle?variant=1"
            ),
            "some-handle",
        )
        self.assertEqual(builder.handle_from_product_url(""), "")
        self.assertEqual(
            builder.handle_from_product_url("https://www.fitnesssuperstore.com/pages/x"),
            "",
        )


class BrandFieldTests(unittest.TestCase):
    """`brand` is mapped as Categories (List) on source 24138 and is required.

    It is what populates Klaviyo catalog categories, which Collection-based
    product feeds select on. A feed without it fails a required field on sync.
    """

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def build(self, nodes):
        jsonl = os.path.join(self.tmp, "bulk.jsonl")
        write_jsonl(jsonl, nodes)
        out = os.path.join(self.tmp, "out")
        code = builder.main(["--jsonl", jsonl, "--out", out, "--min-items", "0"])
        with open(os.path.join(out, "klaviyo_feed.json"), encoding="utf-8") as handle:
            feed = json.load(handle)
        return code, feed

    def test_brand_comes_from_shopify_vendor(self):
        node, variant = product(701, "BRAND-1", "100.00", vendor="Body-Solid")
        _, feed = self.build([node, variant])
        self.assertEqual(feed[0]["brand"], "Body-Solid")

    def test_blank_vendor_is_blocking(self):
        node, variant = product(702, "BRAND-2", "100.00", vendor="")
        _, feed = self.build([node, variant])
        self.assertEqual(feed, [])

    def test_feed_matches_the_source_24138_field_set_exactly(self):
        node, variant = product(703, "BRAND-3", "100.00")
        _, feed = self.build([node, variant])
        # every field mapped, no field unmapped - either breaks the sync
        self.assertEqual(list(feed[0].keys()), builder.FEED_KEYS)
        self.assertNotIn("sku", feed[0])
        self.assertNotIn("inventory_quantity", feed[0])
        self.assertNotIn("published", feed[0])

    def test_rollback_feed_uses_the_same_field_set(self):
        self.assertEqual(backup.FEED_KEYS, builder.FEED_KEYS)


class UnresolvedDuplicateTests(unittest.TestCase):
    """A duplicate with no preferred parent loses the SKU silently otherwise."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def test_unresolved_duplicate_fails_reconciliation(self):
        a_node, a_variant = product(901, "DUP-1", "100.00")
        b_node, b_variant = product(902, "DUP-1", "200.00")
        ok_node, ok_variant = product(903, "OK-1", "300.00")
        jsonl = os.path.join(self.tmp, "bulk.jsonl")
        write_jsonl(jsonl, [a_node, a_variant, b_node, b_variant, ok_node, ok_variant])
        out = os.path.join(self.tmp, "out")
        code = builder.main(
            ["--jsonl", jsonl, "--out", out, "--min-items", "1"]
        )
        with open(os.path.join(out, "build_report.json"), encoding="utf-8") as handle:
            report = json.load(handle)
        with open(os.path.join(out, "klaviyo_feed.json"), encoding="utf-8") as handle:
            feed = json.load(handle)

        # the SKU is gone from the feed entirely - both owners were dropped
        self.assertNotIn("DUP-1", [row["id"] for row in feed])
        self.assertEqual(report["duplicate_sku_analysis"]["unresolved"], ["DUP-1"])
        # the row arithmetic still balances, which is exactly why it needs its own guard
        self.assertEqual(report["counts"]["accounted"], report["counts"]["variant_rows"])
        # so reconciliation must fail on the unresolved duplicate alone
        self.assertFalse(report["reconciliation_clean"])
        self.assertEqual(code, 1)


class BackupTests(unittest.TestCase):
    def test_restore_feed_reproduces_the_live_catalog_verbatim(self):
        tmp = tempfile.mkdtemp()
        items = os.path.join(tmp, "catalog_items.jsonl")
        with open(items, "w", encoding="utf-8") as handle:
            handle.write(
                json.dumps(
                    {
                        "id": "$custom:::$default:::FFT-ACD",
                        "attributes": {
                            "external_id": "FFT-ACD",
                            "title": "Tahoe Assisted Chin Dip",
                            "description": "desc",
                            "price": 2699,
                            "url": "https://www.fitnesssuperstore.com/x-p/FFT-ACD.htm",
                            "image_full_url": "https://www.fitnesssuperstore.com/v/vspfiles/photos/FFT-ACD-2.jpg",
                            "published": True,
                            "custom_metadata": {
                                "mpn": "FFT-ACD",
                                "upc": "810041972552",
                                "condition": "new",
                                "availability": "In Stock",
                                "product_type": "Home > Home > Legacy",
                                "product_category": "Legacy Cat",
                            },
                        },
                    }
                )
                + "\n"
            )
        feed = backup.restore_feed_from_items(items)
        self.assertEqual(len(feed), 1)
        row = feed[0]
        # the rollback feed must preserve the pre-cutover values exactly, defects included
        self.assertEqual(row["price"], 2699)
        self.assertIn(".htm", row["link"])
        self.assertIn("vspfiles", row["image_link"])
        self.assertEqual(row["product_type"], "Home > Home > Legacy")
        # inventory_quantity/inventory_policy are deliberately absent: they are
        # not in the source 24138 mapping, and an unmapped field breaks the sync
        self.assertNotIn("inventory_quantity", row)
        self.assertEqual(list(row.keys()), backup.FEED_KEYS)

    def test_feed_key_order_matches_the_builder(self):
        self.assertEqual(backup.FEED_KEYS, builder.FEED_KEYS)

    def test_missing_key_fails_loudly_instead_of_running_unauthenticated(self):
        with self.assertRaises(SystemExit):
            backup.KlaviyoReadOnlyClient(None)

    def test_client_exposes_no_write_verb(self):
        methods = dir(backup.KlaviyoReadOnlyClient)
        for forbidden in ("post", "patch", "put", "delete", "_post", "_patch", "_delete"):
            self.assertNotIn(forbidden, methods)


class BulkExportTests(unittest.TestCase):
    """The polling state machine, exercised offline through a fake transport."""

    def make(self, script):
        """script: list of GraphQL responses returned in order."""
        calls = []

        def transport(query, variables):
            calls.append((query, variables))
            return script[len(calls) - 1]

        client = exporter.ShopifyBulkExporter(
            shop="example.myshopify.com", token="unused", transport=transport
        )
        return client, calls

    def test_submit_returns_the_operation_id(self):
        client, calls = self.make(
            [{"data": {"bulkOperationRunQuery": {
                "bulkOperation": {"id": "gid://shopify/BulkOperation/1", "status": "CREATED"},
                "userErrors": []}}}]
        )
        self.assertEqual(client.submit("{ products { edges { node { id } } } }"),
                         "gid://shopify/BulkOperation/1")
        # the bulk query is passed as a variable, not interpolated into the mutation
        self.assertIn("q", calls[0][1])

    def test_submit_raises_on_user_errors(self):
        client, _ = self.make(
            [{"data": {"bulkOperationRunQuery": {
                "bulkOperation": None,
                "userErrors": [{"field": ["query"], "message": "bad query"}]}}}]
        )
        with self.assertRaises(SystemExit):
            client.submit("{}")

    def test_wait_polls_until_completed(self):
        client, calls = self.make([
            {"data": {"node": {"status": "RUNNING"}}},
            {"data": {"node": {"status": "RUNNING"}}},
            {"data": {"node": {"status": "COMPLETED", "url": "https://example/r.jsonl",
                               "objectCount": "7702", "fileSize": "9047543"}}},
        ])
        node = client.wait("gid://x", timeout_seconds=999, sleep=lambda _s: None)
        self.assertEqual(node["objectCount"], "7702")
        self.assertEqual(len(calls), 3)

    def test_wait_raises_when_operation_fails(self):
        client, _ = self.make(
            [{"data": {"node": {"status": "FAILED", "errorCode": "INTERNAL_SERVER_ERROR"}}}]
        )
        with self.assertRaises(SystemExit):
            client.wait("gid://x", timeout_seconds=999, sleep=lambda _s: None)

    def test_wait_raises_when_completed_without_url(self):
        client, _ = self.make([{"data": {"node": {"status": "COMPLETED", "url": None}}}])
        with self.assertRaises(SystemExit):
            client.wait("gid://x", timeout_seconds=999, sleep=lambda _s: None)

    def test_wait_times_out_rather_than_looping_forever(self):
        client, _ = self.make([{"data": {"node": {"status": "RUNNING"}}}] * 5)
        with self.assertRaises(SystemExit):
            client.wait("gid://x", timeout_seconds=0, sleep=lambda _s: None)

    def test_graphql_errors_surface(self):
        client, _ = self.make([{"errors": [{"message": "Throttled"}]}])
        with self.assertRaises(SystemExit):
            client.submit("{}")

    def test_preflight_accepts_a_token_that_can_read_products(self):
        client, _ = self.make([{"data": {
            "shop": {"myshopifyDomain": "example.myshopify.com"},
            "products": {"edges": [{"node": {"id": "gid://shopify/Product/1"}}]}}}])
        self.assertEqual(client.preflight(), "example.myshopify.com")

    def test_preflight_names_the_missing_scope(self):
        client, _ = self.make([{"errors": [{"message": "ACCESS_DENIED", "extensions": {
            "code": "ACCESS_DENIED", "requiredAccess": "read_products"}}]}])
        with self.assertRaises(SystemExit) as caught:
            client.preflight()
        self.assertIn("read_products", str(caught.exception))

    def test_preflight_rejects_a_revoked_token(self):
        client, _ = self.make([{"data": {"shop": None, "products": None}}])
        with self.assertRaises(SystemExit) as caught:
            client.preflight()
        self.assertIn("revoked", str(caught.exception))

    def test_missing_credentials_fail_loudly(self):
        saved = {k: os.environ.pop(k, None) for k in ("SHOPIFY_SHOP", "SHOPIFY_ADMIN_TOKEN")}
        try:
            with self.assertRaises(SystemExit):
                exporter.ShopifyBulkExporter()
        finally:
            for key, value in saved.items():
                if value is not None:
                    os.environ[key] = value


if __name__ == "__main__":
    unittest.main(verbosity=2)
