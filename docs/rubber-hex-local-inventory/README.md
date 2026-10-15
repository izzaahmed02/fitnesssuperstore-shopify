# Rubber Hex — Local Inventory correction (for Tim's live GO)

Scope/build approved by Tim on Oct 13 and Oct 14 (Missing-shipping thread).
This PR changes **one file that deploys**: `snippets/local-inventory-offer-allowlist.liquid`.
Everything else in this folder is evidence. Nothing here is live until Tim's GO
on this PR's head SHA, and the collection change below is done in the same window.

## Change set

| # | Where | Change |
| --- | --- | --- |
| 1 | Shopify collection 505894535484 (French Fitness Showroom Products, manual) | Add the 43 children in `manifest-43-children.csv`. Remove product 10247596147004. No other member changes. Exact list: `collection-505894535484-membership-change.csv`. |
| 2 | `snippets/local-inventory-offer-allowlist.liquid` | 266 → 257 offers. Remove the 45 old composites `10247596147004-*` and the 7 archived rack/bench SKUs (`FF-RCHD5-50-R`, `-50-RB`, `-70-R`, `-75R`, `-75RB`, `-100-R`, `-100-RB`). Add the 43 child SKUs. No non-Rubber-Hex entry changes. |

Not changed: PR #913 resolver, `gmc_id_rollout_status`, `legacy_gmc_id`, stock,
processing times, prices, weights, SEO, `FSS1`, eligibility logic.

## The 43 children (`manifest-43-children.csv`)

- 12 sets + 31 singles, exactly the Rubber Hex offers in the production
  `googleshoppingfrenchfitness` file (`zKEuwAFD3p.tsv`).
- Local ID = primary offer ID = SKU for all 43 (38 by the SKU rule, 5 sets by
  the existing `approved` legacy rule whose `legacy_gmc_id` is their own SKU).
- All 43: ACTIVE, published to the Online Store, eligible through
  `processing_time_filter = "Ships in 2 weeks or less"` →
  `on_display_to_order`, quantity 1. No exceptions.
- Excluded: the five sub-$25 singles, the Combined Listings parent, test copies,
  rack/bench packages.

## Proposed output

`proposed-output-page1.tsv` (169 rows) and `proposed-output-page2.tsv` (87 rows).
Before: `before-output-page1.tsv` (214) and `before-output-page2.tsv` (44).

- Rubber Hex: 45 composite rows removed, 43 child rows added.
- Non-Rubber-Hex rows: **identical** before and after.
- Every proposed row is an offer ID present in the current primary feeds.

### Dependency: page 2 of the feed URL

The template paginates the collection at 250 products per page. The collection
has 357 storefront-visible products today (399 after the change), so the feed
has two pages:

```
https://www.fitnesssuperstore.com/collections/french-fitness-showroom-products?view=local-inventory-tsv
https://www.fitnesssuperstore.com/collections/french-fitness-showroom-products?view=local-inventory-tsv&page=2
```

The collection is sorted manually, so the 43 added children land on **page 2**.
Today page 2 already carries 44 non-Rubber-Hex rows. Merchant Center must fetch
both URLs, or these rows never reach Google. Confirm the local inventory data
sources in Merchant Center 9453531 before the GO.

## Non-Rubber-Hex differences (not applied)

A full regeneration from today's primary feeds would also add 109 non-Rubber-Hex
offers and remove 1 (`FF-SC600`, no longer in the primary feeds). They are listed
in `nonhex-allowlist-differences-not-applied.csv` for a separate decision and are
**not** in this PR.

## Verification method

`local_inventory_sim.py` reimplements the template's ID rule, eligibility gate,
allowlist filter, de-duplication and 250-per-page pagination. Run on today's
Shopify data with the current `main` allowlist, it reproduces the live feed
**byte for byte**, page 1 and page 2. The proposed outputs come from the same
code with the change set applied.

Inputs (not committed, hashes for audit):

| Input | Source | SHA-256 |
| --- | --- | --- |
| Showroom collection export | Shopify bulk operation 8671761629500, 2026-10-15 ~16:40 UTC | `cf1cd6e5ab846dacf5a6a25b35c5f368c8211143116bd836f1a80459199ad872` |
| FF-RCHD product export | Shopify bulk operation 8671740690748 | `3e2f47b362db68872b2b0dab94807ed9c75da4d2900a90214bfc4dfcf66a4a67` |
| googleshoppingfrenchfitness | `zKEuwAFD3p.tsv`, Last-Modified 2026-10-15 03:36:47 GMT | `2552281d7ce04daa18ce7ddafc82fd832a0b313c0fe821301c52e8349184d831` |
| googleshoppingfs | `fjrqrrUe8y.tsv`, Last-Modified 2026-10-15 03:36:47 GMT | `4392db00e9b8513ad26cc708a50828530f67f402baba6200dc3150d060146430` |
| Live local feed page 1 | fetched 2026-10-15 16:42 UTC | `13f753b6aa524c8004caf1ee2ef16c39f926453f65c5dbdc22656b36570d074f` |
| Live local feed page 2 | fetched 2026-10-15 | `21c48680504d34a1d9045ba32bb447da29725951d628c289ac8c3927f19519df` |

## Release order (same window, after Tim's GO)

1. Save before-state: `collection-505894535484-before.csv` (369 members in
   order), both live feed pages, this PR's base allowlist.
2. Apply the collection change (add 43, remove 10247596147004).
3. Merge this PR.
4. Fetch both feed URLs and diff against `proposed-output-page1/2.tsv`.
5. Merchant Center: confirm no "Offer does not exist" for Rubber Hex offers
   after the next fetch, and that the 43 show local inventory.

Either intermediate state is safe: with only step 2 or only step 3 done, the
feed emits no Rubber Hex rows and no obsolete IDs, and non-Rubber-Hex rows are
unchanged.

## Rollback

- Code: revert the merge commit (restores the 266-offer allowlist).
- Collection: re-add 10247596147004 and remove the 43 children, per
  `collection-505894535484-before.csv`.
- Do not restore the 45 composites unless the old product is also back in the
  primary feed; otherwise they process as "Offer does not exist". If only the
  Rubber Hex local rows misbehave, remove the 43 from the allowlist and keep
  everything else.
- Archiving 10247596147004 and its redirect are separate and happen only after
  primary and local continuity are verified.
