# Hero-SKU retitle closeout

Closeout record for the ten approved Google feed titles. The approval, the id
reasoning and both upload paths are in
[`hero-feed-title-overrides.md`](hero-feed-title-overrides.md); this file is the
evidence trail for "did all ten land, and did anything else move".

| | |
| --- | --- |
| Delivery | `hero_titles_supplemental.csv` (`id` + `title`, 10 rows, keyed on bare SKU) |
| Linked to | both primaries |
| Go-live | **2026-09-08** |
| Freeze ends | **2026-10-06** (go-live + 28 days) |
| Confirmed with Tim on go-live day | `FFT-SLCLE`, `FFB-45DLLP` |
| Remaining eight verified | 2026-09-10 |
| Retitle result | **10/10** - every approved title live, both label columns intact |
| Serving state | 8/10 Approved with Needs attention 0; `FFB-DAP` and `FF-FSR90` at Limited |

## Expected state, per SKU

Titles come from [`../feeds/hero-title-overrides.csv`](../feeds/hero-title-overrides.csv).
The two label columns come from `supplemental_priority_labels_v2.csv`, the file
Tim issued on 2026-09-08 and now committed as the canonical lookup. The title
supplemental carries only `id` and `title`, so it cannot contribute either label:
any drift in these two columns means something other than this work touched v2,
and that is a stop-and-reply, not a retitle problem.

| SKU | custom_label_3 | custom_label_4 |
| --- | --- | --- |
| FFT-LPSCR | p1_hero | Tahoe Series |
| FFB-45DLLP | p1_hero | FFB Black Series |
| FFT-SLCLE | p1_hero | Tahoe Series |
| FFT-PLCLE | p1_hero | Tahoe Series |
| FFT-LPDLR | p1_hero | Tahoe Series |
| FFM-PLHSLP | p1_hero | Monster Series |
| FFT-HAA | p1_hero | Tahoe Series |
| FFB-DAP | p1_hero | FFB Black Series |
| FFT-ACD | p1_hero | Tahoe Series |
| FF-FSR90 | p1_hero | FSR Series |

All ten appear exactly once in the 2,196-row v2 lookup, so there is no
tier-conflict or duplicate-row exposure of the kind found on the hex dumbbell
variants.

## Live Shopify verification (2026-09-10)

Re-checked against the Admin API before the closeout, because a SKU-keyed
supplemental lands on whatever offer carries that SKU:

- All ten SKUs resolve to **exactly one** product each. None of the ten is in the
  198-SKU combined-listing duplicate set, so the title cannot land on a legacy
  standalone row instead of the serving one.
- All ten products are `ACTIVE`, single-variant (`variantsCount = 1`), in stock,
  and published to the **Google & YouTube** channel.
- Every `shopify_product_id` and `shopify_variant_id` in
  `feeds/hero-title-overrides.csv` matches the live product and variant.
- Every price is well above the $1,000 series-label floor
  (`FFM-PLHSLP` $2,499 is the lowest, `FF-FSR90` $3,299 the highest), so all ten
  are inside the `custom_label_4` cohort by price as well as by label.

The approved strings were also re-transcribed from Tim's 2026-09-05 email and
diffed against the committed table: all ten byte-identical, en dash intact.
`scripts/check_hero_titles.py` passes — longest title 102 characters, tightest
keyword end at character 67 (`FF-FSR90`).

## Result, 2026-09-10

**Retitle: 10 of 10.** Every one of the ten shows the approved string exactly,
en dash intact, and every one still carries `custom_label_3 = p1_hero` plus its
`custom_label_4` series value from v2. All ten list `hero_titles_supplemental.csv`
and `supplemental_priority_labels_v2.csv` side by side in raw data source
attributes, so the title source is contributing without displacing the labels.
No id errors, so the bare-SKU scheme was right on all ten.

**Serving state: 8 of 10.** Two items are not clean, and neither is a retitle
problem:

- `FFB-DAP` and `FF-FSR90` sit at **Limited** ("showing on Google but has
  limited discoverability") with **Needs attention 1**. A supplemental carrying
  only `id` and `title` cannot cause a discoverability limit, and the title,
  both labels and both source attributions are correct on both items. Read the
  Needs attention tab on each for the named issue before attributing it to this
  work. Live Shopify shows nothing that separates these two from the eight clean
  ones: both are ACTIVE, single-variant, in stock, published to Google &
  YouTube, carry a barcode and resolve to a working product URL.

Two smaller observations, neither blocking and neither in scope for the freeze:

- `FFT-ACD` carries an **Edited** marker on the item. A manual Merchant Center
  edit takes precedence over feed data, so whatever it covers will not update
  from any source. The title is currently correct, so if the edit is on the
  title it is at least the approved string, but it should be identified.
- `FF-FSR90` also carries **`FSR Final Upload - 7 rows (id, title)`**, a second
  supplemental that supplies `title` on the same primary. The approved string is
  what renders today, so `hero_titles_supplemental.csv` is winning, but two
  sources contending for one attribute on a hero SKU is fragile and should be
  resolved in the post-sale supplemental cleanup rather than during the freeze.

## Closeout checklist

[`../feeds/hero-title-closeout-checklist.csv`](../feeds/hero-title-closeout-checklist.csv)
carries one row per SKU with the expected values pre-filled and the observed
columns blank. For each SKU, in **Merchant Center > Products > All products**,
search the offer id and record from the item detail page:

| Column | Where it comes from |
| --- | --- |
| `observed_title_matches` | the title shown on the item, compared to `expected_title` |
| `observed_custom_label_3` | raw data source attributes, contributed by v2 |
| `observed_custom_label_4` | raw data source attributes, contributed by v2 |
| `item_status` | the item's status chip |
| `needs_attention_count` | the item's Needs attention count |

Then run:

```
python3 scripts/check_hero_title_closeout.py
```

Exit 0 prints the 10/10 line. Exit 1 prints the exact exceptions, per SKU, in the
form the closeout reply needs. Exit 2 means rows are still unchecked.

## Stop-and-reply conditions

Per the approval, these are reported rather than fixed in place:

1. **"Offer does not exist"** on any of the ten — the id scheme moved again. Do
   not improvise ids.
2. **A missing or changed `custom_label_3` / `custom_label_4`** — the title
   supplemental cannot cause this, so something else overwrote v2 and the
   Product Lines asset groups are at risk.
3. **A title that renders differently from the approved string** — most likely a
   straight hyphen substituted for the en dash, or another supplemental now
   contributing a `title` and winning precedence.

## Freeze

No title edits on these ten SKUs until **2026-10-06**. That includes Shopify
product titles, which feed the Phase 2 generator: the SKU-keyed override table
in `feeds/hero-title-overrides.csv` is what keeps cutover from reverting them,
and it is the only place these strings should be edited afterwards.
