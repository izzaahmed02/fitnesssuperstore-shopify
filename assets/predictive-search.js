const STOREFRONT_API_URL = '/api/2023-07/graphql.json'; // Adjust API version
const STOREFRONT_ACCESS_TOKEN = 'c58409094793cba2fc6ce881d45d39f5';

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



class PredictiveSearch extends SearchForm {
  constructor() {
    super(); 
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.allPredictiveSearchInstances = document.querySelectorAll('predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
    this.input.addEventListener('input', debounce(this.onChange.bind(this), 250));
this.input.addEventListener('paste', () => {
  setTimeout(() => this.onChange(), 0);
});
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    super.onChange();
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      // Remove the results when they are no longer relevant for the new search term
      // so they don't show up when the dropdown opens again
      this.querySelector('#predictive-search-results-groups-wrapper')?.remove();
    }

    // Update the term asap, don't wait for the predictive search query to finish loading
    this.updateSearchForTerm(this.searchTerm, newSearchTerm);

    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(this.searchTerm);
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
    }
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      // Search term was changed from other search input, treat it as a user change
      this.onChange();
    } else if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
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
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
  const searchForTextElement = this.querySelector('[data-predictive-search-search-for-text]');
  const currentButtonText = searchForTextElement?.innerText;
  if (currentButtonText) {
    const safePrevTerm = escapeRegExp(previousTerm);
const matches = currentButtonText.match(new RegExp(safePrevTerm, 'gi'));
    if (matches && matches.length > 1) {
      // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
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

    // Filter out hidden elements (duplicated page and article resources) thanks
    // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
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

  getSearchResults(searchTerm) {
  const queryKey = searchTerm.replace(' ', '-').toLowerCase();
  this.setLiveRegionLoadingState();

  if (this.cachedResults[queryKey]) {
    this.renderSearchResults(this.cachedResults[queryKey]);
    return;
  }

  // --- Shopify Predictive Search ---
  const predictiveFetch = fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`, {
    signal: this.abortController.signal,
  })
  .then((response) => {
    if (!response.ok) throw new Error(response.status);
    return response.text();
  })
  .then((text) => {
    const section = new DOMParser()
      .parseFromString(text, 'text/html')
      .querySelector('#shopify-section-predictive-search');

    if (!section) return '';
    return section.innerHTML;
  });

  // --- Storefront API SKU Search ---
  const skuQuery = `
  query($term: String!) {
    products(first: 5, query: $term) {
      edges {
        node {
          id
          title
          handle
          productType
          tags
          variants(first: 1) {
            edges {
              node {
                sku
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          featuredImage {
            url
            altText
          }
        }
      }
    }
  }
`;


  const skuFetch = fetch(STOREFRONT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
    },
    body: JSON.stringify({
      query: skuQuery,
      variables: { term: `sku:${searchTerm.toUpperCase()}` } // 🔑 normalize to uppercase
    })
  })
  .then(res => res.json())
  .then(data => {
  if (!data.data?.products?.edges.length) return '';

  const excludedTypes = [
    "Avis-add-charge",
    "Custom Field More Info",
    "Option Category",
    "Product (Hidden)"
  ];

  const excludedTags = [
    "hidden",
    "draft",
    "avisplus-product-options",
    "about_option_categories"
  ];

  // Filter products
  const filteredProducts = data.data.products.edges.filter(({ node }) => {
    if (excludedTypes.includes(node.productType)) return false;
    if (node.tags.some(tag => excludedTags.includes(tag.toLowerCase()))) return false;
    return true;
  });

  if (!filteredProducts.length) return '';
  return this.renderSkuResults(filteredProducts);
});

  // --- Merge Results ---
  Promise.all([predictiveFetch, skuFetch])
  .then(([predictiveMarkup, skuMarkup]) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = predictiveMarkup || '';

    // Collect product handles already present in predictive search
    const seenHandles = new Set(
      Array.from(wrapper.querySelectorAll('#predictive-search-results-products-list li a'))
        .map(a => {
          const href = a.getAttribute('href') || '';
          return normalizeHandle(href);
        })
    );

    if (skuMarkup) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = skuMarkup;

      // Filter out duplicates by normalized handle
      const skuItems = Array.from(tempDiv.querySelectorAll('li')).filter(li => {
        const link = li.querySelector('a');
        if (!link) return false;
        const handle = normalizeHandle(link.getAttribute('href'));
        if (seenHandles.has(handle)) {
          return false; // already included from predictive search
        }
        seenHandles.add(handle);
        return true;
      });

      if (skuItems.length) {
        let productsList = wrapper.querySelector('#predictive-search-results-products-list');
        if (productsList) {
          skuItems.forEach(item => productsList.appendChild(item));
        } else {
          const newList = document.createElement('ul');
          newList.id = 'predictive-search-results-products-list';
          newList.className = 'predictive-search__list predictive-search__list--products';
          skuItems.forEach(item => newList.appendChild(item));
          wrapper.appendChild(newList);
        }
      }
    }

    const combinedMarkup = wrapper.innerHTML;

    this.allPredictiveSearchInstances.forEach((instance) => {
      instance.cachedResults[queryKey] = combinedMarkup;
    });

    this.renderSearchResults(combinedMarkup);
  })

  .catch((error) => {
    if (error?.code === 20) return; // aborted
    this.close();
    throw error;
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
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute('results', true);

    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector('[data-predictive-search-live-region-count-value]').textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight - document.querySelector('.section-header').getBoundingClientRect().bottom;
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
  renderSkuResults(products) {
  let html = '';

  products.forEach(({ node }, index) => {
    const variant = node.variants.edges[0]?.node;

    html += `
      <li id="predictive-search-option-sku-${index}" 
          class="predictive-search__list-item" 
          role="option" aria-selected="false">
        <a href="/products/${node.handle}" 
           class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" 
           tabindex="-1">
          ${node.featuredImage ? `
            <img class="predictive-search__image" 
                 src="${node.featuredImage.url}&width=150" 
                 alt="${node.featuredImage.altText || node.title}" 
                 width="50" />` : ''}

          <div class="predictive-search__item-content">
            <p class="predictive-search__item-heading h5">${node.title}</p>
            <div class="predictive-search__item-vendor">SKU: ${variant?.sku || ''}</div>
            <div class="price">
              <div class="price__container">
                <div class="price__regular">
                  <span class="visually-hidden visually-hidden--inline">Regular price</span>
                  <span class="price-item-fixed">
                    ${variant?.price?.amount ? `$${parseFloat(variant.price.amount).toLocaleString()} ${variant.price.currencyCode}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </li>
    `;
  });

  return html;
}
renderSkuResultsFromVariants(variants) {
  let html = '';

  variants.forEach(({ node }, index) => {
    const product = node.product;

    html += `
      <li id="predictive-search-option-sku-${index}" 
          class="predictive-search__list-item" 
          role="option" aria-selected="false">
        <a href="/products/${product.handle}" 
           class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" 
           tabindex="-1">
          ${product.featuredImage ? `
            <img class="predictive-search__image" 
                 src="${product.featuredImage.url}&width=150" 
                 alt="${product.featuredImage.altText || product.title}" 
                 width="50" />` : ''}

          <div class="predictive-search__item-content">
            <p class="predictive-search__item-heading h5">${product.title}</p>
            <div class="predictive-search__item-vendor">SKU: ${node.sku}</div>
            <div class="price">
              <div class="price__container">
                <div class="price__regular">
                  <span class="visually-hidden visually-hidden--inline">Regular price</span>
                  <span class="price-item-fixed">
                    ${node.price?.amount ? `$${parseFloat(node.price.amount).toLocaleString()} ${node.price.currencyCode}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </li>
    `;
  });

  return html;
}



}
function normalizeHandle(href) {
  try {
    // Remove query params, anchors, and leading `/products/`
    const url = new URL(href, window.location.origin);
    return url.pathname.replace(/^\/products\//, '').replace(/\/$/, '');
  } catch {
    return href.replace(/^\/products\//, '').split('?')[0].replace(/\/$/, '');
  }
}

customElements.define('predictive-search', PredictiveSearch);
