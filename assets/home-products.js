 document.addEventListener('DOMContentLoaded', function () {

    function initSlider(element) {
      if (!$(element).hasClass('slick-initialized')) {
        $(element).slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          lazyLoad: 'progressive',
          arrows: true,
         	prevArrow: '<button type="button" class="slick-prev"><svg width="16" height="16" style="transform: rotate(-180deg)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
					'    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="#F1592A"></path>\n' +
					'</svg></button>',
				nextArrow: '<button type="button" class="slick-next"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
					'    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="#F1592A"></path>\n' +
					'</svg></button>',
          dots: true,
           draggable: false,
                swipe: false,
                touchMove: false,
          responsive: [
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
                 draggable: true,
                swipe: true,
                touchMove: true,
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
  draggable: true,
      swipeToSlide: true,         // ✅ smoother swipe
  touchThreshold: 4,   
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
                draggable: true,
                swipe: true,
                touchMove: true,
              },
            },
          ]
});


    
  });