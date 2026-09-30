#!/usr/bin/env bash
# probe_zips.sh <zipfile> <variant_id> <qty> <out.tsv> [province]
# Reads live checkout rates per ZIP with retry/backoff on throttling. Read-only.
set -u
B=https://www.fitnesssuperstore.com; UA="Mozilla/5.0 (rate-check)"
prov=$(jq -rn --arg v "${5:-California}" '$v|@uri')
jar=$(mktemp)
curl -sS -A "$UA" -c $jar -b $jar -X POST "$B/cart/add.js" -H 'Content-Type: application/json' \
     -d "{\"items\":[{\"id\":$2,\"quantity\":$3}]}" -o /dev/null
printf "zip\tfree_local\trates\n" > "$4"
while read -r z; do
  [[ "$z" =~ ^[0-9]{5}$ ]] || continue
  for try in 1 2 3 4 5 6; do
    body=$(curl -sS -A "$UA" -c $jar -b $jar -w '\n%{http_code}' \
      "$B/cart/shipping_rates.json?shipping_address%5Bzip%5D=$z&shipping_address%5Bcountry%5D=United%20States&shipping_address%5Bprovince%5D=$prov")
    code=${body##*$'\n'}; json=${body%$'\n'*}
    if [ "$code" = 200 ] && echo "$json" | jq -e '.shipping_rates' >/dev/null 2>&1; then break; fi
    sleep $((try*3))
  done
  r=$(echo "$json" | jq -r '[.shipping_rates[]? | "\(.name)=\(.price)[\(.code)]"] | join("; ")' 2>/dev/null || echo "ERR code=$code")
  f=$(echo "$r" | grep -q 'free_ship.543071' && echo Y || echo N)
  printf "%s\t%s\t%s\n" "$z" "$f" "$r" >> "$4"
  sleep 2.5
done < "$1"
rm -f $jar
