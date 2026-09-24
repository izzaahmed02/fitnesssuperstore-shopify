#!/usr/bin/env python3
"""Widened monitoring trigger for the raw-host checkout cluster (read-only).

Implements Tim's September 8 ruling on the "Deliverability" thread. A checkout
is FLAGGED when all of the following hold:

  1. it was abandoned on the raw myshopify host (never the www host; host is a
     required condition, never a standalone fallback), and
  2. it carries a line item at quantity 1, on ANY SKU, and
  3. at least one of:
       - email_shape       cluster email shape: firstname[._]lastname + digits
       - persona_name      a known cluster persona (james anderson, ethan campbell)
       - first_checkout    profile created at its first-checkout timestamp with
                           zero orders
       - three_plus_24h    three or more checkouts from one address inside 24h

Each flag is also tagged WATCHED (every SKU already in the watched set) or NEW
SKU. Per the September 7 ruling, a new SKU/host combination reopens the gate.

A checkout missing a field the rule needs (host, customer, customer creation
time, line items) routes to REVIEW. It is never silently passed or flagged.

Checkouts that match the cluster on a watched SKU and email shape or persona but
sit on the www host are counted separately as "outside the ruled definition".
They are reported for visibility only and are never flagged.

Nothing here writes to Shopify or Klaviyo. The only Shopify call is a paginated
`abandonedCheckouts` query.

Credentials come from the environment only:
    SHOPIFY_SHOP          e.g. fitness-superstore.myshopify.com
    SHOPIFY_ADMIN_TOKEN   Admin API token with read_orders and read_customers
    SHOPIFY_API_VERSION   optional, defaults to DEFAULT_API_VERSION

Recovery URLs carry a secret `key`. Only the hostname is ever kept or printed.
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

DEFAULT_API_VERSION = "2025-07"
PAGE_SIZE = 100

RAW_HOST_SUFFIX = ".myshopify.com"

# Watched set from the Sept 7-8 rulings: the rotated cluster SKUs, plus the
# FFM family folded in on Sept 8.
WATCHED_SKUS = {"FF-RCHD10", "FF-RCHD2-5", "FF-RF-TS12"}
WATCHED_SKU_PREFIXES = ("FFM-",)

PERSONA_NAMES = {("james", "anderson"), ("ethan", "campbell")}

# Yusra's documented shape: firstname.lastname-plus-digits
# (e.g. mary.williams8604@). Also accepts "_" or no separator. Digit-less
# variants are left to the other three conditions.
EMAIL_SHAPE = re.compile(r"^[a-z]{2,}[._]?[a-z]{2,}\d{1,5}$", re.IGNORECASE)

# Shopify creates the customer the moment the email is entered at checkout, so
# the two timestamps are normally identical. A small tolerance absorbs clock skew.
FIRST_CHECKOUT_TOLERANCE = timedelta(seconds=60)
BURST_WINDOW = timedelta(hours=24)
BURST_COUNT = 3

REASONS = ("email_shape", "persona_name", "first_checkout", "three_plus_24h")

CHECKOUTS_QUERY = """
query monitor($q: String!, $first: Int!, $after: String) {
  abandonedCheckouts(first: $first, after: $after, query: $q, sortKey: CREATED_AT) {
    edges {
      node {
        id
        createdAt
        completedAt
        abandonedCheckoutUrl
        customer { email firstName lastName createdAt numberOfOrders }
        lineItems(first: 20) { edges { node { sku quantity } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
"""

PREFLIGHT_QUERY = """
query preflight {
  shop { myshopifyDomain }
  abandonedCheckouts(first: 1) { edges { node { id customer { createdAt } } } }
}
"""


def parse_time(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def host_of(node):
    """Hostname only. The recovery URL itself is a credential and is dropped."""
    if node.get("host"):
        return node["host"].lower()
    url = node.get("abandonedCheckoutUrl")
    if not url:
        return None
    return (urlparse(url).hostname or "").lower() or None


def line_items_of(node):
    items = node.get("lineItems")
    if isinstance(items, dict):
        items = [edge["node"] for edge in items.get("edges", [])]
    return items or []


def normalize(node):
    """Reduce an API node (or an already-compact record) to what the rule reads."""
    customer = node.get("customer")
    return {
        "id": node["id"].rsplit("/", 1)[-1],
        "created_at": parse_time(node.get("createdAt")),
        "completed_at": parse_time(node.get("completedAt")),
        "host": host_of(node),
        "email": ((customer or {}).get("email") or "").strip().lower() or None,
        "first_name": ((customer or {}).get("firstName") or "").strip().lower(),
        "last_name": ((customer or {}).get("lastName") or "").strip().lower(),
        "customer_created_at": parse_time((customer or {}).get("createdAt")),
        "orders": int((customer or {}).get("numberOfOrders") or 0),
        "has_customer": customer is not None,
        "lines": [
            {"sku": (item.get("sku") or "").strip(), "quantity": item.get("quantity")}
            for item in line_items_of(node)
        ],
    }


def is_raw_host(host):
    return bool(host) and host.endswith(RAW_HOST_SUFFIX)


def is_watched(sku):
    return sku in WATCHED_SKUS or sku.startswith(WATCHED_SKU_PREFIXES)


def email_shape(email):
    return bool(email) and bool(EMAIL_SHAPE.match(email.split("@", 1)[0]))


def mask_email(email):
    if not email or "@" not in email:
        return "(none)"
    local, domain = email.split("@", 1)
    if len(local) <= 4:
        return f"{local[0]}***@{domain}"
    return f"{local[:2]}***{local[-2:]}@{domain}"


def missing_fields(record):
    missing = []
    if not record["host"]:
        missing.append("host")
    if not record["has_customer"] or not record["email"]:
        missing.append("customer")
    elif not record["customer_created_at"]:
        missing.append("customer.createdAt")
    if not record["lines"]:
        missing.append("lineItems")
    return missing


def evaluate(records, since=None, until=None, already_reported=()):
    """Classify every record whose created_at falls in [since, until).

    Records before `since` are context only: they feed the first-checkout and
    24-hour burst checks but are never themselves reported.
    """
    records = sorted(
        (r for r in records if r["created_at"]),
        key=lambda r: (r["created_at"], r["id"]),
    )
    by_email = {}
    for record in records:
        if record["email"]:
            by_email.setdefault(record["email"], []).append(record["created_at"])

    already = set(already_reported)
    result = {"flagged": [], "review": [], "outside_ruled_definition": [], "evaluated": 0}
    for record in records:
        when = record["created_at"]
        if (since and when < since) or (until and when >= until):
            continue
        result["evaluated"] += 1
        if record["id"] in already:
            continue

        missing = missing_fields(record)
        if "host" in missing or (is_raw_host(record["host"]) and missing):
            result["review"].append({**record, "missing": missing})
            continue

        qty_one_skus = [line["sku"] for line in record["lines"] if line["quantity"] == 1]
        if not qty_one_skus:
            continue

        reasons = []
        if email_shape(record["email"]):
            reasons.append("email_shape")
        if (record["first_name"], record["last_name"]) in PERSONA_NAMES:
            reasons.append("persona_name")
        times = by_email.get(record["email"], [])
        first_seen = times[0] if times else when
        if (
            record["orders"] == 0
            and record["customer_created_at"]
            and abs(record["customer_created_at"] - first_seen) <= FIRST_CHECKOUT_TOLERANCE
        ):
            reasons.append("first_checkout")
        if any(
            sum(1 for t in times if start <= t < start + BURST_WINDOW) >= BURST_COUNT
            for start in times
            if start <= when < start + BURST_WINDOW
        ):
            reasons.append("three_plus_24h")

        if is_raw_host(record["host"]):
            if reasons:
                new_skus = sorted({s for s in qty_one_skus if not is_watched(s)})
                result["flagged"].append({**record, "reasons": reasons, "new_skus": new_skus})
        elif any(is_watched(s) for s in qty_one_skus) and (
            "email_shape" in reasons or "persona_name" in reasons
        ):
            result["outside_ruled_definition"].append({**record, "reasons": reasons})
    return result


def summary_markdown(result, since, until):
    flagged = result["flagged"]
    new = [f for f in flagged if f["new_skus"]]
    lines = [
        "## Cluster monitor (Sept 8 widened trigger)",
        "",
        f"Window: `{since.isoformat() if since else 'start'}` to "
        f"`{until.isoformat() if until else 'now'}` (UTC)",
        "",
        f"- checkouts evaluated: **{result['evaluated']}**",
        f"- flagged (raw host): **{len(flagged)}**",
        f"- flagged on a NEW SKU (reopens the gate): **{len(new)}**",
        f"- routed to REVIEW (missing field): **{len(result['review'])}**",
        f"- www-host matches outside the ruled definition (not flagged): "
        f"{len(result['outside_ruled_definition'])}",
    ]
    if flagged:
        lines += [
            "",
            "### Flagged",
            "",
            "| Checkout | Created (UTC) | SKU(s) | Email | Reasons | Set |",
            "|---|---|---|---|---|---|",
        ]
        for f in flagged:
            skus = ", ".join(line["sku"] for line in f["lines"] if line["quantity"] == 1)
            watched = "NEW: " + ", ".join(f["new_skus"]) if f["new_skus"] else "watched"
            lines.append(
                f"| {f['id']} | {f['created_at']:%Y-%m-%d %H:%M:%S} | {skus} | "
                f"{mask_email(f['email'])} | {', '.join(f['reasons'])} | {watched} |"
            )
    if result["review"]:
        lines += ["", "### REVIEW (missing field)", ""]
        for r in result["review"]:
            lines.append(f"- {r['id']} ({r['host'] or 'no host'}): missing {', '.join(r['missing'])}")
    return "\n".join(lines) + "\n"


def write_csv(result, path):
    with open(path, "w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            ["status", "checkout_id", "created_at", "host", "email", "customer_created_at",
             "orders", "qty1_skus", "reasons", "new_skus", "missing"]
        )
        rows = (
            [("FLAG", r) for r in result["flagged"]]
            + [("REVIEW", r) for r in result["review"]]
            + [("OUTSIDE_RULED_DEFINITION", r) for r in result["outside_ruled_definition"]]
        )
        for status, r in rows:
            writer.writerow([
                status, r["id"], r["created_at"].isoformat(), r["host"], r["email"],
                r["customer_created_at"].isoformat() if r["customer_created_at"] else "",
                r["orders"],
                " ".join(line["sku"] for line in r["lines"] if line["quantity"] == 1),
                " ".join(r.get("reasons", [])), " ".join(r.get("new_skus", [])),
                " ".join(r.get("missing", [])),
            ])


class ShopifyReader:
    """Paginate `abandonedCheckouts`. `transport` lets tests run offline."""

    def __init__(self, shop=None, token=None, api_version=None, transport=None):
        self.shop = shop or os.environ.get("SHOPIFY_SHOP", "")
        self._token = token or os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
        api_version = api_version or os.environ.get("SHOPIFY_API_VERSION", DEFAULT_API_VERSION)
        self.endpoint = f"https://{self.shop}/admin/api/{api_version}/graphql.json"
        self._transport = transport or self._http_post
        if transport is None and not (self.shop and self._token):
            raise SystemExit("SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN must be set in the environment.")

    def _http_post(self, query, variables):
        body = json.dumps({"query": query, "variables": variables}).encode("utf-8")
        request = urllib.request.Request(self.endpoint, data=body, method="POST")
        request.add_header("X-Shopify-Access-Token", self._token)
        request.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))

    def _call(self, query, variables):
        payload = self._transport(query, variables)
        if payload.get("errors"):
            raise SystemExit(f"Shopify GraphQL error: {json.dumps(payload['errors'])[:500]}")
        return payload.get("data") or {}

    def preflight(self):
        try:
            data = self._call(PREFLIGHT_QUERY, {})
        except SystemExit as error:
            message = str(error)
            if "ACCESS_DENIED" in message or "access scope" in message:
                raise SystemExit(
                    "Preflight failed: the token authenticates but lacks read_orders "
                    "and/or read_customers."
                )
            raise SystemExit(f"Preflight failed. {message}")
        return data["shop"]["myshopifyDomain"]

    def fetch(self, since_date):
        """Every abandoned checkout created on or after `since_date` (a date)."""
        variables = {"q": f"created_at:>={since_date.isoformat()}", "first": PAGE_SIZE, "after": None}
        while True:
            page = self._call(CHECKOUTS_QUERY, variables)["abandonedCheckouts"]
            for edge in page["edges"]:
                yield edge["node"]
            if not page["pageInfo"]["hasNextPage"]:
                return
            variables["after"] = page["pageInfo"]["endCursor"]


def read_jsonl(paths):
    for path in paths:
        with open(path) as handle:
            for line in handle:
                if line.strip():
                    yield json.loads(line)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--since", help="window start, ISO-8601 UTC (default: now minus --hours)")
    parser.add_argument("--until", help="window end, ISO-8601 UTC (default: now)")
    parser.add_argument("--hours", type=float, default=3.0, help="window length when --since is omitted")
    parser.add_argument("--input-jsonl", nargs="*", help="replay saved records instead of calling Shopify")
    parser.add_argument("--already-reported", help="text file; checkout ids found in it are skipped")
    parser.add_argument("--out", default="out", help="directory for report.json, flags.csv, summary.md")
    parser.add_argument("--preflight-only", action="store_true")
    args = parser.parse_args(argv)

    now = datetime.now(timezone.utc)
    until = parse_time(args.until) if args.until else now
    since = parse_time(args.since) if args.since else until - timedelta(hours=args.hours)

    if args.input_jsonl:
        nodes = list(read_jsonl(args.input_jsonl))
    else:
        reader = ShopifyReader()
        domain = reader.preflight()
        print(f"preflight ok: {domain}", file=sys.stderr)
        if args.preflight_only:
            return 0
        # One extra day of context feeds the first-checkout and 24h burst checks.
        nodes = list(reader.fetch((since - BURST_WINDOW).date()))

    already = ()
    if args.already_reported and os.path.exists(args.already_reported):
        already = set(re.findall(r"\b\d{13,}\b", open(args.already_reported).read()))

    result = evaluate([normalize(n) for n in nodes], since, until, already)

    os.makedirs(args.out, exist_ok=True)
    summary = summary_markdown(result, since, until)
    with open(os.path.join(args.out, "summary.md"), "w") as handle:
        handle.write(summary)
    write_csv(result, os.path.join(args.out, "flags.csv"))
    with open(os.path.join(args.out, "report.json"), "w") as handle:
        json.dump(
            {
                "since": since.isoformat(),
                "until": until.isoformat(),
                "evaluated": result["evaluated"],
                "flag_count": len(result["flagged"]),
                "new_sku_flag_count": sum(1 for f in result["flagged"] if f["new_skus"]),
                "review_count": len(result["review"]),
                "outside_ruled_definition_count": len(result["outside_ruled_definition"]),
                "reason_counts": {
                    reason: sum(1 for f in result["flagged"] if reason in f["reasons"])
                    for reason in REASONS
                },
            },
            handle,
            indent=2,
        )
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
