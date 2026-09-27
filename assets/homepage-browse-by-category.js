// Item 6 (hp-p1): Shop by Category.
// Desktop (>=990px): slick carousel, unchanged from before.
// Mobile (<=989px): no slick — the CSS lays the cards out as a static 2-col tap grid.
// Tab switching and equal card heights work in both modes.
document.addEventListener("DOMContentLoaded", function () {
  const root = document.querySelector(".homepage-browse-category");
  if (!root) return;

  const DESKTOP = window.matchMedia("(min-width: 990px)");

  // Grid-only tiles (e.g. the "All Equipment" tile) must not become slick slides,
  // otherwise the desktop slider would gain a phantom/blank slide. Detach them
  // before initializing slick and restore them when slick is torn down.
  const gridOnlyStore = new WeakMap();

  function detachGridOnly(track) {
    const tiles = Array.from(track.querySelectorAll(".browse-grid-only"));
    if (tiles.length) {
      gridOnlyStore.set(track, tiles);
      tiles.forEach((tile) => tile.remove());
    }
  }

  function attachGridOnly(track) {
    const tiles = gridOnlyStore.get(track);
    if (tiles) tiles.forEach((tile) => track.appendChild(tile));
  }

  function equalizeHeights(track) {
    if (!track) return;
    const cards = track.querySelectorAll(".category-card");
    let max = 0;
    cards.forEach((card) => (card.style.minHeight = "auto"));
    cards.forEach((card) => (max = Math.max(max, card.offsetHeight)));
    cards.forEach((card) => (card.style.minHeight = max + "px"));
  }

  const slickOpts = {
    slidesToShow: 5,
    slidesToScroll: 1,
    infinite: false,
    draggable: true,
    swipeToSlide: true,
    touchThreshold: 8,
    cssEase: "linear",
    arrows: true,
    dots: true,
    responsive: [
      { breakpoint: 1300, settings: { slidesToShow: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
    ],
  };

  function enableSlider(track) {
    if (!track || $(track).hasClass("slick-initialized")) return;
    detachGridOnly(track);
    $(track).on("setPosition", function () {
      equalizeHeights(track);
    });
    $(track).slick(slickOpts);
  }

  function disableSlider(track) {
    if (track && $(track).hasClass("slick-initialized")) {
      $(track).slick("unslick");
      attachGridOnly(track);
    }
  }

  function activeTrack() {
    const panel = root.querySelector(".category-tab-content.active");
    return panel ? panel.querySelector('[class*="slider-tab-"]') : null;
  }

  function applyMode() {
    const track = activeTrack();
    if (!track) return;
    if (DESKTOP.matches) {
      enableSlider(track);
    } else {
      disableSlider(track);
      equalizeHeights(track);
    }
  }

  // Tab switching (works in both slider and grid modes).
  root.querySelectorAll(".category-tabs button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const target = this.getAttribute("data-tab");
      root
        .querySelectorAll(".category-tabs button")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      root
        .querySelectorAll(".category-tab-content")
        .forEach((c) => c.classList.remove("active"));
      const panel = root.querySelector("#" + target);
      if (!panel) return;
      panel.classList.add("active");
      applyMode();
    });
  });

  applyMode();
  window.addEventListener("load", applyMode);

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyMode, 250);
  });
});
