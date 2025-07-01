document.addEventListener("DOMContentLoaded", function () {
  const reviewsSection = document.querySelector(".reviewsHome");
  if (!reviewsSection) return;

  const firstTab = reviewsSection.querySelector(".category-tab-content.active");
  const firstSlider = firstTab.querySelector('[class*="slider-tab-"]');

  $(firstSlider).on("setPosition", function () {
    setEqualCardHeights(firstTab);
  });

  $(firstSlider).slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    infinite: false,
    responsive: [
      { breakpoint: 1300, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 989, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: "unslick" } // Unslick at 768px
    ]
  });

  function setEqualCardHeights(container) {
    const cards = container.querySelectorAll(".category-card");
    let maxHeight = 0;
    cards.forEach(card => card.style.minHeight = "auto");
    cards.forEach(card => {
      const height = card.offsetHeight;
      if (height > maxHeight) maxHeight = height;
    });
    cards.forEach(card => card.style.minHeight = `${maxHeight}px`);
  }

  reviewsSection.querySelectorAll(".category-tabs button").forEach(button => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      reviewsSection.querySelectorAll(".category-tabs button").forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");

      reviewsSection.querySelectorAll(".category-tab-content").forEach(tab => tab.classList.remove("active"));
      const targetTab = reviewsSection.querySelector(`#${tabId}`);
      targetTab.classList.add("active");

      const targetSlider = targetTab.querySelector('[class*="slider-tab-"]');
      if ($(targetSlider).hasClass("slick-initialized")) {
        $(targetSlider).slick("unslick");
      }

      $(targetSlider).on("setPosition", function () {
        setEqualCardHeights(targetTab);
      });

      $(targetSlider).slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        infinite: false,
        responsive: [
          { breakpoint: 1300, settings: { slidesToShow: 3 } },
          { breakpoint: 1024, settings: { slidesToShow: 3 } },
          { breakpoint: 989, settings: { slidesToShow: 2 } },
          { breakpoint: 768, settings: "unslick" } // Unslick at 768px
        ]
      });

      // Recalculate Read More visibility for the new tab
      targetTab.querySelectorAll('.category-card').forEach(card => {
        const copy = card.querySelector('.homepage-reviews__item-copy');
        const button = card.querySelector('.homepage-reviews__item-copy-btn');
        if (copy && button) {
          shouldShowReadMore(copy, button);
        }
      });
    });
  });

  // Read More / Read Less toggle
  reviewsSection.querySelectorAll('.homepage-reviews__item-copy-btn').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const copy = this.previousElementSibling;
      if (copy.classList.contains('expanded')) {
        copy.classList.remove('expanded');
        this.textContent = 'Read More';
      } else {
        copy.classList.add('expanded');
        this.textContent = 'Read Less';
      }
    });
  });

  // Show/Hide "Read More" buttons only if content exceeds 3 lines
  function shouldShowReadMore(copyEl, buttonEl) {
    const clone = copyEl.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.webkitLineClamp = 'unset';
    clone.style.display = '-webkit-box';
    clone.style.webkitBoxOrient = 'vertical';
    clone.style.width = copyEl.offsetWidth + 'px';
    clone.style.maxHeight = 'none';
    document.body.appendChild(clone);

    const fullHeight = clone.offsetHeight;
    const lineHeight = parseFloat(getComputedStyle(copyEl).lineHeight);
    const threeLineHeight = lineHeight * 3;
    document.body.removeChild(clone);

    if (fullHeight > threeLineHeight) {
      buttonEl.style.display = 'inline-block';
    } else {
      buttonEl.style.display = 'none';
    }
  }

  // Initial run for visible cards
  reviewsSection.querySelectorAll('.category-tab-content.active .category-card').forEach(card => {
    const copy = card.querySelector('.homepage-reviews__item-copy');
    const button = card.querySelector('.homepage-reviews__item-copy-btn');
    if (copy && button) {
      shouldShowReadMore(copy, button);
    }
  });
});