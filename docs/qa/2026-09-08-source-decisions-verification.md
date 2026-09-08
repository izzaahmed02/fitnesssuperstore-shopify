# Independent QA — verification of Larianne's returned 29 bases

**Reviewer:** Yusra | Fitness Superstore (Independent QA)
**Date:** 2026-09-08
**Input verified:** Larianne's email of 2026-09-07 18:47 UTC and the workbook she returned,
`Post_Avis_Combined_Price_Reconciliation_REVIEW_ONLY_2026-09-05.xlsm`, Drive file
`18zgoeQk_Y00ppfvuT0_PKbrj-nW9jrFO`, modified 2026-09-07 18:34 UTC, owner
`larianne.pachica@fitnesssuperstore.com`.

**Assignment:** Tim, 2026-09-05 — "Independently verify the source decisions."

**Disposition on the source-decision gate: HOLD.** All read-only; nothing written anywhere.

---

## 1. What came back

The `Confirm 29 Bases` sheet is populated on all 29 rows: `Confirmed by` = Larianne,
`Confirmation date` = 2026-09-07, and a live PDP URL plus a controlled-sheet link in
`Controlled source / evidence` for every row.

**But `Decision` reads `PENDING` on 29 of 29, and `Source gate` reads `PENDING` on 29 of 29.**
By her own marking nothing is confirmed. This is an incomplete return, not a set of approvals
I am rejecting.

## 2. The blocking finding: the promotional price is in the confirmed-price column, on 29 of 29

| Check | Result |
|---|---|
| `Confirmed regular price` == `Suggested regular price` (correct) | **0 of 29** |
| `Confirmed regular price` == `Price in source snapshot` (the promotional price) | **29 of 29** |
| Live Shopify price == `Price in source snapshot` | **29 of 29** |
| `snapshot / 0.9` == `Suggested regular price` | **29 of 29** |
| `compareAtPrice` on the live variant | **null on all 29** |

Every one of the 29 basis products is currently carrying the 10% promotion with no compare-at
recorded, so for all 29 the regular price cannot be read from Shopify at all. The
`Suggested regular price` column already holds the correct figure on every row. The
`Confirmed regular price` column holds the discounted figure on every row.

This is the **same error as the first sheet**, recurring after the correction. I flagged this
exact shape for four SKUs in my 7 September email; it turns out to affect all 29, because all
29 are promotional, not just the four RGOP bases.

### Effect if any of it were accepted at face value

| Basis | Confirmed as | Should be | Reduction from the confirmed figure | Correct stored reduction |
|---|---|---|---|---|
| FF-RGOP190 | 296.10 | **329.00** | 97.71 | **108.57** |
| FF-RGOP260 | 404.10 | **449.00** | 133.35 | **148.17** |
| FF-RGOP350 | 584.10 | **649.00** | 192.75 | **214.17** |
| FF-RGOP450 | 719.10 | **799.00** | 237.30 | **263.67** |

The FF-RGOP450 row matters beyond its own reduction: **the FF-RGOP495 mapping proposal depends
on FF-RGOP450's regular being $799.** Confirmed at 719.10, that proposal's target of $263.67
no longer reconciles, and a correct remap would look invalid.

The validator behaves correctly here — a promotional price with a round-discount signal is
held rather than treated as regular, so all 29 would read `CANNOT-VALIDATE` and fail closed.
Nothing bad reaches production. But the source gate cannot open on this return.

## 3. What Larianne needs, stated as the exact values

The correct entry for each row is the figure already sitting in the
`Suggested regular price` column. For the four that carry the most weight:

- **FF-RGOP190 → 329.00**
- **FF-RGOP260 → 449.00**
- **FF-RGOP350 → 649.00**
- **FF-RGOP450 → 799.00**

The remaining 25 follow the same rule: the confirmed regular is `snapshot / 0.9`, which is the
suggested figure, verified as a whole-dollar price on all 29.

The instruction that would prevent a third occurrence is one line: **do not copy the price you
see on the site into the confirmed column — every one of these 29 is on a 10% promotion right
now, so the site price is 90% of the number being asked for.** The column ordering does not
help: `Price in source snapshot` sits immediately left of `Confirmed regular price`, and the
correct value is one further left again.

## 4. Second finding: the coverage count is one too high, and the extra one is the excluded row

`Cases using this basis` sums to **37**. `Source A Recheck 36` holds exactly **36** data rows,
and Tim's email states the 29 bases cover 36.

Pinpointed. Of the 36 recheck rows, 29 are the bases themselves and 7 are bundles:

`FF-235R4MFAB`, `FF-305R4MFAB`, `FF-395R4MFAB`, `FF-RGOP235-B`, `FF-RGOP305-B`,
`FF-RGOP395-B`, `FF-RGOP395-BB`

29 + 7 = 36, matching Tim's "seven bundles reuse the same plate-set basis". Attributing those
seven against my own live metaobject traversal:

| Basis | Bundles that reuse it | Correct count | Sheet claims |
|---|---|---|---|
| FF-RGOP190 | FF-RGOP235-B, FF-235R4MFAB | 3 | 3 ✓ |
| FF-RGOP260 | FF-RGOP305-B, FF-305R4MFAB | 3 | 3 ✓ |
| FF-RGOP350 | FF-RGOP395-B, FF-RGOP395-BB, FF-395R4MFAB | 4 | 4 ✓ |
| **FF-RGOP450** | **none — FF-RGOP495 is the excluded mapping HOLD** | **1** | **2 ✗** |

So FF-RGOP450 is credited with FF-RGOP495, which is explicitly `NOT ACTIONED` and excluded.
Minor arithmetically, but it means the sheet implicitly counts the excluded row as covered,
which could later be read as FF-RGOP495 being handled when it is not. Correct total is 36.

## 5. Disposition

**Source decisions: HOLD.** 0 of 29 bases carry a usable confirmed regular price, and all 29
`Decision` and `Source gate` values are `PENDING`. Every reduction-bearing row stays
`CANNOT-VALIDATE`, which is the designed behaviour.

**Unchanged from 7 September:** calculations PASS (9 of 9), the exact-ID proposal and its
isolation PASS, the affected-parent mapping PASS, tests and runtime at `ee21546e` PASS
(6,242,014 of 11,000,000 exactly, parity 29/25/0), provenance PASS (171 of 171), Klaviyo
isolation PASS with the standing no-install condition. Candidate identity remains HOLD.

**Not reached, because the source gate is closed:** the nine correction proposals cannot be
verified against confirmed bases, and FF-RGOP495 cannot be cleared while FF-RGOP450's regular
is unconfirmed.

No production price, metafield, option relationship or release change is proposed or
authorised here.

---

## Appendix — reproducing this

```python
import openpyxl
from decimal import Decimal as D
wb = openpyxl.load_workbook('<returned>.xlsm', data_only=True, keep_vba=True)
ws = wb['Confirm 29 Bases']
for r in ws.iter_rows(min_row=6, values_only=True):
    if r[0] and isinstance(r[1], (int, float)):
        snap, sugg, conf = D(str(r[1])), D(str(r[2])), D(str(r[3]))
        assert (snap / D('0.9')).quantize(D('0.01')) == sugg   # every basis is promotional
        assert conf == snap                                    # 29 of 29: the wrong column
```

Live cross-check, per basis SKU:

```graphql
{ products(first: 30, query: "sku:FF-RGOP350 OR ...") {
    nodes { variants(first: 1) { nodes { sku price compareAtPrice } } } } }
```
