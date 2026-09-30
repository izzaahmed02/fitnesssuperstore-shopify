#!/usr/bin/env bash
# Live checkout shipping-rate matrix for www.fitnesssuperstore.com (read-only).
# Builds anonymous carts via /cart/add.js and reads /cart/shipping_rates.json
# for each destination. No order, draft order, or admin write is created.
# Usage: ratecheck.sh [label]   -> writes results/<UTC timestamp>-<label>.tsv
set -u
B=https://www.fitnesssuperstore.com
UA="Mozilla/5.0 (rate-check)"
DIR=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$DIR/results"
TS=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$DIR/results/$TS-${1:-run}.tsv"

# cart_id|label|items-json   (variant ids from Shopify Admin, read 2026-09-29/30)
CARTS=(
  "C01|1 lb FFC-TPB12 \$27|[{\"id\":50748123251004,\"quantity\":1}]"
  "C20|20 lb FF-HDR \$489|[{\"id\":50748120072508,\"quantity\":1}]"
  "C30|30 lb FF-HPB100x2 \$538|[{\"id\":50748131574076,\"quantity\":2}]"
  "C31|31 lb SGH500 \$755|[{\"id\":50748131639612,\"quantity\":1}]"
  "C36|36 lb HVD-1-15+HE450+TPB12 \$815|[{\"id\":50748147007804,\"quantity\":1},{\"id\":50748124463420,\"quantity\":1},{\"id\":50748123251004,\"quantity\":1}]"
  "C40|40 lb FF-HDRx2 \$978|[{\"id\":50748120072508,\"quantity\":2}]"
  "C100|100 lb FFB-HBCC-VKR \$1399|[{\"id\":50749695328572,\"quantity\":1}]"
  "C150|150 lb Cybex 350A \$4099|[{\"id\":50748110635324,\"quantity\":1}]"
  "C175|175 lb Cybex 610A \$4099|[{\"id\":50737680286012,\"quantity\":1}]"
  "C350|350 lb FFB-4SMJG \$5699|[{\"id\":50737851793724,\"quantity\":1}]"
  "F150|150 lb NAU-9NAS330660AGS FreeShip \$5599|[{\"id\":50748145828156,\"quantity\":1}]"
  "F31|31 lb SGH500B FreeShip \$755|[{\"id\":50748148744508,\"quantity\":1}]"
)

# zip|province|country|region label
DESTS=(
  "94510|California|United States|CA Zone1A Benicia"
  "95814|California|United States|CA Zone1A Sacramento"
  "90012|California|United States|CA >100mi Los Angeles"
  "92101|California|United States|CA >100mi San Diego"
  "97201|Oregon|United States|OR Portland"
  "98101|Washington|United States|WA Seattle"
  "89101|Nevada|United States|NV Las Vegas"
  "85004|Arizona|United States|AZ Phoenix"
  "75201|Texas|United States|TX Dallas"
  "60601|Illinois|United States|IL Chicago"
  "10001|New York|United States|NY New York"
  "02108|Massachusetts|United States|MA Boston"
  "20001|District of Columbia|United States|DC Washington"
  "33101|Florida|United States|FL Miami"
  "99501|Alaska|United States|AK Anchorage"
  "96813|Hawaii|United States|HI Honolulu"
  "00901|Puerto Rico|United States|PR San Juan"
)

printf "cart\tcart_label\tcart_total\tcart_lb\tzip\tregion\trates(name=price[code])\n" > "$OUT"
for c in "${CARTS[@]}"; do
  IFS='|' read -r cid clabel items <<<"$c"
  jar=$(mktemp)
  curl -sS -A "$UA" -c "$jar" -b "$jar" -X POST "$B/cart/add.js" -H 'Content-Type: application/json' \
       -d "{\"items\":$items}" -o /dev/null
  meta=$(curl -sS -A "$UA" -b "$jar" "$B/cart.js" | jq -r '"\(.total_price/100)\t\(.total_weight/453.592|.*10|round/10)"')
  for d in "${DESTS[@]}"; do
    IFS='|' read -r zip prov ctry rlabel <<<"$d"
    q="shipping_address%5Bzip%5D=$zip&shipping_address%5Bcountry%5D=$(jq -rn --arg v "$ctry" '$v|@uri')&shipping_address%5Bprovince%5D=$(jq -rn --arg v "$prov" '$v|@uri')"
    rates=$(curl -sS -A "$UA" -c "$jar" -b "$jar" "$B/cart/shipping_rates.json?$q" \
            | jq -r '[.shipping_rates[]? | "\(.name)=\(.price)[\(.code)]"] | join("; ") // "ERROR"' 2>/dev/null)
    printf "%s\t%s\t%s\t%s\t%s\n" "$cid" "$clabel" "$meta" "$zip" "$rlabel	${rates:-NONE}" >> "$OUT"
    sleep 0.4
  done
  rm -f "$jar"
done
echo "$OUT"
