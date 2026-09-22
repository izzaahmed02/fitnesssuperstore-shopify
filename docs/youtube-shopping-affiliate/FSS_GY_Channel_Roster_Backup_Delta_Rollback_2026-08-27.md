# Google & YouTube Channel Roster — Backup, One-SKU Delta, Rollback

**Workstream:** YouTube Shopping affiliate program — native Google & YouTube migration (canonical thread)
**Deliverable owner (this packet):** Yusra — Shopify publication-roster half of the Izza + Yusra channel-roster item
**Capture date:** August 27, 2026
**Capture window:** 09:08–09:09 AM PDT (16:08–16:09 UTC)
**Boundary:** READ-ONLY. No publication, feed, app, theme, tracking, product, metafield or product-source change was made.
**Operating decision in force:** HOLD / NO RESTART / NO LIVE CHANGE. Product Sync remains OFF.

---

## 0. Scope note

This packet covers ONLY the Shopify-side Google & YouTube **publication roster**: its exact backup,
the exact proposed one-SKU delta, proof that the Online Store publication is unaffected, and the exact
restoration sequence.

It does **not** cover, and makes no claim about:

- Merchant Center sources, MultiFeeds, supplemental sources, rules or destinations
- Native Product Sync / File URL coexistence (Gate 1 — account-wide architecture)
- The Gate 2B active-feed exclusion test (Masum, HOLD, not authorized)
- Measurement/tracking architecture (Vladimir)

Those remain separate and remain on HOLD.

---

## 1. Capture method

All figures were read from the live Shopify Admin API on the production store
`www.fitnesssuperstore.com` (Shopify Plus). Two read-only bulk **query** exports were used so the roster
is captured whole rather than sampled or paginated by hand.

| Item | Value |
|---|---|
| Store | Fitness Superstore — www.fitnesssuperstore.com |
| Google & YouTube publication ID | `gid://shopify/Publication/266740007228` |
| Online Store publication ID | `gid://shopify/Publication/236628640060` |
| Roster bulk operation | `gid://shopify/BulkOperation/7702531768636` — COMPLETED, objectCount 2426, completed 2026-08-27T16:08:33Z |
| Online Store baseline bulk operation | `gid://shopify/BulkOperation/7702534586684` — COMPLETED, objectCount 5970, completed 2026-08-27T16:09:18Z |

Bulk **query** operations are reads. They export data; they do not write to products, variants,
publications, metafields, feeds or apps.

### Full publication list on the store (for reference)

| Publication | ID |
|---|---|
| Online Store | 236628640060 |
| Point of Sale | 236628705596 |
| Shop | 236628738364 |
| Facebook & Instagram | 265156329788 |
| **Google & YouTube** | **266740007228** |
| Shopify GraphiQL App | 271764062524 |
| TikTok | 276813578556 |

---

## 2. Exact current backup — Google & YouTube publication roster

| Metric | Value |
|---|---|
| Products published to Google & YouTube | **2,426** |
| Unique product IDs in roster | 2,426 (no duplicates) |
| Product status distribution | 2,426 ACTIVE / 0 DRAFT / 0 ARCHIVED |
| Total products in catalog | 6,471 |
| Total ACTIVE products in catalog | 3,749 |
| Products published to Online Store | 5,970 |

**2,426 matches the figure of record in the thread exactly.**

### Backup artifacts

| File | Rows | SHA-256 |
|---|---|---|
| `FSS_GY_Publication_Roster_Backup_2026-08-27.csv` | 2,426 + header | `c07af25b7809d94f99ec299e30a23ebec44c704e501aaf9acb5049d3028c890e` |
| `FSS_GY_Publication_Roster_ProductIDs_2026-08-27.txt` | 2,426 | `9211b7c3d434a7952f5b3383ef4fbf09f7074f80bb848b94d5b23800f7d8ea58` |
| `FSS_OnlineStore_Publication_Roster_Baseline_2026-08-27.txt` | 5,970 | `89ea7c4762781aef5ff3809ddbdfca7c59ebe010588e17847825192a4d7e16ce` |

CSV columns: `product_id, product_gid, handle, title, status, vendor, product_type, created_at,
updated_at, publication_id, publication_name, published`. Rows are sorted ascending by numeric
product ID so any future capture is byte-comparable against this one.

Top vendors in the roster: French Fitness 893, Life Fitness 256, Cybex 171, Precor 153,
Technogym 127, Nautilus 110, Star Trac 96, SportsArt 78.

---

## 3. Pilot SKU — live verified state

Read live on 2026-08-27. Every value below independently matches the product data Tim posted on
August 26.

| Field | Live value |
|---|---|
| Title | French Fitness FFB Black Pendulum Squat Leg Press Machine (New) |
| Handle | `french-fitness-ffb-black-pendulum-squat-leg-press-machine-new` |
| Product ID | 9879215046972 |
| Variant ID | 50749727572284 (one variant only) |
| SKU | FFB-PSLP |
| Status | ACTIVE |
| Vendor | French Fitness |
| Price | $1,399.00 |
| GTIN / barcode | 810041975249 |
| Inventory policy | DENY |
| Available for sale | true |
| `custom.legacy_gmc_id` | FFB-PSLP |
| `custom.gmc_id_rollout_status` | approved |

### Current publication state — FFB-PSLP

| Publication | Published | Publish date |
|---|---|---|
| Online Store | true | 2025-01-14T20:22:06Z |
| Point of Sale | true | 2025-01-14T20:22:08Z |
| Shop | true | 2025-01-14T20:22:09Z |
| Facebook & Instagram | true | 2025-02-27T02:02:34Z |
| **Google & YouTube** | **true** | **2025-03-16T10:40:55Z** |
| Shopify GraphiQL App | true | 2025-05-19T09:44:53Z |
| TikTok | not published | — |

This row is the exact restore target in section 6.

---

## 4. Proposed one-SKU publication delta

**Not executed. This is a design proposal awaiting Tim's separate explicit GO.**

| | Before | After (proposed) |
|---|---|---|
| Google & YouTube roster count | 2,426 | 2,425 |
| Product removed from Google & YouTube | — | 9879215046972 (FFB-PSLP) — exactly one |
| Other 2,425 products | unchanged | unchanged |
| Online Store roster count | 5,970 | 5,970 |
| Any other publication | unchanged | unchanged |
| Product, variant, price, GTIN, inventory, metafields | unchanged | unchanged |

Exact operation, scoped to a single product and a single publication:

```graphql
mutation {
  publishableUnpublish(
    id: "gid://shopify/Product/9879215046972"
    input: [{ publicationId: "gid://shopify/Publication/266740007228" }]
  ) {
    publishable { availablePublicationsCount { count } }
    userErrors { field message }
  }
}
```

Nothing else is touched. No other product ID and no other publication ID appears in the call.

### PASS criteria for the delta

1. Google & YouTube roster count reads exactly 2,425.
2. Set difference between the backup roster and the post-change roster is exactly
   `{9879215046972}` — one removal, zero additions, zero other changes.
3. Online Store roster count reads exactly 5,970 and its ID list matches the baseline byte for byte.
4. FFB-PSLP remains published to Online Store, Point of Sale, Shop, Facebook & Instagram and
   Shopify GraphiQL App, with publish dates unchanged.
5. FFB-PSLP status, price, GTIN, inventory policy, availability and both `custom` metafields unchanged.

Any deviation from any of the five is an automatic rollback trigger.

---

## 5. Proof that the Online Store publication is unaffected

Three independent legs:

1. **Structural.** Shopify publication membership is per-publication. `publishableUnpublish` acts only
   on the publication IDs passed in its input array. Only `266740007228` is passed. `236628640060`
   is never referenced.

2. **Baseline captured.** The complete Online Store roster — all 5,970 product IDs — is captured in
   `FSS_OnlineStore_Publication_Roster_Baseline_2026-08-27.txt` with a published SHA-256. "Unchanged"
   is therefore verifiable by re-export and diff, not by assertion.

3. **Overlap measured.** All 2,426 Google & YouTube products are also published to Online Store
   (intersection 2,426; Google & YouTube products absent from Online Store: 0). FFB-PSLP is in that
   intersection. So the correct post-change reading is unambiguous: Online Store must still read
   5,970 and must still contain 9879215046972. A drop to 5,969 would prove the wrong publication was
   touched, and would fire rollback immediately.

Verification query, to be run before and after:

```graphql
{
  gyPublished:           productsCount(query: "publication_ids:266740007228") { count }
  onlineStorePublished:  productsCount(query: "publication_ids:236628640060") { count }
}
```

Before: `gyPublished 2426`, `onlineStorePublished 5970`.
Expected after the proposed delta: `gyPublished 2425`, `onlineStorePublished 5970`.

---

## 6. Exact restoration sequence

Restores FFB-PSLP to the Google & YouTube publication and returns the roster to the captured
2,426-product baseline.

**Step 1 — restore the single publication membership.**

```graphql
mutation {
  publishablePublish(
    id: "gid://shopify/Product/9879215046972"
    input: [{ publicationId: "gid://shopify/Publication/266740007228" }]
  ) {
    publishable { availablePublicationsCount { count } }
    userErrors { field message }
  }
}
```

**Step 2 — confirm counts return to baseline.** Run the section 5 verification query. Required
reading: `gyPublished 2426`, `onlineStorePublished 5970`.

**Step 3 — confirm the roster is identical to the backup.** Re-run the roster bulk export, rebuild the
ID list sorted ascending, and compare against
`FSS_GY_Publication_Roster_ProductIDs_2026-08-27.txt`. Required result: SHA-256
`9211b7c3d434a7952f5b3383ef4fbf09f7074f80bb848b94d5b23800f7d8ea58`, zero added IDs, zero removed IDs.

**Step 4 — confirm the product row.** Re-read FFB-PSLP `resourcePublicationsV2` and confirm all six
publications from section 3 read `isPublished: true`, and that status, price $1,399.00, GTIN
810041975249, inventory policy DENY, availability, `custom.legacy_gmc_id = FFB-PSLP` and
`custom.gmc_id_rollout_status = approved` are unchanged.

**Step 5 — confirm Online Store is byte-identical.** Re-export the Online Store roster and compare to
SHA-256 `89ea7c4762781aef5ff3809ddbdfca7c59ebe010588e17847825192a4d7e16ce`.

**Known residual:** `publishablePublish` restores membership but writes a **new** `publishDate`. The
original Google & YouTube publish date of `2025-03-16T10:40:55Z` is recorded here because it is not
restorable through the API. This is a metadata timestamp only — it does not affect publication
membership, product eligibility, the feed, or the offer. It is flagged rather than left unsaid.

### Automatic rollback triggers

Execute step 1 immediately, and stop, if any of the following is observed:

- Google & YouTube roster count is anything other than 2,425 after the delta
- Any product ID other than 9879215046972 is added to or removed from the Google & YouTube roster
- Online Store count is anything other than 5,970, or its ID list does not match the baseline
- FFB-PSLP loses any other publication, or its status, price, GTIN, inventory policy, availability
  or either `custom` metafield changes
- Any Merchant Center, MultiFeeds, feed, source, destination or rule change is observed
- Any unexpected app, sync or automation behaviour follows the change
- The exact captured baseline cannot be restored

---

## 7. Independent PASS / HOLD

| Item | Result |
|---|---|
| Exact 2,426-product Google & YouTube publication-roster backup | **PASS** — 2,426 captured, checksummed, sorted, restorable |
| Proposed one-SKU publication delta | **PASS as design** — exact, single product, single publication, five PASS criteria defined |
| Proof Online Store publication remains unchanged | **PASS** — 5,970 baseline captured and checksummed; overlap measured at 2,426 of 2,426; proof is diffable, not asserted |
| Exact restoration sequence | **PASS with one flagged residual** — full restore defined and verifiable; original G&Y `publishDate` is not API-restorable and is recorded instead |
| Independent verdict on executing the delta | **HOLD** |

**Overall: HOLD.**

The Shopify publication-roster gate itself passes — the backup is exact, the delta is exact, the
Online Store proof is diffable, and rollback is deterministic. I am not recommending execution,
for reasons outside this gate:

1. **Gate 1 is still open.** Google Support's written answer says native Product Sync and
   MultiFeeds can conflict and that the native source creates new Merchant Center item IDs rather than
   preserving existing offer IDs. Unpublishing FFB-PSLP from the Shopify Google & YouTube publication
   is the wrong lever while the source-of-record question is unresolved — the Shopify publication and
   the Merchant Center source are different controls, and changing the publication does not test the
   coexistence question Gate 1 actually asks.
2. **Gate 2B is not authorized.** Masum's exclusion test is prepared but explicitly not approved for
   execution. Moving the publication first would change the before-state his test is measured against.
3. **Sequencing.** Nothing in this packet needs to execute for Gate 1 or Gate 2B to be decided. It is
   ready to execute on the day it is called for, and costs nothing to hold.

This packet is evidence and readiness. It is not a request to execute.

---

## 8. Boundary attestation

Read-only throughout. Across this work:

- No product, variant, price, inventory, metafield or status was changed
- No publication membership was added or removed on any channel
- No Merchant Center, MultiFeeds, feed, source, supplemental source, rule or destination was touched
- Product Sync was not enabled; Fix / Restart was not clicked
- No Google Ads conversion, goal, campaign, bidding or budget was touched
- No Customer Events, GTM, GA4, theme, app embed or production storefront code was modified
- No affiliate commission was activated

The two Shopify bulk operations recorded above are query exports. The GraphQL mutations in sections 4
and 6 are written as proposals and were **not** run.
