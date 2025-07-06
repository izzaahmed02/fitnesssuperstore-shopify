document.addEventListener('DOMContentLoaded', function () {
  const productInfo = document.querySelector('.product__info-wrapper');
  const rightWrapper = document.querySelector('.product-main-right-wrapper');
  const leftContainer = document.querySelector('.product-main-left-container');
  const extraInfo = document.querySelector('.product__extra_info.desktop');
  const announcementBar = document.querySelector('.announcement-bar-section');
  const header = document.querySelector('.header-wrapper');

  const offsetTop = (announcementBar?.offsetHeight || 0) + (header?.offsetHeight || 0);
  let scrollListenerAttached = false;

  function updateInfoWrapperState() {
    if (!productInfo || !rightWrapper || !leftContainer || !extraInfo) return;

    const scrollY = window.scrollY;
    const leftRect = leftContainer.getBoundingClientRect();
    const extraRect = extraInfo.getBoundingClientRect();
    const rightRect = rightWrapper.getBoundingClientRect();

    // Remove all classes
    productInfo.classList.remove('fixed', 'absolute');
    productInfo.style.left = '';
    productInfo.style.width = '';

    const leftBottom = leftContainer.offsetTop + leftContainer.offsetHeight;
    const extraTop = extraInfo.offsetTop;
    const extraBottom = extraTop + extraInfo.offsetHeight;
    const infoHeight = productInfo.offsetHeight;

    // PHASE 1: Normal flow inside first section
    if (scrollY + offsetTop < leftBottom) {
      // Don't stick yet
      return;
    }

    // PHASE 2: Fixed inside second section
    if (scrollY + offsetTop >= leftBottom && scrollY + offsetTop + infoHeight < extraBottom) {
      productInfo.classList.add('fixed');
      productInfo.style.left = `${rightRect.left}px`;
      productInfo.style.width = `${rightRect.width}px`;
      return;
    }

    // PHASE 3: Absolute when scrolled past
    if (scrollY + offsetTop + infoHeight >= extraBottom) {
      productInfo.classList.add('absolute');
    }
  }

  function handleResponsiveStickiness() {
    if (window.innerWidth >= 990) {
      if (!scrollListenerAttached) {
        window.addEventListener('scroll', updateInfoWrapperState);
        window.addEventListener('resize', updateInfoWrapperState);
        scrollListenerAttached = true;
      }
      updateInfoWrapperState();
    } else {
      if (scrollListenerAttached) {
        window.removeEventListener('scroll', updateInfoWrapperState);
        window.removeEventListener('resize', updateInfoWrapperState);
        scrollListenerAttached = false;
      }

      // Reset styles for mobile
      if (productInfo) {
        productInfo.classList.remove('fixed', 'absolute');
        productInfo.style.left = '';
        productInfo.style.width = '';
      }
    }
  }

  handleResponsiveStickiness();
  window.addEventListener('resize', handleResponsiveStickiness);
});
