// Behavioural test for snippets/google-maps-loader.liquid.
//
// Static assertions cannot catch this one. The loader is interaction
// triggered, so it can fire while the document is still parsing. Each map
// section's <script> sits near the top of the section while its map container
// sits ~180 lines below, so a promise that resolves on the API alone hands the
// consumer a DOM that does not yet contain the container. Google then reports
// "Expected mapDiv of type HTMLElement but was passed null".
//
// This drives the loader against a minimal DOM double where readyState starts
// at 'loading' and the container only appears when parsing completes, and
// asserts the promise does not resolve before that point.
//
// Usage: node scripts/maps_loader_dom_test.mjs [path-to-loader.liquid]

import fs from 'fs';
import path from 'path';

const loaderPath = process.argv[2] || 'snippets/google-maps-loader.liquid';
const src = fs.readFileSync(loaderPath, 'utf8');

const match = src.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
  console.error(`No <script> block found in ${loaderPath}`);
  process.exit(1);
}

// Strip Liquid so the block is plain JS.
const js = match[1].replace(/\{%[\s\S]*?%\}/g, '').replace(/\{\{[\s\S]*?\}\}/g, 'SECID');

const docListeners = {};
const winListeners = {};
let containerExists = false;

global.document = {
  readyState: 'loading',
  addEventListener: (evt, cb) => { docListeners[evt] = cb; },
  getElementById: (id) => (containerExists ? { id } : null),
  createElement: () => ({}),
  head: {
    appendChild(el) {
      // Stand in for the network: the API arrives shortly after the request.
      setTimeout(() => {
        global.window.google = { maps: {} };
        if (el.onload) el.onload();
      }, 0);
    },
  },
};

global.window = {
  addEventListener: (evt, cb) => { winListeners[evt] = cb; },
  setTimeout,
  clearTimeout,
};

new Function(js)();

let resolvedBeforeContainer = null;
window.googleMapsReady
  .then(() => { resolvedBeforeContainer = !containerExists; })
  .catch(() => { /* rejection is a separate test */ });

// A visitor scrolls immediately, while the page is still parsing.
winListeners.scroll();

setTimeout(() => {
  // Parsing completes: the container appears and DOMContentLoaded fires.
  containerExists = true;
  global.document.readyState = 'interactive';
  if (docListeners.DOMContentLoaded) docListeners.DOMContentLoaded();

  setTimeout(() => {
    const name = path.basename(loaderPath);
    if (resolvedBeforeContainer === null) {
      console.error(`FAIL ${name}: googleMapsReady never settled`);
      process.exit(1);
    }
    if (resolvedBeforeContainer) {
      console.error(
        `FAIL ${name}: googleMapsReady resolved before the document was parsed. ` +
        'Consumers would query a container that does not exist yet and Google ' +
        'would report "Expected mapDiv of type HTMLElement but was passed null".'
      );
      process.exit(1);
    }
    console.log('Maps loader DOM-readiness check passed.');
  }, 10);
}, 20);
