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

/* -------------------------------------------------------------------------
 * Regression checks for the PR #710 review findings and the quote gates.
 * Each finding check fails on the #710 code and passes after its fix.
 * ---------------------------------------------------------------------- */

// A raw link token for payloads encode() would never produce.
function rawToken(payload) {
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

// Mirrors the summary's add-to-cart gate: nothing outstanding and no quote reason.
function cartEligible(state, catalog) {
  return outstanding(state).length === 0 && quoteReasons(state, catalog, billOfMaterials(state)).length === 0;
}

// Live catalog only ever holds roster SKUs; anything else resolves to null.
const rosterCatalog = {
  get: (sku) => (BYOR.data.roster[sku] ? { available: true, price: 0, variantId: 1 } : null)
};

const storageSkus = (lines) => Object.keys(lines).filter((sku) => BYOR.data.storageTiers[43].concat(BYOR.data.storageTiers[71]).indexOf(sku) > -1);
const monkeyBarSkus = (lines) => Object.keys(lines).filter((sku) => /^FF-RR-PB-/.test(sku));

console.log('Finding A — stale storage tiers');
{
  const picks = { 0: { 'FF-RR-BPR-43': 2, 'FF-RR-KBR-43': 1 } };
  const floor = build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: 'basic', storage: picks });
  check('floor 2 sections — storage counted', storageSkus(billOfMaterials(floor)), ['FF-RR-BPR-43', 'FF-RR-KBR-43']);

  const wall = build(Object.assign({}, floor, { mounting: 'wall' }));
  check('floor → wall — no storage in the build', storageSkus(billOfMaterials(wall)), []);

  const oneSection = build(Object.assign({}, floor, { uprights: { 108: 2 } }));
  check('2 → 1 section — no storage in the build', storageSkus(billOfMaterials(oneSection)), []);

  const fixedSpan = build(Object.assign({}, floor, { spacing: 20 }));
  check('43" → 20" spacing — no storage in the build', storageSkus(billOfMaterials(fixedSpan)), []);

  const linked = share.decode(share.encode(wall), newState());
  check('shared wall link carrying storage — no storage in the build', storageSkus(billOfMaterials(linked)), []);
}

console.log('Finding B — unknown top style');
{
  const zzz = build({ mounting: 'floor', uprights: { 108: 2 }, depth: 43, topStyle: 'zzz' });
  check('unknown style adds no frame bars', rules.frameBars(zzz), {});

  const decoded = share.decode(rawToken({ v: 1, m: 'floor', u: { 108: 2 }, d: 43, t: 'zzz' }), newState());
  check('t=zzz decodes to an unset top style', decoded.topStyle, null);
  check('t=zzz build asks for a top style again', outstanding(decoded).indexOf('Choose your depth bar style.') > -1, true);
  check('t=zzz build has no monkey-bar SKUs', monkeyBarSkus(billOfMaterials(decoded)), []);
  check('t=zzz build is not cart-eligible', cartEligible(decoded, emptyCatalog), false);

  const wallMonkey = share.decode(rawToken({ v: 1, m: 'wall', u: { 108: 1 }, d: 43, t: 'monkey' }), newState());
  check('wall + t=monkey decodes to an unset top style', wallMonkey.topStyle, null);
  check('wall + t=monkey keeps the rest of the build', [wallMonkey.mounting, wallMonkey.uprights, wallMonkey.depth], ['wall', { 108: 1 }, 43]);
  check('wall + t=monkey has no floor-only monkey-bar SKUs', monkeyBarSkus(billOfMaterials(wallMonkey)), []);

  const floorMonkey = share.decode(rawToken({ v: 1, m: 'floor', u: { 108: 2 }, d: 43, t: 'monkey' }), newState());
  check('floor + t=monkey still restores', floorMonkey.topStyle, 'monkey');

  // byor-share.js keeps its own copy of the Step 5 styles; it must not drift.
  const styleIds = rules.topStyles({ mounting: 'floor' }).map((s) => s.id).sort();
  const accepted = styleIds.filter((id) => share.decode(rawToken({ v: 1, m: 'floor', u: { 108: 2 }, t: id }), newState()).topStyle === id);
  check('share decode accepts every Step 5 style', accepted, styleIds);
}

console.log('Finding C — stale second-row bars');
{
  const secondRow = {
    secondRow: true,
    secondRowSectionBars: { 0: { 'FF-RR-MGPUB': 1, 'FF-RR-PB-43': 1 } },
    secondRowGapBars: { 0: { 'FF-RR-MSGPUB': 1 } }
  };
  ['basic_cm', 'monkey'].forEach((from) => {
    const before = build(Object.assign({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: from }, secondRow));
    check(from + ' — crossmember-only second-row bars counted', [billOfMaterials(before)['FF-RR-MGPUB'], billOfMaterials(before)['FF-RR-MSGPUB']], [1, 1]);

    const after = build(Object.assign({}, before, { topStyle: 'basic' }));
    const lines = billOfMaterials(after);
    check(from + ' → basic — no crossmember-only second-row bars', [lines['FF-RR-MGPUB'], lines['FF-RR-MSGPUB']], [undefined, undefined]);
    check(from + ' → basic — still-valid second-row bar kept', lines['FF-RR-PB-43'] >= 1, true);
  });

  const linked = share.decode(rawToken({ v: 1, m: 'floor', u: { 108: 4 }, d: 43, s: 43, t: 'basic', r2: 1, r2sb: { 0: { 'FF-RR-MGPUB': 1 } } }), newState());
  check('shared basic link with a crossmember-only second-row bar — not in the build', billOfMaterials(linked)['FF-RR-MGPUB'], undefined);

  const fixedSpan = build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 20, topStyle: 'basic', secondRow: true, secondRowGapBars: { 0: { 'FF-RR-PB-43': 1 } } });
  check('20" spacing — no second-row span bars', billOfMaterials(fixedSpan)['FF-RR-PB-43'], undefined);
}

console.log('Malformed share links');
{
  const blankKeys = Object.keys(newState()).sort();
  const safeDecode = (encoded) => {
    try {
      return { value: share.decode(encoded, newState()) };
    } catch (err) {
      return { threw: err.message };
    }
  };

  check('bad base64 — rejected', safeDecode('AAAAAAAAAAAAAAAA'), { value: null });
  check('base64 of non-JSON — rejected', safeDecode(rawToken('hello')), { value: null });
  check('JSON array payload — rejected', safeDecode(rawToken('[1,2]')), { value: null });
  check('wrong version — rejected', safeDecode(rawToken({ v: 2, m: 'floor', u: { 108: 2 } })), { value: null });
  check(
    'wrong types and no usable build — rejected',
    safeDecode(rawToken({ v: 1, m: ['floor'], u: '108', d: '43x', s: {}, t: 7, r2: 'yes', h: {}, su: '1', sb: [1], st: 'x', x: null })),
    { value: null }
  );

  const wrongTypes = safeDecode(rawToken({ v: 1, m: 'floor', u: { 108: 2 }, d: '43x', s: {}, t: 7, r2: 'yes', h: {}, su: '1', sb: [1], st: 'x', x: null })).value;
  check(
    'wrong-typed fields are dropped, not guessed',
    [wrongTypes.depth, wrongTypes.spacing, wrongTypes.topStyle, wrongTypes.secondRow, wrongTypes.hooks, wrongTypes.siteUncertain, wrongTypes.sectionBars, wrongTypes.storage, wrongTypes.extras],
    [null, null, null, false, 'none', false, {}, {}, {}]
  );
  check('wrong-typed build is incomplete, not cart-eligible', cartEligible(wrongTypes, emptyCatalog), false);

  const extra = safeDecode(rawToken({ v: 1, m: 'floor', u: { 108: 2 }, d: 43, t: 'basic', evil: '<script>', price: 1, constructor: { a: 1 } })).value;
  check('extra fields are not carried into the build', Object.keys(extra).sort(), blankKeys);

  const proto = safeDecode(rawToken('{"v":1,"m":"floor","u":{"108":2},"__proto__":{"polluted":1}}')).value;
  check('__proto__ in a link pollutes nothing', [({}).polluted, proto.polluted], [undefined, undefined]);
}

console.log('Quote gates — not cart-eligible');
{
  const floorFour = build({ mounting: 'floor', uprights: { 108: 8 }, depth: 43, spacing: 43, topStyle: 'basic' });
  check('floor 4 sections — not cart-eligible', cartEligible(floorFour, emptyCatalog), false);
  const wallFour = build({ mounting: 'wall', uprights: { 108: 4 }, depth: 43, spacing: 43, topStyle: 'basic' });
  check('wall 4 sections — quote gated', quoteReasons(wallFour, emptyCatalog, billOfMaterials(wallFour)).indexOf('4 or more sections') > -1, true);
  check('wall 4 sections — not cart-eligible', cartEligible(wallFour, emptyCatalog), false);

  // Scenario 1 is complete and cart-eligible with every part resolvable...
  const starter = build({ mounting: 'wall', uprights: { 108: 1 }, depth: 43, topStyle: 'basic', sectionBars: { 0: { 'FF-RR-JBS-43-V1-CM': 1 } } });
  check('complete 1-section build — cart-eligible', cartEligible(starter, rosterCatalog), true);

  // ...but one SKU missing from the roster/catalog routes it to quote.
  const missing = build(Object.assign({}, starter, { extras: { 'FF-RR-NOT-A-SKU': 1 } }));
  check('SKU missing from the catalog — quote gated', quoteReasons(missing, rosterCatalog, billOfMaterials(missing)).length > 0, true);
  check('SKU missing from the catalog — not cart-eligible', cartEligible(missing, rosterCatalog), false);

  // An unlisted / unavailable product resolves but is not purchasable.
  const unlistedCatalog = {
    get: (sku) => (sku === 'FF-RR-JBS-43-V1-CM' ? { available: false, price: 0, variantId: 1 } : rosterCatalog.get(sku))
  };
  check('unavailable SKU — quote gated', quoteReasons(starter, unlistedCatalog, billOfMaterials(starter)).length > 0, true);
  check('unavailable SKU — not cart-eligible', cartEligible(starter, unlistedCatalog), false);
}

console.log('Share round trip — logic-sheet scenarios');
{
  const scenarios = {
    'Scenario 1': build({ mounting: 'wall', uprights: { 108: 1 }, depth: 43, topStyle: 'basic', sectionBars: { 0: { 'FF-RR-JBS-43-V1-CM': 1 } } }),
    'Scenario 2': build({ mounting: 'floor', uprights: { 108: 2 }, depth: 71, topStyle: 'monkey' }),
    'Scenario 3': build({ mounting: 'wall', uprights: { 108: 3 }, depth: 43, spacing: 43, topStyle: 'basic_cm' }),
    'Scenario 4': build({ mounting: 'floor', uprights: { 108: 4 }, depth: 43, spacing: 71, topStyle: 'monkey' }),
    'Scenario 5': build({
      mounting: 'floor',
      uprights: { 108: 4 },
      depth: 43,
      spacing: 20,
      topStyle: 'basic',
      sectionBars: { 0: { 'FF-RR-PB-43': 2 }, 1: { 'FF-RR-PB-43': 2 } }
    }),
    'second row + storage': build({
      mounting: 'floor',
      uprights: { 108: 4 },
      depth: 43,
      spacing: 43,
      topStyle: 'basic_cm',
      secondRow: true,
      secondRowSectionBars: { 0: { 'FF-RR-MGPUB': 1 } },
      secondRowGapBars: { 0: { 'FF-RR-PB-43': 1 } },
      storage: { 0: { 'FF-RR-BPR-43': 2 } }
    })
  };
  Object.keys(scenarios).forEach((name) => {
    const original = scenarios[name];
    const restored = share.decode(share.encode(original), newState());
    check(name + ' — identical bill of materials after a share round trip', billOfMaterials(restored), billOfMaterials(original));
    check(name + ' — same outstanding steps after a share round trip', outstanding(restored), outstanding(original));
  });
}

console.log('');
if (failures) {
  console.log(failures + ' check(s) failed.');
  process.exit(1);
}
console.log('All checks passed.');
