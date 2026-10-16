# PR #931 regression rig

Tim, 14 October: *"Complete regression evidence for all five findings, including
ordinary cart lines, retry after guard rejection, and the home-gym-package path.
Syntax checks alone are not the required PASS."*

So this is not a syntax check. It loads the **real** theme assets into a **real**
Chromium, lets the guard make its own `fetch` to a **real** `/cart.js`, and
drives the shipped `handleAddToCart` and `replaceItem` handlers.

## What makes it evidence rather than a passing test

Every finding is run on the **broken build as well as the fixed one**. A check
that only passes after the fix does not show the defect was ever there. The
before/after pair does, and it is the pair that is recorded.

The earlier builds are checked out of git when the rig runs — never kept as
copies in the tree — so the comparison cannot drift from what those commits
contain:

| served at | revision | what it is |
|---|---|---|
| `/prefix/` | `d771adf^` | before the five Codex fixes |
| `/splitkey/` | `d771adf` | after them, before the cart-line-key correction |
| `/mutant/` | working tree, one line deleted | see below |
| `/assets/` | working tree | the build under test |

`/mutant/` exists because finding 4's before-state **cannot** be taken from git:
at `d771adf^` the finding-1 bug throws before the rejection path is ever
reached, so that revision shows nothing about finding 4. The only honest
before-state is the shipped file with finding 4's fix — and nothing else —
removed. `buildMutant()` in `run.mjs` does that by deleting one asserted line,
and fails loudly if that line is not found.

## What is stubbed

Only the element methods whose return value comes out of Liquid-rendered markup,
plus the cart render target:

`checkMandatoryFields`, `prepareOptions`, `prepareFunctionalProperties`,
`prepareDefaultProperties`, `prepareBundlePublicProperties`, and
`cart-notification`'s `getSectionsToRender` / `renderContents` /
`setActiveElement`.

The guard, the estimator, the generated constants, both guard-call blocks and
every network path are the shipped code, unmodified. Nothing stubs `fetch`.

## Running it

`playwright-core` is not a dependency of the theme, and the Chromium binary is
whatever the host provides.

```sh
npm i --no-save playwright-core@1.56.1
PLAYWRIGHT_CORE=$PWD/node_modules/playwright-core/index.js \
  node tests/pr931-regression/run.mjs
```

Exits non-zero on any failed check. Results land in
`tests/pr931-regression/out/` — `results.json` plus one full-page screenshot per
scenario. The copies published as evidence are in `docs/evidence/pr931/`.

Set `THEME_DIR` to run against a checkout other than this one.

## The arithmetic the scenarios are built on

Under the generated constants (spec `a5e3004509fedddc`), one predicted
operation is:

```
59 (cart line id) + 80 (PER_OPERATION_OVERHEAD)
  + 43 + 85 + attrs × (12 + 40 + 25)     ← parent item
  + paid × (43 + 85)                      ← one item per paid option
= 267 + 77×attrs + 128×paid
```

At the scenario's 22 paid options and 10 visible properties that is **3,853
bytes**. Five operations is 19,265 and fits the 19,500 budget; six is 23,118 and
does not. Every scenario is placed on that one-operation cliff edge on purpose —
it is the only place where excluding, or failing to exclude, a single line
changes the customer's outcome rather than just a number.
