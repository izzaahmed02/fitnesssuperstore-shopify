document.addEventListener("DOMContentLoaded", () => {
    /* ===== Scope everything to ONE section ===== */
    const section = document.querySelector(".homepage-categories__tabs");
    if (!section) return;

    /* ---------- shared controls (ONE set) ---------- */
    const controls = section.querySelector(".homepage-categories__swiper-controls");
    const nextEl = controls.querySelector(".swiper-button-next");
    const prevEl = controls.querySelector(".swiper-button-prev");
    const pagination = controls.querySelector(".swiper-pagination");

    /* ---------- tabs & panels ---------- */
    const tabButtons = section.querySelectorAll(".homepage-categories__tab-btn");
    const tabPanels = section.querySelectorAll(".homepage-categories__tab");

    const swipers = {};

    /* ---------- init Swiper for every panel ---------- */
    tabPanels.forEach(panel => {
        const tabName = panel.dataset.tab;
        const swiperEl = panel.querySelector(".swiper");
        if (!swiperEl) return;

        swipers[tabName] = new Swiper(swiperEl, {
            slidesPerView: 4,
            spaceBetween: 32,
            loop: false, // Disabled loop to prevent partial slides
            navigation: { nextEl, prevEl },
            pagination: { el: pagination, clickable: true },
            observer: true,
            observeParents: true,
            breakpoints: {
                320: { slidesPerView: 3, spaceBetween: 16 },
                750: { slidesPerView: 3, spaceBetween: 24 },
                992: { slidesPerView: 4, spaceBetween: 32 }
            }
        });
    });

    /* ---------- helper to switch visible tab ---------- */
    function activateTab(tabName) {
        tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabName));
        tabPanels.forEach(panel => panel.classList.toggle("homepage-categories__tab-active", panel.dataset.tab === tabName));

        // Refresh shared controls for the newly-visible slider
        swipers[tabName].update();
        swipers[tabName].slideTo(0, 0); // Jump to first slide
    }

    /* ---------- click handler ---------- */
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });

    /* ---------- show first tab on load ---------- */
    const first = tabButtons[0];
    if (first) activateTab(first.dataset.tab);
});