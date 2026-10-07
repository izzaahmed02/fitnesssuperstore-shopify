# Intuitive Shipping v1: Testing-copy build sheet (Oct 7, 2026)

All edits go in the Intuitive Shipping **Testing copy** only. Do not publish to live until Tim gives a written GO.
Rollback for the Testing copy: discard it, since live stays untouched. Rollback for a live publish: restore `is-capture-2026-10-03.zip`.
Live "current" values below were read back on Oct 7 with `draftOrderCalculate` (`live_rates_2026-10-07.csv`).

| # | Change (Testing copy) | Current live | Target (Cart Tester) |
|---|---|---|---|
| 1 | Zone 2: limit scenario 140791 to FF-WBB-9 only. Move the 591771 lower-price formula into the general West Coast parcel rule (543060). | FF-HDR → 98101: two rates, $72.89 + $131.20 | FF-HDR → 98101: **one rate, $72.89**. Also test a WBB-9-only cart, an ordinary-only cart and a mixed cart, one rate each. |
| 2 | Freight credit: $50 off applies at 36–149.99 lb only. 35 lb is freight with no credit. | Dallas 35 / 36 / 150 lb = $399 / $399 / $399 (no credit anywhere) | Dallas 35 = **$399**, 36 = **$349**, 149.99 = **$349**, 150 = **$399**. Seattle 35 = **$299**. |
| 3 | California 1B: $149 for 36–149.99 lb. From 150 lb, $1/lb rounded up. No change, documentation only. | LA 150 / 194.67 / 265.4 lb = $150 / $195 / $266 | Same. Google uses $195 / $266 (not $194.67 / $265.40). |
| 4 | Zone 6A: Free Shipping-tagged items pay. Apply the 6A ×1.30 surcharge. | jacobsladder2 → 02554 = $0. Nantucket = Boston (no surcharge). | jacobsladder2 → 02554 = **$468.70** ($399 × 1.30 − $50). |
| 5 | AK/HI boundary: table 543056 (HI equivalent) up to < 226 lb, table 543057 from 226 lb. | AK 226 lb returns two rates: $999 and $1,089 | 225 / 225.01 / 225.99 = **$999**. 226 / 226.01 = **$1,089**, one rate each. |
| 6 | AK/HI ladder: 20–74 lb = $549, 75–124 lb = $699, 125–149 lb = $849, 150 to < 226 lb = $999. Parcel 1–19 lb = $29 + $25/lb. | 19 lb = $504 (correct). 25 lb = $654. 75 lb = $549. | 19 lb = **$504**. 20 / 25 lb = **$549**. 75 lb = **$699**. 125 lb = **$849**. 150 lb = **$999**. |
| 7 | DC 20001 parcel: add DC to the Zone 3 parcel rule (×1.10). | All parcel offers return NO RATE. 75 lb = $299. | FF-WBB-36 (8 lb) → 20001 returns a rate (Zone 3 parcel × 1.10). |
| 8 | 1A under $1,000 should equal 1B. | Benicia 75 lb = $199 (LA = $149) | Benicia 75 lb, cart under $1,000 = **$149**. Cart $1,000+ = **$0**. |
| 9 | U-120 / U-130 / U-142 extra $549 rate | Present in Dallas, Seattle, LA, Boston/Nantucket and Benicia | **No change.** Tim decides. |

For every row, record the original rule/table ID, the Testing-copy ID, and a Cart Tester screenshot.
