# Phase 2 — execution log and open reports (Yusra), 2026-09-18

Everything below was verified against live Shopify Admin and the live storefront
on 2026-09-18. Baseline is now **86 articles: 80 published, 6 drafts** (was 85/5 on
Sept 9); the one new record is the rubber-mat draft identified in section 5.

---

## 1. EXECUTED — last-updated field (Tim's approval item 3)

**`custom.chart_last_updated`** — this is the namespace.key Waqas is blocked on.

| Property | Value |
|---|---|
| Definition ID | `gid://shopify/MetafieldDefinition/249520030012` |
| Owner type | `PAGE` |
| Namespace / key | `custom` / `chart_last_updated` |
| Type | `date` |
| Storefront access | `PUBLIC_READ` (readable in Liquid as `page.metafields.custom.chart_last_updated`) |
| Values written | **48 of 48**, zero errors |

Seeded from each page's live `updatedAt`, as approved. All 48 timestamps were
re-pulled today and were unchanged from the Sept 9 packet, so the seeds match
`b6-chart-audit.csv` exactly.

Deliberately a separate curated field, not Shopify's built-in page timestamp —
that moves on any copy or metafield edit, which is why Waqas refused to substitute it.

**Rollback:** delete the 48 metafields, then delete definition 249520030012.

## 2. EXECUTED — broken chart rows (Tim's approval item 2)

- **Stairmaster SM5 TSE-1** — no action needed. Someone corrected the handle
  between Sept 9 and today; it now carries the `-tv-` handle and returns **200**.
  Verified, not assumed.
- **True Fitness CS900** — repointed. Metaobject `171259035964` `url` changed from
  `.../true-fitness-cs900-treadmill-w-emerge-console-remanufactured` (301) to
  `.../true-fitness-cs900-treadmill-w-transcend-console-remanufactured` (200).

Both chart rows now resolve **200 direct**, no redirect hop. All 317 chart row
product URLs now resolve cleanly.

The row's visible title still reads "w/Emerge Console" while the product is now
Transcend. Tim approved the URL repoint only, and row copy is Larianne's B3 lane,
so the title was left alone — **flagged for the B3 sheet**.

**Rollback:** set that one field back to the Emerge URL.

## 3. AEO item 4 — HTML tables: PASS, no image-only charts

All **48** chart pages fetched live: every one returns 200 and every one renders
real `<table>` markup with `<tr>`/`<td>` rows. **Zero image-only charts.** Per-page
counts in `b6-chart-html-tables.tsv`.

## 4. AEO item 5 — AI crawler policy (report only, as instructed)

Live `/robots.txt` matches `templates/robots.txt.liquid` in the repo. The policy is
deliberate and splits training from retrieval:

**Blocked outright (`Disallow: /`):** `GPTBot`, `ClaudeBot`, `CCBot`, `GrokBot`,
**`Google-Extended`**.

**Explicitly allowed** (standard Shopify/system disallows only): `OAI-SearchBot`,
`OAI-AdsBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`.

**Not named at all**, so they inherit `User-agent: *` (allowed): `Applebot-Extended`,
`Bytespider`, `Amazonbot`, `meta-externalagent`, `Perplexity-User`.

One thing worth Tim's attention given the GEO goal: **Google-Extended is blocked**.
That is the control for Google's AI surfaces, so our content is opted out of that
grounding while we are actively trying to win AI answer visibility. Retrieval bots
for ChatGPT, Claude and Perplexity are allowed, so those paths are open. Report only —
no change made.

## 5. Second unexplained draft — IDENTIFIED (closing Tim's Sept 11 item)

| Field | Value |
|---|---|
| Article | **How to Cut Rubber Gym Mats So They Fit Flush Against a Wall** |
| ID | `614765789500`, unpublished |
| Blog | Maintenance & Setup |
| Created | 2026-09-10 02:20 UTC by the **Shopify ChatGPT MCP App** (app-attributed, not a person) |
| Since edited by | **Larianne P.** via Shopify Web, 2026-09-15 and 2026-09-16 |

Purpose: a mat-cutting how-to built around a 2:19 YouTube walkthrough, with a safety
block, FAQ, rubber-flooring collection links and five product links. It is genuine
in-progress editorial work, not a stray record — it already carries a meta title and
description, and the body holds three `EDITORIAL VISUAL … _DRAFT.png` placeholders
awaiting approved public images.

Not published, not deleted, per instruction. It is the reason the article baseline
moved from 85 to 86.

## 6. featured:* variants — who actually consumes them (Tim's Sept 11 item)

**No app consumes them.** Checked all 47 installed apps.

- **Boost AI Search & Filter is installed** and is the storefront search/filter
  provider. Its block on `templates/search.json` is the *product-list* SSR block, and
  `/search` renders product results client-side. It is a product-search surface.
  Whether Boost's index includes blog articles and their tags is a setting inside the
  Boost dashboard that the Admin API does not expose — step-by-step check below.
- Shopify's own **Search & Discovery** app holds product/discovery scopes only and no
  `read_content` scope at all, so it cannot read articles or their tags.
- Apps that *can* read articles (Smart SEO, Matrixify, Klaviyo, Sitemaps Generator,
  Docify, Gorgias, Make, ShopperApproved) are metadata, export, email, support or
  automation tools. None drives storefront filtering on article tags.

**The real consumers are theme-side, and they split two ways:**

| File | Reads | Notes |
|---|---|---|
| `sections/main-blog.liquid` | exact `featured:top` | float-to-front on blog index pages |
| `sections/related-blog-post-slider.liquid` | exact `featured:top` | float-to-front on hub category rows |
| `sections/featured-blog.liquid` | the **`featured:`** prefix, first match wins | this is the related-articles grouping Waqas reported |

So the topic variants (`featured:cardio`, `:comparison`, `:ellipticals`,
`:educational`, `:general`) are read by exactly one section, `featured-blog.liquid`.
Nothing else in the theme, no JavaScript, and no app reads them. That matches Waqas's
finding from the theme side and closes it from the data/app side.

## 7. AEO item 3 — meta descriptions from excerpts: nothing to write

Audited all 80 published articles for a blank `global.description_tag`. **Five** are
blank, and none qualifies under Tim's rule:

| Article | Blank meta? | Has excerpt? |
|---|---|---|
| Life Fitness PowerMills vs Stair Steppers vs Summit Trainer | yes | no |
| Should You Choose Remanufactured or Brand-New French Fitness | yes | no |
| How to Build a Home Gym (step-by-step) | yes | no |
| Forge CHS: Charleston, SC | yes | yes, but unusable |
| Private Home Gym – Northville, MI | yes | yes, but unusable |

The first three have no excerpt to copy from. The two case studies do have excerpts,
but both are truncated mid-sentence and carry a stray `<meta charset="utf-8">` tag
("…They turned"). Copying those into meta descriptions would publish broken copy, so
I did not. Same principle Tim applied to the malformed hub copy on /llms.txt.

All six of Larianne's newly-excerpted featured articles already have meta descriptions,
so the "do not overwrite existing" rule leaves them untouched.

**Ask:** five short meta descriptions from Larianne and I will write them in one pass.

## 8. Precor duplicate — it is mispopulation, not redundancy (Tim's held-out item)

Tim's instinct was right and it settles the retire-vs-repopulate question.

Both pages reference the **identical six metaobjects**, and **all six are AMT
(Adaptive Motion Trainer) models — not one is an elliptical**:

1. Precor AMT 100i Adaptive Motion Trainer
2. Precor AMT 835 w/P30 Console, w/o Open Stride
3. Precor AMT 885 w/P80 Console, w/o Open Stride
4. Precor AMT 835 with Open Stride w/P30 Console
5. Precor AMT 885 with Open Stride w/P80 Console
6. Precor AMT 885 with Open Stride w/P82 Console

So `/pages/precor-elliptical-comparison-chart` is not a duplicate of the AMT chart —
it is an elliptical chart that was populated with AMT rows. **Recommendation:
repopulate, do not retire.** The correct Precor elliptical models already exist on the
store in two sibling charts (Precor Lower Body Elliptical, 11 EFX rows; Precor
5.21s/5.17/… Home Elliptical, 8 EFX rows), so Larianne has the source material.

Traffic and backlink split between the two URLs is not in this packet — Semrush is out
of API units on the account this cycle. Manual pull steps below.

## 9. /llms.txt — independent confirmation, plus one thing to check

Confirmed Waqas's finding: the store serves **Shopify's managed default** at
`/llms.txt` (agent instructions, the Shop skill, UCP endpoints). Nothing custom, and
no `templates/llms.txt.liquid` in the repo — consistent with his report.

One item he did not flag: an app named **"Arc: llms.txt" is installed** on the store.
Worth confirming it is not writing or intercepting that route before Waqas builds the
native template, so we do not end up with two mechanisms.

## 10. Delta QA on #748 head c5865fb — partial PASS, toggles not run

**Head parity proved first.** Preview theme 188015313212 is byte-identical to branch
head `c5865fb7cdd217e0eb5a74e4fdb5b9da6633893c` on all three scoped files
(md5 + byte size match on `sections/main-blog-search.liquid` 13785,
`templates/page.blog.json` 15138, `sections/blog-featured-latest.liquid` 18744).
So this ran against the accepted head, not a drifted theme.

**PASS on everything verifiable from rendered output:**

| Check | Result |
|---|---|
| Zero-result copy in page source | **PASS** — "No articles found" appears only inside JS (`noResults.innerHTML`), created on demand. Nothing server-rendered. |
| Search index as data block | **PASS** — one `<script type="application/json" id="blog-search-data">`, 48,403 chars |
| Index completeness | **PASS** — exactly **80** entries = all 80 published articles |
| De-duplication | **PASS** — 0 duplicate URLs in the index; 80 distinct article URLs across 98 link positions in crawlable DOM (normal overlap between the featured grid and category rows, not a hidden duplicate index) |
| Thumbnails | **PASS** — `image` populated on **80/80** entries |
| Author field | **PASS** — `author` populated on **80/80** |
| Scope | **PASS** — keys are exactly `author, excerpt, image, published_at, tags, title, url`. No body text; longest entry 1,016 chars |
| Escaping | **PASS** — no raw `</script` sequence inside the data block |
| Heading structure | **PASS** — exactly one `<h1>` ("Fitness Superstore Blog") |
| Accessibility hooks | **PASS** — `aria-live`, `aria-controls` and a visually-hidden label all present |

**NOT RUN — the three toggles and the interactive search states.** Two reasons, both
honest:

1. The toggle test needs Show Image / Show Author / Show Date flipped in the theme
   editor. Doing that writes `templates/page.blog.json` in preview theme
   188015313212, which would re-break exactly the byte-parity Izza just closed in
   #843. I was not willing to reintroduce that drift without a ruling.
2. Typing a query, the zero-result state and focus behaviour are client-side. The
   headless browser in my environment cannot complete TLS to the storefront
   (`ERR_CERT_AUTHORITY_INVALID` through the egress proxy), so I cannot drive or
   screenshot the page. Everything above was verified from fetched server HTML.

Manual script for the remainder is in `QA-MANUAL-STEPS.md`. It is roughly 15 minutes
in the theme editor preview with nothing saved, so parity is never touched.

## 11. HELD — the 9 moves, the 10 redirects and the retirement

**Not executed, and I want one ruling before I run them.** New information since the
Sept 9 approval changes the consequence.

Hub category rows are pinned to specific blog handles — there are seven slider
instances, one per blog, and each names its blog. Creating **Training & Wellness** as
a seventh blog gives those nine articles **no hub row at all**, because no instance
points at the new handle. Separately, #748 corrects
`main_blog_search_rRXczN.blog_handles` to "the six live handles"; after the move there
would be seven, so those nine articles would also fall out of hub search unless that
list gains the new handle.

Both #836 and #748 are unpublished and currently blocked, so that gap would not close
quickly. The articles stay live, keep their blog index pages, stay in the sitemap and
are 301'd — but they would vanish from the hub in the meantime.

**Recommendation:** Waqas adds a Training & Wellness slider instance and adds
`training-wellness` to the `blog_handles` list in the work he already has open. The
moment that is in, I run the full pass same-day — moves, 10 redirects, the aluminum
pulleys retirement, before export and inverse rollback, then the after export and the
10-URL 301 verification Tim asked for.

Also confirmed while checking this: **none of the six hardcoded handles needs
updating.** Essential Reads points at three Buying Guides articles and Popular Right
Now at one Comparisons, one Buying Guides and one News article — and not one of those
six is in the move list. Waqas's concern that "the hand-picked blocks break on the
301s" does not apply to this particular set of moves. Nothing to fold in.

## 12. Still owed by others, blocking me

- Larianne — five meta descriptions (section 7); the CS900 row title (section 2);
  Precor elliptical repopulation (section 8).
- Waqas — Training & Wellness slider instance + `blog_handles` entry (section 11);
  wiring `custom.chart_last_updated`, now live (section 1).
