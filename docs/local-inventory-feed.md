# Local Inventory Ads feed — build spec

Per Tim's Sept 5 direction, this feed is a **stable Shopify URL that Merchant
Center fetches on a schedule**, replacing his temporary manual upload
`fs_showroom_local_inventory.tsv`.

## URL

```
https://www.fitnesssuperstore.com/collections/french-fitness-showroom-products?view=local-inventory-tsv
```

The URL never changes. Availability and quantity re-derive from live Shopify on
every fetch, so adding a showroom product or changing its processing time
changes the feed on the next fetch with no code change.

## How membership is handled

The one thing Liquid cannot derive is which offers the primary feed carries.
154 of the 420 variants in the showroom collection have no primary offer, and
nothing readable in Shopify separates them: same product type (`Product Index`),
overlapping tags, all ACTIVE and published, overlapping prices - a $24 vinyl
dumbbell is in the feed while a $22 collar is not.

So membership comes from `snippets/local-inventory-offer-allowlist.liquid`, a
generated list of the 266 offer IDs the primary feeds carry. This splits the
problem the right way round:

- **Changes daily** - availability and quantity, derived live from Shopify.
- **Changes rarely** - which offers exist, regenerated only when the MultiFeeds
  inclusion list changes, which is a controlled change Tim owns.

Regeneration steps are in the header of that snippet.

## Output

Tab-delimited, exactly four columns, header row first:

```
id	store_code	availability	quantity
```

## 1. `id` — three schemes, not one

Verified against the live `googleshoppingfs` and `googleshoppingfrenchfitness`
exports. A row whose id does not match the primary offer ID processes as
"Offer does not exist".

| Case | Offer ID | Rows in cohort |
| --- | --- | --- |
| Multi-variant product | `<product ID>-<variant ID>` | 45 |
| Single-variant with `custom.old_legacy_product_code` | that legacy code (`FFT-CFDI` → `FFA-CFDI`) | 1 |
| Everything else | `variant.sku` | 220 |

**The primary feed export is the authority on which scheme applies per row —
never assume.** Keying every row on the SKU matches only 225 of the cohort.

## 2. `store_code`

`FSS1`. Not changed without Tim's explicit GO.

## 3. Eligibility gate — `custom.processing_time_filter` is primary

| Filter value | Eligible |
| --- | --- |
| `Ships in 2 weeks or less` | yes |
| `Ships in 2-5 weeks` | no |
| `Ships in 5 weeks or more` | no |
| `Out of Stock` | no |

When the filter is **missing**, fall back to the three-metafield cascade,
most-specific-first, and parse the **maximum** stated lead time (the 7 in
"3-7"), eligible at 10 business days or less; weeks convert at 5 business days:

1. `custom.processing_time_long_variant` (variant)
2. `custom.processing_time_long` (product)
3. `custom.processing_time` (product)

Missing both the filter and the cascade = **not eligible**.

In the current cohort 219 rows are gated by the filter and 47 by the fallback
(multi-variant products carry the processing time per variant, so the
product-level filter is unset on them). No row lacks a gate entirely.

## 4. `availability`

| Case | Value |
| --- | --- |
| Eligible | `on_display_to_order` |
| Not eligible | `out_of_stock` |

`on_display_to_order` is the accurate claim for showroom display units that ship
to the customer, and matches the Merchant Center "Products on display in store"
setup and the shipping-policy page. Never publish `in_stock`.

## 5. `quantity`

`1` for eligible, `0` for not eligible. `on_display_to_order` does not require a
quantity, so the `1` is belt-and-suspenders only.

**Never publish Shopify's stored numbers** — 9,989 on FFS-PFRD, 449,511 on the
hex dumbbells, negatives on out-of-stock items. They are orderability
placeholders, not shelf counts, and are what failed Google's inventory
verification on the retired files. True shelf counts are a separate physical
count task and do not block launch.

## 6. Exclusions

A variant with **no primary offer gets no local row**. 154 of the 420 variants
in the showroom collection have no offer in either primary feed — mostly
accessories (bands, collars, bumper plates, medicine balls). Nothing readable in
Shopify distinguishes them: all ACTIVE, all published, overlapping prices (a $24
vinyl dumbbell is in the feed, a $22 collar is not). Expanding the MultiFeeds
inclusion list to add accessories is a separate controlled change after launch
stabilises.

## Current cohort

| | |
| --- | --- |
| Variants in `french-fitness-showroom-products` | 420 |
| Published rows | 266 |
| `on_display_to_order` | 250 |
| `out_of_stock` | 16 |
| Excluded, no primary offer | 154 |
| Projected unmatched offers | 0 |

## Retired

`googlelocalproductfs` (Kw8IzXtZ0M), `googlelocalproduct` (6wUGHTNaQV) and
`binglocalproductfs` (jcbvWljOP_) are retired once the replacement processes
clean, not before, so there is never a gap with no local source.

## Interaction with the 114-row primary offer-ID correction

Tim's Sept 7 direction corrects 114 primary-feed rows (13 in
`googleshoppingfrenchfitness`, 101 in `googleshoppingfs`) that emit a **bare
numeric Shopify product ID** as the Google offer id, moving them to the variant
SKU. 14 of those rows collide — two or more variants sharing one product ID, so
Google keeps one offer and drops the rest.

**Today this feed is not exposed.** The 266 offer IDs in
`local-inventory-offer-allowlist.liquid` break down as 45 composite
`<product ID>-<variant ID>`, 1 legacy code and 220 SKU. **Zero are bare
numeric**, so none of the 114 corrected rows is in the local cohort.

**The exposure is in how the correction is applied.** All 45 composite offers
belong to one product (`10247596147004`). If the woolytech id mapping is changed
as a blanket rule — "always emit variant SKU" — rather than per-row against the
`correct_sku_id` column, those 45 primary offers flip to SKU while this feed
still emits composite IDs, and all 45 local rows process as "Offer does not
exist".

So:

- Apply the correction **per row**, scoped to the 114 in the correction file.
- The composite scheme on `10247596147004` is not part of that set and must not
  move with it.
- If the composite offers ever do move to SKU, that is a spec change here:
  update the scheme table in section 1, the `offer_id` branch at
  `snippets/local-inventory-tsv.liquid:77`, and regenerate the allowlist — in
  that order, in one change.
- Regenerate the allowlist from fresh Merchant Center exports after the
  correction processes either way, since the primary `id` column is its source.

## Impact of the 114-row offer-ID correction — FF-MSS, 10 new rows

Tim's Sept 8 direction asks for local inventory rows to be re-keyed in the same
window as the offer-ID change. Checked against the live feed exports and the
showroom cohort, the work is smaller and different in kind than "re-key".

**Nothing needs re-keying.** None of the 113 changing offer IDs appears in
`local-inventory-offer-allowlist.liquid` today. The allowlist holds no bare
numeric IDs at all, so no local row is keyed to one.

**Ten rows need adding.** Exactly one changing product is also in
`french-fitness-showroom-products`: `10269254254908`, the French Fitness Monster
Universal Storage System. Its ten variants collapse to a single numeric offer
today, which is why none of them is in the allowlist. Once the correction lands
they become ten distinct SKU-keyed offers and are eligible for local rows for
the first time.

The two Star Trac collision products are not showroom products and need no local
work.

### The ten, with the availability each would publish

`custom.processing_time_filter` is unset on the product, so the cascade applies
and resolves on `custom.processing_time_long_variant` for every variant.

| SKU | Stated lead time | Max business days | Availability |
| --- | --- | --- | --- |
| `FF-MSS-48-3T` | 2-5 Business Days | 5 | `on_display_to_order` |
| `FF-MSS-48-2T` | 2-5 Business Days | 5 | `on_display_to_order` |
| `FF-MSS-77-3T` | 3-7 Business Days | 7 | `on_display_to_order` |
| `FF-MSS-77-2T` | 3-7 Business Days | 7 | `on_display_to_order` |
| `FF-MSS-94-3T` | 3-7 Business Days | 7 | `on_display_to_order` |
| `FF-MSS-94-2T` | 3-7 Business Days | 7 | `on_display_to_order` |
| `FF-MSS-123-3T` | 4-6 Weeks | 30 | `out_of_stock` |
| `FF-MSS-123-2T` | 4-6 Weeks | 30 | `out_of_stock` |
| `FF-MSS-151-3T` | 4-6 Weeks | 30 | `out_of_stock` |
| `FF-MSS-151-2T` | 4-6 Weeks | 30 | `out_of_stock` |

Six eligible, four not. All ten still emit a row; eligibility sets the
availability and quantity, not whether the row exists.

### Resulting cohort

| | Today | After |
| --- | --- | --- |
| Allowlist offers | 266 | 276 |
| Published rows | 266 | 276 |
| `on_display_to_order` | 250 | 256 |
| `out_of_stock` | 16 | 20 |

### Order of operations

The allowlist is generated from the primary feed exports, so the ten SKUs can
only be added **after** the offer-ID change has processed in Merchant Center.
Adding them earlier publishes local rows for offers that do not yet exist, which
processes as "Offer does not exist" — the exact failure the allowlist exists to
prevent. Sequence: change the feeds, wait for the fetch, regenerate the
allowlist from fresh exports, confirm 276.
