# Orphaned Pages Review — Fitness Superstore

**Thread:** "Orphaned Pages - 29 Apr"
**Reviewed:** 2026-07-20
**Source of original list:** Google Sheet `Orphaned_page_in_sitemaps_20260429` (1,086 URLs)
**Verified against:** Semrush Site Audit project `www.fitnesssuperstore.com` (snapshot finished 2026-07-18) and the Shopify Admin API (live store).

---

## TL;DR

- The orphaned-pages problem is **still open**: the current Site Audit shows **1,058 "Orphaned sitemap pages"** — essentially unchanged from the 1,086 in the 29 Apr sheet.
- The 9 test/admin/duplicate URLs flagged as "do not link" are **already fixed** — all carry the `seo.hidden` metafield, which natively removes them from `sitemap.xml` and adds `noindex`/`nofollow`. No further action needed on those.
- The "fix-first" product remedy in the 30 Apr ChatGPT triage — *"add internal links through a relevant collection"* — **does not apply as written.** The sampled fix-first products are already ACTIVE, published, and sit in 16–20 collections each (plus the crawlable `product-index` hub) yet are **still flagged orphaned**.
- Root cause is **internal-link depth / crawl reachability**, not missing collection membership. Supporting signals from the same audit: **1,094 pages need >3 clicks to reach**, **459 pages have only one internal link**.
- Recommended next step: treat this as an internal-linking-architecture fix + re-audit, **not** a per-product "add to collection" task. Do not bulk-edit collections — the products are already in them.

---

## Scope note (important)

This thread accumulated two different task sets. Per Tim's 30 Apr message *"ignore everything here… the correct thread is 'Pages with only one internal link - 29 Apr'"*, the **"Shop by Condition" / condition pages / redirect-map** plan belongs to that **other** thread (it targets the "466 pages with only one internal link" issue — the current audit shows 459 of those). This document covers only the **orphaned-pages** work for *this* thread.

---

## Current data (Semrush Site Audit, snapshot 2026-07-18)

| Audit issue | Count (now) | 29 Apr sheet |
|---|---|---|
| **207 — Orphaned sitemap pages** | **1,058** | 1,086 |
| 206 — Orphaned pages (Google Analytics) | 4,323 | — |
| 213 — Pages with only one internal link | 459 | (other thread: 466) |
| 212 — Pages >3 clicks deep | 1,094 | — |

**Breakdown of the 1,058 orphaned sitemap pages:** 1,034 products · 14 collections · 9 pages · 1 other (`/agents.md`).

Full current list: `docs/seo/orphaned_sitemap_pages_current_20260720.csv` (regenerated from the live audit; replaces the stale 29 Apr sheet).

---

## What was verified

### 1. The 9 "remove / do-not-link" URLs — already handled ✅
All six collections and three pages Tim listed as "URLs I would not link" already have `seo.hidden = 1` on the live store:

- `/collections/collection-filter-test-1`, `/collections/all-products-tax-settings`,
  `/collections/smart-product-filter-index-do-not-delete`, `/collections/tax-excluded-products`,
  `/collections/products-tax-collection`, `/collections/zz-boost-test`
- `/pages/test-options`, `/pages/homepage`, `/pages/data-sharing-opt-out`

Per Shopify's documented behavior, `seo.hidden` **removes the resource from `sitemap.xml` and adds `noindex`/`nofollow`** automatically — no theme code required. These are done.

> Note: `/pages/data-sharing-opt-out` ("Your Privacy Choices") is a privacy/compliance page. It is correctly hidden and was **left untouched** — any change to a compliance page should go through human/legal review.

### 2. The "fix-first" products — already well-connected in-admin, still orphaned in-crawl ⚠️
All nine of Tim's "top examples to fix first" were checked live. Every one is **ACTIVE, published, and in 16–20 collections**, including real category and brand collections (e.g. `french-fitness`, `strength-training-equipment`, `new-equipment`, `products-remanufactured`) **and** the site-wide `product-index` collection.

Yet two of them (`technogym-excite-vario-1000-w-unity-3-0-console-remanufactured`, `french-fitness-rubber-flooring-ramps-beveled-edge-transition-strip-12mm-new`) **still appear in the current orphaned list.** Adding them to more collections would change nothing — they are already there.

### 3. A crawlable product hub exists but isn't resolving the orphaning
`/collections/product-index` (theme sections `product-index.liquid` / `product-index-item.liquid`) server-renders a plain `<a href="{{ product.url }}">` for every product, paginated, and is **not** `seo.hidden` (indexable, 3,759 products). Because products remain orphaned despite this hub, the crawler is effectively **not reaching them through it** — consistent with the depth signals above (deep pagination → >3 clicks → treated as orphaned/only-in-sitemap).

---

## Recommended direction

1. **Re-baseline, don't reuse the April sheet.** Work from `orphaned_sitemap_pages_current_20260720.csv`.
2. **Do not bulk-edit collection membership for the orphaned products** — they are already in collections. This would be wasted/risky work.
3. **Fix internal-link depth/reachability instead** (theme/architecture work, needs design + QA + SEO sign-off before going live):
   - Make the `product-index` hub reachable in few clicks (link it from the footer/site map and reduce reliance on deep `?page=` pagination), and/or expose a crawlable, server-rendered A–Z or category-chunked product index.
   - Ensure category/brand collection grids expose server-rendered product links within crawl depth.
   - Strengthen cross-linking (related products, breadcrumbs, hub pages).
4. **Link the orphaned *collections* that matter.** Several are real, revenue-relevant pages missing from navigation, e.g. `stairmaster-new`, `stairmaster-remanufactured`, `power-plate-new`, `power-plate-remanufactured`, `gym-packages`, `starter-packages`, `french-fitness-summer-overstock-sale`. (Note: the New/Remanufactured brand hubs overlap with the "Shop by Condition" mega-menu plan tracked in the *other* thread.)
5. **Review the orphaned comparison-chart / info pages** (e.g. `octane-seated-elliptical-comparison-chart`, `costars-cooperative-purchasing-program`, `fitness-equipment-alabama`) — link the ones worth keeping, redirect/`noindex` the stale ones. Investigate `/agents.md` appearing in the sitemap.
6. **Re-run the Site Audit after changes** and confirm issue 207 drops before touching the medium-priority set.

---

*Prepared as an internal analysis for the Fitness Superstore SEO cleanup. No live-store or theme changes were made as part of this review.*
