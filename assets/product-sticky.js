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
    const StickySidebar = {
      scrollListenerAttached: false,
      resizeTimeout: null,

      waitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) return callback(el);

        const observer = new MutationObserver((mutations, obs) => {
          const el = document.querySelector(selector);
          if (el) {
            obs.disconnect();
            callback(el);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
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
          return;
        }

        // Stick only after section bottom scrolls past viewport top
        if (sectionRect.top <= headerHeight && sectionRect.bottom - infoHeight > headerHeight) {
          productInfo.style.position = "fixed";
          productInfo.style.top = `${headerHeight}px`;
          productInfo.style.left = `${productSection.getBoundingClientRect().left}px`;
          productInfo.style.width = `${productSection.offsetWidth}px`;
        }
        // Stop at bottom of section
        else if (sectionRect.bottom - infoHeight <= headerHeight) {
          productInfo.style.position = "absolute";
          productInfo.style.top = `${productSection.offsetHeight - infoHeight}px`;
          productInfo.style.left = "";
          productInfo.style.width = "";
        }
        // Default (above section)
        else {
          productInfo.style.position = "";
          productInfo.style.top = "";
          productInfo.style.left = "";
          productInfo.style.width = "";
        }
      },

      setupScrollListener() {
        if (!this.scrollListenerAttached) {
          window.addEventListener("scroll", this.checkScroll, { passive: true });
          this.scrollListenerAttached = true;
        }
        this.checkScroll();
      },

      init() {
        const self = this;
        // Handle resize
        window.addEventListener("resize", () => {
          clearTimeout(self.resizeTimeout);
          self.resizeTimeout = setTimeout(() => {
            self.checkScroll();
          }, 100);
        });

        // Wait for product info to exist
        self.waitForElement(".product__info-wrapper", () => {
          self.setupScrollListener();
        });
      }
    };

    StickySidebar.init();
  });
})();
</script>
