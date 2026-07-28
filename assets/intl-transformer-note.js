// International transformer note: information popover behaviour.
//
// Opens on desktop hover, on keyboard focus, and on tap. A click or tap pins the
// popover open so it survives the pointer leaving; hover alone closes on leave.
// Closes on Escape, on an outside click/tap, and when focus leaves the note.
(() => {
  const canHover = window.matchMedia('(hover: hover)').matches;

  const setUpNote = (note) => {
    const toggle = note.querySelector('[data-intl-transformer-toggle]');
    const popover = note.querySelector('[data-intl-transformer-popover]');

    if (!toggle || !popover || toggle.dataset.intlTransformerReady) return;
    toggle.dataset.intlTransformerReady = 'true';

    // Pinned means opened deliberately by click, tap, or keyboard, so hovering
    // away must not close it.
    let pinned = false;
    // A pointer press focuses the button before the click event lands. Without
    // this the focus handler would open the popover and the click would read as
    // a second interaction and close it again.
    let openingWithPointer = false;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const open = ({ pin = false } = {}) => {
      if (pin) pinned = true;
      popover.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      pinned = false;
      popover.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('pointerdown', () => {
      openingWithPointer = true;
    });

    toggle.addEventListener('click', () => {
      openingWithPointer = false;
      if (isOpen() && pinned) {
        close();
      } else {
        open({ pin: true });
      }
    });

    toggle.addEventListener('focus', () => {
      if (openingWithPointer) return;
      open({ pin: true });
    });

    if (canHover) {
      note.addEventListener('mouseenter', () => open());
      note.addEventListener('mouseleave', () => {
        if (!pinned) close();
      });
    }

    note.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isOpen()) return;
      close();
      toggle.focus();
    });

    note.addEventListener('focusout', (event) => {
      if (note.contains(event.relatedTarget)) return;
      close();
    });

    document.addEventListener('pointerdown', (event) => {
      if (!isOpen() || note.contains(event.target)) return;
      close();
    });
  };

  document.querySelectorAll('[data-intl-transformer-note]').forEach(setUpNote);
})();
