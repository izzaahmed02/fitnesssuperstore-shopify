// Bundle Selector functionality for Cable Attachments
(function() {
  'use strict';
  
  console.log('[Bundle Selector] Script loaded');
  
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

    // Fetch product details via API
    async function fetchProductDetails(handle) {
      try {
        // Use the custom view to get metafields
        const response = await fetch(`/products/${handle}?view=bundle-json`);
        if (!response.ok) {
          console.log(`[Bundle Selector] Product ${handle} not found (${response.status})`);
          return null;
        }
        const data = await response.json();
        console.log(`[Bundle Selector] Fetched product ${handle}:`, data.title);
        return data;
      } catch (error) {
        console.error(`[Bundle Selector] Error fetching product ${handle}:`, error);
        return null;
      }
    }

    // Find product by SKU using Shopify API
    async function findProductBySKU(sku) {
      try {
        const searchUrl = `/search?q=${encodeURIComponent(sku)}&type=product&options[unavailable_products]=last&options[prefix]=none`;
        
        try {
          const jsonResponse = await fetch(`${searchUrl}&view=json`);
          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json();
            if (jsonData.results && jsonData.results.length > 0) {
              const productHandle = jsonData.results[0].handle;
              const product = await fetchProductDetails(productHandle);
              if (product && product.variants) {
                const variant = product.variants.find(v => v.sku === sku || v.sku === sku.toUpperCase());
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
                    sku: sku,
                    metafields: product.metafields
                  };
                }
              }
            }
          }
        } catch (e) {
          const searchResponse = await fetch(searchUrl);
          const searchText = await searchResponse.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(searchText, 'text/html');
          const productLinks = doc.querySelectorAll('a[href*="/products/"]');
          
          for (const link of productLinks) {
            const href = link.getAttribute('href');
            const handleMatch = href.match(/\/products\/([^\/\?]+)/);
            if (handleMatch) {
              const product = await fetchProductDetails(handleMatch[1]);
              if (product && product.variants) {
                const variant = product.variants.find(v => v.sku === sku || v.sku === sku.toUpperCase());
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
                    sku: sku,
                    metafields: product.metafields
                  };
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[Bundle Selector] Error in findProductBySKU:', error);
      }
      return null;
    }

    // Render bundle modal
    async function renderBundleModal(bundleSet) {
      console.log('[Bundle Selector] Opening modal for bundle', bundleSet);
      const config = bundleConfig[bundleSet];
      if (!config) {
        console.error('[Bundle Selector] Invalid bundle set:', bundleSet);
        return;
      }

      // Show loading state
      const mainTitle = modal.querySelector('#bundle-main-title');
      const mainDesc = modal.querySelector('#bundle-main-description');
      const productsGrid = modal.querySelector('#bundle-products-grid');
      
      if (mainTitle) mainTitle.textContent = config.title;
      if (mainDesc) mainDesc.textContent = 'Loading...';
      if (productsGrid) productsGrid.innerHTML = '<div class="loading">Loading products...</div>';
      
      // Show modal
      modal.hidden = false;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('bundle-modal-open');

      // Fetch bundle product (main product)
      const bundleProductHandle = `french-fitness-cable-machine-attachment-${bundleSet === 'A' ? '3-piece-base-kit' : bundleSet === 'B' ? '5-piece-complete-set' : '12-piece-ultimate-bundle'}-new`;
      let bundleProduct = null;
      
      try {
        bundleProduct = await fetchProductDetails(bundleProductHandle);
      } catch (e) {
        console.log('[Bundle Selector] Could not fetch bundle product, using fallback');
      }

      // If bundle product found, display it
      const mainImage = modal.querySelector('#bundle-main-image');
      if (bundleProduct && mainImage) {
        const imageUrl = bundleProduct.featured_image || (bundleProduct.images && bundleProduct.images[0]) || '';
        mainImage.src = imageUrl;
        mainImage.alt = bundleProduct.title || config.title;
        if (mainTitle) mainTitle.textContent = bundleProduct.title || config.title;
        // Render HTML description properly
        if (mainDesc) {
          mainDesc.innerHTML = bundleProduct.description || 'Premium cable machine attachments bundle.';
        }
        
        const ratingEl = modal.querySelector('#bundle-main-rating');
        if (ratingEl) {
          // Check if we have metafields with rating data
          const ratingData = bundleProduct.metafields?.reviews?.rating;
          const ratingCountData = bundleProduct.metafields?.reviews?.rating_count;
          
          if (ratingData && typeof ratingData === 'number') {
            // Rating is available as a number
            const rating = ratingData;
            const reviewCount = ratingCountData || 0;
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            ratingEl.innerHTML = `
              <div class="rating-stars">${'★'.repeat(fullStars)}${hasHalfStar ? '½' : ''}${'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}</div>
              <span>${reviewCount} reviews</span>
            `;
          } else if (ratingData && typeof ratingData === 'object' && ratingData.value) {
            // Rating might be nested in value object
            const rating = ratingData.value;
            const reviewCount = ratingCountData || 0;
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            ratingEl.innerHTML = `
              <div class="rating-stars">${'★'.repeat(fullStars)}${hasHalfStar ? '½' : ''}${'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}</div>
              <span>${reviewCount} reviews</span>
            `;
          } else {
            // Default fallback
            ratingEl.innerHTML = '<div class="rating-stars">★★★★★</div><span>31 reviews</span>';
          }
        }
      } else {
        // Fallback display when bundle product is not found
        if (mainTitle) mainTitle.textContent = config.title;
        if (mainDesc) mainDesc.innerHTML = 'Premium cable machine attachments bundle designed for comprehensive full-body training.';
        const ratingEl = modal.querySelector('#bundle-main-rating');
        if (ratingEl) ratingEl.innerHTML = '<div class="rating-stars">★★★★★</div><span>31 reviews</span>';
      }

      // Fetch and display individual products
      if (!productsGrid) return;
      productsGrid.innerHTML = '';

      const productPromises = config.skus.map(async (sku, index) => {
        const product = await findProductBySKU(sku);
        return {
          product,
          name: config.productNames[index] || sku,
          sku
        };
      });

      const products = await Promise.all(productPromises);
      
      console.log('[Bundle Selector] Products fetched:', products.filter(p => p.product).length, 'out of', config.skus.length);

      products.forEach(({ product, name, sku }) => {
        const productCard = document.createElement('div');
        productCard.className = 'bundle-product-card';
        
        // Get image URL - try multiple sources
        let imageUrl = '/assets/no-image.png';
        if (product) {
          imageUrl = product.image || product.featured_image || (product.images && product.images[0]) || imageUrl;
          // Convert Shopify image URL if needed
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `https:${imageUrl}`;
          }
        }
        
        const price = product?.price ? (product.price / 100).toFixed(2) : 'N/A';
        const comparePrice = product?.compare_at_price ? (product.compare_at_price / 100).toFixed(2) : null;
        
        // Handle rating data flexibly
        const ratingData = product?.metafields?.reviews?.rating;
        const rating = typeof ratingData === 'number' ? ratingData : 
                       (typeof ratingData === 'object' && ratingData?.value) ? ratingData.value : 4.9;
        const reviewCount = product?.metafields?.reviews?.rating_count || 31;

        productCard.innerHTML = `
          <div class="bundle-product-card__image">
            <img src="${imageUrl}" alt="${name}" width="120" height="120" loading="lazy" onerror="this.src='/assets/no-image.png'">
          </div>
          <div class="bundle-product-card__info">
            <div class="bundle-product-card__sku">#${sku}</div>
            <h5 class="bundle-product-card__title">${name}${product ? '' : ' (New)'}</h5>
            <div class="bundle-product-card__rating">
              <span class="rating-stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
              <span class="review-count">${reviewCount} reviews</span>
            </div>
            <div class="bundle-product-card__price">
              ${comparePrice ? `<span class="price-compare">As high as: $${comparePrice}</span>` : ''}
              <span class="price-current">$${price} USD</span>
            </div>
          </div>
        `;
        
        productsGrid.appendChild(productCard);
      });
      
      if (products.filter(p => p.product).length === 0) {
        productsGrid.innerHTML = '<div class="loading">No products found. Please check SKU availability.</div>';
      }
      
      console.log('[Bundle Selector] Modal rendered');
    }

    // Close modal function
    function closeModal() {
      console.log('[Bundle Selector] Closing modal');
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

    // Handle bundle selection (selection only; add with main product on ATC)
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