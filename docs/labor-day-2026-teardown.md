# Labor Day 2026 — post-sale teardown (theme side)

The Labor Day sale ran **Sept 1 – Sept 8, 2026** and ended at **11:59:59 p.m. Pacific on
Sept 8**. Both automatic discounts (French Fitness 10%, Remanufactured 5%) were scheduled
in Shopify to expire at that instant; nothing in this repo controls them.

This branch is the theme half of the teardown Tim asked for on Sept 9: *"remove all Labor
Day sale/campaign messaging sitewide … banners, PDP sale messages, cart/checkout notes."*
It is **merge-after-the-sale-ends** work — merging it while the sale is live would pull the
banner and the PDP cards down early.

It is explicitly **not** the production GO for PR #784 or the bounded `custom.retail_price`
deletion. That gate sequence is untouched here.

## What this branch changes

| File | Change |
| --- | --- |
| `sections/header-group.json` | Removes the `labor_day_2026` announcement block (desktop + mobile copy) and its `block_order` entry. The announcement-bar section and its settings stay, so the next campaign just adds a block. |
| `sections/announcement-bar.liquid` | Retires the `laborday_start/_end` date gate that wrapped the whole utility bar and replaces it with a campaign-agnostic content gate. |
| `config/settings_data.json` | Blanks `sale_promo_ff` and `sale_promo_reman`. |
| `config/settings_schema.json` | Blanks the Labor Day copy baked into those two settings' defaults. |
| `snippets/labor-day-sale-note.liquid` | Comment only — records the off-state and why the machinery is retained. |

### Why blank the settings rather than delete the snippet

`sale_promo_ff` / `sale_promo_reman` are the snippet's documented per-branch kill switches:
blank means `campaign_kind` never gets set and the card is skipped. That is a stronger off
switch than the date window, because the window is bypassed by `request.design_mode` and
`settings.laborday_force_preview` — so with the dates alone the expired Labor Day card
would still have rendered inside the Customizer. Blank settings close both paths.

The snippet, its eight `{% render %}` calls across the four product templates, the
`.campaign-sale-container` / `.labor-day-sale-card` CSS, and the two `LaborDaySaleCard`
refresh hooks in `assets/product-info.js` are all left in place. They are the reusable
card, not the campaign; PR #784 was approved on the condition that both refresh hooks are
preserved, and the September overstock work (#823/#825) builds on the same card.

### Why the announcement-bar gate had to go, not just the block

The date gate wrapped the entire `.utility-bar`, on the reasoning that the Labor Day
announcement was the section's only content. With the block removed, a lapsed sale window
would have silently swallowed the *next* announcement anyone adds in the Customizer. The
replacement renders the bar whenever the section actually has an announcement block, a
locale selector or social icons — and keeps an empty orange strip from painting when it has
none.

## Turning the card back on for a future campaign

1. Fill `sale_promo_ff` and/or `sale_promo_reman` (any non-blank value; the text is not
   displayed, the payoff line is computed in Liquid).
2. Set `laborday_start` / `laborday_end` to the new window, with UTC offsets.
   `laborday_end` is **exclusive** — set it to midnight after the last selling day.
3. Add an announcement block in the Customizer. Mobile copy has a measured ~45-character
   budget (PR #758) before it wraps off its single centered line.
4. The badge still reads "Labor day sale" — retitle it for the new campaign.

## Not covered by this branch

These are live-system actions, not theme code, and stay with their owners:

- **Reactivating the 8 percentage discount codes** — `10forever`, `only20now`, `special8`,
  `9bulkoff`, `5pct`, `5secret`, `5secretbkup`, `10bulkdiscount` (Shopify admin).
- **Confirming the two automatic cart discounts are off** (Shopify admin).
- **FrenchFitness.com** — a separate storefront; its campaign messaging is not in this repo.
- **Klaviyo** — any remaining scheduled or flow-embedded Labor Day sends.
- **Post-sale verification** — messaging gone, fake MSRP still absent, plain official prices
  correct on both sites, PDP selling price still matching the Google feed price.
