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

  /* ---- Add-on cards <-> the real configurator ----
     The cards are an alternate VIEW of option groups that the live configurator
     (snippets/product-options.liquid) already renders inside
     #Product-Options-<sectionId>. A card click resolves its variant id to the
     real [data-customization-option] input and clicks THAT, so
     product-custom-options.js runs its own sibling-uncheck, mandatory-reset,
     multichoice-limit, conditional-visibility and price logic. We deliberately do
     not set .checked or write [data-selected-options] here: duplicating that
     bookkeeping is what let the card path drift from the live behaviour (and,
     with its own price writer, fight priceHelper() over .pr_custom_price).
     priceHelper() is now the only thing that writes prices. ---- */

  /* The headline price element. Its TEXT is the grand total (priceHelper keeps it
     in step with option selections); its data-price-value attribute is never
     rewritten, so that stays the variant's own price. */
  function headlinePriceEl(root) {
    return (root || document).querySelector('.pdp-new__price .pr_custom_price');
  }

  function optionsRoot(scope) {
    return (scope || document).querySelector('[id^="Product-Options-"]');
  }

  function inputForCard(button, scope) {
    var root = optionsRoot(scope);
    if (!root) return null;
    return root.querySelector('[data-customization-option="' + button.dataset.variantId + '"]');
  }

  /* A card must never select an option the configurator itself is withholding —
     a conditional group whose rules the current selections don't unlock.
     product-custom-options.js expresses exactly that by setting an inline
     display:none on the [data-conditions-to-render] element, so test for that
     specifically. A general "any hidden ancestor" test would also match the
     groups we hide because they are shown as cards, which is precisely the set
     of inputs a card click is supposed to reach. */
  function isWithheld(input) {
    var conditional = input.closest('[data-conditions-to-render]');
    return !!conditional && conditional.style.display === 'none';
  }

  /* Most option groups are radios, so re-clicking a checked input does nothing.
     A card labelled "Selected" has to be un-selectable, or the customer can
     never back out of a priced accessory. The configurator already ships the
     correct removal path: every selected option renders a badge whose
     .close-option button clears the value, re-syncs conditional groups and
     re-runs the price math. Click that instead of hand-rolling the teardown. */
  function deselectOption(input, scope) {
    var root = optionsRoot(scope);
    if (!root) return false;
    var badge = root.querySelector('[data-option-id="' + input.dataset.customizationOption + '"]');
    var remove = badge && badge.querySelector('.close-option');
    if (!remove) return false;
    /* The "x" is an <svg>, which has no .click() helper — dispatch a real
       bubbling click so both the badge's own listener and the delegated
       mandatory-reset handler see it. */
    remove.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }

  /* These cards attach a configuration choice to THIS order — they never create
     a separate cart line — so they read "Add option" / "Selected", not
     "Add to Cart". Sold-out cards keep their server-rendered label. */
  function setCardState(button, checked) {
    button.classList.toggle('is-added', checked);
    button.setAttribute('aria-pressed', checked ? 'true' : 'false');
    if (button.disabled) return;
    var label = button.querySelector('span');
    if (label) label.textContent = checked ? 'Selected' : 'Add option';
  }

  /* Cards must reflect the configurator, not their own memory: selections can
     change from the accordion side, be reverted by a multichoice limit, or be
     wiped when the options wrapper is re-rendered on variant change. */
  function syncAddonButtons(scope) {
    var root = scope || document;
    root.querySelectorAll('[data-addon-attach]').forEach(function (button) {
      var input = inputForCard(button, scope);
      setCardState(button, !!(input && input.checked));
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-addon-attach]');
    if (!button) return;
    var scope = button.closest('product-info') || document;
    var input = inputForCard(button, scope);
    if (!input) return;

    if (isWithheld(input)) {
      var root = optionsRoot(scope);
      if (root) root.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (input.checked) {
      /* Checkboxes untoggle themselves; radios need the badge-removal path. */
      if (input.type === 'radio') deselectOption(input, scope);
      else input.click();
    } else {
      /* click(), not .checked = — a real click is what makes
         product-custom-options.js run its selection + price logic. */
      input.click();
    }
    /* Read back: the component may have reverted or altered the selection. */
    setCardState(button, input.checked);
  });

  /* Accordion-side changes (and sibling-unchecks the component performs) bubble
     out of the options wrapper. */
  document.addEventListener('change', function (event) {
    if (!event.target.closest || !event.target.closest('[id^="Product-Options-"]')) return;
    var scope = event.target.closest('product-info') || document;
    syncAddonButtons(scope);
    syncOptionGroupSelect(scope, false);
    /* No syncFinancing() here on purpose: the quote tracks the headline variant
       price, which option selections no longer change. */
  });

  /* Groups that also appear as Figma cards are hidden in the configurator so the
     buy box doesn't show the same accessories twice. This is presentation only —
     the inputs stay in the DOM, fully live and readable by
     product-form-with-options.js. Nothing is filtered out of the render, so a
     card that fails to resolve leaves its group visible rather than unbuyable. */
  function hideCardCoveredGroups(scope) {
    var root = scope || document;
    root.querySelectorAll('[data-addon-attach]').forEach(function (button) {
      var input = inputForCard(button, scope);
      var group = input && input.closest('.product-option__item');
      if (group) group.classList.add('pdp-new--card-covered');
    });
  }

  /* ---- Variant-change synchronisation ----
     product-info.js re-fetches the whole section and swaps a fixed list of ids
     (price, Product-Options, stock badges, …), then publishes variantChange with
     the parsed document. Regions this template adds are not on that list, so they
     would keep showing the previous variant's data: add-on cards and option help
     popups are built from the VARIANT-level options metafield, and the sticky bar
     carries its own copy of the price and availability. We re-render them from the
     same fetched HTML, using the same id-swap convention, so nothing survives from
     the prior selection. */
  function swapById(fetched, name, sectionId) {
    var source = fetched.getElementById(name + '-' + sectionId);
    var target = document.getElementById(name + '-' + sectionId);
    if (source && target) target.innerHTML = source.innerHTML;
  }

  /* Availability. product-info.js would normally push the new variant's
     sold-out/disabled state onto the submit button, but its `productForm` getter
     is `querySelector('product-form')`, which does not match the
     <product-form-with-options> tag this template renders — so the call is a
     no-op here and the button keeps the previous variant's state. Apply it from
     the same source product-info.js reads: the fetched section's own submit
     button, falling back to the variant payload. */
  function syncAvailability(root, fetched, sectionId, variant) {
    var submit = root.querySelector('.product-form__submit');
    if (!submit) return;

    var disabled;
    var label;
    var fetchedButton = fetched && sectionId && fetched.getElementById('ProductSubmitButton-' + sectionId);
    if (fetchedButton) {
      disabled = fetchedButton.hasAttribute('disabled');
      label = (fetchedButton.querySelector('span') || {}).textContent;
    } else if (variant) {
      disabled = !variant.available;
    } else {
      return;
    }

    submit.disabled = disabled;
    var submitLabel = submit.querySelector('span');
    if (submitLabel && label) submitLabel.textContent = label.trim();
  }

  /* Affirm's promo element is seeded with {{ product.price }} — the cheapest
     variant's price, not the selected one — and nothing ever updates it:
     main-product-custom.js refreshes Afterpay's <square-placement> amount on
     variantChange but leaves .affirm-as-low-as alone. On a multi-variant product
     that means financing is quoted against the wrong price. Point it at the
     headline variant price so it follows a variant change.

     Deliberately the variant price, not the configured total: the quote is
     labelled "(options at checkout)", and a monthly figure that moved while the
     headline price stayed put would contradict itself. Scoped to this template;
     the shared files are untouched. */
  function syncFinancing(root) {
    var affirm = root.querySelector('.affirm-as-low-as');
    var price = headlinePriceEl(root);
    if (!affirm || !price) return;
    /* data-price-value, not innerText: the quote is labelled "(options at
       checkout)", so it tracks the variant price. priceHelper rewrites the text
       with the grand total but never touches this attribute. */
    var amount = Math.round(parseFloat(String(price.dataset.priceValue || '').replace(/[^0-9.]/g, '')) * 100);
    if (amount > 0) affirm.dataset.amount = String(amount);
  }

  /* ---- Figma "Delivery & Installation Options" dropdown <-> the real group ----
     Same contract as the add-on cards: the select is a VIEW of an option group the
     configurator already renders, never a second control. It is built from the
     rendered inputs rather than from theme settings, so it can only ever offer
     what the configurator would accept for this product and variant, with the
     same prices. ---- */

  function optionGroupFor(scope, match) {
    var options = optionsRoot(scope);
    var needle = String(match || '').trim().toLowerCase();
    if (!options || !needle) return null;
    var groups = options.querySelectorAll('[data-option-accordion]');
    for (var i = 0; i < groups.length; i++) {
      var input = groups[i].querySelector('[data-customization-option]');
      if (input && (input.name || '').toLowerCase().indexOf(needle) !== -1) return groups[i];
    }
    return null;
  }

  function optionLabel(input) {
    var name = input.dataset.fieldName || '';
    var price = input.dataset.fieldPrice || '';
    /* Free choices show no price, matching the configurator's own rows. */
    if (price && parseFloat(price.replace(/[^0-9.]/g, '')) > 0) return name + ' — ' + price;
    return name;
  }

  function syncOptionGroupSelect(root, rebuild) {
    var view = root.querySelector('[data-option-group-view]');
    if (!view) return;
    var select = view.querySelector('[data-option-group-select]');
    var group = optionGroupFor(root, view.dataset.optionGroupView);
    var inputs = group ? group.querySelectorAll('[data-customization-option]') : [];
    /* No matching group for this product: stay hidden rather than showing a
       control that submits nothing. */
    if (!select || !inputs.length) {
      view.hidden = true;
      return;
    }

    if (rebuild) {
      select.textContent = '';
      inputs.forEach(function (input) {
        var option = document.createElement('option');
        option.value = input.dataset.customizationOption;
        /* textContent, not innerHTML: these names come from merchant metafields. */
        option.textContent = optionLabel(input);
        option.disabled = input.disabled;
        select.appendChild(option);
      });
      /* The group is now represented by this select, so don't show it twice. */
      var item = group.closest('.product-option__item');
      if (item) item.classList.add('pdp-new--card-covered');
    }

    var checked = group.querySelector('[data-customization-option]:checked');
    if (checked) select.value = checked.dataset.customizationOption;
    view.hidden = false;
  }

  document.addEventListener('change', function (event) {
    var select = event.target.closest && event.target.closest('[data-option-group-select]');
    if (!select) return;
    var scope = select.closest('product-info') || document;
    var options = optionsRoot(scope);
    var input = options && options.querySelector('[data-customization-option="' + select.value + '"]');
    /* Click the real radio: the configurator owns the price, the badge and the
       order data, exactly as if the customer had used the accordion. */
    if (input && !input.checked) input.click();
  });

  /* The sticky bar mirrors the buy box rather than being swapped: the buy-box
     price is already updated (by product-info.js on variant change, and by
     priceHelper() on option selection), so mirroring it keeps the two in step in
     both cases and cannot drift. */
  function syncStickyToBuyBox(root) {
    /* The sticky bar shows the same grand total as the headline. It also carries
       .pr_custom_price, so priceHelper writes it too; mirroring covers the paths
       priceHelper doesn't run on (initial load, variant change). */
    var source = headlinePriceEl(root);
    var sticky = root.querySelector('.pdp-new__sticky-price');
    if (source && sticky) {
      sticky.innerText = source.innerText;
      /* Keep the sticky's own base in step too, so it never seeds a stale price. */
      if (source.dataset.priceValue) sticky.dataset.priceValue = source.dataset.priceValue;
    }
    var submit = root.querySelector('.product-form__submit');
    var stickyAtc = root.querySelector('.pdp-new__sticky-atc');
    if (submit && stickyAtc) {
      stickyAtc.disabled = submit.disabled;
      var stickyLabel = stickyAtc.querySelector('span') || stickyAtc;
      var submitLabel = submit.querySelector('span');
      if (submitLabel) stickyLabel.textContent = submitLabel.textContent.trim();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.pdp-new');
    if (!root) return;

    var sectionId = root.dataset.section;

    hideCardCoveredGroups(root);
    syncAddonButtons(root);
    syncOptionGroupSelect(root, true);
    syncStickyToBuyBox(root);
    syncFinancing(root);

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
        var data = (event && event.data) || {};
        var fetched = data.html;
        /* Defer a frame: product-custom-options.js swaps #Product-Options in its
           own handler, and the replacement element only initialises (resetting
           selections and recomputing the price) once it is parsed in. */
        requestAnimationFrame(function () {
          if (fetched && sectionId) {
            swapById(fetched, 'PdpNewAddons', sectionId);
            swapById(fetched, 'PdpNewBadge', sectionId);
            swapById(fetched, 'PdpNewOptionPopups', sectionId);
            /* Sits outside the #price- element product-info.js swaps, so it would
               otherwise keep the previous variant's options total. */
            swapById(fetched, 'Options-Added', sectionId);
            /* Holds data-price-value, the base priceHelper() adds option prices
               to — a stale one would mis-total every later selection. */
            swapById(fetched, 'PdpNewConfigTotal', sectionId);
          }
          syncAvailability(root, fetched, sectionId, data.variant);
          /* Cards were just re-rendered: re-derive their state from the new
             configurator inputs rather than trusting the fresh markup's labels. */
          hideCardCoveredGroups(root);
          syncAddonButtons(root);
          syncOptionGroupSelect(root, true);
                syncStickyToBuyBox(root);
          syncFinancing(root);
        });
      });
    }

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
