# Convert Clone-Store Implementation Plan — DRAFT

**Status:** DRAFT for approval. No clone store created, no app installed, no pixel
enabled, no access expanded, no production change made.
**Owners:** Izza Ahmed, Muhammad Zafran
**Requested by:** Tim French, 17 Aug 2026 and 18 Aug 2026 (canonical thread
"Re: Your Convert | Demo Request")
**Prepared:** 18 Aug 2026

---

## 0. Authorization boundary

This document is a plan only. Per Tim's 17 Aug and 18 Aug direction, the
following remain **not authorized** and have **not** been done:

- Creating or configuring a clone / development store
- Installing the Convert Shopify app or enabling its Theme Extension / App Embed
- Creating or enabling a Web Pixel or Customer Events subscription
- Removing or modifying the manual Convert script on production MAIN
- Publishing any theme, merging PR #669, or expanding PR #692
- Any change to `cdn.9gtb.com` loader (Convert states it is unrelated to Convert
  Experiences; it is out of scope for this workstream)
- Any customer experiment traffic (remains 0)

Execution begins only on separate written approval from Tim.

---

## 1. Verified current-source baseline (read-only, 18 Aug 2026)

### 1.1 Shopify

| Item | Verified value |
|---|---|
| Shop | Fitness Superstore — www.fitnesssuperstore.com |
| Plan | Shopify Plus |
| Published MAIN theme | `fitnesssuperstore-shopify/main`, theme id `186120208700` |
| MAIN theme last updated | 2026-08-13 22:31 UTC |
| MAIN `layout/theme.liquid` last updated | 2026-08-08 11:43 UTC |
| MAIN `config/settings_data.json` last updated | 2026-07-24 15:41 UTC |
| Variant theme referenced in PR #669 | `fitnesssuperstore-shopify/mobile-ab-test-24jul`, id `187205943612`, UNPUBLISHED, last updated 2026-07-26 19:22 UTC |

**Convert loading paths currently on published MAIN** (both confirmed present in
`layout/theme.liquid`):

1. Manual production project script, tag in `<head>`, loaded async:
   `//cdn-4.convertexperiments.com/v1/js/10019770-100110328.js?environment=production`
2. A separate deferred loader injected by the non-critical-vendor injector in
   `<body>`, script element id `convert-bundle-loader`:
   `https://cdn.9gtb.com/loader.js?g_cvt_id=…`
   Injected on first user interaction, or 1500 ms after `load`, whichever is
   first. Convert has stated this path is not Convert Experiences. **Not touched
   under this workstream.**

**Theme Extension / App Embed state:** `config/settings_data.json` on MAIN
contains no Convert app-embed block. The `blocks` object contains only: Klaviyo,
AttributePro (disabled), Smart SEO (2 blocks), impact.com consent mode, Gorgias
(disabled), Powerful Form Builder, Judge.me (3 blocks, 2 disabled), Multifeeds,
Boost AI Search & Filter (2 blocks), Instafeed, and Stape GTM (disabled).

### 1.2 GitHub — `izzaahmed02/fitnesssuperstore-shopify`

| Item | Verified value |
|---|---|
| Current `main` head | `575a8defcb8526ab76cdc9570b7c336e4c10a696` (2026-08-14) |
| PR #669 | OPEN / DRAFT / unmerged. Branch `experiment/mobile-homepage-shopping-path-v1`, head `66e1da3312e8b3e606970f4dd3dc3bd730560f0a`, based on `main@178c4f08…`, mergeable state `blocked`, 11 files |
| PR #692 | OPEN / DRAFT / unmerged. Branch `control-a-mobile-baseline-cleanup`, head `e3e03f038ce86608713f63e6d24f1bd3a99add24`, based on `main@2b53f675…`, 4 files |

### 1.3 Confirmation of Tim's three corrections

All three are **confirmed accurate**; we are not disputing any of them.

1. **PR #669 is stale relative to current MAIN.** Its base is `178c4f08…`; current
   `main` is `575a8def…`. The linked variant theme `187205943612` was last
   updated 2026-07-26, before the 2026-08-08 and 2026-08-13 MAIN changes.
2. **Control and Variant modules sit in the DOM together, separated only by CSS.**
   This is stated in PR #669's own description: both module sets, including two
   `<h1>` elements, exist in the raw DOM and one set is visually hidden per
   breakpoint via `assets/fss-hp-device-targeting.css`.
3. **`fss_hp` assigns Variant B from viewport logic, not from Convert.** In
   `assets/fss-hp-analytics.js` the variant field is `window.fssHpVariant || 'B'`
   — it defaults to B and never reads a Convert bucket — and exposure/event
   dispatch is gated solely on `matchMedia('(max-width: 989px)')`.

**Conclusion:** theme `187205943612` and PR #669 are not acceptable validation
targets as-is. The clone implementation below is a fresh build from current MAIN.

### 1.4 Read-only Admin evidence we could not produce programmatically

The Shopify connector available to us is denied the scopes needed for three of
the requested read-only items:

- `appInstallations` → access denied (Convert app install state)
- `scriptTags` → access denied
- `webPixel` → requires `read_pixels` scope, not granted

These three will be supplied as redacted read-only Admin screenshots
(Settings → Apps and sales channels; Settings → Customer events; Online Store →
Themes → App embeds), not via API. Absence of a Convert app-embed block in
`settings_data.json` does **not** by itself prove the app is uninstalled in
Admin, so the screenshots remain required.

---

## 2. Proposed clone store

| Field | Proposal |
|---|---|
| Store type | Shopify **Partner development store**, created under our Shopify Partner organization |
| Purpose flag | Created for testing/QA, not for a client transfer |
| Proposed name | `fss-convert-clone-qa` (myshopify subdomain to be assigned at creation) |
| Data | Products/collections limited to the eligible homepage/PDP set needed for the test path. **No customer data, no real orders, no PII imported.** |
| Password protection | Storefront password stays ON for the entire life of the store |
| Customer traffic | Zero. Internal QA accounts only |
| Lifetime | Until GO/NO-GO on 24 Aug 2026, plus a cleanup window |

**Why a development store and not an unpublished theme:** per the vendor answer
Tim recorded on 17 Aug, the Convert Web Pixel is store-level, so checkout,
purchase and revenue validation cannot be isolated to an unpublished theme on
production. An unpublished theme can only cover storefront and App Embed QA.

### 2.1 Partner / cost dependency — open item

- We need confirmation of which Shopify Partner organization to create the store
  under, and who holds owner rights on it.
- Development stores carry Shopify limitations (e.g. constraints around real
  transactions and some app availability). **We have not confirmed and are not
  asserting any Shopify or Convert cost figure for this clone.** Two items need a
  written answer before creation:
  1. Whether Convert requires a **separate Convert project/environment** for the
     clone, and whether that carries any charge or MTU consumption against the
     current Growth 100K plan. Tim has already asked Convert this.
  2. Whether the Convert app can be installed on a development store under our
     existing subscription.
- If either answer is "extra cost", we stop and bring it back to Tim before
  creating anything.

---

## 3. Exact components to be implemented on the clone

Implemented **once**, in the single vendor-confirmed architecture. One Convert
initialization only.

1. **Theme:** fresh duplicate of current MAIN at `575a8def…`, uploaded to the
   clone store as the published theme *of the clone only*.
2. **Convert Shopify app:** installed on the clone; Theme Extension / App Embed
   toggled ON in the clone's theme editor. This is the only Convert
   initialization on the clone.
3. **Manual script:** the `cdn-4.convertexperiments.com` manual tag is **removed
   from the clone theme's `layout/theme.liquid`** so exactly one Convert
   initialization exists there. Production MAIN is unchanged.
4. **`cdn.9gtb.com` loader:** left exactly as-is on the clone (unmodified copy of
   MAIN), so the clone stays a faithful baseline. Not in scope.
5. **Web Pixel / Customer Events:** Convert's Web Pixel enabled on the clone
   store only.
6. **Goals:** JavaScript-Triggered goals mapped to Shopify Web Pixel events, per
   Convert Support's guidance recorded on 16 Aug.
7. **Experiment:** kept in **QA mode**, 0% customer allocation, mobile-only
   audience with desktop excluded, for Convert Support review.
8. **Variant B build:** rebuilt from current MAIN — **not** cherry-picked from
   PR #669 — with the two defects above corrected:
   - Control and Variant markup must not both render into the DOM. Only the
     assigned variant's modules render.
   - Variant assignment must be read from Convert's assignment, not derived from
     viewport width. Viewport may gate *eligibility*; it must not *assign*.

---

## 4. GitHub branch strategy (narrow)

- **New branch:** `experiment/convert-clone-store-v1`, cut fresh from
  `main@575a8def…`.
- Scope limited to the clone-store Convert implementation. No unrelated files.
- **PR #669 stays DRAFT / HOLD / DO NOT MERGE.** Nothing is cherry-picked from it
  into the new branch; it is reference only.
- **PR #692 stays untouched and is not expanded** to carry Convert work.
- No PR against `main` is opened for the clone work without Tim's written
  approval. If one is opened it is DRAFT and labelled clone-only.
- Shopify GitHub two-way sync will be connected to the **clone store only**, so
  bot auto-sync commits cannot reach production MAIN. Any
  `shopify[bot]` commit touching `config/settings_data.json`,
  `templates/collection.json` or `templates/search.json` is reverted before
  review, as was done on PR #692.

---

## 5. Required access and dependencies

| Need | Owner | Status |
|---|---|---|
| Shopify Partner org identity + owner rights for the dev store | Tim / Izza | **Blocked, awaiting decision** |
| Convert answer: separate project/environment required for clone? | Convert Support (Tim asked) | **Blocked, awaiting vendor** |
| Convert answer: written PASS or correction list after reviewing clone evidence? | Convert Support (Tim asked) | **Blocked, awaiting vendor** |
| Convert app install rights on the clone | Izza / Zafran | Available once store exists |
| Read-only production Admin access for the evidence screenshots | Izza / Zafran | Available |
| Test-payment method on clone | Izza / Zafran | See §7 |
| Final metrics / decision rule | Sagi (CRO) | Separate deliverable |
| Analytics validation | Vladimir | Starts only after our READY FOR ANALYTICS QA packet |

---

## 6. Security and redaction

- No customer records, order history, or payment data copied to the clone.
- Storefront password remains enabled for the store's entire life.
- Every screenshot and log in the evidence pack is redacted for: API keys,
  access tokens, Convert project/account secrets, staff emails, customer PII,
  and payment data. Convert project ID `10019770-100110328` and the experiment
  ID are already in the thread and stay unredacted for traceability; nothing else
  is.
- No credentials in the GitHub branch, PR body, or evidence pack. No `.env`, no
  token in a config file.
- Access to the clone limited to Izza, Zafran, Vladimir (read/QA), and Tim.
  Vladimir gets the narrowest role that lets him validate, granted only when
  billable work is approved and active.

---

## 7. Controlled test-payment method

- Payments on the clone use Shopify's **test/bogus gateway**, so a full
  checkout → purchase → revenue event chain fires without a real card, real
  charge, or real order in the production store.
- If Convert requires a live-mode transaction for revenue attribution to be
  considered valid, we stop and get written approval before enabling any real
  payment method. We are not assuming this is acceptable — it is a question for
  Convert Support.
- Test orders are tagged `convert-qa` and are confined to the clone store, so
  they cannot reach production reporting, Klaviyo, or fulfilment.

---

## 8. Evidence package (the READY FOR ANALYTICS QA packet)

Vladimir's billable validation does not start until every item below is
delivered. Target: **Friday 21 Aug 2026**.

**A. Source and environment**
1. Clone store URL, theme id, and the MAIN commit it was duplicated from
   (`575a8def…`), with a diff proving the clone theme equals MAIN plus only the
   listed Convert changes.
2. Branch name and head SHA.
3. Convert project/environment used by the clone.

**B. Single-initialization proof**
4. Network waterfall showing exactly one Convert Experiences initialization,
   with the manual `cdn-4` tag absent from the clone theme.
5. Console proof that no duplicate Convert global is created.

**C. Assignment and targeting**
6. Proof that variant assignment comes from Convert, not viewport — including a
   forced-variant screenshot where a mobile viewport receives Control.
7. Desktop exclusion proof.
8. Persistent bucketing across reload and across session.
9. DOM proof that only the assigned variant's modules render — one `<h1>`, no
   hidden duplicate homepage.

**D. Events**
10. Event receipts for exposure, homepage/product-card click, add to cart,
    checkout started, purchase, and revenue, each with experiment and variation
    identifiers.
11. Deduplication proof (no double-counted exposure or purchase).
12. Consent behaviour.
13. One controlled test purchase with revenue reconciled to the Shopify order.

**E. Performance and safety**
14. Five cold runs per state on mobile and desktop: median LCP, CLS, INP/TBT,
    FCP/Speed Index, console errors, visible flicker, assignment-before-paint.
15. Boost AI Search & Filter filter/sort/state behaviour unaffected.
16. Kill-switch / rollback demonstrated live.

**F. Vendor**
17. Experience summary URL sent to Convert Support, and their written PASS or
    correction list.

---

## 9. Rollback

**On the clone:** disable the experience → toggle the App Embed off → uninstall
the Convert app → restore the theme from the untouched duplicate of
`575a8def…`. Each step reversible in minutes and demonstrated as part of item 16.

**On production MAIN:** nothing to roll back — no production change is made under
this plan. The existing manual `cdn-4` script and the `cdn.9gtb.com` loader stay
exactly as they are, and experiment traffic stays at 0.

**If the clone is later promoted** (separate approval, not this plan): the
promotion is a fresh narrow PR from current MAIN at that time, with its own
rollback commit prepared before merge and the previously published theme retained
as the instant revert target.

---

## 10. Cleanup

Within 5 business days of GO/NO-GO on 24 Aug 2026:

1. Uninstall Convert from the clone and delete the clone's Web Pixel.
2. Delete the clone's Convert project/environment if a separate one was created.
3. Delete test orders and QA accounts; confirm none reached production systems.
4. Disconnect the clone from the Shopify GitHub integration.
5. Delete or archive the clone store per Tim's instruction.
6. Delete `experiment/convert-clone-store-v1` unless it is being carried into an
   approved production PR.
7. Archive the evidence pack to the canonical location and post the archive link
   in the canonical thread.
8. If the outcome is NO-GO, confirm in writing that Convert cancellation is
   actioned before the 6 Sep renewal.

---

## 11. Sequenced timeline (all steps gated)

| When | Step | Gate |
|---|---|---|
| 18 Aug | This DRAFT plan + read-only Admin evidence delivered | — |
| Pending | Convert answers on separate project/environment and written PASS | Vendor |
| Pending | Tim issues written clone-store execution approval | Tim |
| +0–1 day after approval | Create Partner dev store, duplicate MAIN theme, cut branch | Approval |
| +1–2 days | Install app, enable App Embed, remove manual tag on clone, enable Web Pixel, map JS-triggered goals, QA mode at 0% | Approval |
| +2–3 days | Build corrected Variant B from current MAIN; single-render, Convert-driven assignment | Approval |
| By 21 Aug | Evidence package complete; send to Convert Support; hand READY FOR ANALYTICS QA to Vladimir | Evidence complete |
| 24 Aug | Tim GO / NO-GO | Tim |
| Before 6 Sep | Cancel if NO-GO | Subscription owner |

If the vendor answers or the execution approval land late, the 21 Aug evidence
date moves and we say so in the thread the same day rather than compressing QA.
