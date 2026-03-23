document.addEventListener("DOMContentLoaded", function () {
  const browseCategory = document.querySelector(".browse-category");
  if (!browseCategory) return;

  function scheduleEqualCardHeights(container) {
    if (!container) return;

    if (container.__equalizeFrame) {
      cancelAnimationFrame(container.__equalizeFrame);
    }

    container.__equalizeFrame = requestAnimationFrame(() => {
      const cards = Array.from(container.querySelectorAll(".category-card"));
      if (!cards.length) return;

      cards.forEach((card) => {
        card.style.minHeight = "auto";
      });

      requestAnimationFrame(() => {
        const maxHeight = cards.reduce((tallest, card) => {
          return Math.max(tallest, card.getBoundingClientRect().height);
        }, 0);

        cards.forEach((card) => {
          card.style.minHeight = maxHeight ? `${maxHeight}px` : "";
        });
      });
    });
  }

  const firstTab = browseCategory.querySelector(".category-tab-content.active");
  const firstSlider = firstTab?.querySelector('[class*="slider-tab-"]');

  if (!firstTab || !firstSlider) return;

  $(firstSlider).on("setPosition", function () {
    scheduleEqualCardHeights(firstTab);
  });

  $(firstSlider).slick({
    slidesToShow: 5,
    infinite: true,
    draggable: true,
    cssEase: 'linear',
    swipeToSlide: true,
    touchThreshold: 8,
    slidesToScroll: 1,
    arrows: true,
    dots: true,
    responsive: [
      { breakpoint: 1300, settings: { slidesToShow: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 989, settings: { slidesToShow: 2 } }
    ]
  });

  browseCategory.querySelectorAll(".category-tabs button").forEach(button => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      browseCategory.querySelectorAll(".category-tabs button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      browseCategory.querySelectorAll(".category-tab-content").forEach(tab => tab.classList.remove("active"));
      const targetTab = browseCategory.querySelector(`#${tabId}`);
      const targetSlider = targetTab?.querySelector('[class*="slider-tab-"]');

      if (!targetTab || !targetSlider) return;

      targetTab.classList.add("active");

      if ($(targetSlider).hasClass("slick-initialized")) {
        $(targetSlider).slick("unslick");
      }

      $(targetSlider).on("setPosition", function () {
        scheduleEqualCardHeights(targetTab);
      });

      $(targetSlider).slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        arrows: true,
        swipeToSlide: true,
        touchThreshold: 8,
        dots: true,
        infinite: true,
        draggable: true,
        cssEase: 'linear',
        responsive: [
          { breakpoint: 1300, settings: { slidesToShow: 4 } },
          { breakpoint: 1024, settings: { slidesToShow: 3 } },
          { breakpoint: 989, settings: { slidesToShow: 2 } }
        ]
      });
    });
  });
});
