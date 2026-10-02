/*
  Ships row "Assembly Manual Link" -> opens the manual PDF in the PDP modal
  (.modal-wrapper / #dynamic-product-content), the same popup (More Info) uses.

  - Only links rendered by snippets/pdp-ships-value.liquid with [data-manual-popup].
  - Desktop only (Tim, Option 1): the popup is used when the browser has an
    inline PDF viewer, a fine pointer, no touchscreen and a viewport >= 750px.
    Everything else keeps the native href and opens a new tab.
    The touchscreen check sends every iPad to the new tab (Tim): with a trackpad
    an iPad reports pointer: fine and a Mac user agent, but still has touch points.
  - Cmd/Ctrl/Shift/middle-click still open a new tab (native href is kept).
  - If the modal markup is missing, the link falls back to its normal new-tab behaviour.
  - Cleans up its own class and iframe on close so (More Info) and the crate-photo
    popup (assets/pdp-crate-photos.js), which share the container, are unaffected.
  - The stylesheet is loaded from here (data-manual-css) rather than a tag in the
    Ships row, so it never blocks rendering of the PDP.
*/
(function () {
  if (window.__shipsManualPopupInit) return;
  window.__shipsManualPopupInit = true;

  var OPEN_CLASS = 'ships-manual-modal';
  var lastTrigger = null;

  function canPopup() {
    return navigator.pdfViewerEnabled === true &&
      navigator.maxTouchPoints === 0 &&
      window.matchMedia('(pointer: fine)').matches &&
      window.matchMedia('(min-width: 750px)').matches;
  }

  function loadStyles() {
    var link = document.querySelector('a.ships-manual__link[data-manual-popup][data-manual-css]');
    if (!link || document.getElementById('ships-manual-popup-css')) return;
    var sheet = document.createElement('link');
    sheet.id = 'ships-manual-popup-css';
    sheet.rel = 'stylesheet';
    sheet.href = link.getAttribute('data-manual-css');
    document.head.appendChild(sheet);
  }

  function getModal() {
    var wrapper = document.querySelector('.modal-wrapper');
    var container = document.getElementById('dynamic-product-content');
    if (!wrapper || !container) return null;
    return { wrapper: wrapper, container: container };
  }

  function closeIcon() {
    var tpl = document.getElementById('icon-close-template');
    return tpl ? tpl.innerHTML : '&times;';
  }

  function isOpen(modal) {
    return modal.container.classList.contains(OPEN_CLASS);
  }

  function close() {
    var modal = getModal();
    if (!modal || !isOpen(modal)) return;
    modal.wrapper.style.display = 'none';
    modal.container.classList.remove(OPEN_CLASS);
    modal.container.removeAttribute('role');
    modal.container.removeAttribute('aria-modal');
    modal.container.removeAttribute('aria-label');
    modal.container.innerHTML = ''; // unloads the PDF
    if (lastTrigger) lastTrigger.focus();
    lastTrigger = null;
  }

  function open(link) {
    var modal = getModal();
    if (!modal) return false;

    var url = link.getAttribute('href');
    if (!url) return false;

    var title = 'Assembly Manual';
    var frame = document.createElement('iframe');
    frame.className = 'ships-manual-modal__frame';
    frame.src = url;
    frame.title = title;
    frame.setAttribute('loading', 'eager');

    var html =
      '<div class="ships-manual-modal__header">' +
        '<h2 class="ships-manual-modal__title more-info-title">' + title + '</h2>' +
      '</div>' +
      '<div class="ships-manual-modal__body"></div>' +
      '<p class="ships-manual-modal__fallback">Manual not displaying? ' +
        '<a href="" target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.' +
      '</p>' +
      '<button type="button" class="modal-close ships-manual-modal__close" aria-label="Close manual">' +
        closeIcon() +
      '</button>';

    modal.container.innerHTML = html;
    modal.container.querySelector('.ships-manual-modal__body').appendChild(frame);
    modal.container.querySelector('.ships-manual-modal__fallback a').setAttribute('href', url);
    modal.container.querySelector('.ships-manual-modal__close').addEventListener('click', close);

    modal.container.classList.add(OPEN_CLASS);
    modal.container.setAttribute('role', 'dialog');
    modal.container.setAttribute('aria-modal', 'true');
    modal.container.setAttribute('aria-label', title);
    modal.container.style.width = ''; // (More Info) sets width:auto inline; let our CSS size it
    modal.wrapper.style.display = 'flex';

    lastTrigger = link;
    modal.container.querySelector('.ships-manual-modal__close').focus();
    return true;
  }

  loadStyles();

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a.ships-manual__link[data-manual-popup]');
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!canPopup()) return;
    if (open(link)) event.preventDefault();
  });

  // Backdrop click: main-product-custom.js already hides the wrapper; this clears our state too.
  document.addEventListener('click', function (event) {
    var modal = getModal();
    if (modal && event.target === modal.wrapper && isOpen(modal)) close();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
})();
