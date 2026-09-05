# Local Inventory Ads feed — build spec

Per Tim's Sept 5 decisions, this feed is generated **from the same MultiFeeds
source that generates the primary Google feed**, not from the Shopify theme.
The theme-hosted variant (`collection.local-inventory-tsv`) was retired before
publish: id parity and inclusion parity must not depend on hand curation, and
Liquid cannot read the MultiFeeds inclusion list.

This file is the spec MultiFeeds must implement, and the record of how the
rules were validated against the live Merchant Center exports on 2026-09-05.

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
