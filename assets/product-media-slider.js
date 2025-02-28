document.addEventListener('DOMContentLoaded', async function () {
  const initSlick = () => {
    const mainOptions = {
      slidesToShow: 1,
      slidesToScroll: 1,
      mobileFirst: true,
      arrows: true,
      dots: true,
      prevArrow: '.main-slider-arrow--left',
      nextArrow: '.main-slider-arrow--right',
      fade: true,
      responsive: [
        {
          breakpoint: 1200,
          settings: {
            dots: false,
            asNavFor: '.thumbnail-slider',
          },
        },
      ],
    };

    $('.main-slider').slick(mainOptions);

    const thumbnailOptions = {
      slidesToShow: 5,
      slidesToScroll: 1,
      vertical: true,
      asNavFor: '.main-slider',
      arrows: false,
      dots: false,
      centerMode: false,
      focusOnSelect: true,
    };

    if (window.matchMedia('(min-width: 1200px)').matches) {
      $('.thumbnail-slider').slick(thumbnailOptions);
    }

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 1200px)').matches) {
        if (!$('.thumbnail-slider').hasClass('slick-initialized')) {
          $('.thumbnail-slider').slick(thumbnailOptions);
        }
      } else {
        if ($('.thumbnail-slider').hasClass('slick-initialized')) {
          $('.thumbnail-slider').slick('unslick');
        }
      }
    });
  };

  function waitFor(predicate) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (!predicate()) return;
        clearInterval(interval);
        resolve();
        setTimeout(() => {
          initSlick();
        }, 150);
      };
      const interval = setInterval(check, 100);
      check();
    });
  }

  await waitFor(() => window.$);
});
