if (!customElements.get('product-customization-options')) {
  customElements.define(
    'product-customization-options',
    class ProductCustomizationOptions extends HTMLElement {
      constructor() {
        super();
        this.accordions = this.querySelectorAll('[data-option-accordion]');
        this.customizationOptions = this.querySelectorAll('[data-customization-option]');
        this.openPopupButtons = this.querySelectorAll('[data-popup-open]');
        this.closePopupButtons = document.querySelectorAll('[data-close-popup]');
        this.colorGroups = this.querySelectorAll('.color_options_container');
        this.swatches = this.querySelectorAll('[data-color-name]');
        this.swatchesActiveContainers = this.querySelectorAll('[data-selected-color-option]');
        this.colorInputs = this.querySelectorAll('[data-color-variant-input]');
        this.colorForms = this.querySelectorAll('.custom-color-input');
        this.addCustomColors = this.querySelectorAll('.add-custom-color');
        this.closeColorPopups = this.querySelectorAll('[data-close-color-popup]');
        this.closeModifyButtons = this.querySelectorAll('[data-close-popup]');
        this.applyChangesButton = this.querySelector('[data-apply-changes]');
        this.cartItems = document.querySelector('cart-items');
        this.cartDrawer = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      }

      #accordionToggleAdded = false;

      get modifyID() {
        return this.dataset.productId;
      }

      get quantityInput() {
        return document.querySelector(`[data-quantity-variant-id="${this.dataset.variantId}"]`);
      }

      connectedCallback() {
        this.init();
        subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
          if (window.location.href.includes('/cart')) {
            this.init();
          }
        });

        subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (!event) return;
          const variant = event.data.variant;
          !variant ? this.classList.add('hidden') : this.classList.remove('hidden');
        });
      }

      init() {
        if (!window.location.href.includes('/cart') && !this.closest('cart-notification') && !this.closest('cart-drawer')) {
          this.toggleAccordions();
        }
        this.setCustomizationOption();
        this.optionSelectListener();
        this.optionInputListener();
        this.setDefaultOptionsListener();
        this.handleQuantity();
        this.handlePopupHelper();
        this.relatedProductsSwitcher();
        this.colorSwatchHandler();
        this.addCustomColorHandler();
        this.closeColorPopupHandler();
        this.openModifyHandler();
        this.closeModifyHandler();
        this.handleItemUpdate();
      }

      // Method for Accordion state

      toggleAccordions() {
        if (!this.accordions.length === 0) return;
        this.accordions.forEach((accordion) => {
          const openButton = accordion.querySelector('[data-open-accordion]');
          if (!openButton) return;
          const controlElementID = openButton.getAttribute('aria-controls');
          const accordionBody = this.querySelector(`#${controlElementID}`);
          const height = accordionBody.firstElementChild.clientHeight;
          openButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (!controlElementID) return;
            if (!accordionBody) return;
            openButton.getAttribute('aria-expanded') === 'false' ? openButton.setAttribute('aria-expanded', true) : openButton.setAttribute('aria-expanded', false);
            openButton.getAttribute('aria-expanded') === 'false' ? (accordionBody.style.height = `0px`) : (accordionBody.style.height = `${height}px`);
          });
        });
      }

      optionSelectListener() {
        const selects = this.querySelectorAll('[data-select-option]');
        if (selects.length === 0) return;
        selects.forEach((select) =>
          select.addEventListener('change', () => {
            const option = select.selectedOptions[0]?.dataset.selectVariantTitle;
            select.dataset.selectOption = option;
            this.updatePrice();
          }),
        );
      }

      optionInputListener() {
        const optionQuantitySelector = this.querySelectorAll('[data-quantity-option]');
        if (optionQuantitySelector.length === 0) return;

        optionQuantitySelector.forEach((option) => {
          const input = option.querySelector('[data-quantity-option-input]');
          const buttonIncrease = option.querySelector('[data-quantity-option-increase]');
          const buttonDecrease = option.querySelector('[data-quantity-option-decrease]');
          this.addQuantityListener(buttonIncrease, 'increase', input, true);
          this.addQuantityListener(buttonDecrease, 'decrease', input, true);
          input.addEventListener('input', () => {
            if (input.max && input.value > input.max) input.value = input.max;
            if (input.min && input.value < input.min) input.value = input.min;
          });
        });
      }

      closeAccordion(parent) {
        if (parent.hasAttribute('multichoice') || parent.querySelector('[data-quantity-selector]')) return;
        const openButton = parent.querySelector('[data-open-accordion]') || parent.closest('[data-open-accordion]');
        if (!openButton) return;
        if (!openButton) return;
        const controlElementID = openButton.getAttribute('aria-controls');
        const accordionBody = this.querySelector(`#${controlElementID}`);

        if (!controlElementID) return;
        if (!accordionBody) return;
        openButton.setAttribute('aria-expanded', false);
        accordionBody.style.height = `0px`;
      }

      // Method to select customization option

      setCustomizationOption() {
        if (!this.customizationOptions.length === 0) return;
        this.customizationOptions.forEach((option) => {
          option.addEventListener('input', () => {
            const optionContainer = option.closest('[data-option-accordion]');
            if (!optionContainer) return;
            const optionHandler = optionContainer.querySelector('[data-selected-options]');
            if (!optionHandler) return;
            this.createOptionHTML(optionHandler, option);
            optionHandler.dataset.selectedOptions = option.value;
            if (option.hasAttribute('data-has-conditions')) {
              this.conditionalChoice(option);
            }
            if (option.hasAttribute('data-has-multichoice')) {
              this.multichoice(optionHandler, option);
            }
            if (this.closest('cart-drawer')) return;
            this.updatePrice();
          });
        });
      }

      // Helper, If option have conditional logic
      conditionalChoice(option) {
        const optionsToRender = this.querySelectorAll('[data-conditions-to-render]');
        if (optionsToRender.length === 0) return;
        optionsToRender.forEach((renderOption) => {
          const conditionsToRender = renderOption.dataset.conditionsToRender;
          const selectedOptionsValue = renderOption.querySelector('[data-selected-options]');

          if (conditionsToRender.includes(option.dataset.hasConditions)) {
            renderOption.style.display = 'block';
            const selectedOptions = renderOption.querySelectorAll('[data-customization-option]:checked');
            if (selectedOptions.length === 0) return;

            selectedOptionsValue.dataset.selectedOptions = [...selectedOptions].map((option) => option.value).join(',');
          } else {
            renderOption.style.display = 'none';
            if (!selectedOptionsValue) return;
            selectedOptionsValue.dataset.selectedOptions = '';
          }
        });
      }

      // Helper, for options multichoice

      multichoice(optionHandler, option) {
        let limit = null;
        let quantityLimit = 0;
        let selectedValues = [];
        const parent = optionHandler.closest('[data-option-accordion]');
        if (parent && parent.hasAttribute('data-multichoice-limit')) {
          limit = Number(parent.getAttribute('data-multichoice-limit'));
        }
        const optionName = option.name;
        const multiChoiceOptions = this.querySelectorAll(`[data-customization-option][name="${optionName}"]:checked`);
        const notSelectedOptions = this.querySelectorAll(`[data-customization-option][name="${optionName}"]:not(:checked)`);
        const increaseButtons = parent.querySelectorAll('[data-increase-quantity]');
        if (option.dataset.fieldName !== 'No Thanks') {
          const noThanksOption = this.querySelector(`[data-customization-option][name="${optionName}"][data-field-name="No Thanks"]`);
          if (noThanksOption) {
            noThanksOption.checked = false;
            noThanksOption.disabled = true;
          }
        }
        if (option.hasAttribute('data-field-price')) {
          const noThanksOptionSelected = optionHandler.querySelector('[data-option-variant-name="No Thanks"]');
          if (noThanksOptionSelected) noThanksOptionSelected.remove();
        }

        if (multiChoiceOptions.length === 0) selectedValues = [];
        multiChoiceOptions.forEach((choice) => {
          selectedValues.push(choice.value);
          const optionQuantityInput = parent.querySelector(`[data-input-quantity="${choice.dataset.customizationOption}"]`);
          if (optionQuantityInput) {
            quantityLimit += Number(optionQuantityInput.value);
          }
        });

        if (selectedValues.length >= limit || quantityLimit >= limit) {
          notSelectedOptions.forEach((option) => (option.disabled = true));
          // if (increaseButtons.length > 0) {
          //   increaseButtons.forEach((button) => (button.disabled = true));
          // }
        } else {
          notSelectedOptions.forEach((option) => (option.disabled = false));
          // if (increaseButtons.length > 0) {
          //   increaseButtons.forEach((button) => (button.disabled = false));
          // }
        }

        optionHandler.dataset.selectedOptions = selectedValues.join(',');
        const addedOption = this.querySelector(`[data-option-id="${option.dataset.customizationOption}"]`);
        if (!option.checked && addedOption) {
          addedOption.remove();
        }
      }

      // Helper for creating option badge

      createOptionHTML(optionHandler, option) {
        if (!option) return;
        if (optionHandler.dataset.selectedOptions.includes(option.value)) return;
        if (option.hasAttribute('data-has-multichoice')) {
          const noThanksOriginalOption = this.querySelector(`[data-customization-option][name="${option.name}"][data-field-name="No Thanks"]`);
          if (noThanksOriginalOption) {
            const noThanksOption = this.querySelector(`[data-option-id="${noThanksOriginalOption.value}"]`);
            if (noThanksOption) noThanksOption.remove();
          }
          optionHandler.insertAdjacentHTML('beforeend', this.placeholderHTML(option));
        } else {
          optionHandler.innerHTML = this.placeholderHTML(option);
          optionHandler.dataset.selectedOptions = option.value;
        }
        optionHandler.style.display = 'flex';

        this.addRemoveListener(optionHandler, option);
      }

      // Add Event Lister to newly create Option Badge.
      // Need to add lister, because element not in DOM on Page Load

      addRemoveListener(optionHandler, originalOption) {
        if (!optionHandler || optionHandler.hasAttribute('data-mandatory')) return;
        const selectedOptions = optionHandler.querySelectorAll('[data-option-id]');
        if (selectedOptions.length === 0) return;
        selectedOptions.forEach((option) => {
          const removeButton = option.querySelector('.close-option');
          if (!removeButton) return;

          removeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const id = option.dataset?.optionId;
            const selectedValues = optionHandler.dataset.selectedOptions.split(',');
            const filteredOptions = selectedValues.filter((item) => !item.includes(id));
            optionHandler.dataset.selectedOptions = filteredOptions.join(',');
            option.remove();
            const input = this.querySelector(`[data-customization-option="${id}"]`);
            if (!input) return;
            input.checked = false;
            if (optionHandler.dataset.selectedOptions === '') {
              optionHandler.style.display = 'none';
              const noThanksOriginalOption = this.querySelector(`[data-customization-option][name="${originalOption.name}"][data-field-name="No Thanks"]`);
              if (noThanksOriginalOption) {
                noThanksOriginalOption.disabled = false;
              }
            }
            if (this.closest('cart-drawer')) return;
            this.updatePrice();
          });
        });
      }

      // Option badge HTML placeholder

      placeholderHTML(option) {
        return `<p data-option-id="${option.dataset.customizationOption}">
        <span class="product-options__accordion-label-title" data-option-title>${option.dataset.fieldName}</span>
        ${
          option.hasAttribute('data-field-price')
            ? `<span class="product-options__accordion-label-price ${option.dataset.fieldPrice.includes('-') ? 'reduction' : ''}" data-option-price>${option.dataset.fieldPrice}</span>`
            : ''
        }

        <svg class="close-option" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.57808 3.57417C3.81239 3.33986 4.19229 3.33986 4.42661 3.57417L8.00234 7.14991L11.5781 3.57417C11.8124 3.33986 12.1923 3.33986 12.4266 3.57417C12.6609 3.80849 12.6609 4.18839 12.4266 4.4227L8.85087 7.99844L12.4266 11.5742C12.6609 11.8085 12.6609 12.1884 12.4266 12.4227C12.1923 12.657 11.8124 12.657 11.5781 12.4227L8.00234 8.84697L4.42661 12.4227C4.19229 12.657 3.81239 12.657 3.57808 12.4227C3.34377 12.1884 3.34377 11.8085 3.57808 11.5742L7.15382 7.99844L3.57808 4.4227C3.34377 4.18839 3.34377 3.80849 3.57808 3.57417Z" fill="black"/>
        </svg>
        </p>`;
      }

      // Default option event lister (Add possibility to remove default)

      setDefaultOptionsListener() {
        this.customizationOptions.forEach((option) => {
          const optionContainer = option.closest('[data-option-accordion]');
          if (!optionContainer) return;
          const optionHandler = optionContainer.querySelector('[data-selected-options]');
          if (!optionHandler) return;
          this.addRemoveListener(optionHandler, option);
          if (this.closest('cart-drawer')) return;
          this.updatePrice();
        });
      }

      // Method to change item quantity if enabled

      handleQuantity() {
        if (this.accordions.length === 0) return;
        this.accordions.forEach((accordion) => {
          const quantitySelectorContainers = accordion.querySelectorAll('[data-quantity-selector]');
          if (quantitySelectorContainers.length === 0) return;
          quantitySelectorContainers.forEach((container) => {
            const qunatityInput = container.querySelector('[data-input-quantity]');
            const btnIncrease = container.querySelector('[data-increase-quantity]');
            const btnDecrease = container.querySelector('[data-decrease-quantity]');
            this.addQuantityListener(btnIncrease, 'increase', qunatityInput);
            this.addQuantityListener(btnDecrease, 'decrease', qunatityInput);
          });
        });
      }

      // Helper to incease/decrease quanity

      addQuantityListener(el, option, input, updatePrice) {
        el.addEventListener('click', (event) => {
          event.preventDefault();
          const inputValue = Number(input.value);
          const minInputValue = Number(input.min);
          const maxInputValue = Number(input.max);
          if (inputValue - 1 === 0 && option === 'decrease') return;
          if (minInputValue && inputValue === minInputValue && option === 'decrease') return;
          if (maxInputValue && inputValue === maxInputValue && option === 'increase') return;
          const optionContainer = el.closest('[data-option-accordion]');
          if (optionContainer) {
            const customizationOption = optionContainer.querySelector(`[data-customization-option="${input.dataset.inputQuantity}"]`);
            if (customizationOption) {
              const priceContainer = customizationOption.parentElement.querySelector('[avis-price]');
              if (priceContainer) {
                const price = Number(priceContainer.getAttribute('avis-price')) * Number(input.value);
                const formattedPrice = price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                priceContainer.innerHTML = `$${formattedPrice}`;
                setTimeout(() => {
                  const selectedOption = optionContainer.querySelector(`[data-option-id="${input.dataset.inputQuantity}"]`);
                  if (selectedOption) {
                    const selectedOptionPrice = selectedOption.querySelector('[data-option-price]');
                    selectedOptionPrice.innerHTML = `$${formattedPrice}`;
                  }
                });
              }
              customizationOption.checked = true;
              customizationOption.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
          let quantityLimit = 0;
          const limit = optionContainer.getAttribute('[data-multichoice-limit]');
          console.log(limit, 'test');

          const multiChoiceOptions = optionContainer.querySelectorAll(`[data-customization-option]:checked`);
          const increaseButtons = optionContainer.querySelectorAll('[data-increase-quantity]');

          multiChoiceOptions.forEach((choice) => {
            const optionQuantityInput = optionContainer.querySelector(`[data-input-quantity="${choice.dataset.customizationOption}"]`);

            console.log(optionQuantityInput);
            if (optionQuantityInput) {
              quantityLimit += Number(optionQuantityInput.value);
            }
          });
          console.log(Number(limit));

          if (option === 'increase') {
            if (quantityLimit + 1 >= Number(limit)) {
              increaseButtons.forEach((button) => (button.disabled = true));
              optionContainer.dataset.currentTotal = limit;
            } else {
              optionContainer.dataset.currentTotal = quantityLimit;
            }
          }

          option === 'increase' ? (input.value = el.disabled ? inputValue : inputValue + 1) : (input.value = inputValue - 1);

          if (updatePrice) {
            option === 'increase' ? (input.dataset.value = inputValue + 1) : (input.dataset.value = inputValue - 1);
            this.updatePrice();
          }
          // const optionContainer = el.closest('[data-option-accordion]');
          // if (!optionContainer) return;
          // const customizationOption = optionContainer.querySelector(`[data-customization-option="${input.dataset.inputQuantity}"]`);
          // if (!customizationOption) return;
          // const priceContainer = customizationOption.parentElement.querySelector('[avis-price]');
          // if (priceContainer) {
          //   const price = Number(priceContainer.getAttribute('avis-price')) * Number(input.value);
          //   const formattedPrice = price.toLocaleString('en-US', {
          //     minimumFractionDigits: 2,
          //     maximumFractionDigits: 2,
          //   });
          //   priceContainer.innerHTML = `$${formattedPrice}`;
          //   setTimeout(() => {
          //     const selectedOption = optionContainer.querySelector(`[data-option-id="${input.dataset.inputQuantity}"]`);
          //     if (selectedOption) {
          //       const selectedOptionPrice = selectedOption.querySelector('[data-option-price]')
          //       selectedOptionPrice.innerHTML = `$${formattedPrice}`;
          //     }
          //   });
          // }
          // customizationOption.checked = true;
          // customizationOption.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }

      // Tooltip popup handler

      handlePopupHelper() {
        if (this.openPopupButtons.length === 0) return;
        this.openPopupButtons.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const popup = document.querySelector(`[data-popup="${button.dataset?.popupOpen}"`);
            if (!popup) return;
            popup.classList.add('active');
          });
        });

        if (this.closePopupButtons.length === 0) return;
        this.closePopupButtons.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();
            const popup = document.querySelector(`[data-popup="${button.dataset?.closePopup}"`);
            if (!popup) return;
            popup.classList.remove('active');
          });
        });
      }

      // Related products popup helper to select necessary product

      relatedProductsSwitcher() {
        const relatedProducts = document.querySelectorAll('[data-product-related-id]');
        const relatedProductsDetails = document.querySelectorAll('[data-related-details-id]');
        if (relatedProducts.length === 0) return;
        relatedProducts.forEach((product) => {
          product.addEventListener('click', () => {
            relatedProducts.forEach((product) => product.classList.remove('active'));
            relatedProductsDetails.forEach((detail) => (detail.style.display = 'none'));
            const activeId = product.dataset.productRelatedId;
            const activeDetail = document.querySelector(`[data-related-details-id="${activeId}"]`);
            product.classList.add('active');
            if (activeDetail) activeDetail.style.display = 'block';
          });
        });
      }

      // Method to update price when options are selected (increase/decrease)

      updatePrice() {
        let priceAdjustment = 0;
        const activeOptions = this.querySelectorAll('[data-customization-option]:checked, [data-select-option], [data-quantity-option-input]');
        if (activeOptions.length === 0) return;
        activeOptions.forEach((option) => {
          const value = option.value;
          if (value.includes(':::')) {
            const quantityInput = this.querySelector(`[data-input-quantity="${option.dataset.customizationOption}"]`);
            if (quantityInput) {
              priceAdjustment += Number(value.split(':::')[1]) * Number(quantityInput.value);
            } else {
              priceAdjustment += Number(value.split(':::')[1]);
            }
          } else {
            if (option.dataset?.quantityOptionVariantPrice) {
              priceAdjustment += Number(value) * Number(option.dataset?.quantityOptionVariantPrice);
            }
          }
        });

        const colorVariantInput = this.querySelector('[data-color-variant-input]');
        if (colorVariantInput) {
          const colorPrice = colorVariantInput.dataset?.price;

          if (colorPrice !== '') {
            priceAdjustment += Number(colorPrice || 0);
          }
        }

        this.priceHelper(priceAdjustment);
      }

      // Helper to create corect price HTML

      priceHelper(priceAdjustment) {
        const priceElement = document.querySelectorAll('.pr_custom_price');
        if (priceElement.length === 0) return;

        const currentPrice = priceElement[0].dataset?.priceValue;
        const finalPrice = Number(currentPrice) + priceAdjustment;
        const formattedPrice = finalPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        priceElement.forEach((el) => {
          el.innerText = `${priceElement[0].dataset?.currency}${formattedPrice}`;
        });
      }

      // Method to select color

      colorSwatchHandler() {
        if (this.colorGroups.length === 0) return;
        this.colorGroups.forEach((group) => {
          const colorForm = group.querySelector('.custom-color-input');
          const colorInput = group.querySelector('[data-color-variant-input]');
          const swatches = group.querySelectorAll('[data-color-name]');
          if (swatches.length === 0) return;
          swatches.forEach((swatch) => {
            const swatchesActiveContainer = this.querySelector(`[data-selected-color-option="${swatch.dataset.group}"`);
            swatch.addEventListener('click', (event) => {
              event.preventDefault();
              swatches.forEach((item) => item.classList.remove('color-selected'));
              swatch.classList.add('color-selected');
              if (swatch.classList.contains('swatch--custom-trigger')) {
                colorForm.removeAttribute('style');
              } else {
                colorForm.style.display = 'none';
                colorInput.dataset.variant = swatch.dataset.id;
                colorInput.dataset.price = swatch.dataset.colorPrice;
                swatchesActiveContainer.innerHTML = this.setColorOptionHTML(swatch, false);
                if (this.closest('cart-drawer')) return;
                this.updatePrice();
              }
            });
          });
        });
      }

      // Nethod to add custom color using input

      addCustomColorHandler() {
        if (this.colorGroups.length === 0) return;
        this.colorGroups.forEach((group) => {
          const addCustomColor = group.querySelector('.add-custom-color');
          const colorForm = group.querySelector('.custom-color-input');
          const colorInput = group.querySelector('[data-color-variant-input]');
          if (!addCustomColor) return;
          addCustomColor.addEventListener('click', (event) => {
            event.preventDefault();
            const input = colorForm.querySelector('input[type="text"]');
            const swatchesActiveContainer = this.querySelector(`[data-selected-color-option="${input.dataset.group}"`);

            if (!input) return;
            colorInput.dataset.variant = input.dataset.id;
            colorInput.dataset.price = input.dataset.price;
            swatchesActiveContainer.innerHTML = this.setColorOptionHTML(input, true);
            colorForm.style.display = 'none';
            input.value = '';
            if (this.closest('cart-drawer')) return;
            this.updatePrice();
          });
        });
      }

      // Hepler to create custom color badge

      setColorOptionHTML(colorOption, customColor) {
        return `<p class="option_selected" data-option-id="${colorOption.dataset.id}">
          <div data-color-selected-title>
          ${customColor ? `Custom Color: ${colorOption.value}` : `${colorOption.dataset.colorName}`}
          </div>
          <div class="option_selected-price">
          ${customColor ? `${colorOption.dataset?.price !== '' ? `$${colorOption.dataset?.price}` : ''}` : `${colorOption.dataset.colorPrice !== '0' ? `${colorOption.dataset.colorPrice}` : ''}`}
          </div>
        </p>`;
      }

      // Method to close custom color popup

      closeColorPopupHandler() {
        if (this.colorGroups.length === 0) return;
        this.colorGroups.forEach((group) => {
          const closeColorPopup = group.querySelector('[data-close-color-popup]');
          const colorForm = group.querySelector('.custom-color-input');
          if (!closeColorPopup) return;
          closeColorPopup.addEventListener('click', (event) => {
            event.preventDefault();
            colorForm.style.display = 'none';
          });
        });
      }

      // Method to open Modify popup in Cart

      openModifyHandler() {
        setTimeout(() => {
          const modifyButton = document.querySelector(`[data-key-modify="${this.modifyID}"]`) || this.cartDrawer?.querySelector(`[data-key-modify="${this.modifyID}"]`);
          if (!modifyButton) return;
          modifyButton.addEventListener('click', () => {
            if (!this.#accordionToggleAdded) {
              this.toggleAccordions();
              this.#accordionToggleAdded = true;
            }
            this.dataset.stamp = this.htmlToBase64(this.innerHTML);
            setTimeout(() => {
              this.hideConditionalOptions();
              this.classList.add('modify-opened');
              document.body.style.overflow = 'hidden';
            }, 200);
          });
        }, 150);
      }

      // Method to close Modify popup in Cart

      closeModifyHandler() {
        if (this.closeModifyButtons.length === 0) return;
        this.closeModifyButtons.forEach((button) => {
          button.addEventListener('click', () => {
            this.classList.remove('modify-opened');
            this.dataset.stamp = 'none';
            document.body.style.overflow = 'auto';
          });
        });
      }

      // Method to update cart item if options are changed

      handleItemUpdate() {
        if (!this.applyChangesButton) return;
        this.applyChangesButton.addEventListener('click', (event) => {
          event.preventDefault();
          const currentStamp = this.htmlToBase64(this.innerHTML);
          if (currentStamp === this.dataset.stamp) {
            this.classList.remove('modify-opened');
            this.dataset.stamp = 'none';
          } else {
            this.applyChangesButton.classList.add('loading');
            this.replaceItem();
          }
        });
      }

      // Method to send neccessary Request to Shopidy server
      // We compare the previous selection with new selection.
      // If they are the same we close Modify popup otherwise we remove previous product and add new

      async replaceItem() {
        const changeUrl = `${window.Shopify.routes.root}cart/change.js`;
        const addUrl = `${window.Shopify.routes.root}cart/add.js`;
        if (!this.checkMandatoryFields()) return alert('Please select your options before adding this item to cart');
        let sections = '';
        if (window.location.href.includes('/cart')) {
          sections = this.getSectionsToRender().map((section) => section.section);
        } else {
          sections = this.cartDrawer.getSectionsToRender().map((section) => section.id);
        }

        const productProperties = {
          ...this.prepareOptions(),
          _functionOperation: this.prepareFunctionalProperties(),
        };

        const changeRequest = {
          id: this.modifyID,
          quantity: 0,
          sections: sections,
          sections_url: window.location.pathname,
        };

        const changeConfig = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(changeRequest),
        };

        const updateRequest = {
          items: [
            {
              id: this.modifyID.split(':')[0],
              quantity: this.quantityInput?.value || 1,
              properties: productProperties,
            },
          ],
          sections: sections,
          sections_url: window.location.pathname,
        };

        const updateConfig = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateRequest),
        };

        try {
          const response = await fetch(changeUrl, changeConfig);
          if (response.ok) {
            const updateResponse = await fetch(addUrl, updateConfig);

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) throw new Error('Failed to add to cart');
            if (window.location.href.includes('/cart')) {
              this.getSectionsToRender().forEach((section) => {
                const elementToReplace = document.querySelector(section.selector) || document.getElementById(section.id);

                elementToReplace.innerHTML = this.getSectionInnerHTML(updateResult.sections[section.section], section.selector);
              });
            } else {
              this.cartDrawer.renderContents(updateResult);
            }

            this.classList.remove('modify-opened');
            this.dataset.stamp = 'none';
            document.body.style.overflow = 'auto';
            this.#accordionToggleAdded = false;
          }
        } catch (error) {
          console.error(error);
        }
      }

      // Helper to check if all mandatory options are selected.
      // If no we stop add to cart process

      checkMandatoryFields() {
        const mandatoryFields = this.querySelectorAll('[data-selected-options][data-mandatory]');
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

      // Helper to prepare line item properties

      prepareOptions() {
        const activeOptions = this.querySelectorAll('[data-selected-options]');
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

        const selectedColors = this.querySelectorAll('[data-selected-color-option] [data-color-selected-title]');
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

        const selectOptions = this.querySelectorAll('[data-select-option]');
        if (selectOptions.length > 0) {
          selectOptions.forEach((select) => {
            const selectOptionTitle = select.dataset.selectTitle;
            const option = select.selectedOptions[0]?.dataset.selectVariantTitle;
            lineItemProperties[selectOptionTitle] = option;
          });
        }

        const quanityOptions = this.querySelectorAll('[data-quantity-option-input]');
        if (quanityOptions.length > 0) {
          quanityOptions.forEach((option) => {
            const optionTitle = option.dataset.quantityOptionVariantTitle;
            lineItemProperties[optionTitle] = option.value;
          });
        }

        return lineItemProperties;
      }

      // Hepler to create Shopify Function logic

      prepareFunctionalProperties() {
        const activeOptions = this.querySelectorAll('[data-selected-options]');
        if (activeOptions.length === 0) return;
        let productOptions = [];
        activeOptions.forEach((option) => {
          if (option.dataset.selectedOptions !== '') {
            const parent = option.closest('[data-option-accordion]');
            const values = option.dataset.selectedOptions.split(',');
            values.forEach((value) => {
              const variantID = value.includes(':::') ? `gid://shopify/ProductVariant/${value.split(':::')[0].trim()}` : `gid://shopify/ProductVariant/${value.trim()}`;
              const variantPrice = value.includes(':::') ? Number(value.split(':::')[1].trim()) : 0;
              const inputIdValue = value.includes(':::') ? value.split(':::')[0].trim() : value.trim();
              const quantityElement = this.querySelector(`[data-input-quantity="${inputIdValue}"]`);
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

        const colorOptions = this.querySelectorAll('[data-color-variant-input]');
        if (colorOptions.length > 0) {
          colorOptions.forEach((option) => {
            const productColorOptionVariantID = `gid://shopify/ProductVariant/${option.dataset.variant}`;
            const productColorOptionPrice = option.dataset?.price ? Number(option.dataset?.price) : 0;
            const groupContainer = this.querySelector(`[data-group-color-name="${option.dataset.group}"]`);
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

        const selectOptions = this.querySelectorAll('[data-select-option]');
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

        const quantityOptions = this.querySelectorAll('[data-quantity-option-input]');
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

        return productOptions;
      }

      // If condistionals option is present and some elements are hidden. We hide the in modify popup
      hideConditionalOptions() {
        const defaultConditionalOptions = this.querySelectorAll('[data-should-be-hidden]');
        if (defaultConditionalOptions.length === 0) return;
        defaultConditionalOptions.forEach((option) => {
          option.style.display = 'none';
          const defaultOptions = option.querySelector('[data-should-have-default]');
          if (defaultOptions && defaultOptions.dataset.shouldHaveDefault !== '') {
            defaultOptions.dataset.selectedOptions = defaultOptions.dataset.shouldHaveDefault;
          }
        });
      }
      // Array of sections to be rerendered

      getSectionsToRender() {
        return [
          {
            id: 'main-cart-items',
            section: document.getElementById('main-cart-items').dataset.id,
            selector: '.section-cart-items',
          },
          {
            id: 'main-cart-footer',
            section: document.getElementById('main-cart-footer').dataset.id,
            selector: '.footer-subtotal-value',
          },
        ];
      }

      // Helper to parse HTML after server response

      getSectionInnerHTML(html, selector) {
        return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
      }

      // Helper to compare previous option state with new.
      // We create a stamp of HTML in Base64 format and compare old and new one

      htmlToBase64(html) {
        const bytes = new TextEncoder().encode(html);
        const binary = Array.from(bytes)
          .map((b) => String.fromCharCode(b))
          .join('');
        return btoa(binary);
      }
    },
  );
}
