let allProducts = [];
let debounceTimeout;
let productNames = new Set();

function removeRightSideOnSmallScreens() {
  if (window.innerWidth <= 749) {
    const rightSideEl = document.querySelector('.right-side');
    if (rightSideEl) {
      rightSideEl.remove();
    }
  }
}

document.addEventListener('DOMContentLoaded', removeRightSideOnSmallScreens);
window.addEventListener('resize', removeRightSideOnSmallScreens);

class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);
    const facetForm = this.querySelectorAll('form');
    facetForm.forEach(facet => {
      facet.addEventListener('input', (e) => {
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
    });
    const searchInput = document.getElementById("search-input");
    const searchInputMobile = document.getElementById("search-input-mobile");
    if (searchInput) {
      searchInput.removeEventListener("input", filterProducts);
      searchInput.addEventListener("input", debounce(filterProducts, 300));
    }
    if (searchInputMobile) {
      searchInputMobile.removeEventListener("input", filterProducts);
      searchInputMobile.addEventListener("input", debounce(filterProducts, 300));
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
      const searchUrl = window.location + "&view=99999";
      const page = document.querySelector('.search');
      let url;
      if (page) {
        url = searchUrl;
      } else {
        url = collectionUrl;
      }
      fetch(url)
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
      const productItems = Array.from(productGrid.querySelectorAll('li'));
      const filteredProducts = productItems.filter(product => {
        const titleElement = product.querySelector('.product-item .title');
        if (!titleElement) return false;
        const productName = titleElement.textContent.toLowerCase();
        return productName.includes(searchText);
      });
      productGrid.innerHTML = "";
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

    // fetchAllProducts();
    const applyButton = document.querySelectorAll('.button--primary.apply-filters-mobile');
    applyButton.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const form = btn.closest('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
          document.querySelector('body').classList.remove('overflow-hidden-mobile');
        }
      });
    });

    document.querySelector('.sort-per-page select.num').addEventListener('change', function () {
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
            item.setAttribute("style", "display:block!important");
          } else {
            item.style.display = "none";
          }
        });
      });
    });

    function initSlider(element) {
      const images = element.querySelectorAll('img.lazy-load');
      if (images.length > 1) {
        if (!$(element).hasClass('slick-initialized')) {
          $(element).slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            lazyLoad: 'ondemand',
            infinite: false,
            arrows: true,
            dots: true,
            prevArrow: '<button type="button" class="slick-prev"><svg width="16" height="16" style="transform: rotate(-180deg)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
              '    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="#F1592A"></path>\n' +
              '</svg></button>',
            nextArrow: '<button type="button" class="slick-next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
              '    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="#F1592A"></path>\n' +
              '</svg></button>',
            responsive: [
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1
                }
              }
            ]
          });
          $(element).find('img.lazy-load').each(function () {
            const img = $(this);
            if (img) {
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
    }

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initSlider(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.8});

    $('.image-wrap').each(function () {
      if ($(this).length > 0) {
        observer.observe(this);
      }
    });
    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
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

    const productGridContainer = document.getElementById('ProductGridContainer');
    const collectionElement = productGridContainer?.querySelector('.collection-product-wrapper');
    if (collectionElement) {
      collectionElement.classList.add('loading');
    } else {
      console.warn('Collection element not found in ProductGridContainer');
    }

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
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, {html, url}];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
        const elements = document.querySelectorAll('.product-item .title');
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
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
    const elements = document.querySelectorAll('.product-item .title');
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
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;
    removeRightSideOnSmallScreens();
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
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);
    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const {className: previousElementClassName, id: previousElementId} = facetsToRender[index - 1];
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
      const searchParamsStr = searchParams.toString();
      history.pushState({searchParams: searchParamsStr}, '', `${window.location.pathname}?${searchParamsStr}`);
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
    const isMobile = event.target?.closest('form')?.id === 'FacetFiltersFormMobile';

    const forms = [];
    sortFilterForms.forEach((form) => {
      if (!isMobile) {
        if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
          forms.push(form);
        }
      } else if (form.id === 'FacetFiltersFormMobile') {
        forms.push(form);
      }
    });

    const formParams = [];
    forms.forEach((form) => {
      const formData = new FormData(form);
      const params = new URLSearchParams();
      const priceMinTextInput = form.querySelector('#Filter-Price-GTE, #Mobile-Filter-Price-GTE');
      const priceMaxTextInput = form.querySelector('#Filter-Price-LTE, #Mobile-Filter-Price-LTE');
      let includePrice = true;

      if (priceMinTextInput && priceMaxTextInput) {
        const textMax = Number(priceMaxTextInput.getAttribute('data-max').replace(/,/g, ''));
        let minValue = priceMinTextInput.value ? Number(priceMinTextInput.value.replace(/,/g, '')) : 0;
        let maxValue = priceMaxTextInput.value ? Number(priceMaxTextInput.value.replace(/,/g, '')) : textMax;

        minValue = Math.max(0, Math.min(minValue, textMax));
        maxValue = Math.max(minValue, Math.min(maxValue, textMax));

        priceMinTextInput.value = minValue >= 0 ? minValue.toFixed(2) : '0.00';
        priceMaxTextInput.value = maxValue <= textMax ? maxValue.toFixed(2) : textMax.toFixed(2);

        const minSlider = form.querySelector('#price-range-min');
        const maxSlider = form.querySelector('#price-range-max');
        if (minSlider && maxSlider) {
          minSlider.value = Math.round(minValue);
          maxSlider.value = Math.round(maxValue);
        }

        const isPriceDefault = minValue === 0 && maxValue >= textMax;
        const isPriceModified = form.querySelector('.price-range-wrapper')?.contains(event.target);
        if (isPriceDefault && !isPriceModified) {
          includePrice = false;
        }
      }

      for (const [key, value] of formData) {
        if (value !== '' && (includePrice || !key.includes('filter.v.price'))) {
          if (key.includes('filter.v.price')) {
            const numValue = Number(value.replace(/,/g, ''));
            const maxAllowed = priceMaxTextInput ? Number(priceMaxTextInput.getAttribute('data-max').replace(/,/g, '')) : Infinity;
            if (numValue <= maxAllowed && numValue >= 0) {
              params.append(key, numValue.toFixed(2));
            }
          } else {
            params.append(key, value);
          }
        }
      }
      formParams.push(params.toString());
    });

    let finalParams = formParams.filter((param) => param).join('&');
    if (perview) {
      const updatedParams = new URLSearchParams(finalParams);
      updatedParams.set('perview', perview);
      finalParams = updatedParams.toString();
    }

    this.onSubmitForm(finalParams, event);
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
    requestAnimationFrame(() => this.init());
  }

  init() {
    this.textInputs = this.querySelectorAll('.field__input');
    this.minSlider = this.querySelector('#price-range-min');
    this.maxSlider = this.querySelector('#price-range-max');
    if (!this.minSlider || !this.maxSlider) {
      return;
    }

    const rangeMax = Number(this.maxSlider.max);
    const textMax = Number(this.textInputs[1]?.getAttribute('data-max').replace(/,/g, ''));

    let minValue = this.textInputs[0]?.value ? Number(this.textInputs[0].value.replace(/,/g, '')) : 0;
    let maxValue = this.textInputs[1]?.value ? Number(this.textInputs[1].value.replace(/,/g, '')) : textMax;

    const urlParams = new URLSearchParams(window.location.search);
    const hasPriceFilter = urlParams.has('filter.v.price.gte') || urlParams.has('filter.v.price.lte');

    minValue = Math.max(0, Math.min(minValue, textMax));
    maxValue = Math.max(minValue, Math.min(maxValue, textMax));

    if (!hasPriceFilter) {
      this.textInputs[0].value = minValue >= 0 ? minValue.toFixed(2) : '0.00';
      this.textInputs[1].value = maxValue <= textMax ? maxValue.toFixed(2) : textMax.toFixed(2);
    } else {
      this.textInputs[0].value = minValue > 0 ? minValue.toFixed(2) : '0.00';
      this.textInputs[1].value = maxValue < textMax ? maxValue.toFixed(2) : textMax.toFixed(2);
    }

    this.minSlider.value = Math.round(minValue);
    this.maxSlider.value = Math.round(maxValue);

    this.minSlider.addEventListener('input', this.updateMinValue.bind(this));
    this.maxSlider.addEventListener('input', this.updateMaxValue.bind(this));

    if (this.textInputs.length > 1) {
      this.textInputs.forEach((input) => {
        input.addEventListener('change', this.syncTextInputs.bind(this));
      });
    }

    this.updateSliderBackground();
  }

  updateMinValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    const rangeMax = Number(this.maxSlider.max);

    if (minValue > maxValue) {
      this.minSlider.value = maxValue;
    }

    if (this.textInputs.length > 0) {
      const textValue = Number(this.minSlider.value);
      this.textInputs[0].value = textValue >= 0 ? textValue.toFixed(2) : '0.00';
    }
    this.updateSliderBackground();
  }

  updateMaxValue() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    const rangeMax = Number(this.maxSlider.max);

    if (maxValue < minValue) {
      this.maxSlider.value = minValue;
    }

    if (this.textInputs.length > 1) {
      const textValue = Number(this.maxSlider.value);
      const textMax = Number(this.textInputs[1].getAttribute('data-max').replace(/,/g, ''));
      this.textInputs[1].value = textValue <= textMax ? textValue.toFixed(2) : textMax.toFixed(2);
    }
    this.updateSliderBackground();
  }

  syncTextInputs() {
    const minInput = this.textInputs[0];
    const maxInput = this.textInputs[1];
    const textMax = Number(maxInput.getAttribute('data-max').replace(/,/g, ''));
    let minValue = minInput.value ? Number(minInput.value.replace(/,/g, '')) : 0;
    let maxValue = maxInput.value ? Number(maxInput.value.replace(/,/g, '')) : textMax;

    if (isNaN(minValue) || minValue < 0) {
      minValue = 0;
      minInput.value = '0.00';
    }
    if (isNaN(maxValue) || maxValue > textMax) {
      maxValue = textMax;
      maxInput.value = textMax.toFixed(2);
    }
    if (minValue > maxValue) {
      minValue = maxValue;
      minInput.value = maxValue >= 0 ? maxValue.toFixed(2) : '0.00';
    }

    this.minSlider.value = Math.round(minValue);
    this.maxSlider.value = Math.round(maxValue);

    this.updateSliderBackground();
  }

  updateSliderBackground() {
    const minValue = Number(this.minSlider.value);
    const maxValue = Number(this.maxSlider.value);
    const rangeMax = Number(this.maxSlider.max);

    if (minValue === 0 && maxValue === rangeMax) {
      this.maxSlider.style.background = '#C6C6C6';
    } else {
      const fromPosition = (minValue * 100) / rangeMax;
      const toPosition = (maxValue * 100) / rangeMax;

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
}

document.addEventListener('DOMContentLoaded', () => {
  customElements.define('price-range-slider', PriceRangeSlider);
});

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