document.addEventListener('DOMContentLoaded', function() {
  function initHeroCarousel() {
    const $questions = $('.homepageHeroSection .questions');

    if (window.innerWidth <= 768) {
      if (!$questions.hasClass('slick-initialized')) {
        $questions.slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true,
          centerPadding: '40px',
          arrows: false,
          dots: true,
          infinite: true,
          autoplay: false,
          responsive: [
            {
              breakpoint: 480,
              settings: {
                centerPadding: '30px'
              }
            }
          ]
        });
      }
    } else if ($questions.hasClass('slick-initialized')) {
      $questions.slick('unslick');
    }
  }

  initHeroCarousel();

  let resizeTimer;
  $(window).on('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      initHeroCarousel();
    }, 250);
  });
});
