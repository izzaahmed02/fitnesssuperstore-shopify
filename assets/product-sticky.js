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
    const windowHeight = window.innerHeight;
    const infoHeight = info.offsetHeight;
    const extraTop = extra.offsetTop;
    const extraHeight = extra.offsetHeight;
    const extraBottom = extraTop + extraHeight;

    // Set initial minHeight to prevent layout shifts
    if (!container.style.minHeight) {
      container.style.minHeight = `${extraHeight}px`;
    }

    const triggerPoint = left.offsetTop + left.offsetHeight;
    const scrollY = window.scrollY;

    console.log("ScrollY:", scrollY + offsetTop, "TriggerPoint:", triggerPoint, "ExtraBottom:", extraBottom);

    // CASE 1: Not yet at trigger point (static positioning)
    if (scrollY + offsetTop < triggerPoint) {
      info.classList.remove("fixed", "absolute");
      info.style.top = "";
      info.style.right = "";
      info.style.bottom = "";
      return;
    }

    // CASE 2: Between trigger point and bottom of extra — fixed
    if (scrollY + offsetTop < extraBottom - infoHeight) {
      if (!info.classList.contains("fixed")) {
        const currentTop = info.getBoundingClientRect().top;
        info.classList.add("fixed");
        info.classList.remove("absolute");
        info.style.top = `${currentTop - offsetTop}px`; // Adjust for offset
        updateProductInfoRight();
        console.log("Applied fixed at:", currentTop - offsetTop);
      }
      return;
    }

    // CASE 3: Reached or past the bottom of extra — absolute
    info.classList.remove("fixed");
    info.classList.add("absolute");
    const absoluteTop = extraBottom - infoHeight;
    info.style.top = `${absoluteTop}px`;
    info.style.right = "";
    info.style.bottom = "";
    console.log("Applied absolute at:", absoluteTop);
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
        info.style.bottom = "";
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