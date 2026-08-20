# specs_features Metaobject Audit Packet

**Thread:** Re: SEO Recommendation for Comparison Chart Pages
**Request:** Tim, 2026-08-16 (7 items) · chased by Umer, 2026-08-18
**Prepared by:** Yusra | Fitness Superstore · captured 2026-08-20 (UTC)
**Scope:** `specs_features` (MetaobjectDefinition/7246479676), live store + live theme
`fitnesssuperstore-shopify/main`

## Audit only — nothing was changed

No definition, entry, field, product assignment or theme file was created, edited, merged,
disconnected, archived or deleted. The only write issued against the store was
`bulkOperationRunQuery`, which is a read. Post-audit state is identical to pre-audit state:
**4,542 entries, all ACTIVE, 4,467 product references.**

## Headline numbers

| | |
|---|---|
| Entries in `specs_features` | **4,542** |
| Products referencing an entry (`custom.features_specs`) | **4,467** — 3,737 ACTIVE, 252 UNLISTED, 453 ARCHIVED, 25 DRAFT |
| Inbound reference paths into the definition | **1** (product metafield only — verified exhaustively) |
| Theme surfaces consuming it | 3 sections, reached from **15 product templates** |
| Orphans (zero back-references) | **85** |
| True duplicate pairs (same product, two records) | **27 groups / 53 records** |
| Records sharing byte-identical content across *different* products | **249** in 46 groups |
| Records shared by 2 products at once | **10** |
| Definition fields not bound anywhere in the live theme | **2** (`downloads_other_info`, `exercises`) |

## Dispositions (one per record — all 4,542 classified)

| Disposition | Records |
|---|---|
| KEEP | 3,965 |
| ARCHIVE CANDIDATE | 540 (68 clean orphans + 472 referenced only by non-live products) |
| HOLD | 20 (18 duplicate pairs live on both sides + 2 empty shells) |
| MERGE CANDIDATE | 17 |

**585 records require Tim's approval before any edit, merge, disconnect, archive or deletion.**

## The finding that outranks the cleanup

The store already contains a normalized successor definition, **`specs_features_new`**
(MetaobjectDefinition/16671998268, 3 entries), built on child metaobjects
(`pdp_sections`, `pdp_faq`, `pdp_table` → `pdp_table_headers` → `pdp_table_content`) and sharing
`specs_features`' own children `set_include` and `accessory`.

Two competing PDP data models across 4,542 products is a larger risk than any duplicate in this
packet. **Recommendation: Tim decides the target model before any cleanup starts** — finish the
`specs_features` → `specs_features_new` migration, or stop it and clean `specs_features` in place.
Who created `specs_features_new` should be established first.

## Files

| # | File | Tim's item |
|---|---|---|
| 00 | `00_README_audit_packet.md` | this summary |
| 01 | `01_specs_features_raw_export.jsonl` (32.7 MB, 9,009 objects) | **1** — verbatim backup: all 4,542 records, all 23 fields, full values, plus all 4,467 reference rows |
| 01 | `01_entries_export.csv` (4,542 rows) | **1** — readable export: handle, display name, status, dates, populated fields, and every referencing product |
| 01 | `01_definition_snapshot.json` | **1** — definition, all 23 field definitions, the metafield definition, both child definitions, and the successor definition |
| 02 | `02_dependency_reference_map.md` | **2** — full dependency map + the 3 coverage gaps to close |
| 02 | `02_theme_binding_map.csv` | **2** — every field → every theme file / template that reads it |
| 03 | `03_duplicates.csv` (303 rows) | **3** — duplicate + near-duplicate groups with exact field-level differences and a canonical pick per group |
| 04 | `04_orphans.csv` (85 rows) | **4** — orphans, each with the method used to prove non-reference |
| 05 | `05_dispositions.csv` (4,542 rows) | **5** — one disposition per record, with reason and risk |
| 06 | `06_canonical_structure_migration_rollback_validation.md` | **6** — canonical structure, 9-phase migration, rollback per phase, validation gates |
| 07 | `07_requires_tim_approval.csv` (585 rows) | **7** — exact records needing Tim's approval, priority-ordered, with the proposed action |

## Method

- Full export via Admin GraphQL `bulkOperationRunQuery` over
  `metaobjects(type:"specs_features")`, including `fields` and `referencedBy` with the referencer
  resolved (BulkOperation/7670953509180 — 9,009 objects, 32,716,863 bytes).
- Reference proof: every metafield definition on PRODUCT, PRODUCTVARIANT, COLLECTION, PAGE, ARTICLE
  and SHOP enumerated; all 111 metaobject definitions enumerated across 3 pages. `custom.features_specs`
  is the only definition store-wide validated against `MetaobjectDefinition/7246479676`, and all 4,467
  back-reference rows are `Product / custom.features_specs`.
- Theme proof: live theme (`fitnesssuperstore-shopify/main`) scanned for **both** direct Liquid reads
  and theme-editor dynamic-source bindings inside product template JSON. Liquid-only grep
  under-reports usage by 11 of 23 fields, so both paths were required.
- Duplicate detection: three independent keys — normalized `product_title`, handle-suffix family
  (`foo` vs `foo-1`), and a SHA-256 of all 22 content fields after Unicode NFKC normalization,
  HTML-tag stripping and whitespace collapse — then field-level diffing within each group.

## Known limits of this audit

Three surfaces could not be proven with the API access available and need a manual check in admin
before anything destructive runs. Details in `02_dependency_reference_map.md` §4.

1. **Installed apps** — `appInstallations` returns `access denied` on this connection, so apps and
   their scopes could not be listed. An app reading `custom.features_specs` via API would not appear
   in any theme file.
2. **Shopify Flow / automations** — not enumerable here.
3. **The 19 non-live themes** — only the live theme was scanned.

Until those three are cleared, the orphan and archive lists should be treated as *candidates*, which
is how they are labelled throughout.
