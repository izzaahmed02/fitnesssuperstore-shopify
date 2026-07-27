/* pdp-new.js — add-ons carousel + rating scroll for main-product-new.
   Gallery (incl. lens zoom) is the reused live-PDP <product-gallery>
   (product-gallery.js / product-mobile-gallery.js). Sticky buy-box column is
   the reused product-sticky.js. Tab switching is the global custom.js
   [data-tabs-section] handler. Deferred, dependency-free. */

(function () {
  'use strict';

  function updateArrowState(track, prev, next) {
    var max = track.scrollWidth - track.clientWidth - 1;
    if (prev) prev.hidden = track.scrollLeft <= 0;
    if (next) next.hidden = track.scrollLeft >= max;
  }

  function bindArrows(track, prev, next, step) {
    if (!track) return;
    if (prev) {
      prev.addEventListener('click', function () {
        track.scrollBy({ left: -step, behavior: 'smooth' });
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        track.scrollBy({ left: step, behavior: 'smooth' });
      });
    }
    track.addEventListener('scroll', function () {
      updateArrowState(track, prev, next);
    }, { passive: true });
    updateArrowState(track, prev, next);
  }

  /* ---- Generic horizontal carousel (add-ons) ---- */
  if (!customElements.get('pdp-carousel')) {
    customElements.define(
      'pdp-carousel',
      class PdpCarousel extends HTMLElement {
        connectedCallback() {
          bindArrows(
            this.querySelector('.pdp-new__addon-track'),
            this.querySelector('.pdp-new__carousel-arrow--prev'),
            this.querySelector('.pdp-new__carousel-arrow--next'),
            424
          );
        }
      }
    );
  }

  /* ---- Add-on attach: card buttons toggle the hidden option checkboxes that
     product-form-with-options.js reads at add-to-cart, so selected add-ons are
     attached to the order (line item properties + _functionOperation) instead of
     being added as separate cart lines. Price aggregation mirrors priceHelper()
     in product-custom-options.js. ---- */
  function refreshAddonPrice(scope) {
    var priceEls = document.querySelectorAll('.pr_custom_price');
    if (priceEls.length === 0) return;
    var base = Number(String(priceEls[0].dataset.priceValue || '').replace(/,/g, '')) || 0;
    var adjustment = 0;
    scope.querySelectorAll('[data-customization-option]:checked').forEach(function (input) {
      if (input.value.includes(':::')) adjustment += Number(input.value.split(':::')[1]) || 0;
    });
    var formatted = (base + adjustment).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    var text = (priceEls[0].dataset.currency || '$') + formatted;
    priceEls.forEach(function (el) {
      el.innerText = text;
    });
    var stickyPrice = document.querySelector('.pdp-new__sticky-price');
    if (stickyPrice) stickyPrice.innerText = text;
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-addon-attach]');
    if (!button) return;
    var scope = button.closest('product-info') || document;
    var input = scope.querySelector('[data-customization-option="' + button.dataset.variantId + '"]');
    if (!input) return;
    input.checked = !input.checked;
    var accordion = input.closest('[data-option-accordion]');
    var handler = accordion && accordion.querySelector('[data-selected-options]');
    if (handler) {
      var values = [];
      accordion.querySelectorAll('[data-customization-option]:checked').forEach(function (checked) {
        values.push(checked.value);
      });
      handler.dataset.selectedOptions = values.join(',');
    }
    button.classList.toggle('is-added', input.checked);
    var label = button.querySelector('span');
    if (label) label.textContent = input.checked ? 'Added ✓' : 'Add To Cart';
    refreshAddonPrice(scope);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.pdp-new');
    if (!root) return;

    /* Publish the info column's geometry for the zoom panel (see pdp-new.css).
       The panel is fixed, so it can only be placed against the viewport, but
       the page container is not a fixed inset from it — .inner-container picks
       up its own gutter below 1280px, and the scrollbar shifts things again.
       Measuring the column it must cover is exact at every width and survives
       future container changes. */
    var syncZoomGeometry = function () {
      var info = root.querySelector('.pdp-new__info');
      if (!info) return;
      var r = info.getBoundingClientRect();
      var style = document.documentElement.style;
      style.setProperty('--pdp-info-w', Math.round(r.width) + 'px');
      style.setProperty('--pdp-info-right', Math.round(window.innerWidth - r.right) + 'px');
    };
    syncZoomGeometry();
    window.addEventListener('resize', syncZoomGeometry, { passive: true });

    /* ---- Buy-box spec lists: bold the label before the first colon ----
       The Key Specs tab is a raw rich-text metafield — a flat <ul> of
       "Label: value" lines with no emphasis. CSS gives each row a divider;
       this wraps the label so it reads like the Delivery & Warranty tab.
       Defensive: only the leading text node, only an early colon, and never
       touches a row that already has its own markup. */
    root.querySelectorAll('.pdp-new__tabs .metafield-rich_text_field li').forEach(function (li) {
      if (li.querySelector('strong, b')) return; // already emphasised
      var node = li.firstChild;
      if (!node || node.nodeType !== 3) return; // must start with text
      var text = node.nodeValue;
      var idx = text.indexOf(':');
      if (idx < 1 || idx > 48) return; // early "Label:" only, not mid-sentence
      var strong = document.createElement('strong');
      strong.textContent = text.slice(0, idx + 1);
      var rest = document.createTextNode(text.slice(idx + 1));
      li.replaceChild(rest, node);
      li.insertBefore(strong, rest);
    });

    /* ---- Sticky ATC bar: show once the real Add to Cart button scrolls away ----
       Watches the submit button, not .pdp-new__buybox. The buy box is ~1600px
       tall on mobile (gallery stacked above the info column), so observing it
       left a long dead zone: the actual ATC button had scrolled off but the
       bar did not appear until the whole block cleared the viewport.

       Recomputed from the button's live rect on scroll/resize (rAF-throttled),
       not from IntersectionObserver alone: the observer only fires on threshold
       crossings, so an instant scroll jump or a layout shift (the mobile slick
       gallery lazy-loads images) can leave it stale. The observer is kept as a
       cheap extra trigger for non-scroll layout changes. */
    var sticky = root.querySelector('.pdp-new__sticky');
    var atcAnchor = root.querySelector('.product-form__submit') || root.querySelector('.pdp-new__buybox');
    if (sticky && atcAnchor) {
      var updateSticky = function () {
        var r = atcAnchor.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        /* On screen (accounting for the 80px the observer's rootMargin trimmed)
           OR still below the fold (top > 0) → hide. Show only once the button
           has scrolled up past the top — the bar is a fallback for a button
           already passed, not a preview of one. */
        var onScreen = r.bottom > 0 && r.top < vh - 80;
        sticky.hidden = onScreen || r.top > 0;
      };
      updateSticky();
      var stickyTicking = false;
      var onStickyScroll = function () {
        if (stickyTicking) return;
        stickyTicking = true;
        requestAnimationFrame(function () {
          updateSticky();
          stickyTicking = false;
        });
      };
      window.addEventListener('scroll', onStickyScroll, { passive: true });
      window.addEventListener('resize', onStickyScroll, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(updateSticky, { rootMargin: '0px 0px -80px 0px' }).observe(atcAnchor);
      }

      /* The Gorgias launcher is fixed bottom-right and lands on the bar's Add
         to Cart button. Rather than move a third-party widget onto whatever
         sits above it, the bar reserves a gap on its right so the launcher
         floats over empty space. Flagged via a class so the gap only exists
         when the widget actually loaded. */
      var chatPolls = 0;
      var chatTimer = setInterval(function () {
        if (document.getElementById('chat-button')) {
          document.body.classList.add('pdp-new-has-chat');
          clearInterval(chatTimer);
        } else if (++chatPolls > 20) {
          clearInterval(chatTimer);
        }
      }, 500);
    }

    /* ---- Mobile content accordions (<=989px) ----
       The lower content is one DOM: tabs on desktop, a collapsible list on
       mobile. Kept here rather than in the shared custom.js .dropdown-btn
       handler because that one is hard-gated to <=749px and allows several
       panels open at once; this group is exclusive and uses the PDP's own
       990px desktop boundary. Rows start collapsed on mobile (CSS), matching
       the theme's existing .dropdown-content-wrapper behaviour; the content
       stays in the DOM either way. */
    var accGroup = root.querySelector('[data-pdp-accordions]');
    if (accGroup) {
      var mobileMQ = window.matchMedia('(max-width: 989px)');

      var panelOf = function (btn) {
        return btn.parentElement.querySelector('.pdp-new__acc-panel');
      };

      var setOpen = function (btn, open) {
        var panel = panelOf(btn);
        if (!panel) return;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.classList.toggle('is-open', open);
        if (open) {
          panel.style.height = panel.scrollHeight + 'px';
        } else {
          /* From auto -> fixed px so the transition has a start value. */
          panel.style.height = panel.scrollHeight + 'px';
          void panel.offsetHeight;
          panel.style.height = '0px';
        }
      };

      /* Once open, drop to height:auto so late reflows (images, embeds,
         Affirm/JSON-LD injection) don't get clipped by a stale pixel height. */
      accGroup.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'height') return;
        var panel = e.target;
        if (panel.classList && panel.classList.contains('is-open')) {
          panel.style.height = 'auto';
        }
      });

      accGroup.addEventListener('click', function (e) {
        var btn = e.target.closest('.pdp-new__acc-btn');
        if (!btn || !mobileMQ.matches) return;

        var willOpen = btn.getAttribute('aria-expanded') !== 'true';

        /* One at a time: close every other open row in this group. */
        var closedAny = false;
        accGroup.querySelectorAll('.pdp-new__acc-btn[aria-expanded="true"]').forEach(function (other) {
          if (other !== btn) {
            setOpen(other, false);
            closedAny = true;
          }
        });

        setOpen(btn, willOpen);

        /* Closing a tall row above shifts the page — bring the header the
           user just tapped to the top so they stay oriented. Offset by the
           sticky site header, otherwise the row lands underneath it.
           Measured AFTER the collapse animation: measuring during it reads
           the outgoing layout and overshoots by the closing row's height. */
        if (willOpen) {
          var scrollToBtn = function () {
            var header = document.querySelector('.section-header');
            var offset = header ? header.getBoundingClientRect().height : 0;
            var top = window.pageYOffset + btn.getBoundingClientRect().top - offset - 8;
            window.scrollTo({ top: top > 0 ? top : 0, behavior: 'smooth' });
          };
          if (closedAny) setTimeout(scrollToBtn, 330); /* matches the 0.3s height transition */
          else requestAnimationFrame(scrollToBtn);
        }
      });

      /* Crossing the breakpoint: hand control back to the tab CSS, clearing
         any inline height left behind by the accordion. */
      var syncToBreakpoint = function () {
        if (mobileMQ.matches) return;
        accGroup.querySelectorAll('.pdp-new__acc-panel').forEach(function (panel) {
          panel.style.height = '';
          panel.classList.remove('is-open');
        });
        accGroup.querySelectorAll('.pdp-new__acc-btn').forEach(function (btn) {
          btn.setAttribute('aria-expanded', 'false');
        });
      };
      if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', syncToBreakpoint);
      else if (mobileMQ.addListener) mobileMQ.addListener(syncToBreakpoint);
    }

    /* ---- Mobile gallery thumbnails: drive the swipe (slick) carousel ----
       The mobile gallery keeps its swipeable behaviour (product-mobile-gallery.js
       inits slick on .mobile-gallery-slider); this only adds a thumbnail strip
       beneath it. Tapping a thumb calls slickGoTo; the carousel's afterChange
       highlights the matching thumb. Matched by data-media-id so it survives any
       slide filtering. slick may init after this runs (or re-init across the
       breakpoint), so we poll for slick-initialized before binding. */
    var mgThumbs = root.querySelector('[data-mobile-thumbs]');
    var mgEl = root.querySelector('mobile-gallery');
    var jq = window.jQuery;
    if (mgThumbs && mgEl && jq) {
      var mgSlider = mgEl.querySelector('.mobile-gallery-slider');
      var thumbEls = Array.prototype.slice.call(mgThumbs.querySelectorAll('[data-mobile-thumb]'));

      var realSlides = function () {
        return mgSlider.querySelectorAll('.mobile-gallery-slide[data-media-id]');
      };
      var slideIndexForId = function (id) {
        var s = realSlides();
        for (var i = 0; i < s.length; i++) {
          if (s[i].getAttribute('data-media-id') === id) return i;
        }
        return -1;
      };
      var activateById = function (id) {
        thumbEls.forEach(function (t) {
          var on = t.getAttribute('data-media-id') === id;
          t.classList.toggle('is-active', on);
          if (on) {
            /* Keep the active thumb visible by scrolling the STRIP horizontally
               only — never scrollIntoView, which would also scroll the page
               vertically and disturb the sticky-ATC observer. */
            var delta = t.getBoundingClientRect().left - mgThumbs.getBoundingClientRect().left;
            mgThumbs.scrollLeft += delta - (mgThumbs.clientWidth - t.offsetWidth) / 2;
          }
        });
      };

      mgThumbs.addEventListener('click', function (e) {
        var thumb = e.target.closest('[data-mobile-thumb]');
        if (!thumb || !jq(mgSlider).hasClass('slick-initialized')) return;
        var idx = slideIndexForId(thumb.getAttribute('data-media-id'));
        if (idx >= 0) jq(mgSlider).slick('slickGoTo', idx);
      });

      var bound = false;
      var wire = function () {
        if (bound || !jq(mgSlider).hasClass('slick-initialized')) return false;
        bound = true;
        jq(mgSlider).on('afterChange.pdpNewThumbs', function (ev, slick, current) {
          var slide = realSlides()[current];
          if (slide) activateById(slide.getAttribute('data-media-id'));
        });
        var cur = realSlides()[jq(mgSlider).slick('slickCurrentSlide') || 0];
        if (cur) activateById(cur.getAttribute('data-media-id'));
        return true;
      };
      if (!wire()) {
        var tries = 0;
        var poll = setInterval(function () {
          if (wire() || ++tries > 40) clearInterval(poll);
        }, 150);
      }
    }

    /* ---- Rating link: scroll to the reviews widget (Judge.me) ---- */
    var ratingLink = root.querySelector('.pdp-new__rating');
    if (ratingLink) {
      ratingLink.addEventListener('click', function (e) {
        var widget =
          document.querySelector('.jdgm-rev-widg') ||
          document.querySelector('[id^="shopify-section"][id*="reviews"]');
        if (widget) {
          e.preventDefault();
          widget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });
})();
