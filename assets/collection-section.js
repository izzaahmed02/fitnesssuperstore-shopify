document.addEventListener("DOMContentLoaded", function () {

	function addScrollArrowsIfNeeded() {
		const wrapper = document.querySelector('.collection-hero__related-collections-wrapper');
		const list = document.querySelector('.collection-hero__related-collections');
		if (!wrapper || !list) return;

		if (list.scrollWidth > wrapper.clientWidth) {
			const leftArrow = document.createElement('button');
			leftArrow.className = 'collection-nav-arrow left';
			leftArrow.innerHTML = '<svg width="24" height="24" style="transform: rotate(-180deg)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
				'    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="white"></path>\n' +
				'</svg>';

			const rightArrow = document.createElement('button');
			rightArrow.className = 'collection-nav-arrow right';
			rightArrow.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
				'    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z" fill="white"></path>\n' +
				'</svg>';

			leftArrow.onclick = () => {
				const children = Array.from(list.children);
				const firstVisible = children.find(el => el.offsetLeft + el.offsetWidth > list.scrollLeft);
				if (firstVisible) list.scrollLeft -= firstVisible.offsetWidth;
			};

			rightArrow.onclick = () => {
				const children = Array.from(list.children);
				const firstVisible = children.find(el => el.offsetLeft > list.scrollLeft);
				if (firstVisible) list.scrollLeft += firstVisible.offsetWidth;
			};

			wrapper.appendChild(leftArrow);
			wrapper.appendChild(rightArrow);
		}
	}

	addScrollArrowsIfNeeded();


	const perPageSelect = document.querySelector('.sort-per-page select.num');
	if (perPageSelect) {
		perPageSelect.addEventListener('change', function () {
			const url = new URL(window.location.href);
			url.searchParams.delete('page');
			url.searchParams.set('view', this.value.split('=')[1]);
			window.location.replace(url.toString());
		});
	}

	/**
	 * Initialize Slick slider if there are multiple images inside the element.
	 * @param {HTMLElement} element - The slider container element.
	 */

	function initSlider(element) {
		const images = element.querySelectorAll('img.lazy-load');
		if (images.length > 1) {
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
		images.forEach(img => {
			img.src = img.dataset.src;
			img.classList.remove('lazy-load');
			img.style.opacity = '1';
			img.style.visibility = 'visible';
		});

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

	const sliderObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				initSlider(entry.target);
				observer.unobserve(entry.target);
			}
		});
	}, {threshold: 0.3});
	document.querySelectorAll('.image-wrap').forEach(imageWrap => {
		sliderObserver.observe(imageWrap);
	});
});

document.addEventListener('click', function (e) {
	const productItem = e.target.closest('.product-item');
	if (productItem) {
		const link = productItem.querySelector('a.title');
		link.click();
	}



});
