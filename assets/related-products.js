 document.addEventListener('DOMContentLoaded', function () {

    function initSlider(element) {
      if (!$(element).hasClass('slick-initialized')) {
        $(element).slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          lazyLoad: 'progressive',
          arrows: false,
          prevArrow: '<button type="button" class="slick-prev"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.8232 17.7626 14.8232 18.2374 14.5303 18.5303C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967Z" fill="black"/></svg></button>',
          nextArrow: '<button type="button" class="slick-next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="black"/></svg></button>',
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



    $('.related-products .related-products-carousel').slick({
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