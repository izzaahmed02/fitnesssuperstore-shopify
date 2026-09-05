# Local Inventory Ads feed

Automated replacement for the manually uploaded local inventory files
(`fs_local_inventory_clean.tsv`, `fs_showroom_local_inventory.tsv`) and for the
retired MultiFeeds generators `googlelocalproductfs` (Kw8IzXtZ0M),
`googlelocalproduct` (6wUGHTNaQV) and `binglocalproductfs` (jcbvWljOP_).

## Stable URL

```
https://www.fitnesssuperstore.com/collections/<collection-handle>?view=local-inventory-tsv
```

Intended cohort (pending confirmation):

```
https://www.fitnesssuperstore.com/collections/french-fitness-showroom-products?view=local-inventory-tsv
```

The URL never changes, so Merchant Center can be pointed at it once and left on
a daily scheduled fetch. The cohort is whatever the collection contains, so
adding or removing a showroom product in Shopify changes the feed on the next
fetch with no code change.

## Output

Tab-delimited, exactly four columns, header row first:

```
id	store_code	availability	quantity
```

| Column | Source | Rule |
| --- | --- | --- |
| `id` | `variant.sku` | Legacy SKU / product code, matching the primary Google feed. Never the numeric Shopify product or variant ID. Blank SKUs are skipped, duplicates are dropped, no parent-product rows. |
| `store_code` | constant | `FSS1`. Changing it requires Tim's explicit GO. |
| `availability` | see below | `in_stock` or `out_of_stock`, lowercase with underscore. |
| `quantity` | see below | `0` whenever `out_of_stock`. |

## Availability rule

`in_stock` only when **both** hold:

1. The variant is web-in-stock (`variant.available`), and its tracked Shopify
   quantity is greater than zero.
2. The **maximum** stated processing time is 10 business days (two weeks) or
   less.

Processing Time is read most-specific-first:

1. `variant.metafields.custom.processing_time_long_variant`
2. `product.metafields.custom.processing_time_long`
3. `product.metafields.custom.processing_time`

These are the fields the PDP renders as "Processing Time" (for example
`FFT-SLCLE` → "Ships from our Warehouse in 3-7 Business Days + Transit Time").

Parsing takes the maximum of the range — the `7` in `3-7`, not the `3`. Weeks
convert at five business days per week, so `2-4 Weeks` is 20 business days and
does not qualify. A blank, restock-pending, or unparseable value is
`out_of_stock`.

Two guards can only demote a row, never promote it:

- Processing Time containing `restock` (for example "Expected Restock: October
  2026").
- `product.metafields.custom.processing_time_filter` set to `Out of Stock`.

## Quantity

`QUANTITY_MODE` at the top of `snippets/local-inventory-tsv.liquid`:

- `stopgap` (current): `1` for `in_stock`, `0` for `out_of_stock`. This matches
  the interim clean file and deliberately avoids publishing Shopify's
  orderability numbers — 9,989 / 449,511 / -9,999 — which are not real shelf
  counts and are exactly the placeholder quantities that failed Google's
  inventory verification on the retired MultiFeeds files.
- `shopify`: emits `variant.inventory_quantity`. The store has a single
  location, 537 Stone Rd STE F, Benicia CA 94510, so that value already *is*
  the Benicia number. Only switch once those counts are real.

## Verification

1. Fetch the URL and confirm the header row and four columns.
2. Confirm row count matches the collection's product count plus extra variants.
3. Confirm no numeric Shopify IDs, no blank IDs, no duplicate IDs.
4. Confirm every `out_of_stock` row has quantity `0`.
5. Point Merchant Center at the URL on a daily schedule and check diagnostics
   for "Offer does not exist" after processing.
