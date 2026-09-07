# PR #784 exact-head delta QA — verdict: PASS on the delta, HOLD on release

Verifier: Yusra | Date: 2026-09-07 | Candidate: PR #784, head `f0883f097267c439e027602849530b16220f32b5`
Preview: theme `188124725564` (UNPUBLISHED) | Production: theme `186120208700` (MAIN)

This covers the one-file delta at head `f0883f0` (`snippets/labor-day-sale-note.liquid`).
Evidence for the parent `2b8491d` is retained separately under its own SHA and is not relabelled here.

## Integrity: preview serves the exact head (independently computed)

| Source | Bytes | MD5 | Git blob |
|---|---|---|---|
| GitHub `f0883f0:snippets/labor-day-sale-note.liquid` | 7956 | `ae40c6c5196d6dea870f33ff2de8aee4` | `6ebe836a8be0499a19d60909f11dd69c7bd14c1b` |
| Live preview `188124725564` (Shopify readback) | 7956 | `ae40c6c5196d6dea870f33ff2de8aee4` | — |

MAIN `186120208700` still serves sale-note MD5 `f70ac563178e948a4f2bc3643c343e12` and has **no**
`snippets/ff-permanent-compare-hidden.liquid`, so the permanent guard is confirmed not live.
`sections/header.liquid` is byte-identical in MAIN and preview (`68d88f4b01fff7d9faa4d92cbe47a374`);
the 32px rule is shared with MAIN and is not a pricing-branch regression.

## Changed-file manifest (closes the 24 / 25 / 31 question)

Counted with `git diff --name-only $(git merge-base origin/main <sha>) <sha>`:

- parent `2b8491d`: **24** files
- head `f0883f0`: **25** files
- delta: exactly one file, `snippets/labor-day-sale-note.liquid`

The 31-file figure in the earlier QA report is a different base/scope and is not the PR delta.
The authoritative 25 are: `assets/product-info.js`, `config/settings_data.json`,
`config/settings_schema.json`, `sections/extra-info.liquid`, `sections/featured-product.liquid`,
`sections/homepage-popular-fitness.liquid`, `sections/main-product-comb.liquid`,
`sections/main-product-home-gym-packages.liquid`, `sections/main-product-variants.liquid`,
`sections/main-product.liquid`, `snippets/card-product.liquid`,
`snippets/ff-permanent-compare-hidden.liquid`, `snippets/homepage-product-items-home.liquid`,
`snippets/labor-day-sale-note.liquid`, `snippets/price.liquid`, `snippets/product-add-ons.liquid`,
`snippets/product-card.liquid`, `snippets/product-item.liquid`, `snippets/product-items-home.liquid`,
`snippets/quick-order-list-row.liquid`, `snippets/quick-order-list.liquid`,
`snippets/related-items-colln.liquid`, `snippets/related-items.liquid`,
`snippets/schema-product.liquid`, `snippets/super-sale.liquid`.

## Acceptance item 1 — E500 unavailable, six widths: PASS

Product: French Fitness E500 Elliptical (New), `FF-E500`, price $2,499.00,
`availableForSale: false`, inventory −10001, policy DENY, in FF Sale Eligible collection.

Rendered at 320 / 390 / 430 / 768 / 989 / 990 px, preview vs MAIN:

| | campaign card rows | "in cart" price | "As high as" | "You save" |
|---|---|---|---|---|
| MAIN (live) | 2 at every width | $2,249.10 | present | present |
| Preview `f0883f0` | 0 at every width | none | none | none |

So MAIN currently advertises a Labor Day cart price of $2,249.10 on a product the storefront
labels **Out of stock**, together with a fake reference price of $3,599.00 and "You save $1,100.00".
The delta removes all of it.

Both update targets are still emitted while suppressed, as truly empty elements:

```html
<div id="LaborDaySaleCard-template--27251637027132__main" class="campaign-sale-container"></div>
<div id="LaborDaySaleCard-Desktop-template--27251637027132__main" class="campaign-sale-container hide-on-mobile"></div>
```

No blank gap, at every width. Computed style on both wrappers is `display: none`, height 0,
`margin-top: 0px`, `margin-bottom: 0px`. The `{% stylesheet %}` block **is** delivered: it compiles
into `/cdn/shop/t/537/compiled_assets/styles.css` as
`.campaign-sale-container:empty{display:none!important;margin:0!important}`, which is linked on the
preview PDP and overrides `section-main-product.css`'s `.campaign-sale-container{display:block;margin:10px 0}`.
Verified the same way on a non-eligible non-FF PDP, so the now-unconditional wrapper collapses
storewide rather than leaving gaps.

Add-to-cart on E500 is correctly refused by Shopify ("already sold out", HTTP 422), so the
suppression matches real purchasability rather than only guessing at it.

## Acceptance item 2 — available → unavailable → available: PARTIAL, blocked by catalog reality

The mechanism verified at the exact endpoint `product-info.js` calls
(`/products/<handle>?section_id=<id>&variant=<id>`):

- suppressed state still returns both wrapper IDs, so the innerHTML swap has both old and new IDs
  and can clear the card;
- available state returns the filled card;
- A → B → A on one family (24"x24" Rubber Gym Interlocking Tiles, 3 variants) is byte-stable apart
  from per-request accordion nonces, so no stale amount;
- `assets/product-info.js` update list contains both `LaborDaySaleCard` and `LaborDaySaleCard-Desktop`.

What could not be exercised: **no discount-eligible French Fitness multi-variant family with mixed
availability exists in the catalog.** Every French Fitness product currently matching
`out_of_stock:true` is single-variant, and the only multi-variant families in the two discount
collections carry a single uniform price. Manufacturing the case needs a production data edit, which
is explicitly out of bounds. Recommend covering it on an approved unpublished fixture, or accepting
it as a documented gap.

## Acceptance item 3 — rates, exclusions, quantity, end date, real cart allocation: PASS

Live automatic discounts:

| Discount | Status | Window (UTC) | Scope |
|---|---|---|---|
| Labor Day Sale — 10% Off French Fitness | ACTIVE | 2026-09-01T07:00:00Z → 2026-09-09T06:59:59Z | collection 519462814012 |
| Labor Day Sale — 5% Off Remanufactured | ACTIVE | 2026-09-01T07:00:00Z → 2026-09-09T06:59:59Z | collection 512180715836 |

Both end Sept 8 at 11:59:59 p.m. Pacific, as stated. Left unchanged.

Collection 519462814012 rules, all-must-be-true: vendor equals French Fitness; type not equals
Product (Hidden); tag not equals `july4-exclude`; tag not equals `labor-day-price-marked`.
The snippet at head now mirrors all four. **MAIN mirrors only three**, so the exclusion fix is a
genuine correctness alignment. Its live impact today is nil, because 0 products currently carry
`labor-day-price-marked` (11 French Fitness products carry `july4-exclude`). Collection 512180715836
rules (title contains Remanufactured, type equals Product Index) already matched.

Exclusion honored on a real product: French Fitness Rubber Coated Hex Dumbbells carries
`july4-exclude`, is out of collection 519462814012, and renders no campaign card on the preview.

Real cart allocation, single cart, stopped well before payment, no order created:

| Item | Price | Final | Allocation |
|---|---|---|---|
| French Fitness FFB Black 12 Stack Multi Jungle Gym (New) | $16,498.00 | $14,848.20 | Labor Day Sale — 10% Off French Fitness, $1,649.80 |
| Cybex 610a Arc Trainer (Remanufactured) | $4,099.00 | $3,894.05 | Labor Day Sale — 5% Off Remanufactured, $204.95 |

Both match their preview PDP cards to the cent. Subtotal $18,742.25. No unexpected stacking from the
unrelated always-on 5% "auto discount".

## Compare-at fallback on French Fitness: PASS, this is the answer to the sequencing question

34 French Fitness products (12 active) carry a compare-at above price, up from the 32 / 11 reported
on Sept 5. Tested French Fitness Rack & Rig Utility Seat Attachment (New), $209.00 with compare-at
$259.00 and `custom.retail_price` 39900:

- MAIN: "As high as" and "You save" visible.
- Preview `f0883f0`: both gone. The only surviving $259.00 is inside the Klaviyo `Viewed Product`
  tracking payload, i.e. the data is preserved and only the presentation is suppressed.

Confirmed in source at the exact head that the compare-at fallback is gated on the guard, not just
the metafield branch: `snippets/product-add-ons.liquid:162-177` (variant compare-at → product
`compare_at_price_max` → `custom.retail_price`, all inside `hide_perm_price contains 'false'`),
`sections/main-product-home-gym-packages.liquid` at every site (380/385, 422/427, 1151/1156,
1193/1198, 1272/1274, 1371, 1415, 1883, 1927), and `snippets/price.liquid:82`. So deleting
`custom.retail_price` will not let compare-at recreate a permanent French Fitness reference price.

Minor, non-blocking: `snippets/price.liquid:68-69` still adds `price--on-sale` /
`volume-pricing--sale-badge` from `compare_at_price > price` without the guard. On the tested page
this produces no visible struck figure or badge text, but Izza should confirm no theme or app CSS
renders a visible Sale flag off `.price--on-sale` for French Fitness.

## Featured product and rig/rack carousel: source-verified only, no live placement

- `sections/featured-product.liquid` at head assigns `product = section.settings.product` (line 6)
  *before* capturing the guard (line 15), and uses it at lines 241 and 285. Fix present. But the
  section is not placed in any JSON template or section group, so there is no live surface to
  exercise. Verify in the theme editor on the unpublished preview if behavioral proof is required.
- `sections/extra-info.liquid:346` renders the guard scoped to `product_ref`, replacing MAIN's
  ungated `{% if product_ref.metafields.custom.retail_price != blank %}` at line 345. Fix present and
  correctly scoped. The rig carousel did not render on the rig/rack product page I could reach, so
  again source-verified only.
- `snippets/super-sale.liquid:139` carries the #793 positive-value guard
  `{% if sale_price_cents > 0 and current_price > sale_price_cents %}`. Present.

## Open gap that is not closed by this candidate: Boost cards

Collection and search grids are rendered client-side by Boost from its own card template, which is
byte-identical in MAIN and the preview and is **not** vendor-guarded:

```liquid
{% for metafield in product.metafields %}
  {% if metafield.key == 'retail_price' and metafield.value != blank %}
    <div class="retail-price">As high as: <span class="js-retail-price" data-cents="{{ metafield.value }}"></span></div>
    {% break %}
  {% endif %}
{% endfor %}
```

Consequence for sequencing: the theme guard cleans French Fitness PDPs but **not** French Fitness
Boost collection/search cards. What cleans those is the metafield deletion, not the publish. So
between publishing the guard and running the deletion there is a window where French Fitness PDPs
are clean and French Fitness Boost cards still show "As high as". And after the deletion, non-French
Fitness brands keep their own `retail_price` on Boost cards, so the storefront will be clean for
French Fitness only.

## Other findings

- Reported FSR100 HTTP 500 **does not reproduce**: `/products/french-fitness-fsr100-commercial-functional-smith-rack-system-new`
  returns HTTP 200 on both MAIN and the preview. Preview shows 0 "As high as" and 0 "You save"
  against MAIN's "As high as: USD $5,599.00" and "You save $1,800.00", with the campaign card at
  $3,419.10 in cart, which is 3799.00 × 0.9.
- CI run 34054548584 "CWV Regression Checks" is completed / success on `f0883f0`, but the
  "Run CWV regression script" step took under one second, so green CI here is not behavioural
  coverage of this change.
- French Fitness vendor population is 1,721. The protected deletion target list stays the original
  1,679 backed-up populated records. A full populated-value recount was deliberately not performed
  now: the controlling instruction puts that reconciliation immediately before deletion.
- Horizontal overflow at 990 px (`scrollWidth` 1097 vs `clientWidth` 990) is present on MAIN as well
  as the preview, so it is pre-existing and not introduced by this candidate.

## Global "Up to 60% off MSRP" copy inventory

15 files, 23 occurrences, two distinct classes:

1. Header utility bar: `sections/header-group.json:49`, `"text": "Up to 60% off MSRP"`. This is the
   item visible in the before/after screenshots.
2. Marketing body copy: hero `why_choose_us` / `copy_text` and the CTA "Ready to get top-branded gym
   equipment for up to 60% off MSRP?" across `sections/contact-section-hero.liquid` (2),
   `sections/homepage-section-hero.liquid` (2), `sections/section-hero.liquid` (2),
   `sections/rich-text-custom.liquid` (1), `templates/page.homepage.json` (4), `templates/index.json` (2),
   `templates/index.a_index_1762237969294.json` (2), and one each in `templates/article.json`,
   `templates/article.video-watch.json`, `templates/page.financing.json`,
   `templates/page.international.json`, `templates/page.our-story.json`,
   `templates/page.remanufactured-photos.json`, `templates/page.remanufactured.json`.

Important mechanic: in the four `.liquid` sections the string is a schema `"default"`, so editing it
changes nothing already configured. The live values live in the JSON templates and
`header-group.json`, which are theme-editor owned. Any removal has to change those, and change the
schema defaults only so the claim cannot reappear on newly added sections.

This is a storewide brand claim, categorically different from a per-product fake reference price, and
whether it is substantiated is a business and legal call rather than a QA finding. Flagged for
scoping and human review, not removed.

## Verdict

- Delta at `f0883f0`: **PASS**, with acceptance item 2 partial for the catalog reason above.
- Release: **HOLD**. Publication and deletion still need Tim's exact-SHA approval. Sequence unchanged:
  QA → exact-SHA approval → publish guard → verify live → recheck the 1,679 backed-up targets →
  bounded deletion → independent readback.
- No deletion was run. No price, compare-at, inventory, tag, discount, metafield, shared definition,
  theme publication or MAIN write was performed.

## Method note

Storefront and preview were reachable from this runtime, so this is real rendered evidence rather
than a synthetic model. Pages and their stylesheets were fetched from the live preview and MAIN, then
rendered in Chromium at the six mandated widths to read computed styles and visible text. The test
cart could not be emptied programmatically afterwards because the storefront began returning a bot
verification challenge on cart writes. It is an anonymous session cart in a sandbox, holds no
customer data, and created no order.
