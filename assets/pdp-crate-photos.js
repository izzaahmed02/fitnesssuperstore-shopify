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
  var activeDialog = null;

  var FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function elements() {
    return {
      wrapper: document.querySelector('.modal-wrapper'),
      container: document.getElementById('dynamic-product-content')
    };
  }

  function onKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      close();
      return;
    }

    // aria-modal="true" promises the dialog is modal, so Tab must not walk out
    // into the PDP behind it. A photo-only dialog has just the close button to
    // land on, so focus cycles back to it.
    if (event.key !== 'Tab' || !activeDialog) return;

    var items = activeDialog.querySelectorAll(FOCUSABLE);
    if (!items.length) {
      event.preventDefault();
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];

    if (!activeDialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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

    activeDialog = null;

    if (activeTrigger) {
      activeTrigger.focus();
      activeTrigger = null;
    }
  }

  function open(trigger) {
    var els = elements();
    var template = document.getElementById(trigger.getAttribute('data-crate-photos-template'));

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

    // Inside the role="dialog" element, not beside it: initial focus has to
    // land within the dialog for its accessible name to be announced and for
    // aria-modal to describe the focused context. It stays visually put, since
    // it is positioned against #dynamic-product-content either way.
    var dialog = els.container.querySelector('.crate-photos');
    (dialog || els.container).appendChild(closeButton);
    activeDialog = dialog;

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
