const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = __dirname;
const SHOTS = path.join(DIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${detail || ''}`);
}

const url = (c) => 'file://' + path.join(DIR, `case-${c}.html`);
const LB = '.customer-photo-gallery__lightbox';
const isOpen = (page) => page.$eval(LB, (el) => el.classList.contains('customer-photo-gallery__lightbox--active'));

async function openViewer(page, index = 0) {
  await page.locator('.customer-photo-gallery__slide img').nth(index).click();
  await page.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox')
    .classList.contains('customer-photo-gallery__lightbox--active'));
  await page.waitForFunction(() => document.querySelector(`${'.customer-photo-gallery__lightbox-inner img'}`).classList.contains('is-loaded'));
}

async function imgState(page) {
  return page.$eval('.customer-photo-gallery__lightbox-inner img', (im) => {
    const r = im.getBoundingClientRect();
    const cs = getComputedStyle(im);
    return {
      natW: im.naturalWidth, natH: im.naturalHeight,
      clientW: im.clientWidth, clientH: im.clientHeight,
      rectW: +r.width.toFixed(1), rectH: +r.height.toFixed(1),
      objectFit: cs.objectFit, transform: cs.transform,
      cls: im.className, alt: im.alt,
    };
  });
}

// ---------- DESKTOP ----------
async function desktop(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  // ===== multi-image PDP =====
  await page.goto(url('multi'));
  await page.waitForSelector('.customer-photo-gallery__slide img');
  await page.waitForFunction(() => [...document.querySelectorAll('.customer-photo-gallery__slide img')].every(i => i.complete));

  // thumb strip: prev/next scrolling
  const x0 = await page.$eval('.customer-photo-gallery__slider', (s) => s.scrollLeft);
  await page.click('.customer-photo-gallery__arrow--right');
  await page.waitForTimeout(600);
  const x1 = await page.$eval('.customer-photo-gallery__slider', (s) => s.scrollLeft);
  await page.click('.customer-photo-gallery__arrow--left');
  await page.waitForTimeout(600);
  const x2 = await page.$eval('.customer-photo-gallery__slider', (s) => s.scrollLeft);
  check('D1 thumb-strip next/prev scroll', x1 > x0 && x2 < x1, `scrollLeft ${x0} -> ${x1} -> ${x2}`);

  await page.screenshot({ path: path.join(SHOTS, 'desktop-01-strip.png'), clip: { x: 0, y: 0, width: 1440, height: 520 } });

  // thumbnails are square-cropped (cover) but never distorted
  const thumb = await page.$eval('.customer-photo-gallery__slide img', (im) => {
    const r = im.getBoundingClientRect();
    return { fit: getComputedStyle(im).objectFit, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  });
  check('D2 thumb uses object-fit cover (crop, no stretch)', thumb.fit === 'cover', `${thumb.w}x${thumb.h} fit=${thumb.fit}`);

  // open viewer on the highest-res image (index 4 = 4284x5712)
  await openViewer(page, 4);
  check('D3 viewer opens from thumbnail click', await isOpen(page));

  let st = await imgState(page);
  const fits = st.rectW <= 1440 * 0.9 + 1 && st.rectH <= 900 * 0.88 + 1;
  const ratioOk = Math.abs((st.rectW / st.rectH) - (st.natW / st.natH)) < 0.02;
  check('D4 hi-res image contained in viewport, aspect preserved', fits && ratioOk,
    `natural ${st.natW}x${st.natH} -> rendered ${st.rectW}x${st.rectH}, fit=${st.objectFit}`);

  const counter0 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  check('D5 counter reflects position', counter0 === '5 of 6', `"${counter0}"`);

  // focus lands on a control
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.className);
  check('D6 focus moves into the viewer on open', /lightbox-close/.test(focused || ''), focused);

  await page.screenshot({ path: path.join(SHOTS, 'desktop-02-viewer-hires.png') });

  // page behind must not scroll
  const locked = await page.evaluate(() => getComputedStyle(document.body).overflow);
  check('D7 page scroll locked while viewer open', locked === 'hidden', `body overflow=${locked}`);

  // keyboard next/prev
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const c1 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  const c2 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  check('D8 keyboard ArrowRight/ArrowLeft navigate', c1 === '6 of 6' && c2 === '5 of 6', `${counter0} -> ${c1} -> ${c2}`);

  // arrow buttons navigate + boundary arrows hide (no wrap)
  await page.click('.customer-photo-gallery__lightbox-arrow--right');
  await page.waitForTimeout(300);
  const nextHiddenAtEnd = await page.$eval('.customer-photo-gallery__lightbox-arrow--right', (b) => b.hidden);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
  const cFirst = await page.textContent('.customer-photo-gallery__lightbox-counter');
  const prevHiddenAtStart = await page.$eval('.customer-photo-gallery__lightbox-arrow--left', (b) => b.hidden);
  check('D9 on-screen arrows navigate; boundary arrows hidden (no wrap)',
    nextHiddenAtEnd && prevHiddenAtStart && cFirst === '1 of 6',
    `next hidden at end=${nextHiddenAtEnd}, prev hidden at start=${prevHiddenAtStart}, counter=${cFirst}`);

  // ---- zoom on a high-res image ----
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400); // back to index 4 (hi-res)
  st = await imgState(page);
  const zoomInDisabledHi = await page.$eval('[data-zoom="in"]', (b) => b.disabled);
  await page.click('[data-zoom="in"]'); await page.waitForTimeout(250);
  const afterIn = await imgState(page);
  const scaleUp = /matrix\(([\d.]+)/.exec(afterIn.transform);
  check('D10 zoom-in enabled and scales a high-res image', !zoomInDisabledHi && parseFloat(scaleUp[1]) > 1.3,
    `transform=${afterIn.transform}`);

  // zoom is capped at the source's own pixels
  const cap = await page.evaluate(async () => {
    const im = document.querySelector('.customer-photo-gallery__lightbox-inner img');
    for (let i = 0; i < 25; i++) { document.querySelector('[data-zoom="in"]').click(); await new Promise(r => setTimeout(r, 20)); }
    const m = /matrix\(([\d.]+)/.exec(getComputedStyle(im).transform);
    return { scale: parseFloat(m[1]), natW: im.naturalWidth, clientW: im.clientWidth,
             disabled: document.querySelector('[data-zoom="in"]').disabled };
  });
  const effectivePx = cap.clientW * cap.scale;
  check('D11 zoom never exceeds the source pixels (no upscale)',
    effectivePx <= cap.natW + 2 && cap.disabled,
    `max scale ${cap.scale.toFixed(2)} -> ${Math.round(effectivePx)}px wide vs ${cap.natW}px native; zoom-in disabled=${cap.disabled}`);
  await page.screenshot({ path: path.join(SHOTS, 'desktop-03-zoom-max.png') });

  // reset
  await page.click('[data-zoom="reset"]'); await page.waitForTimeout(250);
  const afterReset = await imgState(page);
  check('D12 "Fit" resets zoom/pan', /matrix\(1, 0, 0, 1, 0, 0\)|none/.test(afterReset.transform), afterReset.transform);

  // ---- zoom on a KNOWN LOW-RES source: must refuse to upscale ----
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400); // index 5 = 740x493
  const low = await imgState(page);
  const lowZoomDisabled = await page.$eval('[data-zoom="in"]', (b) => b.disabled);
  check('D13 low-res source is shown at native size, not enlarged',
    low.rectW <= low.natW + 1 && Math.abs(low.rectW - low.natW) < 2,
    `natural ${low.natW}x${low.natH} -> rendered ${low.rectW}x${low.rectH}`);
  check('D14 zoom-in disabled for a low-res source (cannot upscale)', lowZoomDisabled, `disabled=${lowZoomDisabled}`);
  await page.screenshot({ path: path.join(SHOTS, 'desktop-04-lowres-no-upscale.png') });

  // ---- alt text / captions ----
  const altInfo = await page.evaluate(() => {
    const im = document.querySelector('.customer-photo-gallery__lightbox-inner img');
    const cap = document.querySelector('.customer-photo-gallery__lightbox-caption');
    const thumbAlts = [...document.querySelectorAll('.customer-photo-gallery__slide img')].map(i => i.alt);
    return { viewerAlt: im.alt, caption: cap.textContent, live: cap.getAttribute('aria-live'), thumbAlts };
  });
  check('D15 viewer image carries alt text and a live-region caption',
    !!altInfo.viewerAlt && altInfo.live === 'polite',
    `alt="${altInfo.viewerAlt}", caption="${altInfo.caption}", aria-live=${altInfo.live}`);
  check('D16 thumbnail alt text is present (generic "Customer photo N")',
    altInfo.thumbAlts.every(a => /^Customer photo \d+$/.test(a)),
    JSON.stringify(altInfo.thumbAlts.slice(0, 3)));

  // ---- dialog semantics ----
  const dlg = await page.$eval(LB, (el) => ({ role: el.getAttribute('role'), modal: el.getAttribute('aria-modal'),
    hidden: el.getAttribute('aria-hidden'), label: el.getAttribute('aria-label') }));
  check('D17 viewer exposes dialog semantics', dlg.role === 'dialog' && dlg.modal === 'true' && dlg.hidden === 'false',
    JSON.stringify(dlg));

  // ---- focus trap ----
  const trap = await page.evaluate(async () => {
    const seen = [];
    document.querySelector('.customer-photo-gallery__lightbox-close').focus();
    for (let i = 0; i < 12; i++) {
      seen.push(document.activeElement ? document.activeElement.getAttribute('aria-label') || document.activeElement.tagName : 'NONE');
      const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(ev);
      await new Promise(r => setTimeout(r, 10));
    }
    return seen;
  });
  // Tab is synthesised (dispatchEvent cannot move native focus), so assert via real keyboard below
  const realTrap = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    realTrap.push(await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return 'BODY';
      const lb = document.querySelector('.customer-photo-gallery__lightbox');
      return (lb.contains(a) ? 'IN:' : 'OUT:') + (a.getAttribute('aria-label') || a.tagName);
    }));
  }
  check('D18 Tab focus stays inside the viewer', realTrap.every(f => f.startsWith('IN:')), realTrap.join(' | '));

  // ---- Escape closes, focus returns to the opener ----
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = !(await isOpen(page));
  const restored = await page.evaluate(() => {
    const a = document.activeElement;
    return !!(a && a.closest && a.closest('.customer-photo-gallery__slide'));
  });
  check('D19 Escape closes the viewer', closed, `active=${closed}`);
  check('D20 focus returns to the thumbnail that opened it', restored, `restored=${restored}`);
  const unlocked = await page.evaluate(() => getComputedStyle(document.body).overflow);
  check('D21 page scroll restored after close', unlocked !== 'hidden', `body overflow=${unlocked}`);

  // ---- reopen ----
  await openViewer(page, 2);
  const reopened = await isOpen(page);
  const cRe = await page.textContent('.customer-photo-gallery__lightbox-counter');
  const stRe = await imgState(page);
  check('D22 viewer reopens cleanly on a different photo', reopened && cRe === '3 of 6' && /matrix\(1, 0, 0, 1, 0, 0\)|none/.test(stRe.transform),
    `counter=${cRe}, transform=${stRe.transform}`);

  // backdrop click closes (click a point clear of every control: the arrows sit at
  // the vertical centre, close/counter at the top, zoom bar at the bottom)
  const bdTarget = await page.evaluate(() => {
    const el = document.elementFromPoint(24, 700);
    return el ? el.className : 'none';
  });
  await page.mouse.click(24, 700);
  await page.waitForTimeout(300);
  check('D23 backdrop click closes the viewer', !(await isOpen(page)), `click target=${bdTarget}`);

  // keyboard-only open (Enter on a focused thumbnail)
  await page.evaluate(() => document.querySelectorAll('.customer-photo-gallery__slide img')[1].focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  check('D24 thumbnails are keyboard-operable (Enter opens)', await isOpen(page));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);

  // ===== single-image PDP =====
  const p2 = await ctx.newPage();
  await p2.goto(url('single'));
  await p2.waitForSelector('.customer-photo-gallery__slide img');
  await p2.waitForFunction(() => document.querySelector('.customer-photo-gallery__slide img').complete);
  const arrowsHidden = await p2.$$eval('.customer-photo-gallery__arrow', (bs) => bs.map(b => getComputedStyle(b).display));
  check('D25 single-image PDP hides strip arrows on desktop', arrowsHidden.every(d => d === 'none'), JSON.stringify(arrowsHidden));
  await p2.locator('.customer-photo-gallery__slide img').click();
  await p2.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox-inner img').classList.contains('is-loaded'));
  const s1 = await p2.$eval('.customer-photo-gallery__lightbox-inner img', (im) => {
    const r = im.getBoundingClientRect();
    return { natW: im.naturalWidth, natH: im.naturalHeight, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  });
  const navHidden = await p2.$$eval('.customer-photo-gallery__lightbox-arrow', (bs) => bs.map(b => b.hidden));
  const cnt = await p2.textContent('.customer-photo-gallery__lightbox-counter');
  check('D26 single-image viewer: both nav arrows hidden, counter "1 of 1"',
    navHidden.every(Boolean) && cnt === '1 of 1', `${JSON.stringify(navHidden)} counter="${cnt}"`);
  check('D27 tall portrait image contained without distortion',
    Math.abs((s1.w / s1.h) - (s1.natW / s1.natH)) < 0.02 && s1.h <= 900 * 0.88 + 1,
    `natural ${s1.natW}x${s1.natH} -> rendered ${s1.w}x${s1.h}`);
  await p2.screenshot({ path: path.join(SHOTS, 'desktop-05-single-portrait.png') });
  await p2.close();

  // ===== reduced motion =====
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p3 = await rm.newPage();
  await p3.goto(url('multi'));
  await p3.waitForSelector('.customer-photo-gallery__slide img');
  const rmState = await p3.$eval('.customer-photo-gallery__lightbox', (el) => getComputedStyle(el).transitionDuration);
  const rmThumb = await p3.$eval('.customer-photo-gallery__slide img', (el) => getComputedStyle(el).transitionDuration);
  check('D28 reduced-motion honoured (viewer + thumb transitions disabled)',
    rmState === '0s' && rmThumb === '0s', `viewer=${rmState}, thumb=${rmThumb}`);
  await p3.close(); await rm.close();

  await ctx.close();
}

// ---------- MOBILE ----------
async function mobile(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(url('multi'));
  await page.waitForSelector('.customer-photo-gallery__slide img');
  await page.waitForFunction(() => [...document.querySelectorAll('.customer-photo-gallery__slide img')].every(i => i.complete));
  await page.screenshot({ path: path.join(SHOTS, 'mobile-01-strip.png') });

  // horizontal strip scroll (native touch scroll / snap)
  const before = await page.$eval('.customer-photo-gallery__slider', (s) => s.scrollLeft);
  await page.$eval('.customer-photo-gallery__slider', (s) => { s.scrollLeft = s.scrollLeft + s.clientWidth; });
  await page.waitForTimeout(400);
  const after = await page.$eval('.customer-photo-gallery__slider', (s) => s.scrollLeft);
  const snap = await page.$eval('.customer-photo-gallery__slider', (s) => getComputedStyle(s).scrollSnapType);
  check('M1 strip scrolls horizontally with snap', after > before && /x/.test(snap), `${before} -> ${after}, snap=${snap}`);

  // tap a thumbnail to open
  await page.locator('.customer-photo-gallery__slide img').nth(0).tap();
  await page.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox-inner img').classList.contains('is-loaded'));
  check('M2 tap opens the viewer', await isOpen(page));
  await page.screenshot({ path: path.join(SHOTS, 'mobile-02-viewer.png') });

  // swipe left = next, swipe right = previous  (real touch event sequence)
  async function swipe(dx) {
    await page.evaluate((dx) => {
      const lb = document.querySelector('.customer-photo-gallery__lightbox');
      const mk = (x) => new Touch({ clientX: x, clientY: 400, screenX: x, screenY: 400,
        pageX: x, pageY: 400, identifier: 1, target: lb });
      const startX = 200;
      lb.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true,
        touches: [mk(startX)], targetTouches: [mk(startX)], changedTouches: [mk(startX)] }));
      lb.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true,
        touches: [mk(startX + dx)], targetTouches: [mk(startX + dx)], changedTouches: [mk(startX + dx)] }));
      lb.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true,
        touches: [], targetTouches: [], changedTouches: [mk(startX + dx)] }));
    }, dx);
    await page.waitForTimeout(350);
  }
  const m0 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  await swipe(-120);
  const m1 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  await swipe(120);
  const m2 = await page.textContent('.customer-photo-gallery__lightbox-counter');
  check('M3 swipe left/right changes photo', m0 === '1 of 6' && m1 === '2 of 6' && m2 === '1 of 6', `${m0} -> ${m1} -> ${m2}`);

  // pinch zoom on a high-res photo, then confirm the cap on a low-res one
  await page.evaluate(() => { for (let i = 0; i < 4; i++) document.querySelector('.customer-photo-gallery__lightbox-arrow--right').click(); });
  await page.waitForTimeout(500);
  const pinch = await page.evaluate(async () => {
    const lb = document.querySelector('.customer-photo-gallery__lightbox');
    const im = lb.querySelector('img');
    let id = 0;
    const t = (x, y, i) => new Touch({ clientX: x, clientY: y, screenX: x, screenY: y,
      pageX: x, pageY: y, identifier: i === undefined ? id++ : i, target: lb });
    lb.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true,
      touches: [t(150, 350, 0), t(250, 450, 1)], targetTouches: [t(150, 350, 0), t(250, 450, 1)], changedTouches: [t(150, 350, 0)] }));
    lb.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true,
      touches: [t(80, 280, 0), t(320, 520, 1)], targetTouches: [t(80, 280, 0), t(320, 520, 1)], changedTouches: [t(80, 280, 0)] }));
    lb.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t(80, 280, 0)] }));
    await new Promise(r => setTimeout(r, 100));
    const m = /matrix\(([\d.]+)/.exec(getComputedStyle(im).transform);
    return { scale: m ? parseFloat(m[1]) : 1, natW: im.naturalWidth, clientW: im.clientWidth };
  });
  check('M4 two-finger pinch zooms a high-res photo', pinch.scale > 1.2,
    `scale=${pinch.scale.toFixed(2)} (native ${pinch.natW}px, fit ${pinch.clientW}px)`);
  await page.screenshot({ path: path.join(SHOTS, 'mobile-03-pinch-zoom.png') });

  // one-finger pan while zoomed
  const pan = await page.evaluate(async () => {
    const lb = document.querySelector('.customer-photo-gallery__lightbox');
    const im = lb.querySelector('img');
    const t = (x, y) => new Touch({ clientX: x, clientY: y, screenX: x, screenY: y,
      pageX: x, pageY: y, identifier: 0, target: im });
    const b4 = getComputedStyle(im).transform;
    lb.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t(200, 400)], targetTouches: [t(200, 400)], changedTouches: [t(200, 400)] }));
    lb.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [t(120, 330)], targetTouches: [t(120, 330)], changedTouches: [t(120, 330)] }));
    lb.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t(120, 330)] }));
    await new Promise(r => setTimeout(r, 80));
    return { before: b4, after: getComputedStyle(im).transform };
  });
  check('M5 one-finger pan works while zoomed', pan.before !== pan.after, `${pan.before} -> ${pan.after}`);

  // low-res photo on mobile: no upscale, zoom-in disabled
  await page.evaluate(() => document.querySelector('.customer-photo-gallery__lightbox-arrow--right').click());
  await page.waitForTimeout(500);
  const lowM = await page.evaluate(async () => {
    const im = document.querySelector('.customer-photo-gallery__lightbox-inner img');
    const zin = document.querySelector('[data-zoom="in"]');
    // zoom all the way in and read where it stops
    for (let i = 0; i < 25; i++) { zin.click(); await new Promise(r => setTimeout(r, 20)); }
    const m = /matrix\(([\d.]+)/.exec(getComputedStyle(im).transform);
    const r = im.getBoundingClientRect();
    return { natW: im.naturalWidth, natH: im.naturalHeight, fitW: im.clientWidth,
             maxScale: m ? parseFloat(m[1]) : 1, w: +r.width.toFixed(1), vw: innerWidth };
  });
  check('M6 low-res source: fit size and max zoom both stay within the source pixels',
    lowM.fitW <= lowM.natW + 1 && lowM.fitW * lowM.maxScale <= lowM.natW + 2,
    `natural ${lowM.natW}x${lowM.natH}; fits at ${lowM.fitW}px in a ${lowM.vw}px viewport; max zoom x${lowM.maxScale.toFixed(2)} = ${Math.round(lowM.fitW * lowM.maxScale)}px (native ${lowM.natW}px)`);
  await page.screenshot({ path: path.join(SHOTS, 'mobile-04-lowres-no-upscale.png') });

  // close via the close button, reopen
  await page.locator('.customer-photo-gallery__lightbox-close').tap();
  await page.waitForTimeout(400);
  check('M7 close button closes the viewer', !(await isOpen(page)));
  await page.locator('.customer-photo-gallery__slide img').nth(0).tap();
  await page.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox-inner img').classList.contains('is-loaded'));
  const reCount = await page.textContent('.customer-photo-gallery__lightbox-counter');
  check('M8 reopen works and state is reset', (await isOpen(page)) && reCount === '1 of 6', `counter=${reCount}`);

  // ===== single-image on mobile: strip arrows =====
  const p2 = await ctx.newPage();
  await p2.goto(url('single'));
  await p2.waitForSelector('.customer-photo-gallery__slide img');
  const mArrows = await p2.$$eval('.customer-photo-gallery__arrow', (bs) => bs.map(b => getComputedStyle(b).display));
  check('M9 single-image PDP: strip arrows hidden on mobile (DEFECT if not)',
    mArrows.every(d => d === 'none'),
    `display=${JSON.stringify(mArrows)} - the data-count<=4 hide rule is scoped to @media (min-width:990px), so a 1-photo gallery still paints two no-op arrows under 990px`);
  await p2.screenshot({ path: path.join(SHOTS, 'mobile-05-single-image.png') });
  await p2.close();

  // ===== low-res-only gallery (Precor EFX 576i profile) =====
  const p3 = await ctx.newPage();
  await p3.goto(url('lowres'));
  await p3.waitForSelector('.customer-photo-gallery__slide img');
  await p3.waitForFunction(() => [...document.querySelectorAll('.customer-photo-gallery__slide img')].every(i => i.complete));
  await p3.locator('.customer-photo-gallery__slide img').nth(0).tap();
  await p3.waitForFunction(() => document.querySelector('.customer-photo-gallery__lightbox-inner img').classList.contains('is-loaded'));
  await p3.waitForTimeout(300);
  const lr = await p3.evaluate(async () => {
    const im = document.querySelector('.customer-photo-gallery__lightbox-inner img');
    const zin = document.querySelector('[data-zoom="in"]');
    for (let i = 0; i < 25; i++) { zin.click(); await new Promise(r => setTimeout(r, 20)); }
    const m = /matrix\(([\d.]+)/.exec(getComputedStyle(im).transform);
    return { natW: im.naturalWidth, fitW: im.clientWidth, maxScale: m ? parseFloat(m[1]) : 1,
             disabledAtMax: zin.disabled };
  });
  check('M10 all-low-res gallery: zoom stops exactly at the source resolution',
    lr.fitW * lr.maxScale <= lr.natW + 2 && lr.disabledAtMax,
    `fits at ${lr.fitW}px, max zoom x${lr.maxScale.toFixed(2)} = ${Math.round(lr.fitW * lr.maxScale)}px vs ${lr.natW}px native; zoom-in disabled at ceiling=${lr.disabledAtMax}`);
  await p3.screenshot({ path: path.join(SHOTS, 'mobile-06-lowres-gallery.png') });
  await p3.close();

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  try {
    await desktop(browser);
    await mobile(browser);
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.writeFileSync(path.join(DIR, 'results.json'), JSON.stringify(results, null, 2));
  if (failed.length) { console.log('FAILURES:'); failed.forEach(f => console.log(' -', f.id, f.detail)); }
})();
