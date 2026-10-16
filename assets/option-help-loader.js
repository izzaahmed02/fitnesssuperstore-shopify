(() => {
  if (window.FSSOptionHelp) return;

  const state = {
    productPromise: null,
    cartPromise: null,
  };

  const sectionUrl = (sectionId) => {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('section_id', sectionId);
    return url.toString();
  };

  const fetchSection = async (sectionId, contentSelector) => {
    const response = await fetch(sectionUrl(sectionId), {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!response.ok) throw new Error(`Option help section failed: ${response.status}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const content = doc.querySelector(contentSelector);
    if (!content) throw new Error(`Option help content missing: ${contentSelector}`);
    return content;
  };

  const bindPopupContent = (root) => {
    if (!root) return;

    root.querySelectorAll('[data-close-popup]').forEach((button) => {
      if (button.dataset.fssOptionHelpCloseBound === 'true') return;
      button.dataset.fssOptionHelpCloseBound = 'true';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const popup = button.closest('.option-popup');
        if (popup) popup.classList.remove('active');
      });
    });

    root.querySelectorAll('.option-popup .accordion-header').forEach((header) => {
      if (header.dataset.accordionBound === 'true') return;
      header.dataset.accordionBound = 'true';
      const body = header.nextElementSibling;
      if (!body || !body.classList.contains('accordion-body')) return;
      header.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const accordion = header.closest('.accordion');
        if (!accordion) return;
        const isActive = accordion.classList.toggle('active');
        body.style.display = isActive ? 'block' : 'none';
      });
    });

    root.querySelectorAll('[data-product-related-id]').forEach((card) => {
      if (card.dataset.fssRelatedBound === 'true') return;
      card.dataset.fssRelatedBound = 'true';
      card.addEventListener('click', () => {
        const popup = card.closest('.option-popup');
        if (!popup) return;
        popup.querySelectorAll('[data-product-related-id]').forEach((item) => item.classList.remove('active'));
        popup.querySelectorAll('[data-related-details-id]').forEach((detail) => {
          detail.style.display = 'none';
        });
        const activeId = card.dataset.productRelatedId;
        const activeDetail = Array.from(popup.querySelectorAll('[data-related-details-id]')).find(
          (detail) => detail.dataset.relatedDetailsId === activeId,
        );
        card.classList.add('active');
        if (activeDetail) activeDetail.style.display = 'block';
      });
    });
  };

  const ensureProduct = async () => {
    const slot = document.querySelector('[data-product-option-help-slot]');
    if (!slot) return null;
    if (slot.dataset.loaded === 'true') return slot;

    if (!state.productPromise) {
      state.productPromise = (async () => {
        const content = await fetchSection('product-option-help-lazy', '[data-product-option-help-content]');
        slot.innerHTML = content.innerHTML;
        slot.dataset.loaded = 'true';
        bindPopupContent(slot);
        return slot;
      })().catch((error) => {
        state.productPromise = null;
        throw error;
      });
    }

    return state.productPromise;
  };

  const ensureCart = async () => {
    const slot = document.querySelector('[data-cart-option-help-slot]');
    if (!slot) return null;
    if (slot.dataset.loaded === 'true') return slot;

    if (!state.cartPromise) {
      state.cartPromise = (async () => {
        const content = await fetchSection('cart-option-help-lazy', '[data-cart-option-help-content]');
        slot.innerHTML = content.innerHTML;
        slot.dataset.loaded = 'true';
        bindPopupContent(slot);
        return slot;
      })().catch((error) => {
        state.cartPromise = null;
        throw error;
      });
    }

    return state.cartPromise;
  };

  const invalidateCart = () => {
    state.cartPromise = null;
    const slot = document.querySelector('[data-cart-option-help-slot]');
    if (!slot) return;
    slot.innerHTML = '';
    delete slot.dataset.loaded;
  };

  const findPopup = (root, popupKey) => {
    if (!root || !popupKey) return null;
    return Array.from(root.querySelectorAll('[data-popup]')).find(
      (popup) => popup.dataset.popup === popupKey,
    ) || null;
  };

  const openPopup = async (trigger, popupKey) => {
    if (!trigger || !popupKey) return false;
    trigger.setAttribute('aria-busy', 'true');
    trigger.classList.add('is-loading');

    try {
      const inCart = Boolean(trigger.closest('cart-drawer'));
      let root;

      if (inCart) {
        const slot = await ensureCart();
        const customizer = trigger.closest('product-customization-options');
        const lineKey = customizer?.dataset.productId || '';
        root = lineKey
          ? Array.from(slot?.querySelectorAll('[data-option-help-cart-item]') || []).find(
              (item) => item.dataset.optionHelpCartItem === lineKey,
            )
          : slot;
      } else {
        root = await ensureProduct();
      }

      const popup = findPopup(root, popupKey);
      if (!popup) return false;
      popup.classList.add('active');
      return true;
    } catch (error) {
      console.error('Option help failed to load', error);
      return false;
    } finally {
      trigger.removeAttribute('aria-busy');
      trigger.classList.remove('is-loading');
    }
  };

  window.FSSOptionHelp = {
    ensureProduct,
    ensureCart,
    invalidateCart,
    openPopup,
  };
})();
