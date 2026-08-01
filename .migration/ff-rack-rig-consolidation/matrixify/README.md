# Matrixify import — group B (product descriptions)

Covers the 72 remaining product descriptions only. Group C
(`product_option_help_text` metaobjects) is not in the Products sheet — see
`../RUNNING.md`.

| File | Rows | Use |
|---|---|---|
| `products_REMAINING.csv` | 72 | apply the approved link changes |
| `products_ROLLBACK.csv` | 95 | restore the pre-edit descriptions |

Columns are `ID`, `Handle`, `Body HTML`. `ID` is the numeric Shopify product ID,
so rows match on ID and `Handle` is there only as a human check.

## Import steps

1. Matrixify → **Import** → upload `products_REMAINING.csv`
2. Confirm it reads as **Products**, 72 rows, and that the only column being
   written is **Body HTML**
3. Run **Dry run** first. Expect 72 updates, 0 new products, 0 deletes.
   If it reports any *new* product, stop — that means IDs aren't matching.
4. Run the real import
5. Verify (see below)

Do not tick any option that would publish, unpublish, or change collections.
This import touches Body HTML and nothing else.

## Verify

Ask for a fresh Products export including Body HTML and search for:

```
french-fitness-rack-rig-systems
french-fitness-pre-configured-rigs
french-fitness-rig-frame-pieces-customize-your-rig
french-fitness-rig-attachments-accessories
french-fitness-racks-w-rig-rack-attachment-compatibility
```

Expected: zero hits across all products. Hits inside the five source collections'
own descriptions are fine and expected — those are collection records, not products.

`../verify.py` does the same check across products, option help text, breadcrumbs
and the sitemap in one go if you have an Admin API token.

## What these edits actually are

Per Tim's approvals of 2026-07-31:

- The five old collection URLs are swapped for the approved generic destinations.
  Relative vs absolute URL form is preserved; only the collection handle changes.
- Where the link text began with "French Fitness", those two words move outside
  the link, so it reads `French Fitness <a …>Free Standing/Wall Mounted Rigs</a>`.
  The words on the page are identical — only the link boundary moves.
- Neutral anchors such as "pull-up bar" keep their text; only the href changes.

No other part of any description was touched.
