# Rubber Hex Combined Listing — Pre-GO Cutover Packet

**Owner:** Zafran (technical structure, rehearsal, cutover/rollback runbook)
**Status:** NOT EXECUTED. No live parent, handle, status, archive, redirect, review, feed, collection, Search & Discovery, or theme change has been made.
**Verification date:** 2026-07-26. All values below were pulled live from the Shopify Admin API and from this theme repository, not estimated.

Responds to Tim's 18 July items A–J.

---

## 0. Two findings that change the plan

### 0.1 BLOCKER — the parent currently serves `noindex,nofollow`

The parent carries the metafield `seo.hidden = 1`. Live check today:

| URL | HTTP | Canonical | Robots |
|---|---|---|---|
| `/products/french-fitness-rubber-coated-hex-dumbbell-new` (old, live) | 200 | self | **none (indexable)** |
| `/products/french-fitness-rubber-coated-hex-dumbbells` (parent, test) | 200 | self | **`noindex,nofollow`** |

`seo.hidden` is a Shopify-native metafield: it suppresses the product from `sitemap.xml` and drives the `noindex,nofollow` tag. It is not theme code — grepping this repo for `noindex` returns only the `page=` paginated-collection rule and the search template, neither of which applies here.

If we move the live handle onto the parent while `seo.hidden = 1` is still set, the preserved URL — which currently ranks and is indexable — begins serving `noindex,nofollow` on the first crawl. **This would deindex the URL the whole project exists to preserve.** `seo.hidden` must be deleted from the parent (deleted, not set to `0`, so it matches the old product's state of `null`) before the handle swap, and the swap must not proceed if it is still present.

This is now stop-condition #1.

### 0.2 `productType`, not the `hidden` tag, is the master visibility switch

Tim's item 5 asked why the parent is in 3 collections and the old product in 21. The cause is `productType`:

- Old product: `productType = "Product Index"`
- Parent: `productType = "Product (Hidden)"`

Nearly every browse smart collection is gated on `TYPE = "Product Index"` and/or `TYPE != "Product (Hidden)"`. Verified by comparing two children that differ only in this field: the 10 lbs single (`Product (Hidden)`) is in 3 collections; the 2.5-22.5 set (`Product Index`) is in 17.

The same field also governs predictive search. `sections/predictive-search.liquid:116-117` excludes:

```liquid
{% assign excluded_types = "Avis-add-charge,Custom Field More Info,Option Category,Product (Hidden)" | split: "," %}
{% assign excluded_tags  = "hidden,draft,avisplus-product-options,about_option_categories" | split: "," %}
```

So the parent is currently excluded from predictive search **twice** — by type and by tag. Removing the `hidden` tag alone (Tim's item 5) is not sufficient; without also changing `productType`, the consolidated entry never appears in predictive search, which is a regression against today's behaviour.

**Consequence and control.** Changing the parent to `Product Index` also drops it into the two feed collections Tim requires it to stay out of (`french-fitness-meta-feeds`, `tiktok-feeds`). Both of those smart collections carry the rule `TAG != "REMOVE FROM FEEDS"`. Adding the `REMOVE FROM FEEDS` tag to the parent excludes it from both deterministically, and no browse collection filters on that tag, so browse membership is unaffected. That tag is therefore a required control, not an optional one.

---

## A. Complete 54-row parent-variant / child-product / child-variant / SKU matrix

See `rubber-hex-parent-variant-matrix.csv` in this directory. One row per parent selector variant, with parent variant ID → selector values → child product ID → child variant ID → purchasable SKU → handle → status → price → inventory → productType → `legacy_gmc_id` → `gmc_id_rollout_status` → Google & YouTube channel → Shop channel → current and proposed feed ID.

**Reconciled count (item 3 / item 1 of 18 July): 54, confirmed.** My 17 July packet said 50; that was wrong. Live:

| Group | Count |
|---|---|
| Single-weight children | 36 |
| Dumbbell-only set children | 12 |
| Rack / Bench + Rack package children | 6 |
| **Total parent selector variants = mapped child products** | **54** |

Every one of the 54 is `ACTIVE`, has exactly 1 variant, a distinct real SKU, and inventory. Every chain in the matrix is complete — no selector option maps to a missing or non-purchasable destination. This matches Tim's count and Kevin's matrix exactly.

Parent option model: `Purchase Type` (Sets / Singles) × `Set Type` (Dumbbells Only / With Rack / With Bench + Rack) × `Weight` (48 values) → 54 valid combinations.

**Final child count = 54 (unchanged).** No child is added or removed by this cutover.

---

## B. Final architecture decision and final counts

- **Final parent:** Product ID `10353232380220`, role `PARENT`, template `combined-listings`.
- **Final public handle:** `french-fitness-rubber-coated-hex-dumbbell-new`.
- **Old product `10247596147004`:** renamed to a legacy handle and `ARCHIVED`. Never deleted.
- **Children:** remain the purchasable, inventoried, sales- and order-reporting objects. 54 in, 54 out.
- **Six package children:** **remain as-is.** Per Tim's 18 July withdrawal, I am not proposing replacement package variants on retained set children. The six are active, carry valid distinct SKUs (`FF-RCHD5-50-R`, `FF-RCHD5-50-RB`, `FF-RCHD5-75R`, `FF-RCHD5-75RB`, `FF-RCHD5-100-R`, `FF-RCHD5-100-RB`), have `rollout = approved` with legacy IDs, and are the only children published to the Google & YouTube and Shop channels. Moving them into variants would forfeit all of that for no proven gain. I am not requesting the option-model rehearsal Tim described unless he wants it separately.

Reason 10247596147004 cannot itself be the parent (unchanged from 17 July, and Tim has approved this): a Combined Listings parent is non-purchasable, holds no inventory and accrues no sales data. Converting our live 45-variant inventoried product would strip purchasability from the SKUs that carry the order history.

---

## C. FF-RCHD5-70-R — separate disposition

Fact pack for Larianne's decision. I am not proposing a destination.

| Field | Value |
|---|---|
| Product ID | `9878578626876` |
| Title | French Fitness Rubber Coated Hex Dumbbell Set 5-70 lbs w/Rack (New) |
| Handle | `french-fitness-rubber-coated-hex-dumbbell-set-5-70-lbs-w-rack-new` |
| Variant ID / SKU | `50748402499900` / `FF-RCHD5-70-R` |
| Status / type | ACTIVE / `Product Index` |
| Price / inventory | $2,159.10 / 9,990 |
| Combined Listing role | **none — not one of the 54 children** |
| `legacy_gmc_id` / rollout | `FF-RCHD5-70-R` / `approved` |
| Channels | Online Store, POS, Shop, Facebook & Instagram, **Google & YouTube**, Copilot, Meta, Meta Dev |
| Collections | 24, incl. `french-fitness-meta-feeds` and `july4-ff-eligible` |
| `seo.hidden` | `1` (currently `noindex,nofollow`) |

Note on the equivalence question Tim raised: **$2,159.10 is the same price as `FF-RCHD5-50-RB` (5-50 w/Bench + Rack)**, not the 5-75 w/Rack, which is $2,519.10. Price parity is not product equivalence — the 5-50 w/Bench + Rack has a lighter weight range plus a bench, the 5-75 w/Rack has a heavier range and no bench. Neither is a like-for-like substitute for a 5-70 w/Rack. If it is to be replaced rather than retained, the equivalence rationale has to come from Larianne on included weights, rack spec and customer value, not from price or URL proximity.

Nothing about this product is touched by the cutover as planned. It is only a launch dependency insofar as Tim wants the disposition closed before GO.

**Also flagged:** a stray product `french-fitness-rubber-coated-hex-dumbbell-set-5-50-lbs-test-copy` (`10417327505724`) carries the family tag. Not a child, not on any sales channel. Recommend Larianne/Control Tower confirm it can be archived; it should not reach any feed.

---

## D. Parent-versus-child metafield and collection matrix

### D.1 Collections

Current: old product in **21** collections, parent in **3**. Verified membership rules for all 21 are recorded below. Nearly all are smart collections — the parent does not need manual addition, it needs the correct `productType` and tags, after which the rules place it automatically.

| Collection (handle) | Gate | Parent joins on `Product Index`? | Disposition |
|---|---|---|---|
| `dumbbells` | TAG `Dumbbells` + TYPE ≠ Hidden | yes | **Parent — required** |
| `rubber-dumbbells` | TAG `Rubber Dumbbells` + TYPE ≠ Hidden | yes | **Parent — required** |
| `free-weights` | TAG `Free Weights` + TYPE ≠ Hidden | yes | Parent |
| `strength-training-equipment` | TAG + TYPE ≠ Hidden | yes | Parent |
| `french-fitness` | VENDOR + TYPE ≠ Hidden | yes | Parent |
| `french-fitness-dumbbells` | TAG + TYPE ≠ Hidden | yes | Parent |
| `french-fitness-free-weights` | TAG + TYPE ≠ Hidden | yes | Parent |
| `french-fitness-rubber-hex-dumbbells` | TAG + TYPE ≠ Hidden | yes | Parent |
| `product-index` | TYPE = Product Index, price > 0 | yes | Parent |
| `all` | TYPE = Product Index, price > 0 | yes | Parent |
| `new-equipment` | metafield `New` + TYPE = Product Index | yes | Parent |
| `all-products-tax-settings` | TYPE = Product Index | yes | Parent (operational, harmless) |
| `globofilter-best-selling-products-index` | price > -9999 | already in | Parent (index) |
| `cloud-search-all-products` | price > -1 | already in | Parent (index) |
| `smart-collection-welcome-5` | price > 0 + title excl. | already in | Parent |
| `gym-equipment-under-1-000` | TYPE=Index, 99 < price < 1000, **inventory > 0** | no — parent inventory is 0 | Children only |
| **`french-fitness-meta-feeds`** | TYPE=Index, price>99, weight<650, vendor, **TAG ≠ REMOVE FROM FEEDS** | **yes — must be blocked** | **EXCLUDE parent via `REMOVE FROM FEEDS` tag** |
| **`tiktok-feeds`** | TYPE=Index, vendor, weight<31, **inventory>10**, **TAG ≠ REMOVE FROM FEEDS** | inventory rule probably blocks it, but do not rely on it | **EXCLUDE parent via `REMOVE FROM FEEDS` tag** |
| `products-tax-collection` | manual | no | Manual — add parent (operational) |
| `products-new` | manual | no | Manual — add parent |
| `french-fitness-showroom-products` | manual | no | Larianne's call |

Net: 3 manual decisions, everything else follows from `productType` + the `REMOVE FROM FEEDS` tag. Old product drops out of all 21 on archive.

### D.2 Tags

| Tag | Old | Parent | Action |
|---|---|---|---|
| Dumbbells, Free Weights, French Fitness, FF Dumbbells, FF Free Weights, FF Rubber Hex Dumbbells, Rubber Dumbbells, Strength Training Equipment | ✓ | ✓ | No change — already aligned |
| `hidden` | — | ✓ | **Remove at activation** (excludes from predictive search) |
| `REMOVE FROM FEEDS` | — | — | **Add at activation** (blocks Meta + TikTok feed collections) |
| `july4-exclude` | ✓ | — | **Do not carry.** Expired promotion (July 4, 2026 has passed). Larianne to confirm. |
| `french-fitness-rubber-coated-hex-dumbbell-new` (handle-mirror tag) | ✓ | — | **Carry to parent.** Every product in the family carries a tag equal to its own handle; the parent should follow the convention on its new handle. No theme code reads it — cosmetic/app convention only, low risk either way. |

### D.3 Metafields — before/after disposition

Present on both already, no action: `custom.brand`, `custom.breadcrumb_paths`, `custom.condition_state`, `custom.free_shipping`, `custom.grade`, `custom.main_category`, `custom.mpn`, `custom.processing_time`, `custom.processing_time_filter`, `custom.processing_time_long`, `custom.productnameshort`, `custom.product_code`, `custom.product_popularity` (80 on both), `custom.roc_mounting_information`, `custom.ships`, `custom.short_description`, `custom.sub_category`, `custom.vendor_part_no`, `custom.warranty`, `custom.features_specs`, `custom.3rd_party`, `mm-google-shopping.google_product_category`, `mc-facebook.google_product_category`.

Requiring action:

| Metafield | Old | Parent | Disposition | Owner |
|---|---|---|---|---|
| **`seo.hidden`** | absent | **`1`** | **DELETE from parent — launch blocker (§0.1)** | Zafran |
| `global.description_tag` (SEO description) | present | **absent** | **Copy to parent** — see item F | Zafran |
| `custom.related_products` | 4 refs | absent | **Copy to parent.** Related-products siblings dedupe by `product.combined_listing.parent_product.handle` (`sections/related-products.liquid:24-26`), which follows the handle automatically. No product in the store sets `custom.combined_listing_family`, so nothing is pinned to the old parent handle — verified, no breakage. | Zafran |
| `custom.product_color` = `Black/Chrome` | present | absent | **Copy to parent.** Family-level attribute, used for filtering. | Zafran |
| `custom.retail_price` = `900` | present | absent | **Do not copy.** It is the MSRP of one configuration; on a non-purchasable 54-option parent spanning $4.50–$8,499 it is meaningless and risks a wrong strike-through price. | Zafran / Larianne to confirm |
| `custom.gmc_id_rollout_status` = `hold_ff_variant` | present | absent | **Do not copy.** Confirmed by Masum and Tim. Retires with the old product. | Masum / Kevin |
| `custom.shopify_product_id` | `10247596147004` | `10353232380220` | **Leave as-is** — already the parent's own ID. Correct. | — |
| `shopify.material` | present | absent | Copy (low risk, standard taxonomy) | Zafran |
| `reviews.rating` / `reviews.rating_count` | 5.0 / **18** | 5.0 / **1** | See item on review migration | Yusra / Izza |
| `judgeme.*` (badge, widget, review_widget_data) | 18 reviews | 1 review | App-owned, do not hand-edit | Yusra / Izza |
| `custom.product_canonical_url` | absent | absent | **Leave absent on both.** See item G. | — |

---

## E. Google before/after feed matrix, and Meta/TikTok

Kevin's `rubber-hex-feed-status-matrix.csv` and Masum's row-by-row confirmation are the source of record for the Google feed. I have reconciled the Shopify side against it and it agrees: 54 children (36/12/6), 11 with `rollout = approved` + `legacy_gmc_id`, 43 with neither, 5 genuinely duplicated SKUs, old parent on the product-ID + variant-ID pattern.

Two things I found on the Shopify side that the feed matrix does not cover, both of which I think are launch-blocking for Kevin and Masum, not for me:

### E.1 Sales-channel publication gap (new)

Verified across all 57 products carrying the family tag:

| Product set | Google & YouTube channel | Shop channel |
|---|---|---|
| Old product `10247596147004` | **published** | **published** |
| 6 package children | published | published |
| FF-RCHD5-70-R | published | published |
| **5 approved dumbbell-only sets** | **not published** | **not published** |
| **43 remaining children** | **not published** | **not published** |
| New parent `10353232380220` | not published | not published |

When the old product is archived, its 45 SKUs leave the native Google & YouTube channel and the Shop channel. Only 7 products in the family remain on either. If any part of the Google presence flows through the native channel rather than the Multifeeds app, the cutover silently drops 45 offers. Kevin/Masum need to state which mechanism is authoritative and, if the native channel matters, the 48 unpublished children must be published there as part of the cutover. TikTok's native publication is `false` for every product in the family including the old one, so the TikTok feed evidently runs entirely off the `tiktok-feeds` collection.

### E.2 `rollout = approved` alone may not make the 43 feed standalone (new)

Kevin's proposal is to set `gmc_id_rollout_status = approved` on the 43 so they feed standalone once the old parent retires. On the Shopify side there is a perfect correlation the matrix does not mention: **all 11 children that feed standalone today are `productType = "Product Index"`; all 43 that do not are `productType = "Product (Hidden)"`.** `Product (Hidden)` excludes them from `french-fitness-meta-feeds`, and from every browse collection.

If the Multifeeds Google feed draws from a collection or a product filter that is also type-gated, flipping the metafield will not be enough and the 43 will simply stop feeding when the old parent retires. Kevin/Masum should confirm the Multifeeds source selection for `googleshoppingfrenchfitness (24)`. If it is type-gated, the 43 need `productType = "Product Index"` too — which then puts them into browse collections as separate tiles and re-opens item H. I am flagging the dependency, not proposing the answer.

Parent exclusion from feeds is confirmed and belt-and-braces: not published to Google & YouTube / Meta / TikTok channels, and blocked from both feed collections by the `REMOVE FROM FEEDS` tag.

Meta and TikTok remain **unresolved — no verified owner has confirmed keying.** Per Tim's instruction they are listed as an explicit blocker, not inferred from Google.

---

## F. Title, SEO, canonical, review, analytics, search plan

### F.1 Title and SEO — exact values to set on parent `10353232380220`

| Field | Current | Set to |
|---|---|---|
| Product title | `French Fitness Rubber Coated Hex Dumbbells` | `French Fitness Rubber Coated Hex Dumbbells (New)` |
| SEO title | blank | `French Fitness Rubber Coated Hex Dumbbells (New)` |
| SEO description | blank | `Buy New French Fitness Rubber Coated Hex Dumbbells from Fitness Superstore. Hexagonal shaped heads, anti-slip grip, anti-Roll Design and durable coating.` |
| `seo.hidden` | `1` | **deleted** |

Note for Larianne: the old product's SEO title field is itself blank — the page title today comes from the product title. Setting the SEO title explicitly to the same string preserves the rendered title exactly. If Larianne wants a different title, it replaces the SEO title only, not the product title.

### F.2 Canonical model — implemented, no code change needed

`snippets/head-meta.liquid:57-67`:

```liquid
{% if template contains 'product' and product %}
  {% assign custom_canonical = null %}
  {% if product and product.metafields.custom.product_canonical_url != blank %}
    {% assign custom_canonical = product.metafields.custom.product_canonical_url %}
  {% endif %}
  {% if custom_canonical %}
    <link rel="canonical" href="{{ custom_canonical }}">
  {% else %}
    <link rel="canonical" href="{{ base_url }}/products/{{ product.handle }}">
  {% endif %}
```

The theme self-canonicalises every product page to its own handle, built from `product.handle` rather than `canonical_url`, so query strings never leak into the canonical. This matches exactly what Tim specified:

- Parent canonical = the preserved parent URL — automatic once the handle moves.
- Child canonical = each child's own clean URL — automatic, unchanged.
- Package variant URL = its retained child product URL — unchanged.
- No child or package canonical points at the parent, and `custom.product_canonical_url` is set on no product in this family. Nothing to do; nothing to undo.

Larianne / Kevin: the Drive feed-status matrix needs to reflect this, per Tim's item 7.

`?variant=` URLs are already handled — `head-meta.liquid:34-40` injects `noindex,follow` client-side on any URL carrying a `variant=` param.

### F.3 Search, recommendations, related products

| Surface | Mechanism | State after cutover | Action |
|---|---|---|---|
| Predictive search | theme `predictive-search.liquid` excludes type `Product (Hidden)` and tag `hidden` | All 54 children already excluded by the `hidden` tag — **no duplicate tiles**, verified. Parent appears only once `productType` = `Product Index` **and** the `hidden` tag is removed. | Zafran (both changes) |
| Full search | Shopify native | Parent appears; children still indexed by Shopify search | **Set Search & Discovery → Combined listings → "Only show parent products"** — Yusra/Saliha, then evidence |
| Auto recommendations | Shopify native | same | same setting |
| Related products / You May Also Like | `sections/related-products.liquid` dedupes siblings by `combined_listing.parent_product.handle` | Follows the new handle automatically. Verified no product sets `custom.combined_listing_family`, so nothing is pinned to the old handle. | none |
| Collection grids | smart collection rules | The 11 `Product Index` children appear alongside the parent in `rubber-dumbbells` etc. — this is **pre-existing today**, not caused by the cutover | Larianne/Kevin — decide whether to accept, since setting them to `Product (Hidden)` would pull them out of the feed collections (§E.2) |
| XCloud Search / Globo filter | app config, both index via their own "all products" collections | not verifiable via Admin API | Yusra/Saliha to verify in-app and screenshot |

The one genuine trade-off for Tim: the 11 approved children need `Product Index` to stay in the feed collections, and `Product Index` is also what puts them in browse collections as separate tiles. There is no configuration that gives both. This is a merchandising-versus-feed call for Larianne and Kevin, and it exists today independent of the cutover.

### F.4 Reviews and analytics

- Old product: `reviews.rating_count = 18`, rating 5.0, Judge.me badge shows 18. Parent: `1` grouped review (a 150 lbs single, correctly grouped). Migration from `10247596147004` → `10353232380220` is **Yusra/Izza**, and per Tim it does not run until GO. Proof required: before/after counts and rating, reviews still rendering on child states, no duplicate review schema, no lost photos, reversal method.
- Analytics and order history stay permanently on `10247596147004` and its 45 variant IDs. They do not transfer, and archiving preserves them. Forward sales accrue to the child products — parents never carry sales data. Reporting on the family after cutover must aggregate the 54 child products.
- `custom.product_popularity` is already `80` on both; the internal Shopify search score is per-product-ID and starts fresh on the parent.

---

## G. Rehearsal — required before GO, NOT YET RUN

Per Tim's item 11 / G, on a throwaway duplicate pair, never on the live handle. I have held this because it creates products in the live store and the freeze is in force. **It needs an explicit go-ahead to run — it is the only remaining gap in this packet.**

Rehearsal will produce: exact GraphQL payloads with `redirectNewHandle = false`; before/after IDs, handles, status, publication state, template; HTTP status and canonical proof on both handles; **robots-tag proof that the rehearsal parent is indexable after `seo.hidden` removal** (added because of §0.1); search and collection proof; child navigation proof; one cart/checkout test; full rollback proof in the corrected order; screen recording.

---

## H. Corrected cutover and rollback runbook

Both sequences use `redirectNewHandle = false` on every rename, and use Tim's corrected handle order.

### H.1 Preflight (no customer-visible change)

| # | Action | Owner |
|---|---|---|
| P1 | Confirm no URL redirect exists on either handle. **Verified clean 2026-07-26** — `urlRedirects` query on `/products/french-fitness-rubber-coated-hex-dumbbell*` returns zero rows. | Zafran |
| P2 | Confirm parent is published to Online Store, `UNLISTED`, and its current test URL returns HTTP 200. **Verified 2026-07-26 — returns 200.** | Zafran |
| P3 | Set parent product title and SEO title/description (§F.1). | Zafran |
| P4 | **Delete `seo.hidden` from the parent. Re-fetch the parent test URL and confirm the robots tag is gone.** Hard gate — do not continue if it is still present. | Zafran |
| P5 | Copy `custom.related_products`, `custom.product_color`, `global.description_tag`, `shopify.material` to parent. Do not copy `custom.retail_price` or `custom.gmc_id_rollout_status`. | Zafran |
| P6 | Add tag `REMOVE FROM FEEDS` to the parent. Verify it does **not** appear in `french-fitness-meta-feeds` or `tiktok-feeds`. | Zafran |
| P7 | Capture the full before-state snapshot (both products: status, handle, type, tags, template, publications, collections, metafields, review counts). | Zafran + Izza |

### H.2 Cutover (low-traffic window, B and C back-to-back)

| # | Action | Owner |
|---|---|---|
| A | Re-verify parent published to Online Store, `UNLISTED`, current test URL HTTP 200, no robots tag. | Zafran |
| B | `productUpdate` on **old** `10247596147004`: handle → `french-fitness-rubber-coated-hex-dumbbell-new-legacy`, `redirectNewHandle: false`. | Zafran |
| C | *Immediately* `productUpdate` on **parent** `10353232380220`: handle → `french-fitness-rubber-coated-hex-dumbbell-new`, `redirectNewHandle: false`. | Zafran |
| D | Verify the preserved URL: HTTP 200, parent page renders, `combined-listings` template, canonical = preserved URL, **no robots noindex**, all 54 selectors present, child navigation lands on the right child with the right options. Parent still `UNLISTED`. | Izza (independent QA) |
| E | Set parent `productType` → `Product Index`, remove tag `hidden`, add the handle-mirror tag, set status → `ACTIVE`. Verify collection membership resolved as per §D.1 and that the two feed collections still exclude it. | Zafran |
| F | Storefront checks: predictive search shows the parent once and no child tiles; full search; `dumbbells` and `rubber-dumbbells` grids; recommendations; related products; mobile + desktop. | Yusra / Saliha |
| G | **Only after D–F pass:** archive old `10247596147004` on its legacy handle. Never delete. | Zafran |
| H | Confirm no redirect was auto-created on either handle. | Zafran |

Feed and review changes run **after** the storefront is verified stable, on Tim's separate word — they are not part of this sequence.

**Why this sequence avoids each failure mode.** No redirect is ever created, because `redirectNewHandle` is `false` on both renames — so there is no auto-redirect to conflict with the parent claiming the handle, no A→B→A loop, and no multi-hop chain; the URL resolves 200 directly. The 404 exposure is only the sub-second gap between B and C, run back-to-back in the lowest-traffic window with Shopify's page cache still serving during it. Child URLs and canonicals are untouched because children keep their own handles and the theme self-canonicalises (§F.2).

### H.3 Rollback (Tim's corrected order — the parent must release the handle first)

| # | Action |
|---|---|
| A | Rename parent `10353232380220` off the live handle back to `french-fitness-rubber-coated-hex-dumbbells`, `redirectNewHandle: false`. |
| B | *Immediately* assign `french-fitness-rubber-coated-hex-dumbbell-new` back to old `10247596147004`, `redirectNewHandle: false`. |
| C | Set old product back to `ACTIVE` and republish to its 8 channels. |
| D | Return parent to `UNLISTED`, restore `productType = Product (Hidden)`, re-add tag `hidden`, remove `REMOVE FROM FEEDS`, restore `seo.hidden = 1`. |
| E | Delete any redirect accidentally created, and reverse only the feed/review changes actually made. |

My 17 July rollback had A and B inverted — Tim's correction is right, the old product cannot reclaim a handle the parent still owns. Because the old product is archived rather than deleted and no child is touched, rollback is complete and lossless, and takes minutes.

**Stop conditions (abort and roll back):** preserved URL not HTTP 200; robots `noindex` present on the preserved URL; canonical not equal to the preserved URL; any selector resolving to the wrong child or to no child; add-to-cart failing or carrying a wrong SKU/price on any spot-checked option; any redirect appearing on either handle.

---

## I. Code status — explicit statement

**The repository Tim could not find is `izzaahmed02/fitnesssuperstore-shopify`.** The GitHub account exposed `fitnesssuperstore1/fss-openclaw-n8n-triage`, which is the n8n triage repo, not the storefront theme — so Tim's conclusion that GitHub did not prove the no-code claim was correct at the time. The theme repo is the one this packet was prepared from, and every claim below is a file-and-line citation in it.

**No theme code change is required.** Verified in the repo:

| Requirement | Implementation | Status |
|---|---|---|
| Combined-listings parent template | `templates/product.combined-listings.json` + `sections/main-product-comb.liquid` | present, deployed, parent already assigned |
| Parent/child canonical model | `snippets/head-meta.liquid:57-67` | present, matches Tim's spec exactly |
| `?variant=` noindex | `snippets/head-meta.liquid:34-40` | present |
| Aggregated selector fallback across the family | `assets/variant-fallback-intercept.js` (combined-listing mode) | present |
| Parent-URL → child-variant redirect | `assets/product-info.js:44` `redirectCombinedListingToVariant()` | present |
| Sibling exclusion in related products | `sections/related-products.liquid:24-26`, keyed on `combined_listing.parent_product.handle` | present, follows the handle automatically |
| Parent placeholder-price handling | `snippets/price.liquid:40-46` | present |
| Predictive-search exclusion | `sections/predictive-search.liquid:116-117` | present |

The cutover is Combined Listings app + product field changes (Admin API) + Search & Discovery and merchandising app config. If the rehearsal exposes a gap, any fix goes through a branch in this repo → PR → review → unpublished theme QA → deploy. Nothing is patched or published directly to the live theme.

---

## J. Owners, window, authority

| Role | Named |
|---|---|
| Executor (cutover + rollback) | Zafran |
| Independent QA sign-off | Izza |
| Catalog truth, package equivalence, collection/tag placement, FF-RCHD5-70-R | Larianne |
| Feed formula, item-ID continuity, before/after export, channel matrix | Kevin + Masum |
| Storefront / content / SEO / Search & Discovery / customer-journey QA | Yusra + Saliha |
| Packet tracking, checkpoints, blockers, evidence | Control Tower (does not authorise release) |
| **Rollback authority** | Zafran may roll back unilaterally on any stop condition without waiting for approval |
| **Release authority** | Tim — separate written GO |

**Execution window:** proposed Tue–Thu 05:00–06:00 PT (lowest traffic). Steps B and C back-to-back, full sequence ~30 minutes including QA gates. Not scheduled until Tim gives GO.

### Immediate smoke test (within 15 minutes)
Preserved URL 200 · correct parent page and template · canonical correct · **no robots noindex** · all 54 selectors · spot-check 6 options across singles/sets/packages to the right child, right SKU, right price · one add-to-cart and checkout-start · legacy handle resolves to the archived product · no redirects on either handle · predictive search shows one entry, no child tiles.

### 24 hours
GSC coverage and crawl errors on the preserved URL · Google index status (must remain indexed) · sitemap.xml contains the preserved URL · analytics sessions on the preserved URL vs. the prior 7-day baseline · zero 404s on the family in server logs · feed diff vs. Kevin's before/after matrix · review count on the parent · no duplicate storefront entries.

### 7 days
Rankings for the preserved URL vs. baseline · organic sessions and revenue for the family · GMC disapprovals and duplicate-offer warnings · Meta/TikTok status once their owners have confirmed keying · child-page traffic distribution · confirm no redirect chains have appeared.

---

## Open items blocking GO (not owned by me)

1. **Meta and TikTok feed keying** — no verified owner has confirmed. Explicit blocker per Tim.
2. **The 43 children's feed ID decision** — approve all 43, and under bare product ID or legacy SKU. Tim + Masum + Larianne together. See §E.2: `productType` may also be required.
3. **Native Google & YouTube / Shop channel gap** — §E.1. Kevin/Masum to state whether the native channel is authoritative and, if so, publish the 48 unpublished children.
4. **FF-RCHD5-70-R disposition** — Larianne.
5. **The three loose sets** (`FF-RCHD5-60`, `FF-RCHD105-150`, `FF-RCHD5-150`) are confirmed attached as children — Larianne to confirm intended.
6. **Review migration plan and proof** — Yusra / Izza.
7. **Rehearsal go-ahead** — Tim. It is the only item in my own scope still outstanding.
