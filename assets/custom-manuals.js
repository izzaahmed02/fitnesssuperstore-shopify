if (!customElements.get('custom-manuals')) {
  customElements.define(
    'custom-manuals',
    class CustomManuals extends HTMLElement {
      constructor() {
        super();
        this.tabs = this.querySelectorAll('.custom-tab');
        this.filtersList = this.querySelector('.manuals-filters-list');
        this.resetButton = this.querySelector('.manuals-reset-button');
        this.contentContainer = this.querySelector('.manuals-content');
        this.loader = this.querySelector('.manuals-loader');
        this.paginationContainer = null; // Pagination container will be initialized later
        this.allCollections = [];


        // Bind methods
        this.resetFilters = this.resetFilters.bind(this);
        this.onChangeTab = this.onChangeTab.bind(this);
        this.onPaginate = this.onPaginate.bind(this);

        // Add event listeners
        this.resetButton.addEventListener('click', this.resetFilters);
        this.tabs.forEach(tab => tab.addEventListener('click', this.onChangeTab));

        // Attach search functionality
        const searchInput = this.querySelector('.manuals-search__input');
        if (searchInput) {
          searchInput.addEventListener('input', this.onSearch.bind(this));
        }

        // Fetch default content for the first tab
        const defaultTab = this.tabs[0];
        if (defaultTab) {
          this.fetchTabContent(defaultTab.getAttribute('data-tab'));
          this.fetchAllCollections(defaultTab.getAttribute('data-tab'));
          this.getFilters(defaultTab);
        }
      }

      async fetchTabContent(tabId, url = null) {
        // Show the loader
        if (this.loader) {
          this.loader.classList.add('active');
        }
        this.contentContainer.style.display = 'none';

        // Build the URL if not provided
        url = url || `/collections/${tabId}?view=manual-list`;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch HTML content');

          const htmlContent = await response.text();
          // Update the content container
          if (this.contentContainer) {
            this.contentContainer.innerHTML = htmlContent;

            // Initialize pagination container and add event listeners
            this.initPagination();
          }
        } catch (error) {
          console.error('Error fetching tab content:', error);
        } finally {
          // Hide the loader
          if (this.loader) this.loader.classList.remove('active');
          this.contentContainer.style.display = 'block';
        }
      }

      async onPaginate(event) {
        event.preventDefault();

        // Get the URL from the clicked pagination element
        const target = event.currentTarget;
        const url = target.getAttribute('data-href');

        if (url) {
          // Fetch new content using the pagination URL
          await this.fetchTabContent(null, url);
        }
      }

      initPagination() {
        // Find the pagination container within the newly fetched content
        this.paginationContainer = this.contentContainer.querySelector('.pagination');

        if (this.paginationContainer) {
          // Add click event listeners to pagination links
          const paginationLinks = this.paginationContainer.querySelectorAll('[data-href]');
          paginationLinks.forEach(link => {
            link.addEventListener('click', this.onPaginate);
          });
        }
      }

      onChangeTab(event) {
        const clickedTab = event.currentTarget;

        this.getFilters(clickedTab);
        // Remove active class from all tabs
        this.tabs.forEach(tab => tab.classList.remove('tab-active'));

        // Add active class to the clicked tab
        clickedTab.classList.add('tab-active');

        // Fetch content for the clicked tab
        const tabId = clickedTab.getAttribute('data-tab');
        if (tabId) {
          this.fetchTabContent(tabId);
          this.fetchAllCollections(tabId);
        }
      }

      getFilters(clickedTab) {
        const relatedCollections = clickedTab.querySelector(`#related-collections-data-${clickedTab.dataset.tabId}`);
        const relatedCollectionsJson = JSON.parse(relatedCollections.textContent);

        if (relatedCollectionsJson) {
          this.filtersList.innerHTML = '';
          relatedCollectionsJson.forEach(collection => {
            const collectionHTML = `
              <div class="manuals-filter-collection" data-handle="${collection.handle}">
                <img src="${collection.image.src}" width="${collection.image.width}"/>
                <p class="manuals-filter-collection__title">${collection.title.replace('Manuals', '')}</p>
              </div>
            `;

            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = collectionHTML;
            const collectionElement = tempContainer.firstElementChild;

            collectionElement.addEventListener('click', () => this.getSelectedManualsList(collection.handle));
            this.filtersList.appendChild(collectionElement);
          });
        } else {
          this.filtersList.innerHTML = '<p>No filters found.</p>';
        }
      }

      resetFilters() {
        this.resetButton.classList.remove('active');
        this.querySelectorAll('.manuals-filter-collection').forEach(filter => filter.classList.remove('filter-active'));
        const selectedTab = Array.from(this.tabs).find(tab => tab.classList.contains('tab-active'));
        const tabId = selectedTab.getAttribute('data-tab');

        this.fetchTabContent(tabId);
      }

      async getSelectedManualsList(selectedManualList) {
        const selectedFilter = this.querySelector(`[data-handle="${selectedManualList}"]`);
        selectedFilter.classList.add('filter-active');
        this.resetButton.classList.add('active');

        if (this.loader) {
          this.loader.classList.add('active');
        }
        this.contentContainer.style.display = 'none';

        const url = `/collections/${selectedManualList}?view=manual-item`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch HTML content');

          const htmlContent = await response.text();
          if (this.contentContainer) {
            this.contentContainer.innerHTML = htmlContent;
            this.initPagination();
          }
        } catch (error) {
          console.error('Error fetching tab content:', error);
        } finally {
          if (this.loader) this.loader.classList.remove('active');
          this.contentContainer.style.display = 'block';
        }
      }

      async fetchAllCollections(tabId) {
        // Fetch all collections for the active tab
        const url = `/collections/${tabId}?view=all-collections-json`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch collections');
          this.allCollections = await response.json(); // Store collections data locally

        } catch (error) {
          console.error('Error fetching all collections:', error);
        }
      }

      onSearch(event) {
        const query = event.target.value.toLowerCase();
        const selectedTab = Array.from(this.tabs).find(tab => tab.classList.contains('tab-active'));
        const tabId = selectedTab.getAttribute('data-tab');
        const noResults = this.querySelector('.manuals-no-search-results');

        this.resetButton.classList.remove('active');
        this.querySelectorAll('.manuals-filter-collection').forEach(filter => filter.classList.remove('filter-active'));
        // Filter collections based on the search query
        const filteredCollections = this.allCollections.filter(collection => {
          const collectionTitle = collection.title.toLowerCase();
          const matchingProducts = collection.products.filter(product =>
            product.title.toLowerCase().includes(query)
          );

          // Include the collection if its title or any of its products match the query
          return collectionTitle.includes(query) || matchingProducts.length > 0;
        });

        // Update the UI with the filtered collections
        if(query === '') {
          this.contentContainer.classList.remove('none');
          this.fetchTabContent(tabId);
          noResults.classList.remove('active');
        }
        else if(filteredCollections.length < 1){
          this.contentContainer.classList.add('none');
          const message = noResults.querySelector('.manuals-no-search-message');
          message.innerHTML = `We cannot find <strong>“${query}”</strong>. Try searching again.`
          noResults.classList.add('active');
        }
        else {
          this.contentContainer.classList.remove('none');
          this.renderCollections(filteredCollections);
          noResults.classList.remove('active');
        }
      }

      renderCollections(collections) {
        // Render the filtered collections
        this.contentContainer.innerHTML = collections
          .map(
            collection => `
          <div class="manuals-list__container">
            <h3 class="manuals-list__title">${collection.title}</h3>
            <div class="manuals-list-inner">
              ${collection.products
                .map(
                  product => `
                <a class="manuals-list-item" href="${product.manual_file}" target="_blank">
                  ${product.title}
                </a>
              `
                )
                .join('')}
            </div>
          </div>
        `
          )
          .join('');
      }
    }
  );
}
