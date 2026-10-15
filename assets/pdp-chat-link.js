// Mobile options UI: inline "Chat with us" under Add to Cart, plus keeping the floating
// Gorgias launcher off the purchase area while it is on screen. Display/entry point only:
// nothing here reads or writes cart, price or form data. The widget is still loaded lazily
// by layout/theme.liquid; the click on this button is what triggers that loader if it
// has not run yet.
(function () {
  var buttons = document.querySelectorAll('[data-pdp-chat-open]');
  if (buttons.length === 0) return;

  // GorgiasChat.open() is the method Gorgias documents for custom "open chat" links;
  // init() resolves once the widget is ready.
  function openChat() {
    if (window.GorgiasChat && typeof window.GorgiasChat.open === 'function') {
      var ready = typeof window.GorgiasChat.init === 'function' ? window.GorgiasChat.init() : null;
      Promise.resolve(ready).then(function () {
        window.GorgiasChat.open();
      });
      return;
    }
    var timer = window.setTimeout(function () {
      window.removeEventListener('gorgias-widget-loaded', onLoaded);
    }, 10000);
    function onLoaded() {
      window.clearTimeout(timer);
      openChat();
    }
    window.addEventListener('gorgias-widget-loaded', onLoaded, { once: true });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', openChat);
  });

  // While the price / Add to Cart area is visible, hide the floating launcher (CSS in
  // custom-main-product-page.css, mobile only) so it never covers the purchase controls.
  var purchaseArea = document.querySelector('.product-form--options-mobile');
  if (!purchaseArea || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (entries) {
    document.documentElement.classList.toggle('pdp-purchase-in-view', entries[0].isIntersecting);
  }).observe(purchaseArea);
})();
