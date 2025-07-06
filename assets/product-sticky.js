function checkScroll() {
  const announcementBarSection = document.querySelector(".announcement-bar-section");
  const headerWrapper = document.querySelector(".header-wrapper");
  const productContainer = document.querySelector(".product");
  const productInfo = document.querySelector(".product__info-wrapper");
  const leftContainer = document.querySelector(".product-main-left-container");
  const productExtraInfo = document.querySelector(".product__extra_info.desktop");

  if (!productContainer || !productInfo || !leftContainer || !productExtraInfo) return;

  const announcementHeight = announcementBarSection?.offsetHeight || 0;
  const headerHeight = headerWrapper?.offsetHeight || 0;
  const offsetTop = announcementHeight + headerHeight;

  const productTop = productContainer.offsetTop;
  const extraInfoTop = productExtraInfo.offsetTop;
  const productInfoHeight = productInfo.offsetHeight;
  const scrollY = window.scrollY;

  // Reset everything initially
  productInfo.classList.remove("fixed", "absolute");
  productInfo.style.top = "";

  // PHASE 1: Sticky within first section
  if (scrollY < extraInfoTop - offsetTop - 1) {
    productInfo.classList.add("fixed");
    productInfo.style.top = `${offsetTop}px`;
    return;
  }

  // PHASE 2: Fixed during second section scroll
  const extraInfoHeight = productExtraInfo.offsetHeight;
  const fixedEnd = extraInfoTop + extraInfoHeight - productInfoHeight;

  if (scrollY >= extraInfoTop - offsetTop && scrollY < fixedEnd - offsetTop) {
    productInfo.classList.add("fixed");
    productInfo.style.top = `${offsetTop}px`;
    return;
  }

  // PHASE 3: Absolute when second section ends
  if (scrollY >= fixedEnd - offsetTop) {
    productInfo.classList.add("absolute");
    productInfo.style.top = `${fixedEnd}px`;
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
