# 06 — Proposed Canonical Structure, Migration Sequence, Rollback Plan, Validation Plan

Nothing in this document has been executed. `specs_features` is untouched: 4,546 entries, all ACTIVE,
same definition and same product assignments as before the audit.

---

## A. Important finding before any structure is proposed

The store **already contains a normalized successor**: `specs_features_new`
(`MetaobjectDefinition/16671998268`, 3 entries), created with a child-metaobject structure:

```
specs_features_new
  ├── other_features            → pdp_sections   (16672489788, 6 entries)
  ├── other_features_table      → pdp_table      (16673407292, 7 entries)
  │                                 └── table_headers → pdp_table_headers (16673145148, 13)
  │                                       └── content → pdp_table_content (16673210684, 106)
  ├── other_tech_specs          → pdp_sections
  ├── other_tech_specs_table    → pdp_table
  ├── side_by_side_comparison   → pdp_table
  ├── extra_content             → pdp_sections
  ├── buying_guide              → pdp_sections
  ├── frequently_asked_questions→ pdp_faq        (16672620860, 4 entries)
  ├── shipping_dimensions_weight→ pdp_table
  ├── set_includes              → set_include    (shared with specs_features)
  └── accessories_included      → accessory      (shared with specs_features)
```

**Recommendation: do not design a third structure.** The canonical target should be
`specs_features_new`, and the decision Tim actually needs to make is *"do we finish the
specs_features → specs_features_new migration, or do we stop it and clean up specs_features in
place?"* Two competing PDP data models on 4,546 products is a bigger risk than any duplicate in
this packet. Whoever created `specs_features_new` should be identified before either path starts.

## B. Proposed canonical naming / field structure for `specs_features` (in-place option)

If the answer is "clean up in place", these are the only structural changes worth making. All are
additive or rename-only; none deletes content.

| # | Change | Why | Records touched |
|---|---|---|---|
| B1 | Add a definition `description` and per-field descriptions | Definition is undocumented; field names like `list` and `other_features` are unguessable | 0 |
| B2 | Rename `shipping_dims_weight_2` → `shipping_dimensions_weight`, and retire `shipping_dims_weight` after migrating its 341 values into it | Two fields, one concept, different types (rich text vs multi-line) | 341 |
| B3 | Rename `list` → `additional_list` | `list` collides with the Liquid keyword and is meaningless in admin | 10 |
| B4 | Deprecate `downloads_other_info` **only** | Bound in no theme at all (verified across all 80 themes, file 10). 1 populated record. **`exercises` was originally in this row and has been removed: it is bound in an in-progress PDP rebuild — see file 10.** | 1 |
| B5 | Set `product_title` to required | It is the `displayNameKey`; a blank one makes the record unfindable in admin | 0 |
| B6 | Normalize `comparison_chart_table`, `buying_guide`, `frequently_asked_questions` from raw multi-line blobs to the `pdp_table` / `pdp_sections` / `pdp_faq` children already in the store | Same target as `specs_features_new`; makes the two models converge instead of diverge | up to 973 |

**Note on renames:** a Shopify metaobject field `key` cannot be renamed in place. B2/B3 mean *add the
new key, copy values, repoint theme bindings, then remove the old key* — which is why they are staged
separately below.

## C. Migration sequence

Every phase ends in a checkpoint. Nothing in Phase 0–2 changes a live PDP.

**Phase 0 — close the coverage gaps (no writes).** Confirm the three unknowns from
`02_dependency_reference_map.md` §4: installed apps reading `custom.features_specs`, Shopify Flow
automations, and the 19 non-live themes. Tim/Izza sign-off that the reference map is complete.

**Phase 1 — decide the target model (no writes).** Tim decides: finish `specs_features_new`, or clean
up `specs_features` in place. Everything after this branches on that answer. *Blocking.*

**Phase 2 — re-export immediately before any write (no writes).** Re-run the bulk export in this
packet. `01_specs_features_raw_export.jsonl` is the 2026-09-01 baseline; a same-day export is the
actual rollback source. Store it outside the container (Drive), plus a Matrixify metaobject export as
a second, admin-importable copy.

**Phase 3 — the 70 clean orphans.** 70 records with zero back-references and no duplicate twin.
Sequence: (a) confirm still zero references at execution time, (b) set `publishable` status to DRAFT —
*not* delete — (c) wait 14 days, (d) delete only if nothing regressed. DRAFT is the reversible step;
deletion is not. Requires Tim approval (`07_requires_tim_approval.csv`).

**Phase 4 — the 17 true-duplicate merge candidates.** Each is an unreferenced `…-1` twin of a
referenced canonical record. Per pair: diff the fields (already computed in `03_duplicates.csv`), copy
into the canonical only the fields where the canonical is empty and the twin is populated, verify the
canonical's PDP renders, then DRAFT the twin. One pair at a time, never batched.

**Phase 5 — the 20 HOLD records.** 18 are true-duplicate pairs where *both* records are live on
products, plus 2 empty shells. These need a content decision from Larianne/Tim per pair before any
merge. Do not touch them in a bulk pass.

**Phase 6 — the 477 non-live-only records.** Referenced only by ARCHIVED / UNLISTED / DRAFT products.
Lowest value, highest chance of a surprise (a product gets reactivated and loses its content). Do this
last, DRAFT-only, and only after Phase 3 has been stable for a full cycle.

**Phase 7 — structural changes B1–B6.** Definition and field work, after the record count is stable.
Add-new-key → backfill → repoint theme bindings on an unpublished theme → publish → remove old key.

**Phase 8 — the 249 identical-content records.** *Not* a migration. 46 groups of distinct products
sharing byte-identical boilerplate — the largest is 36 Body-Solid hex dumbbells with the same 2 fields.
This is a copy-writing backlog for the content team (and an SEO duplicate-content exposure worth
raising with Jim), not a merge.

## D. Rollback plan

| Phase | Rollback |
|---|---|
| 3, 4, 6 (DRAFT a record) | Set `publishable` status back to ACTIVE. Fully reversible, no data loss, seconds. |
| 3, 4, 6 (delete a record) | Re-create from the JSONL export via `metaobjectCreate`, then re-point the product metafield. **The handle and the metaobject GID are not recoverable** — any external system holding the old GID breaks. This is why deletion is gated behind a 14-day DRAFT window. |
| 4 (field copied into canonical) | Restore that field's prior value from the export. Field-level, low risk. |
| 7 (field added) | Delete the added field definition. |
| 7 (field removed) | Re-add the field definition and re-import values from the export. |
| 7 (theme binding change) | Theme changes are staged on an unpublished theme; rollback is publishing the previous theme version. |

Hard rules for the whole migration:
- Never run a delete in the same session as the export that backs it up.
- Never batch more than 25 records per write pass; verify between passes.
- No `metaobjectBulkDelete` on this definition, at any phase.
- The two child definitions `set_include` (755) and `accessory` (225) are **shared with
  `specs_features_new`** — they must not be cleaned up as part of a `specs_features` migration.

## E. Validation plan

**Before each write pass**
1. Re-run the reference query for the exact records in the pass — reference state can change between
   audit and execution.
2. Screenshot the PDP of every affected product (and, for the 10 shared records, *both* PDPs).

**After each write pass**
3. Re-run the bulk export; assert entry count fell by exactly the number DRAFTed/deleted, and that
   `custom.features_specs` `metafieldsCount` fell by exactly the number of intentional disconnects.
4. Assert zero products have a `custom.features_specs` metafield resolving to null.
5. Load each affected PDP and confirm the Specs / Features / Tech Specs / Warranty / Buying Guide /
   FAQ / Comparison Chart blocks still render.
6. **Screaming Frog crawl of the affected product URLs** — same tool already used in this thread for
   the `target="_blank"` verification — checking for new 404s, empty content blocks and word-count
   drops versus the pre-change crawl.
7. Google Search Console: watch Coverage and Core Web Vitals for the affected URLs for 14 days.

**Release gate.** A phase is only complete when items 3–6 are clean and 14 days have passed with no
regression in GSC. Only then does the next phase start.
