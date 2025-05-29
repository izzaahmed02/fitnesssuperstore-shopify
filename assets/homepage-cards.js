document.addEventListener('DOMContentLoaded', function () {

    const cardsSliderEl = document.querySelector('.homepage-cards__slider.swiper');
    if (!cardsSliderEl) return;

    const slides = cardsSliderEl.querySelectorAll('.swiper-slide');
    if (!slides.length) return;

    const cardsSwiper = new Swiper(cardsSliderEl, {
        slidesPerView: 'auto',
        observer: true,
        observeParents: true,
        pagination: {
            el: '.homepage-cards__slider-controls .swiper-pagination',
            clickable: true,
        },
    });
});
