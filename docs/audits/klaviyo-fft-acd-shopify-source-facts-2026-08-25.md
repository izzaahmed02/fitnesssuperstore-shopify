# READ-ONLY — Shopify-side source & integration facts for FFT-ACD

**Scope:** One SKU only — `FFT-ACD`, French Fitness Tahoe Assisted Chin Dip (New).
**Purpose:** Supply the Shopify-side inputs for the Klaviyo catalog-source map requested in the
thread *"READ-ONLY AUDIT — Klaviyo catalog source mismatch for FFT-ACD (separate from Top 100 quote)."*
**Captured:** 2026-08-25 (Pacific) against the live store `79ef8b-5e.myshopify.com` /
`https://www.fitnesssuperstore.com`.
**Change status:** None. Read-only queries only. No metafield, feed, catalog-app, theme, media,
Klaviyo, or product change was made.

---

## 1. Product record of truth (Shopify)

| Field | Live value |
|---|---|
| Product GID | `gid://shopify/Product/9878630400316` |
| Product ID | `9878630400316` |
| Variant GID | `gid://shopify/ProductVariant/50748586950972` |
| Variant ID | `50748586950972` |
| Inventory item GID | `gid://shopify/InventoryItem/52598244344124` |
| Title | French Fitness Tahoe Assisted Chin Dip (New) |
| Handle | `french-fitness-tahoe-assisted-chin-dip-new` |
| Status | ACTIVE |
| Vendor | French Fitness |
| Product type | Product Index |
| Variants | 1 (`Default Title`) |
| SKU | `FFT-ACD` |
| Barcode / UPC | `810041972552` |
| Price | `2799.00` USD |
| Compare-at price | none |
| Created | 2025-01-14T15:18:37Z |
| Published | 2025-01-14T15:18:38Z |
| **Product last updated** | **2026-08-24T19:45:48Z** |
| **Variant last updated** | **2026-08-24T19:45:48Z** |
| Theme template suffix | `customised-product` |

> Note vs. the evidence pack: the pack lists "Shopify product last updated: August 22, 2026."
> The live record now reads **2026-08-24T19:45:48Z**, i.e. the product changed again after the
> pack was captured. The mismatch conclusion is unaffected, but the pack's timestamp is stale.

### Canonical product URL

`https://www.fitnesssuperstore.com/products/french-fitness-tahoe-assisted-chin-dip-new`

This is confirmed in three independent places, all in agreement:

- `onlineStoreUrl` (Shopify-computed)
- `custom.product_canonical_url` metafield (URL type)
- `meetanshi.canonical_url_json` metafield → `{"en": "…/products/french-fitness-tahoe-assisted-chin-dip-new"}`

### Primary image (source of truth)

```
https://cdn.shopify.com/s/files/1/0884/2012/2940/files/
FFT_NEW_ACD_FFT-ACD_HERO_1x1_META_v01_1d82950b-617d-452a-9a69-48a44bd7c87c.webp?v=1787244316
```

- Media GID: `gid://shopify/MediaImage/46179363914044`
- Dimensions: **2048 × 2048 (1:1)**
- Alt text: "French Fitness Tahoe Assisted Chin Dip - Side View"
- CDN version stamp `v=1787244316` = **2026-08-20T16:45:16Z**
- Position 1 of 13 product images; the variant has **no** variant-level image override
  (`variant.image = null`), so the variant inherits the product hero.

Full media set: 13 images, all on the Shopify CDN. Order is
hero 1:1 → infographic → v2 → creative → FFT-ACD-1 → FFT-ACD-2 → FFT-ACD_01…_06 → side-by-side.

---

## 2. Why the Klaviyo URL and image look the way they do (legacy-platform origin)

Both stale values in the Klaviyo custom catalog item follow the **Volusion** URL scheme that
predates the Shopify store:

| Stale Klaviyo value | Pattern | Reading |
|---|---|---|
| `…/French-Fitness-Tahoe-Assisted-Chin-Dip-New-p/FFT-ACD.htm` | Volusion `-p/<SKU>.htm` PDP route | Legacy storefront URL |
| `…/v/vspfiles/photos/FFT-ACD-2.jpg` | Volusion `/v/vspfiles/photos/` asset root | Legacy image path |

Corroborating evidence inside the current Shopify theme:

- `snippets/clean-description.liquid` exists specifically to strip **"legacy Volusion-era HTML"**
  from rich-text at render time, neutralising `/v/vspfiles/` `href`s and `src`s. The store
  therefore carries known Volusion residue.
- The store holds **3,969 URL redirects**, consistent with a bulk legacy → Shopify migration map.

### The legacy Klaviyo URL is redirected, not broken

Two live Shopify 301 redirects cover this SKU:

| Redirect GID | Path | Target |
|---|---|---|
| `gid://shopify/UrlRedirect/536931893564` | `/french-fitness-tahoe-assisted-chin-dip-new-p/fft-acd.htm` | `/products/french-fitness-tahoe-assisted-chin-dip-new` |
| `gid://shopify/UrlRedirect/540735406396` | `/french-fitness-tahoe-assisted-chin-dip-p/fft-acd.htm` | `/products/french-fitness-tahoe-assisted-chin-dip-new` |

**Consequence for the audit:** the Klaviyo catalog URL still lands a customer on the correct PDP,
via one extra hop. So the customer-facing risk is *degradation* (extra redirect, lost UTM fidelity
in some cases, and a wrong hero image in dynamic blocks), **not** a hard 404. That lowers urgency
but does not remove the defect.

### The legacy image is a different asset, not a missing one

The legacy filename stem `FFT-ACD-2` **does** exist on the Shopify CDN as
`FFT-ACD-2.webp` (`gid://shopify/MediaImage/43354361790780`, alt "…Front View") — but it sits at
**position 6**, not position 1. The Klaviyo item is pinned to what used to be the primary image
under Volusion; the current 1:1 META hero did not exist then (uploaded 2026-08-20).

---

## 3. Shopify → Klaviyo integration surface (what is observable from Shopify)

### Confirmed installed

The Klaviyo app is installed and its onsite embed is **live** on the published theme:

```
config/settings_data.json → current.blocks."855628211100114053"
  type:     shopify://apps/klaviyo-email-marketing-sms/blocks/klaviyo-onsite-embed/2632fe16-…
  disabled: false
```

Klaviyo signup forms are also hard-coded into two theme sections (same form ID `Ud8shK`):
`sections/homepage-subscription.liquid:18` and `sections/page-subscription.liquid:21`.

Because the native Klaviyo ↔ Shopify app connection is present, a **Shopify-native Klaviyo
catalog is expected to exist alongside the `$custom` catalog**. That expectation must be
confirmed inside Klaviyo (see §5) — it cannot be proven from the Shopify side.

### Other feed/sync apps embedded on the theme

| App embed | Enabled |
|---|---|
| `multifeeds` (product feed generator) | **yes** |
| `smart-seo` / `smartseo` (broken-link detection) | yes |
| `boost-ai-search-filter` (SSR + instant search) | yes |
| `judge-me-reviews` (core) | yes |
| `powerful-form-builder`, `instafeed`, `impact-com` consent mode | yes |
| `attributepro`, `gorgias-live-chat-helpdesk`, `stape-conversion-tracking`, Judge.me reviews-tab/popup | disabled |

`multifeeds` is the only enabled generic product-feed app on the theme and is the most likely
Shopify-side candidate if the `$custom` Klaviyo catalog is fed by a file/URL feed rather than by
the native app. **This is a lead, not a finding** — its feed destinations were not inspected.

### Sales channels FFT-ACD is published to

Online Store · Point of Sale · Shop · Facebook & Instagram · Google & YouTube · Meta Dev ·
Shopify GraphiQL App. (TikTok is a store channel but this product is not published to it.)
**No Klaviyo sales channel/publication exists** — expected; Klaviyo does not publish as a channel.

---

## 4. Field-by-field source of truth (answers Joshua's question 4, Shopify side)

| Field | Shopify source of truth | Current value |
|---|---|---|
| Product URL | `product.onlineStoreUrl`; mirrored in `custom.product_canonical_url` and `meetanshi.canonical_url_json` | `/products/french-fitness-tahoe-assisted-chin-dip-new` |
| Primary image | `product.featuredMedia` (position 1 of product media) | 1:1 2048² META hero on Shopify CDN |
| Additional images | `product.media` positions 2–13 | 12 further Shopify CDN images |
| Price | `variant.price` | `2799.00` USD |
| Compare-at / MSRP | `variant.compareAtPrice` (null) — MSRP is carried separately in `custom.retail_price` as cents | `retail_price = 389900` (= $3,899.00) |
| Availability | `variant.availableForSale` + `inventoryItem.inventoryLevels` | `true` |
| SKU | `variant.sku` (mirrored in `custom.product_code`, `custom.mpn`, `custom.vendor_part_no`) | `FFT-ACD` |
| Product ID | `product.id` (mirrored in `custom.shopify_product_id`) | `9878630400316` |
| Variant ID | `variant.id` | `50748586950972` |
| Title | `product.title` | French Fitness Tahoe Assisted Chin Dip (New) |
| Description | `product.descriptionHtml`, rendered through `snippets/clean-description.liquid` | 4 paragraphs |
| Condition | `custom.condition_state` | `New` |

### Availability needs an explicit decision before any Klaviyo mapping

Single stocking location — **537 Stone Rd. STE F** (`gid://shopify/Location/99240247612`):

| Quantity | Value |
|---|---|
| available | 9,907 |
| on hand | 9,924 |
| committed | 17 |
| incoming | 0 |
| tracked | true |
| inventory policy | DENY |

A spot check across French Fitness SKUs shows quantities clustered at or just under **9,999**
(e.g. 9,999 / 9,998 / 9,997 / 9,993 / 9,991). These read as an "effectively always available"
stocking convention rather than real warehouse counts. This matters because Klaviyo's
`catalog-variant.inventory_quantity` combined with `inventory_policy` governs whether an item
appears in dynamic product feeds and blocks. **Ops/merchandising should confirm the convention
before anyone maps Shopify quantity into a Klaviyo variant field.**

---

## 5. What could NOT be established from the Shopify side

State these as open, not assumed:

1. **Which system writes the `$custom` Klaviyo catalog.** Nothing in Shopify records an outbound
   writer. Shopify has no field that names the producer of a Klaviyo `$custom` catalog item.
2. **Whether a Shopify-native Klaviyo catalog also exists, and whether FFT-ACD is duplicated.**
   Only visible inside Klaviyo.
3. **Whether the `$custom` item is referenced by any live flow, campaign, product block, or
   template.** Only visible inside Klaviyo. **Do not treat the stale URL/image as evidence of
   disuse** — per the thread boundary.
4. **The full installed-app inventory.** `appInstallations` returned `access denied` for the
   session's Admin API credentials, so the app list above is derived from published-theme app
   embed blocks only. Apps that sync headlessly, without a theme extension, would not appear.
5. **Outbound webhook subscriptions belonging to other apps.** `webhookSubscriptions` returned
   empty, but that query only ever returns webhooks owned by the *querying* app. It is **not**
   evidence that Klaviyo or any other app lacks Shopify webhooks.
6. **Live HTTP status of the legacy URL and legacy image.** `www.fitnesssuperstore.com` is blocked
   by this environment's network egress policy. The redirect rows in §2 are read from the Shopify
   redirect table, which is authoritative for the rule but not a live response capture.

---

## 6. Standing constraints honoured

- No mutation, deletion, republish, remap, or bulk refresh of any Klaviyo catalog.
- No change to Shopify metafields, feeds, catalog apps, theme code, or product media.
- One SKU only. No sales values, customer data, or credentials included.
- Separate from the Top 100 Meta creative quote; nothing here blocks that package.
- No broad catalog-rebuild work proposed or started.
