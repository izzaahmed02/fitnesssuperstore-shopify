/*
 * Accessibility bridge for the custom colour picker (P0-C, WCAG 2.2 AA).
 *
 * custom-color-wrapper.liquid now renders native <button> controls instead of
 * <div> click targets. The picker behaviour itself lives in the minified
 * custom-color-picker.js, which binds to the same classes and reads
 * event.target, so the markup change alone preserves mouse behaviour and adds
 * Enter/Space operation.
 *
 * Two things the markup change cannot do on its own:
 *   1. The existing close handler is bound to the <svg> inside the close
 *      control. A keyboard activation fires on the wrapping <button>, which
 *      does not reach a listener on its child, so that activation is relayed.
 *   2. Selected/expanded state is driven by class and inline style changes made
 *      elsewhere, so aria-pressed and aria-expanded are mirrored from the DOM
 *      rather than set at the point of interaction.
 */
(function () {
  if (window.__fssCustomColorA11y) return;
  window.__fssCustomColorA11y = true;

  function relayCloseActivation(e) {
    var btn = e.target.closest ? e.target.closest('.custom-color-close') : null;
    if (!btn) return;
    var svg = btn.querySelector('svg');
    if (!svg) return;
    // A pointer click that landed on the svg already reached the existing
    // handler; only relay activations that did not (keyboard, or the button's
    // own padding). bubbles:false keeps the relay from returning here.
    if (svg === e.target || svg.contains(e.target)) return;
    svg.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
  }

  function syncSwatch(el) {
    if (el.getAttribute('aria-disabled') === 'true') return;
    el.setAttribute('aria-pressed', el.classList.contains('color-selected') ? 'true' : 'false');
  }

  function syncTrigger(panel) {
    var wrapper = panel.closest('.custom-color-select-wrapper');
    var trigger = wrapper && wrapper.querySelector('.custom-color-trigger');
    if (!trigger) return;
    var open = panel.style.display !== 'none' && panel.style.display !== '';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function observe(root) {
    var swatches = root.querySelectorAll('.swatch:not(.swatch--custom-trigger)');
    if (swatches.length) {
      var swatchObserver = new MutationObserver(function (records) {
        records.forEach(function (r) { syncSwatch(r.target); });
      });
      Array.prototype.forEach.call(swatches, function (el) {
        syncSwatch(el);
        swatchObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
      });
    }

    var panels = root.querySelectorAll('.custom-color-input');
    if (panels.length) {
      var panelObserver = new MutationObserver(function (records) {
        records.forEach(function (r) { syncTrigger(r.target); });
      });
      Array.prototype.forEach.call(panels, function (el) {
        syncTrigger(el);
        panelObserver.observe(el, { attributes: true, attributeFilter: ['style'] });
      });
    }
  }

  function init() {
    document.addEventListener('click', relayCloseActivation, true);
    observe(document);
    // The picker injects further swatches once the options app has rendered.
    var tries = 0;
    var poll = setInterval(function () {
      observe(document);
      if (++tries > 20) clearInterval(poll);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
