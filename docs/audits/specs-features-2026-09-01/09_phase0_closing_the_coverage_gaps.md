# 09 — Phase 0: closing the three coverage gaps

Supersedes the "Known limits" section of `00_README_audit_packet.md` and §4 of
`02_dependency_reference_map.md`. Updated 2026-09-01.

---

## Corrections to the earlier packet

**1. The installed-app gap was not real.** The packet said `appInstallations` returned
`access denied`. Re-run on 2026-09-01, it returns cleanly, including `accessScopes`. The original
failure was a single transient error in a combined query and I recorded it as a permanent limit
without retrying it. **This gap is now closed — see section A below.**

**2. The non-live theme count was wrong.** The packet said "19 non-live themes". That figure came
from a query that requested only the first 20 themes. The store actually has **80 themes: 1 MAIN,
2 DEVELOPMENT, 77 UNPUBLISHED — 79 non-live.** This matters, because a 79-theme manual check is not
realistic and should be scripted (section C).

Only the Shopify Flow gap (section B) is genuinely manual.

---

## A. Installed apps — CLOSED

47 apps are installed. `custom.features_specs` is a product metafield pointing at a metaobject, so an
app can only reach its content with **`read_metaobjects`** (the metaobject values) and generally
`read_products` (to walk from product to metafield). Filtering the 47 by `read_metaobjects` gives
**20 apps** that could read this data:

| App | Notes |
|---|---|
| Matrixify | read + **write**. Known: Saliha's bulk edits ran through it. |
| Search & Discovery | read + write. Shopify first-party. |
| Boost AI Search & Filter | read. Present in the theme. |
| Multifeeds | read. Product feed generator — most likely to surface specs in feeds. |
| Sitemaps Generator | read + write. |
| Combined Listings | read + write. Used by `product.combined-listings.json`. |
| French Fitness | read + write. Own custom app. |
| FS-FF Catalog Sync (read) | read-only catalogue sync. |
| Custom App | read + write. |
| AttributePro | read + write. Product-attribute metaobjects. |
| Knowledge Base | read + write. |
| Checkout Blocks | read + write. |
| Translate & Adapt | read + write. |
| Judge.me Reviews | read. |
| Draft Order Magic | read + write. |
| Make integration | read. Automation platform — treat like Flow. |
| n8n | read. Automation platform — treat like Flow. |
| Shopify GraphiQL App | read + write. Ad-hoc queries. |
| Shopify ChatGPT MCP App | read + write. |
| Shopify Claude Connector App | read + write. |

The other 27 apps lack `read_metaobjects` and cannot read the entry contents.

**What this does and does not prove.** It proves which apps *could* read `specs_features`. It does
not prove which ones *do* — a scope is a capability, not usage. Before anything is archived, the
short list worth an actual answer is the ones that would visibly break or silently drop content:
**Multifeeds** (product feeds), **Boost AI Search & Filter** (on-site search/filter), **Combined
Listings**, **FS-FF Catalog Sync**, and the two automation platforms **Make** and **n8n**.

To confirm usage per app: Shopify admin → **Settings → Apps and sales channels** → click the app →
open its own dashboard and check its field mapping / template configuration for `features_specs` or
"Specs & features". For Multifeeds specifically, check each feed's attribute mapping. For Make and
n8n, see section B — the same scenario/workflow review applies.

## B. Shopify Flow and the automation platforms — still manual

Flow workflows are not exposed in the Admin GraphQL API, so this one genuinely cannot be scripted
from here.

One useful signal: the **Flow app's own installation carries no `read_products` and no
`read_metaobjects` scope** (only order, subscription, app and user scopes). That is suggestive that
no Flow workflow reads this metaobject, but it is not conclusive — Flow's product triggers and
actions are brokered by Shopify internally rather than through the app's listed scopes. Verify it
properly:

**Shopify Flow**
1. Shopify admin → **Apps** → **Flow**.
2. Open the **Workflows** tab. Note the total, and include **deactivated** workflows — a paused
   workflow that someone re-enables later is still a dependency.
3. For each workflow, open it and check every trigger, condition and action for:
   - the metafield `custom.features_specs`
   - the metaobject type `specs_features`, or the display name "Specs & features"
   - any "Update product metafield" / "Send HTTP request" action carrying product data
4. Faster for a long list: on each workflow use **⋯ → Export**, which downloads a `.flow` file. Put
   them all in one folder and grep:
   ```
   grep -rilE 'features_specs|specs_features' .
   ```
   That turns a click-through review into one command.
5. Record the result — "N workflows reviewed, none reference specs_features" — so this does not have
   to be redone.

**Make and n8n** — same idea, different UI. In Make open each Scenario; in n8n each Workflow. Both
let you export a scenario/workflow as JSON, so the same grep works. Both hold `read_metaobjects`, so
neither can be skipped.

## C. The 79 non-live themes — scriptable, do not do this by hand

Theme file bodies **are** readable through the Admin API (`OnlineStoreTheme.files { body }`),
confirmed 2026-09-01. So this is a script, not 79 rounds of clicking.

**What you are actually looking for.** Not "does this theme use `features_specs`" — nearly all of
them will, since they are branches of the live theme. The question is narrower: *does any non-live
theme bind a field we plan to retire or rename?* That is:

- `downloads_other_info` and `exercises` — proposed for deprecation (B4)
- `shipping_dims_weight`, `shipping_dims_weight_2` — proposed rename/merge (B2)
- `list` — proposed rename (B3)

**Option 1 — Shopify CLI (what I would do if I had a terminal with store auth):**
```bash
shopify theme list --store fitnesssuperstore.myshopify.com
# then, per theme id:
shopify theme pull --store fitnesssuperstore.myshopify.com --theme <ID> --path ./t-<ID>
grep -rnoE 'features_specs\.value\.(downloads_other_info|exercises|list|shipping_dims_weight_2?)' ./t-<ID>
```
Wrap the pull+grep in a loop over the ids from `theme list`. Expect it to take a while — these are
large themes.

**Option 2 — download the zips:** Online Store → **Themes** → on each theme **⋯ → Download theme
file**. Shopify emails a link per theme. Unzip them into one folder and run the same grep once. Fine
for a handful of themes, painful for 79.

**Option 3 — let me run it.** I can query the Admin API theme by theme and produce a table of
theme → at-risk field → file → line, then add it to the packet as file 10. It is ~80 queries so it
is not instant, but it needs no admin clicks from you. Say the word.

**Worth doing regardless of the outcome:** 79 unpublished themes for one store is itself the finding.
Most are dated one-off branches (`usman-26-march`, `avis-removal-20-jan`, `Blog-Fix-16-APR-Waqas`).
Pruning dead ones would shrink this check permanently and is a good candidate for its own ticket.

## D. The live storefront crawl — genuinely blocked here, and mostly unnecessary

The audit environment's network policy returns **403 on CONNECT to `www.fitnesssuperstore.com`**, so
I cannot fetch rendered pages. Note the failure mode: `curl` returns HTTP `000` with an empty body,
which counts as "0 occurrences" if taken at face value. Any crawl result must be checked for a real
HTTP status before its counts are believed.

In practice a rendered crawl is not needed, because every source of a link is reachable another way:

| Where a link can come from | How it was actually checked |
|---|---|
| Blog article body | Admin API `Article.body` — all 84 articles swept |
| Product / collection / page body | Admin API `descriptionHtml` / `body` — same method, can be run on request |
| Metaobject field content | the bulk export already in this packet |
| Theme markup | grep of the theme repo (live theme) |

That combination is *stronger* than a crawl, because it sees unpublished and non-indexed records that
a crawler never reaches — which is exactly how the ROM article in file 08 was found.

**If you still want a true rendered crawl** (worth it once, since it catches theme-rendered links and
app-injected markup together), run Screaming Frog from a normal workstation:

1. **Configuration → Custom → Custom Search** → Add.
2. Filter name `target_blank`, condition **Contains**, value `target="_blank"`.
3. **Crawl the whole domain** — `https://www.fitnesssuperstore.com/` in Spider mode. Do *not* use
   List mode with a hand-built URL list; that is exactly how the April crawl missed 15 posts and how
   the ROM post was missed entirely.
4. A full crawl of this store will exceed 500 URLs, so it needs a licensed copy, not the free tier.
5. When it finishes: **Custom Search** tab → select the `target_blank` filter → **Export**.
6. Compare against the previous export by the `Address` column, not by the totals row. Totals hide
   coverage changes; the April crawl looked clean only because it covered fewer URLs.

## Suggested order

1. **A** is done — read it, and chase the six apps named as worth a real answer.
2. **B** — Flow, Make, n8n. One admin session, use the export-and-grep shortcut.
3. **C** — say whether you want me to run it, or hand the CLI loop to Izza.
4. **D** — optional. Schedule a recurring full-domain crawl rather than a one-off.

Nothing above changes any store data. All of it is read-only verification, and all of it should be
finished before Phase 3 of `06_canonical_structure_migration_rollback_validation.md` archives
anything.
