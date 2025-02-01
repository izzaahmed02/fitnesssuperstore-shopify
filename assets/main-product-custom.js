const container = document.getElementById('dynamic-product-content');
const modalWrapper = document.querySelector('.modal-wrapper');
const modalContent = document.querySelector('#dynamic-product-content');
const closeIconTemplate = document.getElementById('icon-close-template').innerHTML;

window.addEventListener('DOMContentLoaded', async () => {
	function checkForElements() {
		const shippingInfo = document.querySelector(
			'.docapp-single-shipping-calculator .docapp-shipping-show-trigger'
		);
		const cityInput = document.querySelector('input[name="shipping_address[city]"]');
		const zipInput = document.querySelector('input[name="shipping_address[zip]"]');
		const shippingType = document.querySelector(
			'.avp-option.ap-options__select-container:has(select[name^="Full Assembly & Installation"])'
		);

		if (shippingInfo && cityInput && zipInput) {
			cityInput.addEventListener('input', () => {
				localStorage.setItem('city', cityInput.value);
			});

			zipInput.addEventListener('input', () => {
				localStorage.setItem('zip', zipInput.value);
			});

			getFormDataAndDisplay(cityInput, zipInput, shippingInfo);

			if (shippingType) {
				shippingInfo.parentElement.insertAdjacentElement('afterend', shippingType);
				shippingType.style.display = 'block';

				const apoTitle = shippingType.querySelector('.apo-title');
				if (apoTitle) {
					apoTitle.setAttribute('style', 'font-size: 12px !important; margin-bottom: 6px;');
				}
			}

			clearInterval(pollingInterval);
		}

		document.querySelector('.docapp-shipping-calculator--button')?.addEventListener('click', () => {
			const shippingInfo = document.querySelector(
				'.docapp-single-shipping-calculator .docapp-shipping-show-trigger'
			);
			const cityInput = document.querySelector('input[name="shipping_address[city]"]');
			const zipInput = document.querySelector('input[name="shipping_address[zip]"]');
			const shippingType = document.querySelector(
				'.avp-option.ap-options__select-container:has(select[name^="Full Assembly & Installation"])'
			);

			if (shippingInfo && cityInput && zipInput) {
				getFormDataAndDisplay(cityInput, zipInput, shippingInfo);

				if (shippingType) {
					shippingInfo.parentElement.insertAdjacentElement('afterend', shippingType);

					const apoTitle = shippingType.querySelector('.apo-title');
					if (apoTitle) {
						apoTitle.setAttribute('style', 'font-size: 12px !important; margin-bottom: 6px;');
					}
				}
			}
		});
	}

	function getFormDataAndDisplay(cityInput, zipInput, shippingInfo) {
		const city = cityInput.value || localStorage.getItem('city') || 'Not entered';
		const zip = zipInput.value || localStorage.getItem('zip') || 'Not entered';
		const shippingData = document.querySelector('.shipping-data');
		const resultText = `${city}, ${zip}`;

		if (shippingData) {
			shippingData.innerHTML = resultText;
			shippingInfo.appendChild(shippingData);
		} else {
			const shippingData = document.createElement('span');
			shippingData.classList.add('shipping-data');

			shippingData.innerHTML = resultText;
			shippingInfo.appendChild(shippingData);
		}
	}

	const pollingInterval = setInterval(checkForElements, 1000);

	let currentPageIndex = 0; 
    
    function attachArrowHandlers() {
      document.querySelector('.next-arrow').addEventListener('click', () => {
		var activeIndex = document.querySelector('.sa_page.active') ? parseFloat(document.querySelector('.sa_page.active').value) : 0;
		currentPageIndex = activeIndex; 
        saOpenPage(currentPageIndex, sa_start_sort); 
      });

      document.querySelector('.prev-arrow').addEventListener('click', () => {
		var activeIndex = document.querySelector('.sa_page.active') ? parseFloat(document.querySelector('.sa_page.active').value) : 0;
		currentPageIndex = activeIndex - 2; 
		saOpenPage(currentPageIndex, sa_start_sort);
      });
    }

    function addPaginationArrows() {
      const paginationContainer = document.getElementById("sa_review_paging");
  
      if (paginationContainer) {
        if (!paginationContainer.querySelector(".prev-arrow") && !paginationContainer.querySelector(".next-arrow")) {
          const prevArrow = document.createElement("button");
          prevArrow.className = "arrow custom prev-arrow";
          prevArrow.innerHTML = `
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7.53033 0.46967C7.82322 0.762563 7.82322 1.23744 7.53033 1.53033L2.06066 7L7.53033 12.4697C7.82322 12.7626 7.82322 13.2374 7.53033 13.5303C7.23744 13.8232 6.76256 13.8232 6.46967 13.5303L0.46967 7.53033C0.176777 7.23744 0.176777 6.76256 0.46967 6.46967L6.46967 0.46967C6.76256 0.176777 7.23744 0.176777 7.53033 0.46967Z" fill="#CCCCCC"/>
            </svg>
          `;
  
          const nextArrow = document.createElement("button");
          nextArrow.className = "arrow custom next-arrow";
          nextArrow.innerHTML = `
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.46967 0.46967C0.762563 0.176777 1.23744 0.176777 1.53033 0.46967L7.53033 6.46967C7.82322 6.76256 7.82322 7.23744 7.53033 7.53033L1.53033 13.5303C1.23744 13.8232 0.762563 13.8232 0.46967 13.5303C0.176777 13.23744 0.176777 12.7626 0.46967 12.4697L5.93934 7L0.46967 1.53033C0.176777 1.23744 0.176777 0.762563 0.46967 0.46967Z" fill="#F1592A"/>
            </svg>
          `;
  
          paginationContainer.prepend(prevArrow); 
          paginationContainer.appendChild(nextArrow);

          attachArrowHandlers();
        }
      }
    }

    function addCustomActions() {
      const dropdownContainer = document.createElement('div');
      dropdownContainer.classList.add('sa-reviews-dropdown-container');

      const sortByDropdown = document.createElement('select');
      sortByDropdown.setAttribute('id', 'sortByDropdown');
      sortByDropdown.innerHTML = `
        <option value="high">Sort by: Highest to Lowest</option>
        <option value="low">Sort by: Lowest to Highest</option>
        <option value="new">Sort by: Newest to Oldest</option>
        <option value="old">Sort by: Oldest to Newest</option>
        <option value="featured">Sort by: Favorite Reviews</option>
      `;
      dropdownContainer.appendChild(sortByDropdown);
      
      const showContainer = document.createElement('div');
      showContainer.setAttribute('class', 'show-dropdown-container');
      
    //   const showLabel = document.createElement('label');
    //   showLabel.setAttribute('for', 'showDropdown');
    //   showLabel.textContent = 'Show';
    //   showLabel.classList.add('show-label'); 
    //   showContainer.appendChild(showLabel);
      
    //   const showDropdown = document.createElement('select');
    //   showDropdown.setAttribute('id', 'showDropdown');
    //   showDropdown.innerHTML = `
    //     <option value="all">All Ratings</option>
    //     <option value="5">5 Stars</option>
    //     <option value="4">4 Stars</option>
    //   `;
    //   showContainer.appendChild(showDropdown);
      
      dropdownContainer.appendChild(showContainer);
       
      const writeReviewButton = document.createElement('a');
      writeReviewButton.setAttribute('id', 'writeReviewButton');
      writeReviewButton.setAttribute('href', 'https://www.shopperapproved.com/reviews/fitnesssuperstore.com#reviews');
      writeReviewButton.setAttribute('target', '_blank'); 
      writeReviewButton.setAttribute('rel', 'noopener noreferrer'); 
      writeReviewButton.textContent = 'Write a Review';
      writeReviewButton.classList.add('write-review-btn');
      dropdownContainer.appendChild(writeReviewButton); 
     
	  const productPage = document.querySelector('#product_page');
	  const reviewHeader = document.querySelector('#review_header');
	  const existingDropdownContainer = document.querySelector('.sa-reviews-dropdown-container');
	  
	  if (productPage && reviewHeader && !existingDropdownContainer) {
		productPage.parentNode.insertBefore(dropdownContainer, productPage);
	  }
    }
  
    function registerSAReviewsPolling() {
      const interval = setInterval(function () {
        const reviewSection = document.querySelector("#sa_review_paging");
		if (reviewSection) {
			addCustomActions();

			if (Object.keys(sa_product_reviews.high).length > sa_products_count) {
				addPaginationArrows();
			}

			if (document.querySelector('.merchantheader')) {
				document.querySelector('.sa-reviews').style.display = 'none';
				document.querySelector('.available-wrap').style.flexDirection = 'row-reverse'
			}
		}
      }, 500);
    }

    function registerCustomActionEvent() {
		setTimeout(() => {
			let sortByDropDownCurrentValue = '';
			let showDropDownCurrentValue = '';
	
			const sortByDropdown = document.getElementById('sortByDropdown');
			const saSort = document.getElementById('sa_sort');
			var showDropdownSelect = document.getElementById('showDropdown');
	
			if (sortByDropdown) {
				sortByDropDownCurrentValue = sortByDropdown.value;
			}
	
			if (sortByDropdown && saSort) {
			  const newSortByDropdown = sortByDropdown.cloneNode(true);
	
			  sortByDropdown.value = saSort.value;

			  sortByDropdown.parentNode.replaceChild(newSortByDropdown, sortByDropdown);
		
			  if (sortByDropDownCurrentValue) {
				newSortByDropdown.value = sortByDropDownCurrentValue;
			  }

			  newSortByDropdown.addEventListener('change', () => {
				if (saJQ('#review_header').length > 0) {
					saJQ('html, body').animate({
						scrollTop: saJQ('#review_header').offset().top
					});
				}
				saJQ('#product_page').toggleClass('sa_loading_bg', true);
				saJQ('#sa_review_section').animate({
					opacity: 0
				}, 300);
				sort = newSortByDropdown.value;
				var reverse = (typeof (sa_productreverse) == 'undefined') ? '' : '&reverse=' + sa_productreverse;
				var productId = (typeof (sa_product) != 'undefined') ? sa_product : sa_productid;
				saLoadScript(sa_host + 'widgets/' + sa_page + '.php?siteid=' + sa_siteid + '&productid=' + productId + '&page=0&sort=' + sort + reverse + '&loadnow=1' + '&rtype=' + sa_rtype);
				registerCustomActionEvent();
			  });
	
			  
			// if (showDropdownSelect) {
			// 	showDropDownCurrentValue = showDropdownSelect.value;
			// }
	
			//   const newShowDropdownSelect = showDropdownSelect.cloneNode(true);
	
			//   showDropdownSelect.parentNode.replaceChild(newShowDropdownSelect, showDropdownSelect);
	
			//   if (showDropDownCurrentValue) {
			// 	newShowDropdownSelect.value = showDropDownCurrentValue;
			//   }  
		
			//   newShowDropdownSelect.addEventListener('change', () => {
			// 	if (newShowDropdownSelect.value === '5') {
			// 		saSort.value = 'high';
			// 	} else if (newShowDropdownSelect.value === '4') {
			// 		saSort.value = 'low';
			// 	} else {
			// 		saSort.value = 'high';
			// 	}
	
			// 	const changeEvent = new Event('change');
			// 	saSort.dispatchEvent(changeEvent);
		
			// 	registerCustomActionEvent();
			//   });
			}
		}, 1000);
    }
    
    registerSAReviewsPolling();
	registerCustomActionEvent(); 
});

let optionProductsPopup = [];

async function fetchProductByHandle(handle) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/option/${handle}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch product by handle");
		}

		const data = await response.json();
		return data.products[0];
	} catch (error) {
		console.error("Error fetching product by handle:", error);
		return null;
	}
}

async function fetchProductByTitle(title) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/productbytitle?title=${title}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch product by title");
		}

		const data = await response.json();
		return data.products[0];
	} catch (error) {
		console.error("Error fetching product by title:", error);
		return null;
	}
}

async function fetchProductMetafields(productId) {
    const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metafields/${productId}/`;
    try {
      const response = await fetch(shopifyUrl, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch product metafields");
      }
  
      const data = await response.json();
      return data.metafields;
    } catch (error) {
      console.error("Error fetching product metafields:", error);
      return null;
    }
}

async function fetchProductDetails(productId) {
    const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/product/${productId}`;

    try {
      const response = await fetch(shopifyUrl, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }
  
      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error("Error fetching product details:", error);
      return null;
    }
}

async function fetchProductDetailsWithMetafields(productId) {
    const productUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/product/${productId}`;
    const metafieldsUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metafields/${productId}/`;
  
    try {
      const [productResponse, metafieldsResponse] = await Promise.all([
        fetch(productUrl, {
          method: "GET",
        }),
        fetch(metafieldsUrl, {
          method: "GET",
        }),
      ]);
  
      if (!productResponse.ok || !metafieldsResponse.ok) {
        throw new Error("Failed to fetch product details or metafields");
      }
  
      const productData = await productResponse.json();
      const metafieldsData = await metafieldsResponse.json();

      productData.product.metafields = metafieldsData.metafields;
      return productData.product;
    } catch (error) {
      console.error("Error fetching product details with metafields:", error);
      return null;
    }
}  
  
async function fetchProductMetaObject(metaObjectId) {
    const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metaobject?metaobjectId=${metaObjectId}`;

    try {
      const response = await fetch(shopifyUrl, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch metaobject");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching meta object:", error);
      return null;
    }
}

async function renderOptionPopupProducts(title) {
    const product = await fetchProductByTitle(title);

    if (!product) {
      console.error("No product found for the given title.");
      return;
    }
  
    const productId = product.id;
  
    const metafields = await fetchProductMetafields(productId);
    if (!metafields) {
      console.error("No metafields found for the product.");
      return null;
    }
  
    const relatedProductsMetafield = metafields.find(
      (field) => field.key === "related_products"
    );

    if (!relatedProductsMetafield || !relatedProductsMetafield.value) {
      console.error("No related products found in the metafield.");
      return null;
    }
  
    const optionProductIds = JSON.parse(relatedProductsMetafield.value).map((id) =>
      id.split("/").pop()
    );
  
    const optionProducts = await Promise.all(
        optionProductIds.map((id) => fetchProductDetailsWithMetafields(id))
    );

    optionProductsPopup = optionProducts;

    let contentHTML = `<div class="option-title"><h2>ABOUT OPTIONS - ${product.title}</h2></div><div class="option-products">`;

    optionProducts.forEach((product) => {
        const shortDescriptionMetafield = product.metafields.find(
            (metafield) => metafield.key === "short_description"
          );
        
        const shortDescription = shortDescriptionMetafield
            ? shortDescriptionMetafield.value
            : "No short description available.";

        const originalPrice = parseFloat(product.variants[0].price); 
        const price = Shopify.country !== 'US' ? (originalPrice * Shopify.currency.rate).toFixed(2) : originalPrice.toFixed(2); 
            
        contentHTML += `
          <div class="product-card" data-product-id="${product.id}">
            <div class="product-card__img"><img src="${product.images[0]?.src}" alt="${product.title}" /></div>
            <h4 class="product-card__title">${product.title}</h4>
            <div class="product-card__mid">
                <span class="product-card__code">#${product.variants[0].sku}</span>
                <span class="product-card__price">${Shopify.country !== 'US' ? Shopify.currency.active + ` ${price}` : `$${price}`}</span>
            </div>
            <p class="product-card__description">${shortDescription.substring(0, 150)}...</p>
            <a class="read-more-btn" data-id="${product.id}">Read more</a>
          </div>`;
      });

      let productDetailsHTML = `<div class="product-details-container">

        </div>
            <div class="product-details-description-body">
        </div>
        `;

      contentHTML += productDetailsHTML;
      contentHTML += '</div>'

      return contentHTML;
 }

try {

	document.addEventListener('DOMContentLoaded', (event) => {	
		document.querySelectorAll('.metainfo-wrapper .more-info').forEach(element => {
			element.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				var currentProduct = window.product;

				if (currentProduct) {
					var customFieldvalue = element.dataset.customfield;	
					var brand = currentProduct.vendor

					if (customFieldvalue) {			
						if (customFieldvalue == 'Warranty' && brand == 'French Fitness') {
							customFieldvalue = `${brand} ${customFieldvalue} Custom Field`
						} else {
							customFieldvalue += ' Custom Field';
						}
						
						var product = await fetchProductByTitle(customFieldvalue);
						if (product) {
							modalWrapper.style.display = 'flex';
							const tempDiv = document.createElement('div');
							tempDiv.innerHTML = product.body_html;
							const mainContent = tempDiv;
							container.innerHTML = mainContent.innerHTML + `<span class="modal-close">${closeIconTemplate}</span>`;
	
							const closeModalButton = container.querySelector('.modal-close');
	
							closeModalButton.addEventListener('click', () => {
								modalWrapper.style.display = 'none';
							});
						};
					}
				}
			});
		});

		var avisOptionsPolling = setInterval(() => {
			if (!document.querySelector('.avpoptions-container__v2'))
				return;

			clearInterval(avisOptionsPolling);

			document.querySelectorAll('.ap-label-tooltip').forEach(element => {
				const style = document.createElement('style');
				style.textContent = `.ap-label-tooltip::after { display: none !important; }`;
				document.head.appendChild(style);

				element.innerHTML += `
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z" fill="#F1592A"/>
                </svg>`;
				const toolTip = element.querySelector('svg');
				if (toolTip) {
					toolTip.addEventListener('click', async (event) => {
						event.preventDefault();
						event.stopPropagation();
						const parentWithHandle = element.closest('[class^="handle-"]');
						modalWrapper.style.display = 'flex';
						container.innerHTML = '';
						const productTitle = parentWithHandle.querySelector('.apo-title')?.innerText;

						if (productTitle) {
                            let optionHTML = '';
                            var optionPopupProductsHtml = await renderOptionPopupProducts(productTitle);

                            if (!optionPopupProductsHtml) {
								const encodedProductTitle = encodeURIComponent(productTitle);
                                var product = await fetchProductByTitle(encodedProductTitle);
                                if (product) {
                                    optionHTML = product.body_html;
                                }
                            } else {
                                optionHTML = optionPopupProductsHtml;
                            }

                            if (optionHTML) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = optionHTML;
                                const mainContent = tempDiv;
                                if (mainContent) {
                                    container.innerHTML =
                                        mainContent.innerHTML + `<span class="modal-close">${closeIconTemplate}</span>`;
										const closeModalButton = document.querySelector('.modal-close');
										closeModalButton.addEventListener('click', () => {
											modalWrapper.style.display = 'none';
										});

                                    const scripts = mainContent.querySelectorAll('script');
                                    scripts.forEach((script) => {
                                        const newScript = document.createElement('script');
                                        if (script.src) {
                                            newScript.src = script.src;
                                        } else {
                                            newScript.textContent = script.textContent;
                                        }
                                        document.body.appendChild(newScript);
                                    });

                                    const modalImgs = container.querySelectorAll('#dynamic-product-content img');
                                    modalImgs.forEach((img) => {
                                        const src = img.src;
                                        const fileName = src.split('/').pop();
                                        const newSrc = `https://cdn.shopify.com/s/files/1/0884/2012/2940/files/${fileName}`;
                                        img.src = newSrc;
                                    });

                                    const productCards = document.querySelectorAll('.product-card');

                                    if (productCards) {
                                        productCards.forEach(p => {
                                            var productId = parseInt(p.getAttribute('data-product-id'));
                                            var product = optionProductsPopup.find(x => x.id === productId);
                                            if (product) {
                                                p.addEventListener('click', () => {
                                                    const shortDescriptionMetafield = product.metafields.find(
                                                        (metafield) => metafield.key === "short_description"
                                                      );
                                                    
                                                    const shortDescription = shortDescriptionMetafield
                                                        ? shortDescriptionMetafield.value
                                                        : "No short description available.";

                                                    var productDetailsHTML = `<div class="product-details__product-image">
                                                        <img src="${product.image.src}" alt="${product.title}">
                                                    </div>
                                                    <div class="product-details__product-info">
                                                        <h2 class="product-details__title">${product.title}</h2>
                                                        <p class="product-details__short_description">${shortDescription}</p>
                                                    </div>`

                                                    const productDetailsContainer = document.querySelector('.product-details-container');
                                                    const productDetailsDescriptionBody = document.querySelector('.product-details-description-body')
                                                    productDetailsContainer.style.display = 'flex';
                                                    productDetailsContainer.innerHTML = productDetailsHTML;

                                                    const productDetailsDescriptionBodyDiv = document.createElement('div');
                                                    productDetailsDescriptionBodyDiv.innerHTML = product.body_html.replace(shortDescription, '');
                                                    removeEmptyElements(productDetailsDescriptionBodyDiv);
                                                    clearImages(productDetailsDescriptionBodyDiv);
                                                    productDetailsDescriptionBody.innerHTML = productDetailsDescriptionBodyDiv.innerHTML;
                                                })
                                            }
                                        });
										productCards[0]?.click();
                                    }
                                } else {
                                    console.error('MainContent not found in the fetched HTML.');
                                }
                            }
						}
					});
				}
			});
		}, 100)

		modalWrapper.addEventListener('click', () => {
			modalWrapper.style.display = 'none';
		});

		modalContent.addEventListener('click', (event) => {
			event.stopPropagation();
		});

		if (Shopify.country === 'US') {
			var afterPayIntervalTrigger = setInterval(() => {
				var afterPayModalContainer = document.querySelector('afterpay-modal');
				if (afterPayModalContainer) {
					var productPrice = parseFloat(document.querySelector('.hidden-product-price').innerHTML);
					const priceInDollars = (productPrice / 100);
					if (priceInDollars >= 400) {
						document.querySelector('.paylater-container').style.display = 'flex';
						document.querySelector('.paylater-text').innerHTML = `<span>As low as ${document.querySelector('square-placement').shadowRoot.querySelector('.afterpay-text2 strong').innerHTML} / 4 interest-free payment</span><svg onclick="showPayLaterModal()" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z" fill="#F1592A"></path>
					  </svg>`
					}

					document.querySelector('.paylater-logo').innerHTML += `<svg style="" onclick="document.querySelector('square-placement').shadowRoot.querySelector('button').click()" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="104" height="36" viewBox="0 0 104 36">
                    <path class="afterpay-logo-badge-background" fill="#b2fce4" d="m86.00173,35.9321l-68.00064,0c-9.90375,0 -17.93101,-8.02726 -17.93101,-17.93101l0,0c0,-9.90375 8.02726,-17.93101 17.93101,-17.93101l68.00064,0c9.90375,0 17.931,8.02726 17.931,17.93101l0,0c0.00652,9.89724 -8.02725,17.93101 -17.931,17.93101z"></path>
                    <g class="afterpay-logo-badge-lockup">
                      <path d="m88.23074,13.52071l-2.25928,-1.29288l-2.29193,-1.31247c-1.51489,-0.86845 -3.40851,0.22201 -3.40851,1.97197l0,0.29384c0,0.16324 0.08489,0.31342 0.22854,0.39178l1.06435,0.60726c0.29383,0.16978 0.6595,-0.0457 0.6595,-0.38525l0,-0.69868c0,-0.34607 0.37219,-0.56155 0.67256,-0.39178l2.0895,1.20147l2.08298,1.19493c0.30037,0.16977 0.30037,0.60727 0,0.77704l-2.08298,1.19494l-2.0895,1.20146c-0.30037,0.16978 -0.67256,-0.0457 -0.67256,-0.39178l0,-0.34607c0,-1.74997 -1.89362,-2.84696 -3.40851,-1.97198l-2.29193,1.31247l-2.25928,1.29289c-1.52142,0.87498 -1.52142,3.07549 0,3.95047l2.25928,1.29289l2.29193,1.31247c1.51489,0.86845 3.40851,-0.22201 3.40851,-1.97198l0,-0.29383c0,-0.16325 -0.08489,-0.31343 -0.22854,-0.39179l-1.06435,-0.60726c-0.29383,-0.16977 -0.6595,0.04571 -0.6595,0.38525l0,0.69868c0,0.34608 -0.37219,0.56156 -0.67256,0.39179l-2.0895,-1.20147l-2.08298,-1.19494c-0.30037,-0.16977 -0.30037,-0.60726 0,-0.77703l2.08298,-1.19494l2.0895,-1.20147c0.30037,-0.16977 0.67256,0.04571 0.67256,0.39179l0,0.34607c0,1.74996 1.89362,2.84695 3.40851,1.97197l2.29193,-1.31247l2.25928,-1.29288c1.52142,-0.88151 1.52142,-3.0755 0,-3.95048z"></path>
                      <path d="m73.4083,13.95167l-5.28907,10.92421l-2.19398,0l1.9785,-4.08107l-3.11467,-6.84314l2.25275,0l1.99809,4.58386l2.18092,-4.58386l2.18746,0z"></path>
                      <path d="m20.52416,17.83032c0,-1.30594 -0.9468,-2.2201 -2.10909,-2.2201s-2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201s2.10909,-0.91416 2.10909,-2.2201m0.01959,3.87865l0,-1.00558c-0.57461,0.69868 -1.43,1.12964 -2.44864,1.12964c-2.12869,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99251,0 1.82832,0.43749 2.40293,1.11658l0,-0.97946l1.90668,0l0,7.7573l-1.90668,0z"></path>
                      <path d="m31.72262,19.98513c-0.66603,0 -0.85539,-0.24813 -0.85539,-0.9011l0,-3.44116l1.22758,0l0,-1.6912l-1.22758,0l0,-1.89361l-1.95239,0l0,1.89361l-2.52047,0l0,-0.7705c0,-0.65297 0.24813,-0.9011 0.93375,-0.9011l0.43096,0l0,-1.50184l-0.94027,0c-1.61284,0 -2.37682,0.52891 -2.37682,2.14175l0,1.03822l-1.08393,0l0,1.68467l1.08393,0l0,6.0661l1.95238,0l0,-6.0661l2.52047,0l0,3.80029c0,1.58019 0.60727,2.26581 2.18746,2.26581l1.00557,0l0,-1.72384l-0.38525,0z"></path>
                      <path d="m38.73553,17.13164c-0.13713,-1.00557 -0.95987,-1.61284 -1.92627,-1.61284c-0.95986,0 -1.75649,0.58768 -1.95238,1.61284l3.87865,0zm-3.89824,1.208c0.13712,1.14923 0.95987,1.8022 2.00462,1.8022c0.82275,0 1.45613,-0.38525 1.82832,-1.00558l2.00462,0c-0.46361,1.64549 -1.93932,2.69677 -3.87865,2.69677c-2.34416,0 -3.98965,-1.64548 -3.98965,-3.98965c0,-2.34417 1.7369,-4.03536 4.03536,-4.03536c2.31152,0 3.98965,1.70425 3.98965,4.03536c0,0.16977 -0.01305,0.33955 -0.0457,0.49626l-5.94857,0z"></path>
                      <path d="m53.26414,17.83032c0,-1.2537 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.95986 2.1091,-2.2201m-6.14446,7.04556l0,-10.92421l1.90667,0l0,1.00558c0.57462,-0.71174 1.43001,-1.14923 2.44865,-1.14923c2.09603,0 3.74152,1.72384 3.74152,4.00271s-1.67814,4.01578 -3.78723,4.01578c-0.97946,0 -1.78261,-0.38526 -2.34417,-1.03823l0,4.08107l-1.96544,0l0,0.00653z"></path>
                      <path d="m62.09231,17.83032c0,-1.30594 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.91416 2.1091,-2.2201m0.01959,3.87865l0,-1.00558c-0.57462,0.69868 -1.43001,1.12964 -2.44865,1.12964c-2.12868,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99252,0 1.82832,0.43749 2.40294,1.11658l0,-0.97946l1.90667,0l0,7.7573l-1.90667,0z"></path>
                      <path d="m43.67852,14.70912s0.4832,-0.9011 1.67814,-0.9011c0.50931,0 0.8358,0.1763 0.8358,0.1763l0,1.97851s-0.71827,-0.44402 -1.37777,-0.35261c-0.6595,0.09142 -1.0774,0.69215 -1.0774,1.50184l0,4.59038l-1.97197,0l0,-7.75076l1.90667,0l0,0.75744l0.00653,0z"></path>
                    </g>
                  </svg>`
			
				  clearInterval(afterPayIntervalTrigger)
				}
			}, 500)
		}

        function removeEmptyElements(element) {
            const elements = element.querySelectorAll('p, div');
        
            elements.forEach(element => {
                if (
                    (!element.textContent.trim() && element.children.length === 0) || 
                    element.innerHTML.trim() === '<br>' || 
                    element.innerHTML.trim() === '<br><br>' || 
                    (!element.textContent.trim() && element.innerHTML.trim().match(/^<br\s*\/?>$/i)) 
                ) {
                    element.remove();
                }
            });

            const brElements = element.querySelectorAll('br');
            brElements.forEach(br => br.remove());
            
            const h5Elements = element.querySelectorAll('h5');
            h5Elements.forEach(h5 => h5.remove());

            const h6Elements = element.querySelectorAll('h6');
            h6Elements.forEach(h6 => h6.remove());
        }

        function clearImages(element) {
            const images = element.querySelectorAll('img');

            images.forEach(img => {
                if (img.parentElement) {
                    img.parentElement.remove();
                } else {
                    img.remove();
                }
            })
        }
	});
} catch (error) {
	console.log(error)
}

document.addEventListener('DOMContentLoaded', (event) => {
	var avisOptionsPolling = setInterval(() => {
		if (!document.querySelector('.avpoptions-container__v2'))
			return;

		clearInterval(avisOptionsPolling);

		const warrantySelect = document.querySelector('select[name="Warranty"]');

		if (warrantySelect) {
		  const warrantyParentContainer = warrantySelect.closest(".ap-options__select-container");
			
		  if (warrantyParentContainer) {
			const selectOptions = warrantyParentContainer.querySelector('select').options.length;

			if (selectOptions <= 1) {
				warrantyParentContainer.style.display = "none";
			}
		  }
		}
		
		if (window.product) {
			fetchProductDetailsWithMetafields(window.product.id).then((product) => {	 
				const metaField3rdParty = product.metafields.find(
					(metafield) => metafield.key === "3rd_party"
				);
		
				if (metaField3rdParty) {
					fetchProductMetaObject(metaField3rdParty.value).then((metaObject) => {
						if (metaObject.fields) {
							const googleMaterial = metaObject.fields.find(
								(metaObject) => metaObject.key === "google_material"
							);
				
							if (googleMaterial && googleMaterial.value.includes('display')) {
								document.querySelector('.showroom').style.display = 'flex';
								document.querySelector('.showroom-text').innerHTML = 'On Display at our Northern California Warehouse Showroom'
							}
						}
					});
				}
			});
		}

		setupOptionsHandler();

		const dropdownContainers = document.querySelectorAll('.ap-options__swatch-container');

		dropdownContainers.forEach(container => {
			const title = container.querySelector('.ap-label-tooltip');
			const content = container.querySelector('.ap-options__swatch');

			if (title && content) {
				title.addEventListener('click', () => {
					content.classList.toggle('show');
					title.classList.toggle('open');
				});
			}
		});

		const arrows = document.querySelectorAll('.option-avis-arrow-select');
		arrows.forEach((arrow) => arrow.addEventListener('click', () => {
			if (arrow.style.transform === "rotate(45deg)") {
				arrow.setAttribute('style', 'transform: rotate(225deg) !important');
			} else {
				arrow.setAttribute('style', 'transform: rotate(45deg) !important');
			}
		}))
	}, 100);
});

function setupOptionsHandler() {
	var handle = `[class^="handle-"]`
	const optionsContainer = document.querySelectorAll(handle);
	if (!optionsContainer) {
		console.error(`Element with class handle "${handle}" not found.`);
		return;
	}

	optionsContainer.forEach(optionContainer => {
		const optionLabel = optionContainer.querySelector('.ap-label-tooltip');
		if (!optionLabel) {
			console.error(`Label with class ".ap-label-tooltip" not found in "${handle}".`);
			return;
		}
	
		const selectedOptionsContainer = document.createElement('div');
		selectedOptionsContainer.classList.add('selected_options_container');
		optionLabel.append(selectedOptionsContainer);
	
		const swatchContainer = optionContainer.querySelector('.ap-options__swatch')
			
		optionContainer.querySelectorAll('.avp-productoptionswatchwrapper').forEach(wrapper => {
			wrapper.addEventListener('click', event => {
				const input = wrapper.querySelector('input[type="radio"]');

				const allInputs = Array.from(swatchContainer?.querySelectorAll('input[type="radio"]'));

				const inputIndex = allInputs.indexOf(input);
				
				const inputTextValue = input.value;
				let inputMoneyValue;

				if (inputTextValue != 'No Thanks') {
					inputMoneyValue = input?.parentElement?.querySelector('.swatch-variant-title .money')?.innerText.replace('(', '').replace(')', '').replace('+', '');
				} else {
					inputMoneyValue = Shopify.currency.active == 'USD' ? "$0" : ''
				}
	
				const selectedOptionHTML = `
					<div class="option_selected-container">
						<p class="option_selected">${inputTextValue}</p>
						${inputMoneyValue ? `<span class="option_selected-price">${inputMoneyValue}</span>` : ''}
						<svg class="remove-icon" data-value="${inputIndex}" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M3.5771 3.57613C3.81142 3.34181 4.19132 3.34181 4.42563 3.57613L8.00137 7.15186L11.5771 3.57613C11.8114 3.34181 12.1913 3.34181 12.4256 3.57613C12.6599 3.81044 12.6599 4.19034 12.4256 4.42465L8.8499 8.00039L12.4256 11.5761C12.6599 11.8104 12.6599 12.1903 12.4256 12.4247C12.1913 12.659 11.8114 12.659 11.5771 12.4247L8.00137 8.84892L4.42563 12.4247C4.19132 12.659 3.81142 12.659 3.5771 12.4247C3.34279 12.1903 3.34279 11.8104 3.5771 11.5761L7.15284 8.00039L3.5771 4.42465C3.34279 4.19034 3.34279 3.81044 3.5771 3.57613Z" fill="black"/>
						</svg>
					</div>
				`;
	
				if (input.checked) {
					if (!selectedOptionsContainer?.querySelector(`[data-value="${inputIndex}"]`)) {
						selectedOptionsContainer.innerHTML = selectedOptionHTML;
					}
	
					Array.from(selectedOptionsContainer.children).forEach(option => {
						option.style.display = 'flex';
					});
	
					optionContainer.querySelectorAll('.avp-productoptionswatchwrapper').forEach(wrapper => {
						wrapper.setAttribute("style", "border: 1px solid #E5E5E5 !important;");
					});
	
					wrapper.setAttribute("style", "border: 1px solid #F1592A !important;");
	
					optionContainer.querySelectorAll('.remove-icon').forEach(icon => {
						icon.addEventListener('click', event => {
							event.stopPropagation();
							const optionSelectedContainer = event.target.closest('.option_selected-container');
							if (optionSelectedContainer) {
								const value = parseInt(icon.getAttribute('data-value'));
	
								const relatedInput = optionContainer.querySelectorAll('.avp-productoptionswatchwrapper input[type="radio"]')[value];

								if (relatedInput) {
									relatedInput.checked = false;
									relatedInput.dispatchEvent(new Event('change', {
										bubbles: true
									}));
									optionSelectedContainer.remove();
									wrapper.setAttribute("style", "border: 1px solid #E5E5E5 !important;");
								}
							}
						});
					})
	
				} else {
					const optionToRemove = selectedOptionsContainer.querySelector(`[data-value="${inputIndex}"]`);
					if (optionToRemove) {
						optionToRemove.closest('.option_selected-container').remove();
					}
	
					wrapper.setAttribute("style", "border: 1px solid #E5E5E5 !important;");
				}
			});
		});
	});
}

function computeAfterPayLoanDetails(principal, monthlyPayment, numPayments, newTerm = null) {
	function aprEquation(rate) {
        return (principal * rate) / (1 - Math.pow(1 + rate, -numPayments)) - monthlyPayment;
    }

    function solveAPR() {
        let lower = 0.0001,
            upper = 1, 
            guess;

        while ((upper - lower) > 1e-6) { 
            guess = (lower + upper) / 2;
            if (aprEquation(guess) > 0) {
                upper = guess;
            } else {
                lower = guess;
            }
        }
        return guess;
    }

    let monthlyRate = solveAPR();
    let apr = (monthlyRate * 12 * 100).toFixed(2); 

    let newMonthlyPayment = null;
    let totalPaymentsOriginal = (monthlyPayment * numPayments);
    let totalPaymentsNewTerm = null;

    if (newTerm) {
        newMonthlyPayment = ((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -newTerm))).toFixed(2);
        totalPaymentsNewTerm = (newMonthlyPayment * newTerm);
    }

    return {
        APR: apr + "%",
        MonthlyPaymentForNewTerm: newTerm ? `$${newMonthlyPayment}` : "N/A",
        TotalPaymentsOriginalTerm: `${parseFloat(totalPaymentsOriginal).toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
		  })}`,
        TotalPaymentsNewTerm: newTerm ? `${parseFloat(totalPaymentsOriginal).toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
		  })}` : "N/A"
    };
}


function computePayTomorrowAPR(principal, monthlyPayment, numPayments) {
    function aprEquation(rate) {
        return (principal * rate) / (1 - Math.pow(1 + rate, -numPayments)) - monthlyPayment;
    }

    function solveAPR() {
        let lower = 0.0001, 
            upper = 1, 
            guess;

        while ((upper - lower) > 1e-6) { 
            guess = (lower + upper) / 2;
            if (aprEquation(guess) > 0) {
                upper = guess;
            } else {
                lower = guess;
            }
        }
        return guess;
    }

    let monthlyRate = solveAPR();
    let apr = monthlyRate * 12 * 100; 
    return apr.toFixed(2); 
}f

function showPayLaterModal() {
	const payLaterAggregateHTML = generatePayLaterAggregate();

	if (generatePayLaterAggregate) {
		modalWrapper.style.display = 'flex';
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = payLaterAggregateHTML;
		const mainContent = tempDiv;
		container.innerHTML = mainContent.innerHTML + `<span class="modal-close">${closeIconTemplate}</span>`;

		const closeModalButton = container.querySelector('.modal-close');

		closeModalButton.addEventListener('click', () => {
			modalWrapper.style.display = 'none';
		});
	}
}

function generatePayLaterAggregate() {
	let productPriceElement = document.querySelector('.hidden-product-price-formatted').innerHTML;
	let buyNowPayLaterHTML = `<div class="buy-now-pay-later">
	<h1 class="title">BUY NOW. PAY LATER.</h1>
	<p class="price">Purchase price: <strong>$${productPriceElement}</strong>
	</p>
	<p class="description"> Select Affirm, Klarna, Afterpay or Paytomorrow as your payment method at checkout to pay in installments. </p>
	<div class="steps-container">
	  <div class="step">
		<div class="step-circle">1</div>
		<div class="step-text">Add items to your cart</div>
	  </div>
	  <div class="step-connector"> </div>
	  <div class="step">
		<div class="step-circle">2</div>
		<div class="step-text">Select payment method at checkout</div>
	  </div>
	  <div class="step-connector"> </div>
	  <div class="step">
		<div class="step-circle">3</div>
		<div class="step-text">Receive an approval decision</div>
	  </div>
	  <div class="step-connector"> </div>
	  <div class="step">
		<div class="step-circle">4</div>
		<div class="step-text">If approved, pay in installments</div>
	  </div>
	</div>
	<div class="options">${combinedPayLater()}</div>

  </div>`

  return buyNowPayLaterHTML;
}

function combinedPayLater() {
	let payLaterOptions = '';

	payLaterOptions += generateAfterPayPaymentTerms();
	payLaterOptions += generatePayTomorrowPaymentTerms();

	return payLaterOptions;
}

function generateAfterPayPaymentTerms() {
	const afterPayRateElement = document.querySelector('square-placement')?.shadowRoot?.querySelector('.afterpay-text2')?.innerHTML;

    if (afterPayRateElement) {
        let matchPrice = afterPayRateElement.match(/[\d,]+(\.\d{1,2})?/);
        let currentPrice = matchPrice ? parseFloat(matchPrice[0]) : null;

		if (currentPrice) {
		  let afterPayTermsHTML = ``
           
		  let productPrice = getProductPrice();
  
		  let afterPay12MosRate = computeAfterPayLoanDetails(productPrice, currentPrice, 12, 12)

          if (afterPay12MosRate) {
			afterPayTermsHTML += `<div class="option">
			<div class="option-details">
			  <p class="payment-info">
				<strong>12 payments of ${afterPay12MosRate.MonthlyPaymentForNewTerm}</strong>
			  </p>
			  <p class="apr">monthly, ${afterPay12MosRate.APR} APR</p>
			  <p class="total">Total: ${afterPay12MosRate.TotalPaymentsNewTerm}</p>
			</div>
			<a href="#" class="terms-link">
			  <svg style="" onclick="document.querySelector('square-placement').shadowRoot.querySelector('button').click()" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="104" height="36" viewBox="0 0 104 36">
                    <path class="afterpay-logo-badge-background" fill="#b2fce4" d="m86.00173,35.9321l-68.00064,0c-9.90375,0 -17.93101,-8.02726 -17.93101,-17.93101l0,0c0,-9.90375 8.02726,-17.93101 17.93101,-17.93101l68.00064,0c9.90375,0 17.931,8.02726 17.931,17.93101l0,0c0.00652,9.89724 -8.02725,17.93101 -17.931,17.93101z"></path>
                    <g class="afterpay-logo-badge-lockup">
                      <path d="m88.23074,13.52071l-2.25928,-1.29288l-2.29193,-1.31247c-1.51489,-0.86845 -3.40851,0.22201 -3.40851,1.97197l0,0.29384c0,0.16324 0.08489,0.31342 0.22854,0.39178l1.06435,0.60726c0.29383,0.16978 0.6595,-0.0457 0.6595,-0.38525l0,-0.69868c0,-0.34607 0.37219,-0.56155 0.67256,-0.39178l2.0895,1.20147l2.08298,1.19493c0.30037,0.16977 0.30037,0.60727 0,0.77704l-2.08298,1.19494l-2.0895,1.20146c-0.30037,0.16978 -0.67256,-0.0457 -0.67256,-0.39178l0,-0.34607c0,-1.74997 -1.89362,-2.84696 -3.40851,-1.97198l-2.29193,1.31247l-2.25928,1.29289c-1.52142,0.87498 -1.52142,3.07549 0,3.95047l2.25928,1.29289l2.29193,1.31247c1.51489,0.86845 3.40851,-0.22201 3.40851,-1.97198l0,-0.29383c0,-0.16325 -0.08489,-0.31343 -0.22854,-0.39179l-1.06435,-0.60726c-0.29383,-0.16977 -0.6595,0.04571 -0.6595,0.38525l0,0.69868c0,0.34608 -0.37219,0.56156 -0.67256,0.39179l-2.0895,-1.20147l-2.08298,-1.19494c-0.30037,-0.16977 -0.30037,-0.60726 0,-0.77703l2.08298,-1.19494l2.0895,-1.20147c0.30037,-0.16977 0.67256,0.04571 0.67256,0.39179l0,0.34607c0,1.74996 1.89362,2.84695 3.40851,1.97197l2.29193,-1.31247l2.25928,-1.29288c1.52142,-0.88151 1.52142,-3.0755 0,-3.95048z"></path>
                      <path d="m73.4083,13.95167l-5.28907,10.92421l-2.19398,0l1.9785,-4.08107l-3.11467,-6.84314l2.25275,0l1.99809,4.58386l2.18092,-4.58386l2.18746,0z"></path>
                      <path d="m20.52416,17.83032c0,-1.30594 -0.9468,-2.2201 -2.10909,-2.2201s-2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201s2.10909,-0.91416 2.10909,-2.2201m0.01959,3.87865l0,-1.00558c-0.57461,0.69868 -1.43,1.12964 -2.44864,1.12964c-2.12869,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99251,0 1.82832,0.43749 2.40293,1.11658l0,-0.97946l1.90668,0l0,7.7573l-1.90668,0z"></path>
                      <path d="m31.72262,19.98513c-0.66603,0 -0.85539,-0.24813 -0.85539,-0.9011l0,-3.44116l1.22758,0l0,-1.6912l-1.22758,0l0,-1.89361l-1.95239,0l0,1.89361l-2.52047,0l0,-0.7705c0,-0.65297 0.24813,-0.9011 0.93375,-0.9011l0.43096,0l0,-1.50184l-0.94027,0c-1.61284,0 -2.37682,0.52891 -2.37682,2.14175l0,1.03822l-1.08393,0l0,1.68467l1.08393,0l0,6.0661l1.95238,0l0,-6.0661l2.52047,0l0,3.80029c0,1.58019 0.60727,2.26581 2.18746,2.26581l1.00557,0l0,-1.72384l-0.38525,0z"></path>
                      <path d="m38.73553,17.13164c-0.13713,-1.00557 -0.95987,-1.61284 -1.92627,-1.61284c-0.95986,0 -1.75649,0.58768 -1.95238,1.61284l3.87865,0zm-3.89824,1.208c0.13712,1.14923 0.95987,1.8022 2.00462,1.8022c0.82275,0 1.45613,-0.38525 1.82832,-1.00558l2.00462,0c-0.46361,1.64549 -1.93932,2.69677 -3.87865,2.69677c-2.34416,0 -3.98965,-1.64548 -3.98965,-3.98965c0,-2.34417 1.7369,-4.03536 4.03536,-4.03536c2.31152,0 3.98965,1.70425 3.98965,4.03536c0,0.16977 -0.01305,0.33955 -0.0457,0.49626l-5.94857,0z"></path>
                      <path d="m53.26414,17.83032c0,-1.2537 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.95986 2.1091,-2.2201m-6.14446,7.04556l0,-10.92421l1.90667,0l0,1.00558c0.57462,-0.71174 1.43001,-1.14923 2.44865,-1.14923c2.09603,0 3.74152,1.72384 3.74152,4.00271s-1.67814,4.01578 -3.78723,4.01578c-0.97946,0 -1.78261,-0.38526 -2.34417,-1.03823l0,4.08107l-1.96544,0l0,0.00653z"></path>
                      <path d="m62.09231,17.83032c0,-1.30594 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.91416 2.1091,-2.2201m0.01959,3.87865l0,-1.00558c-0.57462,0.69868 -1.43001,1.12964 -2.44865,1.12964c-2.12868,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99252,0 1.82832,0.43749 2.40294,1.11658l0,-0.97946l1.90667,0l0,7.7573l-1.90667,0z"></path>
                      <path d="m43.67852,14.70912s0.4832,-0.9011 1.67814,-0.9011c0.50931,0 0.8358,0.1763 0.8358,0.1763l0,1.97851s-0.71827,-0.44402 -1.37777,-0.35261c-0.6595,0.09142 -1.0774,0.69215 -1.0774,1.50184l0,4.59038l-1.97197,0l0,-7.75076l1.90667,0l0,0.75744l0.00653,0z"></path>
                    </g>
                </svg>
			  <span>See terms: <strong onclick="document.querySelector('square-placement').shadowRoot.querySelector('button').click()"><u>Afterpay</u></strong>
			  </span>
			</a>
		  </div>`
		  }

		  let afterPay6MosRate = computeAfterPayLoanDetails(productPrice, currentPrice, 12, 6)

		  if (afterPay6MosRate) {
			afterPayTermsHTML += `<div class="option">
			<div class="option-details">
			  <p class="payment-info">
				<strong>6 payments of ${afterPay6MosRate.MonthlyPaymentForNewTerm}</strong>
			  </p>
			  <p class="apr">monthly, ${afterPay6MosRate.APR} APR</p>
			  <p class="total">Total: ${afterPay6MosRate.TotalPaymentsNewTerm}</p>
			</div>
			<a href="#" class="terms-link">
			  <svg style="" onclick="document.querySelector('square-placement').shadowRoot.querySelector('button').click()" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="104" height="36" viewBox="0 0 104 36">
                    <path class="afterpay-logo-badge-background" fill="#b2fce4" d="m86.00173,35.9321l-68.00064,0c-9.90375,0 -17.93101,-8.02726 -17.93101,-17.93101l0,0c0,-9.90375 8.02726,-17.93101 17.93101,-17.93101l68.00064,0c9.90375,0 17.931,8.02726 17.931,17.93101l0,0c0.00652,9.89724 -8.02725,17.93101 -17.931,17.93101z"></path>
                    <g class="afterpay-logo-badge-lockup">
                      <path d="m88.23074,13.52071l-2.25928,-1.29288l-2.29193,-1.31247c-1.51489,-0.86845 -3.40851,0.22201 -3.40851,1.97197l0,0.29384c0,0.16324 0.08489,0.31342 0.22854,0.39178l1.06435,0.60726c0.29383,0.16978 0.6595,-0.0457 0.6595,-0.38525l0,-0.69868c0,-0.34607 0.37219,-0.56155 0.67256,-0.39178l2.0895,1.20147l2.08298,1.19493c0.30037,0.16977 0.30037,0.60727 0,0.77704l-2.08298,1.19494l-2.0895,1.20146c-0.30037,0.16978 -0.67256,-0.0457 -0.67256,-0.39178l0,-0.34607c0,-1.74997 -1.89362,-2.84696 -3.40851,-1.97198l-2.29193,1.31247l-2.25928,1.29289c-1.52142,0.87498 -1.52142,3.07549 0,3.95047l2.25928,1.29289l2.29193,1.31247c1.51489,0.86845 3.40851,-0.22201 3.40851,-1.97198l0,-0.29383c0,-0.16325 -0.08489,-0.31343 -0.22854,-0.39179l-1.06435,-0.60726c-0.29383,-0.16977 -0.6595,0.04571 -0.6595,0.38525l0,0.69868c0,0.34608 -0.37219,0.56156 -0.67256,0.39179l-2.0895,-1.20147l-2.08298,-1.19494c-0.30037,-0.16977 -0.30037,-0.60726 0,-0.77703l2.08298,-1.19494l2.0895,-1.20147c0.30037,-0.16977 0.67256,0.04571 0.67256,0.39179l0,0.34607c0,1.74996 1.89362,2.84695 3.40851,1.97197l2.29193,-1.31247l2.25928,-1.29288c1.52142,-0.88151 1.52142,-3.0755 0,-3.95048z"></path>
                      <path d="m73.4083,13.95167l-5.28907,10.92421l-2.19398,0l1.9785,-4.08107l-3.11467,-6.84314l2.25275,0l1.99809,4.58386l2.18092,-4.58386l2.18746,0z"></path>
                      <path d="m20.52416,17.83032c0,-1.30594 -0.9468,-2.2201 -2.10909,-2.2201s-2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201s2.10909,-0.91416 2.10909,-2.2201m0.01959,3.87865l0,-1.00558c-0.57461,0.69868 -1.43,1.12964 -2.44864,1.12964c-2.12869,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99251,0 1.82832,0.43749 2.40293,1.11658l0,-0.97946l1.90668,0l0,7.7573l-1.90668,0z"></path>
                      <path d="m31.72262,19.98513c-0.66603,0 -0.85539,-0.24813 -0.85539,-0.9011l0,-3.44116l1.22758,0l0,-1.6912l-1.22758,0l0,-1.89361l-1.95239,0l0,1.89361l-2.52047,0l0,-0.7705c0,-0.65297 0.24813,-0.9011 0.93375,-0.9011l0.43096,0l0,-1.50184l-0.94027,0c-1.61284,0 -2.37682,0.52891 -2.37682,2.14175l0,1.03822l-1.08393,0l0,1.68467l1.08393,0l0,6.0661l1.95238,0l0,-6.0661l2.52047,0l0,3.80029c0,1.58019 0.60727,2.26581 2.18746,2.26581l1.00557,0l0,-1.72384l-0.38525,0z"></path>
                      <path d="m38.73553,17.13164c-0.13713,-1.00557 -0.95987,-1.61284 -1.92627,-1.61284c-0.95986,0 -1.75649,0.58768 -1.95238,1.61284l3.87865,0zm-3.89824,1.208c0.13712,1.14923 0.95987,1.8022 2.00462,1.8022c0.82275,0 1.45613,-0.38525 1.82832,-1.00558l2.00462,0c-0.46361,1.64549 -1.93932,2.69677 -3.87865,2.69677c-2.34416,0 -3.98965,-1.64548 -3.98965,-3.98965c0,-2.34417 1.7369,-4.03536 4.03536,-4.03536c2.31152,0 3.98965,1.70425 3.98965,4.03536c0,0.16977 -0.01305,0.33955 -0.0457,0.49626l-5.94857,0z"></path>
                      <path d="m53.26414,17.83032c0,-1.2537 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.95986 2.1091,-2.2201m-6.14446,7.04556l0,-10.92421l1.90667,0l0,1.00558c0.57462,-0.71174 1.43001,-1.14923 2.44865,-1.14923c2.09603,0 3.74152,1.72384 3.74152,4.00271s-1.67814,4.01578 -3.78723,4.01578c-0.97946,0 -1.78261,-0.38526 -2.34417,-1.03823l0,4.08107l-1.96544,0l0,0.00653z"></path>
                      <path d="m62.09231,17.83032c0,-1.30594 -0.94681,-2.2201 -2.1091,-2.2201c-1.16229,0 -2.1091,0.93375 -2.1091,2.2201c0,1.2733 0.94681,2.2201 2.1091,2.2201c1.16229,0 2.1091,-0.91416 2.1091,-2.2201m0.01959,3.87865l0,-1.00558c-0.57462,0.69868 -1.43001,1.12964 -2.44865,1.12964c-2.12868,0 -3.74152,-1.70425 -3.74152,-4.00271c0,-2.27887 1.67813,-4.01577 3.78723,-4.01577c0.99252,0 1.82832,0.43749 2.40294,1.11658l0,-0.97946l1.90667,0l0,7.7573l-1.90667,0z"></path>
                      <path d="m43.67852,14.70912s0.4832,-0.9011 1.67814,-0.9011c0.50931,0 0.8358,0.1763 0.8358,0.1763l0,1.97851s-0.71827,-0.44402 -1.37777,-0.35261c-0.6595,0.09142 -1.0774,0.69215 -1.0774,1.50184l0,4.59038l-1.97197,0l0,-7.75076l1.90667,0l0,0.75744l0.00653,0z"></path>
                    </g>
                </svg>
			  <span>See terms: <strong onclick="document.querySelector('square-placement').shadowRoot.querySelector('button').click()"><u>Afterpay</u></strong>
			  </span>
			</a>
		  </div>`
		  }

		  return afterPayTermsHTML;
		}
	}
  }

  function generatePayTomorrowPaymentTerms() {
	let payTomorrowTermsHTML = ``

	if (PayTomorrow) {
		let productPrice = getProductPrice();  
		let payTomorrow24MosRate = PayTomorrow.getMonthlyPayment(productPrice, 24, {displayPrimeOffers: true, primeApr: 12});
		
		if (payTomorrow24MosRate) {
			payTomorrowTermsHTML += `<div class="option">
			<div class="option-details">
			  <p class="payment-info">
				<strong>24 payments of ${parseFloat(payTomorrow24MosRate).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD',
				  })}</strong>
			  </p>
			  <p class="apr">monthly, 12% APR</p>
			  <p class="total">Total: ${parseFloat(payTomorrow24MosRate * 24).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			  })}</p>
			</div>
			<a href="#" class="terms-link">
		        <svg onclick="PayTomorrow.openMpeIframe()" class="paytomorrow-logo" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 326 48">
                          <defs>
                              <style>.cls-1{fill:#43A8FB}.cls-2{fill:#152456}</style>
                          </defs>
                          <path class="cls-1" d="M0,4A3,3,0,0,1,.8,1.54a4.49,4.49,0,0,1,2.06-1C3.43.42,4.45.31,5.94.18S9.54,0,12.3,0q8.47,0,12.61,3.34A10.86,10.86,0,0,1,29,12.24a13.14,13.14,0,0,1-.88,4.85A9.68,9.68,0,0,1,25.38,21a13.44,13.44,0,0,1-5,2.57,26.06,26.06,0,0,1-7.47.93c-.74,0-1.49,0-2.25-.08l-2.09-.16c-.64,0-1.19-.11-1.65-.19A7.64,7.64,0,0,0,6.1,24V36.87H0ZM6.1,18.6l2.06.29a32.1,32.1,0,0,0,4.35.24,19.15,19.15,0,0,0,4.87-.53,8.08,8.08,0,0,0,3.1-1.49,5.35,5.35,0,0,0,1.62-2.2,7.35,7.35,0,0,0,.47-2.67,8,8,0,0,0-.42-2.57,4.84,4.84,0,0,0-1.59-2.2,8.84,8.84,0,0,0-3.2-1.54,19.8,19.8,0,0,0-5.22-.58c-1.7,0-3.06,0-4.08.11a14.92,14.92,0,0,0-2,.21Z"></path>
                          <path class="cls-1" d="M54.73,36.77c-.35.07-.91.15-1.67.24s-1.65.17-2.67.26-2.17.17-3.45.24-2.59.11-4,.11a26.1,26.1,0,0,1-6.75-.72A11.39,11.39,0,0,1,32.08,35,6.13,6.13,0,0,1,30,32.24,9.51,9.51,0,0,1,29.46,29a10.13,10.13,0,0,1,.66-3.81,6.39,6.39,0,0,1,2.18-2.76,10.69,10.69,0,0,1,3.94-1.67,27.29,27.29,0,0,1,5.94-.55c1.34,0,2.61,0,3.81.13s2.1.17,2.7.24a6.77,6.77,0,0,0-.61-3.07,4.7,4.7,0,0,0-1.66-1.91,6.74,6.74,0,0,0-2.55-1,18.36,18.36,0,0,0-3.28-.27,14,14,0,0,0-4.85.69,10.1,10.1,0,0,0-2.41,1.16,6.8,6.8,0,0,1-.88-1A3.05,3.05,0,0,1,32.3,12a3.38,3.38,0,0,1,1.4-1.27,9.38,9.38,0,0,1,2.7-.88,24.2,24.2,0,0,1,4.29-.31,25.06,25.06,0,0,1,5.7.6,12.56,12.56,0,0,1,4.42,1.94,8.87,8.87,0,0,1,2.89,3.5,12.09,12.09,0,0,1,1,5.24ZM48.75,25c-.36-.07-1-.18-2-.32a33.34,33.34,0,0,0-4.37-.21,9.84,9.84,0,0,0-5.25,1.08A3.83,3.83,0,0,0,35.5,29a4.18,4.18,0,0,0,.35,1.75A3,3,0,0,0,37,32.08a6.64,6.64,0,0,0,2.3.85,19.29,19.29,0,0,0,3.63.29A30.18,30.18,0,0,0,46.84,33c.95-.12,1.59-.22,1.91-.29Z"></path>
                          <path class="cls-1" d="M58.81,13.09A2.55,2.55,0,0,1,59.66,11,3.58,3.58,0,0,1,62,10.28a6.33,6.33,0,0,1,1.78.24c.54.16.91.27,1.08.34V25a7.19,7.19,0,0,0,1.67,5c1.11,1.23,2.84,1.85,5.17,1.85A6.82,6.82,0,0,0,76.77,30a7.56,7.56,0,0,0,1.86-5.54V13.09A2.55,2.55,0,0,1,79.48,11a3.58,3.58,0,0,1,2.33-.69,6.31,6.31,0,0,1,1.77.24c.55.16.91.27,1.09.34V34.07a17.87,17.87,0,0,1-1,6.38,10.77,10.77,0,0,1-7.31,6.78,20.42,20.42,0,0,1-5.78.77,30.14,30.14,0,0,1-4-.24c-1.2-.16-2.27-.34-3.2-.55s-1.71-.42-2.31-.61-1-.35-1.27-.45c.28-.75.55-1.5.79-2.25s.5-1.52.75-2.26c.24.11.63.25,1.16.43s1.17.34,1.91.5,1.58.29,2.51.4a28.31,28.31,0,0,0,3,.16,14.07,14.07,0,0,0,3.71-.45,6.33,6.33,0,0,0,2.78-1.57,7.23,7.23,0,0,0,1.75-2.94,14.8,14.8,0,0,0,.61-4.58,7.11,7.11,0,0,1-3.32,2.46,12.84,12.84,0,0,1-5,.93,14.86,14.86,0,0,1-4.71-.72A10.37,10.37,0,0,1,62.1,34.2a9.28,9.28,0,0,1-2.41-3.36,11.38,11.38,0,0,1-.88-4.61Z"></path>
                          <path class="cls-2" d="M88.91,5.56a2.55,2.55,0,0,1,.84-2.14,3.74,3.74,0,0,1,2.34-.67A6.31,6.31,0,0,1,93.86,3c.55.16.91.28,1.09.35v6.94h7.68a3.44,3.44,0,0,1,2.46.71,2.85,2.85,0,0,1,.72,2.1,4.94,4.94,0,0,1-.27,1.66,7.88,7.88,0,0,1-.42,1.09H95V27.65a5.8,5.8,0,0,0,.37,2.26,3.44,3.44,0,0,0,1,1.4,3.74,3.74,0,0,0,1.54.74,7.28,7.28,0,0,0,1.83.22,8.38,8.38,0,0,0,2.86-.48,8.29,8.29,0,0,0,1.9-.9l2.44,4c-.28.22-.68.48-1.19.8a10.67,10.67,0,0,1-1.88.9,16.44,16.44,0,0,1-2.49.71,14.25,14.25,0,0,1-3,.3c-3.11,0-5.46-.81-7-2.41a8.62,8.62,0,0,1-2.38-6.34Z"></path>
                          <path class="cls-2" d="M121.44,9.54a15.37,15.37,0,0,1,5.74,1.06,13.91,13.91,0,0,1,4.64,2.94A13.37,13.37,0,0,1,134.89,18,13.75,13.75,0,0,1,136,23.58a13.63,13.63,0,0,1-1.12,5.53,13.37,13.37,0,0,1-3.07,4.45,14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3A13.37,13.37,0,0,1,108,29.11a13.8,13.8,0,0,1-1.11-5.53A13.91,13.91,0,0,1,108,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.39,15.39,0,0,1,121.44,9.54Zm0,22.73a8.15,8.15,0,0,0,3.33-.67,7.6,7.6,0,0,0,2.63-1.85A8.62,8.62,0,0,0,129.09,27a9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.34,8.34,0,0,0-1.69-2.79,7.79,7.79,0,0,0-2.63-1.82,8.71,8.71,0,0,0-6.7,0,7.73,7.73,0,0,0-2.59,1.82,8.36,8.36,0,0,0-1.7,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.64,8.64,0,0,0,1.7,2.76,7.53,7.53,0,0,0,2.59,1.85A8.18,8.18,0,0,0,121.44,32.27Z"></path>
                          <path class="cls-2" d="M139,19.76a10.34,10.34,0,0,1,.9-4.45,8.93,8.93,0,0,1,2.47-3.18A10.85,10.85,0,0,1,146,10.2a15.42,15.42,0,0,1,4.61-.66,13.71,13.71,0,0,1,5.88,1.21,9.78,9.78,0,0,1,4.13,3.61,10,10,0,0,1,4.08-3.61,13.25,13.25,0,0,1,5.78-1.21,15.88,15.88,0,0,1,4.55.63,10.37,10.37,0,0,1,3.66,1.91,9.2,9.2,0,0,1,2.44,3.18,10.31,10.31,0,0,1,.9,4.45V36.87h-6V21.77q0-3.64-1.65-5.21A6.14,6.14,0,0,0,169.91,15a6.33,6.33,0,0,0-4.53,1.75q-1.81,1.76-1.82,5.67V36.87h-6V22.41q0-3.91-1.83-5.67A6.33,6.33,0,0,0,151.16,15a6.24,6.24,0,0,0-4.45,1.59Q145,18.17,145,21.83v15h-6Z"></path>
                          <path class="cls-2" d="M199.58,9.54a15.39,15.39,0,0,1,5.75,1.06A13.91,13.91,0,0,1,210,13.54,13.52,13.52,0,0,1,213,18a13.91,13.91,0,0,1,1.11,5.59A13.8,13.8,0,0,1,213,29.11,13.52,13.52,0,0,1,210,33.56a14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3,13.37,13.37,0,0,1-3.07-4.45A13.63,13.63,0,0,1,185,23.58,13.75,13.75,0,0,1,186.13,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.33,15.33,0,0,1,199.58,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.46,7.46,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.66,7.66,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.16,8.16,0,0,0,199.58,32.27Z"></path>
                          <path class="cls-2" d="M217.12,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.66,3.66,0,0,1-.83,1.06,13.94,13.94,0,0,0-2.22-.8,11.1,11.1,0,0,0-3-.37q-6.2,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M236,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.87,3.87,0,0,1-.82,1.06,14.46,14.46,0,0,0-2.23-.8,11.1,11.1,0,0,0-3-.37q-6.19,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M268.88,9.54a15.39,15.39,0,0,1,5.75,1.06,14,14,0,0,1,4.64,2.94A13.52,13.52,0,0,1,282.34,18a13.91,13.91,0,0,1,1.11,5.59,13.8,13.8,0,0,1-1.11,5.53,13.52,13.52,0,0,1-3.07,4.45,14.42,14.42,0,0,1-4.64,3,15.71,15.71,0,0,1-11.5,0,14.26,14.26,0,0,1-4.63-3,13.37,13.37,0,0,1-3.07-4.45,13.63,13.63,0,0,1-1.12-5.53A13.75,13.75,0,0,1,255.43,18a13.37,13.37,0,0,1,3.07-4.45,13.87,13.87,0,0,1,4.63-2.94A15.42,15.42,0,0,1,268.88,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.56,7.56,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.44,9.44,0,0,0,.61-3.41,9.85,9.85,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.75,7.75,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.13,8.13,0,0,0,268.88,32.27Z"></path>
                          <path class="cls-2" d="M292.4,36.87q-2.59-6.09-4.26-10.33c-1.11-2.82-2-5.16-2.65-7s-1.11-3.28-1.38-4.29a10,10,0,0,1-.39-2.14,2.74,2.74,0,0,1,3-2.81,6.26,6.26,0,0,1,1.82.21,6.82,6.82,0,0,1,.88.32q.63,2.32,1.43,4.95T292.51,21c.57,1.73,1.12,3.38,1.67,4.95l1.46,4.21c.39-1.09.8-2.34,1.24-3.76s.9-2.86,1.38-4.37.94-3,1.4-4.55.89-3,1.28-4.37a4.61,4.61,0,0,1,1.19-2.1,3.56,3.56,0,0,1,2.46-.71,6,6,0,0,1,1.91.29,10.9,10.9,0,0,1,1.06.4q.69,2.38,1.48,5t1.59,5.17c.53,1.69,1.05,3.32,1.56,4.87s1,2.94,1.41,4.13c.92-2.43,1.86-5.1,2.83-8s1.86-5.8,2.68-8.69a5.58,5.58,0,0,1,1.24-2.41,3.2,3.2,0,0,1,2.36-.77,5.08,5.08,0,0,1,2.33.47,7.63,7.63,0,0,1,1,.59q-.44,1.74-1.48,4.82c-.71,2.05-1.51,4.26-2.39,6.65s-1.82,4.82-2.81,7.31-1.92,4.74-2.8,6.75h-6.26c-.28-.74-.66-1.82-1.13-3.25s-1-3-1.57-4.69-1.12-3.44-1.67-5.22-1.05-3.42-1.51-4.9c-.46,1.48-1,3.12-1.51,4.9s-1.09,3.52-1.64,5.22-1,3.26-1.51,4.69-.83,2.51-1.11,3.25Z"></path>
                      </svg>
			  <span>See terms: <strong onclick="PayTomorrow.openMpeIframe()"><u>PayTomorrow</u></strong>
			  </span>
			</a>
		  </div>`
		}

		let payTomorrow12MosRate = PayTomorrow.getMonthlyPayment(productPrice, 12, {displayPrimeOffers: true, primeApr: 7});

		if (payTomorrow12MosRate) {
			payTomorrowTermsHTML += `<div class="option">
			<div class="option-details">
			  <p class="payment-info">
				<strong>12 payments of ${parseFloat(payTomorrow12MosRate).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD',
				  })}</strong>
			  </p>
			  <p class="apr">monthly, 7% APR</p>
			  <p class="total">Total: ${parseFloat(payTomorrow12MosRate * 12).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			  })}</p>
			</div>
			<a href="#" class="terms-link">
		        <svg onclick="PayTomorrow.openMpeIframe()" class="paytomorrow-logo" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 326 48">
                          <defs>
                              <style>.cls-1{fill:#43A8FB}.cls-2{fill:#152456}</style>
                          </defs>
                          <path class="cls-1" d="M0,4A3,3,0,0,1,.8,1.54a4.49,4.49,0,0,1,2.06-1C3.43.42,4.45.31,5.94.18S9.54,0,12.3,0q8.47,0,12.61,3.34A10.86,10.86,0,0,1,29,12.24a13.14,13.14,0,0,1-.88,4.85A9.68,9.68,0,0,1,25.38,21a13.44,13.44,0,0,1-5,2.57,26.06,26.06,0,0,1-7.47.93c-.74,0-1.49,0-2.25-.08l-2.09-.16c-.64,0-1.19-.11-1.65-.19A7.64,7.64,0,0,0,6.1,24V36.87H0ZM6.1,18.6l2.06.29a32.1,32.1,0,0,0,4.35.24,19.15,19.15,0,0,0,4.87-.53,8.08,8.08,0,0,0,3.1-1.49,5.35,5.35,0,0,0,1.62-2.2,7.35,7.35,0,0,0,.47-2.67,8,8,0,0,0-.42-2.57,4.84,4.84,0,0,0-1.59-2.2,8.84,8.84,0,0,0-3.2-1.54,19.8,19.8,0,0,0-5.22-.58c-1.7,0-3.06,0-4.08.11a14.92,14.92,0,0,0-2,.21Z"></path>
                          <path class="cls-1" d="M54.73,36.77c-.35.07-.91.15-1.67.24s-1.65.17-2.67.26-2.17.17-3.45.24-2.59.11-4,.11a26.1,26.1,0,0,1-6.75-.72A11.39,11.39,0,0,1,32.08,35,6.13,6.13,0,0,1,30,32.24,9.51,9.51,0,0,1,29.46,29a10.13,10.13,0,0,1,.66-3.81,6.39,6.39,0,0,1,2.18-2.76,10.69,10.69,0,0,1,3.94-1.67,27.29,27.29,0,0,1,5.94-.55c1.34,0,2.61,0,3.81.13s2.1.17,2.7.24a6.77,6.77,0,0,0-.61-3.07,4.7,4.7,0,0,0-1.66-1.91,6.74,6.74,0,0,0-2.55-1,18.36,18.36,0,0,0-3.28-.27,14,14,0,0,0-4.85.69,10.1,10.1,0,0,0-2.41,1.16,6.8,6.8,0,0,1-.88-1A3.05,3.05,0,0,1,32.3,12a3.38,3.38,0,0,1,1.4-1.27,9.38,9.38,0,0,1,2.7-.88,24.2,24.2,0,0,1,4.29-.31,25.06,25.06,0,0,1,5.7.6,12.56,12.56,0,0,1,4.42,1.94,8.87,8.87,0,0,1,2.89,3.5,12.09,12.09,0,0,1,1,5.24ZM48.75,25c-.36-.07-1-.18-2-.32a33.34,33.34,0,0,0-4.37-.21,9.84,9.84,0,0,0-5.25,1.08A3.83,3.83,0,0,0,35.5,29a4.18,4.18,0,0,0,.35,1.75A3,3,0,0,0,37,32.08a6.64,6.64,0,0,0,2.3.85,19.29,19.29,0,0,0,3.63.29A30.18,30.18,0,0,0,46.84,33c.95-.12,1.59-.22,1.91-.29Z"></path>
                          <path class="cls-1" d="M58.81,13.09A2.55,2.55,0,0,1,59.66,11,3.58,3.58,0,0,1,62,10.28a6.33,6.33,0,0,1,1.78.24c.54.16.91.27,1.08.34V25a7.19,7.19,0,0,0,1.67,5c1.11,1.23,2.84,1.85,5.17,1.85A6.82,6.82,0,0,0,76.77,30a7.56,7.56,0,0,0,1.86-5.54V13.09A2.55,2.55,0,0,1,79.48,11a3.58,3.58,0,0,1,2.33-.69,6.31,6.31,0,0,1,1.77.24c.55.16.91.27,1.09.34V34.07a17.87,17.87,0,0,1-1,6.38,10.77,10.77,0,0,1-7.31,6.78,20.42,20.42,0,0,1-5.78.77,30.14,30.14,0,0,1-4-.24c-1.2-.16-2.27-.34-3.2-.55s-1.71-.42-2.31-.61-1-.35-1.27-.45c.28-.75.55-1.5.79-2.25s.5-1.52.75-2.26c.24.11.63.25,1.16.43s1.17.34,1.91.5,1.58.29,2.51.4a28.31,28.31,0,0,0,3,.16,14.07,14.07,0,0,0,3.71-.45,6.33,6.33,0,0,0,2.78-1.57,7.23,7.23,0,0,0,1.75-2.94,14.8,14.8,0,0,0,.61-4.58,7.11,7.11,0,0,1-3.32,2.46,12.84,12.84,0,0,1-5,.93,14.86,14.86,0,0,1-4.71-.72A10.37,10.37,0,0,1,62.1,34.2a9.28,9.28,0,0,1-2.41-3.36,11.38,11.38,0,0,1-.88-4.61Z"></path>
                          <path class="cls-2" d="M88.91,5.56a2.55,2.55,0,0,1,.84-2.14,3.74,3.74,0,0,1,2.34-.67A6.31,6.31,0,0,1,93.86,3c.55.16.91.28,1.09.35v6.94h7.68a3.44,3.44,0,0,1,2.46.71,2.85,2.85,0,0,1,.72,2.1,4.94,4.94,0,0,1-.27,1.66,7.88,7.88,0,0,1-.42,1.09H95V27.65a5.8,5.8,0,0,0,.37,2.26,3.44,3.44,0,0,0,1,1.4,3.74,3.74,0,0,0,1.54.74,7.28,7.28,0,0,0,1.83.22,8.38,8.38,0,0,0,2.86-.48,8.29,8.29,0,0,0,1.9-.9l2.44,4c-.28.22-.68.48-1.19.8a10.67,10.67,0,0,1-1.88.9,16.44,16.44,0,0,1-2.49.71,14.25,14.25,0,0,1-3,.3c-3.11,0-5.46-.81-7-2.41a8.62,8.62,0,0,1-2.38-6.34Z"></path>
                          <path class="cls-2" d="M121.44,9.54a15.37,15.37,0,0,1,5.74,1.06,13.91,13.91,0,0,1,4.64,2.94A13.37,13.37,0,0,1,134.89,18,13.75,13.75,0,0,1,136,23.58a13.63,13.63,0,0,1-1.12,5.53,13.37,13.37,0,0,1-3.07,4.45,14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3A13.37,13.37,0,0,1,108,29.11a13.8,13.8,0,0,1-1.11-5.53A13.91,13.91,0,0,1,108,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.39,15.39,0,0,1,121.44,9.54Zm0,22.73a8.15,8.15,0,0,0,3.33-.67,7.6,7.6,0,0,0,2.63-1.85A8.62,8.62,0,0,0,129.09,27a9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.34,8.34,0,0,0-1.69-2.79,7.79,7.79,0,0,0-2.63-1.82,8.71,8.71,0,0,0-6.7,0,7.73,7.73,0,0,0-2.59,1.82,8.36,8.36,0,0,0-1.7,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.64,8.64,0,0,0,1.7,2.76,7.53,7.53,0,0,0,2.59,1.85A8.18,8.18,0,0,0,121.44,32.27Z"></path>
                          <path class="cls-2" d="M139,19.76a10.34,10.34,0,0,1,.9-4.45,8.93,8.93,0,0,1,2.47-3.18A10.85,10.85,0,0,1,146,10.2a15.42,15.42,0,0,1,4.61-.66,13.71,13.71,0,0,1,5.88,1.21,9.78,9.78,0,0,1,4.13,3.61,10,10,0,0,1,4.08-3.61,13.25,13.25,0,0,1,5.78-1.21,15.88,15.88,0,0,1,4.55.63,10.37,10.37,0,0,1,3.66,1.91,9.2,9.2,0,0,1,2.44,3.18,10.31,10.31,0,0,1,.9,4.45V36.87h-6V21.77q0-3.64-1.65-5.21A6.14,6.14,0,0,0,169.91,15a6.33,6.33,0,0,0-4.53,1.75q-1.81,1.76-1.82,5.67V36.87h-6V22.41q0-3.91-1.83-5.67A6.33,6.33,0,0,0,151.16,15a6.24,6.24,0,0,0-4.45,1.59Q145,18.17,145,21.83v15h-6Z"></path>
                          <path class="cls-2" d="M199.58,9.54a15.39,15.39,0,0,1,5.75,1.06A13.91,13.91,0,0,1,210,13.54,13.52,13.52,0,0,1,213,18a13.91,13.91,0,0,1,1.11,5.59A13.8,13.8,0,0,1,213,29.11,13.52,13.52,0,0,1,210,33.56a14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3,13.37,13.37,0,0,1-3.07-4.45A13.63,13.63,0,0,1,185,23.58,13.75,13.75,0,0,1,186.13,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.33,15.33,0,0,1,199.58,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.46,7.46,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.66,7.66,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.16,8.16,0,0,0,199.58,32.27Z"></path>
                          <path class="cls-2" d="M217.12,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.66,3.66,0,0,1-.83,1.06,13.94,13.94,0,0,0-2.22-.8,11.1,11.1,0,0,0-3-.37q-6.2,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M236,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.87,3.87,0,0,1-.82,1.06,14.46,14.46,0,0,0-2.23-.8,11.1,11.1,0,0,0-3-.37q-6.19,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M268.88,9.54a15.39,15.39,0,0,1,5.75,1.06,14,14,0,0,1,4.64,2.94A13.52,13.52,0,0,1,282.34,18a13.91,13.91,0,0,1,1.11,5.59,13.8,13.8,0,0,1-1.11,5.53,13.52,13.52,0,0,1-3.07,4.45,14.42,14.42,0,0,1-4.64,3,15.71,15.71,0,0,1-11.5,0,14.26,14.26,0,0,1-4.63-3,13.37,13.37,0,0,1-3.07-4.45,13.63,13.63,0,0,1-1.12-5.53A13.75,13.75,0,0,1,255.43,18a13.37,13.37,0,0,1,3.07-4.45,13.87,13.87,0,0,1,4.63-2.94A15.42,15.42,0,0,1,268.88,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.56,7.56,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.44,9.44,0,0,0,.61-3.41,9.85,9.85,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.75,7.75,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.13,8.13,0,0,0,268.88,32.27Z"></path>
                          <path class="cls-2" d="M292.4,36.87q-2.59-6.09-4.26-10.33c-1.11-2.82-2-5.16-2.65-7s-1.11-3.28-1.38-4.29a10,10,0,0,1-.39-2.14,2.74,2.74,0,0,1,3-2.81,6.26,6.26,0,0,1,1.82.21,6.82,6.82,0,0,1,.88.32q.63,2.32,1.43,4.95T292.51,21c.57,1.73,1.12,3.38,1.67,4.95l1.46,4.21c.39-1.09.8-2.34,1.24-3.76s.9-2.86,1.38-4.37.94-3,1.4-4.55.89-3,1.28-4.37a4.61,4.61,0,0,1,1.19-2.1,3.56,3.56,0,0,1,2.46-.71,6,6,0,0,1,1.91.29,10.9,10.9,0,0,1,1.06.4q.69,2.38,1.48,5t1.59,5.17c.53,1.69,1.05,3.32,1.56,4.87s1,2.94,1.41,4.13c.92-2.43,1.86-5.1,2.83-8s1.86-5.8,2.68-8.69a5.58,5.58,0,0,1,1.24-2.41,3.2,3.2,0,0,1,2.36-.77,5.08,5.08,0,0,1,2.33.47,7.63,7.63,0,0,1,1,.59q-.44,1.74-1.48,4.82c-.71,2.05-1.51,4.26-2.39,6.65s-1.82,4.82-2.81,7.31-1.92,4.74-2.8,6.75h-6.26c-.28-.74-.66-1.82-1.13-3.25s-1-3-1.57-4.69-1.12-3.44-1.67-5.22-1.05-3.42-1.51-4.9c-.46,1.48-1,3.12-1.51,4.9s-1.09,3.52-1.64,5.22-1,3.26-1.51,4.69-.83,2.51-1.11,3.25Z"></path>
                      </svg>
			  <span>See terms: <strong onclick="PayTomorrow.openMpeIframe()"><u>PayTomorrow</u></strong>
			  </span>
			</a>
		  </div>`
		}

		let payTomorrow6MosRate = PayTomorrow.getMonthlyPayment(productPrice, 6, {displayPrimeOffers: true, primeApr: 7});

		if (payTomorrow6MosRate) {
			payTomorrowTermsHTML += `<div class="option">
			<div class="option-details">
			  <p class="payment-info">
				<strong>6 payments of ${parseFloat(payTomorrow6MosRate).toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD',
				  })}</strong>
			  </p>
			  <p class="apr">monthly, 7% APR</p>
			  <p class="total">Total: ${parseFloat(payTomorrow6MosRate * 6).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			  })}</p>
			</div>
			<a href="#" class="terms-link">
		        <svg onclick="PayTomorrow.openMpeIframe()" class="paytomorrow-logo" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 326 48">
                          <defs>
                              <style>.cls-1{fill:#43A8FB}.cls-2{fill:#152456}</style>
                          </defs>
                          <path class="cls-1" d="M0,4A3,3,0,0,1,.8,1.54a4.49,4.49,0,0,1,2.06-1C3.43.42,4.45.31,5.94.18S9.54,0,12.3,0q8.47,0,12.61,3.34A10.86,10.86,0,0,1,29,12.24a13.14,13.14,0,0,1-.88,4.85A9.68,9.68,0,0,1,25.38,21a13.44,13.44,0,0,1-5,2.57,26.06,26.06,0,0,1-7.47.93c-.74,0-1.49,0-2.25-.08l-2.09-.16c-.64,0-1.19-.11-1.65-.19A7.64,7.64,0,0,0,6.1,24V36.87H0ZM6.1,18.6l2.06.29a32.1,32.1,0,0,0,4.35.24,19.15,19.15,0,0,0,4.87-.53,8.08,8.08,0,0,0,3.1-1.49,5.35,5.35,0,0,0,1.62-2.2,7.35,7.35,0,0,0,.47-2.67,8,8,0,0,0-.42-2.57,4.84,4.84,0,0,0-1.59-2.2,8.84,8.84,0,0,0-3.2-1.54,19.8,19.8,0,0,0-5.22-.58c-1.7,0-3.06,0-4.08.11a14.92,14.92,0,0,0-2,.21Z"></path>
                          <path class="cls-1" d="M54.73,36.77c-.35.07-.91.15-1.67.24s-1.65.17-2.67.26-2.17.17-3.45.24-2.59.11-4,.11a26.1,26.1,0,0,1-6.75-.72A11.39,11.39,0,0,1,32.08,35,6.13,6.13,0,0,1,30,32.24,9.51,9.51,0,0,1,29.46,29a10.13,10.13,0,0,1,.66-3.81,6.39,6.39,0,0,1,2.18-2.76,10.69,10.69,0,0,1,3.94-1.67,27.29,27.29,0,0,1,5.94-.55c1.34,0,2.61,0,3.81.13s2.1.17,2.7.24a6.77,6.77,0,0,0-.61-3.07,4.7,4.7,0,0,0-1.66-1.91,6.74,6.74,0,0,0-2.55-1,18.36,18.36,0,0,0-3.28-.27,14,14,0,0,0-4.85.69,10.1,10.1,0,0,0-2.41,1.16,6.8,6.8,0,0,1-.88-1A3.05,3.05,0,0,1,32.3,12a3.38,3.38,0,0,1,1.4-1.27,9.38,9.38,0,0,1,2.7-.88,24.2,24.2,0,0,1,4.29-.31,25.06,25.06,0,0,1,5.7.6,12.56,12.56,0,0,1,4.42,1.94,8.87,8.87,0,0,1,2.89,3.5,12.09,12.09,0,0,1,1,5.24ZM48.75,25c-.36-.07-1-.18-2-.32a33.34,33.34,0,0,0-4.37-.21,9.84,9.84,0,0,0-5.25,1.08A3.83,3.83,0,0,0,35.5,29a4.18,4.18,0,0,0,.35,1.75A3,3,0,0,0,37,32.08a6.64,6.64,0,0,0,2.3.85,19.29,19.29,0,0,0,3.63.29A30.18,30.18,0,0,0,46.84,33c.95-.12,1.59-.22,1.91-.29Z"></path>
                          <path class="cls-1" d="M58.81,13.09A2.55,2.55,0,0,1,59.66,11,3.58,3.58,0,0,1,62,10.28a6.33,6.33,0,0,1,1.78.24c.54.16.91.27,1.08.34V25a7.19,7.19,0,0,0,1.67,5c1.11,1.23,2.84,1.85,5.17,1.85A6.82,6.82,0,0,0,76.77,30a7.56,7.56,0,0,0,1.86-5.54V13.09A2.55,2.55,0,0,1,79.48,11a3.58,3.58,0,0,1,2.33-.69,6.31,6.31,0,0,1,1.77.24c.55.16.91.27,1.09.34V34.07a17.87,17.87,0,0,1-1,6.38,10.77,10.77,0,0,1-7.31,6.78,20.42,20.42,0,0,1-5.78.77,30.14,30.14,0,0,1-4-.24c-1.2-.16-2.27-.34-3.2-.55s-1.71-.42-2.31-.61-1-.35-1.27-.45c.28-.75.55-1.5.79-2.25s.5-1.52.75-2.26c.24.11.63.25,1.16.43s1.17.34,1.91.5,1.58.29,2.51.4a28.31,28.31,0,0,0,3,.16,14.07,14.07,0,0,0,3.71-.45,6.33,6.33,0,0,0,2.78-1.57,7.23,7.23,0,0,0,1.75-2.94,14.8,14.8,0,0,0,.61-4.58,7.11,7.11,0,0,1-3.32,2.46,12.84,12.84,0,0,1-5,.93,14.86,14.86,0,0,1-4.71-.72A10.37,10.37,0,0,1,62.1,34.2a9.28,9.28,0,0,1-2.41-3.36,11.38,11.38,0,0,1-.88-4.61Z"></path>
                          <path class="cls-2" d="M88.91,5.56a2.55,2.55,0,0,1,.84-2.14,3.74,3.74,0,0,1,2.34-.67A6.31,6.31,0,0,1,93.86,3c.55.16.91.28,1.09.35v6.94h7.68a3.44,3.44,0,0,1,2.46.71,2.85,2.85,0,0,1,.72,2.1,4.94,4.94,0,0,1-.27,1.66,7.88,7.88,0,0,1-.42,1.09H95V27.65a5.8,5.8,0,0,0,.37,2.26,3.44,3.44,0,0,0,1,1.4,3.74,3.74,0,0,0,1.54.74,7.28,7.28,0,0,0,1.83.22,8.38,8.38,0,0,0,2.86-.48,8.29,8.29,0,0,0,1.9-.9l2.44,4c-.28.22-.68.48-1.19.8a10.67,10.67,0,0,1-1.88.9,16.44,16.44,0,0,1-2.49.71,14.25,14.25,0,0,1-3,.3c-3.11,0-5.46-.81-7-2.41a8.62,8.62,0,0,1-2.38-6.34Z"></path>
                          <path class="cls-2" d="M121.44,9.54a15.37,15.37,0,0,1,5.74,1.06,13.91,13.91,0,0,1,4.64,2.94A13.37,13.37,0,0,1,134.89,18,13.75,13.75,0,0,1,136,23.58a13.63,13.63,0,0,1-1.12,5.53,13.37,13.37,0,0,1-3.07,4.45,14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3A13.37,13.37,0,0,1,108,29.11a13.8,13.8,0,0,1-1.11-5.53A13.91,13.91,0,0,1,108,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.39,15.39,0,0,1,121.44,9.54Zm0,22.73a8.15,8.15,0,0,0,3.33-.67,7.6,7.6,0,0,0,2.63-1.85A8.62,8.62,0,0,0,129.09,27a9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.34,8.34,0,0,0-1.69-2.79,7.79,7.79,0,0,0-2.63-1.82,8.71,8.71,0,0,0-6.7,0,7.73,7.73,0,0,0-2.59,1.82,8.36,8.36,0,0,0-1.7,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.64,8.64,0,0,0,1.7,2.76,7.53,7.53,0,0,0,2.59,1.85A8.18,8.18,0,0,0,121.44,32.27Z"></path>
                          <path class="cls-2" d="M139,19.76a10.34,10.34,0,0,1,.9-4.45,8.93,8.93,0,0,1,2.47-3.18A10.85,10.85,0,0,1,146,10.2a15.42,15.42,0,0,1,4.61-.66,13.71,13.71,0,0,1,5.88,1.21,9.78,9.78,0,0,1,4.13,3.61,10,10,0,0,1,4.08-3.61,13.25,13.25,0,0,1,5.78-1.21,15.88,15.88,0,0,1,4.55.63,10.37,10.37,0,0,1,3.66,1.91,9.2,9.2,0,0,1,2.44,3.18,10.31,10.31,0,0,1,.9,4.45V36.87h-6V21.77q0-3.64-1.65-5.21A6.14,6.14,0,0,0,169.91,15a6.33,6.33,0,0,0-4.53,1.75q-1.81,1.76-1.82,5.67V36.87h-6V22.41q0-3.91-1.83-5.67A6.33,6.33,0,0,0,151.16,15a6.24,6.24,0,0,0-4.45,1.59Q145,18.17,145,21.83v15h-6Z"></path>
                          <path class="cls-2" d="M199.58,9.54a15.39,15.39,0,0,1,5.75,1.06A13.91,13.91,0,0,1,210,13.54,13.52,13.52,0,0,1,213,18a13.91,13.91,0,0,1,1.11,5.59A13.8,13.8,0,0,1,213,29.11,13.52,13.52,0,0,1,210,33.56a14.31,14.31,0,0,1-4.64,3,15.68,15.68,0,0,1-11.49,0,14.31,14.31,0,0,1-4.64-3,13.37,13.37,0,0,1-3.07-4.45A13.63,13.63,0,0,1,185,23.58,13.75,13.75,0,0,1,186.13,18a13.37,13.37,0,0,1,3.07-4.45,13.91,13.91,0,0,1,4.64-2.94A15.33,15.33,0,0,1,199.58,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.46,7.46,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.23,9.23,0,0,0,.61-3.41,9.63,9.63,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.66,7.66,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.16,8.16,0,0,0,199.58,32.27Z"></path>
                          <path class="cls-2" d="M217.12,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.66,3.66,0,0,1-.83,1.06,13.94,13.94,0,0,0-2.22-.8,11.1,11.1,0,0,0-3-.37q-6.2,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M236,19.76a9.63,9.63,0,0,1,3-7.55c2-1.78,4.76-2.67,8.3-2.67a13.71,13.71,0,0,1,5.43.92,3,3,0,0,1,2.09,2.84,3.45,3.45,0,0,1-.5,1.75,3.87,3.87,0,0,1-.82,1.06,14.46,14.46,0,0,0-2.23-.8,11.1,11.1,0,0,0-3-.37q-6.19,0-6.2,6.57V36.87h-6Z"></path>
                          <path class="cls-2" d="M268.88,9.54a15.39,15.39,0,0,1,5.75,1.06,14,14,0,0,1,4.64,2.94A13.52,13.52,0,0,1,282.34,18a13.91,13.91,0,0,1,1.11,5.59,13.8,13.8,0,0,1-1.11,5.53,13.52,13.52,0,0,1-3.07,4.45,14.42,14.42,0,0,1-4.64,3,15.71,15.71,0,0,1-11.5,0,14.26,14.26,0,0,1-4.63-3,13.37,13.37,0,0,1-3.07-4.45,13.63,13.63,0,0,1-1.12-5.53A13.75,13.75,0,0,1,255.43,18a13.37,13.37,0,0,1,3.07-4.45,13.87,13.87,0,0,1,4.63-2.94A15.42,15.42,0,0,1,268.88,9.54Zm0,22.73a8.2,8.2,0,0,0,3.34-.67,7.56,7.56,0,0,0,2.62-1.85,8.64,8.64,0,0,0,1.7-2.76,9.44,9.44,0,0,0,.61-3.41,9.85,9.85,0,0,0-.61-3.47,8.36,8.36,0,0,0-1.7-2.79,7.75,7.75,0,0,0-2.62-1.82,8.71,8.71,0,0,0-6.7,0,7.87,7.87,0,0,0-2.6,1.82,8.34,8.34,0,0,0-1.69,2.79,9.63,9.63,0,0,0-.61,3.47,9.23,9.23,0,0,0,.61,3.41,8.62,8.62,0,0,0,1.69,2.76,7.67,7.67,0,0,0,2.6,1.85A8.13,8.13,0,0,0,268.88,32.27Z"></path>
                          <path class="cls-2" d="M292.4,36.87q-2.59-6.09-4.26-10.33c-1.11-2.82-2-5.16-2.65-7s-1.11-3.28-1.38-4.29a10,10,0,0,1-.39-2.14,2.74,2.74,0,0,1,3-2.81,6.26,6.26,0,0,1,1.82.21,6.82,6.82,0,0,1,.88.32q.63,2.32,1.43,4.95T292.51,21c.57,1.73,1.12,3.38,1.67,4.95l1.46,4.21c.39-1.09.8-2.34,1.24-3.76s.9-2.86,1.38-4.37.94-3,1.4-4.55.89-3,1.28-4.37a4.61,4.61,0,0,1,1.19-2.1,3.56,3.56,0,0,1,2.46-.71,6,6,0,0,1,1.91.29,10.9,10.9,0,0,1,1.06.4q.69,2.38,1.48,5t1.59,5.17c.53,1.69,1.05,3.32,1.56,4.87s1,2.94,1.41,4.13c.92-2.43,1.86-5.1,2.83-8s1.86-5.8,2.68-8.69a5.58,5.58,0,0,1,1.24-2.41,3.2,3.2,0,0,1,2.36-.77,5.08,5.08,0,0,1,2.33.47,7.63,7.63,0,0,1,1,.59q-.44,1.74-1.48,4.82c-.71,2.05-1.51,4.26-2.39,6.65s-1.82,4.82-2.81,7.31-1.92,4.74-2.8,6.75h-6.26c-.28-.74-.66-1.82-1.13-3.25s-1-3-1.57-4.69-1.12-3.44-1.67-5.22-1.05-3.42-1.51-4.9c-.46,1.48-1,3.12-1.51,4.9s-1.09,3.52-1.64,5.22-1,3.26-1.51,4.69-.83,2.51-1.11,3.25Z"></path>
                      </svg>
			  <span>See terms: <strong onclick="PayTomorrow.openMpeIframe()"><u>PayTomorrow</u></strong>
			  </span>
			</a>
		  </div>`
		}
	}

	return payTomorrowTermsHTML;
  }

  function getProductPrice() {
	const productPriceElement = document.querySelector('.hidden-product-price-formatted').innerHTML;
	const formattedProductPrice = productPriceElement.match(/\d+(?:,\d{3})*(?:\.\d+)?/)[0]  
	.replace(/,/g, '') 
	.replace(/(\.\d*?[1-9])0+$/, '$1') 
	.replace(/\.0+$/, ''); 
	const productPrice = parseFloat(formattedProductPrice);
	return productPrice;
  }