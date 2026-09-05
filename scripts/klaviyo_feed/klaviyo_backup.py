#!/usr/bin/env python3
"""Read-only pre-cutover backup of the Klaviyo custom catalog, plus a rollback feed.

Pulls catalog items, their variants and the catalog categories exactly as they
stand today, writes them to JSONL, and optionally renders the rollback feed that
would restore the catalog to this state.

Read-only by construction: this module issues HTTP GET and nothing else. It
never writes to Klaviyo, never touches the source URL or the field mapping, and
never records the API key in any output file.

The API key is read from the KLAVIYO_API_KEY environment variable only. Do not
pass it on the command line (it would land in shell history and process lists),
and do not paste it into email, chat, screenshots or a repository.

Usage:
    export KLAVIYO_API_KEY=...            # read-only key
    python3 klaviyo_backup.py --out ./backup
    python3 klaviyo_backup.py --out ./backup --make-restore-feed
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API_ROOT = "https://a.klaviyo.com/api"
REVISION = "2025-07-15"
PAGE_SIZE = 100

# Feed key order must match build_klaviyo_feed.py so the rollback feed and the
# replacement feed are directly comparable.
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


class KlaviyoReadOnlyClient:
    """Minimal paging GET client. No write verb is implemented anywhere."""

    def __init__(self, api_key, max_retries=5):
        if not api_key:
            raise SystemExit(
                "KLAVIYO_API_KEY is not set. Export a read-only key in the "
                "environment; do not pass it as an argument."
            )
        self._api_key = api_key
        self.max_retries = max_retries
        self.requests_made = 0

    def _get(self, url):
        request = urllib.request.Request(url, method="GET")
        request.add_header("Authorization", f"Klaviyo-API-Key {self._api_key}")
        request.add_header("revision", REVISION)
        request.add_header("accept", "application/vnd.api+json")

        delay = 2.0
        for attempt in range(self.max_retries):
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    self.requests_made += 1
                    return json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                # 429 is rate limiting; 5xx is transient. Both are worth retrying.
                if error.code not in (429, 500, 502, 503, 504) or attempt == self.max_retries - 1:
                    body = error.read().decode("utf-8", "replace")[:500]
                    raise SystemExit(f"Klaviyo GET failed ({error.code}): {body}")
                time.sleep(delay)
                delay *= 2
            except urllib.error.URLError:
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(delay)
                delay *= 2
        raise SystemExit("exhausted retries")

    def paginate(self, path, params=None):
        """Yield every record across all pages of a collection endpoint."""
        query = dict(params or {})
        query["page[size]"] = PAGE_SIZE
        url = f"{API_ROOT}/{path}?" + urllib.parse.urlencode(query)

        while url:
            payload = self._get(url)
            for record in payload.get("data", []):
                yield record
            url = (payload.get("links") or {}).get("next")


def write_jsonl(path, records):
    count = 0
    with open(path, "w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
            handle.write("\n")
            count += 1
    return count


def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def restore_feed_from_items(items_path):
    """Render the rollback feed from the backed-up items, verbatim.

    One feed row per backed-up catalog item, carrying the values the live
    catalog holds right now, so re-publishing this file returns the catalog to
    its pre-cutover state. Nothing is inferred or corrected here on purpose.
    """
    feed = []
    with open(items_path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            attributes = json.loads(line).get("attributes", {})
            metadata = attributes.get("custom_metadata") or {}
            external_id = attributes.get("external_id") or ""
            feed.append(
                {
                    "id": external_id,
                    "title": attributes.get("title") or "",
                    "description": attributes.get("description") or "",
                    "link": attributes.get("url") or "",
                    "image_link": attributes.get("image_full_url") or "",
                    "price": attributes.get("price"),
                    "availability": metadata.get("availability") or "",
                    "condition": metadata.get("condition") or "",
                    "mpn": metadata.get("mpn") or "",
                    "upc": metadata.get("upc") or "",
                    "sku": external_id,
                    "product_type": metadata.get("product_type") or "",
                    "product_category": metadata.get("product_category") or "",
                    "inventory_quantity": None,
                    "inventory_policy": None,
                    "published": bool(attributes.get("published", True)),
                }
            )
    return [{key: row[key] for key in FEED_KEYS} for row in feed]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument(
        "--make-restore-feed",
        action="store_true",
        help="Also render restore-feed.json, the actual rollback feed for this backup",
    )
    args = parser.parse_args(argv)

    os.makedirs(args.out, exist_ok=True)
    client = KlaviyoReadOnlyClient(os.environ.get("KLAVIYO_API_KEY"))

    items_path = os.path.join(args.out, "catalog_items.jsonl")
    variants_path = os.path.join(args.out, "catalog_variants.jsonl")
    categories_path = os.path.join(args.out, "catalog_categories.jsonl")

    item_count = write_jsonl(items_path, client.paginate("catalog-items"))
    variant_count = write_jsonl(variants_path, client.paginate("catalog-variants"))
    category_count = write_jsonl(categories_path, client.paginate("catalog-categories"))

    artifacts = [items_path, variants_path, categories_path]

    restore_count = None
    if args.make_restore_feed:
        restore_path = os.path.join(args.out, "restore-feed.json")
        restore_feed = restore_feed_from_items(items_path)
        with open(restore_path, "w", encoding="utf-8") as handle:
            json.dump(restore_feed, handle, ensure_ascii=False, indent=1)
            handle.write("\n")
        restore_count = len(restore_feed)
        artifacts.append(restore_path)

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "purpose": "pre-cutover read-only backup of the Klaviyo custom catalog (source 24138)",
        "mode": "READ-ONLY: HTTP GET only; no catalog write, no source URL or mapping change",
        "api_revision": REVISION,
        "requests_made": client.requests_made,
        "counts": {
            "catalog_items": item_count,
            "catalog_variants": variant_count,
            "catalog_categories": category_count,
            "restore_feed_rows": restore_count,
        },
        "artifacts": {
            os.path.basename(path): {
                "bytes": os.path.getsize(path),
                "sha256": sha256_of(path),
            }
            for path in artifacts
        },
        "handling": [
            "API key read from KLAVIYO_API_KEY only; not recorded in any artifact",
            "store the JSONL files and restore-feed.json in the approved company location",
            "backup_report.json is the only artifact safe to attach to email",
        ],
    }

    report_path = os.path.join(args.out, "backup_report.json")
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report["counts"], indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
