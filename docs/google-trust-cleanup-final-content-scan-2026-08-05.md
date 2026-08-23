# Google Trust Cleanup — Final Targeted Content/String Scan

**Owner:** Zafran · **Date:** 2026-08-05
**Scope:** the one targeted exact-string/content scan requested in the Aug 4 release-gate note.

## What was scanned

| Artifact | Identifier | Verified state |
|---|---|---|
| Final preview theme | `fitnesssuperstore-shopify/Mixed-Google-Signals`, ID `187347599676` | UNPUBLISHED |
| PR #664 head | `9275654fb6f04fc4410f004b9a493d18eece5841` (branch `claude/mixed-signals-google-email-88p4y8`) | open, 13 changed files, behind main: 0 |
| Live theme | `fitnesssuperstore-shopify/main`, ID `186120208700` | MAIN, intentionally unchanged |
| Frozen dev theme | `fitnesssuperstore-shopify/yusra-random-fixes`, ID `186772685116` | UNPUBLISHED (reference only) |

Method: Shopify Admin API theme-file reads (checksum + full body) compared against the
repo tree, plus an exact-string sweep of the whole theme — not just the 13 changed files.

## Scan surface — the preview theme is fully accounted for

The preview theme tracks GitHub branch `Mixed-Google-Signals` (head `70607da`). That mapping
was proven, not assumed: for every file spot-checked, the theme's `checksumMd5`/size equals the
branch's raw bytes, **including the three files where the branch and PR head differ** —
`config/settings_data.json` (`c5bfb84b…`/18073 = branch, not PR head's `3091d4a7…`/18074),
`templates/collection.json` (`61b784fc…`/3509), `templates/search.json` (`56f24571…`/1501).

With the mapping pinned, the branch↔PR-head comparison covers the whole theme, not a sample:

| Files differing, preview branch vs PR head | Nature of difference |
|---|---|
| `templates/collection.json` | `"disabled": true` moved between the Boost AI search-filter app block and `main-collection-product-grid` |
| `templates/search.json` | `"disabled": true` key reordered on the Boost AI app block |
| `config/settings_data.json` | one boolean flipped `true` → `false` |

**Zero copy differences.** So the preview carries no customer-facing text that isn't in PR #664,
and the string sweep below was additionally re-run directly against the preview branch itself
with identical results.

## Preview ↔ PR parity — PASS

All 13 reviewed cleanup files are byte-identical between preview theme `187347599676`
and PR head `9275654` (MD5, independently recomputed):

| File | MD5 | Bytes |
|---|---|---|
| `snippets/schema-organization.liquid` | `169098098108c4c5fc08546b16c6b4bb` | 2648 |
| `templates/index.a_index_1762237969294.json` | `2a1e66ac0202417e18a504dba1cd0a8e` | 27789 |
| `templates/index.json` | `353325ab81592569f36cf618c8f276cb` | 29853 |
| `templates/page.about-our-ceo.json` | `776947a8acf9b4d9b6c45b50b764b5d2` | 20469 |
| `templates/page.about-us-new.json` | `e91987ddd9454c0c50b70bdb4816036e` | 55073 |
| `templates/page.about-us.json` | `3ca7d2a8c04761b592afc61d51b292ca` | 28055 |
| `templates/page.careers.json` | `578febbd2f77eafb825bb6656290cd61` | 5738 |
| `templates/page.government-sales.json` | `97ac704591d8e2a5db62f1d31e22f8c0` | 32203 |
| `templates/page.homepage.json` | `7ea6d2f789be8af778cc329c59c5a3be` | 32039 |
| `templates/page.landing.json` | `834b5faa0c2d6243b67e087ca8471807` | 26825 |
| `templates/page.our-story.json` | `b72978197d2eb5bd1d31e263de98fda1` | 10440 |
| `templates/page.reviews.json` | `ccdba8760c0a0e9215c0f64730f27622` | 25738 |
| `templates/page.trusthub.json` | `4a0bbc02f045f44c9d01e11d4ed28cbb` | 38685 |

## Exact-string scan (Tim's Jul 6 + Jul 12 lists) — whole theme at PR head

| Term | Occurrences | Result |
|---|---|---|
| `14 years` | 0 | PASS |
| `16 years` | 0 | PASS |
| `$15 million` / `$15M` | 0 / 0 | PASS |
| `$6 million` / `$6M` | 0 / 0 | PASS |
| `35 employees` | 0 | PASS |
| `100 employees` | 0 | PASS |
| `100-person team` | 0 | PASS |
| `over 100 expert staff` | 0 | PASS |
| `50+ warehouse manpower` | 0 | PASS |
| `50+ warehouse team members` | 0 | PASS |
| `50 remote team members` | 0 | PASS |
| `52 experts` | 0 | PASS |
| `S-Corp` | 0 | PASS |
| `Fitness Superstore Inc` | 0 | PASS |
| `ISO 9001` | 0 | PASS |
| `continuously growing` | 0 | PASS |
| `one of the largest` | 0 | PASS |
| `Established Industry Leader` | 0 | PASS |
| `top-rated support` | 0 | PASS |
| `fast response times` | 0 | PASS |
| `one of the few` | 0 | PASS |
| `Offering Gym Equipment Since 2003` | 0 | PASS (renamed) |
| `ftness` (typo) | 0 | PASS |
| `incorporat*` | 2 | PASS — benign product/warranty prose (`page.new-equip.json` "incorporating high-quality electronics", `page.warranty.json` legal-addendum sentence). No legal-entity brand history. |
| **`50+ person team`** | **1** | **FAIL — see F-1** |

### Robustness sweep (variant forms, so a reworded claim can't slip the literal list)

| Pattern | Hits | Result |
|---|---|---|
| `million`, `employees`, `manpower`, `annual sales`, `in revenue` | 0 each | PASS |
| `S-?Corp`, `TJF Ventures`, `Fitness Superstore,? Inc` | 0 each | PASS |
| `[0-9]+ years of`, `[0-9]{2} ?years` | 24 total | PASS — all third-party brand history ("For over 30 years, Body-Solid…"), warranty terms ("10 Years Parts"), product age ranges ("3 to 20 years"), or a financing partner's experience. No Fitness Superstore company-history claim. |
| `experts` | 17 | PASS — generic marketing with no count ("Our team of experts is ready to help", "Backed by the Experts") plus the "Total Body Experts" product name. No team-size claim. |
| `\bISO\b` | 9 | PASS — all `Iso-Lateral` product handles/names. No certification language. |
| `[0-9]+\+? ?person team` | 1 | FAIL — the same F-1 occurrence |

## Approved-wording presence — PASS

- `snippets/schema-organization.liquid`: `"foundingDate": "2010"` on the existing
  `OnlineStore` entity at `{{ shop.url }}/#organization`. The diff against `main` is a single
  added line — nothing else in the JSON-LD changed. Structural validation (Liquid logic
  resolved, the pre-existing Liquid-built `sameAs` list neutralized): parses clean,
  `@graph` = `[WebSite, OnlineStore]`, exactly one organization-type node (no duplicate),
  `@id` = `…/#organization`, `foundingDate` = `"2010"`, `WebSite.publisher` resolves to it,
  `address` + `contactPoint` intact. Live MAIN's copy of this file is byte-identical to
  `origin/main` (`f85f88e0…`, 2617 bytes) and contains 0 occurrences of `foundingDate` —
  confirmed directly, correct pre-publish state. Rendered-output validation on the live page
  remains the post-publish step already assigned.
- `page.trusthub.json` — "Our Story in Brief" opens with: *"Tim French began selling
  fitness equipment in 2003 from his garage. Fitness Superstore was officially
  founded/launched in 2010."* Uses `100 team members`.
- `page.our-story.json` — core trust conflict resolved: 2007 entry is FitnessSales.com
  history only; the 2010 entry carries the Fitness Superstore founding. Timeline heading is
  "Tim French's Fitness Equipment Journey Since 2003". 2013 entry is neutral brand history
  (Concord warehouse move) with no revenue/headcount/incorporation. 2014 growth phrase gone.
  No ISO/expansion wording in the Present section.
- `page.about-us.json` — approved 2003/2010 origin wording present; `100 team members`.
- `page.about-our-ceo.json` — "Today, Fitness Superstore has 100 team members."
  4,200 sq ft Concord early-history detail retained per Tim's Jul 3 item 7.
- `page.government-sales.json` — block `block_xJEE3B`: "Founded in 2010, Fitness Superstore
  supplies new and remanufactured commercial gym equipment for government agencies…"
  No stale-year or `52 experts` wording.
- `page.reviews.json` — "Since 2010, the company has earned a strong reputation…"
- `index.json` (live homepage) — team count removed from the full-service/shipping section
  ("an in-house warehouse team", no number), per the Jul 14 revert.

## Four requested corrections — all PASS

1. 2014 "Business continued to thrive" removed — 0 occurrences tree-wide.
2. Present-section website/showroom project-status sentence replaced with evergreen copy.
3. `ftness` → `fitness` — 0 occurrences tree-wide.
4. `page.trusthub.json` "Our Story in Brief" opens with the approved 2003/2010 distinction.

---

## FAIL — 2 blocking items

### F-1 · Warehouse page cleanup is not in this release
**File:** `templates/page.new-warehouse-page-v-1.json` — the template assigned to the live
`/pages/warehouse-page`. **It is not one of PR #664's 13 files.** Preview `187347599676`,
repo `main`, and PR head all carry the identical uncorrected version (`4c67bbc4609c…`).

Still present in the final preview:

| Defect | Current text | Approved requirement |
|---|---|---|
| Disapproved team wording | "Our **50+ person team** handles the entire process in-house" (FAQ `faq_rPEQej`) | Tim Jul 12 item 4 — "50 team members based in Benicia", or drop the count |
| Facility-size framing | FAQ `faq_Kcrn9H`: "Our main showroom is at 457 Industrial Way… **This is our primary location with 63,500 sq ft of facilities**" | Tim Jul 26 — copy must make clear 63,500 sq ft is the **combined** footprint, not one location |
| Typo | Heading `heading_GEh8Ta`: "Remanufactured **Equpiment**" | Jul 14 correction |
| Run-on | Gallery: "Matrix, and StairMaster, **unitsBenches**, racks…" | Jul 14 correction |

The corrected copy exists and was verified — but only in the frozen dev theme
`186772685116`, which reads:
- "Our Benicia operations total 63,500 sq ft across two facilities. The public showroom is at
  457 Industrial Way; remanufacturing, offices, and outbound shipping operate from 537 Stone
  Rd Suite F."
- "Our **50 team members based in Benicia** handle the entire process in-house"
- "Remanufactured **Equipment**"
- "Matrix, and StairMaster **units. Benches**, racks…"

Root cause: this matches Tim's Jul 26 note that the PR "still needs the approved Our Story,
Government Sales, and **Warehouse** cleanup changes." Our Story and Government Sales were
ported; Warehouse was not. Tracker rows for the Warehouse page are marked Ready for QA with
a Jul-14 dev-theme reference, so the tracker overstates the release contents.

**Action:** Izza to port `templates/page.new-warehouse-page-v-1.json` from theme
`186772685116` into PR #664 (14th file), refresh the preview, then re-scan.

Re-verified directly against the preview: `/pages/warehouse-page` is **published** with
`templateSuffix: new-warehouse-page-v-1`, so this template is customer-facing today. The
preview theme's copy is `4c67bbc4609c…` / 29225 bytes — the defective version. Live MAIN has a
separate copy (`18fba00d…` / 21497) carrying the same four defects, so publishing as staged
neither fixes nor worsens them.

### F-2 · False "Benicia since 2010" history survives in `page.about-us-new.json`
This file **is** in PR #664 (`e91987dd…` / 55073 in both the preview theme and PR head), but the
claim Tim asked to fix on Jul 12 is still there — exactly 2 instances:

> "Since 2010, Fitness Superstore has specialized in remanufacturing premium gym equipment
> from our Benicia, California facility."

The approved replacement is absent — `2003` appears 0 times in this template. Approved wording
per the tracker row:

> "Tim French began selling fitness equipment in 2003 from his garage. Fitness Superstore was
> officially founded/launched in 2010 in Concord, CA, and moved its operations to Benicia, CA
> in 2016. Today, we provide new and remanufactured gym equipment for home and commercial
> customers nationwide."

Counts re-verified on the preview: the false sentence = 2, `2003` = 0,
`moved its operations to Benicia` = 0, `led the industry` = 0. So the superlative half of that
tracker row landed and the company-history half did not. This restates the exact error this whole
workstream exists to correct, so it should not ship — even though
`/pages/about-fitnesssuperstore` is confirmed **unpublished** (verified via Shopify: `isPublished:
false`, `templateSuffix: about-us-new`) and 301s to `/pages/about-us`, which is why this is lower
customer-facing risk than F-1.

**Action:** Izza to replace both instances in `templates/page.about-us-new.json` with the
approved wording, then re-scan.

---

## Flagged for Saliha (proof-sensitive; per Tim's Aug 4 note, flag-only)

These match existing "Needs Source" tracker rows and are still in the release surface:

| Location | Claim |
|---|---|
| `page.reviews.json` (live `/pages/reviews`, in PR) | "4.92 Average Rating", "98%", "consistent 5-star reviews", "thousands of positive reviews" |
| `page.new-warehouse-page-v-1.json` (live `/pages/warehouse-page`) | "80% of our remanufactured equipment", "any component showing more than 25% wear", "Thousands of units in stock and ready to ship" |
| `index.json` (live homepage, in PR) | "assembled in the USA" — tracker already logs this as non-blocking |

Not customer-facing, note only: `page.homepage.json` (unpublished, 301 → `/`) and
`templates/index.a_index_1762237969294.json` (alternate index template, not route-assigned)
still contain "BEST IN THE INDUSTRY", "Unbeatable", "Nobody offers this in the industry".
Those sit on Saliha's open warranty/superlative row and are not reachable by customers or
Google in this release.

## Advisory (non-blocking, no re-approval needed)

1. **Homepage history line.** `index.json` and `page.homepage.json` read "Founded in 2010 in
   Concord, CA and now operating out of Benicia, CA…". Tim's approved standardized line is
   "Fitness Superstore was officially founded/launched in 2010 in Concord, CA, and later moved
   its operations to Benicia, CA in 2016." Substance is correct; the 2016 date and the exact
   phrasing are missing, and the tracker claims the exact line is in place.
2. **`page.trusthub.json` facility phrasing.** "…outbound shipping run through 537 Stone Rd
   Suite F (63,500 sq ft total)" can read as if 537 Stone Rd alone is 63,500 sq ft (it is
   23,500). The nearby FAQ states it correctly ("Both facilities total 63,500 sq ft").
3. **`page.careers.json`.** Uses "100 team members, with 50 based at our Benicia, California
   facility" — a combined variant rather than the two exact approved phrasings. Numbers match
   Tim's approved figures.

## Fixes applied — 2026-08-05 (addendum)

F-1 and F-2 have been remediated on branch `claude/mixed-signals-google-task-5twh2g`, which is
merged up to PR #664 head `9275654` so the two files start from the exact PR versions. Seven
text-value edits across two files; no structural, section-order, or settings changes.

> **PR #699 is a delivery vehicle, not a second release path.**
> <https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/699> carries these two fixes and
> this QA report. It is **not** an alternative release PR — Tim's standing instruction is a single
> release PR (#664) with no duplicate ownership lanes. The intended path is: Izza folds the two
> template files into **PR #664**, refreshes preview `187347599676`, and **#699 is closed**. Do not
> merge #699 as a parallel release.

**F-1 · `templates/page.new-warehouse-page-v-1.json`** — the approved copy was ported
*surgically* from dev theme `186772685116`, **not** by replacing the file. That matters: the dev
theme's copy of this template also differs in unrelated ways (13 gallery items vs 15, a different
`icon_color`, a missing `anchor_id`), so a wholesale swap would have rolled back live-theme work —
the exact risk flagged on Jul 18. Five edits:

| Section / block | Change |
|---|---|
| `rich_text_e3gbzE` → `text_ex6GLK` | intro now opens "Our Benicia operations total 63,500 sq ft across two facilities. The public showroom is at 457 Industrial Way; remanufacturing, offices, and outbound shipping operate from 537 Stone Rd Suite F." |
| `faq_warehouse_GjVkrd` → `faq_Kcrn9H` | "Where should I visit?" no longer ties 63,500 sq ft to one location; same combined-footprint framing |
| `faq_warehouse_GjVkrd` → `faq_rPEQej` | "Our 50+ person team handles" → "Our 50 team members based in Benicia handle" |
| `image_banner_warehouse_mXLQbA` → `heading_GEh8Ta` | "Remanufactured Equpiment" → "Remanufactured Equipment" |
| `gallery_slider_warehouse_PjdJkU` | "StairMaster, unitsBenches, racks" → "StairMaster units. Benches, racks" |

The `80%` remanufacturing and `25% wear` claims in `faq_rPEQej` were deliberately left untouched —
they sit on Saliha's open Needs-Source rows and are not approved for rewording.

**F-2 · `templates/page.about-us-new.json`** — both instances of the false
"Since 2010 … from our Benicia, California facility" sentence replaced with the approved history
wording; the following craftsmanship sentence retained unchanged.

Two wording decisions worth Tim's eye, neither inventing copy:
1. Used the **Approved Rules tab** canonical founding-location line — "…in 2010 in Concord, CA,
   and **later** moved its operations to Benicia, CA in 2016" — rather than the row note's variant
   which omits "later". The Approved Rules tab governs and matches Tim's Jul 3 / Jul 12 emails.
2. The approved paragraph ends "…for home and commercial customers nationwide," and the retained
   next sentence also ends "…nationwide." Approved wording was kept verbatim rather than smoothing
   it; the repetition is a copy-polish call for Sagi or Saliha, not a claims issue.

**Post-fix verification:** all 30 disapproved terms (including `50+ person team`, `Equpiment`,
`unitsBenches`, `primary location with 63,500`) now return **zero** occurrences across the theme.
Approved wording confirmed present: combined-footprint framing ×2, "50 team members based in
Benicia" ×1, "Remanufactured Equipment" ×1, "StairMaster units. Benches" ×1, 2003 garage origin ×2,
2010-Concord/2016-Benicia line ×2. Both JSON templates re-parse cleanly.

## Fold-in + preview refresh + delta re-scan — 2026-08-05, all PASS

The fixes were folded into the single release PR and the preview refreshed through the branch the
theme tracks (**not** by direct theme-file API writes), so Shopify and GitHub stay in sync.

| Step | Result |
|---|---|
| PR #664 head | `9275654` → **`32767ee`**; changed files 13 → **14**, all theme files (`page.new-warehouse-page-v-1.json` added). No docs or non-theme files added, keeping the PR scope as reviewed. |
| Preview refresh | Pushed to `Mixed-Google-Signals` (`70607da` → **`2abc23e`**); only the two templates changed, that branch's own theme-editor files (`settings_data.json`, `collection.json`, `search.json`) left untouched. |
| Shopify sync | Theme `187347599676` picked it up at `2026-08-05T21:33:4xZ`: `page.about-us-new.json` = `e5afc023…`, `page.new-warehouse-page-v-1.json` = `e00dd129…` — both match the corrected files exactly. |
| Preview ↔ PR parity | **14/14** files byte-identical. Whole-tree diff still only the 3 app/section toggle files — zero copy differences. |
| Disapproved-string sweep | **31/31 terms at zero occurrences**, including `50+ person team`, `Equpiment`, `unitsBenches`, `primary location with 63,500`, and the false Benicia-since-2010 sentence. |
| Approved wording | combined two-facility framing ×2, "50 team members based in Benicia" ×1, "Remanufactured Equipment" ×3, "StairMaster units. Benches" ×1, 2003 garage origin ×2, 2010-Concord/2016-Benicia ×2, `foundingDate: "2010"` ×1. |
| JSON validity | both changed templates parse cleanly. |
| CI | `cwv-regression` **success** on the new head. |
| Live MAIN | still unchanged (`f85f88e0…` schema, `18fba00d…` warehouse) — correct pre-publish state. |
| PR #699 | closed; it was only the delivery vehicle. |

### Tracker task closed: the six "TBD – Zafran to locate exact page(s)" rows

Those rows could not be actioned without knowing where the claims live. Located, so Saliha and the
source owners have concrete targets. **All are pre-existing and unchanged by this release — none is
a blocker for it**, but the rating claims are materially wider than the tracker implied:

| Needs-Source row | Files |
|---|---|
| Review / rating claims | `templates/page.reviews.json` ("98% 5-star reviews", "Verified buyers only", "4.92 Average Rating", "Thousands of verified buyers"); **live homepage** `templates/index.json` ("4.9/5 by Thousands of happy customers", "Rated 4.9/5 by 2,000+ verified customers."); `templates/page.new-equip.json` ("4.9/5 across Google, Trustpilot, Bing, Yelp, and Shopper Approved"); plus shared sections `header-group.json`, `homepage-homepage-reviews.liquid`, `homepage-section-hero.liquid`, `section-hero.liquid`, `contact-section-hero.liquid`, `rich-text-with-image.liquid`, and `page.homepage.json` / `index.a_index_…json` |
| Stock / lead-time claims | `page.new-warehouse-page-v-1.json`, `page.shipping-information.json`, `page.landing.json`, `page.reviews.json`, `page.financing.json`, `page.french-fitness-warranty.json` |
| 80% remanufacturing stat | `page.new-warehouse-page-v-1.json` |
| 25% wear SOP threshold | `page.new-warehouse-page-v-1.json`, `page.remanufactured.json` |
| Superlative / warranty claims | `page.homepage.json`, `index.a_index_…json`, `page.landing.json`, `page.gym-designer.json`, `sections/why-use-platform.liquid` |
| Assembled in the USA | `index.json`, `page.about-us.json`, `page.about-us-new.json`, `page.government-sales.json`, `page.homepage.json`, `page.landing.json`, `index.a_index_…json`, `sections/table-section.liquid` |

Note the `4.9/5` figures sit in **shared header/hero sections**, so they render across many pages,
not just the ones listed — worth knowing before anyone commits to sourcing or rewording them.

## Gate recommendation

**Content gate is CLEAR. PR #664 is ready to merge and publish once the two remaining human checks
land.** Nothing editorial is outstanding on the content side.

Remaining before publish:

1. **Sagi** — visual pass on the two changed pages in the refreshed preview (Warehouse, About
   Fitness Superstore), plus Tim's ruling on Sagi's own two Aug-5 design points (About Us review
   widgets, Government Sales banner height). Those are aesthetic, not factual, so they do not
   trigger Saliha's flag-only review.
2. **Tim** — optional call on the homepage exact-wording advisory (item 1 under Advisory below).
   Substance is correct either way; not a blocker.

Then: merge and publish, confirm live Shopify/GitHub parity, verify rendered `foundingDate: "2010"`
and the approved copy on the live canonical pages, close the tracker with proof, and request
recrawling in Search Console.

Saliha's Needs-Source rows stay open as a separate workstream. They are all pre-existing and
unchanged by this release, so they do not gate it — but the located file list above should be
attached to those rows so they can finally be actioned.

## Tracker updates (paste-ready)

| Tracker row | Status | Owner | Date / Next step |
|---|---|---|---|
| Organization schema | Ready for QA — content scan PASS | Zafran → Izza | 2026-08-05 — `foundingDate: "2010"` verified on the existing OnlineStore `@id` in preview `187347599676` and PR head `9275654` (MD5 `169098098108c4c5fc08546b16c6b4bb`). Live MAIN still lacks it (correct pre-publish). Verify rendered live JSON-LD after publish. |
| Shopify/GitHub sync | Ready for QA — parity PASS | Zafran → Izza | 2026-08-05 — all 13 PR files byte-identical to preview `187347599676` (MD5 recomputed independently). |
| Our Story — Timeline 2007 (founder date conflict) | Ready for QA — PASS | Zafran + Sagi | 2026-08-05 — content scan: 2007 = FitnessSales.com only; 2010 carries the Fitness Superstore founding. |
| Our Story — Present section (ISO / growth) | Ready for QA — PASS | Zafran + Sagi | 2026-08-05 — content scan: 0 occurrences of `ISO 9001` / growth-expansion wording tree-wide; `ftness` corrected. |
| Our Story — Timeline heading + 2014 entry | Ready for QA — PASS | Zafran + Sagi | 2026-08-05 — heading is "Tim French's Fitness Equipment Journey Since 2003"; "Business continued to thrive" 0 occurrences. |
| Our Story — Timeline 2013 ($6M / 35 employees / Inc) | Ready for QA — PASS | Zafran | 2026-08-05 — `$6M`, `35 employees`, `Fitness Superstore Inc`, `S-Corp` all 0 occurrences tree-wide. |
| Our Story / About Us / CEO — $15M revenue | Ready for QA — PASS | Zafran | 2026-08-05 — `$15 million` / `$15M` 0 occurrences tree-wide. |
| CEO page — team-size wording | Ready for QA — PASS | Zafran | 2026-08-05 — "Today, Fitness Superstore has 100 team members."; `100 employees` 0 occurrences. |
| About Us — hero/stat "100-person team" | Ready for QA — PASS | Zafran | 2026-08-05 — `100-person team` 0 occurrences; `page.trusthub.json` uses "100 team members". |
| About Us — breadcrumb + "Our Story in Brief" | Ready for QA — PASS | Zafran + Sagi | 2026-08-05 — section opens with the approved 2003 founder / 2010 company-founding distinction. |
| About Us — "14 years" stale wording | Ready for QA — PASS | Zafran | 2026-08-05 — `14 years` / `16 years` 0 occurrences tree-wide. |
| Government Sales — "14 years" + "52 experts" | Ready for QA — PASS | Zafran | 2026-08-05 — block `block_xJEE3B` reads "Founded in 2010…"; both terms 0 occurrences. |
| Reviews — "In the last 14 years" | Ready for QA — PASS | Zafran | 2026-08-05 — now "Since 2010, the company has earned a strong reputation…". |
| Homepage — "50+ warehouse manpower" | Ready for QA — PASS | Zafran | 2026-08-05 — term 0 occurrences; live homepage section now reads "an in-house warehouse team" with no count. |
| Homepage — intro / company history | Ready for QA — PASS with advisory | Zafran | 2026-08-05 — reads "Founded in 2010 in Concord, CA and now operating out of Benicia, CA…" instead of the exact approved line incl. the 2016 Benicia move. Substance correct; flagging the wording variance. |
| Warehouse page — team-size wording ("Our 50+ person team") | Fixed — awaiting PR landing + preview refresh | Zafran (fixed) → Izza (land) | 2026-08-05 — `templates/page.new-warehouse-page-v-1.json` was NOT in PR #664; now corrected on `claude/mixed-signals-google-task-5twh2g`. "Our 50+ person team handles" → "Our 50 team members based in Benicia handle"; also "Equpiment" → "Equipment" and "StairMaster units. Benches". Post-fix scan: 0 occurrences. Izza to land as the PR's 14th file and refresh preview `187347599676`. |
| Warehouse page — title/intro facility claim | Fixed — awaiting PR landing + preview refresh | Zafran (fixed) → Izza (land) | 2026-08-05 — intro and the "Where should I visit?" FAQ now both read "Our Benicia operations total 63,500 sq ft across two facilities…", meeting Tim's Jul 26 combined-footprint rule. Post-fix scan: "primary location with 63,500" = 0 occurrences. |
| About FitnessSuperstore — company history | Fixed — awaiting PR landing + preview refresh | Zafran (fixed) → Izza (land) | 2026-08-05 — both instances of "Since 2010… from our Benicia, California facility" replaced with the approved 2003 founder / 2010-Concord / 2016-Benicia wording. Post-fix scan: false sentence = 0; approved wording = 2 instances. |
| Search Console | Blocked — awaiting publish | Zafran | 2026-08-05 — recrawl request stays blocked until F-1/F-2 land, Izza publishes, and live pages + rendered `foundingDate: "2010"` are verified. |

---

# Round 2 — conservative-copy pass on proof-sensitive claims (2026-08-06)

Tim's Aug-6 review held the merge for a narrow pass on exact, proof-sensitive static claims that
sat outside the disapproved-string list, assigned to Izza and Zafran. Four required changes.

Izza had already pushed most of the pass (`e1fb8ac`) and refreshed the preview before this scan.
My role was verification; two gaps were found and closed.

## Gaps found and closed (head `e68b051`)

Both were static rating claims in changed files on **published** pages, so both were in scope for
Tim's item 4 and both had been missed:

| File | Page | Before | After |
|---|---|---|---|
| `templates/page.reviews.json` | `/pages/reviews` (published) | card title "Verified buyers only" | "Customer reviews and feedback" — Tim's approved option |
| `templates/page.landing.json` | `/pages/french-fitness-overview` (published) | heading "5-Star Customer Service" | "Customer Service" — same drop-the-rating pattern used elsewhere in the pass |

The `5-Star_Customer_Service.png` asset filename is unchanged: not visible copy, and renaming it
would break the reference.

## Verification against Tim's four items — all PASS

Scope held to the 14 changed files, per "static review/rating quantities in changed files".

| Item | Check | Result |
|---|---|---|
| 1 · stock quantities, same-day/week promises, exact delivery windows | `units in stock`, `ready to ship`, `same-day`, `same-week`, `Same-week delivery`, `2 to 7 business days`, `2 to 14 business days`, `2 to 5 weeks` | **0 each**; the approved replacement sentence is present verbatim |
| 2 · the 80% figure | `80%` | **0**; replaced with non-numeric "Much of our remanufactured equipment is rebuilt right here at our Benicia facility" |
| 3 · the 25% wear threshold | `25% wear` | **0**; Tim's exact sentence "Worn components are replaced as needed during inspection and rebuilding." present |
| 4 · static review/rating counts | `4.9/5`, `4.92`, `2,000+`, `98%`, `Thousands of verified`, `Trusted by Thousands`, `thousands of satisfied/positive/verified`, `consistent 5-star`, `5-star reviews`, `5-Star Customer Service`, `Verified buyers only`, `Average Rating` | **0 each**; approved replacements present — "Verified customer reviews" ×6, "Customer reviews and feedback" ×1 |

## No regression from round 1

- Original 31-term disapproved sweep: **still 31/31 at zero** across the theme.
- Earlier approved wording intact: `foundingDate: "2010"`, warehouse combined-footprint framing ×2,
  "50 team members based in Benicia", "Remanufactured Equipment", the about-us-new 2003/2010/2016
  history ×2, trusthub 2003 garage origin + "100 team members".
- All 13 changed JSON templates parse cleanly.
- Preview theme `187347599676` synced `2026-08-06T14:36:3xZ` and byte-identical to PR head on every
  spot-checked file; whole-tree preview-branch vs PR-head diff is still only the 3 app/section
  toggle files — zero copy differences.
- `cwv-regression` **success** on `e68b051`.
- Live MAIN still unchanged.

## Flagged for Tim, deliberately not changed

Outside his four numbered items, so left alone to respect the "no broad rewrite" instruction. Each
is a one-line change if he wants it:

1. **24-hour response-time claims** on two published pages — `page.landing.json`
   ("Our goal is to respond to you within 24 hours", "12-hour service per weekday") and
   `page.reviews.json` ("They respond to customer concerns within 24 hours during business hours").
   The tracker's stock/lead-time Needs-Source row does list a "24-hr response promise" with approved
   softened wording ("We aim to respond promptly to all inquiries"), so this is arguably adjacent to
   item 1 — but a support response time is not availability or delivery timing.
2. **Warehouse shipping FAQ** retains "Orders within 120 to 200 miles of Benicia are delivered by our
   own trucks" and "in-store pickup at no additional charge" — a service-area distance rather than a
   delivery window.
3. **Wording variance, no action needed:** in the warehouse logistics list the pass used
   "Delivery timing varies by product, destination, and service level — contact us for a current
   estimate." rather than Tim's exact sentence, which does appear verbatim in the "How fast can I
   receive my order?" FAQ. Substantively equivalent.

## Status

Content gate clear for the second time. Remaining before merge: Sagi's focused desktop/mobile check
on Warehouse and About Fitness Superstore in the refreshed preview, and dismissal of the standing
CHANGES_REQUESTED review on PR #664 — GitHub still reports the PR as blocked on it.

---

# Post-publication live verification (2026-08-10)

PR #664 was approved at head `2a45dff` and merged/published by Izza on 2026-08-06. Per Tim's
standing instruction, this is Zafran's post-publication verification of the canonical live pages,
the rendered `foundingDate`, and the release's final proof items.

## Merge and parity — PASS

| Check | Result |
|---|---|
| PR #664 merged into `main` | **Yes** — the branch is an ancestor of `main`; approved head `2a45dff` ("Neutralize warehouse rebuild-volume wording per Codex review") is present |
| Live Shopify MAIN theme | `186120208700`, release files last written `2026-08-06T18:42Z` |
| Shopify ↔ GitHub parity | **14/14 release files byte-identical** between the live MAIN theme and GitHub `main` (`8e6b074`), MD5-compared |

## Rendered organization schema on the live homepage — PASS

Parsed from the live HTML at `https://www.fitnesssuperstore.com/`, not from theme source:

- `@type`: `OnlineStore` · `@id`: `https://www.fitnesssuperstore.com/#organization`
- **`foundingDate`: `"2010"`** — renders correctly
- Exactly **one** organization-type node in the graph (no duplicate), `address` and `contactPoint` intact
- 9 JSON-LD blocks on the page; the organization entity parses cleanly

## Live visible-copy verification — PASS

Six canonical pages fetched (all HTTP 200) and swept as rendered visible text, with scripts and
styles stripped: `/`, `/pages/about-us`, `/pages/warehouse-page`, `/pages/government-sales`,
`/pages/reviews`, `/pages/french-fitness-overview`.

**Zero occurrences** of all 31 disapproved terms and all of Tim's Aug-6 proof-sensitive items in
visible text on every page.

Approved wording confirmed rendering live:

| Page | Verified live |
|---|---|
| `/pages/about-us` | "Tim French began selling fitness equipment in 2003 from his garage" · "officially founded/launched in 2010" · "100 team members" · "Both facilities total 63,500 sq ft" |
| `/` | "Founded in 2010 in Concord, CA" · neutral "Rated by our…" review wording |
| `/pages/warehouse-page` | "Our Benicia operations total 63,500 sq ft across two facilities" · "50 team members based in Benicia" · "Remanufactured Equipment" · "StairMaster units. Benches" · "Current availability and timing vary by product…" · "Worn components are replaced as needed during inspection and rebuilding" |
| `/pages/government-sales` | "Founded in 2010" |
| `/pages/reviews` | "Since 2010, the company has earned a strong reputation" · "Customer reviews and feedback" |
| `/pages/french-fitness-overview` | "Customer Service" (rating dropped) |

Also swept the whole live theme source: the 31 disapproved terms are at zero. The residual
proof-sensitive matches all fall **outside the 14 release files** — `page.shipping-information.json`,
`page.remanufactured.json`, `page.california-delivery.json`, `page.new-equip.json` and several
shared `sections/*.liquid` — so the release met its declared scope. The 72 `4.92` matches are SVG
path coordinates, not rating claims.

## Final proof items from the Jul-26 homepage URL control — all PASS

| Item | Result |
|---|---|
| Root 200 and self-canonical | `200`; `<link rel="canonical" href="https://www.fitnesssuperstore.com">` |
| One-hop permanent redirect `/pages/homepage` → `/` | `301` → `https://www.fitnesssuperstore.com/` |
| No active sitemap reference | `/pages/homepage` **0** occurrences in `sitemap_pages_1.xml`; retired About variants also 0; `/pages/about-us` and `/pages/warehouse-page` present |
| Historical UTM redirect test | `/pages/homepage?utm_source=test` → `301` → `/?utm_source=test` — query string preserved |
| Legacy URL inventory | `/pages/our-story`, `/pages/about-our-ceo`, `/pages/about-fitnesssuperstore`, `/aboutus.asp` all one-hop `301` → `/pages/about-us` |
| Shopify/GitHub parity | 14/14 verified above |
| Search Console inspection + recrawl | **outstanding — no API access from this environment; must be done in the Search Console UI** |

## One live finding — pre-existing, not a regression

The header announcement bar carries a static **"4.9/5 rating"** claim that renders on **every page
sitewide**. Source: `sections/header-group.json` line 56, `"text": "4.9/5 rating"`.

- It is **not** one of the 14 release files, so the release complied with the "static review/rating
  quantities in changed files" scope, and this is **not** a regression — it was live before the
  release and is unchanged by it.
- It is, however, the single widest-exposure static rating claim left on the site, and it sits on the
  tracker's existing "Review / rating claims" Needs-Source row.
- Fix is one line in `sections/header-group.json` whenever approved. Suggested neutral replacement
  consistent with the wording already used in this release: `"Rated by our customers"`.

Related, same category and also outside the release scope: `4.9/5` defaults in
`sections/contact-section-hero.liquid`, `homepage-section-hero.liquid`, `section-hero.liquid`,
`rich-text-with-image.liquid`, `homepage-homepage-reviews.liquid`, plus `page.new-equip.json`
("4.9/5 across Google, Trustpilot, Bing, Yelp, and Shopper Approved") and
`sections/multicolumn-reviews.liquid` ("Thousands of verified"). The section defaults do not render
on the live canonical pages because the templates that use them override the setting — verified: the
reviews section is referenced only by `index.json` and `page.homepage.json`, both of which now set
the neutral wording.

## Status

**Release is live and verified.** Content, schema, parity, redirects, canonical and sitemap proof all
pass. Two closeout actions remain and both require UI access this environment does not have:
updating the tracker rows to Done, and submitting the Search Console recrawl requests.

---

# Header follow-up — closed a different way (2026-08-14)

The sitewide static rating claim flagged during post-publication verification is resolved and
closed. It did **not** land as a wording change.

## What happened

| Step | Outcome |
|---|---|
| PR #712 | Merged by Izza, `"4.9/5 rating"` → `"Highly Rated by Customers"` |
| Tim's Aug 13 note | Rejected that wording as a stronger, unscoped qualitative claim; directed the exact approved phrase `"Rated by our customers"` |
| PR #714 | Opened with that exact phrase, CI green — **never merged** |
| Actual resolution | `item_cMAqCg` was **removed entirely** from `sections/header-group.json` via Shopify sync commit `894268b`, keeping the homepage hero badge unchanged |
| Tim's Aug 14 note | Independently verified and marked the item DONE / VERIFIED / CLOSED, with "do not redo the completed change" |
| PR #714 | **Closed** — merging it would have re-added the deliberately removed item |

## Verified final state

| Check | Result |
|---|---|
| `item_cMAqCg` on GitHub `main` | absent |
| `item_cMAqCg` in live Shopify MAIN (`updatedAt 2026-08-13T22:31:19Z`) | absent |
| `block_order` | 5 entries, identical both sides |
| Announcement-bar item texts | identical both sides |
| Live rendered `4.9/5` in visible text | **0** on `/`, `/pages/about-us`, `/pages/reviews` |
| Homepage hero badge | unchanged |

Parity confirmed by **parsed-JSON comparison**, not checksums: Shopify stores
`sections/*-group.json` in a normalized compact form, so its `checksumMd5` never matches the raw
GitHub blob for this file type. `templates/*.json` do match byte-for-byte.

Resulting bar:

> New & Remanufactured Gym Equipment | Best Warranty | Nationwide Delivery & Installation | Up to 60% off MSRP

## Note on source control

This change landed through a Shopify-generated sync commit rather than a branch/PR. Tim recorded
that as a one-off and asked that future repo-controlled edits use the normal branch/PR path unless
a live-admin change is explicitly approved.

## Remaining closeout item

**Search Console evidence only** — five URL Inspection confirmations plus the `sitemap.xml`
resubmission proof, attached to the canonical thread and added to the existing Google Steps row.
Not actionable from this environment: there is no Search Console API access here, and Sheets access
is read-only. Both steps must be completed in the respective web UIs.

No further content scan, ratings reconciliation, or tracker is required.
