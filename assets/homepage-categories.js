document.addEventListener("DOMContentLoaded", () => {
	/* ===== Scope everything to ONE section ===== */
	const section   = document.querySelector(".homepage-categories__tabs");   // wrapper
	if (!section) return;

	/* ---------- shared controls (ONE set) ---------- */
	const controls  = section.querySelector(".homepage-categories__swiper-controls");
	const nextEl    = controls.querySelector(".swiper-button-next");
	const prevEl    = controls.querySelector(".swiper-button-prev");
	const pagination= controls.querySelector(".swiper-pagination");

	/* ---------- tabs & panels ---------- */
	const tabButtons= section.querySelectorAll(".homepage-categories__tab-btn");
	const tabPanels = section.querySelectorAll(".homepage-categories__tab");

	const swipers = {};       // store each instance by tab name

	/* ---------- init Swiper for every panel ---------- */
	tabPanels.forEach(panel => {
		const tabName = panel.dataset.tab;              // “tab1”, “tab2” …
		const swiperEl= panel.querySelector(".swiper"); // the container inside that tab
		if (!swiperEl) return;

		swipers[tabName] = new Swiper(swiperEl, {
			slidesPerView : "auto",
			spaceBetween  : 32,
			loop          : true,        // keep if you want looping
			/*   turn OFF autoplay – remove this block if you want auto‑scroll   */
			// autoplay      : {
			//     delay : 2000,
			//     pauseOnMouseEnter : true,
			// },
			navigation    : { nextEl, prevEl },
			pagination    : { el: pagination, clickable: true },
			observer      : true,
			observeParents: true,
			breakpoints   : {
				375 : { spaceBetween: 16, loop: false },
				992 : { spaceBetween: 32 }
			}
		});
	});

	/* ---------- helper to switch visible tab ---------- */
	function activateTab(tabName) {
		tabButtons.forEach(btn   => btn.classList.toggle("active", btn.dataset.tab === tabName));
		tabPanels .forEach(panel => panel.classList.toggle("homepage-categories__tab-active",
			panel.dataset.tab === tabName));

		// refresh shared controls for the newly‑visible slider
		swipers[tabName].update();
		swipers[tabName].slideToLoop(0, 0);           // jump to first slide so pagination count matches
	}

	/* ---------- click handler ---------- */
	tabButtons.forEach(btn => {
		btn.addEventListener("click", () => activateTab(btn.dataset.tab));
	});

	/* ---------- show first tab on load ---------- */
	const first = tabButtons[0];
	if (first) activateTab(first.dataset.tab);
});


/*
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
				slidesPerView: '4',
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
                      slidesPerView: '3',
					},
                  1200: {
						spaceBetween: 16,
                      slidesPerView: '4',
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

*/