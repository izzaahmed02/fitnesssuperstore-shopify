# Post Avis Phase 2 — head confirmation and row-level QA of the 35

Independent QA, 17 September 2026. Answers Tim's 14 September rulings 1 and 2.
Read-only throughout: no Shopify mutation, no metafield write, no order edit, no
refund, no customer contact, and nothing pushed to `fs-bundle-api`.

## Ruling 1 — candidate head. CONFIRMED, but the SHA is not 76e1172.

Tim asked me to confirm 76e1172 is the current head of `fs-bundle-api` PR #16,
reached without reset or force-push. It is not the head. The head is:

```
dd531b0e4711b187b141fba317af2427f2400d95
```

76e1172 *was* the head when Qash asked the question on 10 September. Six commits
have landed since — three later that day and three on 17 September.

What I verified, and how:

| Check | Result |
|---|---|
| Head of `claude/post-avis-phase-2-h0tzgv` per the GitHub API | `dd531b0e4711b187b141fba317af2427f2400d95` |
| `git merge-base --is-ancestor 76e1172 dd531b0` | true — 76e1172 is intact in the history |
| `git merge-base --is-ancestor 63aecbb dd531b0` | true — the originally frozen SHA is also intact |
| `ee21546`, `fc4922d` still ancestors | true |
| Committer timestamps across the six commits | strictly increasing |
| CI on `dd531b0` | 4 of 4 jobs green (runs 35186561563, 35186563817) |

Both previously named candidates are still reachable and unrewritten, and the
commits move forward in time. **No reset, no rebase, no force-push.** Qash's
account of how the head moved is accurate.

### The deployable source has not changed

```
git diff 63aecbb dd531b0 -- extensions/ generated/ package.json package-lock.json rust-toolchain.toml
```

Returns empty. **Verified.** The wasm function under test at `dd531b0` is
byte-identical to the one frozen at `63aecbb` on 3 September, so the runtime
evidence carries across intact and my QA and Izza's review target the same
artifact whichever SHA is named.

The only non-documentation change between 76e1172 and dd531b0 is
`.github/workflows/test.yml` (+21 lines): an additive, read-only scan step plus
one artifact name. It adds a check; it removes none.

**So the candidate-identity HOLD I raised on 7 September is not cleared.** PR #16's
title and body still read `FROZEN 63aecbb` and still state the SHA does not move
during QA, while the head is dd531b0 — the same title/head disagreement, now at a
different pair of SHAs. The evidence is sound; the paperwork is not. My
recommendation matches Qash's: **freeze at dd531b0** and reconcile the PR title,
body and CI display to it. That is a paperwork fix, not a re-test.

## Ruling 2 — row-level verification of the 35. PASS, 35 of 35.

Source: `docs/data/reduction-correction-proposals-2026-09-10.json` at `dd531b0`.
Every row was checked against **live production Shopify today**, not against the
5 September sheet alone. Four checks per row:

1. `after` = 33% of the parent's live price, rounded to the cent.
2. The basis equals the price Larianne confirmed in writing on 5 September, **and**
   that price is still the live price today.
3. `before` equals the value stored live on the option variant right now.
4. The option variant has exactly one referencing parent, and it is the parent the
   proposal names.

All four hold on all 35 rows. No row's basis has drifted in the twelve days since
Larianne confirmed it, and no stored value has been touched since 10 March 2026.

| SKU | live price | stored now | proposed | delta | tranche |
|---|---|---|---|---|---|
| FF-CIKB10 | 28.00 | 9.57 | 9.24 | -0.33 | A |
| FF-CIKB100 | 172.00 | 55.77 | 56.76 | +0.99 | A |
| FF-CIKB30 | 60.00 | 19.47 | 19.80 | +0.33 | A |
| FF-CIKB40 | 76.00 | 25.41 | 25.08 | -0.33 | A |
| FF-CIKB70 | 124.00 | 39.72 | 40.92 | +1.20 | A |
| FF-CIKB75 | 132.00 | 42.57 | 43.56 | +0.99 | A |
| FF-CIKB80 | 140.00 | 45.87 | 46.20 | +0.33 | A |
| FF-CIKB85 | 148.00 | 49.17 | 48.84 | -0.33 | A |
| FF-CIKB90 | 156.00 | 52.47 | 51.48 | -0.99 | A |
| FF-RCHD100 | 179.10 | 65.67 | 59.10 | -6.57 | B |
| FF-RCHD30 | 56.70 | 20.79 | 18.71 | -2.08 | B |
| FF-RCHD40 | 75.60 | 27.72 | 24.95 | -2.77 | B |
| FF-RCHD45 | 84.60 | 31.02 | 27.92 | -3.10 | B |
| FF-RCHD50 | 93.60 | 34.32 | 30.89 | -3.43 | B |
| FF-RCHD55 | 98.10 | 35.97 | 32.37 | -3.60 | B |
| FF-RCHD60 | 107.10 | 39.27 | 35.34 | -3.93 | B |
| FF-RCHD65 | 116.10 | 42.57 | 38.31 | -4.26 | B |
| FF-RCHD70 | 125.10 | 45.87 | 41.28 | -4.59 | B |
| FF-RCHD75 | 134.10 | 49.17 | 44.25 | -4.92 | B |
| FF-RCHD80 | 143.10 | 52.47 | 47.22 | -5.25 | B |
| FF-RCHD85 | 152.10 | 55.77 | 50.19 | -5.58 | B |
| FF-RCHD90 | 161.10 | 59.07 | 53.16 | -5.91 | B |
| FF-RCHD95 | 170.10 | 62.37 | 56.13 | -6.24 | B |
| FF-RGOP10 | 18.90 | 6.93 | 6.24 | -0.69 | B |
| FF-RGOP120 | 197.10 | 72.27 | 65.04 | -7.23 | B |
| FF-RGOP140 | 233.10 | 85.47 | 76.92 | -8.55 | B |
| FF-RGOP170 | 287.10 | 105.27 | 94.74 | -10.53 | B |
| FF-RGOP25 | 46.80 | 17.16 | 15.44 | -1.72 | B |
| FF-RGOP2_5 | 4.50 | 1.65 | 1.49 | -0.16 | B |
| FF-RGOP35 | 65.70 | 24.09 | 21.68 | -2.41 | B |
| FF-RGOP45 | 84.60 | 31.02 | 27.92 | -3.10 | B |
| FF-RGOP450 | 719.10 | 263.67 | 237.30 | -26.37 | B |
| FF-RGOP5 | 9.90 | 3.63 | 3.27 | -0.36 | B |
| FF-RGOP50 | 89.10 | 32.67 | 29.40 | -3.27 | B |
| FF-RGOP70 | 116.10 | 42.57 | 38.31 | -4.26 | B |

30 rows reduce the stored value (we have been over-reducing — a cost to us) and 5
increase it (customers were under-credited). That matches Qash's 30/5 split.

Every one of the 35 is single-parent, so **none of them touches the shared-option
mapping** and Tim's 30 August "do not choose an arbitrary parent" question does not
arise. Confirmed independently against `referencing_parent_count` in the
29 August estate scan: 35 of 35 read exactly 1, and each names the same parent GID
the proposal does. All 35 also carry disposition `PRICE-DRIFT-REVALIDATE`.

Tranche A is Tim's original nine (the FF-CIKB rows). Tranche B is the 26 added on
8 September. Either can be approved alone.

## FF-CIKB70 — transposition confirmed on live data

Qash's scan reports 159 rows carrying both a title amount and a stored numeric:
157 agree, 2 disagree. I reproduced both disagreements live:

- **FF-CIKB70** — title `-$39.27`, **SKU** `...-39-27`, stored numeric `39.72`.
  Two of the three sources say 39.27; only the numeric says 39.72. $39.27 / 0.33 =
  $119.00 exactly, a clean prior price; $39.72 / 0.33 = $120.36, which this
  catalogue never held. A digit transposition, as I said on 7 September.
- **991-no-thanks-89** — title `-$89.00` vs stored `87.00`. Not a transposition;
  a plain mismatch, already dispositioned on 29 August as display cleanup under
  `SUBSTITUTION-NO-FORMULA`.

So **FF-CIKB70 is the only transposition in the estate**, which is what I proposed
the scan to establish. The write target is unchanged at $40.92 either way, and the
row stays out of the drift evidence. The scan is report-only and wrote nothing.

## Exposure — Qash's figures verified independently

Re-derived from live order and price data:

| order | SKU | list | charged | stored | correct | effect |
|---|---|---|---|---|---|---|
| #49324 (paid, fulfilled) | FF-CIKB30 | 60.00 | 40.53 | 19.47 | 19.80 | customer under-credited $0.33 |
| #49324 (paid, fulfilled) | FF-CIKB40 | 76.00 | 50.59 | 25.41 | 25.08 | cost to us $0.33 |
| #49509 (paid, **unfulfilled**) | FF-CIKB100 | 172.00 | 116.23 | 55.77 | 56.76 | customer under-credited $0.99 |

Each charged figure is exactly list minus the stored reduction, so the drifted
values did reach real charged prices. Totals reconcile to Qash's: $0.33 cost to
us, $1.32 shortfall to customers, $1.65 absolute. #49509 is still unfulfilled.
No outreach, credit or order edit has been made or is proposed here.

## Two things to carry forward

### 1. Three drifted shared options sit outside the approved 35

The 29 August scan holds **39** distinct option variants at
`PRICE-DRIFT-REVALIDATE`. 35 are in the approved set. The other four are
multi-parent and were excluded by construction. Verified live today:

| option variant | parents | component basis (live) | stored | 33% of basis | status |
|---|---|---|---|---|---|
| 51462540722492 (FF-RGOP350) | 5 | 584.10 | 214.17 | **192.75** | still drifted |
| 51462541214012 (FF-RGOP190) | 3 | 296.10 | 108.57 | **97.71** | still drifted |
| 51462540788028 (FF-RGOP260) | 3 | 404.10 | 148.17 | **133.35** | still drifted |
| 51462542491964 (FF-COP260) | 4 | 469.00 | 154.77 | 154.77 | **correct** |

The last one is a false positive in the scan, not a defect: the scan recorded its
basis as $1,499.00 by taking one referencing parent's own price, where Larianne's
component-basis rule makes the basis the plate-set component at $469.00. Against
that, 154.77 is right. This is exactly the arbitrary-parent trap Tim named.

The first three are real and are the ones Qash listed as "correct it" on
10 September, but they are **not in the 35 and have no proposal document**, because
each serves 3–5 parents. Writing the 35 therefore leaves drifted reductions live on
three shared options covering eleven parent products. Worth a decision; not a
blocker on the 35.

### 2. FF-RGOP495 must be sequenced after FF-RGOP450, and the numbers line up

The proposed repoint sends FF-RGOP495's Condition option from
`51462540722492` to `51462540755260`. `51462540755260` **is** FF-RGOP450's
option, and it is one of the 35 (263.67 → 237.30). So:

- Repointing **before** the value correction lands hands FF-RGOP495 the stale
  $263.67.
- Repointing **after** gives it $237.30, which is also the correct figure for
  FF-RGOP495 in its own right (719.10 × 0.33 = 237.30).

Tim's sequencing (ruling 3, "sequenced last") is right and is load-bearing, not a
formality. Separately, `51462540722492` is referenced by five parents, so
editing *its* value to fix FF-RGOP495 would change four working products — the
repoint is the safe route, as I reported on 7 September.

### Minor: one row depends on the rounding convention

FF-RGOP2_5 is the only row that lands exactly on a half-cent: 4.50 × 0.33 =
1.4850. The proposal says **1.49**, and `expectedDefectiveReduction()` in
`option-source-control.mjs` also returns 1.49, so proposal and validator agree and
the row will read AGREE after the write. Flagging it only because a
round-half-to-even implementation would return 1.48 and fail this one row.

## Disposition

- **Ruling 1 — head: CONFIRMED with a correction.** The head is `dd531b0`, not
  `76e1172`, reached by ordinary commits with no reset or force-push. The
  deployable source is unchanged since `63aecbb`. Recommend freezing at
  `dd531b0`.
- **Ruling 2 — the 35: PASS, 35 of 35**, verified row by row against live
  production. Both tranches are arithmetically and structurally sound. This is a
  QA disposition only; it is not a production-write approval and does not
  substitute for Tim's written GO.
- **Candidate identity: still HOLD** until PR #16's title, body and CI display name
  the actual head.
- Unchanged and not mine to clear: named staging access and Partner visibility,
  company admin/recovery on both repositories, PR #729 draft on a stale baseline,
  the stale FSR90 staging catalogue, and the missing variant-level
  `custom.bundle_option_config` definition. Staging checkout verification of the
  35 cannot run until staging access and the FSR90 catalogue regeneration land.

## Reproduction

```
# head and lineage
git ls-remote https://github.com/izzaahmed02/fs-bundle-api claude/post-avis-phase-2-h0tzgv
git merge-base --is-ancestor 76e1172 dd531b0 && echo intact
git diff 63aecbb dd531b0 -- extensions/ generated/ package.json package-lock.json rust-toolchain.toml

# the 35, live
#   proposals: docs/data/reduction-correction-proposals-2026-09-10.json @ dd531b0
#   confirmed prices: docs/data/regular-price-confirmations-larianne-2026-09-05.json
#   live reads: Shopify Admin GraphQL, nodes(ids:) on the 35 option variants
#               (custom.price_reduction_value_new) and their 35 parent products
#               (priceRangeV2, compareAtPriceRange) — read-only
#   single-parent: referencing_parent_count in docs/data/option-source-scan-2026-08-29.csv
```

