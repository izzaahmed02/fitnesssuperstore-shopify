/*
 * Mobile PDP polish helpers (Tim's May 13 direction).
 * Loaded by main-product.liquid, main-product-comb.liquid, and
 * main-product-variants.liquid.
 *
 * Currently: on mobile only, move the "Available to Order" / stock
 * badge (.available-wrap) directly under the price container.
 * The badge is authored inside the review_widget block for legacy
 * reasons, so a DOM move is safer than a template/block-order
 * refactor (which would fight the merchant-configurable section
 * block order in the theme editor).
 */
(function () {
  var mobileQuery = window.matchMedia('(max-width: 749px)');
  if (!mobileQuery.matches) return;

  function moveStockBadgeUnderPrice() {
    var wrapper = document.querySelector('.product__info-wrapper');
    if (!wrapper) return;
    var priceContainer = wrapper.querySelector('.price-container');
    var stockBadge = wrapper.querySelector('.available-wrap');
    if (!priceContainer || !stockBadge) return;
    if (priceContainer.nextElementSibling === stockBadge) return;
    priceContainer.parentNode.insertBefore(stockBadge, priceContainer.nextSibling);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveStockBadgeUnderPrice);
  } else {
    moveStockBadgeUnderPrice();
  }
  document.addEventListener('variant:change', moveStockBadgeUnderPrice);
})();
