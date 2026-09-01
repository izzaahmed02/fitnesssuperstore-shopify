# specs_features Metaobject Audit Packet

**Thread:** Re: SEO Recommendation for Comparison Chart Pages
**Request:** Tim, 2026-08-16 (7 items) · chased by Umer, 2026-08-18
**Prepared by:** Yusra | Fitness Superstore · captured 2026-09-01 (UTC)
**Scope:** `specs_features` (MetaobjectDefinition/7246479676), live store + live theme
`fitnesssuperstore-shopify/main`

## Audit only — nothing was changed

No definition, entry, field, product assignment or theme file was created, edited, merged,
disconnected, archived or deleted. The only write issued against the store was
`bulkOperationRunQuery`, which is a read. Post-audit state is identical to pre-audit state:
**4,546 entries, all ACTIVE, 4,469 product references.**

## One item outside the seven

While re-reading this thread's own attachments I checked the previously-closed `target="_blank"`
work against the CSVs actually attached to it. The 2026-04-05 "all blog posts are fixed" confirmation
was based on a crawl of 49 of the 86 known blog URLs; 15 posts that were broken on 2026-03-31 were
never re-crawled. All 15 are clean today. But a full sweep of all 84 articles found **one published
post still carrying three `target="_blank"` links** — it postdates both crawls. Details, and why it
may be a legitimate exception, are in file 08. Nothing was changed.

## Headline numbers

| | |
|---|---|
| Entries in `specs_features` | **4,546** |
| Products referencing an entry (`custom.features_specs`) | **4,469** — 3,736 ACTIVE, 250 UNLISTED, 453 ARCHIVED, 30 DRAFT |
| Inbound reference paths into the definition | **1** (product metafield only — verified exhaustively) |
| Theme surfaces consuming it | 3 sections, reached from **15 product templates** |
| Orphans (zero back-references) | **87** |
| True duplicate pairs (same product, two records) | **27 groups / 53 records** |
| Records sharing byte-identical content across *different* products | **249** in 46 groups |
| Records shared by 2 products at once | **10** |
| Definition fields not bound anywhere in the live theme | **2** (`downloads_other_info`, `exercises`) |

## Dispositions (one per record — all 4,546 classified)

| Disposition | Records |
|---|---|
| KEEP | 3,962 |
| ARCHIVE CANDIDATE | 547 (70 clean orphans + 477 referenced only by non-live products) |
| HOLD | 20 (18 duplicate pairs live on both sides + 2 empty shells) |
| MERGE CANDIDATE | 17 |

**592 records require Tim's approval before any edit, merge, disconnect, archive or deletion.**

## The finding that outranks the cleanup

The store already contains a normalized successor definition, **`specs_features_new`**
(MetaobjectDefinition/16671998268, 3 entries), built on child metaobjects
(`pdp_sections`, `pdp_faq`, `pdp_table` → `pdp_table_headers` → `pdp_table_content`) and sharing
`specs_features`' own children `set_include` and `accessory`.

Two competing PDP data models across 4,546 products is a larger risk than any duplicate in this
packet. **Recommendation: Tim decides the target model before any cleanup starts** — finish the
`specs_features` → `specs_features_new` migration, or stop it and clean `specs_features` in place.
Who created `specs_features_new` should be established first.

## Files

| # | File | Tim's item |
|---|---|---|
| 00 | `00_README_audit_packet.md` | this summary |
| 01 | `01_specs_features_raw_export.jsonl` (32.7 MB, 9,015 objects) | **1** — verbatim backup: all 4,546 records, all 23 fields, full values, plus all 4,469 reference rows |
| 01 | `01_entries_export.csv` (4,546 rows) | **1** — readable export: handle, display name, status, dates, populated fields, and every referencing product |
| 01 | `01_definition_snapshot.json` | **1** — definition, all 23 field definitions, the metafield definition, both child definitions, and the successor definition |
| 02 | `02_dependency_reference_map.md` | **2** — full dependency map + the 3 coverage gaps to close |
| 02 | `02_theme_binding_map.csv` | **2** — every field → every theme file / template that reads it |
| 03 | `03_duplicates.csv` (303 rows) | **3** — duplicate + near-duplicate groups with exact field-level differences and a canonical pick per group |
| 04 | `04_orphans.csv` (87 rows) | **4** — orphans, each with the method used to prove non-reference |
| 05 | `05_dispositions.csv` (4,546 rows) | **5** — one disposition per record, with reason and risk |
| 06 | `06_canonical_structure_migration_rollback_validation.md` | **6** — canonical structure, 9-phase migration, rollback per phase, validation gates |
| 07 | `07_requires_tim_approval.csv` (592 rows) | **7** — exact records needing Tim's approval, priority-ordered, with the proposed action |
| 08 | `08_addendum_external_link_cleanup_verification.md` | not requested — verification of the previously-closed `target="_blank"` item, including one published blog post that still carries it |
| 09 | `09_phase0_closing_the_coverage_gaps.md` | Phase 0 runbook — closes the app gap, corrects the theme count 19 → 79, and gives step-by-step for Flow/Make/n8n, the theme scan, and a proper full-domain crawl |

## Method

- Full export via Admin GraphQL `bulkOperationRunQuery` over
  `metaobjects(type:"specs_features")`, including `fields` and `referencedBy` with the referencer
  resolved (BulkOperation/7725072646460 — 9,015 objects, 32,726,819 bytes).
- Reference proof: every metafield definition on PRODUCT, PRODUCTVARIANT, COLLECTION, PAGE, ARTICLE
  and SHOP enumerated; all 111 metaobject definitions enumerated across 3 pages. `custom.features_specs`
  is the only definition store-wide validated against `MetaobjectDefinition/7246479676`, and all 4,469
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

1. ~~**Installed apps**~~ — **CLOSED, see file 09.** The packet originally recorded `access denied`
   here; that was a transient error I did not retry. Re-run 2026-09-01 it works. 47 apps installed,
   **20 hold `read_metaobjects`** and could read this data.
2. **Shopify Flow / automations** — still open, and genuinely manual: Flow workflows are not exposed
   in the Admin API. Make and n8n are installed too and need the same review. Steps in file 09.
3. **The non-live themes** — still open. Correction: there are **79**, not 19 (the original figure
   came from a query that returned only the first 20 themes). Theme file bodies *are* readable via
   the Admin API, so this is scriptable rather than manual. Steps in file 09.

Until items 2 and 3 are cleared, the orphan and archive lists should be treated as *candidates*,
which is how they are labelled throughout. File 09 is the runbook for closing them.
