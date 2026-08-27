document.addEventListener("DOMContentLoaded", () => {
  const desktopQuery = window.matchMedia("screen and (min-width: 990px)");
  let scrollListenerAttached = false;

  function getProductContext() {
  const container = document.querySelector(".product");
  if (!container) return null;

  const productInfo = container.querySelector(".product__info-wrapper");
  const productExtraInfo =
    container.querySelector(".product__extra_info") ||
    document.querySelector(".product__extra_info");

  const fixedContainer =
    container.closest(".page-width-desktop.page-width-index") ||
    document.querySelector(".page-width-desktop.page-width-index");

  if (!productInfo || !productExtraInfo) return null;

  return {
    container,
    productInfo,
    productExtraInfo,
    fixedContainer,
  };
}


  function checkScroll() {
    const headerWrapper = document.querySelector(".header-wrapper");
    const context = getProductContext();

    if (!headerWrapper || !context) return;

    const { container, productInfo, productExtraInfo, fixedContainer } = context;
    const extraInfoRect = productExtraInfo.getBoundingClientRect();

    const windowHeight = window.innerHeight;
    const productInfoHeight = productInfo.offsetHeight;
    const extraInfoHeight = productExtraInfo.offsetHeight;

    container.style.minHeight = `${productInfoHeight}px`;

    if (window.scrollY <= headerWrapper.offsetHeight) {
      productInfo.classList.remove("fixed", "absolute");
      productInfo.style.top = "";
      productInfo.style.right = "";
      productInfo.style.left = "";
      return;
    }

    if (extraInfoRect.top <= windowHeight - productInfoHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
    } else {
      productInfo.classList.remove("fixed");
    }

    if (extraInfoRect.top <= windowHeight && extraInfoRect.bottom > windowHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
    }

    if (extraInfoRect.bottom <= windowHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${extraInfoHeight + headerWrapper.offsetHeight}px`;
      productInfo.style.left = "";
      productInfo.style.right = "";
      return;
    }

    if (fixedContainer && productInfo.classList.contains("fixed")) {
      const containerRect = fixedContainer.getBoundingClientRect();
      const leftOffset = containerRect.right - productInfo.offsetWidth - 1;

      productInfo.style.left = `${leftOffset}px`;
      productInfo.style.right = "auto";
    } else {
      productInfo.style.left = "";
      productInfo.style.right = "";
    }
  }

  function setupScrollListener() {
    const context = getProductContext();

    if (desktopQuery.matches && context) {
      if (!scrollListenerAttached) {
        window.addEventListener("scroll", checkScroll);
        scrollListenerAttached = true;
      }
      checkScroll();
      return;
    }

    if (scrollListenerAttached) {
      window.removeEventListener("scroll", checkScroll);
      scrollListenerAttached = false;
    }

    if (context?.productInfo) {
      context.productInfo.classList.remove("fixed", "absolute");
      context.productInfo.style.top = "";
      context.productInfo.style.left = "";
      context.productInfo.style.right = "";
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setupScrollListener, 100);
  });

  const observer = new MutationObserver(() => {
    setupScrollListener();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setupScrollListener();
});
