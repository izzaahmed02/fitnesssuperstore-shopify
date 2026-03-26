class CartDrawer extends HTMLElement {
  constructor() {
    super(),
      (this._cartDrawerHandler = null),
      this.addEventListener('keyup', (e) => 'Escape' === e.code && this.close()),
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this)),
      this.setHeaderCartIconAccessibility(),
      this.registerCartDrawerActions();
  }
  setHeaderCartIconAccessibility() {
    let e = document.querySelector('#cart-icon-bubble');
    e.setAttribute('role', 'button'),
      e.setAttribute('aria-haspopup', 'dialog'),
      e.addEventListener('click', (t) => {
        t.preventDefault(), this.open(e);
      }),
      e.addEventListener('keydown', (t) => {
        'SPACE' === t.code.toUpperCase() && (t.preventDefault(), this.open(e));
      });
  }
  open(e) {
    e && this.setActiveElement(e);
    let t = this.querySelector('[id^="Details-"] summary');
    t && !t.hasAttribute('role') && this.setSummaryAccessibility(t),
      setTimeout(() => {
        this.classList.add('animate', 'active');
      }),
      this.addEventListener(
        'transitionend',
        () => {
          let e = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer'),
            t = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
          trapFocus(e, t);
        },
        { once: !0 }
      ),
      document.body.classList.add('overflow-hidden');
  }
  close() {
    this.classList.remove('active'), removeTrapFocus(this.activeElement), document.body.classList.remove('overflow-hidden');
  }
  setSummaryAccessibility(e) {
    e.setAttribute('role', 'button'),
      e.setAttribute('aria-expanded', 'false'),
      e.nextElementSibling.getAttribute('id') && e.setAttribute('aria-controls', e.nextElementSibling.id),
      e.addEventListener('click', (e) => {
        e.currentTarget.setAttribute('aria-expanded', !e.currentTarget.closest('details').hasAttribute('open'));
      }),
      e.parentElement.addEventListener('keyup', onKeyUpEscape);
  }
  renderContents(e) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty'),
      (this.productId = e.id),
      this.getSectionsToRender().forEach((t) => {
        let r = t.selector ? document.querySelector(t.selector) : document.getElementById(t.id);
        r.innerHTML = this.getSectionInnerHTML(e.sections[t.id], t.selector);
      }),
      setTimeout(() => {
        this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this)), this.open();
      }),
      setTimeout(() => {
        document.querySelectorAll('.cart-item-new .show-extra').forEach((e) => {
          e.addEventListener('click', () => {
            let t = e.parentElement.nextElementSibling;
            for (e.classList.toggle('active'); t && !t.classList.contains('cart-item-new'); ) t.classList.contains('extra-option-item') && t.classList.toggle('toggle'), (t = t.nextElementSibling);
          });
        });
        let e = 0;
        document.querySelectorAll('.cart-item-new').forEach((t) => {
          let r = 0,
            i = 0,
            a = !1,
            n = t.nextElementSibling;
          for (; n && !n.classList.contains('cart-item-new'); ) {
            if (n.classList.contains('extra-option-item')) {
              (a = !0), r++, e++;
              let s = n.querySelector('.extra-option-price');
              if (s) {
                let c = s.textContent.replace('$', ''),
                  l = parseFloat(c);
                i += isNaN(l) ? 0 : l;
              }
            }
            n = n.nextElementSibling;
          }
          let o = t.querySelector('.extra-quantity .value');
          o && (o.textContent = r);
          let d = t.querySelector('.options-price');
          d && (d.textContent = `$${i.toFixed(2)}`);
          let u = t.querySelector('.show-extra');
          u && (a ? (u.style.display = 'flex') : (u.style.display = 'none'));
        });
        let t = document.querySelector('.drawer__heading span'),
          r = document.querySelector('.cart-drawer__subheading span'),
          i = document.querySelector('.cart-count-bubble span');
        if (((document.querySelector('.cart-count-bubble span').innerHTML = t.innerHTML), t && r && i)) {
          let a = parseInt(t.getAttribute('data-count'), 10),
            n = isNaN(a) ? 0 : a - e;
          (t.textContent = n), (r.textContent = n), (i.textContent = n), (i.style.display = 'flex');
        }
      }, 200);
  }
  getSectionInnerHTML(e, t = '.shopify-section') {
    return new DOMParser().parseFromString(e, 'text/html').querySelector(t).innerHTML;
  }
  getSectionsToRender() {
    return [{ id: 'cart-drawer', selector: '#CartDrawer' }, { id: 'cart-icon-bubble' }];
  }
  getSectionDOM(e, t = '.shopify-section') {
    return new DOMParser().parseFromString(e, 'text/html').querySelector(t);
  }
  setActiveElement(e) {
    this.activeElement = e;
  }
  registerCartDrawerActions() {
    this._cartDrawerHandler && document.removeEventListener('click', this._cartDrawerHandler),
      (this._cartDrawerHandler = async (e) => {
        let t = e.target.closest('.quantity-btn--minus');
        if (t) {
          let r = t.dataset.key,
            i = t.parentElement.querySelector('.quantity-text'),
            a = parseInt(i.textContent, 10) || 1;
          a > 1 ? await this.updateCartItem(r, a - 1) : await this.updateCartItem(r, 0);
          return;
        }
        let n = e.target.closest('.quantity-btn--plus');
        if (n) {
          let s = n.dataset.key,
            c = n.parentElement.querySelector('.quantity-text'),
            l = parseInt(c.textContent, 10) || 1;
          await this.updateCartItem(s, l + 1);
          return;
        }
        let o = e.target.closest('.cart-remove-button');
        if (o) {
          e.stopPropagation();
          let d = o.dataset.key;
          await this.updateCartItem(d, 0);
          return;
        }
      }),
      document.addEventListener('click', this._cartDrawerHandler);
  }
  unregisterCartDrawerActions() {
    this._cartDrawerHandler && (document.removeEventListener('click', this._cartDrawerHandler), (this._cartDrawerHandler = null));
  }
  async updateCartItem(e, t) {
    try {
      let r = await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: e, quantity: t }) });
      if (!r.ok) {
        console.error('Cart update failed:', r.status);
        return;
      }
      let i = await r.json(),
        a = i.items.find((t) => t.key === e),
        n = document.querySelector(`tr[data-key="${e}"]`);
      if (!a && n) {
        n.remove();
        return;
      }
      if (a && n) {
        let s = n.querySelector('.quantity-text');
        s && (s.textContent = a.quantity), this.unregisterCartDrawerActions(), this.registerCartDrawerActions();
      }
    } catch (c) {
      console.error('Error updating cart item:', c);
    }
  }
  formatMoney(e) {
    return `$${(e / 100).toFixed(2)}`;
  }
}
customElements.define('cart-drawer', CartDrawer);
class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      { id: 'CartDrawer', section: 'cart-drawer', selector: '.drawer__inner' },
      { id: 'cart-icon-bubble', section: 'cart-icon-bubble', selector: '.shopify-section' },
    ];
  }
}
customElements.define('cart-drawer-items', CartDrawerItems);
