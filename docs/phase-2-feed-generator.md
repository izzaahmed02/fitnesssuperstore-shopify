# Phase 2 primary feed generator — build spec

Replaces the hand-edited static primaries with feeds generated from live Shopify.
Scope is Tim's Sept 6 2026 email *"Phase 2 feed build — GMC status after today +
spec deltas + coordination warning on the v2 supplemental"*, plus the Sept 5
retitle email and the Sept 5/6 missing-shipping emails it references.

```
scripts/phase2_shopify_pull.py      live Shopify -> catalogue snapshot (JSONL)
scripts/phase2_feed_generator.py    snapshot + lookups -> primaries + reports
data/feed/title_overrides.csv       the 10 approved hero titles
```

## Why a snapshot in the middle

The pull and the build are separate so a feed build is reproducible. The same
snapshot always produces the same feed, two snapshots diff to show exactly what
drifted overnight, and a bad build can be re-run against yesterday's snapshot
without touching the store.

## Run

```sh
export SHOPIFY_STORE=fitnesssuperstore.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...

python3 scripts/phase2_shopify_pull.py --out out/shopify_catalog.jsonl

python3 scripts/phase2_feed_generator.py \
    --catalog    out/shopify_catalog.jsonl \
    --current-ff current/googleshoppingfrenchfitness.tsv \
    --current-fs current/googleshoppingfs.tsv \
    --labels     current/supplemental_priority_labels_v2.csv \
    --titles     data/feed/title_overrides.csv \
    --shipping   current/shipping_rate_table.csv \
    --add-skus   current/new_skus.csv \
    --out-dir    out/
```

`current/` is a working directory of files downloaded from Merchant Center; it is
deliberately not committed. Feed exports carry live pricing, and the supplemental
is re-issued whenever rankings refresh.

## Two rules that are not negotiable

**The current export is the authority on offer ids.** Three id schemes are live —
composite `<product>-<variant>`, legacy product code, and bare SKU — and which
one applies to a given row is not derivable from Shopify (see
`docs/local-inventory-feed.md`, where keying everything on SKU matched only 225
of a 266-row cohort). So every SKU already in a feed **keeps the id it already
has**. Only genuinely new SKUs get a minted id. This keeps the cutover id diff
short and preserves the Shopping history and Ads performance attached to those
ids; a regenerate-from-scratch design would silently reset both.

**A missing label lookup is a hard failure.** The Ads account was restructured
onto `custom_label_3`/`custom_label_4` on Sept 5, so a feed emitted without them
takes live campaign targeting dark rather than merely dirtying data. The
generator refuses to write. `--allow-missing-labels` is for dry runs only: it
writes to `<out-dir>/dry-run/` and still exits non-zero.

## The five spec deltas

### 1. Labels from the v2 lookup

`custom_label_3` = priority tier, `custom_label_4` = series, joined from
`supplemental_priority_labels_v2.csv` downloaded from the Merchant Center
supplemental source. The join is on SKU with an offer-id fallback, because ids
are exactly what may change at cutover.

Series labels apply only at **$1,000 and above**. Which price that floor reads is
a real fork, and the two answers disagree on live rows: Monster `FF-MSS-94-3T`
sells for $327 against a $1,319 compare-at.

| `--series-price-basis` | `FF-MSS-94-3T` |
| --- | --- |
| `selling` (default) | no series label |
| `regular` | `Monster Series` |

Default is `selling`. The floor exists to keep the Product Lines asset groups on
high-value machines, $327 is what the customer actually pays, and it is the more
robust basis while the compare-at values are under separate review in the
"kill fake MSRP" thread. **Tim: one word switches this if you meant the regular
price.**

### 2. Hero titles

`data/feed/title_overrides.csv` holds the 10 approved strings from the Sept 5
retitle email, character for character. All 10 differ from the live Shopify
title, so this table is exactly what stops cutover from silently reverting them.
The 4-week no-edit rule from that email applies once they are live.

### 3. Shipping, Monster re-key, duplicate rows

- **Shipping** comes from a SKU-keyed rate table. Shopify holds nothing to read:
  the default delivery profile's four zones each carry a single
  carrier-calculated Intuitive Shipping method with no rate definitions, so
  rates compute per cart at checkout. The tables that produced the numbers
  already in the feed live outside Shopify. Rows the table does not cover keep
  the value the live export has; rows with neither stay blank and land in
  `missing_shipping_worklist.csv`. Nothing is copied from a neighbouring
  product — that is the guess ruled out on Sept 5.
- **Monster Universal Storage** re-keys from the bare product id
  `10269254254908` to `10269254254908-<variantID>`. Applied here as well as in
  the repoint pass so a regenerated feed cannot reintroduce the bare id.
- **The two `googleshoppingfs` duplicate ids** each carry a standard offer plus
  an open-box offer. `--dedupe-mode drop-oob` (default) keeps the standard row;
  `rekey-oob` keeps both by re-keying the open-box row composite-style. Dropping
  removes a live discounted offer from Shopping, which is a merchandising call.

### 4. SKUs absent from the feeds

`--add-skus` takes either a plain list or a `sku,feed` CSV. A plain list routes
by vendor, learned from current membership: a vendor served by exactly one feed
routes there. A vendor split across both feeds or absent from both is **not**
routed — those SKUs are reported and skipped, because guessing would either
duplicate the offer across both primaries or drop it.

Every run also writes `absent_from_feeds.csv`: every ACTIVE Shopify SKU carried
by neither feed, with a proposed id. Reconcile that against the QA list of 55
before adding — if the counts disagree, the difference is the interesting part.

### 5. sale_price and tax

`sale_price` derives from Shopify compare-at. Only a compare-at **strictly
above** price is treated as a real sale (`price` = compare-at, `sale_price` =
price); anything else is a stale compare-at and is ignored rather than published
as a fake discount. The `tax` and `tax_category` columns are dropped from the
output entirely — Google stopped using US tax attributes in July 2025. Every
other column in the template header is carried through byte-identically, in the
same order.

## Reports every run writes

| File | Use |
| --- | --- |
| `id_diff_report.csv` | **Cutover step 1.** Every added / re-keyed / removed offer, with the removal reason (`deduped`, `not-in-shopify`). |
| `missing_shipping_worklist.csv` | Rows still without shipping, one blank column to fill. |
| `absent_from_feeds.csv` | ACTIVE Shopify SKUs in neither feed, with a proposed id. |

The run also prints four gates. `custom_label_3` coverage is the only one that
fails the build; the rest are advisory.

## Cutover sequence

Per the handoff, unchanged:

1. Id diff report to Tim — **no repoint before he has it**.
2. Repoint the existing feed registrations at the generated files.
3. 48h Needs-attention watch in Merchant Center.
4. Only then does Tim GO the woolytech pause.

## Do not touch the supplemental source

The GMC supplemental source hosts `supplemental_priority_labels_v2.csv`, linked
to both primaries and carrying both `custom_label_3` and `custom_label_4`
(including the new series values: SM200, T900, UBE100, Telluride, Diablo,
Stretch Cage, FFS Silver). **Re-uploading any older file to that source wipes the
series labels and takes the Product Lines asset groups dark.** The 10 hero
retitles go in as a title column added to v2, making it v3 — never to the older
labels-only file. Coordinate with Larianne and Yusra before anyone touches that
source. The generator only ever *reads* the file; it never uploads.

## Open items this generator does not close

| Item | Owner |
| --- | --- |
| Shipping region strings for the rows with no exact-SKU sibling | Qash — rate tables live outside Shopify |
| StudioWall 3-Bay `10414127087932` | Catalog — the product is UNLISTED in Shopify, so no feed can carry it and no shipping value fixes it. Publishing it is the fix. |
| woolytech shipping column generating from live Shopify rates | Qash — until then the primaries carry the corrected static values |
| Confirming the 55-SKU QA list against `absent_from_feeds.csv` | Reconcile before the first add |
