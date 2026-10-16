# Technical review — `scripts/write-catalogues.mjs` execution and recovery paths

**Disposition: HOLD. Do not request the catalogue-write GO on this writer.**
Date: 2026-10-16 · Reviewer: Izza (technical/release) · Scope: Tim's 14 October item 2.
Subject: `fs-bundle-api` `scripts/write-catalogues.mjs` at **`cdad0d2`**
(<https://github.com/izzaahmed02/fs-bundle-api/blob/cdad0d2/scripts/write-catalogues.mjs>)

Tim, 14 October:

> Izza, review the actual execution and recovery paths, not just the passing test summary.

So that is what this is. I ran the committed suite — **17/17 pass**, exactly as the write plan
claims — and then drove the real exported `run()` and `rollback()` functions, and the real CLI
entry point, against adversarial transports. **Four of the five things Tim asked for are not in
the execution path.** Three of them pass their unit tests anyway, which is the trap he named.

Nothing in this review contacted a Shopify store. Every probe uses an in-memory transport.

Reproduce:

```
docs/qa/evidence/2026-10-16/write-catalogues-probe.mjs            # findings W1–W4
docs/qa/evidence/2026-10-16/write-catalogues-probe-output.json    # their recorded output
docs/qa/evidence/2026-10-16/write-catalogues-hard-kill-probe.sh   # finding W5, the real CLI
```

---

## 1. Summary

| # | Tim's 14 Oct requirement | In the execution path? | Severity |
|---|---|---|---|
| W1 | Persist the intended batch before dispatch; checkpoint each outcome | **No** | **Blocker** |
| W2 | Enforce the catalogue-validity and 9,000-byte gate before any mutation | **No** | **Blocker** |
| W3 | Rollback verifies the current value still matches what this run wrote | **No** | **Blocker** |
| W4 | Missing or incomplete reads are unresolved, not verified null | **No** | **Blocker** |
| W5 | Evidence: hard interruption and restart from disk | **Missing** | **Blocker** |
| W6 | Evidence: oversized candidate produces no write | **Missing** | Blocker (follows W2) |
| W7 | Evidence: post-write value change preserved during rollback | **Missing** | Blocker (follows W3) |
| W8 | *(new, mine)* Batch indices collide across resumed runs | **Defect** | High |
| W9 | *(new, mine)* No throttle or retry handling on the live transport | **Gap** | Medium |
| W10 | *(new, mine)* An unattributable error parks 25 records terminally | **Gap** | Medium |

The design is sound and several of the hard calls in it are right — atomicity is correctly
understood, `compareDigest: null` is the correct conditional-write protection, treating a timeout
as `UNKNOWN` rather than a failure is correct, and rolling back the ledger's `WRITTEN` list rather
than the intended list is correct. The problem is narrower and more fixable than that list makes
it sound: **a set of good components that `run()` and `rollback()` never call.**

---

## 2. W1 — the ledger is still only written after `run()` returns

This is Tim's point, unchanged at `cdad0d2`.

`main()` lines 537–544:

```js
ledger = await run({ query, records, ledger, limit: args.limit,
                     onBatch: (e) => console.log(JSON.stringify(e)) });
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
```

`onBatch` is a `console.log`. There is no `writeFileSync` anywhere inside `run()` — the only one
in the file is line 544, after the loop has finished. The ledger is an in-memory object for the
entire duration of the run. Nothing is persisted before dispatch, and nothing is checkpointed
after each outcome.

### Measured, against the real CLI

`write-catalogues-hard-kill-probe.sh`, `--rehearse` mode, 40,000 records, SIGKILL at 60% of the
measured full-run duration:

```
full uninterrupted run: 19.684s, ledger written
killing at 11.810s (60% through)
exit code: 137   (137 = SIGKILL)
the killed run reported 1349 batches / 33725 records WRITTEN on stdout
ledger on disk: ABSENT — the entire recovery record was lost
--- restart from disk against the same --ledger path ---
restart re-dispatched 1600 batches / 40000 records
```

The run wrote 33,725 records, told the operator on stdout that it had written them, was killed,
and left **no ledger at all**. The restart then re-dispatched all 40,000 from scratch.

### Why that is worse than losing a file

Against production, those 33,725 re-sends each carry `compareDigest: null`, so Shopify answers
`STALE_OBJECT` for every target that is now populated. `partitionOnStale` parks each one as
`PARKED_CONFLICT`, which is a **terminal** state (line 225) meaning "a human must look at this".
The 1%-parked stop condition fires almost immediately. So the recovery from a lost ledger is not
"it does the work twice", it is "the run halts and 3,999 correctly written records are filed as
conflicts needing manual disposition, with no record of which ones this run actually wrote".

### What closes it

Persist the ledger to disk (atomic write, temp file plus rename) at three points: after the
intended batch is recorded and **before** `query()` is called, immediately after each batch
outcome is recorded, and on each park. That means moving the write inside `run()` or giving
`onBatch` a persisting implementation rather than a logging one. A `process.on('SIGTERM'/'SIGINT')`
flush is a useful extra but is not sufficient on its own — `SIGKILL` cannot be trapped, which is
exactly the case the probe exercises.

---

## 3. W2 — the 9,000-byte gate is not in the execution path

`classify()` (line 116) returns `PARKED_OVERSIZE` for anything over `MAX_CATALOGUE_BYTES`, and
test 5 of 17 asserts it does. **`classify()` is never called.** I grepped the repository at
`cdad0d2`: the only occurrences of the identifier in this module's scope are its own definition
and the test's import. `run()` goes `buildInputs()` → `assertBatchSendable()` (line 357), and
`assertBatchSendable` checks only the 25-record batch limit and Shopify's 10 MB payload limit.
`MAX_CATALOGUE_BYTES` appears in the execution-side code exactly once more, at line 479, inside
the **plan-mode** reporter — which is the thing Tim specifically said is not sufficient.

There is no catalogue-validity check anywhere in the execution path either. `loadRecords()`
checks only that the value is a string that is not the literal `"undefined"`.

Probe `oversize-gate-not-enforced`:

```json
{ "oversizeBytes": 9500, "gateBytes": 9000,
  "oversizeRecordDispatched": true,
  "ledgerStateForOversizeRecord": "written",
  "expectedState": "parked-oversize" }
```

A 9,500-byte catalogue was dispatched and recorded as `written`. Nothing stopped it.

**What closes it:** call `classify()` per record inside `run()`, before `buildInputs()`, park the
`PARKED_OVERSIZE` ones without sending them, and add a structural validity check on the parsed
JSON (version, groups, options) in the same place. Count `PARKED_OVERSIZE` toward the stop
condition at line 250, which today counts only `PARKED_CONFLICT`.

---

## 4. W3 — rollback deletes a value that changed after this run wrote it

`rollback()` (line 406) takes `rollbackTargets(ledger)` — every gid in state `WRITTEN` — and
goes straight to `metafieldsDelete`. There is no read before the delete, and no comparison
against the `valueSha256` the ledger already stores for every record (line 214). Tim's sentence
was "verify that the current value still matches what this run wrote before deleting it.
Preserve subsequent changes."

Probe `rollback-destroys-later-change`: write a value, let someone else change it, roll back.

```json
{ "valueThisRunWrote": "{\"written\":\"by this run\"}",
  "valueAtDeleteTime": "{\"edited\":\"by someone else, after our write\"}",
  "deletedAnyway": true,
  "laterChangePreserved": false,
  "rollbackReport": { "attempted": 1, "deleted": 1, "verifiedNull": 1, "notNull": [] } }
```

The later edit was destroyed and the run reported a clean rollback. Note that the writer is
careful about exactly this hazard on the way *in* — `compareDigest: null` exists so it never
overwrites a value it did not expect — and then discards the same care on the way out.

**What closes it:** read each target first, compare the current value against the ledger's
`valueSha256`, delete only on an exact match, and report every mismatch as `preserved-changed`
rather than deleting it. `metafieldsDelete` has no `compareDigest` equivalent, so the read is
the only protection available and the window between read and delete should be acknowledged
in the runbook.

---

## 5. W4 — an incomplete read is reported as "verified null"

`readBeforeState()` (line 323) does `if (!node) continue;`, so an id Shopify does not return is
simply absent from the result map. `rollback()` then filters (line 418):

```js
const notNull = gids.filter((g) => after[g] !== null && after[g] !== undefined);
return { attempted: gids.length, deleted: deleted.length,
         verifiedNull: gids.length - notNull.length, notNull };
```

`undefined` — the never-returned case — is excluded from `notNull`, so it is counted in
`verifiedNull`. "We did not get an answer" and "we confirmed it is gone" are the same number.
And since `notNull` stays empty, `main()` exits 0 instead of the intended 5 (line 533).

Probe `incomplete-read-counted-as-verified-null`, where the delete silently does nothing and the
verification read returns no nodes:

```json
{ "readReturnedTheTarget": false, "storeStillHoldsValue": true,
  "reportedVerifiedNull": 1, "reportedNotNull": [], "reportedDeleted": 0,
  "exitCodeWouldBe": 0 }
```

The value is still in the store. The run reports a verified rollback and exits clean.

The same hole is upstream in `resolveUnknownBatch()` (line 182): `reread[gid] ?? null` collapses
"not returned" into "absent", so a batch that *did* land can be resolved to `FAILED` and re-sent,
which then parks every record in it as a conflict.

**What closes it:** `readBeforeState()` should return an explicit `UNRESOLVED` marker for ids the
response did not cover, and both callers should treat it as unresolved — `rollback()` reports it
and exits non-zero, `resolveUnknownBatch()` refuses to classify and stops the run. Tim's words:
"Any unresolved mutation outcome must be reconciled before more writes proceed."

---

## 6. W5–W7 — the three evidence items Tim named are absent

The rehearsal (`docs/data/write-rehearsal-2026-10-14.json`) is 8 scenarios, 8 passing:
`clean-run`, `target-not-empty`, `timeout-not-applied`, `timeout-but-applied`,
`drift-between-read-and-write`, `rollback-verified`, `stop-on-widespread-conflict`,
`idempotent-rerun`. The unit suite is 17 of 17.

None of them is:

- **W5** a hard process interruption and restart from disk. Every "resume" scenario resumes an
  in-memory ledger object inside one process, which is the case that already works. The case
  Tim asked about is a process that dies, and §2 shows it loses everything.
- **W6** an oversized candidate producing no write. Test 5 asserts `classify()` in isolation and
  never reaches `run()`.
- **W7** a post-write value change preserved during rollback. `rollback-verified` covers the
  happy path; §4 shows the unhappy one destroys data.

This is the specific shape of "passing test summary" Tim warned about: on all three, the
component is right, the unit test is right, and the wiring is missing, so the suite is green and
the behaviour is wrong. A test that calls an exported helper directly cannot catch a caller that
does not call it. **Each of the three fixes needs its test written through `run()` / `rollback()`
or the CLI, not through the helper.**

---

## 7. W8 — batch indices collide across resumed runs *(new)*

`planBatches(todo)` (line 348) re-indexes from 0 on every invocation, but `batchIndex` is
persisted in the ledger (line 214). The reconcile loop at line 338 selects records by
`batchIndex` alone, with no state filter:

```js
const batchRecords = records.filter((r) => ledger.records[r.productGid]?.batchIndex === b.batchIndex);
```

So run 1's batch 0 and run 2's batch 0 are indistinguishable. If run 2's batch 0 ends `UNKNOWN`,
run 3's reconciliation pulls in run 1's already-`WRITTEN` records and re-states them.

Probe `resume-batch-index-collision`:

```json
{ "stateBeforeReconcile": "written",
  "stateAfterReconcile": "parked-conflict",
  "alreadyWrittenRecordReDispatched": true,
  "ledgerDetail": "STALE_OBJECT: metafield already exists",
  "stops": [{ "reason": "1 of 2 present after an atomic mutation — stop and escalate" }] }
```

A correctly written record was re-dispatched, rejected by the writer's own conditional-write
protection, filed as a human-facing conflict, and the mixed read tripped the `IMPOSSIBLE` branch
— which is the writer's loudest stop, the one that means "the premise this whole plan rests on
is wrong". It isn't. The indexing is.

**What closes it:** make the batch id unique across runs — a run id plus an index, or a
monotonic counter carried in the ledger — and filter the reconcile set by non-terminal state as
well as by batch id.

---

## 8. W9, W10 — two gaps worth closing in the same pass *(new)*

**W9, throttling.** `liveTransport()` (line 265) treats any non-2xx as a hard error and has no
retry, no backoff and no handling of Shopify's `THROTTLED` response. 3,999 records is 160
mutations. Two throttles in a row read as "two consecutive batch failures" and stop the run for
a reason that is not a problem. Cost-aware backoff on `extensions.cost.throttleStatus`, and
treating a 429 as a retry rather than a failure, is the normal shape here.

**W10, unattributable errors.** `partitionOnStale()` (line 157) parks the whole batch as
`PARKED_CONFLICT` when any error carries no `elementIndex`. Parking the batch is right; the
state is not — `PARKED_CONFLICT` is terminal, so a transient server error permanently files 25
correct records as conflicts that resume will never retry. They need a distinct non-terminal
state, or `FAILED`.

---

## 9. What I would do, in order

1. **W1** — persist the ledger inside `run()`, before dispatch and after each outcome, atomically.
2. **W2** — call `classify()` and a validity check in `run()`; count `PARKED_OVERSIZE` in the stop
   condition.
3. **W3 + W4** — read-and-compare before deleting; make unresolved reads a distinct state in both
   `rollback()` and `resolveUnknownBatch()`.
4. **W8** — unique batch ids; filter reconcile by state.
5. **W5–W7** — three new scenarios, each driven through `run()` / `rollback()` or the CLI, not
   through a helper. The hard-kill one can reuse the probe script in this folder.
6. **W9, W10** — throttle handling; a non-terminal state for unattributable failures.

I will re-review on a new head. Nothing above needs a product decision reopened, and none of it
touches `extensions/`, so the frozen Rust candidate is unaffected.

**Catalogue population stays on HOLD on my side regardless of Tim's separate GO, until W1–W4 and
W8 are closed and W5–W7 are evidenced.** A writer that can lose its own recovery record partway
through 3,999 production writes is the one failure mode we cannot inspect our way out of
afterwards.
