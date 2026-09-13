# Hero retitle follow-ups

Tim's three follow-ups after the 10/10 closeout was accepted. The closeout itself
is in [`hero-feed-title-closeout.md`](hero-feed-title-closeout.md). Freeze is
confirmed through **2026-10-06** and covers Shopify page titles as well as feed
titles. Nothing else on these ten is touched until the freeze read.

## 1. FFB-DAP and FF-FSR90 — the Needs-attention issue

Both sit at **Limited** discoverability with **Needs attention 1**. The exact
issue name has to be read off the item's Needs attention tab in Merchant Center;
it is not derivable from Shopify.

Tim's conditional: if it turns out to be *missing local inventory data*, as it
was on FF-T850, then these go into the next local-file revision **only if their
stock and lead time actually qualify**. His standing rule from the local
inventory thread, 2026-09-08:

> Correct only where Shopify misstates reality [...] never to force eligibility.
> If WASP confirms units are on hand and orderable, fix the negative quantity.
> If a processing time is wrong versus what we actually ship, correct it. If the
> values are accurate, leave them exactly as they are — those items stay
> excluded, and that's correct.

Checked against the cohort gates in [`local-inventory-feed.md`](local-inventory-feed.md):

| | FFB-DAP | FF-FSR90 |
| --- | --- | --- |
| In `french-fitness-showroom-products` | **no** | yes |
| In the primary-offer allowlist | **no** | yes |
| `custom.processing_time_filter` | Ships in 2 weeks or less | Ships in 2 weeks or less |
| Lead-time gate | would pass | **passes** |
| `custom.old_legacy_product_code` | none | none |
| Id scheme (single-variant, no legacy code) | bare SKU | bare SKU |
| Stock per WASP | not asked — moot | **open, Larianne** |

**FFB-DAP does not qualify, and not on a judgement call.** It is not in the
showroom collection and has no offer in the primary-offer allowlist, so it can
carry no local inventory row at all. A row for an offer the primary feed does
not carry processes as "Offer does not exist". Its lead time would have passed,
but membership fails first, so stock never gets asked. If its Needs-attention
issue is missing local inventory data, the correct outcome is that it stays
excluded. Adding it to the showroom collection to clear a Merchant Center
warning would be forcing eligibility.

**FF-FSR90 is a genuine candidate.** It is in the showroom collection, it is in
the allowlist, and its processing time clears the gate. The only open question
is stock, and that is a WASP answer, not a Shopify one: Shopify shows 926 units
on this variant, which under the feed spec is an orderability placeholder rather
than a shelf count and proves nothing either way. Larianne confirms from WASP.
If WASP says units are on hand and orderable it enters the next revision as
`on_display_to_order` / quantity 1; if not, it stays excluded.

## 2. FSR Final Upload — first in the post-sale supplemental cleanup queue

Tim: a second source contending for FSR90's title does not stay.

The source is **`FSR Final Upload - 7 rows (id, title) - v2 Light Commercial
FSR110 - 7-21 - Untitled.tsv`**. It appears in FF-FSR90's raw data source
attributes, so it is contributing to that item, not merely linked. It is a
title-only supplemental of the same shape as `hero_titles_supplemental.csv`.

Today the approved string is what renders, so `hero_titles_supplemental.csv` is
winning precedence. That is the fragile part: precedence between two sources
supplying one attribute is not something to rely on for a p1_hero SKU.

Sequence when the cleanup starts, not before:

1. Read all 7 rows of the source and record which offer ids it carries and what
   title it supplies for each. Seven rows means six other offers are also
   affected, and they are not necessarily hero SKUs.
2. Confirm every one of those offers gets its intended title from another
   source once this one is gone. FF-FSR90 does, from
   `hero_titles_supplemental.csv`. The other six need checking before removal.
3. Only then unlink and delete.

Do not remove it during the freeze. Deleting the losing source cannot change a
rendered title, but it is still a title-path change on a frozen SKU, and the
six other offers are the real risk.

## 3. FFT-ACD — the Edited marker

The item carries an **Edited** marker in Merchant Center, which means a manual
edit is overriding feed data on some attribute. A manual edit takes precedence
over every source, so whatever it covers will not update from the feed, the
supplemental, or the Phase 2 generator after cutover.

The title currently renders as the approved string, so if the edit is on the
title it at least matches. That is not a safe assumption to leave standing.

Per Tim, this runs **after the cleanup starts**, not now: identify the
overridden attribute from the item's edit history, then remove the edit so the
feed is the single source of truth.

This one matters beyond the retitle. An unnoticed manual edit on any offer is a
silent divergence from the generated feed, so whatever is found here should
inform whether the cutover checks for edited items across both primaries.
