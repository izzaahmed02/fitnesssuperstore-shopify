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
      // this.open(cartLink);
      console.log(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    // if (triggeredBy) this.setActiveElement(triggeredBy);
    // const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    // if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // // here the animation doesn't seem to always get triggered. A timeout seem to help
    // setTimeout(() => {
    //   this.classList.add('animate', 'active');
    // });
    // this.addEventListener(
    //   'transitionend',
    //   () => {
    //     const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
    //     const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
    //     trapFocus(containerToTrapFocusOn, focusElement);
    //   },
    //   { once: true }
    // );
    // document.body.classList.add('overflow-hidden');
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
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });

    setTimeout(() => {
      document.querySelectorAll('.cart-item-new .show-extra').forEach((button) => {
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
      document.querySelectorAll('.cart-item-new').forEach((cartItem) => {
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
          priceDisplay.textContent = `$${totalSum.toFixed(2)}`;
        }

        const showExtraButton = cartItem.querySelector('.show-extra');

        if (showExtraButton) {
          if (!hasExtraContent) {
            showExtraButton.style.display = 'none';
          } else {
            showExtraButton.style.display = 'flex';
          }
        }
      });

      const drawerHeadingSpan = document.querySelector('.drawer__heading span');
      const drawerSubHeadingSpan = document.querySelector('.cart-drawer__subheading span');
      const cartCount = document.querySelector('.cart-count-bubble span');
      document.querySelector('.cart-count-bubble span').innerHTML = drawerHeadingSpan.innerHTML;

      if (drawerHeadingSpan && drawerSubHeadingSpan && cartCount) {
        const initialCount = parseInt(drawerHeadingSpan.getAttribute('data-count'), 10);
        const newCount = isNaN(initialCount) ? 0 : initialCount - totalContentCount;
        drawerHeadingSpan.textContent = newCount;
        drawerSubHeadingSpan.textContent = newCount;
        cartCount.textContent = newCount;

        cartCount.style.display = 'flex';
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
        const qtyEl = minusBtn.parentElement.querySelector('.quantity-text');
        const currentQty = parseInt(qtyEl.textContent, 10) || 1;
        if (currentQty > 1) {
          await this.updateCartItem(key, currentQty - 1);
        } else {
          await this.updateCartItem(key, 0);
        }
        return;
      }

      const plusBtn = e.target.closest('.quantity-btn--plus');
      if (plusBtn) {
        const key = plusBtn.dataset.key;
        const qtyEl = plusBtn.parentElement.querySelector('.quantity-text');
        const currentQty = parseInt(qtyEl.textContent, 10) || 1;
        await this.updateCartItem(key, currentQty + 1);
        return;
      }

      const removeBtn = e.target.closest('.cart-remove-button');
      if (removeBtn) {
        e.stopPropagation();
        const key = removeBtn.dataset.key;
        await this.updateCartItem(key, 0);
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

  async updateCartItem(itemKey, newQty) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: newQty,
        }),
      });
      if (!response.ok) {
        console.error('Cart update failed:', response.status);
        return;
      }
      const cart = await response.json();

      // const totalEl = document.querySelector('.cart-total');
      // if (totalEl) {
      //   totalEl.textContent = cart.total_price;
      // }

      const updatedItem = cart.items.find((i) => i.key === itemKey);
      const rowEl = document.querySelector(`tr[data-key="${itemKey}"]`);
      if (!updatedItem && rowEl) {
        rowEl.remove();
        return;
      }
      if (updatedItem && rowEl) {
        const qtySpan = rowEl.querySelector('.quantity-text');
        if (qtySpan) {
          qtySpan.textContent = updatedItem.quantity;
        }
        this.unregisterCartDrawerActions();
        this.registerCartDrawerActions();
      }
    } catch (err) {
      console.error('Error updating cart item:', err);
    }
  }

  formatMoney(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

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
      this.updateQuantity(index, inputValue, document.activeElement.getAttribute('name'), event.target.dataset.quantityVariantId);
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

      const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
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
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(mainUpdateState.sections[section.section], section.selector);
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

      const lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
      if (lineItem?.querySelector(`[name="${name}"]`)) {
        cartDrawerWrapper ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`)) : lineItem.querySelector(`[name="${name}"]`).focus();
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
    const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
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
