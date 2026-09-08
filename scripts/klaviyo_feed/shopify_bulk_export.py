#!/usr/bin/env python3
"""Run the read-only Shopify Admin bulk export and download the result JSONL.

This is the step that lets the scheduled rebuild run unattended: it submits
`bulk_export_query.graphql` through `bulkOperationRunQuery`, polls the operation
to a terminal state, then downloads the result to `--out`.

Read-only in effect: the only mutation issued is `bulkOperationRunQuery`, which
starts a query job and changes no store data.

Credentials come from the environment only:
    SHOPIFY_SHOP          e.g. fitness-superstore.myshopify.com
    SHOPIFY_ADMIN_TOKEN   Admin API access token with read_products
    SHOPIFY_API_VERSION   optional, defaults to DEFAULT_API_VERSION

Never pass the token on the command line and never log it. The signed result URL
Shopify returns is also a credential: it is used and discarded, never printed.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

DEFAULT_API_VERSION = "2025-07"
POLL_INTERVAL_SECONDS = 10

RUN_MUTATION = """
mutation bulkRun($q: String!) {
  bulkOperationRunQuery(query: $q) {
    bulkOperation { id status }
    userErrors { field message }
  }
}
"""

POLL_QUERY = """
query poll($id: ID!) {
  node(id: $id) {
    ... on BulkOperation {
      id
      status
      errorCode
      objectCount
      fileSize
      url
    }
  }
}
"""

TERMINAL_STATUSES = {"COMPLETED", "FAILED", "CANCELED", "EXPIRED"}


class ShopifyBulkExporter:
    """Submit, poll and download one bulk operation.

    `transport` exists so the polling state machine can be tested offline: it is
    a callable taking (query, variables) and returning the parsed GraphQL body.
    """

    def __init__(self, shop=None, token=None, api_version=None, transport=None):
        self.shop = shop or os.environ.get("SHOPIFY_SHOP", "")
        self._token = token or os.environ.get("SHOPIFY_ADMIN_TOKEN", "")
        self.api_version = api_version or os.environ.get(
            "SHOPIFY_API_VERSION", DEFAULT_API_VERSION
        )
        self._transport = transport or self._http_post
        if transport is None and not (self.shop and self._token):
            raise SystemExit(
                "SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN must be set in the environment."
            )

    @property
    def endpoint(self):
        return f"https://{self.shop}/admin/api/{self.api_version}/graphql.json"

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

    def submit(self, bulk_query):
        data = self._call(RUN_MUTATION, {"q": bulk_query})
        result = data.get("bulkOperationRunQuery") or {}
        errors = result.get("userErrors") or []
        if errors:
            raise SystemExit(f"bulkOperationRunQuery rejected: {json.dumps(errors)}")
        operation = result.get("bulkOperation") or {}
        if not operation.get("id"):
            raise SystemExit("bulkOperationRunQuery returned no operation id")
        return operation["id"]

    def wait(self, operation_id, timeout_seconds, sleep=time.sleep):
        """Poll to a terminal status. Returns the final operation node."""
        deadline = time.monotonic() + timeout_seconds
        while True:
            node = (self._call(POLL_QUERY, {"id": operation_id}).get("node")) or {}
            status = node.get("status")
            if status in TERMINAL_STATUSES:
                if status != "COMPLETED":
                    raise SystemExit(
                        f"bulk operation ended {status} (errorCode={node.get('errorCode')})"
                    )
                if not node.get("url"):
                    raise SystemExit("bulk operation COMPLETED but returned no result url")
                return node
            if time.monotonic() >= deadline:
                raise SystemExit(
                    f"bulk operation still {status} after {timeout_seconds}s; giving up"
                )
            sleep(POLL_INTERVAL_SECONDS)

    @staticmethod
    def download(url, destination):
        # The signed URL is a credential; it is never logged.
        with urllib.request.urlopen(url, timeout=600) as response, open(
            destination, "wb"
        ) as handle:
            while True:
                chunk = response.read(1 << 20)
                if not chunk:
                    break
                handle.write(chunk)
        return os.path.getsize(destination)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="Destination JSONL path")
    parser.add_argument(
        "--query",
        default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "bulk_export_query.graphql"),
        help="GraphQL bulk query file",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=1800,
        help="Seconds to wait for the operation to complete",
    )
    args = parser.parse_args(argv)

    with open(args.query, "r", encoding="utf-8") as handle:
        bulk_query = handle.read()

    exporter = ShopifyBulkExporter()
    operation_id = exporter.submit(bulk_query)
    print(f"submitted {operation_id}", flush=True)

    node = exporter.wait(operation_id, args.timeout)
    print(
        f"completed objectCount={node.get('objectCount')} fileSize={node.get('fileSize')}",
        flush=True,
    )

    written = exporter.download(node["url"], args.out)
    if written == 0:
        raise SystemExit("downloaded result file is empty")
    print(f"downloaded {written} bytes to {args.out}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
