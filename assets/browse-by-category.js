document.addEventListener("DOMContentLoaded", function () {
  const browseCategory = document.querySelector(".browse-category");
  if (!browseCategory) return;

  const firstTab = browseCategory.querySelector(".category-tab-content.active");
  const firstSlider = firstTab.querySelector('[class*="slider-tab-"]');

  $(firstSlider).on("setPosition", function () {
    setEqualCardHeights(firstTab);
  });

  $(firstSlider).slick({
    slidesToShow: 5,

    infinite: true,
    draggable: true,
    cssEase: 'linear',
    swipeToSlide: true,   
  touchThreshold: 4,  
 
    slidesToScroll: 1,
    arrows: true,
    dots: true,
    responsive: [
      { breakpoint: 1300, settings: { slidesToShow: 4 }},
      { breakpoint: 1024, settings: { slidesToShow: 3 }},
      { breakpoint: 989,  settings: { slidesToShow: 2 }}
    ]
  });

  function setEqualCardHeights(container) {
    const cards = container.querySelectorAll(".category-card");
    let maxHeight = 0;
    cards.forEach(card => card.style.minHeight = "auto");
    cards.forEach(card => {
      const height = card.offsetHeight;
      if (height > maxHeight) maxHeight = height;
    });
    cards.forEach(card => card.style.minHeight = `${maxHeight}px`);
  }

  browseCategory.querySelectorAll(".category-tabs button").forEach(button => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      browseCategory.querySelectorAll(".category-tabs button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      browseCategory.querySelectorAll(".category-tab-content").forEach(tab => tab.classList.remove("active"));
      const targetTab = browseCategory.querySelector(`#${tabId}`);
      targetTab.classList.add("active");

      const targetSlider = targetTab.querySelector('[class*="slider-tab-"]');
      if ($(targetSlider).hasClass("slick-initialized")) {
        $(targetSlider).slick("unslick");
      }

      $(targetSlider).on("setPosition", function () {
        setEqualCardHeights(targetTab);
      });

      $(targetSlider).slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        arrows: true,
        swipeToSlide: true,   
        touchThreshold: 4,  
        dots: true,
        infinite: true,
        draggable: true,
        cssEase: 'linear',
        responsive: [
          { breakpoint: 1300, settings: { slidesToShow: 4 }},
          { breakpoint: 1024, settings: { slidesToShow: 3 }},
          { breakpoint: 989,  settings: { slidesToShow: 2 }}
        ]
      });
    });
  });
});