/*
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
  const extraInfoRect = productExtraInfo.getBoundingClientRect();

  const windowHeight = window.innerHeight;
  const productInfoHeight = productInfo.offsetHeight;
  const extraInfoHeight = productExtraInfo.offsetHeight;

  productContainer.style.minHeight = `${productInfoHeight}px`;

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
*/

<script>
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const StickyProduct = {
      scrollListenerAttached: false,
      resizeTimeout: null,

      waitForElement(selector, callback) {
        const observer = new MutationObserver((mutationsList, observer) => {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            callback(element);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      },

      checkScroll() {
        const headerWrapper = document.querySelector(".header-wrapper");
        const productContainer = document.querySelector(".product");
        const productInfo = document.querySelector(".product__info-wrapper");
        const leftContainer = document.querySelector(".product-main-left-container");
        const productExtraInfo = document.querySelector(".product__extra_info");
        const fixedContainer = document.querySelector(".page-width-desktop.page-width-index");

        if (!productContainer || !productInfo || !leftContainer || !productExtraInfo || !headerWrapper) return;

        const windowHeight = window.innerHeight;
        const productInfoHeight = productInfo.offsetHeight;
        const extraInfoRect = productExtraInfo.getBoundingClientRect();
        const extraInfoHeight = productExtraInfo.offsetHeight;

        productContainer.style.minHeight = `${productInfoHeight}px`;

        // Reset top of page
        if (window.scrollY <= headerWrapper.offsetHeight) {
          productInfo.classList.remove("fixed", "absolute");
          productInfo.style.top = "";
          productInfo.style.left = "";
          productInfo.style.right = "";
          return;
        }

        // Sticky when extra info not fully in viewport
        if (extraInfoRect.top <= windowHeight - productInfoHeight) {
          productInfo.classList.add("fixed");
          productInfo.classList.remove("absolute");
          productInfo.style.top = "";
        } else {
          productInfo.classList.remove("fixed");
        }

        // Stick when extra info partially visible
        if (extraInfoRect.top <= windowHeight && extraInfoRect.bottom > windowHeight) {
          productInfo.classList.add("fixed");
          productInfo.classList.remove("absolute");
          productInfo.style.top = "";
        }

        // Absolute at bottom
        if (extraInfoRect.bottom <= windowHeight) {
          productInfo.classList.remove("fixed");
          productInfo.classList.add("absolute");
          productInfo.style.top = `${extraInfoHeight + headerWrapper.offsetHeight}px`;
          productInfo.style.left = "";
          productInfo.style.right = "";
          return;
        }

        // Position left if fixed
        if (fixedContainer && productInfo.classList.contains("fixed")) {
          const containerRect = fixedContainer.getBoundingClientRect();
          const leftOffset = containerRect.right - productInfo.offsetWidth - 1;
          productInfo.style.left = `${leftOffset}px`;
          productInfo.style.right = "auto";
        } else {
          productInfo.style.left = "";
          productInfo.style.right = "";
        }
      },

      setupScrollListener() {
        const productInfo = document.querySelector(".product__info-wrapper");
        const isDesktop = window.matchMedia("screen and (min-width: 990px)").matches;

        if (isDesktop) {
          if (!StickyProduct.scrollListenerAttached) {
            window.addEventListener("scroll", StickyProduct.checkScroll, { passive: true });
            StickyProduct.scrollListenerAttached = true;
          }
          StickyProduct.checkScroll();
        } else {
          if (StickyProduct.scrollListenerAttached) {
            window.removeEventListener("scroll", StickyProduct.checkScroll);
            StickyProduct.scrollListenerAttached = false;
          }

          if (productInfo) {
            productInfo.classList.remove("fixed", "absolute");
            productInfo.style.top = "";
            productInfo.style.left = "";
            productInfo.style.right = "";
          }
        }
      },

      init() {
        window.addEventListener("resize", () => {
          clearTimeout(StickyProduct.resizeTimeout);
          StickyProduct.resizeTimeout = setTimeout(() => {
            StickyProduct.setupScrollListener();
          }, 100);
        });

        StickyProduct.waitForElement(".avpoptions-container__v2", StickyProduct.setupScrollListener);
      }
    };

    StickyProduct.init();
  });
})();
</script>
