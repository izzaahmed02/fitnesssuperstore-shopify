# FF-U8SHD-BLANK — Combined Listing Technical Audit

**Family:** French Fitness Urethane 8 Sided Hex Dumbbells - Blank / No Logo (New)
**Parent:** `gid://shopify/Product/10419704987964` · Product Code `FF-U8SHD-BLANK`
**Scope:** 1 parent + 37 child/set records (38 total)
**Audit date:** 2026-08-22
**Owner:** Izza (technical) · Assignment: Tim, "Re: Task Assignment and Tracking", 2026-08-22
**Disposition:** HOLD. Nothing published, archived, redirected, deleted, made discoverable, or made orderable. No theme/GitHub code changed.

---

## 1. Method and coverage limit

Verified directly against the live Shopify Admin API and against the connected theme
source in this repository.

**Not covered here:** rendered desktop/mobile shopper-view proof (screenshots /
screen recording). `www.fitnesssuperstore.com` is unreachable from the audit
environment — the outbound network policy rejects it at the proxy
(`CONNECT tunnel failed, response 403`), so no page could be loaded or captured.
Every item below marked **RENDER-PENDING** needs a browser pass to close.

---

## 2. Record structure — PASS

- All 38 records are `UNLISTED`. Parent carries `seo.hidden = 1`.
- Parent `combinedListingRole = PARENT`; all **37 children are linked**, each to the
  correct parent variant. Full mapping verified 1:1 — every `N lbs` single maps to
  its `FF-U8SHDN-BLANK` child, and all seven sets map to their set records.
- Parent options: `Purchase Type` (Single (Sold Individually), Set) + `Weight` (37 values).
- All 37 children: inventory `-99`, `inventoryPolicy = DENY`, `availableForSale = false`.
- Spot-checked option paths resolve to the expected child, SKU and price:

| Path | Child SKU | Price |
|---|---|---|
| 5 lbs | FF-U8SHD5-BLANK | $16 |
| 80 lbs | FF-U8SHD80-BLANK | $229 |
| 85 lbs | FF-U8SHD85-BLANK | $239 |
| 5-50 lbs | FF-U8SHD5-50-BLANK | $1,559 |
| 5-100 lbs | FF-U8SHD5-100-BLANK | $5,959 |
| 5-150 lbs | FF-U8SHD5-150-BLANK | $13,319 |
| 105-130 lbs | FF-U8SHD105-130-BLANK | $4,039 |
| 135-150 lbs | FF-U8SHD135-150-BLANK | $3,309 |

No record shows a $0 price or a blank customer-facing Product Code.

---

## 3. Open corrections confirmed still live (Hafiz's queue)

### 3.1 FF-U8SHD80-BLANK — HOLD
Product `10400550814012`.
- `custom.product_weight_lbs` = `85` → must be `80`.
- `custom.productnameshort` = `"…Dumbbell 85 lbs - Single - Blank / No Logo - Commercial Grade, 1-Year Limited Warranty (FF-U8SHD85-BLANK)"` → must describe 80 lb and reference `FF-U8SHD80-BLANK`.
- Not affected: variant SKU, price ($229) and `custom.product_code` are all correct.

### 3.2 FF-U8SHD55-BLANK — HOLD
Product `10400255574332`.
- `custom.mpn` = `FF-U8SHD35-BLANK` → must be `FF-U8SHD55-BLANK`.
- `custom.vendor_part_no` = `FF-U8SHD35-BLANK` → must be `FF-U8SHD55-BLANK`.

### 3.3 Parent set-option order — HOLD (Product Listings call)
Live `Weight` option order for the seven set values is:
`5-50, 5-60, 5-75, 5-100, **105-130**, **5-150**, 135-150`
`5-150 lbs` sits after `105-130 lbs`, as flagged. Correct customer-facing order is
Larianne's call; the parent option order is the only thing that needs editing.

### 3.4 processing_time_filter — HOLD, exactly 2 records off
Reconciliation needs a decision, not just an edit. Across the 37 children:
- 35 records = `"Ships in 5 weeks or more"`
- **2 records = `"Out of Stock"`** — `FF-U8SHD140-BLANK` (`10410496852284`) and `FF-U8SHD150-BLANK` (`10411589370172`)

Separately, the customer-facing value is `custom.processing_time = "Ships in 4-6 Weeks"`
on all 38 records, which does not match either filter value. **Tim/Larianne:** confirm
which filter value is the approved out-of-stock treatment before Hafiz reconciles —
setting all 37 to the majority value would be a guess.

### 3.5 Additional record-level defects found in this pass (not previously listed)
| Record | Product ID | Defect |
|---|---|---|
| FF-U8SHD70-BLANK | 10400484786492 | `custom.product_weight_lbs` **missing** (null) |
| FF-U8SHD135-150-BLANK | 10419645972796 | `custom.product_weight_lbs` **missing** and `custom.productnameshort` **missing** |
| FF-U8SHD90-BLANK | 10403836199228 | `productnameshort` carries a stray `"(New)"` mid-string, breaking the family pattern |

---

## 4. Judge.me cached image data — full inventory

`judgeme.review_widget_data` audited on all 38 records. `image_url` state:

- **Parent (1):** `PlaceholderComparisonChart_0619e40a-…png` — stale. Cache stamp `2026-07-01T21:37:34Z`.
- **Stale `ImageComingSoon.webp` (31):** singles 15, 20, 25, 30, 35, 40, 45, 60, 70, 75, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150 and **all seven sets** (5-50, 5-60, 5-75, 5-100, 105-130, 5-150, 135-150).
- **Correct current media (4):** 50, 55, 65, 80.
- **`null` (2):** 5, 10.

Confirms Tim's read: replacing the Shopify product media did **not** refresh the app cache.

### Does it surface to shoppers?
Theme-source finding: `review_widget_data` is **not referenced anywhere in this theme**
(zero matches repo-wide). The only Judge.me markup the theme emits is the preview
badge — `snippets/product-review-stars.liquid` and `layout/theme.liquid:210-211` — and
both render `product.metafields.judgeme.badge`, which contains stars and review-count
text only, **no image**.

So the stale URLs cannot reach a shopper through theme-rendered markup. They remain
reachable through Judge.me's own hosted widget JS and any rich-snippet/feed output the
app generates, which the theme does not control. **RENDER-PENDING** — needs a browser
pass on the live PDPs (and the review widget in its loaded state) before this can be
called PASS. Do not refresh the app cache until that proof exists; if it is needed,
refresh through a controlled reversible method only.

---

## 5. Native Combined Listing runtime — parent orderability risk

**Data layer, confirmed:** all 37 parent virtual variants report
`availableForSale = true`, `sku = null`, `inventoryQuantity = 0`,
`inventoryPolicy = DENY`, while every connected child is `false` / `-99` / `DENY`.
The blank virtual SKUs are correct native Combined Listing architecture and must not
be populated manually.

**Theme layer, isolated:** the parent renders on `templateSuffix = combined-listings`
→ `sections/main-product-comb.liquid`. In that section:

- `:1062` — the entire `{% form 'product' %}` Add to Cart block is gated on
  `{% if product.available == true %}`. The `{% else %}` branch is what renders the
  disabled out-of-stock button.
- `:52` — `<meta itemprop="availability">` emits `InStock` on the same
  `product.available` condition.
- There is **no combined-listing-parent guard** on either branch.

Children are safe by construction: they are out of stock under `DENY`, so
`product.available` is false and they take the disabled branch.

The parent is the exposure. If Liquid's `product.available` follows the parent's
virtual `availableForSale = true`, the bare parent URL would render an **enabled Add
to Cart** and an `InStock` availability schema on a family that is on hold. That is a
code-level isolation, not a reproduction — `product.available` for a Combined Listing
parent can only be settled by loading the page. **RENDER-PENDING, highest priority.**

Per assignment I did not change theme code: the defect is isolated but not reproduced,
and no rollback proof exists yet.

### Two secondary parent-template gaps found
- `sections/main-product-comb.liquid` never renders `notify-back-in-stock`. The child
  template does (`sections/main-product.liquid:1317`). If the parent PDP is a page a
  shopper can sit on, it has no Notify Me control.
- The parent's Processing Time row reads `custom.processing_time_long`
  (`:671`, `:677`), which is **null on the parent** (children have
  `"Ships from our Warehouse in 4-6 Weeks + Transit Time"`). The row cannot render on
  the parent regardless of the `product.available` gate.

---

## 6. Warranty

`custom.warranty = "1-Year Limited"` renders on parent and children. Controlling
source and exact approved customer-facing wording remain **unlinked**. Gate stays with
Larianne, unchanged by this audit.

---

## 7. Handoff status

| Item | Result |
|---|---|
| Record structure / child mapping | **PASS** |
| Availability controls on all 37 children | **PASS** |
| 80 lb weight + productnameshort | **HOLD** → Hafiz |
| 55 lb MPN + Vendor Part No | **HOLD** → Hafiz |
| 70 lb / 135-150 / 90 lb field defects | **HOLD** → Hafiz (new) |
| processing_time_filter | **HOLD** → needs approved value from Tim/Larianne first |
| Parent set-option order | **HOLD** → Larianne |
| Judge.me cache inventory | **Documented**; customer-facing exposure RENDER-PENDING |
| Parent orderability | **HOLD** — RENDER-PENDING, highest priority |
| Warranty | **HOLD** → Larianne |
| Desktop/mobile shopper-view proof | **NOT DONE** — storefront unreachable from audit environment |

Family remains Out of Stock · Ships in 4-6 Weeks · Notify Me When Available ·
continue-selling OFF · Add to Cart disabled · Unlisted / hidden · HOLD / Awaiting Owner.
