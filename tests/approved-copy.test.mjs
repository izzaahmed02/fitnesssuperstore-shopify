// Asserts the customer-facing copy in this repository is byte-identical to the
// approved string, and that no file hardcodes its own copy.
//
// Exists because the first implementation used a straight ASCII apostrophe where
// the approved text uses U+2019. Both look almost identical in a diff and in a
// browser, so only an exact byte comparison catches it.
//
// Run: node tests/approved-copy.test.mjs

import { readFileSync, readdirSync } from 'node:fs';

globalThis.window = globalThis;
new Function(readFileSync('assets/fs-bundle-estimator-constants.js', 'utf8'))();
const K = globalThis.FSBundleEstimator;

const APPROVED =
  'We can’t complete this configuration through online checkout. ' +
  'Please contact our Sales team so we can confirm your selections and help complete your order.';
const APPROVED_URL = 'https://www.fitnesssuperstore.com/pages/contact';
const APPROVED_LABEL = 'Contact Sales';

let failed = 0;
const check = (name, got, want) => {
  if (got === want) {
    console.log(`  ok    ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        expected: ${JSON.stringify(want)}`);
    console.error(`        got:      ${JSON.stringify(got)}`);
  }
};

console.log('approved-copy test');
check('BLOCK_MESSAGE is byte-identical', K.BLOCK_MESSAGE, APPROVED);
check('CONTACT_SALES_URL', K.CONTACT_SALES_URL, APPROVED_URL);
check('CONTACT_SALES_LABEL', K.CONTACT_SALES_LABEL, APPROVED_LABEL);

// The apostrophe specifically, called out because it is the failure that happened.
if (K.BLOCK_MESSAGE.includes("can't")) {
  failed++;
  console.error('  FAIL  BLOCK_MESSAGE uses a straight ASCII apostrophe; the approved text uses U+2019');
} else {
  console.log('  ok    apostrophe is U+2019, not U+0027');
}

// No theme asset may carry its own copy of the message.
const offenders = readdirSync('assets')
  .filter((f) => f.endsWith('.js') && f !== 'fs-bundle-estimator-constants.js')
  .filter((f) => {
    const src = readFileSync(`assets/${f}`, 'utf8');
    return src.includes('complete this configuration through online checkout');
  });
if (offenders.length) {
  failed++;
  console.error(`  FAIL  these assets hardcode the message instead of reading the generated constant: ${offenders.join(', ')}`);
} else {
  console.log('  ok    no asset hardcodes the message');
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nall checks passed.');
