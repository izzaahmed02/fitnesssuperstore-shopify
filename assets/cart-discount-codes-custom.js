(() => {
	function initDiscountScript() {
		const appliedDiscountsContainer = document.getElementById('applied-discounts');
		const applyBtn = document.getElementById('apply-discount-btn');
		const discountInput = document.getElementById('discount-input');
		if (!appliedDiscountsContainer || !applyBtn || !discountInput) return;

		const strings = window.cartDiscountStrings || {};
		const MSG_NO_CODE = strings.errorNoCode || "Please enter a discount code.";
		const MSG_ALREADY_APPLIED = strings.errorAlreadyApplied || "That discount code is already applied.";
		const MSG_INVALID = strings.errorInvalid || "Discount code is invalid or not applicable.";

		function clearMessages() {
			const errDiv = document.getElementById('discount-error-message');
			if (errDiv) {
				errDiv.style.display = 'none';
				errDiv.textContent = '';
			}
		}

		function showError(msg) {
			const errDiv = document.getElementById('discount-error-message');
			if (errDiv) {
				errDiv.style.display = 'block';
				errDiv.textContent = msg;
			}
		}

		function getCurrentDiscounts() {
			const pills = document.querySelectorAll('#applied-discounts .discount-pill');
			return Array.from(pills).map((pill) => pill.getAttribute('data-code').toUpperCase());
		}

		function triggerCartUpdate() {
			const cartDrawerItems = document.querySelector('cart-drawer-items');
			if (cartDrawerItems && typeof cartDrawerItems.updateQuantity === 'function') {
				const qtyInput =
					document.getElementById('Drawer-quantity-1') ||
					document.getElementById('Quantity-1');
				if (qtyInput) {
					const currentQty = parseInt(qtyInput.value, 10) || 1;
					cartDrawerItems.updateQuantity(1, currentQty);
					return;
				} else {
					// Completely re-render cart drawer items
					try {
						const cartResponse =  fetch(`${routes.cart_url}?section_id=cart-drawer`);
						const cartResponseText =  cartResponse.text();
						const cartHtml = new DOMParser().parseFromString(cartResponseText, 'text/html');

						// Replace the entire cart-drawer-items content
						const sourceElement = cartHtml.querySelector('cart-drawer-items');
						if (sourceElement && cartDrawerItems) {
							cartDrawerItems.innerHTML = sourceElement.innerHTML;
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
						cartDrawerItems.onCartUpdate();
					}
					return;
				}
			}

			const cartItems = document.querySelector('cart-items');
			if (cartItems && typeof cartItems.updateQuantity === 'function') {
				const qtyInput =
					document.getElementById('Quantity-1') ||
					document.getElementById('Drawer-quantity-1');
				if (qtyInput) {
					const currentQty = parseInt(qtyInput.value, 10) || 1;
					cartItems.updateQuantity(1, currentQty);
					return;
				} else {
					// Completely re-render main cart items
					try {
						const cartResponse =  fetch(`${routes.cart_url}?section_id=main-cart-items`);
						const cartResponseText =  cartResponse.text();
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
					return;
				}
			}
		}

		async function applyDiscounts(discountCodes = []) {
			let isRemoving = false;
			if (discountCodes.length === 0) {
				discountCodes = ['REMOVE_SHOPIFY_CODE'];
				isRemoving = true;
			}
			const discountString = discountCodes.join(',');
			const checkoutUrl = `/checkout?discount=${encodeURIComponent(discountString)}`;

			try {
				// Устанавливаем режим 'no-cors' для обхода ошибки CORS.
				await fetch(checkoutUrl, {method: 'GET', mode: 'no-cors'});
				setTimeout(() => {
					window.location.reload();
				}, 500)
			} catch (err) {
				// Если ошибка происходит, можно залогировать её, если нужно.
				console.error(err);
			}

			const cartRes = await fetch('/cart.js');
			const cartData = await cartRes.json();

			const validSet = new Set();
			(cartData.cart_level_discount_applications || []).forEach(d => validSet.add(d.title.toUpperCase()));
			cartData.items.forEach(item => {
				(item.line_level_discount_allocations || []).forEach(a => {
					validSet.add(a.discount_application.title.toUpperCase());
				});
			});

			const invalidCodes = discountCodes.filter(c => !validSet.has(c.toUpperCase()));
			const newlyAddedCode = discountCodes[discountCodes.length - 1];
			const codeIsInvalid = invalidCodes.includes(newlyAddedCode);

			if (newlyAddedCode === 'REMOVE_SHOPIFY_CODE' || !codeIsInvalid) {
				triggerCartUpdate();
			}
			return {
				success: !codeIsInvalid || isRemoving,
				invalidCodes
			};
		}


		applyBtn.addEventListener('click', async () => {
			clearMessages();
			const existingCodes = getCurrentDiscounts();
			let newCode = discountInput.value.trim().toUpperCase();
			if (!newCode) {
				showError(MSG_NO_CODE);
				return;
			}
			if (existingCodes.includes(newCode)) {
				showError(MSG_ALREADY_APPLIED);
				return;
			}
			const combinedCodes = [...existingCodes, newCode];
			const result = await applyDiscounts(combinedCodes);
			if (result.invalidCodes.map(c => c.toUpperCase()).includes(newCode)) {
				showError(MSG_INVALID);
			}
		});

		appliedDiscountsContainer.addEventListener('click', async (event) => {
			if (!event.target.closest('.remove-discount')) return;
			clearMessages();
			const pill = event.target.closest('.discount-pill');
			if (!pill) return;
			const codeToRemove = pill.getAttribute('data-code');
			if (!codeToRemove) return;
			const existingCodes = getCurrentDiscounts();
			const newDiscountList = existingCodes.filter(c => c !== codeToRemove.toUpperCase());
			await applyDiscounts(newDiscountList);
		});
	}

	document.addEventListener('DOMContentLoaded', () => {
		initDiscountScript();
	});

	if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
		console.log('subscribe');
		subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
			initDiscountScript();
		});
	}
})();
