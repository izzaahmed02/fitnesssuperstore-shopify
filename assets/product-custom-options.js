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
        this.priceElement = document.querySelector('.pr_custom_price ');
        this.swatches = this.querySelectorAll('[data-color-name]');
        this.swatchesActiveContainer = this.querySelector('[data-selected-color-option]');
        this.colorInput = this.querySelector('[data-color-variant-input]');
        this.colorForm = this.querySelector('.custom-color-input');
        this.addCustomColor = this.querySelector('.add-custom-color');
        this.closeColorPopup = this.querySelector('[data-close-color-popup]');
      }

      connectedCallback() {
        this.toggleAccordions();
        this.setCustomizationOption();
        this.handleQuantity();
        this.handlePopupHelper();
        this.colorSwatchHandler();
        this.addCustomColorHandler();
        this.setDefaultOptionsListener();
      }

      toggleAccordions() {
        if (!this.accordions.length === 0) return;
        this.accordions.forEach((accordion) => {
          const openButton = accordion.querySelector('[data-open-accordion]');
          if (!openButton) return;
          openButton.addEventListener('click', () => {
            const controlElementID = openButton.getAttribute('aria-controls');
            if (!controlElementID) return;
            const accordionBody = this.querySelector(`#${controlElementID}`);
            if (!accordionBody) return;
            openButton.getAttribute('aria-expanded') === 'false' ? openButton.setAttribute('aria-expanded', true) : openButton.setAttribute('aria-expanded', false);
            accordionBody.toggleAttribute('hidden');
          });
        });
      }

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
            this.updatePrice();
          });
        });
      }

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

      addRemoveListener(optionHandler, originalOption) {
        if (!optionHandler) return;
        const selectedOptions = optionHandler.querySelectorAll('[data-option-id]');
        if (selectedOptions.length === 0) return;
        selectedOptions.forEach((option) => {
          option.addEventListener('click', (event) => {
            event.stopPropagation();
            const id = option.dataset?.optionId;
            const selectedValues = optionHandler.dataset.selectedOptions.split(',');
            const filteredOptions = selectedValues.filter((item) => item !== id);
            optionHandler.dataset.selectedOptions = filteredOptions.join(',');
            option.remove();
            const input = this.querySelector(`[data-customization-option][value="${id}"]`);
            if (!input) return;
            input.checked = false;
            if (optionHandler.dataset.selectedOptions === '') {
              optionHandler.style.display = 'none';
              const noThanksOriginalOption = this.querySelector(`[data-customization-option][name="${originalOption.name}"][data-field-name="No Thanks"]`);
              if (noThanksOriginalOption) {
                noThanksOriginalOption.disabled = false;
              }
            }
            this.updatePrice();
          });
        });
      }

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

      multichoice(optionHandler, option) {
        let selctedValues = [];
        const optionName = option.name;
        if (option.dataset.fieldName !== 'No Thanks') {
          const noThanksOption = this.querySelector(`[data-customization-option][name="${optionName}"][data-field-name="No Thanks"]`);
          if (noThanksOption) {
            noThanksOption.checked = false;
            noThanksOption.disabled = true;
          }
        }
        const multiChoiceOptions = this.querySelectorAll(`[data-customization-option][name="${optionName}"]:checked`);
        if (multiChoiceOptions.length === 0) selctedValues = [];
        multiChoiceOptions.forEach((choice) => selctedValues.push(choice.value));
        optionHandler.dataset.selectedOptions = selctedValues.join(',');
      }

      placeholderHTML(option) {
        return `<p data-option-id="${option.value}">
        <span class="product-options__accordion-label-title" data-option-title>${option.dataset.fieldName}</span>
        ${option.hasAttribute('data-field-price') ? `<span class="product-options__accordion-label-price" data-option-price>${option.dataset.fieldPrice}</span>` : ''}

        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.57808 3.57417C3.81239 3.33986 4.19229 3.33986 4.42661 3.57417L8.00234 7.14991L11.5781 3.57417C11.8124 3.33986 12.1923 3.33986 12.4266 3.57417C12.6609 3.80849 12.6609 4.18839 12.4266 4.4227L8.85087 7.99844L12.4266 11.5742C12.6609 11.8085 12.6609 12.1884 12.4266 12.4227C12.1923 12.657 11.8124 12.657 11.5781 12.4227L8.00234 8.84697L4.42661 12.4227C4.19229 12.657 3.81239 12.657 3.57808 12.4227C3.34377 12.1884 3.34377 11.8085 3.57808 11.5742L7.15382 7.99844L3.57808 4.4227C3.34377 4.18839 3.34377 3.80849 3.57808 3.57417Z" fill="black"/>
        </svg>
        </p>`;
      }

      setDefaultOptionsListener() {
        this.customizationOptions.forEach((option) => {
          const optionContainer = option.closest('[data-option-accordion]');
          if (!optionContainer) return;
          const optionHandler = optionContainer.querySelector('[data-selected-options]');
          if (!optionHandler) return;
          this.addRemoveListener(optionHandler, option);
          this.updatePrice();
        });
      }

      handleQuantity() {
        if (this.accordions.length === 0) return;
        this.accordions.forEach((accordion) => {
          const quantitySelectorContainer = accordion.querySelector('[data-quantity-selector]');
          if (!quantitySelectorContainer) return;
          const qunatityInput = quantitySelectorContainer.querySelector('[data-input-quantity]');
          const btnIncrease = quantitySelectorContainer.querySelector('[data-increase-quantity]');
          const btnDecrease = quantitySelectorContainer.querySelector('[data-decrease-quantity]');
          this.addQuantityListener(btnIncrease, 'increase', qunatityInput);
          this.addQuantityListener(btnDecrease, 'decrease', qunatityInput);
        });
      }

      addQuantityListener(el, option, input) {
        el.addEventListener('click', () => {
          const inputValue = Number(input.value);
          const maxInputValue = Number(input.max);
          if (inputValue - 1 === 0 && option === 'decrease') return;
          if (maxInputValue && inputValue === maxInputValue && option === 'increase') return;
          option === 'increase' ? (input.value = inputValue + 1) : (input.value = inputValue - 1);
          const optionContainer = el.closest('[data-option-accordion]').querySelector('[data-customization-option]');
          if (!optionContainer) return;
          optionContainer.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }

      handlePopupHelper() {
        if (this.openPopupButtons.length === 0) return;
        this.openPopupButtons.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            const popup = document.querySelector(`[data-popup="${button.dataset?.popupOpen}"`);
            if (!popup) return;
            popup.classList.add('active');
          });
        });

        if (this.closePopupButtons.length === 0) return;
        this.closePopupButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const popup = document.querySelector(`[data-popup="${button.dataset?.closePopup}"`);
            if (!popup) return;
            popup.classList.remove('active');
          });
        });
      }

      updatePrice() {
        let priceAdjustment = 0;
        let price = 0;
        const activeOptions = document.querySelectorAll('[data-customization-option]:checked');
        if (activeOptions.length === 0) return;
        activeOptions.forEach((option) => {
          const value = option.value;
          if (value.includes(':::')) {
            const quantityInput = document.querySelector(`[data-input-quantity="${option.dataset.customizationOption}"]`);
            if (quantityInput) {
              price = Number(value.split(':::')[1]) * Number(quantityInput.value);
            } else {
              price = Number(value.split(':::')[1]);
            }
            priceAdjustment += price;
          }
        });

        const colorVariantInput = document.querySelector('[data-color-variant-input]');
        const colorPrice = colorVariantInput.dataset?.price;

        if (colorPrice !== '') {
          priceAdjustment += Number(colorPrice || 0);
        }

        this.priceHelper(priceAdjustment);
      }

      priceHelper(priceAdjustment) {
        if (!this.priceElement) return;
        const currentPrice = this.priceElement.dataset?.priceValue;
        const finalPrice = Number(currentPrice) + priceAdjustment;
        const formattedPrice = finalPrice.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        this.priceElement.innerText = `${this.priceElement.dataset?.currency}${formattedPrice}`;
      }

      colorSwatchHandler() {
        if (this.swatches.length === 0) return;
        this.swatches.forEach((swatch) => {
          swatch.addEventListener('click', () => {
            this.swatches.forEach((swatch) => swatch.classList.remove('color-selected'));
            swatch.classList.add('color-selected');
            if (swatch.classList.contains('swatch--custom-trigger')) {
              this.colorForm.removeAttribute('style');
            } else {
              this.colorForm.style.display = 'none';
              this.colorInput.dataset.variant = swatch.dataset.id;
              this.colorInput.dataset.price = swatch.dataset.colorPrice;

              this.swatchesActiveContainer.innerHTML = this.setColorOptionHTML(swatch, false);
              this.updatePrice();
            }
          });
        });
      }

      addCustomColorHandler() {
        if (!this.addCustomColor) return;
        this.addCustomColor.addEventListener('click', () => {
          const input = this.colorForm.querySelector('input[type="text"]');
          if (!input) return;
          this.colorInput.dataset.variant = input.dataset.id;
          this.colorInput.dataset.price = input.dataset.price;
          this.swatchesActiveContainer.innerHTML = this.setColorOptionHTML(input, true);
          this.colorForm.style.display = 'none';
          input.value = '';
          this.updatePrice();
        });
      }

      setColorOptionHTML(colorOption, customColor) {
        return `<p class="option_selected" data-option-id="${colorOption.dataset.id}">
          <span data-color-selected-title>
          ${customColor ? `Custom Color: ${colorOption.value}` : `${colorOption.dataset.colorName}`}
          </span>
          <span class="option_selected-price">
          ${customColor ? `${colorOption.dataset?.price !== '' ? `$${colorOption.dataset?.price}` : ''}` : `${colorOption.dataset.colorPrice !== '0' ? `$${colorOption.dataset.colorPrice}` : ''}`}
          </span>
          <svg
            class="close-option"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M3.5771 3.57613C3.81142 3.34181 4.19132 3.34181 4.42563 3.57613L8.00137 7.15186L11.5771 3.57613C11.8114 3.34181 12.1913 3.34181 12.4256 3.57613C12.6599 3.81044 12.6599 4.19034 12.4256 4.42465L8.8499 8.00039L12.4256 11.5761C12.6599 11.8104 12.6599 12.1903 12.4256 12.4247C12.1913 12.659 11.8114 12.659 11.5771 12.4247L8.00137 8.84892L4.42563 12.4247C4.19132 12.659 3.81142 12.659 3.5771 12.4247C3.34279 12.1903 3.34279 11.8104 3.5771 11.5761L7.15284 8.00039L3.5771 4.42465C3.34279 4.19034 3.34279 3.81044 3.5771 3.57613Z"
                  fill="black"/>
          </svg>
        </p>`;
      }

      closeColorPopupHandler() {
        if (!this.closeColorPopup) return;
        this.closeColorPopup.addEventListener('click', () => {
          this.colorForm.style.display = 'none';
        });
      }
    }
  );
}
