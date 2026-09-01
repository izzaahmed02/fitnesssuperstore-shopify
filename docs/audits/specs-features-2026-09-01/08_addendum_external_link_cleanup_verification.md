# 08 — Addendum: verification of the closed external-link (`target="_blank"`) item

Not part of Tim's seven-item request. Produced while re-reading the thread's own attachments, because
the audit packet is being posted into a thread whose earlier item was declared closed on 2026-08-16.

Captured 2026-09-01.

---

## Why this addendum exists

The thread's confirmations were checked against the CSVs actually attached to it, rather than against
the summary sentences in the message bodies. One gap and one live exception came out of that.

## 1. The comparison-chart confirmation holds

`custom_search_all.csv` attached to the 2026-03-22 message: **17 comparison-chart URLs, all HTTP 200,
all `target_blank = 0`.** The claim made that day is fully supported by its own attachment.

## 2. The blog confirmation was based on a partial re-crawl

Two blog crawls are attached to this thread:

| Crawl | Attached to | URLs | URLs with instances | Total instances |
|---|---|---|---|---|
| Before | 2026-03-31 | 86 | 47 | 376 |
| After | 2026-04-05 | **49** | 0 | 0 |

Cross-referencing the two by URL:

- 47 blog posts had `target="_blank"` on 2026-03-31.
- **32** of them appear in the 2026-04-05 crawl and were confirmed clean.
- **15** of them do not appear in the 2026-04-05 crawl at all.
- Those 15 carried **207 of the 376 instances — 55% of the total.**
- The 2026-04-05 crawl contains no URL that was absent from the 2026-03-31 crawl, so it is a strict
  subset, not a re-scope.

So the 2026-04-05 message "all blog posts are fixed … Target Bulk = 0 across all crawled blog pages"
was accurate about *what was crawled*, but what was crawled was 49 of the 86 known blog URLs. The
remaining 15 broken posts were never re-verified in this thread.

## 3. Current state of those 15 — all clean

Re-checked 2026-09-01 against `Article.body` via the Admin API (authoritative source; the storefront
is not reachable from the audit environment):

**All 15 now contain zero `target="_blank"`.** Saliha's 2026-05-02 Matrixify pass over blog posts
evidently picked them up. No action needed on those 15 — but note the cleanup that closed them was
never verified in-thread, it is being verified here for the first time.

## 4. One published blog post still has `target="_blank"` today

Full sweep of **all 84 articles** in the store:

| | |
|---|---|
| Articles scanned | 84 |
| Articles with `target="_blank"` in body | **1** |
| Total occurrences | **3** |

```
/blogs/buying-guides/rom-4-minute-workout-machine-history-original-identification
  Article ID: gid://shopify/Article/614352257340
  Published: yes
  3 anchors, all pointing at the same file:
    https://fitnesssuperstore.info/pdfs/ROM 4 Minute Workout Crosstrainer Time Machine Assembly Manual.pdf
  Link text: "original assembly manual" / "original assembly instructions" / "original manual"
  All three carry a rel attribute.
```

This URL appears in **neither** crawl — the post postdates both. It also postdates the 2026-03-31
instruction to James that future posts must not add `target="_blank"`.

**This needs a decision, not a silent fix.** All three links are to a PDF on `fitnesssuperstore.info`,
a different domain. Teams commonly keep `target="_blank"` for off-site PDFs, so this may be a
deliberate and reasonable exception rather than a miss. Izza set the "same tab unless…" rule and
should say which it is. No change has been made.

## 5. Suggested follow-ups

1. Izza to rule on the ROM article: exception for off-site PDFs, or bring it in line with the rule.
2. If the rule admits no exception, the 3 anchors are a one-post edit.
3. Worth a standing check: both crawls in this thread were manual, partial URL lists. A scheduled
   full-property Screaming Frog crawl for `target="_blank"` would have caught both the 15-post gap
   and this post.

## Method

- Attachments extracted from the thread's raw MIME and parsed directly; the two `custom_search_all.csv`
  files were compared row-by-row on the `Address` column.
- Article bodies pulled via Admin GraphQL `bulkOperationRunQuery` over `articles { body }`
  (BulkOperation/7725060948284, 84 objects), then matched with `target\s*=\s*["']?_blank`.
- The storefront itself could not be fetched: the audit environment's network policy returns 403 on
  CONNECT to `www.fitnesssuperstore.com`. Article body HTML from the Admin API was used instead, which
  is the source Matrixify edits and is not affected by theme-level rendering.
