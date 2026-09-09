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

1. **Judge.me cached image data references placeholders on 32 of 38 records** (full 38-record recheck 09 Sep).
   `judgeme.review_widget_data.image_url`:
   - Parent → **PlaceholderComparisonChart** (removed from the product's own media, but still cached here).
   - **24 singles + all 7 sets** → **ImageComingSoon.webp** (singles: 15,20,25,30,35,40,45,60,70,75,85,90,95,
     100,105,110,115,120,125,130,135,140,145,150).
   - Only 4 singles cache the correct product webp (50,55,65,80); 5 and 10 cache none.
   The products' own featured media are correct; this is stale Judge.me cache. **Needs runtime confirmation that
   it does not surface to shoppers via the hosted Judge.me widget or rich snippet** — Tim's checklist bars any
   "Image Coming Soon"/placeholder on a customer path. This is broader than previously noted and is the open
   item Larianne/Izza flagged.
2. **70 lb single** is missing length/width/height dimension metafields (minor Tech Specs gap).

_Full-38 recheck also confirmed: all 38 records are UNLISTED and all carry `inventoryPolicy: DENY`
(continue-selling OFF) — no exceptions._

## 6. Independent shopper-view QA — staged, gated

The 3-device incognito pass (US desktop, iOS Safari, Android Chrome) is built and ready but **cannot be
executed until Ayyaz posts the unpublished desktop/mobile preview + runtime evidence** (parent Add-to-Cart /
availability-schema, Notify Me, Processing Time, and the Judge.me exposure above) and Masum's feed acceptance
lands. As the Sep 4 checkpoint has passed, Ayyaz's preview status is the current blocker.

## 7. Reconciliation against the shared records (read 09 Sep)

- **38-record evidence matrix (1G861…):** agrees with live Shopify on every status field — all 38
  Unlisted/Hidden, −99, not orderable, sell-when-OOS OFF; 80 lb $229 / 85 lb $239; processing_time
  2-3 Weeks / long "…2-3 Weeks + Transit Time" / filter "2-5 weeks"; warranty ACCEPTED (French Fitness
  Warranty page, Accessories & Free Weights, 1-year limited parts). Owner **Ayyaz**, Status **Ongoing /
  publication HOLD**. Gate order: consolidated preview → Masum feed acceptance → Iqra/Saliha independent
  QA → READY FOR TIM REVIEW → Tim written GO. Matrix records PlaceholderComparisonChart as "removed."
  Matrix container ETA was 2026-09-06 (now passed) — but per Tim, invoice/ETA ≠ physical receipt, so
  Out of Stock / HOLD stands.
  - **Gap:** the matrix has **no Judge.me column**, so the stale `ImageComingSoon` / `PlaceholderComparisonChart`
    cache found in live Shopify (§5.1) is **not recorded** there. Recommend adding it as an open QA row.
  - The matrix parent row still lists "Izza Combined-Listing QA + Larianne warranty PASS-HOLD" as pending —
    stale, since Larianne's review role moved to Iqra/Saliha on Sep 2.
- **Controlled combined-listing plan (1wGd6…):** is the **Rubber Coated Hex Dumbbell** family plan, not this
  Urethane Blank family. Useful only as the reference method/standard — selector-to-offer chain, self-canonical
  per child, parent excluded from GMC feed, child-leakage suppression in search/predictive/Boost/collections,
  exactly one Product JSON-LD + one AggregateRating per page with Judge.me Rich Snippets OFF (no code change).
  The independent shopper QA should mirror these checks for the Urethane family.
- **Remediation Brief (122Vl…):** sets the Iqra/Saliha independent-QA scope — logged-out U.S. desktop/mobile
  evidence covering query, predictive/full search, family card, selector, URL, price, media, SKU, cart, Back,
  canonical, and child leakage — within 1 business day of the preview. Release gate: PRE-STAGE / PRODUCTION HOLD.
- **Could not verify:** FS Product Listings **Row 1079** (not present in the sheet export obtained — only
  bumper-plate "Blank" rows were), and the **Monday item** (no Monday read tool available this session).

## Result

Product Listings data-layer review: **PASS on record fields** (corrections done, processing-time matches the
approved decision, warranty consistent, 7 sets reconcile). **One open runtime item** (Judge.me placeholder
exposure) + a minor 70 lb dimensions gap. Independent shopper-view QA remains **HOLD**, gated on Ayyaz's
preview handoff. Family stays HOLD / Awaiting owner sign-off; final release still requires "READY FOR TIM
REVIEW" + Tim's written GO in the canonical product thread.
