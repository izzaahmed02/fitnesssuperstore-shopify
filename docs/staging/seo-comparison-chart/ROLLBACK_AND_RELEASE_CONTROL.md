# Comparison article — rollback and release control — REV5 — 2026-09-09

Status: STAGING ONLY. NO LIVE PUBLICATION OR MERGE AUTHORIZED.

## Resources
- Live article: gid://shopify/Article/610344599868
- Live handle: french-fitness-dual-adjustable-pulley-functional-trainers-comparison
- Live URL: https://www.fitnesssuperstore.com/blogs/comparisons/french-fitness-dual-adjustable-pulley-functional-trainers-comparison
- Existing unpublished article: gid://shopify/Article/614721388860
- Candidate: docs/staging/seo-comparison-chart/preview.html
- Candidate SHA-256: cdcfe0bb2ffc9e20334e3750645a7cc3547f92f8d5fdf1d9360d031421b40594
- PR: https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/785

## Release gates — all required before a live mutation
1. Exact candidate and source-lock workbook agree. DAP50 technical weight and Telluride stack configuration follow September 9 source resolution. Telluride equipment weight remains omitted until resolved or explicitly accepted as an omission.
2. Yusra returns delta PASS on the exact candidate/readbacks. Carry forward valid unchanged checks; do not substitute an older full-document PASS for changed fields.
3. Izza verifies actual deployed-template rendering, images, mobile behavior, native Article/BlogPosting output, consent-aware analytics test receipts and deduplication.
4. Tim completes source-applicability clearance and gives separate written GO for the exact body version, scope and unresolved-field disposition.
5. After that approval, capture the current live article in the same session immediately before the live write. A historical export is evidence, not the final restore point.

## In-session snapshot
Read and preserve the live article's id, title, handle, body, summary, tags, isPublished, publishedAt, updatedAt, templateSuffix, author and blog. Save:
- pre_change_article.json
- pre_change_body.html
- approved_candidate_body.html
- UTC capture time and authenticated operator
- SHA-256 for both bodies
- exact approval reference and preflight PASS

If the current live article or approved candidate has changed since approval, STOP and reconcile the new difference. Do not overwrite another person's work.

## Write boundary
The approved live operation must update BODY ONLY on Article/610344599868. Do not publish the staging article as a second destination.
Preserve title, handle, blog, publication state/date, author, tags, summary, template suffix, canonical and redirects.
Do not change products, metafields, collection rules, stock, pricing, feed, theme or tracking configuration under a body-only approval.

## Post-write and rollback
Immediately read back the live article and compare body content/structure with the approved candidate, allowing only documented harmless Shopify serialization.
Verify the unchanged URL/handle/publication state, one page H1, intended native Article/BlogPosting entity, matching visible FAQ/schema, images, exact PDP/contact links, mobile layout and analytics.
If a release test fails, restore pre_change_body.html verbatim using a body-only article update; read it back, confirm restored content, unchanged handle and working URL, and report HOLD in the canonical thread.
Preserve failed-candidate evidence and actual readbacks. Do not claim that restoring body text restores Shopify's updatedAt timestamp.
Keep the draft PR unmerged until its own approval; a documentation PR merge is not a Shopify release.

## Evidence boundary
Use the recipient-safe technical source excerpt. Do not attach raw supplier invoices, commercial terms, banking details, broad receiving inventories or unrelated private data to release emails or PRs.
No new paid research or duplicate tracker is authorized.
