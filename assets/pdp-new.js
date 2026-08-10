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

    /* A track inside a non-active tab panel measures 0x0 and would look
       un-scrollable forever. Resize covers both the tab becoming visible and the
       viewport changing how many cards fit. */
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () {
        updateArrowState(track, prev, next);
      }).observe(track);
    }

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

  /* ---- Add-on cards = TRUE linked-product upsells ----
     Each card is its own Shopify product/variant. Clicking one POSTs that variant
     id to /cart/add.js, creating a SEPARATE cart line, then re-renders and opens
     the cart drawer. It never touches the configurator: no [data-customization-option]
     input is clicked and the configured product's own price and order line are
     unaffected. Quantity comes from data-quantity, set per entry in the product's
     upsell metafield (e.g. tile flooring adds at 12). ---- */

  /* The headline price element: the variant's own price, static. Carries no
     .pr_custom_price class, so priceHelper never rewrites it; its
     data-price-value is the source the financing quote reads. */
  function headlinePriceEl(root) {
    return (root || document).querySelector('.pdp-new__price .pdp-new__price-value');
  }

  /* The running grand total above Add to Cart — first .pr_custom_price in the
     document, so priceHelper takes its base from here and writes into it. */
  function configTotalEl(root) {
    return (root || document).querySelector('[data-config-total]');
  }

  function optionsRoot(scope) {
    return (scope || document).querySelector('[id^="Product-Options-"]');
  }

  /* Momentary confirmation only. The button stays enabled so a second unit can be
     added; each click adds its own quantity and the cart is the source of truth. */
  function flashAdded(button) {
    var label = button.querySelector('span');
    if (!label) return;
    if (button.dataset.restoreLabel === undefined) {
      button.dataset.restoreLabel = label.textContent.trim();
    }
    button.classList.add('is-added');
    label.textContent = 'Added';
    clearTimeout(button._addedTimer);
    button._addedTimer = setTimeout(function () {
      button.classList.remove('is-added');
      label.textContent = button.dataset.restoreLabel;
    }, 2000);
  }

  /* Re-render the drawer from freshly fetched section HTML and open it — the same
     contract cart-drawer.js exposes elsewhere. renderContents() calls open(). */
  function refreshCartDrawer() {
    var drawer = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    if (!drawer || typeof drawer.renderContents !== 'function') {
      /* No drawer on the page (or an unexpected build): fall back to the cart
         page rather than silently leaving the buyer with no feedback. */
      window.location = (window.routes && window.routes.cart_url) || '/cart';
      return Promise.resolve();
    }

    /* Ask the element which sections it re-renders rather than hardcoding them; the
       drawer and the notification want different sets. */
    var sectionIds = 'cart-drawer,cart-icon-bubble';
    if (typeof drawer.getSectionsToRender === 'function') {
      sectionIds = drawer.getSectionsToRender().map(function (s) { return s.id; }).join(',');
    }

    var root = (window.routes && window.routes.root) || '/';
    return fetch(root + '?sections=' + encodeURIComponent(sectionIds))
      .then(function (response) { return response.json(); })
      .then(function (sections) {
        return fetch(root + 'cart.js')
          .then(function (response) { return response.json(); })
          .then(function (cart) {
            if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
              publish(PUB_SUB_EVENTS.cartUpdate, { source: 'pdp-new-upsell', cartData: cart });
            }
            drawer.classList.remove('is-empty');
            drawer.renderContents({ id: cart.id, sections: sections });
          });
      });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-upsell-add]');
    if (!button || button.disabled) return;

    var variantId = button.dataset.variantId;
    if (!variantId) return;
    /* Quantity is per-entry (e.g. flooring tiles add at 12). Guard the parse so a
       malformed metafield value can never post NaN or 0. */
    var quantity = parseInt(button.dataset.quantity, 10);
    if (!(quantity > 0)) quantity = 1;

    button.disabled = true;
    button.classList.add('loading');

    var root = (window.routes && window.routes.root) || '/';
    fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ items: [{ id: Number(variantId), quantity: quantity }] })
    })
      .then(function (response) {
        return response.json().then(function (body) {
          /* Shopify answers 4xx with a JSON description (sold out, limit
             reached). Surface it rather than pretending the add worked. */
          if (!response.ok) throw new Error(body.description || body.message || 'Add to cart failed');
          return body;
        });
      })
      .then(function () {
        flashAdded(button);
        return refreshCartDrawer();
      })
      .catch(function (error) {
        console.error('[pdp-new] upsell add failed', error);
        var label = button.querySelector('span');
        if (label) {
          var previous = label.textContent.trim();
          label.textContent = 'Unavailable';
          setTimeout(function () { label.textContent = previous; }, 2000);
        }
      })
      .finally(function () {
        button.disabled = false;
        button.classList.remove('loading');
      });
  });

  /* Accordion-side option changes still need to keep the delivery dropdown in
     step. Upsell cards are not involved: they hold no configurator state. */
  document.addEventListener('change', function (event) {
    if (!event.target.closest || !event.target.closest('[id^="Product-Options-"]')) return;
    var scope = event.target.closest('product-info') || document;
    syncOptionGroupSelect(scope);
    /* No syncFinancing() here on purpose: the quote tracks the headline variant
       price, which option selections no longer change. */
  });

  /* ---- Variant-change synchronisation ----
     product-info.js re-fetches the section and swaps a fixed list of ids, then
     publishes variantChange with the parsed document. Regions this template adds
     are not on that list, so they are re-rendered here from the same fetched HTML
     using the same id-swap convention. Option help popups come from the
     VARIANT-level options metafield and the sticky bar carries its own copy of
     price and availability, so both would otherwise show the previous variant. */
  function swapById(fetched, name, sectionId) {
    var source = fetched.getElementById(name + '-' + sectionId);
    var target = document.getElementById(name + '-' + sectionId);
    if (source && target) target.innerHTML = source.innerHTML;
  }

  /* Availability. product-info.js's `productForm` getter is
     querySelector('product-form'), which does not match the
     <product-form-with-options> tag this template renders, so its own update is a
     no-op here. Apply it from the same source: the fetched section's submit
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
     variant's price — and nothing updates it, so financing is quoted against the
     wrong price on a multi-variant product. Point it at the headline variant
     price instead.

     Variant price, not the configured total: the quote reads "(options at
     checkout)", so a monthly figure that moved while the headline stayed put
     would contradict itself. */
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
     Rendered server-side (main-product-new.liquid) from the same option group the
     configurator renders, so there is nothing to build here. This only keeps the
     select in step when the group is changed elsewhere. ---- */

  function syncOptionGroupSelect(root) {
    var select = root.querySelector('[data-option-group-select]');
    if (!select || !select.options.length) return;
    var options = optionsRoot(root);
    if (!options) return;
    /* Match on the option list we rendered, not on group identity: the selected
       input for this group is whichever checked input the select offers. */
    for (var i = 0; i < select.options.length; i++) {
      var input = options.querySelector('[data-customization-option="' + select.options[i].value + '"]');
      if (input && input.checked) {
        select.value = select.options[i].value;
        return;
      }
    }
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
     price is already updated by product-info.js on variant change and by
     priceHelper() on option selection, so mirroring keeps the two in step. */
  function syncStickyToBuyBox(root) {
    /* Mirrors the configuration TOTAL, not the static headline price: the sticky
       bar sits beside its own Add to Cart, so it must show the amount that would
       be committed. It carries .pr_custom_price too, so priceHelper writes it on
       option selection; mirroring covers the paths priceHelper doesn't run on
       (initial load, variant change). */
    var source = configTotalEl(root) || headlinePriceEl(root);
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

  /* ---- FAQ accordions ----
     The FAQ metafield is raw authored HTML, not structured data: each question is
     a paragraph whose entire content is bold ("<p><b>1. Question?</b></p>"),
     followed by its answer paragraphs, then unrelated marketing copy and the
     FAQPage JSON-LD.

     Pairs are found structurally: a bold-only paragraph opens a group, which takes
     the following paragraphs until the next question or the first non-paragraph
     node — the latter is what keeps the trailing copy out of the last answer.
     Anything not consumed stays where it is, so the schema block is never moved.

     Parsed from the DOM, not the metafield string: the authored HTML has unclosed
     <p> tags that only a real parser resolves. */
  function faqHost(wrap) {
    /* The metafield value is usually wrapped in its own <div>; descend through
       any single-div nesting so we iterate the real paragraph list. */
    var host = wrap;
    while (host.children.length === 1 && host.firstElementChild.tagName === 'DIV') {
      host = host.firstElementChild;
    }
    return host;
  }

  function isFaqQuestion(el) {
    if (!el || el.tagName !== 'P') return false;
    var bold = el.querySelector('b, strong');
    if (!bold) return false;
    var boldText = bold.textContent.trim();
    /* Bold-only: a paragraph that merely contains an emphasised phrase is an
       answer, not a question. */
    return boldText.length > 0 && el.textContent.trim() === boldText;
  }

  function buildFaqAccordions(scope) {
    var wrap = (scope || document).querySelector('[data-pdp-faq]');
    if (!wrap || wrap.dataset.faqBuilt === 'true') return;

    var host = faqHost(wrap);
    var nodes = Array.prototype.slice.call(host.children);
    var built = 0;

    for (var i = 0; i < nodes.length; i++) {
      if (!isFaqQuestion(nodes[i])) continue;

      var question = nodes[i];
      var answers = [];
      for (var j = i + 1; j < nodes.length; j++) {
        if (nodes[j].tagName !== 'P' || isFaqQuestion(nodes[j])) break;
        answers.push(nodes[j]);
      }
      /* A question with no answer stays as-is: collapsing it would hide the
         only thing it says behind a control that reveals nothing. */
      if (!answers.length) continue;

      var details = document.createElement('details');
      details.className = 'pdp-new__faq-item';

      var summary = document.createElement('summary');
      summary.className = 'pdp-new__faq-q';
      /* Drop the authored "1. " / "2) " numbering: the accordion supplies its
         own visual ordering, and the digits read as noise in a summary. */
      summary.textContent = question.textContent.trim().replace(/^\s*\d+\s*[.)]\s*/, '');

      var body = document.createElement('div');
      body.className = 'pdp-new__faq-a';

      details.appendChild(summary);
      details.appendChild(body);
      host.insertBefore(details, question);
      question.parentNode.removeChild(question);
      answers.forEach(function (a) { body.appendChild(a); });

      built++;
      i += answers.length;
    }

    if (!built) return;
    wrap.dataset.faqBuilt = 'true';

    /* One open at a time. CAPTURE phase on purpose: `toggle` does not bubble, so a
       delegated listener on the wrapper would never fire, but capture still reaches
       the container on the way down. Also keeps working for accordions added later. */
    wrap.addEventListener(
      'toggle',
      function (event) {
        var opened = event.target;
        if (!opened.open || !opened.classList.contains('pdp-new__faq-item')) return;
        wrap.querySelectorAll('.pdp-new__faq-item[open]').forEach(function (item) {
          /* Setting .open fires another toggle, but only for items that were
             open, and those close — so it never re-enters past one level. */
          if (item !== opened) item.open = false;
        });
      },
      true
    );
  }

  /* Spec tables arrive as raw metafield HTML with no header row; the Figma draws
     one ("Specification | Details"), so it is added here rather than re-authoring
     every product's metafield.

     Narrow by design: only two-column tables with no header cell of their own.
     Comparison charts are multi-column and carry their own headers. */
  function buildSpecTableHeaders(scope) {
    /* "Everywhere": the lower content tabs AND the buy box's info tabs (Key
       Specs / What's Included), both of which render authored metafield HTML. */
    scope
      .querySelectorAll('.pdp-new__content-body table, .pdp-new__tabs-content table')
      .forEach(function (table) {
      if (table.closest('.pdp-new__comparison-table')) return;
      if (table.tHead || table.querySelector('th')) return;

      var firstRow = table.rows[0];
      /* A ragged table (rows of differing width) is not the two-column
         spec shape, whatever the first row happens to say. */
      if (!firstRow || firstRow.cells.length !== 2) return;
      for (var i = 1; i < table.rows.length; i++) {
        if (table.rows[i].cells.length !== 2) return;
      }

      var head = table.createTHead();
      var row = head.insertRow(0);
      ['Specification', 'Details'].forEach(function (text) {
        var th = document.createElement('th');
        th.textContent = text;
        th.scope = 'col';
        row.appendChild(th);
      });
      table.classList.add('pdp-new__spec-table');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.querySelector('.pdp-new');
    if (!root) return;

    var sectionId = root.dataset.section;

    syncOptionGroupSelect(root);
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
            /* Holds data-price-value, the base priceHelper() adds option prices
               to — a stale one would mis-total every later selection. */
            swapById(fetched, 'PdpNewConfigTotal', sectionId);
            /* Server-rendered from the variant's own option metafield, so it must
               re-render or it would offer the previous variant's choices. */
            swapById(fetched, 'PdpNewDeliveryBlock', sectionId);
          }
          syncAvailability(root, fetched, sectionId, data.variant);
          syncOptionGroupSelect(root);
          syncStickyToBuyBox(root);
          syncFinancing(root);
        });
      });
    }

    buildFaqAccordions(root);
    buildSpecTableHeaders(root);

    /* Publish the info column's geometry for the zoom panel (see pdp-new.css). The
       panel is fixed, so it can only be placed against the viewport, but the page
       container is not a fixed inset from it — .inner-container gains its own gutter
       below 1280px and the scrollbar shifts things again. Measuring the column it
       must cover is exact at every width. */
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
       The Key Specs tab is a raw rich-text metafield: a flat <ul> of "Label: value"
       lines with no emphasis. Wrapping the label gives each row the dark lead-in the
       design shows. Only the leading text node, only an early colon, and never a row
       that already has its own markup. */
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
       Watches the submit button, not .pdp-new__buybox: the buy box is ~1600px tall
       on mobile, which would leave a long dead zone after the button had scrolled
       off.

       Recomputed from the button's live rect on scroll/resize (rAF-throttled) rather
       than IntersectionObserver alone, which only fires on threshold crossings and
       goes stale on an instant scroll jump or a layout shift (the mobile slick
       gallery lazy-loads images). The observer stays as a cheap extra trigger. */
    var sticky = root.querySelector('.pdp-new__sticky');
    var atcAnchor = root.querySelector('.product-form__submit') || root.querySelector('.pdp-new__buybox');
    if (sticky && atcAnchor) {
      var updateSticky = function () {
        var r = atcAnchor.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        /* Hide while the button is on screen (allowing for the observer's 80px
           rootMargin) or still below the fold. The bar is a fallback for a button
           already scrolled past, not a preview of one. */
        var onScreen = r.bottom > 0 && r.top < vh - 80;
        sticky.hidden = onScreen || r.top > 0;
        /* The bar is fixed, and so is the Gorgias launcher in the same corner.
           Flagging <body> lets the CSS lift the launcher clear and reserve space
           beneath the page; publishing the measured height keeps both exact
           rather than guessed, since the bar grows by the safe-area inset. */
        document.body.classList.toggle('pdp-new-sticky-open', !sticky.hidden);
        if (!sticky.hidden) {
          document.documentElement.style.setProperty('--pdp-sticky-h', sticky.offsetHeight + 'px');
        }
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
    }

    /* ---- Mobile content accordions (<=989px) ----
       The lower content is one DOM: tabs on desktop, a collapsible list on mobile.
       Not the shared custom.js .dropdown-btn handler, which is hard-gated to <=749px
       and allows several panels open at once; this group is exclusive and uses the
       PDP's own 990px boundary. Content stays in the DOM either way. */
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

        /* Closing a tall row above shifts the page, so bring the tapped header back to
           the top, offset by the sticky site header. Measured AFTER the collapse
           animation — during it the outgoing layout overshoots by the closing row's
           height. */
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
       product-mobile-gallery.js inits slick on .mobile-gallery-slider; this adds a
       thumbnail strip beneath it. Tapping a thumb calls slickGoTo and afterChange
       highlights the match, keyed by data-media-id so it survives slide filtering.
       slick may init after this runs, so poll for slick-initialized before binding. */
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
            /* Scroll the STRIP horizontally only — scrollIntoView would also scroll the page
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
