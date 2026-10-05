document.addEventListener('DOMContentLoaded', function () {
	const subscriptionForms = document.querySelectorAll('.homepage-subscription__form');

	subscriptionForms.forEach(function (subscriptionForm) {
		setupSubscriptionForm(subscriptionForm);
	});
});

function setupSubscriptionForm(subscriptionForm) {
	let attempts = 0;
	const maxAttempts = 10;
	const interval = 1000;
	const sectionRoot = subscriptionForm.closest('.shopify-section') || document;
	const hiddenFormContainer = sectionRoot.querySelector('.homepage-subscription__original-form');
	const thankWrapper = sectionRoot.querySelector('.homepage-subscription__message');
	const sectionWrapper = sectionRoot.querySelector('.homepage-subscription__wrapper');
	const emailInput = subscriptionForm.querySelector('input[type="email"]');
	const errorMessage = subscriptionForm.querySelector('.error-message');

	if (!hiddenFormContainer || !thankWrapper || !sectionWrapper || !emailInput || !errorMessage) {
		return;
	}

	emailInput.addEventListener('invalid', function () {
		setEmailError(emailInput, errorMessage, 'Please enter a valid email address.');
	});

	emailInput.addEventListener('input', function () {
		if (emailInput.validity.valid) {
			clearEmailError(emailInput, errorMessage);
		}
	});

	const intervalId = setInterval(function () {
		const hiddenForm = hiddenFormContainer.querySelector('form');

		if (hiddenForm) {
			clearInterval(intervalId);

			const hiddenEmailInput = hiddenForm.querySelector('input[type="email"]');
			if (!hiddenEmailInput) {
				console.error('Hidden email input not found in the hidden form.');
				return;
			}

			subscriptionForm.addEventListener('submit', function (e) {
				e.preventDefault();

				const email = emailInput.value.trim();

				if (!emailInput.validity.valid || !validateEmail(email)) {
					setEmailError(emailInput, errorMessage, 'Please enter a valid email address.');
					emailInput.focus();
					return;
				}

				clearEmailError(emailInput, errorMessage);

				hiddenEmailInput.value = email;
				hiddenEmailInput.dispatchEvent(new Event('input', { bubbles: true }));

				const submitButton = hiddenForm.querySelector('button');
				if (submitButton) {
					setTimeout(function () {
						submitButton.click();
						sectionWrapper.style.display = 'none';
						thankWrapper.style.display = 'block';
						thankWrapper.focus({ preventScroll: true });

						setTimeout(function () {
							window.location.reload();
						}, 2000);
					}, 50);
				} else {
					console.error('Submit button not found in the hidden form.');
				}
			});
		} else {
			attempts++;
			if (attempts >= maxAttempts) {
				clearInterval(intervalId);
			}
		}
	}, interval);
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
