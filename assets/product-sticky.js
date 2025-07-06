document.addEventListener("DOMContentLoaded", function () {
  function waitForElement(selector, callback) {
    const observer = new MutationObserver((mutationsList, observer) => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        callback(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  let scrollListenerAttached = false;

  function updateProductInfoRight() {
    const pageWidthContainer = document.querySelector('.page-width-desktop.page-width-index');
    const productInfo = document.querySelector('.product__info-wrapper');

    if (!pageWidthContainer || !productInfo) return;

    const windowWidth = window.innerWidth;
    const containerWidth = pageWidthContainer.getBoundingClientRect().width;
    const marginRight = (windowWidth - containerWidth) / 2;

    productInfo.style.right = `${marginRight}px`;
  }

  function checkScroll() {
    const announcementBarSection = document.querySelector(".announcement-bar-section");
    const headerWrapper = document.querySelector(".header-wrapper");
    const productContainer = document.querySelector(".product");
    const productInfo = document.querySelector(".product__info-wrapper");
    const leftContainer = document.querySelector(".product-main-left-container");
    const productExtraInfo = document.querySelector(".product__extra_info");

    if (!productContainer || !productInfo || !leftContainer || !productExtraInfo) return;

    const productInfoHeight = productInfo.offsetHeight;
    const extraInfoRect = productExtraInfo.getBoundingClientRect();

    productContainer.style.minHeight = `${productInfoHeight}px`;

    const offsetThreshold = announcementBarSection.offsetHeight + headerWrapper.offsetHeight;

    if (window.scrollY <= offsetThreshold) {
      productInfo.classList.remove("fixed", "absolute");
      productInfo.style.top = "";
      return;
    }

    if (extraInfoRect.bottom <= window.innerHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${
        productExtraInfo.offsetHeight + offsetThreshold
      }px`;
    } else {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
    }
  }

  function setupScrollListener() {
    const productInfo = document.querySelector(".product__info-wrapper");

    updateProductInfoRight(); // ← set correct right value based on margin

    if (window.matchMedia("screen and (min-width: 990px)").matches) {
      if (!scrollListenerAttached) {
        window.addEventListener("scroll", checkScroll);
        scrollListenerAttached = true;
      }
      checkScroll();
    } else {
      if (scrollListenerAttached) {
        window.removeEventListener("scroll", checkScroll);
        scrollListenerAttached = false;
      }

      if (productInfo) {
        productInfo.classList.remove("fixed", "absolute");
        productInfo.style.top = "";
        productInfo.style.right = ""; // Reset right on smaller screens
      }
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateProductInfoRight();
      setupScrollListener();
    }, 100);
  });

  waitForElement(".avpoptions-container__v2", () => {
    updateProductInfoRight();
    setupScrollListener();
  });
});
