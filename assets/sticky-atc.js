/*
  Sticky Add-to-Cart bar.

  Owns no selection or pricing state of its own. It observes the main product
  form in the DOM and:
    - shows itself once the real Add-to-Cart button has scrolled above the
      viewport (i.e. the shopper has scrolled past it);
    - mirrors the live variant price and the add-on option total;
    - on click, scrolls the add-on options into view (if present) and then
      triggers the real submit button, so the existing validation and pricing
      logic stay the single source of truth.
*/
if (!customElements.get('sticky-atc')) {
  class StickyATC extends HTMLElement {
    constructor() {
      super();
      this.onStickyClick = this.onStickyClick.bind(this);
    }

    connectedCallback() {
      this.sectionId = this.dataset.sectionId;
      this.submitButton = document.getElementById(this.dataset.submitButton);

      // Without a real Add-to-Cart button there is nothing to mirror or trigger.
      if (!this.submitButton) return;

      this.stickyButton = this.querySelector('[data-sticky-atc-button]');
      this.priceTarget = this.querySelector('[data-sticky-atc-price]');
      this.addonWrapper = this.querySelector('[data-sticky-atc-addon]');
      this.addonTotalTarget = this.querySelector('[data-sticky-atc-addon-total]');

      this.optionsBlock = document.getElementById(`Product-Options-${this.sectionId}`);
      this.sourcePrice = this.findSourcePrice();
      this.sourceAddonTotal = document.getElementById('product-options-totalpriceadd');

      this.setupVisibilityObserver();
      this.setupPriceMirror();
      this.setupAddonMirror();

      if (this.stickyButton) {
        this.stickyButton.addEventListener('click', this.onStickyClick);
      }
    }

    disconnectedCallback() {
      if (this.visibilityObserver) this.visibilityObserver.disconnect();
      if (this.priceObserver) this.priceObserver.disconnect();
      if (this.addonObserver) this.addonObserver.disconnect();
      if (this.stickyButton) {
        this.stickyButton.removeEventListener('click', this.onStickyClick);
      }
    }

    // Locate the main price element so we can mirror it (and its updates on
    // variant change) into the sticky bar.
    findSourcePrice() {
      const info = this.submitButton.closest('product-info, .product__info-wrapper, .product') || document;
      return info.querySelector('.product__prices .price-container .price') ||
        info.querySelector('.price-container .price') ||
        info.querySelector('.price');
    }

    setupVisibilityObserver() {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // Show only when the real button has scrolled above the viewport,
          // never when it is still below the fold on initial load.
          const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          this.toggleVisible(scrolledPast);
        });
      }, { threshold: 0 });

      this.visibilityObserver.observe(this.submitButton);
    }

    toggleVisible(visible) {
      this.classList.toggle('is-visible', visible);
      this.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    setupPriceMirror() {
      if (!this.sourcePrice || !this.priceTarget) return;

      const sync = () => {
        this.priceTarget.innerHTML = this.sourcePrice.innerHTML;
      };
      sync();

      this.priceObserver = new MutationObserver(sync);
      this.priceObserver.observe(this.sourcePrice, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    setupAddonMirror() {
      if (!this.sourceAddonTotal || !this.addonWrapper) return;

      const sync = () => {
        const text = (this.sourceAddonTotal.textContent || '').trim();
        const amount = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
        if (amount > 0) {
          if (this.addonTotalTarget) this.addonTotalTarget.textContent = text;
          this.addonWrapper.hidden = false;
        } else {
          this.addonWrapper.hidden = true;
        }
      };
      sync();

      this.addonObserver = new MutationObserver(sync);
      this.addonObserver.observe(this.sourceAddonTotal, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    onStickyClick(event) {
      event.preventDefault();

      // When the product has add-on options, bring them (and any validation
      // messages the real submit may surface) into view before triggering it.
      if (this.optionsBlock) {
        this.optionsBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => this.submitButton.click(), 400);
      } else {
        this.submitButton.click();
      }
    }
  }

  customElements.define('sticky-atc', StickyATC);
}
