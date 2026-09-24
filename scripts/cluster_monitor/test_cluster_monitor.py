#!/usr/bin/env python3
"""Offline tests for the widened cluster monitoring trigger.

No network, no credentials. Every email below is synthetic; each case mirrors
the shape of a record named on the Deliverability thread. Run with:
    python3 scripts/cluster_monitor/test_cluster_monitor.py
"""

import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cluster_monitor as monitor  # noqa: E402

RAW = "https://79ef8b-5e.myshopify.com/88420122940/checkouts/ac/tok/recover?key=SECRET&locale=en-US"
WWW = "https://www.fitnesssuperstore.com/88420122940/checkouts/ac/tok/recover?key=SECRET&locale=en-US"

_next_id = [42700000000000]


def checkout(created, url=RAW, email="x@example.test", first=None, last=None,
             customer_created=None, orders="0", lines=(("FF-RCHD2-5", 1),), customer=True):
    _next_id[0] += 1
    node = {
        "id": f"gid://shopify/AbandonedCheckout/{_next_id[0]}",
        "createdAt": created,
        "completedAt": None,
        "abandonedCheckoutUrl": url,
        "customer": {
            "email": email,
            "firstName": first,
            "lastName": last,
            "createdAt": customer_created if customer_created is not None else created,
            "numberOfOrders": orders,
        } if customer else None,
        "lineItems": {"edges": [{"node": {"sku": s, "quantity": q}} for s, q in lines]},
    }
    return node


def run(nodes, since="2026-09-01T00:00:00Z", until="2026-10-01T00:00:00Z", **kwargs):
    return monitor.evaluate(
        [monitor.normalize(n) for n in nodes],
        monitor.parse_time(since), monitor.parse_time(until), **kwargs
    )


def ids(entries):
    return [e["id"] for e in entries]


class RuleTests(unittest.TestCase):
    def test_mark_harris15_case_flags_on_watched_sku(self):
        # Sept 8 live test case: raw host, FF-RCHD2-5 qty 1, profile created at
        # the checkout second, zero orders, firstname.lastname+digits.
        node = checkout("2026-09-08T12:20:32Z", email="mark.harris15@example.test",
                        first="Mark", last="Harris")
        result = run([node])
        self.assertEqual(len(result["flagged"]), 1)
        flag = result["flagged"][0]
        self.assertEqual(flag["reasons"], ["email_shape", "first_checkout"])
        self.assertEqual(flag["new_skus"], [])

    def test_digitless_address_still_flags_via_first_checkout(self):
        # Sept 16 run used addresses like carol_white@ that the shape misses.
        result = run([checkout("2026-09-16T00:07:33Z", email="carol_white@example.test")])
        self.assertEqual(result["flagged"][0]["reasons"], ["first_checkout"])

    def test_persona_on_unwatched_sku_is_a_new_combination(self):
        node = checkout("2026-09-16T09:41:03Z", email="johntaylor282@example.test",
                        first="James", last="Anderson", lines=(("FF-RF-TS12v1", 1),))
        flag = run([node])["flagged"][0]
        self.assertIn("persona_name", flag["reasons"])
        self.assertEqual(flag["new_skus"], ["FF-RF-TS12v1"])

    def test_ffm_family_is_watched(self):
        node = checkout("2026-08-28T02:29:34Z", lines=(("FFM-SKIROW", 1),))
        flag = run([node], since="2026-08-28T00:00:00Z")["flagged"][0]
        self.assertEqual(flag["new_skus"], [])

    def test_sadsjahk_pattern_later_checkouts_flag_on_burst(self):
        # The profile was created at its first checkout, which is a property of
        # the profile, so every checkout it makes carries first_checkout; three in
        # 24h adds the burst reason.
        email = "sadsjahk@example.test"
        created = "2026-08-28T02:29:34Z"
        nodes = [
            checkout(created, email=email, customer_created=created, lines=(("FFM-SKIROW", 1),)),
            checkout("2026-08-28T05:39:33Z", email=email, customer_created=created, lines=(("FFM-ANH", 1),)),
            checkout("2026-08-28T06:59:03Z", email=email, customer_created=created, lines=(("FFM-PLSLR", 1),)),
        ]
        result = run(nodes, since="2026-08-28T00:00:00Z")
        self.assertEqual(len(result["flagged"]), 3)
        for flag in result["flagged"]:
            self.assertEqual(flag["reasons"], ["first_checkout", "three_plus_24h"])

    def test_burst_alone_catches_an_older_profile(self):
        email = "older@example.test"
        old = "2025-01-01T00:00:00Z"
        nodes = [checkout(f"2026-09-10T0{h}:00:00Z", email=email, customer_created=old) for h in (1, 2, 3)]
        result = run(nodes)
        self.assertEqual([f["reasons"] for f in result["flagged"]], [["three_plus_24h"]] * 3)

    def test_two_checkouts_in_24h_is_not_a_burst(self):
        email = "someone@example.test"
        nodes = [
            checkout("2026-09-10T01:00:00Z", email=email, customer_created="2025-01-01T00:00:00Z", orders="3"),
            checkout("2026-09-10T02:00:00Z", email=email, customer_created="2025-01-01T00:00:00Z", orders="3"),
        ]
        self.assertEqual(run(nodes)["flagged"], [])

    def test_legitimate_raw_host_control_is_not_flagged(self):
        # glorymar320@ / jperkey100910@-style controls: returning buyers.
        node = checkout("2026-09-10T18:00:00Z", email="glorymar@example.test",
                        customer_created="2025-03-01T00:00:00Z", orders="2")
        self.assertEqual(run([node])["flagged"], [])

    def test_www_host_is_never_flagged_but_is_counted(self):
        node = checkout("2026-09-16T02:56:32Z", url=WWW, email="jessica.smith7091@example.test")
        result = run([node])
        self.assertEqual(result["flagged"], [])
        self.assertEqual(len(result["outside_ruled_definition"]), 1)

    def test_www_host_new_shopper_on_unwatched_sku_is_ignored(self):
        node = checkout("2026-09-16T00:54:32Z", url=WWW, email="cesarflores060808@example.test",
                        lines=(("FF-HDRFM", 1),))
        result = run([node])
        self.assertEqual(result["flagged"], [])
        self.assertEqual(result["outside_ruled_definition"], [])

    def test_raw_host_without_a_quantity_one_line_is_not_flagged(self):
        node = checkout("2026-09-16T01:00:00Z", lines=(("FF-RCHD2-5", 2),))
        self.assertEqual(run([node])["flagged"], [])

    def test_missing_customer_on_raw_host_routes_to_review(self):
        result = run([checkout("2026-09-16T01:00:00Z", customer=False)])
        self.assertEqual(result["flagged"], [])
        self.assertEqual(result["review"][0]["missing"], ["customer"])

    def test_missing_host_routes_to_review(self):
        node = checkout("2026-09-16T01:00:00Z")
        node["abandonedCheckoutUrl"] = ""
        result = run([node])
        self.assertEqual(result["flagged"], [])
        self.assertIn("host", result["review"][0]["missing"])

    def test_context_before_the_window_is_not_reported_but_feeds_the_burst(self):
        email = "burst@example.test"
        old = "2025-01-01T00:00:00Z"
        nodes = [
            checkout("2026-09-15T22:00:00Z", email=email, customer_created=old),
            checkout("2026-09-15T23:00:00Z", email=email, customer_created=old),
            checkout("2026-09-16T01:00:00Z", email=email, customer_created=old),
        ]
        result = run(nodes, since="2026-09-16T00:00:00Z")
        self.assertEqual(result["evaluated"], 1)
        self.assertEqual(result["flagged"][0]["reasons"], ["three_plus_24h"])

    def test_already_reported_ids_are_skipped(self):
        node = checkout("2026-09-16T01:00:00Z", email="mark.harris15@example.test")
        checkout_id = node["id"].rsplit("/", 1)[-1]
        result = run([node], already_reported={checkout_id})
        self.assertEqual(result["flagged"], [])
        self.assertEqual(result["evaluated"], 1)

    def test_compact_records_with_host_only_are_accepted(self):
        node = checkout("2026-09-16T01:00:00Z", email="mark.harris15@example.test")
        node.pop("abandonedCheckoutUrl")
        node["host"] = "79ef8b-5e.myshopify.com"
        node["lineItems"] = [{"sku": "FF-RCHD2-5", "quantity": 1}]
        self.assertEqual(len(run([node])["flagged"]), 1)


class OutputTests(unittest.TestCase):
    def test_outputs_mask_email_and_never_carry_the_recovery_key(self):
        node = checkout("2026-09-16T01:00:00Z", email="mark.harris15@example.test")
        with tempfile.TemporaryDirectory() as out:
            path = os.path.join(out, "in.jsonl")
            with open(path, "w") as handle:
                handle.write(json.dumps(node) + "\n")
            monitor.main(["--input-jsonl", path, "--since", "2026-09-16T00:00:00Z",
                          "--until", "2026-09-17T00:00:00Z", "--out", out])
            summary = open(os.path.join(out, "summary.md")).read()
            report = json.load(open(os.path.join(out, "report.json")))
            csv_text = open(os.path.join(out, "flags.csv")).read()
        self.assertIn("ma***15@example.test", summary)
        self.assertNotIn("mark.harris15@", summary)
        for text in (summary, csv_text, json.dumps(report)):
            self.assertNotIn("SECRET", text)
            self.assertNotIn("recover", text)
        self.assertEqual(report["flag_count"], 1)
        self.assertEqual(report["reason_counts"]["email_shape"], 1)


class ReaderTests(unittest.TestCase):
    def test_fetch_paginates_until_the_last_page(self):
        pages = [
            {"data": {"abandonedCheckouts": {
                "edges": [{"node": {"id": "a"}}],
                "pageInfo": {"hasNextPage": True, "endCursor": "c1"}}}},
            {"data": {"abandonedCheckouts": {
                "edges": [{"node": {"id": "b"}}],
                "pageInfo": {"hasNextPage": False, "endCursor": "c2"}}}},
        ]
        seen = []

        def transport(query, variables):
            seen.append(dict(variables))
            return pages[len(seen) - 1]

        reader = monitor.ShopifyReader(shop="s", token="t", transport=transport)
        nodes = list(reader.fetch(datetime(2026, 9, 15, tzinfo=timezone.utc).date()))
        self.assertEqual([n["id"] for n in nodes], ["a", "b"])
        self.assertEqual(seen[0]["q"], "created_at:>=2026-09-15")
        self.assertIsNone(seen[0]["after"])
        self.assertEqual(seen[1]["after"], "c1")

    def test_preflight_names_the_missing_scope(self):
        def transport(query, variables):
            return {"errors": [{"message": "Access denied", "extensions": {"code": "ACCESS_DENIED"}}]}

        reader = monitor.ShopifyReader(shop="s", token="t", transport=transport)
        with self.assertRaises(SystemExit) as caught:
            reader.preflight()
        self.assertIn("read_orders", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
