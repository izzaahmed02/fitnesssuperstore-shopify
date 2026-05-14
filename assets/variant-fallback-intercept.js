/*
 * Variant fallback interceptor for the variants PDP template.
 *
 * Intercepts variant-option clicks before the standard product-info fetch
 * cycle. Looks up the customer's intended option-value combination in a
 * slim product.variants map emitted on the page:
 *   - variant matches the combination (available or sold out) → let the
 *     click proceed normally; the customer sees the right state and CTA.
 *   - no variant matches (impossible combination) → cancel the click,
 *     redirect to the closest available variant, and show a toast.
 *
 * Scoped to <product-info data-pdp-template="variants"> so other PDP
 * templates that share the section file (e.g. gift cards) are untouched.
 */
(function () {
  const TOAST_CLASS = 'pdp-variant-fallback-toast';
  const PULSE_CLASS = 'pdp-variant-fallback-pulse';
  const PULSE_DURATION_MS = 1500;
  const TOAST_DURATION_MS = 2600;

  function init(productInfo) {
    if (productInfo.dataset.variantFallbackInit === 'true') return;
    productInfo.dataset.variantFallbackInit = 'true';

    const script = productInfo.querySelector('script[data-product-variants-map]');
    if (!script) return;
    let variantsMap;
    try {
      variantsMap = JSON.parse(script.textContent);
    } catch (_) {
      return;
    }
    if (!Array.isArray(variantsMap) || variantsMap.length === 0) return;

    productInfo.addEventListener('click', (event) => handleClick(event, productInfo, variantsMap), true);
  }

  function handleClick(event, productInfo, variantsMap) {
    // Resolve the clicked option-value input via the label's `for` attribute,
    // or via the input itself if the customer clicked the input directly.
    const label = event.target.closest('[data-variant-options] label[for]');
    let input;
    if (label) {
      const forId = label.getAttribute('for');
      input = forId ? productInfo.querySelector('#' + cssEscape(forId)) : null;
    } else {
      input = event.target.closest('[data-variant-options] [data-option-value-id]');
    }
    if (!input || !input.matches('[data-option-value-id]')) return;
    if (input.checked) return;

    const fieldsets = Array.from(productInfo.querySelectorAll('[data-variant-options]'));
    const clickedFieldset = input.closest('[data-variant-options]');
    const clickedIndex = fieldsets.indexOf(clickedFieldset);
    if (clickedIndex === -1) return;

    const intended = fieldsets.map((fs) => {
      if (fs === clickedFieldset) return input.value;
      const checked = fs.querySelector('[data-option-value-id]:checked');
      return checked ? checked.value : null;
    });
    if (intended.some((v) => v === null)) return;

    if (variantMatches(variantsMap, intended)) {
      // Variant exists (available or sold-out) — let Shopify handle it.
      return;
    }

    // Impossible combination: cancel the original click so the standard
    // option_values fetch never goes out, then route to the closest match.
    event.preventDefault();
    event.stopImmediatePropagation();

    const target = findClosestVariant(variantsMap, intended, clickedIndex);
    if (!target) {
      showToast(productInfo, "This combination isn't available right now.");
      return;
    }

    applyVariantSelection(productInfo, fieldsets, target);
    showToast(productInfo, "That combination isn't available — switched to the closest match.");
  }

  function variantMatches(variantsMap, values) {
    return variantsMap.some(
      (v) =>
        v.o1 === (values[0] || null) &&
        v.o2 === (values[1] || null) &&
        v.o3 === (values[2] || null)
    );
  }

  function findClosestVariant(variantsMap, intended, prioritizedIndex) {
    const keys = ['o1', 'o2', 'o3'];
    const priorityKey = keys[prioritizedIndex];
    const priorityValue = intended[prioritizedIndex];

    // Prefer an in-stock variant that preserves the customer's clicked value.
    const inStockKeepingClick = variantsMap.find((v) => v.a && v[priorityKey] === priorityValue);
    if (inStockKeepingClick) return inStockKeepingClick;

    // Otherwise, any variant (sold-out included) that preserves the clicked value.
    const anyKeepingClick = variantsMap.find((v) => v[priorityKey] === priorityValue);
    if (anyKeepingClick) return anyKeepingClick;

    // Last resort: first in-stock variant, or first variant overall.
    return variantsMap.find((v) => v.a) || variantsMap[0] || null;
  }

  function applyVariantSelection(productInfo, fieldsets, target) {
    const keys = ['o1', 'o2', 'o3'];
    let triggeredChange = false;

    fieldsets.forEach((fs, i) => {
      const desired = target[keys[i]];
      if (desired == null) return;
      const inputs = fs.querySelectorAll('[data-option-value-id]');
      let match = null;
      inputs.forEach((inp) => {
        if (!match && inp.value === desired) match = inp;
      });
      if (!match || match.checked) return;

      const label = productInfo.querySelector('label[for="' + cssEscape(match.id) + '"]');
      if (label) {
        label.classList.remove(PULSE_CLASS);
        // eslint-disable-next-line no-unused-expressions
        label.offsetWidth; // force reflow so the animation can re-trigger
        label.classList.add(PULSE_CLASS);
        setTimeout(() => label.classList.remove(PULSE_CLASS), PULSE_DURATION_MS);
      }

      // Dispatching a click drives the standard variant-selects flow:
      // change event → optionValueSelectionChange → product-info fetch +
      // URL update via history.replaceState (?variant=ID).
      if (label) {
        label.click();
      } else {
        match.click();
      }
      triggeredChange = true;
    });

    return triggeredChange;
  }

  function showToast(productInfo, message) {
    let toast = document.querySelector('.' + TOAST_CLASS);
    if (!toast) {
      toast = document.createElement('div');
      toast.className = TOAST_CLASS;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    if (toast._hideTimer) clearTimeout(toast._hideTimer);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    toast._hideTimer = setTimeout(() => toast.classList.remove('is-visible'), TOAST_DURATION_MS);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
  }

  function autoInit() {
    document.querySelectorAll('product-info[data-pdp-template="variants"]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Re-attach if a fresh product-info element gets swapped in (combined listings, etc.).
  document.addEventListener('product-info:loaded', (event) => {
    const target = event.target;
    if (target && typeof target.matches === 'function' && target.matches('product-info[data-pdp-template="variants"]')) {
      init(target);
    }
  });
})();
