# Merge Exception Log

Merges to `main` — and other changes that reached production — **without the
required independent human review**. Because `main` auto-publishes to the live
theme, every entry below is a change that went live without the release gate.

This log exists for one reason: to make the size of the control gap visible while
branch rules are not yet enforced, so the fix is prioritised. It is a record of
**what happened**, not an approval of it, and it does not replace the controlling
email/Monday record or the evidence register.

**Every entry was verified against live GitHub** (PR state, author, merger,
timestamps, diff size, and the reviews API) rather than transcribed from an email.
Verified 2026-07-30.

## What counts as an exception

A merge to `main` is an exception if any of these was missing:

- a controlling issue/thread;
- an unpublished preview and before/after evidence, where the change is visual;
- passing applicable checks;
- **one independent human review by someone other than the author or latest
  pusher** — an automated Codex or Claude review does **not** satisfy this;
- written release approval tied to the exact commit SHA.

## Exceptions

| PR | Merged (UTC) | Open → merge | Author → merged by | Files | Diff | Recorded review | Disposition |
|----|--------------|--------------|--------------------|-------|------|-----------------|-------------|
| [#635](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/635) "Update government sales page metrics and remove COSTARS link" | 2026-07-19 15:58 | 35 min | `zafrandubran` → `izzaahmed02` | `templates/page.government-sales.json` (1) | +2 / −9 | **None** | Live. Retained — no defect identified. Original control-gap evidence in this thread. No retroactive reconciliation required. |
| [#655](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/655) "Fix deep-linking and image sizing in photo gallery sections" | 2026-07-24 00:10 | **42 sec** | `izzaahmed02` → `izzaahmed02` (self-merge) | `assets/section-remanufactured-photos.css`, `sections/customer-photo-gallery.liquid` (2) | +6 / −2 | **None** | Live. Retained — CSS/anchor only, no defect identified. Note it edited the same CSS file a Shopify-originated commit had already changed outside review (below), so two unreviewed change paths met in one file. |
| [#656](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/656) "Add finish selector component for product color variants" | 2026-07-24 01:52 | 7 min | `izzaahmed02` → `izzaahmed02` (self-merge) | `snippets/finish-selector.liquid`, `sections/main-product.liquid` (2) | +62 / −1 | **None** | Live. PDP behavior change merged with no preview evidence or review. Subsequently corrected by follow-up PRs (duplicate-finish and finish-order fixes) — i.e. the missing review had a real cost. |
| [#658](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/658) "Add financing disclosures section to financing page" | 2026-07-24 19:04 | 87 sec | `izzaahmed02` → `izzaahmed02` (self-merge) | `templates/page.financing.json` (1) | +11 / −1 | **None** | Live but **ineffective**: `/pages/financing` renders `page.financing-updated.json`, so the disclosures did not appear. Superseded by #659. |
| [#659](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/659) "Move financing disclosures to the live financing template" | 2026-07-24 20:03 | **9 sec** | `izzaahmed02` → `izzaahmed02` (self-merge) | `templates/page.financing-updated.json`, `templates/page.financing.json` (2) | +12 / −12 | **None** | Live and **correct — do not revert.** Places the Affirm and Shop Pay Installments disclosures in the template `/pages/financing` actually uses (Affirm/Shopify marketing-compliance notice ref 127027). Customer-facing financial content merged in 9 seconds with no independent review; the outcome was right, the control was absent. |
| [#677](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/677) "Add custom image banner section for FAQ page" | 2026-07-28 21:52 | 3 min 26 sec | `izzaahmed02` → `izzaahmed02` (self-merge) | `sections/image-banner-faq.liquid`, `templates/page.faqs.json` (2) | **+632 / −204** | Automated **Codex `COMMENTED`** only — **not** an independent human review | Live. The largest exception in this log: a 632/204 customer-facing page rebuild published ~3½ minutes after opening, with no human review and no preview evidence in the PR. |

## Other dispositions (not merge exceptions)

| PR | State | Disposition |
|----|-------|-------------|
| [#634](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/634) "Add same-page subcategory filtering with History API" | **CLOSED / UNMERGED** 2026-07-21 | Never merged, so nothing reached production. Held for missing preview/evidence and missing independent review; the only review record was the automated notice that **Claude Code Review is paused for this repository**. Closed without a recorded human approval — record the closure reason in the controlling record. Nothing to reconcile. |
| [#654](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/654) "Governance: add AI & engineering controls" | Open, unmerged | The governance PR. On HOLD pending the final packet; no reviews recorded to date. Not an exception — it is correctly waiting for the gate. |
| [#678](https://github.com/izzaahmed02/fitnesssuperstore-shopify/pull/678) "TEMP — retrieve Shopify OOS bulk export artifact" | Open, **draft** | **Keep unmerged.** A **public** repository was used as a temporary channel to move a Shopify bulk-export artifact. The retrieval completed. Once the owning workstream confirms the artifact is stored in the approved restricted location, close the PR and delete the temporary branch. **Do not repeat this pattern** — a public repository is not a data-transfer channel, and going private (see `github-org-migration-plan.md`) does not retract what was already public. |

## Shopify-originated commits to `main`

A distinct, ongoing exception class: Shopify's GitHub integration pushes live
admin theme edits straight to `main` as `Update from Shopify for theme
fitnesssuperstore-shopify/main` commits, outside any PR or review. Verified
examples include commit `53d580464e80ba7ba49330e6c2f557cc5dbc6363`, which
commented out `max-height: 600px` in
`assets/section-remanufactured-photos.css`, and commit
`ce02c8c28c454bc3d6221501cde13a552dd407be` (2026-07-22), which changed
customer-facing financing copy on `templates/page.financing.json`.

These are not individually enumerated here; they are handled as a class — each is
a same-business-day reconciliation event (source, approver, affected files,
disposition) per `governance-packet.md` §Shopify-originated commits.

## Pattern (why the controls are the fix)

- **6 of 6** merge exceptions had **zero** independent human reviews. One had an
  automated Codex review, which is not a substitute.
- **5 of 6** were self-merges: the author approved and merged their own change.
- Three merged in **under two minutes**, one in **9 seconds** — intervals in which
  no meaningful review could have occurred.
- Two touched **customer-facing financial content**; one touched **PDP behavior**
  and needed follow-up fixes.
- None of this is prevented by documentation. It is prevented by the `main`
  ruleset in `governance-packet.md` — a required PR, and a required approval from
  someone **other than** the author or latest pusher. Until that ruleset is
  applied, this log will keep growing.

## Keeping this log

Add a row whenever a merge to `main` misses any element of the gate. Record the
PR, the controlling thread, the affected files, the live impact, the evidence (or
its absence), the rollback, and the disposition. Do not delete rows and do not
open a separate tracker.
