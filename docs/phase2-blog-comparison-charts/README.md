# Phase 2 — Shopify data packet for /pages/blog and /pages/comparison-charts

Owner: Yusra (Shopify data side — A3 blog category/tag changes, A4 301s and freshness,
B6 last-updated fields and live-catalog verification).
Verified against live Shopify Admin data and the live storefront on 2026-09-09.
Store: Fitness Superstore (79ef8b-5e.myshopify.com).

**Nothing in this packet has been executed.** Tim's Phase 2 email requires the
recategorisation/301 list to be approved before execution, and no production write
happens without his written GO. Every item below is a proposal with the exact
execution and rollback steps attached.

This packet also respects the sequencing gate: it touches no schema, no
`sections/main-article.liquid`, and no Smart SEO settings. Those stay with the
"Blog about the ROM Machine" thread and PR #791.

## Live baseline (verified)

| Item | Value |
|---|---|
| Blogs | 6: buying-guides (25), comparisons (25), maintenance (19), news (8), case-studies (6), warranty-shipping (2) |
| Articles | 85 total = 80 published + 5 unpublished. Matches Tim's count |
| Comparison chart cards on the hub | 48 (not ~45) |
| Comparison chart pages | all 48 exist and are published |
| Chart rows | 359 `comparison_product` metaobjects across the 48 charts |
| Chart rows pointing at a product URL | 317 unique; 315 return 200, 1 returns 404, 1 returns 301 |
| PAGE metafield definitions | 31. There is no last-updated field of any kind |
| Existing `/blogs/*` URL redirects | 0 (store has 3,972 redirects overall) |

## A3 — Category hygiene (`a3-recategorization.csv`)

Hub categories are driven by Shopify **blogs**, not tags, so recategorising means
moving articles between blogs. That changes the URL, so every move needs a 301.

Proposal: create one new blog, **Training & Wellness** (`training-wellness`), and move
9 articles into it. Six are the News catch-all offenders Tim named (sleep, burnout,
muscle fiber, rowing benefits, plus hot-weather training and 2026 fitness goals), two
are the Eliza and Marcus Filly workout guides he named, and one is an extra found in
the audit: "Why Your Elliptical Workout Isn't Working" is a technique article sitting
in Maintenance & Setup.

Two things Tim should decide before I execute:

1. **News drops to one published article.** After these moves and the aluminium-pulley
   retirement, News & Product Updates holds only "Why Buyers Choose French Fitness &
   Fitness Superstore". Recommend hiding the News slider on the hub until it has three
   or more, rather than shipping a one-card row.
2. **Warranty & Shipping cannot be grown from existing content.** Nothing in the live
   catalogue belongs there. It needs the three new posts Tim described (claims how-to,
   delivery prep, extended labor coverage), which is Larianne's lane.

Alternative worth one line: the Eliza and Marcus Filly pieces both carry a `case study`
tag and could go to Case Studies instead. I recommend Training & Wellness because both
are written as workout guides, but it is Tim's call.

## A4 — Freshness and retirement (`a4-freshness-retirement.csv`, `a4-301-redirects.csv`)

Body word counts were measured off the live rendered pages, not estimated.

- **One 301 retirement:** "Benefits Of Aluminum Pulleys For Fitness Equipment"
  (2021, 75 words) to `/blogs/buying-guides/top-cable-machines-for-versatile-workouts`.
- **The 2011 Power Plate post is not a retirement.** It runs 843 words and the Power
  Plate line is still live (10 models on the Power Plate chart). Improve in place.
- **The other 2021 post** (alternators and batteries) is 834 words and on-topic for
  Maintenance & Setup. Improve in place.
- **Three more thin posts found in the audit**, none of them in Tim's list:
  Technogym Console Comparisons (326 words), Traditional Steam Saunas vs Infrared
  (383), and How to Build a Home Gym (457). The last one matters most because it is
  pinned in the hub's "Popular Right Now" block.
- **Four year-stamped titles** flagged for a scheduled Q1 2027 refresh.
- **One junk draft** ("Test Case Study Blog") to delete. The `[STAGING] ... NO PUBLISH`
  draft stays as is.

All 80 published articles return HTTP 200. No broken article URLs.

## B6 — Comparison chart accuracy and last-updated (`b6-chart-audit.csv`, `b6-broken-rows.csv`)

Every one of the 359 chart rows was resolved and every product URL was fetched live.

**Two rows do not point at the live catalogue** (`b6-broken-rows.csv`):

1. Stairmaster Stepmill chart, SM5 TSE-1 row: **404**. The handle is missing `-tv`.
   The correct live product is `stairmaster-sm5-stepmill-tse-1-w-10-touch-screen-tv-remanufactured`.
2. True Fitness chart, CS900 Emerge row: **301**. The product was renamed to
   Transcend console (`true-fitness-cs900-treadmill-w-transcend-console-remanufactured`).
   The row should point at the live handle and the row title should say Transcend.

**One chart is a duplicate.** `precor-elliptical-comparison-chart` and
`precor-amt-model-comparison-chart-what-is-open-stride` reference the identical set of
six AMT metaobjects. Same content, two URLs. Recommend keeping the AMT page and 301ing
the other, subject to Tim's approval since it removes a chart.

**Three hub card item counts are wrong:** French Fitness MSC/FSR says 11 and has 12,
Precor Consoles says 4 and has 7, Rowing Machines says 5 and has 8.

**Eight hub card titles have drifted** from the live page titles (Adjustable Cable
Crossover, Bowflex Home Gym, Curved Treadmills, Power Plate, Precor Consoles, Rowing
Machines, Selectorized Leg Press, Ski Machines). Worth folding into Larianne's B3
rewrite so the copy and the destination agree.

**Rows with no outbound link at all:** 31 rows across eight charts (Bowflex Home Gym 3,
First Degree Rower 7, Keiser M3i 1, Life Fitness Classic Series Console 8, Precor
Console 7, Versaclimber 3, Woodway 1, Stairmaster Stepmill 1). Consoles are not sold as
products so some of that is by design, but Life Fitness Elevation and Matrix console
charts do link out (to collection searches), so the treatment is inconsistent.

### Last-updated field (the piece Tim assigned me)

There is no last-updated field on PAGE today. Proposal:

- Definition: owner `PAGE`, namespace `custom`, key `chart_last_updated`, name
  "Chart last updated", type `date`, one value per page, visible to the storefront.
- Seed value per chart: the page's current Shopify `updatedAt` date, listed in
  `b6-chart-audit.csv` under `proposed_last_updated_seed`. For the 14 charts with
  findings, the seed should instead be the date we finish the corrections, so the
  visible date is honest.
- Rendering is Waqas's side (theme), not mine.

## Execution and rollback (once approved)

1. Export the 85 article records (id, title, handle, blog, tags, published date) as the
   before state. Export the 48 chart pages and their `custom.comparison_products` values.
2. Create the `training-wellness` blog.
3. Move the 9 articles. Preserve title, handle, publication date, content, SEO fields,
   images, tags and template on every move.
4. Create the 10 URL redirects in `a4-301-redirects.csv` **in the same session** as the
   moves, so no window of 404s exists.
5. Fix the two broken chart rows, then re-fetch both product URLs and confirm 200.
6. Create the `custom.chart_last_updated` definition and write the 48 seed values.
7. Delete the "Test Case Study Blog" draft.
8. Readback: re-run the full row-resolution and URL check and confirm 359 of 359 rows
   resolve, 80 of 80 articles return 200, and all 10 redirects return 301 to a 200.

Rollback is the exact inverse: move the 9 articles back to their original blogs, delete
the 10 redirects, restore the two chart row URLs from the before export, delete the
metafield definition and its values. The before export is the single source for the
restore.

## Not in this packet

Hub restructure and search zero-state (A1, A2) are Waqas's. Card copy rewrites and
accuracy sign-off (B3, B8) are Larianne's. Alt text (B4) is Saliha's. All schema and FAQ
work (A6, B7) stays gated behind PR #791.

One cross-reference for Waqas: the live `main-blog-search` section is configured with
blog handles `fitness-superstore-blog`, `warranty-tips` and `showroom`, none of which
exist, and it omits `warranty-shipping`, which does. That is the same defect PR #748
already fixes, so it should not be re-opened here.
