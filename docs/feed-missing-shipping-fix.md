# Missing-shipping / duplicate-id fix — feed repoint pass

Per Tim's Sept 5 and Sept 6 direction: the 47 blocked products are fixed inside
the corrected primary feed exports and land with the feed repoint, not as a
separate upload. Scope is the currently serving rows only — no HOLD rollout row
is activated and no Rubber Hex cutover gate moves.

Run: `scripts/feed_missing_shipping_fix.py` (see its docstring for arguments).

Verify: Merchant Center > Products > search `FF-RCHD` — status flips from
Not eligible to Approved within a day of the repoint.

## What the 47 actually are

Measured against the live exports (`googleshoppingfrenchfitness`, 966 rows;
`googleshoppingfs`, 1,541 rows).

| Cohort | Rows | State |
| --- | --- | --- |
| Rubber Coated Hex Dumbbell variants `10247596147004-*` | 45 | in the FF feed, `shipping` blank |
| Monster Universal Storage `10269254254908` | 10 | in the FF feed, `shipping` blank, all 10 on the bare id |
| StudioWall 3-Bay `10414127087932` | 0 | **not in either feed** |

That is 55 blank-shipping rows across 46 distinct ids, which is the same
population as Tim's 47 counted per product: 45 hex variants + Monster + StudioWall.
The hex cohort is 45 variants, not 46.

`shipping` blank is the whole reason for "Not eligible: Missing shipping
information" — the attribute has to carry a price, and an earlier extract shows
the failure mode directly: `US::Ground: USD`, a well-formed region string with
an empty price.

**StudioWall is a different defect.** Product 10414127087932 is `UNLISTED` in
Shopify, so no primary feed can carry it. It reaches the Ads product report but
has no feed row, and populating a shipping column cannot fix it. Publishing the
product is the fix, and that is a catalog decision, not a feed one.

## 1. `shipping` region strings

Format, taken from the rows that already have it:

```
US:::<price> USD,US:AZ::<price> USD,US:OR::<price> USD,US:WA::<price> USD,US:NV::<price> USD,US:ID::<price> USD,US:UT::<price> USD,US:CA::<price> USD
```

`country:region:postal_code:price`, national rate first, then the seven state
overrides. Some rows legitimately carry the national segment only
(`US:::399 USD`). 95 distinct strings are in use across the FF feed.

Tim's rule is to pull the rate from the sibling products that already have
shipping and not to guess. Applied strictly — matching on variant SKU
(`old_id`), which is the only field that identifies the same physical item
across the combined-listing split — that resolves **5 of the 55**:

| Blocked id | SKU | Sibling row | Region string copied |
| --- | --- | --- | --- |
| `10247596147004-52534108160316` | `FF-RCHD2-5-22-5` | `10347758715196` | `US:::99.99 USD` + `79.99` states + `US:CA::59.99 USD` |
| `10247596147004-52534108193084` | `FF-RCHD2-5-25` | `10347757601084` | `US:::349 USD` + `249` states + `US:CA::149 USD` |
| `10247596147004-52534108225852` | `FF-RCHD5-50` | `10347758256444` | `US:::399 USD` + `249` states + `US:CA::149 USD` |
| `10247596147004-52534108258620` | `FF-RCHD5-75` | `10347758485820` | `US:::399 USD` + `249` states + `US:CA::149 USD` |
| `10247596147004-52534108291388` | `FF-RCHD5-100` | `10347757797692` | `US:::399 USD` + `249` states + `US:CA::149 USD` |

The other **50 have no exact-SKU sibling**: the four remaining set tiers
(`FF-RCHD55-75`, `55-100`, `80-100`, `105-120`), all 36 singles
(`FF-RCHD2-5` … `FF-RCHD150`), and all 10 Monster variants. The nearest
candidates are a different product line — Urethane 8 Sided Hex at different
weights and prices — so copying from them would be the guess Tim ruled out.

They are written to `missing_shipping_worklist.csv` with id, SKU, title, price
and shipping weight, and one blank column to fill.

### Where those 50 rates have to come from

Not from Shopify. The store runs two delivery profiles — `General profile`
(default) and an empty `Test` — and the default profile's four zones (United
States, Canada, Mexico, International) each carry a single carrier-calculated
method from the Intuitive Shipping app, `fixedFee` 0.00 with no rate definitions
and no weight or price conditions. Shopify holds no static table to read; rates
are computed per cart at checkout. The freight and parcel tables that produced
the numbers already in the feed live outside Shopify, with the sitewide freight
rates.

Per Tim's Sept 6 consolidated list, shipping fixes in the Google feeds are
Qash's item and the combined-product/id fixes are ours, so the worklist is the
handoff artifact rather than something to fill in here.

## 2. Monster Universal Storage re-key

All 10 rows shared the bare id `10269254254908` with different prices. Re-keyed
to `10269254254908-<variantID>` per the composite rule, approved as an
intentional catalog fix.

The variant id comes from each row's own `link` (`?variant=`) and is
cross-checked against `old_id`, the variant SKU. No price matching — prices
repeat across variants (218/108/218/108/327/162/327/162/327/162), so price
cannot identify a row.

| SKU | New id |
| --- | --- |
| `FF-MSS-48-3T` | `10269254254908-52746450927932` |
| `FF-MSS-48-2T` | `10269254254908-52746450960700` |
| `FF-MSS-77-3T` | `10269254254908-52746450993468` |
| `FF-MSS-77-2T` | `10269254254908-52746451026236` |
| `FF-MSS-94-3T` | `10269254254908-52746451059004` |
| `FF-MSS-94-2T` | `10269254254908-52746451091772` |
| `FF-MSS-123-3T` | `10269254254908-52746451124540` |
| `FF-MSS-123-2T` | `10269254254908-52746451157308` |
| `FF-MSS-151-3T` | `10269254254908-52746451190076` |
| `FF-MSS-151-2T` | `10269254254908-52746451222844` |

All 10 verified against the live Shopify variant ids for product
10269254254908.

## 3. googleshoppingfs duplicate ids

`9878900179260` and `9878898540860` each carry two rows. They are not identical
rows: each pair is the standard offer plus an **open-box** offer at a lower sale
price, both keyed on the same bare product id.

| Id | SKU | Sale price |
| --- | --- | --- |
| `9878900179260` | `ST-8TR-20-ATSC` | 13,649 |
| `9878900179260` | `ST-8TR-20-ATSC-OOB` | 10,919 |
| `9878898540860` | `ST-8RDE-16-ATSC` | 10,999 |
| `9878898540860` | `ST-8RDE-16-ATSC-OOB` | 8,799 |

Default `--dedupe-mode drop-oob` does what was asked — keeps the standard row,
drops the open-box one — and both ids become unique.

`--dedupe-mode rekey-oob` is the alternative: re-key the open-box row
composite-style, the same fix as Monster, so the id is unique and the open-box
offer keeps serving. Dropping the row removes a live discounted offer from
Shopping, which is a merchandising call rather than a data cleanup, so the
alternative is here ready to run if that is not the intent.

## Result

| | FF feed | FS feed |
| --- | --- | --- |
| Rows in / out | 966 / 966 | 1,541 / 1,539 |
| Duplicate ids before / after | 1 / 0 | 2 / 0 |
| Blank `shipping` before / after | 55 / 50 | 0 / 0 |

Header and column order are byte-identical to the input. The 50 remaining rows
stay blank by design — they are in the worklist, not guessed.
