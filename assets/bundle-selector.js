// Bundle Selector functionality for Cable Attachments - OPTIMIZED
(function() {
  'use strict';
  
  console.log('[Bundle Selector] Script loaded');
  
  // Cache for product lookups to avoid redundant API calls
  const productCache = new Map();
  const skuCache = new Map();
  const judgemeCache = new Map();
  
  function initBundleSelector() {
    console.log('[Bundle Selector] Initializing...');
    
    const bundleSelector = document.querySelector('.bundle-selector-container');
    if (!bundleSelector) {
      console.log('[Bundle Selector] Container not found');
      return;
    }
    
    console.log('[Bundle Selector] Container found, setting up...');
    
    // Use the first modal and drop any accidental duplicates in the DOM
    const modalInstances = Array.from(document.querySelectorAll('#bundle-modal'));
    const modal = modalInstances[0];
    if (modalInstances.length > 1) {
      modalInstances.slice(1).forEach(instance => instance.remove());
      console.warn('[Bundle Selector] Removed duplicate bundle modal instances');
    }
    
    const modalClose = modal?.querySelector('.bundle-modal__close');
    const modalBackdrop = modal?.querySelector('.bundle-modal__backdrop');
    const bundleLinks = bundleSelector.querySelectorAll('.bundle-card__link');
    const bundleCards = bundleSelector.querySelectorAll('.bundle-card');
    const bundleVariantCache = {};
    const bundleState = {
      selectedSet: null,
      selectedVariantId: null
    };

    // Expose state for other scripts (product form)
    window.bundleSelectorState = bundleState;

    // Ensure hidden input exists on the product form to store selection
    function getBundleHiddenInput() {
      const productForm = document.querySelector('product-form form[data-type="add-to-cart-form"]');
      if (!productForm) return null;
      let hiddenInput = productForm.querySelector('input[name="bundle_variant_id"]');
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'bundle_variant_id';
        productForm.appendChild(hiddenInput);
      }
      return hiddenInput;
    }

    function setBundleHiddenInput(variantId = '', bundleSet = '') {
      const hiddenInput = getBundleHiddenInput();
      if (!hiddenInput) return;
      hiddenInput.value = variantId || '';
      hiddenInput.dataset.bundleSet = bundleSet || '';
    }
    
    // ─────────────────────────────────────────────
    // Judge.me helpers
    // ─────────────────────────────────────────────

    /**
     * Fetch rating data from the Judge.me anonymous widget API.
     * Results are cached by productId to avoid redundant requests.
     *
     * @param {number|string} productId  Shopify product ID
     * @returns {Promise<{rating: number, count: number}|null>}
     */
    async function getJudgeMeRating(productId) {
      if (judgemeCache.has(productId)) {
        console.log(`[Bundle Selector] Using cached Judge.me rating for product ${productId}`);
        return judgemeCache.get(productId);
      }

      try {
        const shopDomain = window.Shopify?.shop || window.location.hostname;
        const url = `https://judge.me/api/v1/widgets/product_review?api_token=anonymous&shop_domain=${shopDomain}&platform=shopify&pid=${productId}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.log(`[Bundle Selector] Judge.me request failed (${response.status}) for product ${productId}`);
          return null;
        }

        const data = await response.json();
        const result = {
          rating: data.rating ?? null,
          count: data.reviews_count ?? 0
        };

        judgemeCache.set(productId, result);
        console.log(`[Bundle Selector] Judge.me rating for product ${productId}:`, result);
        return result;
      } catch (e) {
        console.log('[Bundle Selector] Judge.me fetch failed:', e);
        return null;
      }
    }

    /**
     * Build a star-rating HTML string from a numeric rating.
     *
     * @param {number} rating      e.g. 4.7
     * @param {number} count       review count
     * @returns {string}           HTML string
     */
    function buildRatingHTML(rating, count) {
      if (!rating) return '<div class="rating-stars">★★★★★</div>';
      const fullStars = Math.floor(rating);
      const halfStar  = rating % 1 >= 0.5 ? '½' : '';
      return `<div class="rating-stars">${'★'.repeat(fullStars)}${halfStar}</div><span>${count} reviews</span>`;
    }

    // ─────────────────────────────────────────────
    
    // Load bundle product images and titles for cards
    async function loadBundleCardData() {
      const bundleHandles = {
        A: 'french-fitness-cable-machine-attachment-3-piece-base-kit-new',
        B: 'french-fitness-cable-machine-attachment-5-piece-complete-set-new',
        C: 'french-fitness-cable-machine-attachment-12-piece-ultimate-bundle-new'
      };
      
      for (const [set, handle] of Object.entries(bundleHandles)) {
        const card = bundleSelector.querySelector(`[data-bundle-set="${set}"]`);
        if (!card) continue;
        
        try {
          const product = await fetchProductDetails(handle);
          if (product) {
            const imageEl = card.querySelector('.bundle-card__image img');
            const titleEl = card.querySelector('.bundle-card__title');
            
            if (imageEl && product.featured_image) {
              imageEl.src = product.featured_image;
              imageEl.alt = product.title;
            }
            if (titleEl && product.title) {
              titleEl.textContent = product.title;
            }
            console.log(`[Bundle Selector] Loaded data for bundle ${set}`);
          }
        } catch (e) {
          console.log(`[Bundle Selector] Could not load bundle ${set} data:`, e);
        }
      }
    }
    
    // Load bundle card data after initialization
    loadBundleCardData();
    
    if (!modal) {
      console.error('[Bundle Selector] Modal not found');
      return;
    }
    
    // Ensure modal is not constrained by transformed ancestors
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
      console.log('[Bundle Selector] Moved modal to body to avoid stacking issues');
    }
    
    // Ensure modal is hidden initially
    modal.hidden = true;
    modal.style.display = 'none';
    
    console.log('[Bundle Selector] Elements found:', {
      modal: !!modal,
      links: bundleLinks.length,
      cards: bundleCards.length
    });

    // Bundle configuration with SKUs
    const bundleConfig = {
      A: {
        title: 'French Fitness Cable Machine Attachment 3-Piece Base Kit (New)',
        skus: ['FF-NTR2', 'BSLDTS31', 'FFRG-28RCB'],
        productNames: [
          'French Fitness NTR2 Nylon Tricep Rope',
          'Body-Solid TS31 Combo Thigh/Ankle Strap',
          'French Fitness 28" Rubber Grip Revolving Curl Bar'
        ]
      },
      B: {
        title: 'French Fitness Cable Machine Attachment 5-Piece Complete Set (New)',
        skus: ['FF-NTR2', 'BSLDTS31', 'FFRG-28RCB', 'FFRG-TPB12', 'FFC-42SB'],
        productNames: [
          'French Fitness NTR2 Nylon Tricep Rope',
          'Body-Solid TS31 Combo Thigh/Ankle Strap',
          'French Fitness 28" Rubber Grip Revolving Curl Bar',
          'French Fitness 12" Rubber Grip Tricep Pressdown Bar',
          'French Fitness Chrome 42" Dual Hook Straight Bar'
        ]
      },
      C: {
        title: 'French Fitness Cable Machine Attachment 12-Piece Ultimate Bundle (New)',
        skus: [
          'FF-RGMPB',
          'FFC-28PSLB',
          'FFC-48LB-V2',
          'FFRG-21RSB',
          'FFRG-TPB12',
          'FFRG-28RCB',
          'FF-NTR2',
          'FF-FSR90',
          'FFC-42SB',
          'FF-10TSNCA',
          'BSLDTS31',
          'FF-CHCA'
        ],
        productNames: [
          'French Fitness Rubber Grip Multi Purpose Bar',
          'French Fitness Chrome 28" Pro-Style Lat Bar',
          'French Fitness Chrome V2 48" Lat Bar',
          'French Fitness Rubber Grip 21" Revolving Straight Bar',
          'French Fitness 12" Rubber Grip Tricep Pressdown Bar',
          'French Fitness 28" Rubber Grip Revolving Curl Bar',
          'French Fitness NTR2 Nylon Tricep Rope',
          'French Fitness FSR90 Functional Strap Rope',
          'French Fitness Chrome 42" Dual Hook Straight Bar',
          'French Fitness 10" Tricep Single Neck Cable Attachment',
          'Body-Solid TS31 Combo Thigh/Ankle Strap',
          'French Fitness CHCA Cable Handle Connector Attachment'
        ]
      }
    };

    // Fetch bundle product variant ID (cached per bundle)
    async function getBundleVariantId(bundleSet) {
      if (bundleVariantCache[bundleSet]) return bundleVariantCache[bundleSet];
      const bundleHandle = `french-fitness-cable-machine-attachment-${bundleSet === 'A' ? '3-piece-base-kit' : bundleSet === 'B' ? '5-piece-complete-set' : '12-piece-ultimate-bundle'}-new`;
      const bundleProduct = await fetchProductDetails(bundleHandle);
      const variantId = bundleProduct?.variants?.[0]?.id || null;
      if (variantId) bundleVariantCache[bundleSet] = variantId;
      return variantId;
    }

    function clearSelection() {
      bundleState.selectedSet = null;
      bundleState.selectedVariantId = null;
      bundleCards.forEach(card => card.classList.remove('is-selected'));
      setBundleHiddenInput('', '');
    }

    async function handleBundleSelection(bundleSet, card) {
      if (bundleState.selectedSet === bundleSet) {
        clearSelection();
        return;
      }

      bundleCards.forEach(c => c.classList.toggle('is-selected', c === card));
      bundleState.selectedSet = bundleSet;

      try {
        const variantId = await getBundleVariantId(bundleSet);
        bundleState.selectedVariantId = variantId;
        setBundleHiddenInput(variantId, bundleSet);
        console.log('[Bundle Selector] Bundle selected', { bundleSet, variantId });
      } catch (error) {
        console.error('[Bundle Selector] Unable to select bundle', error);
        clearSelection();
      }
    }

    // OPTIMIZED: Fetch product details via API with caching
    async function fetchProductDetails(handle) {
      // Check cache first
      if (productCache.has(handle)) {
        console.log(`[Bundle Selector] Using cached product ${handle}`);
        return productCache.get(handle);
      }
      
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (!response.ok) {
          console.log(`[Bundle Selector] Product ${handle} not found (${response.status})`);
          return null;
        }
        const data = await response.json();
        console.log(`[Bundle Selector] Fetched product ${handle}:`, data.title);
        
        // Cache the result
        productCache.set(handle, data);
        
        return data;
      } catch (error) {
        console.error(`[Bundle Selector] Error fetching product ${handle}:`, error);
        return null;
      }
    }

    // OPTIMIZED: Batch fetch products by SKU with improved caching
    async function findProductsBySKUs(skus) {
      console.log(`[Bundle Selector] Batch fetching ${skus.length} products...`);
      const results = [];
      
      // Check cache first for all SKUs
      const uncachedSKUs = [];
      const cachedResults = [];
      
      skus.forEach(sku => {
        if (skuCache.has(sku)) {
          cachedResults.push(skuCache.get(sku));
        } else {
          uncachedSKUs.push(sku);
        }
      });
      
      console.log(`[Bundle Selector] Found ${cachedResults.length} cached, fetching ${uncachedSKUs.length} new`);
      
      // Process uncached SKUs in parallel with limit to avoid overwhelming the server
      const BATCH_SIZE = 5; // Fetch 5 products at a time
      const uncachedResults = [];
      
      for (let i = 0; i < uncachedSKUs.length; i += BATCH_SIZE) {
        const batch = uncachedSKUs.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(sku => findProductBySKUOptimized(sku));
        const batchResults = await Promise.all(batchPromises);
        uncachedResults.push(...batchResults);
      }
      
      // Combine cached and new results in original order
      let cachedIndex = 0;
      let uncachedIndex = 0;
      
      skus.forEach(sku => {
        if (skuCache.has(sku)) {
          results.push(cachedResults[cachedIndex++]);
        } else {
          const result = uncachedResults[uncachedIndex++];
          skuCache.set(sku, result); // Cache the new result
          results.push(result);
        }
      });
      
      console.log(`[Bundle Selector] Batch fetch complete: ${results.filter(r => r).length}/${skus.length} found`);
      return results;
    }

    // OPTIMIZED: Simplified product finder with single strategy
    async function findProductBySKUOptimized(sku) {
      try {
        // Try direct search first (fastest method)
        const searchUrl = `/search?q=${encodeURIComponent(sku)}&type=product&options[unavailable_products]=last`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          console.log(`[Bundle Selector] Search failed for SKU ${sku}`);
          return null;
        }
        
        const searchText = await searchResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(searchText, 'text/html');
        const productLinks = doc.querySelectorAll('a[href*="/products/"]');
        
        // Try to find product from search results
        for (const link of productLinks) {
          const href = link.getAttribute('href');
          const handleMatch = href.match(/\/products\/([^\/\?]+)/);
          if (handleMatch) {
            const product = await fetchProductDetails(handleMatch[1]);
            if (product && product.variants) {
              const variant = product.variants.find(v => 
                v.sku && (v.sku.toUpperCase() === sku.toUpperCase())
              );
              if (variant) {
                return {
                  id: product.id,
                  title: product.title,
                  handle: product.handle,
                  description: product.description,
                  image: product.featured_image || (product.images && product.images[0]),
                  price: variant.price,
                  compare_at_price: variant.compare_at_price,
                  variant_id: variant.id,
                  sku: sku
                };
              }
            }
          }
        }
      } catch (error) {
        console.error(`[Bundle Selector] Error finding SKU ${sku}:`, error);
      }
      return null;
    }

    // Initialize Slick carousel for both mobile and desktop
    function initProductsCarousel(gridElement) {
      if (typeof $ === 'undefined' || !$.fn.slick) {
        console.warn('[Bundle Selector] Slick carousel not available');
        return;
      }
      
      // Destroy existing instance if present
      if ($(gridElement).hasClass('slick-initialized')) {
        $(gridElement).slick('unslick');
      }
      
      $(gridElement).slick({
        dots: true,
        arrows: true,
        infinite: false,
        speed: 300,
        slidesToShow: 3.5, // Show 3 and a half slides on desktop
        slidesToScroll: 1,
        adaptiveHeight: false,
        prevArrow: '<button type="button" class="slick-prev" aria-label="Previous"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
        nextArrow: '<button type="button" class="slick-next" aria-label="Next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>',
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 2.5,
              slidesToScroll: 1
            }
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              centerMode: true,
              centerPadding: '60px'
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              centerMode: true,
              centerPadding: '40px'
            }
          }
        ]
      });
      console.log('[Bundle Selector] Slick carousel initialized');
      
      // Handle window resize
      let resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
          if ($(gridElement).hasClass('slick-initialized')) {
            $(gridElement).slick('refresh');
          }
        }, 250);
      });
    }

    // OPTIMIZED: Render bundle modal with progressive loading
    async function renderBundleModal(bundleSet) {
      console.log('[Bundle Selector] Opening modal for bundle', bundleSet);
      const config = bundleConfig[bundleSet];
      if (!config) {
        console.error('[Bundle Selector] Invalid bundle set:', bundleSet);
        return;
      }

      const mainTitle = modal.querySelector('#bundle-main-title');
      const mainDesc = modal.querySelector('#bundle-main-description');
      const mainImage = modal.querySelector('#bundle-main-image');
      const productsGrid = modal.querySelector('#bundle-products-grid');
      const ratingEl = modal.querySelector('#bundle-main-rating');
      
      // Show modal immediately with loading state
      modal.hidden = false;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('bundle-modal-open');
      
      if (mainTitle) mainTitle.textContent = config.title;
      if (mainDesc) mainDesc.textContent = 'Loading bundle details...';
      if (ratingEl) ratingEl.innerHTML = '<div class="rating-stars rating-stars--loading">Loading rating...</div>';
      if (productsGrid) productsGrid.innerHTML = '<div class="loading">Loading products...</div>';

      // Fetch bundle product in parallel with individual products
      const bundleProductHandle = `french-fitness-cable-machine-attachment-${bundleSet === 'A' ? '3-piece-base-kit' : bundleSet === 'B' ? '5-piece-complete-set' : '12-piece-ultimate-bundle'}-new`;
      
      // Start both fetches in parallel
      const bundleProductPromise = fetchProductDetails(bundleProductHandle);
      const individualProductsPromise = findProductsBySKUs(config.skus);
      
      // Handle bundle product + Judge.me rating when ready
      bundleProductPromise.then(async (bundleProduct) => {
        if (bundleProduct) {
          const imageUrl = bundleProduct.featured_image || (bundleProduct.images && bundleProduct.images[0]) || '';
          if (mainImage) {
            mainImage.src = imageUrl;
            mainImage.alt = bundleProduct.title || config.title;
          }
          if (mainTitle) mainTitle.textContent = bundleProduct.title || config.title;
          if (mainDesc) {
            mainDesc.innerHTML = bundleProduct.description || 'Premium cable machine attachments bundle.';
          }

          // ── Judge.me rating (Option 1: anonymous widget API) ──
          if (ratingEl) {
            const judgeme = await getJudgeMeRating(bundleProduct.id);
            if (judgeme?.rating) {
              ratingEl.innerHTML = buildRatingHTML(judgeme.rating, judgeme.count);
            } else {
              // Fallback: show 5 stars with no count
              ratingEl.innerHTML = buildRatingHTML(null, 0);
            }
          }
          // ─────────────────────────────────────────────────────

        } else {
          if (mainDesc) mainDesc.innerHTML = 'Premium cable machine attachments bundle designed for comprehensive full-body training.';
          if (ratingEl) ratingEl.innerHTML = buildRatingHTML(null, 0);
        }
      }).catch(e => {
        console.log('[Bundle Selector] Could not fetch bundle product:', e);
        if (ratingEl) ratingEl.innerHTML = buildRatingHTML(null, 0);
      });

      // Handle individual products when ready
      const products = await individualProductsPromise;
      
      if (!productsGrid) return;
      
      // Destroy existing Slick instance if it exists
      if (typeof $ !== 'undefined' && $.fn.slick && $(productsGrid).hasClass('slick-initialized')) {
        $(productsGrid).slick('unslick');
      }
      
      productsGrid.innerHTML = '';
      
      console.log('[Bundle Selector] Rendering products:', products.filter(p => p).length, 'out of', config.skus.length);

      // Render products — fetch Judge.me ratings in parallel for all found products
      const judgemePromises = products.map(product =>
        product?.id ? getJudgeMeRating(product.id) : Promise.resolve(null)
      );
      const judgemeRatings = await Promise.all(judgemePromises);

      products.forEach((product, index) => {
        const name = config.productNames[index] || config.skus[index];
        const sku = config.skus[index];
        
        const productCard = document.createElement('div');
        productCard.className = 'bundle-product-card';
        
        let imageUrl = '/assets/no-image.png';
        if (product) {
          imageUrl = product.image || product.featured_image || (product.images && product.images[0]) || imageUrl;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `https:${imageUrl}`;
          }
        }
        
        const price = product?.price ? (product.price / 100).toFixed(2) : 'N/A';
        const comparePrice = product?.compare_at_price ? (product.compare_at_price / 100).toFixed(2) : null;

        // Use Judge.me data if available, otherwise fall back to 5 stars
        const jm = judgemeRatings[index];
        const rating = jm?.rating ?? 5;
        const reviewCount = jm?.count ?? 0;
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? '½' : '';
        const starsHTML = `${'★'.repeat(fullStars)}${halfStar}`;

        console.log(`[Bundle Selector] Product ${sku} — Judge.me rating: ${rating} (${reviewCount} reviews)`);

        productCard.innerHTML = `
          <div class="bundle-product-card__image">
            <img src="${imageUrl}" alt="${name}" width="120" height="120" loading="lazy" onerror="this.src='/assets/no-image.png'">
          </div>
          <div class="bundle-product-card__info">
            <div class="bundle-product-card__sku">SKU: ${sku}</div>
            <h5 class="bundle-product-card__title">${name}${product ? '' : ' (New)'}</h5>
            <div class="bundle-product-card__rating">
              <span class="rating-stars">${starsHTML}</span>
              ${reviewCount > 0 ? `<span class="rating-count">(${reviewCount})</span>` : ''}
            </div>
            <div class="bundle-product-card__price">
              ${comparePrice ? `<span class="price-compare">As high as: $${comparePrice}</span>` : ''}
              <span class="price-current">$${price} USD</span>
            </div>
          </div>
        `;
        
        productsGrid.appendChild(productCard);
      });
      
      if (products.filter(p => p).length === 0) {
        productsGrid.innerHTML = '<div class="loading">No products found. Please check SKU availability.</div>';
      } else {
        // Initialize Slick carousel for mobile only
        initProductsCarousel(productsGrid);
      }
      
      console.log('[Bundle Selector] Modal rendered');
    }

    // Close modal function
    function closeModal() {
      console.log('[Bundle Selector] Closing modal');
      const productsGrid = modal.querySelector('#bundle-products-grid');
      
      // Destroy Slick instance before closing
      if (productsGrid && typeof $ !== 'undefined' && $.fn.slick && $(productsGrid).hasClass('slick-initialized')) {
        $(productsGrid).slick('unslick');
      }
      
      modal.hidden = true;
      modal.style.display = 'none';
      document.body.style.overflow = '';
      document.body.classList.remove('bundle-modal-open');
    }

    // Open modal
    bundleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bundleSet = link.getAttribute('data-bundle-set');
        renderBundleModal(bundleSet);
      });
    });

    // Close modal handlers
    if (modalClose) {
      modalClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          closeModal();
        }
      });
    }

    // Handle bundle selection
    bundleCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.bundle-card__link')) return;
        const bundleSet = card.getAttribute('data-bundle-set');
        handleBundleSelection(bundleSet, card);
      });
    });
    
    console.log('[Bundle Selector] Initialization complete');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBundleSelector);
  } else {
    initBundleSelector();
  }
})();