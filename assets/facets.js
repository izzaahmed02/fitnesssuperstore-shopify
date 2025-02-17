
let allProducts = [];
let debounceTimeout;
let productNames = new Set();

class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
        
        this.onSubmitHandler(event);

    }, 800); 

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', (e) => {
      const target = e.srcElement;
    
      if (target.classList.contains('mobile-facets__checkbox') || target.closest('.mobile-price-range')) {
        return; 
      }
    
      if (target.type === "checkbox") {
        this.onSubmitHandler(e);

      } else if (target.className !== "filterSearchInput") {
        this.debouncedOnSubmit(e);
      }
    });

    const searchInput = document.getElementById("search-input");

    if (searchInput) {
      searchInput.removeEventListener("input", filterProducts);
      searchInput.addEventListener("input", debounce(filterProducts, 300));
    }

    document.querySelectorAll(".facet-checkbox__text-label").forEach(element => {
        element.textContent = decodeHTML(element.innerHTML);
    });

    function decodeHTML(html) {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    }
  
    function fetchAllProducts() {
      const collectionUrl = window.location.pathname + "?view=99999";
      fetch(collectionUrl)
        .then(response => response.text())
        .then(html => {

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const productItems = doc.querySelectorAll("#product-grid li");
  
          productItems.forEach(product => {
            const productName = product.querySelector('.product-item .title').textContent.trim().toLowerCase();
                    
            if (!productNames.has(productName)) {
              productNames.add(productName);
              allProducts.push(product.cloneNode(true));
            }
          });

          updatePriceFilter(productItems);
        });
    }
  
    function filterProducts(event) {
      const searchText = document.getElementById('search-input').value.toLowerCase();

      if (!searchText) {
          const searchParams = new URLSearchParams(window.location.search) ?? FacetFiltersForm.searchParamsInitial;
          FacetFiltersForm.renderPage(searchParams, event);
          return;
      }

      const productGrid = document.getElementById('product-grid');
  
      productGrid.innerHTML = ""; 
  
      const filteredProducts = allProducts.filter(product => {
        const productName = product.querySelector('.product-item .title').textContent.toLowerCase();
        return productName.includes(searchText);
      });
  
      if (filteredProducts.length > 0) {
        filteredProducts.forEach(product => {
          productGrid.appendChild(product);
        });
        initSlidersBatch();
      } else {
        productGrid.innerHTML = "<li>No products found.</li>";
      }
    }

    function initSlidersBatch() {
      const products = document.querySelectorAll('#product-grid li');
      if (!products.length) return;
  
      let index = 0;
      const batchSize = 5; 
      const delay = 200; 
  
      function processBatch() {
          requestAnimationFrame(() => {
              for (let i = 0; i < batchSize && index < products.length; i++, index++) {
                  const product = products[index];
                  if (product) {
                      initSlider(product.querySelector('.product-item .image-wrap'));
                  }
              }
          });
  
          if (index < products.length) {
              setTimeout(processBatch, delay); 
          }
      }
  
      processBatch();
  }
  
    function debounce(func, delay) {
      return function (...args) {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => func.apply(this, args), delay);
      };
    }
  
    fetchAllProducts();
  
    const priceFilterDropdown = document.getElementById("price-filter-dropdown");
  
    if (priceFilterDropdown) {
      priceFilterDropdown.removeEventListener("change", filterProductsByPrice);
      priceFilterDropdown.addEventListener("change", filterProductsByPrice);
      setActivePriceFilter();
    }

    function getUrlPriceParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        gte: params.get("filter.v.price.gte"),
        lte: params.get("filter.v.price.lte"),
      };
    }

    function setActivePriceFilter() {
      const { gte, lte } = getUrlPriceParams();
      let selectedValue = "";
  
      if (gte === "1000" && lte === "2000") {
        selectedValue = "1000-2000";
      } else if (gte === "2000" && lte === "3000") {
        selectedValue = "2000-3000";
      } else if (gte === "3000") {
        selectedValue = "3000-";
      } else if (lte === "1000") {
        selectedValue = "0-1000";
      }
  
      if (selectedValue) {
        priceFilterDropdown.value = selectedValue;
      }
    }  

    function filterProductsByPrice(event) {
      const selectedOption = priceFilterDropdown.options[priceFilterDropdown.selectedIndex];
      const url = selectedOption.getAttribute("data-url");

      if (url) {
        history.pushState({ url }, '', `${window.location.pathname}${url && '?'.concat(url)}`);
      }
    }

    function updatePriceFilter(products) {
      let priceCounts = {
          "0-1000": 0,
          "1000-2000": 0,
          "2000-3000": 0,
          "3000-": 0
      };

      products.forEach(product => {
          let priceText = product.querySelector(".price-wrapper")?.textContent || "";
          let price = parseFloat(priceText.replace(/[^0-9.]/g, "")); 

          if (!isNaN(price)) {
              if (price < 1000) priceCounts["0-1000"]++;
              else if (price >= 1000 && price < 2000) priceCounts["1000-2000"]++;
              else if (price >= 2000 && price < 3000) priceCounts["2000-3000"]++;
              else priceCounts["3000-"]++;
          }
      });

      document.querySelectorAll("#price-filter-dropdown option").forEach(option => {
          let value = option.value;
          if (priceCounts[value] !== undefined) {
              option.textContent = `${option.textContent.split(" (")[0]} (${priceCounts[value]})`;
          }
      });
  }
    
    const applyButton = document.querySelectorAll('.button--primary.apply-filters-mobile');
    
      applyButton.forEach((btn) => {
        const form = btn.closest('form');
        
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
            searchParams.delete(minInput.name);
            searchParams.delete(maxInput.name);
            FacetFiltersForm.renderPage(searchParams.toString(), event);
          } else {
            FacetFiltersForm.renderPage(this.createSearchParams(form), event);
          }
          document.querySelector('body').classList.remove('overflow-hidden-mobile');
        });
      });

    document.querySelector('.sort-per-page select.num').addEventListener('change', function(){
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(window.location.search);

      searchParams.delete('page');
      searchParams.set('perview', this.value.split('=')[1]);
      url.search = searchParams.toString();

      window.location.replace(url.toString());
    });
    
    const searchInputs = document.querySelectorAll(".filterSearchInput");
    searchInputs.forEach((input) => {
      input.addEventListener("input", function () {
        const query = input.value.toLowerCase();
        const filterWrap = input.closest(".facets-wrap");
        const filterItems = filterWrap.querySelectorAll(".facets__item");
  
        filterItems.forEach((item) => {
          const labelText = item.querySelector(".facet-checkbox__text-label").innerText.toLowerCase();
          if (labelText.includes(query)) {
            item.setAttribute("style","display:block!important");
          } else {
            item.style.display = "none";
          }
        });
      });
    });

    function initSlider(element) {
      if (!$(element).hasClass('slick-initialized')) {
    $(element).slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      arrows: true,
      dots: true,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1
          }
        }
      ],
      
    });

      $(element).find('img.lazy-load').each(function() {
          const img = $(this);
        if(img){
          img.attr('src', img.data('src'));
          img.removeClass('lazy-load'); 
          img.css({
            'opacity': '1',
            'visibility': 'visible'
          });
        }
      });
      }
    }
  
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initSlider(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.8 });
  
    $('.image-wrap').each(function() {
      if ($(this).length > 0) {
      observer.observe(this);
      }
    });

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
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

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    // Remove facets that are no longer returned from the server
    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
          ? `.mobile-facets__close-button`
          : `.facets__summary`;
        const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

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

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    if (searchParams.size > 0) {
      history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    }
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
  event.preventDefault();
  const sortFilterForms = document.querySelectorAll('facet-filters-form form');
  const currentURLParams = new URLSearchParams(window.location.search); 
  const perview = currentURLParams.get('perview'); 

  if (event.srcElement.className == 'mobile-facets__checkbox') {
    const searchParams = this.createSearchParams(event.target.closest('form'));
    if (perview) {
     
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.set('perview', 18);
      this.onSubmitForm(updatedParams.toString(), event);
    } else {
      this.onSubmitForm(searchParams, event);
    }
  } else {
    const forms = [];
    const isMobile = event.target?.closest('form')?.id === 'FacetFiltersFormMobile';

    sortFilterForms.forEach((form) => {
      if (!isMobile) {
        if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
          forms.push(this.createSearchParams(form));
        }
      } else if (form.id === 'FacetFiltersFormMobile') {
        forms.push(this.createSearchParams(form));
      }
    });

    let finalParams = forms.join('&');
    if (perview) {
      
      const updatedParams = new URLSearchParams(finalParams);
      updatedParams.set('perview', perview);
      finalParams = updatedParams.toString();
    }

    if (window.location.search.includes('price')) {
      this.onSubmitForm(currentURLParams + '&' + finalParams, event);
    } else {
      this.onSubmitForm(finalParams, event);
    }
  }
}

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRangeSlider extends HTMLElement {
  constructor() {
    super();
    this.minInput = this.querySelector('#price-range-min');
    this.maxInput = this.querySelector('#price-range-max');
    this.textInputs = this.querySelectorAll('.field__input');
    this.minSlider = this.querySelector('#price-range-min');
    this.maxSlider = this.querySelector('#price-range-max');

    this.minSlider.addEventListener('input', this.updateMinValue.bind(this));
    this.maxSlider.addEventListener('input', this.updateMaxValue.bind(this));

    this.textInputs.forEach((input) => {
      input.addEventListener('change', this.syncTextInputs.bind(this));
    });

    this.updateSliderBackground();
  }

  updateMinValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);

    if (minValue > maxValue) {
      this.minSlider.value = maxValue;
    }

    this.textInputs[0].value = this.minSlider.value;
    this.updateSliderBackground();
  }

  updateMaxValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);

    if (maxValue < minValue) {
      this.maxSlider.value = minValue;
    }

    this.textInputs[1].value = this.maxSlider.value;
    this.updateSliderBackground();
  }

  syncTextInputs() {
    const minValue = Number(this.textInputs[0].value);
    const maxValue = Number(this.textInputs[1].value);

    if (minValue >= 0 && minValue <= maxValue) {
      this.minSlider.value = minValue;
    }

    if (maxValue >= minValue) {
      this.maxSlider.value = maxValue;
    }

    this.updateSliderBackground();
  }

  updateSliderBackground() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    const rangeMax = this.maxSlider.max;

    const fromPosition = (minValue * 100 / rangeMax);
    const toPosition = (maxValue * 100 / rangeMax);
    
    this.maxSlider.style.background = `linear-gradient(
      to right,
      #C6C6C6 0%,
      #C6C6C6 ${fromPosition}%,
      #F1592A ${fromPosition}%,
      #F1592A ${toPosition}%,
      #C6C6C6 ${toPosition}%,
      #C6C6C6 100%
    )`;
  }
}

//customElements.define('price-range-slider', PriceRangeSlider);
class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
    document.querySelector('body').classList.remove('overflow-hidden-mobile');
  }
}

customElements.define('facet-remove', FacetRemove);
