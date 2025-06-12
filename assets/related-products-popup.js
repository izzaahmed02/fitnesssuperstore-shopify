document.addEventListener('DOMContentLoaded', function () {
	// Initialize related products popup functionality
	initRelatedProductsPopup();
});

/**
 * Initialize related products popup functionality
 * - Moves all popups to the end of the body element
 * - Sets up event delegation for all popup interactions
 */
function initRelatedProductsPopup() {
	// Use event delegation for all click events
	document.addEventListener('click', function (event) {
		const target = event.target;
		event.stopPropagation();
		// Handle question mark icon clicks (popup open)
		if (target.closest('.button--popup')) {
			handlePopupOpen(event);
		}
		// Handle product card or "Read more" button clicks
		else if (target.closest('.rp-card') || target.classList.contains('rp-card__btn')) {
			handleCardSelection(event);
		}
		// Handle close button clicks
		else if (target.closest('.rp-modal__close-btn')) {
			handlePopupClose(event);
		}
		// Handle clicks on modal background (close when clicking outside content)
		else if (target.classList.contains('rp-modal') && target.classList.contains('show')) {
			closePopup(target);
		}
	});
}

/**
 * Handle opening a popup when clicking on a question mark icon
 * @param {Event} event - The click event
 */
function handlePopupOpen(event) {
	event.preventDefault();
	event.stopPropagation(); // Prevent triggering the accordion

	const button = event.target.closest('.button--popup');
	const productId = button.getAttribute('data-product-id');

	if (!productId) return;

	const popup = document.getElementById(`related-products-popup-${productId}`);
	if (popup) {
		document.body.style.overflow = 'hidden';
		popup.classList.add('show');
	}
}

/**
 * Handle selecting a product card or clicking "Read more"
 * @param {Event} event - The click event
 */
function handleCardSelection(event) {
	const isReadMoreBtn = event.target.classList.contains('rp-card__btn');
	// If clicked on read more button, prevent propagation
	if (isReadMoreBtn) {
		event.stopPropagation();
	}

	// Get the card element
	const targetCard = isReadMoreBtn ? event.target.closest('.rp-card') : event.target.closest('.rp-card');
	if (!targetCard) return;

	// Get the product ID from the card
	const productId = targetCard.getAttribute('data-product-id');
	if (!productId) return;

	// Get the popup and cards container
	const popup = targetCard.closest('.rp-modal');
	const cardsContainer = targetCard.closest('.rp-modal__cards');

	// Update active card
	const allCards = cardsContainer.querySelectorAll('.rp-card');
	allCards.forEach(card => card.classList.remove('active'));
	targetCard.classList.add('active');

	// Get the main product ID from the popup ID
	const mainProductId = popup.id.replace('related-products-popup-', '');

	// Get and update the details container
	updateProductDetails(mainProductId, productId);
}

/**
 * Update the product details section
 * @param {string} mainProductId - The ID of the main product
 * @param {string} selectedProductId - The ID of the selected related product
 */
function updateProductDetails(mainProductId, selectedProductId) {
	const detailsContainer = document.getElementById(`related-product-details-${mainProductId}`);
	if (!detailsContainer) return;

	// Hide all detail items
	const allDetailItems = detailsContainer.querySelectorAll('.rp-detail-item');
	allDetailItems.forEach(item => item.classList.remove('active'));

	// Show the detail item for the selected product
	const selectedDetailItem = detailsContainer.querySelector(`.rp-detail-item[data-product-id="${selectedProductId}"]`);
	if (selectedDetailItem) {
		selectedDetailItem.classList.add('active');
	}

	// Show the details container if it's hidden
	detailsContainer.style.display = 'block';
}

/**
 * Handle closing a popup when clicking the close button
 * @param {Event} event - The click event
 */
function handlePopupClose(event) {
	const popup = event.target.closest('.rp-modal');
	if (popup) {
		closePopup(popup);
	}
}

/**
 * Close a popup modal
 * @param {HTMLElement} popup - The popup element to close
 */
function closePopup(popup) {
	document.body.style.overflow = '';
	popup.classList.remove('show');
}
