# READ-ONLY INDEPENDENT QA — Klaviyo custom-catalog source mismatch, FFT-ACD

**Role:** Yusra — independent read-only QA / PASS-HOLD verification.
**Assignment verified against:** Tim, 2026-08-26 22:09 UTC — *"Yusra — after the above responses,
independently issue one PASS/HOLD covering updater containment, exact feed identities, Klaviyo
consumers, current Shopify source, rollback, and remaining risk."*
**Captured:** 2026-08-27, live.
**Scope:** One SKU only — `FFT-ACD`, French Fitness Tahoe Assisted Chin Dip (New).
**Change status:** None. No Klaviyo, Shopify, feed, catalog, GitHub, app, flow, campaign,
template, media, or automation change was made. No campaign was sent or scheduled.

---

## Overall verdict: **HOLD**

One of six areas passes. The current Shopify source is fully verified. Updater containment,
exact feed identities, the Klaviyo consumer map, and rollback all remain unproven, and two
previously unnamed risks are added below.

| # | Area | Verdict |
|---|---|---|
| 1 | Updater containment | **HOLD** — not proven disabled |
| 2 | Exact feed identities | **HOLD** — 3-vs-4 conflict resolved as a category error; six feeds now need naming |
| 3 | Klaviyo consumers | **HOLD** — new draft-flow exposure identified |
| 4 | Current Shopify source | **PASS** — verified field by field |
| 5 | Rollback | **HOLD** — cannot be authored before item 1 closes |
| 6 | Remaining risk | **HOLD** — confirmed customer-facing defect, see §6 |

---

## 1. Updater containment — HOLD

**Not verified, by me or by Masum.** Masum's 2026-08-27 reply marks feed identity, owner, source
mechanism, schedule, run history, current status and cross-system use all NOT VERIFIED for want of
Klaviyo source-settings access. I reach the same wall from a different direction (see §7, blocker 1).

**Documentary evidence located in the audit sheet Joshua linked** (*Flows Audit — Controlled
Retirement*), recorded verbatim:

| Field | Value |
|---|---|
| Name | New Klaviyo Feed |
| Added date | Sep 3, 2022 |
| Last Updated | Mar 14, 2025 |
| Error | `requestFailed: Received 404 status code from request to https://www.fitnesssuperstore.com/v/vspfiles/feeds/bingshopping-klaviyo.txt.` |
| Source Link | `https://www.fitnesssuperstore.com/v/vspfiles/feeds/bingshopping-klaviyo.txt` |
| Products linked | "Count went beyond 1000+ products… the calculation stopped at 1100 but the pages continue." |

**Timing correlation.** The Klaviyo item is frozen at 2025-03-07 and the sheet records this source
last updated 2025-03-14 with a 404. That is consistent with a legacy source that stopped
succeeding in March 2025.

**Do not over-read it.** A Klaviyo web/data feed is a template-time fetch, not necessarily the
process that writes catalog items. This record names a legacy source and a failure; it does not
establish that this source is the catalog updater. That distinction is still open and is the
single most important thing left to close.

**Shopify-side negative evidence (mine, this session):**

- No Klaviyo-namespace metafield on the product. Namespaces present: `global`, `custom`,
  `mm-google-shopping`, `mc-facebook`, `options`, `meetanshi`, `product_seo`, `judgeme`, `reviews`.
- Nothing in Shopify carries the legacy `.htm` URL or the `vspfiles` image path.
  `custom.product_canonical_url` and `meetanshi.canonical_url_json` both hold the correct PDP.
- `webhookSubscriptions` → empty. **This is not evidence of absence** — see §7, blocker 4.

---

## 2. Exact feed identities — HOLD. The three-versus-four conflict is a category error.

Tim asked for this conflict to be resolved. It resolves against Joshua's statement.

The sheet's controlled-retirement note reads, verbatim:

> "Custom Catalog will not be deleted. 4 items listed under: BSLDGAP1, BSLDGAP5, BSLDGAP9,
> FF-FSR90-APU remain as PUBLISHED. Affected product Feeds now have a TAG for DO NOT USE."

The **4 is a count of published catalog items, not of feeds.** Joshua's reply — "The 4 product
feeds using the custom catalog were tagged with DO NOT USE" — restates an item count as a feed
count. Tim's reading was correct.

The sheet holds **two different feed tables, and neither lists four feeds.**

**Table A — Product Feeds List** (Name / In Use / Flow / Status). Three feeds In Use = Yes:

| Feed | In Use | Flow | Status |
|---|---|---|---|
| `NewBA_FF` | Yes | Browse Abandonment / ATC | **Draft** |
| `NewBA_REMAN` | Yes | Browse Abandonment / ATC | **Draft** |
| `NewBA_NEWP` | Yes | Browse Abandonment / ATC | **Draft** |

All other ~18 listed feeds are In Use = No / N/A (`French_Fitness_Added`, `New_Added_to_Cart`,
`SE_French_and_Remanufactured`, `MemorialDay_2/3`, `MemoorialDay_2`, `New_BA2`, `RemNew_BA`,
`Remanufactured_BA`, `Test`, `Strength`, `French_Fitness`, `BIGC_POPULAR_ALL_CATEGORIES`,
`SHOP_POPULAR_ALL_CATEGORIES`, `Products`, `Products_UNPERSONALIZED`, `FrenchFitness`).

**Table B — asset inventory.** Three **Active** Product Feeds, each with catalog source selected
`API: Default`:

| Feed | Status | Klaviyo link | Created | Sheet's own result |
|---|---|---|---|---|
| `FrenchFitness` | Active | `klaviyo.com/product-feeds/1174110/edit` | Aug 12, 2021 | "Can be deleted to prevent use" |
| `Products_UNPERSONALIZED` | Active | `klaviyo.com/product-feeds/1844570/edit` | Sep 14, 2022 | "Can be deleted to prevent use" |
| `Products` | Active | `klaviyo.com/product-feeds/1168063/edit` | Aug 9, 2021 | "Can be deleted to prevent use" |

**Three findings that follow:**

1. **The two sets of three are different feeds.** The three In Use = Yes feeds (`NewBA_*`) are
   *not* the three Active feeds sourced to `API: Default`. So six named feeds are in play, not
   three and not four.
2. **The `NewBA_*` feeds' catalog source is stated nowhere in the sheet.** That is a second gap
   that has not previously been named in this thread.
3. **Neither table shows a DO NOT USE tag, a numeric feed ID for the `NewBA_*` feeds, or a
   screenshot.** The containment claim has no supporting evidence in the artifact Joshua cited.

**Still required:** exact names, numeric IDs, current status and tag screenshots for all six
feeds — plus the selected catalog source for each `NewBA_*` feed.

---

## 3. Klaviyo consumers — HOLD, with new draft-flow exposure

I cannot independently confirm Tim's live-flow and live-campaign readback (§7, blocker 1). I do
not dispute it; I mark it NOT VERIFIED by me.

**New, from the sheet's flow-spec tabs.** The three In Use = Yes feeds are bound to live-named
flows currently in Draft:

- `SE - Browse Abandonment` — flow ID `StKF69` — Paths 1–4, feeds `NewBA_FF` / `NewBA_NEWP` / `NewBA_REMAN`
- `SE - Added to Cart` — flow ID `QSzrkW` — Paths 1–4, same feed set

Tim's readback found no live Browse Abandonment or Added-to-Cart flow. That is consistent with
Draft status — and it is the reason this is a risk rather than an incident.

**Draft is a state, not containment.** The moment either flow is set live, three In-Use feeds
begin serving. If their source resolves to the custom catalog, the stale FFT-ACD record
($2,699, legacy URL, legacy image) becomes customer-facing. This is the material live-flow risk
Tim asked Control Tower to escalate, and it is a scheduling risk with a named trigger, not a
hypothetical.

**FFT-ACD is designed into Browse Abandonment content.** The spec tab lists it as
"Secondary product 1" of Browse Abandonment PATH 1 / LOW, EMAIL #1, at $2,799.00 with inventory
9913. Worth noting: the spec carries the **correct** $2,799 price, so it was authored from
Shopify, not from the stale catalog. But this SKU is not incidental to BA.

**Supporting negative evidence.** The 4-item cross-reference tab (Flow / Email / API Use /
BSLDGAP1 / BSLDGAP5 / BSLDGAP9 / FF-FSR90-APU / Sku-Title) reads "Not Present" across
SE - Welcome flow, Abandoned Checkout, Post-Purchase, Post-Delivery Satisfaction, Universal
Content and Templates Important Dates. That supports "no current consumer" **for those four
items** — it does not cover FFT-ACD, and it does not cover the BA/ATC drafts.

---

## 4. Current Shopify source — PASS

Verified live, read-only, 2026-08-27. Every field Tim listed:

| Field | Live value | Verdict |
|---|---|---|
| Product GID | `gid://shopify/Product/9878630400316` | PASS |
| Title | French Fitness Tahoe Assisted Chin Dip (New) | PASS |
| Status | `ACTIVE` | PASS |
| Vendor | French Fitness | PASS |
| Handle | `french-fitness-tahoe-assisted-chin-dip-new` | PASS |
| `onlineStoreUrl` | `https://www.fitnesssuperstore.com/products/french-fitness-tahoe-assisted-chin-dip-new` | PASS — matches Larianne's approved PDP exactly |
| Variant GID | `gid://shopify/ProductVariant/50748586950972` | PASS |
| SKU | `FFT-ACD` | PASS |
| Price | `2799.00` USD | PASS |
| `availableForSale` | `true` | PASS |
| `inventoryQuantity` | `9907` | PASS |
| `inventoryPolicy` | `DENY`, `tracked: true` | PASS |
| Featured media | `gid://shopify/MediaImage/46179363914044`, 2048 × 2048 | PASS |
| Featured filename | `FFT_NEW_ACD_FFT-ACD_HERO_1x1_META_v01_1d82950b-617d-452a-9a69-48a44bd7c87c.webp` | PASS — stem matches Larianne's approved hero master |
| Product `updatedAt` | `2026-08-26T14:29:41Z` | PASS — matches Tim's "Aug 26, 2026" |
| Variant `updatedAt` | `2026-08-24T19:45:48Z` | PASS — matches Tim's "Aug 24, 2026" |
| Created / published | `2025-01-14T15:18:37Z` / `…:38Z` | PASS |

**Larianne's media findings independently confirmed by opening the assets.** I rendered the
approved hero master from Drive and the side-by-side creative from the Shopify gallery:

- Approved hero shows the assist dip/chin unit alone — placard reads `ASSIST DIP/CHIN`. Exact
  product, single product. **PASS.**
- `Option_1_-_FFT-ACD_-_FFT-SLCLE.webp` (`gid://shopify/MediaImage/45674083516732`) shows two
  machines: assist dip/chin on the left, a `LEG EXTENSION / SEATED LEG CURL` unit on the right.
  It is a genuine multi-product creative, it is present in the Shopify gallery, and it is **not**
  the featured image. Larianne's caution is correct and is now visually verified. **PASS.**

**One correction to the Aug 23 evidence pack.** It records "Shopify product last updated:
August 22, 2026." The live value is `2026-08-26T14:29:41Z`. The pack's timestamp is stale; the
mismatch conclusion is unaffected.

---

## 5. Rollback — HOLD

Two reasons, and the second matters more than the access gap.

1. **No before-state.** A rollback needs a before-state export of the Klaviyo item and variant.
   I cannot produce or verify one (§7, blocker 1).
2. **Sequencing.** The correct rollback design depends on which system writes the item. If an
   updater is still live, rolling back a manual overwrite would simply be re-overwritten on the
   next successful run. **Rollback cannot be signed off before §1 closes.** It is not merely
   blocked on access; it is blocked on order of operations.

The one rollback-adjacent fact I can state: the item ID is stable and known
(`$custom:::$default:::FFT-ACD`) and Klaviyo's bulk-update endpoint is field-level, so a
field-level restore is mechanically possible once a before-state JSON exists.

---

## 6. Remaining risk — HOLD. Both captures are now complete, and they split.

The thread has been treating the stale URL and the stale image as one defect of equal severity.
Both were captured in-browser on 2026-08-27, and they are **not** equal: one is a hard failure and
one is graceful degradation.

### The image — CONFIRMED 404. This is the severe half.

`https://www.fitnesssuperstore.com/v/vspfiles/photos/FFT-ACD-2.jpg` returns the storefront
**404 "Page not found"** page, not an image.

Predicted from the redirect table and now observed. The full live table (3,970 rows, EXACT count)
carries only two `/v/vspfiles/` entries — `/v/vspfiles/assets/images/ff-wr40.mp4` and
`/v/vspfiles/photos/fmsquatgzfm6010-2t.jpg` — and **neither is `FFT-ACD-2.jpg`**. No redirect, no
origin asset, dead path.

**Consequence:** the image on the Klaviyo catalog item is not stale, it is **broken**. Any dynamic
product block, feed or template that renders `$custom:::$default:::FFT-ACD` shows a customer a
broken image. Read with §3 — three In Use = Yes feeds bound to Browse Abandonment and Added to
Cart drafts — the exposure if either flow is set live is a broken hero **and** a $100-low price
together. Verified defect chain, not a hypothesis, and the strongest reason to gate those drafts.

### The URL — CONFIRMED redirecting correctly. Degradation only.

`https://www.fitnesssuperstore.com/French-Fitness-Tahoe-Assisted-Chin-Dip-New-p/FFT-ACD.htm`,
requested with **mixed case exactly as stored in Klaviyo**, lands on
`/products/french-fitness-tahoe-assisted-chin-dip-new` — the correct, current PDP.

This resolves the case-sensitivity question I had flagged as open: the stored redirect paths are
lowercase, and the mixed-case request **still matches**. Shopify's redirect matching is
case-insensitive here.

| Redirect GID | Path | Target |
|---|---|---|
| `gid://shopify/UrlRedirect/536931893564` | `/french-fitness-tahoe-assisted-chin-dip-new-p/fft-acd.htm` | `/products/french-fitness-tahoe-assisted-chin-dip-new` |
| `gid://shopify/UrlRedirect/540735406396` | `/french-fitness-tahoe-assisted-chin-dip-p/fft-acd.htm` | `/products/french-fitness-tahoe-assisted-chin-dip-new` |

So the URL defect is **degradation, not breakage** — one extra hop, with the attendant UTM/attribution
fidelity cost on a redirect. It does not strand a customer.

*Method note:* a first attempt returned 404, but its address bar showed
`…/FFT-ACD.ht?pb=0` — `.ht` rather than `.htm`, plus a stray Volusion-era `pb` parameter, most
likely browser autocomplete from history. A path ending `.ht` is not in the redirect table, so that
404 carried no information and was discarded. The capture above is the valid one.

### Bonus corroboration from the PDP capture

The rendered product page independently confirms the Shopify source from the customer-facing side:
**$2,799.00**, compare-at **$3,899.00** ("You save $1,100.00" — consistent with
`custom.retail_price = 389900`), Condition New, Grade Commercial, Product Code **FFT-ACD**,
"Available to Order". This is a third independent confirmation that Klaviyo's $2,699 is $100 low.

### Net risk grading

| Field | Status | Severity |
|---|---|---|
| Klaviyo image (`/v/vspfiles/photos/FFT-ACD-2.jpg`) | **Hard 404** | **High** — broken render to customer |
| Klaviyo URL (legacy `.htm`) | Redirects to correct PDP | Low — extra hop, attribution fidelity |
| Klaviyo price ($2,699 vs $2,799) | Stale | Medium — customer-facing, understates by $100 |
| Klaviyo inventory (`-1` vs metadata "In Stock") | Internally contradictory | Medium — governs feed/block visibility |

### Recommendation on the pilot gate

Keep the live HTTP capture in the one-SKU acceptance criteria as a gate. It has now changed the
risk grade in both directions — it upgraded the image and downgraded the URL — which is exactly why
it belongs before the work rather than after it. Re-capture the image post-remap to prove the fix.

### Standing risk, unchanged

The audit still cannot prove disuse. Per Tim's boundary, the stale fields are not evidence of
disuse, and a DO NOT USE tag is a containment label, not disablement.

---

## 7. My own access blockers — named, with owners

Stated as blockers, not as findings of absence.

**Blocker 1 — Klaviyo read access. Owner: whoever administers the Klaviyo connector scopes.**
The Klaviyo connector available to me exposes catalog **write** endpoints — bulk create, bulk
update and bulk delete for items and variants, plus single-item delete — and read endpoints only
for marketplace apps, brand assets, sending domains and agent config. There is **no** read
endpoint for catalog items, catalog variants, catalog categories, flows, campaigns, templates,
segments, tags or product feeds. I therefore cannot read the item, count published items,
enumerate feeds, or see a DO NOT USE tag.

Worth flagging on its own terms: on a read-only audit I hold write paths I must not use and lack
the read paths I need. That asymmetry should be corrected before the pilot, independent of this
SKU.

**Blocker 2 — storefront HTTP. CLEARED.**
`www.fitnesssuperstore.com` is blocked by this session's network egress policy — verified as a
policy block rather than an origin response, since the proxy answered `403` to `CONNECT` for all
four URLs tested including the known-good live Shopify PDP. This was the same check Masum flagged
as outstanding.

**Resolved out-of-band.** Yusra supplied both captures in-browser on 2026-08-27, and they are
recorded in §6: the legacy image returns 404, and the legacy mixed-case `.htm` URL redirects to the
correct PDP. Nothing further is needed here. Masum's identical blocker can be closed the same way.

**Blocker 3 — Shopify installed-app inventory. Owner: Izza / store admin.**
`appInstallations` returned `access denied` for the Admin API credentials in use. The app list in
§8 is derived from published-theme app-embed blocks only. An app that syncs headlessly, without a
theme extension, would not appear.

**Blocker 4 — other apps' Shopify webhooks. Owner: Izza / store admin.**
`webhookSubscriptions` returned empty, but that query only ever returns webhooks owned by the
*querying* app. It is **not** evidence that Klaviyo or any other app lacks Shopify webhooks.

---

## 8. Theme repository — independently re-verified

Repo `izzaahmed02/fitnesssuperstore-shopify` @ `5f2a97e`, 930 tracked files.

| Search | Result |
|---|---|
| `vspfiles` | **1 file** — `snippets/clean-description.liquid` |
| `bingshopping` | 0 hits |
| `FFT-ACD` | 0 hits |
| `$custom:::` | 0 hits |
| `klaviyo` | 3 files — `config/settings_data.json`, `sections/homepage-subscription.liquid`, `sections/page-subscription.liquid` |

`snippets/clean-description.liquid` is a **defensive sanitiser**, not an updater. Its own header
comment says it strips "legacy Volusion-era HTML"; it neutralises `/v/vspfiles/` `href`s to
`#legacy-` and rewrites `src` to `data-legacy-src`. Tim's and Izza's reading of the theme is
confirmed.

### The native Klaviyo Shopify app is installed and live

`config/settings_data.json`, block `855628211100114053`:

```
type:     shopify://apps/klaviyo-email-marketing-sms/blocks/klaviyo-onsite-embed/2632fe16-c075-4321-a88b-50b567f42507
disabled: false
```

**Consequence for Tim's question 3.** Because the native Klaviyo ↔ Shopify connection is present
and live, a **Shopify-native Klaviyo catalog is expected to exist alongside** `$custom:::$default`,
and FFT-ACD is expected to be duplicated across the two. This must be confirmed inside Klaviyo;
it cannot be proven from the Shopify side.

Klaviyo signup forms are also hard-coded in two theme sections, both form ID `Ud8shK`
(`homepage-subscription.liquid:18`, `page-subscription.liquid:21`). Storefront capture only.

### Feed-capable app embeds on the published theme

| App embed | Enabled |
|---|---|
| `klaviyo-email-marketing-sms :: klaviyo-onsite-embed` | **yes** |
| `multifeeds :: app_embed` | **yes** |
| `smart-seo`, `smartseo :: brokenLinkDetection` | yes |
| `boost-ai-search-filter` (SSR + instant search) | yes |
| `judge-me-reviews :: judgeme_core` | yes |
| `powerful-form-builder`, `instafeed`, `impact-com :: consent_mode` | yes |
| `attributepro`, `gorgias-live-chat-helpdesk`, `stape-conversion-tracking :: gtm`, Judge.me reviews-tab / popup | disabled |

`multifeeds` is the only enabled generic product-feed app on the theme and is the most likely
Shopify-side candidate if the `$custom` catalog is fed by a file or URL feed rather than by the
native app. **This is a lead, not a finding** — its feed destinations were not inspected, and
inspecting them would require app access I do not have.

---

## 9. Recommendation

**Do not close as `CONTROLLED LEGACY QUARANTINE — RETAIN / DO NOT USE` yet.** Two of Tim's own
closeout conditions are unmet: the updater is not proven disabled, and no consumer is proven
absent for the Browse Abandonment / Added-to-Cart drafts.

Sequence:

1. Close §1 — name the writer of `$custom:::$default` and prove its state.
2. Close §2 — six feeds named with IDs, statuses, sources and tag screenshots.
3. Close §3 — confirm whether the `NewBA_*` feeds resolve to the custom catalog, and gate the
   BA/ATC drafts from going live until they do not.
4. Then and only then author rollback (§5) and the one-SKU pilot, with the two live HTTP captures
   from §6 as acceptance gates.

Retain the catalog. Nothing here supports deletion, refresh, remap or replacement.

---

## 10. Constraints honoured

- No Klaviyo catalog mutation, deletion, refresh, remap or republish.
- No Shopify write. No metafield, media, feed, catalog-app, webhook or automation change.
- No GitHub or theme change. No flow, campaign or template edit. No send, schedule or publication.
- One SKU only. No customer data, sales values, margins, credentials or unpublished pricing.
- Separate from the Top 100 Meta creative quote; nothing here blocks that package.
- No broad catalog-rebuild work proposed or started.
