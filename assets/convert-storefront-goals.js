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
  function send(goal) {
    if (!Object.prototype.hasOwnProperty.call(goalIds, goal)) return;
    // Convert supports a pre-initialization command queue.
    window._conv_q = window._conv_q || [];
    window._conv_q.push(['triggerConversion', goalIds[goal]]);
  }

  window.fssConvertTrack = send;

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
