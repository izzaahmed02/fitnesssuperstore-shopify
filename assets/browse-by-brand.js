// Wait for DOM to be ready
$(document).ready(function() {
  
  // Initialize Slick carousel
  var $carousel = $(".browse-brand .category-tab-content");
  
  $carousel.slick({
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
  
  // Function to clean ARIA attributes
  function cleanAriaAttributes() {
    // Remove invalid role from all anchor slides
    $carousel.find('a.slick-slide').each(function() {
      $(this).removeAttr('role').removeAttr('aria-describedby');
    });
    
    // Clean up dots
    $carousel.siblings('.slick-dots').each(function() {
      $(this).removeAttr('role');
      $(this).find('li').removeAttr('role');
      $(this).find('button').each(function() {
        $(this).removeAttr('role').removeAttr('aria-controls').removeAttr('aria-selected');
      });
    });
  }
  
  // Clean attributes immediately after init
  cleanAriaAttributes();
  
  // Clean attributes after slide changes (Slick re-adds them)
  $carousel.on('afterChange', function(event, slick, currentSlide) {
    cleanAriaAttributes();
  });
  
  // Also clean on init event
  $carousel.on('init', function(event, slick) {
    cleanAriaAttributes();
  });
  
});