document.addEventListener('DOMContentLoaded', function () {
	const subscriptionForms = document.querySelectorAll('.homepage-subscription__form');

	subscriptionForms.forEach(function (subscriptionForm) {
		setupSubscriptionForm(subscriptionForm);
	});
});

function setupSubscriptionForm(subscriptionForm) {
	const sectionRoot = subscriptionForm.closest('.shopify-section') || document;
	const hiddenFormContainer = sectionRoot.querySelector('.homepage-subscription__original-form');
	const thankWrapper = sectionRoot.querySelector('.homepage-subscription__message');
	const sectionWrapper = sectionRoot.querySelector('.homepage-subscription__wrapper');
	const emailInput = subscriptionForm.querySelector('input[type="email"]');
	const errorMessage = subscriptionForm.querySelector('.error-message');
	const submitButtonVisible = subscriptionForm.querySelector('button[type="submit"]');
	const expectedKlaviyoFormId = 'Ud8shK';
	let pendingEmail = '';
	let confirmationTimer = null;

	if (!hiddenFormContainer || !thankWrapper || !sectionWrapper || !emailInput || !errorMessage || !submitButtonVisible) {
		return;
	}

	function getKlaviyoForm() {
		return hiddenFormContainer.querySelector('form') ||
			document.querySelector('.klaviyo-form-' + expectedKlaviyoFormId + ' form');
	}

	function setSubmitting(isSubmitting) {
		subscriptionForm.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
		submitButtonVisible.disabled = isSubmitting;
	}

	function resetPendingSubmission() {
		pendingEmail = '';
		setSubmitting(false);
		if (confirmationTimer) {
			window.clearTimeout(confirmationTimer);
			confirmationTimer = null;
		}
	}

	function showConfirmedSuccess() {
		resetPendingSubmission();
		sectionWrapper.style.display = 'none';
		thankWrapper.style.display = 'block';
		thankWrapper.focus({ preventScroll: true });
	}

	function handleKlaviyoFormEvent(event) {
		if (!pendingEmail || !event.detail || event.detail.type !== 'submit') {
			return;
		}

		if (event.detail.formId !== expectedKlaviyoFormId) {
			return;
		}

		const metadata = event.detail.metaData || {};
		const confirmedEmail = String(metadata.email || metadata.$email || '').trim().toLowerCase();

		if (confirmedEmail && confirmedEmail !== pendingEmail.toLowerCase()) {
			return;
		}

		showConfirmedSuccess();
	}

	window.addEventListener('klaviyoForms', handleKlaviyoFormEvent);

	emailInput.addEventListener('input', function () {
		if (emailInput.validity.valid && validateEmail(emailInput.value.trim())) {
			clearEmailError(emailInput, errorMessage);
		}
	});

	subscriptionForm.addEventListener('submit', function (e) {
		e.preventDefault();

		const email = emailInput.value.trim();

		if (!emailInput.validity.valid || !validateEmail(email)) {
			setEmailError(emailInput, errorMessage, 'Please enter a valid email address.');
			emailInput.focus();
			return;
		}

		const hiddenForm = getKlaviyoForm();
		const hiddenEmailInput = hiddenForm && hiddenForm.querySelector('input[type="email"]');
		const hiddenSubmitButton = hiddenForm && hiddenForm.querySelector('button[type="submit"], button');

		if (!hiddenForm || !hiddenEmailInput || !hiddenSubmitButton) {
			setEmailError(
				emailInput,
				errorMessage,
				'Subscription service is still loading. Please try again in a moment.'
			);
			emailInput.focus();
			return;
		}

		clearEmailError(emailInput, errorMessage);
		pendingEmail = email;
		setSubmitting(true);

		hiddenEmailInput.value = email;
		hiddenEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
		hiddenEmailInput.dispatchEvent(new Event('change', { bubbles: true }));

		hiddenSubmitButton.click();

		confirmationTimer = window.setTimeout(function () {
			if (!pendingEmail) {
				return;
			}

			resetPendingSubmission();
			setEmailError(
				emailInput,
				errorMessage,
				'We could not confirm your subscription. Please try again.'
			);
			emailInput.focus();
		}, 10000);
	});
}

/**
 * Validates the email address.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email is valid, otherwise false.
 */
function validateEmail(email) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

function setEmailError(inputElement, errorElement, message) {
	inputElement.classList.add('error');
	inputElement.setAttribute('aria-invalid', 'true');
	errorElement.textContent = message;
	errorElement.hidden = false;
}

function clearEmailError(inputElement, errorElement) {
	inputElement.classList.remove('error');
	inputElement.setAttribute('aria-invalid', 'false');
	errorElement.textContent = '';
	errorElement.hidden = true;
}
