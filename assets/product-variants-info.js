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
        this.selectInitialVariant();
        this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: true }));
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber?.();
        this.cartUpdateUnsubscriber?.();
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html.querySelectorAll('.scroll-trigger').forEach((element) => element.classList.add('scroll-trigger--cancel'))
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR();
        });
      }

      // -------------------------
      // MOBILE-SAFE: select initial variant immediately
      // -------------------------
      selectInitialVariant() {
        const variantSelects = this.querySelector('variant-selects');
        if (!variantSelects) return;

        let variant = null;

        // Try variant from URL
        const variantIdFromUrl = new URLSearchParams(window.location.search).get('variant');
        if (variantIdFromUrl) {
          const el = variantSelects.querySelector(`[data-variant-id="${variantIdFromUrl}"]`);
          if (el) {
            try { variant = JSON.parse(el.dataset.variantJson || el.innerHTML); }
            catch(e){ console.warn('Failed to parse variant from URL', e); }
          }
        }

        // Try selected variant in DOM
        if (!variant) {
          const selectedEl = variantSelects.querySelector('[data-selected-variant]');
          if (selectedEl?.innerHTML) {
            try { variant = JSON.parse(selectedEl.innerHTML); }
            catch(e){ console.warn('Failed to parse selected variant', e); }
          }
        }

        // Fallback: first variant
        if (!variant) {
          const firstEl = variantSelects.querySelector('[data-variant-id]');
          if (firstEl) {
            try { variant = JSON.parse(firstEl.dataset.variantJson || firstEl.innerHTML); }
            catch(e){ console.warn('Failed to parse first variant', e); }
          }
        }

        // Apply to all product forms
        if (variant) {
          this.updateVariantInputs(variant.id);
          this.pickupAvailability?.update(variant);
        } else {
          this.setUnavailable();
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
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true);
        productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
          const variant = this.getSelectedVariant(html.querySelector(selector));
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;

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
          .then(() => {
            document.querySelector(`#${targetId}`)?.focus();
          })
          .catch((error) => {
            if (error.name === 'AbortError') console.log('Fetch aborted');
            else console.error(error);
          });
      }

      getSelectedVariant(productInfoNode) {
        const variantSelects = productInfoNode.querySelector('variant-selects');
        if (!variantSelects) return null;

        const selectedVariantEl = variantSelects.querySelector('[data-selected-variant]');
        if (selectedVariantEl?.innerHTML) {
          try { return JSON.parse(selectedVariantEl.innerHTML); } 
          catch(e){ console.warn(e); }
        }

        const firstVariantEl = variantSelects.querySelector('[data-variant-id]');
        if (firstVariantEl) {
          try { return JSON.parse(firstVariantEl.dataset.variantJson || firstVariantEl.innerHTML); }
          catch(e){ console.warn(e); }
        }

        return null;
      }

      buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
        const params = [];
        !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);
        if (optionValues.length) params.push(`option_values=${optionValues.join(',')}`);
        return `${url}?${params.join('&')}`;
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          let variant = this.getSelectedVariant(html);
          if (!variant) {
            const variantSelects = html.querySelector('variant-selects');
            const firstEl = variantSelects?.querySelector('[data-variant-id]');
            if (firstEl) {
              try { variant = JSON.parse(firstEl.dataset.variantJson || firstEl.innerHTML); }
              catch(e){ console.warn(e); this.setUnavailable(); return; }
            } else { this.setUnavailable(); return; }
          }

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);
          this.updateMedia(html, variant?.featured_media?.id);

          ['price','Sku','Inventory','Volume','Price-Per-Item'].forEach((id)=>{
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const dest = this.querySelector(`#${id}-${this.dataset.section}`);
            if(source && dest) dest.innerHTML = source.innerHTML;
          });

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden');
          this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden');

          this.productForm?.toggleSubmitButton(
            html.getElementById(`ProductSubmitButton-${this.sectionId}`)?.hasAttribute('disabled') ?? true,
            window.variantStrings.soldOut
          );

          publish(PUB_SUB_EVENTS.variantChange, { data: { sectionId: this.sectionId, html, variant } });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`)
          .forEach((form)=>{
            const input = form.querySelector('input[name="id"]');
            if(input){ input.value = variantId; input.dispatchEvent(new Event('change',{bubbles:true})); }
          });
      }

      updateURL(url, variantId) {
        this.querySelector('share-button')?.updateUrl(`${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`);
        if(this.dataset.updateUrl!=='false') window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);
        ['price','Inventory','Sku','Price-Per-Item','Volume-Note','Volume','Quantity-Rules']
          .forEach(id=>{
            const el = this.querySelector(`#${id}-${this.dataset.section}`);
            if(el) el.classList.add('hidden');
          });
      }

      // --- Media update ---
      updateMedia(html, variantFeaturedMediaId) {
        if(!variantFeaturedMediaId) return;
        const mediaGallerySource = this.querySelector('media-gallery ul');
        const mediaGalleryDestination = html.querySelector('media-gallery ul');
        if(mediaGallerySource && mediaGalleryDestination){
          const destItems = Array.from(mediaGalleryDestination.querySelectorAll('li[data-media-id]'));
          destItems.forEach(item=>{
            const existing = mediaGallerySource.querySelector(`[data-media-id="${item.dataset.mediaId}"]`);
            if(!existing) mediaGallerySource.appendChild(item);
          });
        }
        this.querySelector('media-gallery')?.setActiveMedia?.(`${this.dataset.section}-${variantFeaturedMediaId}`, true);
      }

      setQuantityBoundries() {
        if(!this.quantityInput) return;
        const data = {
          cartQuantity: parseInt(this.quantityInput.dataset.cartQuantity||0),
          min: parseInt(this.quantityInput.dataset.min||1),
          max: this.quantityInput.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
          step: parseInt(this.quantityInput.step||1),
        };
        let min = data.min;
        const max = data.max===null?data.max:data.max - data.cartQuantity;
        if(max!==null) min=Math.min(min,max);
        if(data.cartQuantity>=data.min) min=Math.min(min,data.step);
        this.quantityInput.min=min;
        if(max) this.quantityInput.max=max;
        else this.quantityInput.removeAttribute('max');
        this.quantityInput.value=min;
        publish(PUB_SUB_EVENTS.quantityUpdate,undefined);
      }

      fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if(!currentVariantId) return;
        this.querySelector('.loading__spinner')?.classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
          .then(res=>res.text())
          .then(txt=>{
            const html = new DOMParser().parseFromString(txt,'text/html');
            this.updateQuantityRules(this.dataset.section,html);
          })
          .catch(e=>console.error(e))
          .finally(()=>this.querySelector('.loading__spinner')?.classList.add('hidden'));
      }

      updateQuantityRules(sectionId,html){
        if(!this.quantityInput) return;
        this.setQuantityBoundries();
        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        ['.quantity__input','.quantity__rules','.quantity__label'].forEach(selector=>{
          const current=this.quantityForm.querySelector(selector);
          const updated=quantityFormUpdated.querySelector(selector);
          if(!current||!updated) return;
          if(selector==='.quantity__input'){
            ['data-cart-quantity','data-min','data-max','step'].forEach(attr=>{
              const val = updated.getAttribute(attr);
              if(val!==null) current.setAttribute(attr,val);
              else current.removeAttribute(attr);
            });
          }else current.innerHTML=updated.innerHTML;
        });
      }

      get productForm(){return this.querySelector('product-form');}
      get productModal(){return document.querySelector(`#ProductModal-${this.dataset.section}`);}
      get pickupAvailability(){return this.querySelector('pickup-availability');}
      get variantSelectors(){return this.querySelector('variant-selects');}
      get sectionId(){return this.dataset.originalSection || this.dataset.section;}
    }
  );
}
