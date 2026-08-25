# Customer Photo Gallery — closeout QA (August 2026)

Scope: the gallery UX and rendering lane only, per Tim's 16 Aug direction. Source-image
replacement stays in the separate *Product Image Source Replacement — Tracker / Supplier /
Dealer Portal Workflow* thread and its tracker; no tracker rows are duplicated here.

Run dates: 18 Aug 2026, extended 21 Aug 2026. Result: **46 of 46 functional checks pass**,
3 defects found and fixed in this pass, 2 low-priority items left open for a decision.

---

## 1. Where the implementation lives

| Piece | File |
| --- | --- |
| Customer Photo Gallery (strip, lightbox, zoom/pan) | `sections/customer-photo-gallery.liquid` — self-contained markup + CSS + JS |
| PDP media gallery layout (desktop sizing, mobile aspect ratio) | `assets/custom.css` |
| PDP mobile gallery behaviour | `assets/product-mobile-gallery.js` |

Live theme: `fitnesssuperstore-shopify/main`, `gid://shopify/OnlineStoreTheme/186120208700`,
role `MAIN`.

**The live theme and `origin/main` are byte-identical** for all three files — MD5 read from the
Shopify Admin API on 18 Aug 2026 matches the MD5 of the file on `origin/main`:

| File | MD5 (live theme = `origin/main`) | Bytes |
| --- | --- | --- |
| `sections/customer-photo-gallery.liquid` | `032fdfcbc8270cddd8de8d41c1cea827` | 31,646 |
| `assets/custom.css` | `e08415841edce5e34577a48c11232305` | 67,686 |
| `assets/product-mobile-gallery.js` | `7c62f34d032e4bc352699774e5da3442` | 29,457 |

So there is no drift between GitHub and what customers are served.

These three hashes are the **pre-fix baseline** — the released state that was audited. This
branch deliberately differs from it: the fixes in section 5 change
`sections/customer-photo-gallery.liquid`, so on this branch that file hashes
`c75779ea40a936aba44e2a4f69271e1e`. The other two files are untouched and still match the table.
Reproduce the baseline with
`git show 575a8de:sections/customer-photo-gallery.liquid | md5sum`. `575a8de` is this PR's merge
base and the immutable audited revision — `origin/main` moves, and once this PR merges it will
contain the fix rather than the baseline.

### Merged PR chain

Gallery UX / lightbox: #363 (image-swap race), #391 + #393 (`#photos` anchor, sticky-header
offset; #392 was reverted by #394), #523 (closed lightbox no longer focusable), #530
(prev/next, keyboard nav, swipe, counter, captions, `object-fit: contain`), #531 (focus trap,
keyboard-operable thumbnails, reduced-motion, `srcset`, lazy init), #532 (lightbox re-parented
to `<body>` so `position: fixed` resolves to the viewport), #533 (zoom/pan: buttons, wheel,
pinch, `+`/`-`/`0`, zoom ceiling at native pixels), #655 (deep-link anchor + `scroll-margin-top`).

PDP media gallery: #596 (gallery size/gap), #600 (main image resize/centre; mobile slides use
the real image aspect ratio instead of a forced 1:1 crop), #601 (empty trailing slide for
3D-model media), #651 (`--pdp-image-max` 440px → 700px, applied as `max-width` so the image is
only ever downscaled).

All merged. No gallery PR is open (all 24 open PRs reviewed on 18 Aug 2026).

## 2. How this was tested, and what it is not

The production storefront and `cdn.shopify.com` are **not reachable** from the environment this
run was performed in (egress policy answers `403` to `CONNECT`). This is therefore not a
click-through on a live PDP.

What it *is*: the shipped section's markup, CSS and JS, extracted verbatim from
`sections/customer-photo-gallery.liquid` (the only substitution is the Liquid `section.id`),
run in Chromium via Playwright against images generated at **the exact pixel dimensions of the
live Shopify assets**, read from the Admin API:

| Case | Real product | Media profile |
| --- | --- | --- |
| Multi-image, mixed orientation | French Fitness FSR100 | 960×1280 and 1200×1600 portrait, 4032×3024 landscape ×2 |
| Multi-image, high resolution | French Fitness FSR90 | the full 10-photo gallery, every real dimension: 1277×1586, 3482×3000, 3000×4000 ×2, 4284×5712, 1137×1531, 1200×1600, 1141×1507, 2682×3576, 1512×1974 |
| Single-image gallery | French Fitness Marin Iso-Lateral Chest/Back Combo | 1 photo, 2252×4000 portrait |
| Known low-resolution source set | Precor EFX 576i (Remanufactured) | 6 photos, all 740×493 |

Viewports: desktop 1440×900, mobile iPhone 13 (390×844, touch). Harness and raw results are in
`harness/`; screenshots in `evidence/`.

### Re-running it

```sh
cd docs/qa/customer-photo-gallery-2026-08/harness
npm run setup   # installs Playwright and its Chromium binary; nothing is added to
                # the theme's own dependencies
npm test        # generate fixtures -> build the pages -> run both suites
```

`npm install` on its own is not enough: the `playwright` package ships no postinstall step, so
`chromium.launch()` would fail without the browser download that `npm run setup` performs. If
the machine already has Playwright browsers, point `PLAYWRIGHT_BROWSERS_PATH` at them and
`npm install && npm test` is sufficient.

The FSR90 row was originally represented by that product's largest image only, inside the mixed
`multi` case. A 21 Aug review flagged that the report claimed more coverage than the harness
exercised, which was correct — so a dedicated `fsr90` case was added that builds the real
10-photo strip at all ten dimensions, and the F-series checks below run against it.

`npm test` runs the fixtures, the two browser suites and then `verify-report.js`, and exits
non-zero if any of them fails, so it can be wired into CI.

`npm run verify` is the report's own guard. Three errors in this closeout came from
hand-transcribing numbers out of `results.json` into this file — an overstated FSR90 profile, a
stale check total, and a miscounted set of zoom ceilings — so every figure the report states
about a run is now checked against the run: the totals, one report row per recorded check, all
ten F7 ceilings quoted verbatim, the five/five delivery-cap split, and the baseline figure. It
fails if the report and the data drift apart again. The fixture
dimensions are committed in `fixtures.json` (each entry names the live product it stands in
for); the generated images, built pages and `node_modules` are gitignored. `results.json` is the
raw output of the run recorded in this report — 46/46 against the section file as it stands on
this branch.

To reproduce the before/after evidence for a fix, build the pages from another revision of the
section and re-run:

```sh
node build.js <(git show 575a8de:sections/customer-photo-gallery.liquid) && npm run qa
```

That run writes `results.other-source.json` instead of `results.json`, so a comparison run can
never overwrite the committed evidence. Against the audited pre-fix section it reports 45/46 and
exits non-zero, the M9 failure being the dead single-photo arrows fixed here. The revision is
pinned to `575a8de` deliberately: a moving ref would stop reproducing this figure the moment the
fix lands on it.

A human spot-check on two or three live PDPs is still worth doing before the closeout is signed
off — this run proves the code's behaviour, not the CDN delivery path.

## 3. Results

### Desktop (1440×900)

| # | Check | Result |
| --- | --- | --- |
| D1 | Thumb-strip next/prev scrolling | Pass — scrollLeft 0 → 370 → 0 |
| D2 | Thumbnails crop square via `object-fit: cover`, no stretch | Pass |
| D3 | Viewer opens from a thumbnail click | Pass |
| D4 | High-res image contained, aspect preserved | Pass — 4284×5712 → 594×792, `object-fit: contain` |
| D5 | Counter reflects position | Pass — "5 of 6" |
| D6 | Focus moves into the viewer on open | Pass — lands on Close |
| D7 | Page scroll locked while open | Pass |
| D8 | Keyboard ←/→ navigate | Pass |
| D9 | On-screen arrows navigate; boundary arrows hidden (no wrap) | Pass |
| D10 | Zoom-in scales a high-res image | Pass |
| D11 | Zoom never exceeds the delivered pixels | Pass — 4284px source, delivered 2048px, zoom stops at ×3.45 = 2048px, then disabled |
| D12 | "Fit" resets zoom and pan | Pass |
| D13 | Low-res source shown at native size, not enlarged | Pass — 740×493 → rendered 740×493 |
| D14 | Zoom-in disabled for a low-res source | Pass |
| D15 | Viewer alt text + `aria-live` caption | Pass |
| D16 | Thumbnail alt text present | Pass (generic — see open item O2) |
| D17 | Dialog semantics (`role`, `aria-modal`, `aria-label`) | Pass |
| D18 | Tab focus stays inside the viewer | Pass — 10 consecutive Tabs, never left |
| D19 | Escape closes | Pass |
| D20 | Focus returns to the opening thumbnail | Pass |
| D21 | Page scroll restored after close | Pass |
| D22 | Reopen is clean (zoom/pan reset, correct index) | Pass |
| D23 | Backdrop click closes | Pass |
| D24 | Thumbnails keyboard-operable (Enter) | Pass |
| D25 | Single-image PDP hides strip arrows | Pass |
| D26 | Single-image viewer: arrows hidden, "1 of 1" | Pass |
| D27 | Tall portrait contained without distortion | Pass — 2252×4000 → 445.9×792 |
| D28 | `prefers-reduced-motion` honoured | Pass |

### Mobile (iPhone 13, touch)

| # | Check | Result |
| --- | --- | --- |
| M1 | Strip scrolls horizontally with snap | Pass — `scroll-snap-type: x mandatory` |
| M2 | Tap opens the viewer | Pass |
| M3 | Swipe left/right changes photo | Pass — 1 of 6 → 2 of 6 → 1 of 6 |
| M4 | Two-finger pinch zooms | Pass — ×2.40 |
| M5 | One-finger pan while zoomed | Pass |
| M6 | Low-res source: fit size and zoom ceiling stay within source pixels | Pass — fits at 374px in a 390px viewport, max zoom ×1.98 = 740px vs 740px native |
| M7 | Close button closes | Pass |
| M8 | Reopen resets state | Pass |
| M9 | Single-image PDP: no dead strip arrows | Pass **after** the fix below (failed before) |
| M10 | All-low-res gallery: zoom stops exactly at source resolution | Pass |

### Full FSR90 gallery — all 10 photos (desktop 1440×900)

| # | Check | Result |
| --- | --- | --- |
| F1 | Gallery renders all 10 photos | Pass — 10 slides |
| F2 | Strip arrows shown for a >4 photo gallery | Pass |
| F3 | Counter and start boundary across 10 | Pass — "1 of 10", previous hidden |
| F4 | All 10 contained in the viewport | Pass — e.g. delivered 2048×1765 → 919×792, delivered 2048×2731 → 593.9×792 |
| F5 | All 10 keep their aspect ratio | Pass |
| F6 | No photo enlarged past its own source at fit size | Pass |
| F7 | Zoom ceiling stays within each photo's delivered pixels | Pass — all ten, verbatim from `results.json`: ×2.00=1277/1277, ×2.23=2048/2048, ×3.45=2048/2048, ×3.45=2048/2048, ×3.45=2048/2048, ×1.93=1137/1137, ×2.02=1200/1200, ×1.90=1141/1141, ×3.45=2048/2048, ×2.49=1512/1512 |
| F8 | End boundary after walking all 10 | Pass — "10 of 10", next hidden |

F7 is the per-photo form of the no-upscale guarantee, and FSR90's ten photos split five/five
across the delivery cap. The five whose sources are under 2048px stop at their own native width
(1137, 1141, 1200, 1277, 1512). The five above it — 2682, 3000 ×2, 3482 and 4284 px wide — are
each delivered at 2048px and stop there: ×2.23 for the landscape one, ×3.45 for the four
portraits. Either way the ceiling is the pixels the customer actually received, never more.

## 4. No upscaling, and code defects vs source defects

Three independent guards, each measured rather than asserted:

1. **Delivery** — the viewer requests `image_url: width: 2048`, so Shopify delivers
   min(source, 2048) px wide: the source itself when smaller, a downscaled rendition when larger,
   never an upscale. The harness mirrors this — `data-full` points at a 2048-capped rendition of
   each fixture, so every measurement below is of an image a customer can actually receive.
2. **Layout** — `max-width/max-height: 100%`, `width/height: auto`, `object-fit: contain` on the
   viewer image. It is fit-only: a 740×493 photo renders at 740×493 on desktop (measured), and
   is downscaled — never stretched — when the viewport is narrower.
3. **Zoom ceiling** — `computeMaxScale()` caps zoom at `naturalWidth / clientWidth`. Measured:
   FSR90's 4284px source is delivered at 2048px and zooms to exactly 2048px before the "+"
   button disables; the 740px Precor source is delivered untouched and cannot be zoomed at all on
   desktop.

So on a PDP whose photos look soft at fit size, the softness is in the source file. The gallery
is not enlarging or distorting it. Those rows belong to the source-image tracker, not here.

## 5. Defects found in this pass

Fixed in `sections/customer-photo-gallery.liquid`:

1. **Dead prev/next arrows on a single-photo gallery below 990px.** The `data-count` hide rule
   was scoped to `@media (min-width: 990px)`, so a one-photo gallery painted two arrows that
   scrolled nothing on phones. The single-photo case is now hidden at every width; 2–4 photos
   still scroll under 990px and keep their arrows.
   Evidence: `evidence/10-mobile-single-image-BEFORE-fix.jpg` vs `11-...-AFTER-fix.jpg`.
2. **Keyboard focus escaped the modal at the last photo.** Pressing Enter on the Next button
   until the last photo hid that button, dropping focus to `<body>` — from there Tab walked the
   page behind the open dialog. Focus now falls back to Previous, or Close.
3. **Strip arrows animated under `prefers-reduced-motion`.** `scrollBy({behavior: 'smooth'})`
   ran unconditionally; the CSS reduced-motion block cannot reach a scroll animation. The
   behaviour is now chosen from `matchMedia('(prefers-reduced-motion: reduce)')`.

Open, deliberately not changed:

- **O1 — dead heading style.** `.customer-photo-gallery__header h4` styles an element that
  renders as `<h2>`, so the intended Lato / 700 / `margin: 0` and the mobile 20px size never
  apply; the heading falls back to the theme's default `h2`. Cosmetic. Correcting the selector
  changes live heading typography on ~68 product pages plus the article and page templates, so
  it wants a design call rather than a silent fix.
- **O2 — generic thumbnail alt text.** Thumbnails are always `alt="Customer photo N"`; the
  block caption and the image's own alt text are carried into the viewer but not onto the
  thumbnail. Low-priority a11y/SEO improvement.

## 6. Regression check

`python scripts/cwv_regression_test.py` (the repo's CI check) passes on this branch.
