/*
 * Build Your Own Rig (BYOR) — saved / shareable output.
 *
 * MVP gap #2 from the technical-discovery checkpoint. Serialises a build into a
 * short, URL-safe token so a customer can:
 *   - save the build by bookmarking or mailing themselves the link
 *   - send the exact build to our sales team
 *   - come back to it later and pick up where they left off
 *
 * The token is self-contained: no server, no database, no account. That keeps
 * this a theme-only change with nothing to provision.
 *
 * Decoding treats the token as untrusted input. Every field is whitelisted and
 * type-checked, and anything unrecognised is dropped rather than merged, so a
 * malformed or hand-edited link can never produce a half-valid build state.
 *
 * encode()/decode() are pure (no DOM, no browser globals) so they are covered
 * by scripts/byor-rules-check.js.
 */
window.BYOR = window.BYOR || {};

window.BYOR.share = (function () {
  'use strict';

  var VERSION = 1;
  var PARAM = 'build';
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  /* SKUs and option ids we are willing to accept back out of a URL. */
  var TOKEN_RE = /^[A-Za-z0-9._-]{1,64}$/;

  /* ---------------------------------------------------------------------
   * Base64url over UTF-8, implemented locally so the same code runs in the
   * browser and in the node check harness (no btoa/Buffer dependency).
   * ------------------------------------------------------------------ */
  function utf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
        var next = str.charCodeAt(i + 1);
        var pair = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        bytes.push(
          0xf0 | (pair >> 18),
          0x80 | ((pair >> 12) & 0x3f),
          0x80 | ((pair >> 6) & 0x3f),
          0x80 | (pair & 0x3f)
        );
        i++;
      } else {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return bytes;
  }

  function utf8String(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; ) {
      var b = bytes[i++];
      if (b < 0x80) {
        out += String.fromCharCode(b);
      } else if (b >= 0xc0 && b < 0xe0) {
        out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
      } else if (b >= 0xe0 && b < 0xf0) {
        out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
      } else {
        var cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      }
    }
    return out;
  }

  function b64encode(str) {
    var bytes = utf8Bytes(str);
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i];
      var b1 = bytes[i + 1];
      var b2 = bytes[i + 2];
      out += ALPHABET[b0 >> 2];
      out += ALPHABET[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      out += b1 === undefined ? '' : ALPHABET[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      out += b2 === undefined ? '' : ALPHABET[b2 & 0x3f];
    }
    return out;
  }

  function b64decode(str) {
    var bytes = [];
    var buffer = 0;
    var bits = 0;
    for (var i = 0; i < str.length; i++) {
      var index = ALPHABET.indexOf(str.charAt(i));
      if (index < 0) return null; // reject anything outside the alphabet
      buffer = (buffer << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 0xff);
      }
    }
    return utf8String(bytes);
  }

  /* ---------------------------------------------------------------------
   * Whitelisted coercion helpers
   * ------------------------------------------------------------------ */
  function num(value) {
    var n = Number(value);
    return isFinite(n) && n > 0 ? n : null;
  }

  function token(value) {
    return typeof value === 'string' && TOKEN_RE.test(value) ? value : null;
  }

  /* { sku|index: positiveInteger } with both sides validated. */
  function qtyMap(value) {
    var out = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    Object.keys(value).forEach(function (key) {
      var k = token(key);
      var q = num(value[key]);
      if (k && q) out[k] = Math.min(Math.round(q), 999);
    });
    return out;
  }

  /* { index: { sku: qty } } — used for per-position bar and storage picks. */
  function nestedQtyMap(value) {
    var out = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    Object.keys(value).forEach(function (key) {
      if (!/^\d{1,3}$/.test(String(key))) return;
      var inner = qtyMap(value[key]);
      if (Object.keys(inner).length) out[key] = inner;
    });
    return out;
  }

  /* ---------------------------------------------------------------------
   * Encode / decode
   * ------------------------------------------------------------------ */
  function encode(state) {
    if (!state) return '';
    var payload = {
      v: VERSION,
      l: state.layoutId || null,
      m: state.mounting || null,
      u: state.uprights || {},
      d: state.depth || null,
      s: state.spacing || null,
      t: state.topStyle || null,
      sb: state.sectionBars || {},
      gb: state.gapBars || {},
      r2: state.secondRow ? 1 : 0,
      r2sb: state.secondRowSectionBars || {},
      r2gb: state.secondRowGapBars || {},
      h: state.hooks || 'none',
      hq: state.hookQty || {},
      st: state.storage || {},
      x: state.extras || {},
      su: state.siteUncertain ? 1 : 0
    };
    return b64encode(JSON.stringify(payload));
  }

  /*
   * Returns a clean state object, or null if the token is unusable.
   * `blank` is the caller's newState() so we never invent a shape here.
   */
  function decode(encoded, blank) {
    if (typeof encoded !== 'string' || !encoded) return null;

    var json = b64decode(encoded);
    if (!json) return null;

    var payload;
    try {
      payload = JSON.parse(json);
    } catch (err) {
      return null;
    }

    if (!payload || typeof payload !== 'object' || payload.v !== VERSION) return null;

    var state = blank && typeof blank === 'object' ? blank : {};

    state.layoutId = token(payload.l);
    state.mounting = payload.m === 'wall' || payload.m === 'floor' ? payload.m : null;
    state.uprights = qtyMap(payload.u);
    state.depth = num(payload.d);
    state.spacing = num(payload.s);
    state.topStyle = token(payload.t);
    state.sectionBars = nestedQtyMap(payload.sb);
    state.gapBars = nestedQtyMap(payload.gb);
    state.secondRow = payload.r2 === 1;
    state.secondRowSectionBars = nestedQtyMap(payload.r2sb);
    state.secondRowGapBars = nestedQtyMap(payload.r2gb);
    state.hooks = token(payload.h) || 'none';
    state.hookQty = qtyMap(payload.hq);
    state.storage = nestedQtyMap(payload.st);
    state.extras = qtyMap(payload.x);
    state.siteUncertain = payload.su === 1;

    /* A build with no uprights and no mounting carries no information. */
    if (!state.mounting && !Object.keys(state.uprights).length) return null;

    return state;
  }

  /* ---------------------------------------------------------------------
   * URL helpers (browser only)
   * ------------------------------------------------------------------ */
  function readToken(search) {
    var query = search;
    if (query == null) {
      query = typeof window !== 'undefined' && window.location ? window.location.search : '';
    }
    if (!query) return null;
    var match = String(query).match(new RegExp('[?&]' + PARAM + '=([^&#]+)'));
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch (err) {
      // Malformed percent-encoding in a hand-edited or truncated link.
      // Fall back to the raw value; decode() rejects it safely.
      return match[1];
    }
  }

  function buildUrl(state) {
    if (typeof window === 'undefined' || !window.location) return '';
    var encoded = encode(state);
    if (!encoded) return '';
    var base = window.location.origin + window.location.pathname;
    return base + '?' + PARAM + '=' + encoded;
  }

  /* Reflect the current build in the address bar without adding history steps. */
  function syncUrl(state) {
    if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;
    var encoded = encode(state);
    if (!encoded) return;
    try {
      window.history.replaceState({}, '', window.location.pathname + '?' + PARAM + '=' + encoded);
    } catch (err) {
      /* Non-fatal: sharing still works from the copy button. */
    }
  }

  return {
    VERSION: VERSION,
    PARAM: PARAM,
    encode: encode,
    decode: decode,
    readToken: readToken,
    buildUrl: buildUrl,
    syncUrl: syncUrl
  };
})();
