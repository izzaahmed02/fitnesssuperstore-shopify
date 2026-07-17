/*
 * Build Your Own Rig (BYOR) — hybrid configurator behavior
 * --------------------------------------------------------
 * Scaffold logic. Handles selection state, the live summary, and quote-gating
 * per Tim's direction (2026-05-20). It intentionally does NOT compute prices or
 * required part quantities yet — that requires Larianne's finalized BYOR logic
 * + validated SKUs. The hook points are marked TODO(product) below.
 *
 * Quote-gate triggers (from Tim): mixed upright heights, angled junction bars,
 * 4+ sections, cable/lat/low-row integrations, anchoring/site uncertainty,
 * ceiling-height uncertainty, hidden/inactive products, non-standard components.
 * Here, any selected option flagged data-quote-gate="true" (or a quote-only
 * layout card) flips the build into "request a quote" mode.
 */
(function () {
  'use strict';

  function initByor(root) {
    if (!root || root.dataset.byorReady === 'true') return;
    root.dataset.byorReady = 'true';

    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-step]'));
    var summaryList = root.querySelector('[data-byor-summary]');
    var quoteBanner = root.querySelector('[data-quote-banner]');
    var addToCartBtn = root.querySelector('[data-add-to-cart]');
    var selection = {}; // step_key -> { value, label, gate }

    function isGated() {
      return Object.keys(selection).some(function (k) { return selection[k].gate; });
    }

    function renderSummary() {
      if (!summaryList) return;
      var keys = Object.keys(selection);
      if (!keys.length) {
        summaryList.innerHTML = '<li data-empty><span>Make your selections above</span><span></span></li>';
      } else {
        summaryList.innerHTML = keys.map(function (k) {
          return '<li><span>' + selection[k].stepTitle + '</span><span>' + selection[k].label + '</span></li>';
        }).join('');
      }

      var gated = isGated();
      if (quoteBanner) quoteBanner.classList.toggle('is-visible', gated);

      // TODO(product/dev): when SKUs + quantities are validated, enable Add to
      // Cart only for complete, non-gated, standard builds and build the real
      // line-item payload here. Until then it stays disabled and quote is primary.
      if (addToCartBtn) {
        addToCartBtn.disabled = true; // scaffold: no validated cart payload yet
        addToCartBtn.setAttribute('aria-disabled', 'true');
        addToCartBtn.title = gated
          ? 'This build needs a quick team review — please request a quote.'
          : 'Online checkout for custom rigs is coming soon — request a quote to order.';
      }
    }

    steps.forEach(function (step) {
      var stepKey = step.getAttribute('data-step');
      var stepTitle = (step.querySelector('.byor__step-title') || {}).textContent || stepKey;
      var options = Array.prototype.slice.call(step.querySelectorAll('.byor__option'));

      options.forEach(function (opt) {
        opt.addEventListener('click', function () {
          options.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          opt.setAttribute('aria-pressed', 'true');
          selection[stepKey] = {
            value: opt.getAttribute('data-value'),
            label: opt.textContent.trim(),
            gate: opt.getAttribute('data-quote-gate') === 'true',
            stepTitle: stepTitle.trim()
          };
          renderSummary();
        });
      });
    });

    // Layout cards prefill the "sections" step and scroll to the configurator.
    Array.prototype.slice.call(root.querySelectorAll('[data-prefill]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var count = btn.getAttribute('data-prefill');
        var card = btn.closest('[data-layout-card]');
        var cardGated = card && card.getAttribute('data-quote-gate') === 'true';
        var sectionsStep = root.querySelector('[data-step="sections"]');
        if (sectionsStep) {
          var match = Array.prototype.slice.call(sectionsStep.querySelectorAll('.byor__option'))
            .filter(function (o) { return o.getAttribute('data-value') === count; })[0];
          if (match) match.click();
          sectionsStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Quote-only layout cards force quote mode even before granular choices.
        if (cardGated) {
          selection['__layout'] = { value: 'quote-only', label: 'Quote-only layout', gate: true, stepTitle: 'Layout' };
          renderSummary();
        }
      });
    });

    renderSummary();
  }

  function initAll() {
    Array.prototype.slice.call(document.querySelectorAll('[data-byor]')).forEach(initByor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-init inside the Shopify theme editor when the section is reloaded.
  document.addEventListener('shopify:section:load', function (e) {
    var el = e.target.querySelector('[data-byor]');
    if (el) initByor(el);
  });
})();
