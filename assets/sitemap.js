document.addEventListener("DOMContentLoaded", async function () {
	const perPage = 250; // Shopify API limit per request
	const sitemapContainer = document.querySelector(".sitemap_links");
	const searchInput = document.querySelector(".sitemap_search");

	if (!sitemapContainer) {
		console.error("Error: .sitemap_links container not found in the DOM.");
		return;
	}

	/**
	 * Filters the visible pages based on user input.
	 */
	function filterPages() {
		const query = searchInput.value.toLowerCase();
		const pages = document.querySelectorAll(".sitemap_item");

		pages.forEach(page => {
			const title = page.textContent.toLowerCase();
			page.style.display = title.includes(query) ? "block" : "none";
		});
	}

	/**
	 * Fetches a single page of products from the API.
	 * @param {number} page - The page number to fetch
	 * @returns {Promise<Array>} List of products
	 */
	async function fetchProducts(page) {
		const url = `/collections/products-tax-collection/products.json?limit=${perPage}&page=${page}&view=getProductsJSON`;
		console.log(`Fetching products from page ${page}: ${url}`);

		try {
			const response = await fetch(url);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const data = await response.json();
			return data.products || [];
		} catch (error) {
			console.error(`Error fetching page ${page}:`, error);
			return [];
		}
	}
	/**
	 * Adds products to the sitemap container and updates the search filter.
	 * @param {Array} products - List of products to add
	 */
	function addProductsToDOM(products) {
		if (products.length === 0) return;

		const fragment = document.createDocumentFragment();

		products.forEach(product => {
			if (!product.handle || !product.title) return; // Ensure data is valid

			const productItem = document.createElement("li");
			productItem.classList.add("sitemap_item");

			const productLink = document.createElement("a");
			productLink.href = `/products/${product.handle}`;
			productLink.textContent = product.title;
			productLink.classList.add("sitemap_link");

			productItem.appendChild(productLink);
			fragment.appendChild(productItem);
		});

		// Append all new products at once for better performance
		sitemapContainer.appendChild(fragment);

		// Reapply filtering on newly added products
		filterPages();
	}

	/**
	 * Removes duplicate products by checking duplicate titles.
	 */
	function removeDuplicateProducts() {
		const items = document.querySelectorAll(".sitemap_item");
		const seenTitles = new Set();
		let removedCount = 0;

		items.forEach(item => {
			const link = item.querySelector(".sitemap_link");
			if (!link) return;

			const title = link.textContent.trim();

			if (seenTitles.has(title)) {
				item.remove(); // Remove duplicate
				removedCount++;
			} else {
				seenTitles.add(title);
			}
		});

		console.log(`Removed ${removedCount} duplicate items.`);
	}

	/**
	 * Loads all products iteratively while allowing search to work in real-time.
	 */
	async function loadAllProducts() {
		console.time("Total Load Time");

		let page = 1;

		while (true) {
			const products = await fetchProducts(page);
			if (products.length === 0) {
				console.log(`No more products found at page ${page}. Stopping.`);
				break;
			}

			// Add the fetched products to the DOM immediately
			addProductsToDOM(products);
			page++; // Move to the next page
		}

		// Remove duplicate products after all pages are loaded
		removeDuplicateProducts();

		console.timeEnd("Total Load Time");
	}

	// Attach search event listener to update results dynamically
	searchInput.addEventListener("input", filterPages);

	// Start loading products
	loadAllProducts();
});
