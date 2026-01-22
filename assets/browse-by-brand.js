$(".browse-brand .category-tab-content").slick({
  dots: true,
  infinite: true,
  draggable: true,
  cssEase: "linear",
  swipeToSlide: true,
  touchThreshold: 8,
  slidesToShow: 5,
  slidesToScroll: 1,
  // Add these accessibility settings to fix the role issue
  accessibility: true,
  slidesPerRow: 1,
  // Remove the tabpanel role that Slick adds by default
  slide: 'a',
  responsive: [
    {
      breakpoint: 1300,
      settings: {
        slidesToShow: 4
      }
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 989,
      settings: {
        slidesToShow: 2,
        swipeToSlide: true,
        touchThreshold: 8
      }
    }
  ]
});

// After initialization, remove the invalid role attributes
$(".browse-brand .category-tab-content .slick-slide").removeAttr("role");