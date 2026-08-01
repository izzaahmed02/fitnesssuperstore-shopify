/*
 * Checks the BYOR rules engine against the scenarios in the BYOR logic sheet.
 *
 *   node scripts/byor-rules-check.js
 *
 * This exercises the pure rules only — no DOM, no network, no product data.
 * Prices and availability are never asserted here; they come from Shopify.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'assets');
const sandbox = {
  window: {},
  HTMLElement: class {},
  console,
  fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['byor-data.js', 'byor-configurator.js'].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
});

const BYOR = sandbox.window.BYOR;
const { rules, newState, billOfMaterials, outstanding, quoteReasons } = BYOR;

const emptyCatalog = { get: () => ({ available: true, price: 0, variantId: 1 }) };

let failures = 0;

function check(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log('  ok   ' + label);
  } else {
    failures += 1;
    console.log('  FAIL ' + label + '\n         expected ' + e + '\n         actual   ' + a);
  }
}

function build(overrides) {
  return Object.assign(newState(), overrides);
}

/* Scenario 1 — Wall Mounted, 1 Section, 43" depth, Basic.
 * Sheet: (2) FF-RR-JB-43-V2PU. One width bar over the squat rack. */
console.log('Scenario 1 — wall mounted, 1 section, 43" depth, Basic');
{
  const state = build({
    mounting: 'wall',
    uprights: { 108: 1 },
    depth: 43,
    topStyle: 'basic',
    sectionBars: { 0: { 'FF-RR-JBS-43-V1-CM': 1 } }
  });
  check('sections', rules.sections(state), 1);
  check('bars per position', rules.barsPerPosition(state), 1);
  check('frame bars', rules.frameBars(state), { 'FF-RR-JB-43-V2PU': 2 });
  check('uprights in build', billOfMaterials(state)['FF-RR-U-108'], 2);
  check('nothing outstanding', outstanding(state), []);
  check('no quote gate', quoteReasons(state, emptyCatalog, billOfMaterials(state)), []);
}

/* Scenario 2 — Floor Mounted, 1 Section, 71" depth, Monkey Bar.
 * Sheet: (3) FF-RR-PB-71 + (2) FF-RR-JB-71-V2PU, and Steps 6/7 forced to
 * crossmembers — 2 x 43" crossmember over the squat rack. */
console.log('Scenario 2 — floor mounted, 1 section, 71" depth, Monkey Bar');
{
  const state = build({
    mounting: 'floor',
    uprights: { 108: 2 },
    depth: 71,
    topStyle: 'monkey'
  });
  check('sections', rules.sections(state), 1);
  check('bars per position', rules.barsPerPosition(state), 2);
  check('monkey forces crossmembers', rules.forcesCrossmembers(state), true);
  check('frame bars', rules.frameBars(state), { 'FF-RR-PB-71': 3, 'FF-RR-JB-71-V2PU': 2 });
  const bom = billOfMaterials(state);
  check('uprights', bom['FF-RR-U-108'], 4);
  check('forced 43" crossmembers over squat rack', bom['FF-RR-JBS-43-V1-CM'], 2);
  check('nothing outstanding', outstanding(state), []);
}

/* Scenario 3 — Wall Mounted, 3 Sections, 43" spacing, Basic w/Crossmembers.
 * Sheet: (5) FF-RR-JBS-43-V1-CM for three wall mounted sections. */
console.log('Scenario 3 — wall mounted, 3 sections, Basic w/Crossmembers');
{
  const state = build({
    mounting: 'wall',
    uprights: { 108: 3 },
    depth: 43,
    spacing: 43,
    topStyle: 'basic_cm'
  });
  check('sections', rules.sections(state), 3);
  check('spans between sections', rules.gaps(state), 2);
  check('frame bars', rules.frameBars(state), { 'FF-RR-JBS-43-V1-CM': 5 });
  check('one width bar per position', rules.barsPerPosition(state), 1);
}

/* Scenario 4 — Floor Mounted, 2 Sections, 43" depth, 71" spacing, Monkey Bar.
 * Sheet: (11) FF-RR-PB-43 + (4) FF-RR-JB-43-V2PU. */
console.log('Scenario 4 — floor mounted, 2 sections, 71" spacing, Monkey Bar');
{
  const state = build({
    mounting: 'floor',
    uprights: { 108: 4 },
    depth: 43,
    spacing: 71,
    topStyle: 'monkey'
  });
  check('sections', rules.sections(state), 2);
  check('frame bars', rules.frameBars(state), { 'FF-RR-PB-43': 11, 'FF-RR-JB-43-V2PU': 4 });
  const bom = billOfMaterials(state);
  check('forced 71" crossmembers in the span', bom['FF-RR-JBS-71-V1-CM'], 2);
  check('storage available', rules.storageAvailable(state), true);
}

/* Same rig with 43" spacing — sheet drops the pull-up bar count to (9). */
console.log('Scenario 4b — same rig, 43" spacing');
{
  const state = build({
    mounting: 'floor',
    uprights: { 108: 4 },
    depth: 43,
    spacing: 43,
    topStyle: 'monkey'
  });
  check('frame bars', rules.frameBars(state), { 'FF-RR-PB-43': 9, 'FF-RR-JB-43-V2PU': 4 });
}

/* Three sections and up add per extra section: +6 at 43" spacing, +8 at 71". */
console.log('Monkey bar scaling past two sections');
{
  const at43 = build({ mounting: 'floor', uprights: { 108: 6 }, depth: 43, spacing: 43, topStyle: 'monkey' });
  const at71 = build({ mounting: 'floor', uprights: { 108: 6 }, depth: 43, spacing: 71, topStyle: 'monkey' });
  check('3 sections at 43" spacing', rules.frameBars(at43)['FF-RR-PB-43'], 15);
  check('3 sections at 71" spacing', rules.frameBars(at71)['FF-RR-PB-43'], 19);
}

/* Scenario 5 — Floor Mounted, 2 Sections, 20" spacing.
 * Sheet: the 20" span is not a bar choice, the crossmember is fixed. */
console.log('Scenario 5 — floor mounted, 2 sections, 20" spacing');
{
  const state = build({
    mounting: 'floor',
    uprights: { 108: 4 },
    depth: 43,
    spacing: 20,
    topStyle: 'basic',
    sectionBars: { 0: { 'FF-RR-PB-43': 2 }, 1: { 'FF-RR-PB-43': 2 } }
  });
  check('fixed crossmember for the span', rules.fixedGapSku(state), 'FF-RR-JBS-20-CM');
  check('fixed crossmember quantity', billOfMaterials(state)['FF-RR-JBS-20-CM'], 2);
  check('no storage tiers at 20" spans', rules.storageAvailable(state), false);
  check('nothing outstanding', outstanding(state), []);
}

/* Quote gates from the v8 direction. */
console.log('Quote gates');
{
  const fourSections = build({ mounting: 'floor', uprights: { 108: 8 }, depth: 43, spacing: 43, topStyle: 'basic' });
  check(
    '4+ sections',
    quoteReasons(fourSections, emptyCatalog, billOfMaterials(fourSections)).indexOf('4 or more sections') > -1,
    true
  );

  const mixed = build({ mounting: 'floor', uprights: { 108: 2, 142: 2 }, depth: 43, spacing: 43, topStyle: 'basic' });
  check('mixed upright heights flagged', rules.mixedUprightHeights(mixed), true);
  check('mixed heights gate the build', quoteReasons(mixed, emptyCatalog, billOfMaterials(mixed)).length > 0, true);

  const half = build({ mounting: 'floor', uprights: { 108: 3 }, depth: 43, spacing: 43, topStyle: 'basic' });
  check('half section detected', rules.hasHalfSection(half), true);
  check('half section is 1.5, never 0.5-labelled', rules.sections(half), 1.5);

  const cable = build({ mounting: 'floor', uprights: { 108: 2 }, depth: 43, topStyle: 'basic', extras: { 'FF-RR-RMCC': 1 } });
  check('cable column gates the build', quoteReasons(cable, emptyCatalog, billOfMaterials(cable)).length > 0, true);

  const unavailable = build({ mounting: 'floor', uprights: { 108: 2 }, depth: 43, topStyle: 'basic' });
  const hiddenCatalog = { get: () => null };
  check(
    'unresolved product gates the build',
    quoteReasons(unavailable, hiddenCatalog, billOfMaterials(unavailable)).length > 0,
    true
  );

  const site = build({ mounting: 'floor', uprights: { 108: 2 }, depth: 43, topStyle: 'basic', siteUncertain: true });
  check('site uncertainty gates the build', quoteReasons(site, emptyCatalog, billOfMaterials(site)).length > 0, true);
}

/* Minimum rig. */
console.log('Minimum rig');
{
  const tooSmall = build({ mounting: 'floor', uprights: { 108: 1 }, depth: 43, topStyle: 'basic' });
  check('one floor pair is under a full section', rules.sections(tooSmall), 0.5);
  check('and is blocked from checkout', outstanding(tooSmall).length > 0, true);
}

/* Every roster SKU referenced by a step must exist in the roster. */
console.log('Roster integrity');
{
  const data = BYOR.data;
  const referenced = [];
  data.uprightHeights.forEach((u) => referenced.push(u.sku));
  Object.keys(data.widthBars).forEach((size) => data.widthBars[size].forEach((o) => referenced.push(o.sku)));
  Object.keys(data.fixedSpacingCrossmember).forEach((k) => referenced.push(data.fixedSpacingCrossmember[k]));
  data.jHooksAndSpotters.jhooks.concat(data.jHooksAndSpotters.spotters).forEach((s) => referenced.push(s));
  Object.keys(data.storageTiers).forEach((size) => data.storageTiers[size].forEach((s) => referenced.push(s)));
  data.otherAttachments.forEach((a) => referenced.push(a.sku));
  [43, 71].forEach((d) => {
    referenced.push('FF-RR-JB-' + d + '-V2PU');
    referenced.push('FF-RR-JBS-' + d + '-V1-CM');
    referenced.push('FF-RR-PB-' + d);
  });

  const orphans = referenced.filter((sku) => !data.roster[sku]);
  check('every referenced SKU has a handle', orphans, []);

  const badHandles = Object.keys(data.roster).filter((sku) => !/^[a-z0-9-]+$/.test(data.roster[sku]));
  check('handles look like storefront handles', badHandles, []);
}

console.log('');
if (failures) {
  console.log(failures + ' check(s) failed.');
  process.exit(1);
}
console.log('All checks passed.');
