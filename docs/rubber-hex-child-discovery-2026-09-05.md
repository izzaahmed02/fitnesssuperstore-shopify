# Rubber Hex: real child cards — preview, not production activation

## New approved business requirement
On September 5, 2026, Tim replaced the prior parent-only onsite merchandising requirement with separate Rubber Hex child cards, matching the Black/Silver DAP example: own child product ID, real variant ID, SKU, title, price, image and direct product link. Retain the exact native 54-child family (36 singles, 12 sets, six packages) and its PDP selector. Do not copy the reference screenshot's permanent MSRP.

## What this candidate implements
- Reusable `rh-child-card` Liquid snippet renders current Shopify product/variant values, not a hardcoded price manifest.
- Isolated alternate `search.rh-child-review` and `collection.rh-child-review` templates contain the exact 54 children in two product lists of 27. This avoids both a 20-handle `all_products` implementation and a single 50-iteration loop.
- Read-only, local SKU/title/weight filter with a 54-unique-product guard. Exact SKU takes precedence. No cart, product, index, credential or storage mutation.
- Responsive two-column mobile / three-column tablet / four-column desktop cards; visible SKU, native sell price, own shipping text/review count/availability. No family minimum substituted for a child's price, no fabricated reviews, no fake MSRP.

## Important boundary
This is a data-backed presentation preview and reusable renderer, NOT a replacement for the store-wide Boost index. It intentionally enumerates the 54 approved products. It does not establish current membership of the collection used to open the alternate view, perform global search relevance/facets/pagination, or activate predictive search. Do not call the production index fixed from this preview.

## Remaining integration before final approval
1. Identify current Boost Combined Listing grouping and parent/child exclusions. Use the existing Boost lane; do not switch engines or globally change all product families.
2. Stage an exact family-scoped change so matching real children are returned, without injecting cards after pagination or inventing counts. Search by SKU must resolve the correct child, not an equal-title legacy variant.
3. Use each result's own product/variant fields. Render the supplied snippet on native surfaces; for Boost's app-owned renderer, implement equivalent field mapping within its controlled template.
4. Confirm actual intended Dumbbells/Rubber Dumbbells collection IDs/rules. Do not add products to feed-source, Meta Pilot or utility/index collections as a shortcut. Existing 54 children have hidden/seo.hidden controls; those are shared catalog data, not preview-only switches. Preserve them until an exact approved index/SEO/feed impact plan exists.
5. Capture predictive search, full search, filtered results, sorting and all pagination pages on the actual engine, then each child URL/cart ID, 54-row coverage and real iOS/Android checks. Keep unrelated products/collections unchanged. Do not reduce 54 products to 48 or 50 to work around a filter constraint.
6. Suppress the synthetic parent and equal-offer legacy duplicates from intended onsite discovery at approved cutover, without archiving or changing current serving feeds prematurely. FF-RCHD5-70-R remains its separate unchanged Phase One offer.
7. Keep Google canonical/indexability, review groups, discounts, prices, inventory, feed IDs/status, parent publication and handle/legacy archive operations in their existing separate approval gates.

## Release and rollback
DRAFT / DO NOT MERGE OR PUBLISH. No existing theme files are changed. The alternate views are only on an unpublished copy. Rollback before release is to stop using the preview and close this draft PR; no catalog rollback is needed. Do not publish the whole copied theme. Review the exact final diff, integrate only approved changes and preserve current production app settings and later pricing work.

## Native platform notes
Shopify Search & Discovery supports child-only Combined Listing search, but the current store uses Boost on live search/collections. Native settings may not control that engine. seo.hidden=1 affects native search, Google and sitemap visibility together; an onsite-card request is not a blanket Google-indexing approval.

Official references:
- https://help.shopify.com/en/manual/online-store/search-and-discovery/search
- https://help.shopify.com/en/manual/online-store/storefront-search/managing-searchability
- https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings#product_list
