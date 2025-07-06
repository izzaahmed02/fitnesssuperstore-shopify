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

    if (productInfo.classList.contains("fixed")) {
      const windowWidth = window.innerWidth;
      const containerWidth = pageWidthContainer.getBoundingClientRect().width;
      const marginRight = (windowWidth - containerWidth) / 2;
      productInfo.style.right = `${marginRight}px`;
    } else {
      productInfo.style.right = ""; // reset if not fixed
    }
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
    const offsetThreshold = announcementBarSection.offsetHeight + headerWrapper.offsetHeight;

    productContainer.style.minHeight = `${productInfoHeight}px`;

    if (window.scrollY <= offsetThreshold) {
      productInfo.classList.remove("fixed", "absolute");
      productInfo.style.top = "";
      productInfo.style.right = "";
      return;
    }

    if (extraInfoRect.bottom <= window.innerHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${
        productExtraInfo.offsetHeight + offsetThreshold
      }px`;
      productInfo.style.right = "";
    } else {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
      updateProductInfoRight(); // update right only when fixed
    }
  }

  function setupScrollListener() {
    const productInfo = document.querySelector(".product__info-wrapper");

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
        productInfo.style.right = "";
      }
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setupScrollListener();
      updateProductInfoRight(); // reevaluate on resize
    }, 100);
  });

  waitForElement(".avpoptions-container__v2", () => {
    setupScrollListener();
    updateProductInfoRight();
  });
});
