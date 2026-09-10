# Phase 2 primary feed generator

Replaces the MultiFeeds manual exports with a generator that reads live Shopify.
Scope is Tim's 2026-09-06 spec deltas on the rebuild handoff. Everything below was
checked against live Shopify (`79ef8b-5e.myshopify.com`) and live Merchant Center
on 2026-09-07.

| | File |
| --- | --- |
| Generator | [`scripts/phase2_feed_generator.py`](../scripts/phase2_feed_generator.py) |
| Inclusion ruleset | [`feeds/feed-rules.json`](../feeds/feed-rules.json) |
| Cutover id diff | [`scripts/feed_id_diff.py`](../scripts/feed_id_diff.py) |
| Price/tax QA gate | [`scripts/check_feed_prices.py`](../scripts/check_feed_prices.py) |
| Hero titles | [`feeds/hero-title-overrides.csv`](../feeds/hero-title-overrides.csv) (also PR #815) |

## The ruleset is recovered, not invented

The two primaries are not "all active products". They are a specific
include/exclude ruleset that lives in the **Meta, Google, Bing, Tiktok Feeds SOP**
sheet (Larianne, Drive), one tab per feed. `feeds/feed-rules.json` is that ruleset
transcribed, so the generator reproduces the current feed scope instead of quietly
changing it at cutover. Every field it keys on was confirmed to exist live on
2026-09-07: `vendor`, `productType`, `status`, `tags`, variant price and
inventory, collection membership, and the `custom.condition_state`,
`custom.processing_time`, `custom.product_code`, `custom.shipping_weight_lbs`
metafield definitions.

Split, in one line each:

- **googleshoppingfrenchfitness** - `product_type = Product Index`, status Active,
  vendor French Fitness, `condition_state = New`.
- **googleshoppingfs** - everything else: all `Remanufactured`, plus other-brand
  `New` from any vendor not on the 14-vendor new-only exclusion list. Minus the
  `REMOVE FROM FEEDS` and `discontinued` tags, minus `as is`, and other-brand new
  also has its own floor at $1,300 and below. It is **not** remanufactured-only,
  which is easy to misread from the SOP because the first tab covers both files.
- **Both** exclude the Other Machine Attachments and Aluminum Pulley Upgrade
  collections, four internal product types, Gym Packages, anything under $100, and
  anything whose estimated ground shipping is $1,000 or more.

## Delta 4 - the SKUs absent from the feeds

Two separate causes, and they need different decisions.

### a. Multi-variant products collapsed onto a bare product id

A bare product id can carry exactly one offer, so every variant after the first is
unrepresentable. This is the same defect as the Monster Universal Storage rows
(ten rows all keyed `10269254254908`) that the missing-shipping pass re-keyed.

Tim's named example proves it. `FF-RIT24-Middle` is **not a product** - it is one of
three variants on product `9878680535356`, "French Fitness 24\" x 24\" Rubber Gym
Interlocking Tiles w/Edge, Middle, Corner Pieces (New)":

| Variant | SKU | Price |
| --- | --- | --- |
| 51555424371004 | FF-RIT24-Middle | $16.00 |
| 51555424403772 | FF-RIT24-Edge | $16.00 |
| 51555424436540 | FF-RIT24-Corner | $16.00 |

All three at the same price, so price cannot disambiguate them either - the same
reason the Monster re-key had to read the variant id off each row's own `?variant=`
link. The generator therefore emits **one row per sellable variant**, keyed
`<productID>-<variantID>` whenever a product has more than one variant, and keeps
the bare product id for single-variant products so their history is untouched.
`item_group_id` carries the product id so Google still groups them.

### b. Excluded by the ruleset, on purpose

`FF-RIT24-Middle` is $16.00. The SOP excludes **price under $100** from both
primaries, so composite ids alone will not put it in the feed - the price floor
still drops it. A p1_hero priced at $16 cannot be in scope and out of scope at
once, so this needs Tim's call: either the price floor gets an exception list, or
these SKUs are only sellable as a set (there is already an `FF-RIT24` set product
pattern elsewhere in the catalogue) and the hero label belongs on the set.

`scripts/feed_id_diff.py --old <live export> --new <generated>` prints the
authoritative added/dropped/re-keyed lists. **The exact 55-SKU QA list has not been
located** - it is not in this repo, in the thread, or in Drive under any feed/QA
title. Until Tim supplies it or a fresh Merchant Center export, the diff report is
the substitute, and it is the better artifact anyway because it is generated from
live data rather than a snapshot.

## Delta 5 - price, sale_price, and the tax columns

### The mapping

Google reads `price` as the **regular** price and `sale_price` as what the customer
pays today. Shopify is the other way round: `price` is what you pay now,
`compareAtPrice` is the was-price. So they swap, but only when compare-at is
genuinely higher. `scripts/check_feed_prices.py` enforces it and runs a table of
ten real variants read from live Shopify.

### What that actually produces today

Of **3,750** active products, only **39** carry a compare-at price at all. Of those:

- three Dynamic Cold Therapy items have `compareAtPrice == price` ($899, $3,499,
  $3,699) - not a sale;
- `FF-VAIL-SAC` has `compareAtPrice = 0.00` - not a sale;
- ten are `GYMPKG-*` gym packages, which both feeds exclude anyway;
- two are Aluminum Pulley Upgrade rows, also excluded by collection.

That leaves roughly two dozen live offers, not the catalogue.
The generator emits no `sale_price` for the equal, zero, or inverted cases, because
a strikethrough on a compare-at that was never a real prior price is the same
deceptive-savings pattern Google flagged on this account in the "Save 40%" thread.
Google's own rule is that the regular price must have been the actual price for 30
of the preceding 200 days. Nothing in Shopify records that, so it cannot be
verified from the data we hold, and every `sale_price` the generator writes should
be reviewed before the first upload.

### Compare-at is not where the discount lives

Four automatic discounts were active or scheduled on 2026-09-07:

| Discount | Amount | Window |
| --- | --- | --- |
| Labor Day Sale - 10% Off French Fitness | 10% | to 2026-09-09 |
| Labor Day Sale - 5% Off Remanufactured | 5% | to 2026-09-09 |
| Early Labor Day Sale - 10% Off Select French Fitness | 10% | to 2026-09-08 |
| September Overstock Sale - 10% Off Select French Fitness | 10% | 2026-09-08 to 2026-10-01 |

Automatic discounts apply in the cart. They do not change `price` or
`compareAtPrice` on the variant, so a compare-at-only `sale_price` misses them
entirely and the feed price lands **above** what the customer is charged. That is a
landing-page price mismatch, which Google disapproves. The 10% French Fitness
discount targets the `french-fitness-sale-eligible` collection, which currently
holds **1,364 products** - so this is most of the FF feed, not an edge case.

Delta 5 as written ("sale_price automation from Shopify compare-at") does not cover
this. The generator implements exactly what was specified and does not silently
extend it. Applying the active automatic discounts to `sale_price` is a one-line
change once Tim decides, and it needs deciding before cutover.

There is also a fifth automatic discount, "auto discount" at 5%, active with no end
date since 2024-11-18. Its `customerGets` targets an empty product list, so it
currently discounts nothing. Worth confirming that is intentional rather than a
misconfiguration.

### Tax columns

Both are dropped: the bare `tax` and the long
`tax(country:location_group_name:location_id:postal_code:region:rate:tax_ship)`.

A feed-level `tax` attribute **overrides** the Merchant Center account tax settings.
The live rows carry a hardcoded `US:CA:8.375:n`, which predates the 23-state nexus
work in Larianne's "QA: Start charging sales tax in the 23 states" sheet, so the
feed is currently asserting CA-only tax. Removing the columns hands tax back to the
account settings, which is the only place it is maintained. **Before the repoint,
confirm the account-level tax nexus is configured in Merchant Center** - if it is
not, removing the columns drops tax display rather than correcting it.

## What the generator does not do yet

Thirteen columns present in the live rows have no one-to-one source in Shopify and
are emitted blank: `google_product_category`, `custom_label_0/1/2`, `price_tiers`,
`top_seller`, `cost_of_goods_sold`, `pmax_ff_product_lines_1000plus_scope`,
`std_shopping_ff_product_lines_1000plus_control`, `product_detail`,
`product_highlight`, `promotion_id`, `virtual_model_link`. The generator prints the
list at the end of every run. Each blank is data loss at cutover, not a harmless
gap - `custom_label_2` carries the price tiers the Ads account is partly built on,
and `google_product_category` affects matching. These need mapping or an explicit
sign-off before the repoint, and they are the main reason the first generated files
are a review artifact rather than something to upload.

One exclusion is also approximated. The SOP's `exclude_pp_lt1000 (3rd party) == 1`
lives behind `custom.3rd_party`, which is a metaobject reference, so the flag is one
hop away from the product payload. The generator excludes any product that has that
metafield set at all. That is deliberately conservative - it can drop a row that
should ship, which is recoverable, rather than ship a row that should not, which is
not.

## Deltas 1, 2, 3 - carried, not re-implemented

1. **Labels.** `custom_label_3` = tier, `custom_label_4` = series, series only where
   price >= $1,000. Joined from `supplemental_priority_labels_v2.csv`, passed with
   `--labels-lookup`. The generator **refuses to run** if that file has no
   `custom_label_4` column, which is the labels-only file. That is the exact failure
   in Tim's coordination warning: a build off the wrong base wipes the series values
   and takes the Product Lines asset groups dark. Merchant Center will not export
   the v2 file back - the source is File (manual) with no download - so Tim or
   Larianne has to supply it.
2. **Titles.** `feeds/hero-title-overrides.csv` overrides the Shopify title by SKU.
   The generator exits non-zero if any of the ten hero SKUs is missing from both
   generated feeds, because a retitle that cannot land is a silent revert at cutover.
3. **Shipping.** Owned by `scripts/feed_missing_shipping_fix.py` on
   `claude/missing-shipping-feed-repoint-4yg4rr`. The generator carries whatever the
   `--shipping-lookup` supplies and leaves the rest blank rather than guessing. 50
   rows still need rates from Qash; there is no static rate table in Shopify to read
   (one delivery profile, four zones, all carrier-calculated through Intuitive
   Shipping with no rate definitions).

## Running it

```
export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...

python3 scripts/phase2_feed_generator.py \
    --labels-lookup supplemental_priority_labels_v2.csv \
    --shipping-lookup shipping_by_id.csv \
    --out-dir build/feeds

python3 scripts/check_feed_prices.py build/feeds/googleshoppingfrenchfitness.csv
python3 scripts/check_feed_prices.py build/feeds/googleshoppingfs.csv

python3 scripts/feed_id_diff.py --old googleshoppingfrenchfitness.csv \
    --new build/feeds/googleshoppingfrenchfitness.csv --out build/feeds/id_diff_ff.csv
python3 scripts/feed_id_diff.py --old googleshoppingfs.csv \
    --new build/feeds/googleshoppingfs.csv --out build/feeds/id_diff_fs.csv
```

Read-only against Shopify. Uploads nothing. Nothing touches the GMC supplemental
source - the v2 file is read as a lookup and never rewritten, so the coordination
warning is respected by construction.

## Cutover order, unchanged from the handoff

1. Generate and validate both primaries.
2. Send Tim the id diff report. Every re-key is an offer that starts from zero
   history if it is repointed blind, so the report is a decision, not a formality.
3. Repoint the existing feed registrations. Do not create new ones - a new
   registration is a new offer set.
4. 48h Needs-attention watch in Merchant Center.
5. Only then Tim gives the GO on the woolytech pause.

## Tim's rulings, 2026-09-07 and 2026-09-09

All of the original open items are now answered. This is the standing ruleset.

| | Ruling |
| --- | --- |
| v2 lookup | Tim's attachment is the canonical file, committed at `feeds/supplemental_priority_labels_v2.csv`. He re-issues it on the thread; the generator only ever reads the latest one and never reconstructs it. |
| 55-SKU list | Superseded. Diff against live data, authorised. Fresh exports are the source. |
| `FF-RIT24-Middle` | The $100 floor stays. FF-RIT24 comes out of p1_hero in the next re-issue. Composite-id-per-variant approved as built. |
| sale_price | Compare-at automation stays on as specced, stale rows excluded. Automatic-discount sale_price is a **config flag, default OFF**. |
| Tax | All three columns come out together, and only after Tim confirms account-level tax in Merchant Center. Not yet confirmed. |
| StudioWall | Stays in the feed, gets its rate with the other 47. |
| 198 duplicate SKUs | One row per SKU. While the combined-listing HOLD is in force the serving legacy row wins and the duplicate is dropped. Price is always the live Shopify variant price. No product is retired, archived or unpublished from this lane. |
| Tier conflicts | SKU-first resolution approved as built; hand-assigned tiers stand. |
| Dead lookup ids | `FFA-CFDI` corrects to `FFT-CFDI`, `FF-SBR-10` is dropped. Both in Tim's next re-issue, not edited here. |

### The sale_price flag

`--sale-price-from-automatic-discounts`, default OFF. Google requires a submitted
sale price to be **visible on the landing page**. Our promotions are
checkout-automatic with no PDP sale-price display, so feeding a sale_price the PDP
does not show is the same landing-page mismatch in the other direction. The flag
goes ON only for a promotion whose discounted price actually renders on the PDP.

When it is on the generator prints every discount it is about to apply and its
scope, so the PDP check is a deliberate step rather than an assumption. It refuses
to run if a discount targets more than 250 products, because silently truncating a
discount's scope mis-prices every row past the cap.

Live state on 2026-09-10: both Labor Day discounts are **EXPIRED**. The one active
percentage discount is **September Overstock Sale, 10% off, 8 Sept to 1 Oct**,
scoped to a named list of 16 French Fitness products which includes `FF-FSR90` -
one of the ten approved hero SKUs. That is the promotion the flag question now
turns on. The long-running "auto discount" at 5% is still ACTIVE with no end date
but targets an empty product list, so it discounts nothing.

One dependency worth watching: the compare-at path has the same landing-page
requirement. PR #784 hides permanent MSRP, retail and savings display on French
Fitness PDPs. If that ships, roughly half of the two dozen real compare-at cases
are French Fitness, and their strikethrough would stop rendering on the PDP while
the feed keeps submitting a sale_price for them.

## The cutover gate: a reason code on every row

Per Tim, 2026-09-09: "every add and every drop must appear in the id diff with a
reason code. No repoint until I have read that diff."

`scripts/feed_id_diff.py` reads CSV or TSV on either side, so the Merchant Center
exports go in as they arrive, and joins the generator's `excluded_rows.csv` to
explain drops. Codes:

| Code | Meaning |
| --- | --- |
| `added:variant_expansion` | a sibling variant of a product already in the feed, previously unrepresentable on a bare product id |
| `added:new_offer` | SKU not in the live export at all |
| `rekeyed:<old>_to_<new>` | same SKU, new id shape. These lose their performance history if repointed blind |
| `dropped:below_price_floor` | under $100 |
| `dropped:out_of_stock` | FF feed only |
| `dropped:ground_shipping_over_1000` | estimated ground shipping at or above $1,000 |
| `dropped:other_brand_new_floor` | other-brand new at or below $1,300 |
| `dropped:not_published_online` | no landing page |
| `dropped:third_party_flag` | `exclude_pp_lt1000` |
| `dropped:duplicate_sku` | the one-row-per-SKU rule collapsing a catalogue duplicate |
| `price_changed` | unchanged id, different price. Live Shopify variant price wins |
| `dropped:unexplained` / `added:unexplained` | **nobody has a reason. Must be zero before the repoint** |

The tool exits non-zero while any unexplained row remains. A coded drop is a
decision to review; an unexplained one is a blocker.

## The no-tier list

`scripts/no_tier_report.py` emits the list Tim asked for, sorted by price
descending, with `custom_label_3` left blank for him to fill and a `why_missing`
column separating "no lookup row for this SKU" from "lookup row exists but its
tier is blank". Membership is decided by the generated row's own `custom_label_3`,
because that is what actually ships; the lookup is consulted only to explain why.

## Still open

1. Merchant Center account-level tax confirmation, before the three tax columns come out.
2. The 50 shipping rates from Qash.
3. Tim's next lookup re-issue, carrying the FF-RIT24 de-heroing, the FFT-CFDI
   correction, the FF-SBR-10 drop, the one-row-per-variant hex collapse, and the
   tiers he assigns off the no-tier list.
