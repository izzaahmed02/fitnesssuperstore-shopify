if (!customElements.get('custom-manuals')) {
	customElements.define(
		'custom-manuals',
		class CustomManuals extends HTMLElement {
			constructor() {
				super();
				this.tabs = this.querySelectorAll('.custom-tab');
				this.filtersList = this.querySelector('.manuals-filters-list');
				this.resetButton = this.querySelector('.manuals-reset-button');
				this.resetSearchButton = this.querySelector('.manuals-search__reset-btn');
				this.contentContainer = this.querySelector('.manuals-content');
				this.loader = this.querySelector('.manuals-loader');
				this.paginationContainer = null;
				this.allCollections = [];


				// Bind methods
				this.resetFilters = this.resetFilters.bind(this);
				this.onChangeTab = this.onChangeTab.bind(this);
				this.onPaginate = this.onPaginate.bind(this);

				// Add event listeners
				this.resetButton.addEventListener('click', this.resetFilters);
				this.resetSearchButton.addEventListener('click', this.onSearch.bind(this, true));
				this.tabs.forEach(tab => tab.addEventListener('click', this.onChangeTab));

				// Attach search functionality
				this.searchInput = this.querySelector('.manuals-search__input');
				if (this.searchInput) {
					this.searchInput.addEventListener('input', this.onSearch.bind(this));
				}

				// Fetch default content for the first tab
				const defaultTab = this.tabs[0];

				if (defaultTab) {
					if (window.innerWidth <= 576) {
						defaultTab.querySelector('span').textContent = 'All';
					}
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

						this.loadMoreButtons = this.querySelectorAll('.manuals-load-more');
						if (this.loadMoreButtons.length > 0) {
							this.loadMoreButtons.forEach(button => {
								button.addEventListener('click', () => this.fetchMoreManuals(button,));
							});
						}
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

			async fetchMoreManuals(button) {
				const handle = button.getAttribute('data-handle');
				const currentPage = +button.getAttribute('data-current-page');

				if (!handle) {
					console.error('Collection handle is missing!');
					return;
				}

				// Build the URL with limit and offset
				const url = `/collections/${handle}?view=manual-item&page=${currentPage + 1}`;

				try {
					// Fetch products
					const response = await fetch(url);
					if (!response.ok) {
						throw new Error(`Error fetching products: ${response.statusText}`);
					}

					const data = await response.text();

					// Process the fetched data (e.g., render products on the page)
					this.manualListInner = this.querySelector(`[data-list-name="${handle}"`);
					// Parse the HTML string into a DOM object
					const parser = new DOMParser();
					const doc = parser.parseFromString(data, 'text/html');

					// Query the elements you need
					const items = doc.querySelectorAll('.manuals-list-item');
					const nextButton = doc.querySelector('.manuals-load-more');

					// Append these items to your container
					items.forEach(item => {
						this.manualListInner.appendChild(item);
					});

					// Disable the button if all products are loaded
					if (nextButton) {
						button.setAttribute('data-current-page', nextButton.getAttribute('data-current-page'));
					} else {
						button.style.display = "none";
					}
				} catch (error) {
					console.error('Error:', error);
				}
			}

			async onPaginate(event) {
				event.preventDefault();

				// Scroll to the top of the content container
				this.scrollToTop();

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
				this.dots = this.paginationContainer && this.paginationContainer.querySelector('[data-title="…"]');
				if (this.dots) {
					this.dots.classList.remove('current');
					this.dots.classList.add('dots');
				}

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

				this.resetButton.classList.remove('active');
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
					// Sort the collections alphabetically by title (A-Z)
					relatedCollectionsJson.sort((a, b) => a.title.localeCompare(b.title));

					let columns = 4; // По умолчанию 4 колонки

					const w = window.innerWidth;
					if (w <= 576) {
						columns = 2;
					} else if (w <= 1366) {
						columns = 3;
					}

					const rowCount = Math.ceil(relatedCollectionsJson.length / columns);
					this.filtersList.style.gridTemplateRows = `repeat(${rowCount}, auto)`;

					this.filtersList.innerHTML = '';
					relatedCollectionsJson.forEach(collection => {
						const collectionHTML = `
              <div class="manuals-filter-collection" data-title="${collection.title}" data-handle="${collection.handle}">
                ${collection.image && collection.image.src ?
							`<img class="manuals-filter-collection__img" src="${collection.image.src}" width="${collection.image.width || 'auto'}" />`
							: ''}
                <p class="manuals-filter-collection__title">${collection.title.replace('Manuals', '').replace('Assembly', '').replace('Owners', '').replace('All', '')}</p>
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

				this.onSearch(this, true)
				// this.fetchTabContent(tabId);
			}

			async getSelectedManualsList(selectedManualList) {
				const filterButtons = this.querySelectorAll('.manuals-filter-collection');
				filterButtons.forEach(button => button.classList.remove('filter-active'));

				const selectedFilter = this.querySelector(`[data-handle="${selectedManualList}"]`);
				const selectedFilterTitle = selectedFilter.dataset.title;
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
						this.loadMoreButtons = this.contentContainer.querySelectorAll('.manuals-load-more');
						if (this.loadMoreButtons.length > 0) {
							this.loadMoreButtons.forEach(button => {
								button.addEventListener('click', () => this.fetchMoreManuals(button));
							});
						}

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

			onSearch(event, resetQuery) {
				if (resetQuery) {
					this.searchInput.value = '';
				}
				const query = resetQuery ? '' : event.target.value.toLowerCase();
				const selectedTab = Array.from(this.tabs).find(tab => tab.classList.contains('tab-active'));
				const tabId = selectedTab.getAttribute('data-tab');
				const noResults = this.querySelector('.manuals-no-search-results');

				this.resetButton.classList.remove('active');
				this.resetSearchButton.classList.add('active');
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
				if (query === '') {
					this.contentContainer.classList.remove('none');
					this.resetSearchButton.classList.remove('active');
					this.fetchTabContent(tabId);
					noResults.classList.remove('active');
				} else if (filteredCollections.length < 1) {
					this.contentContainer.classList.add('none');
					this.resetButton.classList.add('active');
					const message = noResults.querySelector('.manuals-no-search-message');
					message.innerHTML = `We cannot find <strong>“${query}”</strong>. Try searching again.`
					noResults.classList.add('active');
				} else {
					this.resetButton.classList.add('active');
					this.contentContainer.classList.remove('none');
					this.renderCollections(filteredCollections);
					noResults.classList.remove('active');
				}
			}

			renderCollections(collections) {
				// Render the filtered collections
				this.contentContainer.innerHTML = `
          <div class="manuals-list__wrapper">
            ${collections.map(
					collection => `
                <div class="manuals-list__container">
                  <h3 class="manuals-list__title">${collection.title}</h3>
                  <div class="manuals-list-inner" data-list-name="${collection.handle}">
                    ${collection.products
						.map(
							product => `
                      <a class="manuals-list-item" href="${product.manual_file ? product.manual_file : product.manual_link}" target="_blank">
                        ${product.title}
                      </a>
                    `
						)
						.join('')}
                  </div>
                  ${collection.products_count > 50
						? `<button class="manuals-load-more" data-handle="${collection.handle}" data-product-count="${collection.products_count}" data-current-page="1">Show more manuals</button>`
						: ''
					}
                </div>
              `
				).join('')}
          </div>
        `;

				this.loadMoreButtons = this.querySelectorAll('.manuals-load-more');
				if (this.loadMoreButtons.length > 0) {
					this.loadMoreButtons.forEach(button => {
						button.addEventListener('click', () => this.fetchMoreManuals(button,));
					});
				}
			}

			scrollToTop() {
				const manualsList = this.querySelector('.manuals-main');
				const offset = 100;  // Adjust this value to control how much higher you want to scroll

				if (manualsList) {
					const topPosition = manualsList.getBoundingClientRect().top + window.scrollY - offset;
					window.scrollTo({top: topPosition, behavior: 'smooth'});
				} else {
					window.scrollTo({top: 0, behavior: 'smooth'});
				}
			}
		}
	);
}

