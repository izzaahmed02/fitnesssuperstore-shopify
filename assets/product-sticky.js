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
    const announcementBarSection = document.querySelector(
      ".announcement-bar-section"
    );
    const headerWrapper = document.querySelector(".header-wrapper");
    const productContainer = document.querySelector(".product");
    const productInfo = document.querySelector(".product__info-wrapper");
    const leftContainer = document.querySelector(
      ".product-main-left-container"
    );
    const productExtraInfo = document.querySelector(".product__extra_info");

    if (
      !productContainer ||
      !productInfo ||
      !leftContainer ||
      !productExtraInfo
    )
      return;

    const productContainerRect = productContainer.getBoundingClientRect();
    const productInfoRect = productInfo.getBoundingClientRect();
    const extraInfoRect = productExtraInfo.getBoundingClientRect();

    const windowHeight = window.innerHeight;
    const productInfoHeight = productInfo.offsetHeight;
    const extraInfoHeight = productExtraInfo.offsetHeight;

    productContainer.style.minHeight = `${productInfoHeight}px`;

    if (window.scrollY === 0) {
      productInfo.classList.remove("fixed");
      return;
    }

    if (extraInfoRect.top <= windowHeight - productInfoHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
    } else {
      productInfo.classList.remove("fixed");
    }

    if (
      extraInfoRect.top <= windowHeight &&
      extraInfoRect.bottom > windowHeight
    ) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
    }

    if (extraInfoRect.bottom <= windowHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${
        extraInfoHeight +
        announcementBarSection.offsetHeight +
        headerWrapper.offsetHeight
      }px`;
    }

    if (
      extraInfoRect.bottom >= windowHeight &&
      extraInfoRect.top <= windowHeight
    ) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
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
