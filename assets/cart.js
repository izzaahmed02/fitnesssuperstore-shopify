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
      console.error('Popup elements not found.');
      return;
    }

    popup.classList.add('active');
    overlay.classList.add('active');
    document.querySelector('html, body').classList.add('overflow-hidden');
    popup.dataset.index = this.dataset.index;

    const removeItem = () => {
      this.removeItem();
      setTimeout(() => {
        closePopup();
      }, 350);
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
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

// Change Edit Options Button
document.addEventListener('DOMContentLoaded', () => {
  const updateText = (element) => {
    if (!element) return;

    const span = element.querySelector('span');
    if (span && span.textContent.trim() !== 'Modify') {
      span.textContent = 'Modify';
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
    observerLabels.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.avis-edit-options').forEach(updateText);
  } catch (error) {
    console.error('Error initializing observer:', error);
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
      const assistanceBlock = document.querySelector('.cart-items__assistance');
      const footerWrapper = document.querySelector('.cart__footer-wrapper');

      if (!assistanceBlock || !footerWrapper) {
        return;
      }

      if (window.innerWidth <= 992) {
        if (!footerWrapper.contains(assistanceBlock)) {
          footerWrapper.appendChild(assistanceBlock);
        }
      } else {
        const originalParent = document.querySelector('.section-cart-items');
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
      Accept: 'application/json',
    },
    body: JSON.stringify({
      attributes: {
        zipCode: zip,
      },
    }),
  }).catch((error) => {
    console.error('Error updating cart attribute:', error);
  });
}
