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