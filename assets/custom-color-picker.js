document.addEventListener('DOMContentLoaded', function() {
    var avisOptionsPolling = setInterval(() => {
        if (!document.querySelector('.avpoptions-container__v2'))
            return;

        clearInterval(avisOptionsPolling);

        const groupColorContainer = document.querySelectorAll('.group-color-container');

        //hack.. for some reason avis option need to be initialize by clicking on them first otherwise it will fire on 2nd click event
        const paintColorElement = document.querySelector('input[name="Paint Color"]');
        const vinylColorElement = document.querySelector('input[name="Vinyl Color"]')

        paintColorElement?.click();
        vinylColorElement?.click();
 
        const paintColorAvisEl = Array.from(
            document.querySelectorAll('.ap-options__swatch-container .apo-title')
          ).find(el => el.textContent.trim() === 'Paint Color');
          
          const vinylColorAvisEl = Array.from(
            document.querySelectorAll('.ap-options__swatch-container .apo-title')
          ).find(el => el.textContent.trim() === 'Vinyl Color');
          
          const customPaintColor = Array.from(
            document.querySelectorAll('.group-color .apo-title')
          ).find(el => el.textContent.trim() === 'Paint Color');
          
          const customVinylColor = Array.from(
            document.querySelectorAll('.group-color .apo-title')
          ).find(el => el.textContent.trim() === 'Vinyl Color');
          
          function applyHandleClass(sourceEl, targetEl) {
            if (!sourceEl || !targetEl) {
                targetEl.querySelector('svg').style.display = 'none';
                return
            };
          
            let parent = sourceEl;
            while (parent && ![...parent.classList].some(cls => cls.startsWith('handle-'))) {
              parent = parent.parentElement;
            }
          
            if (parent) {
              const handleClass = parent.className
                .split(/\s+/)
                .find(cls => cls.startsWith('handle-'));
          
              if (handleClass) {
                targetEl.classList.add(handleClass);
                setTimeout(setupOptionsPopup);
              } 
            } else {
                targetEl.querySelector('.paint-color-popup-icon').style.display = 'none';
            }
          }
          
          applyHandleClass(paintColorAvisEl, customPaintColor);
          applyHandleClass(vinylColorAvisEl, customVinylColor);
          

        if (groupColorContainer) {
            groupColorContainer.forEach((colorGroupElement, colorGroupElementIndex) => {
                const groupColorName = colorGroupElement.getAttribute('data-group-color-name');
                if (groupColorName == "Paint") {
                    if (!paintColorElement && !window.product.tags.includes('has_custom_paint')) {
                        colorGroupElement.classList.add('hidden');
                    }
                }
                else if (groupColorName == "Vinyl") {
                    if (!vinylColorElement && !window.product.tags.includes('has_custom_vinyl')) {
                        colorGroupElement.classList.add('hidden');
                    }
                }
                if (groupColorName) {
                    const selectedColorElement = colorGroupElement.querySelector('.option_selected');
                    const selectedColorPriceElement = colorGroupElement.querySelector('.option_selected-price');
                    const selectedColorInfo = colorGroupElement.querySelector('.option_selected-container');
                    const closeSelectedInfoBtn = colorGroupElement.querySelector('svg:not(.paint-color-popup-icon)');
                    const colorOptionsContainer = colorGroupElement.querySelector('.color-options-container');
                    const apoColors = document.querySelectorAll(`.ap-options__swatch-container input[field-name="${groupColorName} Color"]`);
                    const swatchContainer = colorGroupElement.querySelector('.color-options');

                    if (paintColorElement || window.product.tags.includes('has_custom_paint') || vinylColorElement || window.product.tags.includes('has_custom_vinyl')) {
                        document.querySelector('.custom-color-group').style.display = 'block';
                    }

                    apoColors?.forEach((color, colorIndex) => {
                        if (color.value && (!color.value.includes('Other') && !color.value.includes('Custom'))) {
                            const isDisabled = color.getAttribute('disabled') === 'disabled';
                            const apoTitle = color.parentElement.querySelector('.swatch-variant-title');
                            const apoMoneyValue = apoTitle.querySelector('.money');
                            let swatchDiv = document.createElement("div");
                            swatchDiv.dataset.colorPrice = apoMoneyValue?.textContent ?? "";
                            swatchDiv.dataset.colorName = color.value;
                            if (isDisabled) {
                                swatchDiv.dataset.toolTip = `${color.value} (unavailable or sold-out)`;
                                swatchDiv.style.opacity = 0.6;
                                swatchDiv.classList.add('unavailable');
                            } else {
                                swatchDiv.dataset.toolTip = `${color.value} ${swatchDiv.dataset.colorPrice}`;
                            }
                            swatchDiv.dataset.title = color.value;
                            swatchDiv.classList.add('swatch');
                            swatchDiv.style.background = buildGradient(color.value);
                            colorOptionsContainer?.append(swatchDiv);
                        }
                    });

                    const colorSwatches = colorGroupElement.querySelectorAll('.color_options_container .swatch:not(.swatch--custom-trigger)');
                    let currentSwatchIndex;
                    let currentColorName;

                    const customColorInputContainer = colorGroupElement.querySelector('.custom-color-input');
                    const customColorInput = colorGroupElement.querySelector('.custom-color-value');
                    const customColorErrorMessage = colorGroupElement.querySelector('.custom-color-error_message');
                    const customColorEmptyErrorMessage = colorGroupElement.querySelector('.custom-color-empty-error_message');
                    const customColorTrigger = colorGroupElement.querySelector('.custom-color-trigger');
                    const customColorCloseIcon = colorGroupElement.querySelector('.custom-color-input-header svg');
                    const customColorAddButton = colorGroupElement.querySelector('.add-custom-color');

                    colorSwatches?.forEach((swatch) => {
                        const colorName = swatch.getAttribute('data-color-name');
                        swatch.addEventListener('click', (event) => {
                            if (event.target.classList.contains('unavailable')) {
                                return;
                            }
                            if (!window.product.available) {
                                return;
                            }
                            if (colorName) {
                                if (selectedColorElement) {
                                    selectedColorElement.textContent = `Color: ${colorName}`;
                                    currentSwatchIndex = [...colorSwatches].indexOf(swatch);
                                    currentColorName = colorName;
                                    let selectedParentGroupContainer;
                                    const selectedGroup = Array.from(document.querySelectorAll('.ap-options__swatch-container .apo-title'))
                                    .find(el => el.textContent.trim() === `${groupColorName} Color`);
                                    if (selectedGroup) {
                                        selectedParentGroupContainer = selectedGroup.closest('.ap-options__swatch-container');
                                    }
                                    if (selectedParentGroupContainer) {
                                        const apoOptionColorSelected = Array.from(selectedParentGroupContainer.querySelectorAll('.option_selected')).find(div => div.textContent === colorName);
                                        if (!apoOptionColorSelected) {
                                            apoColors[currentSwatchIndex]?.parentElement.click();
                                        }
                                    }
                                    customColorInputContainer.style.display = 'none';

                                    const customColorAvis = document.querySelector(`.custom-color-${toLowerCaseFirstLetter(groupColorName)}-avis input`);

                                    if (customColorAvis) {
                                        customColorAvis.value = '';
                                        triggerInputChange(customColorAvis);
                                    }
                                }

                                const colorPrice = event.target.dataset.colorPrice;

                                if (selectedColorPriceElement) {
                                    selectedColorPriceElement.textContent = colorPrice ? colorPrice :  "$0";
                                }

                                if (selectedColorInfo) {
                                    selectedColorInfo.style.display = 'flex';
                                }

                                colorSwatches.forEach((x) => x.classList.remove('color-selected'));
                                swatch.classList.add('color-selected');
                            }
                        })
                    });

                    closeSelectedInfoBtn.addEventListener('click', (event) => {
                        selectedColorInfo.style.display = 'none';
                        const apoOptionColorSelected = Array.from(document.querySelectorAll('.ap-options__swatch-container .option_selected')).find(div => div.textContent.trim().includes(currentColorName));
                        if (apoOptionColorSelected) {
                            apoColors[currentSwatchIndex].parentElement?.click();
                        }

                        colorSwatches.forEach((x) => x.classList.remove('color-selected'));

                        const customColorAvis = document.querySelector(`.custom-color-${toLowerCaseFirstLetter(groupColorName)}-avis input`);

                        if (customColorAvis) {
                            customColorAvis.value = '';
                            triggerInputChange(customColorAvis);
                        }
                    });

                    // Show the input field when "+" is clicked
                    customColorTrigger?.addEventListener('click', () => {
                        if (!window.product.available) {
                            return;
                        }
                        var customColorAvisCharge = document.querySelector(`.custom-color-${toLowerCaseFirstLetter(groupColorName)}-avis .apo-title-addcharge`)?.textContent;

                        if (customColorAvisCharge) {
                            const wrapper = colorGroupElement.querySelector('.custom-color-wrapper');
                            wrapper.style.setProperty('--custom-content', `"${customColorAvisCharge}"`);
                        }

                        customColorInputContainer.style.display = 'block';
                        customColorErrorMessage.style.display = 'none';
                        customColorAddButton.classList.remove('disabled');
                    });

                    // Close the input popup when clicking on the close icon
                    customColorCloseIcon?.addEventListener('click', () => {
                        customColorInputContainer.style.display = 'none';
                        customColorInput.value = '';
                        customColorErrorMessage.style.display = 'none';
                        customColorAddButton.classList.remove('disabled');
                    });

                    customColorAddButton?.addEventListener('click', (event) => {
                        setTimeout(() => {
                            const group = event.target.dataset.group;
                            const color = customColorInput?.value?.trim();
                            // Validate the hex color
                            // if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {


                            // } else {
                            //     customColorErrorMessage.style.display = 'flex';
                            //     customColorAddButton.classList.add('disabled');
                            // }

                            const matchedColor = availableColors.find((c) => c.HEX.toLowerCase() === color.toLowerCase());
                            // if (matchedColor) {

                            // } else {
                            //     customColorErrorMessage.style.display = 'flex';
                            //     customColorAddButton.classList.add('disabled');
                            //     return;
                            // }
                            var customColorAvisCharge = document.querySelector(`.custom-color-${group}-avis .apo-title-addcharge`)?.textContent;

                            const customColorAvis = document.querySelector(`.custom-color-${group}-avis input`);

                            if (customColorAvis) {
                                if (matchedColor) {
                                    customColorAvis.value = `${matchedColor.name} (Pantone: ${matchedColor.Pantone} / ${matchedColor.HEX}) [Add ${customColorAvisCharge.replace('(', '').replace(')', '')}]`
                                } else {
                                    if (color) {
                                        customColorAvis.value = `${color.trim()} [Add ${customColorAvisCharge.replace('(', '').replace(')', '')}]`
                                        customColorEmptyErrorMessage.style.display = 'none';
                                    } else {
                                        customColorEmptyErrorMessage.style.display = 'block';
                                        return;
                                    }
                                }
                                
                                const apoColors = document.querySelectorAll(`.ap-options__swatch-container input[field-name="${groupColorName} Color"]`);

                                apoColors.forEach((apoColor, index) => {
                                    if (apoColor.checked) {
                                        apoColors[index]?.parentElement.click();
                                    }
                                });

                                triggerInputChange(customColorAvis);
                                //$('.product-form__input--swatch label[title="Custom"]').click();
                            }

                            // Display Pantone value
                            if (matchedColor) {
                                selectedColorElement.textContent = `Custom Color: ${matchedColor.name} (Pantone: ${matchedColor.Pantone} / ${matchedColor.HEX})`;
                            } else {
                                if (color) {
                                    selectedColorElement.textContent = color.trim();
                                }
                            }
                            selectedColorPriceElement.textContent = customColorAvisCharge;

                            const updatedProductSwatches = colorGroupElement.querySelectorAll('.color-options-container input[type=radio]');
                            updatedProductSwatches.forEach((input) => (input.checked = false));

                            customColorErrorMessage.style.display = 'none';
                            customColorAddButton.classList.remove('disabled');
                            selectedColorInfo.style.display = 'flex';

                            const apoOptionColorSelected = Array.from(document.querySelectorAll('.ap-options__swatch-container .option_selected')).find(div => div.textContent.trim().includes(currentColorName));
                            if (apoOptionColorSelected) {
                                document.querySelectorAll(`input[field-name="${toUpperCaseFirstLetter(group)} Color"]`)[currentSwatchIndex].parentElement?.click();
                            }

                            colorSwatches.forEach((x) => x.classList.remove('color-selected'));

                            // // Create the custom swatch
                            // const customSwatch = document.createElement('div');

                            // const customSwatchesOnPage = colorGroupElement.querySelectorAll('.swatch--custom');
                            // customSwatchesOnPage.forEach((swatch) => swatch.classList.remove('selected'));

                            // const updatedProductSwatches = colorGroupElement.querySelectorAll('.color-options-container input[type=radio]');
                            // updatedProductSwatches.forEach((input) => (input.checked = false));

                            // customSwatch.classList.add('swatch', 'swatch--custom', 'selected');
                            // customSwatch.style.backgroundColor = color;
                            // customSwatch.title = matchedColor ?
                            //     `Custom color: ${matchedColor.name} (Pantone: ${matchedColor.Pantone} / ${matchedColor.HEX})` :
                            //     `Custom Color: ${color}`;

                            // // Add radio input for variant logic
                            // customSwatch.innerHTML = `<input type="radio" class="custom-color-swatch-${color}" name="custom-color" value="${color}">
                            //          <label for="custom-color-swatch-${color}">
                            //              <span class="swatch-label" style="background: ${color};"></span>
                            //          </label>`;

                            // // Ensure swatch is selectable
                            // customSwatch.addEventListener('click', () => {
                            //     colorGroupElement.querySelectorAll('.swatch--custom').forEach((swatch) => swatch.classList.remove('selected'));
                            //     customSwatch.classList.add('selected');

                            //     const updatedProductSwatches = colorGroupElement.querySelectorAll('.color-options-container input');
                            //     updatedProductSwatches.forEach((input) => (input.checked = false));

                            //     if (matchedColor) {
                            //         selectedColorElement.textContent = `Custom color: ${matchedColor.name} (Pantone: ${matchedColor.Pantone} / ${matchedColor.HEX})`;
                            //         selectedColorPriceElement.textContent = customColorAvisCharge;
                            //         selectedColorInfo.style.display = 'flex';
                            //     }
                            // });

                            // swatchContainer.appendChild(customSwatch);                               

                            // // Reset input and hide container
                            // customColorInput.value = '';
                            // customColorInputContainer.style.display = 'none';
                            // customColorErrorMessage.style.display = 'none';
                            // customColorAddButton.classList.remove('disabled');
                        })
                    });

                    colorGroupElement.querySelector('.group-color').addEventListener('click', (event) => {
                        if (event.target.classList.contains('multi-color') || event.target.classList.contains('apo-title') && event.target.parentElement.classList.contains('multi-color')) {
                            event.target.classList.toggle('open');
                            colorGroupElement.querySelector('.custom-color-group .color_options_container').classList.toggle('show');
                        }
                    });
                }
            });
            

            const visibleGroupColorContainer = Array.from(groupColorContainer).filter(group => {
                return group.offsetParent !== null; 
            });

            if (visibleGroupColorContainer.length < 2 && visibleGroupColorContainer.length > 0) {
                document.querySelector('.custom-color-group .options_heading').remove();
                visibleGroupColorContainer[0].classList.add('single-color');
                visibleGroupColorContainer[0].querySelector('.group-color span').classList.add("options_heading", "options-title");
                const colorOptionsContainer = document.querySelector('.custom-color-group .color_options_container');
                if (colorOptionsContainer) {
                    colorOptionsContainer.style.marginTop = 0;
                    colorOptionsContainer.classList.add('show');
                }
            } else {
                visibleGroupColorContainer.forEach(x => x.querySelector('.group-color').classList.add('multi-color'));
            }
     
            const visibleContainers = visibleGroupColorContainer.filter(el => !el.classList.contains('hidden'));
            if (visibleContainers.length) {
               visibleContainers[visibleContainers.length - 1].classList.add('last-visible');
            }
        }

    }, 300);

    const availableColors = [{
            name: 'Chocolate Brown',
            Pantone: '476C',
            HEX: '#4E3629',
        },
        {
            name: 'Wine Red',
            Pantone: '7428C',
            HEX: '#6A2C3E',
        },
        {
            name: 'Red Rock',
            Pantone: '7622C',
            HEX: '#93272C',
        },
        {
            name: 'Textured Red',
            Pantone: '7621C',
            HEX: '#AB2328',
        },
        {
            name: 'Mars Red',
            Pantone: '485C',
            HEX: '#DA291C',
        },
        {
            name: 'Organic Orange',
            Pantone: '166C',
            HEX: '#E35205',
        },
        {
            name: 'Evergreen',
            Pantone: '343C',
            HEX: '#115740',
        },
        {
            name: 'Mint Green',
            Pantone: '341C',
            HEX: '#007A53',
        },
        {
            name: 'Ruch Green',
            Pantone: '362C',
            HEX: '#509E2F',
        },
        {
            name: 'Buttercup',
            Pantone: '122C',
            HEX: '#FED141',
        },
        {
            name: 'Signal Yellow',
            Pantone: '130C',
            HEX: '#F2A900',
        },
        {
            name: 'Burnt Orange',
            Pantone: '152C',
            HEX: '#E57200',
        },
        {
            name: 'Reseda Green',
            Pantone: '5763C',
            HEX: '#737B4C',
        },
        {
            name: 'Coffee Brown',
            Pantone: '139C',
            HEX: '#AF6D04',
        },
        {
            name: 'Sun Gold',
            Pantone: '871C',
            HEX: '#84754E',
        },
        {
            name: 'Olympia White',
            Pantone: 'No Pantone match',
            HEX: '#F1EEE6',
        },
        {
            name: 'Storm Grey',
            Pantone: 'Cool Gray 5C',
            HEX: '#B1B3B3',
        },
        {
            name: 'Platinum Sparkle',
            Pantone: '166C',
            HEX: '#8A8D8F',
        },
        {
            name: 'Jet Black',
            Pantone: 'Process Black C',
            HEX: '#2D2926',
        },
        {
            name: 'Textured Black',
            Pantone: 'Process Black C',
            HEX: '#1D1D1D',
        },
        {
            name: 'Silver Vein',
            Pantone: 'No Pantone match',
            HEX: '#71706E',
        },
        {
            name: 'Slate Grey',
            Pantone: 'Cool Grey 11C',
            HEX: '#53565A',
        },
        {
            name: 'Ebony Chrome',
            Pantone: 'Cool Grey 10C C22',
            HEX: '#63666A',
        },
        {
            name: 'Stone Grey',
            Pantone: '152C',
            HEX: '#A69F88',
        },
        {
            name: 'Post Office Blue',
            Pantone: '540C',
            HEX: '#003057',
        },
        {
            name: 'Patriot Blue',
            Pantone: '301C',
            HEX: '#004B87',
        },
        {
            name: 'Light Blue',
            Pantone: '7461C',
            HEX: '#007DBA',
        },
        {
            name: 'Purple Wave',
            Pantone: '268C',
            HEX: '#582C83',
        },
        {
            name: 'Lilac',
            Pantone: '667C',
            HEX: '#7C6992',
        },
        {
            name: 'Pink',
            Pantone: '166C',
            HEX: '#E35205',
        },
    ];

    const colorMap = {
        black: "#000000",
        white: "#FFFFFF",
        red: "#660F0A",
        green: "#008000",
        blue: "#3E77AA",
        yellow: "#EEB241",
        cyan: "#00FFFF",
        magenta: "#FF00FF",
        gray: "#808080",
        silver: "#E5E5E5",
        orange: "#FFA500",
        purple: "#800080",
        pink: "#FFC0CB",
        lime: "#00FF00",
        navy: "#000080",
        teal: "#008080",
        maroon: "#800000",
        burgundy: "#800020"
    };

    function getHexFromName(name) {
        const normalized = (name || "").trim().toLowerCase();
        return colorMap[normalized] || "#000000";
    }

    function buildGradient(colorString) {
        colorString = colorString.replace(/\s*\/\s*/g, " / ");

        const parts = colorString.split("/")
            .map(str => str.trim())
            .filter(Boolean);

        if (parts.length === 0) {
            return "linear-gradient(to right, #000000, #000000)";
        }

        if (parts.length === 1) {
            const hex = getHexFromName(parts[0]);
            return `linear-gradient(to right, ${hex}, ${hex})`;
        }

        if (parts.length === 2) {
            const leftColor = getHexFromName(parts[0]);
            const rightColor = getHexFromName(parts[1]);
            return `linear-gradient(to right, ${leftColor} 50%, ${rightColor} 50%)`;
        }

        const hexes = parts.map(getHexFromName);
        const step = 100 / (hexes.length - 1);
        const stops = hexes
            .map((hex, i) => `${hex} ${Math.round(i * step)}%`)
            .join(", ");

        return `linear-gradient(to right, ${stops})`;
    }

    function triggerInputChange(input) {
        input.value += ' ';

        input.dispatchEvent(new Event('input', {
            bubbles: true
        }));
        input.dispatchEvent(new Event('change', {
            bubbles: true
        }));
        input.value = input.value.slice(0, -1);

        input.dispatchEvent(new Event('input', {
            bubbles: true
        }));
        input.dispatchEvent(new Event('change', {
            bubbles: true
        }));
    }

    function toLowerCaseFirstLetter(word) {
        return String(word).charAt(0).toLowerCase() + String(word).slice(1)
    }

    function toUpperCaseFirstLetter(word) {
        return String(word).charAt(0).toUpperCase() + String(word).slice(1) 
    }
});