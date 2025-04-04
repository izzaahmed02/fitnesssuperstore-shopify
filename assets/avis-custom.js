const container = document.getElementById('dynamic-product-content');
const modalWrapper = document.querySelector('.modal-wrapper');
const closeIconTemplate = document.getElementById('icon-close-template').innerHTML;
let optionProductsPopup = [];
let selectedNegativePrices = [];

document.addEventListener('DOMContentLoaded', () => {
	const avisOptionsPolling = setInterval(() => {
		if (!document.querySelector('.avpoptions-container__v2')) {
			return;
		}

		if (window.location.pathname.includes('products')) {
			renderCustomAvisOptions();

			if (!window.product.available) {
				document.querySelectorAll('.avp-select').forEach((select) => {
					select.style.background = '#F2F2F2';
					select.querySelector('select').disabled = true;
					select.querySelector('select').style.color = '#808080';
				});
			}

			document.querySelectorAll('.money.apo-money').forEach((el) => {
				const price = el.textContent.replace(/[()+]/g, '').trim();

				if (el.parentElement && el.parentElement.tagName.toLowerCase() === 'option') {
					el.textContent = `[${price}]`;
				} else {
					el.textContent = price;
				}
			});
		}

		document.querySelectorAll('.ap-options__swatch-container').forEach(container => {
			const titleElement = container.querySelector('.ap-label-tooltip .apo-title');
			if (titleElement && titleElement.textContent.trim() === 'Paint Color' || titleElement && titleElement.textContent.trim() === 'Vinyl Color' || titleElement && titleElement.textContent.trim() === 'Upholstery Color') {
				container.style.display = 'none';
			}
		});

		clearInterval(avisOptionsPolling);
	}, 100);
});

function renderCustomAvisOptions() {
	const warrantySelect = document.querySelector('select[name="Warranty"]');
	if (warrantySelect) {
		const warrantyParentContainer = warrantySelect.closest('.ap-options__select-container');
		if (warrantyParentContainer) {
			const selectOptions = warrantyParentContainer.querySelector('select').options.length;
      if (selectOptions > 1) {
        warrantyParentContainer.style.display = 'block';
        warrantyParentContainer.querySelector('.ap-label-tooltip').classList.add('ap-options__heading');
      }
		}
	}

	const dropdownContainers = document.querySelectorAll('.ap-options__swatch-container');
	dropdownContainers.forEach((container) => {
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
	arrows.forEach((arrow) => {
		arrow.addEventListener('click', () => {
			if (arrow.style.transform === 'rotate(45deg)') {
				arrow.setAttribute('style', 'transform: rotate(225deg) !important');
			} else {
				arrow.setAttribute('style', 'transform: rotate(45deg) !important');
			}
		});
	});

	document.querySelectorAll('.ap-label-tooltip').forEach((element) => {
		const style = document.createElement('style');
		style.textContent = `.ap-label-tooltip::after { display: none !important; }`;
		document.head.appendChild(style);

		if (window.location.pathname.includes('products')) {
			if (window.product.available) {
				element.innerHTML += `
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z"
                  fill="#F1592A"/>
          </svg>`;
			} else {
				element.innerHTML += `
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z"
                  fill="#B3B3B3"/>
          </svg>`;
			}
		} else {
			element.innerHTML += `
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
                d="M9 2.125C5.20304 2.125 2.125 5.20304 2.125 9C2.125 12.797 5.20304 15.875 9 15.875C12.797 15.875 15.875 12.797 15.875 9C15.875 5.20305 12.797 2.125 9 2.125ZM0.874999 9C0.874999 4.51269 4.51269 0.875001 9 0.875001C13.4873 0.875002 17.125 4.51269 17.125 9C17.125 13.4873 13.4873 17.125 9 17.125C4.51268 17.125 0.874998 13.4873 0.874999 9ZM9.83333 12.3333C9.83333 12.7936 9.46024 13.1667 9 13.1667C8.53976 13.1667 8.16667 12.7936 8.16667 12.3333C8.16667 11.8731 8.53976 11.5 9 11.5C9.46024 11.5 9.83333 11.8731 9.83333 12.3333ZM7.93333 7.33334C7.93333 6.74423 8.4109 6.26667 9 6.26667C9.5891 6.26667 10.0667 6.74423 10.0667 7.33334L10.0667 7.43444C10.0667 7.74415 9.94364 8.04117 9.72464 8.26017L8.57574 9.40907C8.34142 9.64339 8.34142 10.0233 8.57574 10.2576C8.81005 10.4919 9.18995 10.4919 9.42427 10.2576L10.5732 9.1087C11.0172 8.66466 11.2667 8.06241 11.2667 7.43444L11.2667 7.33334C11.2667 6.08149 10.2518 5.06667 9 5.06667C7.74816 5.06667 6.73333 6.08149 6.73333 7.33333L6.73333 7.75C6.73333 8.08137 7.00196 8.35 7.33333 8.35C7.6647 8.35 7.93333 8.08137 7.93333 7.75L7.93333 7.33334Z"
                fill="#F1592A"/>
        </svg>`;
		}

		const toolTip = element.querySelector('svg');
		if (toolTip) {
			toolTip.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();

				const parentWithHandle = element.closest('[class^="handle-"]');

				let headingElement = parentWithHandle.previousElementSibling;

				while (headingElement) {
					if (headingElement.classList.contains('ap-options__heading-container')) {
						break;
					}
					headingElement = headingElement.previousElementSibling;
				}

				let headingTitle = '';

				if (headingElement) {
					headingTitle = headingElement.querySelector('.avp-heading')?.innerText
				}

				const handleClass = Array.from(parentWithHandle.classList).find((cls) => cls.startsWith('handle-'));
				let optionCategoryId;

				if (handleClass) {
					optionCategoryId = handleClass.split('-')[1];
				}

				document.querySelector('#dynamic-product-content').style.width = 'auto';
				modalWrapper.style.display = 'flex';
				container.innerHTML = '';

				const productTitle = parentWithHandle.querySelector('.apo-title')?.innerText;
				if (productTitle) {
					let optionHTML = '';
					let productTitleSearch = '';

					if (headingTitle) {
						productTitleSearch = `${productTitle} - ${headingTitle} (${optionCategoryId})`;
					} else {
						productTitleSearch = `${productTitle} (${optionCategoryId})`;
					}

					const optionPopupProductsHtml = await renderOptionPopupProducts(productTitleSearch);

					if (!optionPopupProductsHtml) {
						const encodedProductTitle = encodeURIComponent(productTitle);
						const product = await fetchProductByTitle(encodedProductTitle);
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
								productCards.forEach((p) => {
									const productId = parseInt(p.getAttribute('data-product-id'));
									const productObj = optionProductsPopup.find((x) => x.id === productId);

									if (productObj) {
										p.addEventListener('click', (e) => {
											const currentP = e.currentTarget;
											const siblingsArray = [...currentP.parentElement.children].filter(
												(child) => child !== currentP.parentElement
											);
											siblingsArray.forEach((item) => item.classList.remove('active'));
											currentP.classList.add('active');

											const shortDescriptionMetafield = productObj.metafields.find(
												(metafield) => metafield.key === 'short_description'
											);
											const shortDescription = shortDescriptionMetafield
												? shortDescriptionMetafield.value
												: 'No short description available.';

											const productDetailsHTML = `
                        <div class="product-details__product-image">
                          <img src="${productObj.image.src}" alt="${productObj.title}">
                        </div>
                        <div class="product-details__product-info">
                          <h2 class="product-details__title">${productObj.title}</h2>
                          <p class="product-details__short_description">${shortDescription}</p>
                        </div>`;

											const productDetailsContainer = document.querySelector('.product-details-container');
											const productDetailsDescriptionBody = document.querySelector('.product-details-description-body');
											productDetailsContainer.style.display = 'flex';
											productDetailsDescriptionBody.style.display = 'block';
											productDetailsContainer.innerHTML = productDetailsHTML;

											const productDetailsDescriptionBodyDiv = document.createElement('div');
											productDetailsDescriptionBodyDiv.innerHTML =
												productObj.body_html.replace(shortDescription, '');
											removeEmptyElements(productDetailsDescriptionBodyDiv);
											clearImages(productDetailsDescriptionBodyDiv);
											productDetailsDescriptionBody.innerHTML = productDetailsDescriptionBodyDiv.innerHTML;
										});
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

	setupOptionsHandler();
}


function setupOptionsHandler() {
	const optionsContainer = document.querySelectorAll('.avp-option');

	optionsContainer.forEach((optionContainer) => {
		const optionLabel = optionContainer.querySelector('.ap-label-tooltip');
		if (optionLabel) {
			const selectedOptionsContainerNew = document.createElement('div');
			selectedOptionsContainerNew.classList.add('selected_options_container');
			optionLabel.append(selectedOptionsContainerNew);
		}

		const swatchContainer = optionContainer.querySelector('.ap-options__swatch');

		optionContainer.querySelectorAll('.avp-productoptionswatchwrapper').forEach((wrapper) => {
			const input = wrapper.querySelector('input[type="radio"]');
			wrapper.addEventListener('click', (event) => {
				if (window.location.pathname.includes('products') && !window.product.available) {
					event.preventDefault();
					return;
				}

				const allInputs = Array.from(swatchContainer?.querySelectorAll('input[type="radio"]'));
				const inputIndex = allInputs.indexOf(input);
				const inputTextValue = input.value;
				let inputMoneyValue;

				inputMoneyValue = input
				?.parentElement
				?.querySelector('.swatch-variant-title .money')
				?.innerText.replace('(', '')
				.replace(')', '')
				.replace('+', '');

				if (inputTextValue == 'No Thanks' && !inputMoneyValue.includes('-$')) {
					inputMoneyValue = Shopify.currency.active === 'USD' ? '$0' : '';
				}

				if (input.getAttribute('field-name') === 'Weight Stack') {
					const weightStackField = document.querySelector('fieldset.weight-stack');
					if (weightStackField) {
						const wrapperIndex = [...optionContainer.querySelectorAll('.avp-productoptionswatchwrapper')].indexOf(
							wrapper
						);
						const weightStackTarget = weightStackField.querySelectorAll('label')[wrapperIndex];
						if (weightStackTarget) {
							weightStackTarget.click();
						}
					}
				}

				const selectedOptionHTML = `
          <div class="option_selected-container">
            <p class="option_selected">${inputTextValue}</p>
            ${
					inputMoneyValue
						? `<span class="option_selected-price">${inputMoneyValue}</span>`
						: ''
				}
            <svg class="remove-icon" data-group-name="${input.name}" data-value="${inputIndex}" width="16" height="16" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M3.5771 3.57613C3.81142 3.34181 4.19132 3.34181 4.42563 3.57613L8.00137 7.15186L11.5771 3.57613C11.8114 3.34181 12.1913 3.34181 12.4256 3.57613C12.6599 3.81044 12.6599 4.19034 12.4256 4.42465L8.8499 8.00039L12.4256 11.5761C12.6599 11.8104 12.6599 12.1903 12.4256 12.4247C12.1913 12.659 11.8114 12.659 11.5771 12.4247L8.00137 8.84892L4.42563 12.4247C4.19132 12.659 3.81142 12.659 3.5771 12.4247C3.34279 12.1903 3.34279 11.8104 3.5771 11.5761L7.15284 8.00039L3.5771 4.42465C3.34279 4.19034 3.34279 3.81044 3.5771 3.57613Z"
                    fill="black"/>
            </svg>
          </div>`;

		  setTimeout(() => {	
			const avisInputHidden = document.querySelector(`[name=\"properties[${CSS.escape(input.getAttribute('field-name').replace('&quot;', '"'))}]\"]`);
			if (avisInputHidden && input.checked && inputMoneyValue) {
				if (!avisInputHidden.value.includes('Add')) {
			  		avisInputHidden.value = avisInputHidden.value + ` [Add +${inputMoneyValue}]`
				}
			}
		  });

        const selectedOptionsContainer = wrapper.parentElement.parentElement.querySelector('.selected_options_container');

        if (input.checked) {
          if (!selectedOptionsContainer?.querySelector(`[data-value="${inputIndex}"]`)) {
            selectedOptionsContainer.innerHTML = selectedOptionHTML;
          }

          Array.from(selectedOptionsContainer.children).forEach((option) => {
            option.style.display = 'flex';
          });

          optionContainer.querySelectorAll('.avp-productoptionswatchwrapper').forEach((wrap) => {
            wrap.setAttribute('style', 'border: 1px solid #E5E5E5 !important;');
          });

          wrapper.setAttribute('style', 'border: 1px solid #F1592A !important;');

          optionContainer.querySelectorAll('.remove-icon').forEach((icon) => {
            icon.addEventListener('click', (event) => {
              event.stopPropagation();
              const optionSelectedContainer = event.target.closest('.option_selected-container');
              if (optionSelectedContainer) {
                const value = parseInt(icon.getAttribute('data-value'));
                const relatedInput =
                  optionContainer.querySelectorAll('.avp-productoptionswatchwrapper input[type="radio"]')[value];

                if (relatedInput) {
                  relatedInput.checked = false;
                  relatedInput.dispatchEvent(
                    new Event('change', {
                      bubbles: true
                    })
                  );
                  optionSelectedContainer.remove();
                  wrapper.setAttribute('style', 'border: 1px solid #E5E5E5 !important;');
                }

				const optionGroupName = icon.dataset.groupName;

				if (optionGroupName) {
					selectedNegativePrices = selectedNegativePrices.filter(x => x.target !== optionGroupName);
					updateCustomPrice();
				}
              }
            });
          });
        } else {
          const optionToRemove = selectedOptionsContainer.querySelector(`[data-value="${inputIndex}"]`);
          if (optionToRemove) {
            optionToRemove.closest('.option_selected-container').remove();
          }
          wrapper.setAttribute('style', 'border: 1px solid #E5E5E5 !important;');
        }
      });
    });
  });

//   document.querySelectorAll('.avp-productoptionbackground').forEach(element => {
// 	element.addEventListener('change', (radioInput) => {
// 		const inputTextValue = radioInput.target.value;
// 		if (inputTextValue !== 'No Thanks') {
// 			inputMoneyValue = radioInput.target
// 				?.parentElement
// 				?.querySelector('.swatch-variant-title .money')
// 				?.innerText.replace('(', '')
// 				.replace(')', '')
// 				.replace('+', '');
// 		} else {
// 			inputMoneyValue = Shopify.currency.active === 'USD' ? '$0' : '';
// 		}

// 		if (selectedNegativePrices && inputMoneyValue.includes('-$')) {
// 			const inputMoney = parseFloat(inputMoneyValue.replace('-$', ''));

// 			if (selectedNegativePrices.findIndex(x => x.target == radioInput.target.name) === -1) {
// 				selectedNegativePrices.push({ target: radioInput.target.name, value: inputMoney });
// 			} else {
// 				selectedNegativePrices.forEach(item => {
// 					if (item.target === radioInput.target.name) {
// 						item.value = inputMoney;
// 					}
// 				});
// 			}
// 		}
		
// 		updateCustomPrice();
// 	})
//   });

  document.querySelectorAll('.avp-productoptionswatchwrapper').forEach((element) => {
	element.addEventListener('click', (event) => {
		const input = element.querySelector('input');
		const inputTextValue = input.value;

		inputMoneyValue = input
		?.parentElement
		?.querySelector('.swatch-variant-title .money')
		?.innerText.replace('(', '')
		.replace(')', '')
		.replace('+', '');

		if (inputTextValue == 'No Thanks' && !inputMoneyValue.includes('-$')) {
			inputMoneyValue = Shopify.currency.active === 'USD' ? '$0' : '';
		}

		const isChecked = input.checked;

		if (!isChecked) {
			const inputName = input.name;

			selectedNegativePrices = selectedNegativePrices.filter(x => x.target !== inputName);
		} else {
			if (selectedNegativePrices && inputMoneyValue && inputMoneyValue.includes('-$')) {
				const inputMoney = parseFloat(inputMoneyValue.replace('-$', ''));
	
				if (selectedNegativePrices.findIndex(x => x.target == input.name) === -1) {
					selectedNegativePrices.push({ target: input.name, value: inputMoney });
				} else {
					selectedNegativePrices.forEach(item => {
						if (item.target === input.name) {
							item.value = inputMoney;
						}
					});
				}
			}
			
			updateCustomPrice();
		}
	});

    const optionValueDes = element.querySelector('.option-value-des');

    if (optionValueDes) {
      const apoValueHelpText = optionValueDes.querySelector('.apo-value-help-text');
      if (apoValueHelpText && apoValueHelpText.innerText.includes('-$')) {
        const apoMoney = optionValueDes.querySelector('.apo-money');
        if (apoMoney) {
          const apoMoneyText = apoMoney.innerText;
          if (apoMoneyText) {
            const subtractText = apoValueHelpText.innerText.replace('Subtract ', '');
            apoMoney.innerText = subtractText;
            apoValueHelpText.style.display = 'none';
          }
        }
      }
    }
  });
}

async function fetchProductByHandle(handle) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/option/${handle}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch product by handle');
		}

		const data = await response.json();
		return data.products[0];
	} catch (error) {
		console.error('Error fetching product by handle:', error);
		return null;
	}
}

async function fetchProductByTitle(title) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/productbytitle?title=${title}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch product by title');
		}

		const data = await response.json();
		return data.products[0];
	} catch (error) {
		console.error('Error fetching product by title:', error);
		return null;
	}
}

async function fetchProductMetafields(productId) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metafields/${productId}/`;
	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch product metafields');
		}

		const data = await response.json();
		return data.metafields;
	} catch (error) {
		console.error('Error fetching product metafields:', error);
		return null;
	}
}

async function fetchProductDetails(productId) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/product/${productId}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch product details');
		}

		const data = await response.json();
		return data.product;
	} catch (error) {
		console.error('Error fetching product details:', error);
		return null;
	}
}

async function fetchProductDetailsWithMetafields(productId) {
	const productUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/product/${productId}`;
	const metafieldsUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metafields/${productId}/`;

	try {
		const [productResponse, metafieldsResponse] = await Promise.all([
			fetch(productUrl, {method: 'GET'}),
			fetch(metafieldsUrl, {method: 'GET'})
		]);

		if (!productResponse.ok || !metafieldsResponse.ok) {
			throw new Error('Failed to fetch product details or metafields');
		}

		const productData = await productResponse.json();
		const metafieldsData = await metafieldsResponse.json();

		productData.product.metafields = metafieldsData.metafields;
		return productData.product;
	} catch (error) {
		console.error('Error fetching product details with metafields:', error);
		return null;
	}
}

async function fetchProductMetaObject(metaObjectId) {
	const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metaobject?metaobjectId=${metaObjectId}`;

	try {
		const response = await fetch(shopifyUrl, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Failed to fetch metaobject');
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching meta object:', error);
		return null;
	}
}

async function renderOptionPopupProducts(title) {
	const product = await fetchProductByTitle(title);

	if (!product) {
		console.error('No product found for the given title.');
		return;
	}

	const productId = product.id;
	const metafields = await fetchProductMetafields(productId);

	if (!metafields) {
		console.error('No metafields found for the product.');
		return null;
	}

	const relatedProductsMetafield = metafields.find((field) => field.key === 'related_products');
	if (!relatedProductsMetafield || !relatedProductsMetafield.value) {
		console.error('No related products found in the metafield.');
		return null;
	}

	const optionProductIds = JSON.parse(relatedProductsMetafield.value).map((id) => id.split('/').pop());
	const optionProducts = await Promise.all(
		optionProductIds.map((id) => fetchProductDetailsWithMetafields(id))
	);

	optionProductsPopup = optionProducts;

	let contentHTML = `
    <div class="option-title">
      <h2>ABOUT OPTIONS - ${product.title}</h2>
    </div>
    <div class="option-products">
      <div class="product-cards">`;

	optionProducts.forEach((prod) => {
		const shortDescriptionMetafield = prod.metafields.find((metafield) => metafield.key === 'short_description');
		const shortDescription = shortDescriptionMetafield
			? shortDescriptionMetafield.value
			: 'No short description available.';

		const originalPrice = parseFloat(prod.variants[0].price);
		const price =
			Shopify.country !== 'US'
				? (originalPrice * Shopify.currency.rate).toFixed(2)
				: originalPrice.toFixed(2);
		contentHTML += `
      <div class="product-card" data-product-id="${prod.id}">
        <div class="product-card__img">
          <img src="${prod.images[0]?.src}" alt="${prod.title}" />
        </div>
        <h4 class="product-card__title">${prod.title}</h4>
        <div class="product-card__mid">
          <span class="product-card__code">#${prod.variants[0].sku}</span>
          <span class="product-card__price">
            ${'$' + price}
          </span>
        </div>
        <p class="product-card__description">${shortDescription.substring(0, 150)}...</p>
        <a class="read-more-btn" data-id="${prod.id}">Read more</a>
      </div>
    `;
	});

	const productDetailsHTML = `
    </div>
    <div class="product-details">
      <div class="product-details-container"></div>
      <div class="product-details-description-body"></div>
    </div>
  `;

	contentHTML += productDetailsHTML;
	contentHTML += '</div>';

	return contentHTML;
}

function removeEmptyElements(element) {
	const elements = element.querySelectorAll('p, div');
	elements.forEach((el) => {
		if (
			(!el.textContent.trim() && el.children.length === 0) ||
			el.innerHTML.trim() === '<br>' ||
			el.innerHTML.trim() === '<br><br>' ||
			(!el.textContent.trim() && el.innerHTML.trim().match(/^<br\s*\/?>$/i))
		) {
			el.remove();
		}
	});

	const brElements = element.querySelectorAll('br');
	brElements.forEach((br) => br.remove());

	const h5Elements = element.querySelectorAll('h5');
	h5Elements.forEach((h5) => h5.remove());

	const h6Elements = element.querySelectorAll('h6');
	h6Elements.forEach((h6) => h6.remove());
}

function clearImages(element) {
	const images = element.querySelectorAll('img');
	images.forEach((img) => {
		if (img.parentElement) {
			img.parentElement.remove();
		} else {
			img.remove();
		}
	});
}

document.addEventListener('click', function(event) {
	if (event.target.classList.contains('read-more-btn')) {
		const button = event.target;
		const productCard = button.closest('.product-card');
		if (!productCard) return;

		const descriptionEl = productCard.querySelector('.product-card__description');
		if (!descriptionEl) return;

		if (descriptionEl.classList.contains('expanded')) {
			descriptionEl.style.maxHeight = '0';
			descriptionEl.classList.remove('expanded');
			button.textContent = 'Read more';
		} else {
			descriptionEl.style.maxHeight = descriptionEl.scrollHeight + 'px';
			descriptionEl.classList.add('expanded');
			button.textContent = 'Read Less';
		}
	}
});


if (window.location.pathname === '/cart') {
	let isPopupOpen = false;

	const observer = new MutationObserver(() => {
		const avisCartOptionsPopupContainer = document.querySelector(
			'.avis-cartOptionsPopup .ap-options__select-container'
		);

		if (avisCartOptionsPopupContainer && avisCartOptionsPopupContainer.style.display !== 'none') {
			if (!isPopupOpen) {
				isPopupOpen = true;
				document.querySelector('html').style.overflowY = 'hidden';
				renderCustomAvisOptions();
			}
		} else {
			isPopupOpen = false;
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['style', 'class']
	});
}


function setupPopupHeaderCloseDelegate() {
	document.addEventListener('click', (event) => {
		const target = event.target.closest('.avis-popupHeader-close, .avis-cartOptionsBackdrop, .avis-popupFooter-cancel');
		if (target) {
			document.documentElement.style.overflowY = '';
		}
	});
}

function updateCustomPrice() {
  setTimeout(() => {
    const priceEl = document.querySelector('.pr_custom_price');
    if (!priceEl) return;
  
    const formattedProductPrice = priceEl.innerText.match(/\d+(?:,\d{3})*(?:\.\d+)?/)[0]  
    .replace(/,/g, '') 
    .replace(/(\.\d*?[1-9])0+$/, '$1') 
    .replace(/\.0+$/, ''); 
  
    const productPrice = parseFloat(formattedProductPrice);

	const totalAmountToSubtract = selectedNegativePrices.reduce((total, obj) => total + (obj.value || 0), 0);
  
	const newPrice = productPrice - totalAmountToSubtract;
  
	const formattedPrice = newPrice.toLocaleString('en-US', {
	  style: 'currency',
	  currency: 'USD'
	});

	document.querySelectorAll('.pr_custom_price').forEach((element) => {
		element.innerText = formattedPrice  
	});
  }, 100);
}

setupPopupHeaderCloseDelegate();
