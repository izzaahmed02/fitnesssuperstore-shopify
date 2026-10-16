const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const S = process.argv[2];
const mainJs = fs.readFileSync(S + '/custom-main.js', 'utf8');
const branchJs = fs.readFileSync(S + '/custom-branch.js', 'utf8');
const U = 'https://www.fitnesssuperstore.com/products/';
const single = U + 'french-fitness-urethane-8-sided-hex-dumbbell-25-lbs-single-blank-no-logo-new';
const set = U + 'french-fitness-urethane-8-sided-hex-dumbbell-set-5-50-lbs-blank-no-logo-new';
// mark options as "in stock" by clearing the disabled class / available flag on the named weight inputs
function unflag(html, values) {
  let n = 0;
  const out = html.replace(/<input\b[^>]*name="Weight[^>]*>/g, tag => {
    const m = tag.match(/value="([^"]+)"/);
    if (m && values.includes(m[1])) { n++; return tag.replace(/\bclass="disabled"/, '').replace('data-option-value-available="false"', 'data-option-value-available="true"'); }
    return tag;
  });
  return { out, n };
}
async function visibleOnce(b, url, js, values) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  let changed = 0, status = null;
  await page.route(/\/assets\/custom\.js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: js }));
  if (values) await page.route(u => u.href.split('?')[0] === url, async r => {
    if (r.request().resourceType() !== 'document') return r.continue();
    const resp = await r.fetch(); status = resp.status(); const body = await resp.text(); const { out, n } = unflag(body, values); changed = n;
    r.fulfill({ response: resp, body: out });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(7000);
  const r = await page.evaluate(() => { const f = [...document.querySelectorAll('fieldset')].find(f => /weight/i.test(f.querySelector('legend')?.innerText || '')); return f ? [...f.querySelectorAll('label')].filter(l => !l.hidden && l.offsetParent).map(l => l.innerText.replace(/\s*Variant sold out.*/is, '').trim()) : null; });
  await ctx.close();
  return { flagsCleared: changed, status, visible: r };
}
async function visible(b, url, js, values) {
  for (let i = 0; i < 4; i++) {
    const r = await visibleOnce(b, url, js, values);
    const ok = r.visible !== null && (values ? r.flagsCleared > 0 : true) && (r.status === null || r.status === 200);
    if (ok && (r.visible.length > 0 || !values)) return { ...r, attempts: i + 1 };
    await new Promise(res => setTimeout(res, 15000));
  }
  return { ...(await visibleOnce(b, url, js, values)), attempts: 5 };
}
(async () => {
  const b = await chromium.launch();
  const cases = [
    ['all sold out (single page)', single, null],
    ['mixed: 10/25/50 lbs in stock (single page)', single, ['10 lbs', '25 lbs', '50 lbs']],
    ['mixed: only 150 lbs in stock (single page)', single, ['150 lbs']],
    ['mixed: 5-50 and 5-100 in stock (set page)', set, ['5-50 lbs', '5-100 lbs']],
  ];
  const out = [];
  for (const [name, url, vals] of cases) {
    const a = await visible(b, url, mainJs, vals);
    const c = await visible(b, url, branchJs, vals);
    out.push({ case: name, mainJs: a.visible && a.visible.length ? a.visible : a.visible, branchJs: c.visible, flagsCleared: c.flagsCleared, attempts: [a.attempts, c.attempts], statuses: [a.status, c.status], identical: JSON.stringify(a.visible) === JSON.stringify(c.visible) });
  }
  await b.close();
  console.log(JSON.stringify(out, null, 1));
})();
