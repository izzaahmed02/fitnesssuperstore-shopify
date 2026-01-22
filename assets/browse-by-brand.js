// Initialize Slick carousel with your existing configuration
$(".browse-brand .category-tab-content").slick({
  dots: true,
  infinite: true,
  draggable: true,
  cssEase: "linear",
  swipeToSlide: true,
  touchThreshold: 8,
  slidesToShow: 5,
  slidesToScroll: 1,
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

// Remove invalid ARIA roles from slides after Slick initialization
$(".browse-brand .category-tab-content .slick-slide").each(function() {
  $(this).removeAttr('role');
  $(this).removeAttr('aria-describedby');
});

// Remove tab-related ARIA from dots
$(".browse-brand .category-tab-content").parent().find('.slick-dots').each(function() {
  // Remove role="tablist" from the dots container
  $(this).removeAttr('role');
  
  // Remove role="presentation" and tab-related attributes from list items
  $(this).find('li').each(function() {
    $(this).removeAttr('role');
  });
  
  // Update buttons to be simple navigation buttons instead of tabs
  $(this).find('button').each(function() {
    $(this).removeAttr('role');
    $(this).removeAttr('aria-controls');
    $(this).removeAttr('aria-selected');
  });
});