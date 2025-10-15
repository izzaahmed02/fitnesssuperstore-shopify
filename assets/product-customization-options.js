if (!customElements.get('product-customization-options')) {
  customElements.define(
    'product-customization-options',
    class ProductCustomizationOptions extends HTMLElement {
      constructor() {
        super();
        this.accordions = this.querySelectorAll('[data-option-accordion]');
        this.customizationOptions = this.querySelectorAll('[ data-customization-option]');
        this.openPopupButtons = this.querySelectorAll('[data-popup-open]');
        this.closePopupButtons = document.querySelectorAll('[data-close-popup]');
      }

      connectedCallback() {
        this.toggleAccordions();
        this.setCustomizationOption();
        this.handleQuantity();
        this.handlePopupHelper();
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
          if (inputValue - 1 === 0 && option === 'decrease') return;
          option === 'increase' ? (input.value = inputValue + 1) : (input.value = inputValue - 1);
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
    }
  );
}
