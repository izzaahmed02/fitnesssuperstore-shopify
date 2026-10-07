# v1 build steps, mapped to Tim's Oct 6 instructions (REBRIEF thread)

Source: Tim's emails of Oct 6, 3:50 AM UTC ("Please address these items…") and 3:30 PM UTC (items 1–7). The Oct 2 AK/HI ladder is his.
Hard limits (Tim): Testing and preparation only. No production publication, zone activation, ZIP-list cutover or feed release until the packet passes review and Tim gives a separate written production GO. No changes to Shopify routing weights. Update the existing worksheet (1FXEO2Fw…); don't start a new tracker.

## A. Intuitive Shipping Testing copy (clicks)
For every change, record: original rule/table ID → Testing-copy ID, current → target → rollback value, and a Cart Tester screenshot with the exact weight entered.

| Step | Tim item | Do | Cart Tester proof (single item, precise weight) |
|---|---|---|---|
| A1 | 1 | Scenario 140791: change its product condition to FF-WBB-9 only. Put the 591771 lower formula into the general West Coast parcel rule (replacing the 543060 pricing). This preserves the current lower price and is not an increase. | FF-HDR 20 lb → 98101 = one rate, **$72.89**. Also run a WBB-9-only cart (same price it gets today), an ordinary-only cart and a WBB-9 + FF-HDR mixed cart: one rate each, never $131.20. |
| A2 | 2 | Complete the California, Zone 2 and Zone 3 parcel formulas up to 34.99 lb. Freight starts at 35 lb with no credit. The $50 credit applies from 36 lb. | FF-CMFGM and FF-BP-20SR at 35 lb: Seattle **$299**, Dallas **$399**. Dallas at 35.99 lb = $399, at 36 lb = **$349**. Live 36 lb is $399, so the credit is not applied yet. |
| A3 | 2 | Document the Zone 3 paid pre-credit baseline at 74 lb for the Jacobs Ladders. | Untagged 74 lb → Dallas = **$399** baseline (do not use their $0). |
| A4 | 3 | No pricing change. Open method 548830 and write down the saved increment, the weight conversion and the rounding order. | FF-X20 / FF-RB300 / SM-8FC-LED-60 → 90001 = **$150 / $195 / $266**. |
| A5 | 4 | Zone 6A: Free Shipping-tagged items pay. For 36 to <150 lb: Zone 3 pre-credit × 1.30, then −$50 once. | jacobsladder2 (74 lb, tagged) → 02554 = **$468.70**. |
| A6 | 6 + Oct 2 ladder | AK/HI (AK and HI tables): 1–19 lb parcel $29 + $25 per 1.001 lb; 20–74.99 lb $549; 75–124.99 lb $699; 125–149.99 lb $849; 150 to <226 lb $999; ≥226 lb existing ladder. Conditions must not overlap and must leave no gap. | 19 lb **$504**; 20 / 25 lb **$549** (live $654); 75 lb **$699** (live $549); 125 lb **$849**; 225 / 225.01 / 225.99 lb **$999**; 226 / 226.01 lb **$1,089**, one rate each. |
| A7 | in-scope "missing-ZIP" | DC 20001 parcel: add it to the correct zone's parcel rule. | Every DC parcel offer gets a rate (live: none). Value per the worksheet zone formula. |
| A8 | Kevin + Tim 10/6 | 1A under $1,000 uses the 1B rate. | Benicia 75 lb, cart under $1,000 = **$149** (live $199). Cart ≥ $1,000 = **$0**. |
| A9 | 5 | U-120/130/142 extra $549 rate (543384/543386/541827/543385/548858): **do not touch.** List it as a decision for Tim. | none |

## B. Outside Intuitive Shipping (no clicks in IS)
- B1 (Tim 10/6 #1): attach the actual is-capture-2026-10-03.zip, or give its shared Drive location. Credentials and session data must be excluded.
- B2 (item 5): for the 13 special offers, give the variant ID, routing weight, class or exception, method ID and price per zone. Data is in live_rates_2026-10-07.csv. Paste it into the worksheet.
- B3 (item 7): WMR20/WMR10 readback is 75 lb; Dallas $399 (543043), LA $149 (548830). The feed rows stay held until Tim's GO.
- B4 (10/6 #4): decision list. California uprights: resolved by Tim's Sep 23 ruling. The three Mexico-to-US scenarios: mark each as resolved, superseded or still open, with a recommendation. Still open: U-120/130/142 $549.
- B5: put all current → target → rollback values and original/copy IDs in the worksheet.
- B6: checks that need the live window: final single-item rechecks of A1, A4, A5, A6 and A8 on live checkout after publication, plus the Google feed spot checks.
- B7: ask Izza for one PASS/HOLD on the exact final candidate.
