# Orphaned Pages — Status Check & Zafran's Open-Item Analysis

**Thread:** "Orphaned Pages - 29 Apr"
**Reviewed:** 2026-07-20
**Verified against:** the full email thread (through 2026-07-14), Shopify Admin API (live store), and Semrush (Site Audit project `www.fitnesssuperstore.com` + backlink/organic data).

---

## Where the project actually stands

This is a mature, team-led cleanup that is **nearly closed**, not a fresh task. Per Tim's 2026-07-12 status and Saliha's 2026-07-13 completion note, the following are **done and verified in Shopify**:

- Redirects closed (single 301, no chains): Precor Reman → Precor · TRUE Reman → TRUE Fitness · SportsArt New → SportsArt · Freeweight Gyms & French Fitness Freeweight Gyms → Multi Functional Squat Rack Systems · French Fitness Cable/Cross-Functional Trainers → French Fitness Selectorized Cable Cross-Functional Trainers.
- `gym-systems` recalculated to 181 products and confirmed a true superset of `resistance-based-gym-systems`.
- `seo.hidden = 1` confirmed on all 6 junk collections + 3 pages (removed from sitemap.xml, noindex/nofollow), pages remain published — **independently confirmed here** via the Admin API.
- Josh's Klaviyo audit reviewed; no action required.

**Agreed baseline for the final audit:** 1,072 orphaned sitemap pages · 470 one-internal-link pages. (Current Semrush snapshot 2026-07-18: 1,058 orphaned / 459 one-link — moving in the right direction.)

**Remaining gates before the final Semrush crawl (from Tim, 2026-07-14):**
1. **Zafran** — GSC/backlink decisions on `resistance-based-gym-systems` and the Alabama page (analysis below).
2. **Izza / Larianne** — `templates/page.categories.json` stale-reference check (still lists `freeweight-gyms` + `resistance-based-gym-systems`). Auto-generated file → must be fixed via Shopify Theme Editor and synced back, **not** hand-edited in GitHub.
3. **Site-access owner** — final visual spot-check of the live `sitemap.xml`.

---

## Zafran's open item — data + recommendation

Tim asked for the GSC/backlink review on two URLs, sent together. Semrush data below; **GSC clicks/impressions should be confirmed in Google Search Console before finalizing** (that's the one signal not available here).

### 1. `/collections/resistance-based-gym-systems` → **Recommend: KEEP + improve + internal-link (do not redirect)**

- **Backlinks:** none found to this URL (Semrush URL-level: nothing found). So no link-equity loss risk either way.
- **Organic rankings (Semrush, US):** the page holds **real, independent page-1/2 rankings**, including:
  - `resistance home gym` — **#6** (vol 90)
  - `resistance gym` — **#12** (vol 140)
  - `resistance training machine` — #16 (vol 50)
  - `home gym resistance` — #6 (vol 30)
  - `resistance machines for home` — #25 (vol 70), `home gym resistance machines` — #26 (vol 40), plus a long tail of 40–80 positions.
- **Why keep:** Tim's own rule says a page with meaningful independent rankings should be kept and internally linked rather than redirected. Folding it into the broad `gym-systems` page risks losing the specific "resistance …" rankings, since `gym-systems` doesn't target those terms. Estimated traffic is modest, so **confirm GSC clicks/impressions**; if GSC also shows ~zero clicks/impressions over 3–6 months, consolidation into `gym-systems` (single 301) becomes acceptable.

### 2. `/pages/fitness-equipment-alabama` → **Recommend: DELETE (do not redirect to homepage)**

- **Backlinks:** none found. **Organic rankings:** none found. Page is currently **empty** (per Tim).
- **Why delete:** no search value, no links, no content — matches Tim's "no value → delete, do not redirect generically to the homepage." Keep it out of the index either way. Only retain (noindexed) if the team commits to writing genuine Alabama service-area content; otherwise deleting is the clean close.

---

## Note on scope / theme changes

No theme code changes are included here. The `page.categories.json` stale-reference cleanup is assigned to Izza/Larianne and must go through the Shopify Theme Editor → GitHub sync per Tim's instruction (the file is auto-generated). A footer/sitemap "Product Index hub" internal-linking idea was considered to help the ~1,034 orphaned products, but it is **not** part of the team's agreed plan and would change the theme outside their process right before the final audit — so it was not pursued. It can be proposed separately after the final crawl if the orphan count needs further reduction.

**Reference file:** `docs/seo/orphaned_sitemap_pages_current_20260720.csv` — current Semrush export of all 1,058 orphaned sitemap URLs (1,034 products, 14 collections, 9 pages).

---

*Internal analysis for the Fitness Superstore SEO cleanup. Semrush figures are estimates; confirm GSC clicks/impressions before finalizing the two decisions. No live-store or theme changes were made as part of this review.*
