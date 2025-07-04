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
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
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
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
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
     setTimeout(()=> {
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
              priceDisplay.textContent = `$${totalSum.toFixed(2)}`;
          }
  
          const showExtraButton = cartItem.querySelector('.show-extra');
        
          if (showExtraButton && !hasExtraContent) {
              showExtraButton.style.display = 'none';
          } else {
              showExtraButton.style.display = 'flex';
          }
      });
debugger;

      const drawerHeadingSpan = document.querySelector('.drawer__heading span');
      const drawerSubHeadingSpan = document.querySelector('.cart-drawer__subheading span');
      const cartCount = document.querySelector('.cart-count-bubble span');
      
      
      if (drawerHeadingSpan && drawerSubHeadingSpan && cartCount ) {
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
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          id: itemKey,
          quantity: newQty 
        })
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

      const updatedItem = cart.items.find(i => i.key === itemKey);
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
