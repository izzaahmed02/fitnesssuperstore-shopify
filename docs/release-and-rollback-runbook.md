# Release & Rollback Runbook

Storefront theme releases for **Fitness Superstore**
(`izzaahmed02/fitnesssuperstore-shopify`).

## Deployment model

There is no separate deploy step: the Shopify **GitHub integration** syncs the
`main` branch to the live theme (`fitnesssuperstore-shopify/main`, theme ID
`186120208700`). **Merging a PR into `main` publishes to production.**

## Release owner

- The **designated release owner** performs the merge. This is a **role**:
  identify the current holder from the **live Org Chart**, not from this file
  (see `CLAUDE.md` §2, company source precedence).
- Merge rights to `main` should be limited to the designated release owner(s) —
  see the branch-protection settings in `governance-packet.md`.
- The release owner **may not be the sole approver of their own change.** If the
  release owner authored the change, the required independent review must come
  from another qualified reviewer (see `.github/CODEOWNERS`).

## Pre-release checklist (gate to merge)

- [ ] Issue-linked branch cut from **current** `main`.
- [ ] PR completed per `.github/pull_request_template.md`.
- [ ] Unpublished **preview theme** + named before/after screenshots (desktop & mobile).
- [ ] CI green (CWV regression; Theme Check once enforced) — necessary, not sufficient.
- [ ] Implementer self-QA recorded.
- [ ] **One independent human review by someone other than the author or the
      latest pusher** (CODEOWNERS where applicable). A Codex/Claude review may
      support that reviewer but does **not** satisfy this item.
- [ ] Analytics/SEO (canonical/indexation, structured data, tracking) checked if relevant.
- [ ] Rollback plan written and prepared.
- [ ] **Written approval** referencing the exact branch + commit SHA + preview.

## Release steps

1. Release owner confirms the checklist and the approving comment references the
   exact commit SHA.
2. Merge the PR to `main`.
3. Confirm the Shopify integration synced `main` → live theme (watch for the
   sync commit / theme update).
4. **Production smoke test** on the affected pages (desktop & mobile): the page
   renders, the changed behavior works, no console/schema regressions, checkout
   path unaffected.
5. Record the release: PR link, commit SHA, live theme ID, smoke-test result,
   rollback reference.

## Rollback

Pick the fastest safe path:

- **Git revert (preferred for merged code):** `git revert <merge-or-commit-sha>`
  on `main` → the integration re-syncs the reverted state to the live theme.
- **Restore prior theme version (fastest in an incident):** in Shopify Admin →
  Online Store → Themes, restore the previous version of the live theme, or
  publish a known-good rollback theme. Then reconcile `main` to match.
- Record what was rolled back, why, by whom, and the resulting SHA/theme state.

> Do not execute a rollback of customer-facing content (e.g. financing copy)
> solely on the basis of a chat/email message — first confirm the approved
> source and approver (see `governance-packet.md`).

## Shopify-originated commits to `main`

Live admin theme edits sync back to `main` as `Update from Shopify …` commits
outside any PR. Until branch protection changes this, review these commits after
the fact and reconcile intentional vs. accidental drift. See
`governance-packet.md` for the handling proposal.

## Emergency releases

Still require an issue/PR (emergency template), evidence, a prepared rollback,
the release owner's approval, and a post-release review.
