# CLAUDE.md — AI & Engineering Governance

This is the canonical AI and engineering guidance for the **Fitness Superstore**
Shopify storefront theme repository (`izzaahmed02/fitnesssuperstore-shopify`).
It applies to every human contributor and every AI agent (Claude, Claude Code,
ChatGPT/Codex, or any other assistant) that reads, drafts, or reviews code here.

`AGENTS.md` points to this file. If you only read one, read this one.

---

## 1. What this repository is

A Shopify **Online Store 2.0** theme (Dawn-derived) for the live storefront at
`www.fitnesssuperstore.com` (Shopify Plus). It is **not** an app, a service, or a
data pipeline — it is the theme that renders the storefront.

### Repository layout

| Directory    | Purpose |
|--------------|---------|
| `assets/`    | CSS, JS, and static assets referenced by sections/snippets. |
| `sections/`  | Theme sections (the large majority of page-level logic lives here). |
| `snippets/`  | Reusable Liquid partials (PDP tables, product cards, shipping blocks, etc.). |
| `blocks/`    | Theme blocks. |
| `templates/` | JSON/Liquid templates that compose sections into pages (product, collection, page, blog, customers/…). |
| `layout/`    | `theme.liquid` and checkout layout. |
| `config/`    | `settings_schema.json` / `settings_data.json` (theme settings). |
| `locales/`   | Translation/locale files. |
| `scripts/`   | Repo tooling, e.g. `scripts/cwv_regression_test.py` (Core Web Vitals regression check run in CI). |
| `.github/`   | CI workflows, CODEOWNERS, PR/issue templates. |

### Theme ⇄ branch mapping (see `docs/theme-environment-map.md` for the live list)

- **`main`** is the production branch. The Shopify **GitHub integration** syncs
  `main` → the connected **live theme** (`fitnesssuperstore-shopify/main`,
  theme ID `186120208700`). **Merging to `main` publishes to production.**
- Feature work happens on issue-linked branches cut from current `main`
  (convention: `claude/<short-topic>-<suffix>`), previewed on an **unpublished**
  Shopify theme, never on the live theme.

> ⚠️ **Shopify-originated commits.** The GitHub integration also pushes *live
> theme edits made in Shopify admin* back to `main` as
> `Update from Shopify for theme fitnesssuperstore-shopify/main` commits. These
> bypass pull request and review. Treat them as production drift to be
> reconciled — see `docs/governance-packet.md` §Shopify-originated commits.

---

## 2. Company source precedence (which source wins)

When two sources disagree, use them in this order. Never resolve a conflict by
guessing, and never treat a stale document as current.

| Question | Authoritative source |
|----------|----------------------|
| Who is a current person, owner, approver, or recipient? | The **live Org Chart**. |
| What is the required process? | The **latest ACTIVE / CONTROLLED SOP** (including the current routing SOP revision). |
| What was decided on this case, and by whom? | The **canonical Gmail thread / Monday record** for that case. |
| What is a system fact (live theme name/ID, branch, PR state, repository settings, product/inventory data)? | **Live Shopify** and **live GitHub**, read directly. |
| Anything else (older packets, spreadsheets, prior versions of this file) | **Context only** — historical, never controlling. |

Consequences:

- Do not name a person as owner, approver, or reviewer from memory, from a
  previous email, or from a document in this repository. Confirm against the live
  Org Chart.
- Do not describe a **DRAFT** or **HOLD** SOP as active.
- Do not assert a theme ID, branch mapping, PR/review status, or repository
  setting without reading it live. If it cannot be read, mark it
  **UNKNOWN / requires confirmation**.
- Policy prose in this repository uses **role-based** owner language (e.g. "the
  GitHub & Engineering Owner", "the designated release owner"). Personal GitHub
  handles appear only where the enforcement configuration technically requires
  them — `.github/CODEOWNERS`.

---

## 3. AI rules (mandatory)

These rules are non-negotiable and apply to every AI agent.

1. **AI assists; it does not approve.** An AI agent may analyze code, draft
   changes, identify risks, prepare tests, and review diffs. **AI output is not
   approval, not proof of testing, and not proof that a change is safe or live.**
2. **A green build or a merge is not business acceptance.** Passing CI or a
   successful merge never substitutes for the required human review, QA, and
   written release approval.
3. **No AI agent may, without the required human-controlled workflow:**
   - push directly to `main`;
   - publish, or cause the publication of, a Shopify theme;
   - deploy an app or Shopify Function;
   - change production data (products, prices, inventory, metafields, feeds); or
   - create, read, or handle secrets.
4. **Never paste or commit secrets or PII.** No API keys, tokens, passwords,
   `.env` contents, customer PII, or credentials in code, commits, GitHub issues,
   PRs, or AI project knowledge/chats (ChatGPT or Claude).
5. **Never invent facts.** Do not fabricate pricing, stock/inventory, warranty
   terms, certifications, specifications, SKUs, handles, or theme/app IDs. If a
   value is not verified against an approved source, mark it **UNKNOWN /
   requires confirmation** — do not fill it with a default, placeholder, or
   inventory sentinel value (e.g. `9999`/`-9999`).
6. **Brand naming.** Always use the full names **Fitness Superstore** and
   **French Fitness**. Never abbreviate or use domain-style variants.
7. **Product terminology.** "new/remanufactured" is primary; "refurbished" is
   educational context only; "As Is" is for rare used inventory.
8. **Stay in scope.** Change only the files the controlling issue/PR names. Do
   not opportunistically refactor, reformat, or "fix" unrelated files.

---

## 4. Safe commands

Read-only and local-only operations are safe:

- `git status`, `git diff`, `git log`, `git branch`, `git switch -c <branch>`
- Reading any file; searching (`grep`/ripgrep)
- `python scripts/cwv_regression_test.py` (local CWV regression check)
- `shopify theme check` (static lint — no store auth needed)

**Requires a human + the documented workflow (never run unattended by an AI):**

- Anything that writes to `main` (push, merge, force-push)
- `shopify theme push`, `shopify theme publish`, any theme publish/deploy
- Any Shopify Admin / GraphQL **mutation** (products, inventory, metafields,
  themes, feeds, discounts)
- Any command that consumes a token, key, or `.env`

---

## 5. Prohibited actions

- Direct pushes or force-pushes to `main`.
- Publishing a theme or making any live-theme edit to satisfy a comparison,
  test, or review.
- Deleting or bulk-cleaning Shopify themes, branches, or historical
  exports/imports/source files.
- Reverting, amending, or republishing customer-facing content (e.g. financing
  copy) without first identifying the approved source and approver.
- Merging a PR that lacks the required evidence and independent human review.
- Connecting unrelated personal repositories to any business AI account.

---

## 6. Required tests & evidence before merge

A change to theme code is not mergeable until it has:

- an issue-linked branch cut from current `main`;
- a PR filled out per `.github/pull_request_template.md`;
- an **unpublished preview theme** and named before/after screenshots (desktop
  **and** mobile) for any visual/UX change;
- passing CI (CWV regression; Theme Check once enforced) — **necessary, not
  sufficient**;
- implementer self-QA **and** one independent human review **by someone other
  than the author or the latest pusher** (CODEOWNERS where applicable). A Codex,
  Claude, or other automated review may support that reviewer but **does not
  satisfy** the human-review requirement;
- a stated **rollback** path;
- for SEO/analytics-affecting changes: canonical/indexation and analytics impact
  called out and checked;
- **written release approval tied to the exact branch, commit SHA, and preview.**

## 7. Release & rollback

Deploy = merge to `main` (Shopify auto-syncs `main` → live theme). The merge is
performed by the **designated release owner** (a role — identify the current
holder from the live Org Chart, not from this file). Full procedure, smoke tests,
and rollback steps are in
`docs/release-and-rollback-runbook.md`. Rollback is generally
`git revert <commit>` on `main` (re-sync) and/or restoring the prior theme
version in Shopify Admin. Prepare rollback before release; do not execute it on
the strength of a chat message alone.

---

_This document is engineering governance. It does not itself approve any
production change. Legal, HR, and customer-facing documents still require human
professional review before distribution._
