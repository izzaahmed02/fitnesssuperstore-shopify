# `specs_features` Metaobject — Audit Packet

**Store:** Fitness Superstore (`www.fitnesssuperstore.com`, Shopify Plus)
**Metaobject definition:** `specs_features` — "Specs & features" — `gid://shopify/MetaobjectDefinition/7246479676`
**Prepared by:** Saliha | Fitness Superstore
**Date:** August 20, 2026
**Scope:** AUDIT ONLY — non-destructive. No definitions, entries, products, or theme files were changed to produce this packet. Every action below is a *recommendation pending Tim's approval*.

> Requested by Tim (Aug 16) and followed up by Umer (Aug 18): a comprehensive, non-destructive audit of the `specs_features` metaobject before any cleanup.

---

## 0. How this audit was produced (method)

All figures are computed from live store data pulled read-only via the Shopify Admin GraphQL API on 2026-08-20:

1. **Definition + schema** — `metaobjectDefinition` query (fields, capabilities, access).
2. **All entries** — Admin **bulk operation** exporting all 4,542 `specs_features` entries with every field (full backup, `specs_full.jsonl`).
3. **All product assignments** — Admin **bulk operation** exporting all 6,472 products with their `custom.features_specs` metafield value.
4. **Reference proof** — enumerated every metafield definition on all owner types (PRODUCT, PRODUCTVARIANT, COLLECTION, PAGE, COMPANY, ORDER, CUSTOMER, LOCATION) and every one of the 60 metaobject definitions' field validations, to confirm which records point at `specs_features`.
5. **Theme references** — full-text scan of the theme repo (`izzaahmed02/fitnesssuperstore-shopify`).

Machine-readable companions in this folder: `specs_features_definition.json`, `duplicates.csv`, `orphans.csv`, `shared.csv`.

---

## 1. Backup / export (definitions, entries, references, assignments)

| Item | Value |
|---|---|
| Definition type | `specs_features` |
| Definition name | "Specs & features" |
| Definition ID | `gid://shopify/MetaobjectDefinition/7246479676` |
| Display name key | `product_title` (free-text — see §6, this is the root cause of duplicate ambiguity) |
| Total entries | **4,542** |
| Field count | 23 content fields (schema below) |
| Access | admin `PUBLIC_READ_WRITE`, storefront `PUBLIC_READ` |
| Capabilities | publishable ✅, translatable ✅, **onlineStore ❌ (disabled)**, **renderable ❌ (disabled)** |
| Full entry backup | `specs_full.jsonl` (4,542 records, all fields, ~27 MB — retained off-repo; regenerate any time via the bulk query in §0) |

**Field schema** (see `specs_features_definition.json` for types):
`product_title`, `all_in_one_overview`, `features`, `other_features`, `benefits`, `tech_specs`, `other_tech_specs`, `weight_stacks`, `comparison_chart_title`, `comparison_chart_table`, `other_comparison_charts`, `buying_guide`, `frequently_asked_questions`, `downloads_other_info`, `shipping_dims_weight_2`, `warranty_info`, `set_includes` (→ def `8537375036`), `accessories_included` (→ def `7246643516`), `accessory_feature`, `smith_bar_specs`, `list`, `shipping_dims_weight`, `exercises`.

**SEO note (this thread's origin):** because `onlineStore` and `renderable` capabilities are **disabled**, `specs_features` entries have **no standalone indexable URL**. They are surfaced only inside product pages (see §2). So duplicate/orphan spec records do **not** by themselves create duplicate indexable pages; the SEO exposure is indirect (duplicate comparison-table content rendered across multiple PDPs). This is a data-hygiene issue, not a live duplicate-URL issue.

---

## 2. Dependency / reference map

### 2a. The single reference path (proven)
The **only** thing that references a `specs_features` entry anywhere in the store is one product metafield:

- **`custom.features_specs`** — display name "Features & specs", type `metaobject_reference` → definition `7246479676`. Owner: **PRODUCT**. Cardinality: single reference (one product → at most one spec record).

Proven by exhaustive enumeration:
- No metafield definition on any other owner type references `7246479676`.
- No other metaobject definition (0 of the other 59) has a field pointing back into `7246479676`.
- 0 dangling references: every one of the 4,467 product assignments resolves to an entry that exists in the export.

### 2b. Theme consumption (repo `izzaahmed02/fitnesssuperstore-shopify`)
The theme reads the entry only through the product metafield, as `product.metafields.custom.features_specs.value.<field>`. Files that consume it:

| Type | File | References |
|---|---|---|
| Section | `sections/extra-info.liquid` | 10 |
| Section | `sections/main-product-comb.liquid` | 1 |
| Section | `sections/HGS-extra-info.liquid` | 1 |
| Template | `templates/product.json` (default PDP) | 14 |
| Template | `templates/product.variants.json` | 14 |
| Template | `templates/product.variants-pulley.json` | 14 |
| Template | `templates/product.shopify-product-option.json` | 14 |
| Template | `templates/product.combined-listings.json` | 14 |
| Template | `templates/product.customised-product.json` | 14 |
| Template | `templates/product.discontinued.json` | 14 |
| Template | `templates/product.boost-test.json` | 14 |
| Template | `templates/product.gift_cards.json` | 14 |
| Template | `templates/product.gym-package.json` | 9 |
| Template | `templates/product.byo-rig.json` | 9 |
| Template | `templates/product.home-gym-packages.json` | 8 |
| Template | `templates/product.mats-single-variant.json` | 7 |
| Template | `templates/product.mats-pdp.json` | 6 |
| Template | `templates/product.mats-multi-variant.json` | 6 |

No template accesses the metaobject directly by handle (`shop.metaobjects.specs_features`), so a spec record with no product attached is invisible to the storefront.

### 2c. Product assignments (join over all 6,472 products, all statuses)

| Metric | Count |
|---|---|
| Products in store | 6,472 (ACTIVE 3,750 · UNLISTED 2,228 · ARCHIVED 464 · DRAFT 30) |
| Products WITH `features_specs` set | **4,467** |
| Products WITHOUT `features_specs` | 2,005 |
| Distinct entries referenced by ≥1 product | 4,457 |
| Entries referenced by exactly 1 product | 4,447 |
| Entries shared by 2 products | 10 (see §4) |
| **Orphan entries (0 referencing products)** | **85** (see §4) |

Reconciliation (all internally consistent): 4,457 referenced + 85 orphan = 4,542 total. 4,447 single + 10 shared = 4,457 distinct referenced; 4,447 + (10×2) = 4,467 assignments. ✅

### 2d. Apps / automations (residual, cannot be fully proven from the API)
The Admin API + theme prove the paths above. What an audit **cannot** rule out from data alone: a third-party app or Shopify **Flow** automation that reads entries by handle/ID internally. Recommend Tim/Control Tower confirm no installed app or Flow writes/reads `specs_features` before any archive/delete. (This is the only open item in the orphan proof — see §4.)

---

## 3. Duplicate & near-duplicate analysis (with exact field-level differences)

Detection: exact `product_title` match, case-insensitive. Handles are unique (Shopify-enforced), so title is the only collision axis. Full per-field detail in `duplicates.csv`.

- **19 duplicate groups, 38 entries** involved (19 redundant records).
- Pattern: **18 of 19** are re-import twins — a base handle plus a `…-1` handle (e.g. `…-new` + `…-new-1`). In almost every group the product points at one twin and the other is an orphan.

Field-level difference summary per group (identical-field count / 23; which fields differ):

| Group (product_title) | Identical | Differing fields | Both live? |
|---|---|---|---|
| FSR100 Commercial Functional Smith Rack System (New) | 12/23 | overview, features, benefits, tech_specs, weight_stacks, comp-title, comp-table, buying_guide, FAQ, warranty, accessories | no |
| FSR50-AB Adjustable Bench (New) | 22/23 | warranty_info | no |
| Onyx Leverage Horizontal Bench Press Plate Loaded (New) | 20/23 | features, tech_specs, warranty | no |
| **Push / Pull Weight Sled (New)** | 20/23 | features, benefits, tech_specs | **YES ⚠** |
| Rubber Grip Olympic Plate 10 lbs Black (New) | 20/23 | features, other_features, other_tech_specs | no |
| Rubber Grip Weight Plate Set w/7ft Bar 235 lbs | 20/23 | features, tech_specs, other_tech_specs | no |
| Soft Medicine Wall Ball 6 lb (New) | 21/23 | other_tech_specs, shipping_dims_weight_2 | no |
| Tahoe Pec Fly / Rear Delt (New) | 14/23 | features, benefits, tech_specs, weight_stacks, comp-title, comp-table, buying_guide, FAQ, warranty | no |
| Tahoe Prone Leg Curl / Leg Extension (New) | 14/23 | (same 9 as above) | no |
| Tahoe Seated Leg Curl / Leg Extension (New) | 14/23 | (same 9 as above) | no |
| Urethane 8-Sided Hex Dumbbell Set 5-60 lbs – Blank (New) | 20/23 | features, other_tech_specs, warranty | no |
| Golden Designs GDI-8503-01 Savonlinna Sauna (New) | 22/23 | tech_specs | no |
| Hammer Strength 3 Tier Dumbbell Rack (Remanufactured) | 18/23 | features, benefits, tech_specs, buying_guide, FAQ | no |
| Life Fitness Integrity SE3 HD Elliptical (Remanufactured) | 21/23 | other_features, tech_specs | no |
| Nautilus Inspiration Vertical Row 9-IPVR5-60BZ (New) | 15/23 | features, other_features, tech_specs, weight_stacks, buying_guide, ship_2, warranty, ship | no |
| SportsArt T645L Performance Treadmill (New) | 22/23 | warranty_info | no |
| Stairmaster 8 Series Gauntlet X w/16" Touch Display (New) | 19/23 | features, other_features, tech_specs, shipping_dims_weight | no (near-dup, see note) |
| Star Trac 6 Series 6TR Treadmill w/16" Embedded Display – Black (New) | 21/23 | features, other_features | no (handle discrepancy, see note) |
| **Versaclimber ALXP Versa Climber (New)** | 22/23 | features | **YES ⚠** |

**Two groups need special attention (both records are live):**
- **Push / Pull Weight Sled (New)** — twin A (`…-sled-new`, entry `135486767420`) is on product `french-fitness-push-pull-weight-sled-new`; twin B (`…-sled-new-1`, entry `183262150972`) is on a **different** product `french-fitness-push-pull-weight-sled-v3-new`. Neither is an orphan → cannot archive either without repointing a product. **MERGE CANDIDATE.**
- **Versaclimber ALXP (New)** — twin A (`135764443452`) on `versaclimber-alxp-versa-climber-new`; twin B (`135764869436`) on `versaclimber-alxp-versa-climber-new-1`. Both live, differ only in `features`. **MERGE CANDIDATE.**

**Two data-quality flags inside the near-dup groups:**
- **Star Trac 6 Series 6TR** — the orphan twin's handle says `…w-24-embedded-display…` but the `product_title` says `16"`. Looks like a stale/incorrect record. Keep the 16" record (referenced); verify the 24" record is an error before archiving.
- **Stairmaster Gauntlet X** — the two twins have genuinely different handles (`…w-led-display…` vs `…w-16-touch-display…`). These may be two different console SKUs, not a pure duplicate. Merch to confirm before treating the LED one as redundant.

---

## 4. Unreferenced / orphaned records + method of proof

**85 orphan entries** — 0 products (of any status) reference them. Full list in `orphans.csv`.

**Proof they are unreferenced** (see §0/§2a): the join is over *all* 6,472 products across *all* statuses (including 464 archived + 2,228 unlisted + 30 draft), and `custom.features_specs` is the only reference path in the store (proven exhaustively). An orphan therefore has no product on any surface pointing at it. Residual caveat: a third-party app/Flow reading by handle cannot be ruled out from the API (§2d) — confirm before delete.

Breakdown:

| Bucket | Count | Notes |
|---|---|---|
| Orphan **twin of a duplicate group** | 17 | The redundant half of a re-import pair; archive with its group (§3). |
| Standalone orphan, **near-empty (≤2 filled fields)** | 4 | Includes a literal record titled **`test`**; strong archive candidates. |
| Standalone orphan, **populated (>2 filled fields)** | 64 | Real content, no product. Mostly a 2025-10-26 batch of Body-Solid and Star Trac 8/10-series "w/LCD" spec records that were never linked to products, plus stubs like "…Gym Package – Build Your Own Gym". **HOLD** — do not archive blindly; catalog/merch to confirm whether a product is coming or the record is abandoned. |

---

## 5. Shared records (referenced by more than one product)

**10 entries** are each referenced by exactly 2 products (full list in `shared.csv`). In every case the second product is a copy / open-box / archived twin of the first, e.g.:
- `…monster-universal-storage-system-new` + `…-test-copy`
- `…rig-rack-functional-training-cave-new` + `…-copy`
- `star-trac-8-series-rear-drive-elliptical…-new` + `…-oob`
- `french-fitness-strongman-sandbag-100-lb-new-archived` + `…-ships-empty-new`

**Disposition: KEEP — do NOT archive.** Archiving any of these breaks two products. The cleanup opportunity here is product-side (duplicate/test-copy *products*), which is out of scope for this metaobject audit but worth a separate ticket.

---

## 6. One disposition per record

Rule set applied (records reconcile to the 4,542 total):

| Disposition | Count | Definition / rule |
|---|---|---|
| **KEEP** | 4,453 | Referenced by ≥1 product and not a merge case. (4,457 referenced − 4 records belonging to the two both-live duplicate groups, counted under MERGE.) |
| **KEEP (shared)** | (subset of above, 10) | Referenced by 2 products — flagged separately in §5; must not be archived. |
| **MERGE CANDIDATE** | 4 | The 2 "both-live" duplicate groups × 2 records (Push/Pull Weight Sled, Versaclimber ALXP). Consolidate content, repoint one product, then archive the emptied record. |
| **ARCHIVE CANDIDATE** | 21 | 17 orphan duplicate-twins + 4 near-empty standalone orphans (incl. `test`). Low risk: 0 products, content ≤ its kept twin. |
| **HOLD** | 64 | Populated standalone orphans — real content, 0 products; needs catalog/merch verification before any action. |

Per-record detail lives in the three CSVs. Risk column: ARCHIVE-of-twins = LOW; MERGE (both live) = HIGH; HOLD = unknown until merch reviews.

---

## 7. Proposed canonical model, migration, rollback & validation

### 7a. Canonical naming & field structure (proposal — needs approval)
Root cause of the duplicates is that identity relies on free-text `product_title` and re-imports created `…-1` handles instead of updating in place.

1. **Identity = product, 1:1.** Treat one spec record per product, keyed to the product handle/SKU. Add a `product_handle` (or `sku`) field and make imports **upsert by that key** rather than create-new. This structurally prevents future `…-1` twins.
2. **Consolidate overlapping fields** (reduces near-dup ambiguity and editor confusion):
   - `shipping_dims_weight` + `shipping_dims_weight_2` → one field.
   - `features` + `other_features`, `tech_specs` + `other_tech_specs` → decide primary vs. overflow, or merge.
   - `warranty_info` (rich text here) vs. the separate `warranty_info` **metaobject** definition — pick one source of truth for warranty.
3. **Keep** `set_includes` / `accessories_included` as-is (valid outbound references to defs `8537375036` / `7246643516`).

### 7b. Migration sequence (only after Tim approval; do in a dev/preview theme first)
1. **Freeze** — pause any import/automation that writes `specs_features`.
2. **Re-export** a fresh full backup (repeat §0 step 2) immediately before any change.
3. **MERGE groups (4 records)** — copy the richer fields into the chosen canonical record, repoint the second product's `custom.features_specs`, verify both PDPs render, then move the emptied record to ARCHIVE.
4. **ARCHIVE the 21 candidates** — non-destructively first: unpublish (set entry status to draft) rather than delete. Leave for a cooling-off window (e.g. 30 days) to catch anything missed, then delete if clean.
5. **HOLD (64)** — route to catalog/merch; each either gets a product attached or is reclassified to ARCHIVE. No bulk action.
6. **Field consolidation** — schema change last, with a field-by-field data copy and theme updates in the same release.

### 7c. Rollback plan
- Every step is reversible from the pre-change backup (§0). Because "archive" = set to draft (not delete) in step 4, rollback is flipping status back — no data loss.
- Product repointing (step 3) is a single metafield value per product; the previous value is recorded in `duplicates.csv` / the backup, so it can be restored exactly.
- Do all theme-facing changes in a **duplicated preview theme**; publish only after validation. Keep the prior theme version to revert instantly.

### 7d. Validation plan
- **Pre/post counts:** entries total, orphan count, duplicate-group count all move as predicted (e.g. orphans 85 → 68 after archiving the 17 twins; duplicate groups 19 → 0 after merges).
- **Zero dangling refs:** re-run the product↔entry join; every `custom.features_specs` value must still resolve. Must stay 0.
- **PDP render check:** spot-check the specific PDPs touched in the MERGE step, plus one PDP per affected template in §2b, for spec/comparison-table rendering.
- **Screaming Frog crawl** of affected PDPs (same tool the team used for the `target="_blank"` work) to confirm no new 404s/broken internal links from the comparison tables.

---

## 8. Records requiring Tim's approval before ANY edit / merge / disconnect / archive / delete

Per the Aug 16 instruction, **nothing** below is actioned yet. Explicit approval gates:

1. **MERGE — HIGH priority / HIGH risk (2 groups, 4 records):** Push/Pull Weight Sled (`135486767420` + `183262150972`) and Versaclimber ALXP (`135764443452` + `135764869436`). Both twins are live on different products; needs Tim's call on which record is canonical and sign-off to repoint a product.
2. **ARCHIVE — LOW risk (21 records):** the 17 duplicate orphan-twins + 4 near-empty orphans (incl. `test`). Listed in `duplicates.csv` (rows marked ARCHIVE CANDIDATE) and `orphans.csv`.
3. **HOLD — needs merch decision, then approval (64 records):** populated standalone orphans in `orphans.csv`. No archive without a catalog/merch verdict per record.
4. **Data-quality verifications before archiving:** Star Trac 6 Series "24-embedded-display" handle vs "16"" title; Stairmaster Gauntlet X "LED" vs "16" touch" (possible distinct SKU).
5. **Schema change (§7a):** field consolidation + adding a product-keyed identity/upsert is a definition-level change — Tim + Control Tower approval required.
6. **App/Flow confirmation (§2d):** Tim/Control Tower to confirm no installed app or Flow depends on `specs_features` before any delete.

**Nothing in the KEEP or KEEP-shared set (§5) should be edited, disconnected, or archived.**

---

*Appendix files in this folder: `specs_features_definition.json` (schema backup), `duplicates.csv` (38 records, field-level diffs + dispositions), `orphans.csv` (85 records + reason), `shared.csv` (10 records). Full 4,542-entry JSONL backup regenerable via the §0 bulk query.*
