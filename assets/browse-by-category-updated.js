document.addEventListener("DOMContentLoaded", function () {
  const browseCategory1 = document.querySelector(".browse-category-updated");
  if (!browseCategory1) return;

  const firstTab1 = browseCategory1.querySelector(".category-tab-content.active");
  const firstSlider1 = firstTab1.querySelector('[class*="slider-tab-"]');

  $(firstSlider1).on("setPosition", function () {
    setEqualCardHeights(firstTab1);
  });

  $(firstSlider1).slick({
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
      { breakpoint: 1300, settings: { slidesToShow: 4 }},
      { breakpoint: 1024, settings: { slidesToShow: 3 }},
      { breakpoint: 989,  settings: { slidesToShow: 2 }}
    ]
  });

  function setEqualCardHeights1(container) {
    const cards1 = container.querySelectorAll(".category-card1");
    let maxHeight1 = 0;
    cards1.forEach(card1 => card1.style.minHeight = "auto");
    cards1.forEach(card1 => {
      const height1 = card1.offsetHeight;
      if (height1 > maxHeight1) maxHeight1 = height1;
    });
    cards1.forEach(card1 => card1.style.minHeight = `${maxHeight1}px`);
  }

  browseCategory1.querySelectorAll(".category-tabs1 button").forEach(button => {
    button.addEventListener("click", function () {
      const tabId1 = this.getAttribute("data-tab");

      browseCategory1.querySelectorAll(".category-tabs1 button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      browseCategory1.querySelectorAll(".category-tab-content1").forEach(tab => tab.classList.remove("active"));
      const targetTab1 = browseCategory1.querySelector(`#${tabId}`);
      targetTab.classList.add("active");

      const targetSlider1 = targetTab1.querySelector('[class*="slider-tab-"]');
      if ($(targetSlider1).hasClass("slick-initialized")) {
        $(targetSlider1).slick("unslick");
      }

      $(targetSlider1).on("setPosition", function () {
        setEqualCardHeights(targetTab1);
      });

      $(targetSlider1).slick({
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
          { breakpoint: 1300, settings: { slidesToShow: 4 }},
          { breakpoint: 1024, settings: { slidesToShow: 3 }},
          { breakpoint: 989,  settings: { slidesToShow: 2 }}
        ]
      });
    });
  });
});