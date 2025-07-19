class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.allPredictiveSearchInstances = document.querySelectorAll('predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    // Configuration for default results
    this.defaultResources = {
      product: true,
      page: true,
      collection: true,
      article: true
    };

    // Fallback content for default view and API failures
    this.fallbackContent = `
      <div id="predictive-search-results" role="listbox">
        <div id="predictive-search-results-groups-wrapper" class="predictive-search__results-groups-wrapper">
          ${this.defaultResources.product ? `
            <div class="predictive-search__result-group">
              <h2 id="predictive-search-products" class="predictive-search__heading text-body caption-with-letter-spacing">
                Trending Products
              </h2>
              <ul id="predictive-search-results-products-list" class="predictive-search__results-list list-unstyled" role="group" aria-labelledby="predictive-search-products">
                <li id="predictive-search-option-product-1" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/products/sample-product-1" class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" tabindex="-1">
                    <img class="predictive-search__image" src="/path/to/placeholder-image.jpg" alt="Sample Product 1" width="50" height="50">
                    <div class="predictive-search__item-content">
                      <p class="predictive-search__item-heading h5">Sample Product 1</p>
                    </div>
                  </a>
                </li>
                <li id="predictive-search-option-product-2" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/products/sample-product-2" class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" tabindex="-1">
                    <img class="predictive-search__image" src="/path/to/placeholder-image.jpg" alt="Sample Product 2" width="50" height="50">
                    <div class="predictive-search__item-content">
                      <p class="predictive-search__item-heading h5">Sample Product 2</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
          ${this.defaultResources.page ? `
            <div class="predictive-search__result-group">
              <h2 id="predictive-search-pages" class="predictive-search__heading text-body caption-with-letter-spacing">
                Pages
              </h2>
              <ul id="predictive-search-results-pages-list" class="predictive-search__results-list list-unstyled" role="group" aria-labelledby="predictive-search-pages">
                <li id="predictive-search-option-page-1" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/pages/about-us" class="predictive-search__item link link--text" tabindex="-1">
                    <div class="predictive-search__item-content predictive-search__item-content--centered">
                      <p class="predictive-search__item-heading h5">About Us</p>
                    </div>
                  </a>
                </li>
                <li id="predictive-search-option-page-2" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/pages/contact" class="predictive-search__item link link--text" tabindex="-1">
                    <div class="predictive-search__item-content predictive-search__item-content--centered">
                      <p class="predictive-search__item-heading h5">Contact</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
          ${this.defaultResources.collection ? `
            <div class="predictive-search__result-group">
              <h2 id="predictive-search-collections" class="predictive-search__heading text-body caption-with-letter-spacing">
                Collections
              </h2>
              <ul id="predictive-search-results-collections-list" class="predictive-search__results-list list-unstyled" role="group" aria-labelledby="predictive-search-collections">
                <li id="predictive-search-option-collection-1" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/collections/all" class="predictive-search__item link link--text" tabindex="-1">
                    <div class="predictive-search__item-content predictive-search__item-content--centered">
                      <p class="predictive-search__item-heading h5">All Products</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
          ${this.defaultResources.article ? `
            <div class="predictive-search__result-group">
              <h2 id="predictive-search-articles" class="predictive-search__heading text-body caption-with-letter-spacing">
                Articles
              </h2>
              <ul id="predictive-search-results-articles-list" class="predictive-search__results-list list-unstyled" role="group" aria-labelledby="predictive-search-articles">
                <li id="predictive-search-option-article-1" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/blogs/news/sample-article" class="predictive-search__item link link--text" tabindex="-1">
                    <div class="predictive-search__item-content predictive-search__item-content--centered">
                      <p class="predictive-search__item-heading h5">Sample Article</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Fallback for no search results, including collections
    this.noResultsContent = `
      <div id="predictive-search-results" role="listbox">
        <div id="predictive-search-results-groups-wrapper" class="predictive-search__results-groups-wrapper">
          <div class="predictive-search__result-group">
            <p class="predictive-search__no-results">No results found for your search.</p>
          </div>
          ${this.defaultResources.collection ? `
            <div class="predictive-search__result-group">
              <h2 id="predictive-search-collections" class="predictive-search__heading text-body caption-with-letter-spacing">
                Collections
              </h2>
              <ul id="predictive-search-results-collections-list" class="predictive-search__results-list list-unstyled" role="group" aria-labelledby="predictive-search-collections">
                <li id="predictive-search-option-collection-1" class="predictive-search__list-item" role="option" aria-selected="false">
                  <a href="/collections/all" class="predictive-search__item link link--text" tabindex="-1">
                    <div class="predictive-search__item-content predictive-search__item-content--centered">
                      <p class="predictive-search__item-heading h5">All Products</p>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
    this.input.addEventListener('input', this.onChange.bind(this));
    this.addEventListener('loadDefaultResults', this.getDefaultResults.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const newSearchTerm = this.getQuery();
    console.log('onChange triggered with term:', newSearchTerm);

    // Clear previous results
    this.querySelector('#predictive-search-results-groups-wrapper')?.remove();
    this.predictiveSearchResults.innerHTML = '';

    this.updateSearchForTerm(this.searchTerm, newSearchTerm);
    this.searchTerm = newSearchTerm;

    if (!this.searchTerm) {
      console.log('Empty search term, fetching default results');
      this.getDefaultResults();
    } else {
      console.log('Fetching search results for:', this.searchTerm);
      this.getSearchResults(this.searchTerm);
    }
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector('[aria-selected="true"] a')) event.preventDefault();
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = '';
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
      console.log('Form reset, fetching default results');
      this.getDefaultResults();
    }
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();
    console.log('onFocus triggered, current term:', currentSearchTerm);
    if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getDefaultResults();
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    const query = this.getQuery();
    console.log('onKeyup triggered, query:', query);
    if (!query) {
      this.getDefaultResults();
      return;
    }
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up');
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector('[data-predictive-search-search-for-text]');
    const currentButtonText = searchForTextElement?.innerText;
    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, 'g')).length > 1) {
        return;
      }
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }

  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const selectedElement = this.querySelector('[aria-selected="true"]');
    const allVisibleElements = Array.from(this.querySelectorAll('li, button.predictive-search__item')).filter(
      (element) => element.offsetParent !== null
    );
    let activeElementIndex = 0;

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;

    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }

    this.statusElement.textContent = '';

    if (!moveUp && selectedElement) {
      activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];

    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedOption = this.querySelector('[aria-selected="true"] a, button[aria-selected="true"]');
    if (selectedOption) selectedOption.click();
  }

  getDefaultResults() {
    const queryKey = 'default';
    this.setLiveRegionLoadingState();
    console.log('Fetching default results');

    if (this.cachedResults[queryKey]) {
      console.log('Using cached default results');
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    // Check if predictive-search section exists
    const sectionExists = document.querySelector('#shopify-section-predictive-search') !== null;
    console.log('Predictive search section exists:', sectionExists);
    if (!sectionExists) {
      console.warn('Warning: predictive-search.liquid section is missing. Create it in Shopify admin > Online Store > Themes > Edit Code > Sections with ID "predictive-search" to enable API rendering.');
      this.renderSearchResults(this.fallbackContent);
      return;
    }

    const params = new URLSearchParams();
    params.set('q', '*');
    params.set('section_id', 'predictive-search');
    // Use string format per Shopify API docs
    const resourceTypes = [];
    if (this.defaultResources.product) resourceTypes.push('product');
    if (this.defaultResources.page) resourceTypes.push('page');
    if (this.defaultResources.collection) resourceTypes.push('collection');
    if (this.defaultResources.article) resourceTypes.push('article');
    if (resourceTypes.length > 0) params.set('resources[type]', resourceTypes.join(','));
    params.set('resources[limit]', '15'); // Increased to 5

    console.log('Default results API URL:', `${routes.predictive_search_url}?${params.toString()}`);

    fetch(`${routes.predictive_search_url}?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then((response) => {
        console.log('Default results API response status:', response.status);
        if (!response.ok) {
          console.error('Predictive search API error for default results:', response.status, response.statusText);
          return response.text().then((text) => {
            console.error('Raw error response body:', text);
            try {
              const json = JSON.parse(text);
              console.error('Parsed error response body:', JSON.stringify(json));
              console.log('API response resources:', json.resources || 'none');
            } catch (e) {
              console.error('Failed to parse error response as JSON:', e.message);
            }
            throw new Error(response.status);
          });
        }
        return response.text();
      })
      .then((text) => {
        console.log('Default results API response text length:', text.length);
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-predictive-search')?.innerHTML;
        if (!resultsMarkup || resultsMarkup.trim() === '') {
          console.warn('Predictive search API returned empty results for default query');
          this.renderSearchResults(this.fallbackContent);
          return;
        }
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        });
        console.log('Rendering default results');
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          console.log('Default results fetch aborted');
          return;
        }
        console.error('Error fetching default results:', error);
        this.renderSearchResults(this.fallbackContent);
        // Try minimal request
        this.tryMinimalDefaultRequest();
      });
  }

  tryMinimalDefaultRequest() {
    console.log('Attempting minimal default request');
    const params = new URLSearchParams();
    params.set('q', '*');
    params.set('resources[type]', 'product,page,collection,article');
    params.set('resources[limit]', '15'); // Increased to 5

    console.log('Minimal default results API URL:', `${routes.predictive_search_url}?${params.toString()}`);

    fetch(`${routes.predictive_search_url}?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then((response) => {
        console.log('Minimal default results API response status:', response.status);
        if (!response.ok) {
          console.error('Minimal predictive search API error:', response.status, response.statusText);
          return response.text().then((text) => {
            console.error('Raw error response body:', text);
            try {
              const json = JSON.parse(text);
              console.error('Parsed error response body:', JSON.stringify(json));
              console.log('API response resources:', json.resources || 'none');
            } catch (e) {
              console.error('Failed to parse error response as JSON:', e.message);
            }
            throw new Error(response.status);
          });
        }
        return response.text();
      })
      .then((text) => {
        console.log('Minimal default results API response text length:', text.length);
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-predictive-search')?.innerHTML;
        if (!resultsMarkup || resultsMarkup.trim() === '') {
          console.warn('Minimal predictive search API returned empty results');
          this.renderSearchResults(this.fallbackContent);
          return;
        }
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults['default'] = resultsMarkup;
        });
        console.log('Rendering minimal default results');
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          console.log('Minimal default results fetch aborted');
          return;
        }
        console.error('Error fetching minimal default results:', error);
        this.renderSearchResults(this.fallbackContent);
      });
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase();
    this.setLiveRegionLoadingState();
    console.log('Fetching search results for query:', searchTerm);

    // Temporarily disable caching
    // if (this.cachedResults[queryKey]) {
    //   console.log('Using cached results for:', queryKey);
    //   this.renderSearchResults(this.cachedResults[queryKey]);
    //   return;
    // }

    const params = new URLSearchParams();
    params.set('q', encodeURIComponent(searchTerm));
    params.set('section_id', 'predictive-search');
    // Use string format per Shopify API docs
    const resourceTypes = [];
    if (this.defaultResources.product) resourceTypes.push('product');
    if (this.defaultResources.page) resourceTypes.push('page');
    if (this.defaultResources.collection) resourceTypes.push('collection');
    if (this.defaultResources.article) resourceTypes.push('article');
    if (resourceTypes.length > 0) params.set('resources[type]', resourceTypes.join(','));
    params.set('resources[limit]', '15'); // Increased to 5

    console.log('Search results API URL:', `${routes.predictive_search_url}?${params.toString()}`);

    fetch(`${routes.predictive_search_url}?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then((response) => {
        console.log('Search results API response status:', response.status);
        if (!response.ok) {
          console.error('Predictive search API error for query:', searchTerm, 'Status:', response.status, response.statusText);
          return response.text().then((text) => {
            console.error('Raw error response body:', text);
            try {
              const json = JSON.parse(text);
              console.error('Parsed error response body:', JSON.stringify(json));
              console.log('API response resources:', json.resources || 'none');
            } catch (e) {
              console.error('Failed to parse error response as JSON:', e.message);
            }
            throw new Error(response.status);
          });
        }
        return response.text();
      })
      .then((text) => {
        console.log('Search results API response text length:', text.length);
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-predictive-search')?.innerHTML;
        if (!resultsMarkup || resultsMarkup.trim() === '') {
          console.warn('Predictive search API returned empty results for:', searchTerm);
          this.renderSearchResults(this.noResultsContent);
          return;
        }
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        });
        console.log('Rendering search results for:', searchTerm);
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          console.log('Search results fetch aborted for:', searchTerm);
          return;
        }
        console.error('Error fetching search results for:', searchTerm, 'Error:', error);
        this.renderSearchResults(this.noResultsContent);
        // Try minimal request
        this.tryMinimalSearchRequest(searchTerm);
      });
  }

  tryMinimalSearchRequest(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase();
    console.log('Attempting minimal search request for:', searchTerm);
    const params = new URLSearchParams();
    params.set('q', encodeURIComponent(searchTerm));
    params.set('resources[type]', 'product,page,collection,article');
    params.set('resources[limit]', '15'); // Increased to 5

    console.log('Minimal search results API URL:', `${routes.predictive_search_url}?${params.toString()}`);

    fetch(`${routes.predictive_search_url}?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then((response) => {
        console.log('Minimal search results API response status:', response.status);
        if (!response.ok) {
          console.error('Minimal predictive search API error for query:', searchTerm, 'Status:', response.status, response.statusText);
          return response.text().then((text) => {
            console.error('Raw error response body:', text);
            try {
              const json = JSON.parse(text);
              console.error('Parsed error response body:', JSON.stringify(json));
              console.log('API response resources:', json.resources || 'none');
            } catch (e) {
              console.error('Failed to parse error response as JSON:', e.message);
            }
            throw new Error(response.status);
          });
        }
        return response.text();
      })
      .then((text) => {
        console.log('Minimal search results API response text length:', text.length);
        const resultsMarkup = new DOMParser()
          .parseFromString(text, 'text/html')
          .querySelector('#shopify-section-predictive-search')?.innerHTML;
        if (!resultsMarkup || resultsMarkup.trim() === '') {
          console.warn('Minimal predictive search API returned empty results for:', searchTerm);
          this.renderSearchResults(this.noResultsContent);
          return;
        }
        this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        });
        console.log('Rendering minimal search results for:', searchTerm);
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          console.log('Minimal search results fetch aborted for:', searchTerm);
          return;
        }
        console.error('Error fetching minimal search results for:', searchTerm, 'Error:', error);
        this.renderSearchResults(this.noResultsContent);
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector('.predictive-search-status');
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');
    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;
    setTimeout(() => {
      this.statusElement.setAttribute('aria-hidden', 'true');
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    console.log('Rendering results (first 100 chars):', resultsMarkup.substring(0, 100) + '...');
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute('results', true);
    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector('[data-predictive-search-live-region-count-value]')?.textContent || 'Results loaded');
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight - document.querySelector('.section-header')?.getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
      console.log('Clearing search term, fetching default results');
      this.getDefaultResults();
    }
    const selected = this.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute('aria-selected', false);
    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('loading');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute('style');
  }
}

customElements.define('predictive-search', PredictiveSearch);