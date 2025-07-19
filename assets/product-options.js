class ProductConfigurator {
	constructor() {
		this.selectedOptions = [];
		this.customColorVariantId = null;
		this.selectors = {
			accordionHeaders: '.product-options__accordion-header',
			radioInputs: '.product-options__swatch-input',
			plusButtons: '.product-options__quantity-plus',
			minusButtons: '.product-options__quantity-minus',
			removeButtons: '.product-options__accordion-label svg',
			addToCartButton: '.product-form__submit',
			quantitySelectors: '.product-options__quantity-selector',
			priceElements: {
				totalPrice: '#product-options-totalpriceadd',
				totalAdd: '#product-options-total-add',
				totalAddCharge: '.product-options__total-addcharge',
				priceItems: '.product__prices .price-item',
				customPrices: '.pr_custom_price'
			}
		};
		this.init();
		this.detectColorPicker();
	}

	init() {
		this.initAccordion();
		this.initOptionSelectors();
		this.createAssemblySelect();
		//this.initQuantityControls();
		this.initRemoveButtons();
		this.initCallPopupButtons();
		this.initAddToCartButton();
		this.initPreSelectedOptions();
		this.updateSelectedOptions();
	}
	
	createAssemblySelect() {
    if (window.location.pathname.includes('/cart')) {
      return
    }
		if (document.getElementById('double-assembly-input')) {
			return
		}
		if (document.querySelector('select[field-name="Full Assembly & Installation"]')) {
			return
		}
		const assembly = document.querySelectorAll(".product-options__accordion[data-type='Assembly & Room of Choice Installation Needed?']")[0];
		if (!assembly) {
			return
		}
		const options = assembly.querySelectorAll('.product-options__swatch label');
		let header = document.createElement('div');
		header.innerHTML='<h3 id="double-assembly-header" class="product-options__category-title">Assembly &amp; Room of Choice Installation Needed?</h3>'
		document.querySelectorAll('product-form')[0].before(header);
		let doubledSelect = document.createElement('select');
		doubledSelect.setAttribute('id', "double-assembly-input");
		document.querySelectorAll('product-form')[0].before(doubledSelect);
	
		if (doubledSelect) {
			options.forEach((option) => {
				const optionPrice = option.querySelectorAll('span')[0].getAttribute('avis-price');
				let optionValue = '';
				if (parseFloat(optionPrice) > 0) {
					optionValue = option.querySelector('.product-options__swatch-title').innerHTML + '<span> [Add ' + option.querySelectorAll('span')[0].innerHTML + ']</span>';
				} else {
					optionValue = option.querySelector('.product-options__swatch-title').innerHTML;
				}
				const optionInputName = option.querySelector('input').getAttribute("value");
				const optionTag = doubledSelect.appendChild(document.createElement("option"));
				optionTag.innerHTML = optionValue;
				optionTag.setAttribute("name", optionInputName);
				option.addEventListener("change", (e) => {
					doubledSelect.querySelectorAll(`option[name="${e.target.value}"]`)[0].selected = true;
				});
			});
	
			doubledSelect.addEventListener("change", (e) => {
				assembly.querySelectorAll("input")[e.target.selectedIndex].parentElement.click();
			});
		
			document.querySelector('.installation-group').prepend(doubledSelect);
			document.querySelector('.installation-group').prepend(header);	
		}
		const assamblyHeader = assembly.previousElementSibling;
		if (assamblyHeader && assamblyHeader.getAttribute('data-category') === 'Assembly & Room of Choice Installation Needed?') {
			assamblyHeader.style.display = 'none';
		}
		assembly.style.display = 'none';
	}

	initCallPopupButtons() {
		const productOptionsContainer = document.querySelectorAll('.button--popup');

		if (productOptionsContainer) {
			productOptionsContainer.forEach(item => {
        item.addEventListener('click', (event) => {
          const optionCategory = item.getAttribute('data-product-category');
					const headingElement = item.parentElement;

					let headingTitle = '';
					let optionTitle = '';
					let productTitleSearch = '';

					if (headingElement) {
						headingTitle = headingElement.dataset.type;
						optionTitle = headingElement.innerText;
					}
	
					if (headingTitle) {
						productTitleSearch = `${optionTitle} - ${headingTitle} (${optionCategory})`;
					} else {
						productTitleSearch = `${optionTitle} (${optionCategory})`;
					}
	
					if (productTitleSearch.includes('Warranty')) {
						productTitleSearch = `Warranty (${optionCategory})`;
					}

					const encodedProductTitle = encodeURIComponent(productTitleSearch);
					setupOptionsPopup(optionCategory, encodedProductTitle);
        });
      });
		}
  }

	initAccordion() {
		// Use event delegation instead of attaching listeners to each header
		const productOptionsContainer = document.querySelectorAll('.product-options__accordion-header');

		if (productOptionsContainer) {
			productOptionsContainer.forEach(item => {
        item.addEventListener('click', (event) => {
          if (event.target.classList.contains('button--popup') || event.target.classList.contains('.remove-button-svg')) {
            return
          }
          // Check if the clicked element or its parent is an accordion header
          const header = event.target.closest(this.selectors.accordionHeaders);
  
          if (header) {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            if (!isExpanded) {
              const openedHeader = document.querySelectorAll(`${this.selectors.accordionHeaders}[aria-expanded='true']`);
              openedHeader.forEach(item => {
                item.setAttribute('aria-expanded', false);
                item.nextElementSibling.setAttribute('hidden', '');
              });
            }
            header.setAttribute('aria-expanded', !isExpanded);
            const contentId = header.getAttribute('aria-controls');
            const content = document.getElementById(contentId);
  
            if (content) {
              isExpanded ? content.setAttribute('hidden', '') : content.removeAttribute('hidden');
            }
          }
        });
      });
		} else {
			console.warn('Product options container not found, accordion functionality may not work properly');
		}
	}

	detectColorPicker() {
		const paintColorHidden = document.getElementById('custom-color-paint-hidden');
		const vinylColorHidden = document.getElementById('custom-color-vinyl-hidden');
		const customColorTrigger = document.getElementById('custom-color-trigger');
		const customColorInput = document.querySelector('.custom-color-input');
		const colorOptionsContainer = document.querySelector('.color_options_container');
		const optionSelectedContainer = document.querySelector('.option_selected-container');

		console.log('Custom color components found:', {
			paintColorHidden: !!paintColorHidden,
			vinylColorHidden: !!vinylColorHidden,
			customColorTrigger: !!customColorTrigger,
			customColorInput: !!customColorInput,
			colorOptionsContainer: !!colorOptionsContainer,
			optionSelectedContainer: !!optionSelectedContainer
		});

		const selectedColorOptions = document.querySelectorAll('.product-options__swatch-input[field-name*="color"]:checked');

		if (selectedColorOptions.length > 0) {
			selectedColorOptions.forEach((option, index) => {
				const optionTitle = option.getAttribute('field-name');
				const wrapper = option.closest('.product-options__swatch-wrapper');
				const variantTitle = wrapper.querySelector('.product-options__swatch-title').textContent;
				console.log(`Selected color option #${index + 1}:`, {
					optionTitle,
					variantTitle,
					value: option.value
				});
			});
		}
	}

	initOptionSelectors() {
		const productOptionsContainer = document.querySelectorAll('.product-options__swatch-wrapper ');
		if (productOptionsContainer) {
      productOptionsContainer.forEach(item => {
        item.addEventListener('change', (event) => {
          const input = event.target.closest(this.selectors.radioInputs);
  
          if (input && input.checked) {
            document.querySelectorAll(this.selectors.quantitySelectors).forEach(selector => {
              selector.style.display = 'none';
            });
            const optionTitle = input.getAttribute('field-name');
            const isColorOption = optionTitle && optionTitle.toLowerCase().includes('color');
  
            if (!isColorOption) {
              const wrapper = input.closest('.product-options__swatch-wrapper');
              const quantitySelector = wrapper?.querySelector(this.selectors.quantitySelectors);
              if (quantitySelector) {
                quantitySelector.style.display = 'flex';
              }
            }
            this.updateSelectedOptions();
            this.updateAccordionLabel(input);
          }
        });
        if (item.getAttribute('data-default') === 'default') {
          item.click();
        }
      });
		} else {
			console.warn('Контейнер опций продукта не найден, функциональность селекторов опций может работать неправильно');
		}
	}

	updateAccordionLabel(input) {
		const wrapper = input.closest('.product-options__swatch-wrapper');
		const variantTitle = wrapper.querySelector('.product-options__swatch-title').textContent;
		const priceElement = wrapper.querySelector('.product-options__swatch-price');
		const price = priceElement ? priceElement.textContent : '';
		const accordionContent = input.closest('.product-options__accordion-content');
		const accordionHeader = accordionContent.previousElementSibling;
		const accordionLabel = accordionHeader.querySelector('.product-options__accordion-label');
		const accordionLabelTitle = accordionLabel.querySelector('.product-options__accordion-label-title');
		const accordionLabelPrice = accordionLabel.querySelector('.product-options__accordion-label-price');
		if (accordionLabelTitle) accordionLabelTitle.textContent = variantTitle;
		if (accordionLabelPrice) accordionLabelPrice.textContent = price;
		accordionLabel.setAttribute('data-default', wrapper.getAttribute('data-default'));
		accordionLabel.style.display = 'flex';
		const titleSvg = accordionHeader.querySelector('.product-options__subcategory-title svg');

		if (titleSvg) {
			// Button--popup remains visible
		}

		if (priceElement && accordionLabelPrice) {
			accordionLabelPrice.setAttribute('data-base-price', priceElement.getAttribute('avis-price'));
			const quantityInput = wrapper.querySelector('.product-options__quantity-input');
			if (quantityInput && parseInt(quantityInput.value) > 1) {
				this.updateAccordionLabelPrice(input);
			}
		}
	}

	updateAccordionLabelPrice(input) {
		const wrapper = input.closest('.product-options__swatch-wrapper');
		const priceElement = wrapper.querySelector('.product-options__swatch-price');
		const quantityInput = wrapper.querySelector('.product-options__quantity-input');
		const accordionContent = input.closest('.product-options__accordion-content');
		const accordionHeader = accordionContent.previousElementSibling;
		const accordionLabel = accordionHeader.querySelector('.product-options__accordion-label');
		const accordionLabelPrice = accordionLabel.querySelector('.product-options__accordion-label-price');

		if (priceElement && accordionLabelPrice && quantityInput) {
			const basePrice = parseFloat(accordionLabelPrice.getAttribute('data-base-price').replace(/,/g, '')) || 0;
			const quantity = parseInt(quantityInput.value) || 1;
			const totalPrice = basePrice * quantity;
			const formattedPrice = totalPrice.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD'
			});

			accordionLabelPrice.textContent = formattedPrice;
		}
	}

	/*initQuantityControls() {
		document.querySelectorAll(this.selectors.minusButtons).forEach(button => {
			button.disabled = true;
		});

		const productOptionsContainer = document.querySelector('body');

		if (productOptionsContainer) {
			productOptionsContainer.addEventListener('change', (event) => {
				const input = event.target.closest('.product-options__quantity-input');
				if (input) {
					const wrapper = input.closest('.product-options__swatch-wrapper');
					const radioInput = wrapper.querySelector('.product-options__swatch-input');
					const minusButton = input.parentNode.querySelector(this.selectors.minusButtons);
					if (parseInt(input.value) < 1) {
						input.value = 1;
					}

					this.updateMinusButtonState(input, minusButton);
					this.updateSelectedOptions();

					if (radioInput && radioInput.checked) {
						this.updateAccordionLabelPrice(radioInput);
					}
				}
			});
			productOptionsContainer.addEventListener('click', (event) => {
				const plusButton = event.target.closest(this.selectors.plusButtons);
				if (plusButton) {
					const input = plusButton.parentNode.querySelector('.product-options__quantity-input');
					const minusButton = plusButton.parentNode.querySelector(this.selectors.minusButtons);

					input.value = parseInt(input.value) + 1;
					this.updateMinusButtonState(input, minusButton);
					this.updateSelectedOptions();

					const wrapper = plusButton.closest('.product-options__swatch-wrapper');
					const radioInput = wrapper.querySelector('.product-options__swatch-input');
					if (radioInput && radioInput.checked) {
						this.updateAccordionLabelPrice(radioInput);
					}
					return;
				}
				const minusButton = event.target.closest(this.selectors.minusButtons);
				if (minusButton && !minusButton.disabled) {
					const input = minusButton.parentNode.querySelector('.product-options__quantity-input');

					if (parseInt(input.value) > 1) {
						input.value = parseInt(input.value) - 1;
						this.updateMinusButtonState(input, minusButton);
						this.updateSelectedOptions();

						const wrapper = minusButton.closest('.product-options__swatch-wrapper');
						const radioInput = wrapper.querySelector('.product-options__swatch-input');
						if (radioInput && radioInput.checked) {
							this.updateAccordionLabelPrice(radioInput);
						}
					}
				}
			});
		} else {
			console.warn('Контейнер опций продукта не найден, элементы управления количеством могут работать неправильно');
		}
	}

	updateMinusButtonState(input, minusButton) {
		minusButton.disabled = parseInt(input.value) <= 1;
	}*/

	initRemoveButtons() {
		const productOptionsContainer = document.querySelectorAll('.remove-button-svg');
		if (productOptionsContainer) {
      productOptionsContainer.forEach(item => {
        item.addEventListener('click', (event) => {
          const removeButton = event.target.closest(this.selectors.removeButtons);
  
          if (removeButton) {
            event.stopPropagation();
            const accordionLabel = removeButton.closest('.product-options__accordion-label');
            const accordionHeader = accordionLabel.closest('.product-options__accordion-header');
            const contentId = accordionHeader.getAttribute('aria-controls');
            const accordionContent = document.getElementById(contentId);
            const checkedInput = accordionContent.querySelector(this.selectors.radioInputs + ':checked');

						if (checkedInput) {
							accordionLabel.setAttribute('data-default', '');
              this.removeOption(checkedInput, accordionLabel, accordionHeader);
							const defaultLabel = accordionContent.querySelector('label.product-options__swatch-wrapper[data-default="default"]');
							if (defaultLabel) {
								defaultLabel.click();
							}
            }
          }
        });
      });

		} else {
			console.warn('Контейнер опций продукта не найден, функциональность кнопок удаления может работать неправильно');
		}
	}

	removeOption(checkedInput, accordionLabel, accordionHeader) {
		checkedInput.checked = false;
		const quantitySelector = checkedInput.closest('.product-options__swatch-wrapper')
			.querySelector(this.selectors.quantitySelectors);
		if (quantitySelector) {
			quantitySelector.style.display = 'none';
		}

		accordionLabel.style.display = 'none';
		const accordionLabelTitle = accordionLabel.querySelector('.product-options__accordion-label-title');
		const accordionLabelPrice = accordionLabel.querySelector('.product-options__accordion-label-price');
		if (accordionLabelTitle) accordionLabelTitle.textContent = '';
		if (accordionLabelPrice) accordionLabelPrice.textContent = '';
		const titleSvg = accordionHeader.querySelector('.product-options__subcategory-title svg');
		if (titleSvg) {
			titleSvg.style.display = '';
		}
		this.updateSelectedOptions();
	}

	initPreSelectedOptions() {
		const preCheckedInputs = document.querySelectorAll(this.selectors.radioInputs + ':checked');
		preCheckedInputs.forEach(input => {
			this.updateAccordionLabel(input);
			const optionTitle = input.getAttribute('field-name');
			const isColorOption = optionTitle && optionTitle.toLowerCase().includes('color');
			if (!isColorOption) {
				const wrapper = input.closest('.product-options__swatch-wrapper');
				const quantitySelector = wrapper?.querySelector(this.selectors.quantitySelectors);
				if (quantitySelector) {
					quantitySelector.style.display = 'flex';
				}
			}
		});
	}

	generateUniqueId(suffix = '') {
		return Date.now() + '-' + Math.random().toString(36).substring(2, 15) + (suffix ? '-' + suffix : '');
	}

	isWarrantySelected() {
		const checkedInputs = document.querySelectorAll(this.selectors.radioInputs + ':checked');
		for (const input of checkedInputs) {
			const optionTitle = input.getAttribute('field-name');
			if (optionTitle && optionTitle.toLowerCase().includes('warranty')) {
				return true;
			}
		}
		return false;
	}

	updateSelectedOptions() {
		this.selectedOptions = [];
		let totalPrice = 0;
		const checkedInputs = document.querySelectorAll(this.selectors.radioInputs + ':checked');
		const productOptionsWrapper = document.querySelector('.product-options');
		const productId = productOptionsWrapper ? productOptionsWrapper.getAttribute('data-product-id') : null;
		const groupId = this.generateUniqueId();
		const productInput = document.querySelector('product-form quantity-input input');
		let productQuantity = 1;
		if (productInput) {
			productQuantity = parseInt(productInput.value);
		}
		checkedInputs.forEach(input => {
			const wrapper = input.closest('.product-options__swatch-wrapper');
			const quantityInput = wrapper.querySelector('.product-options__quantity-input');
			const optionTitle = input.getAttribute('field-name');
			const variantId = input.value;
			const variantTitle = wrapper.querySelector('.product-options__swatch-title').textContent;
			const priceElement = wrapper.querySelector('.product-options__swatch-price');
			const price = priceElement ? parseFloat(priceElement.getAttribute('avis-price').replace(/,/g, '')) : 0;

			let quantity = 1;
			if (!optionTitle.toLowerCase().includes('color') && quantityInput) {
				quantity = parseInt(quantityInput.value);
			}

			const isColorOption = optionTitle && optionTitle.toLowerCase().includes('color');
			const isColorWithPrice = isColorOption && price > 0;

      if (variantId && variantId.trim() !== '') {
				if (isColorOption && !isColorWithPrice) {
					console.log(`Skipping regular color option with price 0: ${optionTitle} - ${variantTitle}`);
				} else if (isColorWithPrice) {
					this.selectedOptions.unshift({
						id: variantId,
						quantity: quantity * productQuantity,
						properties: {
							_parent_product_id: productId,
							// _option_title: optionTitle + ' - ' + variantTitle,
							_unique_key: this.generateUniqueId(variantId),
							_group_id: groupId,
							_is_color_option: true,
							_color_price: price
						}
					});
				} else {
          if (price > 0) {
            this.selectedOptions.unshift({
              id: variantId,
              quantity: quantity * productQuantity,
              properties: {
                _parent_product_id: productId,
                _option_title: optionTitle,
                // _option_title: optionTitle + ' - ' + variantTitle,
                _unique_key: this.generateUniqueId(variantId),
                _group_id: groupId
              }
            });
          }
				}
			}
			// Only add price to total if it's not a color option or if it's a custom color with price
			if (!isColorOption || isColorWithPrice) {
				totalPrice += price * quantity * productQuantity;
			}
		});

		const hasPaintColor = this.customColors && this.customColors.Paint && this.customColors.Paint.value;
		const hasVinylColor = this.customColors && this.customColors.Vinyl && this.customColors.Vinyl.value;

		// Only add the generic Custom Color if neither Paint nor Vinyl colors are selected
		if (!hasPaintColor && !hasVinylColor && this.customColorValue && this.customColorPrice && this.customColorPrice > 0) {
			let customColorVariantId = this.customColorVariantId;
			if (!customColorVariantId) {
				customColorVariantId = this.findCustomColorVariantId('Color');
			}

			if (customColorVariantId) {
				this.selectedOptions.push({
					id: customColorVariantId,
					quantity: 1 * productQuantity,
					properties: {
						_parent_product_id: productId,
						_option_title: `Custom Color - ${this.customColorValue}`,
						_unique_key: this.generateUniqueId(customColorVariantId + '-Custom_Color'),
						_group_id: groupId,
						_is_color_option: true,
						_color_price: this.customColorPrice,
						'Custom Color': this.customColorValue
					}
				});
				totalPrice += this.customColorPrice * productQuantity;
			}
		}

		// Then check for specific color types (Paint, Vinyl)
		if (this.customColors) {
			// Process Paint color
			if (this.customColors.Paint && this.customColors.Paint.value) {
				let paintColorVariantId = this.findCustomColorVariantId('Paint Color');
				if (paintColorVariantId) {
					// Only add Paint color if it has a price > 0
					if (this.customColors.Paint.price > 0) {
						this.selectedOptions.push({
							id: paintColorVariantId,
							quantity: 1 * productQuantity,
							properties: {
								_parent_product_id: productId,
								_option_title: `Paint Color - ${this.customColors.Paint.value}`,
								_unique_key: this.generateUniqueId(paintColorVariantId + '-Paint_Color'),
								_group_id: groupId,
								_is_color_option: true,
								_color_price: this.customColors.Paint.price,
								'Paint Color': this.customColors.Paint.value
							}
						});
						totalPrice += this.customColors.Paint.price * productQuantity;
					} else {
						console.log(`Skipping Paint color option with price 0: ${this.customColors.Paint.value}`);
					}
				}
			}

			// Process Vinyl color
			if (this.customColors.Vinyl && this.customColors.Vinyl.value) {
				let vinylColorVariantId = this.findCustomColorVariantId('Vinyl Color');
				if (vinylColorVariantId) {
					// Only add Vinyl color if it has a price > 0
					if (this.customColors.Vinyl.price > 0) {
						this.selectedOptions.push({
							id: vinylColorVariantId,
							quantity: 1 * productQuantity,
							properties: {
								_parent_product_id: productId,
								_option_title: `Vinyl Color - ${this.customColors.Vinyl.value}`,
								_unique_key: this.generateUniqueId(vinylColorVariantId + '-Vinyl_Color'),
								_group_id: groupId,
								_is_color_option: true,
								_color_price: this.customColors.Vinyl.price,
								'Vinyl Color': this.customColors.Vinyl.value
							}
						});
						totalPrice += this.customColors.Vinyl.price * productQuantity;
					} else {
						console.log(`Skipping Vinyl color option with price 0: ${this.customColors.Vinyl.value}`);
					}
				}
			}
		}

		this.updatePriceDisplay(totalPrice);

		if (productId) {
			this.addMainProductToOptions(productId, groupId, checkedInputs);
		}

		return this.selectedOptions;
	}

	addMainProductToOptions(productId, groupId, checkedInputs) {
    // add here options for cart transform function
		const quantityInput = document.querySelector('product-form .quantity__input');
		const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

		const properties = {
			_unique_key: this.generateUniqueId(productId),
			_group_id: groupId
		};
		//this.extractMetainfo(properties);
		this.inputToProperties(properties);
		// this.addVariantsToProperties(properties, checkedInputs);
		this.ensureColorProperty(properties, checkedInputs);


		const mainProductObj = {
			id: productId,
			quantity: quantity,
			properties: properties
		};
		this.selectedOptions.push(mainProductObj);
	}

	inputToProperties(properties) {
		const basicOptions = document.querySelectorAll('.product-options__accordion[data-type="Basic"], .product-options__accordion[data-type="Assembly & Room of Choice Installation Needed?"]');
		basicOptions.forEach(option => {
			const optionWrapper = option.querySelector('.product-options__swatch');
			const optionInput = optionWrapper.querySelectorAll('input');
			let optionName = '';
			let optionValue = '';
			let optionPrice = '';
			if (optionInput) {
				if (optionInput.length === 1) {
					optionPrice = parseFloat(optionWrapper.querySelector('.product-options__swatch-price').getAttribute('avis-price'));
					if (optionPrice === 0) {
						optionName = optionInput[0].getAttribute('field-name');
						optionValue = optionWrapper.querySelector ('.product-options__swatch-title').innerText;
						properties[optionName] = optionValue;
					}
				} else {
					optionInput.forEach(currentInput => {
						if (currentInput.checked) {
							optionPrice = parseFloat(currentInput.nextElementSibling.getAttribute('avis-price'));
							if (optionPrice === 0) {
								optionName = currentInput.getAttribute('field-name');
								optionValue = currentInput.nextElementSibling.nextElementSibling.innerText;
								properties[optionName] = optionValue;
							}
						}
					});
				}
			}
		});
	}

	ensureColorProperty(properties, checkedInputs) {
		let colorFound = false;
		let paintColorFound = false;
		let vinylColorFound = false;

		// Check for Paint custom color
		const paintColorHidden = document.getElementById('custom-color-paint-hidden');
		if (paintColorHidden && paintColorHidden.value) {
			properties['Paint Color'] = paintColorHidden.value;
			paintColorFound = true;
			colorFound = true;
		}

		// Check for Vinyl custom color
		const vinylColorHidden = document.getElementById('custom-color-vinyl-hidden');
		if (vinylColorHidden && vinylColorHidden.value) {
			properties['Vinyl Color'] = vinylColorHidden.value;
			vinylColorFound = true;
			colorFound = true;
		}

		// Check for selected color options from radio inputs
		checkedInputs.forEach(input => {
			const optionTitle = input.getAttribute('field-name');
			if (optionTitle && optionTitle.toLowerCase().includes('color')) {
				const wrapper = input.closest('.product-options__swatch-wrapper');
				const variantTitle = wrapper.querySelector('.product-options__swatch-title').textContent;

				// Add the specific color property (e.g., 'Paint Color', 'Vinyl Color')
				properties[optionTitle] = variantTitle;

				// Track which types of colors we've found
				if (optionTitle.toLowerCase().includes('paint')) {
					paintColorFound = true;
				} else if (optionTitle.toLowerCase().includes('vinyl')) {
					vinylColorFound = true;
				}
				colorFound = true;
			}
		});

		// Check for selected colors in the custom color picker UI
		const paintColorSelected = document.querySelector('.group-color-container[data-group-color-name="Paint"] .option_selected');
		const vinylColorSelected = document.querySelector('.group-color-container[data-group-color-name="Vinyl"] .option_selected');

		if (!paintColorFound && paintColorSelected && paintColorSelected.textContent) {
			properties['Paint Color'] = paintColorSelected.textContent;
			paintColorFound = true;
			colorFound = true;
		}

		if (!vinylColorFound && vinylColorSelected && vinylColorSelected.textContent) {
			properties['Vinyl Color'] = vinylColorSelected.textContent;
			vinylColorFound = true;
			colorFound = true;
		}

		// If no specific color was found, try to use the Shopify color selector
		if (!colorFound && this.selectedShopifyColor) {
			properties['Color'] = this.selectedShopifyColor;
		}

		// If still no color found, try to find it from color swatches
		if (!colorFound) {
			const colorElements = document.querySelectorAll('.swatch-element.color.active, .color-swatch--selected');
			if (colorElements.length > 0) {
				const selectedColorElement = colorElements[0];
				const colorValue = selectedColorElement.getAttribute('data-value') ||
					selectedColorElement.getAttribute('title') ||
					selectedColorElement.textContent.trim();

				if (colorValue) {
					properties['Color'] = colorValue;
				}
			}
		}
	}

	extractMetainfo(properties) {
		const metainfoWrapper = document.querySelector('.metainfo-wrapper');

		if (metainfoWrapper) {
			const metainfoItems = metainfoWrapper.querySelectorAll('.item');
			metainfoItems.forEach(item => {
				const titleElement = item.querySelector('.title');
				const textElement = item.querySelector('.item__text');
				if (titleElement && textElement && titleElement.getAttribute('data-property')) {
					const title = titleElement.textContent.replace(':', '').trim();
					if (title !== 'Warranty' || !this.isWarrantySelected()) {
						properties[title] = titleElement.getAttribute('data-property');
					}
				}
			});
		}
	}

	updatePriceDisplay(totalPrice) {
		const selectors = this.selectors.priceElements;
		const totalPriceElement = document.querySelector(selectors.totalPrice);
		const totalAddElement = document.querySelector(selectors.totalAdd);
		const totalAddChargeInput = document.querySelector(selectors.totalAddCharge);

		if (totalPrice > 0) {
			const formattedPrice = totalPrice.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD'
			});
			if (totalPriceElement) totalPriceElement.textContent = formattedPrice;
			if (totalAddElement) totalAddElement.classList.remove('product-options__total-add--hide');
			if (totalAddChargeInput) totalAddChargeInput.value = totalPrice;

			this.updateProductPriceElements(totalPrice);
		} else {
			if (totalPriceElement) totalPriceElement.textContent = '$0.00';
			if (totalAddElement) totalAddElement.classList.add('product-options__total-add--hide');
			if (totalAddChargeInput) totalAddChargeInput.value = 0;
			this.resetProductPriceElements();
		}
	}

	updateProductPriceElements(totalPrice) {
		const selectors = this.selectors.priceElements;
		this.updatePriceGroup(document.querySelectorAll(selectors.priceItems), totalPrice);
		this.updatePriceGroup(document.querySelectorAll(selectors.customPrices), totalPrice);
	}

	updatePriceGroup(elements, totalPrice) {
		elements.forEach(element => {
			let basePrice = parseFloat(element.getAttribute('data-base-price') || 0);
			if (!element.hasAttribute('data-base-price')) {
				const currentPrice = parseFloat(element.textContent.replace(/[^0-9.]/g, '')) || 0;
				element.setAttribute('data-base-price', currentPrice);
				basePrice = currentPrice;
			}
			const newPrice = basePrice + totalPrice;
			element.textContent = newPrice.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD'
			});
		});
	}

	resetProductPriceElements() {
		const selectors = this.selectors.priceElements;
		this.resetPriceGroup(document.querySelectorAll(selectors.priceItems));
		this.resetPriceGroup(document.querySelectorAll(selectors.customPrices));
	}

	resetPriceGroup(elements) {
		elements.forEach(element => {
			if (element.hasAttribute('data-base-price')) {
				const basePrice = parseFloat(element.getAttribute('data-base-price'));
				element.textContent = basePrice.toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD'
				});
			}
		});
	}

	initAddToCartButton() {
		const addToCartButton = document.querySelector(this.selectors.addToCartButton);
		if (addToCartButton) {
			const originalClickHandler = addToCartButton.onclick;
			addToCartButton.onclick = (event) => {
				event.preventDefault();

				// Reset custom color properties
				this.customColorValue = null;
				this.customColorPrice = null;
				this.customColorVariantId = null;
				this.customColors = {};

				// Check for Paint color
				this.checkCustomColor('Paint');

				// Check for Vinyl color
				this.checkCustomColor('Vinyl');

				// If no custom colors were found, check the Shopify color selector
				if (!this.customColors.Paint && !this.customColors.Vinyl) {
					this.checkShopifyColorSelector();
				}

        		const options = this.updateSelectedOptions();

				if (!options || options.length === 0) {
					if (originalClickHandler) {
						return originalClickHandler.call(addToCartButton, event);
					}
					return true;
				}
				this.addItemsToCart(options, addToCartButton);
				return false;
			};
		}
	}

	checkCustomColor(colorType) {
		// Check for selected color in the UI
		const colorContainer = document.querySelector(`.group-color-container[data-group-color-name="${colorType}"]`);
		if (!colorContainer) return;

		const selectedColorElement = colorContainer.querySelector('.option_selected');
		const selectedColorPriceElement = colorContainer.querySelector('.option_selected-price');

		if (selectedColorElement && selectedColorElement.textContent) {
			// Store the color information
			if (!this.customColors) this.customColors = {};
			this.customColors[colorType] = {
				value: selectedColorElement.textContent.replace('Color', '').replace('Custom Color', '').replace(':', '').trim(),
				price: selectedColorPriceElement ? this.extractPrice(selectedColorPriceElement.textContent) : 0
			};

			// We no longer set the main custom color properties for backward compatibility
			// because we're handling Paint and Vinyl colors separately
			// This prevents duplication of the generic "Custom Color" item
		}
	}

	extractPrice(priceText) {
		if (!priceText) return 0;

		// Убираем символ доллара и любые пробелы
		let cleanPrice = priceText.replace(/[$\s,]/g, '');

		// Преобразуем в число с плавающей точкой
		const price = parseFloat(cleanPrice);

		// Проверяем, что получили действительное число
		return isNaN(price) ? 0 : price;
	}

	findCustomColorVariantId(colorType) {
		// First, try to find the variant ID from the custom color picker
		const colorTypeLC = colorType.toLowerCase();
		const isPaint = colorTypeLC.includes('paint');
		const isVinyl = colorTypeLC.includes('vinyl');

		// Check if we have a custom color container for this type
		const containerSelector = isPaint ?
			'.group-color-container[data-group-color-name="Paint"]' :
			(isVinyl ? '.group-color-container[data-group-color-name="Vinyl"]' : null);

		if (containerSelector) {
			const container = document.querySelector(containerSelector);
			if (container) {
				// First try to get the variant ID from the custom color hidden input
				const groupType = isPaint ? 'paint' : (isVinyl ? 'vinyl' : '');
				const customColorHidden = document.getElementById(`custom-color-${groupType}-hidden`);
				if (customColorHidden && customColorHidden.hasAttribute('data-variant')) {
					const variantId = customColorHidden.getAttribute('data-variant');
					if (variantId) {
						console.log(`Found variant ID ${variantId} for ${colorType} from custom-color-${groupType}-hidden`);
						return variantId;
					}
				}

				// If no variant ID found in hidden input, try the custom color value input
				const customColorValue = container.querySelector('.custom-color-value');
				if (customColorValue && customColorValue.hasAttribute('data-id')) {
					const variantId = customColorValue.getAttribute('data-id');
					console.log(customColorValue)
					if (variantId) {
						console.log(`Found variant ID ${variantId} for ${colorType} from custom-color-value`);
						return variantId;
					}
				}
			}
		}

		// If we couldn't find the variant ID from the custom color picker,
		// try to find it from the product options
		const customColorProducts = document.querySelectorAll(`.product-options__accordion[data-type="Options"]`);
		for (const elem of customColorProducts) {
			const titleElement = elem.querySelector('.product-options__subcategory-title');
			if (titleElement && titleElement.textContent.includes(colorType)) {
				const container = elem.querySelector('.product-options__swatch-container');
				if (container) {
					const inputs = container.querySelectorAll('input[type="radio"]');
					for (const input of inputs) {
						const titleSpan = input.parentElement.querySelector('.product-options__swatch-title');
						if (titleSpan && titleSpan.textContent.includes('Custom')) {
							console.log(`Found variant ID ${input.value} for ${colorType} from product options`);
							return input.value;
						}
					}
				}
			}
		}

		// If we still couldn't find the variant ID, try a more general search
		const allInputs = document.querySelectorAll('input[type="radio"]');
		for (const input of allInputs) {
			const fieldName = input.getAttribute('field-name');
			if (fieldName && fieldName.toLowerCase().includes(colorTypeLC)) {
				const titleSpan = input.parentElement.querySelector('.product-options__swatch-title');
				if (titleSpan && titleSpan.textContent.includes('Custom')) {
					console.log(`Found variant ID ${input.value} for ${colorType} from general search`);
					return input.value;
				}
			}
		}

		console.log(`Could not find variant ID for ${colorType}`);
		return null;
	}

	checkShopifyColorSelector() {
		const colorSelector = document.querySelector('select[name="Color"], select[name="color"]');
		if (colorSelector) {
			const selectedColor = colorSelector.value;
			console.log('Found Shopify color selector, selected color:', selectedColor);
			this.selectedShopifyColor = selectedColor;
		} else {
			const checkedColorInput = document.querySelector('input[type="radio"][name="Color"]:checked, input[type="radio"][name="color"]:checked');
			if (checkedColorInput) {
				const selectedColor = checkedColorInput.value;
				console.log('Found Shopify color radio input, selected color:', selectedColor);
				this.selectedShopifyColor = selectedColor;
			}
		}
	}

	addItemsToCart(items, addToCartButton) {
		const loadingSpinner = document.querySelector('.loading__spinner');
		if (loadingSpinner) loadingSpinner.classList.remove('hidden');
		if (addToCartButton) addToCartButton.disabled = true;
		const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
		const formData = {items};
		console.log(formData)
		if (cart && typeof cart.getSectionsToRender === 'function') {
			formData.sections = cart.getSectionsToRender().map((section) => section.id);
			formData.sections_url = window.location.pathname;
		}

		fetch(window.Shopify.routes.root + 'cart/add.js', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(response => {
				if (window.location.pathname.includes('/cart')) {
					window.location.reload();
					return;
				}
				if (cart && typeof cart.renderContents === 'function') {
					cart.renderContents(response);
				} else {
					window.location.href = window.Shopify.routes.root + 'cart';
				}
			})
			.catch((error) => {
				console.error('Error:', error);
				const errorMessageWrapper = document.querySelector('.product-form__error-message-wrapper');
				const errorMessage = document.querySelector('.product-form__error-message');
				if (errorMessageWrapper && errorMessage) {
					errorMessage.textContent = 'Error adding product to cart. Please try again.';
					errorMessageWrapper.removeAttribute('hidden');
					setTimeout(() => {
						errorMessageWrapper.setAttribute('hidden', '');
					}, 5000);
				}
			})
			.finally(() => {
				if (loadingSpinner) loadingSpinner.classList.add('hidden');
				if (addToCartButton) addToCartButton.disabled = false;
			});
	}
}

document.addEventListener('DOMContentLoaded', () => {
	if (typeof window.productConfiguratorInitialized === 'undefined') {
		window.productConfiguratorInitialized = true;
		new ProductConfigurator();
	}
});

async function fetchProductByOptionCategory(optionCategoryId, title) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/productbyoptioncategory?optionCategoryId=${optionCategoryId}&title=${title}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch product by title');
		}

		const data = await response.json();
		return data[0];
	} catch (error) {
		console.error('Error fetching product by title:', error);
		return null;
	}
}

function removeEmptyElements(element) {
	const elements = element.querySelectorAll('p, div');
	elements.forEach((el) => {
		if (
			(!el.textContent.trim() && el.children.length === 0) ||
			el.innerHTML.trim() === '<br>' ||
			el.innerHTML.trim() === '<br><br>' ||
			(!el.textContent.trim() && el.innerHTML.trim().match(/^<br\s*\/?>$/i))
		) {
			el.remove();
		}
	});

	//const brElements = element.querySelectorAll('br');
	//brElements.forEach((br) => br.remove());

	const h5Elements = element.querySelectorAll('h5');
	h5Elements.forEach((h5) => h5.remove());

	const h6Elements = element.querySelectorAll('h6');
	h6Elements.forEach((h6) => h6.remove());
}

function clearImages(element) {
	const images = element.querySelectorAll('img');
	images.forEach((img) => {
		if (img.parentElement) {
			img.parentElement.remove();
		} else {
			img.remove();
		}
	});
}

function renderOptionPopupProducts(product) {
	let contentHTML = `
		<div class="option-title">
		<h2>ABOUT OPTIONS - ${product.title.replace(/\(\d+\)/g, "")}</h2>
		</div>
		<div class="option-products">
			<div class="product-cards">`;

		product.relatedProducts.forEach((prod) => {
		const originalPrice = parseFloat(prod.price);
		const price =
			Shopify.country !== 'US'
				? (originalPrice * Shopify.currency.rate).toFixed(2)
				: originalPrice.toFixed(2);
		contentHTML += `
			<div class="product-card" data-product-id="${prod.id}">
				<div class="product-card__img">
					<img src="${prod.imageUrl}" alt="${prod.title}" />
				</div>
				<h4 class="product-card__title">${prod.title.replace(/\(\d+\)/g, "")}</h4>
				<div class="product-card__mid">
					<span class="product-card__code">#${prod.sku}</span>
					<span class="product-card__price">
						${'$' + price}
					</span>
				</div>
				<p class="product-card__description">${prod.shortDescription.substring(0, 150)}...</p>
				<a class="read-more-btn" data-id="${prod.id}">Read more</a>
			</div>
		`;
	});

	const productDetailsHTML = `
		</div>
		<div class="product-details">
			<div class="product-details-container"></div>
			<div class="product-details-description-body"></div>
		</div>
	`;

	contentHTML += productDetailsHTML;
	contentHTML += '</div>';

	return contentHTML;
}

async function setupOptionsPopup(optionCategoryId, encodedProductTitle) {
	const container = document.getElementById('dynamic-product-content');
	const modalWrapper = document.querySelector('.modal-wrapper');
	const closeIconTemplate = document.getElementById('icon-close-template').innerHTML;
	
	document.querySelector('#dynamic-product-content').style.width = 'auto';
	modalWrapper.style.display = 'flex';
	container.innerHTML = '';

	let optionHTML = '';

	const product = await fetchProductByOptionCategory(optionCategoryId, encodedProductTitle);

	if (!product) {
		return;
	}

	if (!product.relatedProducts || product.relatedProducts.length === 0) {
		optionHTML = product.descriptionHtml;
	} else {
		var relatedProductsHtml = renderOptionPopupProducts(product);
		optionHTML = relatedProductsHtml
	}

	if (optionHTML) {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = optionHTML;
		const mainContent = tempDiv;
		if (mainContent) {
			container.innerHTML =
				mainContent.innerHTML + `<span class="modal-close">${closeIconTemplate}</span>`;
			const closeModalButton = document.querySelector('.modal-close');
			closeModalButton.addEventListener('click', () => {
				modalWrapper.style.display = 'none';
			});

			const scripts = mainContent.querySelectorAll('script');
			scripts.forEach((script) => {
				const newScript = document.createElement('script');
				if (script.src) {
					newScript.src = script.src;
				} else {
					newScript.textContent = script.textContent;
				}
				document.body.appendChild(newScript);
			});

			const modalImgs = container.querySelectorAll('#dynamic-product-content img');
			modalImgs.forEach((img) => {
				const src = img.src;
				const fileName = src.split('/').pop();
				const newSrc = `https://cdn.shopify.com/s/files/1/0884/2012/2940/files/${fileName}`;
				img.src = newSrc;
			});

			const productCards = document.querySelectorAll('.product-card');
			if (productCards) {
				productCards.forEach((p) => {
					const productId = p.getAttribute('data-product-id');
					const productObj = product.relatedProducts.find((x) => x.id === productId);

					if (productObj) {
						p.addEventListener('click', (e) => {
							const currentP = e.currentTarget;
							const siblingsArray = [...currentP.parentElement.children].filter(
								(child) => child !== currentP.parentElement
							);
							siblingsArray.forEach((item) => item.classList.remove('active'));
							currentP.classList.add('active');

							const shortDescription = productObj.shortDescription;

							const productDetailsHTML = `
										<div class="product-details__product-image">
											<img src="${productObj.imageUrl}" alt="${productObj.title}">
										</div>
										<div class="product-details__product-info">
											<h2 class="product-details__title">${productObj.title}</h2>
											<p class="product-details__short_description">${shortDescription}</p>
										</div>`;

							const productDetailsContainer = document.querySelector('.product-details-container');
							const productDetailsDescriptionBody = document.querySelector('.product-details-description-body');
							productDetailsContainer.style.display = 'flex';
							productDetailsDescriptionBody.style.display = 'block';
							productDetailsContainer.innerHTML = productDetailsHTML;

							const productDetailsDescriptionBodyDiv = document.createElement('div');
							productDetailsDescriptionBodyDiv.innerHTML =
								productObj.descriptionHtml.replace(shortDescription, '');
							removeEmptyElements(productDetailsDescriptionBodyDiv);
							clearImages(productDetailsDescriptionBodyDiv);
							productDetailsDescriptionBody.innerHTML = productDetailsDescriptionBodyDiv.innerHTML;
						});
					}
				});
				productCards[0]?.click();
			}
		} else {
			console.error('MainContent not found in the fetched HTML.');
		}
	}
}
