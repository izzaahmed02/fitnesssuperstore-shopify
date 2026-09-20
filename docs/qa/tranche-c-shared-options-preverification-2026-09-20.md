# Tranche C — pre-verification of the three shared options

Independent QA, 20 September 2026, answering Tim's item 4 of the same day
("TRANCHE C OPENED"). Read-only: no Shopify mutation, no metafield write, no
order edit, no merge, nothing pushed to `fs-bundle-api`.

Qash's proposal documents do not exist yet, so this is not the row-level PASS
Tim sequenced. It is the verification that can be done ahead of them: the
per-parent mapping, the live prices, and whether a single stored value can be
correct for every referencing parent. That last question is the whole reason
multi-parent is a different risk class, and it is the one most likely to be got
wrong.

## The rule being applied

Larianne, 5 September: for a bundle the Defective Weights reduction is **33% of
the regular price of the plate-set component**, not of the bundle. That is why
one option record legitimately serves several parents at different prices.

Her note on each of the three, verbatim: *"ONLY THE FF-RGOP<n> part of this set
has def reduction."*

## All eleven parents, read live today

### Option `51462540722492` — component FF-RGOP350 @ $584.10 live

Stored **214.17**, correct **192.75**, delta **−21.42**.

| referencing parent | live price | component it resolves to | one value correct? |
|---|---|---|---|
| FF-RGOP350 | 584.10 | FF-RGOP350, the plate set itself | yes |
| FF-RGOP395-B | 719.10 | FF-RGOP350 (395 − 45 lb bar) | yes |
| FF-RGOP395-BB | 1,799.10 | FF-RGOP350 (395 + bench) | yes |
| FF-395R4MFAB | 2,159.10 | FF-RGOP350 (395 + rack + bench) | yes |
| **FF-RGOP495** | **949.00** | **FF-RGOP450 (495 − 45 lb bar)** | **no** |

**4 of 5.**

### Option `51462541214012` — component FF-RGOP190 @ $296.10 live

Stored **108.57**, correct **97.71**, delta **−10.86**.

| referencing parent | live price | component | correct? |
|---|---|---|---|
| FF-RGOP190 | 296.10 | FF-RGOP190, the plate set itself | yes |
| FF-RGOP235-B | 440.10 | FF-RGOP190 (235 − 45) | yes |
| FF-235R4MFAB | 1,709.10 | FF-RGOP190 (235 + rack + bench) | yes |

**3 of 3.**

### Option `51462540788028` — component FF-RGOP260 @ $404.10 live

Stored **148.17**, correct **133.35**, delta **−14.82**.

| referencing parent | live price | component | correct? |
|---|---|---|---|
| FF-RGOP260 | 404.10 | FF-RGOP260, the plate set itself | yes |
| FF-RGOP305-B | 566.10 | FF-RGOP260 (305 − 45) | yes |
| FF-305R4MFAB | 1,889.10 | FF-RGOP260 (305 + rack + bench) | yes |

**3 of 3.**

The bar arithmetic holds on every bundle in the family: 235−45=190, 305−45=260,
395−45=350, 495−45=450.

## Every basis is tied to a written confirmation

All eleven parents appear on Larianne's returned 5 September sheet, and on every
one her confirmed regular price equals the live Shopify price today. The three
component prices used above are `basisPriceConfirmed: true` in
`docs/data/shared-option-basis-larianne-2026-09-05.json`, and her file's own
`expectedReduction` values are 97.71, 133.35 and 192.75 — matching my
independent computation to the cent, using the repo's own rounding.

So Tim's condition that every value be tied to Larianne's written confirmation is
already satisfiable for all three. Nothing here is inferred.

## The finding: FF-RGOP350 has a sequencing dependency

Larianne's mapping file lists that option's `referencingParents` as **four**, and
records `"removedParent": "FF-RGOP495"`. That describes the state **after** the
approved FF-RGOP495 repoint. Production has not been repointed: the 29 August
estate scan reads `referencing_parent_count: 5` and lists FF-RGOP495 among them.

So if Tranche C's FF-RGOP350 row is written while FF-RGOP495 still points at that
option, FF-RGOP495 inherits 192.75, and 192.75 is wrong for it. Quantified
against its correct value of $237.30 (33% of FF-RGOP450 at $719.10):

| state | FF-RGOP495 carries | customer under-credited by |
|---|---|---|
| today | 214.17 | $23.13 |
| Tranche C written before the repoint | **192.75** | **$44.55** |

It is already wrong today, so this is not a new defect class, but writing Tranche
C first **widens the error on that one product by $21.42 per unit**, against the
customer.

**Recommendation: gate the FF-RGOP350 row of Tranche C on the FF-RGOP495 repoint
being complete and verified.** The other two rows, FF-RGOP190 and FF-RGOP260,
carry no such dependency and are clean as they stand. Tranche C can be split on
that line if it helps the sequence.

This is the same dependency Larianne's file already flagged in its own
`_sequencing` note, seen from the other direction.

## Caveat on the reference data

I cannot read APO option references live. `cartTransforms` requires the
`read_cart_transforms` scope, which this token does not hold, and `validations`
and `shopifyFunctions` both return empty. So the referencing-parent lists above
come from the 29 August estate scan, which is three weeks old. **The live
references should be re-read immediately before any write**, which is the same
live-re-read discipline already required for prices.

## Disposition

- **Not a PASS.** Qash's proposal documents do not exist yet, and Tim's sequence
  is proposals first, then my row-level verification at `dd531b0`.
- **Pre-verified and ready:** the component-basis mapping, the eleven parents'
  live prices, all three corrected values, and the written-confirmation trail.
  All three values recompute exactly and agree with Larianne's own file.
- **One blocker to design around:** the FF-RGOP350 row must follow the
  FF-RGOP495 repoint.
- **One caveat:** referencing parents need a live re-read before any write.

When Qash's proposals land, the row-level check is a short step from here: each
must carry per-parent before/after across every referencing parent, the
current-value backup, regression tests, rollback, and the Larianne citation. The
arithmetic is already verified.
