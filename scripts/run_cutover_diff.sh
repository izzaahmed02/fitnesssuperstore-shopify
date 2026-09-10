#!/usr/bin/env bash
# One command to produce the cutover packet Tim is gating the repoint on.
#
#   ./scripts/run_cutover_diff.sh "googleshoppingfrenchfitness (3).tsv" "googleshoppingfs (2).tsv"
#
# Needs SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN in the environment. Read-only against
# Shopify; uploads nothing; touches no Merchant Center source.
#
# Produces, in build/feeds/:
#   id_diff_ff.csv        every add/drop/rekey on the French Fitness feed, with a reason code
#   id_diff_fs.csv        the same for the FS feed
#   no_tier_by_price.csv  the no-tier list, price descending, custom_label_3 blank for Tim
#
# Those three are what gets attached to the thread. Nothing is repointed by this.
#
# The whole point of wrapping this is --excluded. Running feed_id_diff.py without it
# still "works" and reports every single drop as unexplained, which reads like a
# catastrophe and is really just a missing argument.
set -euo pipefail

OLD_FF="${1:-}"
OLD_FS="${2:-}"
OUT="${OUT_DIR:-build/feeds}"

if [[ -z "$OLD_FF" || -z "$OLD_FS" ]]; then
  echo "usage: $0 <live googleshoppingfrenchfitness export> <live googleshoppingfs export>" >&2
  echo "       the two .tsv attachments from Tim's 2026-09-09 email" >&2
  exit 2
fi
for f in "$OLD_FF" "$OLD_FS"; do
  [[ -f "$f" ]] || { echo "not found: $f" >&2; exit 2; }
done
if [[ -z "${SHOPIFY_SHOP:-}" || -z "${SHOPIFY_ADMIN_TOKEN:-}" ]]; then
  echo "set SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN first" >&2
  exit 2
fi

echo "== 1/5  validating the v2 label lookup =="
python3 scripts/validate_label_lookup.py --shop "$SHOPIFY_SHOP" --token "$SHOPIFY_ADMIN_TOKEN"

echo
echo "== 2/5  generating both primaries from live Shopify =="
# sale_price from automatic discounts stays OFF per Tim's 2026-09-07 ruling.
python3 scripts/phase2_feed_generator.py --out-dir "$OUT"

echo
echo "== 3/5  price and tax gate =="
python3 scripts/check_feed_prices.py "$OUT/googleshoppingfrenchfitness.csv"
python3 scripts/check_feed_prices.py "$OUT/googleshoppingfs.csv"

echo
echo "== 4/5  reason-coded id diffs =="
# Each diff exits non-zero while any row is still unexplained. That is the gate
# doing its job, not a failure, so don't let set -e kill the run before the
# no-tier report is written.
ff_rc=0; fs_rc=0
python3 scripts/feed_id_diff.py \
  --old "$OLD_FF" --new "$OUT/googleshoppingfrenchfitness.csv" \
  --excluded "$OUT/excluded_rows.csv" --out "$OUT/id_diff_ff.csv" || ff_rc=$?
echo
python3 scripts/feed_id_diff.py \
  --old "$OLD_FS" --new "$OUT/googleshoppingfs.csv" \
  --excluded "$OUT/excluded_rows.csv" --out "$OUT/id_diff_fs.csv" || fs_rc=$?

echo
echo "== 5/5  no-tier list, price descending =="
python3 scripts/no_tier_report.py \
  "$OUT/googleshoppingfrenchfitness.csv" "$OUT/googleshoppingfs.csv" \
  --out "$OUT/no_tier_by_price.csv"

echo
echo "=================================================================="
echo "Attach to the thread:"
echo "  $OUT/id_diff_ff.csv"
echo "  $OUT/id_diff_fs.csv"
echo "  $OUT/no_tier_by_price.csv"
if (( ff_rc != 0 || fs_rc != 0 )); then
  echo
  echo "UNEXPLAINED ROWS PRESENT. Say so in the reply and do not repoint."
  echo "Count them with:"
  echo "  grep -c unexplained $OUT/id_diff_ff.csv $OUT/id_diff_fs.csv"
  exit 1
fi
echo
echo "Every add and every drop carries a reason code. Clean to send."
