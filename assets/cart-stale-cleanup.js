// Removes stale Avis (`_apo_option` / `_apo_order`) line items and `ap_*` /
// `bct` cart attributes that may have been deposited in a customer cart while
// the previous (Avis-enabled) theme was live. Runs once per session, on idle,
// so it never blocks render, navigation, or input.
(function () {
  var SESSION_FLAG = 'fs_cart_apo_cleanup_done';

  function shouldSkip() {
    try {
      if (window.sessionStorage.getItem(SESSION_FLAG) === '1') return true;
    } catch (e) {}
    if (document.cookie.indexOf('cart=') === -1) return true;
    return false;
  }

  function markDone() {
    try { window.sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) {}
  }

  function isStaleItem(item) {
    var p = item && item.properties;
    if (!p) return false;
    return Object.prototype.hasOwnProperty.call(p, '_apo_option')
        || Object.prototype.hasOwnProperty.call(p, '_apo_order');
  }

  function buildAttributeWipe(cart) {
    var attrs = {};
    if (!cart || !cart.attributes) return attrs;
    Object.keys(cart.attributes).forEach(function (k) {
      if (k === 'bct' || k.indexOf('ap_') === 0) attrs[k] = '';
    });
    return attrs;
  }

  var inFlight = null;
  function cleanup() {
    if (inFlight) return inFlight;
    if (shouldSkip()) return Promise.resolve(false);
    inFlight = fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cart) {
        if (!cart || !Array.isArray(cart.items)) { markDone(); return false; }
        var stale = cart.items.filter(isStaleItem);
        var attributes = buildAttributeWipe(cart);
        if (stale.length === 0 && Object.keys(attributes).length === 0) {
          markDone();
          return false;
        }
        var updates = {};
        stale.forEach(function (item) { updates[item.key] = 0; });
        return fetch('/cart/update.js', {
          method: 'POST',
          credentials: 'same-origin',
          keepalive: true,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ updates: updates, attributes: attributes })
        }).then(function () {
          markDone();
          if (typeof PUB_SUB_EVENTS !== 'undefined' && typeof publish === 'function') {
            try { publish(PUB_SUB_EVENTS.cartUpdate, { source: 'fs-cart-apo-cleanup' }); } catch (e) {}
          }
          return true;
        });
      })
      .catch(function () { return false; })
      .then(function (result) { inFlight = null; return result; });
    return inFlight;
  }

  function schedule() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function () { cleanup(); }, { timeout: 2000 });
    } else {
      window.setTimeout(function () { cleanup(); }, 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  // Last-resort guard: if a customer somehow clicks Checkout before the idle
  // cleanup has run, intercept once, run cleanup, then continue. After the
  // session flag is set this becomes a no-op.
  function isCheckoutTrigger(el) {
    if (!el) return false;
    if (el.matches && el.matches('[name="checkout"], [name="goto_pay_gateway"]')) return true;
    var href = el.getAttribute && el.getAttribute('href');
    if (href && /\/checkout(\b|\/|\?)/.test(href)) return true;
    return false;
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target && (e.target.closest ? e.target.closest('[name="checkout"], [name="goto_pay_gateway"], a[href*="/checkout"]') : null);
    if (!trigger || !isCheckoutTrigger(trigger)) return;
    if (shouldSkip()) return;
    e.preventDefault();
    e.stopPropagation();
    cleanup().then(function () {
      if (trigger.tagName === 'A') {
        window.location.href = trigger.href;
      } else {
        var form = trigger.form || trigger.closest('form');
        if (form) form.submit();
        else trigger.click();
      }
    });
  }, true);
})();
