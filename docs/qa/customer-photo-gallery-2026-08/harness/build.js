const fs = require('fs');
const path = require('path');
// Resolve the section from this checkout (harness lives at
// docs/qa/customer-photo-gallery-2026-08/harness/), so the run reproduces anywhere.
// Pass a path as argv[2] to build the harness from a different revision of the file.
const DEFAULT_SRC = path.join(__dirname, '..', '..', '..', '..', 'sections', 'customer-photo-gallery.liquid');
const SRC = process.argv[2] || DEFAULT_SRC;
const IS_DEFAULT_SRC = !process.argv[2];
const src = fs.readFileSync(SRC, 'utf8');

// Extract the section's shipped CSS and JS verbatim; only substitute the Liquid
// section id (the sole Liquid expression inside the <script>).
const css = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const js  = src.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\{\{\s*section\.id\s*\}\}/g, 'demo');
if (/\{\{|\{%/.test(js)) { throw new Error('unsubstituted liquid left in JS'); }

const CASES = {
  multi:  { heading: 'Multi-image PDP (FSR100 dimensions)', imgs: [
      ['fsr100_1', 960, 1280, 'Portrait 960x1280'],
      ['fsr100_2', 1200, 1600, 'Portrait 1200x1600'],
      ['fsr100_3', 4032, 3024, 'Landscape 4032x3024'],
      ['fsr100_4', 4032, 3024, 'Landscape 4032x3024'],
      ['fsr90_hi', 4284, 5712, 'High-res portrait 4284x5712'],
      ['lowres_740', 740, 493, 'Low-res landscape 740x493'],
  ]},
  single: { heading: 'Single-image PDP (Marin combo dimensions)', imgs: [
      ['marin_single', 2252, 4000, 'Portrait 2252x4000'],
  ]},
  fsr90: { heading: 'Multi-image high-resolution PDP — full FSR90 gallery (all 10 photos)', imgs: [
      ['fsr90_01', 1277, 1586, 'FSR90 photo 1 — 1277x1586'],
      ['fsr90_02', 3482, 3000, 'FSR90 photo 2 — 3482x3000'],
      ['fsr90_03', 3000, 4000, 'FSR90 photo 3 — 3000x4000'],
      ['fsr90_04', 3000, 4000, 'FSR90 photo 4 — 3000x4000'],
      ['fsr90_05', 4284, 5712, 'FSR90 photo 5 — 4284x5712'],
      ['fsr90_06', 1137, 1531, 'FSR90 photo 6 — 1137x1531'],
      ['fsr90_07', 1200, 1600, 'FSR90 photo 7 — 1200x1600'],
      ['fsr90_08', 1141, 1507, 'FSR90 photo 8 — 1141x1507'],
      ['fsr90_09', 2682, 3576, 'FSR90 photo 9 — 2682x3576'],
      ['fsr90_10', 1512, 1974, 'FSR90 photo 10 — 1512x1974'],
  ]},
  lowres: { heading: 'Known low-resolution source set (Precor EFX 576i dimensions)', imgs: [
      ['lowres_740', 740, 493, 'Low-res 1'],
      ['lowres_740', 740, 493, 'Low-res 2'],
      ['lowres_740', 740, 493, 'Low-res 3'],
      ['lowres_740', 740, 493, 'Low-res 4'],
      ['lowres_740', 740, 493, 'Low-res 5'],
      ['lowres_740', 740, 493, 'Low-res 6'],
  ]},
};

// Mirror exactly what the Liquid `for` loop emits (blocks branch), with
// image_url widths replaced by the same local file (a local file has one
// intrinsic size; Shopify never upscales past the source either).
function slides(imgs) {
  return imgs.map(([name, w, h, caption], i) => `
          <div class="customer-photo-gallery__slide">
            <img
              src="img/${name}.png"
              srcset="img/${name}.png 400w, img/${name}.png 600w, img/${name}.png 800w"
              sizes="(min-width: 990px) 25vw, 80vw"
              width="${w}"
              height="${h}"
              data-full="img/${name}.png"
              data-caption="${caption}"
              alt="Customer photo ${i + 1}"
              loading="lazy"
              decoding="async"
            >
          </div>`).join('\n');
}

const LIGHTBOX = src.match(/<!-- Lightbox -->([\s\S]*?)<\/section>/)[1];

for (const [key, c] of Object.entries(CASES)) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CPG harness — ${key}</title>
<style>body{margin:0;font-family:system-ui,sans-serif}main{padding:24px 0}h1{font:600 16px/1.4 system-ui;padding:0 16px}</style>
<style>${css}</style>
</head><body>
<main>
<h1>${c.heading}</h1>
<section id="customer-photo-gallery-demo" class="customer-photo-gallery" data-count="${c.imgs.length}">
  <div class="customer-photo-gallery__header" id="photos">
    <h2>Customer Photo Gallery</h2>
  </div>
  <button class="customer-photo-gallery__arrow customer-photo-gallery__arrow--left" aria-label="Previous image" type="button">&lsaquo;</button>
  <button class="customer-photo-gallery__arrow customer-photo-gallery__arrow--right" aria-label="Next image" type="button">&rsaquo;</button>
  <div class="customer-photo-gallery__slider">
${slides(c.imgs)}
  </div>
${LIGHTBOX}</section>
<p style="padding:0 16px">Content below the gallery, used to verify the page does not scroll while the viewer is open.</p>
<div style="height:1400px"></div>
</main>
<script>${js}</script>
</body></html>`;
  fs.writeFileSync(path.join(__dirname, `case-${key}.html`), html);
  console.log('wrote case-' + key + '.html');
}

// Record what these pages were built from, so the runner can label its results and
// never overwrite the committed baseline with a run against some other revision.
fs.writeFileSync(path.join(__dirname, 'build-info.json'),
  JSON.stringify({ source: SRC, isWorkingTreeSection: IS_DEFAULT_SRC }, null, 2));
console.log(IS_DEFAULT_SRC
  ? 'built from the working-tree section'
  : `built from ${SRC} (results will be written to results.other-source.json)`);
