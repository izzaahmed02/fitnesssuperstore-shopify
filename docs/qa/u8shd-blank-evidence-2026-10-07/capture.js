const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const out = process.argv[2];
const base = 'https://www.fitnesssuperstore.com/products/';
const pages = {
  parent: 'french-fitness-urethane-8-sided-hex-dumbbells-blank-no-logo-new',
  single25: 'french-fitness-urethane-8-sided-hex-dumbbell-25-lbs-single-blank-no-logo-new',
  set550: 'french-fitness-urethane-8-sided-hex-dumbbell-set-5-50-lbs-blank-no-logo-new',
};
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 375, height: 812 } };
(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const [vp, size] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: size, isMobile: vp === 'mobile', deviceScaleFactor: 1 });
    for (const [key, handle] of Object.entries(pages)) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
      const resp = await page.goto(base + handle, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => ({ status: () => 'ERR ' + e.message.slice(0, 80) }));
      await page.waitForTimeout(2500);
      const facts = await page.evaluate(() => {
        const q = s => document.querySelector(s);
        const txt = el => el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 160) : null;
        const btn = q('.product-form__submit');
        const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch { return null; } }).filter(Boolean);
        const offers = [];
        const walk = o => { if (!o || typeof o !== 'object') return; if (o.availability) offers.push(o.availability); Object.values(o).forEach(walk); };
        ld.forEach(walk);
        return {
          url: location.href,
          h1: txt(q('h1')),
          robots: q('meta[name=robots]')?.content || null,
          canonical: q('link[rel=canonical]')?.href || null,
          button: btn ? { text: txt(btn), disabled: btn.disabled } : null,
          notifyButton: !!q('.restock-rocket-button-container'),
          processingTimeShown: [...document.querySelectorAll('.item__text .title')].some(e => /Processing Time/i.test(e.innerText)),
          sku: txt(q('[id^=Sku-]')),
          price: txt(q('.pr_custom_price, .price-item--regular')),
          schemaAvailability: [...new Set(offers)],
          metaAvailability: q('meta[itemprop=availability]')?.content || null,
        };
      });
      facts.httpStatus = typeof resp.status === 'function' ? resp.status() : resp;
      facts.jsErrors = errors;
      report[`${key}-${vp}`] = facts;
      await page.screenshot({ path: `${out}/u8shd-${key}-${vp}-fullpage.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 1));
})();
