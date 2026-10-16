# Post Avis Phase 2 — QA index and superseded-findings map

Date: 2026-10-16 · Maintainer: Izza (technical/release) · Scope: Tim's 14 October item 4.

> Izza, add the current dated QA documents to PR #920, preserving historical evidence and
> identifying superseded findings. — Tim, 14 October

Nothing in this folder is edited or deleted when a finding is overtaken. Each QA document stays
exactly as it was written on its date, and this index is the single place that says which of its
findings still stand. If a document and this index disagree, the document is the historical
record and this index is the current status.

---

## 1. Documents, oldest first

| Date | Document | Author | Disposition as written | Still the live disposition? |
|---|---|---|---|---|
| 2026-09-07 | `pr784-exact-head-delta-qa-2026-09-07.md` | Yusra | — | Historical. PR #784 lineage. |
| 2026-09-08 | `pr784-prepublish-gate-2026-09-08.md` | Yusra | — | Historical. |
| 2026-09-10 | `pr784-prepublish-gate-96013bd-2026-09-10.md` | Yusra | — | Historical. |
| 2026-09-15 | `pr784-candidate-state-566b2396-2026-09-15.md` | Yusra | — | Historical. |
| 2026-10-01 | `post-avis-phase2-activation-packet-qa-2026-10-01.md` | Yusra | **HOLD** | Partly superseded — §2 below |
| 2026-10-16 | `metafield-definition-bundle-option-config-pass-2026-10-16.md` | Izza | **PASS** (scoped) | **Current** |
| 2026-10-16 | `write-catalogues-execution-recovery-review-2026-10-16.md` | Izza | **HOLD** | **Current** |

Supporting evidence: `docs/qa/evidence/2026-10-16/`.

---

## 2. Yusra's 1 October findings — current status

Every finding from `post-avis-phase2-activation-packet-qa-2026-10-01.md`, checked against the
current committed state on 2026-10-16. The 1 October document is unchanged; this table is the
delta.

| § | Finding, as written on 1 Oct | Status on 16 Oct | Evidence |
|---|---|---|---|
| 2 | **BLOCKER.** PR #24 publishes 5,967,712 / 54.25%. The committed fixture measures **5,984,130 / 54.40%**. The correction is inverted. | **SUPERSEDED — resolved in Yusra's favour.** `docs/data/order-49333-instruction-measurement.json` at `cdad0d2` now carries `instructions: 5984130`, `percentOfBudget: 54.4`, `headroomPercent: 45.6`, `rustAsShareOfJavaScript: 51.7`. The record now states the number that reproduces. | `fs-bundle-api@cdad0d2:docs/data/order-49333-instruction-measurement.json` |
| 3 | Fixture fidelity to production order #49333 — **PASS**. | **Stands.** Not re-run; nothing in the intervening work touches the fixture. | — |
| 4 | Candidate identity under the freeze rule — **PASS**. Plus: `extensions/product-bundle/package-lock.json` added on a freeze-gated path and undisclosed. | **PASS stands. The disclosure point is moot at the current head** — that file is no longer present under `extensions/product-bundle/` at `cdad0d2`. It remains a valid note against the PR #24 head it was written about. | `git ls-tree cdad0d2 extensions/product-bundle/` |
| 5 | CI **PASS**, but the archived transcript line still echoed `54 + 45 passed`. | **SUPERSEDED — fixed.** `.github/workflows/test.yml:280` now echoes `both suites ran: 55 + 45 passed, 0 skipped`, and the assertions at 278–279 check `55 passed` / `45 passed`. | `fs-bundle-api@cdad0d2:.github/workflows/test.yml` |
| 6 | **FAIL.** No `custom.bundle_option_config` definition in production; null on all twelve pilot products. Prerequisite unmet. | **STANDS, and is now broader.** Re-verified live 16 Oct: still no definition on PRODUCT or PRODUCTVARIANT, and **zero values across all 6,502 products and all 10,031 variants**, not just the pilot twelve. Tim's 14 Oct item 1 approves creating the empty definition; population stays on HOLD. | `metafield-definition-bundle-option-config-pass-2026-10-16.md` and its evidence JSON |
| 7 | Activation packet not yet posted. Rollback pinned to `qash-izza-bundle-16` / `1745ea9`, which is the **staging** app version, not production `izza-bundle-20`. | **SUPERSEDED on both halves.** The packet exists at `fs-bundle-api@cdad0d2:docs/production-activation-packet.md`, and it pins rollback to the production active version `izza-bundle-20` / `6be4c8d`, naming the staging-pin error explicitly as the thing it corrects. Tim's 14 Oct ruling also names `izza-bundle-20` as the rollback target. **The pin is still asserted rather than tested** — the packet says so itself — so the "tested rather than asserted" half of the finding is open. | `fs-bundle-api@cdad0d2:docs/production-activation-packet.md` §3, §9 |
| 8.1 | `deltaPercent: -1.47` should be **−1.43%** ((14,103 − 14,308) / 14,308). | **OPEN, minor.** Still `-1.47` in the measurement JSON at `cdad0d2`. Arithmetic re-checked: −1.4327%, so Yusra is right. | `order-49333-instruction-measurement.json:55` |
| 8.2 | PR #24 body says "three corrections"; `companion-package-test-only-plan.md` §13.53 says "two". | **OPEN, minor.** §13.53 still reads "Two corrections made during the measurement" at `cdad0d2`. | `fs-bundle-api@cdad0d2:docs/companion-package-test-only-plan.md` |
| 9 | Five items that would clear the HOLD. | 1 cleared, 2 partly (definition approved, population on HOLD), 3 partly (packet posted and repinned, pin untested), 4 partly (transcript fixed; −1.47 and the correction count open), 5 moot. | — |

**Net: Yusra's 1 October HOLD is not cleared.** Its headline blocker (§2) is resolved, and
resolved the way she measured it. What keeps the HOLD alive is §6 (catalogue prerequisite, now
proven unmet store-wide), the untested half of §7, and the two open documentation defects in §8.

---

## 3. New findings as of 16 October

From `write-catalogues-execution-recovery-review-2026-10-16.md`, against
`fs-bundle-api@cdad0d2:scripts/write-catalogues.mjs`. These are additive — none of them
contradicts anything above.

| # | Finding | Severity |
|---|---|---|
| W1 | The ledger is still only written after `run()` returns. A hard kill loses the whole recovery record — measured: 33,725 records written, no ledger on disk. | Blocker |
| W2 | The 9,000-byte gate and catalogue validity are not enforced in the execution path. `classify()` is unit-tested and never called. | Blocker |
| W3 | Rollback deletes without comparing the current value to what this run wrote. A later change is destroyed. | Blocker |
| W4 | An incomplete read is counted as "verified null", and the run exits clean. | Blocker |
| W5–W7 | The three evidence items Tim named on 14 October are absent from both the 17-test suite and the 8-scenario rehearsal. | Blocker |
| W8 | Batch indices collide across resumed runs; an already-written record is re-dispatched and filed as a conflict. | High |
| W9 | No throttle or retry handling on the live transport. | Medium |
| W10 | An unattributable error parks 25 records in a terminal state. | Medium |

---

## 4. Standing gates, unchanged

Recorded so a reader of this folder does not have to reconstruct them from the thread:

- Catalogue population: **HOLD** pending Tim's separate written GO, and must run with Rust inactive.
- Theme merge, publication, live-theme switching, Rust activation: **HOLD** pending the reviewed
  release packet, a safe coordinated sequence, and verified rollback to `izza-bundle-20` with the
  matching theme.
- Variant-level writes: not approved.
- The frozen Rust candidate `dd531b0` and `extensions/` are untouched by anything in this folder.
