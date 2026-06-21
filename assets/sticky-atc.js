/*
  Sticky Add-to-Cart bar.

  Owns no selection or pricing state of its own. It observes the main product
  form in the DOM and:
    - shows itself once the real Add-to-Cart button has scrolled out of view;
    - mirrors the live product price;
    - builds a dropdown for each visible "must-select" option in
      #Product-Options-<section> (variant/config + key services; upsell add-ons
      such as mats, attachments and accessories are excluded; see isMustSelect)
      and keeps it in two-way sync with the real option control, so pricing,
      validation and cart submission stay owned by product-custom-options.js;
    - on click, scrolls the options into view (if any) and triggers the real
      submit button.

  Option control types handled:
    - Select  ([data-select-option])           -> mirrored <select>
    - single-choice Accordion (radio swatches)  -> <select> that checks the
                                                   matching swatch input
    - multi-choice Accordion / Quantity         -> a button that scrolls to the
                                                   real option (cannot be
                                                   faithfully represented as one
                                                   dropdown)
*/
if (!customElements.get('sticky-atc')) {
  class StickyATC extends HTMLElement {
    constructor() {
      super();
      this.onStickyClick = this.onStickyClick.bind(this);
      this.onToggle = this.onToggle.bind(this);
    }

    connectedCallback() {
      this.sectionId = this.dataset.sectionId;
      this.submitButton = document.getElementById(this.dataset.submitButton);
      if (!this.submitButton) return; // nothing to mirror or trigger

      this.stickyButton = this.querySelector('[data-sticky-atc-button]');
      this.optionsTarget = this.querySelector('[data-sticky-atc-options]');
      this.toggle = this.querySelector('[data-sticky-atc-toggle]');

      this.optionsBlock = document.getElementById(`Product-Options-${this.sectionId}`);

      this.setupVisibilityObserver();
      // Build option proxies after the main options have had a chance to render.
      this.buildOptions();

      if (this.stickyButton) this.stickyButton.addEventListener('click', this.onStickyClick);
      if (this.toggle) this.toggle.addEventListener('click', this.onToggle);
    }

    disconnectedCallback() {
      if (this.visibilityObserver) this.visibilityObserver.disconnect();
      if (this.stickyButton) this.stickyButton.removeEventListener('click', this.onStickyClick);
      if (this.toggle) this.toggle.removeEventListener('click', this.onToggle);
    }

    isVisible(el) {
      return !!el && el.getClientRects().length > 0;
    }

    /* ----- Visibility: show once the real ATC button has scrolled past ----- */
    setupVisibilityObserver() {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
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

    /* ----- Mobile collapse toggle ----- */
    onToggle() {
      const collapsed = this.classList.toggle('is-collapsed');
      this.toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    /* ----- Option proxies ----- */
    buildOptions() {
      if (!this.optionsBlock || !this.optionsTarget) return;

      const selects = Array.from(this.optionsBlock.querySelectorAll('[data-select-option]'));
      const accordions = Array.from(this.optionsBlock.querySelectorAll('[data-option-accordion]'));
      const quantities = Array.from(this.optionsBlock.querySelectorAll('[data-quantity-option]'));

      selects.forEach((select) => {
        if (this.isVisible(select) && this.isMustSelect(select)) this.buildSelectProxy(select);
      });
      accordions.forEach((accordion) => {
        if (this.isVisible(accordion) && this.isMustSelect(accordion)) this.buildAccordionProxy(accordion);
      });
      quantities.forEach((quantity) => {
        if (this.isVisible(quantity) && this.isMustSelect(quantity)) this.buildScrollProxy(quantity, this.categoryTitleFor(quantity));
      });
    }

    // The bar surfaces only the "must-select" options for the product:
    // configuration / variant choices (color, weight stack, rig sections, rig
    // upright height) and the key services (assembly / room of choice, warranty).
    // Everything else (mats, attachments, cable attachments, accessories / add-ons,
    // etc.) is treated as a cart upsell and excluded. The decision is made on the
    // option's category title (the <h2>), which is the reliable signal — the long
    // accessory lists live under their own categories.
    categoryTitleFor(el) {
      const category = el.closest('.product-option__item');
      const titleEl = category && category.querySelector('.product-options__category-title');
      return titleEl ? titleEl.textContent.trim() : '';
    }

    isMustSelect(el) {
      const t = this.categoryTitleFor(el).toLowerCase();
      if (!t) return false;
      return t.includes('warranty') ||
        t.includes('weight stack') ||
        t.includes('color') ||
        t.includes('colour') ||
        t.includes('assembly') ||
        t.includes('room of choice') ||
        t.includes('rig option') ||
        t.includes('rig section') ||
        t.includes('number of rig') ||
        t.includes('rig upright') ||
        t.includes('upright height');
    }

    makeField(labelText) {
      const field = document.createElement('label');
      field.className = 'sticky-atc__option';
      field.title = labelText || '';
      return field;
    }

    // A native <select> that mirrors an existing <select data-select-option>.
    buildSelectProxy(source) {
      const field = this.makeField(source.dataset.selectTitle);
      const proxy = document.createElement('select');
      proxy.className = 'sticky-atc__option-select';
      proxy.innerHTML = source.innerHTML;
      proxy.value = source.value;

      proxy.addEventListener('change', () => {
        source.value = proxy.value;
        source.dispatchEvent(new Event('change', { bubbles: true }));
      });
      source.addEventListener('change', () => { proxy.value = source.value; });

      field.appendChild(proxy);
      this.optionsTarget.appendChild(field);
    }

    // A <select> built from single-choice (radio) swatch inputs in an accordion.
    buildAccordionProxy(accordion) {
      const inputs = Array.from(accordion.querySelectorAll('.product-options__swatch-input'));
      const multichoice = accordion.hasAttribute('multichoice') ||
        inputs.some((input) => input.type === 'checkbox');

      const title = this.accordionTitle(accordion);

      // Multi-choice can't be a single dropdown; offer a scroll-to control.
      if (multichoice || inputs.length === 0) {
        this.buildScrollProxy(accordion, title);
        return;
      }

      const field = this.makeField(title);
      const proxy = document.createElement('select');
      proxy.className = 'sticky-atc__option-select';

      inputs.forEach((input) => {
        const wrapper = input.closest('.product-options__swatch-wrapper');
        const labelEl = wrapper && wrapper.querySelector('.product-options__swatch-title');
        const option = document.createElement('option');
        option.value = input.value;
        option.textContent = (labelEl ? labelEl.textContent : input.value).trim();
        if (input.disabled) option.disabled = true;
        if (input.checked) option.selected = true;
        proxy.appendChild(option);
      });

      proxy.addEventListener('change', () => {
        const target = inputs.find((input) => input.value === proxy.value);
        if (!target) return;
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        target.click();
      });
      accordion.addEventListener('change', () => {
        const checked = inputs.find((input) => input.checked);
        if (checked) proxy.value = checked.value;
      });

      field.appendChild(proxy);
      this.optionsTarget.appendChild(field);
    }

    // A button that scrolls to (and opens) a control we can't mirror inline.
    buildScrollProxy(source, labelText) {
      const field = this.makeField(labelText);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sticky-atc__option-link';
      button.textContent = labelText || 'Options';
      button.addEventListener('click', () => {
        source.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const opener = source.querySelector('[data-open-accordion]');
        if (opener && opener.getAttribute('aria-expanded') === 'false') opener.click();
      });
      field.appendChild(button);
      this.optionsTarget.appendChild(field);
    }

    accordionTitle(accordion) {
      const titleEl = accordion.querySelector('.product-options__subcategory-title, [data-option-title]');
      return titleEl ? titleEl.textContent.trim() : (accordion.dataset.type || 'Options');
    }

    /* ----- Add to cart ----- */
    onStickyClick(event) {
      event.preventDefault();
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
