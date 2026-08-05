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

## Gate recommendation

**Do not merge or publish yet — but the two content blockers are cleared.** Remaining steps are
mechanical rather than editorial:

1. **Izza** lands these two files into PR #664 (the Warehouse template joins as a 14th file) and
   refreshes preview `187347599676` from the updated branch.
2. **Zafran** re-scans the refreshed preview — a short delta check on two files.
3. **Sagi** re-checks only the Warehouse and About Fitness Superstore pages visually, plus his own
   two open design points (About Us review widgets, Government Sales banner height) once Tim rules
   on them.
4. Saliha's Needs-Source rows and the homepage exact-wording advisory remain open and are
   unaffected by these fixes.
5. Then publish, confirm live Shopify/GitHub parity, verify rendered `foundingDate: "2010"` and the
   approved copy live, close the tracker, and request recrawling.

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
