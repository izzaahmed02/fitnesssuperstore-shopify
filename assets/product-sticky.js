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
      productInfo.style.right = "";
    }
  }

  function checkScroll() {
    const announcementBar = document.querySelector(".announcement-bar-section");
    const header = document.querySelector(".header-wrapper");
    const product = document.querySelector(".product");
    const productInfo = document.querySelector(".product__info-wrapper");
    const leftContainer = document.querySelector(".product-main-left-container");
    const extraInfo = document.querySelector(".product__extra_info");

    if (!announcementBar || !header || !product || !productInfo || !leftContainer || !extraInfo) return;

    const offsetThreshold = announcementBar.offsetHeight + header.offsetHeight;

    const leftRect = leftContainer.getBoundingClientRect();
    const extraRect = extraInfo.getBoundingClientRect();
    const infoHeight = productInfo.offsetHeight;
    const windowHeight = window.innerHeight;

    // Ensure enough space is allocated
    product.style.minHeight = `${infoHeight}px`;

    // Default: remove fixed/absolute
    if (leftRect.bottom > offsetThreshold) {
      productInfo.classList.remove("fixed", "absolute");
      productInfo.style.top = "";
      productInfo.style.right = "";
      return;
    }

    // Stop fixing if extra info hits bottom
    if (extraRect.bottom <= windowHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${extraInfo.offsetHeight + offsetThreshold}px`;
      productInfo.style.right = "";
      return;
    }

    // Activate sticky fixed
    productInfo.classList.add("fixed");
    productInfo.classList.remove("absolute");
    productInfo.style.top = "";
    updateProductInfoRight(); // Only update right here
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
      updateProductInfoRight();
    }, 100);
  });

  waitForElement(".avpoptions-container__v2", () => {
    setupScrollListener();
    updateProductInfoRight();
  });
});
