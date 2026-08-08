# Technical SEO Recovery Sprint — Ticket / PR Plan

**Workstream:** Technical SEO recovery — crawl, schema and mobile CWV
**Source of authority:** Tim's emails of 2026-08-05 (scope) and 2026-08-06 (ownership model), thread *"ACTION: Technical SEO recovery sprint — crawl, schema and mobile CWV"*
**Prepared by:** Izza — Full-Stack Lead Developer, primary implementation lead
**Date prepared:** 2026-08-08
**Checkpoint this satisfies:** August 12 ticket/PR plan checkpoint
**Status:** PLAN ONLY — awaiting Tim's written GO. No code, theme, robots, WAF/CDN, redirect, canonical, schema, feed or production change has been made.

---

## 1. What this document is, and what it is not

This is the bounded ticket and PR plan Tim asked for. Every item below has a named executor, a named independent verifier, an evidence requirement, a rollback path, and a dependency owner.

**Nothing in this plan has been executed.** The only change on branch `claude/seo-recovery-sprint-pb3w4z` is this document. No theme file, `robots.txt.liquid`, schema snippet, canonical rule, redirect or vendor script has been touched. Every ticket is written so that it cannot begin until Tim issues a written GO for its batch.

The findings below were produced by reading the current `main` branch of `izzaahmed02/fitnesssuperstore-shopify` directly. Each one cites the exact file and line so Tim and Zafran can verify the claim without taking my word for it.

**A note on the attachments.** Tim's email carried eight attachments (technical brief, acceptance criteria, patch examples, schema specification, robots/WAF validation checklist, Lighthouse CI scope, crawl/indexation workplan, implementation backlog). I could not open Gmail attachments in the environment I prepared this in, so **this plan is built from Tim's email body plus first-hand reading of the repository, not from those documents.** Before the August 12 checkpoint I need to reconcile this plan against the attached acceptance criteria, schema specification and crawl/indexation workplan, and against the shared backlog IDs, so that ticket numbering and acceptance thresholds match the controlled documents rather than competing with them. Where this plan and the attachments disagree, the attachments win and this plan gets revised.

## 2. Ownership model (per Tim, 2026-08-06)

| Role | Person | Scope in this plan |
|---|---|---|
| Primary implementation lead | **Izza** | Execution, Shopify/GitHub coordination, ticket & PR assignment, preview/release planning, merge and rollback control |
| Technical SEO co-lead | **Zafran** | Crawl/indexation classification, URL architecture, redirects/canonicals, schema, CWV, technical acceptance criteria, independent validation |
| Programme tracking | **Control Tower** | Owners, deadlines, blockers, evidence links, completion. Monitors; does not replace Izza or Zafran as responsible owners |
| Live-page QA | **Iqra** | Logged-out desktop and mobile QA on preview and post-release |
| Catalog / variant verification | **Yusra** | Independent read-back on catalog-facing changes |
| Feed / Merchant Center | **Kevin** (with Yusra) | Any change touching `itemCondition`, price, availability, SKU/MPN or feed-visible fields |
| Content owner | **Larianne** (with Saliha) | Collection copy, visible author/source content |
| Release authority | **Tim** | Written GO per batch. No deploy without it |
| Not an owner here | **Jake** | Link building only, handled separately after approved priority URLs and assets exist |

## 3. Scope boundary across the two repositories

- **`izzaahmed02/fitnesssuperstore-shopify`** — carries the entire technical SEO surface. All tickets below land here.
- **`izzaahmed02/fs-bundle-api`** — extension-only Shopify app (Rust cart-transform function for product bundles). It renders no crawlable HTML and emits no structured data, so **it gets no tickets in this sprint.** It stays in scope for one control only: if bundle pricing behaviour changes, the `Offer` price in `snippets/schema-product.liquid` must remain truthful against what the customer is actually charged. That is a verification dependency, not a code change.

## 4. Batch sequencing

Tim's developer decision was *fix crawl and data truthfulness before adding more template complexity.* The sequencing below follows that, with one addition ahead of everything else.

```
Batch 0  Measurement integrity + evidence baseline   ← blocks Batch 3, and blocks the Lighthouse CI scope
Batch 1  Crawl / indexability classification + legacy routes + server-rendered index controls
Batch 2  Structured-data truthfulness
Batch 3  Mobile CWV
Batch 4  Collection copy, internal links, visible author/source   ← last, per Tim's decision
```

Batch 0 exists because of finding **TS-000** below. I am raising it first because it affects whether the Lighthouse CI scope Tim attached can produce meaningful numbers at all.

---

## 5. Batch 0 — Measurement integrity and evidence baseline

### TS-000 — Lighthouse / PageSpeed Insights user-agent gate suppresses vendor scripts *(P0 — decision required before any CWV work)*

**Evidence:** `layout/theme.liquid:139-143`

```js
var ua = navigator.userAgent || "";
if (ua.includes("Chrome-Lighthouse") || ua.includes("Page Speed Insights")) {
  return;
}
```

This sits at the top of the block that injects the Gorgias chat widget (`theme.liquid:151-157`) and the Convert bundle loader (`theme.liquid:159-165`). When the visitor's user-agent identifies as Lighthouse or PageSpeed Insights, **both vendor scripts are skipped entirely.** Every other visitor gets them.

Consequences, stated plainly:

1. Any Lighthouse or PSI score collected today measures a version of the page that no real customer receives. A Lighthouse CI baseline built on this is not a baseline — it is a measurement of the site with its two heaviest third parties removed.
2. Field data (CrUX / Search Console Core Web Vitals) is collected from real Chrome users, who **do** get both scripts. So lab and field will diverge, and the field numbers are the ones Google actually uses for the Core Web Vitals assessment.
3. Serving materially different resources to a measurement user-agent than to users is the kind of pattern search engines treat as cloaking. I am not asserting a penalty exists; I am asserting this is a risk we should not carry, and that it makes our own instrumentation lie to us.

**This is why I put it before everything else:** the Lighthouse CI scope Tim attached cannot be wired up meaningfully until this is resolved, and item 4 of Tim's scope ("shared mobile CWV causes") cannot be measured honestly while it stands.

**Recommendation:** remove the user-agent gate, then genuinely reduce third-party cost through TS-031 and TS-032 so the real numbers improve. If Tim wants the gate kept temporarily for any reason, then Lighthouse CI must run with an overridden user-agent so it collects real numbers, and we must document why the gate exists.

**Decision needed from Tim.** I am not removing it without a written GO, and I do not think it should be removed silently — whoever added it may have had a reason worth hearing first.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence required:** `curl` with default and Lighthouse user-agents showing the served HTML difference; Lighthouse run with and without UA override; CrUX/Search Console field data for the same templates, showing the lab/field gap
- **Rollback:** single-commit revert; theme version pinned before release
- **Dependency:** Convert (Thomas/Gwen) — see TS-031, which touches the same block
- **Blocks:** TS-034, and the validity of all Batch 3 before/after evidence

### TS-001 — Source register and sampled-URL evidence pack *(P0, no code)*

Tim's control: *"Do not treat the raw Search Console exclusion counts as a directive to index or redirect everything. Classify URL cohorts first."*

Build the source register for this workstream before any classification decision: the August 5 Search Console coverage/performance exports, live sampled URLs per cohort (logged out, mobile and desktop), raw HTML and response headers per sample, and the current-versus-proposed position per cohort. No indexing, redirect or canonical decision in Batch 1 may be taken without its sample set attached.

- **Executor:** Zafran · **Independent verifier:** Izza
- **Evidence required:** the register itself, minimum 10 sampled URLs per cohort in TS-010 with raw HTML plus headers
- **Rollback:** n/a — no production change
- **Dependency:** none
- **Blocks:** all of Batch 1

---

## 6. Batch 1 — Crawl / indexability classification, legacy routes, server-rendered index controls

*Covers Tim's scope items 1 and 3.*

### TS-010 — URL cohort inventory and classification matrix *(P0, no code)*

Classify every cohort as **index / canonicalise / 301 / 410 / robots-exclude / leave alone**, each with sampled evidence and documented intent. Cohorts confirmed present from the repository and `robots.txt.liquid`:

| Cohort | Where it comes from | Currently |
|---|---|---|
| Legacy `.asp` / `.htm` routes | Pre-Shopify platform; **not theme-served** (no `.asp`/`.htm` route references exist anywhere in the theme) | Unknown — needs Search Console + redirect-table evidence |
| `?variant=` | Shopify variant selection | Client-side `noindex` injected by JS, plus a server-rendered canonical to the clean URL — conflicting signals, see TS-012 |
| `?perview=` | Custom param set by `sections/product-index-grid.liquid:9` | **Not in `robots.txt.liquid` at all** (0 matches) — uncontrolled duplicate cohort |
| `?view=` (JSON/partial templates) | 5 `{% layout none %}` templates, see TS-014 | `Disallow: /*?*view=*` |
| `?sort_by=` | Collection sorting | `Disallow` in `*`, plus `/collections/*sort_by*` |
| `page=` | Pagination | `noindex,follow` **and** a canonical pointing to page 1 — conflicting, see TS-012 |
| `srsltid=` | Google Merchant Center auto-tagging | Not in robots (correctly — blocking it would break Merchant Center); relies on canonical. Needs sampled confirmation |
| `_pos=` / `_sid=` / `_ss=` | Shopify internal search referrals | **Not in `robots.txt.liquid`** (0 matches) — uncontrolled duplicate cohort |
| `/collections/*/products/` | Collection-scoped product URLs | `Disallow` |
| `filter.*` facets | Faceted navigation | Only multi-filter combinations disallowed; single-filter URLs are crawlable |

- **Executor:** Zafran · **Independent verifier:** Izza · **Reviewer:** Tim (classification intent)
- **Evidence required:** the matrix, with sample URLs, raw HTML, headers and Search Console status per cohort
- **Rollback:** n/a — no production change
- **Dependency:** TS-001
- **Blocks:** TS-011 → TS-015

### TS-011 — Legacy `.asp` / `.htm` route mapping and 301 plan *(P1)*

The theme contains **no** `.asp`/`.htm` route handling, so these are not a theme problem. They are either Shopify admin URL redirects or CDN-level rules. Produce a one-to-one old→new map with a named target per URL; anything without a genuine equivalent goes to 410, not to the homepage. Redirect chains and loops must be zero.

- **Executor:** Izza (Shopify admin redirects) · **Independent verifier:** Zafran · **QA:** Iqra
- **Evidence required:** full map CSV; `curl -I` per sampled URL showing single-hop 301 to a 200; chain-depth report
- **Rollback:** redirects removed individually; map retained for re-application
- **Dependency:** TS-010. **Not a theme PR** — no code change, so no merge gate, but Tim's GO still required

### TS-012 — Replace browser-only index controls with server-rendered controls *(P0)*

This is Tim's scope item 3 stated precisely. Three defects in `snippets/head-meta.liquid`:

1. **Client-side `noindex` injection** (`head-meta.liquid`, the `{% if template contains 'product' %}` script block): when the URL contains `variant=`, JS constructs a `<meta name="robots" content="noindex,follow">` and appends it to `document.head`. This depends on the crawler executing JavaScript, and it is not in the raw HTML.
2. **`noindex` combined with a cross-URL `canonical`.** Paginated collection URLs get `<meta name="robots" content="noindex,follow">` (from the `page=` check at the top of `head-meta.liquid`), while the canonical for the same URL is `{{ collection.url | prepend: base_url }}` — i.e. page 1. Telling a crawler "do not index this" and "the real version is over there" at the same time is a contradiction, and it is exactly the kind of broad rule Tim's control warns about. Note the current rule also removes page 2+ as a discovery path to deeper products.
3. **`history.replaceState` stripping `option_values`** — browser-only cosmetics; a crawler never sees it. If those URLs need controlling, control them server-side.

For `?variant=` the server-rendered canonical already present in `head-meta.liquid` is the correct and sufficient control; the JS `noindex` should go. For pagination, the `noindex`-plus-canonical combination needs a single documented position, with sampled evidence, and Tim's explicit GO — it is a crawl-strategy decision, not a cleanup.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (logged out, mobile + desktop)
- **Evidence required:** raw HTML (JS disabled) before/after per cohort; `curl -I` header check; Search Console URL Inspection on samples; Rich Results Test unaffected
- **Rollback:** single-commit revert; theme version pinned
- **Dependency:** TS-010 classification signed off first

### TS-013 — `perview` parameter and browser-only sort/pagination redirects *(P1)*

`sections/product-index-grid.liquid:1-27` binds `change` handlers to the per-page and sort selects and calls `window.location.replace(...)`, setting a custom `perview` param. `perview` appears **nowhere** in `robots.txt.liquid`, so unlike `sort_by` it is an uncontrolled crawlable cohort. Decide its position in TS-010, then implement server-side, plus proper `rel="next"`/`rel="prev"`-equivalent discovery if pagination is to stay crawlable.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra
- **Evidence required:** sampled `?perview=` URLs with headers and index status; crawl of the collection template with JS disabled showing product discovery paths
- **Rollback:** single-commit revert
- **Dependency:** TS-010

### TS-014 — `{% layout none %}` view templates: exclusion posture and a live Liquid syntax defect *(P1)*

Five templates render raw JSON or HTML fragments at collection URLs via `?view=`: `collection.all-collections-json.liquid`, `collection.manuals-metafields-json.liquid`, `collection.ajax_full_collection.liquid`, `collection.manual-item.liquid`, `collection.manual-list.liquid`. `robots.txt` disallows `?view=`, which prevents crawling but does not prevent indexing if these URLs are linked; confirm posture and decide whether a server-rendered `X-Robots-Tag`/`noindex` is warranted.

Separately, and independent of SEO — **three of these templates contain a Liquid syntax defect: an empty filter (`| |`)**:

- `templates/collection.all-collections-json.liquid:6`
- `templates/collection.manual-list.liquid:6`
- `templates/collection.manual-item.liquid:4`

All three are `... | remove: "All" | | remove: 'Manuals' ...`. This needs a live check of what those endpoints actually return today, because if they are erroring, the assembly-manuals experience is broken for customers and that outranks the SEO question.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (manuals pages, logged out)
- **Evidence required:** live response body and status for each of the 5 view URLs before and after; index status for samples
- **Rollback:** single-commit revert
- **Dependency:** TS-010. **Flag to Tim:** if the manuals views are erroring in production this stops being a Batch 1 SEO ticket and becomes a customer-facing defect to triage on its own

### TS-015 — `robots.txt.liquid` review *(P1 — three items need Tim's decision, not mine)*

`templates/robots.txt.liquid` is already extensive and mostly sound. Four things to put in front of Tim rather than change:

1. **Missing cohorts.** `perview`, `_pos`, `_sid`, `_ss` are absent (0 matches each). Add only per the TS-010 classification.
2. **`Google-Extended: Disallow: /`.** This blocks Google from using our content for Gemini and AI Overviews sourcing. That sits in direct tension with the parallel first-party SEO/GEO content sprint, whose whole point is being cited by AI search. The AI-search crawlers we do allow (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`) are a deliberate and sensible posture — `Google-Extended` looks like it may not have been considered in the same pass. **This is a business decision for Tim, not a technical fix.**
3. **`srsltid`.** Deliberately not blocked, which is correct — blocking it would damage Merchant Center performance. Confirm by sampled evidence that canonicals are absorbing the duplication instead. Coordinate with Kevin/Yusra.
4. **`AhrefsSiteAudit Crawl-delay: 10`** throttles our own site audits to the point that a full crawl of this catalogue takes a very long time. Minor, but it affects our ability to produce the evidence this sprint depends on.

- **Executor:** Izza · **Independent verifier:** Zafran · **Decision:** Tim (items 2 and 3) · **Dependency owner:** Kevin (Merchant Center), Yusra (verification)
- **Evidence required:** live `robots.txt` before/after; robots tester per affected cohort; Merchant Center impact statement from Kevin
- **Rollback:** single-commit revert of `robots.txt.liquid`; previous content captured verbatim in the PR
- **Dependency:** TS-010, and Kevin's Merchant Center sign-off before merge

---

## 7. Batch 2 — Structured-data truthfulness

*Covers Tim's scope item 2. Tim's control: "Do not deploy fabricated schema values."*

Every finding here is a fabricated, invalid or unverifiable value currently live in the theme's JSON-LD.

### TS-020 — Remove fabricated and default values from `snippets/schema-product.liquid` *(P0)*

Each of these emits an invented value when the underlying metafield is empty, so the markup asserts something we have not verified:

| Line | Field | Fabricated fallback |
|---|---|---|
| 32 | `audience` | `'Fitness enthusiasts and commercial gym users'` |
| 33 | `category` | `'Fitness Equipment'` |
| 34 | `description` | `'High-quality fitness equipment for home or commercial use.'` |
| 53 | `color` | `'Not specified'` — not a colour; invalid as a value |
| 54 | `countryOfAssembly` | `'US'` — **asserts country of origin we have not confirmed.** Highest-risk item in this table: an unverified origin claim is not only a schema problem |
| 55 | `countryOfLastProcessing` | `'US'` — same |
| 83 | `weight` | `'Not specified'` |
| 84 | `mpn` | falls back to `product.handle` — a URL handle is not a manufacturer part number |
| 232, 184 | `sku` | falls back to `product.handle` — same problem, and this one is feed-visible |
| 119, 192 | seller `description` | `'Premium fitness equipment at competitive prices.'` |
| 135, 208 | `telephone` | hardcoded `'925-215-2927'` |
| 142-146, 215-219 | seller address | hardcoded street/city/region/postal/country |
| 128-131, 201-204 | `sameAs` | hardcoded social URLs when the metafield is empty |

The correct pattern throughout: **omit the property when the source value is absent.** An absent property is honest; a defaulted one is not. `founder: "Timothy French"` and `foundingDate: "2010"` (lines 120-121, 193-194) are factually correct for Fitness Superstore, but they are hardcoded into product markup and repeated per variant — they belong in the Organization graph only (see TS-024).

- **Executor:** Izza · **Independent verifier:** Zafran · **Feed check:** Kevin + Yusra (`sku`, `mpn` are feed-visible)
- **Evidence required:** current-vs-proposed JSON-LD for at least 10 sampled products spanning new, remanufactured and As Is condition, single-variant and multi-variant; Rich Results Test and Schema Markup Validator before/after; Merchant Center diff statement from Kevin
- **Rollback:** single-commit revert; theme version pinned
- **Dependency:** **Kevin/Yusra sign-off required before merge** per Tim's feed-coordination control

### TS-021 — Rating source conflict: schema does not necessarily match visible content *(P0)*

Tim's instruction was to *make visible page content match schema.* Right now there are **two different review systems in play**:

- **Schema** reads `product.metafields.reviews.rating.value.rating` and `product.metafields.reviews.rating_count.value` — `schema-product.liquid:19-29`, `schema-collection.liquid:58-69`.
- **Visible stars on the PDP** come from Judge.me: `snippets/product-review-stars.liquid` renders `product.metafields.judgeme.badge`, surfaced through `snippets/product-availability-badge.liquid`.

Two independent sources for the same claim. Where they diverge, we are publishing an `aggregateRating` in markup that does not match the rating a customer can see on the page — which is precisely the mismatch Tim called out, and the structured-data policy issue that puts rich results at risk.

Also in the same block: `ratingCount` and `reviewCount` are both set to the same `rating_count` value. Those are different quantities — ratings without written reviews count toward the first, not the second.

Resolve to **one** source of truth, and require that the schema value can only be emitted when the same value is rendered visibly on the same page.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (visible-versus-markup comparison on live samples, logged out)
- **Evidence required:** side-by-side visible rating vs JSON-LD `aggregateRating` for ≥15 sampled PDPs, including products with zero reviews, ratings-without-reviews, and many reviews
- **Rollback:** single-commit revert
- **Dependency:** confirm with Larianne/Tim which review platform is the system of record

### TS-022 — `hasMeasurement` is an invalid `QuantitativeValue` *(P1)*

`schema-product.liquid:56-60` builds:

```
"hasMeasurement": { "@type": "QuantitativeValue",
  "value": "Dimensions: 84 inch length x 48 inch width x 90 inch height" }
```

`QuantitativeValue.value` expects a number, not prose — so this is invalid as written. Worse, when the `length_in` / `width_in` / `height_in` metafields are empty the concatenation still runs and emits `"Dimensions:  inch length x  inch width x  inch height"`. Replace with three properly typed `width` / `height` / `depth` `QuantitativeValue` objects with `unitCode`, emitted only when the metafields exist.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence required:** validator output before/after; sampled products with complete, partial and empty dimension metafields
- **Rollback:** single-commit revert · **Dependency:** TS-020 (same file)

### TS-023 — `itemCondition` can emit invalid values and can contradict the variant *(P0)*

`schema-product.liquid:85, 185` and `schema-collection.liquid:50` all use the same string-concatenation pattern:

```liquid
"https://schema.org/{% if ... contains 'as is' %}UsedCondition
{% elsif ... contains 'Remanufactured' %}RefurbishedCondition
{% else %}{{ product.metafields.custom.condition_state }}Condition{% endif %}"
```

Two defects:

1. **Any unanticipated `condition_state` value produces an invalid URL.** The `else` branch concatenates raw metafield text — a value like `Open Box` yields `https://schema.org/Open BoxCondition`, containing a space and matching no schema.org type. Only `NewCondition`, `RefurbishedCondition` and `UsedCondition` should ever be emitted; anything else must omit the property.
2. **`itemCondition` is emitted per-variant from a product-level metafield.** In the multi-variant branch (line 185) every `Offer` inherits the product's condition. For a product listed as new/remanufactured, `contains 'Remanufactured'` matches and **every variant is marked `RefurbishedCondition`, including the new ones.** That is a false per-offer claim, it is feed-visible, and condition mismatches cause Merchant Center disapprovals.

Map explicitly to our terminology: new → `NewCondition`, remanufactured → `RefurbishedCondition`, As Is → `UsedCondition`. Condition must be resolved at variant level where variants differ.

- **Executor:** Izza · **Independent verifier:** Zafran · **Feed dependency:** Kevin + Yusra
- **Evidence required:** enumeration of every distinct live `condition_state` value with resulting output before/after; validator results; Merchant Center condition-attribute diff from Kevin
- **Rollback:** single-commit revert · **Dependency:** **blocked on Kevin's Merchant Center impact statement**

### TS-024 — Oversized structured-data graphs *(P1)*

Tim's phrase was *"reduce oversized collection graphs."* Two distinct sources:

1. **`schema-collection.liquid:29-75`** embeds up to 24 complete `Product` objects per collection page — each with a 400-character description, image, SKU, brand, full `Offer` and `aggregateRating`. On a large collection this is a very large JSON-LD payload shipped on every request, and it duplicates data already canonical on each PDP.
2. **`schema-product.liquid:186-226`** repeats the **entire ~40-line `offeredBy` Organization block** — name, url, logo, description, founder, foundingDate, sameAs, contactPoint, full postal address, potentialAction — **once for every single variant.** A product with 40 variants emits that identical organisation payload 40 times.

Both should collapse to `@id` references pointing at the single `Organization` node already defined in `snippets/schema-organization.liquid` (`{{ shop.url }}/#organization`). This is also a Batch 3 win: it is bytes removed from every product and collection response.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence required:** JSON-LD byte size before/after on the 5 largest collections and the highest-variant-count products; validator parity; HTML response size delta
- **Rollback:** single-commit revert · **Dependency:** TS-020, TS-021 (same files)

### TS-025 — Fabricated video `uploadDate` *(P2)*

`schema-product.liquid:259` and `schema-collection.liquid:98` both fall back to a literal `'2026-01-01T00:00:00Z'` when no upload date exists. That is an invented date presented as fact. Omit `uploadDate` when unknown.

- **Executor:** Izza · **Verifier:** Zafran · **Evidence:** sampled video-bearing products/collections before/after · **Rollback:** revert · **Dependency:** TS-020

### TS-026 — `keywords` fallback splits the product title into single words *(P2)*

`schema-product.liquid:61-77`: with no `keywords` metafield and no tags, the final fallback splits `product.title` on spaces and emits every word as a keyword. That produces noise like `"French"`, `"Fitness"`, `"12"`, `"Set"`. Drop the property when there is no real keyword source.

- **Executor:** Izza · **Verifier:** Zafran · **Evidence:** sampled output before/after · **Rollback:** revert · **Dependency:** TS-020

### TS-027 — `BreadcrumbList` graph hygiene *(P2)*

`schema-product.liquid:303-306`: the `BreadcrumbList` sits inside the outer `@graph` but redeclares its own `"@context"`, and carries no `@id`. Remove the nested context, add an `@id`. Also worth reviewing while in this file: the breadcrumb builder's `default` branch (lines 341-344, 362-371) uses `product.collections.first`, which is non-deterministic — the same product can present different breadcrumb trails on different requests.

- **Executor:** Izza · **Verifier:** Zafran · **Evidence:** validator before/after; repeated requests on 5 products showing breadcrumb stability · **Rollback:** revert · **Dependency:** TS-020

---

## 8. Batch 3 — Mobile Core Web Vitals

*Covers Tim's scope item 4. All before/after evidence in this batch is invalid until TS-000 is resolved.*

### TS-030 — Unbounded Judge.me polling on every collection template *(P0 — this is the item Tim named)*

**Evidence:** `layout/theme.liquid:232-238`

```js
setInterval(function() {
  if (typeof jdgm !== 'undefined' && typeof jdgm.customizeBadges === 'function') {
    jdgm.customizeBadges();
  }
}, 1500);
```

There is **no `clearInterval`**. This fires every 1.5 seconds for the entire lifetime of the page on every collection template, and `jdgm.customizeBadges()` walks and restyles badge DOM on each pass. It is a permanent recurring main-thread task, which is a direct INP and TBT cost on exactly the mobile collection pages this sprint is about.

Replace with a bounded approach: run once when Judge.me signals ready, or poll with both an attempt ceiling and a `clearInterval` on success, or observe the badge container with a `MutationObserver` scoped to it.

A second defect in the same block (`theme.liquid:223-231`): the hidden div uses `data-id='{{ product.id }}'` and `{{ product.metafields.judgeme.badge }}`, but this is inside `{% if template contains 'collection' %}` where there is **no `product` in scope**. Both resolve empty, so the markup this block exists to provide is not being provided. `{{ jm_style }}` is likewise never assigned anywhere in the theme. Establish what this block was for before removing it — it may be load-bearing for badge initialisation in a way the empty values mask.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (mobile, logged out — badges must still render on collection pages)
- **Evidence required:** Performance-panel trace showing recurring task before/after; Lighthouse mobile TBT/INP before/after **collected with TS-000 resolved**; visual confirmation badges still display; field CWV monitored post-release
- **Rollback:** single-commit revert; theme version pinned
- **Dependency:** TS-000 for valid measurement; confirm Judge.me badge behaviour with whoever owns that app

### TS-031 — Two Convert installations in the same document *(P1 — BLOCKED, cross-thread dependency)*

`layout/theme.liquid` loads Convert **twice, from two different endpoints with two different identifiers**:

- Line 24, in `<head>`, `async`: `//cdn-4.convertexperiments.com/v1/js/10019770-100110328.js?environment=production`
- Lines 159-165, injected on first interaction or 1.5s after `load`: `https://cdn.9gtb.com/loader.js?g_cvt_id=96541d45-9050-46e9-90bb-874d67c6ed47`

This is the same live-installation question **Tim has already put to Convert** in the *"Introduction to Your Account Manager"* thread with Thomas and Gwen, where Tim wrote that the live Shopify main theme contains both and asked Convert to confirm before any experiment traffic is enabled.

**This ticket therefore does not proceed on my judgement.** It is blocked pending Convert's written answer on which installation is correct. I am not removing either script before then — a wrong guess either breaks experiment tracking or leaves duplicate experiment execution running. Both scripts are also in the block gated by TS-000, so the two tickets must be sequenced together.

- **Executor:** Izza · **Independent verifier:** Zafran · **Blocking dependency:** Convert (Thomas/Gwen), via Tim's existing thread
- **Evidence required:** Convert's written confirmation; network-panel evidence of both loaders firing today; before/after request count, transfer size and main-thread time; confirmation experiment tracking still functions
- **Rollback:** single-commit revert restoring both loaders verbatim
- **Status:** BLOCKED — do not start

### TS-032 — Third-party deferral strategy audit *(P1)*

The existing strategy (`theme.liquid:138-179`) defers Gorgias and Convert until first interaction or `load` + 1.5s, which is a reasonable pattern and the person who wrote it clearly knew what they were doing. What needs auditing is what it costs once it fires: a burst of third-party work landing exactly when a mobile user first scrolls or taps is an INP risk at the worst possible moment. Measure the interaction that triggers injection, and consider `requestIdleCallback` scheduling.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence required:** INP measurement on the triggering interaction before/after; field CWV; third-party transfer and main-thread cost table
- **Rollback:** revert · **Dependency:** TS-000, TS-031

### TS-033 — Render-path defects in `<head>` and body *(P2)*

Three concrete items:

1. **`snippets/head-meta.liquid` (final line): `<link href="https://fonts.shopifycdn.com" crossorigin>` has no `rel` attribute.** A `<link>` without `rel` does nothing — the intended `rel="preconnect"` is missing, so this optimisation has never taken effect.
2. **`layout/theme.liquid:85-101`** injects a `<style>` block inside `<main>`, mid-body, containing desktop sidebar layout rules. Mid-body style injection risks layout shift and is a CLS candidate on the templates it applies to.
3. **`layout/theme.liquid:5`: `<meta name="theme-color" content="">`** — empty value; either set it or drop it.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra
- **Evidence required:** CLS and LCP before/after on index, collection, PDP (mobile); connection-timing evidence for the preconnect fix
- **Rollback:** revert · **Dependency:** TS-000

### TS-034 — Wire Lighthouse CI per Tim's attached scope *(P1 — gated)*

Stand up Lighthouse CI against the scope document Tim attached, with mobile thresholds per template class and PR-level regression gating.

**Gated on TS-000.** Wiring CI against a page that hides its two heaviest third parties from Lighthouse would give us a green dashboard and no information. I also need to read the attached Lighthouse CI scope document before setting thresholds, so this ticket cannot be finalised until that reconciliation happens.

- **Executor:** Izza · **Independent verifier:** Zafran · **Reviewer:** Tim (thresholds)
- **Evidence required:** CI config; baseline runs post-TS-000; documented thresholds traceable to Tim's scope document
- **Rollback:** CI is non-production; disable the workflow
- **Dependency:** TS-000 (hard), plus the attachment reconciliation in §1

---

## 9. Batch 4 — Collection copy, internal links, visible author/source

*Covers Tim's scope item 5. Deliberately last, per Tim's "fix crawl and data truthfulness before adding more template complexity."*

### TS-040 — Safe collection copy *(P2)*

Collection description copy for priority collections. Two hard constraints: no claim that cannot be substantiated (consistent with the conservative-copy work already in this repo's history), and no claim that exists only in schema without appearing visibly on the page.

- **Executor:** Larianne (content owner), with Saliha · **Implementation:** Izza · **Independent verifier:** Iqra (live QA) · **Reviewer:** Zafran (schema/visible parity)
- **Evidence required:** copy deck with substantiation per claim; preview screenshots; visible-versus-schema parity check
- **Rollback:** revert · **Dependency:** Batch 2 complete (schema must be truthful before copy is aligned to it)

### TS-041 — Internal-link component *(P2)*

A bounded, server-rendered internal-linking component for priority collection and hub pages. Server-rendered is the requirement — links injected by JS do not reliably create discovery paths, which is the same principle as TS-012.

- **Executor:** Izza · **Independent verifier:** Zafran · **Content:** Larianne · **QA:** Iqra
- **Evidence required:** raw HTML (JS disabled) showing links present; crawl-depth before/after for target URLs
- **Rollback:** revert · **Dependency:** approved priority URL list. Once these exist, Jake's link-building lane can begin — separately, per Tim

### TS-042 — Visible author / source component *(P2)*

Visible author and source attribution on content pages, with any `author`/`publisher` schema emitted **only** where the same attribution is visible. Same principle as TS-021: markup may not assert what the page does not show.

- **Executor:** Izza · **Content:** Larianne · **Independent verifier:** Zafran · **QA:** Iqra
- **Evidence required:** visible-versus-markup parity on sampled pages; validator output
- **Rollback:** revert · **Dependency:** TS-021 resolved

---

## 10. Merge, release and rollback control

Per Tim's control that no change is authorised without a source register, current-versus-proposed diff, branch/PR, preview evidence, raw HTML/header checks, rollback, independent QA and his written GO:

1. **One ticket, one branch, one PR.** No multi-ticket PRs — a rollback must never be forced to revert an unrelated fix.
2. **No direct pushes to `main`.** All changes arrive by PR.
3. **Zafran's review is required** on every P0 and on every schema, canonical, robots or redirect change, without exception.
4. **Kevin's Merchant Center sign-off blocks merge** on TS-020, TS-023 and TS-015 item 3. Yusra performs the independent catalog read-back.
5. **Iqra's logged-out QA on preview** — mobile and desktop — before any GO is requested.
6. **Tim's written GO is the release gate,** requested only once every other box is ticked. Preview evidence is never treated as authorisation.
7. **Theme version pinned before each release,** recorded in the PR, so rollback is a known-good published version and not a reconstruction.
8. **Rollback is a single revert commit per ticket,** rehearsed on preview before release, not designed during an incident.
9. **Post-release**: Search Console URL Inspection on the sampled cohort, Rich Results Test on affected templates, and field CWV watched for 14 days on anything from Batch 3.

**Evidence pack required on every PR** — source register reference · current-versus-proposed diff · preview URL · raw HTML with JS disabled · `curl -I` response headers · validator output where schema is touched · sampled URL list with before/after · Lighthouse before/after where CWV is touched · rollback statement with pinned theme version · named independent verifier sign-off.

## 11. Open decisions for Tim

Six things I am not deciding on my own:

1. **TS-000 — the Lighthouse/PSI user-agent gate.** Remove it, or keep it and document why? Until this is settled, no CWV measurement in this sprint means anything. This is the one I most want an answer on.
2. **TS-012 — pagination posture.** `noindex,follow` on `page=` plus a canonical to page 1 is a contradiction, and it currently removes page 2+ as a route to deeper products. Keep, or change? It needs documented intent either way.
3. **TS-015 — `Google-Extended: Disallow: /`.** This blocks Google's AI Overviews and Gemini from using our content, while we deliberately allow the other AI-search crawlers. Intentional, or an oversight? It works against the GEO content sprint.
4. **TS-021 — review system of record.** Judge.me or the Shopify `reviews` metafields? Schema and visible stars currently read from different sources.
5. **TS-031 — Convert.** Blocked on Convert's answer in your thread with Thomas. Flagging that this technical batch is waiting on it.
6. **TS-014 — manuals view templates.** If the `| |` Liquid defect is causing live errors, this becomes a customer-facing defect rather than an SEO ticket, and I would want to treat it separately and sooner.

## 12. What I need before August 12

- The eight attachments from your original email, so I can reconcile ticket numbering and acceptance thresholds against the controlled acceptance criteria, schema specification, crawl/indexation workplan and shared backlog rather than running a parallel scheme.
- The August 5 Search Console coverage and performance exports, for TS-001 and the TS-010 cohort classification.
- Your answers on the six decisions in §11 — items 1 and 4 gate the largest batches.
- Confirmation of whether you want GitHub issues opened per ticket now, or after you have reviewed this plan.

---

*Prepared for the August 12 checkpoint. Plan only — no authorisation implied or taken.*
