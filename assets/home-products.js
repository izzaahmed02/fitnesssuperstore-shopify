 document.addEventListener('DOMContentLoaded', function () {

    function initSlider(element) {
      if (!$(element).hasClass('slick-initialized')) {
        $(element).slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          lazyLoad: 'progressive',
          arrows: true,
            dots: true,
          responsive: [
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
              },
            },
          ],
        });

        $(element)
          .find('.image-item')
          .each(function () {
          });
        $(element)
          .find('img.lazy-load')
          .each(function () {
            const img = $(this);
            if (img) {
              img.attr('src', img.data('src'));
              img.removeClass('lazy-load');
              img.css({
                opacity: '1',
                visibility: 'visible',
              });
            }
          });
      }
    }

    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initSlider(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.8 }
    );

    $('.image-wrap').each(function () {
      if ($(this).length > 0) {
        observer.observe(this);
      }
    });



    $('.home-products .featured_products_container').slick({
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
              settings: {
                slidesToShow: 4,
              },
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
              },
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
          ]
});


    
  });