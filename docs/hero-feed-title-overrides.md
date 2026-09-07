# Hero-SKU feed title overrides

Ten approved Google feed titles for the priority-1 hero SKUs. Approved by Tim,
2026-09-05. These are **Merchant Center feed titles only** - not Shopify product
titles, and not PDP H1s. Nothing in Shopify changes.

Canonical data: [`feeds/hero-title-overrides.csv`](../feeds/hero-title-overrides.csv).
That file is the single source of truth for both delivery paths below.

## Two delivery paths, one table

| | Path | Owner |
| --- | --- | --- |
| Now | `title` column added to the live GMC supplemental | Larianne / Yusra |
| Phase 2 | SKU-keyed override table in the feed generator | Izza |

Both read the same CSV so the two cannot drift. Phase 2 exists because the
generator pulls titles from Shopify: without the override table, cutover
silently reverts all ten to the Shopify titles.

## The supplemental is v2, not the labels-only file

Tim's original instruction named `supplemental_priority_labels_ONLY.csv`. His
coordination warning the following day supersedes it: the source now hosts
`supplemental_priority_labels_v2.csv`, which carries **both** `custom_label_3`
(priority tiers) and `custom_label_4` (series). The Ads account is restructured
on those labels, so the titles are **added to v2, producing v3**.

Re-uploading anything built from the earlier labels-only file wipes the series
values and takes the Product Lines asset groups dark. `scripts/build_supplemental_v3.py`
refuses to write if the input has no `custom_label_4`, which is exactly that mistake.

## Offer ids

The primary feeds use three id schemes (see
[`local-inventory-feed.md`](local-inventory-feed.md)): `<product ID>-<variant ID>`
for multi-variant products, `custom.old_legacy_product_code` where set, and
`variant.sku` for everything else. A row whose id does not match the primary
offer id processes as "Offer does not exist".

All ten resolve to the **bare SKU**, verified against live Shopify on 2026-09-07:
every one is ACTIVE, single-variant (`variantsCount = 1`), and carries no
`custom.old_legacy_product_code` at product or variant level, so the third scheme
applies. Eight are additionally confirmed present by name in the
`googleshoppingfs` / `googleshoppingfrenchfitness` export intersection recorded in
`snippets/local-inventory-offer-allowlist.liquid`.

`FFT-PLCLE` and `FFB-DAP` are absent from that snippet only because it is
intersected with the showroom cohort and both are `inCollection(showroom) = false`.
Their id scheme is not in doubt; their presence in the primary feed is simply not
evidenced by a file that never covered them, so they are the two to spot-check
first in GMC after upload.

## Title rules

- Exact strings, character for character. The separator is an **en dash (U+2013)**,
  not a hyphen.
- The keyword phrase must end inside the first 70 characters.
- Merchant Center hard limit is 150 characters.
- **No title edits on these SKUs for 4+ weeks after go-live.** Google re-learns
  matching on stable titles.

`scripts/check_hero_titles.py` enforces all of the above and exits non-zero on any
violation. Current state: all ten pass, longest title 102 characters, latest
keyword end at character 67 (`FF-FSR90`).

`FF-FSR90` has only 3 characters of headroom on the 70-character rule. Any future
edit that lengthens the front of that string breaks it, so re-run the checker
before touching it.

## Verification after upload

1. GMC > Products, filter to each of the ten offer ids. New titles appear within a
   few hours of processing.
2. Confirm `custom_label_3` and `custom_label_4` are still populated on the rows
   that had them. If the series values are gone, the wrong base file was uploaded.
3. Spot-check `FFT-SLCLE` and `FFB-45DLLP` (Tim's named pair), plus `FFT-PLCLE`
   and `FFB-DAP` for the id reason above.
4. Any "Offer does not exist" error: stop and reply to Tim. Do not improvise ids.
