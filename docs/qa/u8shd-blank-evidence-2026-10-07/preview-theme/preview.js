const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const T = '189008838972';
const B = 'https://www.fitnesssuperstore.com/products/';
const pages = {
  parentLanding: 'french-fitness-urethane-8-sided-hex-dumbbells-blank-no-logo-new',
  single25: 'french-fitness-urethane-8-sided-hex-dumbbell-25-lbs-single-blank-no-logo-new',
  single150: 'french-fitness-urethane-8-sided-hex-dumbbell-150-lbs-single-blank-no-logo-new',
  set550: 'french-fitness-urethane-8-sided-hex-dumbbell-set-5-50-lbs-blank-no-logo-new',
  set135150: 'french-fitness-urethane-8-sided-hex-dumbbell-set-135-150-lbs-blank-no-logo-new',
  control_rubber12_5: 'french-fitness-rubber-coated-hex-dumbbell-12-5-lbs-single-new',
  control_rubberSet: 'french-fitness-rubber-coated-hex-dumbbell-set-55-75-lbs-new',
  control_kettlebellSet: 'french-fitness-cast-iron-kettlebell-set-5-30-lbs-new',
};
async function run(b, key, handle, preview, vp, shot) {
  const ctx = await b.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto(B + handle + (preview ? `?preview_theme_id=${T}` : ''), { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => null);
  await page.waitForTimeout(8000);
  const r = await page.evaluate(() => {
    const fs = [...document.querySelectorAll('fieldset')].filter(f => f.querySelector('legend'));
    const info = fs.map(f => ({ legend: f.querySelector('legend').innerText.trim(), visible: [...f.querySelectorAll('label')].filter(l => !l.hidden && l.offsetParent).length }));
    const btn = document.querySelector('.product-form__submit');
    return { themeId: window.Shopify?.theme?.id, themeName: window.Shopify?.theme?.name, path: location.pathname.slice(10, 75), pickers: info, addToCartDisabled: btn ? btn.disabled : null };
  });
  if (shot) await page.screenshot({ path: shot, fullPage: true });
  await ctx.close();
  return r;
}
(async () => {
  const b = await chromium.launch();
  const D = { width: 1440, height: 900 }, M = { width: 375, height: 812 };
  const out = {};
  for (const [k, h] of Object.entries(pages)) {
    out[k] = { live: await run(b, k, h, false, D, null), preview: await run(b, k, h, true, D, ['parentLanding', 'single25', 'set550'].includes(k) ? `${process.argv[2]}/preview-${k}-desktop-fullpage.png` : null) };
  }
  out.mobile_single25 = { preview: await run(b, 'single25', pages.single25, true, M, `${process.argv[2]}/preview-single25-mobile-fullpage.png`) };
  out.mobile_parent = { preview: await run(b, 'parent', pages.parentLanding, true, M, `${process.argv[2]}/preview-parentLanding-mobile-fullpage.png`) };
  await b.close();
  console.log(JSON.stringify(out));
})();
