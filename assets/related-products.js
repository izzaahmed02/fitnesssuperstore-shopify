document.addEventListener('DOMContentLoaded', function () {
  function initSlickSlider($container) {
    if ($container.length && !$container.hasClass('slick-initialized')) {
      $container.slick({
        dots: false,
        arrows: true,
        infinite: false,
        autoplay: false,
        draggable: false,
        slidesToShow: 4,
        slidesToScroll: 1,
        responsive: [
          {
            breakpoint: 1300,
            settings: { slidesToShow: 4 },
          },
          {
            breakpoint: 1024,
            settings: { slidesToShow: 3 },
          },
          {
            breakpoint: 989,
            settings: {
              slidesToShow: 2,
              dots: true,
              draggable: false,
              swipe: false,
              touchMove: false,
            },
          },
        ],
      });
    }
  }

  // 1. INIT on DOMContentLoaded (SSR fallback)
  const $initial = $('.related-products .featured_products_container');
  initSlickSlider($initial);

  // 2. INIT when section loads dynamically (AJAX)
  document.addEventListener('shopify:section:load', function (event) {
    const el = event.target.querySelector('.related-products .featured_products_container');
    if (el) {
      const $el = $(el);
      initSlickSlider($el);
    }
  });
});
