// International transformer note: information popover behaviour.
//
// Opens on desktop hover, on keyboard focus, and on tap. A click or tap pins the
// popover open so it survives the pointer leaving; hover alone closes on leave.
// Closes on Escape, on an outside click/tap, and when focus leaves the note.
(() => {
  const NOTE_SELECTOR = '[data-intl-transformer-note]';
  const canHover = window.matchMedia('(hover: hover)').matches;

  const toggleOf = (note) => note.querySelector('[data-intl-transformer-toggle]');
  const popoverOf = (note) => note.querySelector('[data-intl-transformer-popover]');
  const isOpen = (note) => toggleOf(note)?.getAttribute('aria-expanded') === 'true';

  const open = (note, { pin = false } = {}) => {
    if (pin) note.dataset.intlTransformerPinned = 'true';
    popoverOf(note).hidden = false;
    toggleOf(note).setAttribute('aria-expanded', 'true');
  };

  const close = (note) => {
    delete note.dataset.intlTransformerPinned;
    popoverOf(note).hidden = true;
    toggleOf(note).setAttribute('aria-expanded', 'false');
  };

  const setUpNote = (note) => {
    const toggle = toggleOf(note);
    const popover = popoverOf(note);

    if (!toggle || !popover) return;

    // The quick-add modal fetches the product page and injects its product-info
    // markup, so a copy of this note arrives in a context it must never render in.
    // Discard that copy rather than wiring it up.
    if (note.closest('quick-add-modal, [id^="QuickAddInfo-"]')) {
      note.remove();
      return;
    }

    if (toggle.dataset.intlTransformerReady) return;
    toggle.dataset.intlTransformerReady = 'true';

    // A pointer press focuses the button before its click event lands, and focus on
    // its own already opens the popover. These two flags stop one interaction from
    // reading as two and cancelling itself out.
    let openingWithPointer = false;
    let openedByFocus = false;

    toggle.addEventListener('pointerdown', () => {
      openingWithPointer = true;
      // A pointer press is its own activation, even on a button focus already opened
      // from the keyboard, so it must not be swallowed as the keyboard follow-up.
      openedByFocus = false;
    });

    toggle.addEventListener('click', () => {
      openingWithPointer = false;

      // A keyboard user's first Enter or Space lands on a popover that focus has
      // already opened. Treat it as confirming that state, not collapsing it.
      if (openedByFocus) {
        openedByFocus = false;
        return;
      }

      if (isOpen(note) && note.dataset.intlTransformerPinned) {
        close(note);
      } else {
        open(note, { pin: true });
      }
    });

    toggle.addEventListener('focus', () => {
      if (openingWithPointer) return;
      openedByFocus = true;
      open(note, { pin: true });
    });

    if (canHover) {
      note.addEventListener('mouseenter', () => open(note));
      note.addEventListener('mouseleave', () => {
        if (!note.dataset.intlTransformerPinned) close(note);
      });
    }

    note.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen(note)) return;
      openedByFocus = false;
      close(note);
      toggle.focus();
    });

    note.addEventListener('focusout', (event) => {
      if (note.contains(event.relatedTarget)) return;
      openedByFocus = false;
      close(note);
    });
  };

  // One delegated listener for the whole document. The quick-add modal re-runs this
  // script and then throws its DOM away, so a listener per note would pile up and
  // keep the discarded notes alive.
  if (!document.documentElement.dataset.intlTransformerNoteBound) {
    document.documentElement.dataset.intlTransformerNoteBound = 'true';

    document.addEventListener('pointerdown', (event) => {
      document.querySelectorAll(NOTE_SELECTOR).forEach((note) => {
        if (!isOpen(note) || note.contains(event.target)) return;
        close(note);
      });
    });
  }

  document.querySelectorAll(NOTE_SELECTOR).forEach(setUpNote);
})();
