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

  function checkScroll() {
    const announcementBarSection = document.querySelector(".announcement-bar-section");
    const headerWrapper = document.querySelector(".header-wrapper");
    const productContainer = document.querySelector(".product");
    const productInfo = document.querySelector(".product__info-wrapper");
    const leftContainer = document.querySelector(".product-main-left-container");
    const productExtraInfo = document.querySelector(".product__extra_info.desktop");
    const container = document.querySelector(".page-width-desktop.page-width-index");

    if (!productContainer || !productInfo || !leftContainer || !productExtraInfo || !container)
      return;

    const offsetTop =
      (announcementBarSection?.offsetHeight || 0) +
      (headerWrapper?.offsetHeight || 0);

    const scrollY = window.scrollY;
    const leftBottom = leftContainer.offsetTop + leftContainer.offsetHeight;
    const extraTop = productExtraInfo.offsetTop;
    const extraBottom = extraTop + productExtraInfo.offsetHeight;
    const infoHeight = productInfo.offsetHeight;

    const containerRect = container.getBoundingClientRect();
    const rightOffset = window.innerWidth - (containerRect.left + containerRect.width);

    productInfo.classList.remove("fixed", "absolute");
    productInfo.style.left = "";
    productInfo.style.right = "";
    productInfo.style.width = "";

    if (scrollY + offsetTop < leftBottom) {
      return; // Scroll normally
    }

    if (scrollY + offsetTop + infoHeight < extraBottom) {
      productInfo.classList.add("fixed");
      productInfo.style.width = `${productInfo.offsetWidth}px`;
      productInfo.style.right = `${rightOffset}px`;
      return;
    }

    // Lock to bottom
    productInfo.classList.add("absolute");
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
        productInfo.style.right = "";
        productInfo.style.width = "";
      }
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setupScrollListener, 100);
  });

  waitForElement(".avpoptions-container__v2", setupScrollListener);
});
