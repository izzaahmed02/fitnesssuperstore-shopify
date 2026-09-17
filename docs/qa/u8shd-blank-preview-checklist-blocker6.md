# U8SHD-BLANK preview checklist — blocker 6, parent availability

Added per Tim's Sept 14 ruling: "parent-level schema, processing-time display,
and Add to Cart must be tested against the false children, not the parent
value. If any of the three renders wrong, blocker 6 stays a release blocker."

For Ayyaz to build to, and for Iqra + Saliha's independent QA.

## The condition under test

Read back from live Shopify 2026-09-14 and unchanged since:

| | Value |
| --- | --- |
| Parent `10419704987964`, 37 virtual variants | `availableForSale = true`, qty 0 |
| All 37 children/sets | `availableForSale = false`, DENY, qty -99 |

The parent disagrees with every child. The current theme reads parent-level
`product.available` for schema, processing-time display and Add to Cart, so the
parent value is what renders — and it is the wrong one. Correct
processing-time metafields on the record do not protect against this: all 38
records read `Ships in 1-2 Weeks` and the parent can still render as
purchasable.

## The three tests

Run on the unpublished preview, desktop and ~375px mobile, on the bare parent
URL with no variant selected **and** on a selected variant.

| # | Test | PASS | FAIL |
| --- | --- | --- | --- |
| 6a | **Availability schema** — view source, find the Product JSON-LD `offers.availability` | `OutOfStock` | `InStock`, or availability absent |
| 6b | **Processing-time display** | The 1-2 week message renders, and renders on the parent as well as on a selected variant | Blank on the parent, or a different lead time, or only appears after selecting a variant |
| 6c | **Add to Cart** | Disabled/unavailable, Notify Me renders in its place | Enabled, or a click adds a line to cart |

6c is the release-critical one: an enabled Add to Cart on an UNLISTED,
DENY, -99 family means a customer with the direct link can order stock that
does not exist.

## Recording

Per record: exact URL, device/viewport, expected, actual, screenshot,
PASS/FAIL. Any FAIL on 6a/6b/6c keeps blocker 6 open and the family stays
UNLISTED regardless of the rest of the preview result.

A theme defect reproduced here needs root cause, changed files, test plan and
rollback on a separate branch — not a fix inside the preview.
