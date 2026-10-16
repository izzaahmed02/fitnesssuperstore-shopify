# Catalogue difference reconciliation — 61,272 vs 61,431

**Disposition: the catalogue-difference gate is RESOLVED. The release stays HOLD.**
Date: 2026-10-07 · Reviewer: Yusra · Scope: Tim's 5 October ruling, "Qash and Yusra:
reconcile the catalogue difference first ... publish the complete option-level
catalogue, generator commit, source references, and checksum."

Read-only throughout. Four bulk exports, no production write, no metafield write, no
merge, no publish, no activation, no order touched. The frozen Rust candidate is
unchanged.

---

## 1. Answer

**The 159-entry difference is not drift. It is a definitional difference between two
counts of the same data, and both numbers were correct for what they measured.**

| | counts | at |
|---|---:|---|
| Qash, 4 Oct | 61,272 | 4 Oct 21:43 UTC |
| Yusra, 5 Oct | 61,431 | 5 Oct ~14:00 UTC |
| difference | **159** | across **49 products** |

Measured against live production today:

| measure of the same live snapshot | entries |
|---|---:|
| **Raw** — every group → option → variant reference counted | **61,457** |
| **Deduped** — by `variantId` within a product, first occurrence wins | **61,298** |
| **difference** | **159** |
| **products containing at least one duplicate reference** | **49** |

159 and 49, exactly. Those are not two measurements of a moving target; they are the
raw and the deduplicated count of one unchanging structure, and the gap between them is
a fixed property of the source data.

### The decisive case

Yusra's report singled out Monster Universal Storage System as going "from 29 entries to
85". Today, live:

```
french-fitness-monster-universal-storage-system-new   raw = 85   deduped = 29
```

Both figures are present in the same snapshot. Nothing about this product changed:

| record | last updated |
|---|---|
| product `10269254254908` | 2026-09-21 21:35 UTC |
| metafield `options.product_options` | 2026-04-16 20:23 UTC |
| all six `product_options` group metaobjects | latest 2026-06-17 15:55 UTC |

29 did not become 85. One count always said 29 and the other always said 85.

### Qash's "zero drift" is corroborated independently

Pulling `updatedAt` on all 24,581 `product_option` records: **zero** records referenced
by an active product were edited between 4 Oct 21:43 and 5 Oct 14:02. The
most-recent-edit histogram has no entries at all on 4 or 5 October. The source was
genuinely still in that window.

### Which number should the release use

**61,298 (deduped).** `parse_catalogue` in
`extensions/product-bundle/src/cart_transform_run.rs` builds a `HashMap` keyed by
variant id with "first occurrence of a variant id wins, matching the JS scan". A
duplicate reference cannot produce a second catalogue entry at runtime, so the raw
figure overstates what the function will hold. The raw figure remains the right one for
reconciling against the source, which is why both belong in the published artifact.

---

## 2. Published artifact (Tim's item: publish the option-level output)

`docs/data/catalogue-2026-10-07/`

| file | contents |
|---|---|
| `catalogue-rows-raw.tsv.gz` | 61,457 rows — every reference |
| `catalogue-rows-deduped.tsv.gz` | 61,298 rows — what the function will hold |
| `catalogue-per-product.tsv` | 3,737 rows, both counts per product |
| `duplicate-variant-products.tsv` | the 49 products and their duplicate counts |
| `exempt-products.tsv` | the 19 exempt products, named |
| `manifest.json` | cohort, source snapshot hashes, bulk operation ids, checksums |

Row schema: `product_id, group_metaobject_id, option_metaobject_id, option_variant_id`.

**Checksums** — sha256 over the canonically sorted, tab-separated body, no header, LF
line endings:

```
raw      f63b115980ffe11f7ba82ace86ee924b4181219b4cc112ed6fce8b7cbc173164
deduped  930786f384105ca32b41c845a197860b42fec6384367e65e7abb61bff92a3d1e
```

These bind the option-level output itself, not a product summary. The next read is a
byte comparison.

**Generator:** `scripts/catalogue/build-catalogue-rows.py`, committed in this change,
is the exact script that produced the committed files.

**Source references** — four read-only bulk operations against production,
2026-10-07 16:16:10Z to 16:22:09Z:

```
gid://shopify/BulkOperation/8637984047420   products + options.product_options
gid://shopify/BulkOperation/8637985259836   metaobjects type product_options
gid://shopify/BulkOperation/8637988700476   metaobjects type product_option
gid://shopify/BulkOperation/8638001152316   metaobjects type product_option (updatedAt)
```

Per-file sha256 of the four JSONL snapshots is recorded in `manifest.json`.

**Traversal** (reproduces FF-FSR90 at 83 entries / 25 option records, the 31 August
survey figure, exactly):

```
product.metafield(options.product_options)        -> list of product_options metaobjects
product_options.field(product_options)            -> list of product_option metaobjects
product_option.field(product_option_variants)     -> list of ProductVariant GIDs   = entries
```

---

## 3. Cohort today

| | 4–5 Oct | 7 Oct 16:22 UTC |
|---|---:|---:|
| active products | 3,755 | **3,756** |
| catalogue-required | 3,735 | **3,737** |
| exempt | 20 | **19** |
| group references | 11,400 | **11,406** |
| group refs per product min / median / max | 1 / 3 / 7 | **1 / 3 / 7** |
| distinct option variants | — | **1,942** |
| entries, raw | 61,431 | **61,457** |
| entries, deduped | 61,272 | **61,298** |

Both counts moved by exactly +26, which is the consistency check: a methodology change
would have moved them differently.

Attributed movement:

| | entries |
|---|---:|
| LF-DSLTBAT SL Arc Trainer, options added by Larianne 6 Oct | +19 |
| Power Plate MOVE – Titanium, created 7 Oct 01:24 UTC | +13 |
| Power Plate Deluxe Cushion, created 7 Oct 02:45 UTC | +2 |
| unattributed residual | −8 |
| **net** | **+26** |

The SL Arc Trainer moving out of the exempt set is Tim's predicted 3,735 → 3,736; the
two Power Plate products are new today and take it to 3,737.

The −8 residual (0.013%) cannot be attributed. Nineteen pre-existing `product_option`
records were edited after 5 Oct 14:02 — eighteen processing-time options and
`precor-cw-2222-mat`, which is Larianne's approved item 2b — and without the 4 and 5
October row sets there is no before-state to difference against. **That is the point of
publishing the artifact**: from this commit forward, a residual like this is a byte
comparison rather than an open question.

---

## 4. Findings that affect the release

### 4.1 FF-PVC365 is in the SL Arc Trainer option set, against the written exception

Tim's 5 October GO: *"do not include FF-PVC365 in the new SL options until fit is
confirmed. It is listed as 36" × 78", while the SL's overall dimensions are
76.5" × 36.25"."*

Live on product `15398695239996` (updated 2026-10-06 13:56 UTC), option
`lf-dsltbat-mat`:

```
51444831945020   ff-pvc365-3-x6-5-pvc-floor-mat-59   FF-PVC365 3'x6.5' PVC Floor Mat   $65.00
51444832764220   (2) FF-RSGF 39"x78" Rubber Square Gym Flooring (2 Squares)            $96.00
53067264098620   (2) FF-RITGF 39"x78" Interlocking Tile Flooring (2 Tiles)             $96.00
51444833354044   (8) FF-RIT24 48"x96" Rubber Gym Interlocking Tile Flooring (8 Tiles)  $128.00
```

It is customer-selectable now. Either confirm the fit or remove it from the SL set.
Removing it takes the SL from 19 entries to 18 and the cohort checksum will need
regenerating.

The rest of the SL build matches the GO: four option sets, Processing Time 1, Warranty
9, Mat 4, Full Assembly & Installation 5, `hide_quantity = true` throughout.

### 4.2 Two shared-variant option records are mis-wired — wrong item, wrong price

Isolating variants that appear under differently-labelled options surfaced two live
source-data defects. Both charge and ship an item the customer did not select.

**Life Fitness Pro2 SE Arm Bicep Curl (Remanufactured)** — the option titled
*"Weight Stack Adapter Plate - 2.5lbs"* points at variant `51461555781948`:

```
sku      ff-wspa5-5-lb-weight-stack-plate-adapter-15-95
title    FF-WSPA5 5 lb Weight Stack Plate Adapter ($21)
price    $21.00
product  Weight Stack Adapter Plate - 5 lbs - Accessories / Add Ons (370)
```

That is the 5 lb adapter. The *"5 lbs"* option on the same product points at the same
variant. The correct 2.5 lb family exists and is used elsewhere
(`51461556273468`, *"Weight Stack Adapter Plate - 2.5lbs - Accessories / Add Ons (371)"*,
$30.00), so this is a mis-reference, not a missing record.

**Total Gym RS Encompass (New)** — the option titled *"Total Gym Weight Bar"* lists two
variants:

```
52255885721916   TG-5102-01                       Total Gym 3 Grip Pull-Up Bar (New)   $219.00
52295239926076   1233-total-gym-weight-bar-new    Total Gym Weight Bar (New)           $54.00
```

The $219 Pull-Up Bar is offered as a choice under "Weight Bar". The separate
*"3 Grip Pull-Up Bar"* option points at the same $219 variant.

These are source-data defects, not generator defects. The catalogue carries them
faithfully, so populating and activating as things stand makes the Rust function charge
the wrong price for those selections with full authority. Both should be corrected
before the freeze, under their own GO.

### 4.3 Duplicate references: no money risk, one attribution defect

Of the 159 duplicates, 102 come from the same option record referenced by two groups and
57 from different option records sharing a variant. Checked across all of them:

* **`hide_quantity` disagrees on zero of them.** No quantity-cap divergence, so
  first-occurrence-wins cannot produce a wrong cap. No uncharged-option exposure.
* **Labels disagree on 11 variant placements, across 3 products** — Monster Universal
  Storage (Tier #1/#2/#3 and their 2nd-section variants), and the two products in §4.2.

For the Monster tiers the money is right and the attribution is not: a customer
selecting Tier #3 resolves to the entry recorded under whichever tier option comes first
in document order. Same class as #49369 — correct billing, misleading order line, a
picking exposure. Not an activation blocker; worth a backlog item.

### 4.4 Prerequisites re-confirmed unmet today

* `custom.bundle_option_config` is **still null** on production products and there is
  **still no metafield definition** for it. Re-checked live today. Unchanged from the
  1 October QA.
* **PR #920 still contains only the 1 October document.** The 5 October cohort QA has
  not been landed on the branch. Tim's 5 Oct gate 3 to Izza is open.

---

## 5. PASS / HOLD

| item | verdict |
|---|---|
| Catalogue difference 61,272 vs 61,431 reconciled | **PASS** — definitional, not drift; 159 across 49 products, exact |
| Qash's "zero drift in 24 hours" | **PASS** — corroborated, zero option edits in the window |
| Option-level catalogue published with checksum, generator and source references | **PASS** — this commit |
| Cohort boundary 3,737 / 19 | **PASS** — movement since 5 Oct attributed to −8 |
| SL Arc Trainer built to the 5 Oct GO | **HOLD** — FF-PVC365 present against the written exception |
| Source data fit to drive a catalogue write | **HOLD** — two mis-wired options, §4.2 |
| Production catalogue prerequisite | **HOLD** — metafield still undefined and null |
| Final release candidate | **HOLD** — the above, plus the theme precondition from the 5 Oct QA |

What would clear the catalogue side: remove FF-PVC365 or confirm fit; correct the two
mis-wired options; regenerate the candidate from a frozen snapshot and compare it byte
for byte against the checksums above.

Note on wording, per Tim: no new completed-order mismatch has been detected. That is not
the same as zero customer impact, and nothing here establishes zero customer impact.
