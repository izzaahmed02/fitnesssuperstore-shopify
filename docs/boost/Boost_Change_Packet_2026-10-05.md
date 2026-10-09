# Boost AI Search — Proposed bounded change packet for Tim's approval
Prepared 5 October 2026 by Yusra. Status: NOT APPLIED. Nothing has been changed in Boost, Shopify or the theme.
Vendor conversation reference: Boost/clearer.io conversation ID 215476119527050, given by Stephen on 4 Oct in the "Other" thread. Note this differs from the earlier controlling ID 215475012569575 used through August.

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

Worth stating plainly: these are re-confirmations, not new answers. Boost gave the same negative on intermediate product-class weighting on 22 Aug and on brand/class eligibility on 26 Aug. Nothing in the 4 Oct reply reopens either. What IS new is the semantic weight control in Q4 and the explicit "no plan upgrade or paid custom work" in Q7.

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

## 4. Live storefront state — RETRACTED 8 October 2026
**The figures that stood here were wrong and must not be used.** They were captured from
the `search_submitted` web-pixels payload and the page `<title>` on `/search?q=`, both of
which are produced by **Shopify's native storefront search, not by Boost**. Boost's result
grid on that page is a client-side placeholder (`<!-- TEMPLATE PRODUCT LIST PLACEHOLDER -->`)
filled from `services.mybcapps.com`, which is blocked from the agent environment by network
policy. The engine measured was not the engine customers see.

Retracted: the claims that "45 kettlebell", "bumper plate 45-pound" and "assault bike" had
been fixed, and the entire result-count table (rubber hex dumbbell 380, bumper plate 45 lbs
178, and the rest). A Shopify Admin check on 8 Oct positively contradicts one of them: no
product in the catalog matches "assault" at all on title, SKU, vendor, type or tags, so
Andrew's original "assault bike returns nothing" finding has not been shown to be fixed.

Nothing in sections 1, 2, 3, 5, 6 or 7 depended on these figures. The Product Type finding,
the Description-noise finding and the lb/lbs counts all came from the Shopify Admin API and
stand unchanged.

The real Boost before-state is captured in `GO2_Runbook_2026-10-08.md` section 3, which must
be run from a browser where Boost loads.

## 5. Where this sits in the approved sequence
Tim's approved order is unchanged and this packet does not jump it. One variable at a time, each with a separate written GO.

**Already approved and still pending execution — GO 2.** Both Search Personalization and Product Performance Ranking OFF together, two toggles as one conceptual variable, Semantic Search and AI Synonyms untouched. Arafat owns execution. Tim accepted Arafat's 25 Sep capture as the new reference baseline on 26 Sep, which cleared the drift gate that was blocking it. Nothing below moves ahead of this.

**Next designated variable — Description exclusion (still HOLD).** Tim designated this on 11/14 Sep as the step after GO 2 is measured: Description first, then Tags, never together, executed by us in our own Boost admin rather than requested from the vendor, effective on save with roughly a 10 minute sync and facets unaffected. It needs its own written GO after the GO 2 +24h read. Boost's 4 Oct answer repeats the same recommendation, so vendor and internal positions now agree.

**New, from Boost's 4 Oct answer — queue behind the above.** Boost disclosed for the first time that Semantic Search runs at a 50% impact weight and that it is the only mechanism that ADDS products with no lexical match, and that the weight can be set to 0. This is the first mechanism anyone has offered that enforces Andrew's Tier 6 rule that these signals "must not alter the eligible set." It is a candidate step, not an approved one, and it must not be bundled with GO 2 or with the Description exclusion.

**Also new — the synonym row already exists.** Boost recommends lb <=> lbs and lb <=> pound Manual Synonyms. The 14 Sep configuration export showed the store already has exactly one Manual Synonym row, "lbs to lb", and it is DISABLED. So this is enabling an existing rule and adding the pound pair, not creating a set from scratch. Tim's 24 Aug direction not to activate bidirectional Manual Synonyms yet still stands until he lifts it.

**Rejected, with reason to send back to Boost.** Product Type = High and Product Title = Medium. Our product_type field carries no class data, so this would demote the only field that currently works in favour of a constant.

**Deferred.** Retitling products for lb/lbs consistency (Boost's Approach 1). At least 136 active products carry an "lb" form with no "lbs" anywhere in the title (629 titles match lb*, 493 of those contain lbs). That is a catalog project, not a search setting, and should not ride along with any of the above.

### Admission sources now on the record
Boost's 4 Oct answer describes lexical matching and semantic expansion. Two further sources are already documented internally and Boost has never mentioned either:
- Tags are searchable at medium weight and metafields are searchable at medium weight (18 Sep export read). Metafields were not named in any vendor answer or internal read before that date.
- Twelve merchandising records exist, nine of them query pins. A pin can place a product regardless of lexical match, which makes merchandising a third admission path. One of them, the Rubber Hex hide, lands on our own tracked query rows.

## 6. Verification and rollback
- Before each step: Arafat captures the 16 tracked queries against the 25 Sep baseline Tim approved on 26 Sep, using the fixed method (logged-out Incognito, US VPN, US/USD, relevance sort, no filters, page 1, limit 36), and records the current Boost setting value verbatim.
- Apply ONE step. Trigger a Manual sync in Boost and wait for it to finish — Boost confirmed there is no preview and no staging; the change is live on sync completion.
- Immediately after sync: re-capture the same 16 queries. Then re-capture at 24 hours.
- Stop condition, per Tim's 23 Sep ruling: a tracked query total changes, or an exact-name query (Q04 full-name Rubber Hex Dumbbells, Q06 full-name FFS Silver Dual Adjustable Pulley, Q16 fsr100) no longer returns its named product in the top three, or any tracked query errors. Ranking movement alone is observational, not a regression. On a stop, restore the recorded prior value and re-sync the same day.
- Only after a clean 24-hour re-check does the next step proceed.

## 7. Open items
- Boost has still not named an implementation owner. Needs to be pressed or accepted explicitly.
- GO 2 has still never run. It has been scheduled four times (9 Sep, 14 Sep, 21 Sep, 25 Sep). The drift gate that blocked the fourth attempt was cleared by Tim on 26 Sep, so it is executable.
- Current Boost admin values for Semantic Search impact weight and Description searchability need to be read and recorded in the admin before any step. They cannot be read from outside the app. The 14 Sep export is the last known good read for the rest.
- Andrew's §6 answers should be recorded against the v2 document, as §8 of that document requires.
- The repair-versus-migrate decision: Boost has now confirmed three times that it cannot express Tier 2. The provisional direction Tim set on 21 Aug was repair, not migrate. Whether the 4 Oct re-confirmation changes that is a separate decision for Tim.
