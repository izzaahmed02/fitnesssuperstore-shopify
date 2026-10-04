// Item C's cross-repository drift test (§C.1), theme side.
//
// Runs the shared golden vectors through THIS repository's estimator and fails
// on any disagreement with the expected value. Adding a vector to
// fs-bundle-api/scripts/estimator-spec.json breaks both repositories until both
// are regenerated — which is the point.
//
// Run: node tests/estimator-drift.test.mjs

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load the generated constants the way the browser does.
globalThis.window = globalThis;
new Function(readFileSync('assets/fs-bundle-estimator-constants.js', 'utf8'))();
const K = globalThis.FSBundleEstimator;
const { estimateBytes } = require('../assets/fs-bundle-estimator.js');

const CART_LINE_ID = 'x'.repeat(59);
const MERCH = 'gid://shopify/ProductVariant/50007518413077';
const D3_PROPS = [
  ['Warranty', 'Lifetime Frame + 10 Yrs Parts + 1 Yr On-Site Labor'],
  ['Processing Time', 'Ships from our Warehouse in 3-7 Business Days + Transit Time'],
  ['Paint Colors', 'Matte Black'],
  ['Full Assembly & Installation', 'Curbside Delivery - No Assembly'],
  ['Aluminum Pulley Upgrade', 'Not Selected'],
];

function cart(lines, itemsPerLine, parentAttrBytes, cartLineIdLength) {
  // When a vector states its own parent-attribute byte count, synthesise a
  // single attribute of exactly that size rather than assuming the D.3 set.
  const parentAttributes = parentAttrBytes == null
    ? [{ key: 'Price', value: '$3,299.00' }, ...D3_PROPS.map(([key, value]) => ({ key, value }))]
    : [{ key: '', value: 'y'.repeat(Math.max(0, parentAttrBytes - 25)) }];
  return Array.from({ length: lines }, () => ({
    cartLineId: 'x'.repeat(cartLineIdLength ?? CART_LINE_ID.length),
    expandedCartItems: [
      { merchandiseId: MERCH, attributes: parentAttributes },
      ...Array.from({ length: itemsPerLine - 1 }, () => ({ merchandiseId: MERCH, attributes: [] })),
    ],
  }));
}

let failed = 0;
console.log(`estimator drift test — spec checksum ${K.SPEC_CHECKSUM}`);
for (const v of K.GOLDEN_VECTORS) {
  if (v.estimatedBytes == null || v.cartLines == null || v.expandedItems == null) {
    console.log(`  SKIP  ${v.name} (vector carries no cart shape)`);
    continue;
  }
  // A vector may carry its own parent-attribute size when it describes a real
  // fixture rather than the generic D.3 shape.
  const parentAttrs = v.parentAttributeBytes ?? null;
  const itemsPerLine = v.expandedItems / v.cartLines;
  if (!Number.isInteger(itemsPerLine)) {
    console.log(`  SKIP  ${v.name} (expandedItems not divisible by cartLines)`);
    continue;
  }
  const got = estimateBytes(cart(v.cartLines, itemsPerLine, parentAttrs, v.cartLineIdLength));
  const verdict = got <= K.OUTPUT_BYTE_BUDGET ? 'expand' : 'fold-to-lineUpdate';
  const bytesOk = got === v.estimatedBytes;
  const verdictOk = verdict === v.expectedVerdict;
  if (bytesOk && verdictOk) {
    console.log(`  ok    ${v.name}  ${got} bytes, ${verdict}`);
  } else {
    failed++;
    console.error(`  FAIL  ${v.name}`);
    if (!bytesOk) console.error(`        bytes:   expected ${v.estimatedBytes}, got ${got}`);
    if (!verdictOk) console.error(`        verdict: expected ${v.expectedVerdict}, got ${verdict}`);
  }
}

if (failed) {
  console.error(`\n${failed} vector(s) disagree. The theme estimator has drifted from the spec.`);
  console.error('Regenerate assets/fs-bundle-estimator-constants.js from fs-bundle-api, or fix the implementation.');
  process.exit(1);
}
console.log('\nall vectors agree.');
