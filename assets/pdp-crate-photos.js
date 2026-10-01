/*
 * PDP "Ships:" crate-photo popup.
 *
 * Opens the product's own crate photos in the theme's existing modal
 * (.modal-wrapper / #dynamic-product-content), the same mechanism "(More Info)"
 * uses, so the popup looks and closes like every other PDP popup.
 *
 * The photos are rendered server-side into a <template> next to the trigger, so
 * nothing is fetched on click and products without photos ship no trigger and
 * no template at all.
 */
(function () {
  'use strict';

  function closeModal(wrapper, container) {
    wrapper.style.display = 'none';
    container.innerHTML = '';
  }

  function openModal(trigger) {
    var wrapper = document.querySelector('.modal-wrapper');
    var container = document.getElementById('dynamic-product-content');
    var template = document.getElementById(trigger.getAttribute('aria-controls'));

    if (!wrapper || !container || !template) return;

    container.innerHTML = '';
    container.style.width = 'auto';
    container.appendChild(template.content.cloneNode(true));

    var closeButton = document.createElement('span');
    closeButton.className = 'modal-close';
    var closeIcon = document.getElementById('icon-close-template');
    closeButton.innerHTML = closeIcon ? closeIcon.innerHTML : '&times;';
    closeButton.setAttribute('role', 'button');
    closeButton.setAttribute('tabindex', '0');
    closeButton.setAttribute('aria-label', 'Close');
    container.appendChild(closeButton);

    wrapper.style.display = 'flex';

    closeButton.addEventListener('click', function () {
      closeModal(wrapper, container);
      trigger.focus();
    });

    // The theme's own handlers close on backdrop click and stop propagation
    // inside the container, but they are bound by the main-product scripts.
    // Bind our own so the popup still closes if those have not run.
    wrapper.addEventListener('click', function onBackdrop(event) {
      if (event.target === wrapper) {
        closeModal(wrapper, container);
        wrapper.removeEventListener('click', onBackdrop);
      }
    });

    document.addEventListener('keydown', function onEscape(event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        closeModal(wrapper, container);
        document.removeEventListener('keydown', onEscape);
        trigger.focus();
      }
    });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-crate-photos-trigger]');
    if (!trigger) return;
    event.preventDefault();
    openModal(trigger);
  });
})();
