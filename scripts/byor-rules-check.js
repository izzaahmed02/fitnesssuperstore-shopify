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

['byor-data.js', 'byor-visual.js', 'byor-share.js', 'byor-configurator.js'].forEach((file) => {
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

/* -------------------------------------------------------------------------
 * Scale-aware 2D visual — geometry only, no DOM.
 * ---------------------------------------------------------------------- */
const visual = BYOR.visual;

console.log('Visual geometry');
{
  // Wall mounted, one section: two columns bracketing a single 43" bay.
  const wall = visual.buildGeometry(
    build({ mounting: 'wall', uprights: { 108: 1 }, depth: 43, topStyle: 'basic' }),
    rules
  );
  check('wall 1 section — column count', wall.columns.length, 2);
  check('wall 1 section — column positions', wall.columns.map((c) => c.x), [0, 43]);
  check('wall 1 section — overall width', wall.totalWidth, 43);
  check('wall 1 section — height', wall.maxHeight, 108);
  check('wall 1 section — upright count', wall.uprightCount, 2);
  check('wall 1 section — no spans', wall.spans.length, 0);

  // Floor mounted, one section: same footprint, twice the uprights.
  const floor1 = visual.buildGeometry(
    build({ mounting: 'floor', uprights: { 108: 2 }, depth: 43, topStyle: 'basic' }),
    rules
  );
  check('floor 1 section — column count', floor1.columns.length, 2);
  check('floor 1 section — overall width', floor1.totalWidth, 43);
  check('floor 1 section — upright count', floor1.uprightCount, 4);

  // Floor mounted, two sections at 43" spacing: 43 + 43 + 43.
  const floor2 = visual.buildGeometry(
    build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: 'basic' }),
    rules
  );
  check('floor 2 sections — column positions', floor2.columns.map((c) => c.x), [0, 43, 86, 129]);
  check('floor 2 sections — overall width', floor2.totalWidth, 129);
  check('floor 2 sections — section runs', floor2.sections.map((s) => s.width), [43, 43]);
  check('floor 2 sections — span runs', floor2.spans.map((s) => s.width), [43]);
  check('floor 2 sections — not a partial bay', floor2.hasPartialBay, false);

  // 71" spacing widens only the span.
  const wide = visual.buildGeometry(
    build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 71, topStyle: 'basic' }),
    rules
  );
  check('71" spacing — overall width', wide.totalWidth, 157);
  check('71" spacing — span width', wide.spans.map((s) => s.width), [71]);

  // 1.5 sections: an odd column count, drawn as a partial bay rather than
  // being rounded up to a full second section.
  const half = visual.buildGeometry(
    build({ mounting: 'floor', uprights: { 108: 3 }, depth: 43, spacing: 43, topStyle: 'basic' }),
    rules
  );
  check('1.5 sections — column count', half.columns.length, 3);
  check('1.5 sections — overall width', half.totalWidth, 86);
  check('1.5 sections — flagged partial bay', half.hasPartialBay, true);

  // Mixed heights: tallest first, and flagged so the caption can say so.
  const mixed = visual.buildGeometry(
    build({ mounting: 'floor', uprights: { 108: 2, 120: 2 }, depth: 43, spacing: 43, topStyle: 'basic' }),
    rules
  );
  check('mixed heights — flagged', mixed.mixedHeights, true);
  check('mixed heights — tallest first', mixed.columns.map((c) => c.height), [120, 120, 108, 108]);
  check('mixed heights — overall height', mixed.maxHeight, 120);

  // Not enough information to draw anything honest.
  check('no mounting — nothing drawn', visual.buildGeometry(build({ uprights: { 108: 2 } }), rules), null);
  check('no uprights — nothing drawn', visual.buildGeometry(build({ mounting: 'floor' }), rules), null);
  check(
    'multi-section without spacing — nothing drawn',
    visual.buildGeometry(build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43 }), rules),
    null
  );
}

/* -------------------------------------------------------------------------
 * Saved / shareable output — encode/decode round trip.
 * ---------------------------------------------------------------------- */
const share = BYOR.share;

console.log('Share encode/decode');
{
  const original = build({
    layoutId: 'training-2',
    mounting: 'floor',
    uprights: { 108: 4 },
    depth: 43,
    spacing: 43,
    topStyle: 'basic',
    sectionBars: { 0: { 'FF-RR-PB-43': 2 }, 1: { 'FF-RR-PB-43': 2 } },
    gapBars: { 0: { 'FF-RR-DPB-43': 2 } },
    hooks: 'both',
    hookQty: { 'FF-RR-JC': 2 },
    extras: { 'FF-RR-BP': 1 },
    siteUncertain: true
  });

  const token = share.encode(original);
  const restored = share.decode(token, newState());

  check('round trip — mounting', restored.mounting, 'floor');
  check('round trip — uprights', restored.uprights, { 108: 4 });
  check('round trip — depth', restored.depth, 43);
  check('round trip — spacing', restored.spacing, 43);
  check('round trip — top style', restored.topStyle, 'basic');
  check('round trip — layout id', restored.layoutId, 'training-2');
  check('round trip — section bars', restored.sectionBars, original.sectionBars);
  check('round trip — gap bars', restored.gapBars, original.gapBars);
  check('round trip — hook quantities', restored.hookQty, { 'FF-RR-JC': 2 });
  check('round trip — extras', restored.extras, { 'FF-RR-BP': 1 });
  check('round trip — site uncertainty', restored.siteUncertain, true);

  // The restored build must resolve to exactly the same parts list.
  check(
    'round trip — identical bill of materials',
    billOfMaterials(restored),
    billOfMaterials(original)
  );
  check('round trip — identical section count', rules.sections(restored), rules.sections(original));

  // A restored build draws the same picture.
  check(
    'round trip — identical geometry width',
    visual.buildGeometry(restored, rules).totalWidth,
    visual.buildGeometry(original, rules).totalWidth
  );

  // Untrusted input must never yield a half-valid state.
  check('rejects empty token', share.decode('', newState()), null);
  check('rejects non-string token', share.decode(null, newState()), null);
  check('rejects characters outside the alphabet', share.decode('not a token!!', newState()), null);
  check('rejects truncated token', share.decode(token.slice(0, 12), newState()), null);
  check('rejects a token with no build in it', share.decode(share.encode(newState()), newState()), null);

  // Injected keys and junk values are dropped, not merged.
  const dirty = share.decode(
    share.encode(
      build({
        mounting: 'floor',
        uprights: { 108: 2, '<script>': 5, 999: -3 },
        depth: 43,
        topStyle: 'basic',
        extras: { 'FF-RR-BP': 'lots' }
      })
    ),
    newState()
  );
  check('drops non-token upright keys', dirty.uprights, { 108: 2 });
  check('drops non-numeric quantities', dirty.extras, {});
  check('rejects an unknown mounting value', share.decode(share.encode(build({ mounting: 'roof', uprights: { 108: 2 } })), newState()).mounting, null);
}

console.log('');
if (failures) {
  console.log(failures + ' check(s) failed.');
  process.exit(1);
}
console.log('All checks passed.');
