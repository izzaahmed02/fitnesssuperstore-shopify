# Reply Draft — Tim: Review requested: PDP workload, developer lanes, and faster execution

**To:** tim@fitnesssuperstore.com
**Cc:** zafran@fitnesssuperstore.com
**Subject:** Re: Review requested: PDP workload, developer lanes, and faster execution

---

Hi Tim,

Thanks for the follow-up and apologies for the delay on the detailed write-up — I wanted to reconcile it against what has actually landed in GitHub, the live theme, and the active Monday/Gmail workstreams before responding, rather than send a generic answer. Here is the full response, structured to your eight questions, and then the recommendations at the end.

## Before the framework — where the pace actually is

Between May 29 and July 4 we merged **50+ PRs to `main`** on the fitnesssuperstore-shopify theme repository. That is the correct repo, and the branch/PR queue is complete — nothing PDP is happening off-repo. A short list of what landed just in the last ~5 weeks so we are aligned on facts:

**Combined listings / PDP core (French Fitness heavy):**
- #558 Support parent product variants in combined listings
- #559 Fix variant switching on combined-listings PDP
- #560 Don't redirect away from a valid combined-listing child page
- #561 Re-add family variants map + fallback interceptor
- #572 Fix MSS PDP variant image on redirect + clarify unavailable options
- #573 Fix combined-listing selector reset to Singles + card "From" price
- #578 Pass option title to related-products button
- #594 Consolidate combined/variant PDP title into a single responsive H1
- #597 Friendly display names for product variant options via metafields (this is the "dropdowns" / consolidated-listings direction you asked me to move on)
- Aluminum Pulley picker source-control parity live (#604), hybrid variant picker for pulley template earlier

**PDP heading + SEO cleanup batch:**
- #588 Related products: backfill to 4, dedup, suppress exclusion, primary collection
- #585 Suppression guard for `suppress-recommendations` tag
- #589 Collection card titles → H2, option labels un-headed
- #590 Duplicate product-title heading resolved on combined/variant PDPs
- #593 Removed old text-based metafield breadcrumb fallback (cleaner metaobject path)
- #591 Removed unused product option template + modal snippet (dead code)

**PDP structure / gallery / mobile:**
- #596 Fix PDP layout spacing + gallery width
- #600 PDP gallery resize + center, widen buy-box column
- #601 Mobile gallery handles all previewable media types (fixed the empty trailing slide with 3D-model media)
- #595 Removed left side-nav on collection and product templates (A/B direction)
- #605 Removed the auto-injected video block from PDP description (rubber gym mats thread)

**French Fitness / homepage / brand pages:**
- #580 New homepage merged
- #568 Homepage H1 branding + robots.txt AI bot policy
- #575 "As Featured In" section component (and follow-ups #564/#565/#566)
- #583 Washington state sales-tax page updates
- The French Fitness collection pages (rack-rig-systems, pre-configured-rigs, rig-frame-pieces-customize-your-rig) are already live with FF banners; my dev review of `main-collection-banner.liquid` for the Rack/Rig consolidation is done and is now waiting on Iqra/Larianne product decisions before Phase 1B dev work.

**Warranty / checkout / cart:**
- #576 Warranty + processing-time metafields carried through to checkout and order page
- #570 Warranty block reordered to render last, before Prop 65 popover
- #556 Fixed cart drawer showing duplicate variant options
- #555 Pulley picker full-page nav on variant change + duplicate cart properties fix

**Schema / SEO / turf / sandbag / structured data:**
- #579 VideoObject schema standardized + de-duplicated
- #562 / #563 Judge.me AggregateRating structured data corrected
- Turf Flooring PDP dynamic "As high as / per sq ft" revision (#598 branch)
- Global Power Sand Bag + Strongman Sandbag PDP revisions in-flight

**Sticky cart / cart drawer:** I want to call this out explicitly because you asked. Sticky-ATC and cart-drawer work has been split into isolated branches by design so we do not destabilize the buy-flow while we ship PDP improvements (`atc-sticky-usman`, `cart-cart-drawer`, `cart-options-popup`, `cart-shipping-widget-calculator`, `cart-upsells-without-avis`, `cart-without-avis`, `cart-invistigation`). Those are staged behind the current PDP work on purpose — the cart is our highest-blast-radius surface and I do not want a heading/H1 refactor and a sticky-ATC refactor colliding on the same preview theme. The V2 "No Cart Drawer" test is being evaluated in parallel — I am reviewing the Convert app and Sagi is running the parallel VWO outreach.

**Mobile PDP quick wins that shipped this window:**
- "PDP images cut off on mobile" — full product photos now display, forced 1:1 removed (#600 + #601, live within hours of the 6/30 flag).
- About / Trust Hub desktop + mobile update — Tim confirmed 7/1 "much better and solves the main issue" (Nationwide section revised).
- Home page CTA update — desktop + mobile CTAs re-linked to /collections/all; final mobile wording tweak to "Shop Now" outstanding per your 7/1 note.

**French Fitness page development in flight right now (beyond what's already merged):**
- **French Fitness Home Page** — Usman built from Figma; I reviewed 7/5 and delivered feedback on layout, header/footer, hero, product/category sections; dev iterating.
- **FF redesign pages ("Our CEO" and other brand pages)** — approved in Figma, handed off to dev 7/1.
- **French Fitness Rack/Rig consolidation** — dev review of `main-collection-banner.liquid` done, two competing subcategory-button mechanisms identified, Phase 1A held as "prepared for approval" waiting on Iqra/Larianne.
- **Top 45 French Fitness hero products / Agentic AI PDP lane** — first 15 SKUs named (FFT-ACD, FFB-SM200, FFB-8SMJG…), dev tracker columns filled by me; Masum needs SKU triage into diagnostic vs. product-data lanes before he can hit P0.
- **Top 30 French Fitness hero-product optimization quote** — Phase 1 diagnostic approved at $3800 with checkpoint gate; Phases 2/3 pending your approval.
- **GymBuild package PDPs (Build your gym / 1500 sq ft or less)** — moving onto the new Package PDP / AI PDP design system with /pages/gym-packages as parent decision hub.
- **New French Fitness 5-Stack combined PDP** — sales.cs requested 7/3 build with +$800 custom configuration; queued for assignment.

**Other active PDP threads worth naming so nothing looks invisible:**
- **FSR90 PDP Design** — Waqas integrated the Judge.me widget and it is rendering; awaiting Sagi re-review (nudged 7/3).
- **Send to Yurii / A/B test on product pages** — gallery + spacing fixes done, dropdowns in progress per your two-step plan (step 1 dropdowns + more company text without A/B, step 2 A/B vs. AI PDP).
- **Home Page NON A/B Test Updates + Mobile PDP quick wins** — combined thread that Waqas/Zafran/I are working; you flagged the home page as "messed up" and Sagi's A/B compatibility question is still open.
- **PageSpeed Insights cleanup** — Yusra owns, gated on Waqas closing the PDP architecture/regression thread first.
- **Mixed Signals to Google** — origin story, team-size, schema, and copy-alignment fixes with Zafran; status still outstanding since 5/16.
- **Product Operations Support & Availability** — I sent Iqra additional product-ops context 7/5, Zafran CC'd.
- **Remanufacturing Videos on FSS PDPs** — Sagi asked for a status in Jan; genuinely stale, I will close the loop this week.
- **Voltage information on Woodway Treadmill** — voltage dropdown restore is blocked because I cannot see the voltage selection in the metafield; waiting on Larianne.

So the honest read from the execution side: **the pace is healthy and the queue is moving.** What is worth improving is not the volume — it is the shape of the process. That is where your eight questions land, and here is the joint answer.

---

## Answers to your eight questions

### 1. Which active PDP projects are data/content/admin work vs. shared-theme development?

**Data/content/admin (parallel-safe, no dev bottleneck):**
- Top 45 French Fitness hero products tracker column fill-in (Larianne/Iqra)
- Combined Listings source-of-truth review (Ayyaz onboarding)
- Consolidated 5-50 test package $0 option-category listings (Larianne)
- Image alt-text batch import (2,281 images, approved 6/22, waiting on Larianne)
- Image QA tracker batch review (Shery)
- Comparison-charts SEO audit (7 content patches + 3 Tim decisions)
- Manual / QR /manuals/* URL structure planning
- Sample-candidate Drive folders (6 SKUs — no publish)
- Sally's product-validation packet for Gym Packages (2,000 sq ft pilot)
- Blog article cleanup / SOP revision
- Shopify inventory + freight-class updates for cardio SKUs
- Meta/Shopify ad-image aspect-ratio fix

**Shared theme / template dev (must be sequenced, WIP-limited):**
- PDP master template + combined-listings + variant behavior
- Cart drawer / sticky-ATC / cart upsells + V2 "No Cart Drawer" test evaluation
- Homepage template + brand pages (Fitness Superstore + French Fitness Figma builds)
- Rack/Rig collection consolidation (banner subcategory buttons + Phase 1B)
- Roomplanner + BYOR integration on gym-packages hub
- Global schema / VideoObject / breadcrumb refactors
- A/B test scaffolding for dropdowns vs. AI PDP (Yurii/Sagi lane) — step 1 dropdowns in progress
- New French Fitness 5-Stack combined PDP with +$800 custom configuration
- FSR90 PDP design (Waqas — Judge.me widget rendering, awaiting Sagi re-review)
- Home Page NON A/B Test Updates + Mobile PDP quick wins combined thread
- FF redesign pages ("Our CEO" + other brand pages from Figma, dev handoff open)

**Product-family rollout (pilot-then-replicate):**
- 500/1,000/1,500 sq ft package validation (after 2,000 pilot approved)
- Tahoe hero-image round 2
- Treadmill enrichment metafield/metaobject approval (Shikha)
- New French Fitness Urethane 8-Sided Hex Dumbbell blank listing

**High-risk architecture:**
- Puerto Rico shipping / Intuitive Shipping duplicate-rate fix (root-caused with Kevin)
- Order #48619 cart pricing bug (FSR100-CB + add-ons)
- Order #48688 FFT-PLCLE variant / duplicate-SKU regression (investigated, response sent 7/2)
- 220V–240V external-transformer PDP eligibility metafield (Larianne + Josue)
- Gorgias / Facebook integration reauth + `@adams-acres.com` access removal

### 2. Which projects touch the same Liquid sections, snippets, CSS/JS, templates, metafields/metaobjects, cart logic, or apps?

The real overlap points, honestly, are:

- **`product.liquid` / product template variants** — heading refactor, related-products, "As Featured In," warranty block reorder, gallery resize, transformer snippet, dropdown option labels — all touch the same PDP surface. This is where I have been holding the WIP-limit tight, and it is why several PDPs share the `claude/amazing-feynman-*` branch (that branch is the coordinated PDP-title/H1 line and I merged sequentially rather than in parallel).
- **`main-collection-banner.liquid`** — Rack/Rig consolidation uses one subcategory-button mechanism, and the older FF collection pages use another. I flagged this in my 7/1 email; I intentionally paused destructive changes until Iqra/Larianne pick one.
- **Cart drawer + line-item properties** — sticky-ATC, warranty carry-through, and duplicate-variant-options fix all touch the same drawer render. This is the reason cart-adjacent branches are staged behind the current PDP wave.
- **Breadcrumbs (metafield vs. metaobject/collection fallback)** — cleaned up in #593; the corrected-breadcrumb sheet review with Larianne has been idle for a month and is worth a nudge.
- **Combined-listing family-variants map** — touched by four separate fixes (#558–#561, #573, #597) because the family/singles behavior interacts with every combined-listing PDP we introduce.
- **VideoObject / structured data** — #579 de-duplicated it so future PDPs don't collide.

### 3. Are any developers editing overlapping code or waiting on the same preview theme, PR, or reviewer?

Not currently on `main`. The way I have been managing this:

- Every dev has their own dev/preview theme, so nobody is stepping on the same published theme.
- PDP-shared work goes through `claude/*` branches with me as the required reviewer/merger; product-family and data work does not.
- Where two workstreams touch the same file (e.g., combined-listings + heading refactor), I sequence them into the same base branch rather than opening parallel PRs against `main` — that is why #588/#589/#590/#594 all built off `claude/amazing-feynman-5kj24j`.

The one real bottleneck signal: any PR that touches cart / checkout / order carries me as the required reviewer because of the blast radius, and that is intentional.

### 4. Are active changes being tracked in the correct GitHub repository with one branch and PR per workstream? I could not see an open issue/PR queue matching the amount of active work.

Yes — the repo is `izzaahmed02/fitnesssuperstore-shopify`, and the reason the **open** PR queue looks small (1 open right now, #602) is that we are merge-forward rather than long-lived-branch — the moment a workstream passes QA it merges and closes, and the next branch starts from the fresh `main`. I would rather have 50 merged PRs in 5 weeks than 15 stale open ones. If you want a running "open scope" view I can pin an issue that lists in-flight workstreams and their branch names, updated weekly.

Where I know there is a gap: some legacy branches from other developers (`pulley-upgrade-zafran`, `compare-price-usman`, `yusra-as-featured-in`, `NoTopATC-FSR90-Waqas`) are open on the remote and superseded by merged `claude/*` PRs. I will do a branch sweep this week and close them so the list is clean.

### 5. Where are requirements changing after development starts, and how should late changes be moved into a follow-up batch?

Honest list of where scope drifted mid-flight in the last month:

- **"As Featured In" section** — 3 rebuilds because the placement rule (below content, above reviews) and the caption style (factual vs. italic) changed after each merge. It is now stable at #575.
- **Rack/Rig consolidation** — Phase 1A moved from "approved to publish" to "prepared for approval only" while we were mid-implementation.
- **Turf Flooring PDP** — "As high as" placeholder + dynamic per-sq-ft was scoped, then extended to include price display formatting.
- **Voltage / 220V–240V metafield** — original ask was "restore the dropdown," which then became "no dropdown, PDP note only, gated on a metafield" (#584).
- **Top 45 hero PDPs** — moved from Top 30 to Top 45 mid-quote; Phase 1 diagnostic then had Phases 2/3 explicitly deferred.
- **Home page CTA update** — desktop-only fix expanded to mobile parity; mobile shipped as "Shop Remanufactured" then re-scoped to "Shop Now."
- **Send to Yurii / A/B test** — originally a straight A/B; re-scoped to a two-step plan (step 1 dropdowns + more company text non-A/B, step 2 A/B vs. AI PDP) mid-thread.
- **French Fitness Rack/Rig thread** — started as consolidation, expanded into UX guardrails + dev review of `main-collection-banner.liquid` + Phase 1A "prepared for approval" hold.

Recommended rule (for both sides): once a task is in dev, new requirements go into a **v2 follow-up branch** with a new PR, not into the active branch. I will enforce this on my side. On your side, when you send a new requirement, please add "add to v2 follow-up" or "block current release" so I know which lane it goes in.

### 6. Am I becoming a review or merge bottleneck? What should be delegated?

Partially — and only on shared-theme reviewers, not on data/content. What to change:

- **Delegate to Zafran now:** homepage/brand-page copy edits, WA sales tax-style pages, alt-text imports, image QA sign-off, comparison-chart content patches, Search Console indexing fixes.
- **Delegate to Waqas/Yusra now:** PDP data/content changes, image/description updates, isolated metafield fills, non-cart PDP CSS.
- **Keep with me (unavoidable):** cart, checkout, order flow, combined-listings family logic, schema, PDP template refactors, anything that touches `theme.liquid`, `product.liquid`, `cart-drawer`, or the checkout carry-through.

### 7. Which tasks truly require Zafran? What should he stop being pulled into?

Zafran should stay on:
- SEO/GSC canonical + indexing failures (currently active — Duplicate/Blocked issues flagged 7/3)
- SemRush setup for both domains + competitor tracking
- Page Speed Insights follow-through (agentic browsing score, mobile PDP LCP)
- Position tracking / rank reporting
- Boxrox / referral traffic audit
- Structured-data validation
- High-risk migrations (breadcrumb metaobject cutover, Combined Listings source-of-truth review with Ayyaz)

Zafran should stop being pulled into:
- PDP wording and imagery
- Data entry, alt-text batch imports, feed-level status chasing
- Product-tag hygiene
- Repeated "please confirm" pings on routine listings

The Yusra additions Tim asked about in the other thread are the right release valve for this — Yusra now has bandwidth and Waqas continues to own the mobile PDP quick-wins lane.

### 8. Are developers communicating blockers, estimates, and completion evidence quickly enough? What response standard do you recommend?

Uneven. Some threads (mobile PDP fix, Puerto Rico shipping, Order #48688) turn around same-day with evidence links. Others (Impulse control tower items, blog cleanup, alt-text import) go quiet for a week+. The proposed standard is below.

---

## Recommendations

### Lanes (matches your A–E, tightened)

**A. PDP data/content/admin lane** — broad parallelism. Products (Larianne) owns factual source material; execution assigned to Hafiz / Iqra / Shery / Yusra / Ayyaz; QA is a separate step signed off by Larianne. No dev branch required unless a theme change is needed.

**B. Product-family / template rollout lane** — one pilot approved end-to-end, then batch replicate. Owners: Yusra + Waqas execute, I review. Current pilots: 2,000 sq ft package (Sally), Tahoe hero-image round, Combined Listings source-of-truth (Ayyaz).

**C. Shared theme / component lane** — WIP limit of **2 concurrent branches** on shared PDP/cart/checkout surface. Separate dev preview per branch. Mandatory PR with me as reviewer. Regression QA before merge.

**D. High-risk architecture / integration lane** — I own the flow; Zafran is escalation and senior review only. Currently: cart pricing bug (#48619), duplicate-SKU regression (#48688 class), Intuitive Shipping duplicate rates, Gorgias/Facebook integration health, 220V–240V metafield rollout.

**E. Release / QA lane** — dedicated QA owner per release. Kevin for checkout/shipping, Larianne for product-data, me for cart/PDP structure. Rollback evidence recorded on every merge.

### Work-in-progress limit for shared-theme work only

**2 active branches at a time** on `product.liquid` / cart / checkout surfaces. Everything else queues. This is the only limit that matters — data/content and product-family lanes have no WIP cap.

### Current top five priorities

1. **Combined Listings source-of-truth review** (Ayyaz onboarded 7/1, guidance sent 7/3 — needs his completion this week so we stop re-fixing the same variant logic).
2. **Sticky-ATC / cart-drawer refactor + V2 "No Cart Drawer" test** (moves to active as soon as this PDP-heading wave clears — I will not open it while the H1/heading refactor is still on preview; Convert app evaluation and VWO outreach with Sagi in parallel).
3. **French Fitness Home Page + FF redesign pages** (Usman's Figma build reviewed 7/5; "Our CEO" and other brand pages in dev handoff — this is a large French Fitness page batch that should ship together, not one-off).
4. **Top 45 French Fitness hero products — PDP + Agentic AI PDP lane** + step-1 dropdowns for Yurii/Sagi A/B (dev tracker filled by me; step-1 dropdowns in progress; blocked on Larianne/Iqra completing their tracker columns).
5. **Order-flow correctness sweep** — close #48619 cart-pricing bug, verify #48688 duplicate-SKU class is contained, confirm Puerto Rico Intuitive Shipping fix holds, resolve FSR90 Judge.me widget re-review with Sagi.

Immediately behind the top five (queued, dev-ready or near-ready): Rack/Rig Phase 1B (waiting Iqra/Larianne), GymBuild/1500 sq ft package PDP on new AI PDP design system, FF 5-Stack combined PDP (+$800 custom), 220V–240V transformer metafield rollout, mobile PDP home page fix (Waqas).

### What should be paused or reassigned

- **Pause (only the A/B):** Yurii A/B test scaffolding for dropdowns vs. AI PDP — Sagi's read is correct that the A/B is outdated given AI PDP progress. Keep step 1 (dropdowns + more company text) moving without A/B, then revisit A/B vs. AI PDP once the AI PDP lane is closer.
- **Pause (stale + low-signal):** Remanufacturing videos on FSS PDPs — Sagi's open ask has been dormant since January; close the loop this week or park it.
- **Reassign to Yusra:** Meta/Shopify ad-image non-1:1 fix, PageSpeed accessibility + link-descriptive-text pass, Contact Us form follow-up, blog cleanup SOP resume, comparison-chart content patches.
- **Reassign to Waqas:** PDP architecture / regression sweep continuation, Home Page NON A/B updates + FSR90 iteration until Sagi re-review closes.
- **Reassign to Usman:** French Fitness Home Page + FF brand-page Figma builds (already the current owner; keep him on the FF page batch to ship as a set).
- **Reassign to Ayyaz:** Combined Listings SOPs + product-family structure normalization.
- **Reassign to Hafiz:** all draft-listing cleanup (FF-X90, FF-X90-HLP, StudioWall, FFM-PSM, Belt Squat).
- **Escalate to product-side (Larianne/Iqra):** voltage-metafield selection for Woodway (blocking PDP dropdown restore), Top 45 tracker column completion, 5-50 test package $0 option-category listings, Rack/Rig subcategory-button mechanism decision.

### Work that should no longer involve Zafran

Everything under "Data/content/admin" in Q1, plus routine status pings. Zafran stays on SEO, GSC, SemRush, PageSpeed, structured data, source-of-truth migrations, and escalations.

### Correct GitHub / Monday / Gmail operating flow

- **GitHub** = the single ground truth for anything that changes the theme. One branch and one PR per workstream. Squash-merge, close superseded branches weekly.
- **Monday** = the ground truth for cross-functional tasks (product validation, content, sales/quote flow, image QA). Every Monday item that has a code-change dependency links to its GitHub branch/PR.
- **Gmail** = decisions and approvals only. If a decision lives only in Gmail and not in Monday or GitHub, it doesn't exist. I will start closing the loop back to the Monday row on every merge so the sheet is not the last thing to update.
- One weekly "in-flight" digest from me on Fridays (see format below), so you have a single place to see the queue without asking.

### Developer update format (proposed — I will start using this immediately)

For every active workstream, one line:

```
[Workstream] · [Owner] · Estimate: [hrs/days] · Branch: [name] · Preview: [url] · PR: [#] · Blocker: [none | who/what] · QA: [not-started | in-QA | passed] · Next step: [one sentence]
```

And a Friday roll-up (I will send this weekly starting 7/10) covering:
- Merged this week
- Live on preview, awaiting QA
- Blocked (with the owner of the unblock)
- Top 5 for next week

---

To be direct on your framing question: I do not think we need to slow PDP work down. I think we need to (a) hold the shared-theme WIP limit to 2, (b) move routine data/content off my and Zafran's plates as outlined above, (c) enforce "new requirements go to a v2 branch," and (d) close the Monday ↔ GitHub loop with the Friday digest. That gets you **more PDPs completed correctly per week, fewer reopens, and faster communication** without shrinking scope.

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
