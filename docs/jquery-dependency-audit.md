# jQuery dependency audit

Task 5 from Tim's repo audit (thread: "Claude Code setup on fitnesssuperstore-shopify
— Core Web Vitals workstream", 5 Sep 2026). Scope: audit `jquery.min.js` usage and
flag what actually depends on it. Read-only — no runtime behaviour changed.

## Verdict

**jQuery cannot be removed.** 38 files in the theme depend on it, and 32 of those
depend on it only transitively, through Slick — a jQuery carousel plugin. Dropping
jQuery means rewriting every carousel on the site first.

## What loads today

| Asset | Size | Loaded |
|---|---|---|
| `assets/jquery.min.js` | 87.4 KB | every page, `defer` (`snippets/script-tags.liquid:6`) |
| `assets/slick.min.js` | 41.9 KB | every page, `defer` (`snippets/script-tags.liquid:17`) |
| `assets/slick.min.css` + `slick-theme.min.css` | 4.1 KB | every page, render-blocking |

**129.3 KB of JS on every page**, including pages that use neither.

## Consumers

38 real consumers, classified by what they actually need.

### Slick-dependent — 32 files
Cannot work without both jQuery and Slick.

`assets/`: browse-by-brand.js, browse-by-category.js, browse-cat-remanufactured.js,
collection-custom.js, collection-section.js, colln-grid-cards.js, facets.js,
home-products.js, homepage-browse-by-brand.js, homepage-browse-by-category.js,
homepage-home-products.js, homepage-popular-fitness.js, media-gallery-carousel.js,
product-media-slider.js, product-mobile-gallery.js, related-products-custom.js,
related-products.js, reviews.js

`sections/`: as-featured-in.liquid, best-selling.liquid, contact-section-hero.liquid,
extra-info.liquid, feature-block.liquid, gallery-slider-warehouse.liquid,
gallery-slider.liquid, homepage-section-hero.liquid, main-search.liquid,
product-index-grid.liquid, product-video-slider.liquid, slider-section.liquid,
video-carousel.liquid, warehouse-products.liquid

### DataTables-dependent — 1 file
`sections/find-a-service.liquid` — loads DataTables 2.1.8 + FixedColumns from
`cdn.datatables.net` (three separate third-party requests, lines 3–5). DataTables is
also a jQuery plugin.

### Plain jQuery only — 5 files
The only files that could be ported to vanilla JS without touching a carousel:

- `assets/affirmShopify.js` — `jQuery.getJSON` against `/cart.js` and `/products/*.js`, plus `.change()` / `.each()` handlers
- `assets/main-product-custom.js` — one `$('#dynamic-product-content').empty()`
- `assets/page-custom-manuals-pagination.js` — DOM traversal for manuals pagination
- `sections/main-page-manuals.liquid` — `$(responseData)` HTML parsing + `replaceWith`
- `sections/main-product-home-gym-packages.liquid` — two selector calls

### Excluded as false positives — 4 files
Matched a naive `$` grep but do not use jQuery:

- `assets/cart-drawer.js:170` — `` `$${(e/100).toFixed(2)}` `` money template literal
- `assets/custom-color-picker.js`, `assets/facets-product-index.js`, `assets/old-custom.js` — minified local variables named `$`

Note `sections/main-search.liquid` contains a commented-out jQuery block at lines
311–315 **and** a live one at 328+. Only the live block counts.

## Recommendation

Removing jQuery is a Slick-replacement project, not a dependency cleanup — 32 files,
and every carousel on the storefront is in the blast radius. Not worth doing for CWV
right now.

The win that is available without rewriting anything: **jQuery and Slick are loaded
globally but are not needed globally.** Gating both to the templates that actually
instantiate a carousel would drop 129 KB from the pages that don't. That is a real
change with real risk (a missed template means a dead carousel), so it needs the
preview theme and per-template verification — not a blind edit.

Suggested sequencing, each as its own bounded PR per the guardrails:

1. Confirm per-template carousel usage against the preview theme.
2. Gate `slick.min.js` + its two stylesheets to those templates.
3. Gate `jquery.min.js` to the same set plus the 6 non-Slick consumers.
4. Only then consider porting the 5 plain-jQuery files, which would shrink the gate.

`find-a-service.liquid` is worth a separate look regardless: three render-blocking
third-party CDN requests on one page.
