# Flooring installation — storefront presentation spec

**Status: STAGING / DISCOVERY ONLY. Production remains HOLD.**

This document is a specification. **No theme file has been changed on this
branch.** No PDP, section, snippet, cart drawer, checkout extension, Flow,
email, metaobject, product option, tag or setting has been modified, and none is
requested.

Controlling records: Tim's emails of August 12 2026 17:27 UTC, August 14 23:16
UTC, August 14 23:44 UTC and **August 24 13:41 UTC** (official #49158 cost facts,
the consistent revised staging model, and the FB1–FB8 rulings), and
[issue #691](https://github.com/izzaahmed02/fitnesssuperstore-shopify/issues/691).

The calculation, the exact rate card, the fail-closed table, the test evidence
and the blocker list live in the companion package:
`izzaahmed02/fs-bundle-api` → `docs/flooring-installation-pricing-technical-package.md`
and `staging/flooring-pricing/` (branch `claude/flooring-pricing-model-6qwh32`).

---

## 1. The problem this replaces

Tim's goal is explicit: "My goal remains to make all three flooring-installation
scopes selectable online… The customer must be able to continue without relying
on a generic 'call for installation' dead end."

What exists today on the nine ACTIVE flooring products carrying
`flooring-installation-required`:

- The tile and mat PDP option metaobjects point to **"No Thanks"** and **"Custom
  Installation Quote — Call or Email for Quote"**. Neither scales with area or
  quantity.
- The combined turf PDP does not carry the same installation option structure at
  all.
- The UNLISTED **Flooring Installation (1296)** product carries flat `$0` / `$200`
  / `$300` variants with a turf-specific, internally inconsistent description. It
  is a historical reference only and must not become the pricing engine.

## 2. The customer selects exactly one scope

Three mutually exclusive choices, worded exactly as Tim specified. Not a
Yes/No installation toggle, and not three additive merchandise lines.

| Order | Label |
|---|---|
| 1 | Install Flooring (No Cutting, No Gluing) |
| 2 | Install & Cut Flooring (No Gluing) |
| 3 | Install, Cut, & Glue Flooring |

Exactly three, always. There is no fourth scope and no "no installation" scope:
a customer who does not want installation simply does not select one.

This selector is **order-level**, not per-product. One flooring job on one visit
gets one scope. It lives in the cart, not on the PDP, because only the cart can
know the total quantity and the destination.

## 3. PDP

Each eligible flooring PDP replaces "Call or Email for Quote" with availability
plus an honest statement of what the price depends on:

> **Professional flooring installation is available.** Add the flooring quantity
> you need to your cart, then choose installation with no cutting, cutting only,
> or cutting and gluing. Your estimate is based on the area you are actually
> installing. Final eligibility depends on installation area, substrate, access
> and project conditions.

The PDP **must not state or imply a price**. The amount is order-level and
depends on facts the PDP does not have.

The PDP does disclose which of these applies to the product, because it differs
by family and the customer should not discover it in the cart:

| Family | Products | PDP disclosure |
|---|---|---|
| Tile | FF-RIT24 (Middle / Edge / Corner), FF-RITGF, FF-RSGF | All three scopes available; estimate calculated in cart |
| Mat | FF-HDRFM | Install and Install & Cut available; gluing requires a quote |
| Rolled rubber | FF-RRGF | Installation available; **priced by quote** |
| Turf | FF-AGSL, FF-AGSL-V2, FF-AGSL-V3, FF-APGT-1450 | Installation available; **priced by quote** |

Five of nine products are quote-only. Tim's FB2 ruling on August 24 makes that a
decision rather than a gap: *"Keep installation available in the customer path,
but collect facts and price manually."* So the storefront's job here is to make
manual pricing feel like a service, not a dead end — the option is offered, the
site facts are collected, and the customer is told a price is coming. Never
"installation not available", and never by hiding the option.

### 3.1 Reuse the tile calculator that already exists

`assets/tile-calculator.js` already converts a room's dimensions into a tile
quantity on flooring PDPs. It is the natural place to also capture **the area the
customer is actually installing**, which is the single most valuable input the
pricing engine needs and the one the current flow throws away.

Proposed, and deliberately not built on this branch: the calculator writes the
computed area to a cart attribute alongside the quantity it already sets. The
customer types their room size once, and both the tile count and the installation
area come from it. This is a small change to an existing component, and it
removes the main reason a flooring quote would otherwise fall back to purchased
coverage.

## 4. Cart

The cart shows the three-scope selector and, for the selected scope:

- the flooring products and quantities covered;
- **purchased coverage** — what the ordered quantity covers;
- **installation area** — what the customer is actually installing, entered here
  or carried from the PDP calculator;
- the calculated estimate, or the reason there is not one;
- separately identified materials and surcharges, never folded into the estimate;
- equipment movement, shown as its own line;
- whether provider confirmation is required.

### 4.0 Adhesive, on Scope C

Tim's August 24 rule gives the quantity — `ceil(installed sq ft / 850)` pails —
but explicitly leaves the **customer material price, handling margin and tax
treatment unapproved** (FB3). So the cart may state the scope and the quantity,
and must not state a customer amount:

> **Adhesive:** 6 pails required for 4,805 sq ft. Priced separately and confirmed
> by National Gym Service with your installation quote.

No dollar figure until Finance approves a markup and a tax treatment. The
engine's internal cost reference is not a customer price and must never be
rendered as one. Where an installer has adjusted the pail count for a documented
substrate, trowel, porosity, waste or manufacturer reason, the cart shows the
adjusted quantity, not the calculated one.

**Purchased coverage and installation area are shown as two distinct numbers.**
This is the customer-facing half of the rule that labor is never charged on
unused waste or spare material. If a customer buys 465 tiles for a 4,804.8 sq ft
room, the cart must show 5,005.2 sq ft purchased and 4,804.8 sq ft priced, and
must not charge labor on the 200 sq ft difference.

### 4.1 Required site inputs

As short as possible, but every one of them changes feasibility or price, and an
**unanswered** question is treated as a blocker rather than as a "no":

- installation ZIP;
- residential / commercial / public facility;
- actual area being installed;
- substrate (concrete / wood subfloor / existing tile / other / unknown);
- must existing flooring be removed?
- is cutting required, and is the room a simple rectangle?
- is gluing requested?
- must equipment be moved, and roughly what?
- stairs, elevator, narrow access, restricted hours?
- photos or a plan, for material projects;
- desired timing — **stated as a request, not a commitment**.

### 4.2 The three things the cart may say about money

| Engine status | Cart presentation |
|---|---|
| `NGS_CONFIRMATION_REQUIRED` | "Estimated installation: $X — **National Gym Service confirmation required**." Amount shown, never presented as owed. |
| `QUOTE_REQUIRED` | "Installation selected — **we will price this and contact you**", with the reason in plain language. No number. |
| `ESTIMATE` | Not reachable today. See below. |

Never a `$0` installation line. Never a silent omission. Never a scope downgrade.

**Only two of those three are live copy.** Tim's FB4 ruling keeps every
calculated flooring amount provider-confirmation-required until a validated
service-area or market rule exists, so on today's rules the cart always shows an
amount *plus* "confirmation required" — there is no plain-estimate state to
write copy for yet. The first row is what the cart will say the day FB4 lifts;
it is specified now so the copy review can cover both, but it must not ship as
reachable text while the ruling stands.

Two further reasons the confirmation line stays on:

- **Every Scope C project is confirmation-required**, independently of FB4,
  because the adhesive customer price is unapproved.
- **Any project above 1,500 sq ft** displays its estimate but stays
  provider-confirmed.

## 5. Order record

Per flooring order, store: scope 1/2/3 with its exact label; purchased coverage;
installation area and whether it was verified or customer-reported; the area
actually priced for labor; every flooring line's variant GID, SKU, title,
quantity and coverage per unit; the band, rate, tier floor and whether the floor
applied; materials and surcharges — including the adhesive product, pack size, coverage
reference, calculated pail count, any override with its documented reason and
author, and the adhesive reference version; equipment-movement lines; substrate
and site answers with a photos link; pricing status and confirmation reason; the
config and rule version; and NGS amount, payment status and any edit/refund
adjustment.

The rule version matters, and this thread has already proved it: an order priced
under `FLOORING_INSTALL_RULES@2026-08-23.1` carried Scope B at $1.60/sq ft in
band 1, and one under `@2026-08-25.2` carries $1.10. Both must remain
explainable after the rules change again.

## 6. Order edits, cancellations and refunds

Flooring labor is recalculated from the **installation area**, not from the
remaining quantity. Reducing tile quantity does not reduce labor unless the area
being installed also changes — and if the reduced quantity no longer covers the
stated area, the order fails closed to a quote rather than repricing itself.

A partial cancellation that removes all flooring lines removes the flooring
labor obligation. A partial cancellation that leaves a smaller flooring order
requires a re-quote, not an automatic proportional reduction.

Adhesive follows the installed area for the same reason labor does, and its
ceiling makes it lumpy: 4,805 sq ft and 5,000 sq ft are both six pails, while
5,101 sq ft is seven. A small change in area can therefore move the material
line by a whole pail or not at all, and the cart must show the recalculated
quantity rather than scaling the previous one.

## 7. What this spec does not authorize

No live PDP, section, snippet, product option, metaobject, price, tag,
metafield, cart, checkout, policy, email, Flow or accounting change. The
customer-facing wording above is a draft for legal, Finance/CPA and Tim's
review, not approved copy.
