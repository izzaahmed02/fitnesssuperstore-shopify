# Reply Draft — Tim: Review requested: PDP workload, developer lanes, and faster execution

**To:** tim@fitnesssuperstore.com
**Cc:** zafran@fitnesssuperstore.com
**Subject:** Re: Review requested: PDP workload, developer lanes, and faster execution

---

Hi Tim,

I reconciled this against what has actually landed in GitHub, the live theme, and the active Monday/Gmail workstreams before responding, rather than send a generic answer. Here is the full response, structured to your eight questions, with the recommendations at the end.

## Before the framework — where the pace actually is

Between May 29 and July 7 we merged a large batch of PRs to `main` on the theme repo, with a further set staged on isolated branches (cart, turf, sandbag) that are intentionally not merged yet. That is the correct repo, and nothing PDP is happening off-repo. A representative (not exhaustive) list of what landed in the last ~6 weeks:

**Combined listings / PDP core (French Fitness heavy):**
- #558 Support parent product variants in combined listings
- #559 Fix variant switching on combined-listings PDP
- #560 Don't redirect away from a valid combined-listing child page
- #561 Re-add family variants map + fallback interceptor
- #572 Fix MSS PDP variant image on redirect + clarify unavailable options
- #573 Fix combined-listing selector reset to Singles + card "From" price
- #578 Pass option title to related-products button
- #594 Consolidate combined/variant PDP title into a single responsive H1
- #597 Friendly display names for variant options via metafields (metafield-driven; the dropdown-UI conversion for step 1 is a separate in-progress piece)
- Aluminum Pulley picker source-control parity live (#604) + duplicate cart-property fix

**PDP heading + SEO cleanup:**
- #588 Related products: backfill to 4, dedup, suppress exclusion, primary collection
- #585 Suppression guard for `suppress-recommendations` tag
- #589 Collection card titles → H2, option labels un-headed (style-neutral)
- #590 Duplicate product-title heading resolved on combined/variant PDPs
- #593 Removed old text-based metafield breadcrumb fallback (cleaner metaobject/collection path)
- #591 Removed unused product option template + modal snippet (dead code)

**PDP structure / gallery / mobile:**
- #596 Fix PDP layout spacing + gallery width
- #600 PDP gallery resize + center, widen buy-box column (configurable via CSS variables now)
- #601 Mobile gallery handles all previewable media types (fixed empty trailing slide with 3D-model media)
- #595 Removed left side-nav on collection and product templates (A/B direction)
- #605 Removed auto-injected video block from PDP description (rubber gym mats thread)

**French Fitness / homepage / brand pages:**
- #580 New homepage merged
- #568 Homepage H1 branding + robots.txt AI bot policy
- #575 "As Featured In" section (follow-ups #564/#565/#566)
- #583 Washington state sales-tax page updates
- #592 Shipping Information page — Usman-owned, merged with your QA points applied (estimates wording, service-region anchor, pickup address, door-to-port/CIF wording, decorative alt handling)
- #599 Review page redesign (Usman-owned) merged
- French Fitness collection pages (rack-rig-systems, pre-configured-rigs, rig-frame-pieces-customize-your-rig) are live with FF banners; my dev review of `main-collection-banner.liquid` for the Rack/Rig consolidation is done and now waiting on Iqra/Larianne product decisions before Phase 1B.

**Warranty / checkout / cart:**
- #576 Warranty + processing-time metafields carried through to checkout and order page
- #570 Warranty block reordered to render last, before Prop 65 popover
- #556 Fixed cart drawer showing duplicate variant options
- #555 Pulley picker full-page nav on variant change + duplicate cart properties fix

**Schema / structured data (branches / in-flight):**
- #579 VideoObject schema standardized + de-duplicated
- #562 / #563 Judge.me AggregateRating structured data corrected
- Turf Flooring PDP dynamic per-sq-ft revision (#598 branch — gated on Larianne's go-ahead before it ships)
- Global Power Sand Bag + Strongman Sandbag PDP revisions in-flight

## French Fitness page development — dedicated lane, healthy pace

I want to call this out separately because it is a distinct lane from the FSS theme and the pace here is good. Usman is the assigned owner for the French Fitness page batch. Status:

**Completed / delivered so far (4 pages):**
1. **French Fitness Home Page** — Usman built from Figma, delivered 7/1; I reviewed 7/5; you confirmed the direction 7/6.
2. **About / Trust Hub (desktop + mobile)** — Usman delivered 6/30; you confirmed 7/1 that the update is "much better and solves the main issue" (Nationwide section revised).
3. **French Fitness Warranty page** — updated with the new copy, live and previewed 5/11 (my own).
4. **French Fitness collection pages (rack-rig-systems / pre-configured-rigs / rig-frame-pieces-customize-your-rig)** — live with FF banners; Rack/Rig Phase 1B is dev-ready and only waiting on the Iqra/Larianne subcategory-button mechanism decision.

**In-flight now (approved 7/1, Usman-assigned):**
- Our CEO
- Additional FF redesign pages from the Figma "French Fitness — Redesign" file (batch approved by Sagi 7/1)

**Expected completion:** we are on track for roughly 8 French Fitness pages delivered by end of next week (the four above plus four more from the 7/1-approved batch). Usman is running that batch as a single owner so we avoid the collision-and-re-review pattern that hurt "As Featured In" earlier.

**Sticky cart / cart drawer:** Sticky-ATC and cart-drawer work is split into isolated branches by design (`atc-sticky-usman`, `cart-cart-drawer`, `cart-options-popup`, `cart-shipping-widget-calculator`, `cart-upsells-without-avis`, `cart-without-avis`, `cart-invistigation`) so we don't destabilize the buy-flow while shipping PDP improvements. The cart is our highest-blast-radius surface and I do not want a heading/H1 refactor and a sticky-ATC refactor colliding on the same preview theme. The V2 "No Cart Drawer" test is being evaluated in parallel — Convert app review on my side, VWO outreach on Sagi's side.

The mobile PDP quick wins (the "images cut off on mobile" flag from 6/30) shipped inside a few hours (#600 + #601) and are live. About / Trust Hub, home-page CTA re-link (desktop + mobile), and the manuals-page FF logo update to 1:1 all shipped within one to two days of the ask.

Honest read from the execution side: **the pace is healthy across FSS and FF, PRs are landing daily, French Fitness pages are on a good clip under Usman, and the queue is moving.** What's worth improving is not the volume — it's the shape of the process. That's where your eight questions land.

## Answers to your eight questions

### 1. Which active PDP projects are data/content/admin vs. shared-theme development?

**Data/content/admin (parallel-safe, no dev bottleneck):**
- Top 45 French Fitness hero products tracker fill-in (Larianne / Iqra / Umer for Control Tower)
- Combined Listings source-of-truth review (Ayyaz — onboarded 7/1, guidance sent 7/3)
- Consolidated 5-50 test package $0 option-category listings (Larianne)
- Image alt-text batch import (2,281 images, approved 6/22, waiting on Larianne)
- Image QA tracker batch review (Shery)
- Comparison-charts SEO audit (7 content patches + 3 Tim decisions)
- Manual / QR /manuals/* URL structure planning
- Sample-candidate Drive folders (6 SKUs — no publish)
- Sally's product-validation packet for Gym Packages (2,000 sq ft pilot)
- Blog cleanup / SOP revision
- Shopify inventory + freight-class updates for cardio SKUs
- Meta/Shopify ad-image aspect-ratio fix

**Shared theme / template dev (must be sequenced, WIP-limited):**
- PDP master template + combined-listings + variant behavior
- Cart drawer / sticky-ATC / cart upsells + V2 "No Cart Drawer" test
- Homepage template + FSS/FF brand pages (Usman — FF batch running as one owner)
- Rack/Rig collection consolidation (banner subcategory buttons + Phase 1B)
- Roomplanner + BYOR integration on gym-packages hub
- Global schema / VideoObject / breadcrumb refactors
- A/B test scaffolding for dropdowns vs. AI PDP (Yurii/Sagi lane) — step 1 dropdowns in progress
- New French Fitness 5-Stack combined PDP with +$800 custom configuration
- FSR90 PDP design (Waqas — Judge.me widget rendering, awaiting Sagi re-review)

**Product-family rollout (pilot-then-replicate):**
- 500 / 1,000 / 1,500 sq ft package validation (after 2,000 pilot is approved)
- Tahoe hero-image round 2
- Treadmill enrichment metafield/metaobject approval (Shikha)
- New French Fitness Urethane 8-Sided Hex Dumbbell blank listing (Hafiz — awaiting your parent/child SKU approval since 5/23)

**High-risk architecture / integration:**
- Puerto Rico shipping / Intuitive Shipping duplicate-rate fix (root-caused with Kevin)
- Order #48619 cart pricing bug (FSR100-CB + add-ons)
- Order #48688 FFT-PLCLE duplicate-SKU regression (investigated, response sent 7/2)
- 220V–240V external-transformer PDP eligibility metafield (Larianne + Josue)
- Gorgias / Facebook integration reauth + `@adams-acres.com` access removal

### 2. Which projects touch the same Liquid sections, snippets, CSS/JS, templates, metafields/metaobjects, cart logic, or apps?

Overlap is concentrated in five shared surfaces, which is why sequencing matters more than headcount:

- **`sections/main-product*.liquid` + product-page CSS** — combined-listings/variant work, the heading/H1 consolidation, gallery/layout changes, and the transformer snippet all edit the same product template and buy-box snippets. This is where I have been holding the WIP-limit tight, and it is why #588/#589/#590/#594 all built off `claude/amazing-feynman-5kj24j` sequentially rather than as parallel PRs.
- **`sections/related-products.liquid`** — the related-products backfill/dedup (#588) and the suppress-recommendations guard (#585) both edit this one section.
- **`snippets/cart-drawer.liquid` + cart logic** — every cart branch touches the same surface; highest blast radius, one change at a time.
- **`main-collection-banner.liquid`** — Rack/Rig consolidation uses one subcategory-button mechanism; older FF collection pages use another. Two competing mechanisms today. Held on non-destructive dev prep only until Iqra/Larianne pick one.
- **Product metafields / metaobjects** — `custom.related_products`, `custom.product_canonical_url`, warranty / processing-time metafields, and the new `custom.option_display_name` are read by shared snippets, so any rename or backfill ripples across PDPs.

### 3. Are any developers editing overlapping code or waiting on the same preview theme, PR, or reviewer?

Yes, two ways.

First, a bundle of mobile home, remanufactured, and PDP work sits on one shared preview theme and moves as a unit — currently waiting on Sagi's placement input and my final review.

Second, preview links from Waqas (FSR90 iteration), A/B changes from Zafran (Intelligems/dropdowns work), Klaviyo confirmations, and contractor acceptance all currently route through me for sign-off (see Q6). The one real bottleneck signal: any PR that touches cart / checkout / order flow carries me as the required reviewer because of the blast radius, and that is intentional.

### 4. Correct GitHub repository / one branch + one PR per workstream?

Yes — the repo is `izzaahmed02/fitnesssuperstore-shopify`, and the reason the **open** PR queue looks small (1 open right now — #602) is that we are merge-forward rather than long-lived-branch. The moment a workstream passes QA it merges and closes, and the next branch starts from the fresh `main`. I would rather have a large volume of merged PRs than 15 stale open ones. If you want a running "open scope" view I can pin an issue that lists in-flight workstreams and their branch names, updated weekly.

Three caveats to acknowledge: (a) contractor preview work sometimes arrives as preview-theme links rather than PRs, and I convert those to PRs before merge; (b) some legacy branches from other developers (`pulley-upgrade-zafran`, `compare-price-usman`, `yusra-as-featured-in`, `NoTopATC-FSR90-Waqas`) are open on the remote and superseded by merged `claude/*` PRs — I will do a branch sweep this week and close them so the list is clean; (c) the n8n/OpenClaw triage repo is separate from the theme repo — if that's what you were viewing, it wouldn't show theme PRs.

We are also not fully one-branch-one-PR today: the cart work is intentionally split across several branches for blast-radius reasons.

### 5. Where do requirements change after development starts, and how should late changes be handled?

Honest list of scope drift mid-flight in the last month:

- **"As Featured In" section** — 3 rebuilds because the placement rule (below content, above reviews) and caption style (factual vs. italic) changed after each merge. Stable now at #575.
- **Rack/Rig consolidation** — Phase 1A moved from "approved to publish" to "prepared for approval only" while we were mid-implementation.
- **Turf Flooring PDP** — "As high as" placeholder + dynamic per-sq-ft scoped, then extended to include price display formatting.
- **Voltage / 220V–240V metafield** — original ask was "restore the dropdown," then re-scoped to "no dropdown, PDP note only, gated on a metafield" (#584).
- **Top 45 hero PDPs** — moved from Top 30 to Top 45 mid-quote; Phase 1 diagnostic approved, Phases 2/3 deferred.
- **Home page CTA update** — desktop-only fix expanded to mobile parity; mobile first shipped as "Shop Remanufactured" then re-scoped to "Shop Now."
- **Send to Yurii / A/B test** — originally a straight A/B; Sagi flagged as outdated given AI PDP progress; you re-scoped to a two-step plan (step 1 dropdowns + more company text non-A/B, step 2 A/B vs. AI PDP).

Recommendation: once a task is in dev, new requests go into a labeled "Batch 2 / follow-up" branch and PR, scheduled after the current task ships. Only genuine defects reopen the active task; everything else is a new queued item. On your side, when you send a new requirement, add "add to v2 follow-up" or "block current release" so I know which lane it goes in.

### 6. Am I becoming a review/merge bottleneck? What should be delegated?

Yes — partially, and only on shared-theme reviews, not on data/content. What to change:

- **Delegate to Zafran now:** homepage/brand-page copy edits, WA-sales-tax-style pages, alt-text imports, image QA sign-off, comparison-chart content patches, Search Console indexing fixes.
- **Delegate to Waqas / Yusra now:** PDP data/content changes, image/description updates, isolated metafield fills, non-cart PDP CSS, PageSpeed accessibility passes.
- **Delegate to Usman:** the French Fitness page batch as a single owner (already the current arrangement — keep it) and any FSS non-A/B page rewrites where the Figma is settled.
- **First-pass QA to Kevin** with a standing checklist and authority to block a merge — otherwise, QA collapses back onto me.
- **Contractor preview review to Waqas** self-serving against a fixed checklist so I only do the final pass.
- **Keep with me (unavoidable):** cart, checkout, order flow, combined-listings family logic, schema, PDP template refactors, and anything that touches `theme.liquid`, `product.liquid`, `cart-drawer`, or the checkout carry-through.

### 7. Which tasks truly require Zafran?

Agreed with your framing. Reserve Zafran for architecture, integrations, root-cause investigations, high-risk migrations, and senior review — specifically:
- Intelligems Core Web Vitals / render-blocking investigation
- Sticky-ATC / cart-drawer architecture review
- Move off Intelligems to the next A/B tool
- Combined Listings source-of-truth migration (with Ayyaz)
- SEO / GSC canonical + indexing failures (Duplicate/Blocked flagged 7/3)
- SemRush setup for both domains + competitor tracking
- Page Speed Insights follow-through (agentic browsing score, mobile PDP LCP)
- Position tracking / rank reporting
- Structured-data validation

He should not be on routine PDP wording, imagery, data entry, feed-level status chasing, or repeated "please confirm" pings on routine listings. I'll route those away from him.

### 8. Are blockers/estimates/completion evidence communicated fast enough? What standard do you recommend?

It's inconsistent today, which drives the repeated status-chasing. Some threads (mobile PDP fix, About/Trust Hub, Puerto Rico shipping, Order #48688) turn around same-day with evidence links. Others (Impulse control tower items, blog cleanup, alt-text import) go quiet for a week or more. Proposed standard: acknowledge blockers and ETAs within one business day; provide a one-line daily status on any active shared-theme item; and require completion evidence to close — PR link, preview link, and QA screenshots at the agreed breakpoints (360/390/428 on mobile). "Done" without that evidence doesn't count as done.

## On your proposed lanes A–E

The A–E structure is right and I would adopt it, with two adjustments: **Lane C (shared theme) needs an explicit WIP limit** or it won't reduce collisions, and **Lane E (release/QA) only works if the QA owner (Kevin) has a standing checklist and authority to block a merge** — otherwise QA collapses back onto me.

## Recommendations

- **WIP limit (shared-theme only):** max **two shared-theme branches in active development plus one in QA** at any time; everything else queued. The cart is one-at-a-time regardless. Data/content and French Fitness page batches are exempt from this cap — the FF page batch is single-owner (Usman), so it does not create shared-surface collisions.
- **Current top five priorities (for your confirmation):**
  1. Ship the mobile home / remanufactured go-live on the shared preview — blocked on Sagi's input + your final review.
  2. PDP right-side / dropdown quick-win (step 1 before the AI-PDP A/B test) — in progress.
  3. French Fitness page batch completion — Usman on track to close ~8 pages by end of next week (4 delivered, ~4 in progress).
  4. Rack/Rig French Fitness consolidation Phase 1B — dev-ready, waiting on Iqra/Larianne product decisions.
  5. Order-flow correctness sweep — close #48619 cart-pricing bug, verify #48688 duplicate-SKU class is contained, confirm the Puerto Rico Intuitive Shipping fix holds, resolve FSR90 Judge.me re-review with Sagi.
  Immediately behind the top five: Combined Listings source-of-truth review (Ayyaz), sticky-ATC / cart-drawer refactor (moves active once PDP-heading wave clears), GymBuild/1500 sq ft package PDP on the new AI PDP design system, FF 5-Stack combined PDP (+$800), 220V transformer metafield rollout.
- **What to pause or reassign:**
  - **Pause:** Yurii A/B test scaffolding for dropdowns vs. AI PDP — Sagi's read is correct; keep step 1 moving, revisit A/B after AI PDP progresses.
  - **Pause / close:** Remanufacturing videos on FSS PDPs — Sagi's ask has been dormant since January; close the loop or park it.
  - **Reassign to Yusra:** Meta/Shopify ad-image non-1:1 fix, PageSpeed accessibility + link-descriptive-text pass, Contact Us form follow-up, blog cleanup SOP resume, comparison-chart content patches.
  - **Reassign to Waqas:** PDP architecture / regression sweep continuation, Home Page NON A/B updates + FSR90 iteration until Sagi re-review closes.
  - **Keep with Usman:** French Fitness page batch + FSS non-A/B page rewrites.
  - **Reassign to Ayyaz:** Combined Listings SOPs + product-family structure normalization.
  - **Reassign to Hafiz:** all draft-listing cleanup (FF-X90, FF-X90-HLP, StudioWall, FFM-PSM, Belt Squat).
  - **Escalate product-side (Larianne / Iqra):** voltage-metafield selection for Woodway, Top 45 tracker column completion, 5-50 test package $0 option-category listings, Rack/Rig subcategory-button mechanism decision.
- **Work that should no longer involve Zafran:** routine PDP wording, imagery, data entry, content QA, status chasing.
- **GitHub / Monday / Gmail operating flow:**
  - **GitHub** — one branch + one PR per shared-theme workstream, with the PR description linking the Gmail thread, preview theme ID, and QA screenshots. I will do a branch sweep this week to close stale branches.
  - **Monday** — the task tracker (owner, status, blocker, next action, due date). Every Monday item that has a code-change dependency links to its GitHub branch / PR. I'll start closing the loop back to the Monday row on every merge so the sheet is not the last thing to update.
  - **Gmail** — approvals, external / contractor communication, and relationship-sensitive decisions only. Dev status lives in Monday / PRs, not email chase-threads.
  - One weekly "in-flight" digest from me on Fridays (see format below), so you have a single place to see the queue without asking.
- **Developer update format (I'll start using this immediately for every active shared-theme task):**
  ```
  Task / Estimate (ETA) / Branch – Preview – PR / Blocker / QA status (breakpoints + evidence) / Next step
  ```
  Friday roll-up covering: merged this week, live on preview awaiting QA, blocked (with the owner of the unblock), top 5 for next week.

To be direct on your framing question: I do not think we need to slow PDP work down. I think we need to (a) hold the shared-theme WIP limit to 2 + 1 in QA, (b) move routine data / content off my and Zafran's plates as outlined above, (c) enforce "new requirements go to a v2 branch," and (d) close the Monday ↔ GitHub loop with the Friday digest. That gets you **more PDPs completed correctly per week, fewer reopens, and faster communication** — without shrinking scope. The French Fitness page lane under Usman is already delivering at the pace we want (4 done, ~8 by next week), and the same single-owner batch pattern is what I would replicate elsewhere.

Happy to jump on a 20-minute call if any of the lane assignments above need adjustment before I send the Friday digest.

Thanks,
Izza | Fitness Superstore
Full-Stack Lead Developer
537 Stone Rd STE F
Benicia, CA 94510
Main Office: +1-925-215-2927
Fax: 1-800-346-2960
Email: izza@fitnesssuperstore.com
www.fitnesssuperstore.com
