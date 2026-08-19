# "Pages Blocked From Crawling" — Final URL-Level Closeout Report

**Thread:** Re: Pages are blocked from crawling — 29 Apr
**Prepared by:** Saliha (SEO) — DRAFT for internal review before posting to the thread
**Date:** 2026-08-19
**Source of truth:** `www.fitnesssuperstore.com_semrush_bot_blocked_20260429` (SEMrush export, owner Larianne) + live Shopify Admin verification (2026-08-19) + theme code audit (`fitnesssuperstore-shopify`)

---

## 0. Bottom line (TL;DR)

- The 136 "blocked from crawling" URLs are **not a theme/code defect**. The theme's crawl/index configuration is correct. Nothing needs to be fixed in GitHub/the theme.
- **65 of 136** are intentional, correct blocks: system pages, faceted-search/param duplicates, legacy `.asp` URLs, and `/collections/<x>/products/<handle>` duplicate paths that already canonicalize to a live `/products/<handle>`.
- The only real work is a **Shopify merchandising decision**: **50 real product pages are set to Hidden/Archived (unpublished from the Online Store channel)**. "Hidden in metafields" from the earlier thread is really the Shopify **publication status**, not a theme metafield.
- The True Fitness VC900 Palisade Climber w/Emerge LED Console (Remanufactured) fix is **complete and verified live** today.
- **Before count:** 136 blocked (SEMrush, 2026-04-29). **After count:** pending a fresh SEMrush re-crawl, which can only be produced once the Products team executes the hidden-product decisions (owner: Larianne / SEMrush access).

---

## 1. Final category for every one of the 136 URLs

| Category | Count | Final disposition |
|---|---:|---|
| **A. Intentional system block** (`/account`, `/cart`, `/customer_authentication/redirect`) | 3 | Leave blocked — correct (robots.txt) |
| **B. Search pages** — 25 legacy `/searchresults.asp?...` + 5 Shopify `/search?q=...` | 30 | Leave blocked — correct. `.asp` = dead legacy URLs from the pre-Shopify site (not real pages). |
| **C. Collection param/facet duplicates** (`/collections/<h>?sort_by=relevance&q=...`) | 35 | Leave blocked — non-canonical. robots.txt `Disallow: /collections/*sort_by*` |
| **D. Blog pagination** (`/blogs/<h>?page=2`) | 3 | Leave blocked — `noindex,follow` by design (theme) |
| **E. Duplicate/non-canonical collection-scoped product paths** (`/collections/<x>/products/<handle>`) | 11 | No product action — the canonical `/products/<handle>` is already live/indexed. robots.txt `Disallow: /collections/*/products/` + theme canonical → `/products/<handle>` |
| **F. Policy URL (redirect case)** (`/policies/shipping-policy`) | 1 | Redirect to `/pages/shipping-information` (already the live canonical). Confirm 301 exists. |
| **G. Real canonical product pages** (`/products/<handle>`) | 53 | See §2 — 1 already live, 50 hidden (escalate to Products), 2 non-real |
| **Total** | **136** | |

Reconciliation: 3 + 30 + 35 + 3 + 11 + 1 + 53 = **136**. Categories A–F (65 URLs) are intentional/duplicate and require no indexing change. Only category G carries decisions.

---

## 2. The 53 real product URLs — status and required action

| Sub-group | Count | Disposition |
|---|---:|---|
| **Already LIVE / indexable** | 1 | `true-fitness-vc900-palisade-climber-w-emerge-led-console-remanufactured` — verified ACTIVE, inventory 9999, canonical live (2026-08-19). **Completed.** |
| **Hidden — real SKUs, currently unpublished** | 50 | Escalate to Products team for publish/keep-hidden decision (see below). Cause = Shopify publication status = Hidden/Unlisted/Archived (NOT a theme noindex). |
| **Non-real / not an index target** | 2 | `plyo-boxes-accessories-add-ons-553` (product-option object, not a standalone page) and `weight-stack-2` (non-existent). De-index / no action. |

### 2a. The 50 hidden real products — snapshot from the 2026-04-29 crawl

- **31 hidden with stock on hand** (positive inventory in the crawl) — primary publish candidates.
- **19 hidden and out of stock** (negative inventory = OOS hold) — likely intentional holds; publish only if the SKU is genuinely sellable.

> **Caution — data drift.** The in-stock/OOS split above is from the April crawl. Live re-checks on 2026-08-19 show status has moved since then (examples in §3), so **each of the 50 must be re-confirmed in Shopify at execution time**, not actioned from the April sheet.

Full 50-handle list is in Appendix A.

---

## 3. Exact change made + current live status (verified in Shopify Admin, 2026-08-19)

The seven handles humans flagged in the thread as "should be live," re-verified today:

| Product (`/products/<handle>`) | Flagged as | Current status (2026-08-19) | Inventory | Disposition |
|---|---|---|---:|---|
| true-fitness-vc900-palisade-climber-w-emerge-led-console-remanufactured | should be live | **ACTIVE / indexable** | 9999 | ✅ Fixed & verified live |
| french-fitness-rubber-grip-triceps-v-bar-new | hidden (via `/collections/.../products/`) | **ACTIVE** (canonical `/products/…`) | 9989 | ✅ Live — the flagged URL was just the non-canonical collection path |
| french-fitness-chrome-multi-purpose-bar-new | hidden (via `/collections/.../products/`) | **ACTIVE** (canonical `/products/…`) | 9995 | ✅ Live — same as above |
| precor-efx-5-17-elliptical-cross-trainer-remanufactured | hidden | **UNLISTED** (hidden) | 9999 (in stock) | ⚠️ Still hidden — strong publish candidate |
| french-fitness-rack-rig-free-standing-lat-pulldown-low-row-new | hidden | **UNLISTED** (hidden) | −100 (OOS now) | ⚠️ Still hidden + now OOS — publish only if sellable |
| french-fitness-20-24-30-3-in-1-wooden-plyo-box-new | hidden | **UNLISTED** (hidden) | −99 (OOS) | ⚠️ Still hidden + OOS — Products decision |
| french-fitness-ff-hgtm-apu-aluminum-pulley-upgrade-new | hidden | **ARCHIVED** | 9999 | ⚠️ Archived (stronger than hidden) — un-archive + publish only if sellable |

**Change actually made in this pass:** none to the live store or theme code. The VC900 Emerge fix was completed earlier (verified here). All other real changes are the Products-team publish decisions in §4, which are held pending sign-off.

---

## 4. Remaining valid product URLs still blocked — cause, owner, next checkpoint

| Item | Cause | Owner | Next checkpoint |
|---|---|---|---|
| 50 hidden real products (Appendix A) | Shopify publication status = Hidden / Unlisted / Archived. Not a theme/robots issue. | **Larianne (Products)** decides publish vs keep-hidden per SKU, honoring OOS holds and any Do-Not-Lead designations; Izza executes bulk status change if needed | Product-by-product decision list back in this thread |
| Fresh SEMrush "after" crawl (before/after counts) | Requires SEMrush; can only run after publish decisions execute | **Larianne / Izza (SEMrush)** | Re-crawl + post before/after blocked count |
| GSC URL Inspection + validation for corrected pages | Requires Google Search Console access | **Izza / Saliha (GSC)** | Inspect + "Request Indexing" for each newly-published URL; attach screenshots |
| `/policies/shipping-policy` → `/pages/shipping-information` | Legacy policy path | Izza | Confirm 301 redirect is live |

---

## 5. Before / after blocked counts (SEMrush)

| | Blocked URLs | Source |
|---|---:|---|
| **Before** | 136 | SEMrush crawl, 2026-04-29 (source sheet) |
| **After** | *pending re-crawl* | To be produced once §4 publish decisions execute |

> I have not fabricated an "after" number. A fresh SEMrush crawl is the only valid source and requires SEMrush access. Expected residual after cleanup ≈ the 65 intentional/duplicate blocks (categories A–F), which are correct and expected to remain "blocked."

---

## 6. Google Search Console validation evidence

- **Completed:** True Fitness VC900 Palisade Climber w/Emerge LED Console (Remanufactured) — live/indexable confirmed in Shopify; GSC URL Inspection to be attached.
- **Method for each newly-published URL:** GSC → URL Inspection → confirm "URL is on Google" or submit "Request Indexing" → capture screenshot → attach to this thread.
- GSC evidence for the rest is pending the publish decisions and requires GSC access (not fabricated here).

---

## 7. Why this is not a GitHub/theme task (evidence from the theme audit)

Theme code was audited (`snippets/head-meta.liquid`, `templates/robots.txt.liquid`, `sections/sitemap.liquid`). Findings:

- The theme applies `noindex` in exactly three intentional cases: paginated URLs (`?page=`), product `variant=` param URLs, and the internal `/search` template. All correct.
- Product canonical is always `<base>/products/<handle>` — so `/collections/<x>/products/<handle>` correctly consolidates to the clean product URL (explains category E).
- `robots.txt` intentionally disallows system, sort/filter, `/search`, `/policies/`, and `/collections/*/products/` paths, and blocks AI **training** crawlers (GPTBot, ClaudeBot, CCBot, GrokBot, Google-Extended) while **allowing** search/retrieval bots (Googlebot, Bingbot, OAI-SearchBot, PerplexityBot, etc.). All intentional.
- **There is no product-level "hidden"/"noindex" metafield in the theme.** A product being invisible to crawlers = it is Hidden/Unlisted/Archived in Shopify (excluded from sitemap + collection links), which is an Admin/merchandising setting, not code.

Conclusion: no code change is required or recommended.

---

## Appendix A — the 50 hidden real product handles (from 2026-04-29 crawl; re-verify live before actioning)

**Hidden with stock (31):** body-solid-ob47b-olympic-curl-bar-new · bowflex-revolution-accessory-rack-remanufactured · french-fitness-48-chrome-olympic-bar-new · french-fitness-ff-hgtm-apu-aluminum-pulley-upgrade-new · french-fitness-ff-rr-ft-cave-apu-aluminum-pulley-upgrade-new · french-fitness-ff-ss-vs-apu-aluminum-pulley-upgrade-new · french-fitness-marin-hip-abductor-adductor-plate-loaded-new · french-fitness-monster-universal-storage-system-ff-mss-123-new · french-fitness-newport-chest-shoulder-multi-press-new · french-fitness-pvc-slam-ball-65-lb-new · french-fitness-pvc-slam-ball-75-lb-new · french-fitness-rack-rig-71-junction-bar-nameplate-crossmember-new · french-fitness-rack-rig-battle-rope-anchor-new · french-fitness-rack-rig-double-wall-ball-target-attachment-new · french-fitness-rack-rig-free-standing-lat-pulldown-low-row-new · french-fitness-rubber-coated-hex-dumbbell-set-2-5-22-5-lbs-5-pair-new · french-fitness-rubber-coated-hex-dumbbell-set-2-5-25-lbs-10-pair-new · french-fitness-rubber-coated-hex-dumbbell-set-5-100-lbs-new · french-fitness-rubber-coated-hex-dumbbell-set-5-50-lbs-new · french-fitness-rubber-coated-hex-dumbbell-set-55-75-lbs-new · french-fitness-standard-cast-iron-1-weight-plate-new · french-fitness-urethane-round-pro-style-dumbbell-v2-105-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-110-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-115-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-120-lbs-single-new · french-fitness-urethane-round-pro-style-dumbbell-v2-130-lbs-single-new · french-fitness-vail-torso-rotation-new · power-plate-my7-fit-stop-new · power-plate-pro6-new · precor-efx-5-17-elliptical-cross-trainer-remanufactured · precor-trm-835-treadmill-w-p31-console-remanufactured

**Hidden and out of stock (19):** french-fitness-165-rack-rig-junction-bar-crossmember-v1-new · french-fitness-dscc-dual-stack-cable-cross-new · french-fitness-tahoe-seated-low-row-plate-loaded-new · french-fitness-x12-4-station-functional-trainer-home-gym-system-new · french-fitness-heavy-punching-bag-100-lb-new · precor-efx-5-21si-elliptical-cross-trainer-remanufactured · concept2-model-c-indoor-rower-w-pm2-console-remanufactured · french-fitness-20-24-30-3-in-1-wooden-plyo-box-new · french-fitness-diablo-chest-press-plate-loaded-new · french-fitness-monster-universal-storage-system-ff-mss-151-new · french-fitness-msc10-multi-function-squat-cage-smith-new · french-fitness-r30-3ds-monster-3d-dual-action-smith-rack-new · french-fitness-v2-heavy-punching-bag-100-lb-new · french-fitness-wall-mounted-mirror-functional-trainer-new · french-fitness-x9-functional-multi-gym-system-new · french-fitness-x9lp-functional-multi-gym-system-w-leg-press-new · precor-efx-5-21s-elliptical-cross-trainer-remanufactured · french-fitness-fsr10-multi-cable-functional-smith-rack-machine-new · french-fitness-x7-multi-home-gym-w-functional-arms-new

## Appendix B — the 11 collection-scoped duplicate paths (no product action; canonical `/products/<handle>` is live)

/collections/cable-attachments/products/: french-fitness-38-rubber-grip-lat-bar-new · french-fitness-adjustable-nylon-anh50-stirrup-handle-new · french-fitness-chrome-28-pro-style-lat-bar-new · french-fitness-chrome-ffc-12rsb-12-revolving-straight-bar-new · french-fitness-chrome-ffc-srcb-seated-row-chin-bar-new · french-fitness-chrome-multi-purpose-bar-new · french-fitness-rubber-grip-21-revolving-straight-bar-new · french-fitness-rubber-grip-seated-row-chin-bar-new · french-fitness-rubber-grip-triceps-v-bar-new
/collections/gym-accessories/products/: french-fitness-ntr2-nylon-tricep-rope-new · french-fitness-rubber-grip-rgh45-revolving-stirrup-handle-new
