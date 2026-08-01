# Contributing

How work flows in the **Fitness Superstore** Shopify theme repository. This is
the human workflow that the AI rules in [`CLAUDE.md`](./CLAUDE.md) sit on top of.

## Golden rules

- **`main` is production.** Merging to `main` publishes to the live theme
  (`fitnesssuperstore-shopify/main`, theme ID `186120208700`) via the Shopify
  GitHub integration. There is no separate deploy step.
- **Never work directly on `main`.** Branch from current `main`.
- **Preview on an unpublished theme, never the live theme.**
- **A merge is a release.** It requires evidence and written approval, not just
  a passing build.

## 1. Every material task needs a controlling record

Before code is written, a task must have:

- a controlling **GitHub issue** (linked to the email/Monday item that authorized it);
- **one named implementer** and **one named approval owner**;
- exact **URLs, SKUs, handles, templates, and files** in scope;
- **acceptance criteria** and an explicit **out-of-scope** list.

Use the issue templates in `.github/ISSUE_TEMPLATE/` (bug, feature, performance,
data/feed, emergency-fix).

## 2. Branch

```bash
git fetch origin main
git switch -c claude/<short-topic>-<suffix> origin/main
```

Branch from **current** `main`, not a stale local copy. One issue → one branch.

## 3. Commit

- Small, focused commits; present-tense, descriptive messages.
- Reference the issue (`Refs #123`).
- **Never** commit secrets, tokens, `.env`, customer data, or generated
  `node_modules`/`package.json`/`shopify.theme.toml` (already git-ignored).

## 4. Preview

Push the branch to an **unpublished** Shopify preview theme. Capture named
before/after screenshots (desktop **and** mobile) for any visual change. Do not
publish and do not edit the live theme.

## 5. Open a PR

- Base = `main`. Fill out `.github/pull_request_template.md` completely.
- Mark **draft** until it is genuinely ready for independent review.
- Link the issue, the preview, evidence (screenshots/video/logs/test results),
  analytics/SEO impact, risks, and the rollback plan.

## 6. Review & QA

- **Implementer self-QA** first, recorded in the PR.
- **One independent human review is required, from someone other than the author
  or the latest pusher** (CODEOWNERS for protected paths). You cannot review your
  own change, and you cannot merge on the strength of your own approval. Add a
  second specialist reviewer only when a material architecture,
  canonical/indexation, performance, or data risk is identified.
- A **Codex, Claude, or other automated review does not satisfy** the
  independent-review requirement. It may inform the reviewer; it is not the
  reviewer.
- CI (CWV regression; Theme Check once enforced) must pass — this is necessary
  but **not** sufficient for approval.

## 7. Approve & release

- **Written approval** must reference the exact branch, commit SHA, and preview.
  If the branch is pushed again after approval, the approval is **stale** — update
  the SHA and re-confirm before merging.
- The **designated release owner** merges (a role — confirm the current holder
  from the live Org Chart; see `docs/release-and-rollback-runbook.md`).
- After merge: production **smoke test** and a recorded **rollback** reference.

## Emergency changes

Even emergencies require an issue/PR, evidence, a rollback plan, and a
post-release review. Use the emergency-fix issue template and label the PR
`emergency`.

## AI-assisted contributions

AI may draft code, tests, and reviews, but the human contributor is
responsible for the change. AI output is not approval or proof of safety. See
[`CLAUDE.md`](./CLAUDE.md) for the full AI rules.
