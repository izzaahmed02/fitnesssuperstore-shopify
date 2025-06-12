document.addEventListener('DOMContentLoaded', () => {
	window.initAllComponents();

	document.addEventListener('cart:updated', handleCartUpdate);
	document.addEventListener('cart-items:updated', handleCartUpdate);

	// Обработка AJAX запросов
	setupFetchInterceptor();

	// Add event delegation for popup close buttons
	document.addEventListener('click', function(event) {
		// Check if the clicked element is the SVG close button or its path
		const target = event.target;
		const closeButton = target.closest('.cart-item__custom-option-popup-inner > svg.popup-close');

		if (closeButton) {
			event.preventDefault();
			const popup = closeButton.closest('.cart-item__custom-option-popup');
			const overlay = document.querySelector('.overlay');

			if (popup) {
				closeCustomPopup(popup, overlay);
			}
		}
	});
});

// Make initAllComponents globally accessible
window.initAllComponents = function () {
	initCartProductOptions();
	initPopupTriggers();
	initCustomOptionPopupTriggers();
	updateCustomOptionsStatus();

	// Reinitialize custom color picker if the function exists
	if (typeof window.reinitializeColorPicker === 'function') {
		window.reinitializeColorPicker();
	}
}

function handleCartUpdate(event) {
	console.log(`${event.type} event detected, reinitializing product options`);

	// Save the state of inputs before reinitializing components
	const savedInputStates = window.saveInputStates();

	setTimeout(() => {
		window.initAllComponents();

		// Restore the state of inputs after reinitializing components
		window.restoreInputStates(savedInputStates);
	}, 100);
}

function setupFetchInterceptor() {
	const originalFetch = window.fetch;
	window.fetch = function () {
		const fetchPromise = originalFetch.apply(this, arguments);
		const url = arguments[0];

		if (typeof url === 'string' && isCartModificationUrl(url)) {
			fetchPromise.then(response => {
				if (response.ok) {
					console.log('Cart AJAX request detected, will reinitialize product options after completion');

					// Save the state of inputs before reinitializing components
					const savedInputStates = window.saveInputStates();

					setTimeout(() => {
						window.initAllComponents();

						// Restore the state of inputs after reinitializing components
						window.restoreInputStates(savedInputStates);
					}, 500); // Longer timeout to ensure the DOM has been updated
				}
				return response;
			});
		}
		return fetchPromise;
	};
}

function isCartModificationUrl(url) {
	return url.includes('/cart/add') ||
		url.includes('/cart/update') ||
		url.includes('/cart/change');
}

function initCartProductOptions() {
	const customProductOptions = document.querySelectorAll('.cart-item.custom-product-option');
	console.log('Found custom product options:', customProductOptions.length);

	customProductOptions.forEach(option => {
		option.classList.add('custom-product-option');
		processParentProduct(option);
		setupQuantityChangeListener(option);
	});
}

function processParentProduct(option) {
	const parentProductId = option.dataset.parentProductId;
	if (parentProductId) {
		const parentProduct = document.querySelector(`[data-unique-key="${parentProductId}"]`);
		if (parentProduct) {
			console.log('Found parent product for option:', parentProduct);
		}
	}
}

function setupQuantityChangeListener(option) {
	const quantityInput = option.querySelector('.quantity__input');
	if (quantityInput) {
		quantityInput.addEventListener('change', (event) => {
			console.log('Quantity changed for product option:', event.target.value);
		});
	}
}

function initPopupTriggers() {
	const triggers = document.querySelectorAll('.cart-item__custom-options-trigger');
	const popups = document.querySelectorAll('.cart-item__custom-options-popup');
	const overlay = document.querySelector('.overlay');
	const saveButtons = document.querySelectorAll('.button--options');
	const popupMap = createPopupMap(popups);


	saveButtons.forEach(button => {
		button.addEventListener('click', handleSaveOptions);
	});

	triggers.forEach(trigger => {
		trigger.addEventListener('click', async () => {
			const key = trigger.getAttribute('data-key');
			console.log('Trigger clicked with key:', key);

			if (!key) {
				console.error('Trigger is missing data-key attribute');
				return;
			}

			const popup = findPopupByKey(key, popupMap, trigger);
			if (!popup) return;

			await openPopup(popup, overlay);
		});
	});
}

function createPopupMap(popups) {
	const popupMap = {};
	popups.forEach(popup => {
		const key = popup.getAttribute('data-key');
		if (key) {
			popupMap[key] = popup;
		}
	});
	return popupMap;
}

function findPopupByKey(key, popupMap, trigger) {
	let popup = popupMap[key] || document.querySelector(`.cart-item__custom-options-popup[data-key="${key}"]`);

	if (!popup) {
		const variantId = trigger.getAttribute('data-variant');
		if (variantId) {
			popup = document.querySelector(`.cart-item__custom-options-popup[data-key="${variantId}"]`);
		}

		if (!popup) {
			console.error(`No popup found with data-key: ${key}`);

			const allPopups = document.querySelectorAll('.cart-item__custom-options-popup');
			allPopups.forEach(popup => {
				console.log(popup)
			})
			allPopups.forEach(p => {
				console.log('Popup data-key:', p.getAttribute('data-key'));
			});

			if (allPopups.length > 0) {
				console.log('Using first available popup as fallback');

			} else {
				console.error('No popups available at all');
				return null;
			}
		}
	}

	return popup;
}

async function openPopup(popup, overlay) {
	popup.style.display = 'flex';
	if (overlay) overlay.classList.add('active');
	document.querySelector('html').style.overflow = 'hidden';
	const cancelButton = popup.querySelector('.button--tertiary');
	const saveButton = popup.querySelector('.cart-item__custom-options-popup-buttons .button--primary');
	const closeHandler = (e) => {
		if (e) e.preventDefault();
		closeProductOptionsPopup(popup, overlay);
		if (cancelButton) cancelButton.removeEventListener('click', closeHandler);
		if (overlay) overlay.removeEventListener('click', closeHandler);
	};

	// Get the unique key of the parent item from the popup's data-key attribute
	const uniqueKey = popup.getAttribute('data-key');
	if (uniqueKey) {
		try {
			// Fetch cart data to find existing options
			const cartData = await fetchCartData();
			const parentItem = findParentItem(cartData, uniqueKey);

			if (parentItem) {
				// Find existing options for this parent item
				const existingOptions = cartData.items.filter(item => {
					// Convert to string for comparison to handle both string and number types
					const parentProductId = item.properties?._parent_product_id?.toString();
					const parentVariantId = parentItem.variant_id?.toString();

					return parentProductId === parentVariantId &&
						item.properties?._group_id === parentItem.properties?._group_id;
				});

				if (existingOptions.length > 0) {
					console.log('Found existing options to pre-select:', existingOptions);

					// Pre-select radio inputs based on existing options
					const popupContent = popup.querySelector('.cart-item__custom-options-popup-content');
					const radioInputs = popupContent.querySelectorAll('input[type="radio"]');

					// Uncheck all radio inputs first
					radioInputs.forEach(input => {
						input.checked = false;
						input.removeAttribute('checked');
					});

					// Check radio inputs that match existing options
					existingOptions.forEach(option => {
						const variantId = option.variant_id.toString();
						const matchingInput = popupContent.querySelector(`input[type="radio"][value="${variantId}"]`);

						if (matchingInput) {
							matchingInput.checked = true;
							matchingInput.setAttribute('checked', 'checked');

							// Set quantity if applicable
							const wrapper = matchingInput.closest('.product-options__swatch-wrapper');
							const quantityInput = wrapper?.querySelector('.product-options__quantity-input');
							if (quantityInput && option.quantity > 1) {
								quantityInput.value = option.quantity;
							}

							// Trigger change event to update accordion label
							matchingInput.dispatchEvent(new Event('change', { bubbles: true }));
						}
					});

				}
			}
		} catch (error) {
			console.error('Error pre-selecting options:', error);
		}
	}

	if (cancelButton) cancelButton.addEventListener('click', closeHandler);
	// We don't add a click handler for the save button here because it's handled in handleSaveOptions
	if (overlay) overlay.addEventListener('click', closeHandler);
}

function closeProductOptionsPopup(popup, overlay) {
	popup.style.display = 'none';
	if (overlay) overlay.classList.remove('active');
	document.querySelector('html').style.overflow = '';
}


function initCustomOptionPopupTriggers() {
	const triggers = document.querySelectorAll('.button--popup');
	const popups = document.querySelectorAll('.cart-item__custom-option-popup');
	const overlay = document.querySelector('.overlay');

	console.log('Found custom option popup triggers:', triggers.length);
	console.log('Found custom option popups:', popups.length);
	const popupMap = createCustomPopupMap(popups);

	triggers.forEach(trigger => {
		trigger.addEventListener('click', () => {
			const key = trigger.getAttribute('data-key');
			console.log('Custom option trigger clicked with key:', key);

			if (!key) {
				console.error('Custom option trigger is missing data-key attribute');
				return;
			}

			const popup = findCustomPopupByKey(key, popupMap, trigger);
			if (!popup) return;

			openCustomPopup(popup, overlay);
		});
	});
}

function createCustomPopupMap(popups) {
	const popupMap = {};
	popups.forEach(popup => {
		const key = popup.getAttribute('data-key');
		if (key) {
			popupMap[key] = popup;
		}
	});
	return popupMap;
}

function findCustomPopupByKey(key, popupMap, trigger) {
	let popup = popupMap[key] || document.querySelector(`.cart-item__custom-option-popup[data-key="${key}"]`);

	if (!popup) {
		const variantId = trigger.getAttribute('data-variant');
		if (variantId) {
			popup = document.querySelector(`.cart-item__custom-option-popup[data-key="${variantId}"]`);
		}

		if (!popup) {
			console.error(`No custom option popup found with data-key: ${key}`);

			// Логгируем доступные попапы для отладки
			const allPopups = document.querySelectorAll('.cart-item__custom-option-popup');
			allPopups.forEach(p => {
				console.log('Popup data-key:', p.getAttribute('data-key'));
			});

			// Используем первый доступный попап в крайнем случае
			if (allPopups.length > 0) {
				console.log('Using first available popup as fallback');
			} else {
				console.error('No popups available at all');
				return null;
			}
		}
	}

	return popup;
}

function openCustomPopup(popup, overlay) {
	popup.style.display = 'flex';
	if (overlay) overlay.classList.add('active');
	document.querySelector('html').style.overflow = 'hidden';
	const cancelButton = popup.querySelector('.cart-item__custom-option-popup-cancel');

	const closeHandler = (e) => {
		e.preventDefault();
		closeCustomPopup(popup, overlay);
		if (cancelButton) cancelButton.removeEventListener('click', closeHandler);
		if (overlay) overlay.removeEventListener('click', closeHandler);
	};

	if (cancelButton) cancelButton.addEventListener('click', closeHandler);
	if (overlay) overlay.addEventListener('click', closeHandler);
}

function closeCustomPopup(popup, overlay) {
	popup.style.display = 'none';
	if (overlay) overlay.classList.remove('active');
	document.querySelector('html').style.overflow = '';
}

async function handleSaveOptions(event) {
	event.preventDefault();
	const {saveButton, popup, overlay} = findElements(event);
	if (!popup) return;
	const {groupId, uniqueKey} = getButtonData(saveButton);
	if (!groupId || !uniqueKey) return;
	setButtonLoadingState(saveButton, true);
	try {
		const cartData = await fetchCartData();
		const parentItem = findParentItem(cartData, uniqueKey);
		if (!parentItem) {
			throw new Error('Родительский элемент не найден в корзине');
		}
		console.log(parentItem.properties, cartData.items)
		const existingOptions = cartData.items.filter(item => {
			// Convert to string for comparison to handle both string and number types
			const parentProductId = item.properties?._parent_product_id?.toString();
			const parentVariantId = parentItem.variant_id?.toString();

			return parentProductId === parentVariantId &&
				item.properties?._group_id === parentItem.properties?._group_id;
		});
		console.log('Found existing options:', existingOptions);

		const {selectedOptions, newGroupId, updatedParentProperties} =
			collectOptionsData(popup, parentItem);

		const itemsToRemove = {};
		existingOptions.forEach(option => {
			itemsToRemove[option.key] = 0;
		});
		itemsToRemove[parentItem.key] = 0;
		console.log('Items to remove:', itemsToRemove);

		await fetch('/cart/update.js', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				updates: itemsToRemove
			})
		});

		const addedVariants = new Map();

		const mergedSelectedOptions = [];
		selectedOptions.forEach(option => {
			const variantId = option.id.toString();
			if (addedVariants.has(variantId)) {
				const existingIndex = addedVariants.get(variantId);
				mergedSelectedOptions[existingIndex].quantity += option.quantity;
			} else {
				addedVariants.set(variantId, mergedSelectedOptions.length);
				mergedSelectedOptions.push(option);
			}
		});

		await addItemsToCart(mergedSelectedOptions, parentItem, updatedParentProperties, newGroupId);

		await updateCartDisplay();
		closeProductOptionsPopup(popup, overlay);
	} catch (error) {
		console.error('Ошибка при сохранении опций:', error);
		alert('Не удалось сохранить опции. Пожалуйста, попробуйте снова.');
	} finally {
		setButtonLoadingState(saveButton, false);
	}
}

function findElements(event) {
	const saveButton = event.currentTarget;
	const popup = saveButton.closest('.cart-item__custom-options-popup');
	const overlay = document.querySelector('.overlay');
	if (!popup) {
		console.error('Попап не найден');
	}
	return {saveButton, popup, overlay};
}

function getButtonData(button) {
	const groupId = button.dataset.group;
	const uniqueKey = button.dataset.key;
	if (!groupId || !uniqueKey) {
		console.error('Отсутствует ID группы или уникальный ключ');
	}
	return {groupId, uniqueKey};
}

function setButtonLoadingState(button, isLoading) {
	button.disabled = isLoading;
	if (isLoading) {
		button.classList.add('loading');
	} else {
		button.classList.remove('loading');
	}
}

async function fetchCartData() {
	const response = await fetch('/cart.js');
	if (!response.ok) {
		throw new Error('Не удалось получить данные корзины');
	}
	return await response.json();
}

function findParentItem(cartData, uniqueKey) {
	return cartData.items.find(item =>
		(item.properties?._unique_key === uniqueKey) ||
		(item.key === uniqueKey)
	);
}

function collectOptionsData(popup, parentItem) {
	const selectedOptions = [];
	const popupContent = popup.querySelector('.cart-item__custom-options-popup-content');
	const radioInputs = popupContent.querySelectorAll('input[type="radio"]:checked');

	const updatedParentProperties = {...parentItem.properties};
	const existingGroupId = parentItem.properties?._group_id;

	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const newGroupId = existingGroupId || (timestamp + '-' + randomString);


	updatedParentProperties._group_id = newGroupId;

	// Check for custom colors in the popup
	const customColorGroups = popupContent.querySelectorAll('.custom-color-group');

	// Function to update parent product's color property
	const updateParentColorProperty = (colorType, colorValue) => {
		// Find property keys that contain the word "color"
		const colorPropertyKeys = Object.keys(updatedParentProperties).filter(key => 
			key.toLowerCase().includes('color')
		);

		// If a specific color type property exists (e.g., "Paint Color"), update it
		const specificColorKey = colorPropertyKeys.find(key => 
			key.toLowerCase().includes(colorType.toLowerCase())
		);

		if (specificColorKey) {
			updatedParentProperties[specificColorKey] = 'Custom Color: ' + colorValue;
		} else if (colorPropertyKeys.length > 0) {
			// Otherwise update the first property that contains "color"
			updatedParentProperties[colorPropertyKeys[0]] = 'Custom Color: ' + colorValue;
		} else {
			// If no color property exists, create one
			updatedParentProperties[colorType + ' Color'] = 'Custom Color: ' + colorValue;
		}
	};

	customColorGroups.forEach(group => {
		const paintContainer = group.querySelector('.group-color-container[data-group-color-name="Paint"]');
		if (paintContainer) {
			const customColorPaintHidden = group.querySelector('#custom-color-paint-hidden');
			if (customColorPaintHidden && customColorPaintHidden.value) {
				const variantId = customColorPaintHidden.getAttribute('data-variant');
				if (variantId) {
					// Update parent product's color property
					updateParentColorProperty('Paint', customColorPaintHidden.value);

					selectedOptions.push({
						id: variantId,
						quantity: 1,
						properties: {
							_parent_product_id: parentItem.variant_id,
							// _unique_key: timestamp + '-' + randomString + '-' + variantId,
							_group_id: newGroupId,
							'Custom Color:' : customColorPaintHidden.value
						}
					});
				}
			}
		}

		// Check for Vinyl color
		const vinylContainer = group.querySelector('.group-color-container[data-group-color-name="Vinyl"]');
		if (vinylContainer) {
			const customColorVinylHidden = group.querySelector('#custom-color-vinyl-hidden');
			if (customColorVinylHidden && customColorVinylHidden.value) {
				const variantId = customColorVinylHidden.getAttribute('data-variant');
				if (variantId) {
					// Update parent product's color property
					updateParentColorProperty('Vinyl', customColorVinylHidden.value);

					selectedOptions.push({
						id: variantId,
						quantity: 1,
						properties: {
							_parent_product_id: parentItem.variant_id,
							// _unique_key: timestamp + '-' + randomString + '-' + variantId,
							_group_id: newGroupId,
							'Custom Color:' : customColorVinylHidden.value
						}
					});
				}
			}
		}
	});

	// Process regular radio inputs
	radioInputs.forEach(input => {
		const variantId = input.value;
		const fieldName = input.getAttribute('field-name');
		const wrapper = input.closest('.product-options__swatch-wrapper');
		const variantTitle = wrapper.querySelector('.product-options__swatch-title').textContent;
		const quantityInput = wrapper.querySelector('.product-options__quantity-input');
		const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

		selectedOptions.push({
			id: variantId,
			quantity: quantity,
			properties: {
				_parent_product_id: parentItem.variant_id,
				// _unique_key: timestamp + '-' + randomString + '-' + variantId,
				_group_id: newGroupId
			}
		});
	});
	return {selectedOptions, newGroupId, updatedParentProperties};
}



async function addItemsToCart(selectedOptions, parentItem, updatedParentProperties, newGroupId) {
	const parentItemToAdd = {
		id: parentItem.variant_id,
		quantity: parentItem.quantity,
		properties: updatedParentProperties
	};

	const items = [
		...selectedOptions,
		parentItemToAdd

	];

	const response = await fetch('/cart/add.js', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({items})
	});

	if (!response.ok) {
		throw new Error('Не удалось добавить товары в корзину');
	}
	return await response.json();
}

async function updateCartDisplay() {
	const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');

	// Save the state of inputs before updating
	const savedInputStates = window.saveInputStates();

	// Completely re-render cart items by fetching the updated HTML from the server
	if (cartItems) {
		if (cartItems.tagName === 'CART-DRAWER-ITEMS') {
			// For cart drawer
			try {
				const response = await fetch(`${routes.cart_url}?section_id=cart-drawer`);
				const responseText = await response.text();
				const html = new DOMParser().parseFromString(responseText, 'text/html');

				// Replace the entire cart-drawer-items content
				const sourceElement = html.querySelector('cart-drawer-items');
				if (sourceElement && cartItems) {
					cartItems.innerHTML = sourceElement.innerHTML;
				}

				// Also update the cart drawer footer if it exists
				const footerElement = document.querySelector('.cart-drawer__footer');
				const sourceFooter = html.querySelector('.cart-drawer__footer');
				if (footerElement && sourceFooter) {
					footerElement.innerHTML = sourceFooter.innerHTML;
				}

				document.dispatchEvent(new CustomEvent('cart:updated', {
					bubbles: true,
					detail: {source: 'drawer'}
				}));
			} catch (e) {
				console.error('Error updating cart drawer:', e);
				// Fallback to the original method
				if (cartItems.onCartUpdate) {
					await cartItems.onCartUpdate();
				}
			}
		} else {
			// For main cart
			try {
				const response = await fetch(`${routes.cart_url}?section_id=main-cart-items`);
				const responseText = await response.text();
				const html = new DOMParser().parseFromString(responseText, 'text/html');

				// Replace the entire cart-items content
				const sourceElement = html.querySelector('cart-items');
				if (sourceElement && cartItems) {
					cartItems.innerHTML = sourceElement.innerHTML;
				}

				// Update custom options popups
				const customOptionsPopups = document.querySelector('.cart-item__custom-options-popups');
				if (customOptionsPopups) {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = responseText;
					const newCustomOptionsPopups = tempDiv.querySelector('.cart-item__custom-options-popups');
					if (newCustomOptionsPopups) {
						customOptionsPopups.innerHTML = newCustomOptionsPopups.innerHTML;
					}
				}

				// Update custom option popups (singular)
				const customOptionPopups = document.querySelector('.cart-item__custom-option-popups');
				if (customOptionPopups) {
					const tempDiv = document.createElement('div');
					tempDiv.innerHTML = responseText;
					const newCustomOptionPopups = tempDiv.querySelector('.cart-item__custom-option-popups');
					if (newCustomOptionPopups) {
						customOptionPopups.innerHTML = newCustomOptionPopups.innerHTML;
					}
				}

				document.dispatchEvent(new CustomEvent('cart-items:updated', {
					bubbles: true,
					detail: {source: 'main-cart'}
				}));
			} catch (e) {
				console.error('Error updating main cart:', e);
				// Fallback to the original method
				if (cartItems.onCartUpdate) {
					await cartItems.onCartUpdate();
				}
			}
		}
	}

	// Restore the state of inputs after updating
	window.restoreInputStates(savedInputStates);

	// Update cart totals if the function exists
	if (typeof window.updateCartTotals === 'function') {
		window.updateCartTotals();
	}
}

// Helper function to get quantity for a radio input
// Make it globally accessible
window.getQuantityForInput = function(input) {
	const wrapper = input.closest('.product-options__swatch-wrapper');
	const quantityInput = wrapper?.querySelector('.product-options__quantity-input');
	return quantityInput ? parseInt(quantityInput.value) || 1 : 1;
}

// Function to save the state of inputs in popups
// Make it globally accessible
window.saveInputStates = function() {
	const states = {
		radioInputs: [],
		customColorPaint: null,
		customColorVinyl: null
	};

	// Save state of radio inputs
	const popups = document.querySelectorAll('.cart-item__custom-options-popup');
	popups.forEach(popup => {
		const popupKey = popup.getAttribute('data-key');
		const radioInputs = popup.querySelectorAll('input[type="radio"]:checked');

		radioInputs.forEach(input => {
			states.radioInputs.push({
				popupKey: popupKey,
				fieldName: input.getAttribute('field-name'),
				value: input.value,
				quantity: window.getQuantityForInput(input)
			});
		});

 	// Save custom color values if present
 	const customColorPaintHidden = popup.querySelector('#custom-color-paint-hidden');
 	if (customColorPaintHidden && customColorPaintHidden.value) {
 		// Try to find the price for the paint color
 		let paintPrice = '';
 		const paintContainer = popup.querySelector('.group-color-container[data-group-color-name="Paint"]');
 		if (paintContainer) {
 			const selectedPriceElement = paintContainer.querySelector('.option_selected-price');
 			if (selectedPriceElement) {
 				paintPrice = selectedPriceElement.textContent;
 			}
 		}

 		states.customColorPaint = {
 			popupKey: popupKey,
 			value: customColorPaintHidden.value,
 			variantId: customColorPaintHidden.getAttribute('data-variant'),
 			price: paintPrice
 		};
 	}

 	const customColorVinylHidden = popup.querySelector('#custom-color-vinyl-hidden');
 	if (customColorVinylHidden && customColorVinylHidden.value) {
 		// Try to find the price for the vinyl color
 		let vinylPrice = '';
 		const vinylContainer = popup.querySelector('.group-color-container[data-group-color-name="Vinyl"]');
 		if (vinylContainer) {
 			const selectedPriceElement = vinylContainer.querySelector('.option_selected-price');
 			if (selectedPriceElement) {
 				vinylPrice = selectedPriceElement.textContent;
 			}
 		}

 		states.customColorVinyl = {
 			popupKey: popupKey,
 			value: customColorVinylHidden.value,
 			variantId: customColorVinylHidden.getAttribute('data-variant'),
 			price: vinylPrice
 		};
 	}
	});

	console.log('Saved input states:', states);
	return states;
}

// Function to restore the state of inputs in popups
// Make it globally accessible
window.restoreInputStates = function(states) {
	if (!states) return;

	console.log('Restoring input states:', states);

	// Restore radio inputs
	states.radioInputs.forEach(state => {
		const popup = document.querySelector(`.cart-item__custom-options-popup[data-key="${state.popupKey}"]`);
		if (!popup) return;

		const input = popup.querySelector(`input[type="radio"][value="${state.value}"][field-name="${state.fieldName}"]`);
		if (input) {
			input.checked = true;
			input.setAttribute('checked', 'checked');

			// Restore quantity if applicable
			const wrapper = input.closest('.product-options__swatch-wrapper');
			const quantityInput = wrapper?.querySelector('.product-options__quantity-input');
			if (quantityInput && state.quantity > 1) {
				quantityInput.value = state.quantity;
			}

			// Trigger change event to update accordion label
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}
	});

	// We're skipping restoring custom colors as per requirement
	// Custom colors should not be pre-selected when the popup is shown again
}

function updateCustomOptionsStatus() {

	const customProductOptions = document.querySelectorAll('.cart-item.custom-product-option');


	const optionElements = document.querySelectorAll('.cart-item__custom-options-option');


	// Create a map to store variant IDs with their group IDs
	const addedVariantsMap = new Map();
	customProductOptions.forEach(option => {
		const variantId = option.dataset.variantId;
		const groupId = option.dataset.groupId;
		if (variantId) {

			if (!addedVariantsMap.has(variantId)) {
				addedVariantsMap.set(variantId, new Set());
			}
			if (groupId) {
				addedVariantsMap.get(variantId).add(groupId);
			}
		} else {
			console.log('Custom product option missing variant ID:', option);
		}
	});

	optionElements.forEach(optionElement => {
		const button = optionElement.querySelector('.button.button--tertiary');
		if (!button) {
			console.log('Option element missing button:', optionElement);
			return;
		}

		const variantId = button.dataset.variant;
		if (!variantId) {
			console.log('Button missing variant ID:', button);
			return;
		}

		const groupId = button.dataset.group;
		if (addedVariantsMap.has(variantId) &&
			(!groupId || addedVariantsMap.get(variantId).has(groupId))) {
			optionElement.classList.add('added');
			if (button.querySelector('span').textContent.trim() !== 'Sold Out') {
				button.querySelector('span').textContent = 'Added';
			}
		}
	});
}
