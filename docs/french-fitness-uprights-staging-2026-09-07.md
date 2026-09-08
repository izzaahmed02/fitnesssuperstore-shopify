# French Fitness Rack & Rig Uprights — staging response (2026-09-07)

Prepared by Ilsaa (Senior Shopify Developer, Combined Listings) for the canonical
thread "ACTION — Combined French Fitness Rack & Rig Uprights PDP + Review Consolidation",
next checkpoint **Tuesday, September 8, 2026, 12:00 PM Pacific**.

Answers the four items requested of the Ayyaz + Ilsaa pair: the smallest remaining
staging diff, the exact cart/inventory-identity method, the unpublished preview
identity, and the committed build/QA checkpoint.

## Authority boundary

Everything in this document is read-only analysis plus one additive theme file on a
feature branch. **No live catalog, price, inventory, review, media, metafield, tag,
collection, feed, canonical, `seo.hidden`, app setting, theme publication, handle,
redirect, archive, merge or deployment has been changed.** Every Shopify-side item
below is listed as *pending*, with its owner, and waits on Larianne / Izza / Ayyaz and
Tim's separate written GO. The source products, their reviews and their assets are
untouched.

The existing product 10281641443644 is **not** a native Shopify Combined Listing
parent — it is a ten-native-variant product on the shared `variants` template. Nothing
here creates a second parent, converts this one, or re-runs the completed source
mapping.

---

## 1. Smallest remaining staging diff

### 1a. Code (this branch — `claude/french-fitness-rack-rig-pdp-a7hfu9`)

One new file. One changed key inside it. Nothing else in the theme is touched.

```
A  templates/product.uprights-preview.json
```

`templates/product.uprights-preview.json` is a byte-for-byte copy of
`templates/product.variants.json` with exactly one value changed:

```diff
   "judge_me_reviews_review_widget_NDBtpE": {
     "type": "shopify://apps/judge-me-reviews/blocks/review_widget/...",
     "settings": {
       "review_data": "sample_data",
       "max_width": 1200,
       "show_shop_reviews": true,
-      "empty_state": "other_products_reviews"
+      "empty_state": "empty_widget"
     }
   }
```

Why this file exists rather than an edit to the shared template: `product.variants.json`
is a **shared** template carried by products across the catalog, so editing it in place
would change the review widget on every one of them. An
alternate template is additive — it renders only for a request that explicitly asks for
it (`?view=uprights-preview`), so until someone opens that URL it changes nothing for
any product, including this one.

Why `empty_state` is the key that matters: Judge.me's `other_products_reviews` fallback
renders **other products' reviews when the product has none of its own**. The combined
product has none of its own — its `judgeme.badge` metafield is literally
`data-number-of-reviews='0'` and its `judgeme.widget` metafield is `<div></div>`. So the
widget is behaving exactly as configured, and the ~711 "collar" reviews on the live PDP
are a widget-fallback artifact, **not** evidence of a wrong Judge.me product group and
**not** something to fix by moving, editing or deleting collar reviews. Flipping this one
key in an uprights-only template is the smallest change that tests that explanation.

`empty_widget` is not an invention — it is the value already in use in-repo on
`product.boost-test.json`, `product.byo-rig.json`, `product.mats-pdp.json` and
`page.reviews.json`.

Deliberately **not** changed, and left for Izza's widget-instance inspection:
- `show_shop_reviews: true` — a second possible contributor; `product.boost-test.json`
  keeps it `true` alongside `empty_widget`, so it is not obviously part of the defect.
- `review_data: "sample_data"` — per Tim, preview-only, not a live-review setting.

This is a theme-level presentation change only. It creates no Judge.me group, moves no
review, and touches no app setting. **Not merged, not deployed, no PR opened.**

### 1b. Shopify product data (pending — not executed, no authority)

These are the remaining non-code defects on product 10281641443644, each verified live
today. All are Shopify Admin writes and all wait on their owner plus Tim's GO.

| # | Defect (verified live) | Exact change | Owner |
|---|---|---|---|
| 1 | Variant `52686668235068` (47", SKU `FF-RR-U47`, $79.00) is still in the ten-value `Length` option | Remove the 47" variant so the picker is the approved nine | Ayyaz + Larianne |
| 2 | Description heading reads "come in **10** variations" | Change to nine | Ayyaz |
| 3 | Description table still carries a **47-Inch Uprights** row — and its copy is *wrong content*: "storing and organizing larger quantities of dumbbells and kettlebells… 3-tier design with adjustable shelves." That is dumbbell-rack copy on an upright | Delete the whole 47" row | Ayyaz + Larianne |
| 4 | The 36-Inch row's anchor points at `/products/french-fitness-29-rack-rig-upright-new` (the 29" product) and the 47-Inch row's at `…-45-rack-rig-upright-new` (the 45"). Both are empty `<a>` tags wrapping no text | Remove both stray anchors with the 47" row | Ayyaz |
| 5 | The description image paragraph holds six `<img>` tags; five have no `src` at all | Remove the five empty tags | Ayyaz |
| 6 | All ten combined variants carry a `compareAtPrice` ($99–$399). **None of the nine source variants has any compare-at price.** Base prices match; the savings claim does not exist on the sources | Do not publish invented MSRP/savings. Either remove the compare-at values or have Tim/Larianne supply a source-backed MSRP | Larianne (decision), Ayyaz (execution) |
| 7 | **CORRECTED 2026-09-08 — this is a PASS, not a defect.** Processing time is carried at *variant* level on the combined product, in `custom.processing_time_long_variant`, and all nine in-scope values match their source's `custom.processing_time_long` exactly: 2-5 Business Days on 36"/60"/72"/84", 3-7 Business Days on 91"/108"/120"/130"/142". My earlier statement (and the same statement in Tim's 2026-09-07 message) read product-level metafields only. What remains absent on the combined product is `custom.processing_time` (short label) and `custom.processing_time_filter` (drives collection filtering); the sources carry both | Add the short label and filter fields; no change needed to the long value | Larianne (source), Ayyaz |
| 8 | 72": source `custom.processing_time` says "Ships in 2-5 Business Days" while `custom.processing_time_filter` says "Out of Stock" — a self-contradiction on the source itself | Resolve at source before copying anything forward | Larianne |
| 9 | All 12 gallery images have `alt=""` | Apply the nine draft alt strings from Tim's media attachment **after** the visual identity check; the excluded 47" image and the two unassigned images stay flagged | Product Listings |

Not in this diff, by instruction: no feed activation or suppression, no change to the
60" `REMOVE FROM FEEDS` tag (confirmed present on the live product — the QA record
should be corrected to say so), no review migration, no `seo.hidden` change, no
redirect, no lifecycle change on any source PDP.

---

## 2. Exact cart / inventory-identity method

**The finding first, because it decides the architecture question.** The combined
variants and the source variants are *disjoint* records. Same physical product, same
single location, two independent stock pools:

72" — the height Tim flagged, verified today at location
`gid://shopify/Location/99240247612` ("537 Stone Rd. STE F"):

| | Variant ID | Inventory item | available | on_hand | committed |
|---|---|---|---|---|---|
| Source PDP | `50749016277308` | `52598678552892` | **-9,999** | -9,999 | 0 |
| Combined PDP | `52686668300604` | `54538879041852` | **9,995** | 9,995 | 0 |

Because the inventory items differ, a sale on one **cannot** decrement the other. Today
the same upright is independently sellable from two places, and on 72" one of those
places says not-for-sale while the other says in stock. Both numbers are placeholders,
not counted stock — neither is permission to copy quantities forward or to switch
anything to continue-selling.

**Method to establish the customer-facing identity (read-only, no test orders, no writes):**

1. **Admin identity table** — done, below. Source variant ID + inventory item ID vs.
   combined variant ID + inventory item ID for all nine heights.
2. **Cart identity** — on the preview URL in §3, select each of the nine heights, Add to
   Cart, then read `/cart.js` and compare `items[].id`, `items[].variant_id` and
   `items[].product_id` against the table. This is the authoritative answer to "which
   record does the customer actually buy," and it is a storefront read: no admin write,
   nothing published, cart cleared afterward.
3. **Checkout retention** — carry one line through to the checkout page and confirm the
   variant ID and the selected height survive. Stop at the payment step; place no order.
4. **Inventory linkage** — re-read `inventoryLevels` for both inventory items of the
   tested height immediately after, and confirm the expected pool moved (`committed`)
   and the other did not.
**Result — 72", verified on the preview 2026-09-08.** Selecting 72" resolves to
`?variant=52686668300604` and Add to Cart places that variant in the cart at $109.00,
Length 72", processing time "Ships from our Warehouse in 2-5 Business Days + Transit
Time". `52686668300604` is the **combined** variant, backed by inventory item
54538879041852 (9,995 available) — not the source variant 50749016277308 / item
52598678552892, which reads -9,999 and not-for-sale. So the customer buys the combined
record, and the double-sale exposure is demonstrated rather than inferred. The remaining
eight heights and the `/cart.js` JSON capture are still open.

5. **Decision gate for Tim / Larianne** — the results only *describe* the current
   architecture; they do not choose one. The two lawful outcomes are:
   - **(a)** the combined variants become the single sellable identity, and the nine
     sources are retired at cutover — which pulls in redirects, feed and canonical work
     that is separately approved and not in scope here; or
   - **(b)** the combined PDP must sell the *source* variant identities, which is what a
     native Shopify Combined Listing does structurally and what this product is not.
   Converting this product to a native combined listing, or creating a second parent, is
   explicitly not being done on our own initiative.

Until that gate is answered, the combined PDP must not be published, because publishing
it makes double-sale of one physical unit reachable by customers.

### Nine-height identity map (verified live, 2026-09-07)

| Height | Source product | Source variant | Source inv. item | Combined variant | Combined inv. item | SKU | Price | Source available |
|---|---|---|---|---|---|---|---|---|
| 36" | 9878828515644 | 50749012083004 | 52598674260284 | 52686668202300 | 54538878943548 | FF-RR-U-36 | $61.00 | yes (9993) |
| 60" | 9878829105468 | 50749012771132 | 52598674948412 | 52686668267836 | 54538879009084 | FF-RR-U-60 | $99.00 | yes (9994) |
| 72" | 9878829596988 | 50749016277308 | 52598678552892 | 52686668300604 | 54538879041852 | FF-RR-U-72 | $109.00 | **no (-9999)** |
| 84" | 9878830252348 | 50749017030972 | 52598679306556 | 52686668333372 | 54538879074620 | FF-RR-U-84 | $129.00 | yes (9985) |
| 91" | 9878830907708 | 50749017719100 | 52598680027452 | 52686668366140 | 54538879107388 | FF-RR-U-91 | $139.00 | yes (9984) |
| 108" | 9878826484028 | 50749006774588 | 52598668853564 | 52686668398908 | 54538879140156 | FF-RR-U-108 | $169.00 | yes (9949) |
| 120" | 9878827073852 | 50749007987004 | 52598670164284 | 52686668431676 | 54538879172924 | FF-RR-U-120 | $189.00 | yes (9999) |
| 130" | 9878827565372 | 50749010870588 | 52598673015100 | 52686668464444 | 54538879205692 | FF-RR-U-130 | $209.00 | yes (9999) |
| 142" | 9878828122428 | 50749011460412 | 52598673637692 | 52686668497212 | 54538879238460 | FF-RR-U-142 | $229.00 | yes (9981) |

Base prices match source-to-combined on all nine. **Excluded:** 47" (source product
9878831628604, variant 50749018669372, SKU `FF-RR-U47`) — still present as combined
variant 52686668235068, pending removal. 96" is closed per Tim's August 31 correction
and is not an open sourcing question.

Every source variant is `inventoryPolicy: DENY` and every quantity is a 9,9xx or -9,999
placeholder. None of these is verified physical stock; physical/allocation verification
stays with Larianne and stays separate from these numbers.

---

## 3. Unpublished preview identity

**Preview URL shape**

```
https://www.fitnesssuperstore.com/products/french-fitness-rack-rig-uprights-new
  ?view=uprights-preview
  &preview_theme_id=188234072380
```

Live as of 2026-09-08. Both parameters are required: `preview_theme_id` alone renders
the shared `variants` template and still shows the fallback reviews; `view=uprights-preview`
alone does not exist on the published theme.

- `view=uprights-preview` selects `templates/product.uprights-preview.json` and nothing
  else. It needs **no** write to the product: the product's `templateSuffix` stays
  `variants`, so no product record is modified to obtain the preview.
- `preview_theme_id` scopes it to an unpublished theme. Same pattern already in use for
  the Rubber Hex W1 lane (`view=rh-child-review`), so this introduces no new mechanism.
- The product is `UNLISTED` with `seo.hidden = 1` and the `hidden` tag. None of those
  change. It stays out of search and out of collections.

**What is still needed, and from whom:** the unpublished theme itself. No uprights
preview theme existed as of 2026-09-07; MAIN is
`fitnesssuperstore-shopify/main` (186120208700). **Resolved 2026-09-08: unpublished
theme 188234072380 now exists**, created 05:39 UTC from this branch and confirmed
UNPUBLISHED via the Admin API. Nothing published. The instruction below stands for
any future rebuild — creating a theme is a store-level write, so **Izza or Ayyaz** should
push this branch to a new unpublished theme following the existing naming convention:

```
fitnesssuperstore-shopify/claude/french-fitness-rack-rig-pdp-a7hfu9
```

and reply with the theme ID. I will not create it, publish it, or push to any existing
theme.

**Stated plainly, per Tim's caution:** an unpublished theme sandboxes *theme* rendering
only. It does not sandbox product data, inventory, Judge.me records or feeds. Every item
in §1b remains a real production write regardless of which theme is previewing.

---

## 4. Committed build / QA checkpoint

**Tuesday, September 8, 2026, 12:00 PM Pacific** — Ilsaa returns, in the canonical thread:

- this document and the branch, already delivered ahead of the checkpoint;
- the theme ID and the live preview URL, **if** Izza/Ayyaz have pushed the theme by then;
- the §2 cart-identity results for all nine heights (`/cart.js` variant and product IDs
  per height, plus the checkout-retention read), **if** the preview exists — this is the
  only piece I cannot do alone, and it is the gate for the architecture decision;
- the §1b list re-verified against live state, so QA is not testing a stale diff.

Blocked-through-no-fault items, so the checkpoint is not misread as slippage: §1b items
1–7 and 9 need Larianne's and Tim's decisions plus Ayyaz's execution; item 8 is
Larianne's source resolution; the theme is Izza's or Ayyaz's push.

**Not being claimed as done, by anyone, including me:** a rendered browser/device/cart
session; opening the actual image pixels for the visual identity check; native Judge.me
or Multifeeds administration; and any physical inventory verification. Nothing in this
document is marked PASS from Admin fields alone.

**Release still gated** on source, technical and independent QA evidence (Iqra +
Saliha), the pre-publish crawlability and products-tax-collection gates in the current
SOP, and Tim's separate written GO.

---

## Corrections to the QA record

1. The 60" product **does** carry the literal `REMOVE FROM FEEDS` product tag — confirmed
   live on product 9878829105468. The QA workbook entry saying otherwise should be
   corrected. The tag is preserved; whether Multifeeds/GMC actually honors it still needs
   evidence through the documented feed delegation, and no feed change is approved here.
2. "Combined shows 0/0.00 reviews" is imprecise in a way that matters. The combined
   product's `judgeme.badge` metafield exists and reads zero; its `judgeme.widget`
   metafield is an empty `<div></div>`. **CORRECTED 2026-09-08:** a third metafield,
   `judgeme.review_widget_data`, is also present and reads
   `"number_of_reviews":0, "average_rating":"0.00", "reviews":[]`, last updated
   2026-04-20. So all three Judge.me metafields exist and Judge.me has computed this
   product's aggregate as a real zero — it is not *absent*, as my earlier note and
   Tim's 2026-09-07 message both said. That is fully consistent with the `empty_state`
   fallback explanation: the product genuinely has none of its own reviews, so the
   widget fell back to other products'. Verified baseline on the 108" source
   (9878826484028): `judgeme.badge` reads `data-average-rating='5.00'`,
   `data-number-of-reviews='1'` — one five-star review, confirmed directly rather than
   relayed. The earlier framing said the aggregate was absent rather than a computed zero
   — which is consistent with the `empty_state` fallback explanation in §1a and not with
   a mis-bound review group. The current Shopify baseline remains the single five-star
   review on the 108" source. Verify the app records and any existing group before any
   grouping change; preserve original attribution; do not export/re-import, duplicate, or
   suppress reviews to reach a target count.
3. Base-price parity across all nine heights is real, but it is **not** an MSRP/savings
   PASS — see §1b item 6. The compare-at prices exist only on the combined product.
