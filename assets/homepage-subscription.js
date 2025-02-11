document.addEventListener('DOMContentLoaded', function () {
	let attempts = 0;
	const maxAttempts = 10;
	const interval = 1000; // Interval in milliseconds

	const intervalId = setInterval(function () {
		const subscriptionForm = document.querySelector('.homepage-subscription__form');
		const hiddenFormContainer = document.querySelector('.homepage-subscription__original-form');
		const thankWrapper = document.querySelector('.homepage-subscription__message');
		const sectionWrapper = document.querySelector('.homepage-subscription__wrapper');

		if (subscriptionForm && hiddenFormContainer) {
			clearInterval(intervalId);
			const hiddenForm = hiddenFormContainer.querySelector('form');
			if (!hiddenForm) {
				console.error('Hidden form not found inside container.');
				return;
			}

			const hiddenEmailInput = hiddenForm.querySelector('input[type="email"]');
			if (!hiddenEmailInput) {
				console.error('Hidden email input not found in the hidden form.');
				return;
			}

			// Add submit handler for the visible form
			subscriptionForm.addEventListener('submit', function (e) {
				e.preventDefault(); // Prevent the default form submission

				// Extract the email value from the visible form
				const emailInput = subscriptionForm.querySelector('input[type="email"]');
				if (!emailInput) {
					console.error('Email input not found in the subscription form.');
					return;
				}
				const email = emailInput.value.trim();

				// Validate the email
				if (!validateEmail(email)) {
					emailInput.classList.add('error');
					displayErrorMessage(emailInput, 'Please enter a valid email address.');
					return;
				} else {
					emailInput.classList.remove('error');
					removeErrorMessage(emailInput);
				}

				// Pass the value to the hidden email input using the standard "input" event
				hiddenEmailInput.value = email;
				hiddenEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
				console.log('Email value passed to hidden input via input event:', email);

				// Programmatically simulate a click on the hidden form's submit button
				const submitButton = hiddenForm.querySelector('button');
				if (submitButton) {
					setTimeout(() => {
						submitButton.click();
						sectionWrapper.style.display = 'none';
						thankWrapper.style.display = 'block';
						setTimeout(() => {
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
				console.log('Form elements not found after maximum attempts.');
				clearInterval(intervalId);
			} else {
				console.log('Attempt', attempts, ': form elements not found, retrying...');
			}
		}
	}, interval);
});

/**
 * Validates the email address.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email is valid, otherwise false.
 */
function validateEmail(email) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

/**
 * Displays an error message below the specified input element.
 * @param {HTMLElement} inputElement - The input element to display the error for.
 * @param {string} message - The error message text.
 */
function displayErrorMessage(inputElement, message) {
	let errorDiv = inputElement.parentElement.querySelector('.error-message');
	if (!errorDiv) {
		errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		inputElement.parentElement.insertBefore(errorDiv, inputElement.nextElementSibling);
	}
	errorDiv.textContent = message;
}

/**
 * Removes the error message for the specified input element.
 * @param {HTMLElement} inputElement - The input element for which the error message should be removed.
 */
function removeErrorMessage(inputElement) {
	const errorDiv = inputElement.parentElement.querySelector('.error-message');
	if (errorDiv) {
		errorDiv.remove();
	}
}
