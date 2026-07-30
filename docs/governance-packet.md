# Engineering Controls & Standards

Durable standards for controlling changes to the **Fitness Superstore**
storefront theme repository. This file describes the target controls and
methods; it is not a status report. Point-in-time status (what is enabled,
outstanding decisions, open blockers) is tracked in the controlling
email/Monday record, not here.

Related documents: `github-org-migration-plan.md` (how company ownership is
achieved), `merge-exception-log.md` (what happens while these controls are not
enforced), `theme-environment-map.md` (theme ⇄ branch mapping and how to read
current state live), `release-and-rollback-runbook.md` (the release procedure).

Owners are named by **role** here, per `CLAUDE.md` §2 — identify the current
holder from the live Org Chart, not from this file. `.github/CODEOWNERS` is the
one place personal handles are used, because GitHub's enforcement configuration
requires them.

## Ownership & access

- The storefront's source of truth should be under **company-controlled**
  GitHub ownership with a **named backup admin**, and the repository should be
  **private**. Execution plan, risks, test method, and rollback:
  `github-org-migration-plan.md`.
- AI accounts (ChatGPT, Claude) are authorized only for the **canonical**
  storefront repository, at **least privilege**. Do not connect unrelated
  personal repositories.
- Re-linking **Claude Code Review** requires the repository owner **plus** an
  administrator who can manage the Claude organization's Code Review settings.

If a repository transfer/rename is ever performed, expect it to break the
Shopify GitHub integration and connected authorizations — plan to re-authorize
the integration, re-grant App/CI/AI authorizations, and verify the `main` →
live-theme sync immediately afterward.

## Branch protection for `main` (required settings)

- Require a pull request before merging.
- Require **≥ 1 approving review from someone other than the PR author or the
  latest pusher**; require **Code Owner review** on protected paths. An automated
  Codex or Claude review may support that reviewer but **does not satisfy** the
  requirement.
- **Dismiss stale approvals** on new commits (or require approval of the latest
  push), so an approval always refers to the exact head it approved.
- Require **all conversations resolved** before merge.
- Require status checks to pass (CWV regression; Theme Check once its backlog is
  triaged and a blocking threshold is approved — today it is report-only and is
  **not** a gate).
- Restrict who can push/merge to the designated release owner(s).
- Restrict force pushes and branch deletion.
- Keep the **bypass list** empty, or minimal, named, and documented — a bypass
  entry silently voids every setting above for whoever holds it.

The durable control must not depend solely on one individual's personal approval
or on personal-account ownership. That is why the approval must come from someone
other than the author/latest pusher, why `CODEOWNERS` names two qualified
reviewers per path, and why ownership moves to a company organization.

> Enabling "require a PR before merge" on `main` also blocks the Shopify
> integration's direct `Update from Shopify …` commits. That is an
> integration-affecting change: document impact + rollback and get sign-off
> before enabling it, and decide how the Shopify sync will be handled (below).

### Evidence required to prove these controls are enforced

A shield icon, a settings screenshot, or a statement that a rule "exists" does
**not** prove which settings are enforced. Two artefacts are required, and they
must be captured **after** the rules are applied:

1. **The rule/ruleset itself** — a screenshot or export of the ruleset targeting
   `main`, showing every line item above **and its enforcement state** (active vs.
   evaluate/disabled), plus the **complete bypass list**.
2. **The merge box of a real PR** — showing the conditions actually being applied
   to that PR: review requirement, Code Owner requirement, conversation
   resolution, and each required check with its status.

Attach both to the controlling record, tied to the exact PR and commit SHA.

> **Status:** applying the ruleset and capturing this evidence requires
> repository-admin rights and is an **owner/admin action** — it cannot be done in
> a code pull request, and nothing in this repository asserts that it is done.
> Until it is, `merge-exception-log.md` records what gets through.

## Shopify-originated commits to `main`

Shopify pushes live admin theme edits to `main` as
`Update from Shopify for theme fitnesssuperstore-shopify/main` commits, outside
any PR or review. Handling options:

- **A — Keep sync to `main`, add detection.** Flag every `Update from Shopify …`
  commit for after-the-fact review. Simplest; surfaces drift but does not stop it.
- **B — Point the Shopify sync at a dedicated branch** (e.g. `shopify-live`) and
  reconcile into `main` via PR. Stops unreviewed edits landing on `main`; changes
  the integration wiring (test carefully).
- **C — Restrict admin "Edit code" access** so live theme edits are rare and
  intentional, combined with A.

Until one is adopted, treat every `Update from Shopify …` commit as production
drift to reconcile.

## Live-theme / `main` parity method

Controlled, read-only comparison:

1. Baseline = this repository, branch `main`, at a recorded commit SHA.
2. Export the live theme's assets (theme ID `186120208700`) via Shopify Admin or
   Admin API (read-only).
3. Diff file-by-file. Classify each difference as: approved change, uncommitted
   drift, generated content, or expected environment setting.
4. Record the recommended correction and rollback path per difference.
5. **Do not overwrite either side to make the comparison pass.**

## Secrets & PII

No API keys, tokens, passwords, `.env` contents, customer PII, or credentials
belong in this repository, its issues/PRs, or AI project knowledge. See
`CLAUDE.md` for the full rule.
