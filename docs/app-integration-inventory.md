# App / Integration Inventory

Reference list of integrations that touch the storefront, product data, or feeds,
and the durable rules for each. Keep this current as integrations change. Never
record credentials here — describe the access mechanism, not the secret.

| Integration | Function | Durable rule |
|-------------|----------|--------------|
| Shopify ⇄ GitHub integration | Syncs `main` ⇄ the live theme (`186120208700`); also pushes live admin theme edits back to `main`. | Admin theme edits reach `main` outside a PR — treat `Update from Shopify …` commits as production drift to reconcile (see `release-and-rollback-runbook.md`). |
| Boost (search & filtering) | Collection search/filter and product-grid rendering. | Config changes follow the normal branch → preview → PR → approval flow. |
| Shopify Functions (e.g. cart transform) | Cart/checkout logic. | Deploying a Function requires the human-controlled workflow; never deployed by an AI agent. |
| Simprosys / Multifeeds → Google Merchant Center | Product feeds to GMC. | GMC/feeds are a validation surface, **not** the source of product truth. The connector defaults to Fitness Superstore; select the correct store explicitly for French Fitness. |
| Klaviyo | Email / lead capture (e.g. Smart Buyer's Guide). | Storefront capture forms tag lead source; do not embed secrets in theme code. |
| ShopperApproved (+ Google, Facebook, Yelp, Trustpilot) | Customer reviews. | The native platform record is the source of truth for a review; the storefront is a display surface. Preserve source-platform IDs and order/SKU associations. |
| OpenAI crawlers (OAI-SearchBot / OAI-AdsBot / GPTBot) | Crawl / ads / training access via `robots.txt`. | Any `robots.txt.liquid` change follows the normal branch → preview → PR → approval flow. |

For the current owner, live status, and access path of any integration, use the
controlling task/record — that state is tracked outside this repository.
