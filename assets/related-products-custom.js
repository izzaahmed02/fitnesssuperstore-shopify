document.addEventListener('DOMContentLoaded', function () {
  const relatedProductsUl = document.querySelector('.related-products');

  if (relatedProductsUl) {
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === 'childList') {
          function initSlider(element) {
            if (!$(element).hasClass('slick-initialized')) {
              $(element).slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                lazyLoad: 'ondemand',
                arrows: true,
                dots: true,
                responsive: [
                  {
                    breakpoint: 768,
                    settings: {
                      slidesToShow: 1,
                    },
                  },
                ],
              });

              $(element)
                .find('.image-item')
                .each(function () {
                  $(this).css({
                    background: '#edeff3',
                  });
                });
              $(element)
                .find('img.lazy-load')
                .each(function () {
                  const img = $(this);
                  if (img) {
                    img.attr('src', img.data('src'));
                    img.removeClass('lazy-load');
                    img.css({
                      opacity: '1',
                      visibility: 'visible',
                    });
                  }
                });
            }
          }

          const observer = new IntersectionObserver(
            (entries, observer) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  initSlider(entry.target);
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.5 },
          );

          $('.image-wrap').each(function () {
            if ($(this).length > 0) {
              observer.observe(this);
            }
          });

          const relatedProductsOptions = {
            infinite: false,
            slidesToShow: 4,
            slidesToScroll: 1,
            prevArrow: $('.slick-prev'),
            nextArrow: $('.slick-next'),
            arrows: true,
            dots: false,
            draggable: false,
          };

          if (window.matchMedia('(min-width: 990px)').matches) {
            $('.related-products-carousel').slick(relatedProductsOptions);

            $('.related-products-carousel').on(
              'afterChange',
              function (event, slick, currentSlide) {
                const $prev = $('.slick-prev');
                const $next = $('.slick-next');

                if (currentSlide === 0) {
                } else {
                  $prev.removeClass('slick-disabled');
                }

                if (
                  currentSlide ===
                  slick.slideCount - slick.options.slidesToShow
                ) {
                  $next.addClass('slick-disabled');
                } else {
                  $next.removeClass('slick-disabled');
                }
              },
            );
          }

          window.addEventListener('resize', () => {
            if (window.matchMedia('(min-width: 990px)').matches) {
              if (
                !$('.related-products-carousel').hasClass('slick-initialized')
              ) {
                $('.related-products-carousel').slick(relatedProductsOptions);

                $('.related-products > ul').on(
                  'afterChange',
                  function (event, slick, currentSlide) {
                    const $prev = $('.slick-prev');
                    const $next = $('.slick-next');

                    if (currentSlide === 0) {
                    } else {
                      $prev.removeClass('slick-disabled');
                    }

                    if (
                      currentSlide ===
                      slick.slideCount - slick.options.slidesToShow
                    ) {
                      $next.addClass('slick-disabled');
                    } else {
                      $next.removeClass('slick-disabled');
                    }
                  },
                );
              }
            } else {
              if (
                $('.related-products-carousel').hasClass('slick-initialized')
              ) {
                $('.related-products-carousel').slick('unslick');
              }
            }
          });

          $('.related-products').css('height', 'auto');
          $('.related-products').css('overflow-y', 'visible');

          const itemsContainer = document.querySelector(
            '.related-products .related-products__list',
          );
          const loadMoreButton = document.querySelector(
            '.related-products .load-more',
          );
          const items = [
            ...document.querySelectorAll(
              '.related-products .related-products__item',
            ),
          ];

          const ITEMS_PER_LOAD = 4;
          let currentVisibleCount = 0;
          let isInitialized = false;

          function showItems() {
            const nextItems = items.slice(
              currentVisibleCount,
              currentVisibleCount + ITEMS_PER_LOAD,
            );
            nextItems.forEach((item) => item.classList.remove('hidden'));

            currentVisibleCount += nextItems.length;

            if (currentVisibleCount >= items.length) {
              loadMoreButton.classList.add('hidden');
            }
          }

          function init() {
            if (
              isInitialized ||
              !window.matchMedia('(max-width: 990px)').matches
            )
              return;

            items.forEach((item, index) => {
              if (index >= ITEMS_PER_LOAD) {
                item.classList.add('hidden');
              }
            });
            loadMoreButton.addEventListener('click', showItems);
            if (items.length <= ITEMS_PER_LOAD) {
              loadMoreButton.classList.add('hidden');
            }
            isInitialized = true;
          }

          function destroy() {
            if (!isInitialized) return;

            items.forEach((item) => item.classList.remove('hidden'));
            loadMoreButton.classList.remove('hidden');
            loadMoreButton.removeEventListener('click', showItems);
            isInitialized = false;
          }

          function handleResize() {
            if (window.matchMedia('(max-width: 990px)').matches) {
              init();
            } else {
              destroy();
            }
          }

          window.addEventListener('resize', handleResize);
          handleResize();
        }
      });
    });

    const config = {
      childList: true,
      attributes: false,
      subtree: false,
    };

    observer.observe(relatedProductsUl, config);
  }
});
