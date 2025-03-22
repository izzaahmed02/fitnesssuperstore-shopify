if (!customElements.get("custom-manuals")) {
  customElements.define(
    "custom-manuals",
    class CustomManuals extends HTMLElement {
      constructor() {
        super();
        this.tabs = this.querySelectorAll(".custom-tab");
        this.filtersList = this.querySelector(".manuals-filters-list");
        this.resetButton = this.querySelector(".manuals-reset-button");
        this.resetSearchButton = this.querySelector(
          ".manuals-search__reset-btn"
        );
        this.contentContainer = this.querySelector(".manuals-content");
        this.loader = this.querySelector(".manuals-loader");
        this.paginationContainer = null;
        this.allCollections = [];

        // Bind methods
        this.resetFilters = this.resetFilters.bind(this);
        this.onChangeTab = this.onChangeTab.bind(this);
        this.onPaginate = this.onPaginate.bind(this);

        // Add event listeners
        this.resetButton.addEventListener("click", this.resetFilters);
        this.resetSearchButton.addEventListener(
          "click",
          this.onSearch.bind(this, true)
        );
        this.tabs.forEach((tab) =>
          tab.addEventListener("click", this.onChangeTab)
        );

        // Attach search functionality
        this.searchInput = this.querySelector(".manuals-search__input");
        if (this.searchInput) {
          this.searchInput.addEventListener(
            "input",
            debounce(this.onSearch.bind(this), 150)
          );
        }

        // Fetch default content for the first tab
        const defaultTab = this.tabs[0];

        if (defaultTab) {
          if (window.innerWidth <= 576) {
            defaultTab.querySelector("span").textContent = "All";
          }
          this.fetchTabContent(defaultTab.getAttribute("data-tab"));
          this.fetchAllCollections(defaultTab.getAttribute("data-tab"));
          this.getFilters(defaultTab);
        }
      }

      debounce(func, delay) {
        let timer;
        return function (...args) {
          clearTimeout(timer);
          timer = setTimeout(() => func.apply(this, args), delay);
        };
      }

      async fetchTabContent(tabId, url = null) {
        // Show the loader
        if (this.loader) this.loader.classList.add("active");
        this.contentContainer.style.display = "none";

        // Build the URL if not provided
        url = url || `/collections/${tabId}?view=manual-list`;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch HTML content");

          const htmlContent = await response.text();
          // Update the content container
          if (this.contentContainer) {
            this.contentContainer.innerHTML = htmlContent;

            this.loadMoreButtons = this.querySelectorAll(".manuals-load-more");
            if (this.loadMoreButtons.length > 0) {
              this.loadMoreButtons.forEach((button) => {
                button.addEventListener("click", () =>
                  this.fetchMoreManuals(button)
                );
              });
            }
            // Initialize pagination container and add event listeners
            this.initPagination();
          }
        } catch (error) {
          console.error("Error fetching tab content:", error);
        } finally {
          // Hide the loader
          if (this.loader) this.loader.classList.remove("active");
          this.contentContainer.style.display = "block";
        }
      }

      async fetchMoreManuals(button) {
        const handle = button.getAttribute("data-handle");
        const currentPage = +button.getAttribute("data-current-page");

        if (!handle) {
          console.error("Collection handle is missing!");
          return;
        }

        // Build the URL with limit and offset
        const url = `/collections/${handle}?view=manual-item&page=${
          currentPage + 1
        }`;

        try {
          // Fetch products
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Error fetching products: ${response.statusText}`);
          }

          const data = await response.text();

          // Process the fetched data (e.g., render products on the page)
          this.manualListInner = this.querySelector(
            `[data-list-name="${handle}"`
          );
          // Parse the HTML string into a DOM object
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, "text/html");

          // Query the elements you need
          const items = doc.querySelectorAll(".manuals-list-item");
          const nextButton = doc.querySelector(".manuals-load-more");

          // Append these items to your container
          items.forEach((item) => {
            this.manualListInner.appendChild(item);
          });

          // Disable the button if all products are loaded
          if (nextButton) {
            button.setAttribute(
              "data-current-page",
              nextButton.getAttribute("data-current-page")
            );
          } else {
            button.style.display = "none";
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }

      async onPaginate(event) {
        event.preventDefault();

        // Scroll to the top of the content container
        this.scrollToTop();

        // Get the URL from the clicked pagination element
        const target = event.currentTarget;
        const url = target.getAttribute("data-href");

        if (url) {
          // Fetch new content using the pagination URL
          await this.fetchTabContent(null, url);
        }
      }

      initPagination() {
        // Find the pagination container within the newly fetched content
        this.paginationContainer =
          this.contentContainer.querySelector(".pagination");
        this.dots =
          this.paginationContainer &&
          this.paginationContainer.querySelector('[data-title="…"]');
        if (this.dots) {
          this.dots.classList.remove("current");
          this.dots.classList.add("dots");
        }

        if (this.paginationContainer) {
          // Add click event listeners to pagination links
          const paginationLinks =
            this.paginationContainer.querySelectorAll("[data-href]");
          paginationLinks.forEach((link) => {
            link.addEventListener("click", this.onPaginate);
          });
        }
      }

      async onChangeTab(event) {
        const clickedTab = event.currentTarget;

        this.resetButton.classList.add("active");
        this.getFilters(clickedTab);

        // Remove active class from all tabs
        this.tabs.forEach((tab) => tab.classList.remove("tab-active"));

        // Add active class to the clicked tab
        clickedTab.classList.add("tab-active");

        const searchQuery = this.searchInput.value.trim();
        const tabId = clickedTab.getAttribute("data-tab");
        if (!tabId) return;

        if (this.loader) this.loader.classList.add("active");
        this.contentContainer.style.display = "none";

        await this.fetchAllCollections(tabId);

        if (searchQuery) {
          const cacheKey = `${tabId}-${searchQuery}`;
          if (
            this.searchCache?.[cacheKey] &&
            this.searchCache[cacheKey].length > 0
          ) {
            this.renderCollections(
              this.searchCache[cacheKey],
              this.lastSearchQueryWords || []
            );
          } else {
            this.onSearch({ target: { value: searchQuery } }, false);
          }
        } else {
          if (clickedTab.getAttribute("data-tab") === "all-manuals") {
            this.resetButton.classList.remove("active");
          }
          this.fetchTabContent(tabId);
        }
      }

      getFilters(clickedTab) {
        const relatedCollections = clickedTab.querySelector(
          `#related-collections-data-${clickedTab.dataset.tabId}`
        );
        const relatedCollectionsJson = JSON.parse(
          relatedCollections.textContent
        );

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

          this.filtersList.innerHTML = "";
          relatedCollectionsJson.forEach((collection) => {
            const collectionHTML = `
				<div class="manuals-filter-collection" data-title="${
          collection.title
        }" data-handle="${collection.handle}">
				  ${
            collection.image && collection.image.src
              ? `<img class="manuals-filter-collection__img" src="${
                  collection.image.src
                }" width="${collection.image.width || "auto"}" />`
              : ""
          }
				  <p class="manuals-filter-collection__title">${collection.title
            .replace("Manuals", "")
            .replace("Assembly", "")
            .replace("Owners", "")
            .replace("All", "")}</p>
				</div>
			  `;

            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = collectionHTML;
            const collectionElement = tempContainer.firstElementChild;

            collectionElement.addEventListener("click", () =>
              this.getSelectedManualsList(collection.handle)
            );
            this.filtersList.appendChild(collectionElement);
          });
        } else {
          this.filtersList.innerHTML = "<p>No filters found.</p>";
        }
      }

      resetFilters() {
        if (this.loader) this.loader.classList.add("active");
        this.contentContainer.style.display = "none";

        this.querySelectorAll(".manuals-filter-collection").forEach((filter) =>
          filter.classList.remove("filter-active")
        );
        const selectedTab = Array.from(this.tabs).find((tab) =>
          tab.classList.contains("tab-active")
        );

        // const tabId = selectedTab.getAttribute("data-tab");

        // this.onSearch(this, true);
        this.searchInput.value = "";
        this.resetButton.classList.remove("active");
        this.contentContainer.classList.remove("none");
        const noResults = this.querySelector(".manuals-no-search-results");
        noResults.classList.remove("active");

        const firstTab = this.tabs[0];
        const firstTabId = this.tabs[0].getAttribute("data-tab");

        if (firstTab) this.onChangeTab({ currentTarget: firstTab });
        this.fetchTabContent(firstTabId);
      }

      async getSelectedManualsList(selectedManualList) {
        if (this.loader) this.loader.classList.add("active");
        this.contentContainer.style.display = "none";

        const filterButtons = this.querySelectorAll(
          ".manuals-filter-collection"
        );
        filterButtons.forEach((button) =>
          button.classList.remove("filter-active")
        );

        const selectedFilter = this.querySelector(
          `[data-handle="${selectedManualList}"]`
        );
        const selectedFilterTitle = selectedFilter.dataset.title;
        selectedFilter.classList.add("filter-active");
        this.resetButton.classList.add("active");
        this.searchInput.value = "";

        const url = `/collections/${selectedManualList}?view=manual-item`;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch HTML content");

          const htmlContent = await response.text();
          if (this.contentContainer) {
            const collectionTitle =
              document.querySelector(".manuals-filter-collection.filter-active")
                ?.dataset.title || "Collection";

            const allProducts = await this.fetchAllProducts(selectedManualList);
            const metafieldsList = await this.fetchMetafieldsMap(
              selectedManualList
            );
            const metaMap = {};
            metafieldsList.forEach((meta) => {
              metaMap[meta.handle] = meta.manual_url;
            });

            const productsWithMeta = allProducts.map((product) => ({
              ...product,
              manual_url: metaMap[product.handle] || null,
            }));

            this.renderProducts(
              productsWithMeta,
              selectedManualList,
              collectionTitle
            );

            this.loadMoreButtons =
              this.contentContainer.querySelectorAll(".manuals-load-more");
            if (this.loadMoreButtons.length > 0) {
              this.loadMoreButtons.forEach((button) => {
                button.addEventListener("click", () =>
                  this.fetchMoreManuals(button)
                );
              });
            }

            this.initPagination();
          }
        } catch (error) {
          console.error("Error fetching tab content:", error);
        } finally {
          if (this.loader) this.loader.classList.remove("active");
          this.contentContainer.style.display = "block";
        }
      }

      async fetchAllCollections(tabId) {
        if (!this.allCollectionsCache) this.allCollectionsCache = {};
        if (!this.productsByCollection) this.productsByCollection = {};

        if (this.allCollectionsCache[tabId]) {
          this.allCollections = this.allCollectionsCache[tabId];
          return;
        }

        const url = `/collections/${tabId}?view=all-collections-json`;
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch collections");

          const collections = await response.json();
          this.allCollections = collections;
          this.allCollectionsCache[tabId] = collections;

          const preloadPromises = collections.map(async (collection) => {
            if (!this.productsByCollection[collection.handle]) {
              const products = await this.fetchAllProducts(collection.handle);
              this.productsByCollection[collection.handle] = products;
            }
          });

          await Promise.all(preloadPromises);
        } catch (error) {
          console.error("Error fetching all collections:", error);
        }
      }

      async fetchAllProducts(collectionHandle) {
        let allProducts = [];
        let limit = 50;
        let page = 1;
        let hasMoreProducts = true;

        while (hasMoreProducts) {
          const response = await fetch(
            `/collections/${collectionHandle}/products.json?limit=${limit}&page=${page}`
          );
          const data = await response.json();

          if (data.products && data.products.length > 0) {
            allProducts = allProducts.concat(data.products);
            page++;
          } else {
            hasMoreProducts = false;
          }
        }

        return allProducts;
      }

      async fetchMetafieldsMap(collectionHandle) {
        try {
          const response = await fetch(
            `/collections/${collectionHandle}?view=manuals-metafields-json`
          );
          if (!response.ok) throw new Error("Failed to fetch metafields JSON");

          const data = await response.json();
          return data; // [{ handle: 'product-a', manual_url: '...' }, ...]
        } catch (error) {
          console.error("Error fetching metafields:", error);
          return [];
        }
      }

      async onSearch(event, resetQuery) {
        if (resetQuery) this.searchInput.value = "";
        const query = resetQuery ? "" : event.target.value.toLowerCase();

        if (this.loader) this.loader.classList.add("active");
        this.contentContainer.style.display = "none";

        const queryWords = query.split(/\s+/).filter(Boolean);
        this.lastSearchQueryWords = queryWords;
        const selectedTab = Array.from(this.tabs).find((tab) =>
          tab.classList.contains("tab-active")
        );
        const tabId = selectedTab.getAttribute("data-tab");
        const noResults = this.querySelector(".manuals-no-search-results");

        this.resetButton.classList.remove("active");
        this.resetSearchButton.classList.add("active");
        this.querySelectorAll(".manuals-filter-collection").forEach((filter) =>
          filter.classList.remove("filter-active")
        );

        if (!this.searchCache) this.searchCache = {};
        if (!this.metafieldsCache) this.metafieldsCache = {};
        const cacheKey = `${tabId}-${query}`;
        if (this.searchCache[cacheKey]) {
          this.renderCollections(this.searchCache[cacheKey]);
          return;
        }

        const collectionPromises = this.allCollections.map(
          async (collection) => {
            const collectionTitle = collection.title.toLowerCase();

            const allProducts =
              this.productsByCollection?.[collection.handle] || [];

            if (!this.metafieldsCache[collection.handle]) {
              this.metafieldsCache[collection.handle] =
                await this.fetchMetafieldsMap(collection.handle);
            }

            const metafieldsList = this.metafieldsCache[collection.handle];
            const metaMap = {};
            metafieldsList.forEach((meta) => {
              metaMap[meta.handle] = meta.manual_url;
            });

            const productsWithMeta = allProducts.map((product) => ({
              ...product,
              manual_url: metaMap[product.handle] || null,
            }));

            const matchingProducts = productsWithMeta.filter((product) => {
              const title = product.title.toLowerCase();
              return queryWords.every((word) => title.includes(word));
            });

            if (
              collectionTitle.includes(query) ||
              matchingProducts.length > 0
            ) {
              return {
                ...collection,
                products: matchingProducts,
              };
            }

            return null;
          }
        );

        const collectionsWithMatches = await Promise.all(collectionPromises);
        const filteredCollections = collectionsWithMatches.filter(Boolean);

        if (filteredCollections.length > 0)
          this.searchCache[cacheKey] = filteredCollections;

        // Update the UI with the filtered collections
        if (query === "") {
          this.contentContainer.classList.remove("none");
          this.resetSearchButton.classList.remove("active");
          this.fetchTabContent(tabId);
          noResults.classList.remove("active");
        } else if (filteredCollections.length < 1) {
          if (this.loader) this.loader.classList.remove("active");
          this.contentContainer.classList.add("none");
          this.resetButton.classList.add("active");
          const message = noResults.querySelector(".manuals-no-search-message");
          message.innerHTML = `We cannot find <strong>“${query}”</strong>. Try searching again.`;
          noResults.classList.add("active");
        } else {
          this.contentContainer.classList.remove("none");
          noResults.classList.remove("active");
          this.renderCollections(filteredCollections, queryWords);
        }
      }

      renderCollections(
        collections,
        queryWords = this.lastSearchQueryWords || []
      ) {
        this.resetButton.classList.add("active");
        if (this.loader) this.loader.classList.remove("active");
        this.contentContainer.style.display = "";

        const html = `
			<div class="manuals-list__wrapper">
			${collections
        .map((collection) => {
          const filteredProducts = collection.products.filter(
            (p) => p.manual_url
          );
          if (filteredProducts.length === 0) return "";
          return `
					<div class="manuals-list__container">
					<h3 class="manuals-list__title">${collection.title
            .replace(/Assembly|Owners|All|Manuals/gi, "")
            .trim()}</h3>
					<div class="manuals-list-inner" data-list-name="${
            collection.handle
          }" id="products-${collection.handle}">
						${filteredProducts
              .map(
                (product) => `
							<a class="manuals-list-item" href="${product.manual_url}" target="_blank">
							${this.highlightText(product.title, queryWords)}
							</a>`
              )
              .join("")}
					</div>
					</div>
				`;
        })
        .join("")}
			</div>
		`;

        this.contentContainer.classList.remove("none");
        this.querySelector(".manuals-no-search-results")?.classList.remove(
          "active"
        );

        this.contentContainer.innerHTML = html;
      }

      renderProducts(
        products,
        collectionHandle,
        collectionTitle,
        queryWords = []
      ) {
        const cleanedTitle = collectionTitle
          .replace(/Assembly|Owners|All|Manuals/gi, "")
          .trim();

        const container = document.createElement("div");
        container.classList.add("manuals-list__container");

        container.innerHTML = `
		  <h3 class="manuals-list__title">${cleanedTitle}</h3>
		  <div class="manuals-list-inner" data-list-name="${collectionHandle}">
		  </div>
		`;

        const listContainer = container.querySelector(".manuals-list-inner");

        products.forEach((product) => {
          const highlightedTitle = this.highlightText(
            product.title,
            queryWords
          );
          const productHTML = `
			<a class="manuals-list-item" href="${product.manual_url}" target="_blank">
		  		${highlightedTitle}
		  	</a>
		  `;
          listContainer.innerHTML += productHTML;
        });

        this.contentContainer.innerHTML = container.innerHTML;
      }

      highlightText(text, queryWords) {
        if (!queryWords.length || !text) return text;
        const regex = new RegExp(`(${queryWords.join("|")})`, "gi");
        return text.replace(regex, (match) => `<mark>${match}</mark>`);
      }

      scrollToTop() {
        const manualsList = this.querySelector(".manuals-main");
        const offset = 100; // Adjust this value to control how much higher you want to scroll

        if (manualsList) {
          const topPosition =
            manualsList.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: topPosition, behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
  );
}
