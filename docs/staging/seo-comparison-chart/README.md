# Source-Locked French Fitness Comparison Preview — REV3

Status: **DRAFT / REVIEW ONLY / DO NOT MERGE OR PUBLISH**

Existing indexed article:

`/blogs/comparisons/french-fitness-dual-adjustable-pulley-functional-trainers-comparison`

Unpublished Shopify staging article:

`gid://shopify/Article/614721388860`

Controlling candidate body:

`docs/staging/seo-comparison-chart/preview.html`

Local candidate SHA-256 before Shopify normalization:

`9f42fb2f88bff6a98bd23a6e86329e6f042fd4fd8d0e25c568c9d1c7a1cd0a3a`

## REV3 execution state

- The unpublished Shopify staging article was updated with this controlling body on September 4, 2026.
- The existing indexed article remains unchanged.
- The GitHub preview must match this body in content. Shopify may normalize whitespace without changing rendered content.
- The article body begins with H2 because the Shopify article template supplies the page H1.
- The candidate includes eight source-controlled product images, one six-question FAQ set with matching FAQPage JSON-LD, descriptive links, 44 px minimum link targets, contained horizontal table scrolling, and non-executing analytics data hooks.

## Evidence universe and selection

The source-lock workbook covers 32 product records: 29 returned by collection `gid://shopify/Collection/515799548220` plus three active legacy-tagged products outside the collection. No product tags or collection rules were changed.

Eight comparison rows cover nine active products:

1. FFB/FFS Dual Adjustable Pulley family — `FFB-DAP` / `FFS-DAP`
2. DAP50 — `FF-DAP50`
3. Telluride — `FF-TRIDE-DCC`
4. Wall Mounted Rack Functional Trainer 1:1 — `FF-WMRFT11`
5. Wall Mounted Rack Functional Trainer 2:1 — `FF-WMRFT21`
6. SRFT8 — `FF-SRFT8`
7. FSR90 — `FF-FSR90` (active legacy-tagged product outside the current automated collection)
8. FSR110 Light Commercial — `FF-FSR110`

## Yusra HOLD disposition

- B1 corrected: CTA uses `/pages/contact`.
- B2/B3 corrected: one controlling body and one six-question visible FAQ/schema set.
- B4 corrected in the workbook: 32-record universe and all three outside-collection dispositions.
- B5 controlled: rollback/release procedure is committed; a fresh live-article body snapshot remains mandatory in the same session as any approved live update.
- N1–N6 corrected: tap targets, link labels, purchase-time stack constraint, heading hierarchy, readable workbook dates, and exact source-controlled model titles.

## Structured-data and analytics gates

The body contains matching FAQPage markup. Article/BlogPosting schema is intentionally held for rendered-theme review so the release uses the final canonical URL, author, image, original `datePublished`, actual release-time `dateModified`, and no duplicate entity.

The body contains data hooks for `comparison_pdp_click`, `comparison_cta_click`, `comparison_faq_open`, and `comparison_table_scroll`. Runtime binding remains a separate Izza/Yusra release gate.

## Holds

- No live article update.
- No publication or merge.
- No redirect, canonical/indexing, product, tag, collection, price, inventory, feed, shipping, installation, or warranty change.
- No Liquid, section, snippet, template, asset, config, or runtime-theme change is included.
- The separate `specs_features` project remains outside this pilot.

Live publication requires Yusra PASS, Izza rendered-theme/analytics/release confirmation, a fresh in-session rollback snapshot, exact post-write readback, and Tim's separate written GO.
