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
});

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

document.addEventListener('DOMContentLoaded', function () {
  if (window.Shopify && Shopify.CountryProvinceSelector) {
    new Shopify.CountryProvinceSelector('AddressCountry', 'AddressProvince', {
      hideElement: ''
    });
  } else {
    const country = document.getElementById('AddressCountry');
    const province = document.getElementById('AddressProvince');
    const populate = () => {
      const opt = country.options[country.selectedIndex];
      const provinces = JSON.parse(opt.getAttribute('data-provinces') || '[]');
      province.innerHTML = provinces.length
        ? provinces.map(([code, name]) => `<option value="${name}">${name}</option>`).join('')
        : `<option value="">No regions</option>`;
    };
    country.addEventListener('change', populate);
    populate();
  }

    function isActivationKey(e){ return e.key==='Enter'||e.key===' '||e.key==='Spacebar'; }

  function setupCalc(root){
    if(!root) return;

    var header = root.querySelector('.shipping-calculator__header');
    if(!header) return;

    header.setAttribute('role','button');
    header.setAttribute('tabindex','0');
    header.setAttribute('aria-expanded','false');

    var details = root.querySelector('.shipping-calculator__details');
    if(details && !details.id){
      details.id = 'sc-details-' + Math.random().toString(36).slice(2,8);
    }
    if(details){ header.setAttribute('aria-controls', details.id); }

    function toggle(open){
      var isOpen = open!=null ? !!open : !root.classList.contains('is-open');
      root.classList.toggle('is-open', isOpen);
      header.setAttribute('aria-expanded', String(isOpen));
      if(isOpen && details){
        var first = details.querySelector('select, input, button, [tabindex]:not([tabindex="-1"])');
        if(first) setTimeout(function(){ try{ first.focus(); }catch(e){} }, 0);
      }
    }

    header.addEventListener('click', function(e){
      e.preventDefault();
      toggle();
    });
    header.addEventListener('keydown', function(e){
      if(isActivationKey(e)){ e.preventDefault(); toggle(); }
    });
  }

  document.querySelectorAll('.shipping-calculator').forEach(setupCalc);
});

document.addEventListener('DOMContentLoaded', function () {
  var raw = sessionStorage.getItem('userLoc') || window.sessionStorage.userLoc;
  if (!raw) return;

  var loc;
  try { loc = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch(e){ return; }
  if (!loc) return;

  var COUNTRY_NAME = loc.country_name || loc.country || '';
  var COUNTRY_CODE = (loc.country_code || '').toUpperCase();
  var PROVINCE_NAME = loc.region || '';
  var PROVINCE_CODE = (loc.region_code || '').toUpperCase();
  var CITY  = loc.city || '';
  var ZIP   = loc.postal || '';

  setShippingHeader(COUNTRY_NAME, PROVINCE_NAME, CITY, ZIP);

  function findCountryOption(select, name, code) {
    if (!select) return null;
    var opts = Array.from(select.options);
    var lower = name.trim().toLowerCase();
    var opt = opts.find(o => o.value.trim().toLowerCase() === lower || o.textContent.trim().toLowerCase() === lower);
    if (opt) return opt;
    if (code) {
      var byCode = opts.find(o => (o.dataset && o.dataset.code || '').toUpperCase() === code);
      if (byCode) return byCode;
    }
    return null;
  }

  function findProvinceOption(select, name, code) {
    if (!select) return null;
    var lower = (name||'').trim().toLowerCase();
    var opts = Array.from(select.options);
    var opt = opts.find(o => o.textContent.trim().toLowerCase() === lower || o.value.trim().toLowerCase() === lower);
    if (opt) return opt;
    if (code) {
      opt = opts.find(o => o.value.toUpperCase() === code || o.textContent.toUpperCase() === code);
      if (opt) return opt;
    }
    return null;
  }

  function waitAndSetProvince(countryEl, provinceEl, name, code, tries) {
    tries = tries || 0;
    var hasOptions = provinceEl && provinceEl.options && provinceEl.options.length > 1;
    if (!hasOptions && tries < 20) {
      return setTimeout(function(){
        waitAndSetProvince(countryEl, provinceEl, name, code, tries+1);
      }, 50);
    }
    var opt = findProvinceOption(provinceEl, name, code);
    if (opt) {
      provinceEl.value = opt.value;
      provinceEl.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }

  document.querySelectorAll('.shipping-calculator').forEach(function(root){
    var countryEl  = root.querySelector('#AddressCountry');
    var provinceEl = root.querySelector('#AddressProvince');
    var cityEl     = root.querySelector('input[name="shipping_address[city]"]');
    var zipEl      = root.querySelector('input[name="shipping_address[zip]"]');

    if (countryEl) {
      var countryOpt = findCountryOption(countryEl, COUNTRY_NAME, COUNTRY_CODE);
      if (countryOpt) {
        countryEl.value = countryOpt.value;
        countryEl.dispatchEvent(new Event('change', { bubbles:true }));
      }
    }

    if (provinceEl) {
      waitAndSetProvince(countryEl, provinceEl, PROVINCE_NAME, PROVINCE_CODE);
    }

    if (cityEl && CITY) {
      cityEl.value = CITY;
      cityEl.dispatchEvent(new Event('input', { bubbles:true }));
    }
    if (zipEl && ZIP) {
      zipEl.value = ZIP;
      zipEl.dispatchEvent(new Event('input', { bubbles:true }));
    }
  });

  const shippingCalculateBtn = document.querySelector('.shipping-calculator__estimate-btn');

  shippingCalculateBtn.addEventListener('click', async function() {
	var countryEl  = document.querySelector('#AddressCountry');
    var provinceEl = document.querySelector('#AddressProvince');
    var cityEl     = document.querySelector('input[name="shipping_address[city]"]');
    var zipEl      = document.querySelector('input[name="shipping_address[zip]"]');

	const container = document.getElementById('shippingRates');
	container.innerHTML = `<div class="shipping-calculator__rates-title">Shipping Rates:</div>
							<div class="shipping-calculator__rate-name">Calculating…</div>`;
	try {
		const rates = await getCartShippingRates({
			country: countryEl.value,
			province: provinceEl.value,
			zip: zipEl.value,
			city: cityEl.value
		});

    	renderShippingRates(container, rates, { zip: zipEl.value, currency: Shopify.currency.active });

		setShippingHeader(countryEl.value, provinceEl.value, cityEl.value, zipEl.value);

		setShippingTotalPrice();
	} catch (err) {
		container.innerHTML = `<div class="shipping-calculator__rates-title">Shipping Rates:</div>
							<div class="shipping-calculator__rate-name">We couldn’t find any shipping rates for the address you entered. Please check your country, state/region, and postal code, or contact us for a custom quote.</div>`;
	}
  })
});


async function prepareShippingRates(addr) {
  const params = new URLSearchParams();
  params.set('shipping_address[country]', addr.country);
  if (addr.province) params.set('shipping_address[province]', addr.province);
  params.set('shipping_address[zip]', addr.zip);

  const res = await fetch('/cart/prepare_shipping_rates.json?' + params.toString(), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  if (!res.ok) throw new Error(`prepare_shipping_rates failed: ${res.status} ${res.statusText}`);
  return res.text().then(t => (t ? JSON.parse(t) : null));
}


async function pollShippingRates(addr, opts = {}) {
  const intervalMs = opts.intervalMs ?? 800;     
  const maxAttempts = opts.maxAttempts ?? 20;  

  const params = new URLSearchParams();
  params.set('shipping_address[country]', addr.country);
  if (addr.province) params.set('shipping_address[province]', addr.province); 
  if (addr.zip)      params.set('shipping_address[zip]', addr.zip);
  if (addr.city)     params.set('shipping_address[city]', addr.city);
  if (addr.address1) params.set('shipping_address[address1]', addr.address1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch('/cart/async_shipping_rates.json?' + params.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
      await new Promise(r => setTimeout(r, (retryAfter || 1) * 1000));
      continue;
    }

    if (!res.ok) throw new Error(`async_shipping_rates failed: ${res.status} ${res.statusText}`);

    const text = await res.text();
    if (!text) {
    } else {
      const json = JSON.parse(text);
      if (json && Array.isArray(json.shipping_rates)) {
        return json.shipping_rates; 
      }
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for shipping rates.');
}

async function getCartShippingRates(address, opts) {
  await prepareShippingRates(address);
  return pollShippingRates(address, opts);
}

function formatCurrency(amount, currency = 'USD', locale = undefined) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0);
  return num.toLocaleString(locale, { style: 'currency', currency });
}

function getRateAmounts(rate) {
  const major = typeof rate.price === 'string' ? parseFloat(rate.price) : Number(rate.price || 0);
  const cents = Math.round(major * 100);
  return { major, cents };
}

function renderShippingRates(container, rates, { zip, currency = 'USD' } = {}) {
  const groupName = `shipping_rate_${zip || 'unknown'}`;

  if (!rates || !rates.length) {
    container.innerHTML = `
      <div class="shipping-calculator__rates-title">Shipping Rates:</div>
      <div class="shipping-calculator__rate">
        <div class="shipping-calculator__rate-name">No shipping rates available for this address.</div>
      </div>`;
    return;
  }
  const sorted = [...rates].sort((a, b) => Number(a.price) - Number(b.price));

  const title = `<div class="shipping-calculator__rates-title">Shipping Rates:</div>`;
  const items = sorted.map((r, idx) => {
	const { major, priceCents } = getRateAmounts(r);
    const isFree = major === 0;
    const checkedAttr = idx === 0 ? 'checked' : '';
    const selectedClass = idx === 0 ? ' shipping-calculator__rate-price--selected' : '';
    const priceHtml = isFree
      ? `<span class="shipping-calculator__free-amount">FREE</span>`
      : `<span class="shipping-calculator__rate-amount" data-price-cents="${major}">${formatCurrency(major, currency)}</span>`;

    return `
      <div class="shipping-calculator__rate" data-index="${idx}">
        <div class="shipping-calculator__rate-name">
          <label>
            <input
              type="radio"
              name="${groupName}"
              value="${priceCents}"
              data-rate-code="${(r.code || '').replace(/"/g, '&quot;')}"
              data-rate-name="${(r.name || '').replace(/"/g, '&quot;')}"
              data-price-cents="${priceCents}"
              ${checkedAttr}
            >
            ${r.name || r.code || 'Shipping'}
          </label>
        </div>
        <div class="shipping-calculator__rate-price${selectedClass}" data-index="${idx}">
          ${priceHtml}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = title + items;

  const radios = container.querySelectorAll(`input[name="${groupName}"]`);
  radios.forEach(r => {
    r.addEventListener('change', () => {
      const selectedIdx = [...radios].findIndex(x => x.checked);
      container.querySelectorAll('.shipping-calculator__rate-price').forEach(p => {
        p.classList.toggle('shipping-calculator__rate-price--selected', Number(p.dataset.index) === selectedIdx);
      });
  
	  setShippingTotalPrice();
    });
  });
}

function setShippingHeader(COUNTRY_NAME, PROVINCE_NAME, CITY, ZIP) {
   var citySpan   = document.querySelector('.shipping-calculator__city');
   var regionSpan = document.querySelector('.shipping-calculator__province');
   var zipSpan    = document.querySelector('.shipping-calculator__zip');
   
   if (citySpan) {
	  citySpan.style.display = 'block';
	  citySpan.textContent   = CITY || '';
   }
   if (regionSpan) regionSpan.textContent = PROVINCE_NAME || (!CITY ? (COUNTRY_NAME || '') : '');
   if (zipSpan)    zipSpan.textContent    = ', ' + ZIP || '';
}

function moneyFromCents(cents, currency = (window?.Shopify?.currency?.active || 'USD'), locale) {
  return (Number(cents) / 100).toLocaleString(locale, { style: 'currency', currency });
}

function getBaseCartCents() {
  return Number(document.querySelector('.shipping-calculator__total-price')?.dataset?.cartPrice || 0);
}

function setShippingTotalPrice() {
	const totalEl = document.querySelector('.shipping-calculator__total-price');
	const selectedRate = document.querySelector('.shipping-calculator__rate-price--selected .shipping-calculator__rate-amount');
	const cartPriceCents = Number(totalEl?.dataset?.cartPrice || 0);

	if (selectedRate) {
		const selectedShippingCents = Number(selectedRate.dataset.priceCents + '00' || 0);	
		if (totalEl) totalEl.textContent = moneyFromCents(selectedShippingCents + cartPriceCents);
	} else {
		totalEl.textContent = moneyFromCents(cartPriceCents);
	}
}