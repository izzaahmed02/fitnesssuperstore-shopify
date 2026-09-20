# FF-WMR20 — scoped review-display fix (PR #872) — QA record

Date: 2026-09-20
Workstream thread: "WMR20 Product Images Request – FF-WMR20"
Authorization: Tim, 2026-09-20 15:30 UTC — GO on the scoped reviews-display fix for
FF-WMR20 only, with the revert condition "any other PDP's review display changes,
revert immediately."

## Change

One file added: `templates/product.wmr20.json`, cloned byte-for-byte from the current
`templates/product.json` with a single setting changed on the Judge.me review widget
app block (`judge_me_reviews_review_widget_FRUE8Y`):

    "empty_state": "other_products_reviews"   ->   "empty_state": "empty_widget"

No Liquid, CSS, JS, section, or snippet was touched. No existing template was edited.

- PR: #872 "Fix WMR20 empty review state only"
- Head SHA: 9eea89453ecb411987869f088b05769f1ad58395 (1 commit, 1 file, +331/-0)
- Merged to `main` at 2026-09-20 20:31:32 UTC as dddf05fc63d856d0ec6fcb3460f6d4e4e8859834

## Verified (Admin API reads, 2026-09-20)

1. Product assignment — product 10378837819708 (FF-WMR20), status ACTIVE,
   `templateSuffix: "wmr20"`, so the PDP renders from the new template.
2. Live theme carries the change — theme `fitnesssuperstore-shopify/main`
   (gid 186120208700, role MAIN) has `templates/product.wmr20.json`,
   updatedAt 2026-09-20 20:31:38 UTC, md5 8371c05592bbb252614fa9595e02d0ce,
   containing `"empty_state": "empty_widget"`.
3. Blast radius — `templates/product.json` on the same live theme is unchanged:
   updatedAt 2026-09-05 21:07:15 UTC, md5 5c2ed2ea9bccc52eda762da893ffcf56, still
   `"empty_state": "other_products_reviews"`. Every PDP other than FF-WMR20 continues
   to use it, so no other product's review display is affected.

## Not verified — outstanding

- No preview-theme before/after browser screenshots were captured. PR #872 was merged
  to `main` (the live theme branch) directly, so the preview-first sequencing in the
  GO was not followed.
- No live incognito browser screenshot of the PDP review area. The storefront host is
  blocked by this environment's network egress policy, so the screenshot has to be
  taken outside this environment before the fix is claimed done.

## Related observation (product-side, not this change)

FF-WMR20 has a single variant (SKU FF-WMR20, $599.00) and one option, `Title /
Default Title`. The two defects Larianne raised on 2026-09-20 — product options
missing from the PDP and "As high as" price not displaying — are consistent with that
product-side configuration rather than with theme code: both surfaces need real
options/variants with a price range to render.
