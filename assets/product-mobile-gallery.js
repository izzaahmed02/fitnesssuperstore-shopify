class MobileGallery extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const mediaEl = document.querySelector('[data-product-media]');
    if (!mediaEl) {
      console.error('[MobileGallery] <template data-product-media> not found.');
      return;
    }
    const rawJson = mediaEl.innerHTML.trim();

    try {
      this.mediaData = JSON.parse(rawJson);
    } catch (err) {
      console.error('[MobileGallery] Invalid JSON in <template>:', err);
      return;
    }

    this.slider = this.querySelector('.mobile-gallery-slider');
    this.dots = this.querySelector('.mobile-gallery-dots');
    this.popup = document.getElementById('mobile-gallery-popup');

    this.popupSlider = this.popup?.querySelector('.mobile-popup-slider');
    this.popupDots = this.popup?.querySelector('.mobile-popup-dots');

    this.slickInitialized = false;

    const isDesktop = () => window.matchMedia('(min-width: 990px)').matches;
    this.checkAndInit(isDesktop);

    window.addEventListener('resize', () => this.checkAndInit(isDesktop));
  }

  checkAndInit(isDesktop) {
    if (!this.slider) return;
    // if (!this.slider || typeof jQuery === 'undefined' || !$.fn.slick) return;

    const shouldInit = !isDesktop();

    const initSlider = () => {
      if (this.slickInitialized) return;

      $(this.slider).slick({
        dots: true,
        appendDots: this.dots,
        arrows: true,
        infinite: false,
        adaptiveHeight: true,
        prevArrow: '.main-slider-arrow--left',
        nextArrow: '.main-slider-arrow--right',
      });

      this.attachSlideEvents();

      $(this.slider).on('afterChange', (event, slick, currentSlide) => {
        this.querySelectorAll('video').forEach((video) => {
          try {
            video.pause();
            video.currentTime = 0;
          } catch (e) {
            console.warn('Could not pause video:', e);
          }
        });

        this.querySelectorAll('iframe').forEach((iframe) => {
          try {
            iframe.contentWindow?.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}',
              '*',
            );
            iframe.contentWindow?.postMessage({ method: 'pause' }, '*');
          } catch (e) {
            console.warn('Could not send pause message to iframe:', e);
          }
        });
      });

      this.slickInitialized = true;
    };

    if (shouldInit && !this.slickInitialized) {
      this.waitForSlickReady('.mobile-gallery-slider', () => {
        initSlider();
      });
    }

    if (!shouldInit && this.slickInitialized) {
      $(this.slider).slick('unslick');
      this.slickInitialized = false;
    }

    // if (shouldInit && !this.slickInitialized) {
    //   $(this.slider).slick({
    //     dots: true,
    //     appendDots: this.dots,
    //     arrows: true,
    //     infinite: false,
    //     adaptiveHeight: true,
    //     prevArrow: '.main-slider-arrow--left',
    //     nextArrow: '.main-slider-arrow--right',
    //   });
    //   this.attachSlideEvents();

    //   $(this.slider).on('afterChange', (event, slick, currentSlide) => {
    //     this.querySelectorAll('video').forEach((video) => {
    //       try {
    //         video.pause();
    //         video.currentTime = 0;
    //       } catch (e) {
    //         console.warn('Could not pause video:', e);
    //       }
    //     });

    //     this.querySelectorAll('iframe').forEach((iframe) => {
    //       try {
    //         // YouTube API
    //         iframe.contentWindow?.postMessage(
    //           '{"event":"command","func":"pauseVideo","args":""}',
    //           '*',
    //         );
    //         // Vimeo API
    //         iframe.contentWindow?.postMessage({ method: 'pause' }, '*');
    //       } catch (e) {
    //         console.warn('Could not send pause message to iframe:', e);
    //       }
    //     });
    //   });

    //   this.slickInitialized = true;
    // }

    // if (!shouldInit && this.slickInitialized) {
    //   $(this.slider).slick('unslick');
    //   this.slickInitialized = false;
    // }
  }

  attachSlideEvents() {
    const slides = this.querySelectorAll('.mobile-gallery-slide');

    slides.forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
        const mediaId = slide.getAttribute('data-media-id');
        const media = this.mediaData.find((m) => String(m.id) === mediaId);

        if (!media) return;

        const overlay = slide.querySelector('.video-iframe-overlay');
        const iframe = slide.querySelector('iframe');

        if (
          media.media_type === 'external_video' &&
          overlay &&
          e.target === overlay &&
          iframe
        ) {
          overlay.style.display = 'none';
          iframe.style.pointerEvents = 'auto';

          iframe.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            '*',
          );

          return;
        }

        if (media.media_type === 'video') return;

        this.openPopup(index);
      });
    });
  }

  openPopup(index) {
    if (!this.popup || !this.popupSlider) return;

    this.renderPopupSlides(this.popupSlider);
    // this.popup.hidden = false;
    this.popup.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    $(this.popupSlider).slick({
      dots: true,
      appendDots: this.popupDots,
      arrows: false,
      infinite: false,
      initialSlide: index,
      adaptiveHeight: true,
    });

    $(this.popupSlider).on('afterChange', (event, slick, currentSlide) => {
      this.pauseAllMedia(this.popup);

      const currentSlideEl = slick.$slides[currentSlide];

      // Перевірка та автозапуск YouTube
      const iframe = currentSlideEl?.querySelector('iframe');
      const overlay = currentSlideEl?.querySelector('.video-iframe-overlay');

      if (
        iframe &&
        iframe.src.includes('youtube.com') &&
        overlay &&
        overlay.style.display === 'none'
      ) {
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"playVideo","args":""}',
          '*',
        );
      }

      // Відновити всі overlay
      this.popupSlider
        .querySelectorAll('.video-iframe-overlay')
        .forEach((overlay) => {
          overlay.style.display = 'block';
          const iframe = overlay.nextElementSibling;
          if (iframe) iframe.style.pointerEvents = 'none';
        });
    });

    this.popupSlider
      .querySelectorAll('.video-iframe-overlay')
      .forEach((overlay) => {
        overlay.addEventListener('click', () => {
          overlay.style.display = 'none';
          const iframe = overlay.nextElementSibling;
          if (iframe) {
            iframe.style.pointerEvents = 'auto';
          }
        });
      });

    const closeBtn = this.popup.querySelector('.mobile-popup-close');
    const backdrop = this.popup.querySelector('.mobile-popup-backdrop');

    if (closeBtn) {
      closeBtn.onclick = () => {
        $(this.popupSlider).slick('unslick');
        // this.popup.hidden = true;
        this.popup.classList.remove('is-active');
        // setTimeout(() => {
        //   this.popup.hidden = true;
        // }, 300);
        document.body.style.overflow = '';
        this.pauseAllMedia(this.popup);
      };
    }

    if (backdrop) {
      backdrop.onclick = () => {
        closeBtn?.click();
      };
    }

    // this.popup.querySelector('.mobile-popup-close').onclick = () => {
    //   $(this.popupSlider).slick('unslick');
    //   this.popup.hidden = true;
    //   document.body.style.overflow = '';
    //   this.pauseAllMedia(this.popup);
    // };
  }

  renderPopupSlides(container) {
    const slides = this.querySelectorAll('.mobile-gallery-slide');

    container.innerHTML = '';

    slides.forEach((originalSlide) => {
      const clone = originalSlide.cloneNode(true);

      const iframe = clone.querySelector('iframe');
      const overlay = clone.querySelector('.video-iframe-overlay');

      if (iframe && iframe.src.includes('youtube.com')) {
        const url = new URL(iframe.src);
        // url.searchParams.set('autoplay', '1');
        url.searchParams.set('muted', '1');
        url.searchParams.set('enablejsapi', '1');

        const newIframe = document.createElement('iframe');
        newIframe.src = url.toString();
        newIframe.setAttribute('allow', 'autoplay; encrypted-media');
        newIframe.setAttribute('frameborder', '0');
        newIframe.setAttribute('allowfullscreen', 'true');
        newIframe.width = iframe.width;
        newIframe.height = iframe.height;
        newIframe.style.pointerEvents = 'none';

        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.appendChild(newIframe);

        const newOverlay = document.createElement('div');
        newOverlay.className = 'video-iframe-overlay';
        newOverlay.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(newOverlay);

        newOverlay.addEventListener('click', () => {
          newOverlay.style.display = 'none';
          newIframe.style.pointerEvents = 'auto';

          newIframe.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            '*',
          );
        });

        clone.innerHTML = '';
        clone.appendChild(wrapper);
        container.appendChild(clone);
      } else {
        container.appendChild(clone);
      }
    });
  }

  pauseAllMedia(scope) {
    scope.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });

    scope.querySelectorAll('iframe').forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*',
        );
        iframe.contentWindow?.postMessage({ method: 'pause' }, '*');
      } catch (e) {
        console.warn('Could not send pause message to iframe:', e);
      }
    });
  }

  waitForSlickReady(selector, callback, interval = 50, timeout = 5000) {
    const start = Date.now();

    const check = () => {
      const el = document.querySelector(selector);
      const slickReady = typeof jQuery !== 'undefined' && !!$.fn.slick;

      if (el && slickReady) {
        callback(el);
      } else if (Date.now() - start < timeout) {
        setTimeout(check, interval);
      } else {
        console.warn(
          `[waitForSlickReady] Timeout waiting for ${selector} or Slick.`,
        );
      }
    };

    check();
  }
}

if (window.matchMedia('(max-width: 989px)').matches) {
  customElements.define('mobile-gallery', MobileGallery);
}
