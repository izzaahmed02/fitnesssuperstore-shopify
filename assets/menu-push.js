// Mobile push menu inside the header drawer: each level slides in as its own panel.
// Panels keep their own scroll position, so going back returns to the same spot.
class MenuPush extends HTMLElement {
  connectedCallback() {
    this.stack = [this.querySelector('.menu-push__panel.is-active')];

    // Capture phase on purpose: MenuDrawer (global.js) closes the drawer on any <button> click
    // inside it, so stop our clicks here before they reach those listeners.
    this.addEventListener('click', this.onClick.bind(this), true);

    this.details = this.closest('details');
    this.details?.addEventListener('toggle', () => {
      if (!this.details.open) this.reset();
    });
  }

  onClick(event) {
    const button = event.target.closest('button');
    if (!button || !this.contains(button)) return;
    event.stopPropagation();

    if (button.dataset.menuPush) this.push(button);
    else if (button.hasAttribute('data-menu-back')) this.pop();
  }

  push(button) {
    const next = document.getElementById(button.dataset.menuPush);
    const current = this.stack[this.stack.length - 1];
    if (!next || next === current) return;

    next.opener = button;
    next.inert = false;
    next.scrollTop = 0;
    next.classList.add('is-active');
    current.classList.add('is-behind');
    button.setAttribute('aria-expanded', 'true');
    this.stack.push(next);

    // Move focus before making the old panel inert, or MenuDrawer's focusout closes the drawer.
    next.querySelector('[data-menu-back]')?.focus({ preventScroll: true });
    current.inert = true;
  }

  pop() {
    if (this.stack.length < 2) return;
    const current = this.stack.pop();
    const previous = this.stack[this.stack.length - 1];

    previous.inert = false;
    previous.classList.remove('is-behind');
    current.classList.remove('is-active');
    current.opener?.setAttribute('aria-expanded', 'false');
    current.opener?.focus({ preventScroll: true });
    current.inert = true;
  }

  // Runs after the drawer has closed, so the next open starts at the root panel.
  reset() {
    while (this.stack.length > 1) {
      const panel = this.stack.pop();
      panel.classList.remove('is-active');
      panel.opener?.setAttribute('aria-expanded', 'false');
      panel.inert = true;
    }
    const root = this.stack[0];
    root.classList.remove('is-behind');
    root.inert = false;
    root.scrollTop = 0;
  }
}

customElements.define('menu-push', MenuPush);
