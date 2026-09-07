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
    this.summary = this.mainDetailsToggle.querySelector('summary');

    // global.js sets role="button" on these summaries, which suppresses the
    // native <summary> Enter/Space toggle in Safari/WebKit and is inconsistent
    // across browsers. Own the keyboard toggle here so it always works.
    if (this.summary) {
      this.summary.addEventListener('keydown', this.onSummaryKeydown.bind(this));
    }
  }

  connectedCallback() {
    if (!window.matchMedia('(hover: hover) and (min-width: 990px)').matches) return;

    this.mainDetailsToggle.addEventListener('mouseenter', this.openOnHover.bind(this));
    this.mainDetailsToggle.addEventListener('mouseleave', this.closeOnLeave.bind(this));
  }

  onSummaryKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;

    // Prevent both the native toggle (where it still fires) and Space-scrolling
    // the page, so this handler is the single source of truth across browsers.
    event.preventDefault();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    document.querySelectorAll('header-menu details[open]').forEach((openMenu) => {
      if (openMenu !== this.mainDetailsToggle) {
        openMenu.removeAttribute('open');
        openMenu.querySelector('summary')?.setAttribute('aria-expanded', false);
      }
    });

    this.mainDetailsToggle.setAttribute('open', '');
    this.summary?.setAttribute('aria-expanded', true);
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
    this.open();
  }

  closeOnLeave() {
    this.closeTimer = setTimeout(() => this.close(), 120);
  }
}

customElements.define('header-menu', HeaderMenu);
