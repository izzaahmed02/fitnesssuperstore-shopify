# HTML Template Audit — Shared Option Help Lazy Load

## Scope

This bounded draft addresses the urgent initial-HTML bloat identified in the HTML Template Audit. It does not change production, product data, customer-facing prices, Globo, Boost, checkout settings, or SEO-critical product content.

## Root cause

Initial storefront HTML currently contains optional help content before a customer requests it.

Primary sources:
- `snippets/cart-drawer.liquid` traverses option metaobjects for cart items and renders full help popups into every initial response when the cart contains configurable items.
- `sections/main-product.liquid`, `sections/main-product-comb.liquid`, `sections/main-product-variants.liquid`, and `sections/main-product-home-gym-packages.liquid` render full option-help popup bodies into the PDP response.
- `snippets/option-help-content.liquid` renders matching option-help metaobject rich text into a hidden source block for legacy PDP help.
- `assets/product-custom-options.js` opens help with document-global popup selectors, so repeated popup keys such as Mat can resolve to the wrong copy when PDP and cart markup overlap.

The visible product title, product description, specifications, product-option controls, pricing, internal links, schema, canonical, and checkout controls are not moved out of the initial response by this draft.

## Candidate architecture

Two Shopify Section Rendering API endpoints are added:
- `sections/product-option-help-lazy.liquid`
- `sections/cart-option-help-lazy.liquid`

`assets/option-help-loader.js` requests those sections only after a customer asks for option help. The request preserves the current URL query string, including unpublished-theme preview parameters.

PDP help is injected into `[data-product-option-help-slot]`.

Cart help is injected into `[data-cart-option-help-slot]`, with each cart line isolated under `[data-option-help-cart-item="<line key>"]`. Popup lookup is scoped to the PDP slot or the current cart line instead of using a document-global selector.

Injected popup close behavior, help accordions, and related-product switching are bound by the persistent loader because scripts inside Section Rendering API HTML are not executed when inserted.

The legacy option-help lookup in `assets/old-custom.js` now awaits the product help section before reading `#option-help-content-source`.

Cart help is invalidated after cart section replacement so a later help request is rendered against the current cart.

## Baseline browser evidence

Matching live captures collected before this candidate:

| Page | Serialized DOM | Transfer | Decoded | ScriptDuration |
| --- | ---: | ---: | ---: | ---: |
| Tahoe PDP | 1,628,105 B | 4,125,629 B | 10,871,467 B | 0.932299 s |
| Life Fitness 95T remanufactured PDP | 1,494,032 B | 3,326,443 B | 9,919,033 B | 0.828319 s |
| Treadmills collection | 2,354,135 B | 3,318,258 B | 8,469,959 B | 0.801843 s |

Detailed SEO baseline:
- Tahoe PDP: H1 5 / H2 32 / H3 59 / H4 14 / H5 10 / H6 0.
- Remanufactured PDP: H1 4 / H2 216 / H3 109 / H4 202 / H5 21 / H6 4.
- Treadmills collection: H1 1 / H2 198 / H3 159 / H4 189 / H5 21 / H6 0.

Tim's source analysis reports approximately 12,609 words in Detailed on Tahoe and approximately 13,473 parsed source words, with most of the excess coming from hidden option-help, duplicated popup bodies, and related help content. The requested Tahoe target is approximately 3,000–4,000 initial words if feasible without losing important content.

No after measurements are claimed until an unpublished preview is connected and independently tested.

## Files changed

- `assets/option-help-loader.js`
- `assets/product-custom-options.js`
- `assets/old-custom.js`
- `assets/cart-drawer.js`
- `sections/product-option-help-lazy.liquid`
- `sections/cart-option-help-lazy.liquid`
- `sections/main-product.liquid`
- `sections/main-product-comb.liquid`
- `sections/main-product-variants.liquid`
- `sections/main-product-home-gym-packages.liquid`
- `snippets/cart-drawer.liquid`

## Required unpublished-theme QA

Before any production approval:
- confirm the preview is byte-mapped to the final candidate SHA;
- Tahoe PDP, one remanufactured PDP, homepage, and one collection page;
- empty and populated cart;
- Detailed initial word count;
- initial HTML/DOM and transfer/decoded size;
- hidden popup and duplicate counts;
- desktop and 375px mobile;
- option help opens, closes, reopens, and shows a loading state correctly;
- duplicate Mat/help keys resolve to the correct PDP or cart line;
- related-product selection;
- product configuration and calculated price;
- cart Modify and Save Changes;
- checkout navigation without placing an order;
- canonical, indexability, Product schema, Merchant Listing validation, and crawlable server-rendered content.

## Rollback

No production release is part of this draft. Rollback before release is to close the draft PR and disconnect/delete the unpublished preview. If a later approved release needs rollback, revert the candidate commits as one release unit.

## Approval boundary

This draft is implementation and preview-test preparation only. It does not authorize production deployment.
