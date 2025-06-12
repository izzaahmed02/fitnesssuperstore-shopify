class CartDrawer extends HTMLElement {
	constructor() {
		super();
		this._cartDrawerHandler = null;
		this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
		this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
		this.setHeaderCartIconAccessibility();
		this.registerCartDrawerActions();
	}

	setHeaderCartIconAccessibility() {
		const cartLink = document.querySelector('#cart-icon-bubble');
		cartLink.setAttribute('role', 'button');
		cartLink.setAttribute('aria-haspopup', 'dialog');
		cartLink.addEventListener('click', (event) => {
			event.preventDefault();
			this.open(cartLink);
		});
		cartLink.addEventListener('keydown', (event) => {
			if (event.code.toUpperCase() === 'SPACE') {
				event.preventDefault();
				this.open(cartLink);
			}
		});
	}

	open(triggeredBy) {
		if (triggeredBy) this.setActiveElement(triggeredBy);
		const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
		if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
		// here the animation doesn't seem to always get triggered. A timeout seem to help
		setTimeout(() => {
			this.classList.add('animate', 'active');
		});

		this.addEventListener(
			'transitionend',
			() => {
				const containerToTrapFocusOn = this.classList.contains('is-empty')
					? this.querySelector('.drawer__inner-empty')
					: document.getElementById('CartDrawer');
				const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
				// trapFocus(containerToTrapFocusOn, focusElement);
			},
			{once: true}
		);

		document.body.classList.add('overflow-hidden');
	}

	close() {
		this.classList.remove('active');
		removeTrapFocus(this.activeElement);
		document.body.classList.remove('overflow-hidden');
	}

	setSummaryAccessibility(cartDrawerNote) {
		cartDrawerNote.setAttribute('role', 'button');
		cartDrawerNote.setAttribute('aria-expanded', 'false');

		if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
			cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
		}

		cartDrawerNote.addEventListener('click', (event) => {
			event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
		});

		cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
	}

	renderContents(parsedState) {
		// Always remove the is-empty class when rendering contents
		const drawerInner = this.querySelector('.drawer__inner');
		if (drawerInner) {
			drawerInner.classList.remove('is-empty');
		}
		// Remove is-empty class from the cart-drawer itself
		this.classList.remove('is-empty');

		// Hide the empty cart content if it exists
		const emptyContent = this.querySelector('.drawer__inner-empty');
		if (emptyContent) {
			emptyContent.style.display = 'none';
		}

		this.productId = parsedState.id;
		this.getSectionsToRender().forEach((section) => {
			const sectionElement = section.selector
				? document.querySelector(section.selector)
				: document.getElementById(section.id);
			sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
		});

		setTimeout(() => {
			this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
			this.open();

		});
		setTimeout(() => {
			document.querySelectorAll('.cart-item-new .show-extra').forEach(button => {
				button.addEventListener('click', () => {
					let currentItem = button.parentElement;
					let nextElement = currentItem.nextElementSibling;
					button.classList.toggle('active');

					while (nextElement && !nextElement.classList.contains('cart-item-new')) {
						if (nextElement.classList.contains('extra-option-item')) {
							nextElement.classList.toggle('toggle');
						}
						nextElement = nextElement.nextElementSibling;
					}
				});
			});
			let totalContentCount = 0;
			document.querySelectorAll('.cart-item-new').forEach(cartItem => {
				let count = 0;
				let totalSum = 0;
				let hasExtraContent = false;
				let nextElement = cartItem.nextElementSibling;

				while (nextElement && !nextElement.classList.contains('cart-item-new')) {
					if (nextElement.classList.contains('extra-option-item')) {
						hasExtraContent = true;
						count++;
						totalContentCount++;
						const priceElement = nextElement.querySelector('.extra-option-price');
						if (priceElement) {
							const priceText = priceElement.textContent.replace('$', '');
							const price = parseFloat(priceText);
							totalSum += isNaN(price) ? 0 : price;
						}
					}
					nextElement = nextElement.nextElementSibling;
				}

				const quantityDisplay = cartItem.querySelector('.extra-quantity .value');
				if (quantityDisplay) {
					quantityDisplay.textContent = count;
				}

				const priceDisplay = cartItem.querySelector('.options-price');
				if (priceDisplay) {
					// Format with commas as thousands separators
					const formatted = totalSum.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
					priceDisplay.textContent = `$${formatted}`;
				}

				const showExtraButton = cartItem.querySelector('.show-extra');

				if (showExtraButton && !hasExtraContent) {
					showExtraButton.style.display = 'none';
				} else {
					// showExtraButton.style.display = 'flex';
				}
			});

			const drawerHeadingSpan = document.querySelector('.drawer__heading span');
			const drawerSubHeadingSpan = document.querySelector('.cart-drawer__subheading span');
			const cartCount = document.querySelector('.cart-count-bubble span');


			if (drawerHeadingSpan && drawerSubHeadingSpan && cartCount) {
				const initialCount = parseInt(drawerHeadingSpan.getAttribute('data-count'), 10);
				const newCount = isNaN(initialCount) ? 0 : initialCount - totalContentCount;
				drawerHeadingSpan.textContent = newCount;
				drawerSubHeadingSpan.textContent = newCount;
				cartCount.textContent = newCount;

				cartCount.style.display = "flex";
				// drawerHeadingSpan.style.display = "inline";
				// drawerSubHeadingSpan.style.display = "inline";
			}
		}, 200);
	}

	getSectionInnerHTML(html, selector = '.shopify-section') {
		return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
	}

	getSectionsToRender() {
		return [
			{
				id: 'cart-drawer',
				selector: '#CartDrawer',
			},
			{
				id: 'cart-icon-bubble',
			},
		];
	}

	getSectionDOM(html, selector = '.shopify-section') {
		return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
	}

	setActiveElement(element) {
		this.activeElement = element;
	}

	registerCartDrawerActions() {
		if (this._cartDrawerHandler) {
			document.removeEventListener('click', this._cartDrawerHandler);
		}

		this._cartDrawerHandler = async (e) => {
			const minusBtn = e.target.closest('.quantity-btn--minus');
			if (minusBtn) {
				const key = minusBtn.dataset.key;
				const variantId = minusBtn.dataset.variantid || minusBtn.dataset.variantId;
				const cartItem = minusBtn.closest('tr');
				const lineItemId = cartItem.dataset.index;
				const qtyEl = minusBtn.parentElement.querySelector('.quantity-text');
				const currentQty = parseInt(qtyEl.textContent, 10) || 1;

				const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');
				if (cartItems) {
					if (currentQty > 1) {
						cartItems.updateQuantity(lineItemId, currentQty - 1, 'quantity', variantId);
					} else {
						cartItems.updateQuantity(lineItemId, 0, 'quantity', variantId);
					}
				}
				return;
			}

			const plusBtn = e.target.closest('.quantity-btn--plus');
			if (plusBtn) {
				const key = plusBtn.dataset.key;
				const variantId = plusBtn.dataset.variantid || plusBtn.dataset.variantId;
				const cartItem = plusBtn.closest('tr');
				const lineItemId = cartItem.dataset.index;
				const qtyEl = plusBtn.parentElement.querySelector('.quantity-text');
				const currentQty = parseInt(qtyEl.textContent, 10) || 1;

				const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');
				if (cartItems) {
					cartItems.updateQuantity(lineItemId, currentQty + 1, 'quantity', variantId);
				}
				return;
			}

			const removeBtn = e.target.closest('.cart-remove-button');
			if (removeBtn) {
				e.stopPropagation();
				const key = removeBtn.dataset.key;

				// Get the current cart data to check if this is a main product
				try {
					const response = await fetch('/cart.js');
					if (!response.ok) {
						throw new Error('Failed to fetch cart data');
					}

					const cartData = await response.json();
					const currentItem = cartData.items.find(item => item.key === key);
					if (currentItem && !currentItem.properties?._parent_product_id) {
						const relatedItems = cartData.items.filter(item =>
							item.properties?._group_id && item.properties?._group_id === currentItem.properties?._group_id && item.key !== key
						);

						const updates = {};

						// Add all related items to the updates object
						for (const item of relatedItems) {
							updates[item.key] = 0;
						}

						// Add the clicked item to the updates object
						updates[key] = 0;

						// Remove all items in a single request
						await this.updateCartItems(updates);
					} else {

						if (currentItem && currentItem.properties?._parent_product_id) {
							const parentItem = cartData.items.find(item =>
								!item.properties?._parent_product_id &&
								item.properties?._group_id === currentItem.properties?._group_id
							);
							console.log(currentItem)
							if (parentItem) {
								const isColorOption =
									(currentItem.variant_title &&
										(currentItem.variant_title.toLowerCase().includes('color') ||
											currentItem.variant_title.toLowerCase().includes('paint') ||
											currentItem.variant_title.toLowerCase().includes('vinyl')));
								if (isColorOption) {
									const colorProperties = Object.keys(parentItem.properties || {}).filter(key =>
										key.toLowerCase().includes('color') ||
										key.toLowerCase().includes('paint') ||
										key.toLowerCase().includes('vinyl')
									);

									if (colorProperties.length > 0) {
										const updatedProperties = {...parentItem.properties};
										colorProperties.forEach(key => {
											delete updatedProperties[key];
										});

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
							}
						}

						// Remove the clicked item
						await this.updateCartItem(key, 0);
					}
				} catch (error) {
					console.error('Error removing items:', error);
					// Fallback to just removing the clicked item
					try {
						// Try bulk update first as fallback
						await this.updateCartItems({[key]: 0});
					} catch (fallbackError) {
						console.error('Fallback bulk update failed:', fallbackError);
						// If bulk update fails, try individual update
						await this.updateCartItem(key, 0);
					}
				}

				return;
			}
		};

		document.addEventListener('click', this._cartDrawerHandler);
	}

	unregisterCartDrawerActions() {
		if (this._cartDrawerHandler) {
			document.removeEventListener('click', this._cartDrawerHandler);
			this._cartDrawerHandler = null;
		}
	}

	async updateCartItems(updates) {
		try {
			// Fetch the cart-drawer-items element to get the sections to render
			const cartDrawerItems = document.querySelector('cart-drawer-items');
			const sectionsToRender = cartDrawerItems ? cartDrawerItems.getSectionsToRender() : null;

			// Prepare the request body with sections to update
			const body = {
				updates: updates
			};

			// Add sections to the request if available
			if (sectionsToRender) {
				body.sections = sectionsToRender.map(section => section.section);
				body.sections_url = window.location.pathname;
			}

			const response = await fetch('/cart/update.js', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				console.error('Cart bulk update failed:', response.status);
				return;
			}

			const cart = await response.json();

			// Update the cart total if needed
			const totalEl = document.querySelector('.cart-total');
			if (totalEl) {
				totalEl.textContent = this.formatMoney(cart.total_price);
			}

			// Remove rows for items that were removed
			Object.keys(updates).forEach(key => {
				if (updates[key] === 0) {
					const rowEl = document.querySelector(`tr[data-key="${key}"]`);
					if (rowEl) {
						rowEl.remove();
					}
				}
			});

			// Check if cart is empty and update UI accordingly
			if (cart.item_count === 0) {
				this.showEmptyState();
			}

			// Update all sections that need to be re-rendered
			if (sectionsToRender && cart.sections) {
				sectionsToRender.forEach((section) => {
					const elementToReplace =
						document.getElementById(section.id)?.querySelector(section.selector) ||
						document.getElementById(section.id);

					if (elementToReplace && cart.sections[section.section]) {
						elementToReplace.innerHTML = this.getSectionInnerHTML(
							cart.sections[section.section],
							section.selector
						);
					}
				});
			}

			// Refresh event handlers
			this.unregisterCartDrawerActions();
			this.registerCartDrawerActions();
		} catch (err) {
			console.error('Error updating cart items:', err);
		}
	}

	async updateCartItem(itemKey, newQty) {
		try {
			// Fetch the cart-drawer-items element to get the sections to render
			const cartDrawerItems = document.querySelector('cart-drawer-items');
			const sectionsToRender = cartDrawerItems ? cartDrawerItems.getSectionsToRender() : null;

			// Prepare the request body with sections to update
			const body = {
				id: itemKey,
				quantity: newQty
			};

			// Add sections to the request if available
			if (sectionsToRender) {
				body.sections = sectionsToRender.map(section => section.section);
				body.sections_url = window.location.pathname;
			}

			const response = await fetch('/cart/change.js', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				console.error('Cart update failed:', response.status);
				return;
			}

			const cart = await response.json();

			// Update the cart total if needed
			const totalEl = document.querySelector('.cart-total');
			if (totalEl) {
				totalEl.textContent = this.formatMoney(cart.total_price);
			}

			const updatedItem = cart.items.find(i => i.key === itemKey);
			const rowEl = document.querySelector(`tr[data-key="${itemKey}"]`);

			if (!updatedItem && rowEl) {
				rowEl.remove();

				// Check if cart is empty and update UI accordingly
				if (cart.item_count === 0) {
					this.showEmptyState();
				}
			} else if (updatedItem && rowEl) {
				const qtySpan = rowEl.querySelector('.quantity-text');
				if (qtySpan) {
					qtySpan.textContent = updatedItem.quantity;
				}
			}

			// Update all sections that need to be re-rendered
			if (sectionsToRender && cart.sections) {
				sectionsToRender.forEach((section) => {
					const elementToReplace =
						document.getElementById(section.id)?.querySelector(section.selector) ||
						document.getElementById(section.id);

					if (elementToReplace && cart.sections[section.section]) {
						elementToReplace.innerHTML = this.getSectionInnerHTML(
							cart.sections[section.section],
							section.selector
						);
					}
				});
			}

			this.unregisterCartDrawerActions();
			this.registerCartDrawerActions();
		} catch (err) {
			console.error('Error updating cart item:', err);
		}
	}

	showEmptyState() {
		// Add is-empty class to cart-drawer
		this.classList.add('is-empty');

		// Add is-empty class to drawer__inner if it exists
		const drawerInner = this.querySelector('.drawer__inner');
		if (drawerInner) {
			drawerInner.classList.add('is-empty');
		}

		// Show the empty cart content
		let emptyContent = this.querySelector('.drawer__inner-empty');

		// If the empty content doesn't exist, we need to create it
		if (!emptyContent) {
			// Fetch the cart drawer with empty state
			fetch(`${routes.cart_url}?section_id=cart-drawer`)
				.then((response) => response.text())
				.then((responseText) => {
					const html = new DOMParser().parseFromString(responseText, 'text/html');
					const newEmptyContent = html.querySelector('.drawer__inner-empty');

					if (newEmptyContent) {
						// Insert the empty content before the drawer__inner
						if (drawerInner) {
							drawerInner.parentNode.insertBefore(newEmptyContent, drawerInner);
							// Now show it
							newEmptyContent.style.display = 'flex';
						}
					}
				})
				.catch((e) => {
					console.error('Error fetching empty cart state:', e);
				});
		} else {
			// If it exists, just show it
			emptyContent.style.display = 'block';
		}
	}

	formatMoney(cents) {
		const dollars = (cents / 100).toFixed(2);
		// Format with commas as thousands separators
		const formatted = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return `$${formatted}`;
	}
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
	getSectionsToRender() {
		return [
			{
				id: 'CartDrawer',
				section: 'cart-drawer',
				selector: '.drawer__inner',
			},
			{
				id: 'cart-icon-bubble',
				section: 'cart-icon-bubble',
				selector: '.shopify-section',
			},
		];
	}
}

customElements.define('cart-drawer-items', CartDrawerItems);
