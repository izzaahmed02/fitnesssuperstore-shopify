const tabButtons = document.querySelectorAll(".homepage-categories__tab-btn");
const tabPanels = document.querySelectorAll(".homepage-categories__tab");


const swipers = {};

tabButtons.forEach(btn => {
	btn.addEventListener("click", () => {
		tabButtons.forEach(b => b.classList.remove("active"));
		tabPanels.forEach(panel => panel.classList.remove("homepage-categories__tab-active"));

		btn.classList.add("active");
		const targetTab = btn.dataset.tab;
		const activePanel = document.querySelector(`.homepage-categories__tab[data-tab="${targetTab}"]`);
		if (activePanel) {
			activePanel.classList.add("homepage-categories__tab-active");
		}

		if (!swipers[targetTab]) {
			const swiperContainer = activePanel.querySelector(".swiper");
			if (!swiperContainer) return;

			swipers[targetTab] = new Swiper(swiperContainer, {
				slidesPerView: 'auto',
				spaceBetween: 32,
				loop: true,
				autoplay: {
					speed: 2000,
					pauseOnMouseEnter: true,
				},
				observer: true,
				observeParents: true,
				breakpoints: {
					375: {
						spaceBetween: 16,
						pagination: {
							el: '.homepage-categories__swiper-controls .swiper-pagination',
							clickable: true,
						},
						navigation: {
							nextEl: '.homepage-categories__swiper-controls .swiper-button-next',
							prevEl: '.homepage-categories__swiper-controls .swiper-button-prev',
						},
						autoplay: false,
						loop: false,
					},
					992: {
						spaceBetween: 32,
					}
				}
			});
		} else {
			swipers[targetTab].update();
		}
	});
});

const firstTabBtn = document.querySelector(".homepage-categories__tab-btn.active");
if (firstTabBtn) {
	firstTabBtn.click();
}

