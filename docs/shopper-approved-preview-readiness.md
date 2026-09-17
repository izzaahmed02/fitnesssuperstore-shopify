# Shopper Approved product reviews — preview-readiness build

Theme half of the bounded GO Tim issued on **Aug 30, 2026** in *"Shopper Approved Reviews -
Not Showing Properly on Google"*: prepare the Shopper Approved product-review display on a
feature branch wired only to an unpublished duplicate theme. No merge, no publication, no
live-theme edit, no Shopper Approved or Judge.me account change.

Controlling architecture, from Tim's Aug 18 and Aug 27 decisions:

- Shopper Approved is **display only**.
- Judge.me and `snippets/schema-product.liquid` remain the **sole** Product, Offer and
  AggregateRating source.
- Shopper Approved JSON-LD must be off.
- Combined display is allowed only for genuinely identical products whose ProductIDs match
  exactly. No ProductID, stored-URL, feed or review migration is authorised.

## What this branch changes

| File | Change |
| --- | --- |
| `snippets/shopper-approved-product-reviews.liquid` | New. The single loader + display container for Shopper Approved product reviews. Gated on a theme setting that defaults to **off**. |
| `assets/shopper-approved-schema-guard.js` | New. Strips JSON-LD injected by Shopper Approved so the page keeps exactly one AggregateRating source. |
| `sections/main-product.liquid` | Renders the snippet. The default template previously had **no** Shopper Approved loader at all. |
| `sections/main-product-comb.liquid` | Legacy inline loader replaced by the snippet. |
| `sections/main-product-variants.liquid` | Legacy inline loader replaced by the snippet. |
| `snippets/schema-product.liquid` | The theme's own JSON-LD node is tagged `data-schema-source="theme"` so the guard can never remove it. One attribute, no output change. |
| `config/settings_schema.json` | New "Shopper Approved Product Reviews" group with `sa_product_reviews_enabled`, default `false`. |

### Why it is off by default

`sa_product_reviews_enabled` defaults to `false`, so on any theme that does not explicitly
turn it on — including `main` — the snippet renders nothing and no Shopper Approved product
script is requested. Merging this branch would be a no-op on live output. The preview theme
is the only place the checkbox gets ticked, in Theme settings → Shopper Approved Product
Reviews.

### Three defects this fixes

1. **The default product template never loaded Shopper Approved.** The legacy loader lived
   only in `main-product-comb` and `main-product-variants`. Every product on the default
   `product.json` template — which is all three of the evidence products below — could not
   render a Shopper Approved product review even in principle.
2. **No display container existed anywhere.** The legacy loader fetched
   `shopperapproved.com/product/34099/<id>.js` but no template rendered the
   `#shopper_approved` element the widget writes into, so nothing could appear.
3. **The ProductID was read from the wrong variant.** The legacy loader used
   `window.product.variants[0].sku`, the *first* variant, not the selected one. The snippet
   uses `product.selected_or_first_available_variant.sku`, rendered server-side in Liquid.

### ProductID handling — no remapping

The Shopper Approved ProductID is the current variant SKU, used verbatim. There is no
legacy-ID fallback and no alias table. A product whose reviews sit under a retired SKU
renders an empty display rather than borrowing another product's reviews. That is the
`FFT-LPSCR` / `FFB-LPS` exception behaving as Tim specified, not a bug.

### Structured-data guard

`shopper-approved-schema-guard.js` removes a `script[type="application/ld+json"]` node only
when it is inside `#shopper_approved` or its own text identifies it as Shopper Approved, and
never when it carries `data-schema-source="theme"`. It reports itself at
`window.shopperApprovedSchemaGuard` (`{ removed, samples }`) for evidence capture.

The guard is preview-side belt and braces, not the fix. The supported fix is the vendor-side
JSON-LD disable Khéri confirmed on Aug 20. The guard exists so the preview can be proven
clean **before** anyone touches the Shopper Approved account.

## Evidence products

All three sit on the default `product.json` template, so all three exercise the
`main-product.liquid` path that had no loader at all.

| Case | SKU / ProductID | Product | Handle | Expected in preview |
| --- | --- | --- | --- | --- |
| Ordinary exact match | `FF-FSR90` | French Fitness FSR90 All-in-One Smith Machine, Functional Trainer & Squat Rack (New) — `9878150218044`, ACTIVE | `french-fitness-fsr90-functional-trainer-smith-squat-rack-machine-new` | Display renders, keyed on `FF-FSR90`. One AggregateRating, from Judge.me/theme. |
| Identity collision | `FF-WSPA5` | French Fitness 5 lb Weight Stack Plate Adapter (New) — `9879092658492`, ACTIVE | `french-fitness-5-lb-weight-stack-plate-adapter-new` | Keyed on `FF-WSPA5` only. Legacy `71023` is never requested. Confirmed live: no current product carries SKU `71023`. |
| No-auto-remap exception | `FFT-LPSCR` | French Fitness Tahoe Seated Leg Press Sled / Calf Raise (New) — `10026483908924`, ACTIVE | `french-fitness-tahoe-seated-leg-press-sled-calf-raise-new` | Keyed on `FFT-LPSCR`. Legacy `FFB-LPS` reviews are **not** pulled in. Empty display is the correct result. |

## Preview test plan

On the unpublished preview theme, with `sa_product_reviews_enabled` ticked, logged out,
desktop and mobile, for each of the three products above:

1. **Display** — exactly one Shopper Approved review block. No second block, no duplicate of
   the Judge.me widget.
2. **ProductID** — `document.querySelector('.sa-product-reviews').dataset.saProductId`
   equals the product's current SKU, and the network request is
   `shopperapproved.com/product/34099/<that SKU>.js`.
3. **Schema count** — in console:
   `document.querySelectorAll('script[type="application/ld+json"]').length` and the count of
   `"aggregateRating"` across those nodes. Expect exactly one Product node and one
   AggregateRating node, both from `data-schema-source="theme"`.
4. **Guard** — `window.shopperApprovedSchemaGuard.removed`. Any value above `0` means
   Shopper Approved is still emitting JSON-LD and the vendor-side disable is still required.
5. **Rich Results Test** on the preview URL — one Product, one AggregateRating, no
   duplicate-structured-data warning.
6. **Live untouched** — same schema counts on the live PDP before and after, to prove the
   preview theme changed nothing on production.

Also re-check the merchant group widget (`snippets/modals-and-templates.liquid`, group2.0
`34099.js`) and the `/pages/reviews` surfaces. Neither is changed by this branch; they are on
the list because they are the other Shopper Approved surfaces on the site.

## Rollback

- Preview theme: untick `sa_product_reviews_enabled`. The display and the Shopper Approved
  product script both disappear immediately. No redeploy.
- Branch: the work is isolated in the commits touching the seven files above. `git revert`
  restores the legacy inline loaders exactly.
- Nothing to roll back on live: the branch is unmerged, the preview theme is unpublished, and
  no Shopper Approved, Judge.me, feed, GMC, ProductID or product setting was touched.

## Open blocker — cross-domain combined display

Combined Fitness Superstore + French Fitness reviews **cannot be demonstrated from the theme
side**. The widget reads one account endpoint, `/product/34099/<id>.js`; merging SiteID
`36248`'s reviews into that response is an account-side cross-domain-sharing setting on
Shopper Approved, which Tim's Aug 30 GO explicitly excludes.

Per item 2 of that GO, this is reported rather than actioned. Two account-side settings would
be needed, neither authorised here:

1. **Cross-domain review sharing between SiteID 34099 and SiteID 36248.** Without it the
   preview shows each domain's own reviews only. The 19 exact shared ProductIDs are the
   population this would affect.
2. **The Shopper Approved JSON-LD disable.** Whether it is preview-scoped or account-wide is
   still open — that was the question Tim put to Khéri on Aug 17 and it has not come back
   with a scope. If it is account-wide, enabling it changes live output and needs its own GO.
   The client-side guard covers the preview in the meantime.
