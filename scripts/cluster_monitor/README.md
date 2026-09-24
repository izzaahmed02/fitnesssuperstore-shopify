# Cluster monitor: widened monitoring trigger (Sept 8 ruling)

Read-only scheduled readback of abandoned checkouts, per Tim's September 8
ruling on the "Deliverability" thread. **Nothing here writes to Shopify or
Klaviyo.** Containment is unchanged: no rule changes, and flow SnYN8Q stays
Draft.

## The rule

A checkout is **FLAGGED** when all of these hold:

1. it was abandoned on the raw `*.myshopify.com` host (read from the recovery
   URL's hostname; host is required, never a standalone fallback),
2. it has a line item at quantity 1, on any SKU, and
3. at least one of:
   - `email_shape`: `firstname[._]lastname` followed by 1–5 digits
   - `persona_name`: james anderson or ethan campbell
   - `first_checkout`: profile created at its first-checkout timestamp (±60 s)
     with zero orders
   - `three_plus_24h`: 3 or more checkouts from one address inside 24 hours

Each flag is marked **watched** (FF-RCHD10, FF-RCHD2-5, FF-RF-TS12, or any
FFM-* SKU) or **NEW SKU**. A new SKU/host combination reopens the gate.

A raw-host checkout missing a field the rule needs (customer, customer creation
time, line items), or any checkout with no readable host, routes to **REVIEW**.

Checkouts on the www host that match a watched SKU plus the email shape or a
persona name are **counted but never flagged**. They fall outside the ruled
definition and are reported only so the count is visible.

## Where flags surface

`.github/workflows/cluster-monitor.yml` runs hourly with a 3-hour lookback.
New flags are posted as comments on one open issue, **"Cluster monitor: flagged
raw-host checkouts"**. GitHub emails every watcher, and emails are masked. The
run summary and the `flags.csv` artifact (30 days) have the full detail.
Checkouts already on the issue are not posted again.

Schedules run only from the default branch, so the monitor is inactive until
the workflow is merged, and that merge needs Tim's written GO.

## Run locally or replay

```
SHOPIFY_SHOP=... SHOPIFY_ADMIN_TOKEN=... \
  python3 scripts/cluster_monitor/cluster_monitor.py --hours 24 --out out

python3 scripts/cluster_monitor/cluster_monitor.py \
  --input-jsonl saved.jsonl --since 2026-09-16T00:00:00Z --until 2026-09-17T00:00:00Z
```

The token needs `read_orders` and `read_customers`. `--preflight-only` checks
both in one round trip. Recovery URLs carry a secret `key`, so only the
hostname is kept.

## Tests

```
python3 scripts/cluster_monitor/test_cluster_monitor.py
```
