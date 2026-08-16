# T-006 — Dependency register entry and overlap review: PR #703

**Owner:** Zafran (technical SEO co-lead — architecture, schema, canonical, robots, CWV, independent release-gate review)
**Authority:** Tim's August 9 decision on the *Technical SEO recovery sprint* thread — register PR #703 as a dependency of `T-006` before either workstream merges, and review only the material overlap.
**Status:** Dependency registered. Overlap reviewed. **Not signed off.**

> **UPDATE, 2026-08-16 — Tim's August 14 Stage 0 HOLD decision changes item 3 below from a
> question into a required change.** The reference-price source of record is decided:
> `custom.retail_price` is the single source for the visible price, the savings figure
> **and** the JSON-LD `ListPrice`, permitted only when the verification flag is true, the
> source is recorded, the effective and last-reviewed dates are populated, and the visible
> and structured values are identical. **`compare_at_price` may not be used as a
> `ListPrice` fallback** unless separately substantiated through the same control.
>
> As it stands **this PR does not satisfy that decision.** Its schema gate reads
> `compare_at_price` (`schema-product.liquid:105`, `:176`), and `price-reference.liquid:45`
> falls back to `compare_at_price` when `retail_price` is absent. Both must change.
> Separately, Tim has directed that #700 and #703 be reconciled onto **one** current-main
> implementation path rather than a third schema rewrite — see the plan's §0A.3 and §0A.4.
> Stage 0 remains HOLD; independent review resumes after Izza posts the refreshed draft PR
> and preview evidence.
**Nothing is deployed by this document.** It is a register entry and a review record. No theme, robots, redirect, canonical, schema or feed change is made here.

This is the T-006 dependency line, written to be folded into
`docs/seo/technical-seo-recovery-ticket-plan.md` on the plan branch. It is not a
second tracker — Control Tower keeps one dependency line in the existing record
and links here for the evidence.

---

## 1. Dependency register entry

| Field | Value |
|---|---|
| Depends on | PR #703 — *Gate reference-price and savings displays on documented substantiation* |
| URL | https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/703 |
| Head branch / commit | `claude/gmc-data-deception-issues-i79kys` @ `dd3516d` (single commit) |
| Base | Branched from `f914cb0` (merge-base with `main`); GitHub records the PR base as `d0e52fd`. Either way it is **behind current `main`, `a8805bf`** and needs refreshing |
| PR state | Draft; `mergeable_state: blocked` |
| Originating workstream | GMC data issues ("Remove Save 40% Everywhere") — separate from this sprint |
| Author | Zafran |
| Overlap surface | `snippets/schema-product.liquid` (shared with `T-006a`, `T-006d`), plus public price/savings rendering across 3 product sections and 8 snippets |
| Coupling | **Must not merge independently of the technical SEO release gate.** Sequencing below. |
| Feed gate | Kevin + Yusra (`T-016`) — unchanged, and now also covers the `ListPrice` removal |
| Rollback | Single-commit revert of `dd3516d`; supporting metafields are empty, so revert restores prior display exactly |

**Effect on `T-006` sub-items**

| Sub-item | Effect of #703 |
|---|---|
| `T-006a` fabricated defaults | No overlap in substance, **same file** — merge-order conflict surface only |
| `T-006b` `itemCondition` | No overlap |
| `T-006c` review source of record | No overlap |
| `T-006d` oversized graphs | Same file, and #703 removes the two `priceSpecification` arrays from the per-variant `Offer` loop, which slightly reduces graph size. No conflict in intent |
| `T-006e`–`T-006g` | No overlap |

**Sequencing.** #703 is one commit and cleanly revertible; the `T-006` work is a
large rewrite of the same file. Rebase `T-006` onto #703, not the reverse. If
#703 is held, `T-006` must not silently inherit the ungated `ListPrice` — it is
listed as an explicit acceptance item below.

---

## 2. Scope of this review

Per the August 9 direction, only the material overlap: storefront price parity,
sampled raw HTML and JSON-LD, `ListPrice`/compare-at behaviour, Merchant
Center/feed impact, tests, and rollback. No full-site reconciliation.

**What is established here versus what still needs a live check.** Everything in
§3 is confirmed by reading the code at `dd3516d` and citing the line. Items
marked **LIVE** cannot be settled from code and need a preview or a sampled
storefront check before sign-off. I would rather separate those than present a
code path as a confirmed production defect.

---

## 3. Findings

### 3.1 Storefront price parity

**F1 — One ungated reference-price surface remains. (code-confirmed; live-checked)**
`sections/homepage-popular-fitness.liquid:89-92` still renders
`product.metafields.custom.retail_price` into `.old-price-wrapper` with no
substantiation check. That section is live in both `templates/index.json:356`
and `templates/page.homepage.json:384`, and it renders on the production
homepage today. Every comparable card surface (`product-item`,
`related-items`, `related-items-colln`, `product-items-home`,
`homepage-product-items-home`, `extra-info`) was routed through
`price-reference`; this one was missed. The second price block in the same file
(lines 104-112, `compare_at_price` strikethrough) is inside a `{% comment %}`
and is dead — no action there.

Sizing it honestly rather than leaving it as "a surface": `custom.retail_price`
is populated on **2,145 products**, so the gap is live for any featured product
carrying that value. On the homepage as fetched on 2026-08-16 the three sampled
cards in that section rendered a selling price only, because those particular
products have no `retail_price` — so the miss is currently latent rather than
visibly publishing an unsubstantiated price. It publishes the moment the
merchandising selection changes.
**→ Blocks sign-off.** One-line fix, same `part: 'card'` pattern as the sibling snippets.

**F2 — Metafield read changed from the object to `.value`, and cards changed from an existence check to a comparison. (code-confirmed; units verified)**
`snippets/price-reference.liquid:45` reads
`product.metafields.custom.retail_price.value`, where the replaced code read the
metafield object directly (e.g. pre-PR `sections/main-product.liquid`,
`{% if product.metafields.custom.retail_price > ...price %}`).

The units question this raised is now settled and is **not** a problem. The
definition is typed `number_integer` and the values are stored in cents — a
sampled product carries `559900` against a `$3,799.00` selling price. Liquid's
`variant.price` is also in cents, so both the `>` comparison and the `money`
filter are consistent. No unit mismatch.

Worth recording as an improvement rather than a risk: the card snippets
previously rendered on `retail_price != blank` — an existence check with no
comparison — so a retail price at or below the selling price would still have
printed. `price-reference` requires `reference_price > selling_price`, which
closes that quietly.
**→ Still wants one sampled raw-HTML check** on a product with
`reference_price_verified` true and `retail_price` populated, before the first
product is flagged — to confirm `.value` resolves as expected in the live
Liquid runtime rather than only on type grounds.

**F3 — Visible reference price and JSON-LD `ListPrice` read different sources. (code-confirmed; divergence sampled)**
Visible: `price-reference.liquid:45` — `custom.retail_price`, falling back to
`compare_at_price`.
Markup: `schema-product.liquid:105-111` and `176-182` — `compare_at_price` only.
Both are behind the same gate, so nothing unsubstantiated is published either
way. But where a product has both values and they differ, the customer sees one
number and Merchant Center reads another. That is exactly the `T-006` global
rule — visible page content must match schema — so it should be settled inside
`T-006`, not left to the two workstreams separately.

**This is not hypothetical, and the common case is worse than a mismatch — it is
a total absence.** `retail_price` is populated on 2,145 products, and in a
sampled set of products carrying it, every one had **no compare-at price at
all** (for example `french-fitness-fsr100-…`: `retail_price` 559900,
`compareAtPrice` null). For any such product, once flagged verified, the page
would show "MSRP $5,599.00 — You save …" while the JSON-LD emits **no
`ListPrice` whatsoever**, because the schema gate additionally requires
`compare_at_price > price`. Visible and markup would not merely disagree; the
markup would be silent. That is the strongest argument for pointing both at the
same field.
**→ Recommend one source of record for the reference price**, the same way
`T-006c` settles review data. My position: `custom.retail_price` is the
documented reference price, so the schema should read the same field and fall
back to `compare_at_price` only where `price-reference` does. Needs Tim's GO as
a `T-006` decision.

**F4 — Client-side repaint on the two variant PDP sections is not gated. (code-confirmed; behaviour LIVE)**
`sections/main-product-variants.liquid:3935-3947` and
`sections/main-product-comb.liquid:3912-3924` — on variant change, `paint()`
writes `compare_at_price` into `.pr_custom_compare_price s` and `"You save " + X`
into `.you-save` from the variant JSON, with no reference to the gate.
It **fails closed today**: #703 only renders those two elements when the gate
passes, so on an unverified product the selectors match nothing and the painter
no-ops. That is the correct outcome, but it holds by the absence of an element
rather than by an explicit check, which a later markup change can undo without
any test noticing.
On a **verified** product the painter is active, and there the reference price
switches source to `compare_at_price` on the first variant change (see F3), and
the savings figure is written with no disclaimer (see F5).
**→ Needs a preview check** on a verified multi-variant product before any
product is flagged. Recommend also passing the gate into the section JSON so the
painter checks it explicitly.

**F5 — Disclaimer coverage is uneven. (code-confirmed)**
The disclaimer ("Savings shown against MSRP…") is rendered only by
`price-reference.liquid` `part: 'savings'`, which only `sections/main-product.liquid`
uses. The variants and combined-listing PDPs use `part: 'reference'` plus the
JS-painted savings, and every card surface uses `part: 'card'`. So a savings
figure can appear without the disclaimer on the two highest-traffic PDP
templates.
**→ Should be closed before flags are set.** Whether cards need it is a copy
decision, not mine to make.

**F6 — Sale badging still keys off raw compare-at. (code-confirmed; pre-existing, not introduced by #703)**
`snippets/price.liquid:71-72` adds `price--on-sale` / `volume-pricing--sale-badge`
whenever `compare_at_price > price`, regardless of the gate;
`snippets/product-item.liquid:35` renders a "Sale" tag on
`compare_at_price != blank` (not even greater than price);
`snippets/card-product.liquid:138` and `:559` render sale badges on the same raw
comparison. After #703 a product can therefore show sale styling and a "Sale"
tag while displaying no reference price at all.
A badge is not a reference-price display and I am not calling this a blocker.
It is an internal inconsistency that needs **one documented position** so the
classification is defensible if it is ever questioned.

*Out of scope, noted once and not pursued:* the site-wide "up to 60% off MSRP"
copy in the hero/header sections is a company-level claim, not a per-product
reference price, and the PR description records it as the approved wording. No
full-site reconciliation performed, per the August 9 direction.

### 3.2 Sampled raw HTML and JSON-LD

No preview environment exists for this branch yet, so this section is a **code
read plus a static check**, not sampled evidence. Stated plainly rather than
recorded as verified.

- Gate is evaluated server-side in Liquid at `schema-product.liquid:6-8`, so with
  JavaScript disabled the `priceSpecification` block is absent from initial HTML
  on every product while no flag is set. Nothing browser-only in the schema path.
- `snippets/schema-collection.liquid` and `snippets/schema-ld-json.liquid` emit
  no compare-at, `ListPrice` or `priceSpecification` at all — checked. So the
  collection graph needs no equivalent gate, and `T-006d` can proceed
  independently.
- `snippets/price.liquid` fails closed when rendered without a product
  (`snippets/card-product.liquid:617` renders it with no `product`): the gate
  sets `show_compare_at_price = false`. Correct behaviour.

**Required before sign-off (LIVE):** the `T-006` QA matrix run against a preview
of #703 — new simple, new multi-variant, remanufactured, combined-listing parent
and child, out-of-stock, Tier-1 collection — capturing raw HTML with JavaScript
disabled and the JSON-LD, in both flag states, plus Rich Results Test and Schema
Markup Validator per template.

### 3.3 `ListPrice` / compare-at behaviour

Confirmed at `schema-product.liquid:105` (single/selected-variant `Offer`) and
`:176` (per-variant `Offer` loop). Both `priceSpecification` arrays — the
`ListPrice` and its paired `SalePrice` — are now conditional on
`reference_price_verified and compare_at_price > price`.

Consequences, stated for the record:

1. With no product flagged, **no product emits `ListPrice` or `SalePrice`**. The
   `Offer` still carries `price`, `priceCurrency` and `availability`, which is
   what Merchant Center requires; only the reference-price claim disappears.
2. `SalePrice` is removed alongside `ListPrice`. That is correct — a sale price
   asserted without a reference price is the same claim in another field.
3. `Offer.price` itself is untouched by #703.

### 3.4 Merchant Center / feed impact

- The diff contains no write to `price`, `compare_at_price` or
  `custom.retail_price`, and no feed file. Verified across all 16 changed files.
  This is display and structured data only, as the PR description states.
- The structured-data change is nevertheless read by Merchant Center, so
  **Kevin's sign-off still gates merge** under `T-016`, and this review does not
  substitute for it. What Kevin needs to assess is narrow: the disappearance of
  `ListPrice`/`SalePrice` from PDP markup while the feed's own price attributes
  are unchanged, and whether any GMC promotion or annotation currently relies on
  the markup reference price.
- `srsltid` and landing-page matching are unaffected — no URL, canonical or
  robots behaviour is touched by #703.
- `izzaahmed02/fs-bundle-api` remains a one-line verification dependency and is
  **not changed by #703**: the cart transform sets fixed unit prices on expanded
  bundle items (`extensions/product-bundle/src/cart_transform_run.rs:216`, `:251`,
  `:292`), so the amount charged can differ from the PDP `Offer.price`. #703
  touches `ListPrice` only, so that dependency stays exactly where the plan put
  it — under `T-006` Offer truthfulness.

### 3.5 Tests

- `cwv-regression` on `dd3516d`: **success** (run 31318224846). Re-ran
  `scripts/cwv_regression_test.py` locally against the PR head — passes. The
  earlier failure on this PR (August 6, run 31118479048) predates the current
  commit.
- **No test covers the gate itself.** Nothing asserts that "As high as", "Retail
  Price", "You save" or a `ListPrice` `priceSpecification` cannot be emitted
  without `reference_price_verified`. The whole control is one metafield read
  repeated in ten files, and a future refactor can reintroduce an ungated display
  exactly the way F1 shows one was missed in the first pass.
  **→ Recommend a substring assertion** in `scripts/cwv_regression_test.py`
  before merge. Per Tim's `T-019` ruling this is a **new** assertion rather than
  routine alignment, so I am surfacing it for review rather than treating it as
  test maintenance. It changes no threshold, representative URL or measurement
  methodology.

### 3.6 Rollback

Adequate. Single commit `dd3516d`, revertible in one operation, theme version
pinnable at release. **Verified independently against the live store on
2026-08-16:** all five `compliance.*` definitions exist and every one reports a
population of **0 products** — `reference_price_verified`,
`reference_price_type`, `reference_price_source`,
`reference_price_effective_date`, `reference_price_last_reviewed`. So the PR's
"empty on all products" claim holds, a revert restores the prior display exactly
with no data migration and no orphaned state, and on merge every reference-price
and savings display goes dark until a product is deliberately flagged.
Reverting after products have been flagged is also safe — the flags simply stop
being read.

One sequencing caveat: once `T-006` rebases onto #703 and rewrites
`schema-product.liquid`, "revert #703" is no longer a single clean operation.
The evidence pack for the combined release should therefore carry one rollback
path for the merged state, not two independent ones.

---

## 4. Acceptance conditions for my sign-off

`T-006` merge is gated on my review of the schema, canonical, robots and redirect
changes. For the #703 overlap specifically, sign-off needs:

1. **F1 closed** — `homepage-popular-fitness.liquid` routed through
   `price-reference`.
2. **F5 closed** — disclaimer rendered wherever a savings figure is shown, at
   least on the two variant PDP templates.
3. **F3 — no longer a decision, now a required change.** Decided 2026-08-14:
   `custom.retail_price` is the single source for the visible price, the savings
   figure and `ListPrice`; **no `compare_at_price` fallback for `ListPrice`**;
   permitted only with the verification flag, a recorded source, populated
   effective and last-reviewed dates, and identical visible and structured
   values. `schema-product.liquid:105`/`:176` and `price-reference.liquid:45`
   must be changed to match.
4. **F2 and F4 evidenced on preview** — sampled raw HTML and JSON-LD in both flag
   states, including one variant change on a verified multi-variant product.
   An unpublished isolation theme now exists for the CWV workstream
   (`gid://shopify/OnlineStoreTheme/187691401532`); this PR still needs its own
   connected preview, which is Izza's to establish.
5. **F6 documented** — a written position on sale badging without a visible
   reference price.
6. PR refreshed onto current `main` (it branched from `f914cb0`; `main` is now at
   `575a8de`), and the regression assertion in §3.5 decided either way. It stays
   **draft** — Stage 0 is HOLD and nothing here is approval-ready.
7. **Reconciled with PR #700** onto one implementation path, per Tim's August 14
   direction. #700 already carries the condition omission and product-fact default
   removals; three competing schema rewrites are not to be maintained.

Items 1, 2 and 6 are mechanical. Item 3 is now a code change with a decided
target rather than an open question. Items 4, 5 and 7 are the substantive
remainder, and 4 is blocked only by the absence of a preview for this branch.

---

## 5. Incidental confirmation — the "Boost" line in the CI scope

Not part of this dependency, recorded here because it closes an open question
from the August 8 reply rather than leaving it to be re-investigated.

The theme contains `templates/product.boost-test.json` and
`templates/collection.ab-test.json`, which is the likely origin of the "Boost
product grid" wording in the Lighthouse CI scope. Neither template references
Boost or `bc-sf-filter` — checked. `collection.ab-test.json` runs
`main-collection-product-grid`, the custom stack. So the naming is historical and
Izza's read of the collection stack stands. The search line of the third-party
budget table should name the custom facets script, not Boost.
