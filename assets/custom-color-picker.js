/**
 * Extension of color selection functionality
 * This code adds event handlers for all swatches and fixes display issues
 */
// Constants for selectors - defined globally so they can be accessed by reinitializeColorPicker
const SELECTORS = {
	groupColorContainer: '.group-color-container',
	paintColorInput: 'input[name="Paint Color"]',
	vinylColorInput: 'input[name="Vinyl Color"]',
	customColorGroup: '.custom-color-group',
	optionsHeading: '.custom-color-group .options_heading'
};

document.addEventListener('DOMContentLoaded', function () {

	const colorUtils = {
		colorMap: {
			black: "#000000", white: "#FFFFFF", red: "#660F0A", green: "#008000",
			blue: "#3E77AA", yellow: "#EEB241", cyan: "#00FFFF", magenta: "#FF00FF",
			gray: "#808080", silver: "#E5E5E5", orange: "#FFA500", purple: "#800080",
			pink: "#FFC0CB", lime: "#00FF00", navy: "#000080", teal: "#008080",
			maroon: "#800000", burgundy: "#800020"
		},

		getHexFromName(name) {
			const normalized = (name || "").trim().toLowerCase();
			return this.colorMap[normalized] || "#000000";
		},

        // paintColorElement?.click();
        // vinylColorElement?.click();
 
        const paintColorAvisEl = Array.from(
            document.querySelectorAll('.ap-options__swatch-container .apo-title')
          ).find(el => el.textContent.trim() === 'Paint Color');
          
          const vinylColorAvisEl = Array.from(
            document.querySelectorAll('.ap-options__swatch-container .apo-title')
          ).find(el => el.textContent.trim() === 'Vinyl Color');
          
          const customPaintColor = Array.from(
            document.querySelectorAll('.group-color .apo-title')
          ).find(el => el.textContent.trim() === 'Paint Color');
          
          const customVinylColor = Array.from(
            document.querySelectorAll('.group-color .apo-title')
          ).find(el => el.textContent.trim() === 'Vinyl Color');
          
          function applyHandleClass(sourceEl, targetEl) {
            if (!sourceEl || !targetEl) {
                targetEl.querySelector('svg').style.display = 'none';
                return
            };
          
            let parent = sourceEl;
            while (parent && ![...parent.classList].some(cls => cls.startsWith('handle-'))) {
              parent = parent.parentElement;
            }
          
            if (parent) {
              const handleClass = parent.className
                .split(/\s+/)
                .find(cls => cls.startsWith('handle-'));
          
              if (handleClass) {
                targetEl.classList.add(handleClass);
                setTimeout(setupOptionsPopup);
              } 
            } else {
                targetEl.querySelector('.paint-color-popup-icon').style.display = 'none';
            }
          }
          
          applyHandleClass(paintColorAvisEl, customPaintColor);
          applyHandleClass(vinylColorAvisEl, customVinylColor);
          

        if (groupColorContainer) {
            groupColorContainer.forEach((colorGroupElement, colorGroupElementIndex) => {
                const groupColorName = colorGroupElement.getAttribute('data-group-color-name');
                if (groupColorName == "Paint") {
                    if (!paintColorElement && !window.product.tags.includes('has_custom_paint')) {
                        colorGroupElement.classList.add('hidden');
                    }
                }
                else if (groupColorName == "Vinyl") {
                    if (!vinylColorElement && !window.product.tags.includes('has_custom_vinyl')) {
                        colorGroupElement.classList.add('hidden');
                    }
                }
                if (groupColorName) {
                    const selectedColorElement = colorGroupElement.querySelector('.option_selected');
                    const selectedColorPriceElement = colorGroupElement.querySelector('.option_selected-price');
                    const selectedColorInfo = colorGroupElement.querySelector('.option_selected-container');
                    const closeSelectedInfoBtn = colorGroupElement.querySelector('svg:not(.paint-color-popup-icon)');
                    const colorOptionsContainer = colorGroupElement.querySelector('.color-options-container');
                    const apoColors = document.querySelectorAll(`.ap-options__swatch-container input[field-name="${groupColorName} Color"]`);
                    const swatchContainer = colorGroupElement.querySelector('.color-options');

			const hexes = parts.map(part => this.getHexFromName(part));
			const step = 100 / (hexes.length - 1);
			const stops = hexes
				.map((hex, i) => `${hex} ${Math.round(i * step)}%`)
				.join(", ");
			return `linear-gradient(to right, ${stops})`;
		}
	};

	// Class for managing the custom color form
	class CustomColorManager {
		// Static property to track the currently open form
		static currentOpenForm = null;

		constructor(colorGroupElement, groupColorName) {
			this.colorGroupElement = colorGroupElement;
			this.groupColorName = groupColorName;
			this.groupLowerCase = this.toLowerCaseFirstLetter(groupColorName);

			this.elements = {
				container: colorGroupElement.querySelector('.custom-color-input'),
				input: colorGroupElement.querySelector('.custom-color-value'),
				errorMessage: colorGroupElement.querySelector('.custom-color-error_message'),
				emptyErrorMessage: colorGroupElement.querySelector('.custom-color-empty-error_message'),
				trigger: colorGroupElement.querySelector('.custom-color-trigger'),
				closeIcon: colorGroupElement.querySelector('.custom-color-input-header svg'),
				addButton: colorGroupElement.querySelector('.add-custom-color'),
				wrapper: colorGroupElement.querySelector('.custom-color-wrapper')
			};

                    colorSwatches?.forEach((swatch) => {
                        const colorName = swatch.getAttribute('data-color-name');
                        swatch.addEventListener('click', (event) => {
                            if (event.target.classList.contains('unavailable')) {
                                return;
                            }
                            if (!window.product.available) {
                                return;
                            }
                            if (colorName) {
                                if (selectedColorElement) {
                                    selectedColorElement.textContent = `Color: ${colorName}`;
                                    currentSwatchIndex = [...colorSwatches].indexOf(swatch);
                                    currentColorName = colorName;
                                    let selectedParentGroupContainer;
                                    const selectedGroup = Array.from(document.querySelectorAll('.ap-options__swatch-container .apo-title'))
                                    .find(el => el.textContent.trim() === `${groupColorName} Color`);
                                    if (selectedGroup) {
                                        selectedParentGroupContainer = selectedGroup.closest('.ap-options__swatch-container');
                                    }
                                    if (selectedParentGroupContainer) {
                                        const apoOptionColorSelected = Array.from(selectedParentGroupContainer.querySelectorAll('.option_selected')).find(div => div.textContent === colorName);
                                        if (!apoOptionColorSelected) {
                                            apoColors[currentSwatchIndex]?.parentElement.click();
                                        }
                                    }
                                    customColorInputContainer.style.display = 'none';

		initialize() {
			if (!this.elements.trigger) return;

			this.elements.trigger.addEventListener('click', () => this.showCustomColorForm());
			this.elements.closeIcon?.addEventListener('click', () => this.hideCustomColorForm());
			this.elements.addButton?.addEventListener('click', (event) => this.addCustomColor(event));
		}

		showCustomColorForm() {
			if (CustomColorManager.currentOpenForm && CustomColorManager.currentOpenForm !== this) {
				CustomColorManager.currentOpenForm.hideCustomColorForm();
			}
			CustomColorManager.currentOpenForm = this;

			// Get price from data-price attribute of the input
			const priceValue = this.elements.input?.getAttribute('data-price');
			// Format the price for display
			const customColorAvisCharge = priceValue ? `$${priceValue}` : '';

			if (customColorAvisCharge && this.elements.wrapper) {
				this.elements.wrapper.style.setProperty('--custom-content', `"${customColorAvisCharge}"`);
			}

			this.elements.container.style.display = 'block';
			this.elements.errorMessage.style.display = 'none';
			this.elements.addButton.classList.remove('disabled');
		}

 	hideCustomColorForm(resetPrices = true) {
 		this.elements.container.style.display = 'none';
 		this.elements.input.value = '';
 		if (this.elements.input.hasAttribute('data-variant')) {
 			this.elements.input.removeAttribute('data-variant');
 			console.log('Removed data-variant attribute from custom-color-value input');
 		}
 		this.elements.errorMessage.style.display = 'none';
 		this.elements.addButton.classList.remove('disabled');
 		if (CustomColorManager.currentOpenForm === this) {
 			CustomColorManager.currentOpenForm = null;
 		}

 		if (resetPrices) {
 			const priceItems = document.querySelectorAll('.product__prices .price-item');
 			priceItems.forEach(priceItem => {
 				if (priceItem.hasAttribute('data-base-price')) {
 					const basePrice = parseFloat(priceItem.getAttribute('data-base-price'));
 					priceItem.textContent = basePrice.toLocaleString('en-US', {
 						style: 'currency',
 						currency: 'USD'
 					});
 				}
 			});

 			const customPrices = document.querySelectorAll('.pr_custom_price');
 			customPrices.forEach(customPrice => {
 				if (customPrice.hasAttribute('data-base-price')) {
 					const basePrice = parseFloat(customPrice.getAttribute('data-base-price'));
 					customPrice.textContent = basePrice.toLocaleString('en-US', {
 						style: 'currency',
 						currency: 'USD'
 					});
 				}
 			});
 		}
 	}

		addCustomColor(event) {
			setTimeout(() => {
				const color = this.elements.input?.value?.trim();
				// Get price from data-price attribute of the input
				const priceValue = this.elements.input?.getAttribute('data-price');
				// Get variant ID from data-id attribute of the input
				const variantId = this.elements.input?.getAttribute('data-id');
				console.log('VARIANT ID:', variantId);
				// Format the price for display
				const customColorAvisCharge = priceValue ? `$${priceValue}` : '';
				let customColorVariantId = variantId;
				// Validate input correctness
				if (!this.validateColorInput(color)) return;

				// Logging for debugging
				console.log(`Adding custom color: ${color} for group ${this.groupColorName}`);
				console.log(`Price: ${customColorAvisCharge}`);
				console.log(`Variant ID from data-id: ${variantId}`);


				// Update UI to display the custom color
				this.updateUIWithCustomColor(color, customColorAvisCharge, customColorVariantId);

				// Close the popup after successful addition but don't reset prices
				this.hideCustomColorForm(false);
			});
		}

		validateColorInput(color) {
			if (!color) {
				this.elements.emptyErrorMessage.style.display = 'block';
				this.elements.errorMessage.style.display = 'none';
				return false;
			}

			this.elements.errorMessage.style.display = 'none';
			this.elements.emptyErrorMessage.style.display = 'none';
			return true;
		}

		saveCurrentOptions() {
			const otherOptions = {};
			document.querySelectorAll('.product-options__swatch-input:checked').forEach(input => {
				if (!input.getAttribute('field-name').includes('Color')) {
					otherOptions[input.getAttribute('field-name')] = input.value;
				}
			});
			return otherOptions;
		}

		updateColorOption() {
			const apoColors = document.querySelectorAll(
				`.ap-options__swatch-container input[field-name="${this.groupColorName} Color"]`
			);
			apoColors.forEach((apoColor, index) => {
				if (apoColor.checked) {
					apoColors[index]?.parentElement.click();
				}
			});
		}

		restoreOptions(otherOptions) {
			for (const [fieldName, value] of Object.entries(otherOptions)) {
				const inputs = document.querySelectorAll(`.product-options__swatch-input[field-name="${fieldName}"]`);
				inputs.forEach(input => {
					if (input.value === value && !input.checked) {
						input.checked = true;
						input.dispatchEvent(new Event('change', {bubbles: true}));
					}
				});
			}
		}

		updateUIWithCustomColor(color, priceText, variantId) {
			const selectedColorElement = this.colorGroupElement.querySelector('.option_selected');
			const selectedColorPriceElement = this.colorGroupElement.querySelector('.option_selected-price');
			const selectedColorInfo = this.colorGroupElement.querySelector('.option_selected-container');
			const colorSwatches = this.colorGroupElement.querySelectorAll('.color_options_container .swatch:not(.swatch--custom-trigger)');
			let price = 0;

			console.log(`Updating UI for custom color: ${color}`);

			if (selectedColorElement && color) {
				selectedColorElement.textContent = `Custom Color: ${color}`;
			}

			if (selectedColorPriceElement) {
				selectedColorPriceElement.textContent = priceText;
			}
			if (variantId && this.elements.input) {
				this.elements.input.setAttribute('data-variant', variantId);
				console.log('Updated custom-color-value input with variant ID:', variantId);
			}

			const updatedProductSwatches = this.colorGroupElement.querySelectorAll('.color-options-container input[type=radio]');
			updatedProductSwatches.forEach((input) => (input.checked = false));

			this.elements.addButton.classList.remove('disabled');

			if (selectedColorInfo) {
				selectedColorInfo.style.display = 'flex';
				console.log('Displaying information about the selected color');
			}

			colorSwatches.forEach((x) => x.classList.remove('color-selected'));
			const customTrigger = this.colorGroupElement.querySelector('.swatch--custom-trigger');
			if (customTrigger) {
				customTrigger.classList.add('color-selected');
				customTrigger.setAttribute('data-active-custom-color', color);
				console.log('Custom color button highlighted');
			}
			const groupType = this.groupLowerCase;
			// Find the hidden input relative to the current color group element
			const customColorHidden = this.colorGroupElement.querySelector(`#custom-color-${groupType}-hidden`);
			if (customColorHidden) {
				customColorHidden.value = color;
				console.log(`Updated hidden input custom-color-${groupType}-hidden with custom color:`, color);
				if (variantId) {
					customColorHidden.setAttribute('data-variant', variantId);
					console.log(`Updated data-variant attribute for ${groupType} with variant ID:`, variantId);
				}
				if (priceText) {
					const priceMatch = priceText.match(/\$?(\d+(\.\d+)?)/);
					if (priceMatch) {
						price = parseFloat(priceMatch[1]);
						console.log('Extracted price from priceText:', price);
						if (price > 0) {
							customColorHidden.setAttribute('data-price', price);
							console.log(`Added price attribute to ${groupType} hidden input:`, price);
						}
					}
				}
			}
			if (price > 0) {
				const priceItems = document.querySelectorAll('.product__prices .price-item');
				priceItems.forEach(priceItem => {
					let basePrice = parseFloat(priceItem.getAttribute('data-base-price') || 0);
					if (!priceItem.hasAttribute('data-base-price')) {
						const currentPrice = parseFloat(priceItem.textContent.replace(/[^0-9.]/g, '')) || 0;
						priceItem.setAttribute('data-base-price', currentPrice);
						basePrice = currentPrice;
					}
					const newPrice = basePrice + price;
					priceItem.textContent = newPrice.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD'
					});
				});
				const customPrices = document.querySelectorAll('.pr_custom_price');
				customPrices.forEach(customPrice => {
					let basePrice = parseFloat(customPrice.getAttribute('data-base-price') || 0);
					if (!customPrice.hasAttribute('data-base-price')) {
						const currentPrice = parseFloat(customPrice.textContent.replace(/[^0-9.]/g, '')) || 0;
						customPrice.setAttribute('data-base-price', currentPrice);
						basePrice = currentPrice;
					}
					const newPrice = basePrice + price;
					customPrice.textContent = newPrice.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD'
					});
				});
			}

			if (window.ProductConfigurator) {
				const productOptions = document.getElementById('product-options');
				if (productOptions) {
					const configurator = window.ProductConfigurator.getInstanceForTarget(productOptions);
					if (configurator && configurator.selectedOptions) {
						const mainProductId = productOptions.getAttribute('data-product-id');
						const mainProductIndex = configurator.selectedOptions.findIndex(opt =>
							opt.id.toString() === mainProductId.toString());
						if (mainProductIndex >= 0) {
							configurator.selectedOptions[mainProductIndex].properties[`${this.groupColorName} Color`] =
								`Custom Color: ${color}`;
							console.log('Обновлено свойство основного продукта в конфигураторе');
						}
					}
				}
			}
		}

		updateCartFormProperties(color, priceText) {
			const cartForm = document.querySelector('form[action="/cart/add"]');
			if (!cartForm) {
				console.log('Форма добавления в корзину не найдена');
				return;
			}
			let colorInput = cartForm.querySelector(`input[name="${this.groupColorName} Color"]`);
			if (!colorInput) {
				colorInput = document.createElement('input');
				colorInput.type = 'hidden';
				colorInput.name = `${this.groupColorName} Color`;
				cartForm.appendChild(colorInput);
				console.log(`Создано скрытое поле для ${this.groupColorName} Color`);
			}
			colorInput.value = `Custom Color: ${color}`;
			console.log(`Установлено значение скрытого поля: ${colorInput.value}`);
			if (priceText) {
				let priceInput = cartForm.querySelector(`input[name="${this.groupColorName} Color Price"]`);
				if (!priceInput) {
					priceInput = document.createElement('input');
					priceInput.type = 'hidden';
					priceInput.name = `${this.groupColorName} Color Price`;
					cartForm.appendChild(priceInput);
				}
				priceInput.value = priceText;
			}

			// Если используется ProductConfigurator, нужно найти и обновить соответствующий вариант
			if (window.ProductConfigurator) {
				const productOptions = document.getElementById('product-options');
				if (productOptions) {
					const configurator = window.ProductConfigurator.getInstanceForTarget(productOptions);
					if (configurator && configurator.selectedOptions) {
						const mainProductId = productOptions.getAttribute('data-product-id');

						// Ищем основной продукт в selectedOptions
						const mainProductIndex = configurator.selectedOptions.findIndex(opt =>
							opt.id.toString() === mainProductId.toString());

						if (mainProductIndex >= 0) {
							// Обновляем свойство основного продукта
							configurator.selectedOptions[mainProductIndex].properties[`${this.groupColorName} Color`] =
								`Custom Color: ${color}`;
							console.log('Обновлено свойство основного продукта в конфигураторе');
						}
					}
				}
			}
		}

		triggerInputChange(input) {
			input.value += ' ';
			input.dispatchEvent(new Event('input', {bubbles: true}));
			input.dispatchEvent(new Event('change', {bubbles: true}));
			input.value = input.value.slice(0, -1);
			input.dispatchEvent(new Event('input', {bubbles: true}));
			input.dispatchEvent(new Event('change', {bubbles: true}));
		}

		toLowerCaseFirstLetter(word) {
			return String(word).charAt(0).toLowerCase() + String(word).slice(1);
		}
	}

	// Make CustomColorManager globally accessible
	window.CustomColorManager = CustomColorManager;

	// Класс для управления группой цветов
	class ColorGroupManager {
		constructor(colorGroupElement, index) {
			this.element = colorGroupElement;
			this.index = index;
			this.groupColorName = colorGroupElement.getAttribute('data-group-color-name');
			this.hasPaintColor = !!document.querySelector(SELECTORS.paintColorInput);
			this.hasVinylColor = !!document.querySelector(SELECTORS.vinylColorInput);
			this.initialize();
		}

		initialize() {
			if (!this.groupColorName) return;

			this.checkVisibility();
			this.initializeUIElements();
			this.createColorSwatches();
			this.setupEventListeners();
			this.customColorManager = new CustomColorManager(this.element, this.groupColorName);
		}

 	checkVisibility() {
 		if (this.groupColorName === "Paint" && !this.hasPaintColor) {
 			this.element.classList.add('hidden');
 		} else if (this.groupColorName === "Vinyl" && !this.hasVinylColor ) {
 			this.element.classList.add('hidden');
 		}

 		if (this.hasPaintColor || this.hasCustomPaint || this.hasVinylColor ) {
 			const customColorGroup = this.element.closest(SELECTORS.customColorGroup);
 			if (customColorGroup) {
 				customColorGroup.style.display = 'block';
 			}
 		}
 	}

		initializeUIElements() {
			this.elements = {
				selectedColorElement: this.element.querySelector('.option_selected'),
				selectedColorPriceElement: this.element.querySelector('.option_selected-price'),
				selectedColorInfo: this.element.querySelector('.option_selected-container'),
				closeSelectedInfoBtn: this.element.querySelector('svg'),
				colorOptionsContainer: this.element.querySelector('.color-options-container'),
				swatchContainer: this.element.querySelector('.color-options')
			};

			this.apoColors = document.querySelectorAll(
				`.ap-options__swatch-container input[field-name="${this.groupColorName} Color"]`
			);
		}

		createColorSwatches() {
			if (!this.apoColors || this.apoColors.length === 0) return;

			this.apoColors.forEach((color) => {
				if (!color.value || color.value.includes('Other') || color.value.includes('Custom')) return;

				const isDisabled = color.getAttribute('disabled') === 'disabled';
				const apoTitle = color.parentElement.querySelector('.swatch-variant-title');
				const apoMoneyValue = apoTitle.querySelector('.money');

				const swatchDiv = document.createElement("div");
				swatchDiv.dataset.colorPrice = apoMoneyValue?.textContent ?? "";
				swatchDiv.dataset.colorName = color.value;

				if (isDisabled) {
					swatchDiv.dataset.toolTip = `${color.value} (unavailable or sold-out)`;
					swatchDiv.style.opacity = 0.6;
					swatchDiv.classList.add('unavailable');
				} else {
					swatchDiv.dataset.toolTip = `${color.value} ${swatchDiv.dataset.colorPrice}`;
				}

				swatchDiv.dataset.title = color.value;
				swatchDiv.classList.add('swatch');
				swatchDiv.style.background = colorUtils.buildGradient(color.value);

				this.elements.colorOptionsContainer?.append(swatchDiv);
			});

			this.colorSwatches = this.element.querySelectorAll('.color_options_container .swatch:not(.swatch--custom-trigger)');
		}

		setupEventListeners() {

			this.elements.closeSelectedInfoBtn.addEventListener('click', (event) => this.handleCloseSelectedInfo());

			this.element.querySelector('.group-color').addEventListener('click', (event) => {
				if (event.target.classList.contains('multi-color') ||
					(event.target.classList.contains('apo-title') &&
						event.target.parentElement.classList.contains('multi-color'))) {
					event.target.classList.toggle('open');
					this.element.querySelector('.color_options_container').classList.toggle('show');
				}
			});
		}


		handleCloseSelectedInfo() {
			this.elements.selectedColorInfo.style.display = 'none';
			const otherOptions = this.saveCurrentOptions();
			const apoOptionColorSelected = Array.from(
				document.querySelectorAll('.ap-options__swatch-container .option_selected')
			).find(div => div.textContent.trim().includes(this.currentColorName));

			if (apoOptionColorSelected) {
				this.apoColors[this.currentSwatchIndex].parentElement?.click();
			}
			setTimeout(() => this.restoreOptions(otherOptions), 100);
			this.colorSwatches.forEach((x) => x.classList.remove('color-selected'));
			const customColorAvis = document.querySelector(
				`.custom-color-${this.toLowerCaseFirstLetter(this.groupColorName)}-avis input`
			);
			if (customColorAvis) {
				customColorAvis.value = '';
				this.triggerInputChange(customColorAvis);
			}
			const priceItems = document.querySelectorAll('.product__prices .price-item');
			priceItems.forEach(priceItem => {
				if (priceItem.hasAttribute('data-base-price')) {
					const basePrice = parseFloat(priceItem.getAttribute('data-base-price'));
					priceItem.textContent = basePrice.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD'
					});
				}
			});

			// Обновляем pr_custom_price элементы
			const customPrices = document.querySelectorAll('.pr_custom_price');
			customPrices.forEach(customPrice => {
				if (customPrice.hasAttribute('data-base-price')) {
					const basePrice = parseFloat(customPrice.getAttribute('data-base-price'));
					customPrice.textContent = basePrice.toLocaleString('en-US', {
						style: 'currency',
						currency: 'USD'
					});
				}
			});
		}

		updateCustomColorAvis(colorName, colorPrice) {
			const customColorAvis = document.querySelector(
				`.custom-color-${this.toLowerCaseFirstLetter(this.groupColorName)}-avis input`
			);
			if (!customColorAvis) return;

			const formattedPrice = colorPrice?.replace('$', '') || '$0';
			customColorAvis.value = `${colorName} [Add ${formattedPrice}]`;
			this.triggerInputChange(customColorAvis);
		}

		saveCurrentOptions() {
			const otherOptions = {};
			document.querySelectorAll('.product-options__swatch-input:checked').forEach(input => {
				if (!input.getAttribute('field-name').includes('Color')) {
					otherOptions[input.getAttribute('field-name')] = input.value;
				}
			});
			return otherOptions;
		}

		restoreOptions(otherOptions) {
			for (const [fieldName, value] of Object.entries(otherOptions)) {
				const inputs = document.querySelectorAll(`.product-options__swatch-input[field-name="${fieldName}"]`);
				inputs.forEach(input => {
					if (input.value === value && !input.checked) {
						input.checked = true;
						input.dispatchEvent(new Event('change', {bubbles: true}));
					}
				});
			}
		}

		triggerInputChange(input) {
			input.value += ' ';
			input.dispatchEvent(new Event('input', {bubbles: true}));
			input.dispatchEvent(new Event('change', {bubbles: true}));
			input.value = input.value.slice(0, -1);
			input.dispatchEvent(new Event('input', {bubbles: true}));
			input.dispatchEvent(new Event('change', {bubbles: true}));
		}

		toLowerCaseFirstLetter(word) {
			return String(word).charAt(0).toLowerCase() + String(word).slice(1);
		}
	}

	// Инициализация
	const groupColorContainers = document.querySelectorAll(SELECTORS.groupColorContainer);

	if (groupColorContainers.length) {
		const colorGroupManagers = Array.from(groupColorContainers).map(
			(container, index) => new ColorGroupManager(container, index)
		);

		const visibleContainers = Array.from(groupColorContainers).filter(group => {
			return group.offsetParent !== null;
		});

		if (visibleContainers.length === 1) {
			const optionsHeading = document.querySelector(SELECTORS.optionsHeading);
			if (optionsHeading) optionsHeading.remove();

			visibleContainers[0].classList.add('single-color');
			const colorOptionsContainer = visibleContainers[0].querySelector('.color_options_container');
			if (colorOptionsContainer) {
				colorOptionsContainer.style.marginTop = 0;
				colorOptionsContainer.classList.add('show');
			}
		} else if (visibleContainers.length > 1) {
			visibleContainers.forEach(container => {
				container.querySelector('.group-color').classList.add('multi-color');
			});
		}

		const nonHiddenContainers = visibleContainers.filter(el => !el.classList.contains('hidden'));
		if (nonHiddenContainers.length) {
			nonHiddenContainers[nonHiddenContainers.length - 1].classList.add('last-visible');
		}
	}

	setTimeout(() => {
		console.log('Инициализация обработчиков цвета...');


		document.querySelectorAll('.swatch[data-checked]').forEach(swatch => {
			console.log('Found swatch with data-checked attribute, clicking it:');
			setTimeout(() => {
				swatch.click();
			}, 200);
		});

		// Handle all Vinyl containers
		const vinylContainers = document.querySelectorAll('.group-color-container[data-group-color-name="Vinyl"]');
		vinylContainers.forEach(vinylContainer => {
			if (vinylContainer && vinylContainer.classList.contains('hidden')) {
				console.log('Удаляем класс hidden с контейнера Vinyl');
				vinylContainer.classList.remove('hidden');
			}
		});

		// Handle all Paint containers
		const paintContainers = document.querySelectorAll('.group-color-container[data-group-color-name="Paint"]');
		paintContainers.forEach(paintContainer => {
			if (paintContainer && paintContainer.classList.contains('hidden')) {
				console.log('Удаляем класс hidden с контейнера Paint');
				paintContainer.classList.remove('hidden');
			}
		});

		// Recalculate visible containers after unhiding
		const visibleContainers = Array.from(document.querySelectorAll(SELECTORS.groupColorContainer)).filter(group => {
			return group.offsetParent !== null && !group.classList.contains('hidden');
		});

		// Update UI for multiple visible containers
		if (visibleContainers.length > 1) {
			console.log('Обнаружено несколько видимых контейнеров цвета, обновляем UI');
			visibleContainers.forEach(container => {
				container.querySelector('.group-color').classList.add('multi-color');
			});

			// Update last-visible class
			visibleContainers[visibleContainers.length - 1].classList.add('last-visible');
		}

		document.querySelectorAll('.color_options_container .swatch:not(.swatch--custom-trigger)').forEach(swatch => {
			if (!swatch.getAttribute('data-handler-attached')) {
				swatch.setAttribute('data-handler-attached', 'true');
				swatch.addEventListener('click', function () {
					const groupContainer = this.closest('.group-color-container');
					if (!groupContainer) return;
					const colorName = this.getAttribute('data-color-name');
					const colorPrice = this.getAttribute('data-color-price');
					const groupName = groupContainer.getAttribute('data-group-color-name');
					const groupType = groupName ? groupName.toLowerCase() : '';
					// Find the hidden input relative to the current group container
					const inputHidden = groupContainer.closest('.custom-color-group').querySelector(`#custom-color-${groupType}-hidden`);
					if (inputHidden) {
						inputHidden.setAttribute('data-price', colorPrice);
					}
					const selectedElement = groupContainer.querySelector('.option_selected');
					const selectedPriceElement = groupContainer.querySelector('.option_selected-price');
					const selectedContainer = groupContainer.querySelector('.option_selected-container');

					if (selectedElement) selectedElement.textContent = `Color: ${colorName}`;
					if (selectedPriceElement) selectedPriceElement.textContent = colorPrice;
					if (selectedContainer) selectedContainer.style.display = 'flex';
					groupContainer.querySelectorAll('.swatch').forEach(s => {
						s.classList.remove('color-selected');
					});
					this.classList.add('color-selected');
					updateHiddenFields(groupContainer, colorName, colorPrice, this);
				});
			}
		});

		document.querySelectorAll('.option_selected-container svg').forEach(button => {
			if (!button.getAttribute('data-handler-attached')) {
				button.setAttribute('data-handler-attached', 'true');
				button.addEventListener('click', function (event) {
					event.preventDefault();
					event.stopPropagation();
					const groupContainer = this.closest('.group-color-container');
					if (!groupContainer) return;
					const selectedContainer = groupContainer.querySelector('.option_selected-container');
					const swatches = groupContainer.querySelectorAll('.swatch');
					if (swatches && swatches.length > 0) {
						swatches.forEach(s => {
							s.classList.remove('color-selected');
						});
					}

					if (selectedContainer) {
						selectedContainer.style.display = 'none';
					}
					const selectedElement = groupContainer.querySelector('.option_selected');
					const selectedPriceElement = groupContainer.querySelector('.option_selected-price');

					if (selectedElement) selectedElement.textContent = '';
					if (selectedPriceElement) selectedPriceElement.textContent = '';
					resetHiddenFields(groupContainer);

					console.log('Удалена опция цвета в группе:', groupContainer.getAttribute('data-group-color-name'));
				});
			}
		});

		// Make updateHiddenFields globally accessible
		window.updateHiddenFields = function(groupContainer, colorName, colorPrice, swatch) {
			const groupName = groupContainer.getAttribute('data-group-color-name');
			const colorInput = document.querySelector(`input[name="${groupName} Color"]`);
			if (colorInput) {
				colorInput.value = colorName;
				colorInput.dispatchEvent(new Event('change', {bubbles: true}));
				console.log('Обновлено поле ввода:', groupName, 'Color =', colorName);
			}

			// Find the popup relative to the current group container
			const customColorGroup = groupContainer.closest('.custom-color-group');
			const popup = customColorGroup.querySelector('.custom-color-input');

			const groupType = groupName.toLowerCase();
			// Find the hidden input relative to the current group container
			const customColorHidden = customColorGroup.querySelector(`#custom-color-${groupType}-hidden`);
			if (customColorHidden) {
				customColorHidden.value = colorName;
				console.log(`Updated ${groupType} hidden input with color:`, colorName);
				if (popup) popup.style.display = 'none';
				// Get variant ID directly from the swatch if available
				if (swatch && swatch.getAttribute('data-id')) {
					const variantId = swatch.getAttribute('data-id');
					customColorHidden.setAttribute('data-variant', variantId);
					console.log(`Updated data-variant attribute for ${groupType} with variant ID from swatch:`, variantId);
				} else {
					// Fallback to searching for the variant ID if swatch is not provided or doesn't have data-id
					document.querySelectorAll('.product-options__swatch-input').forEach(input => {
						const fieldName = input.getAttribute('field-name');
						if (fieldName && fieldName.includes(groupName)) {
							const wrapper = input.closest('.product-options__swatch-wrapper');
							const title = wrapper?.querySelector('.product-options__swatch-title');

							if (title && title.textContent === colorName) {
								// Нашли вариант с нужным цветом, устанавливаем его ID в data-variant
								const variantId = input.value;
								customColorHidden.setAttribute('data-variant', variantId);
								console.log(`Updated data-variant attribute for ${groupType} with variant ID from search:`, variantId);
							}
						}
					});
				}
			}

			let numericPrice = 0;
			if (colorPrice) {
				numericPrice = parseFloat(colorPrice.replace(/[^\d.]/g, '')) || 0;
			}


			if (window.ProductConfigurator) {
				let foundMatchingInput = false;

				document.querySelectorAll('.product-options__swatch-input').forEach(input => {
					const fieldName = input.getAttribute('field-name');
					if (fieldName && fieldName.includes(groupName)) {
						const wrapper = input.closest('.product-options__swatch-wrapper');
						const title = wrapper?.querySelector('.product-options__swatch-title');

						if (title && title.textContent === colorName) {
							const priceElement = wrapper?.querySelector('.product-options__swatch-price');
							if (priceElement) {
								const inputPrice = parseFloat(priceElement.getAttribute('avis-price').replace(/[^\d.]/g, '')) || 0;
								if (Math.abs(inputPrice - numericPrice) < 0.01) {
									input.checked = true;
									input.dispatchEvent(new Event('change', {bubbles: true}));
									console.log('Выбрана опция в конфигураторе:', colorName, 'с ценой', inputPrice);
									foundMatchingInput = true;
								}
							}
						}
					}
				});

				if (!foundMatchingInput) {
					document.querySelectorAll('.product-options__swatch-input').forEach(input => {
						const fieldName = input.getAttribute('field-name');
						if (fieldName && fieldName.includes(groupName)) {
							const wrapper = input.closest('.product-options__swatch-wrapper');
							const title = wrapper?.querySelector('.product-options__swatch-title');

							if (title && title.textContent === colorName) {
								input.checked = true;
								input.dispatchEvent(new Event('change', {bubbles: true}));
								console.log('Выбрана опция в конфигураторе только по имени:', colorName);
							}
						}
					});
				}
			}
		}


		// Make resetHiddenFields globally accessible
		window.resetHiddenFields = function(groupContainer) {
			const groupName = groupContainer.getAttribute('data-group-color-name');
			const colorInput = document.querySelector(`input[name="${groupName} Color"]`);
			if (colorInput) {
				colorInput.value = '';
				colorInput.dispatchEvent(new Event('change', {bubbles: true}));
				console.log('Сброшено поле ввода:', groupName, 'Color');
			}

			const groupType = groupName.toLowerCase();
			// Find the hidden input relative to the current group container
			const customColorGroup = groupContainer.closest('.custom-color-group');
			const customColorHidden = customColorGroup.querySelector(`#custom-color-${groupType}-hidden`);
			if (customColorHidden) {
				customColorHidden.value = '';
				customColorHidden.removeAttribute('data-variant');
				console.log(`Reset ${groupType} hidden input for custom color and removed data-variant attribute`);
			}

			if (window.ProductConfigurator) {
				document.querySelectorAll('.product-options__swatch-input').forEach(input => {
					const fieldName = input.getAttribute('field-name');
					if (fieldName && fieldName.includes(groupName) && input.checked) {
						input.checked = false;
						input.dispatchEvent(new Event('change', {bubbles: true}));
						console.log('Сброшена опция в конфигураторе');
					}
				});
			}
		}

		const style = document.createElement('style');
		style.textContent = `
            .swatch.color-selected {
                position: relative;
                z-index: 1;
            }
        `;
		document.head.appendChild(style);
		console.log('Добавлены стили для выделения выбранного цвета');
		console.log('Инициализация завершена успешно!');
	}, 500);
});

// Function to reinitialize the color picker after cart updates
window.reinitializeColorPicker = function() {
	console.log('Reinitializing custom color picker after cart update...');

	// Get all color group containers
	const groupColorContainers = document.querySelectorAll(SELECTORS.groupColorContainer);

   const colorMap = {
        black: "#000000",
        white: "#FFFFFF",
        red: "#660F0A",
        green: "#008000",
        blue: "#3E77AA",
        yellow: "#EEB241",
        cyan: "#00FFFF",
        magenta: "#FF00FF",
        gray: "#808080",
        silver: "#E5E5E5",
        orange: "#FFA500",
        purple: "#800080",
        pink: "#FFC0CB",
        lime: "#00FF00",
        navy: "#000080",
        teal: "#008080",
        maroon: "#800000",
        burgundy: "#800020",
        metallicsilver: "#aaa9ad",
        stormgray: "#747880" 
    };

    function getHexFromName(name) {
        const normalized = (name || "").toLowerCase().replace(' ', '').replace(/\s*\([^()]*\)/g, '').trim();
        return colorMap[normalized] || "#000000";
    }

		if (visibleContainers.length === 1) {
			const optionsHeading = document.querySelector(SELECTORS.optionsHeading);
			if (optionsHeading) optionsHeading.remove();

			visibleContainers[0].classList.add('single-color');
			const colorOptionsContainer = visibleContainers[0].querySelector('.color_options_container');
			if (colorOptionsContainer) {
				colorOptionsContainer.style.marginTop = 0;
				colorOptionsContainer.classList.add('show');
			}
		} else if (visibleContainers.length > 1) {
			visibleContainers.forEach(container => {
				container.querySelector('.group-color').classList.add('multi-color');
			});
		}

		const nonHiddenContainers = visibleContainers.filter(el => !el.classList.contains('hidden'));
		if (nonHiddenContainers.length) {
			nonHiddenContainers[nonHiddenContainers.length - 1].classList.add('last-visible');
		}

		// Handle Vinyl and Paint containers
		const vinylContainers = document.querySelectorAll('.group-color-container[data-group-color-name="Vinyl"]');
		vinylContainers.forEach(vinylContainer => {
			if (vinylContainer && vinylContainer.classList.contains('hidden')) {
				console.log('Removing hidden class from Vinyl container');
				vinylContainer.classList.remove('hidden');
			}
		});

		const paintContainers = document.querySelectorAll('.group-color-container[data-group-color-name="Paint"]');
		paintContainers.forEach(paintContainer => {
			if (paintContainer && paintContainer.classList.contains('hidden')) {
				console.log('Removing hidden class from Paint container');
				paintContainer.classList.remove('hidden');
			}
		});

		// Reattach event listeners to color swatches
		document.querySelectorAll('.color_options_container .swatch:not(.swatch--custom-trigger)').forEach(swatch => {
			// Remove existing event listeners by cloning the element
			const newSwatch = swatch.cloneNode(true);
			swatch.parentNode.replaceChild(newSwatch, swatch);

			// Add new event listener
			newSwatch.addEventListener('click', function () {
				const groupContainer = this.closest('.group-color-container');
				if (!groupContainer) return;
				const colorName = this.getAttribute('data-color-name');
				const colorPrice = this.getAttribute('data-color-price');
				const groupName = groupContainer.getAttribute('data-group-color-name');
				const groupType = groupName ? groupName.toLowerCase() : '';
				// Find the hidden input relative to the current group container
				const inputHidden = groupContainer.closest('.custom-color-group').querySelector(`#custom-color-${groupType}-hidden`);
				if (inputHidden) {
					inputHidden.setAttribute('data-price', colorPrice);
				}
				const selectedElement = groupContainer.querySelector('.option_selected');
				const selectedPriceElement = groupContainer.querySelector('.option_selected-price');
				const selectedContainer = groupContainer.querySelector('.option_selected-container');

				if (selectedElement) selectedElement.textContent = `Color: ${colorName}`;
				if (selectedPriceElement) selectedPriceElement.textContent = colorPrice;
				if (selectedContainer) selectedContainer.style.display = 'flex';
				groupContainer.querySelectorAll('.swatch').forEach(s => {
					s.classList.remove('color-selected');
				});
				this.classList.add('color-selected');

				// Call updateHiddenFields function
				window.updateHiddenFields(groupContainer, colorName, colorPrice, this);
			});
		});

		// Reattach event listeners to close buttons
		document.querySelectorAll('.option_selected-container svg').forEach(button => {
			// Remove existing event listeners by cloning the element
			const newButton = button.cloneNode(true);
			button.parentNode.replaceChild(newButton, button);

			// Add new event listener
			newButton.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				const groupContainer = this.closest('.group-color-container');
				if (!groupContainer) return;
				const selectedContainer = groupContainer.querySelector('.option_selected-container');
				const swatches = groupContainer.querySelectorAll('.swatch');
				if (swatches && swatches.length > 0) {
					swatches.forEach(s => {
						s.classList.remove('color-selected');
					});
				}

				if (selectedContainer) {
					selectedContainer.style.display = 'none';
				}
				const selectedElement = groupContainer.querySelector('.option_selected');
				const selectedPriceElement = groupContainer.querySelector('.option_selected-price');

				if (selectedElement) selectedElement.textContent = '';
				if (selectedPriceElement) selectedPriceElement.textContent = '';

				// Call resetHiddenFields function
				window.resetHiddenFields(groupContainer);
			});
		});

		// Reattach event listeners to custom color triggers
		document.querySelectorAll('.custom-color-trigger').forEach(trigger => {
			// Remove existing event listeners by cloning the element
			const newTrigger = trigger.cloneNode(true);
			trigger.parentNode.replaceChild(newTrigger, trigger);

			// Add new event listener
			newTrigger.addEventListener('click', function() {
				const colorGroupElement = this.closest('.group-color-container');
				if (!colorGroupElement) return;

				const container = colorGroupElement.querySelector('.custom-color-input');
				if (container) {
					container.style.display = 'block';
				}
			});
		});

		// Reattach event listeners to add-custom-color buttons
		document.querySelectorAll('.add-custom-color').forEach(button => {
			// Remove existing event listeners by cloning the element
			const newButton = button.cloneNode(true);
			button.parentNode.replaceChild(newButton, button);

			// Add new event listener
			newButton.addEventListener('click', function(event) {
				const colorGroupElement = this.closest('.group-color-container');
				if (!colorGroupElement) return;

				const groupColorName = colorGroupElement.getAttribute('data-group-color-name');
				if (!groupColorName) return;

				// Create a temporary CustomColorManager to handle the addCustomColor action
				const tempManager = new CustomColorManager(colorGroupElement, groupColorName);
				tempManager.addCustomColor(event);
			});
		});

		console.log('Custom color picker reinitialized successfully!');
	} else {
		console.log('No color group containers found to reinitialize');
	}
};
