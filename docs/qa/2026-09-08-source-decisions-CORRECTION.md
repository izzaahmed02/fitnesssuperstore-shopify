# CORRECTION — my 8 September finding on Larianne's 29 bases was wrong

**Reviewer:** Yusra | Fitness Superstore (Independent QA)
**Date:** 2026-09-08, later the same day
**Supersedes:** the blocking finding in `docs/qa/2026-09-08-source-decisions-verification.md` §2

Larianne challenged the finding and she is right. This document withdraws it and records what
the evidence actually shows. Read-only throughout; nothing was written anywhere.

---

## 1. What I claimed, and why it was wrong

I claimed her `Confirmed regular price` entries were the promotional price and that the
correct figures were the `Suggested regular price` column (price / 0.9), naming 329.00 /
449.00 / 649.00 / 799.00 for the four RGOP bases.

**That was wrong.** I took Qash's generated "suggested" column — which his own JSON labels
`impliedBasisRegularPrice` and `basisPriceConfirmed: false`, i.e. explicitly *implied* — and
treated it as established fact. I then told the source owner her own numbers were wrong on the
strength of an inference. The arithmetic I ran was correct; the premise underneath it was not.

## 2. The evidence that settles it

**a. This store's markdown convention populates `compareAtPrice`, and these do not.**

| SKU | price | compareAtPrice |
|---|---|---|
| FF-RCHD2-5-22-5 | 188.10 | **249.00** — a real markdown, compare-at set |
| all 29 bases | x.10 endings | **null** |

When this store actually discounts a price, it records the former price. None of the 29 do.

**b. The .10 prices are months old, and staggered.**

| SKU | price | last price change |
|---|---|---|
| FF-RCHD30 | 56.70 | **2026-03-27** |
| FF-RCHD80 | 143.10 | **2026-03-27** |
| FF-RCHD80-100 | 1529.10 | **2026-03-27** |
| FF-RCHD50 | 93.60 | 2026-08-07 |
| FF-RCHD100 | 179.10 | 2026-08-07 |
| FF-RGOP190 | 296.10 | 2026-07-20 |
| FF-RGOP350 | 584.10 | 2026-08-21 |

No promotion ran from March to September, and a batch markdown would share one timestamp.
These are standing prices that were edited at different times.

**c. The live 10% discounts are checkout-level and never touch the `price` field.**

- "Labor Day Sale — 10% Off French Fitness" — ACTIVE to 2026-09-09
- "September Overstock Sale — 10% Off Select French Fitness Products" — ACTIVE 2026-09-08 to 2026-10-01, a named product list (FSR90, Monster Leg Press, MFAB V2, Shasta Back Extension, Shasta Horizontal Calf)
- "Early Labor Day Sale — 10% Off Select French Fitness Products" — EXPIRED 2026-09-08T06:59:59Z

These discount at checkout on top of `price`. FF-FSR90 demonstrates the pattern: `price`
3299.00, charged 2969.10 on Order #49333. A whole-dollar price field with the 10% applied
later. The RGOP and RCHD families do not work that way.

**d. Sibling French Fitness families sit at whole dollars.** FF-COP190 339.00, FF-COP260
469.00, FF-COP350 649.00, FF-CIKB30 60.00, FF-CIKB40 76.00, FF-CIKB70 124.00. So the .10
pattern is specific to the RGOP and RCHD lines, not a line-wide markdown.

**Conclusion: the .10 figures are the current regular prices of those two families.
Larianne's 29 entries are correct.**

## 3. The consequence, which is larger than the thing I got wrong

If the current prices are the regulars, then the **stored reductions are stale**, and the
corrections run in the opposite direction to what I told her:

| Basis | Current regular | x 0.33 | Stored | Status |
|---|---|---|---|---|
| FF-RGOP190 | 296.10 | **97.71** | 108.57 | stale |
| FF-RGOP260 | 404.10 | **133.35** | 148.17 | stale |
| FF-RGOP350 | 584.10 | **192.75** | 214.17 | stale |
| FF-RGOP450 | 719.10 | **237.30** | 263.67 | stale |

The stored values reconcile to 329 / 449 / 649 / 799 — the prices these products used to
carry. This is the same defect class as FF-CIKB30 holding 19.47 against a $60.00 parent, just
in the other direction because these prices went down rather than up.

Two knock-ons:

- **The correction set is bigger than the 9 kettlebell rows.** Every reduction-bearing row
  across the RGOP and RCHD families is stale on the same mechanism, not just the 9.
- **FF-RGOP495's remap target is itself stale.** Pointing it at option `51462540755260` is
  still structurally correct — the 45 lb bar arithmetic holds and 495 − 45 = 450 — but that
  option carries 263.67, which is 33% of the superseded 799.00. The remap is right and the
  value it lands on also needs correcting to 237.30.

## 4. A defect this exposes in the validator

`validate-reductions.mjs` treats a price that is exactly 0.9 x a whole dollar as a
round-discount signal and holds the row as `CANNOT-VALIDATE`. For the RGOP and RCHD families
that signal is a false positive: those prices are the regulars, so the detector will hold the
entire estate indefinitely and no confirmation from Larianne can clear it while the detector
reads her figure as a discounted price.

Worse, the same premise is written into
`docs/data/shared-option-basis-larianne-2026-09-05.json` as `_open_issue`, which records that
"Larianne entered the CURRENT (promotionally discounted) price" and that her entries
"contradict her own notes". On the evidence above that characterisation is wrong and should be
withdrawn from the artifact.

The detector needs a way to distinguish a markdown from a standing price. `compareAtPrice`
being populated is the store's own signal for the former, and it is available.

## 5. Corrected disposition

**Source decisions: PASS on the 29 confirmed regular prices**, subject to Larianne setting
`Decision` and `Source gate`, which still read `PENDING` on all 29 rows. That part of my
earlier report stands: the sheet is not yet formally signed off, but the *values* are right.

**New finding, raised as HOLD:** the stored reductions across the RGOP and RCHD families are
stale against the confirmed regulars, and the validator's round-discount rule will keep
holding correct rows until it can tell a markdown from a standing price.

Everything else from 7 September is unchanged: calculations PASS, exact-ID proposal and its
isolation PASS, affected-parent mapping PASS, tests and runtime at `ee21546e` PASS, provenance
PASS, Klaviyo isolation PASS. Candidate identity remains HOLD.

## 6. Note to myself

The failure mode was treating a generated suggestion as ground truth because the arithmetic
behind it was clean. Qash had labelled it `basisPriceConfirmed: false`. The label was right
there and I read past it. On a price question the source owner is the authority, and my job
was to check whether the numbers were internally consistent and to ask her, not to tell her.
