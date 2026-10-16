# Independent QA — Post Avis Phase 2 final activation packet

**Disposition: HOLD.**
Date: 2026-10-01 · Reviewer: Yusra · Scope: Tim's 1 Oct closeout items 2 and 4.

Read-only throughout. No production write, no order edit, no metafield write, no app
deploy, no merge.

---

## 1. Summary

| Item | Verdict |
|---|---|
| PR #24 fixture fidelity to production order #49333 | **PASS** |
| PR #24 headline instruction count (5,967,712 / 54.25%) | **FAIL — does not reproduce** |
| Does Rust clear the failing cart inside budget? | **PASS** (on the correct number) |
| Frozen candidate `dd531b0` still clean under the freeze rule | **PASS** |
| CI at PR #24 head | **PASS** (55 + 45, 0 skipped) |
| Release record internally consistent | **FAIL** — 5 defects below |
| Production catalogue prerequisite (`custom.bundle_option_config`) | **FAIL — not populated** |
| Activation packet (tested rollback, smoke test, monitoring, stop conditions) | **NOT YET POSTED** — nothing to review |

The Rust direction is sound and the conclusion Tim relied on survives. The release
record does not.

---

## 2. The instruction count does not reproduce (BLOCKER)

Tim's 1 Oct instruction was to use the committed PR #24 measurement of **5,967,712
instructions / 54.25% of budget**, and to treat Izza's 29 Sep figure of 5,984,130 as
pre-final and superseded.

I built and ran the committed fixture myself. **The committed artifact measures
5,984,130.** The correction in PR #24 is inverted: the figure it discards is the one
that reproduces, and the figure it publishes reproduces from nothing in the repository.

### Method

```
git checkout e8c1fd2a01a287ba48fc35d18182a765edcc9329   # PR #24 head
# toolchain pinned by rust-toolchain.toml: rustc 1.94.1, wasm32-wasip1
cd extensions/product-bundle && npx vitest --run          # builds the wasm
function-runner-9.2.2 \
  -f target/wasm32-wasip1/release/product-bundle.wasm \
  --export cart_transform_run \
  -i <payload.input of v2-order-49333-configured-cart.json> \
  -j -s schema.graphql -q src/cart_transform_run.graphql
```

### Result — three consecutive runs, identical

```
{"name":"product-bundle.wasm","size":161,"memory_usage":1216,
 "instructions":5984130,"success":true}
```

`memory_usage` 1216 matches the committed measurement exactly, so this is the same
artifact and the same run shape. Only the instruction count differs.

Toolchain disclosure: Shopify CLI 4.7.1 (the version pinned in CI), function-runner
9.2.2 (the version CI asserts), rustc 1.94.1 / wasm32-wasip1 from the repository's own
`rust-toolchain.toml`. This container's network policy blocks the CDN the CLI fetches
`wasm-opt` from, so I supplied `wasm-opt` from npm `binaryen@123.0.0` — the exact
version and the exact artifact the CLI pins, since that CDN mirrors npm. The result
landing on Izza's independently reported 5,984,130 to the instruction is itself
evidence the build matches theirs.

| | PR #24 / measurement JSON | measured here |
|---|---:|---:|
| instructions | 5,967,712 | **5,984,130** |
| % of 11,000,000 budget | 54.25% | **54.40%** |
| headroom | 45.75% | **45.60%** |
| share of the JavaScript 11.57M | 51.6% | **51.7%** |
| linear memory | 1216 KB | 1216 KB |

### The committed fixture is the generator's own output

Regenerating it from the committed composition reproduces the committed file exactly:

```
node scripts/build-49333-fixture.mjs --out /tmp/regen.json
# regen.payload.input == committed payload.input  -> True
# all metadata fields identical                    -> True
```

So the artifact is not stale relative to its generator. 5,967,712 corresponds to no
file, no mode and no toolchain in the repository.

### It is the whole table, not one typo

The second sensitivity case is off by the same proportion:

| case | PR #24 | measured here | ratio |
|---|---:|---:|---:|
| even across twelve parents | 5,967,712 | **5,984,130** | 1.00275 |
| all sixteen on the largest catalogue | 1,999,899 | **2,005,244** | 1.00267 |

Both published numbers are ~0.27% low against the committed code. That is the
signature of a table taken from a pre-final build — which is exactly what the PR's own
correction note describes, applied in the wrong direction.

The parse-floor figure of 5,408,416 has no committed fixture, so it cannot be checked.
On the same offset it would be near 5,423,000, still about 49% of budget. The
qualitative finding is unaffected.

### What does NOT change

* Still comfortably inside budget: 54.40% used, 45.60% headroom.
* Still not the new worst case: 5,984,130 < 6,242,014, so the 43.25% headroom figure
  across the fixture set is unchanged. CI at the PR head confirms
  `max instructions 6,242,014 of 11,000,000 (43.25% headroom)` over 55 fixtures.
* Rust still runs at roughly half the JavaScript cost on the cart that is failing in
  production (11.57M, over the 11M budget).
* Operations 12, expanded items 28, success true — all as published.

The engineering conclusion holds. The published number does not, and the release
record has to carry the number that reproduces.

---

## 3. Fixture fidelity — PASS

I read production order #49333 live from Shopify and compared it line by line with
`docs/data/order-49333-composition.json` and the committed fixture.

* Order total **$45,188.46** — matches the composition exactly.
* 28 line items: **12 configured parents + 16 option lines** — matches.
* All 12 parent product GIDs, prices and quantities match the live order.
* All 16 option-line variant GIDs, quantities and prices match the live order, with
  zero discrepancies.
* Fixture catalogue totals computed from the file: **14,103 bytes, 318 entries,
  101 groups** — matches the published totals and the 31 Aug survey counts
  (318 entries, 101 groups, 14,308 bytes).

I also re-derived the largest catalogue against live production today. FF-FSR90's
`options.product_options` resolves to **25 groups totalling 83 option entries**,
exactly the survey figure the fixture is built on. The survey is sound.

The reconstruction caveat in the PR is correctly stated and correctly scoped: #49333
carries `lineItemGroup: null` on every line, so parent-to-selection mapping genuinely
cannot be recovered, and the fixture is labelled as reconstructed on that point.

---

## 4. Candidate identity and the freeze rule — PASS, with one undisclosed file

* `git diff 63aecbb..dd531b0 -- extensions/ generated/ package.json package-lock.json
  rust-toolchain.toml` is **empty**. The frozen candidate still satisfies Tim's
  17 Sep freeze condition.
* `dd531b0` is an ancestor of the PR #24 head `e8c1fd2`, reached without reset,
  force-push or rebase.
* `git diff dd531b0..e8c1fd2 -- extensions/*/src/` is **empty**. No deployable source
  changed, as the PR states.

One thing the PR body does not disclose. The PR says the only deployable-path addition
is the fixture. It is not:

```
A  extensions/product-bundle/package-lock.json      (new file, 1861 lines)
A  extensions/product-bundle/tests/fixtures/v2-order-49333-configured-cart.json
M  .github/workflows/test.yml
```

`package-lock.json` is one of the five paths named in Tim's freeze rule. It is a lock
file for the test harness, not function source, so I do not read it as moving the
deployable artifact — but a reviewer applying the freeze rule literally will see an
undisclosed hit on a gated path, and the PR body should say so.

---

## 5. CI — PASS, with a stale evidence line

Both check runs are green on `e8c1fd2`. Job log:

```
Tests  55 passed (55)      # product-bundle transform suite
Tests  45 passed (45)      # cart-validation suite
fixtures          55
max instructions  6,242,014 of 11,000,000 (43.25% headroom)
verdicts          {"INTENDED-DIVERGENCE":26,"AGREE":29}
```

26 + 29 = 55, consistent with the 25 + 29 = 54 I verified on 7 September plus the one
new fixture. The silent-skip defect remains closed: 0 skipped.

I reproduced the full suite locally at the PR head — **55 passed, 55 of 55**, including
the new fixture, whose expected output matches byte for byte.

Defect: the workflow's assertion was raised from `54 passed` to `55 passed`, but the
line written into the archived evidence transcript still reads

```
both suites ran: 54 + 45 passed, 0 skipped
```

`transcript.txt` is the uploaded 90-day evidence artifact, so the archived record for
this run states a count the run did not produce. One-line fix in
`.github/workflows/test.yml`.

---

## 6. Production catalogue prerequisite — FAIL (Tim's item 4)

The function reads its catalogue from `custom.bundle_option_config`, on the variant
first and the product as fallback. From the committed input query at the candidate:

```graphql
variantOptionConfig: metafield(namespace: "custom", key: "bundle_option_config")
optionConfig:        metafield(namespace: "custom", key: "bundle_option_config")
```

Checked live against the production store (fitnesssuperstore.com, Shopify Plus):

* **There is no metafield definition for `bundle_option_config`** in production, on
  PRODUCT, PRODUCTVARIANT, COLLECTION or SHOP.
* The metafield returns **null on all twelve pilot products**, at product level and at
  variant level.
* The full metafield list on the FSR100 parent confirms it: the live option data sits
  in `options.product_options` (list of metaobject references), which is the existing
  APO structure. Nothing writes `custom.bundle_option_config`.

If the Rust function were activated against production as it stands today, every cart
line would receive a null catalogue. Tim's item 4 is not merely unverified, it is
**unmet**. A Rust PASS without it is not release-ready, exactly as he wrote.

I could not check the staging store (`api-testing-izza-qash`) — I still have no access
to it, which has been an open blocker since 31 August. The staging catalogue being
populated would not change the production finding.

---

## 7. Activation packet — not yet posted

Tim's item 1 asks Izza for the tested rollback procedure, production smoke-test steps,
day-one monitoring, exact stop conditions and the catalogue prerequisite check. As of
this review none of it has been posted to the thread. Izza's 29 September message
states the intent ("I'll test it rather than assert it") and nothing further has
arrived. There is no packet to issue a PASS against.

One point to settle before it is written. The rollback pin is given as
**`qash-izza-bundle-16` / `1745ea9`**. `1745ea9` is a real commit
("Trim the input query under the 3000-character limit; deploy -16"), but
`qash-izza-bundle-16` is the **staging** app version. The production app is
`izza-bundle` and its active version is `izza-bundle-20`, which is the rollback target
named in Tim's 17 and 19 September rulings and in Umer's 28 September follow-up. A
production rollback pinned to a staging app version is not a rollback. This needs
correcting before the packet is tested, not after.

---

## 8. Smaller consistency defects

1. **Catalogue byte delta.** The measurement JSON states `deltaPercent: -1.47`. The
   figures give (14,103 − 14,308) / 14,308 = **−1.43%**. The PR body's "1.5% light" is
   the rounding of the wrong number.
2. **Correction count.** The PR body says "Three corrections made along the way".
   `docs/companion-package-test-only-plan.md` §13.53 says "Two corrections made during
   the measurement" and omits the instruction-count correction from the list, though it
   is mentioned earlier in the section. The two records should agree.

---

## 9. What would clear this HOLD

1. Re-measure the committed fixture at `e8c1fd2` with the pinned toolchain and publish
   whatever it returns. On my runs that is 5,984,130 / 54.40% / 45.60% headroom.
   Correct the PR body, `docs/data/order-49333-instruction-measurement.json` and
   §13.53 together, including the sensitivity table.
2. Populate and verify `custom.bundle_option_config` in production for the pilot set,
   with a definition and a row-level before/after, under its own written GO.
3. Post the activation packet with the rollback pinned to the production app version
   `izza-bundle-20`, and the pin tested rather than asserted.
4. Fix the transcript echo line, the −1.47% figure and the correction count.
5. Disclose the `extensions/product-bundle/package-lock.json` addition in the PR body.

Items 1, 3, 4 and 5 are documentation and test-harness work with no production effect.
Item 2 is a production write and needs Tim's separate written GO.
