/* ==========================================================================
   Build Your Product — Dawn theme
   - Add-on selection with instant, always-sticky floating cart
   - Bulk /cart/add.js + Dawn cart-drawer open (cart stays visible; list resets)
   - Learn More popup (card-level + master "?") from each accordion's family
   - Color picker card: reuses the options app's <product-customization-options>
     instance; floating cart reads the selected color price into the subtotal
     and commits the selection via the app's prepareOptions() +
     prepareFunctionalProperties() as properties on the main product line.
   ========================================================================== */

if (!customElements.get('build-your-product')) {
  customElements.define(
    'build-your-product',
    class BuildYourProduct extends HTMLElement {
      constructor() {
        super();
        this.items = new Map();
        this.cartAddUrl = this.dataset.cartAddUrl || '/cart/add';

        this.floatingCart = this.querySelector('.byp-floating-cart');
        this.itemsList = this.querySelector('.byp-floating-cart__items');
        this.subtotalEl = this.querySelector('[data-subtotal]');
        this.subtotalCompareEl = this.querySelector('[data-subtotal-compare]');
        this.installSelect = this.querySelector('.byp-floating-cart__install-select');
        this.errorEl = this.querySelector('.byp-floating-cart__error');
        this.modal = this.querySelector('.byp-modal');

        // Color picker instance (the options app element rendered in the card)
        this.colorOptions = this.querySelector('.byp-color-options');
        this.colorSummary = this.querySelector('[data-color-summary]');

        this.moneyFormat = window.Shopify && Shopify.money_format ? Shopify.money_format : '${{amount}}';
        this.mainVariant = this.readMainVariant();
      }

      connectedCallback() {
        this.addEventListener('click', (e) => {
          const arrow = e.target.closest('.byp-slider__arrow');
          if (arrow) return this.onSliderArrow(arrow);

          const master = e.target.closest('.byp-accordion__master-learn-more');
          if (master) return this.openMasterModal(master);

          // Color picker swatches / custom-color add — let the app handle the
          // selection, then refresh our subtotal + summary on the next tick.
          if (e.target.closest('.byp-color-options')) {
            if (
              e.target.closest('[data-color-name]') ||
              e.target.closest('.add-custom-color') ||
              e.target.closest('.byp-color-confirm')
            ) {
              setTimeout(() => this.renderFloatingCart(), 60);
            }
            if (e.target.closest('.byp-color-confirm')) return;
          }

          const atc = e.target.closest('.byp-card__atc:not(.byp-color-confirm)');
          if (atc) return this.onCardAdd(atc.closest('.byp-card'));

          const learnMore = e.target.closest('.byp-card__learn-more');
          if (learnMore) return this.openCardModal(learnMore.closest('.byp-card'));

          if (e.target.closest('[data-modal-close]')) return this.closeModal();

          const remove = e.target.closest('.byp-floating-cart__remove');
          if (remove) {
            this.items.delete(Number(remove.dataset.variantId));
            return this.renderFloatingCart();
          }

          if (e.target.closest('.byp-floating-cart__toggle')) return this.toggleFloatingCart();
          if (e.target.closest('.byp-floating-cart__atc')) return this.addAllToCart();
        });

        this.addEventListener('change', (e) => {
          const card = e.target.closest('.byp-card');
          if (card && (e.target.matches('.byp-card__variant-select') || e.target.matches('.byp-card__swatches input'))) {
            this.onCardVariantChange(card, Number(e.target.value));
          }
          if (e.target === this.installSelect) this.renderFloatingCart();
        });

        // Custom-color text input commit also updates the subtotal/summary
        this.addEventListener('input', (e) => {
          if (e.target.closest('.byp-color-options') && e.target.matches('.custom-color-value')) {
            setTimeout(() => this.renderFloatingCart(), 60);
          }
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.closeModal();
        });

        document.addEventListener('change', (e) => {
          if (e.target.closest('variant-selects, variant-radios')) {
            setTimeout(() => {
              this.mainVariant = this.readMainVariant();
              this.renderFloatingCart();
            }, 300);
          }
        });

        this.renderFloatingCart();
        this.initSliders();
      }

      /* ---------- product sliders ---------- */

      initSliders() {
        this.querySelectorAll('.byp-slider').forEach((slider) => {
          const track = slider.querySelector('.byp-slider__track');
          track.addEventListener('scroll', () => this.updateSliderArrows(slider), { passive: true });
        });
        const refreshAll = () => this.querySelectorAll('.byp-slider').forEach((s) => this.updateSliderArrows(s));
        window.addEventListener('resize', refreshAll);
        this.querySelectorAll('.byp-accordion').forEach((acc) => {
          acc.addEventListener('toggle', () => {
            if (acc.open) requestAnimationFrame(() => this.updateSliderArrows(acc.querySelector('.byp-slider')));
          });
        });
        refreshAll();
      }

      updateSliderArrows(slider) {
        if (!slider) return;
        const track = slider.querySelector('.byp-slider__track');
        const prev = slider.querySelector('.byp-slider__arrow--prev');
        const next = slider.querySelector('.byp-slider__arrow--next');
        const maxScroll = track.scrollWidth - track.clientWidth;
        const hasOverflow = maxScroll > 4;
        prev.hidden = !hasOverflow || track.scrollLeft <= 4;
        next.hidden = !hasOverflow || track.scrollLeft >= maxScroll - 4;
      }

      onSliderArrow(arrow) {
        const slider = arrow.closest('.byp-slider');
        const track = slider.querySelector('.byp-slider__track');
        const card = track.querySelector('.byp-card');
        const perView = window.matchMedia('(max-width: 599px)').matches ? 2 : 1;
        const step = card ? (card.getBoundingClientRect().width + 16) * perView : 320;
        track.scrollBy({
          left: arrow.classList.contains('byp-slider__arrow--prev') ? -step : step,
          behavior: 'smooth'
        });
      }

      /* ---------- floating cart minimize/maximize ---------- */

      toggleFloatingCart() {
        const collapsed = this.floatingCart.classList.toggle('byp-floating-cart--collapsed');
        const toggle = this.floatingCart.querySelector('.byp-floating-cart__toggle');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Maximize cart' : 'Minimize cart');
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

      /* ---------- selected color (read from the app's DOM) ---------- */

      // Returns { name, price } for the currently selected color, or null.
      readSelectedColor() {
        if (!this.colorOptions) return null;

        // The app keeps the active selection in the hidden [data-color-variant-input]
        // (variant id + price) and the human-readable title in [data-color-selected-title].
        const hidden = this.colorOptions.querySelector('[data-color-variant-input]');
        const titleEl = this.colorOptions.querySelector('[data-selected-color-option] [data-color-selected-title]');
        if (!hidden && !titleEl) return null;

        const name = titleEl ? titleEl.textContent.trim() : '';
        // price stored on the hidden input is in dollars (e.g. "600.00"); 0/"" = no upcharge
        let priceDollars = hidden ? parseFloat(hidden.dataset.price || '0') : 0;
        if (Number.isNaN(priceDollars)) priceDollars = 0;

        return { name, price: Math.round(priceDollars * 100) }; // cents
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
        this.itemsList.innerHTML = '';
        let subtotal = this.mainVariant.price;
        let subtotalCompare = this.mainVariant.comparePrice || this.mainVariant.price;

        // Selected color price folds into the main product subtotal
        const color = this.readSelectedColor();
        if (color) {
          subtotal += color.price;
          subtotalCompare += color.price;
          if (this.colorSummary) {
            const hasColor = color.name !== '';
            this.colorSummary.classList.toggle('hidden', !hasColor);
            if (hasColor) {
              this.colorSummary.querySelector('[data-color-summary-value]').textContent = color.name;
              const priceEl = this.colorSummary.querySelector('[data-color-summary-price]');
              priceEl.textContent = color.price > 0 ? `+${this.formatMoney(color.price)}` : '';
            }
          }
        } else if (this.colorSummary) {
          this.colorSummary.classList.add('hidden');
        }

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

        // Main product line — attach color properties from the options app if present.
        const mainLine = { id: this.mainVariant.id, quantity: 1 };
        if (this.colorOptions) {
          try {
            const props = this.colorOptions.prepareOptions ? this.colorOptions.prepareOptions() : {};
            const fnOps = this.colorOptions.prepareFunctionalProperties ? this.colorOptions.prepareFunctionalProperties() : undefined;
            const properties = { ...props };
            if (fnOps) properties._functionOperation = fnOps;
            if (Object.keys(properties).length > 0) mainLine.properties = properties;
          } catch (err) {
            // Fail safe: add the product without color rather than send a malformed line.
            console.warn('[build-your-product] color payload unavailable, adding without color:', err);
          }
        }

        const items = [mainLine];
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

          // Reset the floating cart's add-on list (keep cart visible/sticky).
          this.items.clear();
          if (this.installSelect) this.installSelect.value = '';
          this.renderFloatingCart();

          if (cartDrawer) {
            let sections = data.sections;
            if (!sections || !sections['cart-drawer']) {
              const res = await fetch(`${window.location.pathname}?sections=cart-drawer,cart-icon-bubble`);
              if (res.ok) sections = await res.json();
            }
            if (sections && sections['cart-drawer']) {
              cartDrawer.classList.remove('is-empty');
              cartDrawer.querySelector('.drawer__inner')?.classList.remove('is-empty');
              try {
                cartDrawer.renderContents({ ...data, sections });
              } catch (renderError) {
                cartDrawer.open && cartDrawer.open();
              }
            }
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

      /* ---------- Learn More popup (card-level + master "?") ---------- */

      openCardModal(card) {
        const family = this.accordionFamily(card.closest('.byp-accordion'));
        const productId = Number(card.dataset.productId);
        const featured = family.find((p) => p.id === productId);
        const main = featured || {
          id: productId,
          title: card.dataset.productTitle,
          rating: Number(card.querySelector('.byp-card__rating')?.dataset.rating || 0),
          rating_count: Number((card.querySelector('.byp-card__rating-count')?.textContent || '0').replace(/\D/g, '')),
          description: card.querySelector('.byp-card__description-full')?.innerHTML || '',
          image: card.querySelector('.byp-card__media img')?.src || ''
        };
        this.populateModal(main, family, productId);
      }

      openMasterModal(button) {
        const accordion = button.closest('.byp-accordion');
        const family = this.accordionFamily(accordion);
        if (!family.length) return;
        const mainId = Number(button.dataset.masterProductId);
        const main = family.find((p) => p.id === mainId) || family[0];
        this.populateModal(main, family, main.id);
      }

      accordionFamily(accordion) {
        try {
          return JSON.parse(accordion.querySelector('.byp-accordion__family-json').textContent);
        } catch (e) {
          return [];
        }
      }

      populateModal(main, family, excludeId) {
        const img = this.modal.querySelector('.byp-modal__main-img');
        if (main.image) {
          img.src = main.image;
          img.hidden = false;
        } else {
          img.hidden = true;
        }

        this.modal.querySelector('.byp-modal__title').textContent = main.title || '';

        // Plain-text description (strip embedded images/tables to avoid scrollers)
        const desc = this.modal.querySelector('.byp-modal__description');
        const tmp = document.createElement('div');
        tmp.innerHTML = main.description || '';
        tmp.querySelectorAll('img, table, iframe, video, script, style').forEach((el) => el.remove());
        desc.textContent = (tmp.textContent || '').replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

        const ratingWrap = this.modal.querySelector('.byp-modal__rating');
        const rating = Math.round(Number(main.rating) || 0);
        if (rating > 0 || Number(main.rating_count) > 0) {
          ratingWrap.classList.remove('hidden');
          ratingWrap.querySelector('.byp-modal__stars').textContent = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
          ratingWrap.querySelector('.byp-modal__rating-count').textContent = `${main.rating_count || 0} reviews`;
        } else {
          ratingWrap.classList.add('hidden');
        }

        const track = this.modal.querySelector('.byp-modal__related-track');
        const wrap = this.modal.querySelector('.byp-modal__related');
        track.innerHTML = '';
        family.forEach((p) => {
          const ratingN = Math.round(Number(p.rating) || 0);
          const hasCompare = Number(p.compare_at_price) > Number(p.price);
          const li = document.createElement('li');
          li.className = 'byp-modal__related-card';
          li.innerHTML = `
            <a href="${p.url}">
              ${p.image ? `<img src="${p.image}" alt="" loading="lazy" width="160" height="160">` : ''}
              ${p.sku ? `<p class="byp-modal__related-sku">SKU: ${this.escapeHtml(p.sku)}</p>` : ''}
              <p class="byp-modal__related-title">${this.escapeHtml(p.title)}</p>
              ${ratingN > 0 || Number(p.rating_count) > 0 ? `<p class="byp-modal__related-rating"><span class="byp-star">&#9733;</span> ${p.rating_count || 0} reviews</p>` : ''}
              ${hasCompare ? `<p class="byp-modal__related-compare">As high as: <s>${this.formatMoney(p.compare_at_price)}</s></p>` : ''}
              <p class="byp-modal__related-price">${this.formatMoney(p.price)} USD</p>
            </a>`;
          track.appendChild(li);
        });
        wrap.classList.toggle('hidden', family.length === 0);

        this.modal.classList.remove('hidden');
        document.body.classList.add('byp-modal-open');
        this.modal.querySelector('.byp-modal__close').focus();
      }

      closeModal() {
        this.modal.classList.add('hidden');
        document.body.classList.remove('byp-modal-open');
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