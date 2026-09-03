# Group C Matrixify v2 correction — 2026-09-03

Canonical Gmail thread: **French Fitness Rack/Rig Collection Consolidation — Scope and UX guardrails**

## Decision

The first remaining-58 workbook is superseded for import use. It used the four-column layout:

```text
ID | Handle | Type | Field: help_text
```

Iqra correctly ran a dry run and stopped. Matrixify job `#738683891` returned:

- 58 failed / 0 updated;
- `Type` and `Field: help_text` reported as unknown columns;
- `ID (Ref)` blank on all 58 rows; and
- `MERGE: "Definition: Handle" is required when creating Metaobject.`

Dry Run was ON, so nothing was written.

## Root cause

Matrixify's current Metaobjects row import uses:

```text
ID | Handle | Command | Definition: Handle | Field | Value
```

Official column reference:
https://matrixify.app/documentation/metaobjects/

The metaobject definition was rechecked live in Shopify:

- Definition handle: `product_option_help_text`
- Field key: `help_text`
- Field type: `multi_line_text_field`

## Controlled correction

`build_groupc_matrixify_v2.py` converts the already-approved 74-row update/rollback CSV pair and excludes only the 16 records already updated live. It writes a matched 58-row CSV pair with:

- numeric `ID` retained;
- `Handle` retained for debugging;
- `Command = UPDATE` on every row, so a missing/unmatched entry fails instead of being created;
- `Definition: Handle = product_option_help_text`;
- `Field = help_text`;
- only the approved HTML in `Value`; and
- no status, title, related-products, help-text-type, class-name, or other field.

The script validates:

- 74 unique source identities;
- exact update/rollback identity parity;
- the exact 16 already-applied IDs;
- 58 unique remaining identities;
- zero obsolete collection-handle references in the update values; and
- 123 original obsolete references retained in the matching rollback values.

## Required gate

Run a new Matrixify dry run using the v2 update file. Required result:

```text
58 updates
0 new
0 deletes
0 failed
0 unknown columns
```

Stop without importing on any other result. If clean, import the same v2 update file and retain the matching v2 rollback beside it.

After import:

1. Saliha independently verifies all 74 Group C records and zero obsolete Group C handles.
2. Izza runs the whole-store verifier and confirms the five source collections are still published and no redirects exist.
3. Zafran runs one JavaScript-rendered targeted crawl.
4. Iqra saves the final dated source/target count-and-handle snapshot.
5. Umer / Control Tower posts one consolidated `READY FOR TIM CUTOVER GO` status in the original Gmail thread.

The five source collections must **not** be unpublished and the five redirects must **not** be created until Tim gives the separate explicit cutover GO.
