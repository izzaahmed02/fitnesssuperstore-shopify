# Independent verification — Post Avis Phase 2

**Reviewer:** Yusra | Fitness Superstore (Independent QA)
**Date:** 2026-08-30
**Scope:** Tim's 2026-08-30 decision email ("LIMITED ISOLATED-STAGING GO"), verified against
live Fitness Superstore Shopify Admin and the `izzaahmed02/fitnesssuperstore-shopify` theme
repository at `origin/main` = `8a00e8e5ce6477358b8baffc676c937ea7344eb2`.

**Disposition: HOLD.** See §7.

All checks below are read-only. No metafield definition was created, no catalogue was
written, no theme or app was changed, no order was edited, and no staging or production
deployment was performed.

---

## 1. Authoritative catalogue key — CONFIRMS Tim decision 1

| Check | Result |
|---|---|
| `metafieldDefinitions(ownerType: PRODUCT, namespace: "fs_bundle")` | 0 definitions |
| `metafieldDefinitions(ownerType: PRODUCTVARIANT, namespace: "fs_bundle")` | 0 definitions |
| `custom` namespace, PRODUCT (50 definitions) | no `bundle_option_config` |
| `custom` namespace, PRODUCTVARIANT (11 definitions) | no `bundle_option_config` |

Metafield **values** for both `fs_bundle.option_config` and `custom.bundle_option_config`,
read at product level and variant level:

| SKU | Product ID | Variant ID | `fs_bundle.option_config` | `custom.bundle_option_config` |
|---|---|---|---|---|
| FF-CIKB30 | 9878961029436 | 50749288284476 | null | null |
| FF-CIKB40 | 9878962831676 | 50749290611004 | null | null |
| FF-FSR90 | 9878150218044 | 51734489661756 | null | null |
| FF-FSR100 | 9875868123452 | 51140912218428 | null | null |

Theme repository at `origin/main`:

```
git grep -n -E "bundle_option_config|fs_bundle|option_config" origin/main
# no matches
```

**Verified.** Neither key exists as a definition or a value on production, and the live theme
references neither. Because nothing is populated either way, the canonical-key choice carries
no migration cost today — decision 1 is safe to adopt as written.

**Not verified:** the stated rationale that the deployed production function reads
`fs_bundle.option_config`. That is a property of the deployed app build, and I have no access
to the deployed source or the Partner/Developer record. It remains Izza's `izza-bundle-20`
→ SHA mapping item.

---

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

## 6. Staging QA readiness note

FF-FSR90 currently carries an automatic 10% checkout discount through 2026-09-07, observed
on Order #49333 as $3,299.00 → $2,969.10. FF-FSR90 is in the staging stress set. Expected
staging checkout totals must be stated both with and without the promotion, or a correct
result will be misread as a failure.

---

## 7. Disposition — HOLD

**HOLD.** No PASS is possible at this time, and the reason is structural rather than a
judgement on the work.

### Blocked — cannot be performed from this environment

1. **The Rust candidate repository `izzaahmed02/fs-bundle-api` is not accessible to me.**
   I cannot check out any SHA, run function-runner, or independently reproduce: the
   6,242,014 / 11,000,000 instruction count; the 54 fixtures; the 17/17 disposition and 4/4
   regular-price cases; the 29 agreements / 25 explained divergences / 0 unexplained parity
   result; the 4,291-byte and 8,987-byte catalogue measurements against the 9,000-byte gate;
   the exclusion logic; authoritative-key behaviour; or the fail-closed controls. Every one
   of these currently rests on developer self-report. **Read access for me is a prerequisite
   for the independent reproduction assigned to me.**
2. **No access to `api-testing-izza-qash.myshopify.com` or the `qash-izza-bundle` staging
   app.** The product page → cart → checkout → completed order → rollback QA cannot start.
   Named access is Usman's 10:00 AM Monday item.
3. **No frozen SHA exists.** Tim: "No SHA is frozen yet." Qash posts one at 11:00 AM Monday.
   A PASS tied to an exact SHA cannot precede it.
4. **The deployed production runtime identity is unestablished.** Mapping `izza-bundle-20`
   to a deployed SHA and deployment timestamp is Izza's item; I have no Partner/Developer
   record access.

### Verified and clear

- Decision 1 (canonical key `fs_bundle.option_config`) — confirmed safe; nothing populated
  either way.
- Decision 5 (FF-CIKB30 $19.80 / FF-CIKB40 $25.08) — confirmed arithmetically, with the
  drift mechanism identified.
- Decision 3 exclusions and decision 4 exclusions — no evidence found that contradicts them.
- #49333 as a failing fixture — confirmed, with a complete 249-order scan behind it.

### Requires a decision before the staging session

- **Decision 6 should be restated.** #49324 is not a verified working comparator, and later
  orders do not demonstrate correct transformation. The evidence supports "the non-zero
  path is unproven in production," not a cart-complexity threshold. This raises rather than
  lowers the risk of any activation, and the staging test plan should be written to prove
  the non-zero path works at all before it is used to probe for a size threshold.
- PR #729's stale Rust cross-reference should be reconciled before it is applied to staging.

---

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
