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

## 1. Authoritative catalogue key — decision 1 WITHDRAWN by Tim 2026-09-02

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

**Resolved.** Tim withdrew the repoint instruction on 2026-09-02 and confirmed
`custom.bundle_option_config` as the controlled Phase 2 namespace/key, with the `fs_bundle`
artefact marked non-authoritative and not to be updated. No generator, fixture,
documentation or staging write-plan work was repointed in the interim.

### 1.4 Why this also explains the production behaviour

Production reads `fs_bundle.option_config`. That key is unreadable from a Function input
query per §S, *and* carries no value anywhere on production per §1.1. Production strict mode
therefore cannot ever have engaged, and the JavaScript falls back to client-supplied pricing.
That is consistent with the order-scan result in §3: the adjustments that were applied came
through the legacy client-priced path, not through a trusted catalogue read.

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

**The drift reached charged prices, not just stored records.** Order #49324 (§3) shows both
drifted reductions were actually applied at checkout: FF-CIKB30 charged $40.53 where the
current 33% rule gives $40.20, and FF-CIKB40 charged $50.59 where the rule gives $50.92 —
$0.33 over and $0.33 under respectively. Small per unit, but it confirms the defect is live
in customer-facing pricing rather than latent in the source data.

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

## 3. Order #49324 / #49333 reconciliation — CORRECTED 2026-09-02

### 3.1 Correction to the earlier version of this section

An earlier version of this document read only `lineItem.customAttributes`. That misses
`lineItemGroup.customAttributes`, where the payload lives **after a successful grouping**.
Tim's 2026-09-02 correction is right, and three earlier conclusions are withdrawn:

| Withdrawn claim | Status |
|---|---|
| "#49324 carries no `_functionOperation` on any line" | **Wrong.** It carries one per configured parent, on the line item group. |
| "202 vs 50 lines, zero overlap — the shapes are mutually exclusive" | **Withdrawn.** An artefact of reading one attribute source. |
| "The non-zero path has exactly one production observation and it failed" | **Wrong.** It has 58 successful observations in this window. |

### 3.2 Re-run method

Every order re-read against **both** attribute sources, classifying each configured unit as
grouped (successful expansion) or ungrouped (failed/unexpanded):

- Range **#49115 – #49400**, 2026-08-01 to 2026-09-02 — **all 286 order numbers examined**
  (280 across seven paged queries; #49175, #49176, #49325, #49326, #49327 and #49328
  retrieved individually and each confirmed to have `lineItemGroup: null` on every line with
  zero-only adjustments).
- Grouped units de-duplicated by `LineItemGroup` id, since the group attributes repeat on
  every member line.

### 3.3 Result

| Class | Count |
|---|---|
| Grouped units (successful expansion) | **58**, across 51 orders |
| — of those carrying a non-zero `priceAdjustment` | **58** |
| — of those carrying a **negative** adjustment | **4** (all on #49324) |
| Ungrouped lines carrying `_functionOperation` | 228 |
| — of those with a non-zero adjustment | **8** (all on #49333) |

**Order #49324 is a successful comparator.** Five grouped units, each matching live base
prices exactly:

| SKU | Adjustment | Realized | Check |
|---|---|---|---|
| FF-CIKB20 | −$14.52 | $29.48 | $44.00 − $14.52 ✓ |
| FF-CIKB30 | −$19.47 | $40.53 | $60.00 − $19.47 ✓ |
| FF-CIKB40 | −$25.41 | $50.59 | $76.00 − $25.41 ✓ |
| FF-CIKB50 | −$30.36 | $61.64 | $92.00 − $30.36 ✓ |
| FF-SMWB-S6-620 | +$62.00 | $269.00 + $62.00 companion | parent unchanged, companion priced ✓ |

**Order #49333 is the sole failure.** All 11 lines have `lineItemGroup: null` — no expansion
occurred — with the payload surviving on the ungrouped line attributes and $4,856.10 of
configured option value uncharged on a $36,997.50 order. It is the only order in the window
with a non-zero ungrouped line.

### 3.4 The two findings coexist, as Tim set out

- **Strict catalogue mode never engaged in production.** Production reads
  `fs_bundle.option_config`, which is unreadable from a Function input query per §S and
  unpopulated everywhere per §1.1. This is unaffected by the grouping correction and still
  holds.
- **The legacy client-priced path did work**, on 58 units across 51 orders, and failed on
  #49333.

So the risk is not "the path has never worked." It is that the path which *does* work prices
from client-supplied values (§4) while the trusted catalogue path has never once engaged.

### 3.5 One attribution still unproven

Tim attributes the #49333 failure to the instruction limit being exceeded. That is the
leading hypothesis and the evidence is consistent with it — #49333 is by far the largest
configured cart in the window at 11 configured parents and 46+ operations, and §9 measures
the heaviest committed fixture at 6,231,776 of 11,000,000, so headroom exists at fixture
scale but not necessarily at that cart's scale.

It is not directly evidenced, because no production runtime log is available. The #49333
stress case in the staging matrix is what would confirm it. Recording it as a hypothesis
rather than a cause.

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
- #49324 as a successful comparator and #49333 as the failed fixture — confirmed against
  both attribute sources, with a complete 286-order scan behind it. §3.

### Requires a decision before the staging session

- **Decision 6 as corrected by Tim on 2026-09-02 is accepted.** #49324 is a successful
  grouped/legacy comparator; #49333 is the failed/unexpanded fixture; strict catalogue mode
  never engaged. See §3. The staging matrix should still open with the single
  one-paid-option case before the #49333 stress case, so that a pass establishes the
  trusted path engages at all before cart size is varied.
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
