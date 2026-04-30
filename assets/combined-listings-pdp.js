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
    2. On any variant option change, force a full browser navigation so the
       canonical link, <head> meta, JSON-LD, and any third-party scripts
       (slick slider in "You May Also Like" etc.) all re-initialise from a
       fresh document instead of a partial swap.

  Strategy for #2:
    - Patch history.replaceState / pushState so that whenever product-info.js
      finishes its variant fetch and calls updateURL(...) to swap the URL
      to /products/<handle>?variant=<id>, we intercept and navigate the
      browser instead. This catches every variant change reliably,
      regardless of whether the option points to the same product or a
      different child product.
    - Additionally, listen on the change event in capture phase as a fast
      path: when an option carries data-product-url, navigate immediately
      so the user doesn't wait for the section fetch round-trip.
*/
(function () {
  'use strict';

  var REDIRECT_GUARD_ATTR = 'data-comb-first-redirect';
  var navigating = false;

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

  function navigateTo(url) {
    if (navigating) return;
    navigating = true;
    var current = window.location.pathname + window.location.search;
    if (samePath(url, current)) {
      window.location.reload();
    } else {
      window.location.href = url;
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

      if (samePath(url, window.location.pathname + window.location.search)) {
        continue;
      }

      document.documentElement.setAttribute(REDIRECT_GUARD_ATTR, '1');
      navigating = true;
      window.location.replace(url);
      return;
    }
  }

  /* 2a. Patch history APIs so product-info.js's updateURL becomes a real nav.
        product-info.js calls window.history.replaceState({}, '', url) after a
        variant change. We intercept any /products/ URL change and turn it
        into a real navigation so head meta + canonical refresh. */
  function patchHistoryForFullReload() {
    var origReplace = window.history.replaceState.bind(window.history);
    var origPush = window.history.pushState.bind(window.history);

    function maybeNavigate(url) {
      if (typeof url !== 'string') return false;
      if (url.indexOf('/products/') === -1) return false;

      var current = window.location.pathname + window.location.search;
      try {
        var u = new URL(url, window.location.origin);
        var resolved = u.pathname + u.search;
        if (resolved === current) return false; // No-op, leave alone
      } catch (e) {
        return false;
      }
      navigateTo(url);
      return true;
    }

    window.history.replaceState = function (state, title, url) {
      if (maybeNavigate(url)) return;
      return origReplace(state, title, url);
    };
    window.history.pushState = function (state, title, url) {
      if (maybeNavigate(url)) return;
      return origPush(state, title, url);
    };
  }

  /* 2b. Fast-path: navigate immediately on option change when the option
         carries a data-product-url, instead of waiting for the section
         fetch to finish before history.replaceState fires. */
  function bindFastPathReloadOnChange() {
    document.addEventListener(
      'change',
      function (event) {
        var target = event.target;
        if (!target) return;

        var optionEl = null;
        if (target.tagName === 'SELECT' && target.selectedOptions.length) {
          optionEl = target.selectedOptions[0];
        } else if (target.matches && target.matches('[data-product-url]')) {
          optionEl = target;
        }
        if (!optionEl) return;
        if (!optionEl.closest || !optionEl.closest('variant-selects')) return;

        var url = optionEl.getAttribute('data-product-url');
        if (!url) return; // fall through to history-patch path

        navigateTo(url);
      },
      true
    );
  }

  function init() {
    patchHistoryForFullReload();
    bindFastPathReloadOnChange();
    autoSelectFirstOptions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
