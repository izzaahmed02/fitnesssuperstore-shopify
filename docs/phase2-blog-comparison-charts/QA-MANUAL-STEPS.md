# Manual steps — the parts I could not run from here

## A. Finish the #748 delta QA (the three toggles + interactive search) — ~15 min

Head under test: `c5865fb7cdd217e0eb5a74e4fdb5b9da6633893c`.
Preview theme: **188015313212** (already byte-identical to that head — verified).

**Do not Save at any point.** The theme editor previews unsaved setting changes live,
so the toggles can be exercised without writing `templates/page.blog.json` and
re-breaking the byte-parity #843 closed.

1. Shopify admin → Online Store → Themes → find `fitnesssuperstore-shopify/claude/blog-closeout-…`
   (ID 188015313212) → **Customize**.
2. In the top page selector choose **Pages → Blog** (`/pages/blog`).
3. Select the **Search Blog Articles** section (`main-blog-search`) in the left panel.
4. Run these eight combinations. After each, use the preview pane (and browser
   View Source on the preview URL for the "no image URL at all" check):

   | Show Image | Show Author | Show Date | Expect |
   |---|---|---|---|
   | on | on | on | full card: thumbnail, author line, date |
   | off | on | on | **no thumbnail and no image URL anywhere in the page source** |
   | on | off | on | no author line |
   | on | on | off | no date displayed (the date value stays in the data block — ordering needs it; that is expected) |
   | off | off | on | title, excerpt, date only |
   | off | on | off | title, excerpt, author only |
   | on | off | off | title, excerpt, thumbnail only |
   | off | off | off | **clean title-and-excerpt card** |

   Screenshot at least: all-on, all-off, and Show Image off with View Source showing
   no image URL.

5. Interactive search, with all three toggles back **on**:
   - **Positive:** type `treadmill` → results appear, capped, each linked, thumbnails lazy-load.
   - **Zero-result:** type `zzzzqqq` → "No articles found." appears *inside* the
     aria-live region, and is announced. Confirm it was not in the page source before typing.
   - **Tag-only:** type a term that exists only in tags, e.g. `QuickGym` (tag on the ROM
     article, not in its title) → the ROM article returns. This proves tag scope.
   - **Keyboard:** Tab to the search input → visible focus ring; results region reachable.
6. Post PASS or HOLD in the thread with those screenshots.

If anything fails, it is a #748 defect, not a data issue — goes to Waqas.

## B. Precor duplicate — traffic and backlink split (Semrush is out of API units)

Tim asked which of the two URLs carries the traffic and backlinks:

- `/pages/precor-amt-model-comparison-chart-what-is-open-stride`
- `/pages/precor-elliptical-comparison-chart`

**Google Search Console** → Performance → Search results → Pages → filter by URL
containing `precor-amt-model` then `precor-elliptical-comparison`. Compare clicks and
impressions over the last 12 months. Export both.

**Bing Webmaster Tools** → Search Performance → Pages → same two filters.

**Semrush** (UI, no API units needed) → Backlink Analytics → enter each URL → Indexed
Pages / Backlinks. Or Site Explorer → Organic Research → Pages, filter by the slug.

Whichever URL holds the traffic and links is the one to keep. My recommendation stands
either way: the elliptical page should be **repopulated with real EFX models**, not
retired, because it is mispopulated rather than redundant.

## C. AEO item 7 — Bing indexation of the two hub pages

I cannot reach Bing Webmaster Tools from here (no API access in this session).

1. bing.com/webmasters → select fitnesssuperstore.com.
2. **URL Inspection** → check each:
   - `https://www.fitnesssuperstore.com/pages/blog`
   - `https://www.fitnesssuperstore.com/pages/comparison-charts`
3. If either shows "URL is not indexed", click **Request indexing** (Submit URL).
4. Screenshot both inspection results for the thread. This matters because ChatGPT
   search pulls from the Bing index.

While in there, Site Explorer will also show whether the 48 `/pages/*-comparison-chart`
URLs are indexed — worth a note to Tim if a large share are missing.

## D. "Arc: llms.txt" app

An app by that name is installed. Before Waqas builds the native
`templates/llms.txt.liquid`, open it in the admin and confirm whether it is serving or
intercepting `/llms.txt`. Today the route returns Shopify's managed default, so the app
appears inactive, but two mechanisms on one route is worth ruling out first.
