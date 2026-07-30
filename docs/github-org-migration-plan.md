# Company-Controlled GitHub Ownership — Migration Plan

Plan for moving the canonical storefront repository off a personal account and
onto **company-controlled** GitHub ownership with a named backup admin.

**Status: PLAN ONLY.** Nothing in this document is authorized by its existence.
No transfer, rename, visibility change, permission change, plan purchase, branch
remap, or integration reauthorization happens without separate written approval
from the business owner of this workstream. Execute it as one scheduled change
window, not opportunistically.

---

## 1. Why this is needed

The canonical repository is currently **public**, under an **individual's
personal GitHub account**, and the connected company account has push/triage but
**not admin**. Consequences today:

- Repository-level controls (branch rules, required reviews, collaborator
  management, integration authorization) depend on one individual's personal
  account. If that account is unavailable, the company cannot administer the
  source of its live storefront.
- The durable review control cannot be satisfied while approval authority and
  ownership rest with the same individual.
- Being public exposes theme source, business logic, internal file/handle naming,
  and commit history to anyone. It also enabled a public repository to be used as
  an ad-hoc data-transfer channel (see `docs/merge-exception-log.md`) — a pattern
  that must not recur.

## 2. Recommendation

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Ownership | Transfer to a **company-owned GitHub Organization** | Ownership survives personnel change; roles and teams are company-managed. |
| Plan | **GitHub Team** (default) | Provides organization ownership, teams, protected branches/rulesets on private repositories, and CODEOWNERS-based required review — the controls this workstream needs. |
| GitHub Enterprise | **Only if** a specific need is identified | Propose Enterprise only for enterprise-managed users, SAML/SCIM provisioning, data residency, enterprise-wide administration, or comparable compliance requirements. None has been identified to date. |
| Visibility | **Private** | A storefront theme is business logic, not a public artifact. Recommended to change visibility to private **at** transfer, in the same window, so it is verified once. |
| Owners | One **company Owner** + one **named backup Owner** | Two org Owners so administration never depends on one person. Neither should be the sole approver of their own changes. |

**Cost:** GitHub Team is billed per user per month. Seats required = the number of
accounts that need repository access (see §3 — **10** collaborator accounts
today, to be reduced by the least-privilege review before purchase). Confirm the
current published per-seat price on GitHub's pricing page at purchase time and
put the resulting figure in the approval request. **No plan purchase is approved
by this document.**

## 3. Current access (verified live; re-verify before execution)

Repository: `izzaahmed02/fitnesssuperstore-shopify` — public, default branch
`main`, owner `izzaahmed02` (personal account).

| Account | Repository role |
|---------|-----------------|
| `izzaahmed02` | admin |
| `AyyazAli` | write |
| `fitnesssuperstore1` | write |
| `kevinXYX` | write |
| `qash-glitch` | write |
| `shikha184` | write |
| `usman-fitnesssuperstore` | write |
| `waqas-ux` | write |
| `yusra1002` | write |
| `zafrandubran` | write |

Nine accounts hold **write** (push) access and one holds **admin**. Before
migration, map every account to a current person and role against the **live Org
Chart**, and apply least privilege: `read` for accounts that only need visibility,
`write` only for active contributors, `maintain`/`admin` only for the named
owners. Do not carry the current list over unchanged, and do not expand access
during the migration.

Also inventory, before transfer: installed **GitHub Apps** (Shopify, CI, AI code
review), any deploy keys, any personal access tokens or automation using this
repository, and any webhooks. Access that nobody can account for is removed, not
migrated.

## 4. Target end state

- Repository at `https://github.com/<company-org>/fitnesssuperstore-shopify`,
  **private**, default branch `main`.
- Two org Owners (primary + backup); repository admin held by the org, not an
  individual.
- Teams replace individual `CODEOWNERS` handles (e.g. `@<org>/theme-reviewers`,
  `@<org>/governance-owners`).
- A ruleset on `main` enforcing the settings in `governance-packet.md`, with an
  empty or minimal, documented bypass list.
- Shopify GitHub integration reauthorized and verified against the same branch ⇄
  theme mapping as before.
- No change to the live theme, its ID, or the storefront as a result of the
  migration.

## 5. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shopify GitHub integration breaks on transfer | `main` stops syncing to the live theme; live edits stop syncing back. Storefront keeps serving the last published version. | Plan the reauthorization as an explicit step (§6). Have the Shopify admin available in the window. Verify sync with a no-op test commit before closing the window. |
| CI / Actions authorization lost | Checks stop running; PRs merge without evidence. | Re-verify both workflows on a test PR in the window. |
| AI connector / Claude Code Review authorization lost | AI review unavailable; connection work restarts. | Re-link only after ownership and permissions are confirmed, at least privilege. This is not on the critical path — do not let it delay the transfer. |
| Redirects relied upon | Old URLs redirect after transfer, but going private makes them inaccessible to anyone without access. | Update local remotes (`git remote set-url`), CI references, bookmarks, and any documentation link after the window. |
| Forks / clones of the public repository | Existing public forks are not retracted by going private. | Accept and record. Rotate anything that was ever exposed. Confirm separately that no secret was ever committed. |
| Open PRs at transfer time | In-flight work disrupted. | Freeze merges during the window; keep the number of open PRs minimal going in. |
| Access reduced too far | Contributors blocked. | Apply least privilege as a reviewed list, communicated in advance, with the org Owner able to restore access immediately. |

## 6. Execution sequence

Prerequisites: written approval; org created; plan purchased; both Owners
enrolled with 2FA; least-privilege access list approved; Shopify admin and the
release owner available; a merge freeze announced.

1. **Freeze.** Announce a merge and live-theme-edit freeze for the window. Record
   the exact `main` SHA and the live theme name/ID/version as the pre-change
   baseline.
2. **Back up.** Take a full mirror clone (`git clone --mirror`) plus a Shopify
   theme export of the live theme, stored in the approved restricted location.
   This is the rollback floor.
3. **Transfer** the repository from the personal account to the company org
   (GitHub Settings → Danger Zone → Transfer). Do **not** rename it.
4. **Set visibility to private.** Verify anonymous access now fails.
5. **Apply access:** teams, the approved least-privilege collaborator roles, and
   the two Owners. Remove accounts that did not survive the review.
6. **Update `CODEOWNERS`** to team-based owners, via a PR (not a direct push).
7. **Apply the `main` ruleset** per `governance-packet.md`. Decide the Shopify
   integration handling *before* enabling "require a PR" — see the warning in
   that document, because that setting also blocks Shopify's direct sync commits.
8. **Reauthorize the Shopify GitHub integration:** in Shopify Admin → Online
   Store → Themes, reconnect the live theme to `<company-org>/fitnesssuperstore-shopify`
   branch `main`. Confirm the theme **name and ID are unchanged** and that no new
   theme was created.
9. **Reauthorize CI and Apps** as needed; re-run both workflows.
10. **Re-link AI access** (ChatGPT / Claude / Claude Code Review) at least
    privilege, canonical repository only, analysis-and-review scope only.
11. **Test (§7). Then lift the freeze** and update remotes and documentation.

## 7. Test method (before the freeze is lifted)

| # | Test | Pass criterion |
|---|------|----------------|
| 1 | Anonymous fetch of the repository URL | Fails (repository is private). |
| 2 | Authorized clone by an approved contributor | Succeeds at the expected role. |
| 3 | Direct push to `main` by a non-bypass account | **Rejected** by the ruleset. |
| 4 | Test PR from a branch off current `main` | CWV regression and Theme Check both run; required-review and CODEOWNERS conditions appear in the merge box. |
| 5 | Self-approval attempt on that test PR | **Rejected** — approval must come from someone other than the author/latest pusher. |
| 6 | Merge the test PR (docs-only, no-op) | Merges only after an independent approval. |
| 7 | Shopify sync forward | Within minutes, the live theme reflects the merged no-op; theme **name and ID unchanged**; no new theme created. |
| 8 | Shopify sync back | A trivial edit in Shopify admin appears on the connected branch as an `Update from Shopify …` commit (confirming which branch now receives it). |
| 9 | Storefront smoke test | Home, a collection, a PDP, cart, and checkout entry render correctly on desktop and mobile. |
| 10 | Parity | Live-theme/`main` parity run per `governance-packet.md` shows no unexplained difference against the baseline SHA from step 1. |

Record every result with a timestamp and attach it to the controlling record. Any
failure stops the window and triggers §8.

## 8. Rollback

Rollback is by **restoring control, not by rewriting history** — the commit
history is unaffected by a transfer.

| Failure | Rollback |
|---------|----------|
| Shopify integration cannot be reauthorized | Reconnect the live theme to the previous repository/branch, or publish the known-good exported theme from step 2. The storefront serves the last published version throughout — there is no customer-facing outage from the transfer itself. |
| Ruleset blocks a legitimate release | Do not disable the ruleset silently. Use the documented emergency path (emergency-fix issue + PR + evidence + post-release review) and record the bypass. |
| Access misconfigured | An org Owner restores the affected role immediately; record what changed. |
| Transfer must be reversed entirely | Transfer the repository back to the original owner, restore prior visibility and collaborator roles, and reauthorize the Shopify integration and CI. Verify with tests 7–10. |
| Anything unclear or unrecoverable | Stop. Keep the freeze in place, keep the mirror and theme export untouched, and escalate before further changes. |

Close the window only when: the tests in §7 pass, the parity result is recorded,
the live theme name/ID are unchanged, and the release owner confirms in writing.
