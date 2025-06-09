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
      console.debug('[MobileGallery] Parsed media data:', this.mediaData);
    } catch (err) {
      console.error('[MobileGallery] Invalid JSON in <template>:', err);
      return;
    }

    this.slider = this.querySelector('.mobile-gallery-slider');
    this.dots = this.querySelector('.mobile-gallery-dots');
    this.popup = document.getElementById('mobile-gallery-popup');

    this.popupSlider = this.popup?.querySelector('.mobile-popup-slider');
    this.popupDots = this.popup?.querySelector('.mobile-popup-dots');
    this.thumbnailContainer = this.popup?.querySelector('.mobile-popup-thumbnails');

    if (!this.thumbnailContainer) {
      console.warn('[MobileGallery] Thumbnail container (.mobile-popup-thumbnails) not found.');
    }

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
    if (!this.slider) {
      console.error('[MobileGallery] Slider (.mobile-gallery-slider) not found.');
      return;
    }

    const shouldInit = !isDesktop();

    const initSlider = () => {
      if (this.slickInitialized) return;

      $(this.slider).slick({
        dots: true,
        appendDots: this.dots,
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
      console.debug('[MobileGallery] Slider initialized.');
    };

    if (shouldInit && !this.slickInitialized) {
      this.waitForSlickReady('.mobile-gallery-slider', () => {
        initSlider();
      });
    }

    if (!shouldInit && this.slickInitialized) {
      $(this.slider).slick('unslick');
      this.slickInitialized = false;
      console.debug('[MobileGallery] Slider unslicked.');
    }
  }

  checkAndInitPopup(isDesktop) {
    if (!this.popupSlider) {
      console.error('[MobileGallery] Popup slider (.mobile-popup-slider) not found.');
      return;
    }

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
      console.debug('[MobileGallery] Popup slider initialized.');
    }

    if (!shouldInit && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
      console.debug('[MobileGallery] Popup slider unslicked.');
    }
  }

  attachSlideEvents() {
    const slides = this.querySelectorAll('.mobile-gallery-slide');
    slides.forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
        const mediaId = slide.getAttribute('data-media-id');
        const media = this.mediaData.find((m) => String(m.id) === mediaId);

        if (!media) {
          console.warn('[MobileGallery] Media not found for ID:', mediaId);
          return;
        }

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
    if (!this.popup || !this.popupSlider) {
      console.error('[MobileGallery] Popup or popup slider not found.');
      return;
    }

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
      
      // Render thumbnails
      if (this.thumbnailContainer) {
        this.renderThumbnails(this.thumbnailContainer, index);
      } else {
        console.warn('[MobileGallery] Thumbnail container not found during popup open.');
      }

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

        // Update active thumbnail
        if (this.thumbnailContainer) {
          this.thumbnailContainer.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentSlide);
            thumb.style.border = idx === currentSlide ? '2px solid #000' : '2px solid transparent';
          });
        }
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

  renderThumbnails(container, activeIndex) {
    container.innerHTML = '';
    if (!this.mediaData || !Array.isArray(this.mediaData)) {
      console.error('[MobileGallery] mediaData is not an array or is undefined:', this.mediaData);
      container.innerHTML = '<p>No images available</p>';
      return;
    }

    const imageMedia = this.mediaData.filter((media) => media.media_type === 'image');
    if (imageMedia.length === 0) {
      console.warn('[MobileGallery] No image media found for thumbnails.');
      container.innerHTML = '<p>No images available</p>';
      return;
    }

    imageMedia.forEach((media, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = `thumbnail ${index === activeIndex ? 'active' : ''}`;
      thumbnail.style.cursor = 'pointer';
      thumbnail.style.display = 'inline-block';
      thumbnail.style.margin = '0 5px';
      thumbnail.style.padding = '2px';
      thumbnail.style.border = index === activeIndex ? '2px solid #000' : '2px solid transparent';
      thumbnail.style.borderRadius = '4px';
      thumbnail.style.transition = 'border-color 0.2s ease-in-out';
      thumbnail.setAttribute('data-media-id', media.id || index); // Add media ID for reference
      
      const img = document.createElement('img');
      const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
      img.src = media.src && typeof media.src === 'string' && media.src.trim() !== '' 
        ? media.src.replace(/width=\d+/, 'width=100') 
        : placeholder;
      img.alt = media.alt || 'Thumbnail';
      img.loading = 'lazy';
      img.style.width = '60px';
      img.style.height = '60px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '2px';
      img.style.backgroundColor = '#f0f0f0'; // Background for placeholder visibility
      
      if (!media.src) {
        console.warn('[MobileGallery] Missing or invalid src for media at index', index, ':', media);
      }

      thumbnail.appendChild(img);
      container.appendChild(thumbnail);

      thumbnail.addEventListener('click', () => {
        console.debug('[MobileGallery] Thumbnail clicked, navigating to slide:', index);
        $(this.popupSlider).slick('slickGoTo', index);
        container.querySelectorAll('.thumbnail').forEach((thumb, idx) => {
          thumb.classList.toggle('active', idx === index);
          thumb.style.border = idx === index ? '2px solid #000' : '2px solid transparent';
        });
      });
    });

    // Style the thumbnail container
    container.style.display = 'flex';
    container.style.overflowX = 'auto';
    container.style.padding = '10px 0';
    container.style.whiteSpace = 'nowrap';
    container.style.scrollbarWidth = 'thin';
    container.style.webkitOverflowScrolling = 'touch';

    console.debug('[MobileGallery] Rendered thumbnails:', imageMedia.length);
  }

  renderPopupSlides(container) {
    const slides = this.querySelectorAll('.mobile-gallery-slide-wrap');
    if (!slides.length) {
      console.warn('[MobileGallery] No slides found for popup.');
    }

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
        zoomImg.src = img.src.replace(/width=\d+/, 'width=600');
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

        const highResSrc = img.src.replace(/width=\d+/, '');

        if (zoomImg.src !== highResSrc) {
          const preload = new Image();
          preload.src = highResSrc;
          preload.onload = () => {
            zoomImg.src = highResSrc;
          };
        }

        let scale = 1;
        let posX = 0, posY = 0;
        let lastPosX = 0, lastPosY = 0;
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