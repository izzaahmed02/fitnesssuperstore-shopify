# Independent Storefront QA — French Fitness Urethane 8 Sided Hex Dumbbell (Blank / No Logo)

**Reviewer:** Saliha (independent second-person storefront QA)
**Assignment:** Tim, 18 Aug 2026 — "Iqra and Saliha — independent desktop/mobile storefront QA after Izza's technical handoff and Larianne's content review."
**QA date:** 21 Aug 2026
**Store:** Fitness Superstore (Shopify Plus)
**Family status:** HOLD / Awaiting Owner — Unlisted / hidden. Not published, not orderable.
**Evidence source:** Shopify Admin API (live product/metafield/variant/inventory data), read-only.

---

## Method & scope note

This log records **data-layer QA verified against live Shopify records** for the
parent Combined Listing and all 37 child/set products — SKU, price, publication
status, inventory state, continue-selling policy, Product Code, warranty metafield,
media dimensions, and alt text. These are the values that drive the storefront PDP.

Two things this log does **not** claim, and that still require a human pass:

1. **Visual/interaction rendering on the live theme** (desktop + mobile) — the actual
   rendered no-logo image vs. circular-logo image, the "Notify Me" button behavior,
   and the option-selector routing as a shopper experiences it. This needs Izza's
   technical-handoff URLs/screenshots (bare parent URL routing to the correct child)
   before a shopper-view PASS can be signed.
2. **Warranty.** The metafield renders "1-Year Limited," but per Tim this remains
   **HOLD** until Larianne links the controlling source and exact approved wording.
   Not signed off here.

---

## Verified controls (all 38 records)

| Control | Expected | Result |
|---|---|---|
| Publication status | Unlisted / hidden | ✅ All 38 UNLISTED |
| Child inventory | −99 / Out of Stock | ✅ All 37 children −99 |
| Continue-selling (Add to Cart) | OFF | ✅ `inventoryPolicy: DENY` (verified on parent + 5/10/80/85/5-50) |
| Processing time | "Ships in 4-6 Weeks" | ✅ metafield present |
| Ships | "New in Manufacturer's Packaging" | ✅ standardized |
| $0 / blank price | none | ✅ every record priced |
| Blank Product Code | none | ✅ `custom.product_code` present (parent `FF-U8SHD-BLANK`) |
| Image resolution | ≥ 1080 × 1080 | ✅ sampled 2500² / 3000×2314 / 3500×2664 / 3500² |
| Media alt text | present, no-logo wording | ✅ e.g. "…5 lbs - Blank / No Logo" |

## Combined Listing selector (parent)

- **Purchase Type:** Single (Sold Individually) · Set — ✅
- **Weight:** 37 values — 30 singles (5–150 lbs) + 7 sets — ✅

## Required test paths (Tim's list)

| Path | SKU | Price | Status | Inventory |
|---|---|---|---|---|
| 5 lbs | FF-U8SHD5-BLANK | $16 | UNLISTED | −99 OOS ✅ |
| 80 lbs | FF-U8SHD80-BLANK | **$229** ✅ | UNLISTED | −99 OOS ✅ |
| 85 lbs | FF-U8SHD85-BLANK | **$239** ✅ | UNLISTED | −99 OOS ✅ |
| Set 5-50 | FF-U8SHD5-50-BLANK | $1,559 | UNLISTED | −99 OOS ✅ |
| Set 5-100 | FF-U8SHD5-100-BLANK | $5,959 | UNLISTED | −99 OOS ✅ |
| Set 5-150 | FF-U8SHD5-150-BLANK | $13,319 | UNLISTED | −99 OOS ✅ |
| Set 105-130 | FF-U8SHD105-130-BLANK | $4,039 | UNLISTED | −99 OOS ✅ |
| Set 135-150 | FF-U8SHD135-150-BLANK | $3,309 | UNLISTED | −99 OOS ✅ |

Corrected 80 lb = $229 and 85 lb = $239 both confirmed in live data.

---

## HOLD / follow-up items found

1. **Warranty (HOLD — carry forward).** Metafield = "1-Year Limited" but no controlling
   source/approved wording linked. Not signed off. → Larianne.
2. **Judge.me cached widget still references removed placeholder images.** The Judge.me
   `review_widget_data` metafield caches `image_url` values pointing at
   `PlaceholderComparisonChart_…png` (parent) and `ImageComingSoon.webp` (Set 5-50).
   The product's own featured media is correct, but Tim's checklist explicitly bars any
   path showing "Image Coming Soon" / the placeholder chart. **Needs a live-PDP eyeball
   to confirm the Judge.me widget does not surface these thumbnails.**
3. **Selector option ordering (minor).** In the parent "Weight" list, "5-150 lbs" appears
   after "105-130 lbs" instead of grouped with the other 5-x sets. Cosmetic; confirm intended.
4. **80 lb `product_weight_lbs` metafield = 85 (minor).** Not customer-facing on the tested
   selector paths; flag to Product Listings to confirm it's packaged weight, not an error.

## Independent QA result

**HOLD.** Data-layer controls PASS across all 38 records (status, price incl. corrected
80/85 lb, Out of Stock, continue-selling OFF, Product Code, media). Family correctly
remains Unlisted / not orderable.

Full shopper-view PASS is **pending**: (a) Izza's live-theme handoff URLs + screenshots,
(b) Larianne's warranty source, and (c) resolution of the Judge.me placeholder-image item.
Nothing published, changed, or made orderable during this QA.
