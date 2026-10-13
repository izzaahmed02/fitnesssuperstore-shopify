# Products over $1000 — what adds to it, and the proposed fix

Tim's item 4 on the condition-feed thread. Read against live Shopify
2026-10-13. Nothing was changed.

## What adds products to it

**`productDuplicate` copies manual collection membership.** Every time
someone duplicates a product — which this team does constantly for combined
listings, test copies and variant splits — the duplicate silently inherits
the original's place in `Products over $1000`.

I demonstrated it today by accident and then on purpose, while building the
kettlebell QA test family:

| step | collection count |
| --- | --- |
| before duplicating | 2,548 |
| after duplicating Set 5-80 lbs (9878967877948, $1,099) | **2,549** |
| after removing the duplicate again | 2,548 |

The control: the source Set 5-80 **is** a member of `Products over $1000`,
and its duplicate arrived in the collection. The source Set 5-30 lbs
(9878965125436, $159) is **not** a member, and its duplicate did not. So
membership tracks the source, not the price.

Nothing was tagged, no rule fired and no app ran — the duplication did it on
its own. The duplicate also arrives with the original's price, so it looks
plausible, which is why nobody has caught it.

That also explains the shape of the junk in there. Duplicates are how test
copies and QA records get made, so duplicates are exactly what the
collection fills up with.

### Why it never self-corrects

The collection is manual:

- Collection 511454740796, handle `products-over-1000`
- `ruleSet: null` — no conditions at all
- `sortOrder: MANUAL`

So nothing removes a product either, when its price drops, when it is
archived, or when it was a test record all along. Additions are automatic
(via duplication) and removals are manual. The count only goes up.

For completeness: `updatedAt` reads **2026-10-13T07:59:19Z**, so it was
being written this morning before I touched anything. `Collection.events` is
empty, and the Admin API does not attribute membership changes, so I cannot
name the specific actor behind earlier additions — but the duplication
mechanism above is demonstrated, repeatable, and sufficient on its own to
produce the drift below.

## What the drift looks like today

| | count |
| --- | --- |
| total members | **2,548** |
| ACTIVE | 2,229 |
| ARCHIVED | **163** |
| UNLISTED | **144** |
| DRAFT | **12** |
| not of type `Product Index` | **310** |

319 members — one in eight — are not active products. Among the drafts:

- `[QA ONLY — DRAFT — DO NOT PUBLISH] 5,000 Sq Ft Gym Set B — PR793`
  (10480410067260)
- two Star Trac OOB drafts (10456972788028, 10456978325820)

and in the unlisted set, `French Fitness FFB Black 5 Stack Multi Jungle Gym
(TEST COPY)` (10418980880700). A QA record and a test copy are sitting in a
customer-facing collection. Full draft list in
`products-over-1000-draft-members.csv`; the breakdown and the exact query
behind every number in `products-over-1000-membership-breakdown.csv`.

For scale, the store has **2,761** products with a variant at $1,000 or
more, and **2,318** that are also `Product Index` and active. The manual
list of 2,548 matches neither, and cannot be made to match by hand.

## Proposed fix

Mirror the sibling collection, which already works this way. **Gym
Equipment Under $1,000** (520025080124) is a smart collection with:

```
TYPE            EQUALS        Product Index
VARIANT_PRICE   GREATER_THAN  99.99
VARIANT_PRICE   LESS_THAN     1000
VARIANT_INVENTORY GREATER_THAN 0
```

So give Products over $1000 the matching rules, all conditions (AND):

```
TYPE            EQUALS        Product Index
VARIANT_PRICE   GREATER_THAN  999.99
VARIANT_INVENTORY GREATER_THAN 0
```

Archived, draft and unlisted products drop out on their own, and so does
anything whose price falls below $1,000 later. No one has to maintain it.

**One decision for Tim: keep the inventory rule or not.**

| rule set | resulting members |
| --- | --- |
| with `VARIANT_INVENTORY > 0` | **1,578** |
| without it | **2,318** |
| today (manual) | 2,548 |

The inventory rule is what the under-$1,000 collection uses, so keeping it
is consistent — but it drops 740 products, and it is also the rule that
quietly keeps zero-inventory records such as combined-listing parents out.
My recommendation is **keep it**, for consistency with the sibling, and
accept 1,578. If Tim wants parity of *coverage* rather than parity of
*rules*, drop it and take 2,318.

**Before/after is large either way** — 2,548 down to 1,578 or 2,318 — so
this wants his explicit GO on a named number, not a general approval.

## How to apply it, and how to undo it

Switching a manual collection to automated **discards the manual
membership**. That is the point, but it is not reversible by toggling back:
the hand-picked list is gone once the rules take over.

So, in order:

1. Export the current 2,548 member IDs to a CSV and attach it to the thread
   — that export *is* the rollback.
2. Apply the rules in Admin, in one change, on a named date/time.
3. Re-read the count and post it against the number Tim approved.
4. Spot-check that the QA draft and the TEST COPY record are gone, and that
   a known $1,000+ active product is still present.

**Rollback:** set the collection back to manual and re-import the exported
member list. Ten to fifteen minutes with Matrixify.

**Not done.** No rules were added, no member was removed, nothing was
exported. This is the proposal for Tim's approval, which is what he asked
for.

## Reproducing the numbers

```
collection(id:"gid://shopify/Collection/511454740796"){ ruleSet{rules{column}} sortOrder updatedAt productsCount{count} }
productsCount(query:"collection_id:511454740796 AND status:archived"){count}
productsCount(query:"product_type:'Product Index' AND price:>=1000 AND status:active AND inventory_total:>0"){count}
```

One caveat for anyone re-running these: in the Admin product search,
`collection_id:` does **not** combine with numeric filters such as `price:`
or `inventory_total:` — the query silently returns 0. It does combine with
`status:` and `product_type:`. Every number above uses only the
combinations that work.
