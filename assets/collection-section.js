document.addEventListener("DOMContentLoaded", function () {
	// Select the per-page sort dropdown
	const perPageSelect = document.querySelector('.sort-per-page select.num');

	if (perPageSelect) {
		perPageSelect.addEventListener('change', function () {
			const url = new URL(window.location.href);
			url.searchParams.delete('page'); // Remove page parameter
			url.searchParams.set('view', this.value.split('=')[1]); // Set new view parameter
			window.location.replace(url.toString()); // Redirect to new URL
		});
	}

	/**
	 * Initialize Slick slider if there are multiple images inside the element.
	 * @param {HTMLElement} element - The slider container element.
	 */
	function initSlider(element) {
		const images = element.querySelectorAll('img.lazy-load');

		if (images.length > 1) {
			// If there are multiple images, initialize the slider
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
							slidesToShow: 1
						}
					}
				],
			});
		}

		// Lazy load images
		images.forEach(img => {
			img.src = img.dataset.src;
			img.classList.remove('lazy-load');
			img.style.opacity = '1';
			img.style.visibility = 'visible';
		});

		// Process review containers
		document.querySelectorAll('.main-review-container').forEach(element => {
			const reviewInterval = setInterval(() => {
				const starContainer = element.querySelector('.star_container div');
				const reviewContainer = element.querySelector('.review-container');

				if (starContainer) {
					const starsCount = starContainer.querySelectorAll('.on')?.length || 0;
					const reviewCount = starContainer.querySelector('.ind_cnt_num')?.textContent || '0';
					const reviewText = starContainer.querySelector('.ind_cnt_desc')?.textContent || '';

					if (reviewContainer) {
						const reviewsRatingSpan = reviewContainer.querySelector('.reviews-count');
						const starRatingCount = reviewContainer.querySelector('.star-count');

						if (reviewsRatingSpan) {
							reviewsRatingSpan.textContent = `(${reviewCount} ${reviewText})`;
						}
						if (starRatingCount) {
							starRatingCount.textContent = starsCount.toFixed(1);
						}
					}

					element.style.display = 'block';
					clearInterval(reviewInterval);
				}
			}, 100);
		});
	}

	/**
	 * Intersection Observer for lazy loading sliders when they appear in the viewport.
	 */
	const sliderObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				initSlider(entry.target);
				observer.unobserve(entry.target); // Stop observing once initialized
			}
		});
	}, {threshold: 0.3});

	// Observe each image wrap container
	document.querySelectorAll('.image-wrap').forEach(imageWrap => {
		sliderObserver.observe(imageWrap);
	});
});
