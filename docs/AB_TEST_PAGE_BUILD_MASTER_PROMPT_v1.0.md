# A/B Test Page Implementation Brief Generator — FSS + FF

Version: v1.0 — 2026-07-26  
Status: reusable controlled reference  
Applies to: FitnessSuperstore.com and FrenchFitness.com; mobile, desktop, or both

## Purpose

Use this reference to produce the same class of complete developer-ready, analytics-ready, QA-ready handoff package created for **Mobile Homepage A/B Test - Implementation Brief**, adapted to any page.

The user only needs to provide:

1. Website: FitnessSuperstore.com or FrenchFitness.com
2. Exact control-page URL
3. Device scope: mobile, desktop, or both

Default to **DEEP DIVE + DRAFT**. Inspect live Gmail, Google Drive, Shopify, GitHub, analytics, the live Org Chart, and the latest ACTIVE / CONTROLLED SOP. Execute only actions Tim explicitly approves. Never merge, publish, or ramp merely because the build package is approved.

## Short request script

```text
Use the Project Source named “MASTER PROJECT SOURCE — A/B Test Page Implementation Brief Generator — FitnessSuperstore.com + FrenchFitness.com — v1.0.”

DEEP DIVE, then DRAFT unless I explicitly say EXECUTE.

Website: [FitnessSuperstore.com or FrenchFitness.com]
Control page URL: [paste exact URL]
Device scope: [mobile / desktop / both]

Optional test objective or idea: [blank means identify the strongest supportable test]
Optional experiment platform: [Convert / VWO / Intelligems / theme-vs-theme / unknown]
Optional canonical Gmail thread: [subject or link]
Optional Drive sources/screenshots/examples: [links or attachments]
Keep unchanged: [optional]
Other constraints: [optional]

Produce the complete handoff package:
- decision and control audit;
- hypothesis, powered primary metric, MDE/sample/horizon/stop rule;
- G0 launch gates;
- exact module-by-module variant spec;
- exact copy, links, assets, and live data sources;
- Shopify/GitHub architecture, changed-file manifest, branch/theme/preview plan;
- production-ready Liquid/JSON/CSS/JavaScript files or patches when tools allow;
- analytics event spec and receipt-proof requirements;
- SEO, performance, accessibility, QA, launch, rollback, and approval gates;
- copy/paste developer/CRO handoff email;
- access report and execution evidence.

Do not ask follow-up questions when the website, URL, and device scope are provided. Use live sources and mark unresolved items [VERIFY] or as G0 gates.
```

## Required G0 gates

- G0-a: experiment mechanism
- G0-b: device targeting, assignment persistence, and before-first-paint/no-flicker proof
- G0-c: live control URL, MAIN theme/template/files, and control snapshot
- G0-d: variant theme/template/page/experiment ID and preview
- G0-e: products, collections, metaobjects, metafields, forms, reviews, images, and policy sources
- G0-f: clean branch from current main, draft PR, head SHA, exact changed files, no unrelated drift, rollback
- G0-g: collector, event mapping, exposure event, primary event, downstream events, and receipt proof
- G0-h: primary metric, denominator, baseline, MDE, sample/horizon, stop and decision rules
- G0-i: canonical, noindex/robots, structured data, duplicate URL, parameters, and internal-link controls
- G0-j: current owners/reviewer/approver verified against the live Org Chart; one Gmail thread and one tracking item

## Mandatory module table

| # | Module / element | Control state | Variant state | Exact copy | Destination/action | Live data source | Mobile behavior | Desktop behavior | Analytics event | Acceptance criteria | Status/G0 dependency |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Metric rule

Do not automatically make purchase conversion the primary metric. Choose a metric directly affected by the variant and frequent enough to power the test. Use qualified click-through or add-to-cart for discovery/navigation tests when purchase volume is insufficient. Keep purchase conversion and revenue per session as secondary or guardrail metrics unless adequately powered.

## Build and source-control rules

- Current GitHub default branch and live Shopify MAIN theme control.
- Use a clean branch and unpublished duplicate theme for drafts.
- Keep the diff narrow and exclude unrelated app/settings/theme drift.
- Bind volatile data to live Shopify objects; do not hardcode price, stock, availability, warranty, or unpublished products.
- Shopify Theme Editor mobile preview is not proof of mobile-only targeting.
- Do not create an indexable duplicate page without canonical/noindex safeguards.
- Do not merge, publish, or ramp without specific approval.

Suggested branch:

`abtest/<site>-<page-or-handle>-<device>-<hypothesis>-YYYYMMDD`

Suggested theme:

`AB — <site> — <page> — <device> — <short hypothesis> — YYYY-MM-DD`

## Default artifact package

- `00_README_AND_DECISION.md`
- `01_AB_TEST_IMPLEMENTATION_BRIEF.docx`
- `02_DEVELOPER_BUILD_PROMPT.md`
- `03_MODULE_COPY_LINK_DATA_MAP.csv`
- `04_ANALYTICS_EVENT_SPEC.csv`
- `05_QA_LAUNCH_ROLLBACK_CHECKLIST.md`
- `06_HANDOFF_EMAIL.txt`
- `07_CONCEPT_SNAPSHOT.png` or annotated page map when useful
- `08_CODE/` with exact Liquid, JSON, CSS, and JavaScript files or patches

## Definition of done

The control and variant are unambiguous; the hypothesis is isolated and evidence-backed; the primary metric is defined and powered; every module has exact copy, link, source, behavior, event, and PASS criteria; dynamic data is valid; SEO/accessibility/performance/cart/checkout/tracking are preserved; G0 gates, QA, launch, monitoring, rollback, and approvals are explicit; and status terms such as DRAFTED, APPROVED, EXECUTED, MERGED, PUBLISHED, RAMPED, VERIFIED, and CLOSED are used accurately.
