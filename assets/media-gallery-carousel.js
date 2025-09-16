function initMediaGalleryCarousel() {
  const $carousel = document.querySelector(".js-media-gallery-carousel");
  if (
    !$carousel ||
    typeof jQuery === "undefined" ||
    typeof jQuery.fn.slick !== "function"
  )
    return;

  jQuery($carousel).slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    speed: 300,
    arrows: true,
    variableWidth: true,
    swipeToSlide: true,
    dots: false,
    infinite: false,
    responsive: [
      {
        breakpoint: 750,
        settings: { slidesToShow: 2, arrows: false },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1, arrows: false },
      },
    ],
  });
}

function waitForSlick(callback, attempts = 20, interval = 200) {
  const intervalId = setInterval(() => {
    const isReady =
      typeof jQuery !== "undefined" && typeof jQuery.fn.slick === "function";

    if (isReady) {
      clearInterval(intervalId);
      callback();
    } else if (attempts <= 1) {
      clearInterval(intervalId);
      console.warn("⚠️ Slick not found. Carousel not initialized.");
    }

    attempts--;
  }, interval);
}

document.addEventListener("DOMContentLoaded", () => {
  waitForSlick(initMediaGalleryCarousel);
});
