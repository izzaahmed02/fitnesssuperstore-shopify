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

## Offer ids: resolved against the file, never assumed

**Do not hand-key the id column.** The `id` values in the supplemental must match
whatever the primary feed currently uses, and that has not been stable:

- The **April** supplementals (`07_MC_SupplementalFeed_StrengthProductLines_*`,
  still listed in GMC, two marked `[TEST]`) key on the **numeric Shopify product
  ID** - e.g. `9878647144764` for FFT-SLCLE. Verified against live Shopify: those
  numbers are exactly these products' product IDs.
- The **September** primary feed exports key on the **bare SKU**. Eight of the ten
  appear by SKU in the export intersection recorded in
  `snippets/local-inventory-offer-allowlist.liquid` (2026-09-05 fetch).

That flip is almost certainly the one Tim raised in "URGENT GMC Issues" in April,
where the unique identifier was changed from product code to a numeric value and
he suspected it wiped the GMC performance history. Either way, an id in the wrong
format processes as "Offer does not exist".

So `feeds/hero-title-overrides.csv` carries the SKU **and** the Shopify product and
variant IDs, and `scripts/build_supplemental_v3.py` resolves each offer against the
downloaded file's own `id` column, trying SKU, product ID, `<product>-<variant>`,
and variant ID. It reports which scheme matched, and refuses to write if any of the
ten matches none, if a match is ambiguous, or if the ten resolve under mixed
schemes. Whatever v2 uses, the output matches it.

Supporting facts from live Shopify (2026-09-07): all ten products are ACTIVE,
single-variant (`variantsCount = 1`), and carry no `custom.old_legacy_product_code`
at product or variant level, so none of them falls into the legacy-code scheme
described in [`local-inventory-feed.md`](local-inventory-feed.md).

`FFT-PLCLE` and `FFB-DAP` are absent from the allowlist snippet only because it is
intersected with the showroom cohort and both are `inCollection(showroom) = false`.
Their presence in the primary feed is simply not evidenced by a file that never
covered them, so they are the two to spot-check first in GMC after upload.

## Decision: title-only supplemental (approved)

Tim approved the title-only supplemental on 2026-09-07: upload `id` + `title` for
the ten SKUs as its own source, **linked to both primaries**.

The v3 route is not being used. Merchant Center will not return the v2 file (the
source is `File (manual)`, with no download), and a hand-rebuilt v3 would be
dangerous: the source's last run reports **2,196 rows, 2,196 matched**, and its
advanced options are set to **"Do not retain items no longer provided in the
source"**, so any row omitted from a v3 loses its `custom_label_3` and
`custom_label_4` on upload. Tim is sending the v2 file to Izza directly for the
Phase 2 label lookup instead.

A supplemental contributes only the attributes it carries, so this source cannot
affect the label columns at all. v2 keeps supplying them.

`scripts/build_title_only_supplemental.py --id-scheme sku` generates the file.
`scripts/build_supplemental_v3.py` is retained for the v3 route but is not the
current path.

### Hands off the April supplementals

The `07_MC_SupplementalFeed_StrengthProductLines_*` sources key on legacy numeric
product ids. Per Tim, they are legacy and get cleaned up after the sale. **Do not
modify or delete them** as part of this work.

### Freeze

No title edits on these ten SKUs for **4+ weeks from the moment the new titles
show in GMC**. Google re-learns matching on stable titles. Record the go-live date
below when it is confirmed, so the freeze window is auditable.

| | |
| --- | --- |
| Titles confirmed live in GMC | _pending verification_ |
| Freeze ends | _go-live + 4 weeks_ |

## Id scheme: CONFIRMED as the bare SKU

Read directly off the `supplemental_priority_labels_v2.csv` raw-attributes panel on
the GMC product pages (2026-09-07), which is the source's own contribution to each
product and therefore authoritative:

| Product | id in v2 | custom_label_3 | custom_label_4 |
| --- | --- | --- | --- |
| FFT-LPSCR | `FFT-LPSCR` | p1_hero | Tahoe Series |
| FFB-45DLLP | `FFB-45DLLP` | p1_hero | FFB Black Series |
| FFT-SLCLE | `FFT-SLCLE` | p1_hero | Tahoe Series |

So the numeric product IDs in the April supplementals were the earlier scheme and
must not be reused. `--id-scheme sku` is correct.

v2's schema is exactly three columns: `id`, `custom_label_3`, `custom_label_4`.

The same panels show these offers each already carry several supplementals, each
contributing separate attributes: `Supplement Feed - additional attributes`
(promotion_id), `Flowboost Labelizer` (custom_label_0 plus performance metrics),
`display_ads_id_supplemental_full(1).csv` (display_ads_id) and v2 (the two labels).
That is direct evidence for Option B: a source carrying only `id` and `title` is the
pattern already in production here. None of the existing supplementals on these
SKUs supplies a `title`, so there is no precedence conflict to resolve.

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
