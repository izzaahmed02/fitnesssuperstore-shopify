# FF-U8SHD-BLANK: preview evidence packet (read-only), 2026-10-07

Scope: evidence only. No theme code, Shopify data, inventory, feed or publication change is made by this branch.
Parent (UNLISTED, template `combined-listings`): https://www.fitnesssuperstore.com/products/french-fitness-urethane-8-sided-hex-dumbbells-blank-no-logo-new

## Method
- Shopify Admin API read-back on 2026-10-06 (parent + 37 children/sets).
- Public storefront capture on 2026-10-07 with headless Chromium (`capture.js`): desktop 1440 px and mobile 375 px, full-page screenshots, DOM facts in `capture-report.json`.
- Pages: parent, 25 lbs single, 5-50 lbs set. Screenshots show the cookie banner (overlay, not a defect).

## Admin API read-back (2026-10-06)
| Check | Result |
|---|---|
| Records | parent + 37 (30 singles, 7 sets); count query = 37 exact |
| Status | all UNLISTED; parent tags `hidden`, `REMOVE FROM FEEDS` |
| Children | inventory -99, policy DENY, availableForSale false (37/37) |
| Processing time (all 38) | "Ships in 1-2 Weeks" / "Ships from our Warehouse in 1-2 Weeks + Transit Time" / filter "Ships in 2 weeks or less" |
| Parent stored prices | equal to all 37 child prices; parent SKUs blank (same as Rubber Hex parent) |
| Parent variants | availableForSale true (37/37) per Admin API (see storefront result below) |

## Storefront capture (2026-10-07)
| Page | Final URL | Add to Cart | Schema/meta availability | robots | Processing Time shown |
|---|---|---|---|---|---|
| Parent (desktop + mobile) | redirects to the 5 lbs single child; Weight row empty | disabled | OutOfStock | noindex,nofollow | no (hidden while out of stock, by theme design) |
| 25 lbs single | same URL | disabled | OutOfStock | noindex,nofollow | no |
| 5-50 lbs set | same URL | disabled | OutOfStock | noindex,nofollow | no |

- Mobile screenshot shows "Notify me when available" and Product Code FF-U8SHD5-BLANK; prices $16.00 (5 lbs), $72.00 (25 lbs), $1,559.00 (5-50 set), matching Shopify.
- Search exposure: the family does not appear in predictive search (`urethane 8 sided blank`, `FF-U8SHD5-BLANK`) or full search (`FF-U8SHD25-BLANK`). Product sitemap not checked.
- No JavaScript page errors were recorded on any capture.

## Findings (corrected 2026-10-07 after a real-browser report)
Status: **HOLD**. The pages are not ready to show as a go-live preview.

1. **Parent flashes, then redirects.** The parent URL first paints the parent page (full Weight picker), then navigates by JavaScript to the 5 lbs single child (Playwright recorded two main-frame navigations: parent, then `...5-lbs-single-blank-no-logo-new`).
2. **Weight row is empty on every child page.** All 37 Weight options are rendered with the HTML `hidden` attribute. Cause chain, verified:
   - `assets/custom.js` `setup()` hides a Weight pill unless it is in the family variants map (`script[data-product-variants-map]`); with no map it falls back to hiding pills that carry the `disabled` (sold-out) class.
   - The live 25 lbs child emits **no** `data-product-variants-map` script (0 found), although `sections/main-product.liquid` emits one when `product.combined_listing.parent_product` is present.
   - Every child is out of stock, so every pill is disabled, so all 37 are hidden.
   - Not yet established: why `parent_product` is blank on the live child pages (parent UNLISTED is one candidate; untested). The live theme is `fitnesssuperstore-shopify/main` (role main), so this is the code in `main`.
   - Whether the row appears once children have positive inventory is untested.
3. **"As high as: $99.00 / You save $83.00" on the 5 lbs child** comes from `custom.retail_price` = 9900, not from compare-at (compare-at is null on all 38 records). The regular 5 lbs sibling `FF-U8SHD5` has the same value (9900), so this is not specific to the Blank family; it is a pricing-display decision for Tim.
4. Admin API reports the parent's 37 variants as availableForSale = true, but the live storefront does not allow a purchase: Add to Cart is disabled and schema reads OutOfStock.
5. An UNLISTED product is still reachable by direct URL (HTTP 200); it is noindex. The earlier note that the URL "does not open while Unlisted" is not accurate.
6. The 1-2 week message is hidden by the theme while children are out of stock, so it cannot be previewed until inventory is positive (production change, needs Tim's written GO).

No theme code is changed on this branch. Any fix for findings 1-2 touches shared picker code (`assets/custom.js`, `sections/main-product.liquid`) and needs Izza's review.

## Limits of this packet
- Captured from a cloud browser, not from a physical iOS/Android device; Iqra/Saliha device QA is still required.
- 4 of 6 page loads hit the 60 s `networkidle` wait; the content rendered and DOM facts were collected (see `httpStatus` in the report). A direct curl of the parent returned HTTP 200.
- Not tested: child-to-child selector transitions, Back navigation, cart/checkout, feeds (Masum), Judge.me.
