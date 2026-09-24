# Order-level installation — storefront presentation spec

**Status: STAGING / DISCOVERY ONLY. Production remains HOLD.**
This document is a specification. **No theme file has been changed on this
branch.** No PDP, section, snippet, cart drawer, checkout extension, Flow,
email, or setting has been modified.

Controlling record: [issue #691](https://github.com/izzaahmed02/fitnesssuperstore-shopify/issues/691),
comments [5322914980](https://github.com/izzaahmed02/fitnesssuperstore-shopify/issues/691#issuecomment-5322914980)
and [5323427245](https://github.com/izzaahmed02/fitnesssuperstore-shopify/issues/691#issuecomment-5323427245).

The calculation, the data model, the fail-closed table, the QA results, and the
blocker list live in the companion package:
`izzaahmed02/fs-bundle-api` → `docs/order-level-install-pricing-technical-package.md`
(branch `claude/order-level-install-pricing-dsm2ze`).

---

## 1. The customer selects exactly one service level

Not a Yes/No installation toggle, and not five additive merchandise lines. One
mutually exclusive selector:

| Order | Label | Owner |
|---|---|---|
| 1 | Curbside Delivery | Fitness Superstore (TJF) |
| 2 | Garage Delivery — No Unpacking / Left in Crate | Fitness Superstore (TJF) |
| 3 | Garage Installation — Assembled + Packaging/Debris Removed | National Gym Service |
| 4 | Room of Choice Installation — 0–3 Steps — Assembled + Packaging/Debris Removed | National Gym Service |
| 5 | Room of Choice Installation — 4+ Steps — Assembled + Packaging/Debris Removed | National Gym Service |

Exactly five, always. Tim's August 18 executive review settled the open
question here: `FULL_ASSEMBLY_INSTALLATION` **may remain an internal mapping
state** for products whose only valid source is the blanket "Full Assembly &
Installation — Any Room" option, but it is **not a sixth customer-facing
selection** and must never appear in this selector.

That leaves a real gap the storefront cannot close on its own. An FAI-only
product has no approved amount for Garage Installation, ROC 0–3, or ROC 4+, and
copying its "Any Room" value across those three levels is expressly prohibited.
So until **Carlos confirms how FAI-only products are labelled and mapped**, an
FAI-only product in the cart makes the installation levels `QUOTE_REQUIRED`
rather than priced. The engine enforces this (tests QA-04a and QA-04b); the
storefront must present it as "installation quote required for this product",
never by silently omitting the option or by substituting a lower level.

More than one service level may not be selected for the same order. A
split-service / mixed-destination exception is out of scope for this phase.

## 2. PDP

Remove the paid, product-specific installation selector from the future-state
design without hiding availability. Each eligible PDP shows substantially:

> Professional installation is available. Add eligible equipment to your cart to
> see one combined installation price for your order.

The PDP discloses which of these applies to the product: eligible for a
calculated price · eligible only when bundled with another installed item · not
normally installed · custom quote required.

The PDP must not state or imply a price. The amount is order-level and
destination-dependent; only the cart can know it.

## 3. Cart

The cart shows the one selector above, and for the selected level:

- products and quantities covered;
- products included at no added labor charge;
- products carrying an incremental charge;
- products **excluded** from the installation scope, named;
- products requiring manual confirmation;
- the base amount, the order/visit minimum if it applied, and any separate surcharge;
- the exact amount payable today to Fitness Superstore;
- the exact amount due separately to National Gym Service LLC;
- pricing confidence: CONFIRMED / QUOTE_REQUIRED / EXCEPTION;
- for installation levels, the fulfillment scope (see §4).

Excluded products are **named, not hidden**. "Your order is covered" when only
part of it is covered is the specific failure this design exists to prevent.

## 4. One-step vs two-step disclosure

One-step is the default for every paid installation level. Two-step is a narrow,
customer-requested parcel exception, and the scope difference must be shown side
by side wherever it can be chosen:

| | Standard (one-step) | Two-step parcel exception |
|---|---|---|
| Delivery | Equipment ships to the installer or an approved terminal; the installer delivers | UPS/FedEx delivers the parcel to you |
| Your role | None before the visit | You receive and store the parcel until the appointment |
| Visit | Installer delivers, assembles, installs, places | Installer assembles, sets up, places |
| Packaging/debris | Removed | **Not removed** |
| Price | Standard destination price | Exactly $100 less |

Two-step is offered only when every eligibility test in the technical package
passes. When the customer asks for it and the order does not qualify, the cart
shows the standard one-step service and the reason — never a silent downgrade,
and never a two-step price on a one-step scope.

## 5. Checkout

Checkout confirms scope, covered products and quantities, amount, payment
responsibility, acknowledgment, and only the site/access facts required at that
stage.

The selection must survive every enabled path: standard checkout, Shop Pay,
Apple Pay, Google Pay, PayPal, Buy Now / direct checkout, financing, Draft
Orders, payment links, and manual-payment exceptions.

Accelerated wallets skip the cart page. The service level therefore cannot live
only in cart-page UI state: it must be resolved server-side from the cart and
carried on the cart/checkout object, so a Shop Pay session that never renders
the cart page still carries the same authoritative selection and amount. This is
a design constraint on M3, and it is the main reason the calculation is not
theme JavaScript.

## 6. Payment presentation

- **Pay today to Fitness Superstore** — equipment, TJF-owned products and
  upgrades, ordinary shipping, tax, and any TJF delivery amount (levels 1–2).
- **Due separately to National Gym Service LLC** — the exact installation amount
  for levels 3–5, and any separately eligible paid warranty amount.

No installation is scheduled or released, and no paid warranty is activated,
until NGS payment is confirmed. Curbside and Garage Delivery — No Unpacking
never create an NGS obligation.

## 7. Order record

Preserved on the order: selected service level; fulfillment method; eligibility;
pricing confidence; financial owner; TJF payable and NGS due; base amount;
whether the order/visit minimum applied; destination zone key, zone approval
status, and zone-manifest version; installation multiplier; one-step
destination price; two-step final price when applicable; the complete-order
parcel result and its source, version, checked-at timestamp and reason; every covered variant GID, SKU, title, quantity, weight
source/value/unit, pricing method, source option GID and amount; excluded lines
and reasons; every exception code; customer acknowledgment; site/access answers;
NGS status; invoice reference; edit/refund/cancellation adjustment status;
rule and configuration versions.

A later quantity change, removal, substitution, cancellation, partial refund, or
order edit must reprice or raise a visible exception. Leaving the original
amount silently unchanged is a defect, not a default.

## 8. Not changed by this branch

`sections/`, `snippets/`, `blocks/`, `assets/`, `templates/`, `config/`,
`locales/` — untouched. The only file added is this document. Wiring is M3 in
the technical package and is gated on the staging store and on Carlos's wording
confirmation.

---

## 9. August 23, 2026 correction addendum

Applied from Tim's August 18 executive review (issue #691 comment 5332409911).
Where this section and the body above disagree, this section controls.

1. **Exactly five customer-facing choices.** Section 1 is updated in place;
   `FULL_ASSEMBLY_INSTALLATION` is internal-only.
2. **Quote-required is a display state, not an error.** Under the interim money
   rule a cart resolves `QUOTE_REQUIRED` whenever quantity exceeds 1, more than
   one explicitly priced machine is present, or the destination does not map
   through an approved zone list. On today's data that covers most real carts,
   including every lower-48 destination while the Zone 1A allowlist is
   outstanding. The storefront must therefore treat "installation quote
   required" as a first-class, well-designed path, not an edge case: the
   equipment sale must still complete, the customer must see that installation
   is available and will be quoted, and no amount may be shown as final.
3. **Two-step is not offered by default.** It requires an explicit customer
   request *and* an approved complete-order parcel result. No approved parcel
   source is registered today, so two-step must not be surfaced in the UI at all
   until B5 closes.
4. **Never show a computed amount that the engine marked as an audit subtotal.**
   The result object separates `amounts.auditSubtotalCents` from
   `amounts.finalCents`, and `finalCents` is `null` exactly when the amount is
   not customer-authoritative. Bind the customer-facing figure to `finalCents`
   only.
