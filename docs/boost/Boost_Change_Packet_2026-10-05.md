# Boost AI Search — Proposed bounded change packet for Tim's approval
Prepared 5 October 2026 by Yusra. Status: NOT APPLIED. Nothing has been changed in Boost, Shopify or the theme.
Vendor conversation reference: Boost/clearer.io conversation ID 215476119527050 (Stephen, thread "Other").

## 1. Where the vendor request stands
- 26 Sep — implementation request + Andrew's Phase1_Signal_Hierarchy_Governance_v2 sent to Stephen in the existing "Other" conversation.
- 28 Sep — Boost could not open the .docx; Izza sent a PDF conversion of the unchanged original.
- 29 Sep — Boost returned a scope summary (goal statement + seven questions) and asked us to confirm before starting.
- 1 Oct — Confirmed by Yusra, with one addition: assign a named engineer or solutions lead, and a due date of Mon 5 Oct 12:00 PT.
- 4 Oct, 17:42 PT — Boost answered all seven questions in full, ahead of the deadline.
- Named owner: NOT given. Boost said "We don't have a specific engineer assigned to this but the whole team will assist you with complicated inquiries if needed."
- Cost: none. "No, these updates won't require a plan upgrade or paid custom work."
- Boost confirmed no settings have been changed on our store.

## 2. What Boost has now answered against Andrew's two §6 questions
| Andrew §6 question | Boost answer | Consequence |
|---|---|---|
| Can Product Type be weighted between Title and the Medium tier through vendor-side customisation? | No. Only four levels exist (High / Medium / Low / Non-searchable) and "we currently do not support additional customizations to further modify how these fields are ranked." | Tier 2 of the hierarchy is NOT fully implementable in Boost. This is the answer Andrew flagged as the deciding input for the repair-versus-migrate decision. |
| Is the lb/lbs asymmetry AI Synonyms or built-in analyzer stemming? | Neither is configurable: lb, lbs and pound are treated as ordinary keywords, not units, so ranking differs by token frequency. Fix is Manual Synonyms or consistent product data. | Numerical/unit intent is engine-internal, but workaroundable at our end. |

Boost also confirmed it cannot restrict a brand or product-type query to only that brand or type, which means Andrew's Tier 2 "exact brand/vendor" and "exact product class" eligibility rules cannot be enforced in Boost at all.

## 3. Verified against live data today — two things Boost does not know
**(a) The Product Type recommendation cannot be used as written.**
Boost recommends: Product Type = High, Product Title = Medium, all other fields = Low.
Live Shopify check, 5 Oct, 3,755 active products:
- 3,737 (99.5%) have product_type = "Product Index"
- 15 have "Product (Hidden)"
- 3 are blank
- 0 carry a real product class
Product Type is an internal routing label, not a class. Promoting it to High and demoting Title to Medium would make a constant the highest-weighted field and weaken the only field that currently works. This part must be rejected and Boost told why.

**(b) Description noise is real and larger than Boost described.**
Example verified live: "French Fitness Urethane 8 Sided Hex Dumbbell" descriptions contain the phrase "traditional rubber dumbbells", which is why that product is admitted to "rubber hex dumbbell". Each description also carries a cross-link table listing every sibling weight ("5 lbs ... 45 lbs ... 150 lbs"), so one weight query matches the entire family through Description alone.

## 4. Live storefront state today (indicative capture, 5 Oct, no session, cloud IP)
Method: result order and totals read from the storefront-rendered search_submitted payload on https://www.fitnesssuperstore.com/search?q=... (the live Boost "Old SI" result set). Unauthenticated, no session, cloud IP. Indicative only — not a replacement for Arafat's controlled 16-query method.

Three defects from Andrew's August audit no longer reproduce:
- "45 kettlebell" — both 45 lb kettlebells now rank 1 and 2. Andrew measured neither in the top six.
- "bumper plate 45-pound" — correct 45 lb plates now hold ranks 1-6. Andrew measured nine sold-out sets and zero individual plates.
- "assault bike" — now returns 6 results. Andrew measured zero, fifteen times.

The failure has moved from under-retrieval to over-retrieval. Result totals today:
| Query | Results |
|---|---|
| rubber hex dumbbell | 380 |
| 45 lbs | 388 |
| 45 lb | 374 |
| bumper plate 45 | 298 |
| bumper plate 45 lbs | 178 |
| bumper plate 45 lb | 165 |
| 45 kettlebell | 167 |
| 45-pound | 32 |
| smith machine | 139 |
| fsr100 | 14 |

A "bumper plate 45 lbs" query returning 178 products is the tier-6 breach in Andrew's framework: personalization and semantic signals are changing the membership of the set, not just its order.

## 5. Proposed change — one variable at a time, in this order
No change proceeds without Tim's written GO naming the exact step.

**Step 1. Set Semantic Search impact weight from 50% to 0.**
- Why: Boost confirmed semantic is the only mechanism that ADDS non-matching products. Andrew's Tier 6 says these signals "must not alter the eligible set." This is the single change that enforces it.
- Revert condition: restore to 50% if any tracked query's correct top-three is lost, or total results collapse below the count of genuinely matching products.

**Step 2. Set Description to Non-searchable.**
- Why: verified above as the second source of set expansion. Boost's own recommendation.
- Revert condition: restore Description to Low if any model-code or brand query loses a product that only matches via Description.

**Step 3. Add Manual Synonyms: lb <=> lbs, lb <=> pound, lbs <=> pounds.**
- Why: Boost's recommended fix for unit intent, no code required.
- Revert condition: delete the rules if unit queries return a wider or worse set than before.

**Rejected, with reason to be sent to Boost:** Product Type = High / Title = Medium. Our product_type field carries no class data (99.5% is the single value "Product Index"), so this would demote the only working field in favour of a constant.

**Deferred:** retitling products for lb/lbs consistency (Boost's Approach 1). At least 136 active products carry an "lb" form with no "lbs" anywhere in the title (629 titles match lb*, 493 of those contain lbs). This is a catalog project, not a search setting, and should not be bundled with the above.

## 6. Verification and rollback
- Before each step: Arafat captures the 16 tracked queries against the Sept 25 baseline Tim approved on 26 Sep, and records the current Boost setting value verbatim.
- Apply ONE step. Trigger a Manual sync in Boost and wait for it to finish — Boost confirmed there is no preview and no staging; the change is live on sync completion.
- Immediately after sync: re-capture the same 16 queries. Then re-capture at 24 hours.
- Stop condition: any tracked query losing a correct exact-intent product from its top three, or any hidden/archived product appearing. On a stop, restore the recorded prior value and re-sync.
- Only after a clean 24-hour re-check does the next step proceed.

## 7. Open items
- Boost has still not named an implementation owner. Needs to be pressed or accepted explicitly.
- Current Boost admin values for Semantic Search weight, Description searchability and any existing Manual Synonyms need to be read and recorded in the admin before Step 1 — they could not be read from outside the app.
- Andrew's §6 answers should be recorded against the v2 document, as §8 of that document requires.
- The repair-versus-migrate decision now has its deciding input: Boost cannot express Tier 2. That is a separate decision for Tim.
