/*
 * Same-page sub-collection navigation for collection pages.
 * ------------------------------------------------------------
 * The "Browse subcategories" chips historically were plain links to
 * separate /collections/<handle> pages, so picking a subcategory caused a
 * full-page redirect to a different collection URL.
 *
 * This progressive enhancement keeps the shopper on the current collection
 * page instead: a chip click updates the URL with a query parameter via the
 * History API (no reload, no redirect) and marks the chip active.
 *
 * Rollout is deliberately controlled:
 *   - It only activates when the nav element is flagged data-enabled="true"
 *     (currently wired for the Treadmills collection only).
 *   - If JavaScript is off, the chips are ordinary <a href> links and keep
 *     working exactly as before (clean fallback).
 *   - Native Boost Smart Filter filtering is gated behind
 *     data-boost-filter-key. That key is the exact Boost filter parameter
 *     that must be confirmed with Boost support before we switch the grid
 *     over to native filtering. Until it is set, the enhancement runs in
 *     "safe fallback" mode: it applies the subcategory on the same page via
 *     the History API and emits an event, without guessing Boost's contract.
 */
(function () {
  'use strict';

  var nav = document.querySelector('[data-subcollection-nav]');
  if (!nav || nav.getAttribute('data-enabled') !== 'true') {
    // Enhancement disabled -> leave the plain <a href> links untouched.
    return;
  }

  var URL_PARAM = nav.getAttribute('data-url-param') || 'subcategory';
  // Empty until Boost support confirms the exact Smart Filter parameter key.
  var BOOST_FILTER_KEY = (nav.getAttribute('data-boost-filter-key') || '').trim();
  var links = Array.prototype.slice.call(
    nav.querySelectorAll('[data-subcollection-link]')
  );

  if (!links.length) {
    return;
  }

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function setActive(handle) {
    links.forEach(function (link) {
      var isActive = link.getAttribute('data-subcollection-handle') === handle;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
      var li = link.closest('li');
      if (li) {
        li.classList.toggle('is-selected', isActive);
      }
    });
  }

  /*
   * Apply (or clear) the sub-collection selection on the same page.
   * `push` controls whether we add a new history entry (true for clicks) or
   * replace the current one (false for the initial page load / popstate).
   */
  function applySelection(handle, filterValue, push) {
    var url = new URL(window.location.href);

    // Reset any previous selection on both the interim and native keys so we
    // never leave stale parameters behind.
    url.searchParams.delete(URL_PARAM);
    if (BOOST_FILTER_KEY) {
      url.searchParams.delete(BOOST_FILTER_KEY);
    }

    if (handle) {
      url.searchParams.set(URL_PARAM, handle);
      // Native Boost path: only composed once the real key is known.
      if (BOOST_FILTER_KEY && filterValue) {
        url.searchParams.set(BOOST_FILTER_KEY, filterValue);
      }
    }
    // Never keep a stale paginator when the selection changes.
    url.searchParams.delete('page');

    var method = push ? 'pushState' : 'replaceState';
    window.history[method]({ subcollection: handle || null }, '', url.toString());

    setActive(handle);

    // Let the Boost grid (or any listener) react to the change. When the
    // Boost key is confirmed, the grid can subscribe to this event or read
    // the URL parameter to re-render server-side without a redirect.
    nav.dispatchEvent(
      new CustomEvent('subcollection:change', {
        bubbles: true,
        detail: {
          handle: handle || null,
          filterValue: filterValue || null,
          urlParam: URL_PARAM,
          boostFilterKey: BOOST_FILTER_KEY || null
        }
      })
    );
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      // Respect new-tab / modifier clicks -> let the browser handle them.
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

      var handle = link.getAttribute('data-subcollection-handle');
      if (!handle) {
        return;
      }

      event.preventDefault();

      var filterValue = link.getAttribute('data-filter-value') || '';
      var alreadyActive = link.classList.contains('active');

      // Clicking the active chip again clears the selection (back to parent).
      applySelection(alreadyActive ? null : handle, filterValue, true);
    });
  });

  // Keep the chips in sync when the shopper uses the browser back/forward.
  window.addEventListener('popstate', function () {
    setActive(getParams().get(URL_PARAM));
  });

  // Reflect a deep-linked / shared URL on first load.
  var initial = getParams().get(URL_PARAM);
  if (initial) {
    var match = links.filter(function (link) {
      return link.getAttribute('data-subcollection-handle') === initial;
    })[0];
    applySelection(initial, match ? match.getAttribute('data-filter-value') : '', false);
  }
})();
