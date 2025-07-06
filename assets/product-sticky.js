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
    const container = document.querySelector(".page-width-desktop.page-width-index");
    const info = document.querySelector(".product__info-wrapper");
    if (!container || !info || !info.classList.contains("fixed")) return;

    const windowWidth = window.innerWidth;
    const containerWidth = container.getBoundingClientRect().width;
    const marginRight = (windowWidth - containerWidth) / 2;

    info.style.right = `${marginRight}px`;
  }

  function checkScroll() {
    const info = document.querySelector(".product__info-wrapper");
    const left = document.querySelector(".product-main-left-container");
    const extra = document.querySelector(".product__extra_info");
    const header = document.querySelector(".header-wrapper");
    const announce = document.querySelector(".announcement-bar-section");
    const container = document.querySelector(".product");

    if (!info || !left || !extra || !header || !announce || !container) return;

    const offsetTop = announce.offsetHeight + header.offsetHeight;

    const leftRect = left.getBoundingClientRect();
    const extraRect = extra.getBoundingClientRect();
    const infoRect = info.getBoundingClientRect();
    const infoHeight = info.offsetHeight;
    const windowHeight = window.innerHeight;

    container.style.minHeight = `${infoHeight}px`;

    // CASE 1: BEFORE sticky point — remove fixed/absolute
    if (leftRect.bottom > offsetTop) {
      info.classList.remove("fixed", "absolute");
      info.style.top = "";
      info.style.right = "";
      return;
    }

    // CASE 2: Reached bottom — keep fixed but prevent overlap
    const extraBottomReached = extraRect.top + extra.offsetHeight <= infoHeight + offsetTop;

    if (extraBottomReached) {
      // lock the info wrapper at the bottom as absolute
      const topFromDocument = extra.offsetTop + extra.offsetHeight - infoHeight;
      info.classList.remove("fixed");
      info.classList.add("absolute");
      info.style.top = `${topFromDocument}px`;
      info.style.right = "";
      return;
    }

    // CASE 3: In sticky zone — apply fixed (no shift)
    if (!info.classList.contains("fixed")) {
      const topOffset = info.getBoundingClientRect().top;
      const scrollTop = window.scrollY;
      const absoluteTop = scrollTop + topOffset;

      info.classList.add("fixed");
      info.classList.remove("absolute");
      info.style.top = `${topOffset}px`; // preserve visual position
      updateProductInfoRight();
    }
  }

  function setupScrollListener() {
    const info = document.querySelector(".product__info-wrapper");

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

      if (info) {
        info.classList.remove("fixed", "absolute");
        info.style.top = "";
        info.style.right = "";
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
