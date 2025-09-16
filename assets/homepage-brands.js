document.addEventListener('DOMContentLoaded', function () {

	const brandSliderEl = document.querySelector('.homepage-brands__slider.swiper');
	if (!brandSliderEl) return;

	const slides = brandSliderEl.querySelectorAll('.swiper-slide');
	if (!slides.length) return;

	const brandSwiper = new Swiper(brandSliderEl, {
		slidesPerView: 'auto',
		spaceBetween: 32,
		speed: 600,
		navigation: {
			nextEl: '.homepage-brands__inner .homepage-brands__slider-btn.swiper-button-next',
			prevEl: '.homepage-brands__inner .homepage-brands__slider-btn.swiper-button-prev'
		},

		breakpoints: {
			375: {
				spaceBetween: 16,
				pagination: {
					el: '.homepage-brands__inner  .swiper-pagination',
					clickable: true,
				},
			},
			992: {
				spaceBetween: 32,
				pagination: false,
			},
		},
		observer: true,
		observeParents: true,
	});
});

