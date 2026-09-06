# Comparison article — REV4 release and rollback control — 2026-09-06

Status: STAGING CORRECTIONS APPLIED / LIVE PUBLICATION HOLD.

## Identity
Live article: gid://shopify/Article/610344599868.
Staging article: gid://shopify/Article/614721388860.
Live handle: french-fitness-dual-adjustable-pulley-functional-trainers-comparison.
Blog: comparisons, gid://shopify/Blog/118825615676.
Candidate: FF_Comparison_Article_Body_REV4_2026-09-06.html.
Candidate SHA-256 before Shopify serialization: d3a73e0e1fa02d70d12b2ce6a9e916b8163f96218dbcf048f93bab9c008fbbd9.
PR: https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/785.

## Gates in order
1. Resolve DAP50 equipment-weight and Telluride stack conflicts from an approved source, or retain the explicit nonnumeric omissions for Tim's acceptance. Do not silently prefer the favorable value.
2. Yusra returns delta PASS on the exact final staging body/PR; preserve her unchanged REV3 PASS evidence instead of repeating the entire project.
3. Izza confirms real Shopify rendering, one appropriate native Article/BlogPosting entity, working links/images and analytics binding. Data attributes and static source inspection alone are insufficient.
4. Tim gives separate written live GO naming the exact candidate/version. No publication is authorized by this document.
5. Only after GO, capture a fresh live-article snapshot in the SAME session immediately before the body-only update.
6. Execute the approved body-only update, read back it and all unchanged identity fields, verify rendered output, and restore on failure.

## Fresh backup at release time
Read and save verbatim: id, title, handle, body, summary, tags, isPublished, publishedAt, updatedAt, templateSuffix, author and blog identity.
Save pre_change_article.json, pre_change_body.html, approved_candidate_body.html, capture UTC time, named operator, pre-change SHA-256 and candidate SHA-256.
Read updatedAt/body again before the write; stop if another editor changed the article since the snapshot.
A snapshot from this staging run or a previous day is NOT the final rollback point.

## Eventual approved live scope
BODY ONLY on Article/610344599868.
Preserve title, handle, blog, publication state/date, author, tags, summary, templateSuffix and canonical/redirect behavior.
Do not publish the separate staging article. Do not copy preview-only noindex controls to the live body.
No collection, product, price, inventory, feed, shared-theme, metaobject or customer-data mutation.

## Restore
On content mismatch, rendering failure, broken critical links, structured-data conflict or required analytics failure, restore pre_change_body.html verbatim via body-only articleUpdate.
Read back restored body, unchanged handle/blog, isPublished=true and canonical/public URL. Report the rollback and exact failed gate in the canonical Gmail thread/PR.
Restoring the old body is emergency rollback, not acceptance of the old article's known content defects.

## Rendered-schema check already narrowed
main-article.liquid on the repository's current main branch contains article | structured_data. Do not add duplicate article schema to the body.
Inspect the deployed preview's actual output and identify the emitting file/app, entity count, headline, canonical/mainEntityOfPage, author, image, original datePublished and actual updated dateModified. The body-only scope preserves the live title and original publication date.
If live output needs shared-theme/app changes, propose a bounded preview-only diff and approval gate; do not smuggle it into a body-only release.

## Analytics acceptance
Use the existing consent-aware analytics/GTM layer. Do not insert a second uncontrolled tracker.
- comparison_pdp_click: sku, model_family, row_position, surface; table and card clicks separately attributable.
- comparison_cta_click: final_contact_cta surface.
- comparison_faq_open: question and faq_section surface.
- comparison_table_scroll: first horizontal scroll, once per page view.
Check whether existing scroll-depth tracking already exists before adding 25/50/75/100%.
Provide actual test event receipts and deduplication evidence; HTML data hooks alone do not prove events fire.

## Evidence boundaries
New local screenshots are simulated-wrapper structural tests with remote image requests blocked, not screenshots of the authenticated Shopify theme. The latest two incoming PNG attachments could not be decoded by the Gmail attachment reader; the accompanying REQA_REV3_PASS.md was opened and reviewed.
