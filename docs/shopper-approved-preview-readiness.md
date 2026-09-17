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
| `snippets/shopper-approved-product-reviews.liquid` | New. The single loader + display container for Shopper Approved product reviews. Gated on `sa_product_reviews_enabled`. |
| `assets/shopper-approved-schema-guard.js` | New. Strips JSON-LD injected by Shopper Approved so the page keeps exactly one AggregateRating source. |
| `sections/main-product.liquid` | Renders the snippet. The default template previously had **no** Shopper Approved loader at all. |
| `sections/main-product-comb.liquid` | Legacy inline loader replaced by the snippet. |
| `sections/main-product-variants.liquid` | Legacy inline loader replaced by the snippet. |
| `snippets/schema-product.liquid` | The theme's own JSON-LD node is tagged `data-schema-source="theme"` so the guard can never remove it. One attribute, no output change. |
| `snippets/modals-and-templates.liquid` | Skips the Shopper Approved merchant widget on product templates while the display is enabled; the two widgets collide over shared globals and containers. |
| `config/settings_schema.json` | New "Shopper Approved Product Reviews" group with `sa_product_reviews_enabled`, default `false`. |
| `config/settings_data.json` | Sets `sa_product_reviews_enabled` to `true` so the preview theme renders the display. Preview activation only — see the merge gate below. |

### The activation flag, and the one thing that must not be merged

`sa_product_reviews_enabled` defaults to `false` in `settings_schema.json`, so on any theme
that does not explicitly turn it on the snippet renders nothing and no Shopper Approved
product script is requested.

`config/settings_data.json` **on this branch** sets it to `true`, because the preview theme
is built from this branch and has to actually show the display. `main` has its own
`settings_data.json` with no such key, so live output is unaffected while this branch stays
unmerged.

> **Merge gate:** `config/settings_data.json` carries `"sa_product_reviews_enabled": true`.
> That line is preview activation, not a production decision. Do not carry it into `main`
> without Tim's separate written GO — merging it turns Shopper Approved product reviews on
> across the live storefront. Everything else on this branch is inert without it.

### Three defects this fixes

1. **The default product template never loaded Shopper Approved.** The legacy loader lived
   only in `main-product-comb` and `main-product-variants`. Every product on the default
   `product.json` template — which is all three of the evidence products below — could not
   render a Shopper Approved product review even in principle.
2. **No display container existed anywhere.** The legacy loader fetched
   `shopperapproved.com/product/34099/<id>.js` — 200, script executed — but no
   template rendered any of the elements it writes into, so the output had
   nowhere to go and the page stayed blank.
3. **The ProductID was read from the wrong variant.** The legacy loader used
   `window.product.variants[0].sku`, the *first* variant, not the selected one. The snippet
   uses `product.selected_or_first_available_variant.sku`, rendered server-side in Liquid.

### ProductID handling — no remapping

The Shopper Approved ProductID is the current variant SKU, used verbatim. There is no
legacy-ID fallback and no alias table. A product whose reviews sit under a retired SKU
renders an empty display rather than borrowing another product's reviews. That is the
`FFT-LPSCR` / `FFB-LPS` exception behaving as Tim specified, not a bug.

### Container contract

Read off the live product script, not guessed. An early version of this snippet rendered
`<div id="shopper_approved">`, which the widget never writes to — the script returned 200,
executed, and produced nothing. The elements it actually targets are:

| Element | Role |
| --- | --- |
| `#product_page` | Review list and paging. `saOpenPage()` writes here. |
| `#review_header` | Rating summary block, and the target of the "N reviews" jump link. |
| `#product_just_stars` | Inline star summary plus the jump link. |
| `.shopperapproved_product_summary` | Wrapper the script `.show()`s once reviews load, so it starts hidden. |
| `#review_image` | Widget footer logo; the script fills its `<a>`. |
| `#shopper_review_page` | Scope for the stylesheet the script injects. |
| `#shopperapproved_div` | Optional jump anchor; falls back to `#review_header` when absent. |

`#shopper_approved` appears in the script only in `ReviewProduct()`, the write-review popup
flow. `sa_write_review` is `0` for SiteID 34099, so that path is inert here.

`#product_just_stars` currently sits inside the review block. It is designed to live next to
the product title; moving it is a layout decision for after the display itself is signed off.

### Structured-data: the JSON-LD disable is page-side, not an account setting

The product script builds its own Product + AggregateRating + Review JSON-LD and inserts it
before the page's first `<script>`. Its kill switch is in the same file:

```js
if ((typeof sa_schema !== 'undefined' && sa_schema == 1) || typeof sa_schema === 'undefined') {
    var j = document.createElement('script');
    j.type = 'application/ld+json';
    j.innerHTML = json_sa;
    sa_s.parentNode.insertBefore(j, sa_s);
}
```

`sa_schema` is an ordinary page-side JavaScript variable. The snippet sets `sa_schema = 0`
before the loader, so the node is never built. **This is scoped to whichever theme renders
the snippet and requires no Shopper Approved account change**, which answers the question Tim
put to Khéri on Aug 17 — whether the control is preview-specific or account-wide. It is
preview-specific, and it is ours.

### Structured-data guard

`shopper-approved-schema-guard.js` is the check on that switch, plus a backstop for other
Shopper Approved surfaces. It removes a JSON-LD node only when it is positively Shopper
Approved's — inside `#shopper_review_page`, or self-identifying in its text — and never when
it carries `data-schema-source="theme"`. Nodes belonging to other apps are **reported, not
removed**: silently dropping another app's structured data would be its own defect.

`window.shopperApprovedSchemaGuard.audit()` returns every JSON-LD node on the page with its
source, types, AggregateRating count, `ratingValue` and `reviewCount`. Any node reporting
`src: "unattributed"` alongside a rating is a second opinion on the product's rating and
needs a decision.

Verified in Chromium against a fixture: a Shopper Approved node removed, a third-party node
with a conflicting rating left intact and reported, and the theme node untouched.

## Evidence products

All three sit on the default `product.json` template, so all three exercise the
`main-product.liquid` path that had no loader at all.

| Case | SKU / ProductID | Product | Judge.me rating metafields | Expected AggregateRating in preview |
| --- | --- | --- | --- | --- |
| Ordinary exact match | `FF-FSR90` | French Fitness FSR90 All-in-One Smith Machine, Functional Trainer & Squat Rack (New) — `9878150218044`, ACTIVE | 4.91 / 32 reviews | Exactly one, from the theme node. |
| Identity collision | `FF-WSPA5` | French Fitness 5 lb Weight Stack Plate Adapter (New) — `9879092658492`, ACTIVE | 5.0 / 17 reviews | Exactly one, from the theme node. Keyed on `FF-WSPA5` only; legacy `71023` is never requested, and no current product carries that SKU. |
| No-auto-remap exception | `FFT-LPSCR` | French Fitness Tahoe Seated Leg Press Sled / Calf Raise (New) — `10026483908924`, ACTIVE | **none** | **Zero.** See below. |

`FFT-LPSCR` carries no `reviews.rating` / `reviews.rating_count` metafields, so the theme's
schema emits no AggregateRating for it. That makes it the sharpest test on the branch: if
Shopper Approved's JSON-LD were left running, it would become the page's *only* rating
source — an unsourced rating on a product Judge.me says has no reviews. Measured: zero
AggregateRating nodes, which is the pass.

Whether its Shopper Approved display should be empty is still open. The first preview pass
showed three reviews under it, but those were the merchant widget's store-wide set, not the
product's — see the widget collision below. Its own count needs re-reading now that the
collision is fixed.

Its template suffix is `Default product`, and no `templates/product.Default product.json`
exists in the theme, so it falls back to `templates/product.json` and the `main-product`
section — the path that previously had no Shopper Approved loader at all. Confirmed against
the preview theme's file list.

## Preview theme

`fitnesssuperstore-shopify/claude/friendly-dirac-lrn44h`, theme ID **188470526268**,
UNPUBLISHED, `/t/589`. Connected to this branch, so it redeploys on every push.

| Case | Preview URL |
| --- | --- |
| `FF-FSR90` | https://www.fitnesssuperstore.com/products/french-fitness-fsr90-functional-trainer-smith-squat-rack-machine-new?preview_theme_id=188470526268 |
| `FF-WSPA5` | https://www.fitnesssuperstore.com/products/french-fitness-5-lb-weight-stack-plate-adapter-new?preview_theme_id=188470526268 |
| `FFT-LPSCR` | https://www.fitnesssuperstore.com/products/french-fitness-tahoe-seated-leg-press-sled-calf-raise-new?preview_theme_id=188470526268 |

### Widget collision — the merchant widget must not run on product pages

`layout/theme.liquid` renders `snippets/modals-and-templates.liquid` on every page, which
loads the Shopper Approved merchant widget, `widgets/group2.0/34099.js`. That is the **same
codebase** as the product widget. Both define the globals `sa_rtype`, `sa_overall`,
`sa_foundrows` and `sa_product_reviews`, and both render into `#product_page` and
`#review_header`. Whichever finishes last wins.

Measured on the preview theme, same build, same minute:

| PDP | `sa_rtype` | `sa_overall` | `sa_foundrows` | What rendered |
| --- | --- | --- | --- | --- |
| `FF-FSR90` | `product` | 4.9 | 31 | the product's own reviews |
| `FFT-LPSCR` | `merchant` | 5 | **428** | the site-wide store reviews |

428 is the whole-store review count. On `FFT-LPSCR` the merchant widget had replaced the
product's reviews with generic company reviews — the exact "one visible review display"
failure Tim's gate is there to catch, and intermittent, because it is a race.

This was latent before this branch: with no `#product_page` or `#review_header` anywhere on a
product page, neither widget had anywhere to write, so the collision was invisible. Adding the
product display is what gave the merchant widget a target.

Fix: `modals-and-templates.liquid` skips the merchant widget on product templates while
`sa_product_reviews_enabled` is on. There is no merchant-widget container anywhere in the
theme — `#merchant_page`, `.shopperapproved_widget` and `#shopper_approved` appear nowhere —
so nothing visible is lost, and with the setting off the snippet is byte-identical to before.

## Preview results

Preview theme 188470526268, logged out, desktop.

| | `FF-FSR90` | `FF-WSPA5` | `FFT-LPSCR` |
| --- | --- | --- | --- |
| ProductID sent | `FF-FSR90` | `FF-WSPA5` | `FFT-LPSCR` |
| Reviews rendered | 3 of 31 | 3 | re-test pending |
| Summary header | yes | yes | re-test pending |
| JSON-LD nodes | 2 | 2 | 1 |
| AggregateRating sources | 1, `theme 4.91/32` | 1, `theme 5.0/17` | **0** |
| `saSchemaSuppressed` | true | true | true |
| Guard removals | 0 | 0 | 0 |

`FF-FSR90` and `FF-WSPA5` pass. The Shopper Approved payload for `FF-FSR90` claims 4.9 over
31 reviews against Judge.me's 4.91 over 32, so the duplicate this branch prevents would also
have been a contradictory one.

Guard removals of `0` alongside `saSchemaSuppressed: true` is the result to want: the JSON-LD
was never built, rather than built and cleaned up. Before `sa_schema = 0`, `FF-FSR90` carried
three JSON-LD nodes; it now carries two.

`FFT-LPSCR` needs re-running after the merchant-widget fix. Its first pass was measuring the
collision above, not the product, so its own Shopper Approved review count is still unknown —
`sa_foundrows` had been overwritten with the store-wide 428 before it could be read.

## Preview test plan

Logged out, desktop and mobile, for each of the three products above:

1. **Display** — exactly one Shopper Approved review block. No second block, no duplicate of
   the Judge.me widget.
2. **ProductID** — `document.querySelector('.sa-product-reviews').dataset.saProductId`
   equals the product's current SKU, and the network request is
   `shopperapproved.com/product/34099/<that SKU>.js`.
3. **Schema audit** — `window.shopperApprovedSchemaGuard.audit()` in console. Expect no
   entry with `shopperApproved: true`, and the theme entry carrying the rating:
   `aggregateRatings: 1` on `FF-FSR90` and `FF-WSPA5`, `0` on `FFT-LPSCR`. Every
   `src: "unattributed"` entry claiming a rating must be attributed to an app before this
   ships.
4. **Kill switch** — `window.shopperApprovedSchemaGuard.saSchemaSuppressed` must be `true`
   and `.removed` must be `0`. A non-zero `removed` means `sa_schema = 0` did not take and
   the guard caught the node instead — a snippet ordering bug, not a vendor problem.
5. **Rich Results Test** on the preview URL — one Product, one AggregateRating, no
   duplicate-structured-data warning.
6. **Live untouched** — same schema counts on the live PDP before and after, to prove the
   preview theme changed nothing on production.

Also re-check the merchant group widget (`snippets/modals-and-templates.liquid`, group2.0
`34099.js`) and the `/pages/reviews` surfaces. Neither is changed by this branch; they are on
the list because they are the other Shopper Approved surfaces on the site.

## Rollback

- Preview theme: set `sa_product_reviews_enabled` back to `false`, in Theme settings →
  Shopper Approved Product Reviews or in `config/settings_data.json`. The display and the
  Shopper Approved product script both disappear. No code change.
- Branch: the work is isolated in the commits touching the nine files above. `git revert`
  restores the legacy inline loaders exactly.
- Nothing to roll back on live: the branch is unmerged, the preview theme is unpublished, and
  no Shopper Approved, Judge.me, feed, GMC, ProductID or product setting was touched.

## Open blocker — cross-domain combined display

Combined Fitness Superstore + French Fitness reviews **cannot be demonstrated from the theme
side**. The widget reads one account endpoint, `/product/34099/<id>.js`; merging SiteID
`36248`'s reviews into that response is an account-side cross-domain-sharing setting on
Shopper Approved, which Tim's Aug 30 GO explicitly excludes.

Per item 2 of that GO, this is reported rather than actioned. One account-side setting would
be needed, and it is not authorised here: **cross-domain review sharing between SiteID 34099
and SiteID 36248.** Without it the preview shows each domain's own reviews only. The 19 exact
shared ProductIDs are the population this would affect.

The JSON-LD disable is no longer on this list. It turned out not to be an account setting at
all — `sa_schema = 0` is a page-side variable, set by this snippet, scoped to whichever theme
renders it. No account change, no GO, no risk to live output. That resolves the question Tim
put to Khéri on Aug 17 without waiting on a vendor reply.
