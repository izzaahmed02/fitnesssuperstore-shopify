# HOLD — Cast Iron Kettlebell combined listing, test-family QA

Packet for Tim's Oct 11 GO. Read back against live Shopify and the live
storefront on 2026-10-13. Evidence files beside this one.

**Verdict: HOLD.** The test-copy route as specified cannot resolve the
first-click limitation, because the limitation is caused by the parent having
no Online Store publication — and a test parent that is also unpublished
reproduces it exactly. Tim's own instruction covers this case: "If the
existing setup cannot support isolated testing, report that specific blocker
rather than publishing the real parent." This is that report.

## 1. Root cause of the first-click limitation — found, with evidence

The parent 15402434855228 is a genuine native Combined Listings parent
(`combinedListingRole: PARENT`, 26 children linked, template
`combined-listings`). Nothing is wrong with how it is built.

What is wrong is its publication state: `onlineStoreUrl` is **null** and
`resourcePublicationsV2` is **empty** — it is published to zero channels.

On a native combined listing, the parent URL 302s to a child, and the
*child* page is what renders the sibling picker. That picker only renders
when the parent listing is live. Controlled comparison, same theme, same
template, same code path:

| page | parent publication | `variant-selects` present | sibling options |
| --- | --- | --- | --- |
| Kettlebell child, 5 lbs | **zero channels** | **no** | **0** |
| Kettlebell child, Set 5-30 lbs | **zero channels** | **no** | **0** |
| Turf child, V1 Base | Online Store | yes | 3 |

So on the kettlebell parent the sequence is: first click navigates you to a
child, the child has no picker, and you are stranded. That is precisely the
"breaks after the first click" symptom, and it is fully explained by the
publication state. The same comparison proves the theme code is fine — the
turf parent, built the same way and published, works.

Evidence: `first-click-evidence-2026-10-13.csv`, plus screenshots
`kb-child-no-picker.png` and `turf-child-picker-present.png`.

## 2. Why the test family as specified will not resolve it

Four cloned children behind a test parent reproduce the defect rather than
remove it, as long as the test parent is unpublished. The picker is the
thing under test, and the picker does not exist until the parent is
published to the Online Store.

So the test family needs the test parent **published to the Online Store**.
That is the one requirement that conflicts with the brief, and it needs a
ruling because UNLISTED alone is not access protection — Tim's words, and
they are correct.

What UNLISTED + publication does and does not give us:

- Keeps the test parent out of site search and collection grids: **yes**.
- Keeps it out of feeds and catalogs: **yes**, via `REMOVE FROM FEEDS`
  (the "- Meta Feeds" collections all gate on `TAG NOT_EQUALS "REMOVE FROM
  FEEDS"`), plus Boost exclusion and `seo.hidden`.
- Keeps it out of the Judge.me group: **yes** — Yusra has already confirmed
  the group is the 26 real products only.
- Prevents an unintended customer purchase: **no.** A published UNLISTED
  product is purchasable by anyone with the URL. This is the gap.

Three ways to close it, for Tim to pick:

1. **Development store.** True isolation, nothing customer-reachable. Costs
   a theme and app replication, so it is the slowest, and app behaviour
   (Boost, Judge.me) will not match production exactly.
2. **Published UNLISTED test family with obfuscated handles**, QA run inside
   a scheduled window, records archived immediately after. Exposure is a URL
   nobody has, for a few hours. Fastest and closest to production, but it is
   a real, if small, exposure and it needs Tim's written GO.
3. **Do not build a test family.** Publish the real parent in a short
   controlled window instead, QA, and unpublish. Tim has already declined
   this; recording it only so the three options are on one page.

Recommendation: **option 2**, in a named window, with the rollback below.
Option 1 if any customer-reachable exposure is unacceptable, accepting the
slower timeline and the app-parity caveat.

## 3. What is already done and verified

- **Parent prices: PASS, independently re-verified.** All 26 parent variant
  prices match their child product prices, $21 to $1,099, zero mismatches.
  Row-level proof in `kettlebell-26-price-match-2026-10-13.csv`.
- **Parent variant SKUs are blank** on all 26, as intended.
- **The 26 children are correct and complete**: 22 singles (5–115 lbs) and
  4 sets (5-30, 5-50, 5-70, 5-80), all ACTIVE, all with their own tracked
  inventory and real SKUs (FF-CIKB*).
- **Children are unchanged** and remain individually live and correct — each
  child URL loads its own product with its own variant in the cart form.
- **Judge.me**: Yusra confirmed the group is the 26 real products, test
  records excluded.

One caution for whoever scopes the exclusions: the tag `Cast Iron
Kettlebells` returns **29** products, not 26 — the 26 children plus two
ARCHIVED Body Solid sets (9879111434556, 9879112286524) plus the parent. Do
not use that tag as the scoping key for test exclusion.

## 4. Test family build spec, ready to run on GO

Tim's four samples, resolved to real records
(`kettlebell-test-family-spec.csv`):

| sample | source product | variant | SKU | price |
| --- | --- | --- | --- | --- |
| Single 5 lbs | 9878963781948 | 50749291823420 | FF-CIKB5 | $21.00 |
| Single 106 lbs | 10060362318140 | 51783567311164 | FF-CIKB106 | $180.00 |
| Set 5-30 lbs | 9878965125436 | 50749295427900 | FF-CIKB530 | $159.00 |
| Set 5-80 lbs | 9878967877948 | 50749300310332 | FF-CIKB580 | $1,099.00 |

Build steps, none of which touch a real record:

1. Duplicate the four products as new drafts, prefix handles and titles
   `qa-test-`, SKUs `TEST-FF-CIKB*`.
2. Create a new combined-listing parent, `qa-test-cast-iron-kettlebells`,
   with the two options (Purchase Type, Weight) and the four test children
   linked. Do not reuse 15402434855228.
3. Tag every test record `REMOVE FROM FEEDS` and `qa-test`; set
   `seo.hidden = 1`; add a Boost product-exclusion rule on the five test
   product IDs; confirm exclusion from the Judge.me group.
4. Publish **the test parent and the four test children** to the Online
   Store only. Status UNLISTED. No other channel — not POS, not Shop, not
   Google & YouTube.
5. Izza verifies 3 and 4 before QA starts, and posts the verification here.

**Rollback, under 10 minutes:** unpublish the five test records, then
archive them. Nothing else moves; no real record was touched at any point,
so there is nothing to restore.

## 5. QA script for Iqra and Saliha, once the setup is verified

Run on desktop and mobile, and record the cart line's variant id each time:

1. Load the test parent URL — confirm it 302s to a child and the picker
   renders.
2. Click within Singles (5 lbs → 106 lbs) — confirm navigation, title,
   price, image, SKU, quantity and add-ons all follow.
3. Click within Sets (5-30 → 5-80) — same checks.
4. Click across purchase types (Single → Set, Set → Single) — same checks.
5. Repeat 2–4 at least five times in one session. **This is the first-click
   test**: the limitation shows as the second and later clicks doing nothing.
6. Browser Back after each switch — confirm it returns to the previous child,
   not the parent.
7. Enter a test child directly by URL — confirm the picker renders and the
   correct option is preselected.
8. Add to cart from each of the four, and confirm the cart line is the
   **selected test child**, never the parent and never a real product.
9. Proceed to checkout and confirm the same identity carries through.

## 6. Carry this across to the real-family launch

Two findings from the same code path that apply to the real launch, and to
the turf listing that is already live:

- **Deep links must use child URLs.** On the live turf parent,
  `?variant=<parent variant id>` lands on the default child for every id
  tested — a V2 or V3 link sells the V1 grade. Parent variant ids are not
  valid storefront deep links. Anywhere we generate a link (feeds, ads,
  Klaviyo, internal), it must be the child product URL.
- **A combined-listing parent must be published to the Online Store for the
  listing to work at all.** Leaving it unpublished does not make it safe; it
  makes the children unreachable from each other.

## 7. Proposed real-family launch and rollback

Not requested yet, recorded so the GO has something to approve:

- **Launch:** publish 15402434855228 to the Online Store, status UNLISTED
  first; verify the picker on three children; then set ACTIVE. Keep
  `REMOVE FROM FEEDS` and `META_UNDER_1000_EXCLUDE` on the parent so no feed
  row changes. The 26 children keep emitting as they do today.
- **Rollback:** set the parent back to UNLISTED and remove the Online Store
  publication. The 26 children are untouched throughout and keep selling
  exactly as they do now, so the rollback has no customer-facing cost.
- **Gate:** Tim's separate written launch GO. Nothing above is done.

## Nothing was changed

Every statement here is a read of live Shopify or a page load against the
live storefront. No product, variant, metafield, tag, publication, theme or
app setting was written.
