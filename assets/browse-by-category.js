document.addEventListener("DOMContentLoaded", function() {
  // Select ALL browse-category sections instead of just the first one
  let sections = document.querySelectorAll(".browse-category");

  if (sections.length === 0) return;

  function scheduleEqualizeCardHeights(container) {
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

  // Initialize each section independently
  sections.forEach(function(section) {
    let activeTabContent = section.querySelector(".category-tab-content.active");
    let activeSlider = activeTabContent?.querySelector('[class*="slider-tab-"]');

    if (!activeTabContent || !activeSlider) return;

    // Initialize the first active tab's slider
    $(activeSlider).on("setPosition", function() {
      scheduleEqualizeCardHeights(activeTabContent);
    });

    $(activeSlider).slick({
      slidesToShow: 5,
      infinite: true,
      draggable: true,
      cssEase: "linear",
      swipeToSlide: true,
      touchThreshold: 8,
      slidesToScroll: 1,
      arrows: true,
      dots: true,
      responsive: [
        {
          breakpoint: 1300,
          settings: {
            slidesToShow: 4
          }
        },
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 3
          }
        },
        {
          breakpoint: 989,
          settings: {
            slidesToShow: 2
          }
        }
      ]
    });

    // Add click handlers for tabs within THIS section only
    section.querySelectorAll(".category-tabs button").forEach(function(button) {
      button.addEventListener("click", function() {
        let tabId = this.getAttribute("data-tab");

        // Remove active class from buttons in THIS section
        section.querySelectorAll(".category-tabs button").forEach(btn => {
          btn.classList.remove("active");
        });
        this.classList.add("active");

        // Remove active class from tab contents in THIS section
        section.querySelectorAll(".category-tab-content").forEach(content => {
          content.classList.remove("active");
        });

        // Activate the selected tab in THIS section
        let selectedTab = section.querySelector(`#${tabId}`);
        let slider = selectedTab?.querySelector('[class*="slider-tab-"]');

        if (!selectedTab || !slider) return;

        selectedTab.classList.add("active");

        // Destroy existing slick if initialized
        if ($(slider).hasClass("slick-initialized")) {
          $(slider).slick("unslick");
        }

        // Initialize slick for the new tab
        $(slider).on("setPosition", function() {
          scheduleEqualizeCardHeights(selectedTab);
        });

        $(slider).slick({
          slidesToShow: 5,
          slidesToScroll: 1,
          arrows: true,
          swipeToSlide: true,
          touchThreshold: 8,
          dots: true,
          infinite: true,
          draggable: true,
          cssEase: "linear",
          responsive: [
            {
              breakpoint: 1300,
              settings: {
                slidesToShow: 4
              }
            },
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3
              }
            },
            {
              breakpoint: 989,
              settings: {
                slidesToShow: 2
              }
            }
          ]
        });
      });
    });
  });
});
