// Mobile options UI: inline "Chat with us" under Add to Cart, plus keeping the floating
// Gorgias launcher off the purchase area while it is on screen. Display/entry point only:
// nothing here reads or writes cart, price or form data. The widget is still loaded lazily
// by layout/theme.liquid; the click on this button is what triggers that loader if it
// has not run yet.
(function () {
  var buttons = document.querySelectorAll('[data-pdp-chat-open]');
  if (buttons.length === 0) return;

  // GorgiasChat.open() is the method Gorgias documents for custom "open chat" links.
  // A tap right after page load can land before the widget exists or has rendered.
  // Until init() resolves, Gorgias throws on any other API member, so only init() is
  // touched first; then retry briefly (max 10s) until the widget has rendered.
  function openChat() {
    var deadline = Date.now() + 10000;
    function attempt() {
      var chat = window.GorgiasChat;
      if (!chat) {
        if (Date.now() < deadline) window.setTimeout(attempt, 300);
        return;
      }
      Promise.resolve()
        .then(function () {
          return chat.init();
        })
        .then(function () {
          var rendered = chat.isChatRendered();
          chat.open();
          if (!rendered && Date.now() < deadline) window.setTimeout(attempt, 400);
        })
        .catch(function () {
          if (Date.now() < deadline) window.setTimeout(attempt, 400);
        });
    }
    attempt();
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
