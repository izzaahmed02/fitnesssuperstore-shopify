# Theme / Environment Map

How Shopify themes map to environments and to GitHub.

**This document records the durable mapping only.** Which themes exist, how many
there are, and which are DEVELOPMENT or preview themes changes daily — that state
is **retrieved live** (procedure below), never transcribed here. A hard-coded
theme list or count in a document goes stale silently, and a stale count read as
current is exactly the kind of unverified system fact `CLAUDE.md` §2 prohibits.

## Durable mapping

| Environment | Shopify theme | Theme ID | GitHub branch | Role |
|-------------|---------------|----------|---------------|------|
| Production | `fitnesssuperstore-shopify/main` | `186120208700` | `main` | Live storefront (MAIN role). Synced from `main` by the Shopify GitHub integration; merging to `main` publishes. |
| Development | *(retrieve live — see below)* | *(retrieve live)* | — | Shopify DEVELOPMENT-role themes. Created and destroyed by developer tooling; treat the set as transient. |
| Preview / working | one **unpublished** theme per feature branch | *(per branch)* | `claude/<topic>-<suffix>` | In-progress work is previewed on an unpublished theme, never on the live theme. |

Only the production row is stable, and even that must be re-confirmed against
Shopify Admin before it is used as release or rollback evidence.

## Retrieving current theme state (read-only)

Run one of these when you need the state, and attach the dated output to the
controlling record. Do not paste the result back into this file.

**Shopify Admin (no API access needed):** Online Store → Themes. The live theme
is under "Current theme"; everything else is unpublished. Development themes are
visible to the developer who created them.

**Admin GraphQL (read-only):**

```graphql
query ThemeInventory($after: String) {
  themes(first: 50, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { id name role processing updatedAt }
  }
}
```

Report from the live result, as of the retrieval timestamp: the MAIN theme (name
and ID), the names and count of DEVELOPMENT-role themes, and the count of
UNPUBLISHED themes.

**Branch ⇄ theme correspondence** is confirmed the same way: the branch the
Shopify GitHub integration is connected to is shown on the connected theme in
Shopify Admin. Confirm it live rather than inferring it from this table.

## Store

| Field | Value |
|-------|-------|
| Store name | Fitness Superstore |
| Primary domain | www.fitnesssuperstore.com |
| Plan | Shopify Plus |

## Policy

- **Never delete or bulk-clean themes.** Before any cleanup, each unpublished
  theme must be individually classified as an active preview, a required rollback
  source, a test-only theme, or an archive candidate — and that classification
  recorded and approved. An unpublished theme is often the fastest rollback path;
  deleting it destroys the rollback.
- Never assert a theme ID, name, role, or branch mapping from memory or from a
  document. Read it live; if you cannot, mark it **UNKNOWN / requires
  confirmation**.
- Preview on an unpublished theme. Never edit or publish the live theme to make a
  test, comparison, or review pass.
