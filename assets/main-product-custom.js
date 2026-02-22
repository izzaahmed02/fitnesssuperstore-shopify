window.addEventListener('DOMContentLoaded', async () => {
	
	_affirm_config = {
      public_api_key:  "DDKLC4NZ9P7UTRIX",
       script:          "https://cdn1.affirm.com/js/v2/affirm.js"
    };
    (function(l,g,m,e,a,f,b){var d,c=l[m]||{},h=document.createElement(f),n=document.getElementsByTagName(f)[0],k=function(a,b,c){return function(){a[b]._.push([c,arguments])}};c[e]=k(c,e,"set");d=c[e];c[a]={};c[a]._=[];d._=[];c[a][b]=k(c,a,b);a=0;for(b="set add save post open empty reset on off trigger ready setProduct".split(" ");a<b.length;a++)d[b[a]]=k(c,e,b[a]);a=0;for(b=["get","token","url","items"];a<b.length;a++)d[b[a]]=function(){};h.async=!0;h.src=g[f];n.parentNode.insertBefore(h,n);delete g[f];d(g);l[m]=c})(window,_affirm_config,"affirm","checkout","ui","script","ready");

	observeModalVisibility();
	
	function checkForElements() {
		const shippingType = document.querySelector(
			'.avp-option.ap-options__select-container:has(select[name^="Full Assembly & Installation"])'
		);
		const warranty = document.querySelector(
			'.avp-option.ap-options__select-container:has(select[name^="Warranty"])'
		);

		const customerLocationForm = document.querySelector(
			'.customer-location-container'
		);

			if (shippingType) {
                shippingType.querySelector('.avp-option-title .apo-title').innerText = 'Assembly & Room of Choice Installation Needed?'
				customerLocationForm.parentElement.insertAdjacentElement('beforebegin', shippingType);
				shippingType.style.display = 'block';

				const apoTitle = shippingType.querySelector('.apo-title');
				if (apoTitle) {
					apoTitle.setAttribute('style', 'font-size: 12px !important; margin-bottom: 6px;');
				}

				if (shippingType.querySelector('select').options[0] && 	shippingType.querySelector('select').options[0].text.includes('Curbside')) {
					shippingType.querySelector('select').options[0].text = 'No, Curbside Delivery Only';
				}

				const avisInputInstallationHidden = document.querySelector(`input[temp-name="Full Assembly & Installation"]`);

				if (avisInputInstallationHidden) {
					avisInputInstallationHidden.value = 'No, Curbside Delivery Only';
				}

				shippingType.addEventListener('change', (event) => {
					const selectedOption = event.target.options[event.target.selectedIndex];

					if (selectedOption) {
						if (selectedOption.value.includes('Curbside')) {
							avisInputInstallationHidden.value = 'No, Curbside Delivery Only';
							return;
						}

						const moneyHTML = selectedOption.querySelector('.money')?.innerHTML;
						
						if (moneyHTML) {
							setTimeout(() => {	
								if (avisInputInstallationHidden) {
									if (!avisInputInstallationHidden.value.includes('Add')) {
										avisInputInstallationHidden.value = `${avisInputInstallationHidden.value} ${moneyHTML}`
									} 
								}
							});
						}
					}
				});

				warranty.addEventListener('change', (event) => {
					const selectedOption = event.target.options[event.target.selectedIndex];

                    if (selectedOption) {
						const moneyHTML = selectedOption.querySelector('.money')?.innerHTML;
					
						if (moneyHTML) {
							const avisInputWarrantyHidden = document.querySelector(`input[temp-name="Warranty"]`);
	
							if (avisInputWarrantyHidden) {
								if (!avisInputWarrantyHidden.value.includes('Add')) {
									avisInputWarrantyHidden.value = `${avisInputWarrantyHidden.value} ${moneyHTML}`
								} 
							}
						}
					}
			});

			clearInterval(pollingInterval);
		}
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

	const pollingInterval = setInterval(checkForElements, 500);

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
		  prevArrow.setAttribute("aria-label", "Previous slide");
          prevArrow.innerHTML = `
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M7.53033 0.46967C7.82322 0.762563 7.82322 1.23744 7.53033 1.53033L2.06066 7L7.53033 12.4697C7.82322 12.7626 7.82322 13.2374 7.53033 13.5303C7.23744 13.8232 6.76256 13.8232 6.46967 13.5303L0.46967 7.53033C0.176777 7.23744 0.176777 6.76256 0.46967 6.46967L6.46967 0.46967C6.76256 0.176777 7.23744 0.176777 7.53033 0.46967Z" fill="#CCCCCC"/>
            </svg>
          `;
  
          const nextArrow = document.createElement("button");
          nextArrow.className = "arrow custom next-arrow";
		  nextArrow.setAttribute("aria-label", "Next slide");
          nextArrow.innerHTML = `
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M0.46967 0.46967C0.762563 0.176777 1.23744 0.176777 1.53033 0.46967L7.53033 6.46967C7.82322 6.76256 7.82322 7.23744 7.53033 7.53033L1.53033 13.5303C1.23744 13.8232 0.762563 13.8232 0.46967 13.5303C0.176777 13.23744 0.176777 12.7626 0.46967 12.4697L5.93934 7L0.46967 1.53033C0.176777 1.23744 0.176777 0.762563 0.46967 0.46967Z" fill="#D83D0E"/>
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
	  sortByDropdown.setAttribute('aria-label', 'Sort reviews');
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
      const interval = setInterval(async function () {
        const reviewSection = document.querySelector("#sa_review_paging");
		if (reviewSection) {
			addCustomActions();

			if (Object.keys(sa_product_reviews.high).length > sa_products_count) {
				addPaginationArrows();
			}

			if (!document.querySelector('.merchantheader')) {
				if(document.querySelector('.product__info-container .available-wrap .sa-reviews')) {
					document.querySelector('.product__info-container .available-wrap .sa-reviews').style.display = 'flex';
				}
				if(document.querySelector('.product__info-container--mobile .available-wrap .sa-reviews')) {
					document.querySelector('.product__info-container--mobile .available-wrap .sa-reviews').style.display = 'flex';
				}
			} 
		}
      }, 500);
    }

	function registerProductReviewsPolling() {
		const interval = setInterval(async function() {
			const reviewSection = document.querySelector('.product_review');

			if (reviewSection) {			
				clearInterval(interval);
				const productInfoContainer = document.querySelector('.product__info-container');

				const starsReview =  productInfoContainer.querySelector('#product_just_stars .on');

				if (!starsReview) {
					var saTotalStars = await getShopperApprovedTotalReviewsCount();

					if (saTotalStars) {
						productInfoContainer.querySelector('#product_just_stars').innerHTML = `<span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="on"></span><span class="ind_cnt med"><a class="sa_jump_to_reviews" href="#review_header">${saTotalStars} <span class="ind_cnt_desc">reviews</span></a></span>`
						productInfoContainer.querySelector('.sa-reviews').style.display = 'flex';
					}
				}
			}
		});
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
			}
		}, 1000);
    }
    
    registerSAReviewsPolling();
	registerCustomActionEvent(); 
	registerProductReviewsPolling();

	document.querySelector('#download-pds').addEventListener('click', () => {
		const product = window.product;
		var pdsUrl = `https://fs-child-products.azurewebsites.net/api/pdf/${product.id}/${product.variants[0].sku}`; 
		window.open(pdsUrl, "_blank"); 
	})

	document.querySelector('.compare-products-actions a')?.setAttribute('href', '');
});


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
						if (customFieldvalue === 'Warranty' || customFieldvalue == 'Shipping' && brand === 'French Fitness') {
							console.log("I am in custom field");
							customFieldvalue = `${brand} ${customFieldvalue} Custom Field`
						} else {
							if (customFieldvalue === 'Warranty' && window.product.title.includes('Remanufactured')) {
								console.log("I am in remanufactured custom field");
								customFieldvalue = `${customFieldvalue} Remanufactured Custom Field`
							} else if (customFieldvalue === 'Condition' && window.product.title.includes('Remanufactured')) {
								window.open("/pages/remanufactured-gym-equipment", "_blank");
								return;
							} 
							else {
								customFieldvalue += ' Custom Field';
							}
						}

						console.log("Custom Field Value is "+ customFieldvalue);
						
						var product = await fetchProductByTitle(customFieldvalue);
                      
                        if (!product && customFieldvalue.includes('Warranty')) {
							console.log("I am in Warranty 30");
							customFieldvalue = 'Warranty (30)';
							product = await fetchProductByTitle(customFieldvalue);
						}
						if (product) {
							document.querySelector('#dynamic-product-content').style.width = "auto";
							modalWrapper.style.display = 'flex';
							const tempDiv = document.createElement('div');
							tempDiv.innerHTML = product.body_html;
							const mainContent = tempDiv;
							container.innerHTML = mainContent.innerHTML + `<span class="modal-close">${closeIconTemplate}</span>`;
	
							const closeModalButton = container.querySelector('.modal-close');
	
							closeModalButton.addEventListener('click', () => {
								modalWrapper.style.display = 'none';
                              $('#dynamic-product-content').empty();
							});
						};
					}
				}
			});
		});

		modalWrapper.addEventListener('click', () => {
			modalWrapper.style.display = 'none';
		});

		container.addEventListener('click', (event) => {
			event.stopPropagation();
		});

		/*var afterPayIntervalTrigger = setInterval(() => {
			hideOrShowAfterPayLogo(() => clearInterval(afterPayIntervalTrigger));
		}, 100);*/

		var affirmPayIntervalTrigger = setInterval(() => {
			hideOrShowAffirmLogo(() => clearInterval(affirmPayIntervalTrigger));
		}, 100)

		const waitForPayLaterDependency = setInterval(() => {
		  const payLaterText = generatePayLaterText();
		  const affirmElement = document.querySelector('.affirm-as-low-as');
		  const afterPayElement = document.querySelector('square-placement')?.shadowRoot?.querySelector('.afterpay-text2');

		  if (affirmElement || afterPayElement) {
			 document.querySelectorAll('.paylater-container').forEach(container => {
				container.style.display = 'block';
			 });
			 document.querySelectorAll('.paylater-text').forEach(container => {
				 container.innerHTML = getPaylaterModal(payLaterText);
			 });
				
			 clearInterval(waitForPayLaterDependency);
			}
		  }, 100);
	});
} catch (error) {
	console.log(error)
}

function getPaylaterModal(payLaterText) {
	return `<span>${payLaterText}</span><svg onclick="showPayLaterModal()" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z" fill="#D83D0E"></path>
			</svg>`
}

function generatePayLaterText() {
	let payLaterText = '';
	const productPrice = getProductPrice();	
	document.querySelector('square-placement').setAttribute('data-amount', productPrice);

	let afterPayRate = null;
	if (document.querySelector('square-placement').length > 0) {
		afterPayRate = parseFloat(document.querySelector('square-placement').shadowRoot.querySelector('.afterpay-text2 strong')?.innerHTML.replace('$', '').replace('/mo.', ''));
	}
	const affirm24MosRate = computeAffirmLoanDetails(productPrice, 24).MonthlyPaymentAmount;
	const rates = [afterPayRate, affirm24MosRate]
	.map(rate => parseFloat(rate))
	.filter(rate => !isNaN(rate));
  
    const lowestRate = rates.length ? Math.min(...rates) : 0;  

	payLaterText = `As low as ${lowestRate.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		})}/mo. / 24 interest-free payment`

	return payLaterText;
}

function toggleTransitTimeForm() {
	const transitTimeForm = document.querySelector('.transit-time-form');
	const locationDisplayHeader = document.querySelector('.location-header .location-display');
	if (transitTimeForm.style.display === 'block') {
		transitTimeForm.style.display = 'none';
		locationDisplayHeader.style.color = '#D83D0E'
	} else {
		transitTimeForm.style.display = 'block';
		locationDisplayHeader.style.color = '#57200F'
	}
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

		document.querySelector('#dynamic-product-content').style.width = "600px";
	}
}

function generatePayLaterAggregate() {
	const priceElement = document.querySelector('.pr_custom_price');
	const cleanedPrice = priceElement.textContent.replace(/[^\d,\.]/g, '');
	let buyNowPayLaterHTML = `<div class="buy-now-pay-later">
	<h1 class="title">BUY NOW. PAY LATER.</h1>
	<p class="price">Purchase price: <strong>$${cleanedPrice}</strong>
	</p>
	<p class="description"> Select Affirm as your payment method at checkout to pay in installments. </p>
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

	/*payLaterOptions += generateAfterPayPaymentTerms();*/
	payLaterOptions += generateAffirmPaymentTerms();

	return payLaterOptions;
}
/*
function generateAfterPayPaymentTerms() {
	const afterPayRateElement = document.querySelector('square-placement')?.shadowRoot?.querySelector('.afterpay-text2');
	if (afterPayRateElement == null) return;

	const afterPayRate = afterPayRateElement.querySelector('strong');
	if (!afterPayRate) return null;

	const matchPrice = afterPayRate.innerHTML.match(/[\d,]+(\.\d{1,2})?/);
	const currentPrice = matchPrice ? parseFloat(matchPrice[0].replace(',', '')) : null;
	if (!currentPrice) return;

	const productPrice = getProductPrice();
	const terms = [6, 12, 24];
	let afterPayTermsHTML = '';

	terms.forEach(term => {
		const rate = computeAfterPayLoanDetails(productPrice, currentPrice, 12, term);
		if (rate) {
			afterPayTermsHTML += generateAfterPayOptionHTML(term, rate);
		}
	});

	return afterPayTermsHTML;
}
*/
function generateAfterPayOptionHTML(term, rate) {
	const { MonthlyPaymentForNewTerm, APR, TotalPaymentsNewTerm } = rate;

	return `
		<div class="option">
			<div class="option-details">
				<p class="payment-info">
					<strong>${term} payments of ${MonthlyPaymentForNewTerm}</strong>
				</p>
				<p class="apr">monthly, ${APR} APR</p>
				<p class="total">Total: ${TotalPaymentsNewTerm}</p>
			</div>
			<a href="#" class="terms-link" onclick="event.preventDefault(); event.stopPropagation(); document.querySelector('square-placement').shadowRoot.querySelector('button')?.click();">
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
				<span>See terms: <strong><u>Afterpay</u></strong></span>
			</a>
		</div>`;
}

function generateAffirmPaymentTerms() {
	if (!document.querySelector('.affirm-as-low-as')) return '';

	let productPrice = getProductPrice();  

	if (productPrice) {
		let terms = [6, 12, 24];
		let affirmTermsHTML = '';

		terms.forEach(term => {
			let rate = computeAffirmLoanDetails(productPrice, term);

			if (rate) {
				affirmTermsHTML += `
					<div class="option affirm">
						<div class="option-details">
							<p class="payment-info">
								<strong>${term} payments of ${rate.MonthlyPayment}</strong>
							</p>
							<p class="apr">monthly, ${rate.APR} APR</p>
							<p class="total">Total: ${rate.TotalPayment}</p>
						</div>
						<a href="#" class="terms-link" onclick="event.preventDefault(); event.stopPropagation(); document.querySelector('.affirm-modal-trigger')?.click();">
						<svg width="72" height="72" viewBox="0 0 36 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path fill-rule="evenodd" clip-rule="evenodd" d="M14.7561 8.62608H13.2353V8.04587C13.2353 7.29121 13.6787 7.07527 14.0613 7.07527C14.4834 7.07527 14.8122 7.2574 14.8122 7.2574L15.33 6.10696C15.33 6.10696 14.8051 5.77344 13.851 5.77344C12.7784 5.77344 11.5579 6.36133 11.5579 8.20649V8.62608H9.01189V8.04587C9.01189 7.29121 9.45533 7.07527 9.83712 7.07527C10.0545 7.07527 10.347 7.12445 10.5888 7.2574L11.1066 6.10696C10.7975 5.93021 10.3011 5.77344 9.62765 5.77344C8.55501 5.77344 7.33455 6.36133 7.33455 8.20649V8.62608H6.36071V9.88488H7.33455V14.3321H9.01189V9.88488H11.5579V14.3321H13.2353V9.88488H14.7561V8.62608ZM18.8429 8.62586V14.3319H20.5218V11.583C20.5218 10.2758 21.3351 9.89234 21.9027 9.89234C22.124 9.89234 22.4228 9.95459 22.6204 10.0983L22.9263 8.58975C22.6671 8.48216 22.3959 8.45833 22.1738 8.45833C21.3106 8.45833 20.7684 8.83028 20.4103 9.58494V8.62586H18.8429ZM2.51003 13.3084C2.06896 13.3084 1.84921 13.0979 1.84921 12.7497C1.84921 12.1057 2.59065 11.8852 3.94391 11.7461C3.94391 12.6076 3.34474 13.3084 2.51003 13.3084ZM3.09338 8.45846C2.12666 8.45846 1.01371 8.90188 0.409801 9.36989L0.961535 10.4988C1.44608 10.0677 2.22942 9.69958 2.93608 9.69958C3.60717 9.69958 3.9779 9.91783 3.9779 10.3566C3.9779 10.6533 3.73206 10.8024 3.26728 10.8608C1.53303 11.0806 0.171875 11.5455 0.171875 12.8458C0.171875 13.8763 0.926755 14.5004 2.10611 14.5004C2.94715 14.5004 3.69649 14.0454 4.05299 13.4452V14.3321H5.62124V10.6164C5.62124 9.08171 4.5241 8.45846 3.09338 8.45846ZM28.8111 9.4611C29.1565 8.96926 29.8197 8.45898 30.7074 8.45898C31.78 8.45898 32.6677 9.10606 32.6677 10.3887V14.3326H30.9903V10.9043C30.9903 10.1489 30.5224 9.83536 30.079 9.83536C29.5241 9.83536 28.9692 10.3287 28.9692 11.3954V14.3326H27.2918V10.9159C27.2918 10.1374 26.8507 9.83536 26.3709 9.83536C25.8406 9.83536 25.273 10.3403 25.273 11.3954V14.3326H23.5933V8.62652H25.2114V9.48953C25.4951 8.93852 26.1093 8.45898 26.997 8.45898C27.8104 8.45898 28.4901 8.82556 28.8111 9.4611ZM17.4329 14.3324H15.7571V8.6263H17.4329V14.3324Z" fill="#060809"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M25.5357 0.667969C21.0049 0.667969 16.9665 3.7258 15.8203 7.65742H17.4629C18.4201 4.72946 21.6696 2.15961 25.5357 2.15961C30.235 2.15961 34.2963 5.63782 34.2963 11.0526C34.2963 12.2684 34.1343 13.3643 33.8276 14.3326H35.4211L35.4369 14.2795C35.6978 13.2805 35.8306 12.1954 35.8306 11.0526C35.8306 5.0138 31.3044 0.667969 25.5357 0.667969Z" fill="#0FA0EA"/>
                         </svg>
		                  <span style="cursor: pointer;" onclick="event.preventDefault(); event.stopPropagation(); document.querySelector('.affirm-modal-trigger')?.click();">
                           See terms: <strong><u>Affirm</u></strong>
                          </span>
						</a>
					</div>`;
			}
		});

		return affirmTermsHTML;
	}
  }

  function computeAffirmLoanDetails(productPrice, months) {
	const monthly = (productPrice / months).toFixed(2);
	return {
		MonthlyPaymentAmount: (productPrice / months),
		MonthlyPayment: `$${monthly}`,
		APR: '0.00%',
		TotalPayment: `$${productPrice.toFixed(2)}`
	};
  }

  function getProductPrice() {
    const priceElement = document.querySelector('.pr_custom_price').innerText;

	const formattedProductPrice = priceElement.match(/\d+(?:,\d{3})*(?:\.\d+)?/)[0]  
	.replace(/,/g, '') 
	.replace(/(\.\d*?[1-9])0+$/, '$1') 
	.replace(/\.0+$/, ''); 
	const productPrice = parseFloat(formattedProductPrice);
	return productPrice;
  }
/*
  function hideOrShowAfterPayLogo(callback) {
	var afterPayModalContainer = document.querySelector('afterpay-modal');
	if (afterPayModalContainer) {
		const afterPayElement = document.querySelector('square-placement')?.shadowRoot?.querySelector('.afterpay-text2');
		document.querySelectorAll('.afterPayLogo').forEach(element => {
		  if (afterPayElement && element) {
			element.style.display = 'block';
		  } else {
			element.style.display = 'none';
		  }
		});

		if (callback) {
			callback();
		}
	}
  }*/

  function hideOrShowAffirmLogo(callback) {
	var affirmElement = document.querySelector('.affirm-as-low-as');

	document.querySelectorAll('.affirm-logo').forEach(element => {
		if (affirmElement && element) {
			element.style.display = 'block';
		} else {
			element.style.display = 'none';
		}
	});

	if (affirmElement && callback) {
		callback();
	}
  }

  function observeModalVisibility(modalSelector = '.modal-wrapper') {
    const observer = new MutationObserver(() => {
        const anyModalOpen = Array.from(document.querySelectorAll(modalSelector))
            .some(modal => {
                const style = window.getComputedStyle(modal);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            });

        document.body.classList.toggle('modal-open', anyModalOpen);
    });

    const modals = document.querySelectorAll(modalSelector);

    modals.forEach(modal => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: false,
        });
    });
}

async function getShopperApprovedTotalReviewsCount() {
	const apiUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/reviews/reviewscount`;

	try {
		const response = await fetch(apiUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch API fetchShopperApprovedTotalReviews');
		}

        const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching API fetchShopperApprovedTotalReviews', error);
		return null;
	}
}
