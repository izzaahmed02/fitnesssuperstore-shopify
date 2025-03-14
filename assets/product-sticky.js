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

  function checkScroll() {
    const announcementBarSection = document.querySelector(".announcement-bar-section");
    const headerWrapper = document.querySelector(".header-wrapper");
    const productContainer = document.querySelector(".product");
    const productInfo = document.querySelector(".product__info-wrapper");
    const leftContainer = document.querySelector(
      ".product-main-left-container"
    );
    const productExtraInfo = document.querySelector(".product__extra_info");

    if (!productContainer || !productInfo || !leftContainer || !productExtraInfo) return;

    const productContainerRect = productContainer.getBoundingClientRect();
    const productInfoRect = productInfo.getBoundingClientRect();
    const extraInfoRect = productExtraInfo.getBoundingClientRect();


    productContainer.style.minHeight = `${productInfo.offsetHeight}px`;

    if (productInfoRect.bottom <= window.innerHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = ``;
    }
    if (productContainerRect.bottom >= window.innerHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = ``;
    }

    if (extraInfoRect.bottom <= window.innerHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${productExtraInfo.offsetHeight + announcementBarSection.offsetHeight + headerWrapper.offsetHeight}px`;
    }
  }

  function setupScrollListener() {
    if (window.matchMedia("screen and (min-width: 990px)").matches) {
      window.addEventListener("scroll", checkScroll);
      checkScroll();
    } else {
      window.removeEventListener("scroll", checkScroll);
      const productInfo = document.querySelector(".product__info-wrapper");
      if (productInfo) {
        productInfo.classList.remove("fixed");
      }
    }
  }

  waitForElement(".avpoptions-container__v2", setupScrollListener);
  window.addEventListener("resize", setupScrollListener);
});
