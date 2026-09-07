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

Series labels apply only at **$1,000 and above**. The spec is *"series only
where price >= $1,000"*, and `price` is a literal column in both feeds carrying
the regular price — so the floor reads that column, not the selling price.

The two readings disagree on five rows, all of which publish a compare-at above
$1,000 and a sale price below it:

| `--series-price-basis` | `FF-MSS-94-3T` (price 1319, sale_price 327) |
| --- | --- |
| `regular` (default) | `Monster Series` |
| `selling` | no series label |

Default is `regular`, following the spec's wording. `selling` is there if that
turns out not to be the intent.

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
| StudioWall 3-Bay `10414127087932` | Shipping rate, same as the rest. It **is** in the FF feed (SKU `FF-STW-WB-3`, $4,999, `in_stock`) with a blank shipping column. See the correction below. |
| woolytech shipping column generating from live Shopify rates | Qash — until then the primaries carry the corrected static values |
| Confirming the 55-SKU QA list against `absent_from_feeds.csv` | Reconcile before the first add |
| The 5 duplicated hex set SKUs | Tim — the collapse is in the diff report, see below |


## Verified against the live exports — Sept 7 2026

Run against `googleshoppingfrenchfitness` (966 rows, 86 columns) and
`googleshoppingfs` (1,537 rows, 83 columns) downloaded from Merchant Center
9453531. Four things the earlier working assumptions had wrong.

### The two feeds do not share a header

86 columns vs 83, in different orders. The FF feed carries three columns the FS
feed does not — `pmax_ff_product_lines_1000plus_scope`,
`std_shopping_ff_product_lines_1000plus_control` and `processing_time_long`
(which the FS feed spells `processin_time_long`, a typo that has to be preserved
byte-for-byte). Each feed is templated from its own export; nothing is shared.

### Three tax columns, not two

`tax` (populated `US:CA:8.375:n` on **every** row of both feeds), `tax_category`
(empty), and the long-form `tax(country:location_group_name:...)` (empty). All
three are dropped. Matching on the name `tax` alone would have left the
long-form column in place.

### Number formatting

The exports write `249 USD` and `188.1 USD`, not `249.00 USD`. The generator
trims trailing zeros to match, so a regenerated row differs from the live row
only where the value actually differs — otherwise every row would show as
changed at cutover.

The `price` / `sale_price` / `compare_price` convention is confirmed on the 62
discounted FF rows: `price` is the regular price, `sale_price` the discounted
one, and `compare_price` mirrors `price`. That is what the generator emits.

### StudioWall is in the feed — earlier note was wrong

`docs/feed-missing-shipping-fix.md` records StudioWall 3-Bay as being in neither
feed. Against this export it **is** in the FF feed: id `10414127087932`, SKU
`FF-STW-WB-3`, $4,999, `in_stock`, blank `shipping`. The product is `UNLISTED` in
Shopify — reachable by direct URL but out of search and collections — which is
why it was read as unpublished, but the feed carries it regardless. So it needs a
shipping rate like the other blocked rows, not a catalog decision. Publishing the
product is a separate, optional call.

Blank `shipping` in the FF feed is **56** rows: 45 hex variants + 10 Monster + 1
StudioWall. The FS feed has none.

### Five hex set SKUs are served twice, at two prices

The find worth escalating. Five SKUs each carry **two** rows in the FF feed under
two different offer ids:

| SKU | bare-SKU row | composite row |
| --- | --- | --- |
| `FF-RCHD2-5-22-5` | `price` 249, sale 188.1, **has shipping** | `10247596147004-52534108160316`, blank shipping |
| `FF-RCHD2-5-25` | `price` 431.1, no sale, **has shipping** | `…-52534108193084`, `price` 569 / sale 431.1, blank |
| `FF-RCHD5-50` | `price` 899.1, no sale, **has shipping** | `…-52534108225852`, `price` 1169 / sale 899.1, blank |
| `FF-RCHD5-75` | `price` 1979.1, no sale, **has shipping** | `…-52534108258620`, `price` 2579 / sale 1979.1, blank |
| `FF-RCHD5-100` | `price` 3329.1, no sale, **has shipping** | `…-52534108291388`, `price` 4329 / sale 3329.1, blank |

Both rows serve the same physical product. On four of the five the bare-SKU row
publishes the discounted figure as the regular `price` with no `sale_price`,
while the composite row publishes the true regular price and the sale — so the
same item is advertised at two different prices, and only one of the pair is
eligible.

This also means the "exact-SKU sibling" the earlier missing-shipping pass copied
rates from was the same SKU listed twice, not a sibling product. The rate it
copied is right; the duplicate it copied from is the defect.

The generator collapses each pair onto the composite id — the scheme the other 40
variants of that product already use — takes price and sale price from Shopify,
and inherits the shipping string from whichever row carried one. That resolves 5
duplicate offers and 5 of the blank-shipping rows at once. It is reported as its
own `collapsed-duplicate` category in the id diff rather than as an addition,
because it changes which offer id serves those five products.

### The $1,000 series floor — what the live data says

Consistent with `selling`, and nothing contradicts it:

- All 65 rows currently carrying `custom_label_4` sell at $1,199 or more. None
  sells below $1,000, so the floor already holds.
- No labelled row carries a `sale_price`, so on today's labelled rows the two
  bases give identical answers. The live data does not settle it by itself.
- The five rows that *do* straddle $1,000 between regular and selling price
  (four Monster storage variants and `FF-RCHD5-50`) are all currently **out** of
  `pmax_ff_product_lines_1000plus_scope`, which is what a selling-price floor
  would do. They are accessories, so exclusion may be curated rather than
  price-driven — suggestive, not proof.
- The cheapest row scoped `Include` sells at $1,099.

Practical impact of the choice is those five rows. Default stays `selling`.

### Labels are not in the primaries

The FF primary carries `custom_label_3` on 137 rows, but the value is `New_FF` —
a product-condition flag, not a priority tier. `custom_label_4` is on 65 rows
with inconsistent casing (`tahoe series` alongside `Shasta Series`) and at least
one non-series value (`Commercial Cardio`). The FS primary carries **neither
label on any row**.

So the tiers Tim's Ads structure runs on live entirely in the supplemental, and
baking them into the primaries means `custom_label_3` stops meaning `New_FF`.
Worth confirming nothing else reads that value before cutover.
