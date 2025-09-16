class CustomManuals extends HTMLElement {
  constructor() {
    super();
    this.searchInput = null;
    this.resetButton = null;

    this.filterItems = []; // For homepage brand filtering
    this.emptyMessage = null;

    this.manualLists = []; // All <ul> with manuals per type
    this.manualEmptyState = null;
    this.contentWrapper = null; // Scroll target
  }

  connectedCallback() {
    // Bind key UI elements
    this.searchInput = this.querySelector('.manuals-search__input');
    this.resetButton = this.querySelector('.manuals-search__reset-btn');
    this.filterItems = [...this.querySelectorAll('.manuals-filter-collection')];
    this.emptyMessage = this.querySelector('.manuals-empty-message');
    this.manualLists = [...this.querySelectorAll('.manuals-list-inner')];
    this.manualEmptyState = this.querySelector('.manuals-no-search-results');
    this.contentWrapper = this.querySelector('.manuals-content__wrapper');

    if (!this.searchInput) return;

    this.toggleResetBtn(); // Show/hide clear button on init

    this.searchInput.addEventListener('input', (e) => {
      this.toggleResetBtn();
      this.onSearchInput(e.target.value);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.scrollToResults();
      }
    });

    this.resetButton?.addEventListener('click', () => {
      this.onReset();
      this.toggleResetBtn();
    });
  }

  scrollToResults() {
    if (this.contentWrapper) {
      this.contentWrapper.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onSearchInput(rawQuery) {
    const query = rawQuery.trim().toLowerCase();

    // Homepage logic (brand filters)
    if (this.filterItems.length) {
      let anyVisible = false;

      this.filterItems.forEach((item) => {
        const title = item.dataset.title?.toLowerCase() || '';
        const handle = item.dataset.handle?.toLowerCase() || '';
        const match = title.includes(query) || handle.includes(query);
        item.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });

      if (this.emptyMessage) {
        this.emptyMessage.hidden = anyVisible;
      }
    }

    // Manual detail page logic
    if (this.manualLists.length) {
      let totalVisible = 0;

      this.manualLists.forEach((ul) => {
        const parentCol = ul.closest('.manuals-content__col');
        const heading = parentCol?.querySelector('h2');
        const items = [...ul.querySelectorAll('li')];
        let visibleInList = 0;

        items.forEach((li) => {
          const title = li.dataset.title?.toLowerCase() || '';
          const link = li.querySelector('a');
          const match = title.includes(query);

          li.style.display = match ? '' : 'none';

          // Highlight matches in text content
          if (link) {
            const originalText = link.textContent;
            if (query.length > 0 && match) {
              const regex = new RegExp(`(${query})`, 'gi');
              link.innerHTML = originalText.replace(regex, '<mark>$1</mark>');
            } else {
              link.innerHTML = originalText; // remove highlight
            }
          }

          if (match) visibleInList++;
        });

        // Show/hide the entire list and heading if empty
        ul.style.display = visibleInList > 0 ? '' : 'none';
        if (heading) heading.style.display = visibleInList > 0 ? '' : 'none';

        totalVisible += visibleInList;
      });

      if (this.manualEmptyState) {
        this.manualEmptyState.hidden = totalVisible > 0;
      }
    }
  }

  onReset() {
    this.toggleResetBtn();
    this.searchInput.value = '';
    this.searchInput.focus();

    // Reset homepage filters
    this.filterItems.forEach((item) => (item.style.display = ''));
    if (this.emptyMessage) this.emptyMessage.hidden = true;

    // Reset manual lists
    this.manualLists.forEach((ul) => {
      ul.style.display = '';
      const parentCol = ul.closest('.manuals-content__col');
      const heading = parentCol?.querySelector('h2');
      if (heading) heading.style.display = '';

      ul.querySelectorAll('li').forEach((li) => {
        li.style.display = '';
        const link = li.querySelector('a');
        if (link) link.innerHTML = link.textContent; // remove highlight
      });
    });

    if (this.manualEmptyState) this.manualEmptyState.hidden = true;
  }

  toggleResetBtn() {
    if (!this.resetButton) return;
    const hasValue = this.searchInput.value.trim().length > 0;
    this.resetButton.style.display = hasValue ? 'block' : 'none';
  }
}

customElements.define('custom-manuals', CustomManuals);
