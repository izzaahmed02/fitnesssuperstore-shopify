document.addEventListener("DOMContentLoaded", function () {
    let section = document.querySelector(".popular-eqpt");
    if (!section) return;

    function scheduleEqualCardHeights(container) {
        if (!container) return;

        if (container.__equalizeFrame) {
            cancelAnimationFrame(container.__equalizeFrame);
        }

        container.__equalizeFrame = requestAnimationFrame(() => {
            let cards = Array.from(container.querySelectorAll(".category-card"));
            if (!cards.length) return;

            cards.forEach((card) => {
                card.style.minHeight = "auto";
            });

            requestAnimationFrame(() => {
                let maxHeight = cards.reduce((tallest, card) => {
                    return Math.max(tallest, card.getBoundingClientRect().height);
                }, 0);

                cards.forEach((card) => {
                    card.style.minHeight = maxHeight ? `${maxHeight}px` : "";
                });
            });
        });
    }

    let activeTab = section.querySelector(".category-tab-content.active");
    let activeSlider = activeTab?.querySelector('[class*="slider-tab-"]');

    if (!activeTab || !activeSlider) return;

    $(activeSlider).on("setPosition", function () {
        scheduleEqualCardHeights(activeTab);
    });

    $(activeSlider).slick({
        slidesToShow: 4,
        infinite: !0,
        draggable: !0,
        cssEase: "linear",
        swipeToSlide: !0,
        touchThreshold: 8,
        slidesToScroll: 1,
        arrows: !0,
        dots: !0,
        responsive: [
            { breakpoint: 1300, settings: { slidesToShow: 4 } },
            { breakpoint: 1024, settings: { slidesToShow: 3 } },
            { breakpoint: 989, settings: { slidesToShow: 2 } },
        ],
    });

    section.querySelectorAll(".category-tabs-fitness button").forEach((button) => {
        button.addEventListener("click", function () {
            let tabId = this.getAttribute("data-tab");
            section.querySelectorAll(".category-tabs-fitness button").forEach((tabButton) => tabButton.classList.remove("active"));
            this.classList.add("active");
            section.querySelectorAll(".category-tab-content").forEach((tabContent) => tabContent.classList.remove("active"));
            let selectedTab = section.querySelector(`#${tabId}`);
            let selectedSlider = selectedTab?.querySelector('[class*="slider-tab-"]');

            if (!selectedTab || !selectedSlider) return;

            selectedTab.classList.add("active");

            if ($(selectedSlider).hasClass("slick-initialized")) {
                $(selectedSlider).slick("unslick");
            }

            $(selectedSlider).on("setPosition", function () {
                scheduleEqualCardHeights(selectedTab);
            });

            $(selectedSlider).slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                arrows: !0,
                swipeToSlide: !0,
                touchThreshold: 8,
                dots: !0,
                infinite: !0,
                draggable: !0,
                cssEase: "linear",
                responsive: [
                    { breakpoint: 1300, settings: { slidesToShow: 4 } },
                    { breakpoint: 1024, settings: { slidesToShow: 3 } },
                    { breakpoint: 989, settings: { slidesToShow: 2 } },
                ],
            });
        });
    });
});
