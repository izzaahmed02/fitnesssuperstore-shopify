/*
 * Smart Buyer's Guide — GA4 / GTM tracking
 * ---------------------------------------------------------------------------
 * Pushes two dataLayer events for the guide capture sections:
 *
 *   smart_buyers_guide_form_submit  — one per successful capture submission
 *   smart_buyers_guide_download     — click on the post-submit PDF download
 *
 * Both carry the lead source and the page path so GA4 can separate footer,
 * comparison_charts and blog placements.
 *
 * The native Shopify customer form posts and reloads the page, so the submit
 * event cannot be pushed before navigation without risking a second push on
 * the success render. Instead:
 *
 *   - on submit we only write a pending marker; nothing is pushed yet
 *   - on the success render we push once, but only if an unconsumed marker
 *     exists, and we consume the marker in the same step
 *
 * That gives exactly one submit event per successful submission. Refreshing
 * the success URL finds no marker and pushes nothing, and there is no
 * no-marker fallback that could double-count.
 *
 * The marker lives in sessionStorage, with a session cookie fallback for
 * browsers where sessionStorage is blocked or unavailable, so a submission
 * is still counted exactly once there rather than not at all.
 */
(function () {
  'use strict';

  var PENDING_KEY = 'sbg_pending_submit';

  // The section tag loads this asset, so a page carrying the capture block
  // more than once would otherwise bind the listeners twice and double every
  // event. Bind once per page.
  if (window.__sbgTrackingInit) return;
  window.__sbgTrackingInit = true;

  window.dataLayer = window.dataLayer || [];

  function session() {
    try {
      var store = window.sessionStorage;
      var probe = '__sbg_probe__';
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch (e) {
      return null;
    }
  }

  function readCookie() {
    var match = document.cookie.match(
      new RegExp('(?:^|; )' + PENDING_KEY + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(value) {
    document.cookie =
      PENDING_KEY + '=' + encodeURIComponent(value) + '; path=/; SameSite=Lax';
  }

  function clearCookie() {
    document.cookie =
      PENDING_KEY + '=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  function setPending(source) {
    var store = session();
    if (store) {
      store.setItem(PENDING_KEY, source);
      return;
    }
    writeCookie(source);
  }

  // Returns the pending source and consumes the marker, or null if there is
  // no unconsumed marker. Never returns a value twice for the same marker.
  function consumePending() {
    var store = session();
    if (store) {
      var pending = store.getItem(PENDING_KEY);
      if (pending === null) return null;
      store.removeItem(PENDING_KEY);
      return pending;
    }

    var cookie = readCookie();
    if (cookie === null) return null;
    clearCookie();
    return cookie;
  }

  function push(event, source) {
    window.dataLayer.push({
      event: event,
      smart_buyers_guide_source: source || 'unknown',
      page_path: window.location.pathname,
      page_location: window.location.href,
    });
  }

  function sourceOf(el) {
    var node = el.closest('[data-sbg-source]') || el.closest('[data-sbg-capture]');
    return (node && node.getAttribute('data-sbg-source')) || 'unknown';
  }

  // Submit: record the pending submission only. The event itself is pushed on
  // the success render, so a failed or abandoned post never counts.
  document.addEventListener(
    'submit',
    function (event) {
      var form = event.target;
      if (!form || !form.querySelector('[data-sbg-submit]')) return;

      setPending(sourceOf(form));
    },
    true
  );

  // Download: only ever fired by an intentional click on the download link.
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var link = target.closest('[data-sbg-download]');
    if (!link) return;
    push('smart_buyers_guide_download', sourceOf(link));
  });

  // Success render: the one and only place the submit event is pushed.
  function onSuccessRender() {
    var success = document.querySelector('[data-sbg-capture] [data-sbg-success]');
    if (!success) return;

    var pending = consumePending();
    if (pending === null) return;

    push('smart_buyers_guide_form_submit', pending || sourceOf(success));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onSuccessRender);
  } else {
    onSuccessRender();
  }
})();
