# Independent verification — Post Avis Phase 2

**Reviewer:** Yusra | Fitness Superstore (Independent QA)
**Date:** 2026-08-30
**Scope:** Tim's 2026-08-30 decision email ("LIMITED ISOLATED-STAGING GO"), verified against
live Fitness Superstore Shopify Admin and the `izzaahmed02/fitnesssuperstore-shopify` theme
repository at `origin/main` = `8a00e8e5ce6477358b8baffc676c937ea7344eb2`.

**Disposition: HOLD.** See §8.

All checks below are read-only. No metafield definition was created, no catalogue was
written, no theme or app was changed, no order was edited, and no staging or production
deployment was performed.

---

## 1. Authoritative catalogue key — decision 1 is UNSAFE AS WRITTEN

### 1.1 What I confirmed of Tim's premises

| Check | Result |
|---|---|
| `metafieldDefinitions(ownerType: PRODUCT, namespace: "fs_bundle")` | 0 definitions |
| `metafieldDefinitions(ownerType: PRODUCTVARIANT, namespace: "fs_bundle")` | 0 definitions |
| `custom` namespace, PRODUCT (50 definitions) | no `bundle_option_config` |
| `custom` namespace, PRODUCTVARIANT (11 definitions) | no `bundle_option_config` |

Values for both keys, read at product and variant level:

| SKU | Product ID | Variant ID | `fs_bundle.option_config` | `custom.bundle_option_config` |
|---|---|---|---|---|
| FF-CIKB30 | 9878961029436 | 50749288284476 | null | null |
| FF-CIKB40 | 9878962831676 | 50749290611004 | null | null |
| FF-FSR90 | 9878150218044 | 51734489661756 | null | null |
| FF-FSR100 | 9875868123452 | 51140912218428 | null | null |

Theme repository at `origin/main`: `git grep -E "bundle_option_config|fs_bundle|option_config"`
returns no matches.

And Tim's statement about the deployed production query is correct. Read directly from the
production branch source, `origin/current_live`,
`extensions/product-bundle/src/cart_transform_run.graphql`:

```graphql
optionConfig: metafield(namespace: "fs_bundle", key: "option_config") {
```

So every premise in decision 1 holds. The conclusion drawn from them does not.

### 1.2 The blocking finding

`docs/task1-rust-port-validation.md` §S records a controlled experiment run on the test store
on 2026-08-14 that eliminated **ten** competing hypotheses by direct test rather than
reasoning — scope granted, metafield present and byte-identical, merchant-owned definition
created, storefront read granted, value rewritten after definition and app redeployed, query
source verified, product identity verified, and two positive control probes.

The isolated result:

| Metafield | Namespace | Type | Function sees |
|---|---|---|---|
| `custom/warranty` | `custom` | text | **value** |
| `custom/bundle_option_config` | `custom` | json | **value** |
| `fs_bundle/option_config` | `fs_bundle` | json | **`null`** |

The two definitions are identical in `ownerType`, `access.admin`, `access.storefront` and
`adminFilterable`. **The namespace string is the only difference.** `fs_bundle` is not
declared or reserved by any of our own apps, and the platform root cause is explicitly
recorded as unexplained and out of scope.

**Decision 1 directs the Rust consumer, generator, fixtures, documentation and staging write
plan to move to a key that a controlled company experiment has already shown the function
cannot read.**

The failure mode is silent, which is what makes this urgent rather than merely wrong. Per §S,
executing that literally against production would write catalogues the function cannot read
with: no error, no warning, no failed deploy; correct-looking data in the Shopify admin; the
release gate reporting itself satisfied; and the legacy client-priced path still running
underneath with the undercharge exposure fully open. §S puts the scale at 3,737 catalogues.
The input query in the repository carries an inline warning against "tidying" it back to
`fs_bundle` for exactly this reason.

### 1.3 Decision 1 also reverses a prior Tim approval

`scripts/option-config/fsr90-option-config.json` records the current location as
"custom/bundle_option_config (merchant-owned), **per Tim's approval of 14 Aug**", and
§S carries Tim's own numbered corrections to that section. PR #16 is therefore not drifting
from an approved key — it is implementing one. Decision 1 appears to have been reached
without §S in view.

Tim's decision 1 already provides the route: a compelling reason to stay off
`fs_bundle.option_config`, documented, with separate written approval. That reason exists,
predates the decision, and is his own. **Recommendation: keep `custom.bundle_option_config`
and confirm decision 1 is withdrawn in writing before any generator, fixture or staging work
is repointed.**

### 1.4 Why this also explains the production behaviour

Production reads `fs_bundle.option_config`. That key is unreadable from a Function input
query per §S, *and* carries no value anywhere on production per §1.1. Production strict mode
therefore cannot ever have engaged, and the JavaScript falls back to client-supplied pricing.
That is an exact, independent match for the order-scan result in §3: across 249 orders, no
non-zero client `priceAdjustment` was ever applied, because the trusted path it would have
been checked against was never live. The lab result and the production data agree, and they
were arrived at separately.

## 2. FF-CIKB30 / FF-CIKB40 — CONFIRMS Tim decision 5, and identifies the root cause

Live regular prices (all four have `compareAtPrice: null`):

| SKU | Live price |
|---|---|
| FF-CIKB20 | $44.00 |
| FF-CIKB30 | $60.00 |
| FF-CIKB40 | $76.00 |
| FF-CIKB50 | $92.00 |

Order #49324 (processed 2026-08-24T23:17:37Z = 4:17 PM Pacific) records the reduction
actually applied to each, both in the charged parent price and in the option line SKU slug:

| SKU | Parent charged | Reduction applied | Option line SKU suffix |
|---|---|---|---|
| FF-CIKB20 | $29.48 | $14.52 | `...-14-52` |
| FF-CIKB30 | $40.53 | $19.47 | `...-19-47` |
| FF-CIKB40 | $50.59 | $25.41 | `...-25-41` |
| FF-CIKB50 | $61.64 | $30.36 | `...-30-36` |

Applying the 33% rule to the **current** regular price:

| SKU | 33% of live price | Reduction on record | Match | Implied authoring base |
|---|---|---|---|---|
| FF-CIKB20 | $14.52 | $14.52 | yes | $44.00 (current) |
| FF-CIKB30 | $19.80 | $19.47 | **no** | $19.47 / 0.33 = **$59.00** |
| FF-CIKB40 | $25.08 | $25.41 | **no** | $25.41 / 0.33 = **$77.00** |
| FF-CIKB50 | $30.36 | $30.36 | yes | $92.00 (current) |

**Larianne's source PASS and Tim's controlled expected values are confirmed arithmetically:**
$60.00 × 33% = $19.80 and $76.00 × 33% = $25.08.

**Root cause identified.** The two drifted rows are not arbitrary stale numbers. Each is
exactly 33% of a *superseded* parent price — $59.00 for FF-CIKB30 and $77.00 for FF-CIKB40.
Reductions are stored as absolute amounts computed at authoring time and are never
recomputed when the parent is repriced. The two siblings still agree only because their
parents were not repriced. There is no compare-at value and no audit field on any of the
four, so the drift is silent.

**Consequence for decision 3 (35 PRICE-DRIFT-REVALIDATE rows).** This is a class defect, not
two isolated rows: any absolute reduction record drifts on every parent reprice. Two
recommendations follow, both of which reduce the size of the later merchandising project
rather than expanding Phase 2 scope:

1. The generator should recompute the reduction from the live parent price at generation
   time and fail closed when the stored amount disagrees, rather than trusting the stored
   amount. This makes drift detectable instead of silent.
2. Before treating all 35 rows as a merchandising project, test the hypothesis mechanically:
   for each drift row compute `reduction / 0.33` and check whether the result lands on a
   clean former price. Where it does, the row is deterministically explainable and may be
   recoverable from price history rather than requiring a manufactured source. This is a
   hypothesis from 4 data points, not a finding — but it is cheap to test and could shrink
   the 35.

Both remain excluded from Phase 2, as Tim directed. No write is proposed.

---

## 3. Order #49333 incident boundary — decision 6 is NOT supported as written

### 3.1 Scan method and completeness

Every order in the window was examined, not a sample:

- Range: **#49115 – #49363**, 2026-08-01 through 2026-08-30 — **249 of 249 order numbers**
  (247 retrieved across five paged queries, #49175 and #49176 retrieved individually).
- **692 line items** inspected.
- For each line, the `_functionOperation` cart attribute was parsed and every
  `priceAdjustment` value extracted, then compared against the price actually charged.

### 3.2 Result

**Exactly 8 line items in the entire month carry a non-zero `priceAdjustment`. All 8 are on
Order #49333. All 8 were charged at base price.**

| SKU | Charged | Option adjustments due | Ops | Non-zero ops |
|---|---|---|---|---|
| FFS-LPDLR-V2 | $2,799.00 | $79.00 | 6 | 2 |
| FFT-HAA | $2,799.00 | $299.00 | 4 | 1 |
| FFB-DAP | $3,099.00 | $682.00 | 10 | 7 |
| FFT-CSMP | $2,799.00 | $299.00 | 4 | 1 |
| FF-FSR90 | $3,299.00 (charged $2,969.10 after automatic 10% discount) | $1,630.00 | 13 | 9 |
| FFT-PLCLE | $2,799.00 | $299.00 | 4 | 1 |
| FFM-PLHSLP | $2,499.00 | $849.00 | 4 | 1 |
| FFB-45DLLP | $2,799.00 | $719.10 | 4 | 1 |

Total configured-option value not charged: **$4,856.10**, on an order totalling $36,997.50.

Lines whose adjustments were all zero were unaffected, which is expected — a zero adjustment
is indistinguishable whether or not the transform ran.

### 3.3 Two payload shapes, mutually exclusive

Across the 692 line items:

| Shape | Lines |
|---|---|
| carries `_functionOperation` | 202 |
| carries a `Price` attribute | 50 |
| carries **both** | **0** |

Order #49333 is the `_functionOperation` shape. **Order #49324 carries no
`_functionOperation` attribute on any line** — it is the `Price` shape, with option
selections as separate companion line items and the parent price already net of the
reduction.

### 3.4 What this means

- **#49324 cannot serve as a verified working comparator for the path that failed on
  #49333.** It never exercised that path. Whatever applied the kettlebell reduction on
  #49324 is a different mechanism, and the order record alone does not establish which.
- **"Later orders also transformed correctly" is not demonstrable from production data.**
  Every later order's `_functionOperation` adjustments are zero, and a zero adjustment
  yields an identical result whether or not the transform ran. These orders are not
  evidence of success.
- **A deterministic cart-complexity threshold is therefore not established** — there is no
  passing observation either above or below any cart size. Neither is a time-based window.

The accurate statement of the evidence is narrower and carries more risk than either
hypothesis: **the non-zero `priceAdjustment` path has exactly one production observation in
August 2026, and it failed.** The path should be treated as unproven in production.

Tim's instruction not to characterize all orders between the two timestamps as affected is
supported, and more strongly than stated: the scan shows no other order was affected,
because no other order used the path. #49333 remains a valid failing fixture.

---

## 4. Provenance of `priceAdjustment` — control finding

`assets/product-custom-options.js` at `origin/main`, `prepareFunctionalProperties()`
(lines ~1257–1320), builds each cart line's `priceAdjustment` by reading DOM dataset values
in the customer's browser and splitting the `variantId:::price` encoding:

```js
const variantPrice = value.includes(':::') ? Number(value.split(':::')[1].trim()) : 0;
const productOption = { variantId: variantID, priceAdjustment: variantPrice, ... };
```

This matches the `defaultValues` encoding recorded on production orders — for example
`"51462523453756:::60.00"` on Order #49333 — confirming the chain from theme source to live
order payload.

**There is no live exposure today**, because nothing consumes the field. But activating any
function that trusts `priceAdjustment` without validating it against a server-side catalogue
would make a customer-browser-supplied value price-authoritative.

This makes the ordering already recorded in PR #729 (a populated catalogue and a fail-closed
checksum in place before or with function activation) a **control, not a sequencing
preference**, and it is the strongest argument for holding decisions 1 and 2 exactly as
written. It also means catalogue population, however inert today, should not be reasoned
about purely as an inert write.

`assets/fs-bundle-guard.js` is **absent** from `origin/main`, independently confirming PR
#729 is not deployed.

---

## 5. PR #729 state

| Field | Value |
|---|---|
| Head | `ea55097ed94d66bd75aaaac476fd4138e6c5fcdb` |
| Base | `staging-qa` (`d6f0bccd81cb70f7247b3a4f10243b08dac64a2b`) |
| State | open, **still draft**, unmerged |
| Size | 10 files, +636 / −3 |
| Last updated | 2026-08-27 |

Two items to close **before** it is applied to the isolated staging theme:

1. **Stale cross-reference.** The PR body names the paired Rust PR #16 as head `a09c811`,
   tested head `1745ea9`. The independently reviewed head is
   `fc4922d392bfdef01540a875e1e0dd34eccd56f6`. This is the same defect flagged on PR #16 —
   the named candidate and the actual head do not match — and it needs the same
   reconciliation here.
2. The PR body records that there is no submitted Izza review on this head, and that it is
   still a draft rather than a deployment candidate.

---

## 6. Thread attachment review

The thread carries one distinct image attachment. It appears twice — on Izza's 30 August
message and again on Qash's reply that quotes it — and the two copies are byte-identical
(SHA-256 `96edbfdf97ad4d72...`, 29,689 bytes). There are no other attachments or screenshots
in the thread.

It is a Shopify Partner dashboard row showing:

| Store | Store type | Status |
|---|---|---|
| API Testing \| Izza-Qash — `api-testing-izza-qash.myshopify.com` | Staging | Active |

**What it evidences:** the staging store exists, is registered as a Shopify *Staging*-type
store, and is Active. That is consistent with Izza's isolation statement.

**What it does not evidence:** the image is cropped to the single row. It does not show the
owning Partner organization, the `qash-izza-bundle` app installation, the app's client ID,
or its scopes. Tim's staging authorization rests on "Izza's ownership, isolation, dependency,
and reset-method PASS," and this screenshot corroborates the store's existence and type only —
company ownership, the absence of production scope, and the single-store installation remain
Izza's written attestation rather than shown evidence. Those are verifiable directly once
Partner-organization visibility is granted, which is included in the access request in §8.

This also bears on the payment prerequisite in §7: Shopify applies payment restrictions to
non-production store types, which is precisely why test-mode or Bogus Gateway payment must be
confirmed enabled before the staging session rather than discovered at checkout.

## 7. Staging QA readiness note

FF-FSR90 currently carries an automatic 10% checkout discount through 2026-09-07, observed
on Order #49333 as $3,299.00 → $2,969.10. FF-FSR90 is in the staging stress set. Expected
staging checkout totals must be stated both with and without the promotion, or a correct
result will be misread as a failure.

---

## 8. Disposition — HOLD

**HOLD**, on one blocking technical finding plus two access gaps. This is not a judgement on
the quality of Qash's work, which reproduced cleanly on every check I could run (§9).

### Blocking — must be resolved before the staging session starts

**Decision 1 must be withdrawn or confirmed against §S.** Repointing the catalogue to
`fs_bundle.option_config` would move the function to a key a controlled company experiment
has already shown it cannot read, and the failure is silent: no error, plausible-looking
admin data, a release gate reporting itself satisfied, and the client-priced path still
running underneath. See §1. This is the one item where proceeding as written would make
things materially worse than doing nothing.

### Blocked — cannot be performed from this environment

1. **No access to `api-testing-izza-qash.myshopify.com` or the `qash-izza-bundle` staging
   app.** The product page → cart → checkout → completed order → rollback QA cannot start.
   Named access is Usman's 10:00 AM Monday item. Partner-organization visibility is also
   needed so the ownership and scope claims in §6 can be verified rather than accepted.
2. **Payment test mode unconfirmed.** Condition 7 requires completed checkouts with no real
   payment. Non-production store types carry payment restrictions, so Bogus Gateway or test
   mode must be confirmed enabled before Monday or completed-order QA cannot happen at all.
3. **No frozen SHA exists.** Tim: "No SHA is frozen yet." Qash posts one at 11:00 AM Monday.
   Everything in §9 is therefore tied to `fc4922d`, not to a frozen candidate, and must be
   re-run once the SHA is fixed. That re-run is now a short, scripted exercise.
4. **The deployed production runtime identity is unestablished.** Mapping `izza-bundle-20`
   to a deployed SHA and deployment timestamp is Izza's item; I have no Partner/Developer
   record access.

### Verified and clear

- **Runtime, parity, fixtures and disposition logic all reproduce** at `fc4922d` — 17/17,
  4/4, 54/54, 45/45, and parity at 29/25/0 exactly. §9.
- Decision 5 (FF-CIKB30 $19.80 / FF-CIKB40 $25.08) — confirmed arithmetically, with the
  drift mechanism identified. §2.
- Decision 3 (35 rows) and decision 4 (6 rows) — exclusion counts confirmed exactly. §9.
- Decision 2 (empty labels) — the right call on the precautionary argument, though the
  13-byte margin cited for it is not reproducible from the committed artefacts. §9.
- #49333 as a failing fixture — confirmed, with a complete 249-order scan behind it. §3.

### Requires a decision before the staging session

- **Decision 6 should be restated.** #49324 is not a verified working comparator, and later
  orders do not demonstrate correct transformation. The evidence supports "the non-zero
  path is unproven in production," not a cart-complexity threshold. §1.4 supplies the
  mechanism for why. The staging plan should first prove the non-zero path works at all,
  then probe for a size threshold.
- PR #729's stale Rust cross-reference should be reconciled before it is applied to staging.
- The toolchain versions and lockfiles requested on 28 August should be posted with the
  frozen SHA, so the instruction count becomes exactly checkable rather than approximately
  agreed. §9.

---

## 9. Independent runtime reproduction at the reviewed head

Performed against a fresh clone of `izzaahmed02/fs-bundle-api` checked out at
`fc4922d392bfdef01540a875e1e0dd34eccd56f6` — the head Tim independently reviewed. Local
only. No store, no credential, nothing deployed or activated, and nothing committed to that
repository.

**Toolchain used:** rustc/cargo 1.94.1, target `wasm32-wasip1`, Node 22.22.2,
Shopify CLI 4.7.0, function-runner 9.2.2, binaryen (wasm-opt) 123.0.0.

| Claim | Reported by Qash | Independently measured | Verdict |
|---|---|---|---|
| Estimator/spec checksum | — | `a5e3004509fedddc`, artefacts match spec | PASS |
| Source-control disposition cases | 17/17 | **17/17** | PASS |
| Regular-price cases | 4/4 | **4/4** | PASS |
| Transform fixtures | 54 | **54 run, 54 passed** | PASS |
| Cart-validation fixtures | — | **45 run, 45 passed** | PASS |
| JavaScript/Rust parity | 29 agree / 25 intended / 0 unexplained | **29 AGREE / 25 INTENDED-DIVERGENCE / 0 unexplained** | PASS, exact match |
| Max instructions | 6,242,014 of 11,000,000 | **6,231,776 of 11,000,000** | see below |
| Over budget | 0 | **0** | PASS |

Parity was run against the actual live production JavaScript, extracted from
`origin/current_live`, not a stand-in.

### The instruction-count delta

My maximum is 6,231,776 against Qash's reported 6,242,014 — a difference of 10,238
instructions, 0.16%. The headroom conclusion is unchanged and comfortable either way, and
the top fixture is the same (`hybrid-over-budget-folds-to-lineupdate.json`).

This is not presented as a discrepancy in the work. The most likely explanation is that
Qash's figure was measured on an earlier head — f74db2b, 3090c5b, a09c811 and 1745ea9 all
appear as candidate heads across the thread and PR bodies — and `fc4922d` post-dates them.
A toolchain difference is the other candidate, and cannot be excluded because the toolchain
versions and lockfiles Tim asked for on 28 August have not been posted.

That is precisely the point of freezing a SHA and publishing the toolchain: a number that
moves by 0.16% for unrecorded reasons cannot be independently confirmed, only approximately
agreed with. Once the SHA is frozen and the toolchain published, this becomes a
one-command check.

### Reproduction accommodations, disclosed

Two, neither of which touches the function under test:

1. The Shopify CLI fetches `wasm-opt` from `cdn.jsdelivr.net`, which this environment's
   egress policy blocks with a 403. The identical pinned artefact, binaryen 123.0.0, was
   installed from the permitted npm registry instead.
2. `scripts/runtime-parity-evidence.mjs` resolves function-runner from a hardcoded global
   CLI path. A local copy was run with only that one line repointed at the
   project-local install of the same function-runner 9.2.2 binary; the copy was deleted
   afterwards and nothing was committed. Worth fixing upstream so the script runs on any
   reviewer's machine.

### Remaining unreproduced

- **Catalogue byte measurements.** The committed artefact
  `docs/data/cohort-byte-sizes-2026-08-31.json` records a 12-product cohort on the
  empty-label basis with a maximum of 4,291 bytes against the 9,000-byte gate, 47.7%, none
  over — internally consistent with Qash's figures. Regenerating those numbers from source
  requires a production Admin read, so they are corroborated, not reproduced.
- **The 8,987-byte variant-title figure** behind decision 2 is not reproducible from the
  committed artefacts, which are empty-label only. Decision 2 is the right call on the
  precautionary argument regardless, but the 13-byte margin cited for it is currently
  unverifiable.

### Exclusion counts confirmed

From `docs/data/option-dispositions-2026-08-31.json`, 2,417 rows:

| Disposition | Rows |
|---|---|
| PASS | 2,275 |
| SUBSTITUTION-NO-FORMULA | 88 |
| PRICE-DRIFT-REVALIDATE | **35** |
| CONFLICT | 13 |
| MULTI-PARENT-HOLD | **6** |

The 35 in decision 3 and the six in decision 4 are confirmed exactly.

## Appendix — reproducing this

All Shopify reads were performed through the company Shopify Admin GraphQL connection.

Metafield definitions and values:

```graphql
{
  metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "fs_bundle") { nodes { namespace key } }
  metafieldDefinitions(first: 50, ownerType: PRODUCTVARIANT, namespace: "fs_bundle") { nodes { namespace key } }
  products(first: 10, query: "sku:FF-CIKB30 OR sku:FF-CIKB40") {
    nodes { id title
      variants(first: 5) { nodes { id sku price compareAtPrice
        mfA: metafield(namespace: "fs_bundle", key: "option_config") { value }
        mfB: metafield(namespace: "custom", key: "bundle_option_config") { value } } } }
  }
}
```

Order scan (repeated across the window, then de-duplicated by order name):

```graphql
{
  orders(first: 60, query: "created_at:>=2026-08-01", sortKey: CREATED_AT, reverse: false) {
    nodes { name createdAt processedAt
      lineItems(first: 40) { nodes { title sku quantity
        originalUnitPriceSet { shopMoney { amount } }
        discountedUnitPriceSet { shopMoney { amount } }
        customAttributes { key value } } } }
    pageInfo { hasNextPage endCursor }
  }
}
```

`priceAdjustment` values were extracted from each `_functionOperation` attribute with
`"priceAdjustment"\s*=>\s*(-?[\d.]+)` and compared against the charged unit price.

Theme checks:

```
git grep -n -E "bundle_option_config|fs_bundle|option_config" origin/main
git ls-tree origin/main assets/ --name-only | grep fs-bundle
git show origin/main:assets/product-custom-options.js | sed -n '1255,1320p'
```
