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
 *
 * The marker records the path it was written on and the time it was written,
 * so a marker left behind by a rejected submit can never be consumed later by
 * an unrelated success render. A rejected submit clears its own marker on the
 * error render, and a marker older than MAX_PENDING_AGE_MS is discarded.
 *
 * This module never submits the form itself. The native Shopify customer form
 * posts and reloads; the script only observes.
 */
(function () {
  'use strict';

  var PENDING_KEY = 'sbg_pending_submit';
  // A submit and its success render are one round trip apart. Anything older is
  // a leftover from an abandoned attempt, not this page view's submission.
  var MAX_PENDING_AGE_MS = 10 * 60 * 1000;

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
    var marker = JSON.stringify({
      source: source,
      path: window.location.pathname,
      at: Date.now(),
    });

    var store = session();
    if (store) {
      store.setItem(PENDING_KEY, marker);
      return;
    }
    writeCookie(marker);
  }

  // Reads and removes the marker in one step, so a marker can never be read
  // twice. Returns the raw stored value, or null when there is nothing stored.
  function takeRaw() {
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

  // Returns the pending source for a submission made from THIS path within the
  // marker's lifetime, or null. Consumes the marker either way, so a stale or
  // foreign marker is discarded rather than left to be picked up later.
  function consumePending() {
    var raw = takeRaw();
    if (raw === null) return null;

    var marker;
    try {
      marker = JSON.parse(raw);
    } catch (e) {
      return null;
    }

    if (!marker || typeof marker !== 'object') return null;
    if (marker.path !== window.location.pathname) return null;
    if (!marker.at || Date.now() - marker.at > MAX_PENDING_AGE_MS) return null;

    return marker.source || 'unknown';
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

  // Success render: the one and only place the submit event is pushed, and the
  // only place the marker is consumed on a successful post.
  function onSuccessRender() {
    var success = document.querySelector('[data-sbg-capture] [data-sbg-success]');

    if (!success) {
      // A rejected submit re-renders the form with an error and no success
      // state. Drop that attempt's marker here so it cannot be picked up by a
      // later success render and counted as a submission that never happened.
      if (document.querySelector('[data-sbg-capture] .sbg-error')) consumePending();
      return;
    }

    // The post-submit reload has to land on the confirmation, not the top of
    // the page. Shopify's redirect carries the form id as the fragment; this
    // covers the cases where the browser does not act on it.
    focusSuccess(success);

    var pending = consumePending();
    if (pending === null) return;

    push('smart_buyers_guide_form_submit', pending || sourceOf(success));
  }

  function focusSuccess(success) {
    try {
      success.scrollIntoView({ block: 'center' });
    } catch (e) {
      success.scrollIntoView();
    }
    success.focus({ preventScroll: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onSuccessRender);
  } else {
    onSuccessRender();
  }
})();
