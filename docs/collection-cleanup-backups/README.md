# Collection cleanup — controlled backup

Backup of live Shopify values taken **2026-08-14** immediately before clearing the
below-grid metafield `custom.post_lisiting_content` on the first two cleanup pages,
per Tim's 2026-08-11 approval (item 1 and item 2).

The metafield is rendered by the `rich_text_3rib4Q` section in `templates/collection.json`
as `{{ collection.metafields.custom.post_lisiting_content.value }}`. The key spelling is
kept exactly as-is — not renamed, not migrated.

## Scope

| Collection | Handle | Shopify GID | Live URL |
| --- | --- | --- | --- |
| Remanufactured TreadClimbers for Sale | `treadclimbers` | `gid://shopify/Collection/499632636220` | https://www.fitnesssuperstore.com/collections/treadclimbers |
| Woodway USA | `woodway-usa` | `gid://shopify/Collection/499633094972` | https://www.fitnesssuperstore.com/collections/woodway-usa |

## Files

| File | Contents |
| --- | --- |
| `2026-08-14_treadclimbers_woodway-usa_backup.json` | Raw Admin API response for both collections: id, handle, title, updatedAt, descriptionHtml, templateSuffix, all metafields |
| `treadclimbers__description.html` | Exact above-grid description HTML — **not modified**, kept for reference only |
| `treadclimbers__custom.post_lisiting_content.txt` | Exact full value of the cleared below-grid field |
| `woodway-usa__description.html` | Exact above-grid description HTML — **not modified**, kept for reference only |
| `woodway-usa__custom.post_lisiting_content.txt` | Exact full value of the cleared below-grid field |

SHA-256 of the captured values:

```
e5e54190d65fcf41bd81872f5634d9a882efb1ae9da693a7326b07e5645603e0  treadclimbers__custom.post_lisiting_content.txt
e49cabdba5c705f201827bc1acfe3c916a104e2ee73d1d5a2720f877b0cd4f7a  treadclimbers__description.html
2ce61d41f6f1cca68c543c02f48bb5e52c0832aa5ca5ff143ccf9dcb6d1cc2ad  woodway-usa__custom.post_lisiting_content.txt
69eb5709b5529c88c896cb69aa96fb60cb12bb85ac1065056489322ecbf374bb  woodway-usa__description.html
```

## Why this backup exists

The "Backup Collection Export as of Aug 13 2026" sheet circulated on the thread does not
cover either page. Its rows are limited to ten unrelated handles: `ba-new`,
`ba-remanufactured`, `cybex-vr3-series`, `life-fitness-ellipticals`, `pilates-reformers`,
`product`, `specialty-other-500-lb`, `star-trac-remanufactured`, `tax-excluded-products`,
`theracycle-1`. The LIVE SHOPIFY CLEANUP tab lists both pages as P0 with
"Legacy below-fold content? = Yes" but carries no column for the preserved description or
metafield value. This directory is the controlled backup Tim's 2026-08-10 note allows in
place of the sheet.

## Restore

```bash
jq -r '.[] | select(.handle=="woodway-usa")
  | .metafields.edges[]
  | select(.node.namespace=="custom" and .node.key=="post_lisiting_content")
  | .node.value' 2026-08-14_treadclimbers_woodway-usa_backup.json
```

Write the value back with `metafieldsSet` on the collection GID above, type
`multi_line_text_field`.

## Known side effects of the clear

- **TreadClimbers** — the cleared field carried a `FAQPage` JSON-LD block covering five
  questions. Removing the field removes that structured data, so FAQ rich results for this
  collection will drop out. The above-grid intro and its
  `/pages/bowflex-treadclimber-comparison-chart` link are untouched.
- **Woodway** — the cleared field held the only link from the collection page to
  `/pages/woodway-treadmill-comparison-chart`. That page stays live and published, but is no
  longer linked from the collection. The Woodway above-grid intro contains no links, so no
  replacement link exists on the page. Raised for Tim's decision; the intro was not edited
  because it is the same copy under the open factual-claim gate.
