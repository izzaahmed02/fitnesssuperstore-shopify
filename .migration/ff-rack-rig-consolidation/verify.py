#!/usr/bin/env python3
"""
Whole-store check for surviving links to the five old source collections.

    export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
    export SHOPIFY_TOKEN=shpat_xxxxxxxx
    python3 verify.py

PASS means: zero hits in product descriptions, product_option_help_text,
breadcrumb_path and sitemap_menu_1. Records owned by the five source collections
themselves are expected to still reference them until cutover and are not checked
here — Tim's pass condition allows those.

Read-only. Makes no changes.
"""

import json
import os
import re
import sys
import time
import urllib.request

API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-07")
SHOP = os.environ.get("SHOPIFY_SHOP", "")
TOKEN = os.environ.get("SHOPIFY_TOKEN", "")

SOURCES = [
    "french-fitness-rack-rig-systems",
    "french-fitness-pre-configured-rigs",
    "french-fitness-rig-frame-pieces-customize-your-rig",
    "french-fitness-rig-attachments-accessories",
    "french-fitness-racks-w-rig-rack-attachment-compatibility",
]
PAT = re.compile(r"/collections/(%s)\b" % "|".join(SOURCES), re.I)

CHECKS = [
    ("product descriptions",
     "{ products { edges { node { id handle descriptionHtml } } } }"),
    ("product_option_help_text",
     '{ metaobjects(type: "product_option_help_text") { edges { node { id handle fields { key value } } } } }'),
    ("breadcrumb_path",
     '{ metaobjects(type: "breadcrumb_path") { edges { node { id handle fields { key value } } } } }'),
    ("sitemap_menu_1",
     '{ metaobjects(type: "sitemap_menu_1") { edges { node { id handle fields { key value } } } } }'),
]

# breadcrumb steps hold collection GIDs, not URLs
SOURCE_GIDS = {
    "gid://shopify/Collection/499645251900",
    "gid://shopify/Collection/499645382972",
    "gid://shopify/Collection/499645481276",
    "gid://shopify/Collection/499645448508",
    "gid://shopify/Collection/499645415740",
}


def gql(query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"https://{SHOP}/admin/api/{API_VERSION}/graphql.json",
        data=body,
        headers={"X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        out = json.load(r)
    if "errors" in out:
        sys.exit(f"GraphQL error: {json.dumps(out['errors'], indent=2)}")
    return out["data"]


def export(query):
    data = gql(
        "mutation($q:String!){ bulkOperationRunQuery(query:$q)"
        "{ bulkOperation{ id status } userErrors{ field message } } }",
        {"q": query},
    )["bulkOperationRunQuery"]
    if data["userErrors"]:
        sys.exit(f"bulkOperationRunQuery: {data['userErrors']}")
    while True:
        time.sleep(3)
        op = gql("{ currentBulkOperation(type: QUERY) { status url errorCode } }")["currentBulkOperation"]
        if op["status"] in ("COMPLETED", "FAILED", "CANCELED", "EXPIRED"):
            break
    if op["status"] != "COMPLETED" or op.get("errorCode"):
        sys.exit(f"export {op['status']} errorCode={op.get('errorCode')}")
    if not op.get("url"):
        return []
    with urllib.request.urlopen(op["url"]) as r:
        return [json.loads(x) for x in r.read().decode().splitlines() if x.strip()]


def main():
    if not SHOP or not TOKEN:
        sys.exit("set SHOPIFY_SHOP and SHOPIFY_TOKEN first")
    total = 0
    for label, query in CHECKS:
        rows = export(query)
        hits = []
        for row in rows:
            blob = row.get("descriptionHtml") or ""
            for f in row.get("fields", []) or []:
                blob += "\n" + (f.get("value") or "")
            if PAT.search(blob) or (
                label == "breadcrumb_path" and any(g in blob for g in SOURCE_GIDS)
            ):
                hits.append(row.get("handle") or row.get("id"))
        total += len(hits)
        print(f"{label}: scanned {len(rows)}, hits {len(hits)}")
        for h in hits[:25]:
            print(f"    {h}")
        if len(hits) > 25:
            print(f"    ... and {len(hits) - 25} more")
    print()
    print("PASS — no surviving controllable links" if total == 0
          else f"FAIL — {total} record(s) still reference an old source collection")
    sys.exit(0 if total == 0 else 1)


if __name__ == "__main__":
    main()
