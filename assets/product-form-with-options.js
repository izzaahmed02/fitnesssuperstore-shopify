if (!customElements.get('product-form-with-options')) {
  customElements.define(
    'product-form-with-options',
    class ProductFormWithOptions extends HTMLElement {
      constructor() {
        super();
        this.productContainer = document.getElementById(`MainProduct-${this.dataset.sectionId}`);
        this.form = this.querySelector('form[data-type="add-to-cart-form"]');
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.form ? this.form.querySelector('button[type="submit"]') : null;
        this.submitButtonText = this.submitButton?.querySelector('span');
        if (this.submitButton && document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }

      get quantityInput() {
        return this.querySelector('[name=quantity]');
      }

      connectedCallback() {
        if (!this.form) return;
        this.form.addEventListener('submit', this.handleAddToCart.bind(this));
      }

      async handleAddToCart(event) {
        event.preventDefault();

        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
        if (!this.checkMandatoryFields()) return alert('Please select your options before adding this item to cart');

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');
        this.cart?.setActiveElement(document.activeElement);
        const url = `${window.Shopify.routes.root}cart/add.js`;

        // Item C guard — UX only. Warn and route to Sales BEFORE adding a cart
        // the server-side validation would block at checkout. If the guard cannot
        // predict (constants missing, cart unreadable) it returns null and we
        // proceed: the server remains authoritative, so declining to guess here
        // is safe, while a wrong guess would block a legitimate order.
        try {
          const guard = window.FSBundleGuard;
          if (guard) {
            const ops = JSON.parse(this.prepareFunctionalProperties() || '[]');
            const paid = Array.isArray(ops) ? ops.filter((o) => Number(o.priceAdjustment) > 0).length : 0;
            const visible = Object.keys(this.prepareOptions() || {}).length;
            const verdict = await guard.predict(paid, visible);
            if (verdict && verdict.willExceed) {
              guard.render(this);
              this.submitButton?.classList.remove('loading');
              this.applyChangesButton?.classList.remove('loading');
              this.querySelector('.loading__spinner')?.classList.add('hidden');
              return;
            }
          }
        } catch (e) {
          console.error('[fs-bundle] guard prediction failed; deferring to server validation', e);
        }


        const visibleOptions = { ...this.prepareDefaultProperties(), ...this.prepareOptions() };
        const productProperties = {
          ...visibleOptions,
          _functionOperation: this.prepareFunctionalProperties(),
        };
        // A null manifest means "refuse to emit". OMIT the key rather than
        // sending null: the transform treats an absent manifest as a fault and
        // emits no operation, which the server validation then blocks. Sending a
        // literal null would risk being coerced to the string "null" and parsed
        // as a malformed manifest for the wrong reason.
        const manifest = this.prepareBundlePublicProperties(visibleOptions);
        if (manifest !== null) productProperties._bundlePublicProperties = manifest;

        const bodyRequest = {
          items: [
            {
              id: this.variantIdInput.value,
              quantity: this.quantityInput.value || 1,
              properties: productProperties,
            },
          ],
          sections: this.cart.getSectionsToRender().map((section) => section.id),
          sections_url: window.location.pathname,
        };

        const config = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyRequest),
        };

        try {
          const response = await fetch(url, config);
          if (!response.ok) throw new Error('Failed to add to cart');
          if (!this.cart) window.location = window.routes.cart_url;
          const result = await response.json();
          !response.ok ? this.handleCartError(result) : this.handleCartSuccess(result);
        } catch (error) {
          console.error(error);
          this.handleErrorMessage('This configuration is currently out of stock. Please choose another configuration or contact us for availability.');
        } finally {
          this.submitButton.classList.remove('loading');
          this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading__spinner')?.classList.add('hidden');
        }
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (!this.submitButton) return;
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      handleCartError(response) {
        publish(PUB_SUB_EVENTS.cartError, {
          source: 'product-form',
          productVariantId: this.variantIdInput.value,
          errors: response.errors || response.description,
          message: response.message,
        });
        this.handleErrorMessage(response.description);

        const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
        if (!soldOutMessage) return;
        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButtonText.classList.add('hidden');
        soldOutMessage.classList.remove('hidden');
        this.submitButton.classList.remove('loading');
        this.submitButton.removeAttribute('aria-disabled');
        this.querySelector('.loading__spinner').classList.add('hidden');
        return;
      }

      handleCartSuccess(response) {
        this.cart.renderContents(response);
        this.submitButton.classList.remove('loading');
        if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
        this.submitButton.removeAttribute('aria-disabled');
        this.querySelector('.loading__spinner').classList.add('hidden');
      }

      prepareDefaultProperties() {
        const result = {};
        if (!this.productContainer) return result;
        const readCustomField = (name) => {
          const marker = this.productContainer.querySelector(`[data-customfield="${name}"]`);
          if (!marker) return null;
          const itemText = marker.closest('.item__text');
          if (!itemText) return null;
          const clone = itemText.cloneNode(true);
          clone.querySelectorAll('.title, .more-info').forEach((el) => el.remove());
          const value = clone.textContent.replace(/\s+/g, ' ').trim();
          return value || null;
        };
        const warranty = readCustomField('Warranty');
        if (warranty) result['Warranty'] = warranty;
        const processingTime = readCustomField('Processing Time');
        if (processingTime) result['Processing Time'] = processingTime;
        return result;
      }

      prepareOptions() {
        if (!this.productContainer) return;
        // Only Accordion options carry [data-selected-options]; Select/Color/Quantity
        // options do not. Bailing when this list is empty would drop a product whose
        // only option is a Select (e.g. the assembly dropdown), so keep going.
        const activeOptions = this.productContainer.querySelectorAll('[data-selected-options]');
        let lineItemProperties = {};
        activeOptions.forEach((option) => {
          if (option.dataset.selectedOptions !== '') {
            const parentElement = option.closest('[data-option-accordion]');
            if (!parentElement) return;
            const key = parentElement.querySelector('[data-option-title]').innerText.trim();
            const value = parentElement.querySelectorAll('[data-customization-option]:checked');
            if (value.length === 0) return;
            const formatedValue = [...value].map((item) => item.dataset.fieldName).join(', ');
            lineItemProperties[key] = formatedValue;
          }
        });
        const selectedColors = this.productContainer.querySelectorAll('[data-selected-color-option] [data-color-selected-title]');
        if (selectedColors.length > 0) {
          selectedColors.forEach((color) => {
            const colorGroup = color.closest('[data-group-color-name]');
            const selectedColorValue = color.innerText;
            const selectedColorPrice = colorGroup.querySelector('.option_selected-price');
            lineItemProperties[colorGroup.dataset.colorNameTitle] = selectedColorValue.includes(':') ? selectedColorValue.split(':')[1] : selectedColorValue;
            if (selectedColorPrice.innerText != '') {
              lineItemProperties[colorGroup.dataset.colorNameTitle] += ` [+${selectedColorPrice.innerText}]`;
            }
          });
        }

        const selectOptions = this.productContainer.querySelectorAll('[data-select-option]');

        if (selectOptions.length > 0) {
          selectOptions.forEach((select) => {
            const selectOptionTitle = select.dataset.selectTitle;
            const option = select.selectedOptions[0]?.dataset.selectVariantTitle;
            lineItemProperties[selectOptionTitle] = option;
          });
        }

        const quanityOptions = this.productContainer.querySelectorAll('[data-quantity-option-input]');
        if (quanityOptions.length > 0) {
          quanityOptions.forEach((option) => {
            const optionTitle = option.dataset.quantityOptionVariantTitle;
            lineItemProperties[optionTitle] = option.value;
          });
        }

        return lineItemProperties;
      }

      // Item D — the bounded, versioned presentation manifest.
      //
      // Built from EXACTLY the properties `prepareOptions()` already renders, in
      // the same place and at the same time as `_functionOperation`, so the two
      // cannot disagree about what the customer selected (§D.2).
      //
      // Why it exists: `lineExpand` REPLACES the parent cart line, and the
      // expanded children carry only the attributes the transform writes. The
      // customer's Warranty, Processing Time and every $0 selection never become
      // child lines, so without this manifest they are lost from the order
      // entirely — the second half of the loss mechanism in order #1004.
      //
      // Returns null to mean "emit no manifest", which makes the transform fail
      // closed and the server validation block. That is the intended failure
      // path: a blocked checkout is visible and recoverable, where a silently
      // incomplete order is neither.
      prepareBundlePublicProperties(lineItemProperties) {
        const spec = window.FSBundleEstimator;

        // FAIL CLOSED on the constants asset, per Tim 16 Aug.
        //
        // An earlier version fell back to hardcoded 1 / 64 / 255 when this asset
        // was absent or late. That defeats the generated single source of truth
        // and is worse than useless: if the real bounds ever change, the theme
        // would keep emitting to the OLD limits and the transform would reject
        // every manifest — turning a config drift into a total checkout outage
        // with no signal pointing at the cause.
        //
        // Runtime can detect absent, late, and structurally invalid. It cannot
        // verify the checksum against the spec by itself — that is the build-time
        // job of `npm run check:estimator` and the drift test in this repo. What
        // it can require is that a checksum is present and the shape is complete.
        const required = [
          'SPEC_CHECKSUM', 'MANIFEST_VERSION', 'MAX_PUBLIC_PROPERTIES',
          'MAX_PUBLIC_KEY_LEN', 'MAX_PUBLIC_VALUE_LEN',
        ];
        const missing = !spec ? ['FSBundleEstimator'] : required.filter((k) => spec[k] == null);
        if (missing.length || typeof spec.SPEC_CHECKSUM !== 'string' || spec.SPEC_CHECKSUM.length < 8) {
          console.error(
            '[fs-bundle] Refusing to build the bundle manifest: generated estimator constants are missing or invalid (' +
              missing.join(', ') + '). Checkout will be blocked server-side rather than proceeding with unverified bounds.',
          );
          return null;
        }

        const entries = [];
        const seenKeys = new Set();
        for (const [rawKey, rawValue] of Object.entries(lineItemProperties || {})) {
          if (!rawKey || String(rawKey).startsWith('_')) continue;   // private keys are never carried
          if (rawValue == null || String(rawValue).trim() === '') continue;

          // Lengths are clamped rather than rejected: truncating a long display
          // string is cosmetic, and blocking a checkout over a verbose option
          // label would be a poor trade.
          const key = String(rawKey).slice(0, spec.MAX_PUBLIC_KEY_LEN);
          const value = String(rawValue).slice(0, spec.MAX_PUBLIC_VALUE_LEN);

          // Reject duplicate keys, INCLUDING collisions created by the clamp
          // above — two different keys longer than the cap can truncate to the
          // same string. Silently keeping one would drop a selection the customer
          // made, which is precisely the loss this manifest exists to prevent, so
          // fail closed and let the block surface it.
          if (seenKeys.has(key)) {
            console.error(
              '[fs-bundle] Refusing to build the bundle manifest: duplicate public-property key "' + key +
                '" (original "' + rawKey + '"). Two option titles collide at ' + spec.MAX_PUBLIC_KEY_LEN +
                ' characters. Checkout will be blocked rather than silently dropping a selection.',
            );
            return null;
          }
          seenKeys.add(key);
          entries.push({ key, value });
        }

        // The property COUNT is deliberately NOT clamped. Dropping selections to
        // fit would silently lose exactly what this preserves. Over the cap the
        // transform rejects and the checkout blocks.
        // Stamp the manifest with the spec checksum this asset was generated
        // against. The transform compares it to the checksum compiled into its
        // own binary and fails closed on any mismatch, which is the only way to
        // detect that the two sides were generated from DIFFERENT specs. A
        // plausible-looking-string check cannot: a stale checksum of the right
        // shape passes it.
        return JSON.stringify({ v: spec.MANIFEST_VERSION, c: spec.SPEC_CHECKSUM, p: entries });
      }

      prepareFunctionalProperties() {
        if (!this.productContainer) return;
        // See prepareOptions: non-accordion options (Select/Color/Quantity) have no
        // [data-selected-options], so don't bail when this list is empty.
        const activeOptions = this.productContainer.querySelectorAll('[data-selected-options]');
        let productOptions = [];
        activeOptions.forEach((option) => {
          if (option.dataset.selectedOptions !== '') {
            const parent = option.closest('[data-option-accordion]');
            const values = option.dataset.selectedOptions.split(',');
            values.forEach((value) => {
              const variantID = value.includes(':::') ? `gid://shopify/ProductVariant/${value.split(':::')[0].trim()}` : `gid://shopify/ProductVariant/${value.trim()}`;
              const variantPrice = value.includes(':::') ? Number(value.split(':::')[1].trim()) : 0;
              const inputIdValue = value.includes(':::') ? value.split(':::')[0].trim() : value.trim();
              const quantityElement = this.productContainer.querySelector(`[data-input-quantity="${inputIdValue}"]`);
              const quantity = quantityElement ? Number(quantityElement.value) : 1;
              const productOption = {
                variantId: variantID,
                priceAdjustment: variantPrice,
                quantity: quantity,
                groupHandle: parent.dataset.type || '',
                defaultValues: option.dataset.selectedOptions,
              };

              productOptions.push(productOption);
            });
          }
        });

        const colorOptions = this.productContainer.querySelectorAll('[data-color-variant-input]');
        if (colorOptions.length > 0) {
          colorOptions.forEach((option) => {
            const productColorOptionVariantID = `gid://shopify/ProductVariant/${option.dataset.variant}`;
            const productColorOptionPrice = option.dataset?.price ? Number(option.dataset?.price) : 0;
            const groupContainer = this.productContainer.querySelector(`[data-group-color-name="${option.dataset.group}"]`);

            const colorName = groupContainer.querySelector('[data-color-selected-title]');
            const productColorOption = {
              variantId: productColorOptionVariantID,
              priceAdjustment: productColorOptionPrice,
              quantity: 1,
              groupHandle: groupContainer.dataset.groupColorName ? groupContainer.dataset.groupColorName : '',
              colorName: colorName ? colorName.innerText.trim() : '',
            };
            productOptions.push(productColorOption);
          });
        }

        const selectOptions = this.productContainer.querySelectorAll('[data-select-option]');
        if (selectOptions.length > 0) {
          selectOptions.forEach((select) => {
            const variantID = select.value.includes(':::') ? `gid://shopify/ProductVariant/${select.value.split(':::')[0].trim()}` : `gid://shopify/ProductVariant/${select.value.trim()}`;
            const variantPrice = select.value.includes(':::') ? Number(select.value.split(':::')[1].trim()) : 0;
            const productOption = {
              variantId: variantID,
              priceAdjustment: variantPrice,
              quantity: 1,
              groupHandle: select.name,
              defaultValues: variantID.split('ProductVariant/')[1],
            };
            productOptions.push(productOption);
          });
        }

        const quantityOptions = this.productContainer.querySelectorAll('[data-quantity-option-input]');
        if (quantityOptions.length > 0) {
          quantityOptions.forEach((option) => {
            const variantID = `gid://shopify/ProductVariant/${option.dataset.quantityOptionVariant.trim()}`;
            const variantPrice = option.dataset.quantityOptionVariantPrice.trim();
            const productOption = {
              variantId: variantID,
              priceAdjustment: Number(variantPrice),
              quantity: Number(option.value),
              groupHandle: option.dataset.quantityOptionGroup,
              defaultValues: variantID,
            };
            productOptions.push(productOption);
          });
        }

        return productOptions.length > 0 ? productOptions : undefined;
      }

      checkMandatoryFields() {
        if (!this.productContainer) return true;
        const mandatoryFields = this.productContainer.querySelectorAll('[data-selected-options][data-mandatory]');
        if (mandatoryFields.length === 0) return true;
        let errorCounter = 0;
        mandatoryFields.forEach((field) => {
          if (field.dataset.selectedOptions === '') {
            field.classList.add('error');
            errorCounter += 1;
          } else {
            field.classList.remove('error');
          }
        });

        return errorCounter > 0 ? false : true;
      }
    },
  );
}
