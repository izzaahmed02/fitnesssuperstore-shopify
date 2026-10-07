# FF-U8SHD-BLANK: preview evidence packet (read-only), 2026-10-07

Scope: evidence only. No theme code, Shopify data, inventory, feed or publication change is made or proposed by this branch.
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
| Parent (desktop + mobile) | redirects to the 5 lbs single child | disabled | OutOfStock | noindex,nofollow | no (hidden while out of stock, by theme design) |
| 25 lbs single | same URL | disabled | OutOfStock | noindex,nofollow | no |
| 5-50 lbs set | same URL | disabled | OutOfStock | noindex,nofollow | no |

- Mobile screenshot shows "Notify me when available" and Product Code FF-U8SHD5-BLANK; prices $16.00 (5 lbs), $72.00 (25 lbs), $1,559.00 (5-50 set), matching Shopify.
- Search exposure: the family does not appear in predictive search (`urethane 8 sided blank`, `FF-U8SHD5-BLANK`) or full search (`FF-U8SHD25-BLANK`). Product sitemap not checked.
- No JavaScript page errors were recorded on any capture.

## Findings
1. The Admin API reports the parent's 37 variants as availableForSale = true, but the live storefront does not reproduce a purchasable parent: the parent redirects to a child, Add to Cart is disabled, schema reads OutOfStock. This is evidence for Tim's Sept 1 parent/child risk, not a fix.
2. An UNLISTED product is still reachable by direct URL (HTTP 200 via curl on 2026-10-07). It is noindex and out of stock. The earlier statement that the URL "does not open while Unlisted" is not accurate.
3. The 1-2 week message cannot be shown in any preview while children are out of stock; it is hidden by `main-product-comb.liquid` (and the stored value is correct on all 38 records). Showing it needs positive inventory, which is a production change that needs Tim's written GO.

## Limits of this packet
- Captured from a cloud browser, not from a physical iOS/Android device; Iqra/Saliha device QA is still required.
- 4 of 6 page loads hit the 60 s `networkidle` wait; the content rendered and DOM facts were collected (see `httpStatus` in the report). A direct curl of the parent returned HTTP 200.
- Not tested: child-to-child selector transitions, Back navigation, cart/checkout, feeds (Masum), Judge.me.
