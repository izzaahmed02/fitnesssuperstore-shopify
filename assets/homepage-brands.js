document.addEventListener('DOMContentLoaded', function () {

	const brandSliderEl = document.querySelector('.homepage-brands__slider.swiper');
	if (!brandSliderEl) return;

	const slides = brandSliderEl.querySelectorAll('.swiper-slide');
	if (!slides.length) return;

	const brandSwiper = new Swiper(brandSliderEl, {
		slidesPerView: 'auto',
		observer: true,
		observeParents: true,
		navigation: {
			nextEl: '.homepage-brands__inner .swiper-button-next',
			prevEl: '.homepage-brands__inner .swiper-button-prev',
		},
		breakpoints: {
			320: {
				spaceBetween: 10,
				pagination: {
					el: '.homepage-brands__inner .swiper-pagination',
					clickable: true,
				},
			},
			750: {
				spaceBetween: 20,
			},
		},
	});
});

