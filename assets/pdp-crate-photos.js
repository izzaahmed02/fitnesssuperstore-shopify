/*
 * PDP "Ships:" crate-photo popup.
 *
 * Opens the product's own crate photos in the theme's existing modal
 * (.modal-wrapper / #dynamic-product-content), the same mechanism "(More Info)"
 * uses, so the popup looks and closes like every other PDP popup.
 *
 * The photos are rendered server-side into a <template> next to the trigger, so
 * nothing is fetched on click, and products without photos ship no trigger and
 * no template at all.
 *
 * The container is shared with the theme's other popups, so every listener this
 * adds is torn down on close: a stale handler would otherwise clear whichever
 * popup happens to be open next.
 */
(function () {
  'use strict';

  var activeTrigger = null;

  function elements() {
    return {
      wrapper: document.querySelector('.modal-wrapper'),
      container: document.getElementById('dynamic-product-content')
    };
  }

  function onKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') close();
  }

  function onBackdropClick(event) {
    var wrapper = elements().wrapper;
    if (wrapper && event.target === wrapper) close();
  }

  function close() {
    var els = elements();

    document.removeEventListener('keydown', onKeydown);
    if (els.wrapper) {
      els.wrapper.removeEventListener('click', onBackdropClick);
      els.wrapper.style.display = 'none';
    }
    if (els.container) els.container.innerHTML = '';

    if (activeTrigger) {
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  function open(trigger) {
    var els = elements();
    var template = document.getElementById(trigger.getAttribute('aria-controls'));

    if (!els.wrapper || !els.container || !template) return;

    els.container.innerHTML = '';
    els.container.style.width = 'auto';
    els.container.appendChild(template.content.cloneNode(true));

    // A real <button> so Enter and Space activate it natively; the theme's
    // .modal-close class carries only the positioning.
    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Close');
    var closeIcon = document.getElementById('icon-close-template');
    closeButton.innerHTML = closeIcon ? closeIcon.innerHTML : '&times;';
    closeButton.addEventListener('click', close);
    els.container.appendChild(closeButton);

    activeTrigger = trigger;
    els.wrapper.style.display = 'flex';

    document.addEventListener('keydown', onKeydown);
    els.wrapper.addEventListener('click', onBackdropClick);

    closeButton.focus();
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-crate-photos-trigger]');
    if (!trigger) return;
    event.preventDefault();
    open(trigger);
  });
})();
