# Standing re-check, 26 September 2026

Read-only. No Shopify mutation, no metafield write, no order edit, no refund, no
merge, nothing pushed to `fs-bundle-api`.

My row-level PASS of the 35 was issued on 20 September against a live read that
day. Tim's pre-issued GO fires on that PASS plus Izza's, and Izza's has not
landed, so the PASS has now been sitting for six days while it waits. A PASS tied
to live data has a shelf life. This is the re-read that keeps it honest.

## The 35 still hold — PASS 35 of 35, zero drift

Re-read live today and compared row by row against the 20 September baseline:

| check | result |
|---|---|
| Proposed value = 33% of the live parent price | 35 of 35 |
| Basis still equals Larianne's written confirmation | 35 of 35 |
| Recorded `before` still equals the value stored live | 35 of 35 |
| Delta arithmetic | 35 of 35 |
| **Rows changed since 20 September** | **none** |

No parent price has moved and no stored value has moved. Every one of the 35
still carries a `custom.price_reduction_value_new` last written 10 March 2026.
**The 20 September PASS stands as issued and needs no re-statement.**

## Tranche C is also unchanged

| option | component (live) | stored | correct | delta |
|---|---|---|---|---|
| FF-RGOP350 `51462540722492` | 584.10 | 214.17 | 192.75 | −21.42 |
| FF-RGOP190 `51462541214012` | 296.10 | 108.57 | 97.71 | −10.86 |
| FF-RGOP260 `51462540788028` | 404.10 | 148.17 | 133.35 | −14.82 |

Identical to the 20 September pre-verification. All three still drifted, all
three still unchanged since March.

## What has not moved, with dates

| item | owner | ordered | state today |
|---|---|---|---|
| Staging access + Partner visibility for Yusra | Izza | 17 Sep (same-day), again 20 Sep with a **Mon 21 Sep EOD** hard deadline | not confirmed in the thread |
| Izza's PASS, or the stated reason it cannot issue | Izza | same deadline | not in the thread |
| Activation packet, incl. the #49333 fixture | Izza | same deadline | not in the thread |
| PR #16 title, body and CI display reconciled to `dd531b0` | Qash | 17 Sep, again 20 Sep "today" | **still reads `FROZEN 63aecbb`**, `updated_at` 2026-09-17T05:38:56Z |
| Tranche C proposal documents | Qash | 20 Sep | no new commits on the branch; head still `dd531b0`, 115 commits |
| #49509 $0.99 refund | unnamed | approved 20 Sep | **`totalRefunded` $0.00, no refunds recorded** |

The candidate itself is untouched: branch head is still
`dd531b0e4711b187b141fba317af2427f2400d95`.

## Disposition

Nothing has regressed and nothing has advanced. The workstream is stalled on
three items, none of them mine: Izza's three deliverables (five days past a hard
deadline), Qash's PR reconciliation and Tranche C proposals, and the #49509
refund which still has no named owner.

My Tranche C row-level verification cannot start until Qash's proposals exist.
The arithmetic and mapping are already pre-verified, so that step is short once
they land.
