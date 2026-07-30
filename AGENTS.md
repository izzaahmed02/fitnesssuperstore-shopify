# AGENTS.md

**Canonical agent guidance for this repository lives in [`CLAUDE.md`](./CLAUDE.md).**
Read it in full before analyzing, drafting, or reviewing any code here. This file
exists so agents that look for `AGENTS.md` (e.g. ChatGPT/Codex) find the same
rules; `CLAUDE.md` is the single source of truth.

This is the **Fitness Superstore** Shopify Online Store 2.0 theme
(`izzaahmed02/fitnesssuperstore-shopify`) for `www.fitnesssuperstore.com`.
Merging to `main` publishes to the live storefront via the Shopify GitHub
integration.

## The hard rules (full detail in `CLAUDE.md`)

1. **AI assists; it does not approve.** AI output is not approval, not proof of
   testing, and not proof that a change is safe or live. A green build or a merge
   is not business acceptance.
2. **No AI agent may** push to `main`, publish a theme, deploy an app/Function,
   change production data, or handle secrets — without the required
   human-controlled workflow.
3. **Never** paste or commit API keys, tokens, passwords, `.env` contents,
   customer PII, or credentials into code, issues, PRs, or AI chats.
4. **Never invent** pricing, stock, warranties, certifications, specs, SKUs,
   handles, or IDs. Mark unverified values **UNKNOWN / requires confirmation** —
   never fill with a default or inventory sentinel.
5. **Brand naming:** always full names — **Fitness Superstore** and
   **French Fitness**. Product terms: "new/remanufactured" primary,
   "refurbished" educational only, "As Is" for rare used stock.
6. **Stay in scope:** change only the files the controlling issue/PR names.

## Company source precedence (full detail in `CLAUDE.md` §2)

When sources disagree, this order controls:

1. **Live Org Chart** — current people, owners, approvers, recipients.
2. **Latest ACTIVE / CONTROLLED SOP** — process (never cite a DRAFT/HOLD SOP as
   active).
3. **Canonical Gmail / Monday record** — what was decided on a case, and by whom.
4. **Live Shopify and live GitHub** — system facts (theme name/ID, branch, PR and
   review state, repository settings, product data), read directly.
5. **Historical files** — context only, never controlling.

Never name an owner or approver from memory or from a document in this
repository, and never assert a system fact you have not read live. Policy prose
here uses **role-based** owner language; personal GitHub handles appear only in
`.github/CODEOWNERS`, where the enforcement configuration requires them.

## Workflow

Issue-linked branch from current `main` → unpublished preview theme → PR
(`.github/pull_request_template.md`) → CI + self-QA + **one independent human
review by someone other than the author or latest pusher** (an automated
Codex/Claude review does not satisfy it) → written approval tied to the exact
commit/preview → merge (= publish) by the designated release owner. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`docs/release-and-rollback-runbook.md`](./docs/release-and-rollback-runbook.md).

⚠️ Shopify admin edits sync back to `main` as
`Update from Shopify …` commits that bypass review — treat as production drift
(`docs/governance-packet.md`).
