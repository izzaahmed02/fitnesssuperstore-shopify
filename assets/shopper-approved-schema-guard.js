/**
 * Shopper Approved structured-data guard and JSON-LD auditor.
 *
 * The Shopper Approved product script builds a full Product + AggregateRating +
 * Review JSON-LD node and inserts it before the page's first <script>. Its own
 * kill switch is the page-side variable `sa_schema`:
 *
 *   if ((typeof sa_schema !== 'undefined' && sa_schema == 1)
 *       || typeof sa_schema === 'undefined') { ...insert JSON-LD... }
 *
 * snippets/shopper-approved-product-reviews.liquid sets `sa_schema = 0` before
 * the loader, so the node is never built. That is the fix. This file is the
 * check on it, plus a backstop for any other Shopper Approved surface that
 * predates that switch.
 *
 * Removal is deliberately conservative: a node is removed only when it is
 * positively Shopper Approved's — inside the Shopper Approved container, or
 * self-identifying in its text. Nodes belonging to other apps are reported,
 * never deleted, because silently dropping another app's structured data is its
 * own defect.
 *
 * Reads for the evidence packet:
 *   window.shopperApprovedSchemaGuard.removed  count of nodes removed
 *   window.shopperApprovedSchemaGuard.audit()  every JSON-LD node on the page
 */
(function () {
  'use strict';

  var state = {
    removed: 0,
    samples: [],
    saSchemaSuppressed: typeof window.sa_schema !== 'undefined' && window.sa_schema == 0,
    audit: audit,
  };
  window.shopperApprovedSchemaGuard = state;

  /**
   * Every JSON-LD node on the page, with the rating claims it makes. Anything
   * reporting src "unattributed" alongside a rating is a second opinion on this
   * product's rating and needs a human decision.
   */
  function audit() {
    return [].map.call(
      document.querySelectorAll('script[type="application/ld+json"]'),
      function (node) {
        var text = node.textContent || '';
        var types = text.match(/"@type"\s*:\s*"([^"]+)"/g) || [];

        return {
          src: node.getAttribute('data-schema-source') || 'unattributed',
          shopperApproved: isShopperApproved(node),
          types: types
            .map(function (t) {
              return t.split('"')[3];
            })
            .filter(function (t, i, all) {
              return all.indexOf(t) === i;
            }),
          aggregateRatings: (text.match(/AggregateRating/g) || []).length,
          ratingValue: (text.match(/"ratingValue"\s*:\s*"?([\d.]+)/) || [])[1],
          reviewCount: (text.match(/"reviewCount"\s*:\s*"?(\d+)/) || [])[1],
          bytes: text.length,
        };
      }
    );
  }

  function isShopperApproved(node) {
    if (node.getAttribute('data-schema-source') === 'theme') return false;
    if (node.closest && node.closest('#shopper_review_page')) return true;

    return (node.textContent || '').toLowerCase().indexOf('shopperapproved') !== -1;
  }

  function remove(node) {
    if (state.samples.length < 5) {
      state.samples.push((node.textContent || '').slice(0, 200));
    }
    state.removed += 1;
    node.parentNode.removeChild(node);
  }

  function sweep(root) {
    var nodes = (root || document).querySelectorAll('script[type="application/ld+json"]');

    for (var i = 0; i < nodes.length; i++) {
      if (isShopperApproved(nodes[i])) remove(nodes[i]);
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
          if (isShopperApproved(node)) remove(node);
          continue;
        }

        sweep(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
