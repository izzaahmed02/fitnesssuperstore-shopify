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
  const headerWrapper = document.querySelector(".header-wrapper");
  const productContainer = document.querySelector(".product");
  const productInfo = document.querySelector(".product__info-wrapper");
  const leftContainer = document.querySelector(".product-main-left-container");
  const productExtraInfo = document.querySelector(".product__extra_info");
  const fixedContainer = document.querySelector(".page-width-desktop.page-width-index");

  if (!productContainer || !productInfo || !leftContainer || !productExtraInfo) return;

  const productContainerRect = productContainer.getBoundingClientRect();
  const productInfoRect = productInfo.getBoundingClientRect();
  const extraInfoRect = productExtraInfo.getBoundingClientRect();

  const windowHeight = window.innerHeight;
  const productInfoHeight = productInfo.offsetHeight;
  const extraInfoHeight = productExtraInfo.offsetHeight;

  productContainer.style.minHeight = `${productInfoHeight}px`;

  if (window.scrollY <= headerWrapper.offsetHeight) {
    productInfo.classList.remove("fixed", "absolute");
    productInfo.style.top = "";
    productInfo.style.right = ""; // Reset positioning
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
    productInfo.style.top = `${
      extraInfoHeight + headerWrapper.offsetHeight
    }px`;
    productInfo.style.right = ""; // reset for absolute
    return;
  }

  // 👇 this part sticks it to the right edge of the container
  if (fixedContainer && productInfo.classList.contains("fixed")) {
    const containerRightOffset = window.innerWidth - fixedContainer.getBoundingClientRect().right + 1;

    productInfo.style.right = containerRightOffset + "px";
    productInfo.style.left = "auto";
  } else {
    productInfo.style.right = "";
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
