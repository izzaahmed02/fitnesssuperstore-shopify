if (!customElements.get('product-form-with-options')) {
  customElements.define(
    'product-form-with-options',
    class ProductFormWithOptions extends HTMLElement {
      constructor() {
        super();
        this.productContainer = document.getElementById(`MainProduct-${this.dataset.sectionId}`);
        this.form = this.querySelector('form[data-type="add-to-cart-form"]');
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('button[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
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
        this.cart.setActiveElement(document.activeElement);
        const url = `${window.Shopify.routes.root}cart/add.js`;

        const productProperties = {
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

      prepareOptions() {
        const activeOptions = this.productContainer.querySelectorAll('[data-selected-options]');
        if (activeOptions.length === 0) return;
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
            const optionTitle = select.dataset.quantityOptionVariantTitle;
            const option = select.selectedOptions[0]?.dataset.selectVariantTitle;
            lineItemProperties[selectOptionTitle] = option;
          });
        }

        console.log(lineItemProperties);

        return lineItemProperties;
      }

      prepareFunctionalProperties() {
        const activeOptions = this.productContainer.querySelectorAll('[data-selected-options]');
        if (activeOptions.length === 0) return;
        let productOptions = [];
        activeOptions.forEach((option) => {
          if (option.dataset.selectedOptions !== '') {
            const parent = option.closest('[data-option-accordion]');
            const values = option.dataset.selectedOptions.split(',');
            values.forEach((value) => {
              console.log(value);

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

        return productOptions;
      }

      checkMandatoryFields() {
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
