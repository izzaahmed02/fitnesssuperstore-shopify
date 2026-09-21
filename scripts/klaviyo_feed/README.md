# Klaviyo custom-catalog feed rebuild (source 24138, "2026 Klaviyo Feed")

The Klaviyo source label was renamed from "New Klaviyo Feed" to "2026 Klaviyo
Feed" on 2026-09-16. The source ID is unchanged: **24138**. Restore notes and
any runbook referring to the old label should use the new one.

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
| `link` | `custom.product_canonical_url` while it resolves to a product that is itself in the feed, else `product.onlineStoreUrl`; multi-variant products are deep-linked with `?variant=<id>` so each row resolves to its own variant |
| `image_link` | `variant.image`, else `product.featuredMedia` |
| `price` | `variant.price` — Admin base price verbatim, no promotional discount inferred |
| `availability` | `In Stock` / `Out of Stock` / `Backorder`, from `availableForSale` + inventory policy |
| `condition` | `custom.condition_state`, lowercased |
| `mpn` | `custom.mpn`, else `custom.product_code`, else SKU |
| `upc` | `custom.upc_code` |
| `product_type` | `custom.main_category > custom.sub_category` |
| `product_category` | Shopify Standard Product Taxonomy `category.fullName` |
| `brand` | `product.vendor` |

The feed emits **exactly** these thirteen fields — no more, no less. Klaviyo
requires every field in a custom-catalog feed to be mapped: an extra field forces
a mapping edit on source 24138, and a missing one fails a required field on sync.
Both are cutover risks, and editing the mapping is not ours to do.

`brand` is mapped on 24138 with field type **Categories (List)**: it is what
populates Klaviyo catalog categories, which is in turn what Collection-based
product feeds select on (e.g. `NewBA_FF`, "Collection: BA French Fitness").
Omitting it leaves the catalog with zero categories and those feeds with nothing
to draw from. Shopify `vendor` is populated on every product in the export, so
requiring it excludes nothing.

### Canonical-URL fallback

Per the 2026-09-17 ruling, the builder honours `custom.product_canonical_url`
only while the handle it points at belongs to a product that is in the feed.
When the canonical target is suppressed, or is absent from the export
altogether, the row falls back to the product's own `onlineStoreUrl`. Without
this a reader clicking a turf row would land on the combined listing the feed
had just suppressed for zero inventory.

Nothing is changed in Shopify: the metafield on the three turf standalones is
left exactly as it is, and each link flips back to the combined listing on its
own once that listing re-enters the feed at the turf cutover. No second change
is needed then.

The rule is deliberately narrow. A canonical URL pointing at a product that is
live and in the feed is still honoured — the FFS Silver rows that point at
their FFB Black counterparts keep those links, because those products are in
the feed. Changing that is a separate decision, not this ruling.

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

Whole-product suppression, applied before anything else looks at the rows:

- `remove_from_feeds_tag` — the product carries a `REMOVE FROM FEEDS` tag
  (matched case- and padding-insensitively).
- `option_carrier_excluded` — the product is an option carrier listed in
  `OPTION_CARRIER_PRODUCT_IDS`: its variants are configuration choices on
  another product, not purchasable items.

Single-row suppression, for an option row sitting on an otherwise feedable
product, which neither of the above reaches:

- `sku_excluded` — the variant's SKU is listed in `EXCLUDED_VARIANT_SKUS`.
  `FFT-DCC-APU` is there per the 2026-09-21 instruction. It currently sits on
  the consolidated APU carrier `10278798000444` (variant "Tahoe / Shasta /
  FFT-DCC"), not on the live FFT-DCC product, so `option_carrier_excluded`
  already keeps it out; this entry is the standing guard that holds even if the
  row is later moved onto a feedable product or re-created after removal. These
  rows are counted under `counts.sku_excluded_rows`, not
  `counts.suppressed_products` — the product itself is not suppressed.

Suppressed products are removed from the candidate set entirely rather than
excluded row by row. This matters because the duplicate analysis counts SKUs
across candidates: leaving a suppressed product in would make its SKUs look
duplicated and drop the live products that legitimately carry them. The combined
Turf listing is exactly that case — zero inventory on every variant, carrying the
same three SKUs as the in-stock standalones. Suppressed rows are still counted in
`variant_rows` and `accounted`, so reconciliation cannot lose them.

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
- `BLANK_REQUIRED_FIELD_<FIELD>` — `description`, `product_type`,
  `product_category` or `brand` blank. The source 24138 mapping requires these, so a blank
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

## 7. Hosting and the 4-hour rebuild

`.github/workflows/klaviyo-feed-publish.yml` runs the whole pipeline unattended:
read-only Shopify bulk export, build, minimum-count guard, publish to GitHub
Pages behind a fixed custom domain, alert on failure.

Target URL, intended to be permanent:

```
https://feeds.fitnesssuperstore.com/klaviyo/catalog.json
```

The hostname is company-owned, so the backend behind it can later move to R2,
S3 or a company server **without the Klaviyo source URL on 24138 ever
changing**. That is what makes the "fixed URL that never changes" requirement
survivable.

### Required secrets and settings

| Setting | Where | Value |
| --- | --- | --- |
| `SHOPIFY_SHOP` | repo secret | `<store>.myshopify.com` |
| `SHOPIFY_ADMIN_TOKEN` | repo secret | Admin API access token (`shpat_`), `read_products` only. Only a legacy custom app issues this; an app-automation token (`atkn_`) or an OAuth client secret (`shpss_`) will not work. |
| Pages source | repo Settings → Pages | GitHub Actions |
| Custom domain | repo Settings → Pages | `feeds.fitnesssuperstore.com` |
| DNS | DNS provider | `CNAME feeds → <owner>.github.io` |

### Order of operations

1. Add the secrets, enable Pages (source: GitHub Actions), add the custom
   domain, add the DNS CNAME.
2. Run the workflow manually once (**Run workflow**) with **dry_run** ticked.
   That exercises the credentials, the export, the build and the verification
   step without publishing, so a first attempt that fails cannot disturb what
   Pages is already serving. The first step is a one-round-trip credential
   preflight, so a wrong, revoked or under-scoped token fails in seconds rather
   than 30 minutes into a bulk export.
3. Re-run with **dry_run** unticked. Check the run summary and fetch the URL.
4. Only when that run is green and Tim has given the GO, uncomment the
   `schedule:` block to start the 4-hourly rebuild.
5. Tim pastes the URL into source 24138 and triggers the sync. That is the GO.

### Guards in the pipeline

- `--min-items 3000` in the builder, plus an explicit pre-publish verification
  step that re-checks `reconciliation_clean`, duplicate ids, and feed length. A
  partial or inconsistent export cannot overwrite a good feed.
- `concurrency` prevents two publishes racing, so a half-written feed is never
  served.
- Failure opens a GitHub issue titled "Klaviyo feed publish is failing", and a
  later successful run closes it. No external service and no credential is
  involved — GitHub emails repository watchers on its own. An open issue always
  means the feed is stale right now. A silent failure is the one outcome that
  must not happen: Klaviyo would keep serving the last good feed with nobody
  aware it had stopped refreshing.
- `robots.txt` disallows everything. Note the feed is still publicly fetchable
  by design — Klaviyo's hosted custom-catalog source requires a public HTTPS
  URL. Every field in it is already public on the product pages.
- Hosted-feed sync only. Do not also drive Catalogs API delta writes at the same
  custom catalog.

### Still to verify against live Shopify

`shopify_bulk_export.py` has offline unit tests covering its preflight, submit,
poll and failure paths through an injected transport, but it has not yet run
against the live Admin API. The manual `workflow_dispatch` runs in steps 2 and 3
are what validate it. Do not enable the schedule before step 3 is green.
