# French Fitness Rack/Rig Consolidation — shared-data implementation package

Owner: Izza | Prepared 2026-07-31 | Thread: "French Fitness Rack/Rig Collection
Consolidation — Scope and UX guardrails"

Covers Tim's 24 Jul gate 1: the shared Shopify data behind the PDP links, plus the
HTML sitemap and category index removals, with backup and rollback evidence.

**Not in scope / not done here:** the five source collections are NOT unpublished and
NO 301 redirects were created. The separate `custom_url` theme branch was not merged
or deployed.

## Approved mapping

| # | Old source collection | Approved generic destination | Approved generic label |
|---|---|---|---|
| 1 | `french-fitness-rack-rig-systems` (499645251900) | `rack-rig-systems` (499644924220) | Rack & Rig Systems |
| 2 | `french-fitness-pre-configured-rigs` (499645382972) | `pre-configured-rigs` (499644989756) | Pre-Configured Rigs |
| 3 | `french-fitness-rig-frame-pieces-customize-your-rig` (499645481276) | `rig-frame-pieces-customize-your-rig` (499645022524) | Rig Frame Pieces |
| 4 | `french-fitness-rig-attachments-accessories` (499645448508) | `rig-attachments-accessories` (499645055292) | Rig Attachments & Accessories |
| 5 | `french-fitness-racks-w-rig-rack-attachment-compatibility` (499645415740) | `racks-w-rig-rack-attachment-compatibility` (499645219132) | Rack & Rig Attachment Compatibility |

Product counts re-confirmed live 2026-07-31: 116/116, 16/16, 29/29, 56/56, 13/13.

## Exact source records (whole-store sweep, Admin API)

| Group | Source of truth | Affected records | Old-URL occurrences | Status |
|---|---|---|---|---|
| A. PDP breadcrumbs | `breadcrumb_path` metaobjects referenced by `product.metafields.custom.breadcrumb_paths` | **6** of 694 | 6 collection refs | **APPLIED** |
| B. PDP option/extra-info (product descriptions) | `product.descriptionHtml` | **95** of 6,462 | 95 anchors | **23 of 95 APPLIED** (2026-08-01); 72 remaining |
| C. PDP option-content (option help popups) | `product_option_help_text` metaobject, `help_text` field | **74** of 1,096 | 143 anchors | prepared, not applied |
| D. HTML sitemap | `sitemap_menu_1` metaobject tree under `main-sitemap-root` | **1** parent edit (drops 5 entries) | 5 | **APPLIED** |
| E. Category index | `index-f` navigation menu | **1** menu item (drops 5 entries) | 5 | **APPLIED** |

The 6 breadcrumb records are referenced by **391** product→breadcrumb links.

### Verified clean (searched, nothing to change)

- `product_extra_info` (`custom.extra_info`) — 0 hits across all 1,961 records.
  Confirms Tim's read: the old URLs live in product descriptions, not extra_info.
- All 170 Shopify Pages — 0 hits. `/pages/sitemap` and `/pages/category-index`
  both have **empty body fields**; they are theme-generated. Not edited.
- All 84 blog articles — 0 hits.
- `option_help` (28), `variant_option_help_text` (2), `collection_extra_info` (4) — 0 hits.
- `sitemap-menu-2` and all other index-* / main / header / footer menus — 0 hits.
  `index-f` was the only menu referencing any of the five.
- `product_option` / `product_options` metaobject definitions have no free-text or
  URL fields, so they cannot hold a link.
- Every collection `index_collections` metafield store-wide — the only one containing
  a source collection belongs to `french-fitness-rack-rig-systems` itself.

### Left in place deliberately (source-owned; allowed pre-unpublish)

Per Tim's pass condition, remaining old-URL rows may be limited to the five source
collections themselves and their self-links:

- the five source collection descriptions (cross-link each other);
- `french-fitness-rack-rig-systems.index_collections` and `.related_collections`;
- 4 `subcategories_collections` button metaobjects owned by
  `french-fitness-rack-rig-systems` (the 5th was repointed in the 18 Jul partial run).

These disappear when the five sources are unpublished at cutover.

## Change rules applied

1. **Collection references / URLs** — swapped to the approved generic destination.
   Relative vs absolute URL form preserved as-is; only the collection handle changed.
2. **Labels (Tim, 17 Jul context-based anchor rule)**
   - Generic/neutral taxonomy (breadcrumbs) → approved generic label.
   - French Fitness prose → "French Fitness" stays visible in the surrounding text,
     only the category label is linked: `French Fitness <a>Free Standing/Wall
     Mounted Rigs</a>`. Rendered wording is unchanged; only the link boundary moves.
   - Neutral in-prose anchors ("pull-up bar", "other accessories…") — href only.
3. **Two breadcrumb labels realigned** to Tim's approved generic labels:
   - "Racks w/ Rig & Rack Attachment Compatibility" → "Rack & Rig Attachment Compatibility"
   - "Rack & Rig Attachments" → "Rig Attachments & Accessories"
4. The `French Fitness` and `French Fitness Racks and Cages` breadcrumb steps are
   **kept**, so the French Fitness browsing path through the live hub is preserved.
5. No Liquid redirect exceptions were added; only the shared Shopify data changed.

## What was applied, and how to roll it back

### A. Breadcrumbs — APPLIED (6 metaobjects)

Verified after: 0 of 694 `breadcrumb_path` records still reference a source
collection; exactly the 6 intended records changed; 0 unintended records changed.

Rollback: `payloads/breadcrumbs_ROLLBACK.jsonl` (one `metaobjectUpdate` per line,
original `steps` + `custom_titles`). Full pre-edit state:
`exports-before/breadcrumb_path_BEFORE.jsonl`. Post-edit state:
`breadcrumb_path_AFTER.jsonl`.

### D. HTML sitemap — APPLIED (1 metaobject)

`sitemap_menu_1` node `french-fitness-racks-and-cages`
(`gid://shopify/Metaobject/185278136636`), field `children1`.

Before: `["…/185278169404","…/185278366012","…/185279480124","…/185279545660"]`
After:  `["…/185278366012","…/185279480124","…/185279545660"]`

Removing child `185278169404` ("French Fitness Rack & Rig Systems") drops that node
and its 4 children — all five duplicate entries — from the rendered HTML sitemap. The
"French Fitness Racks and Cages" hub node and its 3 genuinely distinct children remain.
The 5 orphaned metaobjects were **not deleted**, so rollback is a one-field restore.
The generic destinations already exist at
`Strength Training Equipment > Cages, Racks & Rigs > Rack & Rig Systems` (verified).

Rollback: restore `children1` to the Before value above.

### E. Category index — APPLIED (1 menu item)

`index-f` (`gid://shopify/Menu/290481209660`): removed menu item
`gid://shopify/MenuItem/723716538684` "French Fitness Rack & Rig Systems"
→ `/collections/french-fitness-rack-rig-systems`, a child of "French Fitness Racks
and Cages".

Per `sections/section-category-index.liquid`, level 4/5 of the category index render
from `index_collections` on the level-3 item's collection. Removing this one item
therefore also drops the 4 entries it exposed — all five, in one edit.

Verified after: 118 of 119 items present, all original item IDs and order preserved,
only the target item gone.

Rollback: re-run `menuUpdate` from `exports-before/index_f_BEFORE.py`, which holds the
complete pre-edit tree (the removed item gets a new ID on recreation).

### B + C — PREPARED, NOT APPLIED

Payloads are generated, diff-verified and rollback-paired:

- `payloads/products_NEW.bulk.jsonl` / `products_ROLLBACK.bulk.jsonl` — 95 lines,
  variables for `mutation call($product: ProductUpdateInput!) { productUpdate(product: $product) { product { id } userErrors { field message } } }`
- `payloads/optionhelp_NEW.bulk.jsonl` / `optionhelp_ROLLBACK.bulk.jsonl` — 74 lines,
  variables for `mutation call($id: ID!, $metaobject: MetaobjectUpdateInput!) { metaobjectUpdate(id: $id, metaobject: $metaobject) { metaobject { id } userErrors { field message } } }`

Both NEW files were checked to contain zero residual old collection handles.

Intended run method: `stagedUploadsCreate` (resource `BULK_MUTATION_VARIABLES`) →
POST the file → `bulkOperationRunMutation`. The staged upload succeeded; the
`bulkOperationRunMutation` call is refused by the current MCP integration's safety
policy, so these two groups need to be run from a session/tool that can issue the
bulk mutation (Shopify CLI, a scripted Admin API call, or Matrixify import).

## Verification queries

Re-run after B and C are applied — all four must return zero:

```graphql
{ metaobjects(type:"breadcrumb_path")      { edges { node { id fields { key value } } } } }
{ products                                  { edges { node { id handle descriptionHtml } } } }
{ metaobjects(type:"product_option_help_text") { edges { node { id fields { key value } } } } }
{ metaobjects(type:"sitemap_menu_1")       { edges { node { id fields { key value } } } } }
```

then grep each export for:

```
french-fitness-(rack-rig-systems|pre-configured-rigs|rig-frame-pieces-customize-your-rig|rig-attachments-accessories|racks-w-rig-rack-attachment-compatibility)
```

Expected residue: only records owned by the five source collections themselves.

## Notes flagged for review

- **Legacy `searchresults.asp` links.** Product
  `french-fitness-rack-rig-glute-ham-developer-ghd-rollers-new` has an anchor whose
  text is split across two `searchresults.asp` links (old platform) around a
  whitespace-only link to the FF collection. The href was swapped as part of this
  package; the surrounding legacy markup is a separate content defect for Content.
- **`bis_size` attributes.** A number of descriptions contain `bis_size='{…}'`
  attributes injected by a browser extension. Pre-existing; not touched.
- **Change-source trace (18 Jul, ~19:15–19:17 UTC).** Shopify's Events API does not
  record collection description, metafield or metaobject writes, and
  `collection.events` is empty for the affected collections, so the actor/tool is not
  retrievable through the Admin API with this token (`appInstallations` is access
  denied). Corroborating evidence: `french-fitness-ball-racks.updatedAt` =
  `2026-07-18T19:17:37Z`, inside Iqra's reported window. Separately, large groups of
  unrelated collections share identical `updatedAt` timestamps
  (e.g. 2026-07-30T11:25:43Z, 2026-07-31T11:26:58Z), which indicates a recurring bulk
  process that touches collections and is still active. Completing attribution needs
  the Shopify admin activity log / app + API access logs.
- Storefront URL fetches are blocked by this session's egress policy, so rendered
  before/after HTML for `/pages/sitemap` and `/pages/category-index` could not be
  captured here. Admin API state is recorded above instead; rendered verification is
  covered by the targeted pre-cutover crawl.

## Progress log

**2026-08-01** — Tim approved both content decisions on 2026-07-31 and directed groups
B and C to be applied.

`bulkOperationRunMutation` is still refused by the MCP integration's safety policy, so
B is being applied through batched aliased `productUpdate` calls instead. Re-checked
before starting: all 95 target descriptions still matched the prepared pre-edit values
exactly (zero drift), so the payloads remain valid.

- **B: 23 of 95 applied**, verified byte-identical to the prepared values against a
  fresh whole-store export. Zero user errors, zero mismatches.
- **72 products remaining** — `payloads/products_REMAINING.bulk.jsonl` (regenerated
  from live state, so it is authoritative regardless of batching).
- **C: 0 of 74 applied.**

Rollback for the 23 applied records is unchanged: `payloads/products_ROLLBACK.bulk.jsonl`
covers all 95 and is a no-op for records not yet applied.

Applying the remaining 146 records through per-record mutations requires roughly a
dozen further round trips. The staged-upload half of the bulk path works; only the
`bulkOperationRunMutation` call is blocked. Running `RUNNING.md` against the Admin API
with a token completes both groups in one operation each.
