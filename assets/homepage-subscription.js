document.addEventListener('DOMContentLoaded', function () {
  const section = document.querySelector('.homepage-subscription');
  if (!section) return;

  const visibleForm = section.querySelector('.homepage-subscription__form');
  const hiddenFormContainer = section.querySelector('.homepage-subscription__original-form');
  const thankWrapper = section.querySelector('.homepage-subscription__message');
  const sectionWrapper = section.querySelector('.homepage-subscription__wrapper');

  if (!visibleForm || !hiddenFormContainer || !thankWrapper || !sectionWrapper) return;

  const emailInput = visibleForm.querySelector('input[type="email"]');
  const submitButton = visibleForm.querySelector('button[type="submit"]');
  const errorMessage = visibleForm.querySelector('.error-message');
  const klaviyoEmbed = hiddenFormContainer.querySelector('[class*="klaviyo-form-"]');
  const klaviyoClass = Array.from(klaviyoEmbed?.classList || []).find((className) =>
    className.startsWith('klaviyo-form-')
  );
  const formId = klaviyoClass ? klaviyoClass.replace('klaviyo-form-', '') : '';
  let failureTimer;

  function clearError() {
    if (!errorMessage) return;
    errorMessage.hidden = true;
    errorMessage.textContent = '';
    emailInput?.classList.remove('error');
  }

  function showError(message) {
    if (!emailInput || !errorMessage) return;
    emailInput.classList.add('error');
    errorMessage.textContent = message;
    errorMessage.hidden = false;
    emailInput.focus();
  }

  function setPending(isPending) {
    if (submitButton) submitButton.disabled = isPending;
    visibleForm.setAttribute('aria-busy', isPending ? 'true' : 'false');
  }

  function showSuccess() {
    window.clearTimeout(failureTimer);
    setPending(false);
    clearError();
    sectionWrapper.style.display = 'none';
    thankWrapper.style.display = 'block';
    thankWrapper.setAttribute('tabindex', '-1');
    thankWrapper.focus();
  }

  window.addEventListener('klaviyoForms', function (event) {
    if (!event.detail || event.detail.type !== 'submit') return;
    if (formId && event.detail.formId !== formId) return;
    showSuccess();
  });

  visibleForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearError();

    if (!emailInput || !emailInput.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }

    const hiddenForm = hiddenFormContainer.querySelector('form');
    const hiddenEmailInput = hiddenForm?.querySelector('input[type="email"]');
    const hiddenSubmitButton = hiddenForm?.querySelector('button[type="submit"], button');

    if (!hiddenForm || !hiddenEmailInput || !hiddenSubmitButton) {
      showError(visibleForm.dataset.errorMessage);
      return;
    }

    hiddenEmailInput.value = emailInput.value.trim();
    hiddenEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
    hiddenEmailInput.dispatchEvent(new Event('change', { bubbles: true }));

    setPending(true);
    hiddenSubmitButton.click();

    window.clearTimeout(failureTimer);
    failureTimer = window.setTimeout(function () {
      setPending(false);
      showError(visibleForm.dataset.errorMessage);
    }, 15000);
  });
});
