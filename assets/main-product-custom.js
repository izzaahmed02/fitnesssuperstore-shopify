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
        const convertedPrice = (originalPrice * Shopify.currency.rate).toFixed(2); 
            
        contentHTML += `
          <div class="product-card" data-product-id="${product.id}">
            <div class="product-card__img"><img src="${product.images[0]?.src}" alt="${product.title}" /></div>
            <h4 class="product-card__title">${product.title}</h4>
            <div class="product-card__mid">
                <span class="product-card__code">#${product.variants[0].sku}</span>
                <span class="product-card__price">${Shopify.currency.active} ${convertedPrice}</span>
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
	const container = document.getElementById('dynamic-product-content');
	const modalWrapper = document.querySelector('.modal-wrapper');
	const modalContent = document.querySelector('#dynamic-product-content');
	const closeIconTemplate = document.getElementById('icon-close-template').innerHTML;

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
                                        })
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
			var ptIntervalTrigger = setInterval(() => {
				var ptFrameContainer = document.querySelector('.__pt-iframe-container');
				if (ptFrameContainer) {
					var productPrice = parseFloat(document.querySelector('.hidden-product-price').innerHTML);
					const priceInDollars = (productPrice / 100);
					if (priceInDollars > 499) {
						document.querySelector('.paylater-container').style.display = 'flex';
						const monthlyPrice = PayTomorrow.getMonthlyPayment(priceInDollars, 48);
						if (monthlyPrice) {
							document.querySelector('.paylater-text').innerHTML = `<span>As low as $${monthlyPrice.toFixed(2)} / 4 interest-free payment</span><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" clip-rule="evenodd" d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z" fill="#F1592A"></path>
						  	</svg>`
	
							var ptInfoLink = document.querySelector('.paytomorrow-logo');
							if (ptInfoLink) {
								ptInfoLink.addEventListener('click', () => {
									PayTomorrow.openMpeIframe();
								})
							}
						}
					}
					clearInterval(ptIntervalTrigger)
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
		
		if (window.product) {
			fetchProductDetailsWithMetafields(window.product.id).then((product) => {
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