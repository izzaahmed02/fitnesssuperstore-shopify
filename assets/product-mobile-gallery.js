class MobileGallery extends HTMLElement {
  constructor() {
    super();

    this.hammerInstances = [];
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

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.checkAndInit(isDesktop);
        this.checkAndInitPopup(isDesktop);

        if (window.matchMedia('(min-width: 990px)').matches) {
          const closeBtn = this.popup.querySelector('.mobile-popup-close');

          if (closeBtn) {
            this.popup.classList.remove('is-active');
            document.body.style.overflow = '';
            this.pauseAllMedia(this.popup);
          }
        }
      }, 150);
    });
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
        lazyLoad: 'ondemand',

        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
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

        setTimeout(() => {
          this.pauseIframeMedia(this);
        }, 100);
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
  }

  checkAndInitPopup(isDesktop) {
    if (!this.popupSlider) return;
    const shouldInit = !isDesktop();

    if (shouldInit && !$(this.popupSlider).hasClass('slick-initialized')) {
      this.popupSlider.innerHTML = '';
      $(this.popupSlider).off().slick({
        dots: true,
        appendDots: this.popupDots,
        arrows: false,
        infinite: false,
        adaptiveHeight: true,
        lazyLoad: 'ondemand',

        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
      });
    }

    if (!shouldInit && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }
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

    this.popup.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    const isDesktop = () => window.matchMedia('(min-width: 990px)').matches;
    const shouldInit = !isDesktop();

    if ($(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }

    if (shouldInit) {
      this.popupSlider.innerHTML = '';
      this.renderPopupSlides(this.popupSlider);

      $(this.popupSlider).off().slick({
        dots: true,
        appendDots: this.popupDots,
        arrows: false,
        infinite: false,
        initialSlide: index,
        adaptiveHeight: true,
        lazyLoad: 'ondemand',

        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
      });

      $(this.popupSlider).on('afterChange', (event, slick, currentSlide) => {
        this.pauseAllMedia(this.popup);

        const currentSlideEl = slick.$slides[currentSlide];
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
    }

    const closeBtn = this.popup.querySelector('.mobile-popup-close');
    const backdrop = this.popup.querySelector('.mobile-popup-backdrop');

    if (closeBtn) {
      closeBtn.onclick = () => {
        this.hammerInstances.forEach((h) => h.destroy());
        this.hammerInstances = [];

        if ($(this.popupSlider).hasClass('slick-initialized')) {
          $(this.popupSlider).slick('unslick');
        }
        this.popup.classList.remove('is-active');
        document.body.style.overflow = '';
        this.pauseAllMedia(this.popup);
      };
    }

    if (backdrop) {
      backdrop.onclick = () => {
        closeBtn?.click();
      };
    }
  }

  renderPopupSlides(container) {
    const slides = this.querySelectorAll('.mobile-gallery-slide-wrap');
    container.innerHTML = '';

    slides.forEach((originalSlide) => {
      const clone = originalSlide.cloneNode(true);
      const iframe = clone.querySelector('iframe');
      const overlay = clone.querySelector('.video-iframe-overlay');
      const img = clone.querySelector('img');
      const originalImg = originalSlide.querySelector('img');
      const video = clone.querySelector('video');

      // YouTube
      if (iframe && iframe.src.includes('youtube.com')) {
        const url = new URL(iframe.src);
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
        const videoWrapper = document.createElement('div');
        wrapper.className = 'mobile-gallery-slide external-video';
        videoWrapper.className = 'video-wrapper';
        wrapper.appendChild(videoWrapper);
        videoWrapper.appendChild(newIframe);

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
        return;
      }

      // MP4
      if (video) {
        container.appendChild(clone);
        return;
      }

      // Image + zoom/pan
      if (img) {
        const wrapper = document.createElement('div');
        const zoomWrapper = document.createElement('div');
        const skeletonWrapper = document.createElement('div');

        wrapper.className = 'mobile-gallery-slide';
        zoomWrapper.className = 'zoom-container';
        skeletonWrapper.className = 'image-skeleton-wrapper';

        zoomWrapper.style.overflow = 'hidden';

        const zoomImg = document.createElement('img');
        // originalImg?.getAttribute('src') ||
        zoomImg.src = img.src.replace(/width=\d+/, 'width=600');
        // zoomImg.srcset = originalImg?.getAttribute('srcset') || '';
        zoomImg.sizes = originalImg?.getAttribute('sizes') || '';
        zoomImg.width = originalImg?.getAttribute('width') || '';
        zoomImg.height = originalImg?.getAttribute('height') || '';
        zoomImg.alt = img.alt || '';
        zoomImg.loading = 'eager';
        zoomImg.className = 'popup-zoom-image';
        zoomImg.style.touchAction = 'none';
        zoomImg.style.userSelect = 'none';

        skeletonWrapper.appendChild(zoomImg);
        zoomWrapper.appendChild(skeletonWrapper);
        wrapper.appendChild(zoomWrapper);
        clone.innerHTML = '';
        clone.appendChild(wrapper);
        container.appendChild(clone);

        const highResSrc = img.src.replace(/width=\d+/, ''); //width=2048

        if (zoomImg.src !== highResSrc) {
          const preload = new Image();
          preload.src = highResSrc;
          preload.onload = () => {
            zoomImg.src = highResSrc;
          };
        }

        let scale = 1;
        let posX = 0,
          posY = 0;
        let lastPosX = 0,
          lastPosY = 0;
        let lastScale = 1;
        let frameId = null;

        const updateTransform = () => {
          if (frameId) cancelAnimationFrame(frameId);
          frameId = requestAnimationFrame(() => {
            zoomImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
          });
        };

        zoomImg.onload = () => {
          skeletonWrapper.classList.add('loaded');
          const allowZoom = zoomImg.naturalWidth > 500;

          if (!allowZoom) {
            wrapper.classList.add('zoom-disabled');
          }

          const hammer = new Hammer(wrapper);
          this.hammerInstances.push(hammer);

          hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

          if (allowZoom) {
            hammer.get('pinch').set({ enable: true });
            hammer.get('doubletap').set({ taps: 2 });

            hammer.on('pinchstart', () => {
              lastScale = scale;
            });

            hammer.on('pinchmove', (e) => {
              scale = Math.max(1, Math.min(lastScale * e.scale, 3));
              if (scale === 1) {
                posX = 0;
                posY = 0;
                lastPosX = 0;
                lastPosY = 0;
              }
              updateTransform();
            });

            hammer.on('doubletap', () => {
              if (zoomImg.src !== highResSrc) {
                const preload = new Image();
                preload.src = highResSrc;
                preload.onload = () => {
                  zoomImg.src = highResSrc;
                  zoomImg.style.opacity = '0';
                  requestAnimationFrame(() => {
                    zoomImg.style.transition = 'opacity 0.2s ease-in-out';
                    zoomImg.style.opacity = '1';
                  });
                };
              }

              if (scale < 1.5) {
                scale = 1.5;
              } else if (scale < 2) {
                scale = 2;
              } else if (scale < 3) {
                scale = 3;
              } else {
                scale = 1;
                posX = 0;
                posY = 0;
                lastPosX = 0;
                lastPosY = 0;
              }

              updateTransform();
            });

            hammer.on('panstart', () => {
              lastPosX = posX;
              lastPosY = posY;
            });

            hammer.on('panmove', (e) => {
              if (scale <= 1.01) return;

              const rect = wrapper.getBoundingClientRect();
              const imgWidth = zoomImg.naturalWidth * scale;
              const imgHeight = zoomImg.naturalHeight * scale;

              const maxX = Math.max((imgWidth - rect.width) / 2, 0);
              const maxY = Math.max((imgHeight - rect.height) / 2, 0);

              let nextX = lastPosX + e.deltaX;
              let nextY = lastPosY + e.deltaY;

              posX = Math.min(maxX, Math.max(-maxX, nextX));
              posY = Math.min(maxY, Math.max(-maxY, nextY));

              updateTransform();
            });

            hammer.on('panend', () => {
              lastPosX = posX;
              lastPosY = posY;
            });
          }
        };

        const slide = zoomImg.closest('.slick-slide');
        if (slide) {
          slide.addEventListener(
            'touchmove',
            (e) => {
              if (scale > 1.01) e.stopPropagation();
            },
            { passive: false },
          );
        }
      }
    });
  }

  pauseAllMedia(scope) {
    scope.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });

    this.pauseIframeMedia(scope);
  }

  pauseIframeMedia(scope) {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const iframes = scope.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        if (iframe.src.includes('youtube.com') && iframe.contentWindow) {
          if (isSafari) {
            const src = iframe.src;
            iframe.src = '';
            iframe.src = src;
          } else {
            iframe.contentWindow.postMessage(
              '{"event":"command","func":"pauseVideo","args":""}',
              '*',
            );
          }
        }

        // Vimeo, etc.
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

if (!customElements.get('mobile-gallery')) {
  customElements.define('mobile-gallery', MobileGallery);
}
