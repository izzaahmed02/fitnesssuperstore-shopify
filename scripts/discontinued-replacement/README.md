# Discontinued replacement module — render checks

Renders `snippets/discontinued-replacement.liquid` and
`snippets/discontinued-replacement-card.liquid` against fixtures taken from live
Shopify data and asserts the controlled behaviour the module is required to
have.

```bash
cd scripts/discontinued-replacement
npm install liquidjs
node check.mjs
```

The installed dependency is local to this folder and ignored by git. The check
exits non-zero if any assertion fails.

The harness stubs the Shopify-specific filters (`image_url`, `metafield_tag`,
`asset_url`, `stylesheet_tag`, `placeholder_svg_tag`) and renders the real
snippet files, so it exercises the actual Liquid logic and precedence rather
than a copy of it. It does not replace live customer-view QA on a deployed
theme.

## What is covered

| Check | Asserts |
| --- | --- |
| `ct100-unavailable` | The approved FF-CT-100 reference renders while CT100 is unavailable: exact title, PDP link, image, "Out of stock", and the approved October 2026 caution. |
| `backorder-preorder` | A replacement carrying `custom.backorder` is labelled "Available to Pre-Order", not "Available to Order", matching `snippets/product-availability-badge.liquid`. |
| `variant-lead-time-override` | A variant `processing_time_long_variant` wins over a conflicting product-level fallback, matching the PDP and cart precedence. |
| `blank-reference-fails-closed` | With the approved reference blank, the module renders the controlled header and introduction and no product card, and substitutes no other product. |
| `discontinued-reference-fails-closed` | When the referenced replacement is itself on the discontinued template, the source page keeps its controlled header and introduction and nothing renders for that reference: no card, product link, image, availability/pre-order/out-of-stock badge, lead-time line or purchase control, and no substitute product. The fixture is deliberately adversarial — available, on backorder, and carrying both a variant and a product lead time — so every branch that could render a badge or lead time is populated and the guard has to suppress all of them. |
| purchase controls | Every rendered case is asserted to contain no price, form, button, quantity or add-to-cart markup. |

## Fixtures

Values are copied from live Shopify readbacks:

- FF-CT-80 `custom.discontinued_product_content` and its
  `above_the_fold_content` entry.
- FF-CT-100 (`gid://shopify/Product/9879035216188`): unavailable, product-level
  `custom.processing_time_long` = "Expected to restock in October 2026. Transit
  time is additional."
- The hidden Rack & Rig configurator parent
  (`gid://shopify/Product/10281641443644`): product-level
  `custom.processing_time_long` = "Ships from our Warehouse in 2-5 Business Days
  + Transit Time", while its 130" variant
  (`gid://shopify/ProductVariant/52686668464444`, SKU FF-RR-U-130) carries
  `custom.processing_time_long_variant` = "Ships from our Warehouse in 1-2 Weeks
  + Transit Time". This is the conflict the variant precedence has to resolve.

Update the fixtures if the controlled source records change.
