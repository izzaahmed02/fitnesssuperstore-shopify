document.addEventListener('DOMContentLoaded', () => {
	const relatedProductsUl = document.querySelector('.related-products');
	if (!relatedProductsUl) return;

	/**
	 * Выравнивает высоту только для внешнего слайдера, выбирая прямых детей.
	 */
	const equalizeOuterSlideHeights = () => {
		const $outerSlider = $('.related-products-carousel');
		if (!$outerSlider.length) return;
		// Ищем все li внутри слайдера, исключая slick-клоны
		const $outerSlides = $outerSlider.find('li.related-products__item:not(.slick-cloned)');
		$outerSlides.css('height', 'auto');
		let maxHeight = 0;
		$outerSlides.each(function () {
			const h = $(this).outerHeight();
			if (h > maxHeight) {
				maxHeight = h;
			}
		});
		$outerSlides.css('height', maxHeight + 'px');
	};


	/**
	 * Инициализация слайдера для изображений внутри карточки.
	 * Если слайдов меньше или равно одному – инициализация не производится.
	 */
	const initSlider = (element) => {
		let slides = $(element).find('.image-item');
		if (!slides.length) {
			slides = $(element).children();
		}
		if (slides.length <= 1) return;

		if (!$(element).hasClass('slick-initialized')) {
			$(element).slick({
				slidesToShow: 1,
				slidesToScroll: 1,
				lazyLoad: 'ondemand',
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
	};

	/**
	 * Настройка IntersectionObserver для ленивой инициализации внутренних слайдеров.
	 */
	const setupIntersectionObserver = () => {
		const observer = new IntersectionObserver(
			(entries, observer) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						initSlider(entry.target);
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.5 }
		);

		$('.image-wrap').each(function () {
			if ($(this).length > 0) {
				observer.observe(this);
			}
		});
	};

	/**
	 * Инициализирует внешний слайдер-карусель для связанных продуктов
	 * и вызывает выравнивание высот только для его слайдов.
	 */
	const setupCarousel = () => {
		const relatedProductsOptions = {
			infinite: false,
			slidesToShow: 4,
			slidesToScroll: 1,
			prevArrow: $('.slick-prev'),
			nextArrow: $('.slick-next'),
			arrows: true,
			dots: false,
			draggable: false,
		};

		if (window.matchMedia('(min-width: 990px)').matches) {
			$('.related-products-carousel').slick(relatedProductsOptions);

			$('.related-products-carousel').on('afterChange', function (event, slick, currentSlide) {
				const $prev = $('.slick-prev');
				const $next = $('.slick-next');

				if (currentSlide !== 0) {
					$prev.removeClass('slick-disabled');
				}
				if (currentSlide === slick.slideCount - slick.options.slidesToShow) {
					$next.addClass('slick-disabled');
				} else {
					$next.removeClass('slick-disabled');
				}
				// Выравниваем высоту только внешнего слайдера
				equalizeOuterSlideHeights();
			});

			// Выравниваем сразу после инициализации
			equalizeOuterSlideHeights();
		}

		window.addEventListener('resize', () => {
			if (window.matchMedia('(min-width: 990px)').matches) {
				if (!$('.related-products-carousel').hasClass('slick-initialized')) {
					$('.related-products-carousel').slick(relatedProductsOptions);
					$('.related-products > ul').on('afterChange', function (event, slick, currentSlide) {
						const $prev = $('.slick-prev');
						const $next = $('.slick-next');

						if (currentSlide !== 0) {
							$prev.removeClass('slick-disabled');
						}
						if (currentSlide === slick.slideCount - slick.options.slidesToShow) {
							$next.addClass('slick-disabled');
						} else {
							$next.removeClass('slick-disabled');
						}
						equalizeOuterSlideHeights();
					});
				}
				equalizeOuterSlideHeights();
			} else {
				if ($('.related-products-carousel').hasClass('slick-initialized')) {
					$('.related-products-carousel').slick('unslick');
				}
			}
		});
	};

	const mutationCallback = (mutationsList) => {
		mutationsList.forEach((mutation) => {
			if (mutation.type === 'childList') {
				setupIntersectionObserver();
				setupCarousel();
			}
		});
	};

	const observerConfig = {
		childList: true,
		attributes: false,
		subtree: false,
	};

	const mutationObserver = new MutationObserver(mutationCallback);
	mutationObserver.observe(relatedProductsUl, observerConfig);
});
