# Gym Packages v9.1 — Public Read-Back Closure Packet

**Scope:** FF-E620T routing, FF-T850 processing time, FF-SM920T Admin/public price conflict
**Owner:** Izza
**Date:** 2026-07-28
**Controlling thread:** "All Gym Packages Website Rebuild — 2,000 sq ft pilot: FULL live validation complete"
**Monday item:** https://fsstore.monday.com/boards/18415606277/pulses/12255061697

This packet identifies the exact source producing each reported public value and states the
intended result. It does not change any product data, theme code, or live storefront behavior.

**Standing of this document.** This is evidence submitted for Tim's decision, not a closure
declaration. Opening or closing the public/price gates, lifting the FF-SM920T price HOLD, and
approving any customer-facing price remain Tim's calls. Where a check came back clean, that is
recorded as "no fault found" in the technical lane — not as a gate closed.

---

## 0. Method and the one thing I could not do

**Verified directly:** live Shopify Admin (product records, variants, metafields, publications,
markets, price lists, catalogs, automatic discounts, URL redirects) and the **published** theme.

**Theme parity is proven, not assumed.** The live published theme is
`fitnesssuperstore-shopify/main` (`gid://shopify/OnlineStoreTheme/186120208700`, MAIN role). Its
`sections/main-product.liquid` has checksum `ff7023525b7dd6dcdc1043bcbd434218` and size 194,417
bytes. The repo file returns the identical MD5 and identical byte size (verified with `md5sum` and
`stat`, not inferred). **The repo file is therefore authoritative for what the live
PDP renders**, and the line references below apply to production.

**Not done:** logged-out desktop/mobile screenshots. Outbound requests to
`www.fitnesssuperstore.com` from this environment are refused by the network policy
(proxy answers `403` to `CONNECT`), so no public HTML could be retrieved here. I will capture the
incognito desktop/mobile screenshots from a normal browser and attach them. The source-level
findings below are what determine the outcome either way, and two of the three reported values
turn out not to belong to the products under test at all.

---

## 1. FF-E620T — routing and record check came back clean; the reported values match a different product

### Intended product (Admin, verified)

| Field | Value |
|---|---|
| Product | French Fitness E620T Elliptical w/15" Touch Console (New) |
| ID | `gid://shopify/Product/10339479781692` |
| Handle | `french-fitness-e620t-elliptical-w-15-touch-console-new` |
| Status | ACTIVE, published to Online Store since 2026-04-23 (12 publications) |
| SKU | `FF-E620T` |
| Price | `$3,399.00` |
| `custom.processing_time` | `Ships in 5-7 Weeks` |
| `custom.processing_time_long` | `Ships from our Warehouse in 5-7 Weeks + Transit Time` |
| `custom.product_code` | `FF-E620T` |

All five acceptance values Tim specified (15-inch URL, FF-E620T, $3,399, 5–7 weeks, no redirect)
are **correct at source**.

### There is no 21-inch E620T product

A catalog-wide query for any product matching `E620` returns exactly **one** record — the 15-inch
one above. No 21-inch E620T product exists to redirect to. (Scope: this rules out a 21-inch *E620T*.
It does not survey 21-inch consoles on other models, which is not what the gate turns on.)

### The redirect runs the correct direction

Only two redirects touch these handles, and neither sends traffic away from the 15-inch URL:

| UrlRedirect | Path | Target |
|---|---|---|
| `538024444220` | `/products/french-fitness-e620t-elliptical-w-21-touch-console-new` | `/products/french-fitness-e620t-elliptical-w-15-touch-console-new` |
| `536328569148` | `/products/french-fitness-e600-elliptical-w-led-console-new-copy` | `/products/french-fitness-e620t-elliptical-w-15-touch-console-new` |

The 21-inch handle redirects **into** the 15-inch PDP. That is the intended behavior.

### Exact source of "$2,999 and 1–2 weeks"

A **different live product**:

| Field | Value |
|---|---|
| Product | French Fitness E600 Elliptical with LED Console (New) |
| ID | `gid://shopify/Product/10338979610940` |
| Handle | `french-fitness-e600-elliptical-w-led-console-new` |
| SKU | `FF-E600` |
| Price | **`$2,999.00`** |
| `custom.processing_time` | **`Ships in 1-2 Weeks`** |

Both reported numbers match FF-E600 exactly. This is a wrong-product read, not a routing defect.

### Why the two get conflated (the real, fixable defect)

Redirect `536328569148` above — `…-e600-…-new-copy` → the E620T handle — indicates the E620T record
was created by duplicating the E600 record and then renamed (Shopify auto-creates a redirect on a
handle change). Creation timestamps are consistent with that order: E600 `2026-03-18T00:40:11Z`,
E620T `2026-03-18T22:21:08Z` — E620T created about 22 hours after E600. This is a strong inference
from the redirect plus timestamps, not a logged history.

Three artifacts still carry the wrong identity on the E620T product:

1. `custom.productnameshort` = `French Fitness E620T Elliptical w/21" Touch Console - Commercial Grade, Lifetime Frame Warranty` — **says 21 inch. Wrong.**
2. `product_seo.product_seo_template` = `French Fitness E300 Elliptical Trainer w/ LED Console:||:…` — **an entirely different model (E300)**. This is an app-owned field. **I did not confirm whether it is currently applied to the live page**, and it is worth noting the native Shopify SEO fields on E620T are both empty (`seo.title` and `seo.description` are null), so the page title falls back to the correct `product.title`. Flagging it as wrong data to clean rather than as a proven live symptom.
3. `custom.short_description` says "21-inch stride" on both E600 and E620T. That one is legitimate (stride length, not console size) but it compounds the confusion in any text scan.

The PDP `<h1>` renders `product.title` (`sections/main-product.liquid:876`), which is correct, so
the page itself does not display "21 inch" in the heading. The wrong values live in the metafields
above, which is where feeds and SEO output read from.

### Result

**Technical lane — no fault found.** The E620T record is correct and correctly published, and no
redirect diverts the intended URL. I found nothing to fix in theme, redirect, cache, app, market,
or routing for this item. Whether that closes the E620T gate is Tim's call.

**Source-data cleanup required (Product lane, Larianne):** correct `custom.productnameshort` to
15-inch and clear/repoint `product_seo.product_seo_template` off the E300 content.

**Re-read requested:** the $2,999 / 1–2 week pair matches FF-E600 exactly. To settle which record
the earlier read resolved to, a fresh read against
`/products/french-fitness-e620t-elliptical-w-15-touch-console-new` — with the URL and timestamp
recorded — would close the question either way. If that read still returns $2,999 / 1–2 weeks
against the 15-inch URL, send it to me and I will reopen this item immediately, because nothing in
Admin or the published theme can currently produce that result.

---

## 2. FF-T850 — the 1–2 week approval was never written to the fields the PDP reads.

### How the PDP renders lead time

`sections/main-product.liquid:835–841` (live theme, checksum-matched):

```liquid
{% if product.available and product.metafields.custom.processing_time != blank %}
  …
  {{ product.metafields.custom.processing_time_long }}
  <span class="more-info" data-customfield="Processing Time"
        data-processingtime="{{ product.metafields.custom.processing_time }}">(More Info)</span>
```

The displayed string is `custom.processing_time_long`, verbatim. There is no hardcoded lead time,
no conditional override, and no market/locale branch in this path.

**Scope limit, stated honestly:** I audited the theme Liquid and the product metafields. I did not
audit installed-app script tags or theme app extensions, so I cannot claim "no app anywhere could
inject a lead time." What I can say is that the theme's own render path takes the metafield
verbatim, and that the metafield currently holds the wrong value — which is sufficient to explain
the FAIL without invoking an app.

### FF-T850's current values

| Metafield | Current value |
|---|---|
| `custom.processing_time` | **`Ships in 3-5 Weeks`** |
| `custom.processing_time_long` | **`Ships from our Warehouse in 3-5 Weeks + Transit Time`** |
| `custom.processing_time_filter` | **`Ships in 2-5 weeks`** |

The approved 1–2 week status is **not present in any of the three fields**. The public PDP
therefore cannot display it. Nothing is cached or stale — the value was never changed.

### Proof the pipeline itself works

Two products on the identical code path render correctly today:

| Product | `processing_time` | `processing_time_long` | `processing_time_filter` |
|---|---|---|---|
| FF-HPB100 | `Ships in 1-2 Weeks` | `Ships from our Warehouse in 1-2 Weeks + Transit Time` | `Ships in 2 weeks or less` |
| FF-E620T | `Ships in 5-7 Weeks` | `Ships from our Warehouse in 5-7 Weeks + Transit Time` | `Ships in 5 weeks or more` |

FF-HPB100 is the one product Tim confirmed **passes** public read-back at 1–2 weeks. It is the
exact template for the values FF-T850 needs.

### FF-T850 is the only ACTIVE French Fitness treadmill not on 1–2 weeks

Full count across 18 French Fitness products titled "Treadmill":

- **15 read `Ships in 1-2 Weeks`:** FF-T300, FF-T400, FF-T600, FF-T700, FF-T800, FF-T900, FF-CT50,
  FF-CT-70, FF-CT80, FF-CT-100, FF-FT300, FF-FT500, FF-ST100, FF-ST200, FF-ST300.
- **FF-T850 — `Ships in 3-5 Weeks`** (ACTIVE).
- **FF-T100 — `Ships in 4-6 Weeks`** (UNLISTED, so not publicly reachable).
- **FF-PVC375 — `Ships in 2-5 Business Days`** (a floor mat, not a treadmill).

So among ACTIVE treadmills FF-T850 is the sole outlier. It is not the only record in the family
off 1–2 weeks catalog-wide — FF-T100 is at 4–6 weeks, but it is UNLISTED and therefore outside the
public read-back.

### On the reported "3–7 business days"

That string is not FF-T850's stored value and does not appear in the PDP lead-time code path. The
metafield vocabulary does contain business-day values — `Ships in 2-5 Business Days` on FF-PVC375
and FF-HPB100-V2 — so the read most likely landed on a different product, the same way the E620T
read did. **I need the exact URL and timestamp of that read to reconcile it.** Either way, the
finding above stands: FF-T850's own value is 3–5 weeks and must be changed.

### Result

**Theme — no fault found; no code change required.** The FAIL Tim recorded is real, and its cause
is source data. Set on FF-T850:

- `custom.processing_time` → `Ships in 1-2 Weeks`
- `custom.processing_time_long` → `Ships from our Warehouse in 1-2 Weeks + Transit Time`
- `custom.processing_time_filter` → `Ships in 2 weeks or less`

Public read-back will then pass without any deployment.

---

## 3. FF-SM920T — source trace on the $4,799 Admin / $4,299 public question

### Intended product (Admin, verified)

| Field | Value |
|---|---|
| Product | French Fitness SM920T Stairmill w/Touch Screen (New) |
| ID | `gid://shopify/Product/10204291203388` |
| Handle | `french-fitness-sm920-ts-stairmill-w-touch-screen-new` |
| Status | ACTIVE, published |
| SKU | `FF-SM920T` |
| Price | **`$4,799.00`** (single variant, `compareAtPrice: null`) |
| `custom.retail_price` | `589900` → `$5,899.00` |

The PDP shows `custom.retail_price` struck through above the variant price when it is the higher
of the two (`sections/main-product.liquid:240–266` and `901–927`), i.e. **$5,899 struck through,
$4,799 selling**. `$4,799` is the only selling price the intended product can render.

### No override exists anywhere in the pricing chain

Checked exhaustively; nothing can produce a different PDP price for this product:

- **Market price lists:** five market catalogs carry price lists — United States, Canada, Mexico,
  International, UK — and every one is `PERCENTAGE_DECREASE` **0**. (Correcting my own earlier
  count: seven *markets* are enabled, but only these five have market catalogs with price lists.
  "All B2B" and "International (duties not collected)" returned no market catalog.)
- **B2B price list:** the `b2b` company-location catalog's price list holds **zero fixed prices** —
  queried directly, empty result. It also would not apply to a logged-out public PDP.
- **Catalogs:** no product-level price override on this variant.
- **Automatic discounts:** exactly one active ("auto discount", 5%). It is cart-level, not a PDP
  price, and 5% of $4,799 is not $4,299 in any case.
- **Variant:** single variant, no `compareAtPrice`.

### Exact source of "$4,299"

A **different live product** — the same sibling-confusion pattern as E620T/E600:

| Field | Value |
|---|---|
| Product | French Fitness SM900 Stairmill w/LED (New) |
| ID | `gid://shopify/Product/10380780503356` |
| Handle | `french-fitness-sm900-stairmill-w-led-new` |
| SKU | `FF-SM900` |
| Price | **`$4,299.00`** |

Note the two records were updated six minutes apart on 2026-07-27 (SM920T 10:39:17Z, SM900
10:45:03Z), which is consistent with both being open during the same editing session.

### Result — evidence for Tim's decision; HOLD stays in place

**The price HOLD remains in place per Tim's instruction.** This packet does not lift it and does
not set a customer-facing price.

What the source trace establishes: FF-SM920T's own record carries **$4,799** and nothing in the
pricing chain can render a different figure for it, while **$4,299 is FF-SM900's price** on a
separate live product. Which figure is the intended customer price, which source controls it, and
when the HOLD lifts are Tim's calls, with commercial sign-off from Tim and Carlos. If Tim resolves
it to $4,799, the Shopify-Admin scenario is the one that matches these figures — but that
determination is his to make, not this packet's.

### Additional item — FF-SM920T lead-time fields

Adding this to the open list rather than treating SM920T's lead time as settled. Its processing
fields currently read:

| Metafield | Current value |
|---|---|
| `custom.processing_time` | **`Ships in 3-5 Weeks`** |
| `custom.processing_time_long` | **`Ships from our Warehouse in 3-5 Weeks + Transit Time`** |
| `custom.processing_time_filter` | **`Ships in 2-5 weeks`** |

FF-SM920T and FF-SM900 are the only two French Fitness stairmills still on 3–5 weeks; FFS-SM200,
FFB-SM200, FF-SC500 and FF-SC600 all read `Ships in 1-2 Weeks`. If the approved 1–2 week status
applies to SM920T as it does to T850, it needs the same three-field correction.

---

## 4. Consolidated status

Gate status is Tim's to set. The table records only what the technical check found.

| Item | Technical check | Source finding | Owner of the fix |
|---|---|---|---|
| FF-E620T routing | No fault found — record correct, published, redirect correct, no 21-inch E620T exists | $2,999 / 1–2 weeks matches FF-E600 exactly. Plus stale duplicate-lineage metafields on E620T (`productnameshort` says 21", `product_seo_template` says E300) | Product — metafield cleanup; re-read against the 15-inch URL |
| FF-T850 lead time | No fault found — theme renders the metafield verbatim | Approved 1–2 weeks never written; still `Ships in 3-5 Weeks`. Only FF treadmill still on 3–5 weeks | Product — 3 metafields |
| FF-SM920T price | No fault found — no override in markets, catalogs, price lists, or discounts | SM920T's record carries $4,799; $4,299 is FF-SM900's price | Tim — HOLD and intended price remain his decision |
| FF-SM920T lead time | No fault found — same code path | Still `Ships in 3-5 Weeks`, not 1–2 weeks | Product — 3 metafields, pending Tim's confirmation the 1–2 week status applies |

**No theme code change is required for any of the four.** Every defect I could act on is product
source data. Zafran is not needed — there is no shared architecture, app, routing, cache, or market
issue.

## 5. Exact corrections requested (Product lane)

**FF-T850** and **FF-SM920T**, identical for both — the SM920T set pending Tim's confirmation that
the approved 1–2 week status applies to it as it does to T850:

| Metafield | From | To |
|---|---|---|
| `custom.processing_time` | `Ships in 3-5 Weeks` | `Ships in 1-2 Weeks` |
| `custom.processing_time_long` | `Ships from our Warehouse in 3-5 Weeks + Transit Time` | `Ships from our Warehouse in 1-2 Weeks + Transit Time` |
| `custom.processing_time_filter` | `Ships in 2-5 weeks` | `Ships in 2 weeks or less` |

**FF-E620T:**

| Metafield | From | To |
|---|---|---|
| `custom.productnameshort` | `French Fitness E620T Elliptical w/21" Touch Console - Commercial Grade, Lifetime Frame Warranty` | same string with **15"** |
| `product_seo.product_seo_template` | `French Fitness E300 Elliptical Trainer w/ LED Console:||:…` | E620T 15-inch content, or cleared |

These are metafield edits and take effect without a deployment. I will re-run the logged-out
desktop/mobile read-back and attach screenshots once they are applied.

## 6. Development lane — confirmed held

No dedicated Gym Packages v9.1 branch or PR exists, which matches Tim's read:

- `feature/gym-packages` on origin is stale — last commit `fdd243c`, **2025-05-19**, 14 months old. Not v9.1.
- PR #647 is the separate SP-HG3500 workstream and will not be reused.
- No other open PR touches Gym Packages v9.1 — checked all 11 open PRs (#622, #625, #640, #647, #654, #663, #664, #668, #669, #672, #673), not a first page only.

Per Tim's instruction, the dedicated branch, PR, preview theme link, and test plan will be created
**only after** the controlled Parts 1–3 source passes QA. Nothing is merged, deployed, or
published, and no scale-up to 2,500–5,000 sq ft has been started.
