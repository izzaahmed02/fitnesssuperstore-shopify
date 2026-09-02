# Technogym Image Rights Containment Manifest

**Status:** DRAFT / PREVIEW ONLY  
**Date:** 2026-09-02  
**Production effect:** None  
**Approval gate:** Tim; counsel for legal position or external response

## Decision

Do not publish, merge, remove evidence, concede liability, or represent that remediation is complete from this branch. Preserve the current evidence, map every challenged image or graphic, and replace unverified media only with:

1. TJF-owned photographs of the actual remanufactured equipment;
2. assets covered by a written license or authorization that can be retained in the evidence record; or
3. a neutral text/no-image state approved for temporary containment.

Do **not** treat cropping, recoloring, background changes, compositing, or changing the apparent camera angle of a copied Technogym photograph as a clearance strategy.

## Source record

- Canonical Gmail subject: `Urgent Notice of Copyright Infringement`
- Initial notice: 2026-08-03
- Follow-up: 2026-09-01
- Follow-up URLs: 52 raw URLs, normalized to 21 unique paths
- Unique challenged paths across both notices: 22
- Initial evidence attachment: `fitss.png`
- Live Shopify review on 2026-09-02 found the originally reported Skillmill PDP ACTIVE with nine gallery images.
- No clear written image-use grant was found in the reviewed Gmail and Drive search results. This is not proof that no authorization exists elsewhere.

## Read-only theme audit

Run from the repository root:

```bash
python scripts/audit_technogym_image_refs.py \
  --root . \
  --output technogym-theme-asset-audit.csv
```

The script scans text-based theme files and writes a CSV. It does not contact Shopify, change theme files, delete assets, or publish.

Known theme references found before this branch was created include:

- `templates/index.json`: `technogym-brand.webp`; `Brand_logo_4.webp`
- `templates/page.all-brands.json`: `technogym.webp`
- `templates/page.comparison.json`: `CURVED_TREADMILL_COMPARISON_CHART_1.png`
- `templates/page.remanufactured.json`: `technogym-skillrow-main.webp`
- `templates/page.assembly-manuals.json`: `image_280.png` in a Technogym block
- `templates/page.about-us-new.json`: `512px-Technogym_Logo_svg.png`
- `templates/page.remanufactured-photos.json`: a Technogym brand block using `image_280_1.png`

Theme scanning is only one layer. Product gallery media, Shopify Files, page-builder content, collection images, metafields/metaobjects, rich-text HTML, apps, and externally hosted media must be audited separately in Shopify.

## Normalized challenged URLs

1. https://www.fitnesssuperstore.com/products/technogym-skillmill-the-curved-treadmill-remanufactured
2. https://www.fitnesssuperstore.com/collections/technogym-strength-training-machines
3. https://www.fitnesssuperstore.com/collections/technogym-elliptical-machines
4. https://www.fitnesssuperstore.com/collections/technogym-selection-series
5. https://www.fitnesssuperstore.com/collections/technogym
6. https://www.fitnesssuperstore.com/collections/technogym-exercise-bikes
7. https://www.fitnesssuperstore.com/pages/technogym-manuals
8. https://www.fitnesssuperstore.com/collections/technogym-treadmills
9. https://www.fitnesssuperstore.com/
10. https://www.fitnesssuperstore.com/collections/technogym-pure-strength-series
11. https://www.fitnesssuperstore.com/pages/technogym-treadmill-comparison-chart
12. https://www.fitnesssuperstore.com/collections/technogym-climber-steppers
13. https://www.fitnesssuperstore.com/collections/stairmaster
14. https://www.fitnesssuperstore.com/collections/products-remanufactured
15. https://www.fitnesssuperstore.com/pages/stairmaster-stepmill-comparison-chart
16. https://www.fitnesssuperstore.com/pages/the-best-curved-treadmills-compared-woodway-technogym-and-french-fitness-models
17. https://www.fitnesssuperstore.com/pages/sell-your-equipment
18. https://www.fitnesssuperstore.com/products/technogym-skillrun-unity-5000-treadmill-remanufactured
19. https://www.fitnesssuperstore.com/products/technogym-pure-strength-plate-loaded-row-remanufactured
20. https://www.fitnesssuperstore.com/products/technogym-skillrow-remanufactured
21. https://www.fitnesssuperstore.com/products/technogym-pure-strength-linear-leg-press-plate-loaded-remanufactured
22. https://www.fitnesssuperstore.com/products/technogym-artis-vario-elliptical-w-unity-3-0-remanufactured

## Required asset-level fields

For every rendered image, graphic, logo, video thumbnail, diagram, comparison chart, or rich-text image on the challenged URLs, record:

- normalized page URL;
- Shopify/GitHub/file location;
- exact asset filename and current CDN URL;
- where it renders: gallery, description, hero, collection tile, card, chart, logo, manual tile, app, metafield, or metaobject;
- source/provenance;
- asserted owner;
- written license/authorization link, if any;
- evidence capture timestamp;
- current status: live, hidden, removed from render, replaced, or pending;
- replacement asset and TJF ownership evidence;
- reviewer and completion timestamp;
- URL retest result on desktop and mobile.

## Containment sequence

1. Preserve the notice, screenshot, page captures, current CDN URLs, Shopify media IDs, and theme references in a restricted evidence record.
2. Freeze new reuse or publication of unverified Technogym-sourced imagery.
3. Run the theme scanner and export the CSV.
4. Export product gallery media and rich-text HTML for the six specifically named PDPs first.
5. Map collection/homepage/manual/comparison assets, including inherited product tiles.
6. Present an exact removal/replacement list to Tim before production action.
7. After approval, use a separate implementation branch for theme changes and controlled Shopify Admin edits for product/page media.
8. Retest all 22 normalized URLs, collection cards, search results, mobile/desktop rendering, structured data/social previews where applicable, and cached/CDN behavior.
9. Do not tell the claimant that all content is removed until the evidence log and retest are complete.

## Actual-unit photography standard

For replacements, photograph the actual units owned or controlled by TJF Ventures LLC. Capture a clean hero view, both sides, console/control close-up, key condition/features, and any material remanufactured differences. Avoid serial numbers, customer information, third-party copyrighted graphics in the background, and unsupported “official” or authorized-dealer implications. Preserve original files, capture date, photographer/employee ownership or assignment, editing history, and the final exported asset.

## Acceptance criteria for a future containment implementation PR

- Every theme-level finding has a disposition and evidence link.
- The six named PDPs have complete gallery and description-HTML inventories.
- No unverified challenged image renders on the 22 URLs in the approved containment scope.
- Factual product names and compatibility statements remain accurate and do not imply affiliation or authorization.
- Desktop/mobile screenshots and URL checks are attached.
- No source evidence was destroyed.
- Tim approval is documented before merge or Shopify publication.
- External response remains separately approved by Tim and counsel.
