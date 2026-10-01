# Post Avis Phase 2 — verified-head freeze and row-level PASS of the 35

Independent QA, 20 September 2026. Answers Tim's 17 September 08:21 ruling 1 as
amended by his 08:37 ruling 2 (FREEZE — VERIFIED HEAD, NOT A NAMED SHA), and the
row-level requirement in his ruling 2.

Read-only throughout: no Shopify mutation, no metafield write, no order edit, no
refund, no customer contact, no merge, and nothing pushed to `fs-bundle-api`.

Supersedes my 17 September note in this PR on the head question only. The
row-level result is unchanged and has now been re-verified against live
production three days later.

## 1. The two reported SHAs are the same branch, not a conflict

Tim: "Within four hours I was given two different heads for PR #16: dd531b0 and
1bedb89. Qash: one reply reconciling this."

They do not conflict. **`1bedb89` is an ancestor of `dd531b0`**, three commits
back on the one branch `claude/post-avis-phase-2-h0tzgv`:

```
dd531b0  2026-09-17 05:38:50  Exposure counts since 1 March
8b538c3  2026-09-17 05:26:00  Record the head reconciliation Tim's ruling 1 requires
34a3fda  2026-09-17 05:24:58  Transposition scan — report only
1bedb89  2026-09-10 11:11:15  Add sequenced next steps for Tim to the draft
```

`1bedb89` was the head on 10 September. `dd531b0` is the head now. Two readings
taken at different times off one linear history, not two candidates.

## 2. Tim's two freeze conditions — both hold

Verified today against the live remote, not a cached clone.

| Condition | Result |
|---|---|
| Actual head (`git ls-remote`, 20 Sep) | `dd531b0e4711b187b141fba317af2427f2400d95` |
| No reset, force-push or rebase | **HOLDS** — `63aecbb`, `76e1172` and `1bedb89` are all still ancestors and unrewritten; committer timestamps increase strictly |
| `git diff 63aecbb..dd531b0` on the five deployable paths | **EMPTY** |

The five paths are `extensions/`, `generated/`, `package.json`,
`package-lock.json`, `rust-toolchain.toml`.

So under Tim's own rule the verified head is **`dd531b0`**, frozen without a
further round trip, and the pre-issued GO carries over to it.

The only non-documentation change between `76e1172` and the head is
`.github/workflows/test.yml`, +21 lines: an additive read-only scan step and one
artifact name. It adds a check and removes none.

## 3. Both extension suites actually execute, with non-zero counts

Tim's specific new condition, because the test job had been reporting green while
both suites silently skipped every test. Checked against the raw CI log for run
35186563817, job 105089786760, not against a summary:

| Suite | Result | Wall time |
|---|---|---|
| `extensions/product-bundle` (transform) | **54 passed (54)**, 1 file | 31.86s (tests 31.36s) |
| `extensions/cart-validation` (validation) | **45 passed (45)**, 1 file | 28.66s (tests 28.08s) |

Job line: `both suites ran: 54 + 45 passed, 0 skipped`.

The guard is real rather than decorative. The step fails the job if the
transcript matches `[0-9]+ skipped`, and separately asserts the literal strings
`54 passed` and `45 passed`. The roughly 30 seconds of actual test execution per
suite is independent corroboration that the wasm built and the cases ran, rather
than being collected and skipped. **The silent-skip defect is closed at
`dd531b0`.**

Runtime evidence reproduces at this head too: 54 fixtures, max **6,242,014** of
11,000,000 (43.25% headroom), 0 over budget, verdicts 29 AGREE /
25 INTENDED-DIVERGENCE / **0 INVESTIGATE**. The same figures I verified at
`ee21546` on 7 September.

## 4. The 35 — PASS, 35 of 35, re-verified live today

Source: `docs/data/reduction-correction-proposals-2026-09-10.json` at `dd531b0`.
Four checks per row against live production Shopify on 20 September:

1. Proposed value equals 33% of the parent's live price, to the cent, using the
   repo's own rounding.
2. The basis still equals the price Larianne confirmed in writing on 5 September.
3. The recorded `before` still equals the value stored live right now.
4. Exactly one referencing parent, matching the parent the proposal names.

All four hold on all 35. **Nothing has drifted in the three days since my
17 September read** — not one price, not one stored value. No stored value has
moved since 10 March 2026.

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

30 rows reduce the stored value (we over-reduce, a cost to us), 5 increase it
(customers under-credited). All 35 are single-parent, cross-checked against
`referencing_parent_count` in the 29 August estate scan: 35 of 35 read exactly 1
and each names the proposal's parent. So none touches the shared-option mapping.

### One row turns on the rounding convention

FF-RGOP2_5 is the only row landing exactly on a half-cent: 4.50 x 0.33 = 1.4850,
with no floating-point fuzz either way.

- The repo's `expectedDefectiveReduction()` is JavaScript, where rounding 148.5
  gives 149, so the answer is **1.49**. The proposal says 1.49. They agree, and
  the row will read AGREE after the write.
- A round-half-to-even implementation returns **1.48** instead. My first
  verification pass used Python's `round()`, which is banker's rounding, and
  flagged this row as a failure. That was my artifact, not a defect in the
  proposal.

Recording it because the pre-issued GO is voided by any deviation: if this rule
is ever re-implemented outside the repo's JavaScript, in Python, numpy or SQL,
this one row silently diverges by a cent.

## 5. Order #49509 — ruling 4 was not executed in time

Tim, 17 September 08:21: "Order #49509 is unfulfilled: adjust the FF-CIKB100
reduction by the $0.99 before fulfillment so that customer is made whole."

Read live today:

| | |
|---|---|
| Fulfillment status | **FULFILLED** |
| Fulfilled at | **2026-09-17 18:38:12 UTC** |
| FF-CIKB100 charged | **$116.23** (= 172.00 - 55.77, the stale reduction) |
| Correct charge | $115.24 (= 172.00 - 56.76) |
| Total received | $251.58 |
| Total refunded | **$0.00**, no refunds recorded |

The order shipped roughly ten hours after the ruling, at the uncorrected price.
The adjustment was never applied and the pre-fulfillment window has closed. The
customer is short **$0.99**.

This is not a finding about the candidate; it is a directive that lapsed. The
remedy is now a post-fulfillment credit rather than a price adjustment, which
under Tim's standing rule needs his separate approval. Flagging rather than
acting: no order edit, refund or contact has been made.

## 6. Still outside the approved set

### Three drifted shared options

The 29 August scan holds **39** distinct option variants at
`PRICE-DRIFT-REVALIDATE`. 35 are approved; 4 were excluded as multi-parent.
Re-read live today, three are genuinely still drifted and unchanged since March:

| option variant | parents | component basis (live) | stored now | 33% of basis |
|---|---|---|---|---|
| 51462540722492 (FF-RGOP350) | 5 | 584.10 | 214.17 | **192.75** |
| 51462541214012 (FF-RGOP190) | 3 | 296.10 | 108.57 | **97.71** |
| 51462540788028 (FF-RGOP260) | 3 | 404.10 | 148.17 | **133.35** |
| 51462542491964 (FF-COP260) | 4 | 469.00 | 154.77 | 154.77 — **correct** |

The fourth is a scan false positive: the scan recorded its basis as $1,499.00 by
taking one referencing parent's own price, where the component basis is $469.00.
Against that, 154.77 is right. Exactly the arbitrary-parent trap Tim named on
30 August.

The first three are real, are the ones Qash listed as "correct it" on
10 September, and have **no proposal document**, because each serves three to
five parents. Writing the 35 therefore leaves drifted reductions live on three
shared options covering eleven parent products, while the workstream reads as
closed. They need their own decision.

### FF-RGOP495 sequencing is load-bearing

The repoint sends FF-RGOP495's Condition option from `51462540722492` to
`51462540755260`. That target **is** FF-RGOP450's own option, one of the 35
(263.67 to 237.30). Repoint before the correction and it inherits the stale
$263.67; repoint after and it inherits $237.30, which is independently correct
for FF-RGOP495 (719.10 x 0.33 = 237.30). Tim's "sequenced last" must hold.

## 7. Caveat for the activation decision, not a QA HOLD

Tim has made Rust activation the priority path because the live JavaScript
function is failing in production: `InstructionCountLimitExceededError` entries
for 10-17 September, #49333 at 11.57M against the 11M budget, and a measured
ten-line configured cart at 22.8M.

The Rust candidate's headroom figure does not yet answer that. The 43.25%
headroom is a maximum of 6,242,014 across **54 synthetic fixtures**, and **no
fixture reproduces order #49333's cart**. I checked: the only references to
#49333 anywhere in the repository are Rust source comments and documents, not a
test fixture. The PR states this itself as stop condition 8, "no fixture is
larger than the largest cart a customer can build ... the untested case and the
failing case are the same shape."

Rust will be far cheaper per operation than the JavaScript it replaces, so this
is not a prediction that it will fail. The point is narrower: the headroom number
now being relied on was measured on carts smaller than the ones breaking
production today, so it does not yet evidence the case activation is meant to
fix. One fixture rebuilt from #49333's real payload would close it. That belongs
in Izza's activation packet.

## Disposition

- **Head: VERIFIED.** `dd531b0` is the actual head, reached with no reset,
  force-push or rebase, and the deployable-source diff against `63aecbb` is
  empty. Both of Tim's conditions hold, so `dd531b0` is the frozen candidate
  under his own rule. `1bedb89` is an ancestor of it, not a competing head.
- **Extension suites: VERIFIED EXECUTING.** 54 and 45, non-zero, about 30
  seconds each, with a CI guard that fails on any skip.
- **The 35: PASS, 35 of 35**, re-verified against live production today. Both
  tranches sound.
- **Outstanding, not mine to clear:** PR #16 title, body and CI display still
  read `FROZEN 63aecbb` and need reconciling to `dd531b0` (Qash). Named staging
  access and Partner visibility (Izza). Company admin and recovery on both
  repositories. #729 draft on a stale baseline. Stale FSR90 staging catalogue.
  Missing variant-level `custom.bundle_option_config` definition.
- **Referred to Tim:** #49509 shipped uncorrected and is $0.99 short; the three
  drifted shared options outside the 35; and the #49333 fixture gap before
  activation.

## Reproduction

```
git ls-remote https://github.com/izzaahmed02/fs-bundle-api claude/post-avis-phase-2-h0tzgv
git merge-base --is-ancestor 1bedb89 dd531b0 && echo "1bedb89 is an ancestor"
git merge-base --is-ancestor 63aecbb dd531b0 && echo "63aecbb is an ancestor"
git diff 63aecbb dd531b0 -- extensions/ generated/ package.json package-lock.json rust-toolchain.toml
```

Suites actually executing: run 35186563817, job 105089786760, raw log.

The 35, live: Shopify Admin GraphQL `nodes(ids:)` over the 35 option variants
(`custom.price_reduction_value_new`) and their 35 parent products
(`priceRangeV2`, `compareAtPriceRange`). Read-only.

Order #49509: order 8042112123196, fields `displayFulfillmentStatus`,
`fulfillments`, `totalRefundedSet`, `refunds`. Read-only.

