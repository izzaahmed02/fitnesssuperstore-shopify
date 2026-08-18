const { chromium, devices } = require('playwright');
const path = require('path');
const out = [];
const rec = (id, ok, detail) => { out.push({id, ok, detail}); console.log(`${ok ? 'OK  ' : 'FIND'}  ${id}  ${detail}`); };

(async () => {
  const b = await chromium.launch();

  // R1 — heading rule targets h4 but the section renders h2
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('file://' + path.join(__dirname, 'case-multi.html'));
  await p.waitForSelector('.customer-photo-gallery__header h2');
  const h = await p.evaluate(() => {
    const el = document.querySelector('.customer-photo-gallery__header h2');
    const cs = getComputedStyle(el);
    return { tag: el.tagName, family: cs.fontFamily, weight: cs.fontWeight, margin: cs.margin,
             h4present: !!document.querySelector('.customer-photo-gallery__header h4') };
  });
  rec('R1 heading style rule (.__header h4) matches no element', !h.h4present && h.tag === 'H2',
    `rendered <${h.tag}>, computed font-family="${h.family}", weight=${h.weight}, margin=${h.margin} - the Lato/700/margin:0 rule and the mobile font-size rule are both dead`);

  // R2 — focus is dropped when the focused nav arrow hides at a boundary
  await p.locator('.customer-photo-gallery__slide img').nth(0).click();
  await p.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox-inner img').classList.contains('is-loaded'));
  await p.evaluate(() => document.querySelector('.customer-photo-gallery__lightbox-arrow--right').focus());
  for (let i = 0; i < 5; i++) { await p.keyboard.press('Enter'); await p.waitForTimeout(250); }
  const f = await p.evaluate(() => {
    const a = document.activeElement;
    const lb = document.querySelector('.customer-photo-gallery__lightbox');
    return { tag: a ? a.tagName : 'NONE', inLightbox: !!(a && lb.contains(a)),
             counter: document.querySelector('.customer-photo-gallery__lightbox-counter').textContent,
             nextHidden: document.querySelector('.customer-photo-gallery__lightbox-arrow--right').hidden };
  });
  rec('R2 keyboard focus survives reaching the last photo via the Next button', f.inLightbox,
    `counter="${f.counter}", Next now hidden=${f.nextHidden}, focus landed on <${f.tag}> inLightbox=${f.inLightbox}`);
  await p.close(); await ctx.close();

  // R3 — reduced motion is not applied to the thumb-strip arrow scroll
  const rm = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await rm.newPage();
  await p2.goto('file://' + path.join(__dirname, 'case-multi.html'));
  await p2.waitForSelector('.customer-photo-gallery__slider');
  const smooth = await p2.evaluate(() => {
    const calls = [];
    const s = document.querySelector('.customer-photo-gallery__slider');
    const orig = s.scrollBy.bind(s);
    s.scrollBy = (o) => { calls.push(o && o.behavior); return orig(o); };
    document.querySelector('.customer-photo-gallery__arrow--right').click();
    return calls;
  });
  rec('R3 strip arrows respect prefers-reduced-motion', !smooth.includes('smooth'),
    `scrollBy behavior requested under reduced-motion: ${JSON.stringify(smooth)}`);
  await p2.close(); await rm.close();

  await b.close();
  const findings = out.filter(o => !o.ok);
  console.log(`\n${out.length - findings.length}/${out.length} clean; ${findings.length} residual finding(s)`);
  if (findings.length) process.exitCode = 1;
})();
