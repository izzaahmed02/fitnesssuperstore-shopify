# CWV Phase 1 + Phase 2 — QA packet

Owner: Yusra (QA, section 4 of Tim's 5 Sep brief)
Source: `fix/cwv-phase-1-and-2` patch series, emailed 5 Sep 2026
Branch under test: `claude/cwv-phase-2-task-i9g8m0`
Base: `main` @ `24d92ff` (Tim's patches were cut against `191c2b8`; none of the
six files they touch changed between those two commits, so they apply unchanged)

Status: **code verified, static QA complete, deploy QA blocked.**
Two findings below are merge blockers because they change what the change is
expected to achieve, not because the code is wrong.

---

## 1. Patch provenance and integrity

The two attachments arrived corrupt. Four unified-diff context lines had lost
their leading space, so `git am` aborted with `corrupt patch at line 65`:

| Patch | Line | Context line missing its leading space |
|---|---|---|
| 0001 | 82 | `<meta http-equiv="X-UA-Compatible" content="IE=edge">` |
| 0001 | 83 | `<meta name="viewport" content="width=device-width,initial-scale=1">` |
| 0001 | 84 | `<meta name="theme-color" content="">` |
| 0002 | 98 | `{% if template contains 'product' and product and product.featured_media %}` |

Repaired by restoring the four spaces — nothing else was edited. The repair is
provably faithful: applying the repaired series to `191c2b8` produces blobs whose
git hashes match every `index` line in Tim's own patch headers.

| File | Expected (patch header) | Produced |
|---|---|---|
| `layout/theme.liquid` after Phase 1 | `3ea97e0d` | `3ea97e0d` |
| `snippets/head-meta.liquid` after Phase 1 | `0ca3a64a` | `0ca3a64a` |
| `layout/theme.liquid` after Phase 2 | `78f58682` | `78f58682` |
| `snippets/head-meta.liquid` after Phase 2 | `8e9b9345` | `8e9b9345` |
| `snippets/product-card.liquid` | `5921a40d` | `5921a40d` |
| `snippets/script-tags.liquid` | `65d19770` | `65d19770` |
| `sections/main-collection-product-grid.liquid` | `851a856d` | `851a856d` |

Both commits are on this branch with Tim's authorship and commit messages intact.
Commit SHAs differ from `627ce2f9` / `875d09b2` only because the parent is the
current `main`.

---

## 2. Merge blockers

### BLOCKER 1 — the Phase 2 LCP work runs on a code path production does not use

`main-collection-product-grid` is **disabled** on every collection template that
carries real traffic. Collection pages render their product list through the
Boost AI Search & Filter app block instead.

| Template | Product list rendered by | Grid section |
|---|---|---|
| `collection.json` (default) | `boost-ai-search-filter/blocks/filter-product-list-ssr` | `"disabled": true` |
| `collection.gym-packages.json` | `main-collection-product-sets` | `"disabled": true` |
| `collection.product-index-2.json` | `product-index-grid` | `"disabled": true` |
| `collection.product-index.json` | apps block | not present |
| `collection.manuals.json` | `collection-section-manuals` | not present |
| `collection.ab-test.json` | `main-collection-product-grid` | **enabled** |

Confirmed against live production HTML for
`https://www.fitnesssuperstore.com/collections/treadmills` (fetched 6 Sep):
`main-collection-product-grid` appears **0** times, `boost-sd` appears 336 times.

So the two changes aimed at collection LCP —
`snippets/product-card.liquid` (`loading="eager"` + `fetchpriority="high"`) and
`sections/main-collection-product-grid.liquid` (`fetch_priority` for
`forloop.first`) — reach **only `collection.ab-test.json`**. They cannot move LCP
on the 2,149 URLs in the Search Console drill-down.

Worse for the underlying diagnosis: the live HTML contains no product `<img>` at
all, only `boost-sd__product-list-placeholder` skeleton markup. Boost fetches and
renders the grid **client-side**. The LCP element on a collection page is
therefore painted after Boost's JavaScript runs — which is the actual LCP cause,
and is not addressable from theme markup.

`product-card.liquid` is rendered from exactly one place
(`main-collection-product-grid.liquid:459`), so there is no collateral impact on
other templates. Tim's "default behavior for all other cards unchanged" holds.

**Recommendation:** ship Phase 2 for the third-party JS work, but do not expect
collection LCP movement from it. The collection LCP fix belongs in the Boost app
block configuration (its own image priority / SSR settings), which is an owner
decision, not a theme change. Note also that `collection.ab-test.json` *is*
enabled — merging changes card markup inside a live A/B test cell, which can skew
a running experiment.

### BLOCKER 2 — the new collection preload is likely to be a wasted download

`snippets/head-meta.liquid` preloads `collection.products.first.featured_media`
on any template whose name contains `collection`. A `<link rel="preload">` for a
responsive image only helps when the URL the browser resolves matches the URL the
`<img>` finally requests. Three ways that fails here:

1. **Different renderer.** Boost builds its own Shopify CDN URLs with its own
   width parameters. A different `width=` produces a different URL, so the
   preload warms an image the page never uses.
2. **Sort and filter.** Boost applies its own default sort and any active filter.
   `collection.products.first` is not necessarily the first card Boost paints.
3. **Pagination.** The grid paginates; `collection.products.first` is page 1's
   first product on every page, so pages 2+ preload the wrong image outright.

A mismatched preload is not neutral — it is a high-priority fetch competing with
the real LCP resource on exactly the pages we are trying to speed up.

**Recommendation:** either gate the preload to `template == 'collection.ab-test'`
and `paginate.current_page == 1` (where the theme grid actually renders), or drop
it from Phase 2 until Boost's rendered image URL has been captured from a real
browser and matched.

---

## 3. Flags (not blockers)

**Convert: the two tags are not provably duplicates.** The removed injector
loaded `cdn.9gtb.com/loader.js?g_cvt_id=96541d45-9050-46e9-90bb-874d67c6ed47`;
the retained head tag is
`cdn-4.convertexperiments.com/v1/js/10019770-100110328.js`. Those are different
project identifiers, so from the code alone this is a *second* Convert entry
point, not a duplicate of the first. Tim already flagged this as the one judgment
call in the set — it must be confirmed in the Convert dashboard (do both IDs
belong to the same account, and are any live experiments bound to
`96541d45-…`?) before merge. Revert is one paste; the regression suite has a
matching REVERT NOTE.

**Heatmap deferral costs early-session fidelity.** The loader now fires on first
interaction or 1.5s after `load`. Sessions that bounce before either still get
recorded, but scroll/click events in the first seconds are no longer captured.
That is the intended trade; whoever owns the Heatmap account should be told.

**Judge.me poller.** Now bounded to ~30 attempts (~45s) instead of running
forever — a clear improvement. It still re-runs `customizeBadges()` on every tick
rather than stopping on success. Optional follow-up, not a defect.

**Phase 1 removal is clean.** No remaining references anywhere in the theme to
`optimization`, `asyncLazyLoad`, `loadJSscripts`, `script_loaded`,
`text/lazyload`, `__isPSA` or `___mnag`. The cloaking is live on production today
(all six markers present in the current `collections/treadmills` HTML), so Phase 1
removes real, active code. Tim's warning stands: lab PSI will drop, and that drop
is the score becoming honest.

---

## 4. Automated QA — added to this branch

`scripts/cwv_regression_test.py` already runs on every push and PR via
`.github/workflows/cwv-regression.yml`. Checks 13–19 were added to lock in the
Phase 1 and Phase 2 invariants:

- 13 — `snippets/optimization.liquid` must not exist; no cloaking markers, and no
  `navigator.userAgent` branch in the vendor injector.
- 14 — the Judge.me poller must call `clearInterval`.
- 15 — Convert preconnect present.
- 16 — no `9gtb.com` / `convert-bundle-loader`; the convertexperiments tag is the
  single entry point.
- 17 — Heatmap is interaction/load deferred, not eager.
- 18 — the collection LCP priority hints are present.
- 19 — the collection preload's `imagesizes` must stay byte-identical to the
  product card's `sizes`, and its candidate widths must all exist in the card's
  `srcset`. This is the guard against the double-download failure in Blocker 2.

All 19 checks pass on this branch. Checks 13, 16, 17 and 19 were mutation-tested
(cloaking snippet restored, `9gtb` re-added, Heatmap re-eagered, card `sizes`
drifted by 5px) and each failed as intended, so they are not vacuous.

---

## 5. Manual QA — still outstanding, and why

Section 4 of the brief requires an unpublished theme. Themes on this store are
connected through the Shopify GitHub integration and named
`fitnesssuperstore-shopify/<branch>`, so the deploy is: push the branch, then
connect it as an unpublished theme in Shopify admin → Online Store → Themes.
That is an admin UI action; it has not been done, so items 2–6 below are **not
signed off**.

Run these against the preview URL once the theme exists. Do not touch MAIN.

| # | Check | Pass criteria | Status |
|---|---|---|---|
| 1 | Deploy branch head to a new unpublished theme | Preview URL loads; MAIN untouched | **not done** |
| 2 | Collection page, desktop + mobile | First product image has `loading="eager"` + `fetchpriority="high"` in rendered HTML; remaining cards still `lazy`; no grid layout shift | **not done** — and see Blocker 1: on `collection.json` this will fail, because Boost renders the grid, not the theme |
| 3 | PDP unchanged | Featured-image preload identical to today | **not done** |
| 4 | Heatmap + Gorgias | Neither requests before first scroll/click; both fire after; Gorgias chat opens | **not done** |
| 5 | One Convert experiment fires | Experiment visible in Convert's live preview / dashboard | **not done** — see the Convert flag above; this is the gating check for the whole 9gtb removal |
| 6 | PSI on preview, after Phase 1 | Record mobile + desktop scores as the new honest baseline | **not done** |

Additional checks this QA recommends adding to section 4:

| # | Check | Why |
|---|---|---|
| 7 | Collection page 2 (`?page=2`) | Confirms whether the new preload fetches an image the page never shows (Blocker 2) |
| 8 | Collection page with a Boost filter applied | Same, for the filter/sort path |
| 9 | Network panel: count requests for the first product image | Exactly 1. A 2 means the preload missed and is costing LCP |
| 10 | `collection.ab-test` template | The only template the grid changes actually reach; verify the running experiment is not disturbed |
| 11 | Shopify analytics + Facebook pixel fire on load | Phase 1 removed the observer that was lazy-loading `class="analytics"` and `connect.facebook.net`; confirm nothing double-fires |

### What could not be done from this environment

- **No unpublished theme deploy.** Connecting a branch as a theme is a Shopify
  admin UI action, and the branch must be pushed first (Izza's step).
- **No lab measurement.** The PageSpeed Insights API returned
  `Quota exceeded … Queries per day`, and headless Chromium cannot reach the
  storefront through this session's egress proxy (`ERR_CONNECTION_RESET`), so no
  LCP/CLS/TBT numbers were captured. Item 6 needs a real PSI run.
- **No field data.** Search Console CrUX figures in the brief were taken as given
  and not independently re-pulled.

Everything asserted above about production behaviour comes from the live
`collections/treadmills` HTML fetched 6 Sep 2026 and from the template JSON in
this repository.
