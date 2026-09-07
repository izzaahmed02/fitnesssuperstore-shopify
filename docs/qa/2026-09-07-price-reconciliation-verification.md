# Independent QA — 74-row price reconciliation, pre-verification

**Reviewer:** Yusra | Fitness Superstore (Independent QA)
**Date:** 2026-09-07
**Assignment:** Tim, 2026-09-05 21:13 — "Independently verify the source decisions,
exact-ID proposals, affected-parent mapping, calculations, tests, and exact candidate.
Issue a scoped PASS/HOLD." Due Tuesday 2026-09-08, 4:00 PM Pacific, conditional on readiness.

**Packet reviewed:** `Post_Avis_Combined_Price_Reconciliation_REVIEW_ONLY_2026-09-05.xlsx`
(8 sheets, attached to Tim's 5 September email).

**Scope note.** This is the 74-row cleanup, kept separate from the 12-product cohort per
Tim's instruction. All checks read-only: no Shopify write, no metafield or option change, no
merge, deploy, activation or rollback.

**Disposition: PASS on everything checkable today. BLOCKED on the two upstream inputs that
are not yet due, and HOLD on candidate identity.** See §7.

---

## 1. Calculations — PASS, 9 of 9

Expected magnitude = confirmed basis × 0.33, tolerance $0.01. Recomputed in exact decimal.

| SKU | Basis | Live stored | Workbook expected | Recomputed | Change | Implied prior basis |
|---|---|---|---|---|---|---|
| FF-CIKB10 | $28 | 9.57 | 9.24 | **9.24** | −0.33 | $29.00 |
| FF-CIKB30 | $60 | 19.47 | 19.80 | **19.80** | +0.33 | $59.00 |
| FF-CIKB40 | $76 | 25.41 | 25.08 | **25.08** | −0.33 | $77.00 |
| FF-CIKB70 | $124 | 39.72 | 40.92 | **40.92** | +1.20 | $120.36 (not a clean price) |
| FF-CIKB75 | $132 | 42.57 | 43.56 | **43.56** | +0.99 | $129.00 |
| FF-CIKB80 | $140 | 45.87 | 46.20 | **46.20** | +0.33 | $139.00 |
| FF-CIKB85 | $148 | 49.17 | 48.84 | **48.84** | −0.33 | $149.00 |
| FF-CIKB90 | $156 | 52.47 | 51.48 | **51.48** | −0.99 | $159.00 |
| FF-CIKB100 | $172 | 55.77 | 56.76 | **56.76** | +0.99 | $169.00 |

Every expected magnitude, signed catalogue value and magnitude change is arithmetically
correct. Eight of the nine stored values reconcile to a clean whole-dollar prior price,
which is consistent with the stale-reduction mechanism. FF-CIKB70 is the exception — see §2.

Tim's component-rule example also verifies: FF-RGOP395-B basis FF-RGOP350 at $649 gives
$214.17, and the whole-bundle $799 would give $263.67. Both figures are exact.

## 2. FF-CIKB70 — the numeric field is the corrupt one, not merely stale

Live variant `51678113988924`:

| Field | Value |
|---|---|
| Variant title | `... (-$39.27)` |
| Variant SKU | `1189-defective-weights-...-39-27` |
| `custom.price_reduction_value_new` | **39.72** |

Two display fields say 39.27; only the money field says 39.72. The arithmetic separates them:
**39.27 / 0.33 = $119.00 exactly**, a clean prior price consistent with the other eight rows.
**39.72 / 0.33 = $120.36**, which is not a price this catalogue would ever have carried.

So 39.72 is a digit transposition of 39.27, not a superseded value. Tim's ruling that the
title is not the money source is correct and the write target is unaffected either way
($124 × 0.33 = $40.92). The classification changes though: this row is a data-entry defect,
not price drift, so it should not be counted as evidence for the drift mechanism, and the
same transposition class is worth one scan across the remaining reduction records.

Checked the other 15 options for the same shape. The nine kettlebells agree across title,
SKU and numeric except this one. The seven plate-set options agree between title and numeric,
but their SKU slugs carry older values, so SKU slugs are not a reliable money source
anywhere — which independently supports Tim's ruling.

## 3. Exact-ID proposal and affected-parent mapping — PASS

`docs/data/shared-option-basis-larianne-2026-09-05.json` at `ee21546e` was checked field by
field against a live traversal of `options.product_options` → `product_options` →
`product_option` → `product_option_variants`.

All six shared options verify:

| Option variant | Stored | Basis SKU | Implied regular | Live check |
|---|---|---|---|---|
| 51462541214012 | 108.57 | FF-RGOP190 | $329.00 | 0.33 × 329 ✓ |
| 51462540788028 | 148.17 | FF-RGOP260 | $449.00 | 0.33 × 449 ✓ |
| 51462540722492 | 214.17 | FF-RGOP350 | $649.00 | 0.33 × 649 ✓ |
| 51462542917948 | 111.87 | FF-COP190 | $339.00 | 0.33 × 339 ✓ |
| 51462542491964 | 154.77 | FF-COP260 | $469.00 | 0.33 × 469 ✓ |
| 51462542426428 | 214.17 | FF-COP350 | $649.00 | 0.33 × 649 ✓ |

**The `referencingParents` lists are exactly right.** Verified by traversal, including the
`*R4MFAB` parents that a SKU-prefix scan would miss:

- 51462541214012 → FF-RGOP190, FF-RGOP235-B, FF-235R4MFAB (3)
- 51462540788028 → FF-RGOP260, FF-RGOP305-B, FF-305R4MFAB (3)
- 51462540722492 → FF-RGOP350, FF-RGOP395-B, FF-RGOP395-BB, FF-395R4MFAB (4), **plus
  FF-RGOP495 as the mis-reference**

**Blast radius, stated exactly.** Option variant 51462540722492 is referenced by **five**
parents, four of which are correct today. Editing that variant's value to fix FF-RGOP495
would silently change all five. Tim's "do not change the shared FF-RGOP350 option globally"
is therefore load-bearing, and now has a number against it.

**The proposed remap is safely isolatable — verified.** FF-RGOP495's Condition option is its
own `product_option` metaobject `229510938940`, distinct from FF-RGOP350's `151848583484`,
FF-RGOP395-B's `151834526012` and FF-RGOP395-BB's `151817847100`. Repointing
`product_option_variants` on `229510938940` from 51462540722492 to 51462540755260 touches
FF-RGOP495 only.

**Independent corroboration of the 450 basis.** Every correctly-mapped bundle points at the
Condition option of its plate-set component, and the component is the bundle weight minus the
45 lb bar:

| Bundle | lbs | − 45 lb bar | Component | Option referenced |
|---|---|---|---|---|
| FF-RGOP235-B | 235 | 190 | FF-RGOP190 | 51462541214012 ✓ |
| FF-RGOP305-B | 305 | 260 | FF-RGOP260 | 51462540788028 ✓ |
| FF-RGOP395-B | 395 | 350 | FF-RGOP350 | 51462540722492 ✓ |
| **FF-RGOP495** | **495** | **450** | **FF-RGOP450** | **51462540722492 ✗** |

The pattern holds without exception across every other bundle, and FF-RGOP495 is the single
deviation. That is structural corroboration of Larianne's ruling from a direction independent
of her sheet. The mapping logic is a PASS; only the $799 basis price still needs her
confirmation, which it needs anyway as one of the 29.

## 4. A trap in the basis set that will bite whoever fills the sheet

Of the sixteen basis products read live, **twelve carry no discount signal and four do**:

| Group | Live price | Stored reduction | Reconciles against |
|---|---|---|---|
| 9 kettlebells, 3 FF-COP | as shown | as stored | **the live price directly** |
| FF-RGOP190 | 296.10 | 108.57 | **$329.00** = price / 0.9 |
| FF-RGOP260 | 404.10 | 148.17 | **$449.00** |
| FF-RGOP350 | 584.10 | 214.17 | **$649.00** |
| FF-RGOP450 | 719.10 | 263.67 | **$799.00** |

Every `compareAtPrice` is null, on all sixteen. So for those four the regular price exists
nowhere in Shopify, and the stored reductions are **already correct** against it — they are
not drifted. Recomputing them from the live price field yields 97.71 / 133.35 / 192.75 /
237.30, all wrong.

This is exactly the error already recorded in the JSON's `_open_issue`: Larianne entered the
current discounted price as the regular price on all 36 discounted rows, because the sheet
she filled labelled a 10% promotion as "90% off". The corrected sheet is the fix, but the
guard belongs in the instruction too: **for FF-RGOP190/260/350/450 the confirmed regular is
329 / 449 / 649 / 799, not the price on screen.** Worth stating in the assignment rather than
relying on the sheet wording alone, since this is the second time this shape has caused a bad
entry.

Also flagged, because two products collide on price: FF-RGOP450 and FF-RGOP395-B are both
$719.10. For FF-RGOP450 the 263.67 whole-product figure is correct; for FF-RGOP395-B it is
wrong and $214.17 is right. Anyone reconciling by price alone will conflate them.

`custom.retail_price` is not a substitute either — it reads $899.00 for FF-RGOP350 against a
$649.00 regular, so it is MSRP, not a regular-price source.

## 5. Tests and runtime at the actual head — PASS, and my earlier open item is closed

Reproduced locally at `ee21546e8825f7fc8edf78d02417a059c98d1ddd`. Toolchain now pinned by
`rust-toolchain.toml` (rustc 1.94.1, `wasm32-wasip1`), Shopify CLI 4.7.0, function-runner
9.2.2, build via `shopify app function build`.

| Check | Reported | Measured |
|---|---|---|
| Estimator/spec checksum | `a5e3004509fedddc` | **matches** |
| Transform fixtures | 54 | **54 passed** |
| Validation fixtures | 45 | **45 passed** |
| Source-control cases | 17/17 and 4/4 | **17/17 and 4/4** |
| Reduction-validation cases | 47 | **all pass** (59 assertions observed; see note) |
| **Max instructions** | **6,242,014** of 11,000,000 | **6,242,014 — exact** |
| Over budget | 0 | **0** |
| Parity | 29 / 25 / 0 | **29 AGREE / 25 INTENDED-DIVERGENCE / 0** |
| CI on this head | run 33974261944 | **success** |

**The 0.16% instruction delta I reported on 1 September is fully closed.** My earlier
6,231,776 was at `fc4922d`; at the actual head the count reproduces to the instruction. The
pinned toolchain is what made that checkable, and it worked.

Two smaller confirmations: `scripts/runtime-parity-evidence.mjs` now takes `--runner` /
`$FUNCTION_RUNNER`, so the throwaway patch I needed last time is no longer required. And the
count note above is a documentation nit only — the PR body says 47 reduction-validation cases
while the suite emits 59 passing assertions; nothing fails.

Cohort provenance independently re-derived from the committed artifacts: **13 of 13 products**
have traversed option-variant count equal to the byte survey's `built` count, **171 distinct
option variants**, and cross-referencing all 171 against `option-dispositions-2026-08-31.json`
returns **171 of 171 PASS, 0 unresolved**. Izza's HOLD 2 closure verifies.

## 6. Candidate identity — HOLD

| | |
|---|---|
| PR #16 title | `FROZEN 63aecbb59e3e93ee7025fa54c48e6a1768e61b56` |
| PR #16 body | "**This SHA does not move during independent QA**", CI run 33846996647 |
| Actual PR head | **`ee21546e8825f7fc8edf78d02417a059c98d1ddd`** |
| Commits past the frozen SHA | **3** — `844b6ca`, `3d1dad6`, `ee21546e` |

Three CI runs still display the title "FROZEN 63aecbb…" while running a different head. The
frozen-SHA undertaking has been broken three times since it was given.

**Mitigating, and it matters:** `git diff 63aecbb..ee21546e -- extensions/` is **empty**. The
whole delta is 8 files, +517/−0, entirely under `scripts/` and `docs/`. The deployable Rust
function and both fixture suites are byte-identical between the two. So the runtime evidence
carries across unharmed, and this is a process failure rather than an evidence failure.

But Tim is right that it is not merely a workbook addition: the delta adds
`scripts/validate-reductions.mjs` (+63) and its tests (+56), two workbook generators, and the
component-basis mapping JSON (+80). Approval of an older head does not cover those, and they
are precisely the logic this review depends on.

**Required:** reconcile the PR title, body and CI display title to `ee21546e`, or freeze a new
SHA and say so. Not by reset or force-push. Until the named candidate and the actual head
agree, I cannot issue a candidate-scoped PASS, because there is no unambiguous candidate to
name in it.

## 7. Disposition

**PASS** — calculations (9/9), the exact-ID proposal and its isolation, the affected-parent
mapping including the parents a SKU scan misses, the component-basis rule, tests and runtime
at the actual head, and the cohort provenance closure.

**HOLD** — candidate identity, per §6. Fixable by an edit to the PR, not by more work.

**BLOCKED, not incomplete** — the two inputs my final disposition depends on are not yet due:

1. **Larianne's 29 confirmed bases**, due 2026-09-08 10:00 AM. Every reduction-bearing row
   reads `CANNOT-VALIDATE` until she supplies figures, by design. The four RGOP bases need
   the §4 guard.
2. **Qash's nine bounded correction proposals with backups, regression tests and rollback**,
   due 2026-09-08 2:00 PM. §1–§4 verify the inputs to those proposals, not the proposals.

**Still BLOCKED from the prior round**, unchanged and not mine to clear: named staging access
and Partner visibility of `qash-izza-bundle`; confirmed test-payment mode on the staging
store; company admin/recovery/revocation on both repositories; theme PR #729 still draft with
a stale paired SHA; staging FF-FSR90 still carrying a 16 August catalogue that predates the
30 August rules; and the absent variant-level `custom.bundle_option_config` definition on
staging, without which variant precedence cannot be exercised.

No production price, metafield, option relationship, app, theme or release change is proposed
or authorised by this document.

---

## Appendix — how to reproduce

Runtime, at `ee21546e`:

```
git clone https://github.com/izzaahmed02/fs-bundle-api && cd fs-bundle-api
git checkout ee21546e8825f7fc8edf78d02417a059c98d1ddd
npm install && npm test
node --test scripts/validate-reductions.test.mjs
FUNCTION_RUNNER=<path> node scripts/runtime-parity-evidence.mjs \
  --live <current_live cart_transform_run.js> --out parity.json
```

Live option and parent reads:

```graphql
{ nodes(ids: ["gid://shopify/ProductVariant/51678113988924", ...]) {
    ... on ProductVariant { id title sku
      metafield(namespace:"custom", key:"price_reduction_value_new") { value } } } }
```

Parent-to-option traversal, per parent:

```graphql
{ product(id: "gid://shopify/Product/10237677207868") {
    metafield(namespace: "options", key: "product_options") { value } } }
```

then follow each `product_options` metaobject to its `product_options` children, and each
`product_option` child's `product_option_variants`.
