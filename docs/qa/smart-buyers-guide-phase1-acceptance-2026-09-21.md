# Smart Buyer's Guide Phase 1 — acceptance record

Scope: the Shopify/development gate only. Klaviyo flow WcBmrd and templates
T5yCyJ / X7Ebbu are Josh's lane and are not changed here.

Status: DRAFT / HOLD. Nothing in this branch is merged, published, or activated.

## Governing instructions

- Tim, 2026-09-10 — clean branch from current main, canonical PDF URL, one
  mobile screenshot per placement, duplicate-submit fix with a GA4 capture,
  then the four-scenario test packet.
- Tim, 2026-09-18 — native Shopify forms reject Ajax. All six placements are
  specced as standard submission. Reload on submit is acceptable but must land
  on the success state showing the guide CDN link; no duplicate submission or
  duplicate tag stamping on refresh or back; GA4 events fire exactly once per
  accepted submission across the reload.
- Tim, 2026-09-19 — company-side notification, a named owner and backup,
  a customer confirmation that says what they get and when, and intent
  separation (the guide tag is a content tag, never quote intent).

## Verified against live systems, 2026-09-21

| Check | Result |
| --- | --- |
| Guide PDF in Shopify Files | `gid://shopify/GenericFile/45947672789308`, `READY`, 3,214,804 bytes, updated 2026-08-28 |
| Canonical CDN URL | `.../fitness-superstore-smart-buyers-guide-to-fitness-equipment.pdf?v=1787933809` — HTTP 200, `application/pdf` |
| Stale `v=1784326414` references | none anywhere in this branch |
| Page → template mapping (all six) | Blog → `blog`; Comparison charts → `comparison`; Warranty → `warranty`; Shipping Information → `shipping-information`; Financing → `financing-updated`; Remanufactured Gym Equipment → `remanufactured`. All six templates in this branch are the ones the live pages actually render. |
| Klaviyo flow WcBmrd | `SE - Welcome Flow TEST Guide`, status `draft`, trigger `Added to List`, definition last updated **2026-08-04** |
| Klaviyo template X7Ebbu | `2026-04-23 17:15 Welcome Email #1`, last updated 2026-09-02 |

Note on the CDN URL: the `?v=` value is a cache key, not a content selector —
the old `v=1784326414` URL still resolves to the same current file. The
canonical value is used everywhere regardless, so nothing is served from a
stale cache entry.

## What this branch changes against PR #838

1. **Standard submission, documented in the section.** The section header
   records the ruling: native Shopify customer form, page reload on submit, no
   Ajax, no form app or Klaviyo embed without written approval.
2. **The reload lands on the confirmation.** The form now carries an `id`, so
   Shopify's post-submit redirect carries that id as the fragment. The tracking
   script also scrolls and focuses the success state, covering the cases where
   the browser does not act on the fragment.
3. **The success state replaces the form.** The email field is not rendered
   after a successful post, so the same placement cannot be submitted twice
   from the post-submit render.
4. **The guide CDN link is no longer optional.** The
   `show_download_on_success` toggle is removed from the schema and from all
   six template settings, so a success state can never render without the
   download link.
5. **Customer confirmation rewritten** to say what they get and when, on all
   six placements and in the schema default.
6. **Stale-marker fix in the tracking script.** The pending-submit marker now
   records its path and timestamp. A marker from a rejected submit is cleared
   on the error render, a marker from another path is never consumed, and a
   marker older than ten minutes is discarded. Previously a rejected submit
   could leave a marker that a later success render would consume, counting a
   submission that never happened.
7. **One source per placement.** PR #838 tagged Warranty, Shipping
   Information, Financing and Remanufactured all as `footer`, which would
   attribute four placements to a page they are not on. Each of the six now
   has its own source value and its own `smart_buyers_guide_source_*` tag.
8. **Out-of-scope deletion reverted.** PR #838 also deleted the
   `multicolumn_4iWMJ7` block (the 457 Industrial Way pickup reference) from
   `templates/page.shipping-information.json`. That belongs to the separate
   Shipping Information correction workstream and is left untouched here.

## Duplicate tag stamping — why refresh and back are safe

- **Refresh of the success URL.** Shopify's customer form is post/redirect/get.
  The success state is reached by a GET, so a refresh re-renders it and does
  not repost. No tag is applied a second time.
- **Back, then resubmit.** The three tags applied are
  `newsletter`, `smart_buyers_guide_requested` and
  `smart_buyers_guide_source_<placement>`. Shopify customer tags are a set, so
  re-applying the same three to the same customer is a no-op. This must still
  be shown in scenario 4 of the test packet.
- **GA4 across the reload.** The submit event is pushed only on the success
  render, and only when an unconsumed marker for this path exists. A refresh
  of the success URL finds no marker and pushes nothing. There is no no-marker
  fallback.

## Open items that are not code, and do not belong to this branch

- **Company-side notification.** The native Shopify customer form does not
  notify anyone — the lead exists only as a tagged customer record. This is
  the same failure mode as the Room Planner finding and it is not closable in
  theme code. Recommended: a Shopify Flow on "Customer tags added" →
  `smart_buyers_guide_requested` → send an internal email to a monitored
  address. Needs Tim's written GO on the destination address.
- **Named owner and backup.** To be confirmed on the canonical thread.
- **Intent separation.** No Klaviyo segment reviewed on 2026-09-21 references
  `smart_buyers_guide_requested`. Josh to confirm across all segments and flows
  that the tag never feeds a quote or sales-outreach population.
- **Klaviyo corrections.** Flow WcBmrd's definition still carries its
  2026-08-04 timestamp, so the Day 1 `Use_Interest = User_Guide` check Tim
  asked to be removed on 2026-09-10 does not appear to have been applied yet.

## Evidence still to capture before the gate can close

1. One mobile screenshot per placement (six).
2. One Tag Assistant / GA4 DebugView capture per placement showing exactly one
   `smart_buyers_guide_form_submit` and one `smart_buyers_guide_download`, each
   with source and page path, across the reload.
3. A refresh and a back-navigation after submit on each placement, showing no
   second event and no second tag.
4. The four-scenario packet: brand-new subscriber, existing subscribed Klaviyo
   profile, existing Shopify customer who is not subscribed, repeat submission
   with the same email. Zafran owns the consolidated packet, Yusra executes the
   Shopify submissions, Josh verifies the Klaviyo profiles and routing.
5. Test addresses logged and excluded so they do not contaminate revenue
   reporting.
