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
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    const StickyProduct = {
      scrollListenerAttached: false,
      resizeTimeout: null,

      init() {
        this.waitForElement(".product__info-wrapper", () => {
          this.setupScrollListener();
          this.handleResize();
        });
      },

      waitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) return callback();

        const observer = new MutationObserver((mutations, obs) => {
          if (document.querySelector(selector)) {
            obs.disconnect();
            callback();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      },

      handleResize() {
        window.addEventListener("resize", () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.checkScroll();
          }, 100);
        });
      },

      setupScrollListener() {
        if (!this.scrollListenerAttached) {
          window.addEventListener("scroll", this.checkScroll.bind(this), { passive: true });
          this.scrollListenerAttached = true;
        }
        this.checkScroll();
      },

      checkScroll() {
        const productInfo = document.querySelector(".product__info-wrapper");
        const productSection = document.querySelector(".product");
        const headerWrapper = document.querySelector(".header-wrapper");

        if (!productInfo || !productSection || !headerWrapper) return;

        const headerHeight = headerWrapper.offsetHeight;
        const sectionRect = productSection.getBoundingClientRect();
        const infoHeight = productInfo.offsetHeight;

        // Desktop only
        if (!window.matchMedia("(min-width: 990px)").matches) {
          productInfo.style.position = "";
          productInfo.style.top = "";
          productInfo.style.left = "";
          productInfo.style.width = "";
          return;
        }

        const sectionTop = window.scrollY + sectionRect.top;
        const sectionBottom = sectionTop + productSection.offsetHeight;
        const scrollY = window.scrollY;

        // Normal flow (before sticky)
        if (scrollY + headerHeight < sectionTop) {
          productInfo.style.position = "absolute";
          productInfo.style.top = "0";
          productInfo.style.left = "0";
          productInfo.style.width = "auto";
        }
        // Sticky
        else if (scrollY + headerHeight + infoHeight < sectionBottom) {
          productInfo.style.position = "fixed";
          productInfo.style.top = `${headerHeight}px`;
          productInfo.style.left = `${productSection.getBoundingClientRect().left}px`;
          productInfo.style.width = `${productSection.offsetWidth}px`;
        }
        // Stop at bottom
        else {
          productInfo.style.position = "absolute";
          productInfo.style.top = `${productSection.offsetHeight - infoHeight}px`;
          productInfo.style.left = "0";
          productInfo.style.width = `${productSection.offsetWidth}px`;
        }
      }
    };

    StickyProduct.init();
  });
})();
</script>
