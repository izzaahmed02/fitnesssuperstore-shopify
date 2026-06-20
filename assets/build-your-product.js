/* ==========================================================================
   Build Your Product — Dawn theme
   - Add-on selection with instant, always-sticky floating cart
   - Bulk /cart/add.js + Dawn cart-drawer open (cart stays visible; list resets)
   - Learn More popup (card-level + master "?") from each accordion's family
   - Colour is chosen on the MAIN PRODUCT FORM (theme's custom options system).
     At "Add to cart" this calls the main form's <product-form-with-options>
     element methods and attaches the result (colour/warranty/processing/assembly
     + _functionOperation) to the main product line, matching the live cart payload.
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
        // Install option is now an FSR90 engine category rendered in the floating
        // cart (install_only). It is a <product-customization-options> instance that
        // exposes the same payload builders as the main form, so its selection
        // attaches to the FSR90 line via properties + _functionOperation.
        this.installInstance = this.querySelector('.byp-floating-cart__install product-customization-options');
        this.errorEl = this.querySelector('.byp-floating-cart__error');
        this.modal = this.querySelector('.byp-modal');

        this.moneyFormat = window.Shopify && Shopify.money_format ? Shopify.money_format : '${{amount}}';
        this.mainVariant = this.readMainVariant();
      }

      connectedCallback() {
        this.addEventListener('click', (e) => {
          const arrow = e.target.closest('.byp-slider__arrow');
          if (arrow) return this.onSliderArrow(arrow);

          const master = e.target.closest('.byp-accordion__master-learn-more');
          if (master) return this.openMasterModal(master);

          const atc = e.target.closest('.byp-card__atc');
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
          if (this.installInstance && this.installInstance.contains(e.target)) this.renderFloatingCart();
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.closeModal();
        });

        // The install engine may use a custom dropdown (click-driven) rather than a
        // native <select>, so re-read its selected price after any interaction inside it.
        if (this.installInstance) {
          this.installInstance.addEventListener('click', () => setTimeout(() => this.renderFloatingCart(), 0));
        }

        document.addEventListener('change', (e) => {
          if (e.target.closest('variant-selects, variant-radios')) {
            setTimeout(() => {
              this.mainVariant = this.readMainVariant();
              this.syncMainFormBasePrice();
              this.renderFloatingCart();
            }, 300);
          }
        });

        this.renderFloatingCart();
        this.initSliders();

        // Fix the main-form price base (engine reads the first .pr_custom_price as base).
        // Set the value synchronously, then re-run after the engine's init paint.
        this.syncMainFormBasePrice();
        setTimeout(() => this.syncMainFormBasePrice(), 350);
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

      /* ---------- main form price (.pr_custom_price) base ----------
         The options engine's priceHelper() uses the FIRST .pr_custom_price in
         the DOM (the main product form's) as the base price, reading its
         data-price-value. On this template that element renders without a valid
         data-price-value, so the engine computes 0 + adjustments and the main
         form shows "0". We give every .pr_custom_price a valid base (the FSR90
         price) so the engine computes base + adjustments correctly, and we fix
         the on-load display if the engine already wrote 0. */
      syncMainFormBasePrice() {
        const priceEls = Array.from(document.querySelectorAll('.pr_custom_price'));
        if (!priceEls.length) return;

        const baseCents = this.mainVariant.price;
        if (!baseCents) return;
        const baseDollars = (baseCents / 100).toFixed(2); // engine expects a plain number string, e.g. "3299.00"

        // The currency symbol the engine formats with — our colour card anchor already carries it.
        const cardAnchor = this.querySelector('.byp-card--color .pr_custom_price');
        const currency = cardAnchor ? cardAnchor.dataset.currency : '';

        priceEls.forEach((el) => {
          const val = parseFloat(el.dataset.priceValue);
          if (!val || Number.isNaN(val)) {
            el.dataset.priceValue = baseDollars;
            if (currency && !el.dataset.currency) el.dataset.currency = currency;
          }
        });

        // If the engine already painted "0" into the visible main-form price, restore the base.
        const mainEl = priceEls[0];
        if (!this.parseMoney(mainEl.textContent)) {
          mainEl.textContent = this.formatMoney(baseCents);
        }
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

        // Install (Assembly & Room of Choice) — this attaches as a property on the
        // FSR90's own line (not a separate line item), so we show it here as a
        // summary row for visibility and fold its upcharge into the subtotal.
        const installPrice = this.installSelectedPriceCents();
        const installSummary = this.installSelectedSummary();
        if (installSummary) {
          subtotal += installPrice;
          subtotalCompare += installPrice;
          const li = document.createElement('li');
          li.className = 'byp-floating-cart__item byp-floating-cart__item--install';
          li.innerHTML = `
            <div class="byp-floating-cart__item-info">
              <p>${this.escapeHtml(installSummary.value)}</p>
            </div>
            <span class="byp-floating-cart__item-price">${installPrice > 0 ? this.formatMoney(installPrice) : 'No charge'}</span>`;
          this.itemsList.appendChild(li);
        }

        this.subtotalEl.textContent = this.formatMoney(subtotal);
        const showCompare = subtotalCompare > subtotal;
        this.subtotalCompareEl.classList.toggle('hidden', !showCompare);
        if (showCompare) this.subtotalCompareEl.textContent = this.formatMoney(subtotalCompare);
      }

      /* ---------- main-form options (colour/warranty/processing/assembly) ---------- */

      // Colour and the other options live on the main product form, rendered by the
      // theme's custom options system as a <product-form-with-options> element. That
      // element exposes the same payload builders the main form uses on submit, so we
      // call them directly: the FSR90 line the floating cart adds becomes identical to
      // the main form's own add (same line-item properties + _functionOperation array).
      mainFormOptionsInstance() {
        const instances = Array.from(document.querySelectorAll('product-form-with-options'));
        // Prefer one that is NOT inside a cart drawer/notification or this section.
        return (
          instances.find((el) => !el.closest('cart-drawer') && !el.closest('cart-notification') && !el.closest('build-your-product')) ||
          instances[0] ||
          null
        );
      }

      // Read one engine instance's payload pieces. Works for both
      // <product-form-with-options> (main form) and <product-customization-options>
      // (the floating-cart install instance) — they expose the same builders.
      readInstancePayload(instance) {
        if (!instance) return null;
        // Call each builder in its own guard so one missing/throwing method
        // (e.g. prepareDefaultProperties on the bare element) never drops the others.
        const safe = (fn) => {
          try {
            return typeof fn === 'function' ? fn.call(instance) : undefined;
          } catch (err) {
            console.warn('[build-your-product] option read failed:', err);
            return undefined;
          }
        };
        return {
          defaults: safe(instance.prepareDefaultProperties) || {},
          options: safe(instance.prepareOptions) || {},
          fnOps: safe(instance.prepareFunctionalProperties) || null
        };
      }

      // Build the FSR90 line's line-item properties by MERGING every engine instance
      // that contributes to it: the main form's options (colour/warranty/processing)
      // plus the floating-cart install instance. Their _functionOperation arrays are
      // concatenated, so the single FSR90 line carries every selected option and the
      // pricing function applies each upcharge — identical to the main form's submit.
      mainProductProperties() {
        const sources = [this.mainFormOptionsInstance(), this.installInstance];
        let props = {};
        let fnOps = [];

        sources.forEach((instance) => {
          const payload = this.readInstancePayload(instance);
          if (!payload) return;
          props = { ...props, ...payload.defaults, ...payload.options };
          if (Array.isArray(payload.fnOps)) {
            fnOps = fnOps.concat(payload.fnOps);
          } else if (payload.fnOps) {
            fnOps = fnOps.concat([payload.fnOps]);
          }
        });

        if (fnOps.length) props._functionOperation = fnOps;
        return Object.keys(props).length > 0 ? props : null;
      }

      // Selected install price (cents) for the floating-cart subtotal.
      // The engine returns each upcharge as priceAdjustment (in the store's major
      // unit, e.g. 649 = $649) in prepareFunctionalProperties(), so we sum those
      // rather than scraping DOM text — exactly the value the pricing function uses.
      installSelectedPriceCents() {
        if (!this.installInstance || typeof this.installInstance.prepareFunctionalProperties !== 'function') return 0;
        try {
          const ops = this.installInstance.prepareFunctionalProperties() || [];
          let major = 0;
          ops.forEach((op) => { major += Number(op && op.priceAdjustment) || 0; });
          return Math.round(major * 100);
        } catch (err) {
          return 0;
        }
      }

      // The selected install option as { label, value } for the floating-cart row.
      // prepareOptions() returns { "<group title>": "<selected option text>" }.
      installSelectedSummary() {
        if (!this.installInstance || typeof this.installInstance.prepareOptions !== 'function') return null;
        try {
          const opts = this.installInstance.prepareOptions() || {};
          const entries = Object.entries(opts);
          if (!entries.length) return null;
          const [label, value] = entries[0];
          if (!value) return null;
          return { label: String(label), value: String(value) };
        } catch (err) {
          return null;
        }
      }

      /* ---------- bulk add to Shopify cart + open Dawn drawer ---------- */

      async addAllToCart() {
        const button = this.querySelector('.byp-floating-cart__atc');
        button.setAttribute('aria-busy', 'true');
        button.disabled = true;
        this.errorEl.hidden = true;

        // Main product line — attach the main form's selected options if available.
        const mainLine = { id: this.mainVariant.id, quantity: 1 };
        const mainProps = this.mainProductProperties();
        if (mainProps) mainLine.properties = mainProps;

        const items = [mainLine];
        this.items.forEach((item) => items.push({ id: item.id, quantity: item.quantity }));

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