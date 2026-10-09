# Reply to send to Boost (Stephen)
Per Tim's instruction of 6 October: reply with the exact catalog numbers, state that we are
preserving Product Title at High, and ask for a supported alternative.
Send in the "Other" conversation. Keep Izza, Tim and Andrew copied. Do not change any setting.

## Context the draft is built on
- Boost's own offer of 28 August, never taken up: *"Make the logic stricter for multi-word
  queries: We can review and help make the search logic stricter for multi-word queries.
  However, there is an important tradeoff to consider. Stricter matching can improve
  precision, but it usually means fewer products will qualify as relevant."* This is the
  nearest thing to the alternative Tim asked us to request, and it came from Boost.
- Boost changed something on our store on 2 October (the "special sync flag", in the stale
  product-to-collection mapping thread) and told us on 4 October that nothing had been
  changed. Both can be true, since the flag is a collection-ordering fallback rather than a
  search setting, but it needs pinning down before GO 2 so the before-state is clean.
- Two conversation IDs are now in play: 215475012569575, used 57 times from 22 July and
  repeatedly designated the controlling vendor record, and 215476119527050, given on
  4 October and accepted by Tim on 6 October. Ask which one is canonical.

---

Hi Stephen,

Thanks for the detailed answers, that covers all seven points.

On recommendation 1, we are not going to make that change, and I want to explain why so you
can suggest an alternative. You recommended Product Type at High with Product Title dropped
to Medium. Our Product Type field does not hold product class information. Of 3,756 active
products, 3,736 have the single value "Product Index", 17 are "Product (Hidden)" and 3 are
blank. It is an internal routing label, not a category. Raising it to High would make a
constant our highest weighted field, and dropping Title to Medium would weaken the only
field that currently works well for us. We are keeping Product Title at High and leaving
Product Type at Medium.

So the question we still need answered is whether there is a supported way to weight real
product class or category information above brand, SKU and barcode, but still below an exact
title match, without weakening exact-title relevance. If Product Type is the only field you
can weight, and the four priority levels are the only control, please say so plainly, and
tell us whether Product Category, tags or a metafield could carry class instead and be
weighted that way.

Related to that, on 28 August you offered this: "Make the logic stricter for multi-word
queries: We can review and help make the search logic stricter for multi-word queries." We
never followed up and I would like to now. Please tell us exactly what that change would be,
what it would apply to, whether it is a store-wide setting or something you apply on your
side, how we would verify and roll it back, and whether it carries any cost. We understand
the tradeoff you set out on recall and we would rather see the proposal and judge it than
leave it unexplored.

Two things we would like confirmed while you are looking at this.

First, you mentioned Semantic Search runs at 50% impact by default and can be reduced.
Please confirm that setting it to 0 stops it adding products that have no keyword match,
that it does not affect anything else, and how long it takes to take effect after a manual
sync.

Second, please confirm which fields are currently searchable on our store and at what
priority, including tags and metafields, so we have your current record alongside ours.

One more point, and I raise it only so our records match. On 2 October, in the separate
thread about the stale product-to-collection mapping, you enabled what you described as a
special sync flag on our store that changes how Boost builds collection product order. On
4 October you told us no search settings had been changed on the store. I understand those
as consistent, since the flag is about collection ordering rather than search, but please
confirm that explicitly, tell us whether the flag is still enabled, whether it has any
effect on search result ordering, and whether it can be reverted. We are about to run a
controlled before and after test on two ranking settings and we need an accurate picture of
what is currently in place.

While you are in that thread, two questions from it are still open: why the collection
membership change was not picked up, and whether other products in our catalog carry the
same stale mapping.

Last thing, a housekeeping one. We have been using conversation ID 215475012569575 as the
controlling reference since July, and your 4 October message gave 215476119527050. Please
tell us which one to quote going forward.

We are not asking you to change anything on the store. We will make any change ourselves
after internal approval.

Regards,
Yusra
