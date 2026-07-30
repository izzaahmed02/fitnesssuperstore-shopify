/*
 * Cable Attachments bundle selector (NON-Avis) — data-driven.
 *
 * All set/product data comes from the `data-cable-config` JSON emitted by
 * snippets/cable-attachment-bundle.liquid (sourced from the
 * custom.cable_attachment_sets metaobjects). Nothing is hardcoded here.
 *
 * Responsibilities:
 *   1. Selection -> writes the native product-options contract that
 *      assets/product-form-with-options.js reads (the [data-selected-options]
 *      holder value + the checked hidden radio) and dispatches
 *      'cable-bundle:change' so the price ("Total with Options") recomputes.
 *   2. "See What's Included" modal, rendered from the config (image, title,
 *      description, Judge.me badge, and included-product cards).
 *   3. Dropdown scroll-into-view on open + mobile Slick carousel for the grid.
 */
(function () {
  'use strict';

  function money(cents) {
    if (cents == null || cents === '') return '';
    return '$' + (Number(cents) / 100).toFixed(2) + ' USD';
  }

  // Judge.me preview badges are stored pre-rendered but hidden by an inline
  // style until Judge.me's JS reveals them; strip that so they show here.
  function badgeHTML(raw) {
    if (!raw) return '';
    var html = raw.replace(/style\s*=\s*(['"])\s*display:\s*none;?\s*\1/gi, '');
    return '<div class="jdgm-widget jdgm-preview-badge">' + html + '</div>';
  }

  function initBundleSelector() {
    var container = document.querySelector('.bundle-selector-container');
    if (!container) return;

    var config = { sets: [] };
    try {
      var cfgEl = document.querySelector('[data-cable-config]');
      if (cfgEl) config = JSON.parse(cfgEl.textContent);
    } catch (e) {
      console.warn('[Bundle Selector] Could not parse config:', e);
    }
    var bySet = {};
    (config.sets || []).forEach(function (s) { bySet[s.key] = s; });

    // ── Slick carousel (all screen sizes) ─────────────────
    // Must run after the modal is visible so Slick can measure widths.
    function initProductsCarousel(grid) {
      if (typeof window.$ === 'undefined' || !window.$.fn || !window.$.fn.slick) return;
      var $grid = window.$(grid);
      if ($grid.hasClass('slick-initialized')) $grid.slick('unslick');
      $grid.slick({
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        dots: true,
        infinite: false,
        responsive: [
          { breakpoint: 990, settings: { slidesToShow: 2 } },
          { breakpoint: 749, settings: { slidesToShow: 1 } }
        ]
      });
    }

    // ── Selection -> native contract ──────────────────────
    var holder = document.querySelector('[data-cable-bundle] [data-selected-options]');
    var cards = Array.prototype.slice.call(container.querySelectorAll('.bundle-card'));
    var selected = null;

    function applySelection(setKey) {
      var holderVal = '';
      document.querySelectorAll('[data-cable-bundle] input[name="Cable Attachments"]').forEach(function (r) {
        var on = setKey ? r.dataset.bundleSet === setKey : r.hasAttribute('data-cable-none');
        r.checked = on;
        if (on && !r.hasAttribute('data-cable-none')) holderVal = r.value;
      });
      if (holder) holder.dataset.selectedOptions = holderVal;
      cards.forEach(function (c) { c.classList.toggle('is-selected', c.dataset.bundleSet === setKey); });
      // Recompute the "Total with Options" price.
      document.dispatchEvent(new Event('cable-bundle:change'));
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.bundle-card__link')) return; // let the modal button through
        var set = card.dataset.bundleSet;
        if (selected === set) { selected = null; applySelection(''); }
        else { selected = set; applySelection(set); }
      });
    });
    applySelection(''); // default: "No thanks"

    // ── "See What's Included" modal ───────────────────────
    var modal = document.getElementById('bundle-modal');
    if (modal && modal.parentElement !== document.body) document.body.appendChild(modal);

    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';

      function openModal(setKey) {
        var s = bySet[setKey];
        if (!s) return;
        var img = modal.querySelector('#bundle-main-image');
        if (img) { img.src = s.image || ''; img.alt = s.title || ''; }
        var title = modal.querySelector('#bundle-main-title');
        if (title) title.textContent = s.title || '';
        var rating = modal.querySelector('#bundle-main-rating');
        if (rating) rating.innerHTML = badgeHTML(s.badge);
        var desc = modal.querySelector('#bundle-main-description');
        if (desc) desc.innerHTML = s.description || '';

        var grid = modal.querySelector('#bundle-products-grid');
        if (grid) {
          if (typeof window.$ !== 'undefined' && window.$.fn && window.$.fn.slick && window.$(grid).hasClass('slick-initialized')) {
            window.$(grid).slick('unslick');
          }
          grid.innerHTML = '';
          (s.included || []).forEach(function (ip) {
            var card = document.createElement('div');
            card.className = 'bundle-product-card';
            card.innerHTML =
              '<div class="bundle-product-card__image">' +
                '<img src="' + (ip.image || '') + '" alt="" width="120" height="120" loading="lazy">' +
              '</div>' +
              '<div class="bundle-product-card__info">' +
                '<div class="bundle-product-card__sku">SKU: ' + (ip.sku || '') + '</div>' +
                '<h5 class="bundle-product-card__title"></h5>' +
                '<div class="bundle-product-card__rating">' + badgeHTML(ip.badge) + '</div>' +
                '<div class="bundle-product-card__price"><span class="price-current">' + money(ip.price) + '</span></div>' +
              '</div>';
            card.querySelector('.bundle-product-card__title').textContent = ip.title || '';
            grid.appendChild(card);
          });
        }

        modal.hidden = false;
        modal.style.display = 'flex';
        // Init the carousel after the modal is visible so Slick can measure widths.
        if (grid) requestAnimationFrame(function () { initProductsCarousel(grid); });
        document.body.classList.add('bundle-modal-open');
        document.body.style.overflow = 'hidden';
      }

      function closeModal() {
        var grid = modal.querySelector('#bundle-products-grid');
        if (grid && typeof window.$ !== 'undefined' && window.$.fn && window.$.fn.slick && window.$(grid).hasClass('slick-initialized')) {
          window.$(grid).slick('unslick');
        }
        modal.hidden = true;
        modal.style.display = 'none';
        document.body.classList.remove('bundle-modal-open');
        document.body.style.overflow = '';
      }

      container.querySelectorAll('.bundle-card__link').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openModal(link.getAttribute('data-bundle-set'));
        });
      });

      var closeBtn = modal.querySelector('.bundle-modal__close');
      if (closeBtn) closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeModal(); });
      var backdrop = modal.querySelector('.bundle-modal__backdrop');
      if (backdrop) backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
    }

    // ── Scroll the section into view when the dropdown opens ─
    var dropdown = document.querySelector('.bundle-selector-dropdown');
    if (dropdown) {
      dropdown.addEventListener('toggle', function () {
        if (!dropdown.open) return;
        requestAnimationFrame(function () {
          var top = dropdown.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBundleSelector);
  } else {
    initBundleSelector();
  }
})();
