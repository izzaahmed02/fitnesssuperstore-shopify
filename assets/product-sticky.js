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

(function() {
  'use strict';
  
  // Namespace to avoid conflicts
  const StickyProductInfo = {
    scrollListenerAttached: false,
    resizeTimeout: null,
    observer: null,
    
    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    },
    
    setup() {
      this.waitForElement('.avpoptions-container__v2', () => {
        this.setupScrollListener();
      });
      
      // Debounced resize handler
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.setupScrollListener(), 100);
      });
    },
    
    waitForElement(selector, callback) {
      // Check if element already exists
      const element = document.querySelector(selector);
      if (element) {
        callback(element);
        return;
      }
      
      // Otherwise observe for it
      if (this.observer) {
        this.observer.disconnect();
      }
      
      this.observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          this.observer.disconnect();
          callback(el);
        }
      });
      
      this.observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    },
    
    checkScroll() {
      try {
        const headerWrapper = document.querySelector('.header-wrapper');
        const productContainer = document.querySelector('.product');
        const productInfo = document.querySelector('.product__info-wrapper');
        const leftContainer = document.querySelector('.product-main-left-container');
        const productExtraInfo = document.querySelector('.product__extra_info');
        const fixedContainer = document.querySelector('.page-width-desktop.page-width-index');
        
        // Exit early if required elements don't exist
        if (!productContainer || !productInfo || !leftContainer || !productExtraInfo) {
          return;
        }
        
        const productContainerRect = productContainer.getBoundingClientRect();
        const extraInfoRect = productExtraInfo.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const productInfoHeight = productInfo.offsetHeight;
        const extraInfoHeight = productExtraInfo.offsetHeight;
        const headerHeight = headerWrapper ? headerWrapper.offsetHeight : 0;
        
        // Set minimum height to prevent layout shift
        productContainer.style.minHeight = `${productInfoHeight}px`;
        
        // Reset styles if scrolled to top
        if (window.scrollY <= headerHeight) {
          productInfo.classList.remove('fixed', 'absolute');
          productInfo.style.top = '';
          productInfo.style.right = '';
          productInfo.style.left = '';
          return;
        }
        
        // Check if we've scrolled past the extra info section
        if (extraInfoRect.bottom <= windowHeight) {
          productInfo.classList.remove('fixed');
          productInfo.classList.add('absolute');
          productInfo.style.top = `${extraInfoHeight + headerHeight}px`;
          productInfo.style.left = '';
          productInfo.style.right = '';
          return;
        }
        
        // Make sticky when extra info is approaching
        if (extraInfoRect.top <= windowHeight - productInfoHeight) {
          productInfo.classList.add('fixed');
          productInfo.classList.remove('absolute');
          productInfo.style.top = '';
          
          // Position horizontally relative to container
          if (fixedContainer) {
            const containerRect = fixedContainer.getBoundingClientRect();
            const leftOffset = containerRect.right - productInfo.offsetWidth - 1;
            productInfo.style.left = `${leftOffset}px`;
            productInfo.style.right = 'auto';
          }
        } else {
          productInfo.classList.remove('fixed', 'absolute');
          productInfo.style.top = '';
          productInfo.style.left = '';
          productInfo.style.right = '';
        }
      } catch (error) {
        console.error('StickyProductInfo error:', error);
      }
    },
    
    setupScrollListener() {
      const productInfo = document.querySelector('.product__info-wrapper');
      const isDesktop = window.matchMedia('screen and (min-width: 990px)').matches;
      
      if (isDesktop) {
        // Attach scroll listener only once
        if (!this.scrollListenerAttached) {
          const throttledScroll = this.throttle(() => this.checkScroll(), 10);
          window.addEventListener('scroll', throttledScroll, { passive: true });
          this.scrollListenerAttached = true;
        }
        this.checkScroll();
      } else {
        // Remove scroll listener on mobile
        if (this.scrollListenerAttached) {
          window.removeEventListener('scroll', this.checkScroll);
          this.scrollListenerAttached = false;
        }
        
        // Reset styles on mobile
        if (productInfo) {
          productInfo.classList.remove('fixed', 'absolute');
          productInfo.style.top = '';
          productInfo.style.left = '';
          productInfo.style.right = '';
        }
      }
    },
    
    // Throttle function to limit scroll event frequency
    throttle(func, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func.apply(this, args);
        }
      };
    },
    
    // Cleanup method if needed
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
      if (this.scrollListenerAttached) {
        window.removeEventListener('scroll', this.checkScroll);
        this.scrollListenerAttached = false;
      }
      clearTimeout(this.resizeTimeout);
    }
  };
  
  // Initialize
  StickyProductInfo.init();
  
  // Expose cleanup method globally if needed
  window.StickyProductInfo = {
    destroy: () => StickyProductInfo.destroy()
  };
})();
