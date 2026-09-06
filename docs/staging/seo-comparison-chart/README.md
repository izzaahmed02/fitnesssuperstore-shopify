# French Fitness comparison preview — REV4 — 2026-09-06

Status: UNPUBLISHED STAGING / DRAFT PR / HUMAN LIVE APPROVAL REQUIRED.

## Controlled resources
- Canonical Gmail thread: SEO Recommendation for Comparison Chart Pages; thread 19b948af4337601c.
- PR: https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/785
- Branch: chatgpt/seo-comparison-chart-preview-2026-09-03
- Staging article: gid://shopify/Article/614721388860
- Existing indexed article: gid://shopify/Article/610344599868
- Existing URL: https://www.fitnesssuperstore.com/blogs/comparisons/french-fitness-dual-adjustable-pulley-functional-trainers-comparison
- Controlling body: preview.html (same content as FF_Comparison_Article_Body_REV4_2026-09-06.html attached in Gmail).
- Body SHA-256 before Shopify serialization: d3a73e0e1fa02d70d12b2ce6a9e916b8163f96218dbcf048f93bab9c008fbbd9
- Workbook: FF_Comparison_Source_Lock_REV4_2026-09-06.xlsx, attached in the canonical thread.

## Accepted baseline, not a restart
Yusra's September 6 REQA_REV3_PASS.md reports PASS on REV3 head 7f15af25d8ef1c7efa02add0429c706a2fc61df8. Preserve that report as evidence for the version it reviewed; it is not independent approval of the REV4 changes.

The 32-record evidence universe remains 29 automated-collection records plus three active legacy-tagged records outside it. Eight comparison rows cover nine active products. FSR90 is selected outside the collection; FSR100 and FF-WMDCCC have non-selected dispositions. No tags, collection rules or product records were changed. Unchanged source dates remain historical baseline dates rather than being relabeled as newly verified.

## REV4 delta
1. Restore equipment-weight and integrated-function text in model cards without widening the six-column table.
2. Add only supported numeric equipment weights. DAP50 weight is withheld because its current source says 646 lb (283 kg), inconsistent units. The two wall-mounted weights remain not stated.
3. Withhold Telluride stack quantity and derived effective resistance: weight_stacks/visible FAQ say 200 lb per side, but embedded FAQ JSON-LD says 140 lb. Keep the documented 2:1 ratio.
4. Scope every article CSS selector to .ffc, replace the nested main with div, and prefix in-page IDs with ffc-.
5. Align workbook, body and release documentation to REV4; preserve original files/history.
6. Retain eight images/alt text, six matching visible FAQ/schema questions, correct /pages/contact CTA and four non-executing analytics hooks.

## Technical work already researched
Current main-branch sections/main-article.liquid emits article | structured_data, supplies the H1, and renders through clean-description and rte-image-dimensions. clean-description preserves non-legacy scripts. Do not paste a second Article/BlogPosting entity into this body. This is repository-source inspection, not proof of the deployed theme's actual rendered output.

Analytics data attributes are not functioning analytics by themselves. The existing sitewide/GTM layer must bind them and show deduplicated events in the approved test environment before production approval.

## Remaining work — Tuesday September 8, 2026, Pacific Time
- Larianne, 11:00 AM: give an approved source for only the DAP50 weight and Telluride stack conflicts, or confirm they remain unresolved. No SEO assignment or guessed conversion.
- Izza, 12:00 PM: inspect actual Shopify preview, rendered native Article/BlogPosting output, analytics binding and body-only release/rollback method. No new branch or broad audit.
- Yusra, 1:00 PM: delta-only PASS/HOLD for card additions, withheld fields, scoped CSS/IDs, normalized Shopify/GitHub equivalence and actual mobile rendering. Carry forward unchanged REV3 checks where valid.
- Umer/Control Tower: monitor these existing-thread checkpoints and exceptions only.

## Test boundaries
Local Chromium structural QA used simulated theme wrappers at 375/768/1280 px. At 375: document width 375; table 1080; wrapper 353; minimum interactive height 46.8 px. Remote images were blocked in the local fixture. This does not verify product-image delivery, actual Shopify theme rendering, analytics transmission or an external structured-data validator. Yusra's prior 47 px / 351 px measurements belong to her distinct REV3 environment; they are not contradicted by local dimensions.

## Publication and merge hold
This remains a draft PR; no runtime theme files are changed. No publication, live body update, merge, force-push, rebase, redirect, indexing, tag, collection or product-data change is authorized. GitHub reported mergeable=false during review; Izza must inspect conflicts before any separately approved merge. Do not bypass protections.

See ROLLBACK_AND_RELEASE_CONTROL.md. Final Tim approval must identify the exact approved candidate and expressly resolve or accept omission of any remaining disputed fields.
