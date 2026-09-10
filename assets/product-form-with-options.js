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

        // Named `properties[...]` inputs rendered inside the form (the gift-card
        // recipient fields from gift-card-recipient-form.liquid: email, name,
        // message, send-on date, timezone offset) — the JSON body built below is
        // the only thing posted, so anything not serialised here is silently
        // dropped from the order. FormData already skips disabled controls, which
        // is how recipient-form.js switches those fields off. Spread first so the
        // configurator helpers keep precedence on any shared key.
        const formProperties = {};
        if (this.form) {
          new FormData(this.form).forEach((value, name) => {
            const match = name.match(/^properties\[(.+)\]$/);
            if (match) formProperties[match[1]] = value;
          });
        }

        const productProperties = {
          ...formProperties,
          ...this.prepareDefaultProperties(),
          ...this.prepareOptions(),
          _functionOperation: this.prepareFunctionalProperties(),
        };

        const bodyRequest = {
          items: [
            {
              id: this.variantIdInput.value,
              quantity: this.quantityInput.value || 1,
              properties: productProperties,
            },
          ],
        };
        // Page-cart mode has neither <cart-drawer> nor <cart-notification>, so
        // there is nothing to re-render: ask for no sections and redirect to the
        // cart on success instead (same split as Dawn's product-form.js).
        if (this.cart) {
          bodyRequest.sections = this.cart.getSectionsToRender().map((section) => section.id);
          bodyRequest.sections_url = window.location.pathname;
        }

        const config = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyRequest),
        };

        try {
          const response = await fetch(url, config);
          const result = await response.json();
          // Shopify answers a rejected add with 422 + {status, description};
          // route that to handleCartError so the real reason (quantity rule,
          // sold out) is shown and cartError is published — same as Dawn's
          // product-form.js — rather than the generic message in the catch.
          if (result.status) {
            this.handleCartError(result);
            return;
          }
          if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }
          this.handleCartSuccess(result);
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

      // Only reached with a cart element present (page-cart mode returns
      // before this); button/spinner reset is the finally block's job.
      handleCartSuccess(response) {
        // Posted as `items: [...]`, so Shopify answers `{ items: [line], sections }`
        // rather than the line itself (which is what Dawn's FormData post gets).
        // <cart-notification>.renderContents() reads response.key to find
        // [id="cart-notification-product-<key>"] and throws without it — after
        // the item is already in the cart. Lift key/id from the single line.
        if (response && !response.key && response.items && response.items.length) {
          response.key = response.items[0].key;
          if (response.id === undefined) response.id = response.items[0].id;
        }
        this.cart.renderContents(response);
        this.cart.classList.remove('is-empty');
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
          // A conditional (tiered) option that does not apply to the current parent
          // choice is hidden by syncConditionalVisibility(), which also clears its
          // selection. Requiring it would block add to cart on a configuration the
          // shopper has fully filled in - e.g. the 5 Stack PDPs render one Station
          // Layout accordion per Stations Included tier, so whichever tier is not
          // selected is always hidden and always empty. Only the options a shopper
          // can actually see are mandatory.
          const accordion = field.closest('[data-option-accordion]');
          if (accordion && window.getComputedStyle(accordion).display === 'none') {
            field.classList.remove('error');
            return;
          }
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
