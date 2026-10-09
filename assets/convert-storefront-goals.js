/* Convert core storefront goals. Loader remains in layout/theme.liquid.
 * Do not track cart/change.js or cart/update.js as add-to-cart conversions:
 * modifying an existing line may internally call cart/add.js.
 */
(function () {
  'use strict';
  if (window.__fssConvertGoalsInstalled) return;
  window.__fssConvertGoalsInstalled = true;

  var goalIds = {
    viewItem: '100161464',
    addToCart: '100161466',
    viewCart: '100161467'
  };
  var script = document.currentScript;
  var pageType = script ? script.getAttribute('data-page-type') : '';
  var queued = [];

  function send(goal) {
    if (!Object.prototype.hasOwnProperty.call(goalIds, goal)) return;
    var command = ['triggerConversion', goalIds[goal]];
    if (!window.__fssConvertReady) {
      queued.push(command);
      return;
    }
    window._conv_q = window._conv_q || [];
    window._conv_q.push(command);
  }

  function flush() {
    if (!window.__fssConvertReady || !queued.length) return;
    window._conv_q = window._conv_q || [];
    queued.forEach(function (command) { window._conv_q.push(command); });
    queued.length = 0;
  }

  window.fssConvertTrack = send;
  window.addEventListener('fss-convert-ready', flush);
  flush();

  // Only fire page-view goals for their actual Shopify page types.
  if (pageType === 'product') send('viewItem');
  if (pageType === 'cart') send('viewCart');

  function bindStandardProductAdds() {
    // pubsub.js and constants.js are deferred in the normal Shopify theme.
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
      // Product form publishes only after Shopify returns a successful add.
      // Do not count cart edits, item removals, or other cartUpdate sources.
      if (event && event.source === 'product-form' &&
          event.cartData && !event.cartData.status) {
        send('addToCart');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStandardProductAdds, { once: true });
  } else {
    bindStandardProductAdds();
  }
})();
