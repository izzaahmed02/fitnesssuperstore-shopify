/* ==========================================================================
   Build Your Product — Dawn theme
   - Add-on selection with instant floating cart
   - Bulk /cart/add.js + Dawn cart-drawer re-render
   - Learn More modal with Shopify Product Recommendations slider
   ========================================================================== */

if (!customElements.get('build-your-product')) {
  customElements.define(
    'build-your-product',
    class BuildYourProduct extends HTMLElement {
      constructor() {
        super();
        /** Map<variantId, {id, productTitle, variantTitle, price, comparePrice, quantity}> */
        this.items = new Map();

        this.cartAddUrl = this.dataset.cartAddUrl || '/cart/add';
        this.recommendationsUrl = this.dataset.recommendationsUrl || '/recommendations/products';

        this.floatingCart = this.querySelector('.byp-floating-cart');
        this.itemsList = this.querySelector('.byp-floating-cart__items');
        this.subtotalEl = this.querySelector('[data-subtotal]');
        this.subtotalCompareEl = this.querySelector('[data-subtotal-compare]');
        this.installSelect = this.querySelector('.byp-floating-cart__install-select');
        this.errorEl = this.querySelector('.byp-floating-cart__error');
        this.modal = this.querySelector('.byp-modal');

        this.moneyFormat = window.Shopify && Shopify.money_format ? Shopify.money_format : '${{amount}}';

        this.mainVariant = this.readMainVariant();
      }

      connectedCallback() {
        // Card-level events (delegated)
        this.addEventListener('click', (e) => {
          const atc = e.target.closest('.byp-card__atc');
          if (atc) return this.onCardAdd(atc.closest('.byp-card'));

          const learnMore = e.target.closest('.byp-card__learn-more');
          if (learnMore) return this.openModal(learnMore.closest('.byp-card'));

          if (e.target.closest('[data-modal-close]')) return this.closeModal();

          const remove = e.target.closest('.byp-floating-cart__remove');
          if (remove) {
            this.items.delete(Number(remove.dataset.variantId));
            return this.renderFloatingCart();
          }

          if (e.target.closest('.byp-floating-cart__atc')) return this.addAllToCart();
        });

        // Variant changes inside cards (select or color swatches)
        this.addEventListener('change', (e) => {
          const card = e.target.closest('.byp-card');
          if (card && (e.target.matches('.byp-card__variant-select') || e.target.matches('.byp-card__swatches input'))) {
            this.onCardVariantChange(card, Number(e.target.value));
          }
          if (e.target === this.installSelect) this.renderFloatingCart();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.closeModal();
        });

        // Keep "You are buying" in sync with the main product form variant
        document.addEventListener('change', (e) => {
          if (e.target.closest('variant-selects, variant-radios')) {
            setTimeout(() => {
              this.mainVariant = this.readMainVariant();
              this.renderFloatingCart();
            }, 300);
          }
        });
      }

      /* ---------- main product ---------- */

      readMainVariant() {
        const id = Number(this.dataset.mainVariantId);
        const priceText = this.querySelector('[data-main-price]')?.textContent || '';
        const compareText = this.querySelector('[data-main-compare]')?.textContent || '';
        return {
          id,
          price: this.parseMoney(priceText),
          comparePrice: this.parseMoney(compareText)
        };
      }

      /* ---------- card interactions ---------- */

      cardVariants(card) {
        try {
          return JSON.parse(card.querySelector('.byp-card__variants-json').textContent);
        } catch (e) {
          return [];
        }
      }

      onCardVariantChange(card, variantId) {
        const variant = this.cardVariants(card).find((v) => v.id === variantId);
        if (!variant) return;

        card.querySelector('.byp-card__atc').dataset.variantId = variant.id;
        card.querySelector('.byp-card__atc').disabled = !variant.available;
        card.querySelector('[data-price]').textContent = this.formatMoney(variant.price);

        const compareWrap = card.querySelector('.byp-card__compare');
        if (compareWrap) {
          const hasCompare = variant.compare_at_price > variant.price;
          compareWrap.classList.toggle('hidden', !hasCompare);
          if (hasCompare) card.querySelector('[data-compare-price]').textContent = this.formatMoney(variant.compare_at_price);
        }

        const selectedLabel = card.querySelector('[data-selected-option]');
        if (selectedLabel && variant.option1) selectedLabel.textContent = variant.option1;

        // Once a color is chosen the CTA becomes actionable
        const atc = card.querySelector('.byp-card__atc');
        if (atc.textContent.trim() === 'Select Color') atc.textContent = 'Add To Order';
      }

      onCardAdd(card) {
        const atc = card.querySelector('.byp-card__atc');
        const variantId = Number(atc.dataset.variantId);
        const quantity = Number(card.querySelector('.byp-card__qty').value || 1);
        const variant = this.cardVariants(card).find((v) => v.id === variantId);
        if (!variant || !variant.available) return;

        const existing = this.items.get(variantId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          this.items.set(variantId, {
            id: variantId,
            productTitle: card.dataset.productTitle,
            variantTitle: variant.title === 'Default Title' ? '' : variant.title,
            price: variant.price,
            comparePrice: variant.compare_at_price || 0,
            quantity
          });
        }

        atc.classList.add('byp-card__atc--added');
        setTimeout(() => atc.classList.remove('byp-card__atc--added'), 600);
        this.renderFloatingCart();
      }

      /* ---------- floating cart ---------- */

      renderFloatingCart() {
        // Requirement: visible after the first add-on, then stays visible
        if (this.items.size > 0) this.floatingCart.classList.remove('hidden');

        this.itemsList.innerHTML = '';
        let subtotal = this.mainVariant.price; // cents
        let subtotalCompare = this.mainVariant.comparePrice || this.mainVariant.price;

        this.items.forEach((item) => {
          subtotal += item.price * item.quantity;
          subtotalCompare += (item.comparePrice > item.price ? item.comparePrice : item.price) * item.quantity;

          const li = document.createElement('li');
          li.className = 'byp-floating-cart__item';
          li.innerHTML = `
            <div class="byp-floating-cart__item-info">
              <p>${this.escapeHtml(item.productTitle)}${item.variantTitle ? ' — ' + this.escapeHtml(item.variantTitle) : ''}${item.quantity > 1 ? ` <span class="byp-qty-badge">×${item.quantity}</span>` : ''}</p>
              <button type="button" class="byp-floating-cart__remove link" data-variant-id="${item.id}">Remove</button>
            </div>
            <span class="byp-floating-cart__item-price">${this.formatMoney(item.price * item.quantity)}</span>`;
          this.itemsList.appendChild(li);
        });

        if (this.installSelect && this.installSelect.value) {
          const opt = this.installSelect.selectedOptions[0];
          const installPrice = Number(opt.dataset.price || 0);
          subtotal += installPrice;
          subtotalCompare += installPrice;
        }

        this.subtotalEl.textContent = this.formatMoney(subtotal);
        const showCompare = subtotalCompare > subtotal;
        this.subtotalCompareEl.classList.toggle('hidden', !showCompare);
        if (showCompare) this.subtotalCompareEl.textContent = this.formatMoney(subtotalCompare);
      }

      /* ---------- bulk add to Shopify cart + open Dawn drawer ---------- */

      async addAllToCart() {
        const button = this.querySelector('.byp-floating-cart__atc');
        button.setAttribute('aria-busy', 'true');
        button.disabled = true;
        this.errorEl.hidden = true;

        const items = [{ id: this.mainVariant.id, quantity: 1 }];
        this.items.forEach((item) => items.push({ id: item.id, quantity: item.quantity }));
        if (this.installSelect && this.installSelect.value) {
          items.push({ id: Number(this.installSelect.value), quantity: 1 });
        }

        const cartDrawer = document.querySelector('cart-drawer');
        const body = { items };
        if (cartDrawer) {
          body.sections = 'cart-drawer,cart-icon-bubble';
          body.sections_url = window.location.pathname;
        }

        try {
          const response = await fetch(`${this.cartAddUrl}.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.description || data.message || 'Could not add to cart.');

          // Requirement: floating cart disappears, main cart drawer opens
          this.items.clear();
          if (this.installSelect) this.installSelect.value = '';
          this.floatingCart.classList.add('hidden');

          if (cartDrawer && data.sections) {
            cartDrawer.renderContents(data); // Dawn re-renders #CartDrawer + cart-icon-bubble and opens the drawer
          } else {
            window.location.href = window.routes ? window.routes.cart_url : '/cart';
          }

          if (window.publish && window.PUB_SUB_EVENTS) {
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'build-your-product', cartData: data });
          }
        } catch (error) {
          this.errorEl.textContent = error.message;
          this.errorEl.hidden = false;
        } finally {
          button.removeAttribute('aria-busy');
          button.disabled = false;
        }
      }

      /* ---------- Learn More modal ---------- */

      openModal(card) {
        this.modal.querySelector('.byp-modal__title').textContent = card.dataset.productTitle;
        this.modal.querySelector('.byp-modal__description').innerHTML =
          card.querySelector('.byp-card__description-full')?.innerHTML || '';

        const ratingWrap = this.modal.querySelector('.byp-modal__rating');
        const ratingEl = card.querySelector('.byp-card__rating');
        if (ratingEl) {
          const rating = Math.round(Number(ratingEl.dataset.rating) || 0);
          ratingWrap.classList.remove('hidden');
          ratingWrap.querySelector('.byp-modal__stars').textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          ratingWrap.querySelector('.byp-modal__rating-count').textContent =
            ratingEl.querySelector('.byp-card__rating-count').textContent;
        } else {
          ratingWrap.classList.add('hidden');
        }

        this.loadRecommendations(card.dataset.productId);
        this.modal.classList.remove('hidden');
        document.body.classList.add('byp-modal-open');
        this.modal.querySelector('.byp-modal__close').focus();
      }

      closeModal() {
        this.modal.classList.add('hidden');
        document.body.classList.remove('byp-modal-open');
      }

      /**
       * Bottom slider source: Shopify Product Recommendations API.
       * 1) intent=complementary — "goes well with" products merchants curate in the
       *    Search & Discovery app for the product being viewed in the popup.
       * 2) Fallback intent=related — Shopify's algorithmic recommendations
       *    (purchase/description similarity) when no complementary products are set.
       */
      async loadRecommendations(productId) {
        const track = this.modal.querySelector('.byp-modal__related-track');
        const wrap = this.modal.querySelector('.byp-modal__related');
        track.innerHTML = '';
        wrap.classList.add('hidden');

        try {
          let products = await this.fetchRecommendations(productId, 'complementary');
          if (!products.length) products = await this.fetchRecommendations(productId, 'related');
          if (!products.length) return;

          products.slice(0, 10).forEach((p) => {
            const li = document.createElement('li');
            li.className = 'byp-modal__related-card';
            li.innerHTML = `
              <a href="${p.url}">
                ${p.featured_image ? `<img src="${p.featured_image}&width=200" alt="" loading="lazy" width="100" height="100">` : ''}
                <p>${this.escapeHtml(p.title)}</p>
                <span>${this.formatMoney(p.price)}</span>
              </a>`;
            track.appendChild(li);
          });
          wrap.classList.remove('hidden');
        } catch (e) {
          /* recommendations are progressive enhancement — fail silently */
        }
      }

      async fetchRecommendations(productId, intent) {
        const res = await fetch(`${this.recommendationsUrl}.json?product_id=${productId}&limit=10&intent=${intent}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.products || [];
      }

      /* ---------- utils ---------- */

      formatMoney(cents) {
        const amount = (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return this.moneyFormat
          .replace(/\{\{\s*amount\s*\}\}/, amount)
          .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(cents / 100));
      }

      parseMoney(text) {
        const n = parseFloat(text.replace(/[^0-9.]/g, ''));
        return Number.isNaN(n) ? 0 : Math.round(n * 100);
      }

      escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      }
    }
  );
}
