(function () {
  'use strict';
  if (window.__fssConvertGoalsInstalled) return;
  window.__fssConvertGoalsInstalled = true;

  var goals = {
    viewItem: '100161464',
    addToCart: '100161466',
    viewCart: '100161467'
  };
  var pageType = document.currentScript && document.currentScript.getAttribute('data-page-type');
  var privacyReady = false;
  var privacyAllowed = false;
  var pending = [];

  function flush() {
    if (!privacyReady || !privacyAllowed) return;
    window._conv_q = window._conv_q || [];
    while (pending.length) window._conv_q.push(['triggerConversion', goals[pending.shift()]]);
  }

  function track(name) {
    if (!Object.prototype.hasOwnProperty.call(goals, name)) return;
    if (privacyReady && !privacyAllowed) return;
    pending.push(name);
    flush();
  }

  function refreshConsent() {
    var cp = window.Shopify && window.Shopify.customerPrivacy;
    if (!cp || typeof cp.analyticsProcessingAllowed !== 'function') return;
    privacyAllowed = !!cp.analyticsProcessingAllowed();
    privacyReady = true;
    if (!privacyAllowed) pending.length = 0;
    flush();
  }

  window.fssConvertTrack = track;
  document.addEventListener('visitorConsentCollected', refreshConsent);

  if (window.Shopify && typeof window.Shopify.loadFeatures === 'function') {
    window.Shopify.loadFeatures(
      [{ name: 'consent-tracking-api', version: '0.1' }],
      function (error) {
        if (!error) refreshConsent();
      }
    );
  } else {
    refreshConsent();
  }

  if (pageType === 'product') track('viewItem');
  if (pageType === 'cart') track('viewCart');

  function subscribeToStandardProductForm() {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
      if (!event || event.source !== 'product-form' || !event.cartData ||
          event.cartData.status) return;
      track('addToCart');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', subscribeToStandardProductForm, { once: true });
  } else {
    subscribeToStandardProductForm();
  }
})();
