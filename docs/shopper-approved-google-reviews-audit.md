# Shopper Approved → Google Reviews — Tahoe Canary SKU Audit

**Issue:** "Shopper Approved Reviews – Not Showing Properly on Google."
The French Fitness Tahoe Seated Leg Curl / Leg Extension shows 7 reviews on-site
(5 on fitnesssuperstore.com + 2 on frenchfitness.com) but only 4 on Google.

**Owner:** Yusra | Fitness Superstore
**Canary SKU (per Tim / ChatGPT plan):** French Fitness Tahoe Seated Leg Curl / Leg Extension (New)
**Date of audit:** 2026-07-22

---

## 1. One-SKU identity audit — Fitness Superstore (Shopify Admin, live)

Pulled from the live Shopify Admin API for
`https://www.fitnesssuperstore.com/products/french-fitness-tahoe-seated-leg-curl-leg-extension-new`.

| Field | Value | Notes |
|---|---|---|
| Product ID | `9878647144764` | — |
| Variant ID (child) | `50748622405948` | Single variant ("Default Title") |
| Title | French Fitness Tahoe Seated Leg Curl / Leg Extension (New) | — |
| Brand / vendor | French Fitness | `vendor` field **and** `custom.brand` agree |
| SKU | `FFT-SLCLE` | — |
| MPN (`custom.mpn`) | `FFT-SLCLE` | Matches SKU |
| Vendor part no (`custom.vendor_part_no`) | `FFT-SLCLE` | Matches SKU |
| Product code (`custom.product_code`) | `FFT-SLCLE` | Matches SKU |
| Barcode / GTIN | `810041972699` | Valid 12-digit UPC-A |
| UPC (`custom.upc_code`) | `810041972699` | Matches barcode |
| EAN (`custom.ean`) | `0810041972699` | 13-digit form of same GTIN |
| Public product URL | https://www.fitnesssuperstore.com/products/french-fitness-tahoe-seated-leg-curl-leg-extension-new | Correct public domain (not `.myshopify.com`) |
| Featured image | `.../FFT-SLCLEactual1black.webp` | Present |
| Status | ACTIVE | Not draft/archived |
| Currency / price | USD 2799.00 | Valid currency + price present |
| Inventory | 9954, policy CONTINUE | In stock — not "Limited"/out of stock |

**Verdict (Fitness Superstore side): the product identity is clean and Google-matchable.**
A valid GTIN is present and consistent across every field, and Brand + MPN also agree — those
are exactly the identifiers Google uses to match product reviews. None of the secondary feed
blockers Tim flagged (invalid currency, missing inventory / Limited status, title mismatch)
apply to this SKU on the Fitness Superstore catalog.

## 2. Cross-domain identity (French Fitness) — NOT verifiable from here

`frenchfitness.com` is a separate storefront. It is not the Shopify store this workspace is
connected to, and its public product page blocks automated fetches (HTTP 403). The French
Fitness side of the audit must be run by someone with French Fitness Shopify / feed access.

**Key structural point:** the same product is sold on both domains and (per the Fitness
Superstore record) carries GTIN `810041972699`. If French Fitness uses the same GTIN/MPN,
then one product identity exists under **two domains and two Merchant Center accounts**, and
the 5 + 2 on-site reviews are split across them. Google attributes product reviews per
merchant/identity, so a split + a missing/unhealthy French Fitness Merchant Center destination
(the thread notes the FF sub-account `524282941` dropped off the dashboard) is a strong
explanation for "7 on-site → only 4 matched on Google."

## 3. On-site theme code audit (this repo)

What the theme actually contains for Shopper Approved:

- **Store certificate/group widget** — `snippets/modals-and-templates.liquid`
  loads `https://www.shopperapproved.com/widgets/group2.0/34099.js`.
- **PDP product-review display widget** — `sections/main-product-comb.liquid` and
  `sections/main-product-variants.liquid` (identical block) load
  `https://www.shopperapproved.com/product/34099/<sku>.js`, keyed on
  `window.product.variants[0].sku`.
- **Static review arrays** — `snippets/reviews-json.liquid` / `snippets/reviews-all.liquid`
  are hardcoded store social-proof, not part of syndication.

Findings:

1. **The review-collection bolt-on (`sa_products`) is NOT in this theme.** Only display
   widgets live here. Shopper Approved collection + the product feed it syndicates to Google
   are configured outside this repo (Shopify checkout/order-status settings and the Shopper
   Approved dashboard). **There is no theme-side code change that fixes the Google syndication
   gap** — the fix lives in the feed/domain mapping and Merchant Center, exactly where the
   thread already pointed.
2. **`window.product.variants[0].sku` always uses the *first* variant's SKU.** Harmless for
   single-variant products like the Tahoe (its only variant SKU is `FFT-SLCLE`), but on any
   multi-variant product the widget will always show the first variant's reviews regardless of
   the variant selected. Worth fixing as a separate hardening item; it is **not** the cause of
   the Tahoe Google gap.

## 4. Diagnosis

The 7→4 gap is **not** caused by bad/missing identifiers on the Fitness Superstore catalog
(the GTIN/MPN/Brand are all present and consistent) and **not** by anything fixable in this
theme repo. The remaining causes match the thread's own conclusion:

1. **Feed source/domain mapping inside Shopper Approved** — the Fitness Superstore feed was
   reported (by Jordan) to be pulling `.myshopify.com` URLs from the Shopify connector instead
   of a `www.fitnesssuperstore.com` feed. A domain mismatch here breaks Google matching.
2. **Cross-domain review split + missing French Fitness Merchant Center destination** — same
   GTIN on two domains, with the French Fitness Merchant Center sub-account unrecovered.

## 5. Recommended next actions (owners)

- **Kevin (feeds):** confirm, in writing, the exact live product-feed URL Shopper Approved uses
  for each domain, and that the Fitness Superstore feed uses `www.fitnesssuperstore.com` URLs —
  not `.myshopify.com`.
- **Jordan / Shopper Approved:** confirm the review feed→domain mapping and the last successful
  Google syndication date for each domain.
- **French Fitness Merchant Center:** recover sub-account `524282941` (or stand up a
  domain-matched replacement) so French Fitness reviews have a valid destination.
- **French Fitness catalog:** run this same identity audit on the frenchfitness.com Tahoe SKU
  and confirm GTIN/MPN/Brand parity with the table in §1.
- **Theme (optional hardening, separate from this issue):** make the PDP review widget
  variant-aware instead of hardcoding `variants[0].sku`.
- **Verification:** judge success on live Google output for the Tahoe SKU (and 3–5 other shared
  hero SKUs), not the empty Merchant Center "product review sources" screen. Allow ~4–6 weeks
  for Google display after feed corrections.
