// Existing variables
let allProducts = [];
let productIndex = new Map();
let isFetching = false;
let isInitialFetchComplete = false;

let currentFilteredProducts = []; // Persist filtered products for rendering
const titleSelector = '.title';

// Updated cache key with new prefix
const CACHE_KEY = `products_index_${window.currentCollectionId || 'default'}`;
const CACHE_VERSION = '1.0';
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Define the GraphQL query
const GET_COLLECTION_PRODUCTS = `
  query GetCollectionProducts($collectionId: ID!, $first: Int!, $after: String) {
    collection(id: $collectionId) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            vendor
            availableForSale
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  sku
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "retail_price" },
              { namespace: "custom", key: "condition_state" },
              { namespace: "custom", key: "processing_time" },
              { namespace: "custom", key: "brand" }
            ]) {
              key
              value
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

function isCacheValid() {
  const cache = localStorage.getItem(CACHE_KEY);
  if (!cache) return false;
  try {
    const { version, data, timestamp } = JSON.parse(cache);
    const now = Date.now();
    return (
      version === CACHE_VERSION &&
      Array.isArray(data) &&
      data.length > 0 &&
      timestamp &&
      now - timestamp < CACHE_TTL
    );
  } catch (e) {
    console.warn('Invalid cache format:', e);
    return false;
  }
}

function saveToCache(products) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, data: products, timestamp: Date.now() })
    );
    console.log('Saved to cache with key:', CACHE_KEY);
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
}

// Function to clear old cache entries with the previous key format
function clearOldCache() {
  const oldCacheKey = `products_${window.currentCollectionId || 'default'}`;
  if (oldCacheKey !== CACHE_KEY) {
    localStorage.removeItem(oldCacheKey);
    console.log('Cleared old cache key:', oldCacheKey);
  }
}

function getPaginationState(filteredCount = null) {
  const currentURLParams = new URLSearchParams(window.location.search);
  const page = parseInt(currentURLParams.get('page')) || 1;
  const viewParam = currentURLParams.get('view') || document.querySelector('#sel1')?.value?.replace('?view=', '') || '30';
  const itemsPerPage = parseInt(viewParam) || 30;
  return { page, itemsPerPage, totalProducts: filteredCount || allProducts.length || 1 };
}

function getCountRange(page, itemsPerPage, totalProducts) {
  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalProducts);
  return totalProducts > 0 ? `${start}-${end} of ${totalProducts}` : '0 of 0';
}

function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-descending':
      return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    case 'price-ascending':
      return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(a.price));
    case 'title-descending':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'title-ascending':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'best-selling':
      return sorted;
    case 'manual':
      return sorted;
    default:
      console.warn(`Unknown sort_by value: ${sortBy}, defaulting to manual`);
      return sorted;
  }
}



function highlightSearchTerm(title, searchText) {
  if (!searchText) return title;
  const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return title.replace(regex, '<mark>$1</mark>');
}

function getActiveFilters() {
  const currentURLParams = new URLSearchParams(window.location.search);
  const filters = {};

  currentURLParams.forEach((value, key) => {
    if (key.startsWith('filter.')) {
      const filterKey = key.replace('filter.', '');
      if (!filters[filterKey]) filters[filterKey] = [];
      filters[filterKey].push(value);
    }
  });

  const form = document.getElementById('FacetFiltersForm') || document.getElementById('FacetFiltersFormMobile');
  if (form) {
    const minInput = form.querySelector('#price-range-min');
    const maxInput = form.querySelector('#price-range-max');
    if (minInput && maxInput) {
      const minValue = parseFloat(minInput.value) || 0;
      const maxValue = parseFloat(maxInput.value) || parseFloat(maxInput.getAttribute('max')) || Infinity;
      const minDefault = parseFloat(minInput.getAttribute('min')) || 0;
      const maxDefault = parseFloat(maxInput.getAttribute('max')) || Infinity;
      if (minValue !== minDefault && minValue !== 0) {
        filters['v.price.gte'] = [minValue.toString()];
      }
      if (maxValue !== maxDefault && maxValue !== Infinity) {
        filters['v.price.lte'] = [maxValue.toString()];
      }
    }
    const checkboxes = form.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      const key = checkbox.name.replace('filter.', '');
      if (!filters[key]) filters[key] = [];
      if (!filters[key].includes(checkbox.value)) {
        filters[key].push(checkbox.value);
      }
    });
  }

  return filters;
}

// Utility to apply filters to products

function applyFilters(products, filters) {

  return products.filter(product => {

    let passes = true;

    Object.entries(filters).forEach(([key, values]) => {

      if (key === 'v.price.gte') {

        const minPrice = parseFloat(values[0]);

        if (parseFloat(product.price) < minPrice) passes = false;

      } else if (key === 'v.price.lte') {

        const maxPrice = parseFloat(values[0]);

        if (parseFloat(product.price) > maxPrice) passes = false;

      } else if (key === 'p.m.custom.brand') {

        const productBrand = product.metafields?.brand?.toLowerCase() || product.vendor?.toLowerCase();

        if (productBrand && !values.map(v => v.toLowerCase()).includes(productBrand)) {

          passes = false;

        }

      } else if (key === 'v.availability') {

        const availability = product.availableForSale ? 'instock' : 'outofstock';

        if (!values.map(v => v.toLowerCase()).includes(availability.toLowerCase())) {

          passes = false;

        }

      } else {

        // Handle other filters (e.g., product_type, custom metafields)

        const filterKey = key.split('.').pop();

        const productValue = product[filterKey] || product.metafields?.[filterKey]?.toLowerCase();

        if (productValue && !values.map(v => v.toLowerCase()).includes(productValue.toLowerCase())) {

          passes = false;

        }

      }

    });

    return passes;

  });

}


function renderPagination(totalProducts, itemsPerPage, currentPage) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) {
    console.warn('Pagination container not found');
    return;
  }

  const totalPages = Math.ceil(totalProducts / itemsPerPage) || 1;
  pagination.innerHTML = '';
  pagination.style.display = 'flex';

  const currentURLParams = new URLSearchParams(window.location.search);
  const searchParams = new URLSearchParams();
  currentURLParams.forEach((value, key) => {
    if (key !== 'page') searchParams.set(key, value);
  });

  const prevLi = document.createElement('li');
  prevLi.className = `page ${currentPage === 1 ? 'disabled' : ''}`;
  const prevLink = document.createElement('a');
  prevLink.className = 'page-link';
  prevLink.href = currentPage > 1 ? `?${searchParams.toString()}&page=${currentPage - 1}` : '#';
  prevLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967Z" fill="#CCCCCC"></path></svg>';
  prevLink.setAttribute('aria-label', 'Previous page');
  prevLi.appendChild(prevLink);
  pagination.appendChild(prevLi);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstLi = document.createElement('li');
    firstLi.className = 'page';
    const firstLink = document.createElement('a');
    firstLink.className = 'page-link';
    firstLink.href = `?${searchParams.toString()}&page=1`;
    firstLink.textContent = '1';
    firstLink.setAttribute('aria-label', 'Page 1');
    firstLi.appendChild(firstLink);
    pagination.appendChild(firstLi);

    if (startPage > 2) {
      const ellipsis = document.createElement('li');
      ellipsis.className = 'page disabled';
      ellipsis.innerHTML = '<span class="page-link">...</span>';
      pagination.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageLi = document.createElement('li');
    pageLi.className = `page ${i === currentPage ? 'current' : ''}`;
    const pageLink = document.createElement('a');
    pageLink.className = 'page-link';
    pageLink.href = `?${searchParams.toString()}&page=${i}`;
    pageLink.textContent = i;
    pageLink.setAttribute('aria-label', `Page ${i}`);
    pageLi.appendChild(pageLink);
    pagination.appendChild(pageLi);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('li');
      ellipsis.className = 'page disabled';
      ellipsis.innerHTML = '<span class="page-link">...</span>';
      pagination.appendChild(ellipsis);
    }

    const lastLi = document.createElement('li');
    lastLi.className = 'page';
    const lastLink = document.createElement('a');
    lastLink.className = 'page-link';
    lastLink.href = `?${searchParams.toString()}&page=${totalPages}`;
    lastLink.textContent = totalPages;
    lastLink.setAttribute('aria-label', `Page ${totalPages}`);
    lastLi.appendChild(lastLink);
    pagination.appendChild(lastLi);
  }

  const nextLi = document.createElement('li');
  nextLi.className = `page ${currentPage === totalPages ? 'disabled' : ''}`;
  const nextLink = document.createElement('a');
  nextLink.className = 'page-link';
  nextLink.href = currentPage < totalPages ? `?${searchParams.toString()}&page=${currentPage + 1}` : '#';
  nextLink.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="#ca4b23"></path></svg>';
  nextLink.setAttribute('aria-label', 'Next page');
  nextLi.appendChild(nextLink);
  pagination.appendChild(nextLi);

  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.parentElement.classList.contains('disabled')) return;
      const url = new URL(link.href);
      const newParams = url.search.slice(1);
      FacetFiltersForm.updateURLHash(newParams);
      setTimeout(() => {
        window.location.href = url.toString();
      }, 100);
    });
  });

  const searchText = currentURLParams.get('q') || '';
  const searchInput = document.getElementById("search-input");
  const searchInputMobile = document.getElementById("search-input-mobile");
  if (searchText) {
    if (searchInput) searchInput.value = decodeURIComponent(searchText);
    if (searchInputMobile) searchInputMobile.value = decodeURIComponent(searchText);
  }
}

class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      console.log('debouncedOnSubmit triggered for form:', this.id);
      const form = event.target.closest('form');
      if (!form) return;
      if (event.target.id === 'SortBy' || event.target.id === 'SortByDrawer') return;
      let searchParams = this.createSearchParams(form);
      this.onSubmitForm(searchParams, event);
    }, 500);

    const facetForms = this.querySelectorAll('form');
    facetForms.forEach(facet => {
      facet.addEventListener('input', (e) => {
        const target = e.srcElement;
        if (target.classList.contains('mobile-facets__checkbox') || target.classList.contains('field__input') || target.closest('.mobile-price-range')) return;
        if (target.type === "checkbox") this.debouncedOnSubmit(e);
        else if (target.className !== "filterSearchInput") this.debouncedOnSubmit(e);
      });
    });

    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-input-mobile');
    if (searchInput) {
      searchInput.removeEventListener("input", filterProducts);
      searchInput.addEventListener("input", debounce(filterProducts, 500));
      console.log('Attached input event listener to #search-input');
    }
    if (searchInputMobile) {
      searchInputMobile.removeEventListener("input", filterProducts);
      searchInputMobile.addEventListener("input", debounce(filterProducts, 500));
      console.log('Attached input event listener to #search-input-mobile');
    }

    const textLabels = document.querySelectorAll(".facet-checkbox__text-label");
    textLabels.forEach(element => {
      element.textContent = decodeHTML(element.innerHTML);
    });

    if (!isInitialFetchComplete) {
      fetchAllProducts();
    }
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true, callback) {
    if (FacetFiltersForm.isRendering) return;
    FacetFiltersForm.isRendering = true;

    clearTimeout(FacetFiltersForm.renderTimeout);
    FacetFiltersForm.renderTimeout = setTimeout(() => {
      FacetFiltersForm.isRendering = false;
    }, 1000);

    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll('.facets-container .loading__spinner, facet-filters-form .loading__spinner');

    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    const collection = document.getElementById('ProductGridContainer')?.querySelector('.collection');
    if (collection) collection.classList.add('loading');
    if (countContainer) countContainer.classList.add('loading');
    if (countContainerDesktop) countContainerDesktop.classList.add('loading');

    const currentURLParams = new URLSearchParams(searchParams);
    const searchText = (
      currentURLParams.get('q') ||
      document.getElementById('search-input')?.value ||
      document.getElementById('search-input-mobile')?.value ||
      ''
    ).trim().toLowerCase();

    const serverParams = new URLSearchParams(searchParams);
    serverParams.delete('q');
    const sortBy = currentURLParams.get('sort_by') || document.querySelector('.facet-filters__sort')?.value || 'manual';
    if (sortBy && !serverParams.has('sort_by')) serverParams.set('sort_by', sortBy);

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${serverParams.toString()}`;
      const filterDataUrl = (element) => element.url === url;
      if (FacetFiltersForm.filterData.some(filterDataUrl)) {
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event, searchText);
      } else {
        FacetFiltersForm.renderSectionFromFetch(url, event, searchText);
      }
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    if (callback) requestAnimationFrame(() => callback());
  }

  static renderSectionFromFetch(url, event, searchText = '') {
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.text();
      })
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html, searchText);
        FacetFiltersForm.renderProductCount(html, searchText);
        document.querySelectorAll(titleSelector).forEach((elem) => {
          if (elem.tagName === 'A') {
            const url = new URL(elem.href, window.location.origin);
            url.search = '';
            elem.href = url.toString();
          } else {
            const link = elem.querySelector('a');
            if (link) {
              const url = new URL(link.href, window.location.origin);
              url.search = '';
              link.href = url.toString();
            }
          }
        });
        document.dispatchEvent(new CustomEvent('facet:updated'));
      })
      .catch((error) => {
        console.error('Error fetching section:', error, 'URL:', url);
        showErrorMessage('Failed to load products. Please try again.');
      });
  }

  static renderSectionFromCache(filterDataUrl, event, searchText = '') {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html, searchText);
    FacetFiltersForm.renderProductCount(html, searchText);
    document.querySelectorAll(titleSelector).forEach((elem) => {
      if (elem.tagName === 'A') {
        const url = new URL(elem.href, window.location.origin);
        url.search = '';
        elem.href = url.toString();
      } else {
        const link = elem.querySelector('a');
        if (link) {
          const url = new URL(link.href, window.location.origin);
          url.search = '';
          link.href = url.toString();
        }
      }
    });
    document.dispatchEvent(new CustomEvent('facet:updated'));
  }

  static renderProductGridContainer(html, searchText = '') {
  const productGridContainer = document.getElementById('ProductGridContainer');
  if (!productGridContainer) return;
  const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
  const newGrid = parsedHTML.getElementById('ProductGridContainer');
  if (!newGrid) return;
  productGridContainer.innerHTML = newGrid.innerHTML;

  // Apply client-side search filtering if searchText is present

  if (allProducts.length > 0) {

    const filters = getActiveFilters();

    let filteredProducts = applyFilters(allProducts, filters);

    if (searchText) {

      filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(searchText));

    }

    const sortBy = new URLSearchParams(window.location.search).get('sort_by') || 

                  document.querySelector('.facet-filters__sort')?.value || 

                  'manual';

    currentFilteredProducts = sortProducts(filteredProducts, sortBy);

    const { page, itemsPerPage } = getPaginationState(currentFilteredProducts.length);

    const start = (page - 1) * itemsPerPage;

    const end = Math.min(start + itemsPerPage, currentFilteredProducts.length);

    const visibleProducts = currentFilteredProducts.slice(start, end);



    const productGrid = document.getElementById('product-grid');

    if (productGrid) {

      productGrid.innerHTML = '';

      if (currentFilteredProducts.length === 0 && searchText) {

        productGrid.innerHTML = '<li>No products found.</li>';

      } else {

        const fragment = document.createDocumentFragment();

        visibleProducts.forEach(product => {

          fragment.appendChild(renderProduct(product, searchText));

        });

        productGrid.appendChild(fragment);

      }

    }

  } else if (!searchText && Object.keys(getActiveFilters()).length === 0) {

    // No search and no filters: use server-fetched HTML

    currentFilteredProducts = sortProducts(allProducts, new URLSearchParams(window.location.search).get('sort_by') || 

                                          document.querySelector('.facet-filters__sort')?.value || 'manual');

  }



  //if (typeof window.initializeSliders === 'function') window.initializeSliders();

  const perPageSelect = document.querySelector('#sel1');
  if (perPageSelect) {
    perPageSelect.removeEventListener('change', handlePerPageChange);
    perPageSelect.addEventListener('change', debounce(handlePerPageChange, 500));
  }
}

  static renderProductCount(html, searchText = '') {
  const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
  const countContainer = document.getElementById('ProductCount');
  const countContainerDesktop = document.getElementById('ProductCountDesktop');
  const collecionCountContainer = document.querySelector('.collecion-count');

   let filteredProducts = allProducts;

  let totalProducts = allProducts.length || 1;

  

  // Apply filters and search client-side

  const filters = getActiveFilters();

  if (Object.keys(filters).length > 0 || searchText) {

    filteredProducts = applyFilters(allProducts, filters);

    if (searchText) {

      filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(searchText));

    }

    totalProducts = filteredProducts.length || 1;

  }

  

  const sortBy = new URLSearchParams(window.location.search).get('sort_by') || 

                document.querySelector('.facet-filters__sort')?.value || 

                'manual';

  currentFilteredProducts = sortProducts(filteredProducts, sortBy);

  

  // Use filteredProducts.length for count, fallback to allProducts.length if no results

  const displayTotal = (searchText && totalProducts === 1 && currentFilteredProducts.length === 0) ? allProducts.length || 1 : totalProducts;

  const { page, itemsPerPage } = getPaginationState(displayTotal);

  const countText = currentFilteredProducts.length > 0 ? getCountRange(page, itemsPerPage, displayTotal) : `0 of ${displayTotal}`;

  
  if (countContainer) {
    countContainer.innerHTML = countText;
    countContainer.classList.remove('loading');
  }
  if (countContainerDesktop) {
    countContainerDesktop.innerHTML = countText;
    countContainerDesktop.classList.remove('loading');
  }
  if (collecionCountContainer) {
    collecionCountContainer.innerHTML = `<span>${countText}</span>`;
  }

  document.querySelectorAll('.facets-container .loading__spinner, facet-filters-form .loading__spinner')
    .forEach((spinner) => spinner.classList.add('hidden'));

  //const { page, itemsPerPage, totalProducts } = getPaginationState();
  renderPagination(displayTotal, itemsPerPage, page);
}

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({id}) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      if (currentElement) {
        currentElement.innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const {className: previousElementClassName, id: previousElementId} = facetsToRender[index - 1];
          if (elementToRender.className === previousElementClassName) {
            const prevElement = document.getElementById(previousElementId);
            if (prevElement) {
              prevElement.after(elementToRender);
              return;
            }
          }
        }
        const parent = elementToRender.parentElement?.id;
        if (parent) {
          const target = document.querySelector(`#${parent} .js-filter`);
          if (target) target.before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    const headingCount = document.querySelector('.heading-filter-count');
    if (headingCount) {
      let selectedFiltersCount = 0;
      facetDetailsElementsFromFetch.forEach((element) => {
        if (element.id.includes('price')) {
          const minInput = element.querySelector('#price-range-min');
          const maxInput = element.querySelector('#price-range-max');
          if (minInput && maxInput) {
            const isPriceFilterDefault =
              minInput.value === minInput.getAttribute('min') &&
              maxInput.value === maxInput.getAttribute('max');
            if (!isPriceFilterDefault) selectedFiltersCount++;
          }
        } else {
          const activeCheckboxes = element.querySelectorAll('input[type="checkbox"]:checked');
          selectedFiltersCount += activeCheckboxes.length;
        }
      });
      headingCount.textContent = selectedFiltersCount > 0 ? `(${selectedFiltersCount})` : '';
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];
    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      const currentElement = document.querySelector(selector);
      if (activeFacetsElement && currentElement) {
        currentElement.innerHTML = activeFacetsElement.innerHTML;
      }
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];
    mobileElementSelectors.forEach((selector) => {
      const sourceElement = html.querySelector(selector);
      const targetElement = document.querySelector(selector);
      if (sourceElement && targetElement) {
        targetElement.innerHTML = sourceElement.innerHTML;
      }
    });

    const menuDrawer = document.getElementById('FacetFiltersFormMobile')?.closest('menu-drawer');
    if (menuDrawer) menuDrawer.bindEvents();
  }

  static renderCounts(source, target) {

    const targetSummary = target.querySelector('.facets__summary');

    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) targetSummary.outerHTML = sourceSummary.outerHTML;

    const targetHeaderElement = target.querySelector('.facets__header');

    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;

    const targetWrapElement = target.querySelector('.facets-wrap');

    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {

      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));

      if (isShowingMore) {

        sourceWrapElement

          .querySelectorAll('.facets__item.hidden')

          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));

      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;

    }

  }



  static renderMobileCounts(source, target) {

    const targetFacetsList = target.querySelector('.mobile-facets__list');

    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) targetFacetsList.outerHTML = sourceFacetsList.outerHTML;

  }

  static updateURLHash(searchParams) {
    const url = new URL(window.location);
    if (searchParams && searchParams.length > 0) {
      url.search = searchParams;
    } else {
      const currentParams = new URLSearchParams(window.location.search);
      const preservedParams = new URLSearchParams();
      if (currentParams.get('view')) preservedParams.set('view', currentParams.get('view'));
      else {
        const perPageSelect = document.querySelector('#sel1');
        if (perPageSelect) preservedParams.set('view', perPageSelect.value.replace('?view=', ''));
      }
      if (currentParams.get('sort_by')) preservedParams.set('sort_by', currentParams.get('sort_by'));
      else {
        const sortSelect = document.querySelector('.facet-filters__sort');
        if (sortSelect) preservedParams.set('sort_by', sortSelect.value || 'manual');
      }
      if (currentParams.get('q')) preservedParams.set('q', currentParams.get('q'));
    }
    history.pushState({searchParams: searchParams}, '', url.toString());
    console.log('Updated URL:', url.toString());
  }

  static getSections() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return [];
    return [{ section: productGrid.dataset.id }];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    const searchParams = new URLSearchParams();
    const currentURLParams = new URLSearchParams(window.location.search);
    const minInput = form.querySelector('#price-range-min');
    const maxInput = form.querySelector('#price-range-max');

    const paramGroups = {};
    for (let [key, value] of formData) {
      if (!paramGroups[key]) paramGroups[key] = [];
      paramGroups[key].push(value);
    }

    Object.entries(paramGroups).forEach(([key, values]) => {
      if (key === 'filter.v.price.gte' || key === 'filter.v.price.lte') {
        if (minInput && maxInput) {
          const minValue = parseFloat(minInput.value) || 0;
          const maxValue = parseFloat(maxInput.value) || 0;
          const minDefault = parseFloat(minInput.getAttribute('min')) || 0;
          const maxDefault = parseFloat(maxInput.getAttribute('max')) || 0;
          if (minValue !== 0 || maxValue !== 0) {
            if (minValue !== minDefault || maxValue !== maxDefault) {
              searchParams.set(key, values[0]);
            }
          }
        }
      } else {
        values.forEach(value => searchParams.append(key, value));
      }
    });

    const sortBy = currentURLParams.get('sort_by') ||
                   form.querySelector('.facet-filters__sort')?.value || 'manual';
    if (sortBy) searchParams.set('sort_by', sortBy);

    const viewParam = currentURLParams.get('view');
    if (viewParam) searchParams.set('view', viewParam);
    else {
      const perPageSelect = document.querySelector('#sel1');
      if (perPageSelect) searchParams.set('view', perPageSelect.value.replace('?view=', '') || '30');
    }

    const searchText = (
      document.getElementById('search-input')?.value ||
      document.getElementById('search-input-mobile')?.value ||
      ''
    ).trim();
    if (searchText) searchParams.set('q', searchText);
    else searchParams.delete('q');

    return searchParams.toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const currentURLParams = new URLSearchParams(window.location.search);
    const perview = currentURLParams.get('perview');

    if (event.srcElement.classList.contains('mobile-facets__checkbox')) {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      if (perview) {
        const updatedParams = new URLSearchParams(searchParams);
        updatedParams.set('perview', perview);
        this.onSubmitForm(updatedParams.toString(), event);
      } else {
        this.onSubmitForm(searchParams, event);
      }
    } else {
      const allParams = new URLSearchParams();
      const currentForm = event.target.closest('form');
      if (currentForm) {
        const currentFormParams = new URLSearchParams(this.createSearchParams(currentForm));
        currentFormParams.forEach((value, key) => allParams.append(key, value));
      }

      currentURLParams.forEach((value, key) => {
        if (key !== 'page' && !allParams.has(key)) allParams.append(key, value);
      });

      if (perview) allParams.set('perview', perview);
      this.onSubmitForm(allParams.toString(), event);
    }
  }
onActiveFilterClick(event) {

  event.preventDefault();

  FacetFiltersForm.toggleActiveFacets();

  let url = event.currentTarget.href.indexOf('?') === -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);

  

  const currentURLParams = new URLSearchParams(window.location.search);

  const searchText = currentURLParams.get('q') || (

    document.getElementById('search-input')?.value ||

    document.getElementById('search-input-mobile')?.value ||

    ''

  ).trim();

  

  const newParams = new URLSearchParams(url);

  const sortBy = currentURLParams.get('sort_by') || document.querySelector('.facet-filters__sort')?.value || 'manual';

  const viewParam = currentURLParams.get('view') || document.querySelector('#sel1')?.value?.replace('?view=', '') || '30';

  if (sortBy && !newParams.has('sort_by')) newParams.set('sort_by', sortBy);

  if (viewParam && !newParams.has('view')) newParams.set('view', viewParam);

  if (searchText && !newParams.has('q')) newParams.set('q', searchText);

  newParams.forEach((value, key) => {

    if (key.startsWith('filter.')) newParams.delete(key);

  });

  

  const filterForms = [

    document.getElementById('FacetFiltersForm'),

    document.getElementById('FacetFiltersFormMobile')

  ];

  filterForms.forEach(form => {

    if (form) {

      form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {

        checkbox.checked = false;

      });

      const minSlider = form.querySelector('#price-range-min');

      const maxSlider = form.querySelector('#price-range-max');

      const minTextInput = form.querySelector('.field__input.price-range-min');

      const maxTextInput = form.querySelector('.field__input.price-range-max');

      if (minSlider && maxSlider) {

        const minDefault = parseFloat(minSlider.getAttribute('min')) || 0;

        const maxDefault = parseFloat(maxSlider.getAttribute('max')) || 18999;

        minSlider.value = minDefault;

        maxSlider.value = maxDefault;

        if (minTextInput) minTextInput.value = minDefault;

        if (maxTextInput) maxTextInput.value = maxDefault;

        const priceRangeSlider = form.querySelector('price-range-slider');

        if (priceRangeSlider) priceRangeSlider.updateSliderBackground();

      }

    }

  });

  

  FacetFiltersForm.renderPage(newParams.toString() || '');

}
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
FacetFiltersForm.isRendering = false;
FacetFiltersForm.renderTimeout = null;
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

function showErrorMessage(message) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-message';
  errorContainer.style.cssText = 'color: red; padding: 10px; text-align: center;';
  errorContainer.textContent = message;
  const productGrid = document.getElementById('product-grid');
  if (productGrid) productGrid.prepend(errorContainer);
  setTimeout(() => errorContainer.remove(), 5000);
}

// Modified fetchAllProducts to clear old cache before fetching or loading
async function fetchAllProducts() {
  if (isFetching) {
    console.log('fetchAllProducts already in progress');
    return;
  }

  // Clear old cache entries to prevent stale data
  clearOldCache();

  if (isCacheValid()) {
    allProducts = JSON.parse(localStorage.getItem(CACHE_KEY)).data;
    productIndex.clear();
    allProducts.forEach(product => {
      productIndex.set(product.title.trim().toLowerCase(), product);
    });
    isInitialFetchComplete = true;
    console.log('Loaded products from cache:', allProducts.length, 'Cache key:', CACHE_KEY);
    return;
  }

  isFetching = true;
  allProducts = [];
  productIndex.clear();

  try {
    const collectionId = window.currentCollectionId;
    const shopifyDomain = window.shopifyDomain || '79ef8b-5e.myshopify.com';
    const storefrontToken = window.shopifyStorefrontToken;
    if (!collectionId || !shopifyDomain || !storefrontToken) {
      throw new Error('Missing required variables: collectionId, shopifyDomain, or storefrontToken');
    }

    let hasNextPage = true;
    let afterCursor = null;
    const first = 250;
    let retryCount = 0;
    const maxRetries = 3;

    while (hasNextPage && retryCount < maxRetries) {
      try {
        const response = await fetch(`https://${shopifyDomain}/api/2024-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontToken,
          },
          body: JSON.stringify({
            query: GET_COLLECTION_PRODUCTS,
            variables: { collectionId, first, after: afterCursor },
          }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.status}`);
        }

        const { data, errors } = await response.json();
        if (errors) throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`);

        const products = data?.collection?.products?.edges || [];
        const pageInfo = data?.collection?.products?.pageInfo || {};

        products.forEach(({ node, cursor }) => {
          if (!node.variants?.edges?.[0]?.node || !node.title) return;

          const productName = node.title.trim().toLowerCase();
          if (!productIndex.has(productName)) {
            const metafields = {};
            node.metafields?.forEach((metafield) => {
              if (metafield) metafields[metafield.key] = metafield.value;
            });

            const product = {
              id: node.id,
              handle: node.handle,
              title: node.title,
              vendor: node.vendor,
              url: `/products/${node.handle}`,
              availableForSale: node.availableForSale,
              price: node.variants.edges[0].node.price.amount,
              currency: node.variants.edges[0].node.price.currencyCode,
              sku: node.variants.edges[0].node.sku || '',
              retailPrice: metafields.retail_price ? parseFloat(metafields.retail_price) / 100 : null,
              condition: metafields.condition_state,
              processingTime: metafields.processing_time,
              brand: metafields.brand || node.vendor,
              metafields: metafields,
            };

            allProducts.push(product);
            productIndex.set(productName, product);
          }
        });

        hasNextPage = pageInfo.hasNextPage;
        afterCursor = pageInfo.endCursor;
        retryCount = 0;
      } catch (error) {
        console.error('Fetch attempt failed:', error);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          continue;
        } else {
          throw error;
        }
      }
    }

    saveToCache(allProducts);
    console.log('Total unique products fetched and cached:', allProducts.length, 'Cache key:', CACHE_KEY);
    isInitialFetchComplete = true;
  } catch (error) {
    console.error('Error in fetchAllProducts:', error);
    isInitialFetchComplete = false;
    showErrorMessage('Failed to load products. Displaying cached or partial data.');
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.innerHTML = "<li>Failed to load products. Please try again later.</li>";
    }
    const productItems = document.querySelectorAll("#product-grid li");
    productItems.forEach(product => {
      const titleElement = product.querySelector(titleSelector);
      const productName = titleElement?.textContent.trim().toLowerCase();
      if (titleElement && productName && !productIndex.has(productName)) {
        const productData = {
          id: product.dataset.productId || `gid://shopify/Product/${Date.now()}`,
          title: titleElement.textContent,
          vendor: product.querySelector('.vendor')?.textContent || '',
          handle: product.querySelector('a')?.href.split('/').pop() || '',
          url: `/products/${product.querySelector('a')?.href.split('/').pop() || ''}`,
          price: parseFloat(product.querySelector('.product-index-item__price')?.textContent?.replace('$', '')) || 0,
          currency: 'USD',
          sku: product.querySelector('.product-index-item__sku')?.textContent || '',
          availableForSale: product.querySelector('.availability')?.textContent?.toLowerCase().includes('in stock') || false,
  
        };
        allProducts.push(productData);
        productIndex.set(productName, productData);
      }
    });
    saveToCache(allProducts);
    console.log('Fallback to DOM products:', allProducts.length, 'Cache key:', CACHE_KEY);
  } finally {
    isFetching = false;
  }
}

function reattachSortListeners() {
  const sortSelects = document.querySelectorAll('.facet-filters__sort');
  const debouncedHandleSortChange = debounce(handleSortChange, 500);
  sortSelects.forEach((sortSelect) => {
    sortSelect.removeEventListener('change', debouncedHandleSortChange);
    sortSelect.addEventListener('change', (event) => {
      event.preventDefault();
      event.stopPropagation();
      debouncedHandleSortChange(event);
    });
    console.log('Reattached sort listener to:', sortSelect.id || sortSelect);
  });
}

function renderProduct(product, searchText = '') {
  const productElement = document.createElement('li');
  productElement.classList.add('product-item');

  const price = product.price;
  const currency = product.currency;
  const sku = product.sku;
  const displayTitle = highlightSearchTerm(product.title.replace(/(Remanufactured|New)$/i, '').trim(), searchText);

  const productHtml = `
    <div class="product-index-item" data-product-id="${product.id.split('/').pop()}">
      ${sku ? `<span class="product-index-item__sku">${sku}</span>` : ''}
      <div class="product-index-item__scrollable">
        <span class="product-index-item__price">$${price}</span>
        <a href="/products/${product.handle}" class="product-index-item__title restock-rocket-collection-rendered">${displayTitle}</a>
      </div>
    </div>
  `;
  productElement.innerHTML = productHtml;
  return productElement;
}

async function filterProducts(event) {
  console.log('filterProducts triggered with event:', event ? event.target.id : 'no event');
  if (!isInitialFetchComplete) {
    console.log('Fetching all products for search...');
    await fetchAllProducts();
  }

  if (allProducts.length === 0) {

    console.warn('No products available for search');

    const productGrid = document.getElementById('product-grid');

    if (productGrid) productGrid.innerHTML = "<li>No products found.</li>";

    const collecionCountContainer = document.querySelector('.collecion-count');

    if (collecionCountContainer) {

      collecionCountContainer.innerHTML = `<span>0 of ${allProducts.length || 1}</span>`;

    }

    const pagination = document.querySelector('.pagination');

    if (pagination) pagination.style.display = 'none';

    return;

  }

  // Use input value if event is from search input, otherwise check URL

  let searchText = '';

  let isSearchChanged = false;

  const currentURLParams = new URLSearchParams(window.location.search);
 

  const previousSearchText = currentURLParams.get('q') || '';

  if (event && (event.target.id === 'search-input' || event.target.id === 'search-input-mobile')) {

    searchText = event.target.value.trim().toLowerCase();

    isSearchChanged = searchText !== previousSearchText.trim().toLowerCase();

  } else {

    searchText = (

      document.getElementById('search-input')?.value ||

      document.getElementById('search-input-mobile')?.value ||

      currentURLParams.get('q') ||

      ''

    ).trim().toLowerCase();

  }

  console.log('Search text:', searchText, 'Search changed:', isSearchChanged);



  const productGrid = document.getElementById('product-grid');

  if (!productGrid) {

    console.warn('Product grid not found');

    return;

  }



  const sortBy = currentURLParams.get('sort_by') || document.querySelector('.facet-filters__sort')?.value || 'manual';

  console.log('Sort by:', sortBy);



  // Apply all filters (price, vendor, availability, etc.) before search

  const filters = getActiveFilters();

  let filteredProducts = applyFilters(allProducts, filters);

  if (searchText) {

    filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(searchText));

  }

  currentFilteredProducts = sortProducts(filteredProducts, sortBy);

  updateFilterCounts(currentFilteredProducts);



  // Only update price sliders if an explicit price filter is active

  if (filters['v.price.gte'] || filters['v.price.lte']) {

   // updatePriceRangeSliders(currentFilteredProducts);

    console.log('Updated price sliders due to active price filter');

  } else {

    // Ensure sliders are at default values if no price filter

   /* const priceRangeForms = [

      document.getElementById('FacetFiltersForm'),

      document.getElementById('FacetFiltersFormMobile'),

    ];

    priceRangeForms.forEach(form => {

      if (!form) return;

      const minSlider = form.querySelector('#price-range-min');

      const maxSlider = form.querySelector('#price-range-max');

      const minTextInput = form.querySelector('.field__input.price-range-min');

      const maxTextInput = form.querySelector('.field__input.price-range-max');

      if (minSlider && maxSlider) {

        const minDefault = parseFloat(minSlider.getAttribute('min')) || 0;

        const maxDefault = parseFloat(maxSlider.getAttribute('max')) || 18999;

        minSlider.value = minDefault;

        maxSlider.value = maxDefault;

        if (minTextInput) minTextInput.value = minDefault;

        if (maxTextInput) maxTextInput.value = maxDefault;

        const priceRangeSlider = form.querySelector('price-range-slider');

        if (priceRangeSlider) priceRangeSlider.updateSliderBackground();

      }

    });

    console.log('Ensured price sliders at default values (no price filter active)');

    */

  }



  console.log('Filtered products count:', currentFilteredProducts.length);



  // Update URL to include q parameter, sort_by, view, and filters

  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, values]) => {

    values.forEach(value => searchParams.append(`filter.${key}`, value));

  });

  if (sortBy) searchParams.set('sort_by', sortBy);

  const viewParam = currentURLParams.get('view') || document.querySelector('#sel1')?.value?.replace('?view=', '') || '30';

  if (viewParam) searchParams.set('view', viewParam);
  if (searchText) {
    searchParams.set('q', searchText);
  } else {
    searchParams.delete('q');
  }
  const { page, itemsPerPage } = getPaginationState(currentFilteredProducts.length);

  if (isSearchChanged) {

    searchParams.delete('page');

    console.log('Reset pagination to page 1 due to search term change');

  } else if (page > 1 && page <= Math.ceil(currentFilteredProducts.length / itemsPerPage)) {

    searchParams.set('page', page);

  } else {

    searchParams.delete('page');

  }

  FacetFiltersForm.updateURLHash(searchParams.toString());

  console.log('Updated search params:', searchParams.toString());



  // Incremental DOM rendering

  productGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();

  const start = (isSearchChanged ? 0 : (page - 1) * itemsPerPage);

  const end = Math.min(start + itemsPerPage, currentFilteredProducts.length);

  const visibleProducts = currentFilteredProducts.slice(start, end);



  console.log(`Rendering ${visibleProducts.length} products for page ${isSearchChanged ? 1 : page}`);

  visibleProducts.forEach(product => {

    fragment.appendChild(renderProduct(product, searchText));

  });



  productGrid.appendChild(fragment);

  if (typeof window.initializeSliders === 'function') window.initializeSliders();



  // Update count for search results

  const collecionCountContainer = document.querySelector('.collecion-count');

  if (collecionCountContainer) {

    const totalProducts = currentFilteredProducts.length || 1;

    const countText = currentFilteredProducts.length > 0 ? getCountRange(isSearchChanged ? 1 : page, itemsPerPage, totalProducts) : `0 of ${allProducts.length || 1}`;

    collecionCountContainer.innerHTML = `<span>${countText}</span>`;

    console.log('Updated collection count:', countText);

  }



  // Render pagination for search results

  renderPagination(currentFilteredProducts.length, itemsPerPage, isSearchChanged ? 1 : page);



  // Update search input fields only if searchText is non-empty

  const searchInput = document.getElementById('search-input');

  const searchInputMobile = document.getElementById('search-input-mobile');

  if (searchText) {

    if (searchInput) {

      searchInput.value = searchText;

      console.log('Set #search-input value:', searchText);

    }

    if (searchInputMobile) {

      searchInputMobile.value = searchText;

      console.log('Set #search-input-mobile value:', searchText);

    }

  } else {

    if (searchInput) {

      searchInput.value = '';

      console.log('Cleared #search-input value');

    }

    if (searchInputMobile) {

      searchInputMobile.value = '';

      console.log('Cleared #search-input-mobile value');

    }

  }



  // Trigger facet:updated for consistency

  document.dispatchEvent(new CustomEvent('facet:updated'));

  console.log('Dispatched facet:updated event');
}

function updateFilterCounts(filteredProducts) {
  const filterForms = [
    document.getElementById('FacetFiltersForm'),
    document.getElementById('FacetFiltersFormMobile'),
  ];

  filterForms.forEach(form => {
    if (!form) return;

    const filterDetails = form.querySelectorAll('.js-filter');
    filterDetails.forEach(details => {
      const filterName = details.id.replace('Details-', '').replace('Details-Mobile-', '').split('-')[0];
      const filterItems = details.querySelectorAll('.facets__item, .mobile-facets__item');

      const valueCounts = {};
      filteredProducts.forEach(product => {
        let filterValue;
        if (filterName === 'p.m.custom.brand') {
          filterValue = (product.metafields?.brand || product.vendor)?.toLowerCase();
        } else if (filterName === 'v.availability') {
          filterValue = product.availableForSale ? 'instock' : 'outofstock';
        } else {
          filterValue = product[filterName.split('.').pop()]?.toLowerCase() || product.metafields?.[filterName.split('.').pop()]?.toLowerCase();
        }
        if (filterValue) {
          valueCounts[filterValue] = (valueCounts[filterValue] || 0) + 1;
        }
      });
    });
  });
}

function handlePerPageChange(event) {
  const viewValue = event.target.value.replace('?view=', '');
  const currentURLParams = new URLSearchParams(window.location.search);
  const filterForm = document.getElementById('FacetFiltersForm') || document.getElementById('FacetFiltersFormMobile');
  const facetFiltersForm = document.querySelector('facet-filters-form');
  let searchParams = new URLSearchParams();

  if (facetFiltersForm && filterForm) {
    searchParams = new URLSearchParams(facetFiltersForm.createSearchParams(filterForm));
  } else {
    currentURLParams.forEach((value, key) => {
      if (key.startsWith('filter.') || key === 'q') searchParams.append(key, value);
    });
  }

  searchParams.set('view', viewValue);
  const sortBy = currentURLParams.get('sort_by') || document.querySelector('.facet-filters__sort')?.value || 'manual';
  if (sortBy) searchParams.set('sort_by', sortBy);
  searchParams.delete('page');
  FacetFiltersForm.renderPage(searchParams.toString(), event);
}

function handleSortChange(event) {
  const currentURLParams = new URLSearchParams(window.location.search);
  const filterForm = document.getElementById('FacetFiltersForm') || document.getElementById('FacetFiltersFormMobile');
  const facetFiltersForm = document.querySelector('facet-filters-form');
  const searchText = (
    document.getElementById('search-input')?.value ||
    document.getElementById('search-input-mobile')?.value ||
    currentURLParams.get('q') ||
    ''
  ).trim().toLowerCase();

  const sortBy = event.target.value;
  currentURLParams.set('sort_by', sortBy);
  let searchParams = new URLSearchParams();

  if (facetFiltersForm && filterForm) {
    searchParams = new URLSearchParams(facetFiltersForm.createSearchParams(filterForm));
  } else {
    currentURLParams.forEach((value, key) => {
      if (key.startsWith('filter.') || key === 'q') searchParams.append(key, value);
    });
  }

  searchParams.set('sort_by', sortBy);
  let viewParam = currentURLParams.get('view');
  if (!viewParam) {
    const perPageSelect = document.querySelector('#sel1');
    viewParam = perPageSelect ? perPageSelect.value.replace('?view=', '') : '30';
  }
  if (viewParam) searchParams.set('view', viewParam);
  if (searchText) searchParams.set('q', searchText);
  searchParams.delete('page');

  FacetFiltersForm.updateURLHash(searchParams.toString());

  if (allProducts.length > 0) {
    const filters = getActiveFilters();
    let filteredProducts = applyFilters(allProducts, filters);
    if (searchText) {
      filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(searchText));
    }
    filteredProducts = sortProducts(filteredProducts, sortBy);
    currentFilteredProducts = filteredProducts;

    const { page, itemsPerPage } = getPaginationState(filteredProducts.length);
    const start = (page - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, filteredProducts.length);
    const visibleProducts = filteredProducts.slice(start, end);

    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      visibleProducts.forEach(product => {
        fragment.appendChild(renderProduct(product, searchText));
      });
      productGrid.appendChild(fragment);
    }

    const collecionCountContainer = document.querySelector('.collecion-count');
    if (collecionCountContainer) {
      const totalProducts = filteredProducts.length || 1;
      const countText = filteredProducts.length > 0 ? getCountRange(page, itemsPerPage, totalProducts) : `0 of ${allProducts.length || 1}`;
      collecionCountContainer.innerHTML = `<span>${countText}</span>`;
      console.log('Updated collection count after sort:', countText);
    }
    renderPagination(filteredProducts.length, itemsPerPage, page);
    document.dispatchEvent(new CustomEvent('facet:updated'));
  }

  if (!searchText) {
    FacetFiltersForm.renderPage(searchParams.toString(), event, true);
  }
}

document.querySelectorAll('.button--primary.apply-filters-mobile').forEach((btn) => {
  const form = btn.closest('form');
  if (!form) return;
  btn.addEventListener('click', (event) => {
    const minInput = form.querySelector('#price-range-min');
    const maxInput = form.querySelector('#price-range-max');
    let isPriceFilterDefault = false;
    if (minInput && maxInput) {
      isPriceFilterDefault =
        minInput.value === minInput.getAttribute('min') &&
        maxInput.value === maxInput.getAttribute('max');
    }
    if (isPriceFilterDefault) {
      const searchParams = new URLSearchParams(new FormData(form));
      searchParams.delete(minInput?.name);
      searchParams.delete(maxInput?.name);
      const searchText = (
        document.getElementById('search-input')?.value ||
        document.getElementById('search-input-mobile')?.value ||
        ''
      ).trim();
      if (searchText) searchParams.set('q', searchText);
      FacetFiltersForm.renderPage(searchParams.toString(), event);
    } else {
      const searchParams = form.closest('facet-filters-form')?.createSearchParams(form);
      FacetFiltersForm.renderPage(searchParams, event);
    }
  });
});

const sortSelects = document.querySelectorAll('.facet-filters__sort');
const debouncedHandleSortChange = debounce(handleSortChange, 500);
sortSelects.forEach((sortSelect) => {
  sortSelect.removeEventListener('change', debouncedHandleSortChange);
  sortSelect.addEventListener('change', (event) => {
    event.preventDefault();
    event.stopPropagation();
    debouncedHandleSortChange(event);
  });
});

document.querySelectorAll(".filterSearchInput").forEach((input) => {
  input.addEventListener("input", function () {
    const query = input.value.toLowerCase();
    const filterWrap = input.closest(".facets-wrap");
    if (!filterWrap) return;
    const filterItems = filterWrap.querySelectorAll(".facets__item");
    filterItems.forEach((item) => {
      const labelText = item.querySelector(".facet-checkbox__text-label")?.innerText.toLowerCase();
      if (labelText && labelText.includes(query)) {
        item.setAttribute("style", "display:block!important");
      } else {
        item.style.display = "none";
      }
    });
  });
});

class PriceRangeSlider extends HTMLElement {
  constructor() {
    super();
    requestAnimationFrame(() => this.init());
  }

  init() {
    this.textInputs = this.querySelectorAll('.field__input');
    this.minSlider = this.querySelector('#price-range-min');
    this.maxSlider = this.querySelector('#price-range-max');
    if (!this.minSlider || !this.maxSlider) return;

    this.minSlider.style.visibility = 'visible';
    this.maxSlider.style.visibility = 'visible';

    const minDefault = parseFloat(this.minSlider.getAttribute('min')) || 0;
    const maxDefault = parseFloat(this.maxSlider.getAttribute('max')) || 18999;
    const minValue = parseFloat(this.minSlider.value) || minDefault;
    const maxValue = parseFloat(this.maxSlider.value) || maxDefault;

    const currentURLParams = new URLSearchParams(window.location.search);
    const hasPriceFilter = currentURLParams.has('filter.v.price.gte') || currentURLParams.has('filter.v.price.lte');
    if (!hasPriceFilter) {
      this.minSlider.value = minDefault;
      this.maxSlider.value = maxDefault;
      if (this.textInputs.length > 0) this.textInputs[0].value = minDefault;
      if (this.textInputs.length > 1) this.textInputs[1].value = maxDefault;
    } else {
      this.minSlider.value = minValue;
      this.maxSlider.value = maxValue;
      if (this.textInputs.length > 0) this.textInputs[0].value = minValue;
      if (this.textInputs.length > 1) this.textInputs[1].value = maxValue;
    }

    this.minSlider.addEventListener('input', this.updateMinValue.bind(this));
    this.maxSlider.addEventListener('input', this.updateMaxValue.bind(this));
    this.textInputs.forEach((input) => {
      input.addEventListener('change', this.syncTextInputs.bind(this));
    });

    [this.minSlider, this.maxSlider].forEach(slider => {
      slider.addEventListener('change', () => {
        const form = this.closest('form');
        if (form) {
          const event = new Event('input', { bubbles: true });
          form.dispatchEvent(event);
        }
      });
    });

    this.updateSliderBackground();
  }

  updateMinValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    if (minValue > maxValue) this.minSlider.value = maxValue;
    if (this.textInputs.length > 0) this.textInputs[0].value = this.minSlider.value;
    this.updateSliderBackground();
  }

  updateMaxValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    if (maxValue < minValue) this.maxSlider.value = minValue;
    if (this.textInputs.length > 1) this.textInputs[1].value = this.maxSlider.value;
    this.updateSliderBackground();
  }

  syncTextInputs() {
    const minValue = Number(this.textInputs[0]?.value);
    const maxValue = Number(this.textInputs[1]?.value);
    if (!isNaN(minValue) && minValue >= 0 && minValue <= maxValue) this.minSlider.value = minValue;
    if (!isNaN(maxValue) && maxValue >= minValue) this.maxSlider.value = maxValue;
    this.updateSliderBackground();
  }

  updateSliderBackground() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    const rangeMax = Number(this.maxSlider.max) || 100;
    const fromPosition = (minValue / rangeMax) * 100;
    const toPosition = (maxValue / rangeMax) * 100;
    const gradient = `linear-gradient(to right, #C6C6C6 0%, #C6C6C6 ${fromPosition}%, #ca4b23 ${fromPosition}%, #ca4b23 ${toPosition}%, #C6C6C6 ${toPosition}%, #C6C6C6 100%)`;
    this.minSlider.style.background = gradient;
    this.maxSlider.style.background = gradient;
  }
}

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    if (!facetLink) return;
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.removeFacet.bind(this));
    facetLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.removeFacet(event);
      }
    });
  }

  removeFacet(event) {
    event.preventDefault();
    const facetFiltersForm = document.querySelector('facet-filters-form');
    if (facetFiltersForm) facetFiltersForm.onActiveFilterClick(event);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  customElements.define('price-range-slider', PriceRangeSlider);
  customElements.define('facet-remove', FacetRemove);

  const elements = document.querySelectorAll('.product-index-item__title');
  elements.forEach((elem) => {
    if (elem.tagName === 'A') {
      const url = new URL(elem.href, window.location.origin);
      url.search = '';
      elem.href = url.toString();
    } else {
      const link = elem.querySelector('a');
      if (link) {
        const url = new URL(link.href, window.location.origin);
        url.search = '';
        link.href = url.toString();
      }
    }
  });

  const perPageSelect = document.querySelector('#sel1');
  if (perPageSelect) {
    perPageSelect.removeEventListener('change', handlePerPageChange);
    perPageSelect.addEventListener('change', debounce(handlePerPageChange, 300));
    console.log('Attached event listener for #sel1');
  }

  const currentURLParams = new URLSearchParams(window.location.search);
  const searchQuery = currentURLParams.get('q');
  if (searchQuery) {
    const searchInput = document.getElementById('search-input');
    const searchInputMobile = document.getElementById('search-input-mobile');
    if (searchInput) {
      searchInput.value = decodeURIComponent(searchQuery);
      console.log('Initialized #search-input with query:', searchQuery);
    }
    if (searchInputMobile) {
      searchInputMobile.value = decodeURIComponent(searchQuery);
      console.log('Initialized #search-input-mobile with query:', searchQuery);
    }
    filterProducts({ target: searchInput || searchInputMobile });
  }
});

document.addEventListener('facet:updated', () => {
  requestAnimationFrame(() => {
    const collecionCountContainer = document.querySelector('.collecion-count');
    if (collecionCountContainer) {
      const searchText = (
        document.getElementById('search-input')?.value ||
        document.getElementById('search-input-mobile')?.value ||
        ''
      ).trim().toLowerCase();
      const filters = getActiveFilters();
      let filteredProducts = allProducts;
      let totalProducts = allProducts.length || 1;

      if (Object.keys(filters).length > 0 || searchText) {
        filteredProducts = applyFilters(allProducts, filters);
        if (searchText) {
          filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(searchText));
        }
        totalProducts = filteredProducts.length || 1;
      }

      const { page, itemsPerPage } = getPaginationState(totalProducts);
      const countText = totalProducts > 0 ? getCountRange(page, itemsPerPage, totalProducts) : '0 of 0';
      collecionCountContainer.innerHTML = `<span>${countText}</span>`;
    }
  });
  reattachSortListeners();
});

function debounce(func, delay) {
  let debounceTimeout;
  return function (...args) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func.apply(this, args), delay);
  };
}

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function runTests() {
  const tests = [
    {
      name: 'Test Initial Sort By',
      run: () => {
        const sortSelect = document.querySelector('#SortBy');
        if (!sortSelect) return { pass: false, message: 'SortBy select not found' };

        sortSelect.value = 'price-ascending';
        const sortEvent = new Event('change', { bubbles: true });
        sortSelect.dispatchEvent(sortEvent);

        return new Promise(resolve => {
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const sortBy = urlParams.get('sort_by');
            const products = document.querySelectorAll('#product-grid li.product-item');
            const prices = Array.from(products).map(p => {
              const priceText = p.querySelector('.product-index-item__price')?.textContent?.replace('$', '').split(' ')[0];
              return priceText ? parseFloat(priceText) : 0;
            });
            const isSorted = prices.every((price, i) => i === 0 || price >= prices[i - 1]);

            resolve({
              pass: sortBy === 'price-ascending' && isSorted,
              message: `Initial sort by price-ascending: sortBy=${sortBy}, isSorted=${isSorted}`
            });
          }, 1000);
        });
      }
    },
    {
      name: 'Test Sort By with Filter Applied',
      run: () => {
        const form = document.getElementById('FacetFiltersForm');
        if (!form) return { pass: false, message: 'FacetFiltersForm not found' };

        const brandCheckbox = form.querySelector('input[name="filter.p.m.custom.brand"][value="Life Fitness"]');
        if (brandCheckbox) brandCheckbox.checked = true;
        const filterEvent = new Event('input', { bubbles: true });
        if (brandCheckbox) brandCheckbox.dispatchEvent(filterEvent);

        const sortSelect = form.querySelector('#SortBy');
        sortSelect.value = 'price-ascending';
        const sortEvent = new Event('change', { bubbles: true });
        sortSelect.dispatchEvent(sortEvent);

        return new Promise(resolve => {
          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const sortBy = urlParams.get('sort_by');
            const filterApplied = urlParams.has('filter.p.m.custom.brand');
            const products = document.querySelectorAll('#product-grid li.product-item');
            const prices = Array.from(products).map(p => {
              const priceText = p.querySelector('.product-index-item__price')?.textContent?.replace('$', '').split(' ')[0];
              return priceText ? parseFloat(priceText) : 0;
            });
            const isSorted = prices.every((price, i) => i === 0 || price >= prices[i - 1]);

            resolve({
              pass: sortBy === 'price-ascending' && filterApplied && isSorted,
              message: `Sort by price-ascending with filter: sortBy=${sortBy}, filterApplied=${filterApplied}, isSorted=${isSorted}`
            });
          }, 1000);
        });
      }
    }
  ];

  tests.forEach(async (test) => {
    const result = await test.run();
    console.log(`${test.name}: ${result.pass ? 'PASS' : 'FAIL'} - ${result.message}`);
  });
}