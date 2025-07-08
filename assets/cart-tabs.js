(function () {
	'use strict';

	class CartTabsManager {
		constructor() {
			this.isInitializing = false;
			this.initTimeout = null;
			this.activeTabIndices = new Map(); // Store active tab indices by container ID
			this.reinitialize();
		}

		reinitialize() {
			if (this.isInitializing) {
				console.log('Already initializing, skipping redundant call');
				return;
			}

			this.isInitializing = true;
			if (this.initTimeout) {
				clearTimeout(this.initTimeout);
			}

			// Store active tab indices before reinitializing
			this.storeActiveTabIndices();

			this.initTimeout = setTimeout(() => {
				this.tabContainers = document.querySelectorAll('.cart-item__custom-options');
				this.scrollLeftButtons = [];
				this.scrollRightButtons = [];
				document.querySelectorAll('.cart-item__custom-options-scroll-button').forEach(button => {
					button.remove();
				});

				this.init();
				this.isInitializing = false;
			}, 100);
		}

		init() {
			if (!this.tabContainers.length) return;

			this.tabContainers.forEach(container => {
				const buttonsContainer = container.querySelector('.cart-item__custom-options-buttons-wrapper');
				const tabButtons = container.querySelectorAll('.cart-item__custom-options-buttons button');
				const tabContents = container.querySelectorAll('.cart-item__custom-options-content');

				if (!buttonsContainer || !tabButtons.length || !tabContents.length) return;
				this.setupScrollButtons(container, buttonsContainer);
				this.initializeTabs(container, tabButtons, tabContents);
				this.attachEventListeners(tabButtons, tabContents);
			});
		}

		setupScrollButtons(container, buttonsContainer) {
			if (buttonsContainer.scrollWidth > buttonsContainer.clientWidth) {
				const scrollLeftButton = document.createElement('button');
				scrollLeftButton.className = 'cart-item__custom-options-scroll-button cart-item__custom-options-scroll-left';
				scrollLeftButton.innerHTML = `
				<svg style="transform: rotate(-180deg)" width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M0.175735 11.8047C-0.0585782 11.5444 -0.0585783 11.1223 0.175735 10.8619L4.55145 5.99999L0.175734 1.13803C-0.0585787 0.877669 -0.0585787 0.455624 0.175734 0.195268C0.410047 -0.0650883 0.789952 -0.0650883 1.02426 0.195268L5.82426 5.52861C6.05858 5.78897 6.05858 6.21101 5.82426 6.47137L1.02427 11.8047C0.789953 12.0651 0.410048 12.0651 0.175735 11.8047Z" fill="black"/>
				</svg>`;
				scrollLeftButton.setAttribute('aria-label', 'Scroll left');
				const scrollRightButton = document.createElement('button');
				scrollRightButton.className = 'cart-item__custom-options-scroll-button cart-item__custom-options-scroll-right';
				scrollRightButton.innerHTML = `
				<svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M0.175735 11.8047C-0.0585782 11.5444 -0.0585783 11.1223 0.175735 10.8619L4.55145 5.99999L0.175734 1.13803C-0.0585787 0.877669 -0.0585787 0.455624 0.175734 0.195268C0.410047 -0.0650883 0.789952 -0.0650883 1.02426 0.195268L5.82426 5.52861C6.05858 5.78897 6.05858 6.21101 5.82426 6.47137L1.02427 11.8047C0.789953 12.0651 0.410048 12.0651 0.175735 11.8047Z" fill="black"/>
				</svg>`;
				scrollRightButton.setAttribute('aria-label', 'Scroll right');


				container.querySelector('.cart-item__custom-options-buttons-container').prepend(scrollLeftButton);
				container.querySelector('.cart-item__custom-options-buttons-container').appendChild(scrollRightButton);
				this.scrollLeftButtons.push(scrollLeftButton);
				this.scrollRightButtons.push(scrollRightButton);


				scrollLeftButton.addEventListener('click', (e) => {
					e.preventDefault();
					const buttons = buttonsContainer.querySelectorAll('.cart-item__custom-options-buttons button');
					if (buttons.length > 0) {
						const buttonWidth = buttons[0].offsetWidth + parseInt(window.getComputedStyle(buttons[0]).marginRight);
						buttonsContainer.scrollBy({left: -buttonWidth, behavior: 'smooth'});
					}
				});

				scrollRightButton.addEventListener('click', (e) => {
					e.preventDefault();
					const buttons = buttonsContainer.querySelectorAll('.cart-item__custom-options-buttons button');
					if (buttons.length > 0) {
						const buttonWidth = buttons[0].offsetWidth + parseInt(window.getComputedStyle(buttons[0]).marginRight);
						buttonsContainer.scrollBy({left: buttonWidth, behavior: 'smooth'});
					}
				});

				buttonsContainer.addEventListener('scroll', () => {
					this.updateScrollButtonVisibility(buttonsContainer, scrollLeftButton, scrollRightButton);
				});
				this.updateScrollButtonVisibility(buttonsContainer, scrollLeftButton, scrollRightButton);
			}
		}

		updateScrollButtonVisibility(container, leftButton, rightButton) {
			leftButton.style.display = container.scrollLeft <= 0 ? 'none' : 'block';
			leftButton.style.pointerEvents = container.scrollLeft <= 0 ? 'none' : 'auto';
			const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
			rightButton.style.display = isAtEnd ? 'none' : 'block';
			rightButton.style.pointerEvents = isAtEnd ? 'none' : 'auto';
		}

		initializeTabs(container, tabButtons, tabContents) {
			// Generate a unique ID for the container
			const containerId = container.dataset.key || container.dataset.uniqueKey || container.id || this.generateContainerId(container);

			// Get the stored active tab index for this container, default to 0 (first tab)
			const activeIndex = this.activeTabIndices.has(containerId) ? this.activeTabIndices.get(containerId) : 0;

			console.log('Initializing tabs for container', containerId, 'with active index', activeIndex, 
				this.activeTabIndices.has(containerId) ? '(from stored state)' : '(default)');

			// Set the active tab
			tabContents.forEach((content, index) => {
				if (index === activeIndex) {
					content.classList.add('active');
					tabButtons[index].classList.add('active');
				} else {
					content.classList.remove('active');
					tabButtons[index].classList.remove('active');
				}
			});
		}

		attachEventListeners(tabButtons, tabContents) {
			tabButtons.forEach((button, index) => {
				button.addEventListener('click', (e) => {
					e.preventDefault();

					// Get the container for this button
					const container = button.closest('.cart-item__custom-options');
					if (container) {
						// Generate a unique ID for the container
						const containerId = container.dataset.key || container.dataset.uniqueKey || container.id || this.generateContainerId(container);

						// Store the active tab index for this container
						this.activeTabIndices.set(containerId, index);
						console.log('Tab clicked: storing active tab index', index, 'for container', containerId);
					}

					// Update the UI
					tabButtons.forEach(btn => btn.classList.remove('active'));
					tabContents.forEach(content => content.classList.remove('active'));
					button.classList.add('active');
					tabContents[index].classList.add('active');
				});
			});
 	}

 	storeActiveTabIndices() {
 		// Find all tab containers
 		const containers = document.querySelectorAll('.cart-item__custom-options');
 		console.log('Storing active tab indices for', containers.length, 'containers');

 		containers.forEach(container => {
 			// Generate a unique ID for the container based on its content or position
 			const containerId = container.dataset.key || container.dataset.uniqueKey || container.id || this.generateContainerId(container);

 			// Find the active tab in this container
 			const activeTabIndex = this.findActiveTabIndex(container);

 			// Store the active tab index for this container
 			if (activeTabIndex !== -1) {
 				this.activeTabIndices.set(containerId, activeTabIndex);
 				console.log('Stored active tab index', activeTabIndex, 'for container', containerId);
 			}
 		});
 	}

 	generateContainerId(container) {
 		// Generate a unique ID based on the container's position in the DOM
 		const parent = container.closest('.cart-item');
 		if (parent) {
 			return parent.dataset.key || parent.dataset.uniqueKey || parent.id || 
 				Array.from(document.querySelectorAll('.cart-item')).indexOf(parent);
 		}
 		return Array.from(document.querySelectorAll('.cart-item__custom-options')).indexOf(container);
 	}

 	findActiveTabIndex(container) {
 		// Find the active tab button in this container
 		const activeButton = container.querySelector('.cart-item__custom-options-buttons button.active');
 		if (activeButton) {
 			// Get all tab buttons in this container
 			const allButtons = Array.from(container.querySelectorAll('.cart-item__custom-options-buttons button'));
 			// Return the index of the active button
 			return allButtons.indexOf(activeButton);
 		}
 		return -1; // No active tab found
 	}
 }

 let cartTabsManager;
	document.addEventListener('DOMContentLoaded', function () {
		cartTabsManager = new CartTabsManager();
		const updateHandler = function (event) {
			console.log('Cart updated from source:', event.detail?.source || 'unknown', 'reinitializing tabs');
			cartTabsManager.reinitialize();
		};

		document.addEventListener('cart:updated', updateHandler);
		document.addEventListener('cart-items:updated', updateHandler);
	});

	window.cartTabsManager = cartTabsManager;
})();
