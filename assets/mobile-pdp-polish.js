/*
 * Mobile PDP polish helpers (Tim's May 13 direction).
 * Loaded by main-product.liquid, main-product-comb.liquid, and
 * main-product-variants.liquid.
 *
 * On mobile only, place the "Available to Order" / stock badge
 * (.available-wrap) directly after the mobile-visible price. The
 * mobile info container is .product__info-container--mobile; the
 * badge itself may originate there (comb / variants templates) or
 * from the shared/desktop .product__info-wrapper below the gallery
 * (regular main-product template). We anchor on the mobile price
 * and cross-parent insert the badge next to it.
 */
(function () {
  var mobileQuery = window.matchMedia('(max-width: 749px)');
  if (!mobileQuery.matches) return;

  function findVisibleStockBadge() {
    var candidates = document.querySelectorAll('.available-wrap');
    for (var i = 0; i < candidates.length; i++) {
      // Skip the desktop-only variant that carries the .hidden utility class.
      if (!candidates[i].classList.contains('hidden')) {
        return candidates[i];
      }
    }
    return candidates[0] || null;
  }

  function moveStockBadgeUnderPrice() {
    var mobileContainer = document.querySelector('.product__info-container--mobile');
    if (!mobileContainer) return;
    var priceContainer = mobileContainer.querySelector('.price-container');
    if (!priceContainer) return;
    var stockBadge = findVisibleStockBadge();
    if (!stockBadge) return;
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
