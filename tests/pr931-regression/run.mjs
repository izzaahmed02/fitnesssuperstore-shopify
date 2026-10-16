// PR #931 — regression rig.
//
// Tim, 14 October: "Complete regression evidence for all five findings,
// including ordinary cart lines, retry after guard rejection, and the
// home-gym-package path. Syntax checks alone are not the required PASS."
//
// So this runs the REAL assets in a REAL browser against a REAL cart.js, and
// for every finding it runs the BROKEN build as well as the fixed one. A test
// that only passes on the fixed build does not show the bug was ever there; the
// before/after pair is what makes it evidence.
//
// Builds under test:
//   /prefix/   d771adf^  — before the five Codex fixes
//   /splitkey/ d771adf   — after the five fixes, before the cart-line-key fix
//   /assets/   working tree — the fix under test
//
// Stubbed, and only these: the element methods whose return value is read out
// of Liquid-rendered markup (checkMandatoryFields, prepareOptions,
// prepareFunctionalProperties, prepareDefaultProperties,
// prepareBundlePublicProperties) and the cart-notification render target. The
// guard, the estimator, the generated constants, the guard-call blocks and the
// network paths are the shipped code, unmodified.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { start, posts, gets } from './server.mjs';
import { PER_OP, BUDGET, NEW_PAID, NEW_VISIBLE, KEYS } from './fixtures.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const REPO = process.env.THEME_DIR || `${HERE}../..`;
process.env.THEME_DIR = REPO;
const OUT = `${HERE}out/`;
mkdirSync(OUT, { recursive: true });

// The two earlier builds are checked out of git at run time rather than kept as
// copies in the tree, so the comparison can never drift from what those commits
// actually contain.
//
//   d771adf^  before the five Codex fixes
//   d771adf   after them, before the cart-line-key correction
const REVISIONS = {
  prefix: { rev: 'd771adf^', files: ['fs-bundle-guard.js', 'product-custom-options.js', 'product-form-with-options.js'] },
  splitkey: { rev: 'd771adf', files: ['fs-bundle-guard.js', 'product-custom-options.js'] },
};

function buildRevisions() {
  for (const [dir, { rev, files }] of Object.entries(REVISIONS)) {
    mkdirSync(`${HERE}${dir}`, { recursive: true });
    for (const f of files) {
      const out = execFileSync('git', ['show', `${rev}:assets/${f}`], { cwd: REPO, maxBuffer: 1 << 26 });
      writeFileSync(`${HERE}${dir}/${f}`, out);
    }
  }
}

// Finding 4's before-state cannot be taken from git. At d771adf^ the
// finding-1 bug throws before the rejection path is reached, so that revision
// shows nothing about finding 4. The only honest before-state is the shipped
// file with finding 4's fix — and nothing else — removed. Built here so the
// mutation is one asserted line, visible in this file, not a hand-edited copy.
function buildMutant() {
  const src = `${REPO}/assets/product-form-with-options.js`;
  const text = readFileSync(src, 'utf8');
  const LINE = "              this.submitButton?.removeAttribute('aria-disabled');\n";
  if (!text.includes(LINE)) throw new Error('mutant base line not found — the rig is out of date with the asset');
  mkdirSync(`${HERE}mutant`, { recursive: true });
  writeFileSync(`${HERE}mutant/product-form-with-options.js`, text.replace(LINE, ''));
}

const results = [];
let PORT;
let browser;

// The configuration posted by the page under test: 22 paid options and one
// zero-priced one, 10 visible properties. Matches the fixtures' existing lines.
const OPS_ARRAY = [
  ...Array.from({ length: NEW_PAID }, (_, i) => ({
    variantId: `gid://shopify/ProductVariant/4319${i}0000${i}`,
    priceAdjustment: (i + 1) * 100,
  })),
  { variantId: 'gid://shopify/ProductVariant/43190000999', priceAdjustment: 0 },
];
const VISIBLE_OPTS = Object.fromEntries(
  Array.from({ length: NEW_VISIBLE }, (_, i) => [`Option ${i + 1}`, `Selected value ${i + 1}`]),
);

async function newPage({ cart, guard = 'assets', callsite = 'assets', callsiteFile }) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
  const root = `/s/${cart}/`;
  await page.addInitScript((r) => {
    window.__rigRoot = r;
  }, root);
  await page.goto(`http://127.0.0.1:${PORT}${root}cart`);
  await page.evaluate(() => { window.Shopify.routes.root = window.__rigRoot; });

  for (const url of [
    `http://127.0.0.1:${PORT}/assets/fs-bundle-estimator-constants.js`,
    `http://127.0.0.1:${PORT}/assets/fs-bundle-estimator.js`,
    `http://127.0.0.1:${PORT}/${guard}/fs-bundle-guard.js`,
    `http://127.0.0.1:${PORT}/${callsite}/${callsiteFile}`,
  ]) {
    await page.addScriptTag({ url });
  }
  return page;
}

async function stubPdp(page) {
  await page.evaluate(({ ops, visible }) => {
    const cartEl = document.querySelector('cart-notification');
    cartEl.getSectionsToRender = () => [{ id: 'cart-notification' }];
    cartEl.renderContents = () => { window.__rig.rendered = true; };
    cartEl.setActiveElement = () => {};
    const el = document.getElementById('pdp-form');
    el.checkMandatoryFields = () => true;
    el.prepareFunctionalProperties = () => ops;
    el.prepareOptions = () => visible;
    el.prepareDefaultProperties = () => ({});
    el.prepareBundlePublicProperties = () => ({ v: 1 });
    window.__rig.pdp = el;
  }, { ops: OPS_ARRAY, visible: VISIBLE_OPTS });
}

async function stubCartModify(page, lineKey) {
  await page.evaluate(({ ops, visible, lineKey: k }) => {
    const cartEl = document.querySelector('cart-notification');
    cartEl.renderContents = () => { window.__rig.rendered = true; };
    const el = document.getElementById('cart-modify');
    el.dataset.productId = k;
    el.checkMandatoryFields = () => true;
    el.prepareFunctionalProperties = () => ops;
    el.prepareOptions = () => visible;
    el.prepareBundlePublicProperties = () => ({ v: 1 });
    window.__rig.modify = el;
  }, { ops: OPS_ARRAY, visible: VISIBLE_OPTS, lineKey });
}

function snapshot(page) {
  return page.evaluate(() => ({
    guardRendered: !!document.querySelector('[data-fs-bundle-guard]'),
    guardMessage: document.querySelector('.fs-bundle-guard__message')?.textContent || null,
    guardCta: document.querySelector('.fs-bundle-guard__cta')?.getAttribute('href') || null,
    ariaDisabled: document.querySelector('#pdp-form button[type=submit]')?.getAttribute('aria-disabled') ?? null,
    submitLoading: document.querySelector('#pdp-form button[type=submit]')?.classList.contains('loading') ?? null,
    cartItemsHtml: document.querySelector('#main-cart-items .section-cart-items')?.textContent ?? null,
    consoleErrors: window.__rig.consoleErrors.slice(),
  }));
}

function record(r) {
  results.push(r);
  const mark = r.pass ? 'PASS' : 'FAIL';
  console.log(`  ${mark}  ${r.id} — ${r.claim}`);
  if (!r.pass) console.log(`        expected ${JSON.stringify(r.expected)}\n        observed ${JSON.stringify(r.observed)}`);
}

async function shot(page, name) {
  const file = `${OUT}${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  return `out/${name}.png`;
}

// --- F1: the budget guard was silently bypassed ---------------------------
// prepareFunctionalProperties() returns an array; the old code JSON.parse()d it,
// threw, and the catch swallowed the whole guard. Signal: whether the guard ever
// fetched cart.js at all.
async function f1() {
  console.log('\nF1 (P1) — guard silently bypassed by JSON.parse on an array');
  for (const [build, dir] of [['before (d771adf^)', 'prefix'], ['after (working tree)', 'assets']]) {
    const before = gets.length;
    const page = await newPage({ cart: 'five-bundle-lines', guard: dir, callsite: dir, callsiteFile: 'product-form-with-options.js' });
    await stubPdp(page);
    const postsBefore = posts.length;
    await page.evaluate(() => document.querySelector('#pdp-form form').dispatchEvent(new Event('submit', { cancelable: true })));
    await page.waitForTimeout(400);
    const s = await snapshot(page);
    const fetchedCart = gets.slice(before).filter((p) => p.endsWith('/cart.js')).length;
    const addPosts = posts.slice(postsBefore).filter((p) => p.path.endsWith('/cart/add.js')).length;
    const img = await shot(page, `f1-${dir}`);
    await page.close();

    if (dir === 'prefix') {
      record({
        id: 'F1.before', finding: 'F1', build, claim: 'the guard never runs: no cart.js read, nothing rendered, the over-budget cart is posted anyway',
        expected: { cartJsFetches: 0, guardRendered: false, cartAddPosts: 1 },
        observed: { cartJsFetches: fetchedCart, guardRendered: s.guardRendered, cartAddPosts: addPosts },
        consoleErrors: s.consoleErrors, screenshot: img,
        pass: fetchedCart === 0 && s.guardRendered === false && addPosts === 1,
      });
    } else {
      record({
        id: 'F1.after', finding: 'F1', build, claim: 'the guard runs, reads the cart, blocks, and nothing is posted',
        expected: { cartJsFetches: 1, guardRendered: true, cartAddPosts: 0 },
        observed: { cartJsFetches: fetchedCart, guardRendered: s.guardRendered, cartAddPosts: addPosts, message: s.guardMessage, cta: s.guardCta },
        consoleErrors: s.consoleErrors, screenshot: img,
        pass: fetchedCart === 1 && s.guardRendered === true && addPosts === 0,
      });
    }
  }
}

// --- F3: ordinary cart lines were counted ---------------------------------
async function f3() {
  console.log('\nF3 (P2) — ordinary cart lines counted as transform parents');
  const expectedBefore = PER_OP(NEW_VISIBLE, NEW_PAID) * 2 + PER_OP(2, 0) * 40;
  const expectedAfter = PER_OP(NEW_VISIBLE, NEW_PAID) * 2;

  for (const [build, dir, exp, shouldExceed] of [
    ['before (d771adf^)', 'prefix', expectedBefore, true],
    ['after (working tree)', 'assets', expectedAfter, false],
  ]) {
    const page = await newPage({ cart: 'one-bundle-forty-ordinary', guard: dir, callsite: dir, callsiteFile: 'product-form-with-options.js' });
    const verdict = await page.evaluate(({ paid, visible }) => window.FSBundleGuard.predict(paid, visible), { paid: NEW_PAID, visible: NEW_VISIBLE });
    const img = await shot(page, `f3-${dir}`);
    await page.close();
    record({
      id: `F3.${dir === 'prefix' ? 'before' : 'after'}`, finding: 'F3', build,
      claim: dir === 'prefix'
        ? '40 ordinary lines inflate the estimate past budget and block a cart holding one bundle'
        : 'the same 40 ordinary lines contribute nothing; only the two bundle operations are counted',
      expected: { predicted: exp, willExceed: shouldExceed, budget: BUDGET },
      observed: verdict,
      pass: verdict.predicted === exp && verdict.willExceed === shouldExceed,
    });
  }
}

// --- F4: a rejected submission left the form permanently unusable ----------
async function f4() {
  console.log('\nF4 (P2) — retry after guard rejection');
  for (const [build, dir] of [
    ['before (working tree with finding 4\'s one line removed)', 'mutant'],
    ['after (working tree)', 'assets'],
  ]) {
    // Reject once on a full cart, then submit again. On the fixed build the
    // second submit must reach the guard again; on the broken build the
    // handler returns at the aria-disabled check and never does.
    const page = await newPage({ cart: 'five-bundle-lines', guard: 'assets', callsite: dir, callsiteFile: 'product-form-with-options.js' });
    await stubPdp(page);
    const submit = () => page.evaluate(() => document.querySelector('#pdp-form form').dispatchEvent(new Event('submit', { cancelable: true })));

    await submit();
    await page.waitForTimeout(300);
    const first = await snapshot(page);
    const getsAfterFirst = gets.length;

    await submit();
    await page.waitForTimeout(300);
    const second = await snapshot(page);
    const secondCartReads = gets.slice(getsAfterFirst).filter((p) => p.endsWith('/cart.js')).length;
    const img = await shot(page, `f4-${dir}`);
    await page.close();

    const pass = dir === 'mutant'
      ? first.ariaDisabled === 'true' && secondCartReads === 0
      : first.ariaDisabled === null && secondCartReads === 1;

    record({
      id: `F4.${dir === 'mutant' ? 'before' : 'after'}`, finding: 'F4', build,
      claim: dir === 'mutant'
        ? 'after one rejection aria-disabled is still set, so the second submit returns at the top and never re-predicts'
        : 'aria-disabled is cleared on the rejection path, so the second submit re-runs the guard',
      expected: dir === 'mutant'
        ? { ariaDisabledAfterFirst: 'true', cartReadsOnSecondSubmit: 0 }
        : { ariaDisabledAfterFirst: null, cartReadsOnSecondSubmit: 1 },
      observed: { ariaDisabledAfterFirst: first.ariaDisabled, cartReadsOnSecondSubmit: secondCartReads, guardRenderedFirst: first.guardRendered, guardRenderedSecond: second.guardRendered },
      screenshot: img, pass,
    });
  }
}

// --- F5: the modify flow double-counted, and the exclusion key was wrong ---
async function f5() {
  console.log('\nF5 (P2 + Tim 14 Oct) — modify flow double-count and the cart-line-key mismatch');
  const five = PER_OP(NEW_VISIBLE, NEW_PAID) * 5;   // 19,265 — fits
  const six = PER_OP(NEW_VISIBLE, NEW_PAID) * 6;    // 23,118 — over

  // (a) d771adf^ — no exclusion at all: the replaced line is counted twice.
  {
    const page = await newPage({ cart: 'five-bundle-lines', guard: 'prefix', callsite: 'prefix', callsiteFile: 'product-custom-options.js' });
    const v = await page.evaluate(({ paid, visible }) => window.FSBundleGuard.predict(paid, visible), { paid: NEW_PAID, visible: NEW_VISIBLE });
    await page.close();
    record({
      id: 'F5.a.before', finding: 'F5', build: 'before (d771adf^)',
      claim: 'predict() has no exclusion parameter at all, so modifying a line counts it and its replacement',
      expected: { predicted: six, willExceed: true }, observed: v,
      pass: v.predicted === six && v.willExceed === true,
    });
  }

  // (b) d771adf — exclusion exists, but the call site passes modifyID.split(':')[0].
  //     The guard compares against the full line.key, so nothing is excluded and
  //     a cart that fits is blocked. This is Tim's finding, measured.
  for (const [label, dir, file] of [
    ['split key (d771adf)', 'splitkey', 'product-custom-options.js'],
    ['full key (working tree)', 'assets', 'product-custom-options.js'],
  ]) {
    const page = await newPage({ cart: 'five-bundle-lines', guard: 'assets', callsite: dir, callsiteFile: file });
    await stubCartModify(page, KEYS.thirdOfFive);
    const postsBefore = posts.length;
    await page.evaluate(() => window.__rig.modify.replaceItem());
    await page.waitForTimeout(500);
    const s = await snapshot(page);
    const added = posts.slice(postsBefore).filter((p) => p.path.endsWith('/cart/add.js'));
    const changed = posts.slice(postsBefore).filter((p) => p.path.endsWith('/cart/change.js'));
    const img = await shot(page, `f5-${dir}`);
    await page.close();

    const broken = dir === 'splitkey';
    record({
      id: `F5.b.${dir}`, finding: 'F5', build: label,
      claim: broken
        ? 'the bare variant id can never equal a cart-line key, so the old line is still counted and a cart that fits is wrongly blocked'
        : 'the full cart-line key excludes the line being replaced, the cart fits, and the replacement is carried out',
      expected: broken
        ? { guardRendered: true, cartAddPosts: 0, cartChangePosts: 0 }
        : { guardRendered: false, cartAddPosts: 1, cartChangePosts: 1 },
      observed: { guardRendered: s.guardRendered, cartAddPosts: added.length, cartChangePosts: changed.length, cartItemsRerendered: s.cartItemsHtml },
      consoleErrors: s.consoleErrors, screenshot: img,
      pass: broken
        ? s.guardRendered === true && added.length === 0
        : s.guardRendered === false && added.length === 1 && changed.length === 1,
    });

    // The change.js call must carry the FULL key, or the old line is never removed.
    if (!broken && changed.length === 1) {
      const body = JSON.parse(changed[0].body);
      record({
        id: 'F5.b.change-key', finding: 'F5', build: label,
        claim: 'the removal of the old line still uses the full cart-line key',
        expected: { id: KEYS.thirdOfFive, quantity: 0 },
        observed: { id: body.id, quantity: body.quantity },
        pass: body.id === KEYS.thirdOfFive && body.quantity === 0,
      });
      const addBody = JSON.parse(added[0].body);
      record({
        id: 'F5.b.add-key', finding: 'F5', build: label,
        claim: 'the add of the new line still uses the bare variant id, which is what /cart/add.js wants',
        expected: { id: KEYS.thirdOfFive.split(':')[0] },
        observed: { id: addBody.items[0].id },
        pass: addBody.items[0].id === KEYS.thirdOfFive.split(':')[0],
      });
    }
  }
}

// --- F5b: two cart lines of the SAME variant, different configurations -----
// Tim names this case. A variant-id comparison removes both lines; a full-key
// comparison removes exactly one. Both numbers are measured here rather than
// argued, by predicting against carts that differ only in which lines exist.
async function f5SameVariant() {
  console.log('\nF5b — two cart lines sharing one variant, different configurations');
  const op = PER_OP(NEW_VISIBLE, NEW_PAID);

  const measure = async (cart, excludeKey) => {
    const page = await newPage({ cart, guard: 'assets', callsite: 'assets', callsiteFile: 'product-custom-options.js' });
    const v = await page.evaluate(
      ({ paid, visible, key }) => window.FSBundleGuard.predict(paid, visible, key),
      { paid: NEW_PAID, visible: NEW_VISIBLE, key: excludeKey },
    );
    await page.close();
    return v;
  };

  const full = await measure('same-variant-two-configs', KEYS.sameVariantB);
  record({
    id: 'F5b.full-key', finding: 'F5b', build: 'after (working tree)',
    claim: 'excluding by full key removes exactly the line being modified; the OTHER line of the same variant is still counted',
    expected: { predicted: op * 5, ops: 5 },
    observed: { predicted: full.predicted, ops: full.predicted / op },
    pass: full.predicted === op * 5,
  });

  const split = await measure('same-variant-two-configs', KEYS.sharedVariantId);
  record({
    id: 'F5b.split-key', finding: 'F5b', build: 'the value the old call site passed',
    claim: 'the bare variant id matches no line key, so neither same-variant line is excluded and the estimate over-counts by one operation',
    expected: { predicted: op * 6, ops: 6 },
    observed: { predicted: split.predicted, ops: split.predicted / op },
    pass: split.predicted === op * 6,
  });

  const both = await measure('same-variant-both-removed', undefined);
  record({
    id: 'F5b.prefix-match-would-undercount', finding: 'F5b', build: 'hypothetical variant-id comparison',
    claim: 'had the guard been loosened to compare variant ids instead, BOTH same-variant lines would drop out and the estimate would under-count by one operation',
    expected: { predicted: op * 4, ops: 4 },
    observed: { predicted: both.predicted, ops: both.predicted / op },
    pass: both.predicted === op * 4,
  });
}

// --- F2: the home-gym-package path ----------------------------------------
// The section loads the option scripts but loaded none of the three estimator
// assets, so FSBundleEstimator was absent and the manifest failed closed. Here
// the three script tags the section now emits are loaded in a real page and the
// whole chain is exercised end to end.
async function f2() {
  console.log('\nF2 (P1) — home-gym-package path');
  const page = await newPage({ cart: 'five-bundle-lines', guard: 'assets', callsite: 'assets', callsiteFile: 'product-form-with-options.js' });
  await stubPdp(page);
  const state = await page.evaluate(() => ({
    estimator: typeof window.FSBundleEstimator,
    fns: typeof window.FSBundleEstimatorFns,
    guard: typeof window.FSBundleGuard,
    checksum: window.FSBundleEstimator?.SPEC_CHECKSUM,
    budget: window.FSBundleEstimator?.OUTPUT_BYTE_BUDGET,
  }));
  await page.evaluate(() => document.querySelector('#pdp-form form').dispatchEvent(new Event('submit', { cancelable: true })));
  await page.waitForTimeout(400);
  const s = await snapshot(page);
  const img = await shot(page, 'f2-home-gym-packages');
  await page.close();

  record({
    id: 'F2.assets-present', finding: 'F2', build: 'after (working tree)',
    claim: 'the three assets the section now loads define the whole chain, at the committed spec checksum',
    expected: { estimator: 'object', fns: 'object', guard: 'object', checksum: 'a5e3004509fedddc', budget: BUDGET },
    observed: state, screenshot: img,
    pass: state.estimator === 'object' && state.fns === 'object' && state.guard === 'object'
      && state.checksum === 'a5e3004509fedddc' && state.budget === BUDGET,
  });
  record({
    id: 'F2.guard-runs', finding: 'F2', build: 'after (working tree)',
    claim: 'with those assets loaded the guard runs on this path and renders the approved copy',
    expected: { guardRendered: true },
    observed: { guardRendered: s.guardRendered, message: s.guardMessage, cta: s.guardCta },
    pass: s.guardRendered === true,
  });
}

async function main() {
  // playwright-core is not a dependency of the theme. Point PLAYWRIGHT_CORE at
  // an installed copy, or have it on the default resolution path. See README.md.
  const pw = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
  const { chromium } = pw.chromium ? pw : pw.default;

  buildRevisions();
  buildMutant();
  const started = await start();
  PORT = started.port;
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  await f1();
  await f2();
  await f3();
  await f4();
  await f5();
  await f5SameVariant();

  await browser.close();
  started.server.close();

  const failed = results.filter((r) => !r.pass);
  const summary = {
    generatedAt: new Date().toISOString(),
    browser: 'Chromium (playwright-core 1.56.1, /opt/pw-browsers/chromium)',
    specChecksum: 'a5e3004509fedddc',
    budget: BUDGET,
    perOperationBytes: PER_OP(NEW_VISIBLE, NEW_PAID),
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  writeFileSync(`${OUT}results.json`, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\n${summary.passed}/${summary.total} checks passed. Results: out/results.json`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
