/*
 * Variant fallback interceptor.
 *
 * Two modes, both driven by a slim variants map emitted on the page:
 *
 *  - Variants PDP (data-pdp-template="variants"): intercept impossible
 *    combinations only. Cancel the click and dispatch synthetic clicks
 *    to apply the closest matching variant within the same product.
 *
 *  - Combined-listing parent or child (data-is-combined-listing="true"):
 *    the aggregated picker lets customers click combinations that don't
 *    have a backing variant on the current product; without a fallback
 *    the page navigates to the bare parent URL and reloads the default
 *    variant — the click appears to revert. Intercept every option click,
 *    resolve the intended combination against the family variants map,
 *    and navigate to the matching (or closest) variant's URL so the
 *    destination renders with the right options preselected.
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

    const isCombined = productInfo.dataset.isCombinedListing === 'true';
    const handler = isCombined ? handleCombinedClick : handleClick;
    productInfo.addEventListener('click', (event) => handler(event, productInfo, variantsMap), true);
  }

  function handleCombinedClick(event, productInfo, variantsMap) {
    // Combined-listing parent or child: every option click needs to land on
    // a real variant URL. If the customer picks an impossible combination
    // (e.g. Singles + With Rack when With Rack only exists on Sets),
    // route to the closest matching variant so the destination renders
    // correctly instead of falling back to the parent's default variant.
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

    let target = variantsMap.find(
      (v) =>
        v.o1 === (intended[0] || null) &&
        v.o2 === (intended[1] || null) &&
        v.o3 === (intended[2] || null)
    );
    let usedFallback = false;
    if (!target) {
      target = findClosestVariant(variantsMap, intended, clickedIndex);
      usedFallback = !!target;
    }
    if (!target || !target.u) return; // map lacks data; let default flow take over

    event.preventDefault();
    event.stopImmediatePropagation();

    if (usedFallback) {
      showToast(productInfo, "That combination isn't available — switched to the closest match.");
    }
    window.location.assign(target.u);
  }

  function handleClick(event, productInfo, variantsMap) {
    // Programmatic clicks dispatched from applyVariantSelection re-enter this
    // capture-phase handler before the browser's default action checks the
    // radio. Suppress interception during that window so a multi-group
    // fallback that touches an intermediate impossible combination doesn't
    // recurse and overflow the stack.
    if (productInfo._applyingFallback) return;

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

    productInfo._applyingFallback = true;
    try {
      applyVariantSelection(productInfo, fieldsets, target);
    } finally {
      productInfo._applyingFallback = false;
    }
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

  const PRODUCT_INFO_SELECTOR = 'product-info[data-pdp-template="variants"], product-info[data-is-combined-listing="true"]';

  function autoInit() {
    document.querySelectorAll(PRODUCT_INFO_SELECTOR).forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Re-attach if a fresh product-info element gets swapped in.
  document.addEventListener('product-info:loaded', (event) => {
    const target = event.target;
    if (target && typeof target.matches === 'function' && target.matches(PRODUCT_INFO_SELECTOR)) {
      init(target);
    }
  });
})();
