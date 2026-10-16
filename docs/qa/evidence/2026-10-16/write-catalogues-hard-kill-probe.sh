#!/bin/bash
# Hard-interruption probe against the REAL CLI entry point of
# scripts/write-catalogues.mjs @ cdad0d2, in --rehearse mode (no network).
cd "$(dirname "$0")" || exit 1
set -u

LED=run1/ledger-kill.json
rm -f "$LED" run1/kill.txt run1/restart.txt

# Full-run baseline, to pick a kill point that is genuinely mid-run.
rm -f run1/baseline-ledger.json
START=$(date +%s.%N)
node scripts/write-catalogues.mjs run1/candidate.json --rehearse run1/fixture.json \
  --ledger run1/baseline-ledger.json --approval "PROBE" > run1/baseline.txt 2>&1
END=$(date +%s.%N)
FULL=$(python3 -c "print(f'{$END-$START:.3f}')")
echo "full uninterrupted run: ${FULL}s, ledger $( [ -f run1/baseline-ledger.json ] && echo written || echo missing )"

HALF=$(python3 -c "print(f'{($END-$START)*0.6:.3f}')")
echo "killing at ${HALF}s (60% through)"

timeout -s KILL "$HALF" node scripts/write-catalogues.mjs run1/candidate.json \
  --rehearse run1/fixture.json --ledger "$LED" --approval "PROBE" > run1/kill.txt 2>&1
echo "exit code: $?   (137 = SIGKILL)"

W=$(grep -c '"state":"written"' run1/kill.txt)
R=$(grep -o '"count":[0-9]*' run1/kill.txt | cut -d: -f2 | paste -sd+ | bc)
echo "the killed run reported ${W} batches / ${R} records WRITTEN on stdout"
if [ -f "$LED" ]; then echo "ledger on disk: PRESENT"; else echo "ledger on disk: ABSENT — the entire recovery record was lost"; fi

echo "--- restart from disk against the same --ledger path ---"
node scripts/write-catalogues.mjs run1/candidate.json --rehearse run1/fixture.json \
  --ledger "$LED" --approval "PROBE" > run1/restart.txt 2>&1
W2=$(grep -c '"state":"written"' run1/restart.txt)
R2=$(grep -o '"count":[0-9]*' run1/restart.txt | cut -d: -f2 | paste -sd+ | bc)
echo "restart re-dispatched ${W2} batches / ${R2} records"
echo "resume skipped: $(python3 -c "print(${R:-0})") records that the first run had already written"
