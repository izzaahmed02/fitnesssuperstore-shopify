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
    // Clean the dots navigation - remove tab-related roles
    $('.slick-dots').each(function() {
      // Remove tablist role from the dots container
      $(this).removeAttr('role');
      
      // Clean each list item
      $(this).find('li').each(function() {
        $(this).removeAttr('role');
      });
      
      // Clean each button - remove tab role and controls
      $(this).find('button').each(function() {
        $(this).removeAttr('role');
        $(this).removeAttr('aria-controls');
        $(this).removeAttr('aria-selected');
      });
    });
    
    // Also clean any remaining role attributes from anchor slides
    $carousel.find('a.slick-slide').each(function() {
      $(this).removeAttr('role');
      $(this).removeAttr('aria-describedby');
    });
  }
  
  // Clean attributes immediately after init
  setTimeout(function() {
    cleanAriaAttributes();
  }, 100);
  
  // Clean attributes after slide changes (Slick re-adds them)
  $carousel.on('afterChange', function(event, slick, currentSlide) {
    cleanAriaAttributes();
  });
  
  // Also clean on breakpoint changes
  $carousel.on('breakpoint', function(event, slick, breakpoint) {
    setTimeout(function() {
      cleanAriaAttributes();
    }, 100);
  });
  
});