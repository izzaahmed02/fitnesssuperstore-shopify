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

---

# Addendum, 20 September — the SupaEasy rule is configured to block, and the instruction-limit defect is not

Two further screens captured. Read-only: nothing activated, deactivated or saved.

- `docs/qa/evidence/checkout-rules-product-bundle-tooltip-2026-09-20.png`
- `docs/qa/evidence/supaeasy-zero-subtotal-validator-2026-09-20.webp`

## There is no linked report

The information icon on the `product bundle` row is a plain tooltip reading
**"This function is controlled by the app developer."** It is not a link and
there is no report behind it. The banner carries no hyperlink either. So the
"report it links to" does not exist as a Shopify artifact. The only per-invocation
detail available is the **Logs** tab inside the SupaEasy app, visible in the
second screenshot and not yet opened.

## What the SupaEasy rule actually does

SupaEasy > Functions > Functions Creator, function type **Validation**, currently
inactive (the header offers Activate, not Deactivate):

| Field | Value |
|---|---|
| Campaign | Conditionally Validate Cart and Checkout — "Prevent any checkout when the conditions are match" |
| Campaign name | **$0 subtotal validator** |
| Qualifier behaviour | **Block if all qualify** |
| Customer qualifier | None |
| Cart qualifier | Cart current subtotal amount **Less than or equal to 0** |
| Error, user journey | **CompletingCheckout**, target `cart` |
| Error message | "An error has occurred. Unable to proceed in placing this order, please contact sales@fitnesssuperstore.com" |
| Function complexity | 4.57 / 100 |

So this rule blocks checkout outright whenever the cart subtotal reaches zero or
below, and shows a generic error at the point of order submission.

## Why this matters for Tim's question

The instruction-limit defect and this rule fail in opposite directions.

When the cart transform exceeds its instruction budget it **fails silently**. The
live JS says so in its own comment: the line "silently falls back to its
un-expanded base price." That is the Order #49333 shape, and its symptom is
**undercharging**, $4,856.10 uncharged, not a blocked checkout. An
`InstructionCountLimitExceededError` does not stop a customer submitting an
order.

The banner's second clause is "**were unable to submit orders**." Nothing in the
instruction-limit failure mode produces that. A validation rule configured to
**Block if all qualify** at **CompletingCheckout** does produce exactly that, and
the SupaEasy rule is the only validation configured to block.

Combined with the dates already established, 30 May against errors that begin
10 September, this points away from the instruction-limit defect and toward the
`$0 subtotal validator` for at least the "unable to submit" half of the banner.

Stated as a hypothesis, not a conclusion. Confirming it needs the SupaEasy Logs
tab and the date the rule was activated and later deactivated.

## I could not reproduce a live trigger, which is itself informative

For the rule to fire, a cart subtotal must reach zero or below. I tested the two
mechanical routes to that and both are currently closed.

**Route 1, a reduction larger than the parent price.** The live JS folds negative
options into the base price and then floors it:

```js
if (unitPrice < 0) { basePrice += unitPrice; }   // negatives fold into base
...
if (basePrice < 0) basePrice = 0;                 // floor
```

Note the negative option is still emitted as a child at `0`; only a `0`-priced
option is skipped. So a parent whose reduction exceeds its price yields a parent
child at `$0.00` plus a condition child at `$0.00`, and a single-line cart in that
state has a subtotal of exactly **$0.00**.

Across the 29 August estate scan, 184 rows carry a reduction and 160 of those
have a resolvable base price. Exactly **one** has reduction >= base:
product 9878593601852, FF-RGOP-100, reduction 62.37 against a 0.00 base,
dispositioned CONFLICT. Read live today it is **ARCHIVED**, priced 0.00, with
inventory -99, so it cannot be added to a cart.

**The remaining 24 reduction-bearing rows have no base price recorded and are
outside this check.** That is where a reachable case could still hide, and it is
the obvious place to look next.

**Route 2, a live product priced at $0.00.** Two ACTIVE published products are
priced 0.00, `Rig - Wall Mounted` and `Rig - Floor Mounted`. Both read
`inventoryPolicy: DENY`, `inventoryQuantity: 0`, `availableForSale: false`, so
neither can be added to a cart either.

So no reachable trigger exists in today's catalogue. That is consistent with the
rule having been switched off after the errors were noticed, and with a banner
that reports a start date rather than an ongoing state. It is not evidence that
nothing happened between 30 May and now.

## Revised next steps

1. Open **SupaEasy > Functions > the checkout-validation function > Logs**. That
   is the only per-invocation record and it is what Tim's "report" should have
   been.
2. Establish when the rule was **activated** and when it was **deactivated**. If
   activation lands on or near 30 May the attribution is settled.
3. Resolve base prices for the 24 reduction-bearing rows the scan left blank, and
   re-run the reduction >= base check against them.
4. Qash and Izza still owe the affected-checkout count and error detail for
   30 May to date.

Nothing here changes any ruling on the Post Avis Phase 2 candidate, and the
candidate does not contain this rule.
