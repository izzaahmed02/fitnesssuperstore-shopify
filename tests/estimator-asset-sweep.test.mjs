// Every Liquid file that loads an option script must also load all three
// Item C assets.
//
// Run: node tests/estimator-asset-sweep.test.mjs
//
// This test exists because the same defect has now been found twice, and both
// times by someone else:
//
//   * Codex, PR #931 — sections/main-product-home-gym-packages.liquid loaded
//     the option scripts and none of the three assets.
//   * This sweep, 14 October — snippets/cart-drawer.liquid did the same. The
//     round that fixed the first one swept sections/ ONLY, so a snippet that is
//     rendered from layout/theme.liquid on every page went unchecked.
//
// The failure is silent in both directions. window.FSBundleEstimator absent
// means prepareBundlePublicProperties() fails closed by design, so the line
// carries no _bundlePublicProperties manifest and the transform treats it as a
// fault; window.FSBundleGuard absent means the budget guard never runs and the
// customer meets the block at checkout instead of on the page. Neither throws
// anywhere a human would see.
//
// So the sweep covers every directory that can emit a script tag, not the one
// that happened to be wrong last time.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['sections', 'snippets', 'layout', 'templates', 'blocks'];

const OPTION_SCRIPTS = ['product-custom-options.js', 'product-form-with-options.js'];
const REQUIRED = [
  'fs-bundle-estimator-constants.js',
  'fs-bundle-estimator.js',
  'fs-bundle-guard.js',
];

function liquidFiles(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(liquidFiles(p));
    else if (p.endsWith('.liquid')) out.push(p);
  }
  return out;
}

// `'fs-bundle-estimator.js'` is a substring of nothing else, but
// `fs-bundle-estimator-constants.js` contains neither — match the quoted asset
// name so the two estimator files are never confused for one another.
const loads = (text, asset) => text.includes(`'${asset}'`);

const files = ROOTS.flatMap(liquidFiles);
const swept = files.length;
const failures = [];
let carriers = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (!OPTION_SCRIPTS.some((s) => loads(text, s))) continue;
  carriers += 1;
  const missing = REQUIRED.filter((a) => !loads(text, a));
  if (missing.length) failures.push({ file, missing });
}

console.log(`swept ${swept} Liquid files across ${ROOTS.join(', ')}`);
console.log(`${carriers} load an option script`);

if (carriers === 0) {
  console.error('FAIL: no file loads an option script — the sweep is matching nothing, which is not a pass');
  process.exit(1);
}

if (failures.length) {
  for (const f of failures) {
    console.error(`FAIL ${f.file} loads an option script but not: ${f.missing.join(', ')}`);
  }
  process.exit(1);
}

console.log('PASS: every option-script carrier loads all three Item C assets');
