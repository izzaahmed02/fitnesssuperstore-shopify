# 90-Day SEO/GEO Programme — Partial Measurement Baseline (technical measures)

**Program thread:** *"ACTION: 90-day SEO + AI search plan — owners, metrics and backlog"*
**Controlling instruction:** Tim's DECISION email of 2026-08-10 15:01 UTC, §2 (measurement).
**Prepared by:** Zafran — technical SEO co-lead
**Snapshot prepared:** 2026-08-16
**Status:** **PARTIAL.** Built from the frozen 2026-08-05 exports plus currently available
Shopify data, exactly as instructed. Blocked measures are recorded as BLOCKED / NOT
VERIFIED and are **not** estimated, silently backfilled, or closed from cohort totals.

## Scope

Tim assigned the consolidated baseline and 28-day scorecard, including release annotations,
to **Izza**. He assigned to **me**: GSC query/page clicks, CTR and position; indexation
cohorts; CWV; URL/canonical validation; and the citation-check methodology. This document
is my half, in the form Izza can drop into the single scorecard. It is not a second
scorecard.

Every figure carries its source and snapshot date. Where two snapshots of the same measure
exist, **both are preserved** — per Tim's 2026-08-14 instruction not to silently replace one
count with another.

## Baseline windows

| Window | Dates | Why |
|---|---|---|
| **28-day primary** | 2026-07-09 → 2026-08-05 | The 28 days ending on the frozen Search Console snapshot date, so the Shopify half and the GSC half describe the same period |
| **90-day context** | 2026-05-08 → 2026-08-05 | Matches the 90-day analytics window Tim used to build the plan |

Both windows are **pre-release**. As of 2026-08-16 there has been no approved SEO/GEO
production release, so nothing in this document is a post-release comparison.

---

## 1. Available now — Shopify organic orders and revenue

**Source:** Shopify Admin analytics (ShopifyQL), store `www.fitnesssuperstore.com`.
**Retrieved:** 2026-08-16. **Currency:** USD. **Connected: yes.**

### 1.1 Sessions by referrer source

| Referrer source | Sessions, 28d (2026-07-09 → 2026-08-05) | Sessions, 90d (2026-05-08 → 2026-08-05) |
|---|---:|---:|
| search | **52,204** | **174,402** |
| direct | 18,005 | 74,366 |
| social | 449 | 10,567 |
| unknown | 1,292 | 4,911 |
| email | 131 | 570 |
| paid | 57 | 188 |
| invalid | 2 | 3 |
| **Total** | **72,140** | **265,007** |

Query: `FROM sessions SHOW sessions GROUP BY referrer_source SINCE <start> UNTIL <end>`

### 1.2 Organic search sessions by engine — 28-day window

| Engine | Sessions |
|---|---:|
| google | 47,708 |
| bing | 2,050 |
| duckduckgo | 1,639 |
| yahoo! | 699 |
| ecosia | 54 |
| amazon | 23 |
| yandex | 14 |
| yahoo! images | 8 |

**Classification caveat, stated rather than corrected.** Shopify files **brave (507)** and
**kagi (10)** under `referrer_source = unknown`, not `search`. A strict
`referrer_source = 'search'` cut therefore understates search-engine referrals by roughly
517 sessions in this window. I have left the platform's classification intact and recorded
the gap; adjusting it silently would make the number unreconcilable against the Shopify UI.

### 1.3 Orders and revenue by referrer source

| Referrer source | Orders 28d | Total sales 28d | Orders 90d | Total sales 90d |
|---|---:|---:|---:|---:|
| search | **91** | **$150,334.25** | **333** | **$556,928.73** |
| *(unattributed / blank)* | 210 | $766,147.59 | 829 | $2,797,698.51 |
| indirect | 1 | −$1,835.78 | 6 | $11,469.45 |
| social | — | — | 3 | $1,077.00 |

28-day gross sales for the `search` source: **$166,305.75**; net sales **$136,729.51**.

**Reconciliation note, recorded not resolved.** Cutting the same 28-day window by
`order_referrer_name` gives google 87 orders / $139,956.47, bing 4 / $8,542.00, duckduckgo
1 / $0.00 — 92 orders and $148,498.47, against 91 orders and $150,334.25 on the by-source
cut. Shopify attributes the two dimensions slightly differently. Both cuts are recorded
as returned; neither has been adjusted to force agreement, and the by-source figure is the
one to track period-over-period.

Query: `FROM sales SHOW orders, gross_sales, net_sales, total_sales GROUP BY order_referrer_source SINCE <start> UNTIL <end>`

---

## 2. Available now — AI referrals (GEO)

**Source:** Shopify Admin analytics (ShopifyQL). **Retrieved:** 2026-08-16.

| Assistant | Sessions 28d | Sessions 90d | Orders 90d | Total sales 90d |
|---|---:|---:|---:|---:|
| chatgpt | 122 | 510 | 7 | $5,493.70 |
| perplexity | 15 | 42 | 1 | $400.00 |
| claude | 3 | 24 | 0 | — |
| copilot | 0 | 1 | 0 | — |
| **Total** | **140** | **577** | **8** | **$5,893.70** |

28-day orders: chatgpt 2 orders / $3,298.00; perplexity 1 order / $400.00.

AI referrals are **0.19%** of grouped sessions in the 28-day window (140 of 72,083 sessions
returned by the `referrer_name` grouping).

**Three things this measure does and does not say.**

- **No `gemini` row appears** in either window. `robots.txt` sets `Google-Extended:
  Disallow: /`, which governs Gemini and Vertex AI grounding — but a Gemini referral would
  not necessarily be labelled `gemini` by Shopify in the first place, so **absence here is
  not evidence about that directive**, and I am not offering it as such. Per Tim's `T-014`
  decision, no change this sprint.
- **This counts referred sessions, not citations.** An assistant can cite Fitness
  Superstore without the user ever clicking through. Referral volume is a floor on our AI
  visibility, never a measure of it. That is what §5 exists for.
- **Shopify's referrer classification is the source of record here**, with the same caveat
  as §1.2.

---

## 3. Available now — indexation cohorts (frozen 2026-08-05 snapshot)

**Source:** Coverage Inventory sheet, `FSS_SEO_GEO_Implementation_Backlog.xlsx`, issued by
Tim on 2026-08-05. **Snapshot date: 2026-08-05.** **Cohort totals only.**

| Reason | Pages | Share |
|---|---:|---:|
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

**Coverage baseline: 4,714 indexed against 51,611 not indexed.**

**These are the ceiling of what can be measured today, not a classification.** Tim's
standing instruction is that exclusion counts are not a directive to index or redirect
anything, and my own acceptance criteria state that cohort totals are **not sufficient** for
`T-001` — the per-URL rows are required. Movement in these totals must not be reported as
progress until the per-URL classification exists to explain it.

---

## 4. Available now — URL and canonical validation (live capture)

**Source:** my own logged-out raw-HTML capture against `https://www.fitnesssuperstore.com`.
**Snapshot date: 2026-08-16.** Full per-URL detail and reproduction commands are in
`docs/seo/seo-geo-opportunity-register-technical-input.md`.

| Measure | Value at baseline |
|---|---|
| Priority URLs returning `200` | 12 of 12 checked |
| Priority URLs carrying a self-referencing canonical | 12 of 12 |
| Priority URLs carrying `meta robots` noindex | 0 of 12 |
| Priority URLs present in the XML sitemaps | **10 of 12** — `/` and `/collections` are absent |
| Collections in `sitemap_collections_1.xml` | 663 |
| Pages in `sitemap_pages_1.xml` | 151 |
| Priority collection URLs with zero server-rendered product anchors | 3 of 3 checked |
| Indexable zero-inventory collection URLs found among the priority set | 2 (`/collections/gym-packages`, `/collections/starter-packages`) |
| Paginated collection URLs carrying `noindex` **and** a canonical to page 1 | confirmed live on `/collections/free-weights?page=2` |
| `/collections` server-side redirect | none — returns `200`, self-canonical |

The homepage is not listed in `sitemap_pages_1.xml`, `sitemap_collections_1.xml` or the
sitemap index. It is trivially discoverable, so this is recorded as a fact rather than
reported as a defect — but `T-001`'s acceptance criterion is that no indexable money page
is absent from its sitemap, so it needs a documented intent rather than being passed over.

This is the measure I will re-run unchanged after the first approved release, so the
before/after is like-for-like.

---

## 5. Citation-check methodology (defined; baseline run NOT yet executed)

Tim assigned me the **methodology**. It is defined below and ready to run. **No baseline
run has been executed, and no citation figure is being reported.** Recording a method as
though it were a result is exactly the kind of silent backfill Tim's email rules out.

**Prompt set.** Five prompts per priority intent — homepage/gym-equipment decision path,
free weights, StairMaster versus generic stair climber, remanufactured gym equipment, gym
packages — for 25 prompts total. Prompts are written as a buyer would ask them
(*"where can I buy remanufactured commercial stair climbers"*), not as brand lookups, and
the set is **frozen** at first run so later runs are comparable.

**Surfaces.** ChatGPT, Perplexity, Claude, Google AI Overviews, Microsoft Copilot. Each run
records the assistant, the model or product surface name, the date, and the locale.

**Run protocol.** Logged out, no personalisation, no memory, fresh session per prompt. Three
runs per prompt per surface; the raw response is stored verbatim as evidence, not
summarised.

**Scoring.** For each run: (a) is `fitnesssuperstore.com` cited with a resolvable URL —
yes/no; (b) if cited, which URL; (c) is the cited claim accurate against the live page —
yes/no/partial; (d) which competitors are cited alongside. The headline measure is
**citation rate = prompts citing us ÷ prompts run**, reported per intent and per surface,
never as a single blended number.

**Accuracy gate.** A citation that misstates condition, price, availability or warranty is
logged as a **defect**, not a win, and routed to Larianne for product-fact correction. AI
visibility that carries wrong facts is worse than none.

**Cadence.** Baseline once, then aligned to the 28-day scorecard.

**Dependencies.** None blocking — this can run without Search Console. It is not yet run
because the register and baseline were the gating deliverable for this thread.

---

## 6. Core Web Vitals — VALIDATING, not an approved baseline

**Status language is deliberate.** Per Tim's 2026-08-14 instruction, these are
**VALIDATING**; none is *fixed*, *verified* or predicted to pass. Per his 2026-08-14
clarification, **no CWV baseline may be approved** until the supported Convert target
architecture is confirmed on an unpublished theme.

### 6.1 Snapshot A — GSC overview, data through 2026-08-11

| Device | Measure | URLs |
|---|---|---:|
| Desktop | Poor — LCP over 4s | 496 |
| Desktop | Needs Improvement — LCP over 2.5s | 1,336 |
| Desktop | Needs Improvement — CLS over 0.1 | 303 |
| Mobile | Needs Improvement — LCP over 2.5s | 1,446 |
| Mobile | Needs Improvement — INP over 200ms | 384 |
| Mobile | Poor — CLS over 0.25 | 19 |

Mobile movement 2026-08-10 → 2026-08-11: Good 1,657 → 514; Needs Improvement 828 → 1,744;
Poor 20 → 19. Treated as a URL-group/threshold shift requiring representative group URLs
and controlled testing — **not** as proof of a one-day theme regression.

### 6.2 Snapshot B — GSC issue detail, 2026-08-14

| Measure | Pages |
|---|---:|
| Mobile LCP validation started, three groups at 2.5–2.6s | 1,195 |
| Mobile CLS validation started | 18 |
| Desktop LCP over 4s validation started | 412 |

PageSpeed desktop origin data still **fails** Core Web Vitals at LCP 3.4s. PageSpeed mobile
origin passes, but the queried example lacked sufficient URL-level samples and Search
Console evaluates grouped URLs — so no affected group may be described as fixed or as
likely to pass.

**Both snapshots are preserved.** 1,446 (2026-08-11 overview) and 1,195 (2026-08-14 issue
detail) are different measurements of a moving population, not a correction of one by the
other.

### 6.3 Controlled objective carried forward

Reduce the **309 mobile INP-affected** and **229 mobile LCP-affected** URLs from the
controlled acceptance criteria by **≥50%**, then continue until shared-template causes are
cleared.

**Open item that must be settled before any INP figure is certified.** Removing the
Lighthouse/PageSpeed user-agent gate (`T-017`) makes LCP and main-thread cost measurable on
a customer-equivalent load. It does **not** make INP measurable — INP needs real
interaction, and a default navigation run reports TBT as a proxy. The INP target therefore
needs either a user-flow/timespan run with a defined interaction script, or Search Console
field data over a fixed 28-day window, and the acceptance criteria should say which.
**I will not certify an INP baseline drawn from a navigation-mode run.**

Merchant Center store-quality ratings (desktop 3.47s/Low, mobile 2.21s/Great, 2026-08-13)
are kept as a **separate reporting view** and are not used to override GSC field data.

---

## 7. BLOCKED / NOT VERIFIED

Recorded per Tim's instruction: do not estimate, silently backfill, or close these from
cohort totals.

| Measure | Required source | Status | Gates |
|---|---|---|---|
| GSC clicks, CTR and average position by query and page | 2026-08-05 per-URL Performance rows + Search Console UI | **BLOCKED** | `T-001`; the impression/CTR opportunity sizing for the five intents |
| Per-URL indexation classification | 2026-08-05 per-URL Coverage rows | **BLOCKED** — cohort totals only (§3) | `T-001` |
| URL Inspection evidence for canonical/indexability decisions | Search Console UI access | **BLOCKED** | `T-001`, `T-015` |
| Bing crawl, AI performance and IndexNow baseline | Bing Webmaster Tools access | **BLOCKED** | `T-015`, `T-016` |
| Merchant Center feed/landing parity | Merchant Center access | **BLOCKED** | `T-016` (Kevin) |
| Crawler access review — challenge, 403, 429, rate-limit | 30-day WAF/CDN logs | **BLOCKED** | `T-014` |
| Approved CWV baseline | Convert target architecture confirmed on an unpublished theme; INP measurement method settled | **NOT VERIFIED — VALIDATING** | `T-017`, `T-018` |
| AI citation rate | Method defined (§5); baseline run not yet executed | **NOT RUN** | none blocking |

`T-001`, `T-014`, `T-015` and `T-016` remain **partially evidenced, not VERIFIED.**

---

## 8. 28-day post-release review anchor

Per Tim's instruction, the first post-release review is anchored to **28 days after the
first approved production release**, using the **actual** release date — not an assumed
calendar date.

| Field | Value |
|---|---|
| First approved SEO/GEO production release | **NOT YET OCCURRED** as of 2026-08-16 |
| Actual release date | *to be recorded when Tim's written GO is given and the release ships* |
| First post-release review date | *release date + 28 days — deliberately left unset* |
| Pre-release baseline this review compares against | §1–§4 and §6 of this document |

The technical SEO recovery workstream is at **VALIDATING / HOLD** as of Tim's 2026-08-14
control update, with PR #717 under REQUEST CHANGES. No release date can honestly be
predicted from that state, so none is written here.

---

## 9. Source register

| Source | Connected | Snapshot date | Used for |
|---|---|---|---|
| Shopify Admin analytics (ShopifyQL), `www.fitnesssuperstore.com` | Yes | 2026-08-16 | §1, §2 |
| Shopify Admin API — collections, pages, products, rules, tags | Yes | 2026-08-16 | §4, register doc |
| Live logged-out raw HTML, headers, `robots.txt`, XML sitemaps | Yes | 2026-08-16 | §4, register doc |
| Coverage Inventory sheet, `FSS_SEO_GEO_Implementation_Backlog.xlsx` | Yes (cohort totals only) | 2026-08-05 | §3 |
| GSC desktop/mobile CWV chart, metadata and issue exports | Via Tim's 2026-08-14 attachments | 2026-08-11 / 2026-08-13 | §6.1 |
| GSC CWV issue detail, validation states | Via Tim's 2026-08-14 control update | 2026-08-14 | §6.2 |
| Merchant Center store-quality screenshot | Via Tim's 2026-08-14 attachments | 2026-08-13 | §6.3, separate view only |
| 2026-08-05 per-URL Coverage and Performance rows | **No** | — | **BLOCKED** (§7) |
| Search Console UI | **No** | — | **BLOCKED** (§7) |
| Bing Webmaster Tools | **No** | — | **BLOCKED** (§7) |
| Merchant Center (account access) | **No** | — | **BLOCKED** (§7) |
| WAF/CDN logs, 30 days | **No** | — | **BLOCKED** (§7) |

---

*Partial baseline, as instructed. No live Shopify, GitHub, robots, WAF/CDN, feed, redirect,
schema or content change is authorised by this document, and none has been made.*
