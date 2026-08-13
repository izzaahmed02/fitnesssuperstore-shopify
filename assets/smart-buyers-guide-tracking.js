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
 * event can be lost mid-navigation. We push on submit and leave a session
 * marker; if the marker is missing when the success state renders, we push
 * then instead. Exactly one event per submission either way.
 */
(function () {
  'use strict';

  var PENDING_KEY = 'sbg_pending_submit';

  window.dataLayer = window.dataLayer || [];

  function session() {
    try {
      return window.sessionStorage;
    } catch (e) {
      return null;
    }
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

  document.addEventListener(
    'submit',
    function (event) {
      var form = event.target;
      if (!form || !form.querySelector('[data-sbg-submit]')) return;

      var source = sourceOf(form);
      push('smart_buyers_guide_form_submit', source);

      var store = session();
      if (store) store.setItem(PENDING_KEY, source);
    },
    true
  );

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var link = target.closest('[data-sbg-download]');
    if (!link) return;
    push('smart_buyers_guide_download', sourceOf(link));
  });

  // Fallback: the success state rendered but the submit push never landed.
  document.addEventListener('DOMContentLoaded', function () {
    var success = document.querySelector('[data-sbg-capture] [data-sbg-success]');
    if (!success) return;

    var store = session();
    var pending = store && store.getItem(PENDING_KEY);

    if (pending) {
      store.removeItem(PENDING_KEY);
      return;
    }

    push('smart_buyers_guide_form_submit', sourceOf(success));
  });
})();
