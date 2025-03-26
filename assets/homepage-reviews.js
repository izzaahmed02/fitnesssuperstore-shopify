document.addEventListener('DOMContentLoaded', function() {
	// Global object to store Swiper instances for review tabs
	window.swipersReviews = {};

	// 1) Initialize tab switching (each tab has its own Swiper slider)
	initReviewsTabs();

	// 2) Initialize text truncation logic for review copy elements
	initTextTruncation('.homepage-reviews__item-copy', 4);

	// 3) Set the correct visibility for slides based on the viewport width
	updateVisibleSlides();

	// 4) Set up a resize listener to destroy/reinitialize Swiper on small screens
	//    and update slide visibility
	window.addEventListener('resize', handleReviewsResize);
});

/**
 * Initializes the reviews tab system where each tab contains its own Swiper instance.
 */
function initReviewsTabs() {
	const tabButtons = document.querySelectorAll('.homepage-reviews__tab-btn');
	const tabPanels = document.querySelectorAll('.homepage-reviews__tab');

	// Exit if no tab buttons or panels are found
	if (!tabButtons.length || !tabPanels.length) return;

	tabButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			// 1) Deactivate all tab buttons and hide all tab panels
			tabButtons.forEach((b) => b.classList.remove('active'));
			tabPanels.forEach((panel) => panel.classList.remove('homepage-reviews__tab-active'));

			// 2) Activate the clicked tab button and its corresponding panel
			btn.classList.add('active');
			const targetTab = btn.dataset.tab;
			const activePanel = document.querySelector(`.homepage-reviews__tab[data-tab="${targetTab}"]`);

			if (activePanel) {
				activePanel.classList.add('homepage-reviews__tab-active');
				// Run text truncation on all review copy elements in this panel
				const textElems = activePanel.querySelectorAll('.homepage-reviews__item-copy');
				textElems.forEach(elem => truncateIfTooManyLines(elem, 4));
			}

			// 3) Update visible slides (hide all except first three if viewport <= 576px)
			updateVisibleSlides();

			// 4) Initialize or update/destroy the Swiper instance based on viewport width
			if (window.innerWidth > 576) {
				// If above 576px, initialize or update the Swiper
				if (!window.swipersReviews[targetTab]) {
					initSwiperForTab(window.swipersReviews, targetTab, activePanel);
				} else {
					window.swipersReviews[targetTab].update();
				}
			} else {
				// If viewport is 576px or less, destroy any existing Swiper instance for this tab
				if (window.swipersReviews[targetTab]) {
					window.swipersReviews[targetTab].destroy(true, true);
					window.swipersReviews[targetTab] = null;
				}
			}
		});
	});

	// Simulate a click on the default (active) tab button or the first one if none is preset
	const defaultTabBtn = document.querySelector('.homepage-reviews__tab-btn.active') || tabButtons[0];
	if (defaultTabBtn) {
		defaultTabBtn.click();
	}
}

/**
 * Helper function to initialize a Swiper instance for a given tab panel.
 * @param {Object} swipersReviews - The global object storing Swiper instances.
 * @param {string} targetTab - The data-tab identifier.
 * @param {HTMLElement} activePanel - The DOM element for the active tab panel.
 */
function initSwiperForTab(swipersReviews, targetTab, activePanel) {
	if (!activePanel) return;
	const swiperContainer = activePanel.querySelector('.swiper');
	if (!swiperContainer) return;

	// Create a new Swiper instance with your desired configuration
	const swiperInstance = new Swiper(swiperContainer, {
		slidesPerView: 'auto',
		spaceBetween: 32,
		observer: true,
		observeParents: true,
		navigation: {
			nextEl: '.homepage-reviews__swiper-controls .swiper-button-next',
			prevEl: '.homepage-reviews__swiper-controls .swiper-button-prev',
		},
		breakpoints: {
			375: {
				spaceBetween: 16,
			},
			992: {
				spaceBetween: 32,
			}
		}
	});

	// Store the instance using the tab identifier as the key
	swipersReviews[targetTab] = swiperInstance;
}

/**
 * Initializes the text truncation logic for elements matching the provided selector.
 * @param {string} selector - The CSS selector to find text elements.
 * @param {number} maxLines - The maximum allowed number of lines (default is 4).
 */
function initTextTruncation(selector, maxLines = 4) {
	const textElems = document.querySelectorAll(selector);
	if (!textElems.length) return;
	textElems.forEach((elem) => {
		truncateIfTooManyLines(elem, maxLines);
	});
}

/**
 * Checks if an element's text spans more lines than allowed.
 * If so, it hides the extra text and sets up a "Read More" / "Read Less" toggle.
 * @param {HTMLElement} element - The text element.
 * @param {number} maxLines - The maximum allowed number of lines.
 */
function truncateIfTooManyLines(element, maxLines) {
	if (!element) return;

	const lineCount = getNumberOfLines(element);
	if (lineCount <= maxLines) return;

	// Add a class to hide extra lines (ensure your CSS uses the 'hide' class appropriately)
	element.classList.add('hide');

	// Find the adjacent toggle button (expected to be the next sibling)
	const btn = element.nextElementSibling;
	if (!btn) return;

	btn.classList.add('active');
	btn.addEventListener('click', function(e) {
		e.preventDefault();
		if (element.classList.contains('hide')) {
			element.classList.remove('hide');
			btn.textContent = 'Read Less';
		} else {
			element.classList.add('hide');
			btn.textContent = 'Read More';
		}
	});
}

/**
 * Approximates and returns the number of lines of text an element occupies.
 * @param {HTMLElement} element - The text element.
 * @return {number} - The approximate number of lines.
 */
function getNumberOfLines(element) {
	const style = window.getComputedStyle(element);
	let lineHeight = parseFloat(style.lineHeight);
	if (isNaN(lineHeight)) {
		// Fallback if lineHeight is 'normal'
		const fontSize = parseFloat(style.fontSize) || 16;
		lineHeight = fontSize * 1.2;
	}
	const elementHeight = element.offsetHeight;
	return Math.round(elementHeight / lineHeight);
}

/**
 * Updates the visibility of slides: if the viewport width is 576px or less,
 * only the first three slides in each tab panel will be shown.
 */
function updateVisibleSlides() {
	const tabPanels = document.querySelectorAll('.homepage-reviews__tab');
	tabPanels.forEach(panel => {
		const slides = panel.querySelectorAll('.swiper-slide');
		slides.forEach((slide, index) => {
			if (window.innerWidth <= 576) {
				// Only display the first three slides
				slide.style.display = index < 3 ? '' : 'none';
			} else {
				// On larger screens, show all slides
				slide.style.display = '';
			}
		});
	});
}

/**
 * Handles window resize events by destroying all review Swiper instances
 * when the viewport is 576px or less and updating slide visibility.
 * If resized back to larger screens, the active tab's Swiper is reinitialized.
 */
function handleReviewsResize() {
	if (window.innerWidth <= 576) {
		// Destroy all existing Swiper instances on small screens
		Object.keys(window.swipersReviews).forEach((key) => {
			const swiper = window.swipersReviews[key];
			if (swiper) {
				swiper.destroy(true, true);
				window.swipersReviews[key] = null;
			}
		});
	} else {
		// If resized to larger screens, reinitialize the active tab's Swiper
		const activeTabBtn = document.querySelector('.homepage-reviews__tab-btn.active');
		if (activeTabBtn) {
			activeTabBtn.click();
		}
	}
	// Update slide visibility based on the current viewport size
	updateVisibleSlides();
}
