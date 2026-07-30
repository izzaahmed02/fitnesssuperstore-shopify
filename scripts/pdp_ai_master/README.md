# FSS PDP AI Master — V5 read-only export harness

Canonical location of the export code for the **FSS All Products PDP AI
Master** project. Before this directory existed there was no committed
harness anywhere; the V5 sample was produced from an ad-hoc session, which is
why searching this repo and `fitnesssuperstore1/fss-openclaw-n8n-triage` for
the package filenames returned nothing.

## Provenance summary

| question | answer |
| --- | --- |
| Repository | `izzaahmed02/fitnesssuperstore-shopify` (the live theme repo) |
| Script path | `scripts/pdp_ai_master/export.py` |
| Query document | `scripts/pdp_ai_master/queries/product_v5.graphql` |
| Approved scope | `scripts/pdp_ai_master/config/p0p1_skus.json` — 20 products |
| Field classification | `scripts/pdp_ai_master/config/field_source_matrix_v5.csv` |
| Reviewed field matrix | the published `field_source_matrix_V5` in the canonical Drive folder |
| Read-only enforcement | `scripts/pdp_ai_master/guardrails.py` |
| Tests | `scripts/pdp_ai_master/tests/test_export.py` |
| Admin API version | `2025-07` |
| Scopes required | `read_products`, `read_inventory`, `read_metaobjects`, `read_product_listings` |
| Write scopes required | none |
| Mutation path | none — see below |
| Schema version | V5 |

## Why this lives in the theme repo

The alternative was a second repository. This code reads the same product and
metaobject shapes the theme renders on the PDP, and the conflict rules
(structured-data `InStock` vs `availableForSale`, feed `barcode` vs
`custom.upc_code`) are assertions about theme and feed behaviour. Keeping it
beside the theme means a metaobject or schema change and the export that
depends on it move in the same commit and the same review. Nothing here is
loaded by the theme at runtime — Liquid never reads this directory.

## Relationship to the published field matrix

The reviewed field-source matrix is the `field_source_matrix_V5` artifact in
the canonical Drive folder (62 rows, published 2026-07-27). That remains the
human-reviewed authority.

`config/field_source_matrix_v5.csv` here is the machine-readable version the
harness ships with each package, so the classification is generated rather
than hand-maintained. It enumerates 82 rows against the same coverage: the
extra rows are leaf fields the published sheet grouped (`inventory_policy`,
`updated_at`, the two review fields, rendered breadcrumbs, and the split of
`ships` from `processing_time`), each broken out so it can carry its own
volatility and embed flag. Google, theme and manual counts are identical.

Findings carried over from the published sheet rather than rediscovered:
`product_canonical_url` is null on all 20 and is not the canonical source
(Smart SEO emits those), `custom_labels` are feed-side only with no Shopify
field behind them, `preorder_backorder_status` / `discontinued_status` /
`replacement_product_link` have no field created yet, `grade` is misused as a
turf grade on FF-AGSL, and most `warranty` values carry a leading U+200B.
That last one is reported as a conflict rather than stripped, because silent
normalisation is how bad values survive review.

## Read-only guarantees

These are enforced in code and asserted by the test suite, not just stated:

1. `guardrails.assert_read_only()` scans every GraphQL document for `mutation`
   and for ~15 specific write mutation names before a request is sent. Any hit
   aborts the run with exit code 3.
2. `AdminClient` has no `mutate()` method. There is no code path that can
   issue a write, so no token scope can be abused into one.
3. `assert_no_seed_input()` refuses to read values from a starter-CSV
   lineage. This is why `seed_origin_flag` can be reported as false: nothing
   was ever populated from the ChatGPT starter, rather than populated and then
   cleared.
4. The manifest records `write_path_exists: false` and
   `shopify_writes_made: 0` for every run.

## Durable vs volatile

Structural, not a naming convention. Each record has two blocks:

* `durable` — safe to cache and embed for RAG.
* `volatile_live_fetch_required` — price, compare-at, inventory, inventory
  policy, availability, cost, warranty, ships, processing time, retail price,
  review rating and review count. Fetched live at answer time and **never**
  embedded as a persistent fact.

Pricing and stock deliberately do not hang off the variant objects inside
`durable`. Mirroring them there would place cost and price inside the block
that gets embedded. `tests/test_export.py` asserts this; it caught exactly
that leak during development.

`cost_internal` is internal-only and is stripped from every non-internal
artifact.

A third block, `pdp_content_needs_approval`, holds comparison-chart content
that names third-party brands. It is held out of the embeddable block and
requires sign-off before any AI surface quotes it.

## Overlay handling

The Product Recommendation Matrix (REV9) is an overlay, never a factual
product source. Joins use trusted keys only — exact product URL, exact handle
parsed from the URL, or exact SKU. Name and model-family matching is not
implemented, deliberately: it produced false positives in V3 and is not
permitted for production.

`gate_result()` requires **all** of the following, per Tim's 2026-06-09
direction. Any failure blocks the row and records the reason:

* `verification_status == HUMAN_VERIFIED`
* snapshot is not stale
* `autonomous_recommendation_ok` is true
* `do_not_lead_flag` is false
* `do_not_recommend_flag` is false
* `needs_human_review` is false
* `tim_approval` is granted

Every overlay block is stamped `PREVIEW_UNAPPROVED_DO_NOT_USE` regardless of
gate result, and the manifest reports `overlay_rows_moved_off_seed`.

## Failure and partial-run behaviour

A per-product failure does not abort the run. The product is recorded in
`manifest.failures`, a `__run__` row is added to the conflict report, the run
is marked `PARTIAL`, and the process exits **2**. The package is still
emitted so reviewers can see how far it got. A complete run exits 0. A
guardrail violation exits 3 and emits nothing.

## Running it

Tests (no network, no credentials):

```
python3 scripts/pdp_ai_master/tests/test_export.py
```

Live read-only run against the approved 20-SKU scope:

```
export SHOPIFY_SHOP=<shop>.myshopify.com
export SHOPIFY_ADMIN_TOKEN=<read-only token>
python3 scripts/pdp_ai_master/export.py \
    --commit "$(git rev-parse --short HEAD)" \
    --capture-to captures/$(date -u +%Y-%m-%d) \
    --out out/run_$(date -u +%Y%m%dT%H%M%SZ)
```

Add `--overlay <REV9 csv>` to attach the recommendation overlay as preview.

Replay a previous run from its capture — byte-identical output, no network:

```
python3 scripts/pdp_ai_master/export.py \
    --from-capture captures/2026-07-29 \
    --out out/replay
```

`--capture-to` is what makes a run auditable after the fact: the raw
responses are kept alongside the package, so any figure in the export can be
traced back to the exact API response it came from.

## Credential requirement

The harness needs a **read-only** custom-app token with the four scopes
above, held wherever the job is meant to run. It does not create one and it
does not read credentials from anywhere but the environment. Until a
controlled credential exists, runs happen from an operator's own session,
which is the gap that made this project's provenance unverifiable in the
first place.

## Not approved

Scope expansion beyond the 20 approved products, any recurring or scheduled
run, Shopify write-back, live overlays, autonomous Gorgias or agentic
recommendation use, and customer-facing use of unverified fields are all on
hold pending separate written approval. The harness does not schedule itself
and refuses to run outside the approved scope file unless `--scope` is passed
explicitly.
