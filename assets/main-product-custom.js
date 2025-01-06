window.addEventListener('DOMContentLoaded', () => {
    // Polling function to check if the form elements and shippingInfo element exist
    function checkForElements() {
      const shippingInfo = document.querySelector(
        '.docapp-single-shipping-calculator .docapp-shipping-show-trigger'
      );
      const cityInput = document.querySelector('input[name="shipping_address[city]"]');
      const zipInput = document.querySelector('input[name="shipping_address[zip]"]');
      const shippingType = document.querySelector(
        '.avp-option.ap-options__select-container:has(select[name^="Shipping Type"])'
      );
  
      if (shippingInfo && cityInput && zipInput) {
        cityInput.addEventListener('input', () => {
          localStorage.setItem('city', cityInput.value);
        });
  
        zipInput.addEventListener('input', () => {
          localStorage.setItem('zip', zipInput.value);
        });
  
        getFormDataAndDisplay(cityInput, zipInput, shippingInfo);
  
        // Move the shippingType element under shippingInfo
        if (shippingType) {
          shippingInfo.parentElement.insertAdjacentElement('afterend', shippingType);
          shippingType.style.display = 'block';
  
          // Change font size of .apo-title inside shippingType
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
          '.avp-option.ap-options__select-container:has(select[name^="Shipping Type"])'
        );
  
        if (shippingInfo && cityInput && zipInput) {
          getFormDataAndDisplay(cityInput, zipInput, shippingInfo);
  
          // Move the shippingType element under shippingInfo
          if (shippingType) {
            shippingInfo.parentElement.insertAdjacentElement('afterend', shippingType);
  
            // Change font size of .apo-title inside shippingType
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
  });

    try {
        const container = document.getElementById('dynamic-product-content');
        document.addEventListener('DOMContentLoaded', (event) => {
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
                toolTip.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const parentWithHandle = element.closest('[class^="handle-"]');
                    modalWrapper.style.display = 'flex';
                    container.innerHTML = '';
                    const handleClass = Array.from(parentWithHandle.classList).find((cls) => cls.startsWith('handle-'));
                    let productHandle;
                    if (handleClass) {
                    productHandle = handleClass.split('-')[1];
                    }
                    fetch(`/products/${productHandle}`)
                    .then((response) => response.text())
                    .then((data) => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = data;
                        const mainContent = tempDiv.querySelector('#MainContent');
                        if (mainContent) {
                        container.innerHTML =
                        mainContent.innerHTML + `<span class="modal-close">{% render 'icon-close-small' %}</span>`;
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
                        } else {
                        console.error('MainContent not found in the fetched HTML.');
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                        document.getElementById('dynamic-product-content').innerHTML = 'Failed to load product content.';
                    });
                });
                }
            });
    }, 100)

      const modalWrapper = document.querySelector('.modal-wrapper');
      const modalContent = document.querySelector('#dynamic-product-content');
  
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
            document.querySelector('.paylater-container').style.display = 'flex';
            var productPrice = '{{product.price}}';
            const priceInDollars = (productPrice / 100);
            if (priceInDollars > 499) {
              const monthlyPrice = PayTomorrow.getMonthlyPayment(priceInDollars, 48);
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
            clearInterval(ptIntervalTrigger)
          }
        }, 500)
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
        
        const benchOptionClassHandle = '.handle-780';
        setupOptionHandler(benchOptionClassHandle);

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

  function setupOptionHandler(optionClassHandle) {
    const optionContainer = document.querySelector(optionClassHandle);
    if (!optionContainer) {
        console.error(`Element with class handle "${optionClassHandle}" not found.`);
        return;
    }

    const optionLabel = optionContainer.querySelector('.ap-label-tooltip');
    if (!optionLabel) {
        console.error(`Label with class ".ap-label-tooltip" not found in "${optionClassHandle}".`);
        return;
    }

    const selectedOptionsContainer = document.createElement('div');
    selectedOptionsContainer.classList.add('selected_options_container');
    optionLabel.append(selectedOptionsContainer);

    optionContainer.querySelectorAll('.avp-productoptionswatchwrapper').forEach(wrapper => {
        wrapper.addEventListener('click', event => {
            const input = wrapper.querySelector('input[type="checkbox"]');
            const inputTextValue = input.value;
            const inputMoneyValue = input.parentElement.querySelector('.swatch-variant-title .money').innerText.replace('(', '').replace(')', '').replace('+', '');

            const selectedOptionHTML = `
                <div class="option_selected-container">
                    <p class="option_selected">${inputTextValue}</p>
                    <span class="option_selected-price">${inputMoneyValue}</span>
                    <svg class="remove-icon" data-value="${inputTextValue}" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.5771 3.57613C3.81142 3.34181 4.19132 3.34181 4.42563 3.57613L8.00137 7.15186L11.5771 3.57613C11.8114 3.34181 12.1913 3.34181 12.4256 3.57613C12.6599 3.81044 12.6599 4.19034 12.4256 4.42465L8.8499 8.00039L12.4256 11.5761C12.6599 11.8104 12.6599 12.1903 12.4256 12.4247C12.1913 12.659 11.8114 12.659 11.5771 12.4247L8.00137 8.84892L4.42563 12.4247C4.19132 12.659 3.81142 12.659 3.5771 12.4247C3.34279 12.1903 3.34279 11.8104 3.5771 11.5761L7.15284 8.00039L3.5771 4.42465C3.34279 4.19034 3.34279 3.81044 3.5771 3.57613Z" fill="black"/>
                    </svg>
                </div>
            `;

            if (input.checked) {
                if (!selectedOptionsContainer.querySelector(`[data-value="${inputTextValue}"]`)) {
                    selectedOptionsContainer.innerHTML += selectedOptionHTML;
                }

                Array.from(selectedOptionsContainer.children).forEach(option => {
                    option.style.display = 'flex';
                });

                wrapper.setAttribute("style", "border: 1px solid #F1592A !important;");
                
                document.querySelector(optionClassHandle).querySelectorAll('.remove-icon').forEach(icon => {
                    icon.addEventListener('click', event => {
                        event.stopPropagation(); 
                        const optionContainer = event.target.closest('.option_selected-container');
                        if (optionContainer) {
                            const value = icon.getAttribute('data-value');

                            const relatedInput = Array.from(document.querySelector(optionClassHandle).querySelectorAll('input[type="checkbox"]')).find(
                                input => input.value === value
                            );
                            if (relatedInput) {
                                relatedInput.checked = false;
                                relatedInput.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    });
                })

            } else {
                const optionToRemove = selectedOptionsContainer.querySelector(`[data-value="${inputTextValue}"]`);
                if (optionToRemove) {
                    optionToRemove.closest('.option_selected-container').remove();
                }
                
                wrapper.setAttribute("style", "border: 1px solid #E5E5E5 !important;");
            }
        });
    });

    optionContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', event => {
            const wrapper = input.closest('.avp-productoptionswatchwrapper');
            if (!input.checked) {
                const optionToRemove = selectedOptionsContainer.querySelector(`[data-value="${input.value}"]`);
                if (optionToRemove) {
                    optionToRemove.closest('.option_selected-container').remove();
                }
                wrapper.setAttribute("style", "border: 1px solid #E5E5E5 !important;");
            }
        });
    });
      
      function updatePopupDetails(button) {
        const card = button.closest('.popup-card');
        
        const title = card.dataset.title;
        const description = card.dataset.description;
        const price = card.dataset.price;
        const code = card.dataset.code;
        const features = JSON.parse(card.dataset.features);
      
        const detailSection = document.querySelector('.popup-modal-details');
      
        detailSection.querySelector('.popup-detail-title').textContent = title;
        detailSection.querySelector('.popup-detail-description').textContent = description;
        detailSection.querySelector('.popup-detail-code').textContent = `Product Code: ${code}`;
        detailSection.querySelector('.popup-detail-price').textContent = `Price: ${price}`;
      
        const featuresList = detailSection.querySelector('.popup-detail-features');
        featuresList.innerHTML = ''; 
        features.forEach(feature => {
          const li = document.createElement('li');
          li.textContent = feature;
          featuresList.appendChild(li);
        });
      }
}