# CSS purge analysis — base-v2.min.css + custom.css

Task 3 from Tim's repo audit (thread: "Claude Code setup on fitnesssuperstore-shopify
— Core Web Vitals workstream", 5 Sep 2026). Brief: purge unused rules and split
per-template, keeping them render-blocking to protect CLS.

Read-only analysis. **No CSS was deleted** — the finding is that a static purge is not
safe on either file, and the reason is worth having on record before anyone tries.

## What loads today

| Asset | Size | Load |
|---|---|---|
| `assets/base-v2.min.css` | 65.6 KB | render-blocking, every page (`snippets/stylesheet-tags.liquid:16`) |
| `assets/custom.css` | 67.2 KB | render-blocking, every page (`snippets/stylesheet-tags.liquid:23`) |

## Method

Extracted every class selector from both files, then checked each name against the
entire theme source — all `.liquid`, `.json` and `.js` under `layout/`, `snippets/`,
`sections/`, `templates/`, `config/`, `locales/` and `assets/`. A class counts as
referenced if its literal name appears anywhere outside the CSS itself.

## Result

| File | Distinct classes | Referenced in theme source | Not referenced |
|---|---|---|---|
| `base-v2.min.css` | 362 | 362 | **0 (0%)** |
| `custom.css` | 335 | 247 | 88 (26%) |

### base-v2.min.css — nothing is statically purgeable

Every one of its 362 classes is referenced somewhere in the theme. There is no dead
weight to remove by static analysis. Its 65.6 KB is not unused rules; it is rules
whose selectors are all live somewhere in the theme, most of them on templates that
don't need them. That makes this a **splitting** problem, not a purging problem.

### custom.css — the 88 "unreferenced" classes are app-injected, not dead

They aren't in the theme source because the DOM that uses them is rendered by
installed apps at runtime:

| Bucket | Count | Examples |
|---|---|---|
| Boost AI Search & Filter | 4 | `boost-sd-layout`, `boost-sd__product-item`, `boost-sd__product-list-grid--3-col` |
| Avis / product-options | 9 | `avp-productoptionswatch`, `apo-swatch-tooltip`, `ap-tooltip`, `combo_input-container` |
| Hashed app-bundle names (CSS modules) | ~60 | `_1LnmltgS_J5Y2AHAeEvmje`, `_input_12vbd_32`, `TZb7enkgSewGcmT7PqIGk` |
| Compare-products / other vendor | ~15 | `compare-bar`, `compare-products-item`, `comparable-popup-close` |

Deleting these would break app styling on the storefront with no signal from any test
that runs in this repo. **Do not purge on the strength of a source grep.**

This is the same finding as blocker 1 on PR #812, from the other direction: a large
part of what this theme styles is not rendered by this theme.

## Recommendation

Tim's own note on the Phase 2 brief — "needs CSS coverage data per template" — is
correct, and this analysis is the evidence for it. Static analysis cannot do this job.

Next step, once the preview theme is reachable in a real browser:

1. Run Chrome DevTools **Coverage** against the preview on one URL per template
   family — home, collection (Boost-rendered), PDP, search, blog, page, cart.
2. Take the **union** of used rules across all templates as the shared core. Anything
   outside the union on every template is a genuine deletion candidate.
3. Split the remainder per template family and load each conditionally, keeping all of
   it render-blocking so CLS is unaffected — as the brief specifies.
4. Verify against app-rendered pages specifically: a Boost collection page, a PDP with
   Avis options open, and the compare bar in an active state. Coverage only records
   what actually rendered, so any app UI that stayed closed during the run will look
   unused and isn't.

Estimated ceiling: the two files are 132.8 KB combined and render-blocking on every
page. A correct per-template split is the largest single CWV win still on the table,
which is also why it should not be rushed.

## Not done here

No deletions, no splitting, no changes to `snippets/stylesheet-tags.liquid`. Step 1
needs a browser against the preview theme.
