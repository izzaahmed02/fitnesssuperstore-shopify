const $slider = $(".browse-by-brand .category-tab-content");

$slider.on("init", function () {
  // Remove tab semantics Slick applies to slides
  $slider.find(".slick-slide")
    .removeAttr("role")
    .removeAttr("aria-describedby")
    .removeAttr("aria-controls");
});

$slider.slick({
  dots: true,
  infinite: true,
  draggable: false,
  cssEase: "linear",
  swipeToSlide: true,
  touchThreshold: 8,
  slidesToShow: 5,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1300, settings: { slidesToShow: 4 } },
    { breakpoint: 1024, settings: { slidesToShow: 3 } },
    { breakpoint: 989, settings: { slidesToShow: 2, swipeToSlide: true, touchThreshold: 8 } }
  ]
});
