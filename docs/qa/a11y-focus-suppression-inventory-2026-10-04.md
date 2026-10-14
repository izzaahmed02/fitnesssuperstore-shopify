# Item D — focus-suppression inventory (FitnessSuperstore.com theme)

Owner: Yusra. Raised by Tim's ADA/WCAG remediation assignment, 3 Oct 2026, item
P0-D. Target: WCAG 2.2 AA, SC 2.4.7 Focus Visible and 2.4.11 Focus Not Obscured.

Branch: `yusra/focused-dijkstra-4nh9go`. Base: `main` @ `5b1c5a0`.
Nothing here is published. No change to MAIN.

## How the live site was checked

Production CSS was pulled directly from the published theme rather than read
from the repo, so the findings below are what customers get today:

```
curl https://www.fitnesssuperstore.com/                      -> 200
curl .../cdn/shop/t/418/assets/base-v2.min.css?v=12513952... -> 200, 67,146 B
curl .../cdn/shop/t/418/assets/custom.css?v=12290117...      -> 200, 65,648 B
```

## 1. The two site-wide blockers (fixed on this branch)

| # | Where | Live rule | Effect |
|---|---|---|---|
| D1 | `base-v2.min.css` (render-blocking, every page) | `*:focus-visible{outline:none;outline-offset:0;box-shadow:none}` | Removes the keyboard focus indicator from **every element on the site**, in every browser, for every user. This is the root cause, not the overlay. |
| D2 | `custom.css` (render-blocking, every page) | `body.acsb-keynav :focus{outline:0!important}` | The accessibility overlay sets `acsb-keynav` in its own keyboard-navigation mode, so the indicator was stripped precisely when a keyboard user turned keyboard mode on. |

Tim's brief named `assets/base.css.liquid` as the starting point. That file
carries the same rule, but the storefront does not load it:
`snippets/stylesheet-tags.liquid` loads `base-v2.min.css`. Both are corrected so
the source and the shipped file agree.

Replacement: `outline: 2px solid #C9390D; outline-offset: 2px`, on
`:focus-visible` only, so pointer users see no change. Measured 5.15:1 on
`#FFFFFF` and 4.90:1 on `#faf9f9`, against a 3:1 minimum for a non-text
indicator. Dark header/footer surfaces get a white ring instead (15.59:1 on
`#23232B`).

## 2. Component rules that left no indicator at all (fixed on this branch)

Each of these outranks the global baseline on specificity, so fixing D1/D2 alone
would not have reached them. All are on templates named in Tim's QA matrix.

| File | Selector | Surface |
|---|---|---|
| `custom.css` | `.custom-header-search--input:focus-visible` | Header search, every page |
| `collection-section.css` | `#sel1`, `.facet-filters__sort` | Collection sort |
| `colln-grid-cards.css` | `.collnGrid #sel1`, `.collnGrid .facet-filters__sort` | Collection grid sort |
| `home-products.css`, `homepage-home-products.css`, `homepage-popular-fitness.css` | `#sel1`, `.facet-filters__sort` | Homepage product rails |
| `homepage-subscription.css` | `.homepage-subscription__input` | Homepage newsletter field |
| `cart-discounts-codes-custom.css` | `#discount-input` | Cart discount code |
| `component-list-menu.css` | `.list-menu--disclosure` | Primary navigation disclosure |
| `custom-main-product-page.css` | `.sticky-quantity` | PDP sticky quantity |
| `custom-option-picker-snippet.css`, `custom-variant-picker-snippet.css` | `.custom-color-value` | Custom colour text input |
| `product-options.css` | `.swatch` (no focus style existed) | PDP colour swatches |
| `video-carousel.liquid` | `.slick-prev`, `.slick-next`, and its own `body.acsb-keynav :focus` copy | Video carousel |

Where a rule removed the outline on `:focus` rather than `:focus-visible`, the
`:focus` rule is left as-is and a `:focus-visible` rule is added beside it, so
mouse and touch behaviour is byte-identical.

## 3. Reviewed and deliberately left alone

- **Rules that swap the outline for an equivalent `box-shadow` ring.** Dawn does
  this throughout: `.field__input`, `.select__select`, `.shopify-payment-button`,
  `.deferred-media__poster`, `a.active-facets__button` (ring moves to the inner
  span), `.card__heading a`. The indicator is present, so these pass 2.4.7.
  Flagged for the manual pass only to confirm the shadow is actually visible
  against each backdrop.
- **`base.css.liquid` `.header *[tabindex='-1']:focus`.** Suppresses the ring on
  containers that are focused programmatically and never by Tab. Correct as-is.
- **`base.css.liquid` `.focus-none`.** Already carries a "Dangerous for a11y"
  comment. No current markup uses it; left in place rather than widening scope.
- **`assets/custom.min.css`.** Carries a stale copy of the search-input rule but
  is referenced by no template. Dead file. Recommend deletion as separate
  housekeeping, not part of an accessibility release.
- **`HGS-custom-product-gallery.css` / `custom-product-gallery.css`
  `.mobile-popup-thumb`.** Replace the outline with a `2px solid #D83D0E`
  border, so an indicator exists, but `#D83D0E` is the colour that failed
  contrast in item 4 below. Needs a measurement against its real backdrop before
  anyone touches it. **Open, not fixed here.**

## 4. Related contrast finding (separate bounded item)

`sections/homepage-video-image.liquid`, the "See how we remanufacture →" link
added by #899: `#D83D0E` on the section backdrop `#faf9f9` measures **4.35:1**,
below the 4.5:1 required for normal-size text. Corrected to `#C9390D`
(same hue 14°, same saturation 88%, lightness 45% → 42%) = **4.90:1**. Scoped to
that one rule; the global `#D83D0E` brand token is untouched, and it is a
separate commit so it can be reverted on its own.

## 5. Still open after this branch

| Item | Owner | Note |
|---|---|---|
| `.mobile-popup-thumb` `#D83D0E` border indicator | Dev | Measure against its backdrop first |
| `sections/product-video-slider.liquid` | Dev | Same `<div class="video-thumbnail">` / `<span class="close-modal">` pattern as the video carousel; not in Tim's item B, which named `video-carousel.liquid` only. Live on PDPs. |
| Third-party injected CSS (overlay, Boost, Klaviyo, Globo) | Waqas (item H) | Not in the theme; cannot be audited from the repo |
| `custom.min.css` deletion | Dev | Housekeeping, not a release item |
