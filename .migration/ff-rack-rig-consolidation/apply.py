#!/usr/bin/env python3
"""
Apply a prepared payload to Shopify via staged upload + bulkOperationRunMutation.

Stdlib only. Run from this directory.

    export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
    export SHOPIFY_TOKEN=shpat_xxxxxxxx

    python3 apply.py products                # 72 remaining product descriptions
    python3 apply.py optionhelp              # 74 product_option_help_text records
    python3 apply.py products --rollback     # restore pre-edit descriptions (all 95)
    python3 apply.py optionhelp --rollback

Shopify runs one bulk MUTATION at a time, so run 'products' to completion first,
then 'optionhelp'. The script waits for completion and refuses to start if another
bulk mutation is already running.

Nothing is unpublished and no redirects are created. This only rewrites the
link targets inside product descriptions and option help text.
"""

import json
import mimetypes
import os
import sys
import time
import urllib.request
import uuid

API_VERSION = os.environ.get("SHOPIFY_API_VERSION", "2025-07")
SHOP = os.environ.get("SHOPIFY_SHOP", "")
TOKEN = os.environ.get("SHOPIFY_TOKEN", "")

JOBS = {
    "products": {
        "new": "payloads/products_REMAINING.bulk.jsonl",
        "rollback": "payloads/products_ROLLBACK.bulk.jsonl",
        "mutation": (
            "mutation call($product: ProductUpdateInput!) "
            "{ productUpdate(product: $product) "
            "{ product { id } userErrors { field message } } }"
        ),
        "result_key": "productUpdate",
    },
    "optionhelp": {
        "new": "payloads/optionhelp_NEW.bulk.jsonl",
        "rollback": "payloads/optionhelp_ROLLBACK.bulk.jsonl",
        "mutation": (
            "mutation call($id: ID!, $metaobject: MetaobjectUpdateInput!) "
            "{ metaobjectUpdate(id: $id, metaobject: $metaobject) "
            "{ metaobject { id } userErrors { field message } } }"
        ),
        "result_key": "metaobjectUpdate",
    },
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


def post_multipart(url, fields, file_field, filename, file_bytes):
    """Ordered multipart/form-data POST. Order matters to Google Cloud Storage."""
    boundary = uuid.uuid4().hex
    sep = f"--{boundary}\r\n".encode()
    parts = []
    for name, value in fields:
        parts.append(sep)
        parts.append(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        parts.append(f"{value}\r\n".encode())
    ctype = mimetypes.guess_type(filename)[0] or "text/jsonl"
    parts.append(sep)
    parts.append(
        f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n".encode()
    )
    parts.append(file_bytes)
    parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    payload = b"".join(parts)
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req) as r:
        return r.status


def stage(path):
    name = os.path.basename(path)
    data = gql(
        """
        mutation($input:[StagedUploadInput!]!){
          stagedUploadsCreate(input:$input){
            stagedTargets{ url parameters{ name value } }
            userErrors{ field message }
          }
        }""",
        {
            "input": [
                {
                    "resource": "BULK_MUTATION_VARIABLES",
                    "filename": name,
                    "mimeType": "text/jsonl",
                    "httpMethod": "POST",
                }
            ]
        },
    )["stagedUploadsCreate"]
    if data["userErrors"]:
        sys.exit(f"stagedUploadsCreate: {data['userErrors']}")
    target = data["stagedTargets"][0]
    fields = [(p["name"], p["value"]) for p in target["parameters"]]
    key = dict(fields)["key"]
    with open(path, "rb") as fh:
        body = fh.read()
    status = post_multipart(target["url"], fields, "file", name, body)
    if status != 201:
        sys.exit(f"upload failed: HTTP {status}")
    print(f"  uploaded {name} ({len(body):,} bytes) -> {key}")
    return key


def current():
    return gql("{ currentBulkOperation(type: MUTATION) "
               "{ id status objectCount errorCode url } }")["currentBulkOperation"]


def run(job_name, rollback):
    job = JOBS[job_name]
    path = job["rollback" if rollback else "new"]
    if not os.path.exists(path):
        sys.exit(f"missing payload: {path}")
    n = sum(1 for line in open(path) if line.strip())
    print(f"\n== {job_name}{' (ROLLBACK)' if rollback else ''}: {n} records from {path}")

    running = current()
    if running and running["status"] in ("CREATED", "RUNNING"):
        sys.exit(f"another bulk mutation is {running['status']} ({running['id']}); wait for it")

    key = stage(path)
    data = gql(
        """
        mutation($m:String!,$p:String!){
          bulkOperationRunMutation(mutation:$m, stagedUploadPath:$p){
            bulkOperation{ id status } userErrors{ field message }
          }
        }""",
        {"m": job["mutation"], "p": key},
    )["bulkOperationRunMutation"]
    if data["userErrors"]:
        sys.exit(f"bulkOperationRunMutation: {data['userErrors']}")
    print(f"  started {data['bulkOperation']['id']}")

    while True:
        time.sleep(5)
        op = current()
        print(f"  {op['status']} objects={op.get('objectCount')}")
        if op["status"] in ("COMPLETED", "FAILED", "CANCELED", "EXPIRED"):
            break

    if op["status"] != "COMPLETED":
        sys.exit(f"bulk operation {op['status']} errorCode={op.get('errorCode')}")
    if op.get("errorCode"):
        sys.exit(f"errorCode={op['errorCode']}")
    if not op.get("url"):
        sys.exit("completed but no results URL")

    with urllib.request.urlopen(op["url"]) as r:
        lines = [json.loads(x) for x in r.read().decode().splitlines() if x.strip()]

    errs, ok = [], 0
    for row in lines:
        payload = row.get("data", row).get(job["result_key"]) or {}
        if payload.get("userErrors"):
            errs.append((row.get("__lineNumber"), payload["userErrors"]))
        else:
            ok += 1
    print(f"  succeeded: {ok} | with userErrors: {len(errs)}")
    for ln, e in errs[:20]:
        print(f"    line {ln}: {e}")
    if errs:
        sys.exit("finished with userErrors — nothing else was changed; re-run after fixing")
    print(f"  {job_name} OK")


def main():
    if not SHOP or not TOKEN:
        sys.exit("set SHOPIFY_SHOP and SHOPIFY_TOKEN first")
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    rollback = "--rollback" in sys.argv
    if len(args) != 1 or args[0] not in JOBS:
        sys.exit(__doc__)
    run(args[0], rollback)
    print("\nNow run:  python3 verify.py")


if __name__ == "__main__":
    main()
