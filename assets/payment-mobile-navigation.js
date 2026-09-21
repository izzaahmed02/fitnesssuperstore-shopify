/* Payment page-only progressive enhancement. No payment content or desktop nav changes. */
(function () {
  'use strict';
  if (window.__fssPaymentJumpLoaded) return;
  window.__fssPaymentJumpLoaded = true;
  var instances = new WeakMap();
  var mobile = window.matchMedia('(max-width: 990px)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function headerOffset() {
    var header = document.querySelector('.section-header');
    var height = header ? header.getBoundingClientRect().height : 0;
    return (height > 0 ? height : 120) + 16;
  }

  function rootsWithin(container) {
    var roots = Array.from(container.querySelectorAll('.process-steps-section'));
    if (container.matches && container.matches('.process-steps-section')) roots.unshift(container);
    return roots;
  }

  function init(root) {
    if (instances.has(root)) return;
    var wrapper = root.querySelector('.process-steps-wrapper');
    var legacy = wrapper && wrapper.querySelector('.process-steps-nav');
    if (!wrapper || !legacy) return;
    /* A theme-editor clone can contain generated DOM without its event handlers. */
    wrapper.querySelectorAll('.fss-payment-jump').forEach(function (node) { node.remove(); });
    var blocks = Array.from(root.querySelectorAll('.process-step-block'));
    var items = Array.from(legacy.querySelectorAll('.process-nav-item')).map(function (item) {
      var target = blocks.find(function (block) { return block.id === item.dataset.target; });
      return { label: item.textContent.trim().replace(/\s+/g, ' '), target: target };
    }).filter(function (item) { return item.label && item.target; });
    if (!items.length) return;

    var controller = new AbortController();
    var signal = controller.signal;
    var details = document.createElement('details');
    details.className = 'fss-payment-jump';
    var summary = document.createElement('summary');
    summary.textContent = 'On this page';
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Payment page sections');
    var list = document.createElement('ul');
    var links = items.map(function (item) {
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.textContent = item.label;
      link.href = '#' + encodeURIComponent(item.target.id);
      li.appendChild(link);
      list.appendChild(li);
      link.addEventListener('click', function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        details.open = false;
        var heading = item.target.querySelector('.process-step-heading') || item.target;
        var oldTabindex = heading.getAttribute('tabindex');
        heading.setAttribute('tabindex', '-1');
        heading.setAttribute('data-payment-jump-focus', '');
        heading.focus({ preventScroll: true });
        heading.addEventListener('blur', function () {
          if (oldTabindex === null) heading.removeAttribute('tabindex');
          else heading.setAttribute('tabindex', oldTabindex);
          heading.removeAttribute('data-payment-jump-focus');
        }, { once: true, signal: signal });
        var top = item.target.getBoundingClientRect().top + window.scrollY - headerOffset();
        window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        /* Retain all preview/query parameters; passive scrolling does not alter history. */
        window.history.replaceState(window.history.state, '', link.hash);
        setCurrent(item.target);
      }, { signal: signal });
      return link;
    });
    nav.appendChild(list);
    details.append(summary, nav);
    wrapper.insertBefore(details, legacy);

    function setCurrent(target) {
      links.forEach(function (link, index) {
        if (items[index].target === target) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    var frame = 0;
    function updateCurrent() {
      frame = 0;
      if (!mobile.matches) { details.open = false; return; }
      var line = headerOffset() + 24;
      var current = items[0].target;
      items.forEach(function (item) {
        if (item.target.getBoundingClientRect().top <= line) current = item.target;
      });
      setCurrent(current);
    }
    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateCurrent);
    }
    details.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && details.open) {
        details.open = false;
        summary.focus({ preventScroll: true });
        event.preventDefault();
      }
    }, { signal: signal });
    window.addEventListener('scroll', scheduleUpdate, { passive: true, signal: signal });
    window.addEventListener('resize', scheduleUpdate, { passive: true, signal: signal });
    updateCurrent();
    instances.set(root, function () {
      controller.abort();
      window.cancelAnimationFrame(frame);
      details.remove();
      instances.delete(root);
    });
  }

  function initialize(container) { rootsWithin(container).forEach(init); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initialize(document); }, { once: true });
  } else initialize(document);
  document.addEventListener('shopify:section:load', function (event) { initialize(event.target); });
  document.addEventListener('shopify:section:unload', function (event) {
    rootsWithin(event.target).forEach(function (root) {
      var dispose = instances.get(root);
      if (dispose) dispose();
    });
  });
})();
