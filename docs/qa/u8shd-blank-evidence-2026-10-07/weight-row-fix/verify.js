const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const patched = fs.readFileSync('/home/user/fitnesssuperstore-shopify/assets/custom.js', 'utf8');
const B = 'https://www.fitnesssuperstore.com/products/';
const urls = {
  child25: B + 'french-fitness-urethane-8-sided-hex-dumbbell-25-lbs-single-blank-no-logo-new',
  set550: B + 'french-fitness-urethane-8-sided-hex-dumbbell-set-5-50-lbs-blank-no-logo-new',
  control_rubber12_5: B + 'french-fitness-rubber-coated-hex-dumbbell-12-5-lbs-single-new',
};
async function probe(browser, key, url, usePatch, vp, shot) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  let hits = 0;
  if (usePatch) await page.route(/\/assets\/custom\.js/, r => { hits++; r.fulfill({ status: 200, contentType: 'application/javascript', body: patched }); });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(7000);
  const r = await page.evaluate(() => {
    const fs = [...document.querySelectorAll('fieldset')].find(f => /weight/i.test(f.querySelector('legend')?.innerText || ''));
    const vis = fs ? [...fs.querySelectorAll('label')].filter(l => !l.hidden && l.offsetParent).map(l => l.innerText.replace(/Variant sold out.*/i, '').trim()) : [];
    const pt = document.querySelector('fieldset input[type=radio]:checked');
    return { url: location.pathname.slice(10, 70), purchase: pt?.value, visibleWeights: vis.length, first: vis.slice(0, 3), last: vis.slice(-2) };
  });
  r.patchServed = usePatch ? hits : 'n/a';
  if (shot) await page.screenshot({ path: shot, fullPage: false });
  await ctx.close();
  return r;
}
(async () => {
  const b = await chromium.launch();
  const out = {};
  const D = { width: 1440, height: 900 }, M = { width: 375, height: 812 };
  for (const [k, u] of Object.entries(urls)) {
    out[k + '|BEFORE|desktop'] = await probe(b, k, u, false, D, null);
    out[k + '|AFTER|desktop'] = await probe(b, k, u, true, D, k.startsWith('control') ? null : `${process.argv[2]}/after-${k}-desktop.png`);
  }
  out['child25|AFTER|mobile'] = await probe(b, 'child25', urls.child25, true, M, `${process.argv[2]}/after-child25-mobile.png`);
  out['child25|BEFORE|desktop-shot'] = await probe(b, 'child25', urls.child25, false, D, `${process.argv[2]}/before-child25-desktop.png`);
  // parent landing + click-through with patch
  const ctx = await b.newContext({ viewport: D }); const page = await ctx.newPage();
  await page.route(/\/assets\/custom\.js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: patched }));
  await page.goto(B + 'french-fitness-urethane-8-sided-hex-dumbbells-blank-no-logo-new', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  out.parentLanding = page.url().replace('https://www.fitnesssuperstore.com', '');
  const lbl = page.locator('fieldset.rh-weight label', { hasText: /^\s*10 lbs/ }).first();
  const visible = await lbl.isVisible().catch(() => false);
  let after = null;
  if (visible) { await Promise.all([page.waitForNavigation({ timeout: 20000 }).catch(() => null), lbl.click()]); await page.waitForTimeout(5000); after = page.url().replace('https://www.fitnesssuperstore.com', ''); }
  out.clickTen = { pillVisible: visible, urlAfterClick: after };
  await b.close();
  console.log(JSON.stringify(out, null, 1));
})();
