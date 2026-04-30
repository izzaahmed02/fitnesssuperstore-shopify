/*
  Combined Listings PDP behaviour
  --------------------------------
  Scoped to the product.combined-listings template only (the section that
  loads this script is rendered behind a {% if template == ... %} guard, so
  this file never executes on other product templates).

  Responsibilities:
    1. Auto-redirect the parent (consolidated) product URL to the first
       option value of each option group, so the customer always lands on a
       fully-selected child product page.
    2. On any variant option change, force a full browser navigation to the
       option's child product URL so the canonical link, <head> meta, JSON-LD,
       and any third-party scripts (slick slider in "You May Also Like" etc.)
       all re-initialise from a fresh document instead of a partial swap.
*/
(function () {
  'use strict';

  var REDIRECT_GUARD_ATTR = 'data-comb-first-redirect';

  function getOptionInputs(group) {
    return group.querySelectorAll(
      'input[type="radio"][data-product-url], option[data-product-url]'
    );
  }

  function isInputSelected(el) {
    if (!el) return false;
    if (el.tagName === 'INPUT') return el.checked === true;
    if (el.tagName === 'OPTION') return el.selected === true;
    return false;
  }

  function samePath(a, b) {
    if (!a || !b) return false;
    try {
      var au = new URL(a, window.location.origin);
      var bu = new URL(b, window.location.origin);
      return au.pathname === bu.pathname && au.search === bu.search;
    } catch (e) {
      return a === b;
    }
  }

  /* 1. Auto-redirect parent URL → first option of each group. */
  function autoSelectFirstOptions() {
    if (document.documentElement.hasAttribute(REDIRECT_GUARD_ATTR)) return;

    var groups = document.querySelectorAll(
      'variant-selects [data-variant-options]'
    );
    if (!groups.length) return;

    for (var i = 0; i < groups.length; i++) {
      var inputs = getOptionInputs(groups[i]);
      if (!inputs.length) continue;

      var first = inputs[0];
      if (isInputSelected(first)) continue;

      var url = first.getAttribute('data-product-url');
      if (!url) continue;

      // Avoid a redirect loop if the URL we'd navigate to is already current.
      if (samePath(url, window.location.pathname + window.location.search)) {
        continue;
      }

      document.documentElement.setAttribute(REDIRECT_GUARD_ATTR, '1');
      window.location.replace(url);
      return;
    }
  }

  /* 2. Force full page reload on variant change so the canonical URL,
        <head> tags, and section scripts all refresh cleanly. */
  function bindFullReloadOnVariantChange() {
    document.addEventListener(
      'change',
      function (event) {
        var target = event.target;
        if (!target) return;
        if (!target.matches || !target.matches('[data-product-url]')) return;
        if (!target.closest('variant-selects')) return;

        var url = target.getAttribute('data-product-url');
        if (!url) return;

        // Stop product-info.js from running its SPA-style partial swap.
        event.stopImmediatePropagation();

        if (samePath(url, window.location.pathname + window.location.search)) {
          window.location.reload();
        } else {
          window.location.href = url;
        }
      },
      true // capture phase, runs before product-info.js listener
    );
  }

  function init() {
    bindFullReloadOnVariantChange();
    autoSelectFirstOptions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
