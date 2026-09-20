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

echo "== 0/8  promotion scope check =="
# Three-way: repo map vs live Shopify checkout discount vs (optionally) the GMC
# supplemental. A row badged in the feed that does not discount at checkout is a
# Google disapproval, so this runs before anything is generated.
promo_rc=0
python3 scripts/check_promotion_scope.py || promo_rc=$?

echo
echo "== 1/8  validating the v2 label lookup =="
python3 scripts/validate_label_lookup.py --shop "$SHOPIFY_SHOP" --token "$SHOPIFY_ADMIN_TOKEN"

echo
echo "== 2/8  generating both primaries from live Shopify =="
# sale_price from automatic discounts stays OFF per Tim's 2026-09-07 ruling.
python3 scripts/phase2_feed_generator.py --out-dir "$OUT"

echo
echo "== 3/8  price and tax gate =="
python3 scripts/check_feed_prices.py "$OUT/googleshoppingfrenchfitness.csv"
python3 scripts/check_feed_prices.py "$OUT/googleshoppingfs.csv"

echo
echo "== 4/8  under-\$100 campaign scope gate =="
# Tim 2026-09-19: the p_under_100 exception is the only hole in the $100 floor.
# This fails if the label escaped its roster, drifted out of $25.00-$99.99, landed
# on the FS feed, or emitted without a shipping rate.
u100_rc=0
python3 scripts/check_under_100_scope.py \
  "$OUT/googleshoppingfrenchfitness.csv" "$OUT/googleshoppingfs.csv" || u100_rc=$?

echo
echo "== 5/8  reason-coded id diffs =="
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
echo "== 6/8  matched-vs-designed count guard =="
# Tim 2026-09-20. The generator already refuses to build off a truncated catalogue
# read and refuses to write a short file. This compares what it designed against
# the committed expectations, and against Merchant Center's matched count when
# MATCHED_FF / MATCHED_FS are set from the source pages after a fetch. It runs
# after the diffs because the GO'd catalog additions are counted off them.
counts_rc=0
# Plain ifs, not `[[ ... ]] && ...`: under set -e a false test as the last command
# of the line takes the whole run down.
matched_args=()
if [[ -n "${MATCHED_FF:-}" ]]; then
  matched_args+=(--matched "googleshoppingfrenchfitness=$MATCHED_FF")
fi
if [[ -n "${MATCHED_FS:-}" ]]; then
  matched_args+=(--matched "googleshoppingfs=$MATCHED_FS")
fi
python3 scripts/check_expected_counts.py --manifest "$OUT/run_manifest.json" \
  --id-diff "googleshoppingfrenchfitness=$OUT/id_diff_ff.csv" \
  --id-diff "googleshoppingfs=$OUT/id_diff_fs.csv" \
  "${matched_args[@]+"${matched_args[@]}"}" || counts_rc=$?

echo
echo "== 7/8  no-tier list, price descending =="
python3 scripts/no_tier_report.py \
  "$OUT/googleshoppingfrenchfitness.csv" "$OUT/googleshoppingfs.csv" \
  --out "$OUT/no_tier_by_price.csv"

echo
echo "=================================================================="
echo "Attach to the thread:"
echo "  $OUT/id_diff_ff.csv"
echo "  $OUT/id_diff_fs.csv"
echo "  $OUT/no_tier_by_price.csv"
echo "  $OUT/run_manifest.json   (designed counts, for the matched-vs-designed check)"
if (( promo_rc != 0 )); then
  echo
  echo "PROMOTION SCOPE FAILED. A mapped SKU does not discount at checkout."
  echo "Fix the roster before these feeds serve; that combination is a Google disapproval."
fi
if (( u100_rc != 0 )); then
  echo
  echo "UNDER-\$100 SCOPE FAILED. The p_under_100 exception is outside Tim's ruling."
  echo "Fix the roster or the shipping handback before these feeds serve."
fi
if (( counts_rc != 0 )); then
  echo
  echo "COUNT GUARD FAILED. An output is short, or matched does not equal designed."
  echo "Do not publish. Find the missing rows first."
fi
if (( ff_rc != 0 || fs_rc != 0 )); then
  echo
  echo "UNEXPLAINED ROWS PRESENT. Say so in the reply and do not repoint."
  echo "Count them with:"
  echo "  grep -c unexplained $OUT/id_diff_ff.csv $OUT/id_diff_fs.csv"
  exit 1
fi
if (( promo_rc != 0 || u100_rc != 0 || counts_rc != 0 )); then exit 1; fi
echo
echo "Every add and every drop carries a reason code. Clean to send."
