# The v2 priority-label lookup

`feeds/supplemental_priority_labels_v2.csv` is the canonical label lookup for the
Phase 2 feed generator. It is byte-for-byte the file Tim uploaded to the Merchant
Center supplemental source on 2026-09-05 at 18:46 PDT and attached to his
2026-09-07 Phase 2 reply, re-sent gzipped on 2026-09-08 and again as plain CSV the
same evening.

## Why it is committed to the repo

Merchant Center will not hand a File (manual) source back. The source detail page
has update history, SFTP and Update, and no download. Its advanced options are set
to *not* retain items no longer provided in the source, so rebuilding it by hand
means any row you miss loses its `custom_label_3` and `custom_label_4` on upload,
which is the failure Tim's 2026-09-06 coordination warning describes: it takes the
Product Lines asset groups dark and breaks live campaign targeting, not just data
hygiene.

Tim's attachment was the only recoverable copy. Committing it makes the generator
reproducible and stops anyone reconstructing the lookup from GMC. **Do not** point
the generator at the older `supplemental_priority_labels_ONLY.csv`; that file has
no `custom_label_4` and the generator refuses it by design.

The generator reads this file as input data. It never derives it and never uploads
it. Tim re-issues it whenever rankings refresh — replace the file, re-run
`scripts/validate_label_lookup.py`, commit.

| | |
| --- | --- |
| MD5 | `94fd6add889592c48af027eb752f57c4` |
| Rows | 2,196 data rows plus header |
| Columns | `id`, `custom_label_3`, `custom_label_4` |

## What is in it, verified

Verified against live Shopify on 2026-09-09 (6,483 products / 9,938 variants read
via `bulkOperationRunQuery`) with `scripts/validate_label_lookup.py`.

Tier histogram matches the counts Tim published exactly:

| `custom_label_3` | rows |
| --- | --- |
| `p1_hero` | 64 |
| `p2_core` | 111 |
| `p3_catalog` | 123 |
| `p4_tail` | 1,898 |

`custom_label_4` carries 18 distinct series across 277 rows; 1,919 rows have no
series. All seven values Tim listed as new in v2 are present: SM200 Series, T900
Series, UBE100 Series, Telluride Series, Diablo Series, Stretch Cage Series, FFS
Silver Series. **No series label sits below the $1,000 floor** when checked against
live variant prices, so the file does already reflect the floor as Tim said. The
converse is not true and is not meant to be: 1,421 of the lookup's own rows sit at
or above $1,000 with no series, because series is a French Fitness product-line
label, not a price band.

All ten approved hero SKUs from the retitle thread are present and tiered
`p1_hero`: FFT-LPSCR, FFB-45DLLP, FFT-SLCLE, FFT-PLCLE, FFT-LPDLR, FFM-PLHSLP,
FFT-HAA, FFB-DAP, FFT-ACD, FF-FSR90.

## The ids are not all SKUs

Tim, 2026-09-08: *"the ten hero rows use SKUs, but the full lookup also contains
numeric and composite IDs. Preserve the exact source IDs and validate the label
mappings rather than assuming every row is SKU-keyed."* Confirmed:

| shape | rows | resolves as |
| --- | --- | --- |
| SKU-like, e.g. `FFT-SLCLE` | 2,103 | 2,103 live SKUs |
| all digits, e.g. `10269254254908` | 48 | 45 bare Shopify product ids, **3 SKUs** |
| `<productID>-<variantID>` | 45 | 45 live product/variant pairs |

The three all-digit ids that are SKUs, not product ids, are `931`, `933` and `935`
— the Precor 9.31 / 9.33 / 9.35 Premium Series treadmills. Anything that switches
on the shape of the id gets those wrong. So `labels_for()` in the generator
resolves in a stated order and reports what it used:

1. the variant SKU
2. the offer id about to be emitted (`<productID>-<variantID>` for a multi-variant
   product, the bare product id otherwise)
3. the bare product id, for a lookup row written before the product grew a second
   variant

SKU first, both for the three Precor rows and for the collision below.

## Three findings for Tim

None of these block the build. All three need his call before the lookup is
re-issued.

**1. Five variants are addressed twice, and three disagree on tier.** Product
`10247596147004` (French Fitness Rubber Coated Hex Dumbbells) has 45 live variants.
The lookup carries composite rows for all 45 *and* bare-SKU rows for five of them:

| SKU row | composite row | live price |
| --- | --- | --- |
| `FF-RCHD5-50` → `p1_hero` | `…-52534108225852` → `p4_tail` | $899.10 |
| `FF-RCHD5-75` → `p2_core` | `…-52534108258620` → `p4_tail` | $1,979.10 |
| `FF-RCHD5-100` → `p1_hero` | `…-52534108291388` → `p4_tail` | $3,329.10 |
| `FF-RCHD2-5-22-5` → `p4_tail` | `…-52534108160316` → `p4_tail` | $188.10 |
| `FF-RCHD2-5-25` → `p4_tail` | `…-52534108193084` → `p4_tail` | $431.10 |

SKU-first resolution keeps the hand-assigned tier on the three that disagree, which
is why the order is asserted in `scripts/check_label_resolution.py` rather than
left as a comment. If it ever flipped, one hero and one core offer plus a second
hero would drop to `p4_tail` and out of their asset groups with no error. This is
the same root cause Izza documented: the hex set SKUs sit on both a combined parent
and a legacy standalone product, which is why five of them are currently served
twice in the FF feed at two different prices. Cleanest fix is one lookup row per
variant on the next re-issue.

**2. Two lookup ids match nothing in Shopify, at any status.** Both `p4_tail`, no
series, and both look like transcription slips rather than deletions:

- `FFA-CFDI`. There is no Aspen CFDI. The live Commercial Flat/Decline/Incline
  benches are `FFP-CFDI` (Phoenix) and `FFT-CFDI` (Tahoe), both ACTIVE at $899.00,
  and the other three `FFA-` ids in the lookup (`FFA-DCC`, `FFA-PLPPS`,
  `FFA-SDCA`) are real Aspen products. `FFT-CFDI` is one of only four rows in the
  generated FF feed with no tier at all, which is consistent with the row having
  been meant for it. Tim needs to say which of the two it is.
- `FF-SBR-10`. The 10-set Sandbag Power Bag Rack exists, but as
  `ff-sbr-10-french-fitness-10-set-sandbag-power-bag-rack-249` — the handle
  pasted into the SKU field — on an UNLISTED product at $269.00. The clean
  `FF-SBR-12` is ACTIVE. Fixing the SKU in Shopify is the better repair here; the
  lookup row is already correct.

Until one or the other is resolved, neither row contributes a label to any
generated feed row.

**3. 31 lookup ids resolve to more than one live variant.** These are the duplicate
catalogue entries — the same SKU on two products. Three of the 31 sit at two
different prices, and in all three the cheaper duplicate is UNLISTED, so the
generator will not emit it:

| SKU | ACTIVE | UNLISTED duplicate |
| --- | --- | --- |
| `FF-RR-DPB-71` | $139.00 | $109.00 |
| `FF-RR-BPR-71` | $149.00 | $129.00 |
| `FF-RR-BR-71` | $129.00 | $119.00 |

Not a feed defect and not a blocker, but it is a catalogue call, and it belongs with
the 198-SKU duplication Izza raised on 2026-09-07.

## Coverage, measured on a real generated build

Full generator run against a live Shopify snapshot on 2026-09-09 (3,750 active
products), with the ruleset and all five deltas applied:

| | rows | carry a tier | no tier |
| --- | --- | --- | --- |
| `googleshoppingfrenchfitness` | 861 | 857 | 4 |
| `googleshoppingfs` | 1,783 | 1,241 | 542 |
| total | 2,644 | 2,098 | 546 |

Live today for comparison: 966 FF rows and 1,537 FS rows.

So the real gap is 546 rows, not the 1,153 upper bound a bare $100 floor suggests.
The four FF rows without a tier are `FF-X12` ($3,799.00), `FFT-CFDI` ($899.00),
`FFB-12SMJG` ($16,498.00) and `FFS-12SMJG` ($16,498.00) — two of them the most
expensive offers in the file, which is worth a look on its own. The 542 FS rows
are almost entirely other-brand New: Nautilus 106, Body-Solid 103, GoldenDesigns
101, SportsArt 66, Star Trac 57, and a tail.

A row with no tier falls outside every label-targeted asset group, so this is a
scope question for Tim rather than something the generator should invent. The
generator prints the count on every run and writes the detail to
`label_resolution.csv`.

## Running the checks

```sh
# structure and self-consistency, no credentials needed
python3 scripts/validate_label_lookup.py

# plus live resolution against Shopify
export SHOPIFY_SHOP=79ef8b-5e.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_...
python3 scripts/validate_label_lookup.py --shop "$SHOPIFY_SHOP" --token "$SHOPIFY_ADMIN_TOKEN"

# the generator's own resolution rules, as a gate
python3 scripts/check_label_resolution.py
python3 scripts/check_label_resolution.py build/feeds/googleshoppingfrenchfitness.csv
```

Both exit non-zero on failure. `validate_label_lookup.py` also accepts
`--shopify-jsonl` if you already have a bulk export, so it can run without
credentials in CI.

## Three generator defects this validation turned up

Validating the lookup meant running the generator end to end for the first time,
against a live snapshot. Three things came out of that, all fixed on this branch.

**The `googleshoppingfs` feed was empty.** `feed_for()` applied the SOP's
third-party exclusion by testing whether the `custom.3rd_party` metafield was
*present*. Every one of the 3,750 active products carries one — it is a metaobject
reference, unique per product — so the test excluded 2,171 products and the FS feed
came out at **2 rows against 1,537 live**. The actual SOP rule is
`exclude_pp_lt1000 == 1`, and that flag lives on the referenced metaobject. Reading
it properly finds **20** metaobjects with the flag set, out of 4,653. FS now
generates 1,783 rows.

**Shopify does hold the ground-shipping estimates.** The earlier note on
`load_ground_estimates()` said it does not, so the SOP's $1,000
estimated-ground-shipping exclusion was skipped entirely unless someone supplied an
external file. The figure is on the same `3rd_party` metaobject as
`estimated_shipping_ground`, populated on 4,566 of 4,653, and it is the same number
the live feed rows carry. The rule now applies by default; `--ground-shipping-estimates`
stays as an override for a freight re-quote. 87 metaobjects have no value and are
not excluded by the rule.

**There are three tax columns, not two.** Izza's 2026-09-07 pass on the live rows
was right: `tax`, the long `tax(country:location_group_name:...)` form, and
`tax_category`. Only the first two were being dropped. All three are dropped now,
and `scripts/check_feed_prices.py` fails a feed carrying any of them. Dropping them
hands tax back to the Merchant Center account settings, so **account-level tax has
to be confirmed configured before these feeds are repointed** — still an open item
with Tim.

The same run also shows the `3rd_party` metaobject carries `google_product_category`,
`price_tiers`, `top_seller` and `price_tier_v2` (the `T3_1000+` values), which are
four of the thirteen columns currently emitted blank. Mapping them is a separate
change and needs Tim's sign-off on each, so nothing here touches them.

