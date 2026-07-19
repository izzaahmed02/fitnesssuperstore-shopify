/**
 * Subcollection same-page filtering (progressive enhancement).
 *
 * Turns the "Browse subcategories" chips (rendered in main-collection-banner.liquid)
 * into same-page filters: clicking a chip updates the URL with a query parameter via
 * the History API and swaps the product grid in place — no full page reload and no
 * redirect to a separate /collections/<handle> URL.
 *
 * Modes:
 *  - Boost key configured (data-filter-key set): the parent collection URL is loaded
 *    with `?<key>=<value>` so Boost renders the filtered grid server-side.
 *  - No key configured: the chip's own subcollection URL (data-source-url) is fetched
 *    and its grid swapped in, while the address bar shows a readable `?subcategory=<value>`
 *    parameter on the parent collection page.
 *
 * Anything unexpected (missing grid container, failed fetch, JS disabled, modifier-click)
 * falls back to normal link navigation, so behaviour never regresses.
 */
(function () {
  'use strict';

  var wrapper = document.querySelector(
    '.collection-hero__related-collections-wrapper[data-subcat-filter="true"]'
  );
  if (!wrapper) return;

  var filterKey = (wrapper.getAttribute('data-filter-key') || '').trim();
  var readableKey = filterKey || 'subcategory';
  var collectionUrl = wrapper.getAttribute('data-collection-url') || window.location.pathname;

  // Candidate containers for the product grid, most specific first.
  var GRID_SELECTORS = [
    '.boost-sd__product-list',
    '#boost-sd__product-list',
    '.boost-sd__product-list-container',
    '#ProductGridContainer',
    '#product-grid'
  ];

  function findGrid(root) {
    root = root || document;
    for (var i = 0; i < GRID_SELECTORS.length; i++) {
      var el = root.querySelector(GRID_SELECTORS[i]);
      if (el) return el;
    }
    return null;
  }

  function chips() {
    return wrapper.querySelectorAll('.collection-hero__related-collection');
  }

  function markActive(value) {
    chips().forEach(function (chip) {
      var v = chip.getAttribute('data-filter-value');
      chip.classList.toggle('active', !!value && v === value);
    });
  }

  // The URL shown in the address bar: always the parent collection with a query param.
  function addressUrl(value) {
    var url = new URL(collectionUrl, window.location.origin);
    url.searchParams.delete('page');
    if (value) {
      url.searchParams.set(readableKey, value);
    } else {
      url.searchParams.delete(readableKey);
    }
    return url.pathname + url.search;
  }

  // The URL actually fetched for fresh grid HTML.
  function fetchUrl(value, sourceUrl) {
    // With a Boost key we ask the parent collection to filter server-side;
    // otherwise we pull the subcollection page's grid directly.
    if (filterKey) return addressUrl(value);
    return sourceUrl || addressUrl(value);
  }

  function swapGrid(html) {
    var target = findGrid(document);
    if (!target) return false;
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var fresh = findGrid(doc);
    if (!fresh) return false;
    target.innerHTML = fresh.innerHTML;
    return true;
  }

  function navigate(value, sourceUrl, push) {
    var display = addressUrl(value);
    var grid = findGrid(document);
    if (!grid) {
      window.location.assign(sourceUrl || display);
      return;
    }

    grid.setAttribute('aria-busy', 'true');
    wrapper.classList.add('is-loading');

    fetch(fetchUrl(value, sourceUrl), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        if (!swapGrid(html)) throw new Error('Grid container not found in response');
        if (push) history.pushState({ subcat: value }, '', display);
        markActive(value);
        document.dispatchEvent(
          new CustomEvent('subcollection:filtered', { detail: { value: value, url: display } })
        );
        var top = wrapper.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
      })
      .catch(function () {
        // Graceful fallback: behave exactly like the original link.
        window.location.assign(sourceUrl || display);
      })
      .finally(function () {
        grid.removeAttribute('aria-busy');
        wrapper.classList.remove('is-loading');
      });
  }

  wrapper.addEventListener('click', function (event) {
    var chip = event.target.closest('.collection-hero__related-collection');
    if (!chip || !wrapper.contains(chip)) return;
    // Preserve open-in-new-tab / modified clicks.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    var value = chip.getAttribute('data-filter-value');
    var sourceUrl = chip.getAttribute('data-source-url') || chip.getAttribute('href');
    if (!value) return; // nothing to filter on -> normal link

    event.preventDefault();
    navigate(value, sourceUrl, true);
  });

  window.addEventListener('popstate', function () {
    var current = new URL(window.location.href);
    var value = current.searchParams.get(readableKey);
    if (value) {
      var match = null;
      chips().forEach(function (chip) {
        if (chip.getAttribute('data-filter-value') === value) match = chip;
      });
      var sourceUrl = match
        ? match.getAttribute('data-source-url') || match.getAttribute('href')
        : null;
      navigate(value, sourceUrl, false);
    } else {
      // Back to the unfiltered parent collection.
      navigate(null, collectionUrl, false);
    }
  });

  // Reflect any filter already present in the URL on initial load.
  (function initFromUrl() {
    var value = new URL(window.location.href).searchParams.get(readableKey);
    if (value) markActive(value);
  })();
})();
