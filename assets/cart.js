class CartRemoveButton extends HTMLElement {
  constructor() {
    super(),
      this.addEventListener('click', (e) => {
        e.preventDefault(), this.classList.contains('cart-item__remove') ? this.showPopup() : this.removeItem();
      });
  }
  showPopup() {
    let e = document.querySelector('.cart-items__popup'),
      t = document.querySelector('.overlay'),
      r = e?.querySelector('.cart-items__popup-btn--remove'),
      a = e?.querySelector('.cart-items__popup-btn--cancel'),
      i = e?.querySelector('.cart-items__popup-close');
    if (!e || !t || !r || !a || !i) {
      console.error('Popup elements not found.');
      return;
    }
    e.classList.add('active'), t.classList.add('active'), document.querySelector('html, body').classList.add('overflow-hidden'), (e.dataset.index = this.dataset.index);
    let n = () => {
        this.removeItem(),
          setTimeout(() => {
            s();
          }, 350);
      },
      s = () => {
        e.classList.remove('active'), t.classList.remove('active'), document.querySelector('html, body').classList.remove('overflow-hidden'), r.removeEventListener('click', n);
      };
    r.addEventListener('click', (e) => {
      e.preventDefault(), n();
    }),
      a.addEventListener('click', (e) => {
        e.preventDefault(), s();
      }),
      i.addEventListener('click', (e) => {
        e.preventDefault(), s();
      }),
      t.addEventListener('click', s);
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
      { id: 'cart-live-region-text', section: 'cart-live-region-text', selector: '.shopify-section' },
      { id: 'main-cart-footer', section: document.getElementById('main-cart-footer').dataset.id, selector: '.js-contents' },
    ];
  }
  async updateQuantity(e, t, r, a) {
    this.enableLoading(e);
    try {
      let i = JSON.stringify({ line: e, quantity: t, sections: this.getSectionsToRender().map((e) => e.section), sections_url: window.location.pathname }),
        n = await fetch(`${routes.cart_change_url}`, { ...fetchConfig(), body: i }),
        s = JSON.parse(await n.text()),
        o = document.getElementById(`Quantity-${e}`) || document.getElementById(`Drawer-quantity-${e}`),
        l = document.querySelectorAll('.cart-item');
      if (s.errors) {
        (o.value = o.getAttribute('value')), this.updateLiveRegions(e, s.errors);
        return;
      }
      this.classList.toggle('is-empty', 0 === s.item_count);
      let c = document.querySelector('cart-drawer'),
        d = document.getElementById('main-cart-footer');
      d && d.classList.toggle('is-empty', 0 === s.item_count),
        c && c.classList.toggle('is-empty', 0 === s.item_count),
        this.getSectionsToRender().forEach((e) => {
          let t = document.getElementById(e.id).querySelector(e.selector) || document.getElementById(e.id);
          t.innerHTML = this.getSectionInnerHTML(s.sections[e.section], e.selector);
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
      g.textContent = window.cartStrings.error;
    } finally {
      this.disableLoading(e);
    }
  }
  updateLiveRegions(e, t) {
    let r = document.getElementById(`Line-item-error-${e}`) || document.getElementById(`CartDrawer-LineItemError-${e}`);
    r && (r.querySelector('.cart-item__error-text').innerHTML = t), this.lineItemStatusElement.setAttribute('aria-hidden', !0);
    let a = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    a.setAttribute('aria-hidden', !1),
      setTimeout(() => {
        a.setAttribute('aria-hidden', !0);
      }, 1e3);
  }
  getSectionInnerHTML(e, t) {
    return new DOMParser().parseFromString(e, 'text/html').querySelector(t).innerHTML;
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
