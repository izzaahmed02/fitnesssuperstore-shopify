document.addEventListener("DOMContentLoaded", () => {
  const desktopQuery = window.matchMedia("screen and (min-width: 990px)");
  let scrollListenerAttached = false;
  let mutationDebounceTimer;

  function logSticky(message, details = {}) {
    console.log("[product-sticky]", message, details);
  }

  function getProductContext() {
    const productContainers = document.querySelectorAll(".product");

    for (const container of productContainers) {
      const productInfo = container.querySelector(".product__info-wrapper.grid__item");
      const leftContainer = container.querySelector(".product-main-left-container");
      const productExtraInfo = container.querySelector(".product__extra_info");

      if (productInfo && leftContainer && productExtraInfo) {
        const fixedContainer =
          container.closest(".page-width-desktop.page-width-index") ||
          document.querySelector(".page-width-desktop.page-width-index");

        return {
          container,
          productInfo,
          leftContainer,
          productExtraInfo,
          fixedContainer,
        };
      }
    }

    return null;
  }

  function checkScroll() {
    const headerWrapper = document.querySelector(".header-wrapper");
    const context = getProductContext();

    if (!headerWrapper || !context) {
      logSticky("Skipping checkScroll because required elements are missing", {
        hasHeaderWrapper: Boolean(headerWrapper),
        hasContext: Boolean(context),
      });
      return;
    }

    const { container, productInfo, productExtraInfo, fixedContainer } = context;
    const extraInfoRect = productExtraInfo.getBoundingClientRect();

    const windowHeight = window.innerHeight;
    const productInfoHeight = productInfo.offsetHeight;
    const extraInfoHeight = productExtraInfo.offsetHeight;

    container.style.minHeight = `${productInfoHeight}px`;

    logSticky("checkScroll start", {
      scrollY: window.scrollY,
      headerHeight: headerWrapper.offsetHeight,
      windowHeight,
      productInfoHeight,
      extraInfoTop: extraInfoRect.top,
      extraInfoBottom: extraInfoRect.bottom,
      hadFixedClass: productInfo.classList.contains("fixed"),
      hadAbsoluteClass: productInfo.classList.contains("absolute"),
    });

    if (window.scrollY <= headerWrapper.offsetHeight) {
      productInfo.classList.remove("fixed", "absolute");
      productInfo.style.top = "";
      productInfo.style.right = "";
      productInfo.style.left = "";
      logSticky("Reset to default state because page is near top", {
        classes: productInfo.className,
      });
      return;
    }

    if (extraInfoRect.top <= windowHeight - productInfoHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
      logSticky("Applied fixed class: extra info is above fixed threshold", {
        threshold: windowHeight - productInfoHeight,
        extraInfoTop: extraInfoRect.top,
      });
    } else {
      productInfo.classList.remove("fixed");
      logSticky("Removed fixed class: extra info not yet at fixed threshold", {
        threshold: windowHeight - productInfoHeight,
        extraInfoTop: extraInfoRect.top,
      });
    }

    if (extraInfoRect.top <= windowHeight && extraInfoRect.bottom > windowHeight) {
      productInfo.classList.add("fixed");
      productInfo.classList.remove("absolute");
      productInfo.style.top = "";
      logSticky("Applied fixed class: extra info intersects viewport bottom", {
        extraInfoTop: extraInfoRect.top,
        extraInfoBottom: extraInfoRect.bottom,
      });
    }

    if (extraInfoRect.bottom <= windowHeight) {
      productInfo.classList.remove("fixed");
      productInfo.classList.add("absolute");
      productInfo.style.top = `${extraInfoHeight + headerWrapper.offsetHeight}px`;
      productInfo.style.left = "";
      productInfo.style.right = "";
      logSticky("Switched to absolute class: extra info passed viewport", {
        top: productInfo.style.top,
        extraInfoBottom: extraInfoRect.bottom,
        windowHeight,
      });
      return;
    }

    if (fixedContainer && productInfo.classList.contains("fixed")) {
      const containerRect = fixedContainer.getBoundingClientRect();
      const leftOffset = containerRect.right - productInfo.offsetWidth - 1;

      productInfo.style.left = `${leftOffset}px`;
      productInfo.style.right = "auto";
      logSticky("Aligned fixed container", {
        leftOffset,
        containerRight: containerRect.right,
        infoWidth: productInfo.offsetWidth,
      });
    } else {
      productInfo.style.left = "";
      productInfo.style.right = "";
    }

    logSticky("checkScroll end", {
      classes: productInfo.className,
      top: productInfo.style.top || "",
      left: productInfo.style.left || "",
      right: productInfo.style.right || "",
    });
  }

  function setupScrollListener() {
    const context = getProductContext();

    if (desktopQuery.matches && context) {
      if (!scrollListenerAttached) {
        window.addEventListener("scroll", checkScroll);
        scrollListenerAttached = true;
        logSticky("Attached scroll listener", { desktopMatches: desktopQuery.matches });
      }
      checkScroll();
      return;
    }

    if (scrollListenerAttached) {
      window.removeEventListener("scroll", checkScroll);
      scrollListenerAttached = false;
      logSticky("Removed scroll listener", { desktopMatches: desktopQuery.matches });
    }

    if (context?.productInfo) {
      context.productInfo.classList.remove("fixed", "absolute");
      context.productInfo.style.top = "";
      context.productInfo.style.left = "";
      context.productInfo.style.right = "";
      logSticky("Reset classes/styles while listener is inactive", {
        classes: context.productInfo.className,
      });
    }
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      logSticky("Handling resize event");
      setupScrollListener();
    }, 100);
  });

  function mutationTouchesStickyTargets(mutations) {
    return mutations.some((mutation) => {
      const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];

      return changedNodes.some((node) => {
        if (!(node instanceof Element)) return false;

        return (
          node.matches(".product, .product__info-wrapper, .product__extra_info") ||
          node.querySelector(".product, .product__info-wrapper, .product__extra_info")
        );
      });
    });
  }

  const observer = new MutationObserver((mutations) => {
    if (!mutationTouchesStickyTargets(mutations)) return;

    clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
      logSticky("Relevant product mutation observed, re-evaluating sticky setup");
      setupScrollListener();
    }, 120);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setupScrollListener();
});
