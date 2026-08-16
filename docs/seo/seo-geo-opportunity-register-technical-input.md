# 90-Day SEO/GEO Opportunity Register — Technical Input (Zafran)

**Program thread:** *"ACTION: 90-day SEO + AI search plan — owners, metrics and backlog"*
**Controlling instruction:** Tim's DECISION email of 2026-08-10 15:01 UTC, §1 (canonical opportunity register), §2 (measurement) and §3 (first register state).
**Prepared by:** Zafran — technical SEO co-lead
**Date prepared:** 2026-08-16
**Status:** Technical input. **Nothing here authorises a production change.**

## What this document is, and is not

Tim's 2026-08-10 email makes **Izza accountable for the one consolidated SEO/GEO
opportunity register**, built on the attached implementation workbook, with **one live
working copy and link, not another tracker.** This document is **not** that register and
is **not** a second tracker. It is the technical half that Tim assigned to me — final URL
and search-intent classification, canonical/redirect/indexability decisions, technical
acceptance criteria and the independent technical gate — written so Izza can lift the rows
straight into the single register without re-deriving any of it.

Where a decision is not mine to take (merchandising, content copy, feed, release), the row
says whose it is and stops there.

**Ownership override note** (Tim 2026-08-06, confirmed 2026-08-08): already issued once, in
§2 of *Technical SEO Recovery Sprint — Release-Gate Acceptance Criteria & Ownership
Override Note* (2026-08-08). It governs this program workbook too. It is **not** restated
as a new note here, per Tim's instruction that there be one override in one place.

## Evidence status convention

Every line below is tagged:

- **LIVE-VERIFIED** — captured by me from the live site or the Shopify Admin API on the
  date shown, and reproducible from the command recorded in §5.
- **CODE-CONFIRMED** — verified by reading the current `main` branch.
- **BLOCKED** — required source unavailable; recorded, not estimated.

No cohort total, count or status below is inferred from another number.

---

## 1. First register state — the five priority intents

Columns are exactly the ones Tim specified: current URL, proposed action, owner,
dependency, evidence, approval state, next gate. Intended states use the controlled
taxonomy only: `INDEX` · `301` · `410` · `NOINDEX_FOLLOW` · `BLOCK_CRAWL` · `HOLD_REVIEW`.

All live captures in this section are dated **2026-08-16** and were taken logged-out
against `https://www.fitnesssuperstore.com`, reading **raw HTML** — not rendered DOM.

### 1.1 Homepage / gym-equipment decision path

| Field | Entry |
|---|---|
| **Current URLs** | `/` · `/collections/all` · `/collections` |
| **Live state** | `/` → `200`, canonical `https://www.fitnesssuperstore.com`, no `meta robots`, title *Fitness Superstore \| Gym Equipment For Sale - Home & Commercial*, 14 server-rendered product anchors. `/collections/all` → `200`, self-canonical, title *All Gym Equipment*, 3,696 products, present in `sitemap_collections_1.xml`. `/collections` → **`200`, self-canonical, title *Collections*** — the server does **not** redirect it (LIVE-VERIFIED) |
| **Proposed action** | `/` → `INDEX`, canonical for the brand + head "gym equipment" intent. `/collections/all` → `INDEX`, canonical for catalogue browse. `/collections` → `301` to the approved destination under `T-007`; it is currently a third indexable URL for the same browse intent |
| **Owner** | Zafran (classification and canonical decision) · Izza (execution) · Tim (destination approval) |
| **Dependency** | `T-001` (URL inventory), `T-007` (server-rendered `/collections` redirect). The `/collections` → `/collections/all` redirect is **JavaScript-only** at `snippets/script-tags.liquid:1-5` (CODE-CONFIRMED), which the live `200` confirms end-to-end |
| **Sitemap** | `/collections/all` is in `sitemap_collections_1.xml`. **Neither `/` nor `/collections` appears in any sitemap file** — recorded as a fact needing a documented intent under `T-001`, not asserted as a defect (LIVE-VERIFIED) |
| **Evidence** | §5 command block, rows 1–3 · raw-HTML canonical/robots/title capture 2026-08-16 · sitemap membership check |
| **Approval state** | Classification **proposed**, not approved. No production change prepared |
| **Next gate** | Tim approves the `/collections` destination → Izza prepares the platform redirect → my gate requires `curl -I` before/after showing a single-hop `301`/`308` to a `200`, and confirmation the JavaScript redirect is gone from rendered HTML |

### 1.2 Free weights

| Field | Entry |
|---|---|
| **Current URL** | `/collections/free-weights` |
| **Live state** | `200`, self-canonical, **no `meta robots`**, title *Free Weights*, 585 products (Admin API), in `sitemap_collections_1.xml` (LIVE-VERIFIED 2026-08-16) |
| **Finding A — discovery** | The raw HTML contains **zero** `<a href="/products/…">` anchors for grid products. Product URLs are present only inside a JSON-LD `ItemList` (24 `ListItem` entries) and embedded JSON payloads; the grid itself is built client-side by `assets/facets-product-index.js`. A crawlable `<a href="/collections/free-weights?page=2">` anchor **does** exist, so the paginated URL is reachable — the products on it are not (LIVE-VERIFIED) |
| **Finding B — pagination** | `/collections/free-weights?page=2` returns `200` with **`<meta name="robots" content="noindex,follow">` *and* a canonical to page 1**. That is the exact contradiction Tim ruled against in the `T-008` decision of 2026-08-08, still live (LIVE-VERIFIED) |
| **Proposed action** | `INDEX`. Apply the decided `T-008` posture: remove the `page=` `noindex`, self-referencing canonical on `?page=n`, bare canonical on page 1. **Do not** record pagination as a discovery fix — Finding A is the binding constraint, and self-canonicalising a page whose products no crawlable link reaches converts one contradiction into another |
| **Owner** | Zafran (posture and acceptance) · Izza (implementation) · Larianne (title/meta copy — the current title carries no qualifier and no brand) |
| **Dependency** | `T-001` classification · `T-005` (rendering-dependent root cause) · `T-008` |
| **Evidence** | §5 rows 4, 11 · anchor and JSON-LD counts · `?page=2` header and raw-HTML capture |
| **Approval state** | `T-008` posture **decided by Tim 2026-08-08**; implementation **not** prepared, not merged |
| **Next gate** | Raw HTML with JavaScript disabled, before and after, proving paginated URLs are anchor-reachable *and* that deep products are discoverable through at least one crawlable path. Independent QA by Iqra logged-out, desktop and mobile |

### 1.3 StairMaster versus generic stair-climber intent separation

Four live URLs currently serve this one intent family. All four return `200`,
self-canonical, no `meta robots`, and all four are in the collections sitemap
(LIVE-VERIFIED 2026-08-16).

| URL | Products | Title as served |
|---|---|---|
| `/collections/stair-climbers-steppers` | 123 | *Stair Climbers / Steppers (Remanufactured)* |
| `/collections/stairmaster` | 46 | *Stairmaster Exercise Equipment (Remanufactured)* |
| `/collections/stairmaster-new` | 14 | *StairMaster New Stair Climbers and Steppers \| Fitness Superstore* |
| `/collections/stairmaster-remanufactured` | 32 | *StairMaster Remanufactured Stair Climbers and Steppers \| Fitness Superstore* |

**Two findings, both proven rather than asserted.**

1. **`/collections/stairmaster` is the exact set union of its two children.** Handle sets
   pulled from `/collections/{handle}/products.json?limit=250` on 2026-08-16 and compared:
   `stairmaster-new` (14) ∪ `stairmaster-remanufactured` (32) is **identical** to
   `stairmaster` (46) — zero difference in either direction. Three indexable URLs, one
   product set (LIVE-VERIFIED).
2. **Two titles claim a condition the inventory does not match.**
   `/collections/stair-climbers-steppers` holds 123 products, of which **41 handles end
   `-new`** and 82 end `-remanufactured`, yet the title and meta description say
   *(Remanufactured)*. `/collections/stairmaster` holds 46, of which **14 are new**, and
   carries the same claim (LIVE-VERIFIED). Under the company terminology standard the
   correct framing is **new / remanufactured**, and a page that lists both should say so.

Overlap between the generic and brand collections: **40 of the 46** StairMaster products
also appear in `/collections/stair-climbers-steppers`.

| Field | Entry |
|---|---|
| **Proposed action** | Generic intent → `/collections/stair-climbers-steppers` `INDEX`, canonical for *stair climber / stepper*. Brand intent → `/collections/stairmaster` `INDEX`, canonical for *StairMaster*. Condition-qualified children → `INDEX` **only if** their titles, meta and on-page copy differentiate the condition intent; otherwise they are wholly duplicated by the parent and the pair should be `HOLD_REVIEW` pending that copy. **Recommended, not decided:** keep all four, differentiate the copy, since new-versus-remanufactured is a genuine buying decision and the child titles already read correctly |
| **Owner** | Zafran (URL/intent classification and canonical decision) · Larianne (the *(Remanufactured)* title claims are product-fact copy and hers to correct) · Izza (execution) |
| **Dependency** | `T-001` · `T-016` if any of these are Merchant Center landing URLs (Kevin) |
| **Evidence** | §5 rows 5–8, 12–14 · set-comparison output · condition split by handle suffix · sitemap membership |
| **Approval state** | **Proposed.** No canonical, title or collection-rule change prepared |
| **Next gate** | Larianne confirms the corrected titles; Kevin confirms no feed landing-URL impact; then one bounded current-versus-proposed diff through my gate. Title changes on four indexable commercial URLs are a release, not an edit |

### 1.4 Remanufactured gym equipment

| Field | Entry |
|---|---|
| **Current URL** | `/pages/remanufactured-gym-equipment` |
| **Live state** | `200`, self-canonical, no `meta robots`, title *Remanufactured Gym Equipment \| Restored Commercial Machines*, published 2024-08-02, template suffix `remanufactured`, in `sitemap_pages_1.xml` (LIVE-VERIFIED 2026-08-16) |
| **Context** | The commercial inventory for this intent sits in condition-qualified collections — `/collections/cybex`, `/collections/matrix`, `/collections/precor`, `/collections/true-fitness`, `/collections/precor-treadmills`, `/collections/life-fitness-ellipticals`, `/collections/technogym-treadmills`, `/collections/treadclimbers`, `/collections/bowflex-treadclimbers`, `/collections/stairmaster-remanufactured` — all of which already carry *Remanufactured* in their titles |
| **Proposed action** | `INDEX`. The page is the **informational/authority canonical** for "what remanufactured means, how we do it"; the collections stay the **commercial canonicals**. One canonical URL per intent is preserved by keeping those two intents apart, not by merging them |
| **Owner** | Zafran (classification) · Larianne (remanufacturing/QC content and product-fact verification — this page is the natural anchor for the first-party knowledge layer Tim named as the #1 GEO move) · Izza (internal-link execution) |
| **Dependency** | `T-001` · content lane for the first-party copy |
| **Evidence** | §5 row 9 · pages-sitemap membership · collection title survey via Admin API |
| **Approval state** | **Proposed.** No copy or internal-link change prepared |
| **Next gate** | Larianne's content package; then an internal-link map showing the page links down to the commercial collections and they link back, without the page competing for the collections' commercial queries |

### 1.5 Gym packages

| Field | Entry |
|---|---|
| **Current URLs** | `/pages/gym-packages` · `/collections/gym-packages` · `/collections/starter-packages` |
| **Live state** | `/pages/gym-packages` → `200`, self-canonical, title *Gym Packages \| Fitness Superstore*, published 2025-06-11, template `gym-packages`, **10 server-rendered product anchors**, in the pages sitemap. `/collections/gym-packages` → `200`, self-canonical, title *Gym Packages*, **0 products**, **no SEO title and no SEO description**, in the collections sitemap. `/collections/starter-packages` → `200`, self-canonical, title *Starter Packages*, **0 products**, in the collections sitemap (LIVE-VERIFIED 2026-08-16) |
| **Root cause of the empty collection** | `/collections/gym-packages` is a smart collection whose rules are `TAG = "Gym Packages"` **AND** `TYPE = "Product Index"`. The ten package products are typed `Product Index` but tagged **`gym-package`** — singular and hyphenated. The rule and the data do not meet, which is why the collection is empty while the page lists all ten. Nine of the ten also carry a `hidden` tag; `1-500-sq-ft-gym-set-b` does not (LIVE-VERIFIED, Admin API) |
| **Proposed action** | `/pages/gym-packages` → `INDEX`, canonical for the intent. `/collections/gym-packages` and `/collections/starter-packages` → **`HOLD_REVIEW`**, because the right answer depends on a merchandising decision that is not mine: if the collections are meant to be populated, the fix is the tag/rule mismatch and they then need distinct intent from the page; if they are not, they are zero-inventory duplicate-title URLs currently submitted for indexing and should become `301` to `/pages/gym-packages` or `410`. **No blanket rule applied in the meantime** |
| **Owner** | Zafran (classification) · Izza + merchandising (whether the collections are meant to be populated, and whether `hidden` is intended given the page links to them) · Larianne (product-fact copy) |
| **Dependency** | `T-001` · `T-003` if either collection resolves to `410` |
| **Evidence** | §5 rows 10, 15–16 · Admin API rule and tag capture · sitemap membership |
| **Approval state** | **Proposed / HOLD_REVIEW.** No change prepared |
| **Next gate** | Merchandising answer on intent, then one bounded decision per URL with documented intent recorded **before** the change, per my gate criteria |

---

## 2. Cross-cutting technical findings from this pass

Recorded here because they touch all five intents, and to keep them out of the register as
separate rows.

1. **Collection product grids are not server-rendered.** Zero `<a href="/products/…">`
   anchors in the raw HTML of `/collections/free-weights`,
   `/collections/stair-climbers-steppers` and `/collections/stairmaster`. This is the
   *rendering-dependent* root cause hypothesis in `T-005`, now **confirmed on the priority
   URLs themselves** rather than inferred from the theme. It bounds what any title, meta
   or pagination fix can achieve on these pages, and it should be stated plainly in the
   register rather than discovered later.
2. **`/collections` is a live indexable duplicate hub.** Self-canonical `200`, in nobody's
   plan as an intended landing page, and only redirected by JavaScript. `T-007` already
   owns the fix.
3. **Two zero-inventory collections are in the sitemap.** `/collections/gym-packages` and
   `/collections/starter-packages`. Sitemap inclusion is a positive indexing signal for
   pages with nothing on them.
4. **AI-discovery surface is platform-generated.** `sitemap.xml` includes
   `sitemap_agentic_discovery.xml`, which lists exactly one URL: `/agents.md`. That file is
   Shopify's platform-generated UCP/agent description — store endpoints, commerce protocol,
   policy links. It contains **no first-party Fitness Superstore knowledge content**. Since
   Tim's #1 GEO move is a citation-ready first-party knowledge layer, the current
   agent-facing surface is worth recording as a baseline fact: it describes how to transact
   with the store, not why to buy from us (LIVE-VERIFIED 2026-08-16).
5. **Live robots.txt matches the controlled expectation.** Search/retrieval crawlers
   `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot` have
   their own groups; `GPTBot`, `ClaudeBot`, `CCBot`, `GrokBot` and `Google-Extended` are
   the blocked training/grounding groups; Googlebot and Bingbot run under `User-agent: *`.
   Per Tim's `T-014` decision, **no change this sprint** — this is confirmation, not a
   proposal (LIVE-VERIFIED 2026-08-16).

---

## 3. Technical acceptance criteria for these five intents

The general release-gate criteria are already issued and unchanged — *Technical SEO Recovery
Sprint — Release-Gate Acceptance Criteria & Ownership Override Note*, 2026-08-08, §3 and §4.
Every PR touching a priority URL carries all seven items in that §3: source register,
bounded current-versus-proposed diff, preview URL with raw HTML and response-header capture,
sampled URL evidence with the sampling method stated, documented intent written **before**
the change, tested rollback, and independent QA by a named verifier who is not the executor.

Added here, specific to these five intents:

1. **One canonical URL per intent, stated before the change.** Any PR touching these URLs
   names which intent each URL owns and which URL owns any intent it gives up. A canonical
   or redirect change with no named intent is returned, not conditionally passed.
2. **Title and meta claims must match live inventory.** No page may assert a condition —
   *new*, *remanufactured*, *As Is* — that its own product set contradicts. Verified by
   counting the live collection membership at PR time, not by reading the title.
3. **Discovery is proven in raw HTML, not rendered DOM.** For any change presented as
   improving crawl or indexation on a collection template, the evidence is raw HTML with
   JavaScript disabled showing which product links exist server-side, before and after.
4. **Pagination changes carry a discovery statement.** Given §2.1, any `T-008`
   implementation on these URLs states explicitly whether it changes product discoverability
   or only removes the contradictory signals. Both are acceptable outcomes; only silence
   about which one it is, is not.
5. **Zero-inventory URLs are decided, not defaulted.** No empty collection is left `INDEX`
   by inaction and none is bulk-redirected either. Each gets a documented intent.
6. **Sitemap membership is part of the diff.** If a URL's intended state changes, its
   sitemap presence is checked in the same PR and reported.
7. **CWV evidence on these URLs stays gated.** Per Tim's 2026-08-14 clarification, no CWV
   baseline is approved until the supported Convert target architecture is confirmed on an
   unpublished theme, and per my own open item the INP measurement method must be settled
   before any INP figure is certified. Status language on these URLs is **VALIDATING**, not
   *fixed* or *verified*.

---

## 4. What is blocked, and what that prevents

Unchanged from the 2026-08-08 consolidated list; repeated here only so the register carries
it without a second lookup. **No item below is estimated, backfilled or closed from cohort
totals.**

| Missing source | Gates | Effect on this register |
|---|---|---|
| 2026-08-05 per-URL Coverage rows | `T-001` | Per-URL classification for the five intents cannot be completed. Cohort totals are not a substitute |
| 2026-08-05 per-URL Performance rows | `T-001` | The impression/CTR opportunity sizing that ranks these five against each other cannot be evidenced |
| Search Console UI access | `T-001`, `T-015` | No URL Inspection evidence for any canonical or indexability decision above |
| Merchant Center access | `T-015`, `T-016` | Feed-side validation of the StairMaster and gym-packages decisions unavailable (Kevin) |
| Bing Webmaster Tools access | `T-016` | Second-engine crawl evidence unavailable |
| 30-day WAF/CDN challenge / 403 / 429 / rate-limit logs | `T-014` | Crawler-access review cannot be evidenced |

`T-001`, `T-014`, `T-015` and `T-016` remain **partially evidenced, not VERIFIED.**

---

## 5. Reproduction commands

Every LIVE-VERIFIED claim above comes from one of these, run logged-out on **2026-08-16**.

```bash
# rows 1-10: status, canonical, meta robots, title for each priority URL
for u in / /collections /collections/all /collections/free-weights \
         /collections/stair-climbers-steppers /collections/stairmaster \
         /collections/stairmaster-new /collections/stairmaster-remanufactured \
         /collections/gym-packages /collections/starter-packages \
         /pages/gym-packages /pages/remanufactured-gym-equipment; do
  curl -sS -o page.html -w "$u -> %{http_code} %{redirect_url}\n" "https://www.fitnesssuperstore.com$u"
  grep -o '<link[^>]*rel="canonical"[^>]*>' page.html | head -1
  grep -o '<meta[^>]*name="robots"[^>]*>'   page.html | head -1
  grep -o '<title>[^<]*</title>'            page.html | head -1
done

# row 11: pagination signals
curl -sS "https://www.fitnesssuperstore.com/collections/free-weights?page=2" -o p2.html
grep -oE '<link[^>]*rel="canonical"[^>]*>|<meta[^>]*name="robots"[^>]*>' p2.html

# row 12: server-rendered product anchors (excludes unrendered Liquid templates)
grep -o 'href="/products/[a-z0-9][^"{]*"' page.html | sort -u | wc -l

# rows 13-14: StairMaster set comparison
for c in stairmaster stairmaster-new stairmaster-remanufactured; do
  curl -sS "https://www.fitnesssuperstore.com/collections/$c/products.json?limit=250" \
    | jq -r '.products[].handle' | sort > "$c.handles"
done
cat stairmaster-new.handles stairmaster-remanufactured.handles | sort > union.handles
diff union.handles stairmaster.handles   # empty output == identical sets

# rows 15-16: sitemap membership
curl -sS "https://www.fitnesssuperstore.com/sitemap_collections_1.xml?from=499631030588&to=520594358588" -o smc.xml
grep -c '<loc>' smc.xml   # 663 collections
grep -c 'collections/gym-packages<' smc.xml
```

Collection product counts, smart-collection rules, SEO title/description, template suffixes,
publish dates and product tags are from the **Shopify Admin API on 2026-08-16**, store
`www.fitnesssuperstore.com`.

---

*Prepared for the single consolidated register Izza maintains. No live Shopify, GitHub,
robots, WAF/CDN, feed, redirect, schema or content change is authorised by this document,
and none has been made.*
