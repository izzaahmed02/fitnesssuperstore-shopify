# CLAUDE.md — Mobile Homepage A/B Test (Variant B)

Instructions for Claude Code working in this repo. Follow these every session. When a rule here conflicts with a request in the moment, stop and flag the conflict rather than silently overriding.

## Project

Shopify theme (Dawn-based, custom) for Fitness Superstore. This branch builds one mobile-only A/B test: "Mobile Shopping-Path Compression" (Variant B). It is not a homepage replacement.

* Branch: `fitnesssuperstore-shopify/mobile-ab-test-24jul` — experiment-only.
* Deployment: GitHub-connected. Pushing this branch syncs the theme via Shopify's GitHub integration. Do not edit the live theme out-of-band; every change is a commit.
* Canonical URL stays `/`. No redirect to `/pages/homepage`.
* Duplicate theme = Variant B; live theme = Control A. Desktop must remain equal to Control.
* Full plan: see `Mobile_Homepage_AB_Test_Implementation_Scope.md`. This file is the rules layer; the scope doc is the detailed build.

## Hard guardrails (never violate)

1. No claim inflation. Do not add or strengthen warranty, delivery, installation, inventory, financing, certification, return, or lead-time claims unless the current controlled source supports the exact wording. Use only the approved copy in the scope doc.
2. Accessibility phrasing. In code comments, commit messages, PR text, and any status note, describe a11y work as "semantic markup implemented" or "improved" — never "fully compliant," "100% accessible," or equivalent.
3. No hardcoded prices or product data. Bind product title, image, current price, availability, and URL to live Shopify data. Concept prices (e.g. FSR90 $3,299, Woodway 4Front $8,099) are a July 24 2026 snapshot, not production values.
4. Never repurpose `templates/page.homepage.json` — it is stale. Work in the live homepage template (`templates/index.json` — confirm actual filename before editing).
5. No duplicate homepages in the DOM. Do not leave two full homepages / two H1s / hidden duplicate content in the rendered DOM. See "Architecture" below.
6. Scope discipline. No unrelated mobile fixes in this branch or PR. This is a focused experiment PR only.

## What requires a human, not you

* Merge to main / QA sign-off: Izza. Do not merge; open the PR and stop.
* Copy and content decisions, top-seller product source: Larianne / Izza.
* A/B app config, targeting, sticky window, exclusions, kill switch: Sagi / Izza (Convert).
* Significance threshold, decision rule, runtime: CRO (Sagi / Izza).
* Your lane: implement the variant, wire events, provide preview + analytics proof.

## Blocking dependencies — confirm before building

Do not start the module build until these are answered; two of them change what you build:

* Theme-vs-theme mechanism confirmed (Sagi).
* How the app enforces mobile-only + before-first-paint — server/UA vs client swap (Sagi/Izza). Decides Pattern A vs B below.
* Prior native homepage experiment confirmed inactive; no legacy assignment code in this theme (Izza).
* Top-seller product source: best-selling collection handle, curated collection, or metafield list (Izza/Larianne).
* `fss_hp_*` analytics destination + schema: GA4 / GTM dataLayer / Convert (Izza/Sagi).

If asked to build before these are resolved, say so and list what's missing.

## Architecture

* Pattern A (preferred, if app targets mobile server-side/by UA): build the compressed layout as the variant theme's mobile-first homepage; keep desktop in this theme identical to Control. No `display:none` toggle of duplicate desktop modules.
* Pattern B (only if device targeting unavailable): single homepage rendering the compressed order for all, desktop constrained via responsive CSS to match Control; requires full desktop regression QA. Avoid leaving two full homepages in the DOM.
* Apply assignment before first paint — no flash of original content, no CLS from the swap.
* Announcement/trust bar stays off at mobile (reuse the existing `display:none` at mobile breakpoints from the mobile remediation work).

## Build spec — module order (see scope doc for full detail)

1. Header — reuse current compact mobile header, no announcement bar. No new build.
2. Hero — approved H1, shorter body, single CTA "Shop All Equipment" → `/collections/all`. Fire `fss_hp_primary_cta`.
3. Shop by condition — two equal cards: New → `/collections/new-equipment`, Remanufactured → `/collections/products-remanufactured`. Fire `fss_hp_condition_select` (`new` | `remanufactured`).
4. French Fitness link — supporting text link → `/collections/french-fitness`. Not a third hero CTA.
5. Popular categories — static 2×2 grid, no swipe: Treadmills, Exercise Bikes, Functional Trainers & Racks, Selectorized Strength (live collection handles). Fire `fss_hp_category_click` (`category_handle`, `slot`).
6. Top sellers — live product cards before social/warehouse modules. No hardcoded prices; reuse compare-at fallback chain `compare_at_price` → `compare_at_price_max` → `custom.retail_price` if compare pricing shown. Fire `fss_hp_product_click` (`product_handle`, `slot`).
7. Compact proof — one review/rating block (4.9/5) + four approved trust chips (Warranty options, Nationwide delivery, New equipment, Remanufactured). Current reviews/claims only.
8. Lower content — brands, video, FAQs, reviews, newsletter, footer: reuse unchanged; keep footer accordion accessible.

## Events

All carry `variant` (+ `session_id`, `device`). `fss_hp_exposure` fires once after assignment + successful render. Standard commerce (`add_to_cart`, `begin_checkout`, `purchase`) must carry variant attribution through.

## Definition of done (per change)

* Renders correctly at 360 / 390 / 428 px.
* No duplicate H1 / hidden duplicate content / crawlable alternate homepage.
* Header, search, phone, cart, menu, chat clearance, footer unchanged.
* Destinations resolve; product cards use live data (no stale price/availability).
* Keyboard + screen-reader valid, incl. footer accordion focus.
* No layout flash on assignment; LCP/CLS/INP/JS errors no material regression vs Control.
* Relevant `fss_hp_*` event fires and is verifiable.

## Conventions

* Theme conventions: `sections/*.liquid`, `snippets/*.liquid`, `assets/*.{js,css}`, `templates/*.json`. Keep variant-specific CSS scoped; don't leak styles into shared Control surfaces.
* Commits: small, scoped, one concern each. Reference the module (e.g. `feat(hp-variant): static 2x2 category grid + fss_hp_category_click`).
* Do not merge. Open the PR for Izza and summarize what changed, what's tested, and what's still gated.
* When unsure whether something is Control-shared or Variant-only, ask before editing.
