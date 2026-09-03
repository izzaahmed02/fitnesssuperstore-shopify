# Source-Locked French Fitness Comparison Preview

Status: **DRAFT / REVIEW ONLY / DO NOT MERGE OR PUBLISH**

This branch contains a non-runtime preview for the existing indexed article:

`/blogs/comparisons/french-fitness-dual-adjustable-pulley-functional-trainers-comparison`

## What ChatGPT completed

- Reconciled the full current Shopify collection denominator: **29 product records**.
- Selected **8 representative buying-path rows** covering **9 active product records**.
- Built a field-level source register with **112 source-lock rows**.
- Corrected the submitted employee draft, which contained blank denominator decisions, placeholder source rows, four incomplete model rows, an incorrect FFS-DAP status, and an incorrect DAP50 SKU.
- Created an unpublished Shopify article preview; the existing indexed article was not changed.

## Eight comparison rows

1. FFB/FFS Dual Adjustable Pulley color family — `FFB-DAP` / `FFS-DAP`
2. DAP50 compact DAP — `FF-DAP50`
3. Telluride open-arm crossover — `FF-TRIDE-DCC`
4. Wall-mounted rack functional trainer 1:1 — `FF-WMRFT11`
5. Wall-mounted rack functional trainer 2:1 — `FF-WMRFT21`
6. SRFT8 freestanding rack functional trainer — `FF-SRFT8`
7. FSR90 non-counterbalanced Smith all-in-one — `FF-FSR90`
8. FSR110 counterbalanced Smith all-in-one — `FF-FSR110`

## Scope and controls

- Evidence/staging files only; no Liquid, section, snippet, template, asset, config, runtime, or live-theme file is changed.
- No live Shopify publication, redirect, canonical, indexing, collection, PDP, feed, price, inventory, shipping, warranty, or installation change.
- No merge is approved.
- GitHub item `#248` in this repository is unrelated (`paylater minor fixes`) and must not be treated as the comparison project.
- The separate `specs_features` audit/PR remains outside this article pilot.

## Review acceptance criteria

- Confirm all eight rows and every source-backed public field against the attached source-lock workbook.
- Confirm all product links resolve to the exact active PDPs.
- Confirm no live price, availability, shipping, delivery, installation, or warranty claim appears.
- Confirm the table works at approximately 375 px without clipping content irretrievably.
- Confirm heading hierarchy, link labels, accessibility, analytics requirements, canonical target, and rollback plan.
- Return PASS/HOLD with exact defects only; do not rewrite the strategy or create another implementation branch.

## Approval gate

The preview may be reviewed, commented on, and corrected in this branch. Publication, merge, or replacement of the existing article requires Tim's separate written approval after independent QA.
