document.addEventListener('DOMContentLoaded', function () {

    const featuredSliderEl = document.querySelector('.featured-collection__slider.swiper');
    if (!featuredSliderEl) return;

    const slides = featuredSliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return;

    const featuredSwiper = new Swiper(featuredSliderEl, {
        slidesPerView: 'auto',
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.featured-collection .swiper-button-next',
            prevEl: '.featured-collection .swiper-button-prev',
        },
        breakpoints: {
            320: {
                spaceBetween: 10,
                pagination: {
                    el: '.featured-collection .swiper-pagination',
                    clickable: true,
                },
            },
            750: {
                spaceBetween: 20,
            },
        },
    });

    function initSlider(element) {
        if (!$(element).hasClass('slick-initialized')) {
            $(element).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                lazyLoad: 'ondemand',
                arrows: false,
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
        {threshold: 0.8}
    );

    $('.featured-collection .image-wrap').each(function () {
        if ($(this).length > 0) {
            observer.observe(this);
        }
    });
});
