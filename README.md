# Fitness Superstore — Shopify storefront theme

Shopify **Online Store 2.0** theme (Dawn-derived) for the live Fitness Superstore
storefront at `www.fitnesssuperstore.com`.

`main` is production: the Shopify **GitHub integration** syncs `main` to the live
theme, so **merging to `main` publishes to the live storefront.** There is no
separate deploy step.

## Start here

| Read this | For |
|-----------|-----|
| [`CLAUDE.md`](./CLAUDE.md) | AI and engineering governance — repository layout, company source precedence, AI rules, safe commands, prohibited actions, required tests/evidence. Canonical. |
| [`AGENTS.md`](./AGENTS.md) | Same rules, entry point for agents that look for `AGENTS.md`. Points at `CLAUDE.md`. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | The human workflow: issue → branch → preview → PR → review → approval → release. |
| [`docs/release-and-rollback-runbook.md`](./docs/release-and-rollback-runbook.md) | How a release is made, smoke-tested, and rolled back. |
| [`docs/repository-map.md`](./docs/repository-map.md) | Which repository is canonical and how it maps to production. |
| [`docs/theme-environment-map.md`](./docs/theme-environment-map.md) | Theme ⇄ environment ⇄ branch mapping, and how to retrieve current theme state live. |
| [`docs/app-integration-inventory.md`](./docs/app-integration-inventory.md) | Integrations that touch the storefront, product data, or feeds. |
| [`docs/github-org-migration-plan.md`](./docs/github-org-migration-plan.md) | Plan for moving the repository to company-controlled GitHub ownership. |
| [`docs/governance-packet.md`](./docs/governance-packet.md) | Durable engineering controls and standards (ownership/access, branch protection, parity method). |
| [`docs/merge-exception-log.md`](./docs/merge-exception-log.md) | Recorded merges to `main` that bypassed the required independent human review. |

## Layout

`assets/` `sections/` `snippets/` `blocks/` `templates/` `layout/` `config/`
`locales/` — standard Shopify theme directories. `scripts/` holds repo tooling
(e.g. the Core Web Vitals regression check run in CI). See `CLAUDE.md` §1 for
what belongs where.

## Local checks

```bash
python scripts/cwv_regression_test.py     # Core Web Vitals regression check (CI)
shopify theme check --no-color            # static Liquid/theme lint (CI, report-only)
```

Theme Check runs in CI against a pinned Shopify CLI version and is
**report-only** during rollout — the theme has a pre-existing lint backlog. It
becomes a required gate only after that backlog is triaged and a blocking
threshold is approved.

## Before you change anything

Every material change needs a controlling record, an issue-linked branch from
current `main`, an **unpublished** preview theme, a completed PR, passing checks,
**one independent human review by someone other than the author or latest
pusher**, and written release approval tied to the exact commit SHA. A green
build, an AI review, or a merge is **not** business acceptance. Details in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).
