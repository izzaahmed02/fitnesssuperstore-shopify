# September Overstock Sale 2026 — theme messaging

Covers the theme side of the offer Tim approved on Sept 8: **10% off exactly 16
French Fitness products, applied automatically at checkout, through Sept. 30,
2026 (11:59:59 p.m. PT)**. Prices, SKUs, inventory, tags, collections, feeds and
Google Ads are out of scope here — this repository only renders the messaging.

## What is in the theme

| File | Purpose |
| --- | --- |
| `snippets/september-overstock-sale-note.liquid` | PDP cart-price card for the 16 approved product IDs. Cherry-picked unchanged from PR #823 (`803e33e`). |
| `snippets/labor-day-sale-note.liquid` | Selects the September card for those products, otherwise falls through to the existing (now silent) Labor Day body. Cherry-picked unchanged from PR #823 (`b02a8ec`). |
| `sections/announcement-bar.liquid` | New, campaign-agnostic per-block `promo_start` / `promo_end` window. |
| `sections/header-group.json` | The `september_overstock_2026` announcement block and its window. |
| `scripts/announcement_window_test.py` | Regression test for the window logic. |

The Labor Day teardown (PR #826) is preserved in full: `sale_promo_ff` and
`sale_promo_reman` stay blank, so the fallback branch still renders nothing.

## Source of truth for the 16 products

`gid://shopify/DiscountAutomaticNode/1741840056636` — "September Overstock Sale —
10% Off Select French Fitness Products", ACTIVE, 10%, `startsAt`
2026-09-08T07:00:00Z, `endsAt` 2026-10-01T06:59:59Z, all three `combinesWith`
flags false. Read back from live Shopify on 2026-09-10; its 16 product IDs match
the snippet allowlist exactly, including FFS-HAA (9878600319292). Re-verify with
the Admin API before changing the allowlist — never edit it from a spreadsheet.

## Announcement bar

Desktop copy (Tim's wording, verbatim):

> September Overstock Sale — 10% off select French Fitness products —
> Automatically applied at checkout — Through Sept. 30, 2026, while supplies last.

Mobile copy: `September Overstock — 10% Off — Sept. 30`.

The mobile bar is tuned to a single centered line; `sections/announcement-bar.liquid`
documents the budget (~300px rendered at a 320px viewport, 316px available).
Measured in Chromium at real Lato 700 14px with the section's own
`letter-spacing: 0.2px`, normalised against the documented 299px Labor Day
baseline:

| String | Est. rendered | Headroom |
| --- | --- | --- |
| `Labor Day Sale — Up to 10% Off — Ends Sept. 8` (shipped baseline) | 299.0px | 17.0px |
| `September Overstock — 10% Off — Ends Sept. 30` (first draft) | 309.6px | 6.4px |
| **`September Overstock — 10% Off — Sept. 30` (shipped)** | **274.1px** | **41.9px** |

The first draft fits on paper but left only ~6px, so the shorter string was taken.
This is a bench estimate, not a device measurement — Yusra's mobile pass is still
the acceptance evidence.

**Link destination is deliberately blank.** The July collection
(`519603880252`, "French Fitness Summer Overstock Sale") has 0 products and 0
publications and its public URL 404s, so it must not be used. No published
collection contains exactly the 16, and creating or publishing one is a live-store
change nobody has authorized. Options for Tim: leave it unlinked, point it at the
published `/collections/french-fitness` (verified live, but 1,375 products, only 16
of them discounted), or authorize a new 16-product published collection.

## Why the window lives on the block

Labor Day 2026 wrapped the whole section in a `settings.laborday_start/_end` gate.
PR #826 retired that because a lapsed campaign window would have swallowed the
*next* announcement anyone added in the Customizer. The replacement is per block
and campaign-neutral: any announcement block may carry `promo_start` / `promo_end`
(ISO 8601 with UTC offset); blank means always on, so every existing block is
unaffected.

`promo_end` is exclusive, and there is **no `request.design_mode` bypass** — the
Labor Day card shipped one and an expired campaign kept rendering inside the theme
editor. The block and its settings stay editable in the editor sidebar; only the
rendered copy is withheld. To rehearse a future window, move `promo_start`.

`promo_end` is set to `2026-09-30T23:59:59-07:00`, matching the PDP card's own
end constant. That is one second before the discount's `endsAt`, so the messaging
can never outlive the discount.

## Verifying expiry

```
pip install python-liquid
python3 scripts/announcement_window_test.py
```

It extracts the shipped preamble from `sections/announcement-bar.liquid`, injects a
clock, and asserts the block is hidden before Sept 8, visible from the first
instant through 23:59:58 on Sept 30, hidden at 23:59:59 and after, and that an
undated evergreen block is never affected. This is what makes October 1 removal
automatic rather than a calendar reminder — Saliha's PDP description callouts are
separate and still need their own Oct 1 handling.

## Rollback

Revert this branch's four files. Do not republish an older whole-theme snapshot,
and do not deactivate the Shopify discount as a UI rollback — the discount is the
offer, the theme is only the message.
