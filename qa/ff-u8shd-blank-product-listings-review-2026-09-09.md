# Product Listings Review + Independent QA status — FF Urethane 8 Sided Hex Dumbbell (Blank / No Logo)

**Owner (this review):** Saliha + Iqra — Product Listings review role (reassigned from Larianne) plus independent second-person QA.
**Review date:** 09 Sep 2026
**Primary/technical DRI:** Ayyaz. **Senior review:** Izza. **Feed:** Masum.
**Publication:** HOLD — Unlisted / hidden / Out of Stock / DENY / non-orderable. No changes made during review (read-only).
**Evidence source:** live Shopify Admin API. Detailed product evidence belongs in the canonical product thread + 38-record matrix; this file is the working record only.

---

## 1. Hafiz's returned corrections — VERIFIED in live Shopify

| Record | Correction required (Larianne, Aug 28) | Live state 09 Sep | Result |
|---|---|---|---|
| FF-U8SHD80-BLANK | fix product_weight_lbs + productnameshort | product_weight_lbs = **80**; productnameshort present | ✅ Fixed |
| FF-U8SHD55-BLANK | fix MPN + Vendor Part No | mpn = FF-U8SHD55-BLANK; vendor_part_no = FF-U8SHD55-BLANK | ✅ Fixed |
| FF-U8SHD70-BLANK | add missing product weight | product_weight_lbs = **70** | ✅ Fixed |
| FF-U8SHD90-BLANK | remove "(New)" from productnameshort | productnameshort has no "(New)" | ✅ Fixed |
| FF-U8SHD135-150-BLANK | add product_weight_lbs + productnameshort | product_weight_lbs = **1140** (=total set, pairs); productnameshort present | ✅ Fixed |
| Parent selector | set order 5-50, 5-60, 5-75, 5-100, 5-150, 105-130, 135-150 | live order matches exactly | ✅ Fixed |

## 2. Processing-time — matches Tim's Sep 2 approved decision (not reopened)

Verified on parent + 55/70/80/90/135-150 singles + all 7 sets:
- `processing_time` = **"Ships in 2-3 Weeks"** ✅
- `processing_time_long` = **"Ships from our Warehouse in 2-3 Weeks + Transit Time"** ✅
- `processing_time_filter` = **"Ships in 2-5 weeks"** ✅

## 3. Warranty — consistent with accepted source

`custom.warranty` = "1-Year Limited" across the family; controlling source accepted
(French Fitness free weights / Accessories & Free Weights warranty page). ✅

## 4. Seven set records — row-level check

| Set | product_weight_lbs (total, pairs) | Proc. time | Filter | Name / warranty / code |
|---|---|---|---|---|
| 5-50 | 550 | 2-3 Wks | 2-5 wks | ✅ |
| 5-60 | 780 | 2-3 Wks | 2-5 wks | ✅ |
| 5-75 | 1200 | 2-3 Wks | 2-5 wks | ✅ |
| 5-100 | 2100 | 2-3 Wks | 2-5 wks | ✅ |
| 5-150 | 4650 | 2-3 Wks | 2-5 wks | ✅ |
| 105-130 | 1410 | 2-3 Wks | 2-5 wks | ✅ |
| 135-150 | 1140 | 2-3 Wks | 2-5 wks | ✅ |

Set weights all reconcile to the sum of the included pairs. Set-includes tables / Tech Specs /
rack-option applicability live in linked metaobjects and are staged for the shopper-view pass.

## 5. Open items (carry to Ayyaz / Izza runtime pass)

1. **Judge.me cached image data still references placeholders.** `judgeme.review_widget_data.image_url`
   still points to **ImageComingSoon.webp** on all 7 sets and the 70 lb + 90 lb singles, and to the old
   **PlaceholderComparisonChart** on the parent (cache dates June–July 2026; the products' own media are
   correct). The 55 lb and 80 lb singles now cache correct product webp images. **Needs runtime confirmation
   that this cached data does not surface to shoppers via the hosted Judge.me widget or rich snippet** — this
   is the item Larianne/Izza flagged and it is still open.
2. **70 lb single** is missing length/width/height dimension metafields (minor Tech Specs gap).

## 6. Independent shopper-view QA — staged, gated

The 3-device incognito pass (US desktop, iOS Safari, Android Chrome) is built and ready but **cannot be
executed until Ayyaz posts the unpublished desktop/mobile preview + runtime evidence** (parent Add-to-Cart /
availability-schema, Notify Me, Processing Time, and the Judge.me exposure above) and Masum's feed acceptance
lands. As the Sep 4 checkpoint has passed, Ayyaz's preview status is the current blocker.

## Result

Product Listings data-layer review: **PASS on record fields** (corrections done, processing-time matches the
approved decision, warranty consistent, 7 sets reconcile). **One open runtime item** (Judge.me placeholder
exposure) + a minor 70 lb dimensions gap. Independent shopper-view QA remains **HOLD**, gated on Ayyaz's
preview handoff. Family stays HOLD / Awaiting owner sign-off; final release still requires "READY FOR TIM
REVIEW" + Tim's written GO in the canonical product thread.
