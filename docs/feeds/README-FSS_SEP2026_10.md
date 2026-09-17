# promotion_id supplemental — FSS_SEP2026_10 (September Overstock Sale)

Built 17 September 2026 from the **live Shopify automatic discount**, which is the
only source that decides what actually discounts at checkout.

- Discount: `gid://shopify/DiscountAutomaticNode/1741840056636`
- Title: "September Overstock Sale — 10% Off Select French Fitness Products"
- Status ACTIVE, 10% off, `startsAt` 2026-09-08T07:00:00Z, `endsAt` 2026-10-01T06:59:59Z

## Two discrepancies against Tim's 14 September instruction

**1. The discount covers 17 products, not 16.** Tim's instruction names "exactly the
16 September Overstock SKUs" and asks Larianne to confirm the 16-product list is
final. The live discount carries 17. All 17 are listed in the CSV. If the list is
16, delete the one row Larianne names before uploading — do not guess which.

Mapping 16 of 17 is safe from Google's side: a product that discounts at checkout
but is not badged is not a disapproval. The reverse — badged but not discounted —
is, and cannot happen here because this file is derived *from* the discount.

**2. The discount end date is not Sep 30 5:00 PM Pacific.** It ends
2026-10-01T06:59:59Z = **Sep 30 11:59:59 PM PDT**, where the GMC promotion window
ends Sep 30 5:00 PM. This is the safe direction — the ad badge expires about seven
hours *before* the checkout discount, so the badge never outlives the discount —
but it is a mismatch against what Tim specified and is Izza's item 3 to confirm.
The discount also starts Sep 8, eight days before the promotion window, which is
likewise harmless.

## Why every id is a plain SKU

All 17 products are ACTIVE, vendor French Fitness, single-variant, and priced from
$549 to $4,699 — all above the $100 feed floor. No product needs a composite
variant id, and none is excluded by the price floor.

## Rows

| id (SKU) | product | price |
|---|---|---|
| FF-FSR100 | FSR100 Commercial Functional Smith Rack System | 3,999.00 |
| FF-FSR90 | FSR90 All-in-One Smith Machine, Functional Trainer & Squat Rack | 3,299.00 |
| FFM-CLPS | Monster Compact Plate Loaded Leg Press Sled | 799.00 |
| FF-MFAB-ACLE-V2 | Multi Functional Adjustable Bench V2 w/Arm Curl + Leg Ext | 549.00 |
| FFS-SBE | Shasta Selectorized Back Extension | 2,499.00 |
| FFS-SHC | Shasta Selectorized Horizontal Calf | 2,499.00 |
| FFS-DAP | FFS Silver Dual Adjustable Pulley | 3,099.00 |
| FFS-HAA | Shasta Hip Abductor / Adductor Inner & Outer Thigh Machine | 2,799.00 |
| FFS-LPDLR | Shasta Lat Pulldown / Low Row Selectorized Machine | 2,799.00 |
| FFS-PFRD | Shasta Pec Fly / Rear Delt | 2,799.00 |
| FFT-PCFR | Tahoe Power Cage / Full Rack | 1,899.00 |
| FF-SRFT8 | SRFT8 All-in-One Squat Rack Functional Trainer / Cable Trainer | 2,699.00 |
| FF-APGT-1450 | 14 ft x 50 ft Artificial Gym Turf Track with Start Marker | 4,699.00 |
| FF-FSR50 | FSR50 All-in-One Home Gym Smith Machine + Dual Cable Rack | 2,799.00 |
| FF-FSR60 | FSR60 All-in-One Smith Machine + Cable Squat Rack | 2,799.00 |
| FF-FSR70 | FSR70 Dual Cable Smith Machine + Half Rack System | 2,799.00 |
| FFB-OSR | FFB Black Commercial Olympic Squat Rack / Squat Stand | 1,899.00 |

## Upload rules that matter

This is a **new, separate** supplemental source. It must **not** be uploaded over
`supplemental_priority_labels_v2.csv` — re-uploading anything to that source wipes
`custom_label_3` / `custom_label_4` and takes the Product Lines asset groups dark,
per Tim's 6 September coordination warning. It carries only `id` and
`promotion_id`; a supplemental only overwrites the columns it contains.

It must link to **both serving legacy primaries** (the ones Google serves today),
not the PR #830 generated files — cutover has not happened.
