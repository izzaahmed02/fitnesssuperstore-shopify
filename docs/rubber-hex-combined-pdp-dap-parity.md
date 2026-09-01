# Rubber Hex combined PDP — Dual Adjustable Pulley parity

## Problem (Tim, Sept 1)
On the Rubber Hex combined-listing **parent** page the header is incoherent:
- **Title/H1** = the generic family name ("Rubber Coated Hex Dumbbells")
- **SKU** = one specific child's product code
- **Price** = a default/cheapest "From" price

…three things that describe different products. Tim wants it to behave like the
**Dual Adjustable Pulley** PDP, where title + SKU + price + images always
describe one coherent product and the selector swaps to another coherent product.

## Why DAP is coherent
DAP (FFB Black / FFS Silver) renders through `sections/main-product.liquid` as
**real individual products** linked by `snippets/finish-selector.liquid`. You are
always on a real product page, so everything agrees.

## Root cause
The Rubber Hex parent renders through `sections/main-product-comb.liquid`, which
shows `product.title` (generic parent name) + `selected_or_first_available_variant`
SKU + a "From" family price (`snippets/price.liquid`).

The theme already tries to avoid this: `assets/product-info.js`
`connectedCallback()` → `redirectCombinedListingToVariant()` is meant to forward
the bare parent URL to the real child URL. But it resolved the target from a
**single option value's** `data-product-url` (`value.product_url`), which does
**not** uniquely identify a child on a 3-option listing (Purchase Type → Set Type
→ Weight). So it bailed out and the generic shell stayed on screen.

## Fix (this branch)
`assets/product-info.js` — `redirectCombinedListingToVariant()` now resolves the
**fully-selected** option combination (o1/o2/o3) against the family variants map
`data-product-variants-map` (the same source of truth
`variant-fallback-intercept.js` uses) and redirects to that variant's real child
URL (`u`). Loop-safe: if the current path already matches a family child URL, it
does not redirect.

Result: landing on the family page resolves to a coherent child product —
matching the Dual Adjustable Pulley behaviour.

## QA checklist (preview theme)
- [ ] Open the Rubber Hex family page → it resolves to a real child (e.g. a
      Single) whose **title, SKU, price, images all agree**; no generic
      "Dumbbells" title with a mismatched price.
- [ ] Change Purchase Type / Set Type / Weight → moves to the correct child; each
      landing is coherent.
- [ ] No redirect loop; Back button works.
- [ ] A child opened directly (from Google) stays put (no bounce).
- [ ] Compare side-by-side with the Dual Adjustable Pulley PDP — behaviour matches.
- [ ] Mobile + desktop.

## Design note for the owner
This makes the family URL **land on a default child** (DAP model). If the parent
URL must instead remain a standalone landing page (per the "parent canonical =
parent URL" line in the July direction), that's a product/canonical decision to
confirm with Tim/Larianne before merge — the two are in slight tension and only
one can be the canonical family landing.

_Scope: this branch changes only the on-load redirect. It does not touch the
package→variant restructure, handle swap, publish/hide, feeds, or Boost._
