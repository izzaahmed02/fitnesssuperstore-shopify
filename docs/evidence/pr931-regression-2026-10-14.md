# PR #931 — regression evidence, 14 October 2026

**Required by:** Tim, 14 October, item 2 — *"Complete regression evidence for all
five findings, including ordinary cart lines, retry after guard rejection, and
the home-gym-package path. Syntax checks alone are not the required PASS."*

**Result: 16/16 checks pass.** Raw output `docs/evidence/pr931/results.json`,
screenshots `docs/evidence/pr931/*.png`, rig `tests/pr931-regression/`.

Real theme assets, real Chromium, real `fetch` to a real `/cart.js`. Nothing
stubs the guard, the estimator or the network. `tests/pr931-regression/README.md`
lists exactly what is stubbed and why.

**Every finding is run on the broken build as well as the fixed one.** A check
that only passes after a fix does not show the defect was ever there.

---

## 0. The bug Tim found, confirmed and fixed

> *"In product-custom-options.js, the predictor receives `this.modifyID.split(':')[0]`,
> while fs-bundle-guard.js compares against the full `line.key`. Pass the full
> current cart-line key so the old line is actually excluded."*

Tim is right, and it was mine — introduced in `d771adf` as part of the P2-5 fix.

- `snippets/cart-item-product-options.liquid:57` renders `data-product-id="{{ line_item.key }}"`.
- `assets/product-custom-options.js:33` — `get modifyID() { return this.dataset.productId; }`.
- `assets/product-custom-options.js:1007` queries `[data-key-modify="${this.modifyID}"]`, and
  `sections/main-cart-items.liquid:707` renders that attribute as `{{ item.key }}`.

So `modifyID` **is** the full cart-line key. `fs-bundle-guard.js:86` compares
`line.key !== excludeLineKey`. A bare variant id can never equal a line key, so
the exclusion silently never matched and the P2-5 fix did nothing.

The split is correct in exactly one place — line 1124, where `/cart/add.js`
wants a variant id — and that is still a split. Line 1147's `/cart/change.js`
call already used the full key. Both are now asserted (F5.b.add-key,
F5.b.change-key) so the two cannot be confused again.

---

## 1. Finding 1 (P1) — the budget guard was silently bypassed

`prepareFunctionalProperties()` returns an array; the old code `JSON.parse()`d
it, threw, and the surrounding catch swallowed the whole guard.

The signal is binary and needs no interpretation: **did the guard ever read the
cart?**

| build | `cart.js` reads | guard rendered | posted to `/cart/add.js` |
|---|---:|---|---:|
| `d771adf^` | **0** | no | **1** — the over-budget cart goes through |
| working tree | **1** | yes | **0** |

On the fixed build the rendered block carries the approved copy verbatim and
`https://www.fitnesssuperstore.com/pages/contact`, read from the generated
constants rather than retyped.

`f1-prefix.png`, `f1-assets.png`

## 2. Finding 2 (P1) — the home-gym-package path

With the three assets the section now loads, in a real page:
`window.FSBundleEstimator`, `window.FSBundleEstimatorFns` and
`window.FSBundleGuard` are all defined, `SPEC_CHECKSUM` is `a5e3004509fedddc`
and `OUTPUT_BYTE_BUDGET` is 19,500. The guard then runs on that path and renders
the approved copy.

`f2-home-gym-packages.png`

### 2a. A sixth gap of the same class, found today — `snippets/cart-drawer.liquid`

Re-running the sweep across **snippets, layout, templates and blocks** as well
as sections found one more file loading an option script and none of the three
assets: `snippets/cart-drawer.liquid`.

It survived the PR #931 round because that sweep covered `sections/` only. This
one matters more than the section did: the snippet is rendered from
`layout/theme.liquid:47`, so the drawer's Modify flow is reachable on **every
page of the store**, not only `/cart`. With the constants absent,
`prepareBundlePublicProperties()` fails closed by design — the replacement line
carries no `_bundlePublicProperties` manifest and the transform treats it as a
fault — and `window.FSBundleGuard` is absent too, so the budget guard never runs
on that path at all. Neither failure throws anywhere a human would see.

Fixed, and `tests/estimator-asset-sweep.test.mjs` now sweeps all five
directories so the class cannot recur:

```
swept 464 Liquid files across sections, snippets, layout, templates, blocks
6 load an option script
PASS: every option-script carrier loads all three Item C assets
```

With the fix reverted, the same test fails and names the file — the negative
control, so the test is known to be capable of failing.

**This is a new finding on a branch already under review. It is reported, not
quietly folded in.**

## 3. Finding 3 (P2) — ordinary cart lines counted as transform parents

Cart: one configured line plus **40 ordinary products** carrying public
properties but no `_functionOperation`.

| build | predicted | budget | verdict |
|---|---:|---:|---|
| `d771adf^` | **24,546** | 19,500 | blocked — wrongly |
| working tree | **7,706** | 19,500 | allowed |

The 40 ordinary lines account for all 16,840 bytes of the difference, and
contribute nothing after the fix.

`f3-prefix.png`, `f3-assets.png`

## 4. Finding 4 (P2) — retry after guard rejection

Reject once on a full cart, then submit again.

| build | `aria-disabled` after the first rejection | cart reads on the second submit |
|---|---|---:|
| before | **`"true"`** — still set | **0** — the handler returns at the top |
| working tree | cleared | **1** — the guard re-runs |

Before-state note: this one cannot be taken from `d771adf^`, because the
finding-1 bug there throws before the rejection path is ever reached. The before
column is the shipped file with finding 4's single line removed and nothing
else, built by the rig from an asserted exact line. That is stated here rather
than presented as a git revision.

`f4-mutant.png`, `f4-assets.png`

## 5. Finding 5 (P2) + Tim's correction — the modify flow

Cart: five configured lines at 3,853 bytes each = 19,265, which fits. Modify
one of them.

| build | ops counted | predicted | outcome |
|---|---:|---:|---|
| `d771adf^` — no exclusion at all | 6 | 23,118 | blocked |
| `d771adf` — exclusion by `split(':')[0]` | 6 | 23,118 | **blocked — the fix did nothing** |
| working tree — exclusion by full key | 5 | 19,265 | **allowed, replacement carried out** |

On the fixed build the rig observes the whole flow complete: one POST to
`/cart/add.js` carrying the bare variant id, one POST to `/cart/change.js`
carrying the full key with `quantity: 0`, and both cart sections re-rendered.

`f5-splitkey.png` is a customer being told to phone Sales for a cart that fits.

### 5a. Two cart lines, same variant, different configurations

Tim names this case specifically. Two lines share variant `43190000007` with
different configurations; the second is modified.

| exclusion value | ops | predicted | |
|---|---:|---:|---|
| full key `…0007:bbb…` | **5** | 19,265 | correct — the other line of the same variant is still counted |
| bare variant id `43190000007` | 6 | 23,118 | matches no line key: over-counts by one operation |
| a variant-id comparison | 4 | 15,412 | would drop **both** lines: under-counts by one operation |

That third row is why the fix is "pass the full key" and **not** "loosen the
guard to compare variant ids". Loosening would trade a visible over-count for a
silent under-count, and an under-count is the direction that lets a cart through
to fail at checkout. It is measured here, not asserted.

---

## 6. What this does not cover

- **No production change.** Nothing here touched the production store, theme,
  app or orders. The rig runs entirely against a local server.
- **Not a staging checkout run.** This proves the theme-side behaviour of the
  five findings. The server-side validation remains authoritative and is
  evidenced separately in `docs/evidence/staging-end-to-end-2026-10-02.md`.
- **The guard is still UX only.** It can be bypassed by a direct
  `POST /cart/add.js`; that is by design and is why the validation function
  exists.
