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

		const closePopup = () => {
			popup.classList.remove('active');
			overlay.classList.remove('active');
			document.querySelector('html, body').classList.remove('overflow-hidden');
			removeBtn.removeEventListener('click', removeItem);
		};

		removeBtn.addEventListener('click', (event) => {
			event.preventDefault();
			removeItem();
		});
		cancelBtn.addEventListener('click', (event) => {
			event.preventDefault();
			closePopup();
		});
		closeBtn.addEventListener('click', (event) => {
			event.preventDefault();
			closePopup();
		});
		overlay.addEventListener('click', closePopup);
	}

	removeItem() {
		const cartItems = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');
		if (cartItems) {
			cartItems.updateQuantity(this.dataset.index, 0);
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

	async updateQuantity(line, quantity, name, variantId) {
		this.enableLoading(line);

		try {
			// const cartResponse = await fetch('/cart.js');
			// const cartData = await cartResponse.json();
			// const mainProduct = cartData.items[line - 1];
	
			// let matchingProductLine = null;

			// if (mainProduct && mainProduct.properties?.['Custom color']) {
			// 	const customColorValue = mainProduct.properties['Custom color'];

			// 	const matchingProduct = cartData.items.find(
			// 		(item) =>
			// 			item.id === 50607223603516 &&
			// 			item.properties?.['Color'] === customColorValue
			// 	);

			// 	if (matchingProduct) {
			// 		matchingProductLine = matchingProduct.key;
			// 	}
			// }

			// Updating matching product
			// if (matchingProductLine) {
			// 	await fetch(window.Shopify.routes.root + 'cart/update.js', {
			// 		method: 'POST',
			// 		headers: {
			// 			'Content-Type': 'application/json',
			// 		},
			// 		body: JSON.stringify({
			// 			updates: {
			// 				[matchingProductLine]: quantity,
			// 			},
			// 		}),
			// 	})

			// }

			// Main product update
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
				quantityElement.value = quantityElement.getAttribute('value');
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
					document.getElementById(section.id).querySelector(section.selector) ||
					document.getElementById(section.id);
				elementToReplace.innerHTML = this.getSectionInnerHTML(
					mainUpdateState.sections[section.section],
					section.selector
				);
			});

			const updatedValue = mainUpdateState.items[line - 1]?.quantity;

			const cartTitle = document.querySelector('.title-wrapper-with-link .title > span');

			if (cartTitle) {
				cartTitle.textContent = updatedValue;
			}

			let message = '';
			if (items.length === mainUpdateState.items.length && updatedValue !== parseInt(quantityElement.value)) {
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
			errors.textContent = window.cartStrings.error;
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

// Change Edit Options Button
document.addEventListener("DOMContentLoaded", () => {
	const updateText = (element) => {
		if (!element) return;

		const span = element.querySelector('span');
		if (span && span.textContent.trim() !== "Modify") {
			span.textContent = "Modify";
		}
	};

	const observerLabels = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('avis-edit-options')) {
					node.setAttribute('data-cart-item', node.parentElement.getAttribute('data-cart-item'));
					updateText(node);
					node.addEventListener('click', (event) => {
						window.avisModifyButton = node.getAttribute('data-cart-item');
					});
				}
			});
		});
	});

	try {
		observerLabels.observe(document.body, {childList: true, subtree: true});
		document.querySelectorAll('.avis-edit-options').forEach(updateText);
	} catch (error) {
		console.error("Error initializing observer:", error);
	}

	const debounce = (func, delay) => {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), delay);
		};
	};

	const observerCartBlock = new ResizeObserver(
		debounce(() => {
			const assistanceBlock = document.querySelector(".cart-items__assistance");
			const footerWrapper = document.querySelector(".cart__footer-wrapper");

			if (!assistanceBlock || !footerWrapper) {
				return;
			}

			if (window.innerWidth <= 992) {
				if (!footerWrapper.contains(assistanceBlock)) {
					footerWrapper.appendChild(assistanceBlock);
				}
			} else {
				const originalParent = document.querySelector(".section-cart-items");
				if (originalParent && !originalParent.contains(assistanceBlock)) {
					originalParent.appendChild(assistanceBlock);
				}
			}
		}, 200)
	);
	observerCartBlock.observe(document.body);

	// const drShippingPoll = setInterval(() => {
	// 	const drShippingZipCodeElement = document.querySelector('.docapp-shipping-calculator--input-zip');
	// 	if (drShippingZipCodeElement) {
	// 		drShippingZipCodeElement.addEventListener('change', (event) => {
	// 			const targetElement = event.target;
	// 			const value = targetElement.value;
	// 			if (value) {
	// 				setCartAttributeZipCode(value);
	// 			}
	// 		});
	// 		clearInterval(drShippingPoll);
	// 	}
	// }, 100);
});


document.addEventListener('DOMContentLoaded', () => {
	const chatBtn = document.getElementById('chat');
	if (!chatBtn) return;
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

	const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get('generateQuotes') === 'true') {
	document.querySelector('.download-quote').style.display = 'flex';
} 
});

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

function setCartAttributeZipCode(zip) {
fetch('/cart/update.js', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    attributes: {
      zipCode: zip
    }
  })
})
.catch(error => {
  console.error('Error updating cart attribute:', error);
});

}