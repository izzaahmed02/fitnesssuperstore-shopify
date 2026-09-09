# Collection condition alignment — review only

Status: DRAFT / NOT APPROVED FOR LIVE CATALOG CHANGES. Prepared 2026-09-09.

## Verified finding

Shopify collection SEO fields, not a hardcoded theme condition, contain the reported Bumper Plates defect. `layout/theme.liquid` renders `page_title` and `page_description`; `snippets/meta-tags.liquid` uses those values for Open Graph and Twitter metadata. Fix the underlying collection SEO, not a theme-only override.

Complete direct Shopify membership reads found these five collections have only ACTIVE products with an Online Store URL and an explicit New title. Each connection ended with `hasNextPage=false`.

| Collection | Shopify collection ID | Complete member count | Current SEO title | Proposed SEO title |
|---|---|---:|---|---|
| bumper-plates | 499640467772 | 61 | Bumper Plates (Remanufactured) | Bumper Plates (New) |
| weight-collars | 499639976252 | 18 | Weight Collars (Remanufactured) | Weight Collars (New) |
| kettlebell-sets | 499639255356 | 20 | Kettlebell Sets (Remanufactured) | Kettlebell Sets (New) |
| single-kettlebells | 499639288124 | 39 | Single Kettlebells (Remanufactured) | Single Kettlebells (New) |
| standard-bars | 499639451964 | 2 | Standard Bars (Remanufactured) | Standard Bars (New) |

For each of these five descriptions only, replace the leading `Shop remanufactured` with `Shop new`; preserve all remaining copy. Exact before/after/rollback values are in `confirmed_changes.json`. This is ten SEO-field proposals, not ten collections. The 140 observations are product memberships, not a storewide physical-condition inspection or a stock-availability claim.

## Actual coverage / open gap

- Shopify count: 690 total collections; 668 published; 22 unpublished.
- Read all 668 published collection SEO records across 250 + 250 + 168 records; last `hasNextPage=false`.
- Fully reconciled membership/product-title condition on the five collections above (140 memberships).
- The other 663 published collections are NOT certified condition-aligned. Metadata review alone is not full product-condition QA.
- A read-only bulk export completed: `gid://shopify/BulkOperation/7761231741244`, 668 roots, 48,890 objects, 37,552,052 bytes, completed 2026-09-09T17:44:31Z. Its output could not be downloaded in the assistant runtime because of file-transfer/network restrictions. A completed export is not a completed audit.
- Do not commit the signed output URL. Retrieve a fresh URL in the authorized Shopify environment and download the existing JSONL; do not manually rebuild the export. The query and read-only auditor accompany the handoff.
- Body/H1/social/schema/live-render parity across every collection remains an acceptance check, not a completed claim.

## Follow-up examples — candidates, NOT confirmed condition profiles

Live metadata also contains remanufactured descriptions on `french-fitness-treadmills`, `french-fitness-gym-accessories`, `french-fitness-tricep-utility-benches`, `urethane-weight-plates`, `1-cast-iron-plates`, and `2-olympic-cast-iron-plates`; `machine-attachments` says Used. Mixed-category titles also require review (treadmills, ellipticals, benches, rowing machines, stairmaster). Do not change them from brand assumptions or these names alone.

## Controls / acceptance

1. Implementation owner downloads existing export and runs the supplied read-only auditor. Confirm 668 roots and each product count; reconcile Online Store/sitemap scope and any canonical condition metafield. Unknown, missing, conflicting, open-box, or mixed conditions require explicit disposition.
2. Product-data owner resolves exceptions only; do not ask the team to redo the five complete checks manually unless current data has changed.
3. Independent QA confirms exact before/after copy, current membership and explicit condition sources. New-only may say New; mixed collections use neutral language or accurate supported conditions; genuine remanufactured-only collections retain their condition. Never default an unknown collection to Remanufactured or infer condition from brand.
4. Before any write, re-read SEO and membership; stop if the snapshot has drifted. Preserve handles, collection rules, H1/body, product condition fields, price, inventory, warranty, tax and shipping. New condition does not mean in stock.
5. Obtain written final human approval for the specific release batch. Shopify collection SEO is shared catalog data: an unpublished theme does not isolate these edits. An offline before/after preview is provided instead.
6. After approval, use Shopify collection SEO fields only. Verify rendered title, description, Open Graph/Twitter, canonical URL and unchanged H1/product grid. Save after values and rollback evidence. Verify Google recrawl separately; do not equate a live fix with immediate search-result refresh.
7. Preserve the existing canonical internal thread/tracker and older batch holds; this PR does not approve unrelated Internet Cleanup releases. No live theme/catalog changes are made by this branch.

## Prevention

Add condition alignment to collection creation, SEO imports/generators and membership-change QA. Prefer neutral metadata when the category is intentionally mixed or not condition-restricted; block unsupported condition claims rather than using a default. Apply the same explicit condition source to SEO text and any applicable structured data.
