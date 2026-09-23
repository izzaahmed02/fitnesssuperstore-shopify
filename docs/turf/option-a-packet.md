# READY FOR TIM REVIEW — Turf combined listing (Option A)

Read back against live Shopify Admin API on 2026-09-23. Every number below is
a live read, not a restatement of the brief. Row-level evidence is in the four
CSVs beside this file.

## 0. Architecture correction — this changes items 5 and 7

The Sept 23 00:54 ruling, and the Uprights message sent four minutes later,
both rest on 10380015927612 being a **native Shopify Combined Listings
parent** that "cannot be purchased, holds no inventory, and whose children are
the only sellable records."

That is not what is live. Read back:

| check | 10380015927612 (turf parent) |
| --- | --- |
| `hasVariantsThatRequiresComponents` | `false` |
| `productVariantComponents` on each of the 3 variants | `[]` — empty |
| own inventory items | 3, one per variant (54898397151548 / …184316 / …217084) |
| `inventoryItem.tracked` | `false` on all three |
| `inventoryPolicy` | `DENY` |
| status / publication | ACTIVE, published to Online Store |

There is no component link of any kind between the parent's variants and the
three child products. It is a **standard three-variant product** that happens
to reuse the children's SKUs.

And because its inventory items are **untracked**, Shopify does not gate the
sale on quantity: `DENY` only bites when `tracked` is true. So the parent is
not merely purchasable — it is purchasable **without limit**.

The full evidence table, including Uprights, is in
`combined-listing-architecture.csv`.

### What that does to item 7

Gate 7 asks Iqra to prove that a purchase on `?variant=53039894462780`
"resolves to the correct child variant and record." On the current build it
cannot, and the test will fail for a structural reason rather than a bug:

| grade | SKU | parent variant / inventory item | child variant / inventory item |
| --- | --- | --- | --- |
| V1 Base | FF-AGSL | 53039894462780 / 54898397151548 | 50749209182524 / 52598878601532 |
| V2 Plus | FF-AGSL-V2 | 53039894495548 / 54898397184316 | 50749210100028 / 52598879912252 |
| V3 Premium | FF-AGSL-V3 | 53039894528316 / 54898397217084 | 50749211083068 / 52598881616188 |

Different records in both columns (`gate7-record-map.csv`). An order placed on
the parent books the parent's own variant and inventory item. The child's
count never moves.

### What that does to item 5

Item 5 has Iqra set real WASP counts on the three standalones before the flip.
That protects nothing while the parent sells untracked: the parent will keep
taking orders at any volume regardless of what the children say. Setting real
counts is still right, but it is not the control it is being relied on as.

Also worth knowing before it bites elsewhere: SKU `FF-AGSL` now exists on two
variant records, as do `-V2` and `-V3`. Anything that reconciles by SKU —
WASP, QuickBooks, the `3rd_party` metaobject join — has two candidates.

Three ways out, all needing your written GO and none taken:

1. Make the parent genuinely non-sellable (set the three variants to a
   $0/hidden state or remove them) and let the children carry every sale.
   Biggest change, but it is the model the gates were written for.
2. Leave the parent sellable and accept it as the record of truth: set
   `tracked: true` on the three parent inventory items, move the real WASP
   counts there, and zero the children. Gate 7 then gets rewritten to prove
   the purchase resolves to the **parent** record.
3. Ship the discovery flip only, change no sellability, and close gates 5 and
   7 as not-applicable-under-Option-A.

Option 3 is the smallest and is what the rest of this packet is scoped to.

## 1. Uprights — the architecture confirmation you asked for

10281641443644 is a **standard product with ten variants and its own tracked
inventory**, not a native Combined Listings parent:

- `hasVariantsThatRequiresComponents: false`
- `productVariantComponents: []` on all ten variants
- ten own inventory items, `tracked: true`, counts 9,967–9,999,
  `totalInventory` 99,915
- status UNLISTED, `productType` "Product (Hidden)", tag `hidden` — so it is
  out of search and collections but reachable and purchasable by direct URL

That matches your own read: money can move through it. It also means turf and
Uprights are the **same** architecture, not opposite ones — neither is a
native parent. The SOP needs one pattern documented, not two, plus the note
that the distinction people have been calling "native parent" is in practice
just "untracked variants" (turf) versus "tracked variants" (Uprights).

Separately, while I was in the record: all ten Uprights variants still carry a
`compareAtPrice` (99 / 199 / 299 / 399). The compare-at removal has not landed.

## 2. Item 8 — Meta Feeds rule sets, confirmed

All three "- Meta Feeds" collections are conjunctive (`appliedDisjunctively:
false`) and every one of them carries both rules:

- `TYPE EQUALS "Product Index"`
- `TAG NOT_EQUALS "REMOVE FROM FEEDS"`

Baseline counts as of today, before anything moves:

| collection | id | products |
| --- | --- | --- |
| French Fitness - Meta Feeds | 513321435452 | 917 |
| Remanufactured - Meta Feeds | 513321730364 | 1,242 |
| Other Brand - Meta Feeds | 513321828668 | 295 |

The three turf children are members of French Fitness - Meta Feeds. The parent
is in none of the three. See `meta-feeds-baseline-2026-09-23.csv`.

Two things you should know that the brief assumes otherwise:

- **`REMOVE FROM FEEDS` is the only thing keeping the parent out.** It already
  satisfies every other rule in the FF set: TYPE `Product Index`, VENDOR
  `French Fitness`, variant price 669 > 99, variant weight 75 < 650, no
  `discontinued` tag. Pull that one tag and it joins the feed cohort the same
  hour. Your "no tag comes off 10380015927612 without my written GO" is
  load-bearing on exactly one rule.
- **`META_UNDER_1000_EXCLUDE` is not referenced by any of the three Meta Feeds
  rule sets.** It is not what is holding the parent out of them. The parent is
  also out of `gym-equipment-under-1-000`, but that collection excludes it on
  `VARIANT_INVENTORY GREATER_THAN 0` — the parent reads 0 — not on that tag. I
  have not audited every collection in the store, so I am not claiming the tag
  does nothing anywhere; I am saying it is not doing the job it is credited
  with here.

One coupling to flag before the weight decision in item 4 lands: all three
Meta Feeds collections carry `VARIANT_WEIGHT LESS_THAN 650`. The verified
weights are going in at 92–298 lb, so membership holds, but weight edits on
these products are feed-membership edits.

## 3. Item 4 — the weight conflict, laid out

There are not three conflicting sets, there are four, and one product
contradicts itself (`weight-conflict.csv`):

| grade | parent metafields + description table | child metafields | child copy | **Shopify variant weight** |
| --- | --- | --- | --- | --- |
| V1 Base | 156 lb | 92.37 (ship 92.59) | "156 lb full-roll weight" | **75 lb** |
| V2 Plus | 224 lb | 242.5 | — | **75 lb** |
| V3 Premium | 280 lb | 297.6 | — | **75 lb** |

Points for whoever verifies:

- The V1 child's own copy says 156 lb while its own `product_weight_lbs` says
  92.37. One of those is wrong inside a single product record.
- The child figures are not a consistent offset from the parent figures: V1 is
  lower (92 vs 156), V2 and V3 are higher (242.5 vs 224, 297.6 vs 280). This
  is not a unit conversion or a roll-length rescale, so it will not be
  resolved by arithmetic — only by the spec sheet.
- The 92.37 figure is likely inherited from the 65.5 ft roll these children
  used to be; the Judge.me payload on the V1 child still names it
  "65.5' x 6.5'".
- **The only number that prices freight is the 75 lb variant weight**, and it
  is identical on all three grades — which cannot be right when the grades
  differ by roughly 2x. It is also the lowest candidate on the table, so it
  understates freight on every grade today, on both the parent and the
  children. That is live now, not a cutover risk.

Nothing changed. Holding for Iqra's verified numbers, then I align parent
metafields, child metafields, the description table, the child copy, and all
six variant weights in one pass.

## 4. The discovery flip — change spec

Goal: the turf roll shows one card. Today `turf-flooring` (5 products) and
`french-fitness-turf-flooring` (5 products) each render the same 82 ft roll
four times — parent plus three children — alongside the 14 ft x 50 ft turf
track (9878928818492). After the flip each grid shows two cards: the parent
roll and the track.

**Recommended mechanism: a Boost AI Search & Discovery product-exclusion rule,
keyed on product ID.**

- Scope: Search results **and** Collection results.
- Products: 9878926557500, 9878927114556, 9878927573308.
- Nothing else changes: no tag edits, no status changes, no collection edits,
  no metafield writes.

Why by Boost rule and not by tag: a tag edit on these products is a rule-set
edit on the Meta Feeds collections (`TAG NOT_EQUALS` on four different tags,
plus the weight and price rules), so it puts feed membership at risk to solve
a display problem. A Boost rule writes nothing back to Shopify, which is also
what makes the item-1 membership diff provable rather than hopeful —
membership *cannot* change, because the change never touches Shopify data.

Boost is installed as app blocks on `templates/search.json` and
`templates/collection.json`
(`shopify://apps/boost-ai-search-filter/blocks/filter-product-list-ssr/…`), so
the rule is configured in the Boost admin, not in the theme. No theme deploy.

**Known side effect, needs your call.** Excluding the children from collection
grids removes turf from four grids the parent is not in:

| collection | type | why the parent is absent |
| --- | --- | --- |
| Products - New (501907587388) | manual | children added by hand; parent never was |
| Products over $1000 (511454740796) | manual | same |
| Miscellaneous Gym Equipment (509469720892) | smart | rule is `TAG EQUALS "Miscellaneous Gym Equipment"`; children carry it, parent does not |
| Gym Equipment Under $1,000 (520025080124) | smart | rule is `VARIANT_INVENTORY > 0`; parent reads 0 |

Cheapest fix if you want turf to stay in those grids: add the parent to the
two manual collections and add the `Miscellaneous Gym Equipment` tag to it.
The fourth resolves itself only if the parent's inventory becomes real, which
is the item-5 decision above. All of that is a tag/collection change on
10380015927612, so it waits on your written GO.

One more: `flooring-installation-required` is on all three children and **not**
on the parent. After the flip the parent is the only turf roll card customers
see, so the installation flag would be missing from the only page they land
on. Adding it is the same GO.

**Rollback, 10 minutes:** delete the Boost exclusion rule. Nothing else moves.
No Shopify write to undo, no theme revert, no feed regeneration.

**Verification after the flip:** re-run the baseline query on the three Meta
Feeds collections and confirm 917 / 1,242 / 295 unchanged; screenshot
`/collections/turf-flooring` and `/collections/french-fitness-turf-flooring`
showing two cards; screenshot site search for "turf" showing one roll card.

## 5. Boost GO 2 window

Per the 15:04 note, the flip lands before Friday Sept 25's pre-toggle baseline
capture or after Saturday Sept 26's +24-hour read. It is gated on your GO, not
on a date, so no date is being claimed here. If the GO lands Wednesday or
Thursday I will post the exact date/time on this thread and the Boost thread
before Izza applies it.

## 6. Still with others

- Iqra: verified per-grade shipping weight (item 4), real WASP counts (item 5),
  sale-scope screenshot (item 6), add-to-cart and processing-time tests
  (item 7 — see section 0 first).
- Yusra: 0-review screenshots to close the Judge.me merge as a no-op (item 3).
- Izza: the Boost exclusion rule and the membership diff (item 1); turf
  id-continuity override stood down (item 2). Both turf children carry
  `custom.legacy_gmc_id` = their SKU with `gmc_id_rollout_status: approved`,
  and `custom.product_canonical_url` pointing at the parent, so the offer keys
  and canonicals are already as item 2 describes them.

## Reproducing this

Every figure above comes from the Shopify Admin GraphQL API, read-only. The
collection baseline is:

```graphql
{
  ff:  collectionByHandle(handle:"french-fitness-meta-feeds"){ productsCount{count} }
  rem: collectionByHandle(handle:"remanufactured-meta-feeds"){ productsCount{count} }
  oth: collectionByHandle(handle:"other-brand-meta-feeds"){ productsCount{count} }
}
```

The architecture check is `hasVariantsThatRequiresComponents` plus
`variants{ nodes{ productVariantComponents(first:5){nodes{id}} } }` — an empty
component list on every variant is the proof that a product is not a native
Combined Listings parent.
