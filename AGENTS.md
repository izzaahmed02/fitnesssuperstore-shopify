# AGENTS.md

## Purpose
This repository supports Shopify Plus development work for Fitness Superstore / French Fitness. Optimize for practical, safe, source-grounded execution that is useful to operators, developers, and reviewers.

## Default operating mode
- For ambiguous or high-risk tasks, plan first before changing code.
- Start by identifying the current state from the repo and any provided screenshots, URLs, Looms, tickets, or diffs.
- Do not guess about live behavior, app settings, Liquid objects, metafields, scripts, or tracking behavior beyond the evidence available.
- If a task is explicitly read-only, do not edit files. Return a file-specific recommendation memo instead.
- Default structure for technical output: **current state -> likely cause -> fix path -> QA -> risk**.

## Priority surfaces
Prioritize issues and improvements involving:
- PDPs, collection pages, homepage, navigation, search/filter, cart-adjacent trust, and merchandising
- Theme templates, sections, snippets, layout, assets, config, locales, scripts, app blocks, and extensions
- Schema / structured data, metadata, internal linking, render logic affecting SEO or crawlability
- GA4, Google Ads, GTM, Stape, pixels, attribution, and purchase-event quality
- Accessibility, performance, and mobile UX regressions
- Content model decisions involving metafields, metaobjects, settings, and taxonomy

## Source hierarchy
Use this order of authority:
1. Repository code and config
2. The user’s prompt, issue ticket, screenshot, URL, Loom, or diff
3. Approved shared project docs and SOPs
4. Approved policy pages and approved public copy

If facts are missing, conflicting, or inaccessible, say so instead of inventing details.
Separate **facts**, **assumptions**, and **recommendations**.

## Read-only reviewer mode
When the user asks for analysis only, or is acting as a reviewer for another developer:
- Do not modify files.
- Inspect the repo and cite the likely files, sections, snippets, templates, scripts, apps, or settings involved.
- Return:
  - one-sentence issue summary
  - current implementation and where it lives
  - likely root causes ranked
  - exact files/paths for the developer to inspect
  - recommended code change in plain English
  - optional pseudocode or snippet guidance when helpful
  - QA checklist
  - risk / rollback notes
  - what evidence would remove uncertainty

## Implementation mode
When asked to propose or make code changes:
- Summarize the current state before changing anything.
- Keep changes scoped to the stated goal.
- Prefer the smallest reliable fix over broad refactors unless the user asks for a refactor.
- Ask for confirmation before introducing new production dependencies, new apps, major schema changes, or workflow changes.
- If a request is ambiguous, list the decision points clearly before implementation.

## Review expectations
For code review / PR review, check:
- correctness
- regression risk
- performance
- accessibility
- SEO / structured data
- tracking / analytics integrity
- maintainability
- rollback simplicity

Conclude with a clear recommendation: **merge**, **revise before merge**, or **needs more evidence**.

## Business and compliance guardrails
- Do not weaken or rewrite approved policy, disclaimer, warning, return, shipping, warranty, privacy, accessibility, or legal language unless explicitly asked.
- Do not give definitive legal or compliance conclusions.
- Be conservative around Prop 65, privacy, accessibility, IP / trademark, warranties, returns, shipping, pricing, financing, and chargeback-sensitive claims.
- Do not hardcode or expose secrets, tokens, keys, credentials, or internal-only operational details.
- Do not expose or summarize internal margins, gross sales, HR details, org-chart details, or owner-only strategy unless explicitly asked in an internal-only context.
- Use internal data for prioritization, not for public-facing claims.

## Brand and copy guardrails
If a code change affects visible copy, schema text, trust language, or content blocks:
- Keep tone direct, polished, practical, and low-hype.
- Fitness Superstore should read like a retailer / buyer guide / showroom-backed operator.
- French Fitness should read like house-brand product proof / machine education / value-plus-warranty / showroom-backed trust.
- Do not make the two brands sound identical.
- Do not overstate warranty, shipping speed, inventory, compliance, or installation claims.

## Tracking and analytics rules
- Treat purchase measurement as highest priority.
- Do not recommend duplicate conversion logic.
- Call out where verification is needed in theme code, GTM, Stape, checkout, app scripts, pixels, or server-side flows.
- Separate current-state observations from proposed fixes.

## Build, test, and validation rules
Before finalizing work:
- Inspect `package.json`, `README`, CI config, theme config, and repo docs to find the actual build, lint, test, and deploy commands.
- Use repo-native commands only. Do not invent commands.
- Run the relevant checks that exist for the files you touched.
- If no verified local lint/test/build command is available, say that clearly.
- If a task changes storefront behavior, include manual QA steps for desktop and mobile when relevant.

## Done means
A task is not complete until the response includes:
- the files or paths involved
- current state vs proposed change
- key assumptions or unknowns
- validation performed or still needed
- QA checklist
- risk level
- rollback notes for non-trivial changes

## Directory routing hints
If these paths exist, prioritize them when relevant:
- `layout/`
- `templates/`
- `sections/`
- `snippets/`
- `assets/`
- `config/`
- `locales/`
- `blocks/`
- `extensions/`
- `src/`
- `components/`
- `scripts/`
- `tests/`

## Escalate before changing
Ask for confirmation before making changes that affect:
- checkout, payments, subscriptions, taxes, shipping logic, discounts, financing, or returns
- customer authentication / account flows
- consent, privacy, accessibility, legal copy, or policy pages
- analytics purchase events or ad-platform attribution
- app installs / removals
- data model migrations across many products or pages
- widespread design-system or template changes across the storefront

## Preferred response shapes
For bug triage:
- issue summary
- likely root causes ranked
- likely files / paths involved
- reproduction path
- recommended fix path
- QA checks
- risk / what else could break

For implementation tickets:
- objective
- current state
- desired state
- acceptance criteria
- impacted files / templates / sections / snippets / apps
- dependencies
- edge cases
- QA checklist
- launch notes / rollback notes

For CRO / technical review:
- biggest blockers first
- above-the-fold issues
- trust / merchandising gaps
- mobile-specific issues
- technical constraints
- top 5 fixes in priority order
- what should be tested first

## Maintenance rule
Keep this file practical. If the same mistake happens twice, update this file with the specific rule that would have prevented it.
