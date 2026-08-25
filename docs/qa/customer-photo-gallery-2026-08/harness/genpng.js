const zlib = require('zlib');
const fs = require('fs');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
// w x h RGB checkerboard with a 1px-detail grid so upscaling is visually obvious
function png(w, h, hue) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let p = 0;
  const cell = 16;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const on = ((x / cell | 0) + (y / cell | 0)) % 2 === 0;
      const edge = x < 4 || y < 4 || x >= w - 4 || y >= h - 4;
      const line = (x % 2 === 0 && y % 2 === 0); // 1px detail: turns to mush if upscaled
      let r, g, b;
      if (edge) { r = 220; g = 30; b = 30; }
      else if (line) { r = 0; g = 0; b = 0; }
      else if (on) { r = hue[0]; g = hue[1]; b = hue[2]; }
      else { r = 250; g = 250; b = 250; }
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Defaults make this runnable from a clean checkout with no arguments:
// the fixture list is committed in fixtures.json and the output directory is created.
// Optional args: [outputDir] [fixturesFile]
const path = require('path');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'img');
const manifest = process.argv[3] ? path.resolve(process.argv[3]) : path.join(__dirname, 'fixtures.json');
const specs = JSON.parse(fs.readFileSync(manifest, 'utf8')).images;

// The production section sets data-full from `image_url: width: 2048`, so Shopify delivers
// min(source, 2048) px wide and never upscales. Emit a matching delivery rendition per fixture
// (<name>__d.png) alongside the full-size source, so the harness measures what a customer can
// actually receive rather than the untouched original.
const DELIVERY_CAP = 2048;

fs.mkdirSync(out, { recursive: true });
for (const s of specs) {
  fs.writeFileSync(path.join(out, `${s.name}.png`), png(s.w, s.h, s.hue || [40, 90, 200]));
  const dw = Math.min(s.w, DELIVERY_CAP);
  const dh = dw === s.w ? s.h : Math.round((s.h * DELIVERY_CAP) / s.w);
  fs.writeFileSync(path.join(out, `${s.name}__d.png`), png(dw, dh, s.hue || [40, 90, 200]));
  const note = dw === s.w ? 'delivered at source size' : `delivered ${dw}x${dh} (capped at ${DELIVERY_CAP})`;
  console.log(`${s.name}  ${s.w}x${s.h}  -> ${note}  ${s.source || ''}`);
}
