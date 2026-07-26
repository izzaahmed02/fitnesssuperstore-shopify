# Mobile Homepage A/B Test — Implementation Scope

**Experiment:** Mobile Shopping-Path Compression (Variant B)
**Type:** Mobile-only A/B test — not a homepage replacement
**Canonical URL:** `/` (no redirect to `/pages/homepage`)
**Branch:** `fitnesssuperstore-shopify/mobile-ab-test-24jul`
**Theme:** duplicate theme = Variant B; live theme = Control A
**Dev owner:** Waqas · **Merge/QA sign-off:** Izza · **A/B app + threshold:** Sagi/Izza (CRO) · **Copy/content source:** Larianne · **Tracking:** Control Tower

---

## 0. Scope boundary

**In scope (this doc):** building the Variant B mobile homepage in the duplicate theme, wiring the `fss_hp_*` analytics events, performance/flicker handling, and QA against the brief's acceptance criteria.

**Out of scope (owned elsewhere, recorded not claimed):**
- A/B app configuration, assignment, targeting, sticky window, exclusions — Sagi/Izza (Convert).
- Statistical significance threshold, decision rule, min runtime — CRO (Sagi/Izza).
- Approved copy and claims — fixed by the brief; content questions route to Larianne. No new/strengthened claims of any kind.

---

## 1. Blocking confirmations (resolve before any code)

| Gate | Item | Owner | Why it blocks |
|---|---|---|---|
| G0-a | Confirm **theme vs theme** is the mechanism | Sagi | Determines whether Variant B lives in a separate theme (assumed here) vs in-DOM variant |
| G0-b | Confirm **how the app enforces mobile-only + before-first-paint** (server/edge/UA vs client viewport swap) | Sagi/Izza | Decides theme architecture in §2 and whether anti-flicker work is needed |
| G0-c | Confirm **prior native homepage experiment is fully inactive** and any legacy assignment code is absent from the duplicate theme | Izza | Brief forbids stacking a new assignment layer on an active one |
| G0-d | Confirm branch is **experiment-only** (no unrelated mobile fixes in this PR) | Izza | Brief requires a focused experiment PR; note: brief's suggested name differs (`experiment/mobile-homepage-shopping-path-v1`) from the assigned branch |
| G0-e | **Significance threshold + min runtime** recorded | Sagi/Izza (CRO) | Not a dev decision; needed for the decision rule, not the build |
| G0-f | **Top-seller product source** (best-selling collection handle, curated collection, or metafield list) | Izza/Larianne | Module 6 must bind to a live source; concept prices are a snapshot only |
| G0-g | **Analytics destination + schema** for `fss_hp_*` (GA4 / GTM dataLayer / Convert metrics) | Izza/Sagi | Events must be verifiable before the 50/50 ramp |

---

## 2. Theme & architecture setup

- Duplicate theme is Variant B. **Desktop must stay equal to Control** — desktop is always the control surface per the brief.
- Homepage template: work in the live homepage template (`templates/index.json` in Dawn — confirm actual filename in repo). **Do not repurpose `templates/page.homepage.json`** (stale copy/config).
- **Mobile-only enforcement — pick based on G0-b:**
  - **Pattern A (preferred, if app targets mobile server-side/by UA):** app serves the variant theme only to mobile traffic. Build the compressed layout as the variant theme's homepage, mobile-first. Keep desktop in the variant theme identical to control so accidental desktop-on-variant is still safe. No hidden duplicate desktop modules in the DOM → satisfies the "no duplicate H1 / no hidden duplicate content" QA gate cleanly.
  - **Pattern B (only if device targeting isn't available):** single homepage rendering the compressed order for all, with desktop constrained via responsive CSS to match control. Higher desktop-drift risk; requires full desktop regression QA. Avoid a CSS `display:none` toggle that leaves two full homepages (two H1s) in the DOM — that fails QA §9.
- Keep the announcement/trust bar off at mobile (reuse the existing `display:none` at mobile breakpoints already shipped in the mobile remediation work).

---

## 3. Module build (order 1–8 from brief §4)

Build mobile-first; each module gets its event wired at build time, not after.

**1 — Header.** Reuse current compact mobile header. No announcement bar. No new build; verify clearance for search/phone/cart/menu/chat unchanged.

**2 — Hero.** Approved H1 ("Shop New & Remanufactured Gym Equipment"), shorter body, **single** CTA "Shop All Equipment" → `/collections/all`. Fire `fss_hp_primary_cta` on CTA click. Keep the 4.9/5 line as approved.

**3 — Shop by condition.** Two equal cards: New Equipment → `/collections/new-equipment`; Remanufactured → `/collections/products-remanufactured`. Fire `fss_hp_condition_select` (`condition = new | remanufactured`).

**4 — French Fitness link.** Supporting **text link** → `/collections/french-fitness`. Not a third hero CTA — style as secondary.

**5 — Popular categories.** Static **2×2 grid, no swipe/carousel**: Treadmills, Exercise Bikes, Functional Trainers & Racks, Selectorized Strength → current live collection handles. "View all categories" link retained. Fire `fss_hp_category_click` (`category_handle`, `slot`).

**6 — Top sellers.** Live Shopify product cards **before** social/warehouse/long-form modules. Bind title, image, current price, availability, URL to live product data — **no hardcoded prices** (concept FSR90 $3,299 / Woodway 4Front $8,099 are a July 24 snapshot). Reuse the compare-at fallback chain (`compare_at_price` → `compare_at_price_max` → `custom.retail_price`) if compare pricing is shown. Source per G0-f. Fire `fss_hp_product_click` (`product_handle`, `slot`).

**7 — Compact proof.** One review/rating block (4.9/5, verified buyer reviews) + four approved trust chips: Warranty options, Nationwide delivery, New equipment, Remanufactured. Current reviews/controlled claims only. Replaces the tall trust-card treatment on mobile.

**8 — Lower content.** Brands → Inside Benicia video → FAQs → reviews → newsletter → footer. Reuse current modules unchanged. Keep footer accordion accessible (focus state).

---

## 4. Analytics events (brief §7)

Wire during module build. Carry `variant` (+ `session_id`, `device`) on every event; `fss_hp_exposure` fires **once** after assignment and successful render. Standard commerce events (`add_to_cart`, `begin_checkout`, `purchase`) must carry the variant attribution through.

| Event | Properties | Trigger |
|---|---|---|
| `fss_hp_exposure` | variant, device, session_id | once, post-assignment + render |
| `fss_hp_primary_cta` | variant, destination | hero CTA click |
| `fss_hp_condition_select` | variant, condition | New / Remanufactured click |
| `fss_hp_category_click` | variant, category_handle, slot | category card click |
| `fss_hp_product_click` | variant, product_handle, slot | top-seller card click |
| standard commerce | variant carried through | add_to_cart, begin_checkout, purchase |

Destination/schema per G0-g. Exposure + click events must be visible in analytics **before** the test reaches 50/50 (QA gate).

---

## 5. Performance & flicker

- Assignment applied **before first paint** — no flash of original content, no CLS from the swap. Directly dependent on G0-b; if the app assigns client-side, either add anti-flicker handling or push assignment server/edge-side.
- Capture LCP, CLS, INP, JS error baselines on the variant preview vs control **before the ramp**; no material regression permitted.

---

## 6. QA / acceptance gates (brief §9)

- [ ] 360 / 390 / 428 px on iOS Safari **and** Android Chrome
- [ ] No announcement/trust bar on mobile
- [ ] Header, search, phone, cart, menu, chat clearance, footer behavior unchanged
- [ ] No duplicate H1, no hidden duplicate content, no crawlable alternate homepage
- [ ] No layout flash on variant assignment
- [ ] All collection + product destinations open correctly
- [ ] Product cards use live data — never a stale hardcoded price/availability
- [ ] Keyboard + screen-reader valid, including footer accordion focus state
- [ ] Cart options, add-ons, variant selection, checkout smoke tests pass
- [ ] Exposure + click events visible in analytics before 50/50
- [ ] LCP / CLS / INP / JS errors — no material regression

**Accessibility phrasing on sign-off:** report as "semantic markup implemented / improved" — never "fully compliant" or "100% accessible."

---

## 7. Rollout & kill switch

- Short technical ramp → 50/50 random assignment; sticky per visitor for 30 days.
- Exclude bots, staff/test traffic, Shopify preview sessions, known QA params.
- **Kill switch:** in theme-vs-theme, this is an app-level instant revert of all mobile traffic to the Control A theme **without publishing a new theme**. Confirm the app provides immediate revert and document it as the kill path before traffic starts.
- Deliverable for sign-off: preview theme link + analytics proof (events firing).

---

## 8. Approved copy / URL reference

| Element | Value |
|---|---|
| H1 | Shop New & Remanufactured Gym Equipment |
| Hero body | Save up to 60% off MSRP on new and remanufactured commercial gym equipment. Nationwide delivery, warranty options, and expert help available. |
| Primary CTA | Shop All Equipment → `/collections/all` |
| Condition 1 | New Equipment → `/collections/new-equipment` |
| Condition 2 | Remanufactured → `/collections/products-remanufactured` |
| Supporting link | Browse French Fitness → `/collections/french-fitness` |
| Categories | current live collection handles (Treadmills, Exercise Bikes, Functional Trainers & Racks, Selectorized Strength) |
| Rating | 4.9/5 by thousands of happy customers |
| Claim guardrail | No new/strengthened warranty, delivery, install, inventory, financing, certification, return, or lead-time claims unless the controlled source supports the exact wording |

---

## 9. Open questions (consolidated)

1. Theme-vs-theme confirmed? (G0-a) — Sagi
2. Mobile-only + before-first-paint mechanism — server/UA or client? (G0-b) — Sagi/Izza → decides Pattern A vs B
3. Prior native experiment confirmed inactive + legacy assignment code absent? (G0-c) — Izza
4. Branch confirmed experiment-only; naming discrepancy vs brief acceptable? (G0-d) — Izza
5. Significance threshold + min runtime recorded? (G0-e) — CRO
6. Top-seller product source/handles? (G0-f) — Izza/Larianne
7. `fss_hp_*` analytics destination + schema? (G0-g) — Izza/Sagi
