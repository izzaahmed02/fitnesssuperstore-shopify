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


def product(pid, sku, price, **overrides):
    node = {
        "id": f"gid://shopify/Product/{pid}",
        "title": f"Product {pid}",
        "status": "ACTIVE",
        "description": "<p>Hello  world</p>",
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

    def test_duplicate_sku_is_excluded_and_reconciles(self):
        a, av = product(1, "DUP", "10.00")
        b, bv = product(2, "DUP", "20.00")
        code, report, feed = self.build([a, av, b, bv])
        self.assertEqual(feed, [])
        self.assertEqual(report["counts"]["excluded"], 2)
        self.assertEqual(report["counts"]["accounted"], report["counts"]["variant_rows"])
        # a duplicate outside the known families must be surfaced, not absorbed
        self.assertEqual(
            report["duplicate_sku_analysis"]["outside_known_families"], ["DUP"]
        )
        # min_items guard trips, so reconciliation is not clean
        self.assertEqual(code, 1)

    def test_named_and_family_duplicates_get_distinct_reason_codes(self):
        a, av = product(1, "FF-RCHD5-50", "10.00")
        b, bv = product(2, "FF-RCHD5-50", "10.00")
        c, cv = product(3, "FF-RCHD10", "10.00")
        d, dv = product(4, "FF-RCHD10", "10.00")
        _, report, _ = self.build([a, av, b, bv, c, cv, d, dv])
        reasons = report["exception_reason_counts"]
        self.assertEqual(reasons["DUPLICATE_SKU_NAMED_IN_AUDIT_HOLD"], 2)
        self.assertEqual(reasons["DUPLICATE_SKU_RCHD_FAMILY_SAME_ROOT_CAUSE"], 2)
        self.assertEqual(report["duplicate_sku_analysis"]["outside_known_families"], [])

    def test_blank_sku_and_zero_price_are_excluded(self):
        node, variant = product(1, "", "0.00")
        _, report, feed = self.build([node, variant])
        self.assertEqual(feed, [])
        self.assertEqual(len(report["blank_sku_rows"]), 1)
        self.assertIn("ZERO_OR_NEGATIVE_PRICE", report["exception_reason_counts"])

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
