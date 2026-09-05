# Klaviyo custom-catalog feed rebuild (source 24138)

Offline builder for the Klaviyo hosted custom-catalog feed, driven from a
read-only Shopify Admin bulk export. Supports the READ-ONLY AUDIT thread
"Klaviyo catalog source mismatch for FFT-ACD".

**Nothing here writes to Shopify or Klaviyo.** Source URL swap on catalog
source 24138 is Tim's call and is not performed or scheduled by this code.

## 1. Take the read-only export

Bulk-export every active, published product with variants and the metafields
the feed maps. `scripts/klaviyo_feed/bulk_export_query.graphql` holds the exact
query; run it through `bulkOperationRunQuery`, poll to `COMPLETED`, then
download the result JSONL.

Bulk operations are scoped to the app whose token created them: a job started
by one app is not retrievable by another, and its result URL expires. Keep
signed download URLs out of email, chat, screenshots and this repository.

## 2. Build

```
python3 scripts/klaviyo_feed/build_klaviyo_feed.py \
    --jsonl staging-bulk-<id>.jsonl \
    --out ./out \
    --min-items 3000
```

Standard library only, no network, no Klaviyo key. Exit status is non-zero when
reconciliation fails, so it is safe to gate a scheduled rebuild on it.

Outputs in `--out`:

| File | Purpose |
| --- | --- |
| `klaviyo_feed.json` | the hosted-feed candidate (Klaviyo's custom source needs JSON/XML over HTTPS; CSV is not an import format) |
| `review.csv` | variant-level review/reconciliation sheet with provenance columns |
| `exceptions.csv` | every excluded row and every emitted-with-warning row, each with reason codes |
| `emitted_ids.txt` | the feed ids, one per line |
| `build_report.json` | counts, exception tallies, duplicate analysis, SHA-256 of every input and output, `reconciliation_clean` |

## 3. Field mapping

One feed item per variant — Klaviyo hosted custom feeds treat variants as
separate items. Feed `id` is the legacy variant SKU, so existing item ids and
recommendation-event history line up.

| Feed key | Source |
| --- | --- |
| `id`, `sku` | `variant.sku` |
| `title` | `product.title` |
| `description` | `product.description`, tags and whitespace collapsed |
| `link` | `custom.product_canonical_url`, else `product.onlineStoreUrl` |
| `image_link` | `variant.image`, else `product.featuredMedia` |
| `price` | `variant.price` — Admin base price verbatim, no promotional discount inferred |
| `availability` | `In Stock` / `Out of Stock` / `Backorder`, from `availableForSale` + inventory policy |
| `condition` | `custom.condition_state`, lowercased |
| `mpn` | `custom.mpn`, else `custom.product_code`, else SKU |
| `upc` | `custom.upc_code` |
| `product_type` | `custom.main_category > custom.sub_category` |
| `product_category` | Shopify Standard Product Taxonomy `category.fullName` |

`product_type` and `product_category` are the two fields whose **wording**
differs from the legacy feed: the legacy catalog carried a Volusion breadcrumb
(`Home > Home > ...`) and a Google product-taxonomy name, neither of which
exists verbatim in Shopify. Confirm both against the read-only source 24138
mapping screen before any cutover, or carry the legacy strings forward from the
pre-cutover catalog backup. Every other field is a like-for-like replacement.

## 4. Exception reason codes

Blocking codes keep a row out of the feed; warnings are emitted and reported so
each exception line stays individually explainable.

Blocking:

- `BLANK_SKU` — no SKU, so no stable feed id.
- `DUPLICATE_SKU_NAMED_IN_AUDIT_HOLD` — one of the five SKUs named in the audit.
- `DUPLICATE_SKU_RCHD_FAMILY_SAME_ROOT_CAUSE` — same defect, wider blast radius:
  Rubber Coated Hex Dumbbell SKUs exist both as standalone single-SKU products
  and as variants of one multi-variant parent. Held on the same basis until the
  SKUs are made unique in Shopify.
- `DUPLICATE_SKU_UNEXPECTED` — a duplicate outside both known groups. This must
  be empty; a non-empty count means a new identity problem to triage.
- `ZERO_OR_NEGATIVE_PRICE`, `UNPARSEABLE_PRICE`, `MISSING_PRODUCT_URL`,
  `MISSING_IMAGE`.

Warnings: `BLANK_DESCRIPTION`, `BLANK_UPC`, `BLANK_CONDITION`,
`BLANK_PRODUCT_TYPE`, `BLANK_PRODUCT_CATEGORY`.

## 5. Hosting and the 4-hour rebuild — NOT yet stood up

Runbook Steps 3-4 need a host that gives a fixed HTTPS URL that never changes.
That host is not chosen yet, so no URL exists to confirm and nothing is
scheduled. `.github/workflows/klaviyo-feed-rebuild.yml` is a prepared, manual
(`workflow_dispatch`) rebuild; its schedule is deliberately commented out so
merging this branch cannot silently start publishing a production feed.

A static file uploaded once is not a lasting fix. Whatever host is chosen needs:

- a fixed URL, stable across rebuilds;
- rebuild every 4 hours;
- the minimum-count guard (`--min-items`) enforced before publish, so a partial
  export can never overwrite a good feed;
- failure and staleness notification to a monitored channel;
- hosted-feed sync only. Do not also drive Catalogs API delta writes at the same
  custom catalog.
