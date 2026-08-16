# Technical SEO Recovery Sprint — Ticket / PR Plan

**Workstream:** Technical SEO recovery — crawl, schema and mobile CWV
**Source of authority:** Tim's emails of 2026-08-05 (scope) and 2026-08-06 (ownership), thread *"ACTION: Technical SEO recovery sprint — crawl, schema and mobile CWV"*
**Controlled inputs reconciled:** `03_Technical_SEO_Developer_Brief.docx` · `technical_acceptance_criteria.md` · `schema_remediation_spec.json` · `shopify_technical_seo_patch_examples.md` · `robots_waf_validation_checklist.txt` · `lighthouse_ci_scope.md` · `crawl_indexation_workplan.csv` · `FSS_SEO_GEO_Implementation_Backlog.xlsx`
**Prepared by:** Izza — Full-Stack Lead Developer, primary implementation lead
**Revision:** 3 — 2026-08-13. Revision 1 used a local `TS-xxx` scheme written before the attachments were available; **it is retired.** Revision 2 adopted the controlled `T-001`–`T-016` IDs, target dates, intended-state taxonomy and Lighthouse budgets from the backlog and workplan; revision 3 preserves all of it unchanged and records Tim's August 8 and August 9 decisions, the work done under them, and the live evidence gathered since.
**Revision 4 — 2026-08-16.** Source-register update per Tim's August 14 Stage 0 HOLD decision: current-main SHA, corrected `T-018` framing, PR #700 **and** PR #703 registered against `T-006`, and the current access block. Ticket numbering preserved; nothing re-audited. **See §0A, which controls wherever it differs from §0.**
**Branch state:** `claude/seo-recovery-sprint-ctwbtp` — **3 commits ahead, 26 behind current `main` (`575a8de`), with no draft PR yet.** The rebase and the draft PR are Izza's outstanding items. The plan and source register carried over unchanged from `claude/seo-recovery-sprint-pb3w4z`; no ticket was renumbered, retired or rescoped.
**Checkpoint this satisfies:** August 12 ticket/PR plan checkpoint (met August 8)
**Status:** **Stage 0 HOLD — NO-GO in force.** The branch is accepted as the current working record but is **not approval-ready or merge-ready**. Nothing is merged, deployed or published, and live Shopify MAIN is untouched by this branch.

---

## 0A. Revision 4 — source-register update per Tim's August 14 Stage 0 HOLD

**Scope of this revision, exactly as assigned.** Tim's August 14 02:52 UTC decision gave
Zafran four things: record the current-main SHA, correct the `T-018` framing, add **both**
PR #700 and PR #703 to the `T-006` dependency register, and restate the current access
block. Ticket numbering is preserved and nothing has been re-audited. Revision 3 below is
left intact; where the two differ, **revision 4 controls.**

**Status: Stage 0 remains HOLD. NO-GO is in force.** Nothing here is approval-ready or
merge-ready. Independent review by Zafran begins only after Izza posts the refreshed draft
PR and preview evidence.

### 0A.1 Current source state

| Field | Value |
|---|---|
| Current GitHub `main` | `575a8defcb8526ab76cdc9570b7c336e4c10a696` |
| This branch | `claude/seo-recovery-sprint-ctwbtp` @ `4c12def` (was `fa427126` at Tim's August 14 audit) |
| Branch position | **3 commits ahead, 26 commits behind current `main`** |
| Draft PR for this branch | **None yet** — outstanding on Izza |
| Live Shopify MAIN | `gid://shopify/OnlineStoreTheme/186120208700`, still carries the existing schema, robots and Lighthouse/PageSpeed behaviour. **No live change has been made by this branch.** |

Tim's audit recorded the branch as 2 ahead / 14 behind at `fa427126`. Both numbers have
moved since — the third commit is the accuracy correction to `T-006b`, and `main` has
advanced. The rebase onto current `main` remains Izza's item, not something this revision
performs.

### 0A.2 `T-018` — corrected framing

**The revision-3 heading "Two Convert installations live in the same document" is wrong
and is superseded.** Per Tim's August 14 decision, the controlling evidence is that the
`cdn.9gtb.com` request is the **Gorgias Convert/Campaign bundle**, not a second Convert
Experiences A/B-testing loader. There are not two competing experiment platforms in the
page. **No 9gtb or Gorgias removal is authorised**, and the revision-3 framing must not be
carried into any PR description, evidence pack or Control Tower entry.

The ticket is not closed — the blocker changed rather than disappeared. What remains open
is the **supported Convert Shopify target architecture**, and specifically these six
confirmations, still unanswered by the vendor as of Tim's August 14 20:19 update:

1. Custom Shopify app / Theme Extension / Web Pixel versus the current manual head snippet.
2. The correct production project/environment.
3. Proof of exactly **one** Convert Experiences initialisation.
4. Before-first-paint / no-flicker behaviour.
5. Checkout-start, purchase and revenue goal mapping.
6. Confirmation on an unpublished theme before any baseline is approved.

Convert has confirmed the supported target is its custom Shopify app with Theme
Extension/App Embed and Web Pixel mapping, and that only one initialisation may be
present. The six substantive confirmations remain outstanding. **Customer experiment
traffic stays at 0. No separate vendor thread is to be opened** — this stays in the
existing Convert thread.

### 0A.3 `T-006` dependency register — both PRs

Tim's instruction is to reconcile these into **one current-main implementation path**
rather than maintain three competing schema rewrites, and to add both to the register
**before** writing a third implementation.

| PR | #700 | #703 |
|---|---|---|
| Title | Gate 1A — PDP product-data schema for AI channels (REVIEW ONLY) | Gate reference-price and savings displays on documented substantiation |
| Branch | `claude/shopify-openai-email-reply-m2eb9o` | `claude/gmc-data-deception-issues-i79kys` |
| Head | `5ac71b1e` | `dd3516d` |
| Base | `e84455cf` | `f914cb0` (merge-base) |
| State | Draft, unmerged, `mergeable_state: blocked` | Draft, unmerged, `mergeable_state: blocked` |
| Size | 2 files, +217 / −15 | 16 files, +283 / −124 |
| Shared file | `snippets/schema-product.liquid` | `snippets/schema-product.liquid` |
| Overlaps | `T-006a` (fabricated defaults), `T-006b` (`itemCondition` omission), `T-006e`-`T-006g` | `T-006a`/`T-006d` file overlap; reference-price gate and `ListPrice` |

**What #700 already does that `T-006` was going to do again.** It omits `itemCondition`
when no condition fact is held rather than defaulting to `NewCondition`; removes the
`countryOfAssembly` / `countryOfLastProcessing` `"US"` defaults, the `audience`, `color`
and `description` defaults and the `mpn`/`sku` fallback to `product.handle`; validates
GTIN length; drops `priceValidUntil` as an unsupportable assertion; and states the
omit-rather-than-invent rule at the top of the file. That is most of `T-006a` and the
substance of the `T-006b` mapping proposed in
`docs/seo/t-006-t-008-current-vs-proposed.md`.

**Consequence for the plan, stated plainly:** `T-006a` and `T-006b` should not be written
a third time. The current-vs-proposed diff document remains valid as the *specification*,
but the implementation path is to reconcile #700 and #703 onto current `main` — #700 for
the product-fact omissions, #703 for the reference-price gate — and close or supersede
whatever is redundant. `T-006d` (oversized graphs) and `T-006c` (review source of record)
are the parts neither PR covers and are what a third change would legitimately carry.

Both PRs remain coupled to the technical SEO release gate and **must not merge
independently of it.** Kevin and Yusra are added only for the bounded feed/GMC parity gate
covering condition omission and the verified-reference-price rule; no broad catalogue
reconciliation is assigned.

### 0A.4 Reference-price source of record — DECIDED, supersedes the open question

Revision 3 §12 listed this as an open decision. **It is decided** (Tim, August 14). Use
`custom.retail_price` as the single source for the visible reference price, the savings
display **and** the JSON-LD `ListPrice`, and only when **all four** of these hold:

1. `compliance.reference_price_verified` = true;
2. the reference-price source is recorded;
3. the effective date and last-reviewed date are populated; and
4. the visible value and the structured-data value are **identical**.

**Do not fall back to variant `compare_at_price` for `ListPrice`** unless that exact value
is separately substantiated through the same control. Where the gate is incomplete, omit
the strikethrough, the exact savings and the `ListPrice` from both the visible page and
the structured data.

This resolves the divergence recorded in the PR #703 review — visible reading
`custom.retail_price` while `ListPrice` read `compare_at_price` — in favour of a single
field, and it goes further than the review's recommendation by adding the source, dates
and identical-value conditions. **PR #703 does not currently implement this**: its schema
gate still reads `compare_at_price` (`schema-product.liquid:105`, `:176`) and its visible
path falls back to `compare_at_price` when `retail_price` is absent
(`price-reference.liquid:45`). Both need changing before that PR can satisfy the decision.
That is now a required change, not a review finding.

### 0A.5 `T-017` and `T-020` — current status

**`T-017` — prepared, unmerged, and now held behind a further gate.** Do not merge ahead
of the Convert reconciliation in §0A.2. Per the August 14 clarification, **do not
establish or approve the final CWV baseline until the supported Convert target
architecture is confirmed on an unpublished theme.** The interim customer-equivalent
baseline uses the already-approved overridden-user-agent method and is remeasured after
`T-018` resolves.

**`T-020` — reclassification approved.** It is legacy cleanup, removed from the P0 release
path. **Do not delete the legacy templates in this sprint.** Tim requires the three
one-character cleanups to sit in **a separate reversible commit** so they cannot ride into
a `T-017` release.

> **Outstanding, and it is Izza's to fix, not this revision's:** on this branch the
> `T-017` theme edit and the three `T-020` template edits are currently in **one commit**
> (`fa427126`). That does not meet the independently-reversible requirement. It should be
> split when the branch is rebased onto current `main`. Nobody should force-push this
> shared branch to fix it as a side effect of a documentation update, which is why it is
> flagged here rather than done here.

### 0A.6 Access and evidence block — current

Unchanged in substance and now confirmed by Tim's own search as well as mine:

- The **August 5 per-URL Coverage and Performance exports are not present** in the
  accessible Drive. Older Coverage Drilldown files (most recent: May 2026) do not
  substitute for those rows.
- **Search Console UI, Merchant Center, Bing Webmaster Tools** and the **30-day WAF/CDN**
  challenge / 403 / 429 / rate-limit logs are not available through the connected tools.
- `T-001`, `T-014`, `T-015` and `T-016` may be marked **partially evidenced** but **not
  VERIFIED** without their required sources.
- The existing system owners place the required exports, screenshots or logs in the current
  Drive/Gmail evidence path and link them in the canonical thread. No separate tracker.

### 0A.7 Cross-reference — the August 11 CWV delta

Recorded here as a link only, because Tim's instruction is one record and no duplicate
trackers. The CWV delta runs on its own controlled target and does **not** change any
ticket numbering in this plan.

| Field | Value |
|---|---|
| Focused issue | [#716](https://github.com/izzaahmed02/fitnesssuperstore-shopify/issues/716) |
| Canonical branch | `claude/core-web-vitals-mobile-vwzm5w` @ `fe990b6b`, based on `main` @ `575a8de` |
| Draft PR | [#723](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/723) — `[DO NOT MERGE]`; #717 closed and superseded |
| Unpublished isolation theme | `gid://shopify/OnlineStoreTheme/187691401532`, connected 2026-08-16, checksum-verified against the branch commit |
| Priority | **Desktop LCP is P0**; mobile LCP second, mobile INP third |
| Status language | **VALIDATING** — not fixed, not verified, not a predicted pass |

The `T-017` gate removal is the change under test on that branch too, which is the other
reason `T-017` here must stay unmerged: the same edit is currently serving as the isolation
variable for the CWV baseline.

---

## 0. Revision 3 — decisions received, work done, and what changed

### 0.1 Ownership override note

**This is the single ownership-override note Tim asked for on August 8.** It governs
the whole plan; the owner tables in `03_Technical_SEO_Developer_Brief.docx` and
`FSS_SEO_GEO_Implementation_Backlog.xlsx` are **not** being rewritten row by row.

> Tim's August 6 canonical ownership email and the live Org Chart control over the
> older brief/workbook assignments. Izza is implementation and Shopify/GitHub lead.
> Zafran owns technical SEO architecture, URL-intent, schema, canonical, robots, CWV
> and independent release-gate review. Jake is link building only and holds no
> technical execution or approval role in this sprint — every `T-001`, `T-002`,
> `T-004`, `T-005`, `T-011`, `T-014` and `T-015` assignment naming him, and the
> brief's "final URL map approval" line, transfer to Zafran. Control Tower monitors
> owners, blockers, evidence and completion and does not become an execution owner.
> Confirmed by Tim, 2026-08-08.

### 0.2 Decisions received from Tim (August 8 and August 9)

| Ticket | Decision | Where it lands |
|---|---|---|
| `T-017` | Prepare the branch change removing the Chrome-Lighthouse / Page Speed Insights exemption so lab testing exercises the customer path. **Do not merge.** If a documented technical reason to keep it emerges, run Lighthouse with an overridden user agent and record the reason in the PR evidence | §10 `T-017`; change prepared, see §0.3 |
| `T-018` | **Remains BLOCKED** pending Thomas/Gwen's written answer in the existing Convert thread. No duplicate follow-up thread | §10 `T-018` — unchanged |
| `T-019` | Routine assertion maintenance authorised where it only keeps tests aligned with an approved implementation. Surface any change to thresholds, representative URLs, measurement methodology or architecture. Do not weaken a test to make a PR pass | §10 `T-019` |
| `T-020` | Test the actual logged-out `?view=` consumers first. Repair PR only if an active endpoint errors; otherwise legacy cleanup, not a P0 | §10 `T-020`; **tested — see §0.4** |
| `T-006` | **Judge.me is the public review system of record.** `aggregateRating` may be emitted only from an approved normalised source matching the visible Judge.me rating and count; if parity cannot be kept, omit it. Enumerate live condition values before changing `itemCondition`; omit unknown or unsupported values | §6 `T-006b`, `T-006c` — **enumeration done, see §0.5** |
| `T-008` | Ordinary `?page=n` pagination targets crawlable unique URLs with self-referencing canonicals, subject to sampled validation. **Do not combine `noindex` with a canonical to page 1.** Filters, sorts and tracking parameters remain separate decisions needing sampled intent | §6 `T-008` |
| `T-014` | **No change this sprint.** Google-Extended is a content-use/grounding control, not a Search or AI Overview visibility fix. Keep the current directive until Tim makes a separate policy decision after the crawler/log review | §7 `T-014` |
| Ownership | August 6 email and live Org Chart control; one override note, no row-by-row rewrite | §0.1 |
| PR #703 | Register as a dependency of `T-006`. Must not merge independently of the technical SEO release gate | §6 `T-006`, and the dependency review in `docs/seo/t-006-pr-703-dependency-review.md` |

### 0.3 Prepared branch changes — not merged

Both sit on `claude/seo-recovery-sprint-ctwbtp`, which is based on current `main`.

1. **`T-017` — `layout/theme.liquid`.** The `Chrome-Lighthouse` / `Page Speed Insights`
   early return is removed, so the Gorgias widget and the Convert loader are injected
   on the same terms for synthetic and real clients. A comment records why. Verified:
   `scripts/cwv_regression_test.py` passes unchanged, which confirms the revision-2
   reading in §10 `T-019` — this edit touches no asserted string.
   **This change must not merge ahead of `T-018`.** It shares a code block with the
   duplicate-Convert question, and merging it while that is unanswered would change
   which Convert loaders run in a lab measurement before anyone has confirmed which
   installation is authoritative.
2. **`T-020` — the three manuals templates.** The stray empty Liquid filter is removed
   from `collection.all-collections-json.liquid:6`, `collection.manual-list.liquid:6`
   and `collection.manual-item.liquid:4`. Now classified as legacy cleanup rather than
   a customer-facing repair, on the live evidence in §0.4.

### 0.4 `T-020` — live endpoint evidence, and a correction

Tested logged-out against production on 2026-08-13, using `collections/treadmills` as a
real collection (the manuals hub handles the theme's JavaScript references do not exist
as collections — every one returns 404).

| Endpoint | Status | Result |
|---|---|---|
| `?view=manual-item` | `200` | **Renders correctly.** Title output `Commercial Treadmills for Sale` — the stray filter is on the line that produced it |
| `?view=manuals-metafields-json` | `200` | Renders a valid JSON array |
| `?view=all-collections-json` | `200` | Renders `[ ]` — empty because the collection has no `related_collections` metafield |
| `?view=manual-list` | `200` | **Liquid error in the body:** `Liquid error (templates/collection.manual-list line 2): Array 'collection.metafields.custom.related_collections.value' is not paginateable` |

**Two corrections to revision 2, both worth stating plainly.**

**The empty Liquid filter does not error.** `?view=manual-item` carries the defect on
line 4 and renders its title correctly, so Shopify's Liquid tolerates the stray pipe.
Revision 2 said this needed a live check before anyone claimed it was broken; it was
checked, and it is not broken. It is untidy, not a defect.

**The one endpoint that does error, errors for a different reason** — `paginate` over a
`related_collections` list that is empty or absent on that collection, at line 2, which
no one had flagged. On a collection that does carry the metafield it would presumably
paginate normally, which is not something I can confirm without such a collection.

**Nothing live calls these templates.** The live `/pages/all-manuals` and the brand pages
such as `/pages/french-fitness-manuals` both render section
`main_page_manuals` — the newer table-based implementation using `manuals.css` and
`#manualTable`. Neither page contains a `<custom-manuals>` element, and neither loads
`custom-manuals.js`, which is the only consumer of these `?view=` endpoints in the
theme. The legacy consumers `sections/main-page-manuals-inner.liquid` and
`sections/collection-section-manuals.liquid` are referenced only by
`templates/page.brand-manuals.json` and `templates/collection.manuals.json`, and the
live brand page does not render them. No collection in the first 250 returned by the
Admin API carries a `manuals` template suffix; `product-index` is the only suffix in
that sample. That is a sample, not the full 663-collection list — the Admin API
ignores a `template_suffix` filter on collections, so a complete sweep needs a
different method and is not worth blocking cleanup on.

**Outcome, per Tim's decision rule:** no active endpoint errors, so this is **legacy
cleanup, not a P0 customer issue.** The one-character fixes are prepared. The larger
question — whether these three templates and the two legacy sections should be deleted
outright — is a separate cleanup decision and is not being taken here.

### 0.5 `T-006b` — live `condition_state` enumeration, and what it settles

Queried against the live Shopify Admin API on 2026-08-13. **This is the "enumerate the
live condition values first" task from Tim's August 8 decision, and it is done.**

- The metafield definition `custom.condition_state` is a **`single_line_text_field` with
  no validations** — free text, nothing constrains what can be entered.
- **4,492** of 6,469 products carry it.

| Value | Products |
|---|---|
| `New` | 3,157 |
| `Remanufactured` | 1,331 |
| `As is` | 4 |

**The worst case does not occur.** No product combines conditions in one value — a
search requiring both terms returns zero. So the per-variant contradiction described in
`T-006b`, where a combined value would mark genuinely new variants
`RefurbishedCondition`, **is a live code path with no live data behind it today.** The
revision-2 caveat was right to hold that open rather than assert it, and this closes it.
It is still worth fixing, because nothing prevents someone typing a combined value into
a free-text field tomorrow.

**And the invalid-URL risk is not currently firing either.** Reading
`schema-product.liquid:85` against the live values rather than in the abstract: the
branch already special-cases `as is` / `As is` to `UsedCondition` and `Remanufactured`
to `RefurbishedCondition`, and `New` reaches the concatenation branch where
`New` + `Condition` happens to produce the valid `NewCondition`. **So all three live
values emit valid Schema.org URLs today.** The `Open Box` failure described in `T-006b`
is a real property of the code and would fire the moment someone types a fourth value
into an unvalidated free-text field — but it is not firing now, and the ticket should
say so rather than carry an implied live defect.

**What is live is the fabricated default — but it is much smaller than the raw catalogue
count suggests, and the count needs stating carefully.** `1,977` products carry **no**
`condition_state` at all (6,469 total minus the 4,492 that have it), and the `{% else %}`
branch asserts `https://schema.org/NewCondition` for every one of them. That is the same
category as the `T-006a` fabricated-default table.

**It is not 30% of the storefront.** Of the 3,750 products the Admin API reports as
`status:active`, **3,737 carry a condition value — only 13 do not.** The gap between 13
and 1,977 sits almost entirely in products that are not active, and those render no PDP.

One honest caveat on the arithmetic, because it does not reconcile: the status counts
returned by the API (`active` 3,750, `draft` 28, `archived` 464) total 4,242 against a
catalogue of 6,469, so roughly 2,200 products are not accounted for by any status filter,
and a `published_status:published` query returns 5,972 — more than the active count,
which cannot be literally true. Something about how this store's product index answers
status filters is unreliable, so **the exact live exposure cannot be pinned down from
these queries.** What is safe to say: the fabricated `NewCondition` default is real, it
is the right thing to fix, and on the active-product figure it currently affects on the
order of a dozen rendered pages rather than a third of the catalogue. Anyone quoting a
number should quote 13-of-3,750 and note the reconciliation gap, not 1,977.

Where condition is genuinely unknown the property should be omitted regardless — the
volume changes the priority, not the correctness.

**So `T-006b` reduces to three changes**, none of which is the per-variant contradiction
that opened the ticket:

| Case | Today | Proposed |
|---|---|---|
| `New` (3,157) | `NewCondition` — correct by string coincidence | `NewCondition`, mapped explicitly |
| `Remanufactured` (1,331) | `RefurbishedCondition` | unchanged |
| `As is` (4) | `UsedCondition` | unchanged |
| No value (1,977 catalogue-wide, but only **13 of 3,750 active** products) | **`NewCondition` asserted with nothing behind it** | **omit the property** |
| Any future value | raw text concatenated into the URL | **omit the property** |

Kevin still assesses the feed side: `itemCondition` is markup rather than a feed field,
so the risk is a mismatch between PDP markup and the condition attribute the feed sends —
and the 1,977 products currently asserting `New` in markup are where to start looking.

### 0.6 `T-006c` and `T-008` — supporting live counts

- `reviews.rating` and `reviews.rating_count` are set on **481 products** each. Those are
  the metafields `schema-product.liquid:19-29` reads today. Under Tim's decision Judge.me
  is the system of record, so these 481 are the products where a divergence can currently
  publish. The `judgeme` namespace returns no metafield **definitions**, which is normal
  for an app-owned namespace and is **not** evidence that Judge.me data is absent — the
  parity check has to be done on rendered pages, not on definitions.
- `custom.product_canonical_url` is set on **235 products**. That is the unvalidated
  canonical override flagged in `T-008`; the type is `url`, so the format is constrained
  but the destination is not. A sample shows at least one self-referential value, which
  is harmless. **The full 235 still need auditing under `T-001`** — the Admin API ignores
  a wildcard metafield filter on this key, so enumerating them needs an export rather
  than a query.

### 0.7 Still blocked, unchanged

`T-018` stays blocked pending Convert's written answer. `T-001`, `T-014`, `T-015` and
`T-016` cannot be marked VERIFIED without the August 5 per-URL Coverage and Performance
rows, Search Console UI, Merchant Center, Bing Webmaster Tools and the 30-day WAF/CDN
logs. **Drive was searched on 2026-08-13 and the August 5 per-URL exports are not
there** — the most recent Coverage Drilldown files are from May 2026. The rows have to
come from someone with Search Console access; they cannot be reconstructed, and no other
data source is a substitute for them.

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
- **Confirmed absent** — no `BlogPosting` or `Article` schema anywhere in the theme; `perview`, `_pos`, `_sid`, `_ss` and `srsltid` each appear zero times in `templates/robots.txt.liquid`.
- **Confirmed against the live store** — 50+ products carrying `productType: Avis-add-charge` and tag `avisplus-product-options`, 49 `UNLISTED` and 1 `ARCHIVED` in the first page of fifty, with the result set still paginating (`T-001` scope addition).
- **Expected absence, not a finding** — Boost does not appear in theme code because it is an app embed. App-layer scripts cannot be inventoried from this repository at all, which is a measurement constraint recorded under `T-013`.
- **Not yet verified — requires live checking, and flagged as such at each point:** whether the `?view=` manuals endpoints are currently erroring (`T-020`); the distinct live `condition_state` values and whether any combine conditions (`T-006b`); whether collection descriptions contain markup at the word-43 boundary (`T-010`); the current per-article byline state (`T-012`); the live values of the `product_canonical_url` override metafield (`T-008`); whether the `Avis-add-charge` URLs are in the sitemap, indexed, or excluded from the feed (`T-001`, `T-016`).
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

**Scope addition — an Avis-era product cohort that belongs in this inventory.** The Avis Plus product-options app was removed some time ago, but its helper records remain in the live catalog. Queried against the live store: **50+ products (the result set was still paginating) all carrying `productType: Avis-add-charge` and the tag `avisplus-product-options`** — 49 `UNLISTED`, 1 `ARCHIVED` in the first fifty.

These are not real products. They are Avis option pickers: `warranty-30` (36 variants), `mat-accessories-add-ons-32` (64 variants), plus records that are not products in any sense — `shipping-tax-faqs-shipping-information-39`, `methods-of-payment-accepted-payment-information-40`, `checkout-problem-faqs-checkout-issues-45`, `region-37`, `condition-53`, `voltage-86`.

Why this matters to three tickets:

- **`T-001` / `T-005`** — `UNLISTED` in Shopify excludes a product from collections and search **but leaves it reachable at its direct URL**, so `/products/warranty-30` and the rest resolve and are crawlable. A cohort of thin, near-duplicate, non-product PDPs is exactly the profile that accumulates in *crawled — currently not indexed*, and it should be classified deliberately (`BLOCK_CRAWL` or `410`) rather than left as an accident.
- **`T-006`** — these are the worst case for every fabricated-default finding at once. With no condition metafield they emit `NewCondition`, so a **warranty is marked as a new-condition product**; `mpn` and `sku` fall back to the handle; and `mat-accessories-add-ons-32` at 64 variants emits the full `offeredBy` Organization block **64 times** on one page. The `warranty-30` description also begins with raw CSS (`.warranty-container { font-family: ... }`), which `strip_html` at `schema-product.liquid:34` will not remove, so that CSS lands in the schema `description`.
- **The theme still branches on the tag.** `sections/main-product.liquid:946` and `:1445-1452` test `product.tags contains 'avisplus-product-options'` and pass `hide_badge`, so this is live conditional rendering, not dead code.

**Not yet verified:** whether these URLs appear in the sitemap, whether any are indexed, and whether the `DrShipIgnore` / `hidden` tags actually exclude them from the Merchant Center feed. The tags suggest that intent but I have not confirmed it — Kevin should, under `T-016`.

Also worth a separate look, though not SEO: `assets/cart.js:215-225` runs a `MutationObserver` over `document.body` with `childList` and `subtree` watching for `.avis-edit-options` elements, for an app that is gone. `assets/cart-stale-cleanup.js` is a deliberate post-Avis migration script and should stay until carts from that era have aged out, then be given a retirement date. Both are `T-009` third-party profiling items rather than tickets of their own.

- **Executor:** Zafran *(reassigned from Jake)* · **Independent verifier:** Izza · **Approval of URL intent:** Tim · **Catalog input:** Larianne (whether the Avis records can be retired), Kevin (feed exclusion)
- **Evidence:** GSC export · crawl · sitemap · Shopify · internal-link export · ≥10 sampled URLs per cohort with raw status, canonical and robots · full export of the `Avis-add-charge` cohort with sitemap and index status per URL
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
- **Dependencies — PR #700 and PR #703.** Both registered per Tim's August 9 and August 14 decisions; full register entry at **§0A.3**, which controls. In short: #700 (`claude/shopify-openai-email-reply-m2eb9o` @ `5ac71b1e`) already implements the condition omission and the product-fact default removals this ticket specifies, and #703 (`claude/gmc-data-deception-issues-i79kys` @ `dd3516d`) implements the reference-price gate. Both touch `snippets/schema-product.liquid` and **neither may merge independently of the technical SEO release gate.** Per Tim, reconcile the two onto one current-main implementation path rather than write a third schema rewrite — `T-006a` and `T-006b` should not be implemented again; `T-006c` and `T-006d` are what a third change would legitimately carry. Overlap review of #703: `docs/seo/t-006-pr-703-dependency-review.md`. Note that the reference-price decision at §0A.4 **requires changes to #703 as it stands** — its schema gate reads `compare_at_price`, which the decision disallows.

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

To be precise about the discovery consequence, since it is easy to overstate: `noindex,follow` **does** preserve link following, so page 2+ links are not cut off today. The risk is second-order — Google has indicated that long-term `noindex` pages tend to get crawled less over time, and a page carrying both signals is a candidate for reduced crawling, which would weaken discovery of products only reachable deep in pagination. That is a reason to resolve the contradiction, not a claim that discovery is currently broken. Worth measuring against `T-005` and `T-011` rather than assuming either way. ~~**Needs one documented position and Tim's GO.**~~

**DECIDED (Tim, 2026-08-08).** Ordinary `?page=n` collection pagination targets
**crawlable unique URLs with self-referencing canonicals**, subject to sampled validation
of product discovery and rendered links. `noindex` combined with a canonical to page 1 is
**not** the default posture and comes out. Filters, sort orders, tracking parameters and
every other parameter cohort stay separate decisions and still need sampled intent before
any `noindex`, canonical or robots change — this decision does not generalise to them.
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

**One measurement note, not a scope correction.** Representative URL 2 is described as "Tier-1 collection with Boost product grid and Judge.me." Boost is an app, injected as an app embed rather than through theme code, so its absence from the repository is expected and the scope description is correct — an earlier draft of this plan wrongly read that absence as a stale reference.

The useful consequence is a measurement one. **App-embed third parties cannot be inventoried from this repository**, which means two things for this batch: the per-template third-party table in `T-009` has to be built from the live request waterfall rather than from theme code, and the static assertions in `scripts/cwv_regression_test.py` are structurally blind to app-embed scripts — they can only see what is committed here. So Boost, Judge.me's own app payload, and anything else embedded through the app surface are invisible to the existing CI and must come from Lighthouse and the network panel. Worth stating before thresholds are set, so nobody reads a green static test as coverage of the app layer.

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

## 10. New tickets — approved into the plan by Tim, 2026-08-08

`T-017` through `T-020` were proposed in revision 2 and **approved as additions to the
plan** on August 8, for bounded implementation and preview work only. The sections below
are as written in revision 2, with each ticket's decision and current state recorded at
the top. Approval to prepare is not approval to merge.

### T-017 — Lighthouse / PSI user-agent gate suppresses vendor scripts *(P0 — approved; blocks T-009 and T-013)*

> **DECIDED (Tim, 2026-08-08) — remove the exemption; do not merge yet.** Lab testing must
> exercise the same Gorgias/Convert path customers receive. If a documented technical
> reason to keep the exemption emerges, run Lighthouse with an overridden user agent and
> put that reason in the PR evidence. **Change prepared** on
> `claude/seo-recovery-sprint-ctwbtp`; `cwv_regression_test.py` passes unchanged. Held
> behind `T-018` — see §0.3.

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

### T-018 — Convert installation architecture *(approved; BLOCKED — framing corrected)*

> **SUPERSEDED FRAMING — read §0A.2 first.** This section was written as "two Convert
> installations live in the same document." **That is wrong.** Per Tim's August 14
> decision the `cdn.9gtb.com` request is the **Gorgias Convert/Campaign bundle**, not a
> second Convert Experiences A/B-testing loader, and **no 9gtb or Gorgias removal is
> authorised.** The text below is retained only as the record of what was originally
> observed. The live blocker is the supported Convert Shopify target architecture and the
> six outstanding vendor confirmations listed at §0A.2. Customer experiment traffic stays
> at 0; no separate vendor thread.

*Original revision-2 text follows.*

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

### T-020 — Liquid syntax defect in three manuals templates *(approved; resolved to legacy cleanup)*

> **TESTED AND RESOLVED — see §0.4 for the evidence.** The endpoints were checked
> logged-out against production on 2026-08-13. The stray filter **does not error**:
> `?view=manual-item` carries it and renders its title correctly. The only endpoint that
> errors, `?view=manual-list`, fails on a different line for a different reason —
> `paginate` over an absent `related_collections` list. And **no live page calls any of
> these templates**: both `/pages/all-manuals` and the brand manuals pages render the
> newer table-based `main_page_manuals` section, and neither loads `custom-manuals.js`,
> the only consumer of these `?view=` endpoints. Per Tim's decision rule this is
> therefore **legacy cleanup, not a P0 customer issue.** The one-character fixes are
> prepared on the branch; deleting the legacy templates and sections outright is a
> separate decision and is not being taken here.

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

**All eight questions from revision 2 are answered.** They are kept below with their
resolutions so the record reads in one place, followed by the two new ones.

| # | Question from revision 2 | Resolution |
|---|---|---|
| 1 | `T-017` — remove the Lighthouse/PSI gate, or keep and document why? | **Remove.** Change prepared on the branch, not merged. Overridden user agent is the fallback if a documented reason to keep it emerges |
| 2 | Jake's assignments — confirm the reassignment to Zafran | **Confirmed.** One override note added at §0.1; brief and backlog are not rewritten row by row |
| 3 | `T-008` — pagination posture | **Crawlable unique URLs with self-referencing canonicals**, sampled validation required. `noindex` + canonical-to-page-1 comes out |
| 4 | `T-014` — `Google-Extended: Disallow: /` | **No change this sprint.** Separate policy decision after the crawler/log review; not an SEO-recovery requirement |
| 5 | `T-006c` — review system of record | **Judge.me.** `aggregateRating` only from an approved normalised source matching the visible rating and count; otherwise omit it |
| 6 | `T-019` — surface CI assertion changes? | **Yes** for thresholds, representative URLs, methodology or architecture. Routine alignment with an approved implementation is authorised. Never weaken a test to make a PR pass |
| 7 | `T-020` — pull the manuals views out as a customer-facing defect? | **No — tested, and nothing live calls them** (§0.4). Legacy cleanup |
| 8 | `T-018` — waiting on Convert | **Stays blocked.** No duplicate thread |

**Both questions raised at revision 3 are now answered too** (Tim, 2026-08-14):

| # | Question from revision 3 | Resolution |
|---|---|---|
| 9 | `T-006` — one source of record for the reference price | **`custom.retail_price`, for the visible price, the savings figure and the JSON-LD `ListPrice` alike**, and only when the verification flag, recorded source, effective date, last-reviewed date and identical visible/structured values all hold. **No `compare_at_price` fallback for `ListPrice`** unless separately substantiated. Full terms and the resulting required changes to PR #703 are at §0A.4 |
| 10 | `T-017` merge order | **Keep prepared and unmerged.** Do not merge ahead of the Convert target-architecture reconciliation; do not approve a final CWV baseline until that architecture is confirmed on an unpublished theme (§0A.2, §0A.5) |

**Nothing in this plan is currently waiting on a decision from Tim.** Everything open is
waiting on evidence, on the vendor, or on access — see §0A.5 and §0A.6.

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
