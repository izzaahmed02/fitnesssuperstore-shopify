// Override "Unavailable" text globally
window.variantStrings = window.variantStrings || {};
window.variantStrings.unavailable = "Select Weight";

if (!customElements.get('product-info')) {
  customElements.define(
    'product-info',
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();
        this.quantityInput = this.querySelector('.quantity__input');
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        this.initQuantityHandlers();
        this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: true }));
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber?.();
        this.cartUpdateUnsubscriber?.();
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html.querySelectorAll('.scroll-trigger').forEach((el) => el.classList.add('scroll-trigger--cancel'))
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR?.();
        });
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;
        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(
            PUB_SUB_EVENTS.cartUpdate,
            this.fetchQuantityRules.bind(this)
          );
        }
      }

      handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
        if (!this.contains(event.target)) return;

        this.resetProductFormState();

        const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
            : this.handleUpdateProductInfo(productUrl),
        });
      }

      resetProductFormState() {
        const form = this.productForm;
        form?.toggleSubmitButton(true);
        form?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
          const variant = this.getSelectedVariant(html.querySelector(selector));
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector('head title').innerHTML =
              html.querySelector('head title')?.innerHTML ?? '';
            HTMLUpdateUtility.viewTransition(
              document.querySelector('main'),
              html.querySelector('main'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          } else {
            HTMLUpdateUtility.viewTransition(
              this,
              html.querySelector('product-info'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          }
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            this.pendingRequestUrl = null;
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            callback(html);
          })
          .then(() => document.querySelector(`#${targetId}`)?.focus())
          .catch((error) => {
            if (error.name !== 'AbortError') console.error(error);
          });
      }

      // MOBILE-SAFE: fallback to first variant
      getSelectedVariant(productInfoNode) {
        if (!productInfoNode) return null;
        const variantSelects = productInfoNode.querySelector('variant-selects');
        if (!variantSelects) return null;

        const selectedEl = variantSelects.querySelector('[data-selected-variant]');
        if (selectedEl?.innerHTML) {
          try { return JSON.parse(selectedEl.innerHTML); } 
          catch (e) { console.warn('[product-info] Failed to parse selected variant', e); }
        }

        const firstEl = variantSelects.querySelector('[data-variant-id]');
        if (firstEl) {
          try { return JSON.parse(firstEl.dataset.variantJson || firstEl.innerHTML); } 
          catch (e) { console.warn('[product-info] Failed to parse first variant', e); }
        }

        return null;
      }

      buildRequestUrlWithParams(url, optionValues, fullPage = false) {
        const params = [];
        !fullPage && params.push(`section_id=${this.sectionId}`);
        if (optionValues?.length) params.push(`option_values=${optionValues.join(',')}`);
        return `${url}?${params.join('&')}`;
      }

      updateOptionValues(html) {
        const variantSelects = html.querySelector('variant-selects');
        if (variantSelects) {
          HTMLUpdateUtility.viewTransition(this.variantSelectors, variantSelects, this.preProcessHtmlCallbacks);
        }
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          let variant = this.getSelectedVariant(html);

          if (!variant) {
            const firstEl = html.querySelector('variant-selects [data-variant-id]');
            if (firstEl) {
              try { variant = JSON.parse(firstEl.dataset.variantJson || firstEl.innerHTML); }
              catch { this.setUnavailable(); return; }
            } else { this.setUnavailable(); return; }
          }

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);
          this.updateMedia(html, variant?.featured_media?.id);

          ['price','Sku','Inventory','Volume','Price-Per-Item','Quantity-Rules','Volume-Note'].forEach((id) => {
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const dest = this.querySelector(`#${id}-${this.dataset.section}`);
            if (source && dest) {
              dest.innerHTML = source.innerHTML;
              if (['Inventory','Sku','Price-Per-Item'].includes(id) && source.classList.contains('hidden')) dest.classList.add('hidden');
              else dest.classList.remove('hidden');
            }
          });

          this.updateQuantityRules(this.sectionId, html);

          this.productForm?.toggleSubmitButton(
            html.getElementById(`ProductSubmitButton-${this.sectionId}`)?.hasAttribute('disabled') ?? true,
            window.variantStrings.soldOut
          );

          publish(PUB_SUB_EVENTS.variantChange, { data: { sectionId: this.sectionId, html, variant } });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`)
          .forEach((form) => {
            const input = form.querySelector('input[name="id"]');
            input.value = variantId ?? '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
      }

      updateURL(url, variantId) {
        this.querySelector('share-button')?.updateUrl(
          `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`
        );
        if (this.dataset.updateUrl !== 'false') {
          window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
        }
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);
        ['price','Inventory','Sku','Price-Per-Item','Volume-Note','Volume','Quantity-Rules']
          .forEach(id => this.querySelector(`#${id}-${this.dataset.section}`)?.classList.add('hidden'));
      }

      updateMedia(html, variantMediaId) {
        if (!variantMediaId) return;

        const gallerySource = this.querySelector('media-gallery ul');
        const galleryDest = html.querySelector('media-gallery ul');
        if (!gallerySource || !galleryDest) return;

        const sourceItems = Array.from(gallerySource.querySelectorAll('li[data-media-id]'));
        const destItems = Array.from(galleryDest.querySelectorAll('li[data-media-id]'));
        const sourceSet = new Set(sourceItems.map(i => i.dataset.mediaId));
        const destSet = new Set(destItems.map(i => i.dataset.mediaId));

        destItems.forEach(d => { if (!sourceSet.has(d.dataset.mediaId)) gallerySource.prepend(d); });
        sourceItems.forEach(s => { if (!destSet.has(s.dataset.mediaId)) s.remove(); });

        this.querySelector('media-gallery')?.setActiveMedia?.(
          `${this.dataset.section}-${variantMediaId}`, true
        );

        const modalContent = this.productModal?.querySelector('.product-media-modal__content');
        const newModalContent = html.querySelector('product-modal .product-media-modal__content');
        if (modalContent && newModalContent) modalContent.innerHTML = newModalContent.innerHTML;
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: parseInt(this.quantityInput?.dataset.cartQuantity || 0),
          min: parseInt(this.quantityInput?.dataset.min || 1),
          max: this.quantityInput?.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
          step: parseInt(this.quantityInput?.step || 1),
        };
        let min = data.min;
        const max = data.max === null ? null : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.quantityInput.min = min;
        if (max) this.quantityInput.max = max;
        else this.quantityInput.removeAttribute('max');
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const variantId = this.productForm?.variantIdInput?.value;
        if (!variantId) return;

        this.querySelector('.loading__spinner')?.classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${variantId}&section_id=${this.dataset.section}`)
          .then(res => res.text())
          .then(text => {
            const html = new DOMParser().parseFromString(text, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch(console.error)
          .finally(() => this.querySelector('.loading__spinner')?.classList.add('hidden'));
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const updatedForm = html.getElementById(`Quantity-Form-${sectionId}`);
        if (!updatedForm || !this.quantityForm) return;

        ['.quantity__input','.quantity__rules','.quantity__label'].forEach(selector => {
          const current = this.quantityForm.querySelector(selector);
          const updated = updatedForm.querySelector(selector);
          if (!current || !updated) return;
          if (selector === '.quantity__input') {
            ['data-cart-quantity','data-min','data-max','step'].forEach(attr => {
              if (updated.hasAttribute(attr)) current.setAttribute(attr, updated.getAttribute(attr));
              else current.removeAttribute(attr);
            });
          } else current.innerHTML = updated.innerHTML;
        });
      }

      get productForm() { return this.querySelector('product-form'); }
      get productModal() { return document.querySelector(`#ProductModal-${this.dataset.section}`); }
      get pickupAvailability() { return this.querySelector('pickup-availability'); }
      get variantSelectors() { return this.querySelector('variant-selects'); }
      get sectionId() { return this.dataset.originalSection || this.dataset.section; }
    }
  );
}
