# FF-U8SHD-BLANK: preview evidence packet (read-only), 2026-10-07

Scope: evidence plus one scoped theme fix (`assets/custom.js`, Weight row). No Shopify data, inventory, feed or publication change.
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

## Findings (corrected 2026-10-07)
1. **Parent redirect is by design.** `redirectCombinedListingToVariant()` in `assets/product-info.js` forwards a bare parent URL to the checked child (Playwright recorded parent, then 5 lbs single child). Not a defect; the brief first paint of the parent is part of that behaviour.
2. **Weight row empty on every child page (defect, fixed on this branch, tested).**
   - `assets/custom.js` `setup()` hides a Weight pill unless it is in the family variants map (`script[data-product-variants-map]`). With no map it falls back to hiding pills carrying the `disabled` class, which marks both non-existent and sold-out combinations.
   - Live child pages emit no variants map (0 found on the Blank 25 lbs child and on a live Rubber Hex child), so the fallback is the normal path on this site.
   - Every Blank child is out of stock, so all 37 pills are flagged and the whole row is hidden. In-stock families only lose their impossible combinations, so they look correct.
   - Fix: when there is no map and every pill is flagged, infer existence from the option name (ranges such as "5-50 lbs" are Sets, plain weights are Singles). Families with any stock take the old path.
3. **"As high as $99.00 / You save $83.00" on the 5 lbs child** comes from `custom.retail_price` = 9900 (compare-at is null on all 38 records). The regular 5 lbs sibling `FF-U8SHD5` has the same value, so it is not specific to the Blank family. Pricing-display decision for Tim.
4. Admin API reports the parent's 37 variants as availableForSale = true, but the live storefront does not allow a purchase: Add to Cart is disabled and schema reads OutOfStock.
5. An UNLISTED product is still reachable by direct URL (HTTP 200); it is noindex. The earlier note that the URL "does not open while Unlisted" is not accurate.
6. The 1-2 week message is hidden by the theme while children are out of stock, so it cannot be previewed until inventory is positive (production change, needs Tim's written GO).

## Weight-row fix test (`weight-row-fix/`)
Method: headless Chromium against the live pages, serving this branch's `assets/custom.js` in place of the live file (route interception; request served once per page, so the patch was in effect). Live site and theme were not modified.

| Page | Before (live code) | After (this branch) |
|---|---|---|
| Blank 25 lbs single, desktop 1440 | 0 Weight pills | 30 (5 lbs to 150 lbs, none are set ranges), 25 lbs selected |
| Blank 5-50 lbs set, desktop 1440 | 0 | 7 (5-50 to 135-150) |
| Blank 25 lbs single, mobile 375 | not run | 30 |
| Rubber Hex 12.5 lbs single (in stock, control) | 36 | 36 (unchanged) |
| Parent URL | lands on 5 lbs single child | same |
| Click "10 lbs" pill after the fix | n/a | navigates to the 10 lbs single child |

Screenshots: `before-child25-desktop.png`, `after-child25-desktop.png`, `after-child25-mobile.png`, `after-set550-desktop.png`. After the fix the page still shows "Out of stock" and a disabled Add to Cart.
Not tested: real devices, preview theme from this branch, mixed in-stock/out-of-stock families, other combined families, keyboard use.

## Preview theme verification (theme 189008838972, branch `claude/tender-fermi-0mn1sy`)
Preview link: https://www.fitnesssuperstore.com/?preview_theme_id=189008838972 (unpublished theme; live theme 186120208700 is `main`).
Method: headless Chromium, desktop 1440 px (mobile 375 px where noted), each page loaded on the live theme and on the preview theme; `window.Shopify.theme.id` confirmed which theme served each load. Plus two screenshots taken by Ilsaa in Chrome on the preview theme (`ilsaa-chrome-preview-*.webp`), showing the Weight row populated.

| Page | Live (main) Weight pills | Preview theme Weight pills |
|---|---|---|
| Blank parent URL (lands on 5 lbs single) | 0 | 30 |
| Blank 25 lbs single | 0 | 30 |
| Blank 150 lbs single | 0 | 30 |
| Blank 5-50 lbs set | 0 | 7 (Set selected) |
| Blank 135-150 lbs set | 0 | 7 |
| Blank 25 lbs single, mobile 375 | n/a | 30 |
| Blank parent, mobile 375 | n/a | 30 |
| Control: Rubber Coated Hex 12.5 lbs single (in stock) | 36 | 36 |
| Control: Rubber Coated Hex set 55-75 lbs (in stock) | 12 | 12 |
| Control: Cast Iron Kettlebell set 5-30 (different picker) | no Weight picker | no Weight picker |

- Add to Cart stays disabled and the page stays "Out of stock" on all Blank pages in both themes; in-stock controls keep an enabled Add to Cart.
- Full-page screenshots: `preview-parentLanding-*`, `preview-single25-*`, `preview-set550-desktop-fullpage.png`.
- The first headless load of the 5-50 set on the preview theme returned an empty read (page had not rendered); a re-run of that page alone returned 7 pills with Set selected.
- Not tested: real phones, mixed in-stock/out-of-stock families, Boost/collection pages, cart/checkout, feeds, other combined families beyond the controls above.

## Tim's Oct 7 rulings and status
| Item | Status |
|---|---|
| Processing-time update (1-2 weeks) | Closed; no repeat edit. See finding 7 for a separate add-on issue. |
| $16 selling price | Unchanged. Retail reference ($99): Larianne owns; Tim approved her logic, then said retail prices are no longer entered and can be removed. Needs one clarification from Tim/Larianne before any edit. Not part of this PR. |
| Warranty | Keep "1-Year Limited" as the short value; detailed text to use "1-year limited parts warranty (breakage or failure)" with the policy linked (https://www.fitnesssuperstore.com/pages/french-fitness-warranty). Not edited; exact location of the detailed text still to be confirmed. |
| Release plan | See "Release plan (proposal)". Nothing assigned to the native parent. Children stay UNLISTED. |
| PR, final commit, preview, rollback | See below. Branch reconciled with main on Oct 7. |
| Mixed-stock selector check | Done (simulated; see below). |
| Independent desktop + physical iOS/Android QA, Judge.me, Masum feed check | Pending (Iqra/Saliha, Masum). |
| Matrix and row 1079 update | Pending; text prepared below. Preserve prior evidence. |
| Stock/source mapping | BLOCKED: needs per-weight counts for the physical blanks (see below). |

## Final commit, preview, rollback
- Branch `claude/tender-fermi-0mn1sy`; reconciled with `main` (merge, no rebase) on Oct 7; branch is 0 commits behind main at the time of writing. Code difference from main: `assets/custom.js` only (+13/-1 lines).
- Preview theme: https://www.fitnesssuperstore.com/?preview_theme_id=189008838972 (re-verified after the merge: Blank 25 lbs single 30 pills, 5-50 set 7, Rubber Hex control 36).
- Rollback: revert the merge commit of this PR on main (restores the previous `assets/custom.js`); no data or settings change is involved in this PR.

## Mixed-stock selector check (`mixed-stock/`)
No live combined family currently has mixed stock (every Rubber Hex child is in stock; every Blank child is sold out), so this was simulated on the real Blank child pages: page HTML was edited in the browser to mark chosen weight options as in stock, then the page was run with `custom.js` from `main` and with this branch's file.

| Case | main | this branch |
|---|---|---|
| All sold out (single page) | 0 pills | 30 pills (intended change) |
| 10, 25, 50 lbs in stock (single page) | 3 pills | 3 pills (identical) |
| Only 150 lbs in stock (single page) | 1 pill | 1 pill (identical) |
| 5-50 and 5-100 sets in stock (set page) | 2 pills | 2 pills (identical) |

Limit: simulated stock state, not real inventory; not run on a physical device. An early run returned zeros because the site throttled repeated requests; the final run used retries and shows HTTP 200 on every simulated case.

## Additional finding 7: stale "4-6 Weeks" Processing Time add-on on the children
- Each Blank child has `options.product_options` metaobjects with two mandatory, hidden options: Warranty ("1-Year Limited") and Processing Time. The Processing Time option points to variant 51461542904124 ("Ships from our Warehouse in 4-6 Weeks + Transit Time") of the shared add-on product "Processing Time (346)".
- Checked: 29 of the 30 singles and the 5-50 and 5-60 sets have this value. The 80 lbs single has no option records at all. The other 5 sets (5-75, 5-100, 105-130, 5-150, 135-150) were not checked.
- Why it matters: `assets/product-form-with-options.js` writes each selected `[data-select-option]` value into the cart line properties, so a purchase would carry "Processing Time: Ships from our Warehouse in 4-6 Weeks + Transit Time". Not tested with a real cart (items cannot be added while out of stock).
- A matching variant already exists on the same add-on product: "Ships from our Warehouse in 1-2 Weeks + Transit Time" (variant 51461543756092). Do not edit the shared add-on product's variant titles; the scoped fix is to repoint the 37 children's Processing Time option records (`product_option_variants` and `product_option_sets_default`) from 51461542904124 to 51461543756092, with the before-values exported. Data change; needs Tim's written GO as its own request.

## Release plan (proposal; each step is a separate approval request)
Nothing below is authorized. Native parent: no inventory, no SKU, no price change.
1. **R1 Code**: merge this PR (`assets/custom.js`) to main, tied to the exact final commit. Revert: revert the merge commit.
2. **R2 Data, Processing Time add-on**: repoint the 37 children's Processing Time option to variant 51461543756092 (finding 7); also add the missing Warranty/Processing Time option records on the 80 lbs single (or confirm it is intentionally without). Before-state: variant 51461542904124 (exported per record). Revert: restore exported values.
3. **R3 Data, retail reference and warranty detail**: per Tim's rulings and Larianne's scoped change; separate requests, not in this PR.
4. **R4 Catalog and inventory release** (cannot be specified yet): child records with confirmed, allocatable stock get a positive quantity at the named location; children without stock stay at -99 / DENY; children stay UNLISTED unless a specific alternative is approved; the parent is only changed in status if Tim approves that exact step after QA. Needs the stock/source mapping below. Before-state: all 38 UNLISTED, children -99 / DENY.

## Stock/source mapping: not available to me
- Per-weight counts are not in any thread or file I can read (the ETA sheet is not shared with this account). Needed from Brian/Emil/Umer: counts per weight for the physical blanks that belong to this listing.
- Tim's Sept 20 container note says WHITE blanks are for stock and photos and BLACK blanks are for customer order CX 48001 (do not list). Confirm which physical colour this listing represents, and exclude units allocated to CX 48001 before any quantity is set.

## Matrix and row 1079 update text (for Larianne's matrix; preserve prior evidence, append)
Column T "Current Combined PDP Owner / Acceptance Gate" (parent and all 37 children): `Owner: Ilsaa (combined-listing executor; Tim, Oct 1-2). Technical: Izza. QA: Iqra/Saliha (desktop + physical iOS/Android, Judge.me). Feed: Masum (read-only). Status: HOLD. Processing-time update (1-2 weeks) complete; no repeat edit. Selector fix on branch claude/tender-fermi-0mn1sy, PR open, preview theme 189008838972. Remaining gates: independent QA; stock/source mapping; add-on Processing Time repoint (finding 7); retail reference per Larianne/Tim; warranty detail wording; READY FOR TIM REVIEW; separate written GO for code (R1) and catalog/inventory (R4). No merge, publication, inventory change or deployment authorized.`
Column S "Latest Processing-Time Execution / ETA Evidence": append `SUPERSEDED/UPDATED: 1-2 weeks applied 2026-09-11 (Saliha), verified 2026-10-06 (Ilsaa): Ships in 1-2 Weeks / Ships from our Warehouse in 1-2 Weeks + Transit Time / Ships in 2 weeks or less on parent + 37 children. Hidden Processing Time add-on option still reads 4-6 Weeks (see packet finding 7).`

## Limits of this packet
- Captured from a cloud browser, not from a physical iOS/Android device; Iqra/Saliha device QA is still required.
- 4 of 6 page loads hit the 60 s `networkidle` wait; the content rendered and DOM facts were collected (see `httpStatus` in the report). A direct curl of the parent returned HTTP 200.
- Not tested: Back navigation, cart/checkout, feeds (Masum), Judge.me.
