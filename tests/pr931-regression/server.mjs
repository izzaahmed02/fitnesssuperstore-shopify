// Static server for the PR #931 regression rig.
//
// It serves the REAL theme assets from the working tree (and the pre-fix copies
// extracted from git) plus a /cart.js per scenario, so the guard's own
// `fetch(`${window.Shopify.routes.root}cart.js`)` runs unmodified. Nothing in
// the rig stubs fetch.

import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { CARTS } from './fixtures.mjs';

// Read lazily: run.mjs sets THEME_DIR in its body, which runs after this
// module is evaluated.
const THEME = () => process.env.THEME_DIR;
const HERE = new URL('.', import.meta.url).pathname;

const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };

// POST /cart/add.js and /cart/change.js are recorded, not performed: the rig
// proves whether the theme reached the network, which is the whole question on
// the "guard did not run" findings.
export const posts = [];
export const gets = [];

const SECTIONS = {
  'main-cart-items': '<div class="section-cart-items">rerendered by the rig</div>',
  'main-cart-footer': '<div class="footer-subtotal-value">rerendered by the rig</div>',
};

export function start(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        posts.push({ path: p, body });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ items: [], sections: SECTIONS }));
      });
      return;
    }

    gets.push(p);

    // /s/<cartName>/cart.js  — the scenario's cart, fetched by the real guard
    const cartMatch = p.match(/^\/s\/([^/]+)\/cart\.js$/);
    if (cartMatch) {
      const cart = CARTS[cartMatch[1]];
      if (!cart) { res.writeHead(404); res.end('no such cart'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cart));
      return;
    }

    // /assets/<name>  — the working-tree asset (the fix under test)
    // /prefix/<name>  — the same asset at d771adf^ (before the five fixes)
    // /splitkey/<name>— the same asset at d771adf  (after the five fixes,
    //                   before the cart-line-key correction)
    let file = null;
    if (p.startsWith('/assets/')) file = `${THEME()}/assets/${p.slice('/assets/'.length)}`;
    else if (p.startsWith('/prefix/')) file = `${HERE}prefix/${p.slice('/prefix/'.length)}`;
    else if (p.startsWith('/splitkey/')) file = `${HERE}splitkey/${p.slice('/splitkey/'.length)}`;
    // /mutant/ — the working tree with exactly one line deleted, built by
    // run.mjs. It exists because finding 4 cannot be observed on d771adf^: the
    // finding-1 bug there aborts the handler before the rejection path is ever
    // reached, so the only way to show finding 4's before-state is to undo
    // finding 4 alone.
    else if (p.startsWith('/mutant/')) file = `${HERE}mutant/${p.slice('/mutant/'.length)}`;
    else if (p === '/' || p.startsWith('/s/')) file = `${HERE}harness.html`;

    if (!file || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'text/plain' });
    res.end(readFileSync(file));
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}
