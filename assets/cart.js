class CartRemoveButton extends HTMLElement {
  constructor() {
    super(),
      this.addEventListener('click', (e) => {
        e.preventDefault(), this.classList.contains('cart-item__remove') ? this.showPopup() : this.removeItem();
      });
  }
  showPopup() {
    const popup = document.querySelector('.cart-items__popup');
    const overlay = document.querySelector('.overlay');
    const removeButton = popup?.querySelector('.cart-items__popup-btn--remove');
    const cancelButton = popup?.querySelector('.cart-items__popup-btn--cancel');
    const closeButton = popup?.querySelector('.cart-items__popup-close');
    if (!popup || !overlay || !removeButton || !cancelButton || !closeButton) {
      console.error('Popup elements not found.');
      return;
    }

    // This popup is rendered outside every container the cart AJAX rerender
    // replaces, so these nodes live for the whole page session and each open
    // must detach the handlers it attached. The previous implementation handed
    // removeEventListener a different function than it had registered, so the
    // closure from every earlier removal stayed bound to the confirm button:
    // the second confirmed removal in a session fired all of them, deleting
    // more lines than the customer selected and sending a stale line index to
    // /cart/change.js (the observed 422).
    const detach = () => {
      removeButton.removeEventListener('click', onRemove);
      cancelButton.removeEventListener('click', onDismiss);
      closeButton.removeEventListener('click', onDismiss);
      overlay.removeEventListener('click', onDismiss);
    };
    const hide = () => {
      popup.classList.remove('active');
      overlay.classList.remove('active');
      document.querySelector('html, body').classList.remove('overflow-hidden');
    };
    const onRemove = (event) => {
      event.preventDefault();
      detach();
      this.removeItem();
      setTimeout(hide, 350);
    };
    const onDismiss = (event) => {
      event?.preventDefault();
      detach();
      hide();
    };

    popup.classList.add('active');
    overlay.classList.add('active');
    document.querySelector('html, body').classList.add('overflow-hidden');
    popup.dataset.index = this.dataset.index;

    removeButton.addEventListener('click', onRemove);
    cancelButton.addEventListener('click', onDismiss);
    closeButton.addEventListener('click', onDismiss);
    overlay.addEventListener('click', onDismiss);
  }
  removeItem() {
    let e = document.querySelector('cart-items') || document.querySelector('cart-drawer-items');
    e && e.updateQuantity(this.dataset.index, 0);
  }
}
customElements.define('cart-remove-button', CartRemoveButton);
class CartItems extends HTMLElement {
  constructor() {
    super(), (this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus'));
    let e = debounce((e) => {
      this.onChange(e);
    }, ON_CHANGE_DEBOUNCE_TIMER);
    this.addEventListener('change', e.bind(this));
  }
  cartUpdateUnsubscriber = void 0;
  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (e) => {
      'cart-items' !== e.source && this.onCartUpdate();
    });
  }
  disconnectedCallback() {
    this.cartUpdateUnsubscriber && this.cartUpdateUnsubscriber();
  }
  resetQuantityInput(e) {
    let t = this.querySelector(`#Quantity-${e}`);
    (t.value = t.getAttribute('value')), (this.isEnterPressed = !1);
  }
  setValidity(e, t, r) {
    e.target.setCustomValidity(r), e.target.reportValidity(), this.resetQuantityInput(t), e.target.select();
  }
  validateQuantity(e) {
    let t = parseInt(e.target.value),
      r = e.target.dataset.index,
      a = '';
    t < e.target.dataset.min
      ? (a = window.quickOrderListStrings.min_error.replace('[min]', e.target.dataset.min))
      : t > parseInt(e.target.max)
      ? (a = window.quickOrderListStrings.max_error.replace('[max]', e.target.max))
      : t % parseInt(e.target.step) != 0 && (a = window.quickOrderListStrings.step_error.replace('[step]', e.target.step)),
      a
        ? this.setValidity(e, r, a)
        : (e.target.setCustomValidity(''), e.target.reportValidity(), this.updateQuantity(r, t, document.activeElement.getAttribute('name'), e.target.dataset.quantityVariantId));
  }
  onChange(e) {
    this.validateQuantity(e);
  }
  onCartUpdate() {
    'CART-DRAWER-ITEMS' === this.tagName
      ? fetch(`${routes.cart_url}?section_id=cart-drawer`)
          .then((e) => e.text())
          .then((e) => {
            let t = new DOMParser().parseFromString(e, 'text/html');
            for (let r of ['cart-drawer-items', '.cart-drawer__footer', '.title-wrapper-with-link .title']) {
              let a = document.querySelector(r),
                i = t.querySelector(r);
              a && i && a.replaceWith(i);
            }
          })
          .catch((e) => {
            console.error(e);
          })
      : fetch(`${routes.cart_url}?section_id=main-cart-items`)
          .then((e) => e.text())
          .then((e) => {
            let t = new DOMParser().parseFromString(e, 'text/html'),
              r = t.querySelector('cart-items');
            this.innerHTML = r.innerHTML;
          })
          .catch((e) => {
            console.error(e);
          });
  }
  getSectionsToRender() {
    return [
      { id: 'main-cart-items', section: document.getElementById('main-cart-items').dataset.id, selector: '.js-contents' },
      // Sits outside .js-contents, so it needs its own render target - see the
      // matching entry in CartDrawerItems.getSectionsToRender().
      { id: 'CartItems-ProductOptions', section: document.getElementById('main-cart-items').dataset.id, selector: '#CartItems-ProductOptions' },
      { id: 'cart-live-region-text', section: 'cart-live-region-text', selector: '.shopify-section' },
      { id: 'main-cart-footer', section: document.getElementById('main-cart-footer').dataset.id, selector: '.js-contents' },
    ];
  }
  async updateQuantity(e, t, r, a) {
    this.enableLoading(e);
    try {
      let i = JSON.stringify({ line: e, quantity: t, sections: [...new Set(this.getSectionsToRender().map((e) => e.section))], sections_url: window.location.pathname }),
        n = await fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body: i }),
        s = JSON.parse(await n.text()),
        o = document.getElementById(`Quantity-${e}`) || document.getElementById(`Drawer-quantity-${e}`),
        l = document.querySelectorAll('.cart-item');
      // A rejected change (e.g. 422 for a line that no longer exists) comes
      // back without `sections`, so falling through would throw on s.items and
      // surface as an unrelated TypeError. Report the real reason and stop.
      if (!n.ok || s.status) {
        let f = s.description || s.message || window.cartStrings.error;
        console.error('Cart change rejected:', n.status, f);
        o && (o.value = o.getAttribute('value')), this.updateLiveRegions(e, f);
        return;
      }
      if (s.errors) {
        o && (o.value = o.getAttribute('value')), this.updateLiveRegions(e, s.errors);
        return;
      }
      this.classList.toggle('is-empty', 0 === s.item_count);
      let c = document.querySelector('cart-drawer'),
        d = document.getElementById('main-cart-footer');
      d && d.classList.toggle('is-empty', 0 === s.item_count),
        c && c.classList.toggle('is-empty', 0 === s.item_count),
        this.getSectionsToRender().forEach((e) => {
          let v = document.getElementById(e.id);
          if (!v) return;
          let t = v.querySelector(e.selector) || v,
            w = this.getSectionInnerHTML(s.sections[e.section], e.selector);
          null !== w && (t.innerHTML = w);
        });
      let u = s.items[e - 1]?.quantity,
        m = document.querySelector('.title-wrapper-with-link .title > span');
      m && (m.textContent = u);
      let p = '';
      l.length === s.items.length && u !== parseInt(o.value) && (p = void 0 === u ? window.cartStrings.error : window.cartStrings.quantityError.replace('[quantity]', u)), this.updateLiveRegions(e, p);
      let y = document.getElementById(`CartItem-${e}`) || document.getElementById(`CartDrawer-Item-${e}`);
      y?.querySelector(`[name="${r}"]`)
        ? c
          ? trapFocus(c, y.querySelector(`[name="${r}"]`))
          : y.querySelector(`[name="${r}"]`).focus()
        : 0 === s.item_count && c
        ? trapFocus(c.querySelector('.drawer__inner-empty'), c.querySelector('a'))
        : document.querySelector('.cart-item') && c && trapFocus(c, document.querySelector('.cart-item__name')),
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: s, variantId: a });
    } catch (h) {
      console.error('Error in updateQuantity:', h), this.querySelectorAll('.loading__spinner').forEach((e) => e.classList.add('hidden'));
      let g = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
      g && (g.textContent = window.cartStrings.error);
    } finally {
      this.disableLoading(e);
    }
  }
  updateLiveRegions(e, t) {
    let r = document.getElementById(`Line-item-error-${e}`) || document.getElementById(`CartDrawer-LineItemError-${e}`);
    let i = r?.querySelector('.cart-item__error-text');
    i && (i.innerHTML = t), this.lineItemStatusElement?.setAttribute('aria-hidden', !0);
    let a = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    a &&
      (a.setAttribute('aria-hidden', !1),
      setTimeout(() => {
        a.setAttribute('aria-hidden', !0);
      }, 1e3));
  }
  getSectionInnerHTML(e, t) {
    if (!e) return null;
    let r = new DOMParser().parseFromString(e, 'text/html').querySelector(t);
    return r ? r.innerHTML : null;
  }
  enableLoading(e) {
    let t = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    t.classList.add('cart__items--disabled');
    let r = this.querySelectorAll(`#CartItem-${e} .loading__spinner`),
      a = this.querySelectorAll(`#CartDrawer-Item-${e} .loading__spinner`);
    [...r, ...a].forEach((e) => e.classList.remove('hidden')), document.activeElement.blur(), this.lineItemStatusElement.setAttribute('aria-hidden', !1);
  }
  disableLoading(e) {
    let t = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    t.classList.remove('cart__items--disabled');
    let r = this.querySelectorAll(`#CartItem-${e} .loading__spinner`),
      a = this.querySelectorAll(`#CartDrawer-Item-${e} .loading__spinner`);
    r.forEach((e) => e.classList.add('hidden')), a.forEach((e) => e.classList.add('hidden'));
  }
}
customElements.define('cart-items', CartItems),
  customElements.get('cart-note') ||
    customElements.define(
      'cart-note',
      class e extends HTMLElement {
        constructor() {
          super(),
            this.addEventListener(
              'input',
              debounce((e) => {
                let t = JSON.stringify({ note: e.target.value });
                fetch(`${routes.cart_update_url}`, { ...fetchConfig(), body: t });
              }, ON_CHANGE_DEBOUNCE_TIMER)
            );
        }
      }
    ),
  document.addEventListener('DOMContentLoaded', () => {
    let e = (e) => {
        if (!e) return;
        let t = e.querySelector('span');
        t && 'Modify' !== t.textContent.trim() && (t.textContent = 'Modify');
      },
      t = new MutationObserver((t) => {
        t.forEach((t) => {
          t.addedNodes.forEach((t) => {
            t.nodeType === Node.ELEMENT_NODE &&
              t.classList.contains('avis-edit-options') &&
              (t.setAttribute('data-cart-item', t.parentElement.getAttribute('data-cart-item')),
              e(t),
              t.addEventListener('click', (e) => {
                window.avisModifyButton = t.getAttribute('data-cart-item');
              }));
          });
        });
      });
    try {
      t.observe(document.body, { childList: !0, subtree: !0 }), document.querySelectorAll('.avis-edit-options').forEach(e);
    } catch (r) {
      console.error('Error initializing observer:', r);
    }
    let a = (e, t) => {
        let r;
        return (...a) => {
          clearTimeout(r), (r = setTimeout(() => e(...a), t));
        };
      },
      i = new ResizeObserver(
        a(() => {
          let e = document.querySelector('.cart-items__assistance'),
            t = document.querySelector('.cart__footer-wrapper');
          if (e && t) {
            if (window.innerWidth <= 992) t.contains(e) || t.appendChild(e);
            else {
              let r = document.querySelector('.section-cart-items');
              r && !r.contains(e) && r.appendChild(e);
            }
          }
        }, 200)
      );
    i.observe(document.body);
  }),
  document.addEventListener('DOMContentLoaded', () => {
    let e = document.getElementById('chat');
    if (!e) return;
    e.addEventListener('click', function (t) {
      t.preventDefault(), e.classList.contains('active') ? (zE('messenger', 'close'), e.classList.remove('active')) : (zE('messenger', 'open'), e.classList.add('active'));
    });
  });
function setCartAttributeZipCode(e) {
  fetch('/cart/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ attributes: { zipCode: e } }) }).catch((e) => {
    console.error('Error updating cart attribute:', e);
  });
}
