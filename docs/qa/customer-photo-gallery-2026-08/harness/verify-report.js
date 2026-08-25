// Guards the report against the data it describes.
//
// Three separate errors in this closeout came from hand-transcribing numbers out of
// results.json into README.md: an overstated FSR90 profile, a stale check total, and a
// miscounted set of zoom ceilings. Any figure the report states about a run should therefore be
// checked against the run, not retyped from it. This script does that check and exits non-zero
// on a mismatch, so `npm test` fails rather than shipping a report that disagrees with itself.

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const results = JSON.parse(fs.readFileSync(path.join(DIR, 'results.json'), 'utf8'));
const readme = fs.readFileSync(path.join(DIR, '..', 'README.md'), 'utf8');

const problems = [];
const ok = [];

function check(label, pass, detail) {
  (pass ? ok : problems).push(`${label}${detail ? ' — ' + detail : ''}`);
}

// --- totals -------------------------------------------------------------------------------
const passed = results.filter((r) => r.pass).length;
const total = results.length;
check(
  `report states the run total as ${passed}/${total}`,
  readme.includes(`${passed} of ${total} functional checks pass`) &&
    readme.includes(`${passed}/${total} against the section file`),
  `results.json holds ${passed}/${total}`
);

// --- per-suite counts ---------------------------------------------------------------------
for (const [prefix, name] of [['D', 'desktop'], ['M', 'mobile'], ['F', 'FSR90']]) {
  const rows = results.filter((r) => new RegExp(`^${prefix}\\d`).test(r.id));
  const documented = (readme.match(new RegExp(`^\\| ${prefix}\\d+ \\|`, 'gm')) || []).length;
  check(
    `every ${name} check has a report row (${rows.length})`,
    rows.length === documented,
    `${rows.length} in results.json, ${documented} rows in README`
  );
}

// --- F7: the zoom ceilings, the report's central numeric claim -----------------------------
const f7 = results.find((r) => r.id.startsWith('F7'));
if (!f7) {
  problems.push('F7 missing from results.json');
} else {
  const fromData = (f7.detail.match(/x[\d.]+=\d+\/\d+/g) || []).map((e) => e.replace('x', '×'));
  const row = (readme.match(/^\| F7 \|.*$/m) || [''])[0];
  const quoted = row.match(/×[\d.]+=\d+\/\d+/g) || [];
  check(
    'report quotes every F7 ceiling',
    fromData.length === quoted.length && fromData.every((e) => quoted.includes(e)),
    `${fromData.length} measured, ${quoted.length} quoted`
  );

  // The five/five split across the 2048px delivery cap.
  const pairs = [...f7.detail.matchAll(/x[\d.]+=(\d+)\/(\d+)/g)].map((m) => m[2]);
  const atCap = pairs.filter((n) => n === '2048').length;
  const atSource = pairs.length - atCap;
  const words = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };
  check(
    `report describes the delivery-cap split as ${words[atSource]}/${words[atCap]}`,
    readme.includes(`split ${words[atSource]}/${words[atCap]}`),
    `${atSource} at own source, ${atCap} at the 2048 cap`
  );
}

// --- baseline figure quoted for a run against the released section -------------------------
check(
  'report quotes the released-section baseline as one failure short of the total',
  readme.includes(`it reports ${total - 1}/${total}`),
  `expected ${total - 1}/${total}`
);

// --- the pinned baseline revision actually holds the audited pre-fix section ---------------
// A pinned SHA is only useful while it still means what the report says it means, and the
// figures above are only reproducible if the comparison builds the right revision.
try {
  const { execFileSync } = require('child_process');
  const crypto = require('crypto');
  const pin = (readme.match(/`git show ([0-9a-f]{7,40}):sections\/customer-photo-gallery\.liquid/) || [])[1];
  const documented = (readme.match(/\| `sections\/customer-photo-gallery\.liquid` \| `([0-9a-f]{32})`/) || [])[1];
  if (!pin || !documented) {
    check('report pins a baseline revision and documents its hash', false,
      `pin=${pin || 'none'}, documented hash=${documented || 'none'}`);
  } else {
    const blob = execFileSync('git', ['show', `${pin}:sections/customer-photo-gallery.liquid`],
      { cwd: DIR, maxBuffer: 1 << 24 });
    const actual = crypto.createHash('md5').update(blob).digest('hex');
    check(`pinned baseline ${pin} holds the audited pre-fix section`, actual === documented,
      actual === documented ? `md5 ${actual}` : `pinned revision has ${actual}, report documents ${documented}`);
  }
} catch (e) {
  check('pinned baseline revision is resolvable', false, e.message.split('\n')[0]);
}

for (const line of ok) console.log(`OK    ${line}`);
for (const line of problems) console.log(`STALE ${line}`);
console.log(`\n${ok.length}/${ok.length + problems.length} report claims match the data`);
if (problems.length) {
  console.log('The report disagrees with results.json — re-read the figures above before shipping it.');
  process.exitCode = 1;
}
