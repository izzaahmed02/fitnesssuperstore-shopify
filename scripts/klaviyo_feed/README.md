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
    --min-items 3000 \
    --legacy-taxonomy legacy_taxonomy.json
```

`--legacy-taxonomy` is a JSON map of legacy SKU to `{product_type, product_category}`,
built from a read-only pull of the current catalog. It preserves the legacy wording
of those two fields; see section 3.

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
| `link` | `custom.product_canonical_url`, else `product.onlineStoreUrl`; multi-variant products are deep-linked with `?variant=<id>` so each row resolves to its own variant |
| `image_link` | `variant.image`, else `product.featuredMedia` |
| `price` | `variant.price` — Admin base price verbatim, no promotional discount inferred |
| `availability` | `In Stock` / `Out of Stock` / `Backorder`, from `availableForSale` + inventory policy |
| `condition` | `custom.condition_state`, lowercased |
| `mpn` | `custom.mpn`, else `custom.product_code`, else SKU |
| `upc` | `custom.upc_code` |
| `product_type` | `custom.main_category > custom.sub_category` |
| `product_category` | Shopify Standard Product Taxonomy `category.fullName` |

`product_type` and `product_category` are the two fields whose **wording** the
legacy feed owns rather than Shopify: the legacy catalog carried a Volusion
breadcrumb (`Home > Home > ...`) and a Google product-taxonomy name, neither of
which exists verbatim in Shopify. Pass `--legacy-taxonomy` to carry those exact
strings forward for every SKU already in the catalog, so the source 24138 mapping
and any downstream category filters keep working untouched. SKUs with no legacy
row fall back to Shopify-derived wording; `build_report.json` reports the split
under `taxonomy_source_counts`, and `review.csv` flags each row's
`_taxonomy_source`. Every other field is a like-for-like replacement.

## 4. Exception reason codes

Blocking codes keep a row out of the feed; warnings are emitted and reported so
each exception line stays individually explainable.

Blocking:

- `BLANK_SKU` — no SKU, so no stable feed id.
- `duplicate_sku_parent_preferred` — the same SKU is carried both by a standalone
  product and by a variant of the preferred multi-variant parent
  (`PREFERRED_PARENT_PRODUCT_IDS`). The parent's variant row wins and the
  standalone row is dropped, so the SKU reaches the feed exactly once. Nothing
  changes in Shopify: both products stay live on the site and no SKU is renamed.
- `DUPLICATE_SKU_UNEXPECTED` — a duplicate with no preferred parent to resolve
  it, so no row wins and all are held. This must be empty; a non-empty count
  means a new identity problem to triage.
- `GIFT_CERTIFICATE` — gift certificates are not products and are absent from
  the current catalog; they must not enter a recommendation feed.
- `BLANK_REQUIRED_FIELD_<FIELD>` — `description`, `product_type` or
  `product_category` blank. The source 24138 mapping requires these, so a blank
  risks an item-level sync failure. All 3,221 live catalog items carry both
  taxonomy fields populated, which is consistent with that.
- `ZERO_OR_NEGATIVE_PRICE`, `UNPARSEABLE_PRICE`, `MISSING_PRODUCT_URL`,
  `MISSING_IMAGE`.

Warnings (reported, still emitted): `BLANK_UPC`, `BLANK_CONDITION`. These are
demonstrably optional — the live catalog holds items with them blank today.

## 5. Pre-cutover backup and rollback feed

```
export KLAVIYO_API_KEY=...      # read-only key, environment variable only
python3 scripts/klaviyo_feed/klaviyo_backup.py --out ./backup --make-restore-feed
```

Read-only by construction: the client issues HTTP GET and implements no write
verb. Writes `catalog_items.jsonl`, `catalog_variants.jsonl`,
`catalog_categories.jsonl`, `restore-feed.json` and `backup_report.json`.

`restore-feed.json` reproduces the catalog exactly as it stands, defects
included — that is the point: re-publishing it returns the catalog to its
pre-cutover state. Store the JSONL files and `restore-feed.json` in the approved
company location; `backup_report.json` is the only artifact safe to attach to
email.

This must be run from an environment with egress to `a.klaviyo.com`. The key
lives in the environment only — never on the command line, in email, in chat or
in this repository.

## 6. Tests

```
python3 scripts/klaviyo_feed/test_klaviyo_feed.py
```

Offline, no credentials, no network. Covers the field mapping, the exception
reason codes, the reconciliation and minimum-count guards, the legacy taxonomy
carry-forward, and that the backup client exposes no write verb.

## 7. Hosting and the 4-hour rebuild — NOT yet stood up

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
