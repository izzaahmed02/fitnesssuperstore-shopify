customElements.get('product-info') ||
  customElements.define(
    'product-info',
    class t extends HTMLElement {
      quantityInput = void 0;
      quantityForm = void 0;
      onVariantChangeUnsubscriber = void 0;
      cartUpdateUnsubscriber = void 0;
      abortController = void 0;
      pendingRequestUrl = null;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];
      constructor() {
        (super(), (this.quantityInput = this.querySelector('.quantity__input')));
      }
      connectedCallback() {
        this.redirectCombinedListingToVariant();
        (this.initializeProductSwapUtility(),
          (this.onVariantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, this.handleOptionValueChange.bind(this))),
          this.initQuantityHandlers(),
          this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: !0 })));
        subscribe(PUB_SUB_EVENTS.variantChange, (event)=> {
          if(!event) return;
          const variant = event.data.variant;
          if(variant) return;
          
          const variantOptionContainers = document.querySelectorAll('[data-variant-options]');
          if(variantOptionContainers.length === 0) return;

          variantOptionContainers.forEach(variantOption => {
            const activeNotDisabledOption = variantOption.querySelector('[data-option-value-id]:checked:not(.disabled)');
            
            if(!activeNotDisabledOption) {
              const values = variantOption.querySelectorAll('[data-option-value-id]:not(:checked)[data-option-value-available="true"]');
              if(values.length > 0) {
                const firstAvailableValue = values[0];
                const firstAvailableValueTarget = document.querySelector(`label[for="${firstAvailableValue.id}"]`);
                if(firstAvailableValueTarget) firstAvailableValueTarget.click();
              }
            }
          })
        });  
      }
      redirectCombinedListingToVariant() {
        // On combined-listing parent URLs the page renders the parent product, so
        // child-level data (compare_at_price, variant metafields) is missing until
        // the user clicks a variant. Forward to the checked variant's child URL so
        // the default landing matches the per-variant URL.
        if (this.dataset.isCombinedListing !== 'true') return;
        const checked = this.querySelector('variant-selects [data-product-url]:checked, variant-selects option[data-product-url][selected]');
        const target = checked?.dataset?.productUrl;
        if (!target) return;
        const currentPath = window.location.pathname;
        if (target === currentPath || target === currentPath + '/') return;
        window.location.replace(target);
      }
      addPreProcessCallback(t) {
        this.preProcessHtmlCallbacks.push(t);
      }
      initQuantityHandlers() {
        this.quantityInput &&
          ((this.quantityForm = this.querySelector('.product-form__quantity')),
          this.quantityForm && (this.setQuantityBoundries(), this.dataset.originalSection || (this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this)))));
      }
      disconnectedCallback() {
        (this.onVariantChangeUnsubscriber(), this.cartUpdateUnsubscriber?.());
      }
      initializeProductSwapUtility() {
        (this.preProcessHtmlCallbacks.push((t) => t.querySelectorAll('.scroll-trigger').forEach((t) => t.classList.add('scroll-trigger--cancel'))),
          this.postProcessHtmlCallbacks.push((t) => {
            (window?.Shopify?.PaymentButton?.init(), window?.ProductModel?.loadShopifyXR());
          }));
      }
      handleOptionValueChange({ data: { event: t, target: e, selectedOptionValues: i } }) {
        if (!this.contains(t.target)) return;
        this.resetProductFormState();
        let a = e.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = a;
        // Compare pathnames only — data-product-url often carries ?variant=ID
        // even for regular (non-combined) products, so comparing full strings
        // would incorrectly flag every click as a different product.
        let basePath = this.dataset.url.split('?')[0];
        let targetPath = a.split('?')[0];
        let isDifferentProduct = targetPath !== basePath;
        let s = 'true' === this.dataset.updateUrl && isDifferentProduct;

        if (this.dataset.isCombinedListing === 'true' || isDifferentProduct) {
          // Combined-listing flows: on the parent template the
          // data-is-combined-listing flag is set; on a child product the
          // option picker still renders sibling-children whose product_url
          // points to a different /products/<child> path. In either case we
          // want a full page refresh to the bare child path (no ?variant= /
          // ?option_values=) so the canonical-friendly URL is what the user
          // sees and shares.
          let target = new URL(a, window.location.origin);
          window.location.assign(target.pathname);
          return;
        }

        this.renderProductInfo({ requestUrl: this.buildRequestUrlWithParams(a, i, s), targetId: e.id, callback: isDifferentProduct ? this.handleSwapProduct(a, s) : this.handleUpdateProductInfo(a) });
      }
      resetProductFormState() {
        let t = this.productForm;
        (t?.toggleSubmitButton(!0), t?.handleErrorMessage());
      }
      handleSwapProduct(t, e) {
        return (i) => {
          this.productModal?.remove();
          let a = this.getSelectedVariant(i.querySelector(e ? "product-info[id^='MainProduct']" : 'product-info'));
          (this.updateURL(t, a?.id),
            e
              ? ((document.querySelector('head title').innerHTML = i.querySelector('head title').innerHTML),
                HTMLUpdateUtility.viewTransition(document.querySelector('main'), i.querySelector('main'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks))
              : HTMLUpdateUtility.viewTransition(this, i.querySelector('product-info'), this.preProcessHtmlCallbacks, this.postProcessHtmlCallbacks));
        };
      }
      renderProductInfo({ requestUrl: t, targetId: e, callback: i }) {
        (this.abortController?.abort(),
          (this.abortController = new AbortController()),
          fetch(t, { signal: this.abortController.signal })
            .then((t) => t.text())
            .then((t) => {
              this.pendingRequestUrl = null;
              let e = new DOMParser().parseFromString(t, 'text/html');
              i(e);
            })
            .then(() => {
              document.querySelector(`#${e}`)?.focus();
            })
            .catch((t) => {
              'AbortError' === t.name ? console.log('Fetch aborted by user') : console.error(t);
            }));
      }
      getSelectedVariant(t) {
        let e = t.querySelector('variant-selects [data-selected-variant]')?.innerHTML;
        return e ? JSON.parse(e) : null;
      }
      buildRequestUrlWithParams(t, e, i = !1) {
        // Use URL/URLSearchParams so an existing ?variant=<id> in `t` is
        // preserved correctly instead of producing a broken `?...?...` string.
        let url = new URL(t, window.location.origin);
        if (!i) url.searchParams.set('section_id', this.sectionId);
        if (e.length) url.searchParams.set('option_values', e.join(','));
        return url.pathname + url.search;
      }
      updateOptionValues(t) {
        let e = t.querySelector('variant-selects');
        e && HTMLUpdateUtility.viewTransition(this.variantSelectors, e, this.preProcessHtmlCallbacks);
      }
      handleUpdateProductInfo(t) {        
        return (e) => {
          let i = this.getSelectedVariant(e);
          if ((this.pickupAvailability?.update(i), this.updateOptionValues(e), this.updateURL(t, i?.id), this.updateVariantInputs(i?.id), !i)) {
            this.setUnavailable();
          }
          this.updateMedia(e, i?.featured_media?.id);
          let a = (t, i = (t) => !1) => {
            let a = e.getElementById(`${t}-${this.sectionId}`),
              r = this.querySelector(`#${t}-${this.dataset.section}`);
            a && r && ((r.innerHTML = a.innerHTML), r.classList.toggle('hidden', i(a)));
          };
          (a('price'),
            a('Sku', ({ classList: t }) => t.contains('hidden')),
            a('Inventory', ({ innerText: t }) => '' === t),
            a('Volume'),
            a('Price-Per-Item', ({ classList: t }) => t.contains('hidden')),
            a('Product-Options', ({ classList: t }) => t.contains('hidden')),
            a('Stock-Badge-Mobile', ({ classList: t }) => t.contains('hidden')),
            a('Stock-Badge-Desktop', ({ classList: t }) => t.contains('hidden')),
            a('Availability-Meta', ({ classList: t }) => t.contains('hidden')),
            this.updateQuantityRules(this.sectionId, e),
            this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden'),
            this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden'),
            this.productForm?.toggleSubmitButton(e.getElementById(`ProductSubmitButton-${this.sectionId}`)?.hasAttribute('disabled') ?? !0, window.variantStrings.soldOut),
            publish(PUB_SUB_EVENTS.variantChange, { data: { sectionId: this.sectionId, html: e, variant: i } }));
        };
      }
      updateVariantInputs(t) {
        this.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`).forEach((e) => {
          let i = e.querySelector('input[name="id"]');
          ((i.value = t ?? ''), i.dispatchEvent(new Event('change', { bubbles: !0 })));
        });
      }
      updateURL(t, e) {
        // `t` may already carry ?variant=<id>, ?option_values=..., or
        // ?section_id=... — strip fetch-only params and keep only ?variant=<id>
        // so the address bar holds the canonical-friendly shape and the
        // canonical tag itself stays at /products/<handle> with no query.
        let url = new URL(t, window.location.origin);
        url.searchParams.delete('option_values');
        url.searchParams.delete('section_id');
        if (e) {
          url.searchParams.set('variant', e);
        } else {
          url.searchParams.delete('variant');
        }
        let final = url.pathname + url.search;
        this.querySelector('share-button')?.updateUrl(`${window.shopUrl}${final}`);
        if ('false' !== this.dataset.updateUrl) {
          window.history.replaceState({}, '', final);
        }
      }
      setUnavailable() {
        this.productForm?.toggleSubmitButton(!0, window.variantStrings.unavailable);
        let t = ['price', 'Inventory', 'Sku', 'Price-Per-Item', 'Volume-Note', 'Volume', 'Quantity-Rules'].map((t) => `#${t}-${this.dataset.section}`).join(', ');
        document.querySelectorAll(t).forEach(({ classList: t }) => t.add('hidden'));
      }
      updateMedia(t, e) {
        if (!e) return;
        // Custom <product-gallery> (used by the variants/comb templates) is a
        // separate element with its own setActiveMedia(rawId). The Dawn-default
        // <media-gallery> path below is a no-op when product-gallery is used,
        // so notify it explicitly here.
        this.querySelector('product-gallery')?.setActiveMedia?.(e);
        let i = this.querySelector('media-gallery ul'),
          a = t.querySelector('media-gallery ul'),
          r = () => {
            this.hasAttribute('data-zoom-on-hover') && enableZoomOnHover(2);
            let t = Array.from(i.querySelectorAll('li[data-media-id]')),
              e = new Set(t.map((t) => t.dataset.mediaId)),
              a = new Map(t.map((t, e) => [t.dataset.mediaId, { item: t, index: e }]));
            return [t, e, a];
          };
        if (i && a) {
          let [s, n, l] = r(),
            o = Array.from(a.querySelectorAll('li[data-media-id]')),
            u = new Set(o.map(({ dataset: t }) => t.mediaId)),
            d = !1;
          for (let c = o.length - 1; c >= 0; c--) n.has(o[c].dataset.mediaId) || (i.prepend(o[c]), (d = !0));
          for (let h = 0; h < s.length; h++) u.has(s[h].dataset.mediaId) || (s[h].remove(), (d = !0));
          (d && ([s, n, l] = r()),
            o.forEach((t, e) => {
              let a = l.get(t.dataset.mediaId);
              a && a.index !== e && (i.insertBefore(a.item, i.querySelector(`li:nth-of-type(${e + 1})`)), ([s, n, l] = r()));
            }));
        }
        this.querySelector('media-gallery')?.setActiveMedia?.(`${this.dataset.section}-${e}`, !0);
        let p = this.productModal?.querySelector('.product-media-modal__content'),
          m = t.querySelector('product-modal .product-media-modal__content');
        p && m && (p.innerHTML = m.innerHTML);
      }
      setQuantityBoundries() {
        let t = {
            cartQuantity: this.quantityInput.dataset.cartQuantity ? parseInt(this.quantityInput.dataset.cartQuantity) : 0,
            min: this.quantityInput.dataset.min ? parseInt(this.quantityInput.dataset.min) : 1,
            max: this.quantityInput.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
            step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
          },
          e = t.min,
          i = null === t.max ? t.max : t.max - t.cartQuantity;
        (null !== i && (e = Math.min(e, i)),
          t.cartQuantity >= t.min && (e = Math.min(e, t.step)),
          (this.quantityInput.min = e),
          i ? (this.quantityInput.max = i) : this.quantityInput.removeAttribute('max'),
          (this.quantityInput.value = e),
          publish(PUB_SUB_EVENTS.quantityUpdate, void 0));
      }
      fetchQuantityRules() {
        let t = this.productForm?.variantIdInput?.value;
        t &&
          (this.querySelector('.loading__spinner').classList.remove('hidden'),
          fetch(`${this.dataset.url}?variant=${t}&section_id=${this.dataset.section}`)
            .then((t) => t.text())
            .then((t) => {
              let e = new DOMParser().parseFromString(t, 'text/html');
              this.updateQuantityRules(this.dataset.section, e);
            })
            .catch((t) => console.error(t))
            .finally(() => this.querySelector('.loading__spinner').classList.add('hidden')));
      }
      updateQuantityRules(t, e) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();
        let i = e.getElementById(`Quantity-Form-${t}`);
        for (let a of ['.quantity__input', '.quantity__rules', '.quantity__label']) {
          let r = this.quantityForm.querySelector(a),
            s = i.querySelector(a);
          if (r && s) {
            if ('.quantity__input' === a) {
              let n = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
              for (let l of n) {
                let o = s.getAttribute(l);
                null !== o ? r.setAttribute(l, o) : r.removeAttribute(l);
              }
            } else r.innerHTML = s.innerHTML;
          }
        }
      }
      get productForm() {
        return this.querySelector('product-form');
      }
      get productModal() {
        return document.querySelector(`#ProductModal-${this.dataset.section}`);
      }
      get pickupAvailability() {
        return this.querySelector('pickup-availability');
      }
      get variantSelectors() {
        return this.querySelector('variant-selects');
      }
      get relatedProducts() {
        let t = SectionId.getIdForSection(SectionId.parseId(this.sectionId), 'related-products');
        return document.querySelector(`product-recommendations[data-section-id^="${t}"]`);
      }
      get quickOrderList() {
        let t = SectionId.getIdForSection(SectionId.parseId(this.sectionId), 'quick_order_list');
        return document.querySelector(`quick-order-list[data-id^="${t}"]`);
      }
      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }
    },
  );
