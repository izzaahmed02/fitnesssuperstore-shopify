window.variantStrings = window.variantStrings || {};
window.variantStrings.unavailable = "Select Weight";

if (!customElements.get('product-info')) {
  customElements.define('product-info', class ProductInfo extends HTMLElement {
    quantityInput;
    quantityForm;
    onVariantChangeUnsubscriber;
    cartUpdateUnsubscriber;
    abortController;
    pendingRequestUrl;
    preProcessHtmlCallbacks = [];
    postProcessHtmlCallbacks = [];

    constructor() {
      super();
      this.quantityInput = this.querySelector('.quantity__input');
    }

    connectedCallback() {
      // Always reset URL on page reload
      if(window.location.search.includes('variant=')){
        window.history.replaceState({}, '', window.location.pathname);
      }

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
      this.preProcessHtmlCallbacks.push(html =>
        html.querySelectorAll('.scroll-trigger').forEach(el => el.classList.add('scroll-trigger--cancel'))
      );
      this.postProcessHtmlCallbacks.push(newNode => {
        window?.Shopify?.PaymentButton?.init();
        window?.ProductModel?.loadShopifyXR();
      });
    }

    initQuantityHandlers() {
      if(!this.quantityInput) return;
      this.quantityForm = this.querySelector('.product-form__quantity');
      if(!this.quantityForm) return;

      this.setQuantityBoundries();
      if(!this.dataset.originalSection) {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
      }
    }

    handleOptionValueChange({data:{event,target,selectedOptionValues}}) {
      if(!this.contains(event.target)) return;
      const productUrl = target.dataset.productUrl || this.dataset.url;
      this.pendingRequestUrl = productUrl;
      const shouldSwapProduct = this.dataset.url !== productUrl;
      const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

      this.renderProductInfo({
        requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
        targetId: target.id,
        callback: shouldSwapProduct ? this.handleSwapProduct(productUrl, shouldFetchFullPage) : this.handleUpdateProductInfo(productUrl)
      });
    }

    renderProductInfo({requestUrl, targetId, callback}) {
      this.abortController?.abort();
      this.abortController = new AbortController();

      fetch(requestUrl, { signal: this.abortController.signal })
        .then(res => res.text())
        .then(text => {
          this.pendingRequestUrl = null;
          const html = new DOMParser().parseFromString(text, 'text/html');
          callback(html);
        })
        .then(()=> document.querySelector(`#${targetId}`)?.focus())
        .catch(e => { if(e.name!=='AbortError') console.error(e); });
    }

    handleSwapProduct(productUrl, updateFullPage) {
      return html => {
        this.productModal?.remove();
        const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
        const variant = this.getSelectedVariant(html.querySelector(selector));
        this.updateURL(productUrl, variant?.id);

        if(updateFullPage){
          document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;
          HTMLUpdateUtility.viewTransition(document.querySelector('main'), html.querySelector('main'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks);
        } else {
          HTMLUpdateUtility.viewTransition(this, html.querySelector('product-info'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks);
        }
      };
    }

    handleUpdateProductInfo(productUrl) {
      return html => {
        const variant = this.getSelectedVariant(html) || this.getFallbackVariant(html);
        if(!variant){ this.setUnavailable(); return; }

        this.pickupAvailability?.update(variant);
        this.updateOptionValues(html);
        this.updateURL(productUrl, variant.id);
        this.updateVariantInputs(variant.id);
        this.updateMedia(html, variant.featured_media?.id);

        this.updateQuantityRules(this.sectionId, html);
        this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden');
        this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden');

        this.productForm?.toggleSubmitButton(html.getElementById(`ProductSubmitButton-${this.sectionId}`)?.hasAttribute('disabled') ?? true, window.variantStrings.soldOut);

        publish(PUB_SUB_EVENTS.variantChange, { data:{sectionId:this.sectionId, html, variant} });
      };
    }

    getSelectedVariant(productInfoNode){
      const variantSelects = productInfoNode.querySelector('variant-selects');
      if(!variantSelects) return null;
      try {
        return JSON.parse(variantSelects.querySelector('[data-selected-variant]')?.innerHTML || variantSelects.querySelector('[data-variant-id]')?.dataset.variantJson);
      } catch(e){ return null; }
    }

    getFallbackVariant(html){
      const variantSelects = html.querySelector('variant-selects');
      if(!variantSelects) return null;
      try { return JSON.parse(variantSelects.querySelector('[data-variant-id]')?.dataset.variantJson); } catch(e){ return null; }
    }

    updateVariantInputs(variantId){
      this.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`).forEach(form=>{
        const input = form.querySelector('input[name="id"]');
        if(input){ input.value = variantId; input.dispatchEvent(new Event('change',{bubbles:true})); }
      });
    }

    updateURL(url, variantId){
      this.querySelector('share-button')?.updateUrl(`${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`);
      if(this.dataset.updateUrl!=='false') window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
    }

    setUnavailable(){
      this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);
      ['price','Inventory','Sku','Price-Per-Item','Volume-Note','Volume','Quantity-Rules'].forEach(id=>{
        const el = this.querySelector(`#${id}-${this.dataset.section}`);
        if(el) el.classList.add('hidden');
      });
    }

    get productForm(){ return this.querySelector('product-form'); }
    get productModal(){ return document.querySelector(`#ProductModal-${this.dataset.section}`); }
    get pickupAvailability(){ return this.querySelector('pickup-availability'); }
    get variantSelectors(){ return this.querySelector('variant-selects'); }
    get sectionId(){ return this.dataset.originalSection || this.dataset.section; }

    // --- Quantity Helpers ---
    setQuantityBoundries(){
      if(!this.quantityInput) return;
      const data = {
        cartQuantity: parseInt(this.quantityInput.dataset.cartQuantity) || 0,
        min: parseInt(this.quantityInput.dataset.min) || 1,
        max: parseInt(this.quantityInput.dataset.max) || null,
        step: parseInt(this.quantityInput.step) || 1
      };
      let min = data.min;
      const max = data.max===null?data.max:data.max - data.cartQuantity;
      if(max!==null) min = Math.min(min,max);
      if(data.cartQuantity >= data.min) min = Math.min(min,data.step);
      this.quantityInput.min = min;
      if(max) this.quantityInput.max = max;
      else this.quantityInput.removeAttribute('max');
      this.quantityInput.value = min;
      publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
    }

    fetchQuantityRules(){
      const currentVariantId = this.productForm?.variantIdInput?.value;
      if(!currentVariantId) return;
      this.querySelector('.loading__spinner')?.classList.remove('hidden');
      fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
        .then(res=>res.text())
        .then(text=>{
          const html = new DOMParser().parseFromString(text,'text/html');
          this.updateQuantityRules(this.dataset.section, html);
        })
        .finally(()=> this.querySelector('.loading__spinner')?.classList.add('hidden'));
    }

    updateQuantityRules(sectionId, html){
      if(!this.quantityInput) return;
      this.setQuantityBoundries();
      const formUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
      ['.quantity__input','.quantity__rules','.quantity__label'].forEach(sel=>{
        const current = this.quantityForm.querySelector(sel);
        const updated = formUpdated?.querySelector(sel);
        if(!current || !updated) return;
        if(sel==='.quantity__input'){
          ['data-cart-quantity','data-min','data-max','step'].forEach(attr=>{
            const val = updated.getAttribute(attr);
            if(val!==null) current.setAttribute(attr,val);
            else current.removeAttribute(attr);
          });
        }else current.innerHTML = updated.innerHTML;
      });
    }
  });
}
