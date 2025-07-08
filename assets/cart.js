class CartRemoveButton extends HTMLElement {
	constructor() {
		super();
		this.addEventListener('click', (event) => {
			event.preventDefault();
			if (this.classList.contains('cart-item__remove')) {
				this.showPopup();
			} else {
				this.removeItem();
			}
		});
	}

	showPopup() {
		const popup = document.querySelector('.cart-items__popup');
		const overlay = document.querySelector('.overlay');
		const removeBtn = popup?.querySelector('.cart-items__popup-btn--remove');
		const cancelBtn = popup?.querySelector('.cart-items__popup-btn--cancel');
		const closeBtn = popup?.querySelector('.cart-items__popup-close');

		if (!popup || !overlay || !removeBtn || !cancelBtn || !closeBtn) {
			console.error("Popup elements not found.");
			return;
		}

		popup.classList.add('active');
		overlay.classList.add('active');
		document.querySelector('html, body').classList.add('overflow-hidden');
		popup.dataset.index = this.dataset.index;

		const removeItem = () => {
			this.removeItem();
			closePopup();
		};

		const handleRemoveBtnClick = (event) => {
			event.preventDefault();
			removeItem();
		};

		const handleCancelBtnClick = (event) => {
			event.preventDefault();
			closePopup();
		};

		const handleCloseBtnClick = (event) => {
			event.preventDefault();
			closePopup();
		};

		const handleOverlayClick = () => {
			closePopup();
		};

		const closePopup = () => {
			popup.classList.remove('active');
			overlay.classList.remove('active');
			document.querySelector('html, body').classList.remove('overflow-hidden');
			removeBtn.removeEventListener('click', handleRemoveBtnClick);
			cancelBtn.removeEventListener('click', handleCancelBtnClick);
			closeBtn.removeEventListener('click', handleCloseBtnClick);
			overlay.removeEventListener('click', handleOverlayClick);
		};
		removeBtn.addEventListener('click', handleRemoveBtnClick);
		cancelBtn.addEventListener('click', handleCancelBtnClick);
		closeBtn.addEventListener('click', handleCloseBtnClick);
		overlay.addEventListener('click', handleOverlayClick);
	}

	async removeItem() {
		const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');
		if (cartItems) {
			const itemKey = this.dataset.key;
			const itemIndex = this.dataset.index;
			if (itemKey) {
				try {
					const response = await fetch('/cart.js');
					if (!response.ok) {
						throw new Error('Failed to fetch cart data');
					}

					const cartData = await response.json();
					const currentItem = cartData.items.find(item => item.key === itemKey);

					if (currentItem) {
						// If this is a parent product, find all options with the same group-id
						if (!currentItem.properties?._parent_product_id && currentItem.properties?._group_id) {
							const relatedItems = cartData.items.filter(item =>
								item.properties?._group_id &&
								item.properties?._group_id === currentItem.properties?._group_id &&
								item.key !== itemKey
							);

							if (relatedItems.length > 0) {
								const updates = {};
								for (const item of relatedItems) {
									updates[item.key] = 0;
								}

								updates[itemKey] = 0;
								await cartItems.updateItemsQuantity(updates);
								return;
							}
						}

						// If this is an option, check if we need to remove other items from the same group
						if (currentItem.properties?._parent_product_id && currentItem.properties?._group_id) {

							const parentItem = cartData.items.find(item =>
								!item.properties?._parent_product_id &&
								item.properties?._group_id === currentItem.properties?._group_id
							);
							console.log(currentItem, 'cur')
							if (parentItem) {
								const isColorOption =
									(currentItem.variant_title &&
										(currentItem.variant_title.toLowerCase().includes('color') ||
											currentItem.variant_title.toLowerCase().includes('paint') ||
											currentItem.variant_title.toLowerCase().includes('vinyl'))) ||
									(currentItem.product_title &&
										(currentItem.product_title.toLowerCase().includes('color') ||
											currentItem.product_title.toLowerCase().includes('paint') ||
											currentItem.product_title.toLowerCase().includes('vinyl')));

								if (isColorOption) {
									// Find all color-related properties in the parent item
									const colorProperties = Object.keys(parentItem.properties || {}).filter(key =>
										key.toLowerCase().includes('color') ||
										key.toLowerCase().includes('paint') ||
										key.toLowerCase().includes('vinyl')
									);

									// If there are color properties, remove them from the parent
									if (colorProperties.length > 0) {
										const updatedProperties = {...parentItem.properties};
										colorProperties.forEach(key => {
											delete updatedProperties[key];
										});

										// Update the parent item with the modified properties
										await fetch('/cart/change.js', {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify({
												id: parentItem.key,
												quantity: parentItem.quantity,
												properties: updatedProperties
											})
										});
									}
								}

								cartItems.updateQuantity(itemIndex, 0);
								return;
							}

							// If parent doesn't exist, find all other options from the same group
							const siblingOptions = cartData.items.filter(item =>
								item.properties?._parent_product_id &&
								item.properties?._group_id === currentItem.properties?._group_id &&
								item.key !== itemKey
							);

							if (siblingOptions.length > 0) {
								const updates = {};
								for (const item of siblingOptions) {
									updates[item.key] = 0;
								}

								updates[itemKey] = 0;
								await cartItems.updateItemsQuantity(updates);
								return;
							}
						}
					}

					cartItems.updateQuantity(itemIndex, 0);
				} catch (error) {
					console.error('Error removing items:', error);
					try {
						await cartItems.updateItemsQuantity({[itemKey]: 0});
					} catch (fallbackError) {
						console.error('Fallback bulk update failed:', fallbackError);
						cartItems.updateQuantity(itemIndex, 0);
					}
				}
			} else {
				cartItems.updateQuantity(itemIndex, 0);
			}
		}
	}
}

customElements.define('cart-remove-button', CartRemoveButton);


class CartItems extends HTMLElement {
	constructor() {
		super();
		this.lineItemStatusElement =
			document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');
		const debouncedOnChange = debounce((event) => {
			this.onChange(event);
		}, ON_CHANGE_DEBOUNCE_TIMER);
		this.addEventListener('change', debouncedOnChange.bind(this));
	}

	cartUpdateUnsubscriber = undefined;

	connectedCallback() {
		this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
			if (event.source === 'cart-items') {
				return;
			}
			this.onCartUpdate();
		});
	}

	disconnectedCallback() {
		if (this.cartUpdateUnsubscriber) {
			this.cartUpdateUnsubscriber();
		}
	}

	resetQuantityInput(id) {
		const input = this.querySelector(`#Quantity-${id}`);
		input.value = input.getAttribute('value');
		this.isEnterPressed = false;
	}

	setValidity(event, index, message) {
		event.target.setCustomValidity(message);
		event.target.reportValidity();
		this.resetQuantityInput(index);
		event.target.select();
	}

	validateQuantity(event) {
		const inputValue = parseInt(event.target.value);
		const index = event.target.dataset.index;
		let message = '';
		if (inputValue < event.target.dataset.min) {
			message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
		} else if (inputValue > parseInt(event.target.max)) {
			message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
		} else if (inputValue % parseInt(event.target.step) !== 0) {
			message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
		}

		if (message) {
			this.setValidity(event, index, message);
		} else {
			event.target.setCustomValidity('');
			event.target.reportValidity();
			this.updateQuantity(
				index,
				inputValue,
				document.activeElement.getAttribute('name'),
				event.target.dataset.quantityVariantId
			);
		}
	}

	onChange(event) {
		this.validateQuantity(event);
	}

	onCartUpdate() {
		if (this.tagName === 'CART-DRAWER-ITEMS') {
			fetch(`${routes.cart_url}?section_id=cart-drawer`)
				.then((response) => response.text())
				.then((responseText) => {
					const html = new DOMParser().parseFromString(responseText, 'text/html');
					const selectors = ['cart-drawer-items', '.cart-drawer__footer', '.title-wrapper-with-link .title'];
					for (const selector of selectors) {
						const targetElement = document.querySelector(selector);
						const sourceElement = html.querySelector(selector);
						if (targetElement && sourceElement) {
							targetElement.replaceWith(sourceElement);
						}
					}
					document.dispatchEvent(new CustomEvent('cart:updated', {
						bubbles: true,
						detail: {source: 'drawer'}
					}));
				})
				.catch((e) => {
					console.error(e);
				});
		} else {
			fetch(`${routes.cart_url}?section_id=main-cart-items`)
				.then((response) => response.text())
				.then((responseText) => {
					const html = new DOMParser().parseFromString(responseText, 'text/html');
					const sourceQty = html.querySelector('cart-items');
					this.innerHTML = sourceQty.innerHTML;
					document.dispatchEvent(new CustomEvent('cart-items:updated', {
						bubbles: true,
						detail: {source: 'main-cart'}
					}));
				})
				.catch((e) => {
					console.error(e);
				});
		}
	}

	getSectionsToRender() {
		return [
			{
				id: 'main-cart-items',
				section: document.getElementById('main-cart-items').dataset.id,
				selector: '.js-contents',
			},
			{
				id: 'cart-icon-bubble',
				section: 'cart-icon-bubble',
				selector: '.shopify-section',
			},
			{
				id: 'cart-live-region-text',
				section: 'cart-live-region-text',
				selector: '.shopify-section',
			},
			{
				id: 'main-cart-footer',
				section: document.getElementById('main-cart-footer').dataset.id,
				selector: '.js-contents',
			},
		];
	}

	async updateItemsQuantity(updates) {
		const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
		if (mainCartItems) {
			mainCartItems.classList.add('cart__items--disabled');
		}

		try {
			const body = JSON.stringify({
				updates: updates,
				sections: this.getSectionsToRender().map((section) => section.section),
				sections_url: window.location.pathname,
			});

			const updateResponse = await fetch(window.Shopify.routes.root + 'cart/update.js', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: body
			});

			if (!updateResponse.ok) {
				throw new Error('Cart update failed: ' + updateResponse.status);
			}

			const updateState = await updateResponse.json();
			this.classList.toggle('is-empty', updateState.item_count === 0);
			const cartDrawerWrapper = document.querySelector('cart-drawer');
			const cartFooter = document.getElementById('main-cart-footer');
			if (cartFooter) cartFooter.classList.toggle('is-empty', updateState.item_count === 0);
			if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', updateState.item_count === 0);

			// Update cart count in the title
			const cartTitle = document.querySelector('.title-wrapper-with-link .title > span');
			if (cartTitle) {
				cartTitle.textContent = updateState.item_count;
				cartTitle.setAttribute('data-count', updateState.item_count);
			}

			this.getSectionsToRender().forEach((section) => {
				const elementToReplace =
					document.getElementById(section.id)?.querySelector(section.selector) ||
					document.getElementById(section.id);
				if (elementToReplace && updateState.sections && updateState.sections[section.section]) {
					elementToReplace.innerHTML = this.getSectionInnerHTML(
						updateState.sections[section.section],
						section.selector
					);
				}
			});

			document.dispatchEvent(new CustomEvent('cart:updated', {
				bubbles: true,
				detail: {source: 'updateItemsQuantity'}
			}));

			// Update cart totals
			updateCartTotals();

			// Update custom options popups
			const customOptionsPopups = document.querySelector('.cart-item__custom-options-popups');
			if (customOptionsPopups && updateState.sections && updateState.sections[this.getSectionsToRender()[0].section]) {
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = this.getSectionInnerHTML(
					updateState.sections[this.getSectionsToRender()[0].section],
					'.cart-item__custom-options-popups'
				);
				const newCustomOptionsPopups = tempDiv.querySelector('.cart-item__custom-options-popups');
				if (newCustomOptionsPopups) {
					customOptionsPopups.innerHTML = newCustomOptionsPopups.innerHTML;
				}
			}

			// Update custom option popups (singular)
			const customOptionPopups = document.querySelector('.cart-item__custom-option-popups');
			if (customOptionPopups && updateState.sections && updateState.sections[this.getSectionsToRender()[0].section]) {
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = this.getSectionInnerHTML(
					updateState.sections[this.getSectionsToRender()[0].section],
					'.cart-item__custom-option-popups'
				);
				const newCustomOptionPopups = tempDiv.querySelector('.cart-item__custom-option-popups');
				if (newCustomOptionPopups) {
					customOptionPopups.innerHTML = newCustomOptionPopups.innerHTML;
				}
			}

			publish(PUB_SUB_EVENTS.cartUpdate, {
				source: 'cart-items',
				cartData: updateState
			});
			return updateState;
		} catch (error) {
			console.error('Error in updateItemsQuantity:', error);
			const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
			if (errors) {
				errors.textContent = window.cartStrings?.error || 'An error occurred while updating the cart.';
			}
		} finally {
			if (mainCartItems) {
				mainCartItems.classList.remove('cart__items--disabled');
			}
		}
	}

	async updateQuantity(line, quantity, name, variantId) {
		this.enableLoading(line);
		try {
			const body = JSON.stringify({
				line,
				quantity,
				sections: this.getSectionsToRender().map((section) => section.section),
				sections_url: window.location.pathname,
			});

			const mainUpdateResponse = await fetch(`${routes.cart_change_url}`, {
				...fetchConfig(),
				body,
			});
			const mainUpdateState = JSON.parse(await mainUpdateResponse.text());

			const quantityElement =
				document.getElementById(`Quantity-${line}`) ||
				document.getElementById(`Drawer-quantity-${line}`);
			const items = document.querySelectorAll('.cart-item');

			if (mainUpdateState.errors) {
				if (quantityElement) {
					quantityElement.value = quantityElement.getAttribute('value');
				}
				this.updateLiveRegions(line, mainUpdateState.errors);
				return;
			}

			this.classList.toggle('is-empty', mainUpdateState.item_count === 0);
			const cartDrawerWrapper = document.querySelector('cart-drawer');
			const cartFooter = document.getElementById('main-cart-footer');
			if (cartFooter) cartFooter.classList.toggle('is-empty', mainUpdateState.item_count === 0);
			if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', mainUpdateState.item_count === 0);
			this.getSectionsToRender().forEach((section) => {
				const elementToReplace =
					document.getElementById(section.id)?.querySelector(section.selector) ||
					document.getElementById(section.id);
				if (elementToReplace && mainUpdateState.sections && mainUpdateState.sections[section.section]) {
					elementToReplace.innerHTML = this.getSectionInnerHTML(
						mainUpdateState.sections[section.section],
						section.selector
					);
				}
			});

			document.dispatchEvent(new CustomEvent('cart:updated', {
				bubbles: true,
				detail: {source: 'updateQuantity'}
			}));
			const updatedValue = mainUpdateState.items[line - 1]?.quantity;

			// Update custom options popups
			const customOptionsPopups = document.querySelector('.cart-item__custom-options-popups');
			if (customOptionsPopups && mainUpdateState.sections && mainUpdateState.sections[this.getSectionsToRender()[0].section]) {
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = this.getSectionInnerHTML(
					mainUpdateState.sections[this.getSectionsToRender()[0].section],
					'.cart-item__custom-options-popups'
				);
				const newCustomOptionsPopups = tempDiv.querySelector('.cart-item__custom-options-popups');
				if (newCustomOptionsPopups) {
					customOptionsPopups.innerHTML = newCustomOptionsPopups.innerHTML;
				}
			}

			// Update custom option popups (singular)
			const customOptionPopups = document.querySelector('.cart-item__custom-option-popups');
			if (customOptionPopups && mainUpdateState.sections && mainUpdateState.sections[this.getSectionsToRender()[0].section]) {
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = this.getSectionInnerHTML(
					mainUpdateState.sections[this.getSectionsToRender()[0].section],
					'.cart-item__custom-option-popups'
				);
				const newCustomOptionPopups = tempDiv.querySelector('.cart-item__custom-option-popups');
				if (newCustomOptionPopups) {
					customOptionPopups.innerHTML = newCustomOptionPopups.innerHTML;
				}
			}

			const cartTitle = document.querySelector('.title-wrapper-with-link .title > span');
			if (cartTitle) {
				cartTitle.textContent = mainUpdateState.item_count;
				cartTitle.setAttribute('data-count', mainUpdateState.item_count);
			}
			let message = '';
			if (items.length === mainUpdateState.items.length && quantityElement && updatedValue !== parseInt(quantityElement.value)) {
				if (typeof updatedValue === 'undefined') {
					message = window.cartStrings.error;
				} else {
					message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
				}
			}
			this.updateLiveRegions(line, message);
			const lineItem =
				document.getElementById(`CartItem-${line}`) ||
				document.getElementById(`CartDrawer-Item-${line}`);
			if (lineItem?.querySelector(`[name="${name}"]`)) {
				cartDrawerWrapper
					? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
					: lineItem.querySelector(`[name="${name}"]`).focus();
			} else if (mainUpdateState.item_count === 0 && cartDrawerWrapper) {
				trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
			} else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
				trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
			}
			publish(PUB_SUB_EVENTS.cartUpdate, {
				source: 'cart-items',
				cartData: mainUpdateState,
				variantId,
			});
		} catch (error) {
			console.error('Error in updateQuantity:', error);
			this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
			const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
			if (errors) {
				errors.textContent = window.cartStrings.error;
			}
		} finally {
			this.disableLoading(line);
		}
	}

	updateLiveRegions(line, message) {
		const lineItemError =
			document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
		if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;
		this.lineItemStatusElement.setAttribute('aria-hidden', true);
		const cartStatus =
			document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
		cartStatus.setAttribute('aria-hidden', false);

		setTimeout(() => {
			cartStatus.setAttribute('aria-hidden', true);
		}, 1000);
	}

	getSectionInnerHTML(html, selector) {

		// document.querySelectorAll('.cart-item-new .show-extra').forEach(button => {
		//       button.addEventListener('click', () => {
		//           let currentItem = button.parentElement;
		//           let nextElement = currentItem.nextElementSibling;
		//           button.classList.toggle('active');

		//           while (nextElement && !nextElement.classList.contains('cart-item-new')) {
		//               if (nextElement.classList.contains('extra-option-item')) {
		//                   nextElement.classList.toggle('toggle');
		//               }
		//               nextElement = nextElement.nextElementSibling;
		//           }
		//       });
		//   });
		//   let totalContentCount = 0;
		//   document.querySelectorAll('.cart-item-new').forEach(cartItem => {
		//       let count = 0;
		//       let totalSum = 0;
		//       let hasExtraContent = false;
		//       let nextElement = cartItem.nextElementSibling;

		//       while (nextElement && !nextElement.classList.contains('cart-item-new')) {
		//           if (nextElement.classList.contains('extra-option-item')) {
		//               hasExtraContent = true;
		//               count++;
		//               totalContentCount++;
		//               const priceElement = nextElement.querySelector('.extra-option-price');
		//               if (priceElement) {
		//                   const priceText = priceElement.textContent.replace('$', '');
		//                   const price = parseFloat(priceText);
		//                   totalSum += isNaN(price) ? 0 : price;
		//               }
		//           }
		//           nextElement = nextElement.nextElementSibling;
		//       }

		//       const quantityDisplay = cartItem.querySelector('.extra-quantity .value');
		//       if (quantityDisplay) {
		//           quantityDisplay.textContent = count;
		//       }

		//       const priceDisplay = cartItem.querySelector('.options-price');
		//       if (priceDisplay) {
		//           priceDisplay.textContent = `$${totalSum.toFixed(2)}`;
		//       }

		//       const showExtraButton = cartItem.querySelector('.show-extra');

		//       if (showExtraButton && !hasExtraContent) {
		//           showExtraButton.style.display = 'none';
		//       } else {
		//           showExtraButton.style.display = 'flex';
		//       }
		//   });

		//   const drawerHeadingSpan = document.querySelector('.drawer__heading span');
		//   const drawerSubHeadingSpan = document.querySelector('.cart-drawer__subheading span');
		//   const cartCount = document.querySelector('.cart-count-bubble span');


		//   console.log(drawerHeadingSpan);
		//   if (drawerHeadingSpan && drawerSubHeadingSpan && cartCount ) {
		//       const initialCount = parseInt(drawerHeadingSpan.getAttribute('data-count'), 10);
		//       const newCount = isNaN(initialCount) ? 0 : initialCount - totalContentCount;
		//       drawerHeadingSpan.textContent = newCount;
		//       drawerSubHeadingSpan.textContent = newCount;
		//       cartCount.textContent = newCount;

		//       cartCount.style.display = "flex";
		//       // drawerHeadingSpan.style.display = "inline";
		//       // drawerSubHeadingSpan.style.display = "inline";
		//   }
		return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
	}

	enableLoading(line) {
		const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
		mainCartItems.classList.add('cart__items--disabled');

		const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
		const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

		[...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

		document.activeElement.blur();
		this.lineItemStatusElement.setAttribute('aria-hidden', false);
	}

	disableLoading(line) {
		const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
		mainCartItems.classList.remove('cart__items--disabled');

		const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
		const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

		cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
		cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
	}
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
	customElements.define(
		'cart-note',
		class CartNote extends HTMLElement {
			constructor() {
				super();
				this.addEventListener(
					'input',
					debounce((event) => {
						const body = JSON.stringify({note: event.target.value});
						fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{body}});
					}, ON_CHANGE_DEBOUNCE_TIMER)
				);
			}
		}
	);
}


function reinitializeCartComponents() {
	// Save the state of inputs before reinitializing components
	let savedInputStates = null;
	if (typeof window.saveInputStates === 'function') {
		savedInputStates = window.saveInputStates();
	}

	if (typeof window.initAllComponents === 'function') {
		window.initAllComponents();
	} else if (typeof initAllComponents === 'function') {
		initAllComponents();
	} else {
		console.log('initAllComponents function not found, reinitializing manually');
		setTimeout(() => {
			const triggers = document.querySelectorAll('.button--popup');
			const popups = document.querySelectorAll('.cart-item__custom-option-popup');

			console.log('Manually reinitializing popups:', popups.length);
			console.log('Manually reinitializing triggers:', triggers.length);
		}, 200);
	}

	// Restore the state of inputs after reinitializing components
	if (savedInputStates && typeof window.restoreInputStates === 'function') {
		window.restoreInputStates(savedInputStates);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const chatBtn = document.getElementById('chat');
	if (chatBtn) {
		chatBtn.addEventListener('click', function (e) {
			e.preventDefault();
			if (chatBtn.classList.contains('active')) {
				zE('messenger', 'close');
				chatBtn.classList.remove('active');
			} else {
				zE('messenger', 'open');
				chatBtn.classList.add('active');
			}
		});
	}

	attachAddButtonListeners();
	document.addEventListener('cart:updated', function (event) {
		console.log('Cart updated event detected, reattaching "Add" button listeners');
		setTimeout(attachAddButtonListeners, 100);
		updateCartTotals();
	});

	document.addEventListener('cart-items:updated', function (event) {
		console.log('Cart items updated event detected, reattaching "Add" button listeners');
		setTimeout(attachAddButtonListeners, 100);
		updateCartTotals();
	});

	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get('generateQuotes') === 'true') {
		document.querySelector('.download-quote').style.display = 'flex';
	}
});

function attachAddButtonListeners() {
	const addButtons = document.querySelectorAll('button[data-variant][data-key]');
	console.log('Found add buttons:', addButtons.length);

	addButtons.forEach(button => {
		const newButton = button.cloneNode(true);
		button.parentNode.replaceChild(newButton, button);
		newButton.addEventListener('click', async (event) => {
			event.preventDefault();
			console.log('Add button clicked');

			const variantId = newButton.dataset.variant;
			const uniqueKey = newButton.dataset.key;
			const buttonGroupId = newButton.dataset.group;
			console.log('Variant ID:', variantId, 'Unique Key:', uniqueKey, 'Group ID:', buttonGroupId);

			if (!variantId || !uniqueKey) {
				console.error('Missing variant ID or unique key');
				return;
			}
			try {
				newButton.disabled = true;
				newButton.classList.add('loading');
				console.log('Button disabled and loading class added');
				console.log('Fetching cart data...');
				const cartResponse = await fetch('/cart.js');
				if (!cartResponse.ok) {
					throw new Error('Failed to fetch cart data');
				}
				const cartData = await cartResponse.json();
				console.log('Cart data:', cartData);

				// Улучшенный алгоритм поиска родительского продукта
				let parentItem = null;

				parentItem = cartData.items.find(item =>
					(item.properties?._unique_key === uniqueKey) ||
					(item.key === uniqueKey)
				);
				console.log('Search by unique key:', uniqueKey, 'Found:', !!parentItem);


				if (!parentItem) {
					throw new Error('Parent item not found in cart');
				}

				console.log('Parent item details:', {
					id: parentItem.id,
					variant_id: parentItem.variant_id,
					product_id: parentItem.product_id,
					key: parentItem.key,
					quantity: parentItem.quantity,
					properties: parentItem.properties
				});


				const existingOptions = cartData.items.filter(item =>
					item.properties?._parent_product_id === parentItem.product_id &&
					item.properties?._group_id === parentItem.properties?._group_id
				);
				console.log('Found existing options:', existingOptions.length);

				console.log('Fetching variant information...');
				const variantResponse = await fetch(`/variants/${variantId}.js`);
				if (!variantResponse.ok) {
					throw new Error('Failed to fetch variant data');
				}

				const variantInfo = await variantResponse.json();
				console.log('Variant information:', variantInfo);

				const timestamp = Date.now();
				const randomString = Math.random().toString(36).substring(2, 15);

				const groupId = buttonGroupId || (timestamp + '-' + randomString);
				const generatedUniqueKey = groupId + '-' + variantId;
				const parentUniqueKey = groupId + '-' + parentItem.variant_id;

				const optionProperties = {
					_parent_product_id: parentItem.product_id,
					_unique_key: generatedUniqueKey,
					_group_id: groupId,
				};
				const updatedParentProperties = {
					...parentItem.properties,
					_unique_key: parentUniqueKey,
					_group_id: groupId,
					"Warranty": parentItem.properties?.Warranty || "10 Years Parts + 1 Year On-Site Labor",
					"Processing Time": parentItem.properties?.["Processing Time"] || "Ships from our Warehouse in 3-7 Business Days",
				};

				const parentQuantity = parentItem.quantity || 1;
				console.log('Using parent quantity for option:', parentQuantity);

				// Batch remove all existing options and parent product in a single operation
				const itemsToRemove = {};
				existingOptions.forEach(option => {
					itemsToRemove[option.key] = 0;
				});
				itemsToRemove[parentItem.key] = 0;

				// Remove all items in a single request
				const removeResponse = await fetch('/cart/update.js', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						updates: itemsToRemove
					})
				});

				if (!removeResponse.ok) {
					throw new Error('Failed to remove items from cart');
				}

				const removeData = await removeResponse.json();
				console.log('Remove items response:', removeData);

				// Подготавливаем существующие опции с новым group-id
				const updatedExistingOptions = existingOptions.map(option => ({
					id: option.variant_id,
					quantity: option.quantity,
					properties: {
						...option.properties,
						_group_id: groupId,
						_unique_key: groupId + '-' + option.variant_id
					}
				}));


				const itemsToAdd = [

					...updatedExistingOptions,
					{
						id: variantId,
						quantity: 1,
						properties: optionProperties
					},
					{
						id: parentItem.variant_id,
						quantity: parentQuantity,
						properties: updatedParentProperties
					},

				];

				console.log('Adding parent product and all product options to cart...');
				const addItemsResponse = await fetch('/cart/add.js', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						items: itemsToAdd
					})
				});

				if (!addItemsResponse.ok) {
					throw new Error('Failed to add items to cart');
				}

				const addItemsData = await addItemsResponse.json();
				console.log('Add items response:', addItemsData);

				console.log('Refreshing cart display...');
				const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');

				// Completely re-render cart items by fetching the updated HTML from the server
				if (cartItems) {
					if (cartItems.tagName === 'CART-DRAWER-ITEMS') {
						// For cart drawer
						try {
							const cartResponse = await fetch(`${routes.cart_url}?section_id=cart-drawer`);
							const cartResponseText = await cartResponse.text();
							const cartHtml = new DOMParser().parseFromString(cartResponseText, 'text/html');

							// Replace the entire cart-drawer-items content
							const sourceElement = cartHtml.querySelector('cart-drawer-items');
							if (sourceElement && cartItems) {
								cartItems.innerHTML = sourceElement.innerHTML;
							}

							// Also update the cart drawer footer if it exists
							const footerElement = document.querySelector('.cart-drawer__footer');
							const sourceFooter = cartHtml.querySelector('.cart-drawer__footer');
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
							const cartResponse = await fetch(`${routes.cart_url}?section_id=main-cart-items`);
							const cartResponseText = await cartResponse.text();
							const cartHtml = new DOMParser().parseFromString(cartResponseText, 'text/html');

							// Replace the entire cart-items content
							const sourceElement = cartHtml.querySelector('cart-items');
							if (sourceElement && cartItems) {
								cartItems.innerHTML = sourceElement.innerHTML;
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
				console.log('Product option added successfully!');

				// Update cart totals
				updateCartTotals();

				// Close the popup after successful addition
				const popup = newButton.closest('.cart-item__custom-option-popup');
				const overlay = document.querySelector('.overlay');
				if (popup) {
					popup.style.display = 'none';
					if (overlay) overlay.classList.remove('active');
					document.querySelector('html').style.overflow = '';

					// Reinitialize all popups to ensure they remain accessible
					setTimeout(() => {
						const allPopups = document.querySelectorAll('.cart-item__custom-option-popup');
						allPopups.forEach(p => {
							if (p !== popup) {
								p.style.display = 'none'; // Reset display style
							}
						});

						// Use the helper function to reinitialize components
						reinitializeCartComponents();
					}, 100);
				}

			} catch (error) {
				console.error('Error adding option to cart:', error);
			} finally {
				newButton.disabled = false;
				newButton.classList.remove('loading');
				console.log('Button re-enabled');
			}
		});
	});
}

const fsUrl = 'https://fitnesssuperstore-api.azurewebsites.net';

async function downloadQuoteCSV() {
	const gsheetQuoteBtn = document.getElementById('csv-quote-btn');
	gsheetQuoteBtn.disabled = true;

	const cartResponse = await fetch(`/cart.json`, {
		method: 'GET'
	});

	const cartData = await cartResponse.json();

	if (cartData) {
		const shippingElement = document.querySelector('.docapp-shipping-rate-name');
		const shippingName = shippingElement?.querySelector('label')?.textContent;
		const shippingValue = shippingElement?.querySelector('label input')?.value;

		const generateQuoteResponse = await fetch(`${fsUrl}/api/quotes/csv`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				products: cartData.items,
				shippingName: shippingName,
				shippingTotal: shippingValue
			})
		});

		if (generateQuoteResponse.ok) {
			const quoteResponse = await generateQuoteResponse.json();
			if (quoteResponse) {
				window.location.href = `${fsUrl}/api/quotes/downloadcsv?fileDownloadName=${quoteResponse}`;
			}
		}

		gsheetQuoteBtn.disabled = false;
	}
}

async function downloadQuoteGsheet() {
	const csvQuoteBtn = document.getElementById('gsheet-quote-btn');
	csvQuoteBtn.disabled = true;

	const cartResponse = await fetch(`/cart.json`, {
		method: 'GET'
	});

	const cartData = await cartResponse.json();

	if (cartData) {
		const shippingElement = document.querySelector('.docapp-shipping-rate-name');
		const shippingName = shippingElement?.querySelector('label')?.textContent;
		const shippingValue = shippingElement?.querySelector('label input')?.value;

		const generateQuoteGsheetResponse = await fetch(`${fsUrl}/api/quotes/gsheet`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				products: cartData.items,
				shippingName: shippingName,
				shippingTotal: shippingValue
			})
		});

		if (generateQuoteGsheetResponse.ok) {
			const quoteResponse = await generateQuoteGsheetResponse.json();
			if (quoteResponse) {
				window.open(quoteResponse, '_blank');
			}
		}
		csvQuoteBtn.disabled = false;
	}
}

// Function to update cart totals in main-cart-footer
window.updateCartTotals = async function () {
	try {
		console.log('Updating cart totals in main-cart-footer');
		const response = await fetch('/cart.js');
		if (!response.ok) {
			throw new Error('Failed to fetch cart data');
		}

		const cartData = await response.json();

		// Update subtotal value if it exists
		const subtotalElement = document.querySelector('.totals__subtotal-value:not(.total-price)');
		if (subtotalElement) {
			const formattedSubtotal = formatMoney(cartData.original_total_price);
			subtotalElement.textContent = formattedSubtotal;
		}

		// Update discount value if it exists
		const discountElement = document.querySelector('.totals-value .totals__subtotal-value');
		if (discountElement && cartData.total_discount > 0) {
			const formattedDiscount = '-' + formatMoney(cartData.total_discount);
			discountElement.textContent = formattedDiscount;
		}

		// Update total price
		const totalPriceElement = document.querySelector('.totals__subtotal-value.total-price');
		if (totalPriceElement) {
			const formattedTotal = formatMoney(cartData.total_price);
			totalPriceElement.textContent = formattedTotal;
		}

		console.log('Cart totals updated successfully');
	} catch (error) {
		console.error('Error updating cart totals:', error);
	}
}

// Helper function to format money values
function formatMoney(cents) {
	if (typeof cents === 'string') {
		cents = cents.replace('.', '');
	}

	const value = parseInt(cents || 0, 10);
	const dollars = Math.floor(value / 100);
	const cents_part = (value % 100).toString().padStart(2, '0');

	// Format dollars with commas as thousands separators
	const formatted_dollars = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return '$' + formatted_dollars + '.' + cents_part;
}

async function clearCart() {
	const clearEndpoint = '/cart/clear.js';

	try {
		const mainClearBtn = document.getElementById('clear-cart-btn');
		const drawerClearBtn = document.getElementById('drawer-clear-cart-btn');

		if (mainClearBtn) mainClearBtn.disabled = true;
		if (drawerClearBtn) drawerClearBtn.disabled = true;
		const mainCartItems = document.getElementById('main-cart-items');
		const cartDrawerItems = document.getElementById('CartDrawer-CartItems');

		if (mainCartItems) mainCartItems.classList.add('cart__items--disabled');
		const response = await fetch(clearEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to clear cart');
		}
		const cartData = await response.json();
		const cartItems = document.querySelector('cart-items');
		const cartDrawer = document.querySelector('cart-drawer');

		if (cartItems) {
			cartItems.classList.add('is-empty');

			// Completely re-render cart items by fetching the updated HTML from the server
			try {
				const cartResponse = await fetch(`${routes.cart_url}?section_id=main-cart-items`);
				const cartResponseText = await cartResponse.text();
				const cartHtml = new DOMParser().parseFromString(cartResponseText, 'text/html');

				// Replace the entire cart-items content
				const sourceElement = cartHtml.querySelector('cart-items');
				if (sourceElement && cartItems) {
					cartItems.innerHTML = sourceElement.innerHTML;
				}

				document.dispatchEvent(new CustomEvent('cart-items:updated', {
					bubbles: true,
					detail: {source: 'main-cart'}
				}));
			} catch (e) {
				console.error('Error updating main cart:', e);
				// Fallback to the original method
				cartItems.onCartUpdate();
			}
		}

		if (cartDrawer) {
			cartDrawer.classList.add('is-empty');
			const drawerInner = cartDrawer.querySelector('.drawer__inner');
			if (drawerInner) {
				drawerInner.classList.add('is-empty');
			}
			cartDrawer.showEmptyState();
		}

		const cartCountBubble = document.querySelector('.cart-count-bubble');
		if (cartCountBubble) {
			cartCountBubble.style.display = 'none';
		}

		if (mainClearBtn) mainClearBtn.disabled = false;
		if (drawerClearBtn) drawerClearBtn.disabled = false;
		if (mainCartItems) mainCartItems.classList.remove('cart__items--disabled');

		publish(PUB_SUB_EVENTS.cartUpdate, {
			source: 'cart-items',
			cartData: cartData
		});

		// Update cart totals
		updateCartTotals();

	} catch (error) {
		console.error('Error clearing cart:', error);

		const mainClearBtn = document.getElementById('clear-cart-btn');
		const drawerClearBtn = document.getElementById('drawer-clear-cart-btn');

		if (mainClearBtn) mainClearBtn.disabled = false;
		if (drawerClearBtn) drawerClearBtn.disabled = false;

		const mainCartItems = document.getElementById('main-cart-items');
		if (mainCartItems) mainCartItems.classList.remove('cart__items--disabled');


		const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
		if (errors) {
			errors.textContent = 'An error occurred while clearing the cart.';
		}
	}
}
