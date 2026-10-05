const onReady = (fn) =>
  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

const onIdle = (fn, t = 1500) =>
  ('requestIdleCallback' in window)
    ? requestIdleCallback(fn, { timeout: t })
    : setTimeout(fn, 0);

const debounceFn = (fn, wait = 250) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
};

const rafBatch = (() => {
  let queued = false, fns = [];
  const run = () => { const jobs = fns; fns = []; queued = false; for (const fn of jobs) fn(); };
  return (fn) => { fns.push(fn); if (!queued) { queued = true; requestAnimationFrame(run); } };
})();

onReady(() => {
  onIdle(() => {
    const compare = document.querySelector('.compare-products-actions a');
    if (compare) compare.removeAttribute('href');
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq .faq__item-btn');
    if (!btn) return;

    const item = btn.closest('.faq__item');
    const faq = btn.closest('.faq');
    if (!item || !faq) return;

    const content = item.querySelector('.faq__item-content');
    const opening = !btn.classList.contains('opened');

    faq.querySelectorAll('.faq__item-btn.opened').forEach((b) => b.classList.remove('opened'));
    faq.querySelectorAll('.faq__item.opened').forEach((i) => i.classList.remove('opened'));
    faq.querySelectorAll('.faq__item-content').forEach((c) => c.style.maxHeight = null);

    if (opening) {
      btn.classList.add('opened');
      item.classList.add('opened');
      rafBatch(() => {
        content.style.overflow = 'hidden';
        if (!content.style.transition) content.style.transition = 'max-height 0.3s ease';
        content.style.maxHeight = content.scrollHeight + 'px';
      });
    }
  }, { passive: true });

  const faqRO = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      const item = target.closest('.faq__item');
      const btn = item && item.querySelector('.faq__item-btn.opened');
      if (btn) target.style.maxHeight = target.scrollHeight + 'px';
    });
  });
  document.querySelectorAll('.faq__item-content').forEach((el) => {
    el.style.overflow = 'hidden';
    if (!el.style.transition) el.style.transition = 'max-height 0.3s ease';
    el.style.maxHeight = '0';
    faqRO.observe(el);
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tabs-section] .tab-btn');
    if (!btn) return;

    const section = btn.closest('[data-tabs-section]');
    const idx = btn.getAttribute('data-index');
    const active = section && section.querySelector(`.tabs__item[data-index="${idx}"]`);
    if (!section || !active) return;

    rafBatch(() => {
      section.querySelectorAll('.tab-btn.active').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      section.querySelectorAll('.tabs__item.active, .tabs__item.visible').forEach((t) => t.classList.remove('active', 'visible'));
      active.classList.add('active', 'visible');
    });
  }, { passive: true });

   const toggleCollapsible = (panel, arrow, open) => {
    rafBatch(() => {
      const willOpen = open ?? !panel.classList.contains('visible');
      const panelHeight = willOpen ? `${panel.scrollHeight}px` : '0';
      panel.classList.toggle('visible', willOpen);
      panel.style.height = panelHeight;
      if (arrow) arrow.style.transform = willOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  };

  document.body.addEventListener('click', (e) => {
    const mobileBtn = e.target.closest('.dropdown-btn');
    if (mobileBtn && window.innerWidth <= 749) {
      const panel = mobileBtn.nextElementSibling;
      if (panel) toggleCollapsible(panel, mobileBtn.querySelector('svg'));
      return;
    }
    const iwtBtn = e.target.closest('.image-with-text__dropdown-button');
    if (iwtBtn) {
      const panel = iwtBtn.nextElementSibling;
      if (panel) toggleCollapsible(panel, iwtBtn.querySelector('svg'));
    }
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scroll-to-section]');
    if (!btn) return;
    const id = btn.getAttribute('data-scroll-to-section');
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, { passive: false });

  const getHashTarget = (rawHash) => {
    if (!rawHash || rawHash.length <= 1) return null;
    const decodedHash = decodeURIComponent(rawHash);
    const id = decodedHash.startsWith('#') ? decodedHash.slice(1) : decodedHash;
    return document.getElementById(id) || document.querySelector(decodedHash);
  };

  const smoothScrollToHash = (rawHash) => {
    const target = getHashTarget(rawHash);
    if (!target) return;
    const header = document.querySelector('.section-header');
    const offset = header ? header.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 16;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  };

  if (window.location.hash) {
    setTimeout(() => smoothScrollToHash(window.location.hash), 120);
  }

  window.addEventListener('hashchange', () => smoothScrollToHash(window.location.hash), { passive: true });

  if (!customElements.get('scrollable-faq')) {
    class ScrollableFaq extends HTMLElement {
      constructor(){
        super();
        this.buttons = this.querySelectorAll('.scrollable-faq__nav button');
        this.blocks  = Array.from(this.querySelectorAll('.scrollable-faq__item'));
        this.activeClass = 'active';
        this.offset = 50;
        this.mq = matchMedia('(min-width: 750px)');
        this.onMQ = this.onMQ.bind(this);
        this.io = null;
      }
      connectedCallback(){ this.mq.addEventListener('change', this.onMQ); this.onMQ(this.mq); }
      disconnectedCallback(){ this.mq.removeEventListener('change', this.onMQ); this.io && this.io.disconnect(); }
      onMQ(e){
        this.buttons.forEach((b) => b.replaceWith(b.cloneNode(true)));
        this.buttons = this.querySelectorAll('.scrollable-faq__nav button');
        this.io && this.io.disconnect(); this.io = null;

        if (e.matches) {
          this.buttons.forEach((b) => b.addEventListener('click', () => this.scrollToId(b.getAttribute('data-scroll-to')), { passive: true }));
          this.io = new IntersectionObserver((entries) => {
            let activeId = null;
            entries.forEach((en) => { if (en.isIntersecting) activeId = en.target.id; });
            if (activeId) this.setActive(activeId);
          }, { rootMargin: '-50px 0px -30% 0px', threshold: 0.2 });
          this.blocks.forEach((bl) => this.io.observe(bl));
        }
      }
      scrollToId(id){
        const el = id && document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + scrollY - this.offset;
        scrollTo({ top, behavior: 'smooth' });
      }
      setActive(id){
        this.buttons.forEach((b) => b.classList.toggle(this.activeClass, b.getAttribute('data-scroll-to') === id));
      }
    }
    customElements.define('scrollable-faq', ScrollableFaq);
  }
  
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scroll-to-mobile]');
    if (!btn || window.innerWidth > 749) return;
    const id = btn.getAttribute('data-scroll-to-mobile');
    const section = id && document.getElementById(id);
    if (!section) return;
    toggleCollapsible(section, btn.querySelector('.scrollable-faq__arrow'));
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.button.globo-formbuilder-open')) document.body.style.overflow = 'hidden';
    if (e.target.closest('.header.dismiss')) document.body.style.overflow = 'auto';
  }, { passive: true });

    document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.accordion-item');
    if (!btn) return;
    const panel = btn.nextElementSibling; if (!panel) return;
    const plus  = btn.querySelector('.icon-plus');
    const minus = btn.querySelector('.icon-minus');
    const arrow = btn.querySelector('.arrow');

    const opening = !panel.classList.contains('visible');
    const panelHeight = opening ? `${panel.scrollHeight}px` : '0';
    rafBatch(() => {
      panel.classList.toggle('visible', opening);
      panel.style.height = panelHeight;
      if (plus && minus) { plus.style.display = opening ? 'none' : 'block'; minus.style.display = opening ? 'block' : 'none'; }
      if (arrow) arrow.style.transform = opening ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }, { passive: true });

  const refreshHeights = () => {
    document.querySelectorAll('.faq__item.opened .faq__item-content')
      .forEach((c) => c.style.height = `${c.scrollHeight}px`);
    document.querySelectorAll('.visible')
      .forEach((s) => { if (getComputedStyle(s).overflowY === 'hidden') s.style.height = `${s.scrollHeight}px`; });
  };
  addEventListener('resize', debounceFn(() => rafBatch(refreshHeights), 150), { passive: true });

  const pricingReferenceLink = document.querySelector('a[href="#pricing-reference"]');
  if (pricingReferenceLink) {
    pricingReferenceLink.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const container = document.getElementById('dynamic-product-content');
      const modalWrapper = document.querySelector('.modal-wrapper');
      if (!container || !modalWrapper) return;

      const temp = document.createElement('div');
      temp.innerHTML = await loadPricingReferenceHTML();
      container.innerHTML = temp.innerHTML + `
        <span class="modal-close">
          <svg aria-hidden="true" focusable="false" width="12" height="13" class="icon icon-close-small" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.48627 9.32917L2.82849 3.67098" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.88539 9.38504L8.42932 3.61524" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>`;

      modalWrapper.style.display = 'flex';
      document.documentElement.style.overflowY = 'hidden';

      const closeBtn = container.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modalWrapper.style.display = 'none';
          document.documentElement.style.overflowY = '';
        }, { once: true });
      }
    }, { passive: false });
  }

  const search = document.querySelector('.custom-header-search--input');
  const hidePopup = (p) => { if (p) p.style.display = 'none'; };
  const outsideClose = (ev) => {
    const popup = document.getElementById('ui-id-1');
    if (!popup) return;
    if (!popup.contains(ev.target) && (!search || !search.contains(ev.target))) hidePopup(popup);
  };
  document.addEventListener('click', outsideClose, true);
  if (search) {
    search.addEventListener('input', debounceFn(() => {
      const popup = document.getElementById('ui-id-1');
      if (search.value.trim()) return;
      hidePopup(popup);
      search.blur(); document.body.focus();
    }, 150));
  }

  document.addEventListener('click', (e) => {
    const thumb = e.target.closest('.video-thumbnail');
    if (!thumb) return;
    const url = thumb.getAttribute('data-video-url');
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');
    if (!url || !modal || !container) return;

    let embed;
    if (/youtube\.com|youtu\.be/.test(url)) {
      const id = (url.split(/v=|\/([^\/\?]+)$/).filter(Boolean).pop() || '').trim();
      embed = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" height="450" width="550" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
      embed = `<video controls autoplay src="${url}"></video>`;
    }
    container.innerHTML = embed;
    modal.style.display = 'flex';
  }, { passive: true });

  window.closeModal = function(){
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('modalVideoContainer');
    if (container) container.innerHTML = '';
    if (modal) modal.style.display = 'none';
  };

});

(() => {
  const mainBlocks = document.querySelectorAll('.info-grid__item.grid__item .link-style');
  const contentSections = document.querySelectorAll('.feature-block-container.content-section');
  if (!mainBlocks.length || !contentSections.length) return;

  const isMobile = () => innerWidth <= 750;

  const moveSectionsToMain = () => {
    mainBlocks.forEach((block) => {
      const id = block.getAttribute('data-target');
      const section = id && document.getElementById(id);
      if (!section) return;
      if (isMobile()) {
        if (block.previousElementSibling !== section) block.before(section);
      } else {
        const original = document.querySelector(`.container-${id}`);
        if (original && !original.contains(section)) original.appendChild(section);
      }
    });
  };

  const toggleSectionVisibility = (id) => {
    const section = id && document.getElementById(id);
    const btn = document.querySelector(`[data-target="${id}"]`);
    if (!section || !btn) return;
    const opening = !section.classList.contains('active');
    rafBatch(() => {
      section.classList.toggle('active', opening);
      section.style.maxHeight = opening ? '2500px' : '0';
      btn.classList.toggle('active', opening);
      const span = btn.querySelector('span'); if (span) span.textContent = opening ? 'Show less' : 'Learn more';
    });
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-grid__item.grid__item .link-style');
    if (!btn) return;
    const id = btn.getAttribute('data-target');
    const section = id && document.getElementById(id);
    if (!section) return;

    e.preventDefault();
    if (isMobile()) {
      toggleSectionVisibility(id);
    } else {
      section.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }
  }, { passive: false });

  moveSectionsToMain();
  addEventListener('resize', debounceFn(() => rafBatch(moveSectionsToMain), 150), { passive: true });
})();

async function loadPricingReferenceHTML() {
  const url = window.pricingReferenceHtml
  const res = await fetch(url, { cache: 'force-cache' });
  return res.text();
}

/*
 * Rubber Hex selector: near-title Purchase Type / Weight selector for product
 * pages whose picker has exactly those two options (Rubber Hex children), or a
 * single option listed in SINGLE_OPTION_FAMILIES. Reuses the existing variant
 * picker (same inputs, same navigation via
 * handleCombinedClick above) and only moves and restyles it:
 *  - moves the picker directly under the visible product title;
 *  - Sets / Singles as orange pills, Weight as compact orange-outline pills;
 *  - shows only the weights that exist for the selected Purchase Type (from the
 *    family variants map) and sorts them by weight.
 */
(function () {
  const STYLE_ID = 'rh-selector-style';
  // Finish-selector layout (snippets/finish-selector.liquid) with the Sep 28
  // turf spec: selected = orange #D12E06 with white text, unselected = white
  // with orange outline/text. Scoped and !important because the theme's own
  // pill rules load later in the page.
  const STYLES =
    'variant-selects.rh-selector.rh-selector{display:block !important;margin:0 0 20px !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset{border:0 !important;padding:0 !important;margin:0 0 12px !important;display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:10px !important;min-width:0 !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset legend{float:left !important;font-family:"Lato",sans-serif !important;font-size:14px !important;font-weight:700 !important;line-height:1 !important;color:#23232B !important;padding:0 !important;margin:0 2px 0 0 !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio]{position:absolute !important;opacity:0 !important;width:1px !important;height:1px !important;margin:0 !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio] + label{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-width:72px !important;padding:8px 16px !important;margin:0 !important;border:1px solid #D12E06 !important;border-radius:4px !important;background:#fff !important;box-shadow:none !important;font-family:"Lato",sans-serif !important;font-size:14px !important;font-weight:600 !important;letter-spacing:0 !important;line-height:1 !important;color:#D12E06 !important;text-decoration:none !important;cursor:pointer !important;text-align:center !important;transition:border-color .2s ease,color .2s ease,background .2s ease !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio] + label::before{content:none !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio] + label:hover{background:#FDEEEA !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio]:checked + label,variant-selects.rh-selector.rh-selector fieldset input[type=radio]:checked + label:hover{background:#D12E06 !important;border-color:#D12E06 !important;color:#fff !important;cursor:default !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset.rh-weight input[type=radio] + label{min-width:0 !important;padding:8px 10px !important;font-size:13px !important;}' +
    'variant-selects.rh-selector.rh-selector fieldset input[type=radio][hidden] + label,variant-selects.rh-selector.rh-selector fieldset input[type=radio] + label[hidden]{display:none !important;}' +
    'variant-selects.rh-selector.rh-selector .rh-compare-link{display:inline-block;font-family:"Lato",sans-serif;font-size:14px;font-weight:600;color:#D12E06;text-decoration:underline;margin:0 0 4px;}' +
    '@media (max-width:749px){variant-selects.rh-selector.rh-selector fieldset legend{float:none !important;width:100% !important;margin:0 0 8px !important;}variant-selects.rh-selector.rh-selector fieldset:not(.rh-weight) input[type=radio] + label{flex:1 1 auto !important;min-width:0 !important;padding:10px 12px !important;}variant-selects.rh-selector.rh-selector fieldset.rh-weight{display:grid !important;grid-template-columns:repeat(4,minmax(0,1fr)) !important;gap:8px !important;}variant-selects.rh-selector.rh-selector fieldset.rh-weight legend{grid-column:1/-1 !important;}}';

  function optionName(fieldset) {
    const legend = fieldset.querySelector('legend');
    return legend ? legend.textContent.split(':')[0].trim() : '';
  }

  function weightKey(value) {
    const nums = String(value).match(/\d+(\.\d+)?/g) || ['0'];
    return nums.map(Number);
  }

  function compareWeights(a, b) {
    const ka = weightKey(a);
    const kb = weightKey(b);
    for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
      const d = (ka[i] || 0) - (kb[i] || 0);
      if (d) return d;
    }
    return 0;
  }

  // Single-option families shown the same way (e.g. Turf Grade: V1 / V2 / V3),
  // in their existing order, with a "Compare all" link when the page has a
  // comparison table. Empty until a family is approved for it ('Turf Grade' is
  // the planned first entry).
  const SINGLE_OPTION_FAMILIES = [];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function moveUnderTitle(productInfo, selects) {
    const title = Array.from(productInfo.querySelectorAll('.product__title')).find(
      (el) => el.offsetParent !== null
    );
    if (title) title.insertAdjacentElement('afterend', selects);
  }

  function setupSingleOption(productInfo, selects, fieldset) {
    injectStyles();
    selects.classList.add('rh-selector');
    moveUnderTitle(productInfo, selects);
    const count = fieldset.querySelectorAll('input[type=radio]').length;
    // The grade comparison renders from features_specs.comparison_chart_table
    // (sections/extra-info.liquid, .comparision-chart-table).
    const table = document.querySelector('.comparision-chart-table, .product__description table, [class*="description"] table');
    if (table && count > 1) {
      if (!table.id) table.id = 'compare-grades';
      const link = document.createElement('a');
      link.href = '#' + table.id;
      link.className = 'rh-compare-link';
      link.textContent = 'Compare all ' + count + ' ' + (fieldset.querySelector('legend').textContent.split(':')[0].trim().split(' ').pop().toLowerCase() + 's');
      selects.appendChild(link);
    }
    productInfo.dataset.rhSelector = 'done';
  }

  // Pulley-template picker (snippets/product-variant-picker-pulley.liquid, the
  // French Fitness Aluminum Pulley Upgrade): same near-title placement and pill
  // look for Product Line, with the searchable Machine Model dropdown restyled
  // to match. Selection still runs through that snippet's own script.
  const PULLEY_STYLES =
    'variant-selects.rh-pulley fieldset.pulley-machine-model .pulley-searchable{flex:1 1 100% !important;}' +
    'variant-selects.rh-pulley .pulley-trigger{border:1px solid #D12E06 !important;border-radius:4px !important;padding:10px 14px !important;font-family:"Lato",sans-serif !important;font-size:14px !important;font-weight:600 !important;color:#23232B !important;}' +
    'variant-selects.rh-pulley .pulley-trigger:hover,variant-selects.rh-pulley .pulley-trigger:focus-visible,variant-selects.rh-pulley .pulley-trigger[aria-expanded="true"]{border-color:#D12E06 !important;background:#FDEEEA !important;}' +
    'variant-selects.rh-pulley .pulley-chevron{color:#D12E06 !important;}' +
    'variant-selects.rh-pulley .pulley-panel{border-color:#D12E06 !important;}' +
    'variant-selects.rh-pulley .pulley-item{font-family:"Lato",sans-serif !important;font-size:14px !important;}' +
    'variant-selects.rh-pulley .pulley-item:hover,variant-selects.rh-pulley .pulley-item:focus-visible{background:#FDEEEA !important;}' +
    'variant-selects.rh-pulley .pulley-item--selected{background:#D12E06 !important;color:#fff !important;font-weight:600 !important;}';

  function setupPulley(productInfo, selects) {
    injectStyles();
    if (!document.getElementById(STYLE_ID + '-pulley')) {
      const style = document.createElement('style');
      style.id = STYLE_ID + '-pulley';
      style.textContent = PULLEY_STYLES;
      document.head.appendChild(style);
    }
    selects.classList.add('rh-selector', 'rh-pulley');
    moveUnderTitle(productInfo, selects);
    productInfo.dataset.rhSelector = 'done';
  }

  function setup(productInfo) {
    if (productInfo.dataset.rhSelector === 'done') return;
    const selects = productInfo.querySelector('variant-selects');
    if (!selects) return;
    if (selects.querySelector('fieldset.pulley-product-line')) {
      setupPulley(productInfo, selects);
      return;
    }
    const fieldsets = Array.from(selects.querySelectorAll('fieldset[data-variant-options]'));
    const names = fieldsets.map(optionName);
    if (fieldsets.length === 1 && SINGLE_OPTION_FAMILIES.indexOf(names[0]) !== -1) {
      setupSingleOption(productInfo, selects, fieldsets[0]);
      return;
    }
    const pIndex = names.indexOf('Purchase Type');
    const wIndex = names.indexOf('Weight');
    if (fieldsets.length !== 2 || pIndex === -1 || wIndex === -1) return;

    // Family variants map when the page emits one; otherwise fall back to the
    // picker's own availability flag (combinations that don't exist render as
    // unavailable).
    let variantsMap = null;
    try {
      variantsMap = JSON.parse(productInfo.querySelector('script[data-product-variants-map]').textContent);
    } catch (_) {
      variantsMap = null;
    }
    const purchaseFieldset = fieldsets[pIndex];
    const weightFieldset = fieldsets[wIndex];
    const checkedPurchase = purchaseFieldset.querySelector('input[type=radio]:checked');
    if (!checkedPurchase) return;

    const pKey = 'o' + (pIndex + 1);
    const wKey = 'o' + (wIndex + 1);
    const weights = Array.isArray(variantsMap)
      ? new Set(variantsMap.filter((v) => v[pKey] === checkedPurchase.value).map((v) => v[wKey]))
      : null;

    const pairs = Array.from(weightFieldset.querySelectorAll('input[type=radio]')).map((input) => ({
      input,
      label: weightFieldset.querySelector('label[for="' + CSS.escape(input.id) + '"]'),
    }));
    pairs.sort((a, b) => compareWeights(a.input.value, b.input.value));
    pairs.forEach(({ input, label }) => {
      const exists = weights ? weights.has(input.value) : !input.classList.contains('disabled');
      input.hidden = !exists;
      weightFieldset.appendChild(input);
      if (label) {
        label.hidden = !exists;
        weightFieldset.appendChild(label);
      }
    });

    injectStyles();
    weightFieldset.classList.add('rh-weight');
    selects.classList.add('rh-selector');
    moveUnderTitle(productInfo, selects);
    productInfo.dataset.rhSelector = 'done';
  }

  function run() {
    document
      .querySelectorAll('product-info')
      .forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
