/**
 * Shopper Approved structured-data guard.
 *
 * The legacy Shopper Approved product widget emits its own Product, Offer,
 * AggregateRating and Review JSON-LD. Running it next to the theme's
 * Judge.me-backed schema would put two AggregateRating sources on the page,
 * which is the duplicate-structured-data risk Google penalises.
 *
 * The supported fix is the vendor-side JSON-LD disable on the Shopper Approved
 * account. This guard is the preview-side belt and braces so the preview theme
 * can be proven clean before that account setting is touched: it removes only
 * JSON-LD that Shopper Approved injected, and never the theme's own node, which
 * carries data-schema-source="theme".
 *
 * Exposes window.shopperApprovedSchemaGuard for the evidence packet:
 *   { removed: Number, samples: Array<String> }
 */
(function () {
  'use strict';

  var state = { removed: 0, samples: [] };
  window.shopperApprovedSchemaGuard = state;

  function isShopperApprovedNode(node) {
    if (node.getAttribute('data-schema-source') === 'theme') return false;

    // Injected inside the Shopper Approved display container.
    if (node.closest && node.closest('#shopper_approved')) return true;

    // Injected elsewhere (head or body) but self-identifying as Shopper Approved.
    return (node.textContent || '').toLowerCase().indexOf('shopperapproved') !== -1;
  }

  function sweep(root) {
    var nodes = (root || document).querySelectorAll('script[type="application/ld+json"]');

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!isShopperApprovedNode(node)) continue;

      if (state.samples.length < 5) {
        state.samples.push((node.textContent || '').slice(0, 200));
      }
      state.removed += 1;
      node.parentNode.removeChild(node);
    }
  }

  sweep(document);

  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;

      for (var j = 0; j < added.length; j++) {
        var node = added[j];
        if (node.nodeType !== 1) continue;

        if (node.tagName === 'SCRIPT' && node.getAttribute('type') === 'application/ld+json') {
          if (isShopperApprovedNode(node)) {
            if (state.samples.length < 5) {
              state.samples.push((node.textContent || '').slice(0, 200));
            }
            state.removed += 1;
            node.parentNode.removeChild(node);
          }
          continue;
        }

        sweep(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
