# Canonical Repository Map

Reference for which repository is authoritative and how it maps to production.

## Storefront theme (canonical)

| Field | Value |
|-------|-------|
| Repository | `izzaahmed02/fitnesssuperstore-shopify` |
| URL | https://github.com/izzaahmed02/fitnesssuperstore-shopify |
| Owner (current, live fact) | `izzaahmed02` — a **personal** account. Migration to company-controlled ownership is planned: `github-org-migration-plan.md`. |
| Visibility (current, live fact) | **Public.** Recommended change to private at migration. |
| Default / production branch | `main` |
| Live theme synced from `main` | `fitnesssuperstore-shopify/main`, theme ID `186120208700` (MAIN role) |
| Development themes | Feature branches cut from `main`, each previewed on an **unpublished** Shopify theme (see `theme-environment-map.md`) |
| Rollback source | `git revert` on `main` + prior Shopify theme version (see `release-and-rollback-runbook.md`) |
| Purpose | Live storefront theme for `www.fitnesssuperstore.com` (Shopify Plus) |

## Other repositories

| Repository | Purpose |
|------------|---------|
| `fitnesssuperstore1/fss-openclaw-n8n-triage` | OpenClaw / n8n email-triage project — **not** the storefront theme. |

Shopify app/Functions code and any French Fitness / BigCommerce code are **not
tracked in this repository**. If they are later maintained in GitHub, add them
here with their production branch and rollback source.
