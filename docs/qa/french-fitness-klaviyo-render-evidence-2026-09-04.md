# French Fitness segmentation — non-sending render evidence

Date: 2026-09-04. Status: REVIEWED / TEMPLATE RENDER EXECUTED / PRODUCTION HOLD.

Read this alongside the original independent QA report in this PR. The original report is retained as evidence; its unsupported runtime-coercion and account-wide taxonomy conclusions are not accepted. Tim's existing review comment 5543291520 and the qualifications below control those interpretations. This is documentation only, not a new tracker, flow implementation, release approval, or theme change.

## Corrected interpretation of the original report

- The list-valued Shopify Tags fixtures and string `not-contains` comparisons against `["B2B"]` / `["B2G"]` establish a type/logic concern. They do not independently prove Klaviyo's runtime coercion or that a customer received an email. Use exact list-membership exclusions and verify the resulting behavior.
- A limited profile sample cannot establish that no buyer-type property exists anywhere in the account. Do not create a second buyer taxonomy. B2C/B2B/B2G remain the approved values.
- Eight additional QA fixtures already exist for FF_SEGMENTATION_2026-09-04. They were read, not recreated, in this review. All eight returned NEVER_SUBSCRIBED and last_event_date=null; no production events or consent changes were made here.
- Region is separate from buyer classification and is not an additional blocker for this bounded release.
- Tim has already directed removal of the obsolete internal test-address exception and fail-closed behavior when Sales_Conversation=true with missing/malformed activity time. These are no longer open policy questions.
- Trigger Preview, full Flow Preview, template rendering, and actual runtime evidence are different tests. A segment mirror is optional supporting evidence, not a replacement for the event path. Do not activate a canonical flow merely to collect evidence.

## Live source and status observations

Shopify FFT-DCC (product 10410984964412, variant 53144977080636) remains DRAFT / Product Index / 3499. Exact candidate item-ID lookups in the accessible `$custom:::$default` Klaviyo catalog returned no match; related family products were present as positive controls. This is a bounded catalog observation, not a complete native-catalog or feed-mapping audit.

StKF69 and QSzrkW remain draft and unarchived, with 10-day and 7-day re-entry respectively. Their reviewed definitions return `trigger_filter: null` and do not contain Sales_Conversation in the profile filters. Yk6pEb remains draft and XJBGua remains manual. None was activated, archived, or modified in this review.

## Executed test: direct SarNb7 template render

The connected Klaviyo `render_email_template` action was executed successfully for SarNb7 using supplied synthetic context only:

```json
{"event":{"ProductID":"10410984964412","VariantID":"53144977080636","Name":"French Fitness Tahoe Dual Cable Crossover (New)","Brand":"French Fitness","Price":3499,"Quantity":1,"$value":3499,"URL":"https://www.fitnesssuperstore.com/products/french-fitness-tahoe-dual-cable-crossover-new","ImageURL":"https://cdn.shopify.com/s/files/1/0884/2012/2940/files/French_Fitness_Tahoe_Dual_Cable_Crossover_New_-_Main_Image.webp?v=1784261731"},"organization":{"name":"Fitness Superstore","full_address":"537 Stone Rd STE F, Benicia, CA 94510"}}
```

The returned HTML included:

- The supplied FFT-DCC name and product URL in the event-backed hero.
- Desktop/mobile hero image elements using the supplied image URL (widths 125 and 55).
- Promotional image alt/title `Use code SAVE5 to get 5% off at checkout Complete my build`.
- Footer `href="mailto:sales@fitnessuperstore.com"` on desktop and mobile.

**Scope of proof:** render-layer behavior only. SarNb7 is a Path 2 template. The French Fitness event was passed directly to it intentionally to isolate rendering; this does not show that FFT-DCC routes to Path 2, enters a flow, survives its filters, or is sent to a customer. Recommendation feed slots were empty in this standalone context; no feed exclusion/rotation PASS is inferred. The render did not ingest an event, change a profile or template, or send email.

**Conclusion:** absence from the checked catalog does not itself prevent event-backed hero rendering in this template. Validate eligibility and the actual branch's template separately. Do not invent ProductStatus or Published event properties; use verified event fields and/or a correctly mapped catalog lookup in a draft proposal.

## Existing corrections and acceptance steps

Joshua/Izza retain the previously directed six-template high-value cleanup: TuvTHp, XmYrWS, SbCydi, SarNb7, TvP9Mz, TMnaUQ. Preheaders are separate flow-message fields: WQR8kv, Ye8J82, XbXpLr. Proposed replacement: `Review your selected equipment and ask our team for help before you order.` Sweep both viewport footers, including low-value messages; preserve permitted low-value offers and required unsubscribe/footer content.

Iqra/Izza should record exact recommendation source/feed mapping and separately test the actual event-backed hero on its correct branch. Yusra independently records static-definition, trigger-preview, full-flow-preview, rendered-output, and runtime outcomes as distinct evidence types in the existing QA Sheet.

For fixtures without a relevant event, record `BLOCKED — MISSING EVENT CONTEXT`. Do not inject production Shopify metrics or change consent to make the preview work. Trigger Preview evaluates entry/re-entry against the selected profile's relevant event, not downstream behavior; since-flow-start checks initially passing do not prove later purchase exits. Full Flow Preview is a current-state preview, not proof of future consent, expiry, or later suppression.

The existing September 4 EOD Pacific checkpoint and Control Tower's four accepted gates remain unchanged. The existing QA Sheet remains the working record. Its earlier same-day edit attempt was denied; no sheet correction or restored permission was verified in this review. XJBGua's separate approved test-only directive is unchanged.

Release requires Izza technical PASS, Yusra independent PASS, and Tim written GO. No production merge, publication, activation, customer send, consent/profile backfill, new access, or billing approval is conveyed.

## References

- Existing QA Sheet: https://docs.google.com/spreadsheets/d/193-m7-DNTA54uFOwZxBOwuELI2gQ2av-tBF_XL1gk4Q/edit
- Existing controlling PR comment: https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/794#issuecomment-5543291520
- Trigger Preview: https://help.klaviyo.com/hc/en-us/articles/360028374111
- Full Flow Preview: https://help.klaviyo.com/hc/en-us/articles/30325266432539
- Catalog lookup: https://help.klaviyo.com/hc/en-us/articles/360004785571

No customer records, credentials, private personnel information, pay/rates, or margin data are included.
