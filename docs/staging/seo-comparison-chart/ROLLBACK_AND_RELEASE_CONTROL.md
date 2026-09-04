# French Fitness comparison article — rollback and release control — REV3

Status: **SHOPIFY STAGING APPLIED / GITHUB DRAFT APPLIED / LIVE WRITE HOLD**

## Controlled resources

- Existing indexed article: `gid://shopify/Article/610344599868`
- Existing handle: `french-fitness-dual-adjustable-pulley-functional-trainers-comparison`
- Existing public URL: `https://www.fitnesssuperstore.com/blogs/comparisons/french-fitness-dual-adjustable-pulley-functional-trainers-comparison`
- Unpublished staging article: `gid://shopify/Article/614721388860`
- Controlling candidate body: `FF_Functional_Trainer_Comparison_CANONICAL_ARTICLE_BODY_REV3_COMPACT_2026-09-04.html`
- Controlling candidate SHA-256: `9f42fb2f88bff6a98bd23a6e86329e6f042fd4fd8d0e25c568c9d1c7a1cd0a3a`
- GitHub draft PR: `https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/785`

## Current decision

The candidate may be reviewed and corrected in staging. It must not be published or merged until:

1. Yusra returns PASS on the exact staging readback.
2. Izza confirms the body-only release method and analytics event binding.
3. A fresh pre-change snapshot of the live article is captured in the same session as the approved live update.
4. The post-write body is read back and its hash/content is compared to the approved candidate.
5. Tim gives separate written approval.

## In-session pre-change backup

Immediately before any approved live update, query Shopify Admin for the live article and save the returned fields verbatim:

```graphql
query LiveComparisonArticleBackup {
  node(id: "gid://shopify/Article/610344599868") {
    ... on Article {
      id
      title
      handle
      body
      summary
      tags
      isPublished
      publishedAt
      updatedAt
      templateSuffix
      author { name }
      blog { id title handle }
    }
  }
}
```

Save together:

- `pre_change_article.json`
- `pre_change_body.html`
- `approved_candidate_body.html`
- UTC capture time
- authenticated operator
- candidate SHA-256
- pre-change SHA-256

A dated snapshot created before the release session is evidence only and is not the final rollback point.

## Approved write scope

The eventual live mutation must be **body-only**. Do not change:

- title
- handle
- blog
- publication state
- publish date
- author
- tags
- summary
- template suffix
- canonical target
- redirects

## Restore procedure

If readback, rendering, links, schema, or analytics fail, restore the saved `pre_change_body.html` verbatim using a body-only `articleUpdate`, then read back the article and confirm:

- handle unchanged
- `isPublished: true`
- public URL resolves
- restored body equals the saved pre-change body
- no redirect or canonical change occurred

## Current live defects not to reintroduce

The current live article contains known issues including:

- unsupported superlative/value claims;
- an unlisted FTS-F1 product link;
- DAP50 described as 1:2 with 200 lb stacks instead of the source-controlled 2:1 and dual 198 lb configuration;
- FFB Black described as upgradeable to 324 lb instead of the source-controlled dual 330 lb option;
- generic or weak comparison language.

## REV3 controls staged

- correct contact CTA: `/pages/contact`;
- one exact article body across attachment, Shopify staging, and GitHub preview;
- six visible FAQs matching six FAQPage entities;
- Article/BlogPosting schema held for rendered-theme confirmation so final release-time dates and duplicate prevention can be verified;
- no H1 inside the article body;
- eight source-controlled product images with alt text;
- descriptive product links and minimum 24 px tap targets;
- model headings nested as H3 under the model-details H2;
- FFB/FFS optional stack upgrade identified as purchase-time only;
- exact FSR110 Light Commercial title;
- analytics data hooks for PDP clicks, CTA clicks, FAQ opens, and table scrolling;
- 32-record evidence universe documented without changing live product tags or collection rules.
