# Semantic Search 50% to 0 — bounded proposal for Tim's approval
Prepared 14 October 2026 by Yusra. Status: NOT REQUESTED, NOT EXECUTED.
Per Tim's 12 Oct instruction: bring the exact vendor-operated change, the restoration
procedure, timing and a staffed verification window for approval. Not to be combined with
the Description-exclusion test.

## Current state, vendor confirmed
- Semantic Search impact weight is **50%**. Boost confirmed this value on 12 Oct:
  "The current impact weight value on your store is currently 50%."
- Semantic Search is the only mechanism Boost says adds products with no keyword match.
  Boost, 9 Oct: "Reducing Semantic Search to 0 would prevent it from introducing products
  that do not have a keyword match. It will affects nothing else."
- The 2 October sync flag is confirmed out of scope. Boost, 12 Oct: "this flag doesn't
  affect the search logic or candidate membership... The instant search or search results
  page are not affected." Leave it enabled and untouched.

## The change is vendor-operated, not self-serve
Boost, 9 Oct: "Semantic Search cannot be disabled directly from the app admin. If you would
like to proceed, please let us know, and we can disable it for your store from our end. The
change should take effect in a couple of minutes."

So unlike GO 2 we cannot start or stop this ourselves. That has three consequences:
1. Boost must be scheduled into the window, not just notified.
2. Rollback depends on Boost being available to act, so the window must sit inside their
   working hours with an agreed response time.
3. We need Boost to confirm in writing, before the window, that restoring to 50% returns the
   store to exactly its prior behaviour rather than re-learning from scratch.

Point 3 is not idle. Boost already told us on 8 Sep that Search Personalization loses its
raw transformation data after a month off and has to retrain. We should get the equivalent
answer for Semantic Search in writing before we turn it off, not after.

## Proposed window
A staffed two-hour window, with Boost on hand throughout.
- T-24h: Boost confirms the engineer, the exact change, and the restore procedure.
- 06:00 PT: capture the 16 tracked queries plus the 3 controls, ON, 50%.
- 07:00 PT: Boost sets the weight to 0. We record their confirmation timestamp.
- 07:15 PT: capture again, same method.
- 09:00 PT: Boost restores the weight to 50%. We record the timestamp.
- 09:15 PT: capture a third time to prove the restore.
- 12:00 PT: comparison and production recommendation to Tim.

## Stop conditions
Ask Boost to restore to 50% immediately, before the scheduled time, if:
- an exact-name query (French Fitness Rubber Coated Hex Dumbbells, French Fitness FFS Silver
  Dual Adjustable Pulley, fsr100) stops returning its named product in the top three;
- any tracked query errors or returns nothing;
- a hidden, archived or test product appears;
- total results collapse so far that genuinely matching products are lost.

Per Tim's standing ruling, rank movement on its own is observational, not a regression, and a
poor result that was already there before the change is an existing defect.

## Unchanged during this test
Search Personalization, Product Performance Ranking, synonyms, searchable fields and their
priorities, merchandising rules, the 2 Oct sync flag, catalog data and theme code.

## What to ask Boost before scheduling
1. Confirm the exact change: Semantic Search impact weight 50 to 0, store-wide, nothing else.
2. Confirm the restore is a straight return to 50% with no retraining or warm-up period, and
   say plainly if that is not the case.
3. Confirm how long each direction takes to take effect after they make the change.
4. Name who will be on hand in the window and their response time for an early rollback.
5. Confirm there is no cost.
