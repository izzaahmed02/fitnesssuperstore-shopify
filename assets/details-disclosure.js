class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.closeTimer = null;
  }

  connectedCallback() {
    // Keyboard activation for the desktop mega-menu trigger. global.js sets
    // role="button" on these <summary> elements, which suppresses the native
    // Enter/Space details toggle in Safari, and nothing else provides a keyboard
    // open path (the hover listeners below are pointer-only). Bind an explicit
    // handler so keyboard users can open the menu in every browser. It is bound
    // regardless of hover capability; a hidden (mobile drawer) summary never
    // receives key events, so this does not affect mobile/tablet navigation.
    this.mainDetailsToggle
      .querySelector('summary')
      .addEventListener('keydown', this.onSummaryKeydown.bind(this));

    if (!window.matchMedia('(hover: hover) and (min-width: 990px)').matches) return;

    this.mainDetailsToggle.addEventListener('mouseenter', this.openOnHover.bind(this));
    this.mainDetailsToggle.addEventListener('mouseleave', this.closeOnLeave.bind(this));
  }

  onSummaryKeydown(event) {
    // Only Enter and Space activate the trigger. preventDefault stops the page
    // from scrolling on Space and stops any native/synthesized toggle from
    // competing with the explicit toggle below, so exactly one toggle happens
    // per keypress. Reuse the existing open/close paths so aria-expanded, the
    // sibling-menu close, and --header-bottom-position-desktop stay consistent
    // with pointer behavior.
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;

    event.preventDefault();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.close();
    } else {
      this.openOnHover();
    }
  }

  onToggle() {
    if (this.header) {
      this.header.preventHide = this.mainDetailsToggle.open;

      if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') === '') {
        document.documentElement.style.setProperty(
          '--header-bottom-position-desktop',
          `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
        );
      }
    }
  }

  openOnHover() {
    clearTimeout(this.closeTimer);

    document.querySelectorAll('header-menu details[open]').forEach((openMenu) => {
      if (openMenu !== this.mainDetailsToggle) {
        openMenu.removeAttribute('open');
        openMenu.querySelector('summary')?.setAttribute('aria-expanded', false);
      }
    });

    this.mainDetailsToggle.setAttribute('open', '');
    this.mainDetailsToggle.querySelector('summary')?.setAttribute('aria-expanded', true);
  }

  closeOnLeave() {
    this.closeTimer = setTimeout(() => this.close(), 120);
  }
}

customElements.define('header-menu', HeaderMenu);
