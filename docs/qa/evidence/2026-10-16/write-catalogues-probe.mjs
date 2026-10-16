// Adversarial probes against scripts/write-catalogues.mjs @ cdad0d2.
// Each probe drives the REAL exported execution/recovery functions through a
// fake transport. Nothing contacts Shopify.
import assert from 'node:assert/strict';
import {
  run, rollback, newLedger, recordBatch, STATE, MAX_CATALOGUE_BYTES,
} from './scripts/write-catalogues.mjs';

const gid = (n) => `gid://shopify/Product/${n}`;
const results = [];
const report = (name, claim, observed) => results.push({ name, claim, observed });

// ---------------------------------------------------------------------------
// Probe 1 — the 9,000-byte gate is NOT enforced in the execution path.
// ---------------------------------------------------------------------------
{
  const store = new Map();
  const sent = [];
  const query = async (doc, vars) => {
    if (doc.includes('metafieldsSet')) {
      sent.push(...vars.metafields);
      for (const m of vars.metafields) store.set(m.ownerId, m.value);
      return { metafieldsSet: { metafields: [], userErrors: [] } };
    }
    return { nodes: vars.ids.map((id) => ({ id, metafield: store.has(id) ? { value: store.get(id), compareDigest: 'd' } : null })) };
  };

  const oversize = 'x'.repeat(MAX_CATALOGUE_BYTES + 500);
  const records = [
    { productGid: gid(1), value: '{"ok":1}' },
    { productGid: gid(2), value: oversize },
  ];
  const ledger = newLedger({ candidateChecksum: 'c', approval: 'test', mode: 'execute', targetCount: 2 });
  await run({ query, records, ledger });

  report(
    'oversize-gate-not-enforced',
    'Tim 14 Oct: "enforce the catalogue validity and 9,000-byte gate in the execution path before any mutation". '
    + 'classify() returns PARKED_OVERSIZE and is unit-tested, but run() never calls it, so the oversize record is sent.',
    {
      oversizeBytes: Buffer.byteLength(oversize, 'utf8'),
      gateBytes: MAX_CATALOGUE_BYTES,
      oversizeRecordDispatched: sent.some((m) => m.value === oversize),
      ledgerStateForOversizeRecord: ledger.records[gid(2)].state,
      expectedState: STATE.PARKED_OVERSIZE,
    },
  );
}

// ---------------------------------------------------------------------------
// Probe 2 — rollback destroys a value changed AFTER this run wrote it.
// ---------------------------------------------------------------------------
{
  const store = new Map();
  const deleted = [];
  const query = async (doc, vars) => {
    if (doc.includes('metafieldsSet')) {
      for (const m of vars.metafields) store.set(m.ownerId, m.value);
      return { metafieldsSet: { metafields: [], userErrors: [] } };
    }
    if (doc.includes('metafieldsDelete')) {
      for (const m of vars.metafields) { deleted.push(m.ownerId); store.delete(m.ownerId); }
      return { metafieldsDelete: { deletedMetafields: vars.metafields, userErrors: [] } };
    }
    return { nodes: vars.ids.map((id) => ({ id, metafield: store.has(id) ? { value: store.get(id), compareDigest: 'd' } : null })) };
  };

  const records = [{ productGid: gid(10), value: '{"written":"by this run"}' }];
  const ledger = newLedger({ candidateChecksum: 'c', approval: 'test', mode: 'execute', targetCount: 1 });
  await run({ query, records, ledger });
  assert.equal(ledger.records[gid(10)].state, STATE.WRITTEN);

  // Someone (or something) edits the value after our write.
  store.set(gid(10), '{"edited":"by someone else, after our write"}');

  const r = await rollback({ query, ledger });
  report(
    'rollback-destroys-later-change',
    'Tim 14 Oct: "Rollback must verify that the current value still matches what this run wrote before deleting it. '
    + 'Preserve subsequent changes." rollback() deletes every WRITTEN gid with no pre-delete comparison.',
    {
      valueAtDeleteTime: '{"edited":"by someone else, after our write"}',
      valueThisRunWrote: '{"written":"by this run"}',
      deletedAnyway: deleted.includes(gid(10)),
      laterChangePreserved: store.has(gid(10)),
      rollbackReport: r,
    },
  );
}

// ---------------------------------------------------------------------------
// Probe 3 — an incomplete read is reported as "verified null".
// ---------------------------------------------------------------------------
{
  const store = new Map();
  const query = async (doc, vars) => {
    if (doc.includes('metafieldsSet')) {
      for (const m of vars.metafields) store.set(m.ownerId, m.value);
      return { metafieldsSet: { metafields: [], userErrors: [] } };
    }
    if (doc.includes('metafieldsDelete')) {
      // The delete silently does nothing (e.g. a partial/eventually-consistent apply).
      return { metafieldsDelete: { deletedMetafields: [], userErrors: [] } };
    }
    // The verification read DROPS the node — exactly what Shopify returns for an
    // id it cannot resolve at that moment.
    return { nodes: vars.ids.map(() => null) };
  };

  const records = [{ productGid: gid(20), value: '{"a":1}' }];
  const ledger = newLedger({ candidateChecksum: 'c', approval: 'test', mode: 'execute', targetCount: 1 });
  await run({ query, records, ledger });
  const r = await rollback({ query, ledger });

  report(
    'incomplete-read-counted-as-verified-null',
    'Tim 14 Oct: "treat missing or incomplete read results as unresolved, not verified null". '
    + 'readBeforeState() skips unreturned nodes, leaving them undefined; rollback() filters on '
    + '`!== null && !== undefined`, so an id the read never returned lands in verifiedNull.',
    {
      readReturnedTheTarget: false,
      storeStillHoldsValue: store.has(gid(20)),
      reportedVerifiedNull: r.verifiedNull,
      reportedNotNull: r.notNull,
      reportedDeleted: r.deleted,
      exitCodeWouldBe: r.notNull.length ? 5 : 0,
    },
  );
}

// ---------------------------------------------------------------------------
// Probe 4 — batch indices collide across resumed runs, so reconciliation
// re-states records that were already terminal in an earlier run.
// ---------------------------------------------------------------------------
{
  const ledger = newLedger({ candidateChecksum: 'c', approval: 'test', mode: 'execute', targetCount: 2 });
  const runOneRecord = { productGid: gid(30), value: '{"run":1}' };
  const runTwoRecord = { productGid: gid(31), value: '{"run":2}' };
  // Run 1 wrote its batch 0 successfully.
  recordBatch(ledger, 0, STATE.WRITTEN, [runOneRecord]);
  // Run 2 re-indexes from 0 and its batch 0 timed out.
  recordBatch(ledger, 0, STATE.UNKNOWN, [runTwoRecord]);

  // The store reflects reality: run 1's write LANDED. Run 2's batch never did.
  const store = new Map([[gid(30), '{"run":1}']]);
  const dispatched = [];
  const query = async (doc, vars) => {
    if (doc.includes('metafieldsSet')) {
      dispatched.push(...vars.metafields.map((m) => m.ownerId));
      // compareDigest: null means "create only". Shopify rejects an existing target.
      const errs = vars.metafields
        .map((m, i) => (store.has(m.ownerId)
          ? { elementIndex: i, code: 'STALE_OBJECT', message: 'metafield already exists' }
          : null))
        .filter(Boolean);
      if (errs.length) return { metafieldsSet: { metafields: [], userErrors: errs } };
      for (const m of vars.metafields) store.set(m.ownerId, m.value);
      return { metafieldsSet: { metafields: [], userErrors: [] } };
    }
    return { nodes: vars.ids.map((id) => ({ id, metafield: store.has(id) ? { value: store.get(id), compareDigest: 'd' } : null })) };
  };

  const before = ledger.records[gid(30)].state;
  await run({ query, records: [runOneRecord, runTwoRecord], ledger });
  report(
    'resume-batch-index-collision',
    'planBatches() re-indexes from 0 on every invocation, but batchIndex is stored in the ledger. '
    + 'The reconcile loop selects records by batchIndex alone, with no state filter, so an already-WRITTEN '
    + 'record from an earlier run is pulled into another run\'s unknown-batch reconciliation, re-stated, '
    + 're-dispatched, rejected by its own conditional-write protection, and filed as a human-facing conflict.',
    {
      stateBeforeReconcile: before,
      stateAfterReconcile: ledger.records[gid(30)].state,
      alreadyWrittenRecordReDispatched: dispatched.includes(gid(30)),
      ledgerDetail: ledger.records[gid(30)].detail ?? null,
      stops: ledger.stops,
    },
  );
}

console.log(JSON.stringify({
  probedFile: 'scripts/write-catalogues.mjs @ cdad0d2',
  nothingWritten: 'No Shopify store was contacted. The transport is in-memory.',
  ranAt: new Date().toISOString(),
  probes: results,
}, null, 2));
