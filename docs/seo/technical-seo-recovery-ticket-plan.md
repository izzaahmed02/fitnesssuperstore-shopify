# Technical SEO Recovery Sprint — Ticket / PR Plan

**Workstream:** Technical SEO recovery — crawl, schema and mobile CWV
**Source of authority:** Tim's emails of 2026-08-05 (scope) and 2026-08-06 (ownership), thread *"ACTION: Technical SEO recovery sprint — crawl, schema and mobile CWV"*
**Controlled inputs reconciled:** `03_Technical_SEO_Developer_Brief.docx` · `technical_acceptance_criteria.md` · `schema_remediation_spec.json` · `shopify_technical_seo_patch_examples.md` · `robots_waf_validation_checklist.txt` · `lighthouse_ci_scope.md` · `crawl_indexation_workplan.csv` · `FSS_SEO_GEO_Implementation_Backlog.xlsx`
**Prepared by:** Izza — Full-Stack Lead Developer, primary implementation lead
**Revision:** 2 — 2026-08-08. Revision 1 used a local `TS-xxx` scheme written before the attachments were available; **it is retired.** This revision adopts the controlled `T-001`–`T-016` IDs, target dates, intended-state taxonomy and Lighthouse budgets from the backlog and workplan.
**Checkpoint this satisfies:** August 12 ticket/PR plan checkpoint
**Status:** PLAN ONLY — awaiting Tim's written GO. No code, theme, robots, WAF/CDN, redirect, canonical, schema, feed or production change has been made.

---

## 1. Reconciliation summary

The controlled backlog is now the numbering authority. `T-001`–`T-016` are used exactly as issued. Where my repository review found something the controlled documents did not cover, it appears either as a **scope addition** to an existing ticket or as a **proposed new ticket `T-017`–`T-020`**, flagged as requiring Tim's approval to add to the controlled backlog rather than being silently renumbered.

The independent findings and the controlled specification agree on substance — omit unknown schema values, one `Organization` node by `@id`, `CollectionPage` + `ItemList` for collections, bounded Judge.me initialisation, condition mapped only to the three valid schema.org URLs. That agreement is worth stating plainly, because it means the disagreements below are the parts that need Tim's attention.

**Four things changed materially in this revision:**

1. **Three P0 tickets have an owner Tim has since removed.** The backlog assigns **Jake** to `T-001`, `T-002`, `T-004`, `T-005`, `T-011`, `T-014`, `T-015` — seven of sixteen. Tim's 2026-08-06 email states Jake is *not* an owner of this workstream and his lane is link building only. I have reassigned those to **Zafran** as technical SEO co-lead, per the later instruction. **The controlled backlog and brief still read the other way and need a revision note from Tim.**
2. **The existing CI constrains how two of the CWV fixes may be implemented.** `scripts/cwv_regression_test.py` pins specific strings and forbids specific refactor patterns. It does not block the fixes outright — details and the exact limits are in `T-019`.
3. **The Lighthouse CI scope cannot be satisfied as written** while the user-agent gate in `T-017` stands. The scope requires third-party main-thread time reported separately for *experimentation*; experimentation is Convert, and Convert is one of the two scripts hidden from Lighthouse.
4. **I inspected the four files the brief named that I had not opened** — `snippets/script-tags.liquid`, `sections/main-collection-intro.liquid`, `sections/main-article.liquid`, and the CWV workflow. All four findings in the brief are confirmed, with additions noted per ticket.

### Verification status of the findings in this plan

So that nobody has to guess how much weight a given line carries:

- **Confirmed by reading the current `main` branch** — every file and line citation in this document. These are statements about what the code does, and they can be checked directly.
- **Confirmed absent** — no `BlogPosting` or `Article` schema anywhere in the theme; no `Boost` or `bc-sf-filter` reference anywhere in the theme; `perview`, `_pos`, `_sid`, `_ss` and `srsltid` each appear zero times in `templates/robots.txt.liquid`.
- **Not yet verified — requires live checking, and flagged as such at each point:** whether the `?view=` manuals endpoints are currently erroring (`T-020`); the distinct live `condition_state` values and whether any combine conditions (`T-006b`); whether collection descriptions contain markup at the word-43 boundary (`T-010`); the current per-article byline state (`T-012`); the live values of the `product_canonical_url` override metafield (`T-008`).
- **Inference, stated as such:** that "experimentation" in the Lighthouse budget table means Convert.

I have not treated any code-path finding as a confirmed live defect without saying which of these categories it falls in.

### Adopted from the controlled documents

- **Intended-state taxonomy:** `INDEX` · `301` · `410` · `NOINDEX_FOLLOW` · `BLOCK_CRAWL` · `HOLD_REVIEW`
- **Target dates** (backlog serials resolved): `T-001`, `T-002`, `T-014` → **Aug 12** · `T-003`–`T-008`, `T-016` → **Aug 19** · `T-009`, `T-010` → **Aug 26** · `T-011`, `T-012`, `T-013` → **Sep 2** · `T-015` → **Sep 4**
- **Primary CWV objective:** reduce the **309 mobile INP-affected** and **229 mobile LCP-affected** URLs by **≥50%**, then continue until shared-template causes are cleared
- **Lighthouse budgets:** performance score no PR regression >5 points · LCP no regression >10%, milestone ≤2.5s · CLS ≤0.10 · TBT proxy no regression >10% · JS transfer and request count no template-level increase without documented approval · third-party main-thread time reported separately for Judge.me, heatmap, search, analytics, reviews and experimentation
- **Lighthouse harness:** mobile 390×844 throttled mid-tier, desktop 1440×900, minimum three runs per URL, median
- **Article byline:** default `Fitness Superstore`; `Tim French` only with explicit asset-level approval
- **Coverage baseline:** 4,714 indexed against 51,611 not indexed

### Coverage cohorts (from the Coverage Inventory sheet)

| Reason | Pages | Share |
|---|---|---|
| Blocked by robots.txt | 21,046 | 40.8% |
| Crawled — currently not indexed | 12,194 | 23.6% |
| Not found (404) | 7,973 | 15.5% |
| Page with redirect | 5,483 | 10.6% |
| Excluded by noindex tag | 3,478 | 6.7% |
| Alternate page with proper canonical | 980 | 1.9% |
| Duplicate without user-selected canonical | 245 | 0.5% |
| Google chose different canonical | 142 | 0.3% |
| Server error (5xx) | 22 | — |
| Redirect error | 4 | — |
| Blocked due to unauthorized request (401) | 1 | — |

## 2. Ownership model

Per Tim's 2026-08-06 email, which supersedes the owner table in the brief and backlog.

| Role | Person | Scope |
|---|---|---|
| Primary implementation lead | **Izza** | Execution, Shopify/GitHub coordination, ticket & PR assignment, preview/release planning, merge and rollback control |
| Technical SEO co-lead | **Zafran** | Crawl/indexation classification, URL architecture, redirects/canonicals, schema, CWV, technical acceptance criteria, independent validation. **Assumes the URL-intent and validation-cohort scope the backlog had assigned to Jake** |
| Programme tracking | **Control Tower** | Owners, deadlines, blockers, evidence links, completion |
| Live-page QA | **Iqra** | Logged-out desktop and mobile QA on preview and post-release |
| Catalog / variant verification | **Yusra** | Independent read-back on catalog-facing changes |
| Feed / Merchant Center | **Kevin** + **Yusra** | `T-016`, and gating merge on `T-006`, `T-008`, `T-014` |
| Theme / feed execution support | **Waqas** | Per Izza assignment (named in the brief's owner table) |
| Content owner | **Larianne**, with **Saliha** | `T-010`, `T-012` content and fact sourcing |
| Release authority | **Tim** | Written GO per batch, and crawler policy |
| Not an owner here | **Jake** | Link building only, separately, after approved priority URLs and assets exist |

## 3. Repository scope

- **`izzaahmed02/fitnesssuperstore-shopify`** — the entire technical SEO surface. All tickets land here.
- **`izzaahmed02/fs-bundle-api`** — extension-only Shopify app (Rust cart-transform function for bundles). Renders no crawlable HTML and emits no structured data, so **no tickets.** One verification dependency only: if bundle pricing behaviour changes, the `Offer` price in `snippets/schema-product.liquid` must stay truthful against what the customer is charged. Relevant to `T-006` and `T-016`.

## 4. Batch sequencing

Tim's decision was *fix truthfulness and crawl architecture before adding more template complexity.* The controlled release sequence is preserved. Two insertions:

```
Batch A  T-017, T-019, T-001         Measurement integrity + CI constraint map + URL inventory
Batch B  T-002, T-014, T-004, T-003, T-005    Crawl / indexability / legacy / robots+WAF
Batch C  T-006, T-008, T-007, T-016  Schema truthfulness + server-rendered controls + feeds
Batch D  T-009, T-018, T-013         Mobile CWV + Lighthouse CI
Batch E  T-010, T-011, T-012, T-015  Copy, internal links, article credibility, Bing/AI
         T-020                        Triaged separately — customer-facing, not SEO
```

`T-017` sits ahead of the CWV batch because without it that batch cannot be measured honestly. `T-019` sits there because it determines which implementation shapes are available, which is cheaper to know before writing the fix than after. Everything else keeps its controlled order and target date.

---

## 5. P0 — Crawl and indexability

### T-001 — Export and classify every discovered URL · Aug 12

Assign one intended state per URL from the controlled taxonomy. Export must carry final status, canonical, robots rule, meta robots, sitemap inclusion, internal-link count, template, page type, revenue/traffic tier and intended state. No blanket parameter rule without sampled evidence. No indexable money page left blocked, noindexed, canonicalised elsewhere, absent from its sitemap or orphaned.

- **Executor:** Zafran *(reassigned from Jake)* · **Independent verifier:** Izza · **Approval of URL intent:** Tim
- **Evidence:** GSC export · crawl · sitemap · Shopify · internal-link export · ≥10 sampled URLs per cohort with raw status, canonical and robots
- **Rollback:** n/a — no production change · **Blocks:** T-002 through T-008

### T-002 — Map legacy `.asp` / `.htm` / BigCommerce routes · Aug 12

The backlog supplies a live example: `https://fitnesssuperstore.com/remanufacturing-a/283.htm` — note the apex host, not `www`. **The theme contains no `.asp`/`.htm` route handling,** so this is Shopify admin URL redirects or CDN, not a theme PR. One-to-one map with a named target per URL; no relevant equivalent means `410`, not the homepage. Zero chains, zero loops.

- **Executor:** Izza (Shopify admin) · **Independent verifier:** Zafran *(reassigned from Jake)* · **QA:** Iqra
- **Evidence:** full map CSV · `curl -I` per sample showing single-hop `301` to a `200` · chain-depth report · apex-versus-`www` behaviour confirmed
- **Rollback:** redirects removable individually; map retained · **Dependency:** T-001

### T-003 — Prioritise 7,973 reported 404s by value · Aug 19

Rank by links, traffic and revenue history. Top-impact resolved; intentional `404`/`410` preserved as `410`. No redirect chains introduced.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence:** GSC Coverage · ranked list with the value signal per URL · post-change `curl -I` samples showing single-hop resolution
- **Rollback:** redirects removable individually; the ranked list and prior state retained in the PR so any single decision can be reversed without touching the others
- **Dependency:** T-001, T-002 · **Dependency owner:** Zafran (URL intent), Kevin if any resolved URL is a feed landing page

### T-004 — Classify 21,046 robots-blocked URLs by intent · Aug 19

The largest cohort at 40.8%. The question is whether these are deliberate traps or indexable pages blocked before Google can see a canonical or noindex.

**Scope addition — three uncontrolled parameter cohorts.** `templates/robots.txt.liquid` covers `sort_by`, `view`, `sections`, `section_id`, `oseid`, `preview_theme_id`, `ProductCode` and the `+`/`%2B` variants. It does **not** cover:

- **`perview`** — a custom param written by `sections/product-index-grid.liquid:9`. Zero matches in the robots template.
- **`_pos` / `_sid` / `_ss`** — Shopify internal search referral params. Zero matches.

Both generate crawlable duplicate cohorts today. Also confirm by sampled evidence that **`srsltid`** duplication is absorbed by canonicals — it is correctly *not* blocked, since blocking it would damage Merchant Center, so canonical is the only control and needs proving.

- **Executor:** Zafran *(reassigned from Jake)* · **Independent verifier:** Izza · **Dependency owner:** Kevin (`srsltid` / Merchant Center)
- **Evidence:** GSC Coverage · robots template diff · sampled URLs per parameter with raw canonical and index status
- **Rollback:** single-commit revert of `robots.txt.liquid`, previous content captured verbatim in the PR · **Dependency:** T-001

### T-005 — Sample 12,194 crawled-not-indexed URLs by template and root cause · Aug 19

23.6% of the cohort. Classify by duplicate / thin / stale / weakly linked / rendering-dependent / low-value.

**Rendering-dependent is the one to test hardest.** `assets/facets-product-index.js` builds collection grids client-side from a `localStorage` cache with a 24-hour TTL, and `sections/product-index-grid.liquid` re-navigates via `window.location.replace`. If product discovery on those templates depends on JavaScript, that is a plausible root cause for a large share of this cohort and it connects directly to the orphan baseline in `T-011`.

- **Executor:** Zafran *(reassigned from Jake)* · **Content:** Larianne · **Implementation:** Izza · **Independent verifier:** Izza
- **Evidence:** GSC Coverage · cohort sample by template · **raw HTML with JavaScript disabled** for collection templates, showing which product links exist server-side · **Dependency:** T-001

---

## 6. P0 — Structured data and server-rendered controls

### T-006 — Remove fabricated fallbacks and invalid values · Aug 19

Files: `snippets/schema-product.liquid`, `snippets/schema-collection.liquid`, `snippets/schema-ld-json.liquid`. Every item below is live today, cited to line.

**6a — Fabricated defaults in `schema-product.liquid`.** Each emits an invented value when the source metafield is empty:

| Line | Field | Fallback |
|---|---|---|
| 32 | `audience` | `'Fitness enthusiasts and commercial gym users'` |
| 33 | `category` | `'Fitness Equipment'` |
| 34 | `description` | `'High-quality fitness equipment for home or commercial use.'` |
| 53 | `color` | `'Not specified'` — explicitly prohibited by the spec |
| 54 | `countryOfAssembly` | `'US'` — **prohibited "United States default"** |
| 55 | `countryOfLastProcessing` | `'US'` — same |
| 83 | `weight` | `'Not specified'` |
| 84, 232 | `mpn`, `sku` | fall back to `product.handle`; `sku` also travels in the product feed, so Kevin should assess this one |
| 119, 192 | seller `description` | `'Premium fitness equipment at competitive prices.'` |
| 135, 208 | `telephone` | hardcoded `'925-215-2927'` |
| 142-146, 215-219 | seller address | hardcoded street/city/region/postal/country |
| 128-131, 201-204 | `sameAs` | hardcoded social URLs |
| 259 | video `uploadDate` | hardcoded `'2026-01-01T00:00:00Z'` — a fabricated date |

Same pattern at `schema-collection.liquid:98` (`uploadDate`) and `:155` (`telephone`). Correct treatment throughout: **omit the property.** `founder: "Timothy French"` and `foundingDate: "2010"` (lines 120-121, 193-194) are factually correct for Fitness Superstore but belong in the Organization node only, not repeated inside every offer.

**6b — `itemCondition` can emit invalid values and can contradict the variant.** `schema-product.liquid:85, 185` and `schema-collection.liquid:50` share this pattern:

```liquid
{% else %}{{ product.metafields.custom.condition_state }}Condition{% endif %}
```

- Any unanticipated `condition_state` concatenates raw text into the URL. `Open Box` yields `https://schema.org/Open BoxCondition` — contains a space, matches no type. The spec's `prohibited_fallbacks` names "arbitrary condition URL" exactly.
- **More consequential:** condition is emitted **per-variant from a product-level metafield.** In the multi-variant branch every `Offer` inherits the product's value, so **any product whose `condition_state` contains the string `Remanufactured` marks every variant `RefurbishedCondition`, new variants included.**

  **Two things to separate here.** The code behaviour is certain — it follows directly from `schema-product.liquid:185`. Whether products are actually configured this way live is **not yet verified**: it requires a `condition_state` value that combines conditions (for example a combined new/remanufactured value) on a product that also has genuinely new variants. Enumerating the distinct live `condition_state` values is the first task in this ticket, and if no product is configured that way then this reduces to the invalid-URL issue above. I would rather state that plainly than present a code path as a confirmed live defect.

  On the feed side, `itemCondition` is markup rather than a feed field, so the risk is a **mismatch between the PDP markup and the condition attribute the feed sends** — which is Kevin's call to assess, not mine to assert. Map only to `NewCondition` / `RefurbishedCondition` / `UsedCondition` per the spec, resolved at variant level where variants differ.

**6c — Review data has two independent sources.** Schema reads `product.metafields.reviews.rating` (`schema-product.liquid:19-29`, `schema-collection.liquid:58-69`). Visible PDP stars come from Judge.me — `snippets/product-review-stars.liquid` renders `product.metafields.judgeme.badge`, surfaced via `snippets/product-availability-badge.liquid`. Where the two diverge we publish an `aggregateRating` the customer cannot see, which fails the spec's first global rule. Also `ratingCount` and `reviewCount` are both set to the same value; those are different quantities. **Needs a decision on the system of record.**

**6d — Oversized graphs.** `schema-collection.liquid:29-75` emits up to 24 complete `Product` objects per page, each with a 400-character description, image, SKU, brand, full `Offer` and `aggregateRating`. `schema-product.liquid:186-226` repeats the **entire ~40-line `offeredBy` Organization block once per variant** — 40 variants means 40 copies. Both collapse to `@id` references against the single node already defined in `snippets/schema-organization.liquid` (`{{ shop.url }}/#organization`). Per the spec, collection becomes `CollectionPage` + `ItemList` + `BreadcrumbList` linking canonical products by URL, name and position.

**6e — `hasMeasurement` is an invalid `QuantitativeValue`.** `schema-product.liquid:56-60` sets `value` to prose (`"Dimensions: 84 inch length x …"`), where a number is expected — the spec's "guessed measurement" prohibition and the acceptance criterion on supported property/value/unit fields. When the dimension metafields are empty the concatenation still runs and emits `"Dimensions:  inch length x  inch width x  inch height"`. Replace with typed `width`/`height`/`depth` and `unitCode`, emitted only when present.

**6f — `keywords` fallback.** `schema-product.liquid:61-77`: with no keywords metafield and no tags, it splits `product.title` on spaces and emits each word — `"French"`, `"12"`, `"Set"`. Omit the property.

**6g — Breadcrumb hygiene.** `schema-product.liquid:303-306`: the `BreadcrumbList` sits inside `@graph` but redeclares `"@context"` and carries no `@id`. Separately, the `default` branch (lines 341-344, 362-371) uses `product.collections.first`, which is non-deterministic — the same product can present different breadcrumb trails across requests.

- **Executor:** Izza · **Independent verifier:** Zafran · **Feed gate:** Kevin + Yusra — **blocks merge**
- **Evidence:** current-vs-proposed JSON-LD across the spec's full QA matrix — new French Fitness simple, new multi-variant, remanufactured, combined-listing parent and child, out-of-stock, Tier-1 collection, article with FAQ, static authority page · Rich Results Test and Schema Markup Validator saved per template · visible-versus-markup comparison · Merchant Center attribute diff from Kevin
- **Rollback:** single-commit revert; theme version pinned · **Dependency:** T-016 sign-off before merge

### T-007 — Replace the JavaScript `/collections` redirect · Aug 19

Confirmed at **`snippets/script-tags.liquid:1-5`**:

```js
if (window.location.pathname === '/collections' || window.location.pathname === '/collections/') {
  window.location.replace('/collections/all' + window.location.search + window.location.hash);
}
```

Highest effort-adjusted score in the backlog (10). Configure a permanent platform redirect, verify by raw header, **then** remove the script. Expected: `GET /collections → 301` or `308 → /collections/all` or the approved destination.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra
- **Evidence:** `curl -I /collections` and `/collections/` before and after · confirmation the script is gone from rendered HTML · no chain introduced
- **Rollback:** platform redirect removed and script restored in one revert · **Dependency:** T-001 destination approved

### T-008 — Move approved index controls into initial HTML · Aug 19

Three defects in `snippets/head-meta.liquid`:

1. **Client-side `noindex` injection.** The `{% if template contains 'product' %}` block builds `<meta name="robots" content="noindex,follow">` in JavaScript and appends it to `document.head` when the URL contains `variant=`. Not in initial HTML; depends on the crawler rendering. The patch examples are explicit: **do not apply a blanket `variant=` noindex until combined listings, canonical variants, Merchant Center landing URLs and internal links are sampled.** The server-rendered canonical already in this file is the correct control.
2. **`noindex` combined with a cross-URL `canonical`.** Paginated collection URLs get `noindex,follow` from the `page=` check, while the canonical for the same URL resolves to page 1 via `{{ collection.url | prepend: base_url }}`. These are contradictory instructions about the same URL — one says do not index this, the other says the real version is elsewhere — and Google's guidance is not to combine them.

To be precise about the discovery consequence, since it is easy to overstate: `noindex,follow` **does** preserve link following, so page 2+ links are not cut off today. The risk is second-order — Google has indicated that long-term `noindex` pages tend to get crawled less over time, and a page carrying both signals is a candidate for reduced crawling, which would weaken discovery of products only reachable deep in pagination. That is a reason to resolve the contradiction, not a claim that discovery is currently broken. Worth measuring against `T-005` and `T-011` rather than assuming either way. **Needs one documented position and Tim's GO.**
3. **`history.replaceState` stripping `option_values`** — browser-only; a crawler never sees it.

**Also in this file:** the canonical override reads `product.metafields.custom.product_canonical_url` with no validation, so a mis-set free-text metafield can deindex a product. Audit current values as part of `T-001`.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (logged out, mobile + desktop) · **Feed gate:** Kevin (Merchant Center landing URLs)
- **Evidence:** raw HTML with JavaScript disabled, before and after, per URL class · `curl -I` headers · GSC URL Inspection on samples · combined-listing behaviour unchanged
- **Rollback:** single-commit revert; theme version pinned · **Dependency:** T-001 classification signed off; T-016

### T-016 — Review URL and schema effects on feeds · Aug 19

Joint highest effort-adjusted score (12.5). Gates merge on `T-006`, `T-008` and the `srsltid` element of `T-004`. Highest-risk inputs are the per-variant `itemCondition` contradiction in `T-006b` and the `sku`/`mpn` handle fallbacks in `T-006a`.

- **Executor:** Kevin · **Independent verifier:** Yusra · **Coordination:** Izza
- **Evidence:** Merchant Center attribute diff before and after · landing-page match confirmation · no feed/landing mismatch post-release
- **Rollback:** feed-side revert independent of the theme PR

---

## 7. P1 — AI crawler and discovery validation

### T-014 — Verify public robots and WAF/CDN · Aug 12

Joint highest effort-adjusted score (12.5), **and due at this checkpoint.** Executed against `robots_waf_validation_checklist.txt`. Note the checklist's own framing: the repository template already carries the search/retrieval allowances and training blocks, so **the task is validating public output and WAF/CDN behaviour, not adding directives.**

Checklist items, unchanged: save the raw public `robots.txt`; confirm Shopify-generated disallows survive; confirm the approved `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User` and `PerplexityBot` groups are visible publicly; confirm Googlebot and Bingbot can fetch homepage, Tier-1 collection, PDP, article and authority page; confirm `Sitemap` resolves `200`; test approved bots by **verified IP/DNS methodology, not user-agent spoofing**; review 30 days of WAF/CDN logs for challenge, 403, 429, bot-fight, rate-limit and JS-challenge events; confirm search/retrieval crawlers are not grouped with blocked training crawlers.

**Scope addition — one policy item worth a conscious decision.** `templates/robots.txt.liquid` sets `User-agent: Google-Extended` → `Disallow: /`, while we deliberately allow every other AI-search crawler.

**Correcting my own earlier framing on this:** `Google-Extended` governs whether content may be used by Gemini and Vertex AI generative features. Per Google's own documentation it does **not** affect inclusion or ranking in Google Search, and AI Overviews are served as part of Search via Googlebot rather than gated by `Google-Extended`. So the directive does **not** remove us from AI Overviews, and I should not have implied otherwise. The checklist's policy-split rule says exactly this — do not treat `GPTBot`/`ClaudeBot`/`Google-Extended` policy as equivalent to `OAI-SearchBot`/`Claude-SearchBot`/Googlebot/Bingbot search visibility — so the controlled document already had it right.

What remains is narrower and still worth deciding: the setting blocks Gemini grounding specifically, which is an asymmetry against the other AI-search crawlers we allow, and the GEO Scorecard tracks AI referral growth without a Gemini line. If it is a deliberate training-policy choice, no change is needed. **Tim's decision; flagged, not proposed.**

Minor: `AhrefsSiteAudit` carries `Crawl-delay: 10`, which throttles our own audits enough to slow the evidence gathering this sprint depends on.

- **Executor:** Izza · **Independent verifier:** Zafran *(reassigned from Jake)* · **Policy decision:** Tim
- **Evidence:** before/after raw robots files · theme diff and rollback · WAF/CDN rule diff and rollback · public URL tests after publish · GSC/Bing inspection · verified-bot fetch logs · AI referral monitoring updated
- **Rollback:** revert `robots.txt.liquid`; WAF/CDN rules reverted separately
- **Access limitation:** WAF/CDN logs, GSC UI and Bing Webmaster Tools are recorded as **not connected** in the Source Log. Until access exists this ticket cannot fully close, and I will not report it green on partial evidence.

### T-015 — Bing AI Performance and IndexNow review · Sep 4

Baseline documented; **no auto-submit until approved.** Blocked on Bing Webmaster Tools access.

- **Executor:** Izza · **Independent verifier:** Zafran *(reassigned from Jake)*
- **Evidence:** Bing Webmaster Tools baseline captured before any change · documented IndexNow proposal with no submissions made · confirmation that auto-submit remains off
- **Rollback:** no production change in this ticket; if IndexNow is later enabled it is disabled by revoking the key
- **Dependency:** T-014 · **Dependency owner:** Tim (approval before any submission), plus Bing Webmaster Tools access

---

## 8. Mobile Core Web Vitals

**Objective:** reduce the 309 INP-affected and 229 LCP-affected mobile URLs by ≥50%, then continue until shared-template causes are cleared. Before/after evidence in this batch is not trustworthy until `T-017` is resolved; `T-019` determines which implementation routes are available but does not gate merge on its own.

### T-009 — Bound Judge.me polling and profile third parties · Aug 26

**9a — The unbounded interval.** `layout/theme.liquid:232-238`:

```js
setInterval(function() {
  if (typeof jdgm !== 'undefined' && typeof jdgm.customizeBadges === 'function') {
    jdgm.customizeBadges();
  }
}, 1500);
```

No `clearInterval`. Fires every 1.5s for the page's entire lifetime on every collection template, and `customizeBadges()` walks and restyles badge DOM each pass — a permanent recurring main-thread task, directly on the mobile collection pages this sprint targets. Replace per the patch examples: attempt ceiling plus `clearInterval` on success, or an app event, or a `MutationObserver` that disconnects. Acceptance is that **no perpetual timer remains once the page is idle.**

**9b — A second defect in the same block.** `theme.liquid:223-231` uses `data-id='{{ product.id }}'` and `{{ product.metafields.judgeme.badge }}` inside `{% if template contains 'collection' %}`, where **there is no `product` in scope.** Both resolve empty. `{{ jm_style }}` is never assigned anywhere in the theme. Establish what this block was for before removing it — it may be load-bearing for badge initialisation in a way the empty values mask.

**9c — Scope addition: the heatmap is global and unconditional.** The brief flags "global heatmap/third-party impact." Confirmed — `snippets/script-tags.liquid` ends with the Heatmap.com snippet (`dashboard.heatmap.com`, `sid=2798`), loaded on **every template with no interaction gate and no template scoping**, unlike Square (product only) and Google Maps (about/warehouse only). The inline snippet also registers global `error` and `unhandledrejection` listeners that push to an unbounded `hErrorLogs` array. Note it is **not** behind the `T-017` user-agent gate, so it does appear in Lighthouse.

**Also global on every page:** `jquery.min.js` and `slick.min.js` (`script-tags.liquid:6, 17`) — both count against the JS transfer and request-count budgets.

**9c's implementation route is constrained by `T-019`** — wrapping the heatmap in a Liquid template conditional passes the existing CI; a deferred-init refactor does not, and would need the test updated in the same PR. Decide the route before writing it.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (mobile, logged out — badges must still render)
- **Evidence:** Performance-panel trace showing the recurring task gone · Lighthouse mobile TBT/INP before and after **collected after T-017** · per-template third-party main-thread table for Judge.me, heatmap, search, analytics, reviews, experimentation · badges visually confirmed · field CWV watched 14 days
- **Rollback:** single-commit revert; theme version pinned · **Dependency:** T-017 (for valid measurement), T-019 (for implementation route) · **Dependency owner:** whoever owns the Judge.me app configuration, for 9b

### T-013 — Add browser-based preview regression tests · Sep 2

Stand up Lighthouse CI against `lighthouse_ci_scope.md` — the eight representative URLs, both device profiles, three runs median, budgets and artifacts as adopted in §1. Static theme-string tests are retained as unit checks and **not** treated as CWV evidence. Lighthouse CI does not replace Theme Check, schema validation, raw HTML/header checks, functional QA, analytics receipt proof or post-merge smoke tests.

**Two blockers to state.** First, `T-017`: budgets set against a page that hides Gorgias and Convert from Lighthouse would produce a green dashboard and no information. Second, the scope requires third-party main-thread time reported separately for **experimentation** — that is Convert, which is one of the two scripts the gate hides, so **this line of the budget table cannot be produced at all until `T-017` is resolved.**

**One scope correction.** Representative URL 2 is described as "Tier-1 collection with Boost product grid and Judge.me." I found **no Boost or `bc-sf-filter` reference anywhere in the theme.** The collection stack is the custom `assets/facets-product-index.js` and `sections/product-index-grid.liquid`, and the CI test asserts the removal of Globo filter remnants. Either Boost is an app-embed injection outside theme code or the scope description is stale. The "search" line in the third-party budget table should name whatever is actually in the request waterfall — worth confirming before thresholds are set.

- **Executor:** Izza · **Independent verifier:** Zafran · **Thresholds:** Tim
- **Evidence:** CI config · baseline runs collected after T-017 · JSON/HTML report per URL/device · PR summary table against main · scripts added/removed · filmstrips for failures · CI link in PR
- **Rollback:** CI is non-production; disable the workflow · **Dependency:** T-017 (hard), T-019

---

## 9. P1 — Content, links and credibility

### T-010 — Stop arbitrary HTML word splitting · Aug 26

Confirmed at **`sections/main-collection-intro.liquid:34-36`**:

```liquid
{% assign words = section_description | strip | split: ' ' %}
{% assign visible_words = words | slice: 0, 43 %}
{% assign hidden_words = words | slice: 43, words.size %}
```

Splitting arbitrary HTML on spaces at word 43 can cut a tag in half and emit broken markup. Replace with separate `intro_html` / `buying_guide_html` metafields per the patch examples, or render the full description in one safe location if separate fields are not approved. Migration must preserve current content and final URLs.

**Verify alongside:** the remainder goes into `data-description-hidden`, revealed by JavaScript (lines 89, 134). The acceptance criteria require that no hidden accordion creates duplicate headings, broken HTML, **or content inaccessible without JavaScript** — so confirm the hidden portion is present and reachable in raw HTML with JS disabled.

Also per the acceptance criteria: one `H1` per Tier-1 collection, a concise above-fold decision section, a below-grid buying section, related guides, and hero-product links only after live verification.

- **Executor:** Izza · **Content owner:** Larianne, with Saliha · **Independent verifier:** Iqra (live QA) · **Schema/visible parity:** Zafran
- **Evidence:** rendered HTML before/after on collections whose descriptions contain markup · raw HTML with JS disabled · copy deck with substantiation per claim · preview screenshots
- **Rollback:** single-commit revert · **Dependency:** T-006 (schema truthful before copy aligns to it)

### T-011 — Refresh orphan and depth audit after the final URL map · Sep 2

Historical baseline from PR #639: **1,058 orphaned pages, 1,094 pages deeper than 3 clicks, 459 with a single internal link.** The PR was closed unmerged. The brief is explicit: refresh after the final URL map, **do not execute from the stale list.** Internal links must use final canonical URLs and ship in the same controlled release as the redirect/canonical changes.

- **Executor:** Izza · **Independent verifier:** Zafran *(reassigned from Jake)* · **Content:** Larianne · **QA:** Iqra
- **Evidence:** refreshed crawl against the T-001 map · raw HTML with JS disabled showing links server-side · crawl-depth before/after for Tier-1 hubs and hero French Fitness PDPs
- **Rollback:** revert · **Dependency:** T-001, T-002, T-007, T-008 complete. Once approved priority URLs exist, Jake's link-building lane can begin separately

### T-012 — Visible article author, dates and source block · Sep 2

`sections/main-article.liquid:80-85` renders `article.published_at` and `article.author`, the latter gated behind `block.settings.blog_show_author`. Two gaps against the spec:

1. **`article.author` renders the article's author field from Shopify admin**, which normally defaults to the staff account that created the post and is editable there. So it can surface a personal byline that has not been approved for the asset — though note the whole block is gated behind `block.settings.blog_show_author`, so depending on the setting no byline may render at all today. The current live state per article needs checking rather than assuming. The spec requires the default to be the `Fitness Superstore` Organization, with `Tim French` only on explicit asset-level approval. Note the related hardcoding of `founder: "Timothy French"` in product schema, addressed in `T-006a`.
2. **No visible `dateModified`** — only `published_at`. The spec requires visible publish *and* modified dates, plus a reviewer/methodology block.

**Scope addition: there is no article schema at all.** `snippets/schema-ld-json.liquid` renders only `schema-video` for the `article` case — no `BlogPosting` or `Article` node exists. So this is not "align schema to visible content," it is **build the schema and the visible block together**, with `headline`, `description`, `author`, `datePublished`, `dateModified`, `mainEntityOfPage` and `image` all matching what renders. The acceptance criterion that no article schema is duplicated by both theme and pasted JSON-LD still needs checking against live articles, since pasted blocks would not appear in the repository.

- **Executor:** Izza · **Content:** Larianne · **Independent verifier:** Zafran · **QA:** Iqra · **Byline approval:** Tim
- **Evidence:** visible-versus-markup parity on sampled articles · validator output · confirmation no duplicate article JSON-LD on live pages
- **Rollback:** revert · **Dependency:** T-006c (review/author source policy)

---

## 10. Proposed new tickets — require Tim's approval to add to the controlled backlog

### T-017 — Lighthouse / PSI user-agent gate suppresses vendor scripts *(P0 — proposed; blocks T-009 and T-013)*

**Not present in any of the eight controlled documents.** `layout/theme.liquid:139-143`:

```js
var ua = navigator.userAgent || "";
if (ua.includes("Chrome-Lighthouse") || ua.includes("Page Speed Insights")) {
  return;
}
```

This guards the block that injects the Gorgias widget (`:151-157`) and the Convert bundle loader (`:159-165`). When the visitor identifies as Lighthouse or PageSpeed Insights, **both are skipped entirely.** Every other visitor receives them — on first interaction, or roughly 1.5s after `load`, whichever comes first.

Why it matters more now than when I first raised it: the acceptance criteria set a **numeric ≥50% reduction target on 309 INP-affected and 229 LCP-affected URLs**, and the Lighthouse CI scope sets **budgets enforced per PR** — including a line requiring third-party main-thread time for *experimentation*, which is Convert. All of that would be measured on a page that hides its two heaviest third parties from the measurement tool. Field data in Search Console comes from real Chrome users who do receive both scripts, so lab and field will diverge, and field is what the Core Web Vitals assessment uses. Serving materially different resources to a measurement user-agent than to users is also a pattern search engines treat as cloaking; I am not asserting a penalty exists, only that the risk should be a deliberate decision rather than an inherited one.

The brief criticises the CWV workflow for being static string checks and the patch examples say not to treat those as CWV evidence — both correct, but neither notices that the browser-based replacement will also be misled.

**Recommendation:** remove the gate, then reduce third-party cost genuinely through `T-009` and `T-018` so the real numbers move. If it is kept, Lighthouse CI must run with an overridden user-agent, and the reason for the gate must be documented.

**Decision needed from Tim.** Not touched — whoever added it may have had a reason worth hearing first.

- **Executor:** Izza · **Independent verifier:** Zafran
- **Evidence:** `curl` with default and Lighthouse user-agents showing the served difference · Lighthouse with and without UA override · field-versus-lab gap for the same templates
- **Rollback:** single-commit revert · **Dependency:** shares the code block with T-018

### T-018 — Two Convert installations live in the same document *(P1 — proposed; BLOCKED)*

`layout/theme.liquid` loads Convert **twice, from two endpoints with two identifiers**:

- `:24`, in `<head>`, `async` — `//cdn-4.convertexperiments.com/v1/js/10019770-100110328.js?environment=production`
- `:159-165`, injected on first interaction or `load` + 1.5s — `https://cdn.9gtb.com/loader.js?g_cvt_id=96541d45-9050-46e9-90bb-874d67c6ed47`

This is the same live-installation question **Tim has already put to Convert** in the *"Introduction to Your Account Manager"* thread with Thomas and Gwen, where he asked for confirmation before any experiment traffic is enabled.

**Blocked pending Convert's written answer.** I am not removing either script on my own judgement — guessing wrong either breaks experiment tracking or leaves duplicate experiment execution running. Shares the `T-017` code block, so the two must be sequenced together.

- **Executor:** Izza · **Independent verifier:** Zafran · **Blocking dependency:** Convert (Thomas/Gwen), via Tim's thread
- **Evidence:** Convert's written confirmation · network evidence of both loaders firing today · request count, transfer size and main-thread delta · experiment tracking confirmed intact
- **Rollback:** revert restoring both loaders verbatim · **Status: BLOCKED — do not start**

### T-019 — Map the existing CI assertions against the planned CWV changes *(P1 — proposed; sequencing input, not a blocker)*

`.github/workflows/cwv-regression.yml` runs `scripts/cwv_regression_test.py` **on every push to every branch and on every PR.** The script is static substring assertions over theme files, written to lock in earlier performance wins. It constrains *how* some of this sprint's CWV work can be implemented. Stated precisely, because the distinction matters:

**What it does not block.** Removing the `T-017` user-agent gate on its own leaves every required string in that block intact — `var injected = false;`, the `injectNonCriticalVendors` listener registration, the `load` handler, `waitForGorgiasLoaded`, `clearTimeout` — so **a `T-017` edit alone passes CI unchanged.** The `T-009a` Judge.me change also passes: the test asserts nothing about the `setInterval`.

**What it does constrain.**

1. **`forbid(theme, "requestIdleCallback(injectNonCriticalVendors")`** — prohibits that exact call form, so scheduling vendor injection via `requestIdleCallback` under the current function name would fail. A different structure or name would pass, which is worth knowing before choosing an approach for `T-032`-style scheduling work.
2. **`require(script_tags, 'preprocessor.min.js?sid=')`** and **`require(script_tags, "['error', 'unhandledrejection'].forEach(function (ty) {")`** — both strings must remain present in `script-tags.liquid`. **Scoping the heatmap by wrapping it in a Liquid template conditional keeps both strings and therefore passes.** Removing or rewriting the snippet fails.
3. **`forbid(script_tags, "function initHeatmap()")`** — a deferred-init refactor using that function name fails, so if `T-009c` goes the deferred route the test needs updating in the same PR.

So the accurate position is: **`T-009c` has one implementation path that passes CI today (template scoping) and one that does not (deferred init).** Choosing knowingly is the point of this ticket, rather than discovering it from a red build.

Also worth recording: the test asserts nothing about the Judge.me `setInterval` and nothing about the user-agent gate, so the two largest CWV findings in this plan are invisible to it. That is a gap in coverage, not a fault — it predates both findings.

- **Executor:** Izza · **Independent verifier:** Zafran · **Review:** Tim, if any assertion changes (a CI assertion is a controlled expectation)
- **Evidence:** the current test mapped assertion-by-assertion against each planned change · for any changed assertion, a stated rationale · green run on the preview branch
- **Rollback:** revert the test alongside the theme change
- **Dependency:** none. **Informs:** T-009c, T-013, T-017

### T-020 — Liquid syntax defect in three manuals templates *(customer-facing — triage separately)*

Three templates contain an empty Liquid filter (a stray double pipe):

- `templates/collection.all-collections-json.liquid:6`
- `templates/collection.manual-list.liquid:6`
- `templates/collection.manual-item.liquid:4`

All three read `... | remove: "All" | | remove: 'Manuals' ...`. These are `{% layout none %}` templates serving the assembly-manuals experience via `?view=`. **If they are erroring in production this is a customer-facing defect, not an SEO ticket,** and it should be triaged on its own rather than waiting for this sprint. Needs a live check of what those endpoints return today.

- **Executor:** Izza · **Independent verifier:** Zafran · **QA:** Iqra (manuals pages, logged out)
- **Evidence:** live response body and status for all five `?view=` URLs · **Dependency:** none — should not wait on T-001

**Aside for Zafran, not a ticket:** `snippets/script-tags.liquid:69` carries a hardcoded Google Maps browser API key. Client-side Maps keys are necessarily public, so this is not an exposure in itself, but it should be confirmed as HTTP-referrer-restricted in Google Cloud console. Hygiene, not a finding.

---

## 11. Merge, release and rollback control

1. **One ticket, one branch, one PR.** No multi-ticket PRs — a rollback must never force reverting an unrelated fix. Matches the brief's "one bounded batch, not a sitewide mixed release."
2. **No direct pushes to `main`.**
3. **Zafran's review is required** on every P0 and on every schema, canonical, robots or redirect change.
4. **Kevin's Merchant Center sign-off blocks merge** on `T-006`, `T-008` and the `srsltid` element of `T-004`; Yusra performs the independent catalog read-back. `T-016` is the gate.
5. **Iqra's logged-out preview QA**, mobile and desktop, before any GO is requested.
6. **Tim's written GO is the release gate.** Preview evidence is never authorisation.
7. **Theme version pinned before each release**, recorded in the PR, so rollback is a known-good published version.
8. **Rollback is one revert commit per ticket**, rehearsed on preview before release.
9. **Gates stay separate:** Theme Check, static/unit checks, raw HTML/header checks, schema validation, Lighthouse CI, functional QA, analytics receipt proof, post-merge production smoke test.
10. **Post-release:** GSC URL Inspection on the sampled cohort, Rich Results Test on affected templates, crawl comparison against the baseline export, field CWV watched 14 days for anything in the CWV batch, and measurement dashboards annotated.
11. **Do not reopen closed technical work** or add senior reconciliation unless a material risk or failed gate appears.

**Evidence pack on every PR** — source register reference · current-versus-proposed diff · preview URL · raw HTML with JS disabled · `curl -I` headers · validator output where schema is touched · sampled URL list before/after · Lighthouse before/after where CWV is touched · rollback statement with pinned theme version · named executor and independent verifier sign-off.

## 12. Open decisions for Tim

1. **`T-017` — the Lighthouse/PSI user-agent gate.** Remove, or keep and document why? Until this is settled the ≥50% INP/LCP target and the Lighthouse CI budgets cannot be measured honestly. **Highest priority.**
2. **Jake's assignments.** Seven controlled backlog tickets name Jake as owner or co-owner, which your 2026-08-06 email supersedes. I have reassigned them to Zafran. **The brief and backlog need a revision note** so Control Tower is not tracking against a superseded owner table.
3. **`T-008` — pagination posture.** `noindex,follow` plus a canonical to page 1 sends contradictory instructions about the same URL. Link following is preserved today, so this is about resolving a conflicting signal pair rather than an active discovery outage. Keep or change, with documented intent either way?
4. **`T-014` — `Google-Extended: Disallow: /`.** Intentional training-policy choice, or an oversight? It blocks Gemini grounding specifically; it does **not** affect Google Search or AI Overviews, contrary to what I first suggested.
5. **`T-006c` — review system of record.** Judge.me, or the Shopify `reviews` metafields? Schema and visible stars read from different sources today.
6. **`T-019` — CI assertion changes.** Confirm you want changes to `cwv_regression_test.py` surfaced for your review rather than treated as incidental test maintenance.
7. **`T-020`** — if the manuals views are erroring live, may I pull that out of this sprint and treat it as a customer-facing defect now?
8. **`T-018`** — flagging that this batch is waiting on Convert's answer in your thread with Thomas.

## 13. Access and evidence gaps

Recorded as **not connected** in the Source Log, and each blocks a specific acceptance criterion:

| Not connected | Blocks |
|---|---|
| WAF/CDN logs | `T-014` — 30-day challenge/403/429/rate-limit review |
| Search Console UI | `T-001`, `T-003`–`T-005`, `T-008` — live URL Inspection and validation |
| Merchant Center | `T-016`, and the feed gates on `T-006`, `T-008` |
| Bing Webmaster Tools | `T-014`, `T-015` — AI Performance baseline and IndexNow |
| Server logs | `T-002` — legacy route behaviour and crawl confirmation |

I will not report a ticket green on partial evidence where its acceptance criterion requires one of these. `T-014` is due August 12 and cannot fully close without WAF/CDN log access — please confirm who can grant it.

**Also needed:** the August 5 GSC Coverage and Performance exports referenced in the backlog as `/mnt/data/fitnesssuperstore.com-Coverage-2026-08-05.xlsx` and `-Performance-on-Search-2026-08-05.xlsx`. I have the cohort totals from the Coverage Inventory sheet but not the per-URL rows, and `T-001` needs the rows.

---

*Prepared for the August 12 checkpoint. Plan only — no authorisation implied or taken.*
