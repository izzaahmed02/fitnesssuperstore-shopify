# May 30 2026 checkout error banner — evidence and first read

Captured 20 September 2026 from Shopify admin, Settings > Checkout, production
store (Fitness Superstore, www.fitnesssuperstore.com). Read-only: no setting was
changed, no rule enabled or disabled, nothing saved.

Requested by Tim on the "Accessory or add-on options not calculating correctly in
my cart" thread, 20 September 02:34: "Yusra, post the banner screenshot and the
report it links to here."

Screenshot: `docs/qa/evidence/checkout-error-banner-2026-09-20.webp`

## What the banner says, verbatim

> There were errors during checkout starting May 30, 2026. Some customers have
> abandoned checkout or were unable to submit orders.

It sits inside the **Checkout rules** card, directly under the rule list, so it
is scoped to the checkout rules rather than to checkout generally.

## The Checkout rules inventory, as shown

| Rule | Provider | Status |
|---|---|---|
| `checkout-validation` | SupaEasy | **Inactive** |
| `product bundle` | izza-bundle | **Active** |

Two things worth separating, because the names collide with ours:

- `checkout-validation` **by SupaEasy** is a third-party app. It is *not* the
  `extensions/cart-validation` extension in `fs-bundle-api`. It is Inactive.
- `product bundle` **by izza-bundle** is the live production function, the
  `izza-bundle-20` app referenced throughout the Post Avis thread. It is the only
  Active checkout rule.

So the one Active rule that the banner can be attributable to is the production
bundle function.

## The date is the finding

Tim's question was whether this is the `izza-bundle-20` instruction-limit failure
or an earlier, second defect.

The `InstructionCountLimitExceededError` entries Tim cited from the production
error log begin **10 September 2026**. This banner reports errors beginning
**30 May 2026** — fifteen weeks earlier.

On dates alone these cannot be the same defect. The instruction-limit failure may
well be *contributing* to the banner from 10 September onward, but it cannot
explain 30 May to 9 September. **Treat this as a second, earlier defect until
something disproves it.**

## What I could not verify, and why

- **Function and validation registration.** `validations`, `shopifyFunctions` and
  `cartTransforms` all come back empty or access-denied on the API token
  available to me (`cartTransforms` requires the `read_cart_transforms` scope).
  So the rule list above rests on the admin screenshot, not on an API read.
- **The linked report.** The banner carries no visible hyperlink in the card. The
  detail is behind the information icon on the `product bundle` row. That needs a
  click in admin, which is a UI action rather than an API read.
- **Abandoned checkouts before 8 June.** The oldest abandoned-checkout record
  retrievable today is **2026-06-08**. Nothing reaches back to 30 May, so the
  first nine days of the banner's window cannot be corroborated from that source
  at all. This is the same retention problem Tim already flagged for the run log.

## One negative result worth recording

I pulled the 25 oldest retrievable abandoned checkouts, 8 June to 22 June 2026.
**None carries a bundle option line.** Every one is a plain single-product or
two-product cart with no `Condition - ...` child line of the kind a configured
bundle produces on an order.

Read this carefully rather than as exoneration. It cuts two ways:

1. It is weak evidence against the bundle rule driving the abandonment recorded
   in that window, since the abandoned carts are not configured carts.
2. It is equally consistent with the opposite reading. A customer who "was unable
   to submit the order" may never produce an abandoned-checkout record at all, in
   which case the configured-cart failures are precisely the ones missing from
   this data.

Distinguishing the two needs the admin report behind the information icon, or the
checkout error detail Qash and Izza were asked to pull. It is not answerable from
the abandoned-checkout records.

## Status

Evidence posted. The attribution question stays open and is Qash's and Izza's to
close with the affected-checkout count and error detail for 30 May to date.
Nothing here changes any ruling on the Post Avis Phase 2 candidate.
