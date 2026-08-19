# "Pages Blocked From Crawling" — Final URL-Level Closeout Report

**Thread:** Re: Pages are blocked from crawling — 29 Apr
**Prepared by:** Saliha (SEO) — DRAFT for internal review before posting to the thread
**Date:** 2026-08-19
**Sources:** `www.fitnesssuperstore.com_semrush_bot_blocked_20260429` (SEMrush export, owner Larianne) · live Shopify Admin verification of all 53 real product pages (2026-08-19) · theme code audit (`fitnesssuperstore-shopify`)

---

## 0. Bottom line (TL;DR)

- The 136 "blocked from crawling" URLs are **not a theme/code defect**. The theme's crawl / index / canonical configuration is correct — **no GitHub/theme change is required.**
- **83 of 136** are intentional, correct blocks (system pages, search, faceted-search/param duplicates, legacy `.asp`, blog pagination, and `/collections/<x>/products/<handle>` duplicate paths that already canonicalize to a live `/products/<handle>`).
- **53 of 136** are real canonical `/products/<handle>` pages. Verified live today: **8 are already ACTIVE/indexable, 43 are genuinely hidden** (unpublished from the Online Store channel), and **2 are option/add-on objects that must stay unlisted**.
- "Hidden in metafields" from the earlier thread is really the Shopify **publication status** (Unlisted/Archived), not a theme metafield. Fixing it = a **Products/merchandising decision in Shopify Admin**, not code.
- The True Fitness VC900 Palisade Climber w/Emerge LED Console (Remanufactured) fix is **complete and verified live**.
- **Before count:** 136 blocked (SEMrush, 2026-04-29). **After count:** pending a fresh SEMrush re-crawl, which can only be run once the Products team executes the publish decisions (owner: Larianne / SEMrush).

---

## 1. Final category for every one of the 136 URLs

| Category | Count | Final disposition |
|---|---:|---|
| **A. Intentional system block** (`/account`, `/cart`, `/customer_authentication/redirect`) | 3 | Leave blocked — correct (robots.txt) |
| **B. Search pages** — 25 legacy `/searchresults.asp?...` + 5 Shopify `/search?q=...` | 30 | Leave blocked — correct. `.asp` = dead pre-Shopify URLs. |
| **C. Collection param/facet duplicates** (`/collections/<h>?sort_by=relevance&q=...`) | 35 | Leave blocked — non-canonical (`Disallow: /collections/*sort_by*`) |
| **D. Blog pagination** (`/blogs/<h>?page=2`) | 3 | Leave blocked — `noindex,follow` by design |
| **E. Collection-scoped product duplicates** (`/collections/<x>/products/<handle>`) | 11 | No product action — canonical `/products/<handle>` already live/indexed |
| **F. Policy URL** (`/policies/shipping-policy`) | 1 | Confirm 301 → `/pages/shipping-information` (live canonical) |
| **G. Real canonical product pages** (`/products/<handle>`) | 53 | See §2 |
| **Total** | **136** | |

Reconciliation: 3 + 30 + 35 + 3 + 11 + 1 + 53 = **136**. Categories A–F (83 URLs) are intentional/duplicate and correctly stay blocked. Only category G carries decisions.

---

## 2. The 53 real product URLs — current status (verified in Shopify Admin, 2026-08-19)

| Group | Count | Disposition |
|---|---:|---|
| **Already ACTIVE / indexable** | 8 | No action — live now (includes the VC900 fix). |
| **Hidden — UNLISTED, in stock** | 19 | **Publish candidates** — Products to confirm & publish to Online Store. |
| **Hidden — ARCHIVED, in stock** | 4 | **Un-archive + publish candidates** — Products decision. |
| **Hidden — UNLISTED, out of stock** | 19 | Products decision — likely intentional OOS hold; publish only if sellable. |
| **Hidden — ARCHIVED, out of stock** | 1 | Products decision — likely stays archived. |
| **Option / add-on objects** | 2 | **Keep UNLISTED** — used in the post-Avis option process (options metaobject); not standalone pages. |
| **Total** | **53** | |

> **Note on the `hidden` tag:** several already-ACTIVE products still carry a stale `hidden`/`draft` tag. The tag does **not** control indexing — the Shopify **status** (ACTIVE vs UNLISTED/ARCHIVED) does. Tags can be cleaned up separately; they are not the cause of any block.

Progress since the April crawl: 8 of these are now live and status has drifted on several others, which is exactly why every row was re-verified today rather than actioned from the April sheet.

---

## 3. Corrected / already-live pages, and the flagged handles (verified 2026-08-19)

The seven handles humans flagged in the thread, re-verified today:

| Handle | Current status | Inventory | Disposition |
|---|---|---:|---|
| true-fitness-vc900-…-emerge-led-…-remanufactured | ACTIVE / live | 9999 | ✅ Fixed & verified |
| french-fitness-rubber-grip-triceps-v-bar-new | ACTIVE (canonical) | 9989 | ✅ Live — flagged URL was only the non-canonical collection path |
| french-fitness-chrome-multi-purpose-bar-new | ACTIVE (canonical) | 9995 | ✅ Live — same |
| precor-efx-5-17-elliptical-…-remanufactured | UNLISTED | 9999 (in stock) | ⚠️ Publish candidate |
| french-fitness-rack-rig-free-standing-lat-pulldown-low-row-new | UNLISTED | −100 (OOS) | ⚠️ OOS hold — publish only if sellable |
| french-fitness-20-24-30-3-in-1-wooden-plyo-box-new | UNLISTED | −99 (OOS) | ⚠️ OOS hold — Products decision |
| french-fitness-ff-hgtm-apu-aluminum-pulley-upgrade-new | ARCHIVED | 9999 | ⚠️ Un-archive + publish candidate |

**Changes made in this pass:** none to the live store or theme code. The VC900 fix was completed earlier (verified here). The publish/un-archive actions in §2 are merchandising decisions held for Products sign-off (§5).

---

## 4. Before / after blocked counts (SEMrush)

| | Blocked URLs | Source |
|---|---:|---|
| **Before** | 136 | SEMrush crawl, 2026-04-29 |
| **After** | *pending re-crawl* | Run once §5 publish decisions execute |

Expected residual after cleanup ≈ the 83 intentional/duplicate blocks (categories A–F), which are correct and should remain "blocked." No "after" number is stated here because a fresh SEMrush crawl is the only valid source (SEMrush access required — not fabricated).

---

## 5. Remaining blocked valid URLs — cause, owner, next checkpoint

| Item | Cause | Owner | Next checkpoint |
|---|---|---|---|
| 43 hidden real products (Appendix A) | Shopify publication status (Unlisted/Archived) — not theme/robots | **Larianne (Products)** decides publish/keep-hidden per SKU (honor OOS holds + any Do-Not-Lead); **Izza** bulk-executes status change | Per-SKU decision posted back here |
| Fresh SEMrush "after" crawl | Requires SEMrush; run after publish decisions | **Larianne / Izza** | Post before/after blocked counts |
| GSC URL Inspection + validation | Requires Google Search Console access | **Izza / Saliha** | Inspect + Request Indexing per newly-published URL; attach evidence |
| `/policies/shipping-policy` 301 | Legacy policy path | **Izza** | Confirm redirect → `/pages/shipping-information` |

---

## 6. Google Search Console validation

- **Completed:** True Fitness VC900 Palisade Climber w/Emerge LED Console (Remanufactured) — live/indexable confirmed in Shopify; GSC URL Inspection screenshot to follow.
- **Method per newly-published URL:** GSC → URL Inspection → confirm "URL is on Google" or "Request Indexing" → capture screenshot → attach here.
- GSC evidence for the rest is pending the publish decisions and requires GSC access (not fabricated here).

---

## 7. Why this is not a GitHub/theme task (theme audit)

Audited `snippets/head-meta.liquid`, `templates/robots.txt.liquid`, `sections/sitemap.liquid`:

- `noindex` is applied in exactly three intentional cases: paginated URLs (`?page=`), product `variant=` params, and the internal `/search` template. All correct.
- Product canonical is always `<base>/products/<handle>` — so `/collections/<x>/products/<handle>` correctly consolidates to the clean product URL (explains category E).
- `robots.txt` intentionally disallows system, sort/filter, `/search`, `/policies/`, and `/collections/*/products/` paths, and blocks AI **training** crawlers (GPTBot, ClaudeBot, CCBot, GrokBot, Google-Extended) while **allowing** search/retrieval bots (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, etc.). All intentional.
- **There is no product-level "hidden"/"noindex" metafield in the theme.** A product being invisible to crawlers = it is Unlisted/Archived in Shopify (excluded from sitemap + collection links) — an Admin/merchandising setting, not code.

Conclusion: no code change is required or recommended.

---

## Appendix A — the 43 hidden real products (verified live 2026-08-19)

### Publish candidates — UNLISTED, in stock (19)
body-solid-ob47b-olympic-curl-bar-new · bowflex-revolution-accessory-rack-remanufactured · french-fitness-48-chrome-olympic-bar-new · french-fitness-marin-hip-abductor-adductor-plate-loaded-new · french-fitness-pvc-slam-ball-65-lb-new · french-fitness-pvc-slam-ball-75-lb-new · french-fitness-rack-rig-71-junction-bar-nameplate-crossmember-new · french-fitness-rack-rig-battle-rope-anchor-new · french-fitness-rack-rig-double-wall-ball-target-attachment-new · french-fitness-standard-cast-iron-1-weight-plate-new · french-fitness-urethane-round-pro-style-dumbbell-v2-105-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-110-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-115-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-120-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-130-lbs-single-new · power-plate-my7-fit-stop-new · power-plate-pro6-new · precor-efx-5-17-elliptical-cross-trainer-remanufactured · precor-trm-835-treadmill-w-p31-console-remanufactured

### Un-archive + publish candidates — ARCHIVED, in stock (4)
french-fitness-ff-hgtm-apu-aluminum-pulley-upgrade-new · french-fitness-ff-rr-ft-cave-apu-aluminum-pulley-upgrade-new · french-fitness-ff-ss-vs-apu-aluminum-pulley-upgrade-new · french-fitness-monster-universal-storage-system-ff-mss-123-new

### Likely OOS hold — UNLISTED, out of stock (19)
concept2-model-c-indoor-rower-w-pm2-console-remanufactured · french-fitness-165-rack-rig-junction-bar-crossmember-v1-new · french-fitness-20-24-30-3-in-1-wooden-plyo-box-new · french-fitness-diablo-chest-press-plate-loaded-new · french-fitness-dscc-dual-stack-cable-cross-new · french-fitness-fsr10-multi-cable-functional-smith-rack-machine-new · french-fitness-msc10-multi-function-squat-cage-smith-new · french-fitness-newport-chest-shoulder-multi-press-new · french-fitness-r30-3ds-monster-3d-dual-action-smith-rack-new · french-fitness-rack-rig-free-standing-lat-pulldown-low-row-new · french-fitness-tahoe-seated-low-row-plate-loaded-new · french-fitness-v2-heavy-punching-bag-100-lb-new · french-fitness-wall-mounted-mirror-functional-trainer-new · french-fitness-x12-4-station-functional-trainer-home-gym-system-new · french-fitness-x7-multi-home-gym-w-functional-arms-new · french-fitness-x9-functional-multi-gym-system-new · french-fitness-x9lp-functional-multi-gym-system-w-leg-press-new · precor-efx-5-21s-elliptical-cross-trainer-remanufactured · precor-efx-5-21si-elliptical-cross-trainer-remanufactured

### ARCHIVED, out of stock (1)
french-fitness-monster-universal-storage-system-ff-mss-151-new

### Already ACTIVE / live — no action (8)
french-fitness-heavy-punching-bag-100-lb-new · french-fitness-rubber-coated-hex-dumbbell-set-2-5-22-5-lbs-5-pair-new · french-fitness-rubber-coated-hex-dumbbell-set-2-5-25-lbs-10-pair-new · french-fitness-rubber-coated-hex-dumbbell-set-5-50-lbs-new · french-fitness-rubber-coated-hex-dumbbell-set-5-100-lbs-new · french-fitness-rubber-coated-hex-dumbbell-set-55-75-lbs-new · french-fitness-vail-torso-rotation-new · true-fitness-vc900-palisade-climber-w-emerge-led-console-remanufactured

### Keep UNLISTED — option/add-on objects (2)
plyo-boxes-accessories-add-ons-553 (product type "Avis-add-charge") · weight-stack-2 (product type "Option Category")

## Appendix B — the 11 collection-scoped duplicate paths (no product action; canonical `/products/<handle>` is live)

/collections/cable-attachments/products/: french-fitness-38-rubber-grip-lat-bar-new · french-fitness-adjustable-nylon-anh50-stirrup-handle-new · french-fitness-chrome-28-pro-style-lat-bar-new · french-fitness-chrome-ffc-12rsb-12-revolving-straight-bar-new · french-fitness-chrome-ffc-srcb-seated-row-chin-bar-new · french-fitness-chrome-multi-purpose-bar-new · french-fitness-rubber-grip-21-revolving-straight-bar-new · french-fitness-rubber-grip-seated-row-chin-bar-new · french-fitness-rubber-grip-triceps-v-bar-new
/collections/gym-accessories/products/: french-fitness-ntr2-nylon-tricep-rope-new · french-fitness-rubber-grip-rgh45-revolving-stirrup-handle-new
