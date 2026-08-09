# Matrixify import — group C (product option help text)

74 `product_option_help_text` metaobjects, 143 anchors. This is the last
outstanding data change before the pre-cutover crawl.

| File | Rows | Use |
|---|---|---|
| `optionhelp_REMAINING.xlsx` | 74 | apply the approved link changes |
| `optionhelp_ROLLBACK.xlsx` | 74 | restore the pre-edit `help_text` values |

Each workbook has two sheets:

- **Metaobjects** — the import sheet: `ID`, `Handle`, `Type`, `Field: help_text`
- **Reference** — `ID`, `Handle`, `New help_text`, for pasting across if your
  Matrixify export uses a different column header for the field

## Please export first

Matrixify's metaobject field column naming varies by version. Before importing,
run a Matrixify **export** of Metaobjects filtered to type
`product_option_help_text` and compare the header against the Metaobjects sheet.

- If the field column matches `Field: help_text`, import `optionhelp_REMAINING.xlsx`
  directly.
- If it differs, paste the `New help_text` column from the **Reference** sheet into
  your own export, matching on `ID`, and import that instead.

Either way the values are identical — only the column header differs.

## Import

1. **Dry run first.** Required result: **74 updates, 0 new, 0 deletes.**
2. Stop if it reports any new metaobject, any deletion, a row-count mismatch, or
   any record-level error.
3. If the dry run matches, run the import.
4. Send the Matrixify result screenshot/log showing the totals and any errors.

Only `help_text` is being written. Do not map or overwrite any other field, and do
not change products, collections, publication state, or redirects.

## Verify

Export Metaobjects of type `product_option_help_text` again and search the
`help_text` column for:

```
french-fitness-rack-rig-systems
french-fitness-pre-configured-rigs
french-fitness-rig-frame-pieces-customize-your-rig
french-fitness-rig-attachments-accessories
french-fitness-racks-w-rig-rack-attachment-compatibility
```

Expected: zero hits across all 1,096 records.

## What the edits are

Same approved rules as group B (Tim, 2026-07-31):

- the five old collection URLs swapped for the approved generic destinations,
  preserving relative vs absolute form;
- where the link text began with "French Fitness", those two words move outside
  the link — the words on the page are identical, only the link boundary moves;
- neutral anchors such as "Rig & Rack Frame Pieces" keep their text; only the
  href changes.

Nothing else in any `help_text` value was touched.
