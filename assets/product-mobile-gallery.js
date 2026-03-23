class MobileGallery extends HTMLElement {
  constructor() {
    super();
    this.hammerInstances = [];
    this.popup = null;
    this.popupSlider = null;
    this.popupThumbnails = null;
    this.popupDots = null;
    this.slider = null;
    this.dots = null;
    this.mediaData = null;
    this.slickInitialized = false;
    this.observer = null;
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

    this.popup = document.getElementById('mobile-gallery-popup');
    this.slider = this.querySelector('.mobile-gallery-slider');
    this.dots = this.querySelector('.mobile-gallery-dots');

    // Ensure popup exists
    if (!this.popup) {
      console.warn('[MobileGallery] #mobile-gallery-popup not found, creating dynamically');
      this.createPopup();
    }

    this.updatePopupReferences();

    const isDesktop = () => window.matchMedia('(min-width: 990px)').matches;
    this.checkAndInit(isDesktop);

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.checkAndInit(isDesktop);
        this.checkAndInitPopup(isDesktop);
        if (isDesktop()) {
          this.closePopup();
        }
      }, 150);
    });

    // Setup MutationObserver to detect popup removal
    this.observePopup();

    this.attachSlideClickHandlers();
    this.setSliderAspectRatio();
  }

  updatePopupReferences() {
    this.popup = document.getElementById('mobile-gallery-popup');
    if (this.popup) {
      this.popupSlider = this.popup.querySelector('.mobile-popup-slider');
      this.popupThumbnails = this.popup.querySelector('.mobile-popup-thumbnails');
      this.popupDots = this.popup.querySelector('.mobile-popup-dots');
    }
  }

  createPopup() {
    let popup = document.getElementById('mobile-gallery-popup');
    if (popup) {
      console.warn('[MobileGallery] #mobile-gallery-popup already exists, reusing');
      this.updatePopupReferences();
      return;
    }

    popup = document.createElement('div');
    popup.id = 'mobile-gallery-popup';
    popup.className = 'mobile-popup-overlay';
    popup.setAttribute('data-mobile-gallery-popup', 'true'); // Unique marker
    popup.hidden = true;
    popup.innerHTML = `
      <div class="mobile-popup-backdrop"></div>
      <button class="mobile-popup-close" aria-label="Close">×</button>
      <div class="mobile-popup-slider"></div>
      <div class="mobile-popup-thumbnails"></div>
      <div class="mobile-popup-dots"></div>
    `;
    document.body.appendChild(popup);
    this.updatePopupReferences();
   
  }

observePopup() {
  if (this.observer) {
    this.observer.disconnect();
  }

  const parent = document.body;
  this.observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.removedNodes.length) {
        for (const node of mutation.removedNodes) {
          // Only process element nodes (nodeType === 1)
          if (node.nodeType === 1 && 
              (node.id === 'mobile-gallery-popup' || node.querySelector('#mobile-gallery-popup'))) {
            console.warn('[MobileGallery] Detected removal of #mobile-gallery-popup at', new Date().toISOString());
            console.trace();
            this.createPopup();
            if (this.popup.classList.contains('is-active')) {
              this.openPopup(0); // Reopen if it was active
            }
            break;
          }
        }
      }
    }
  });

  this.observer.observe(parent, { childList: true, subtree: true });
}

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.hammerInstances.forEach((h) => h.destroy());
    this.hammerInstances = [];
    if (this.popupSlider && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }
    if (this.popupThumbnails && $(this.popupThumbnails).hasClass('slick-initialized')) {
      $(this.popupThumbnails).slick('unslick');
    }
    if (this.slider && $(this.slider).hasClass('slick-initialized')) {
      $(this.slider).slick('unslick');
    }
  }

  setSliderAspectRatio() {
    if (!this.slider || !this.mediaData?.length) return;

    const featuredMedia = this.mediaData[0];
    const ratio = Number(featuredMedia?.preview_image?.aspect_ratio) || Number(featuredMedia?.aspect_ratio) || 1;

    this.style.setProperty('--mobile-gallery-aspect-ratio', String(ratio));
  }

  checkAndInit(isDesktop) {
    if (!this.slider || !this.dots) return;
    const shouldInit = !isDesktop();

    if (shouldInit && !this.slickInitialized) {
      this.renderSlides(this.slider);
      $(this.slider).slick({
        dots: true,
        appendDots: this.dots,
        arrows: true,
        infinite: false,
        adaptiveHeight: false,
        lazyLoad: 'ondemand',
        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
      });
      this.slickInitialized = true;
    } else if (!shouldInit && this.slickInitialized) {
      $(this.slider).slick('unslick');
      this.slickInitialized = false;
    }
  }

  checkAndInitPopup(isDesktop) {
    if (!this.popupSlider || !this.popupThumbnails || !this.popupDots) {
      this.createPopup();
      if (!this.popupSlider || !this.popupThumbnails || !this.popupDots) return;
    }
    const shouldInit = !isDesktop();

    if (shouldInit && !$(this.popupSlider).hasClass('slick-initialized')) {
      this.popupSlider.innerHTML = '';
      this.popupThumbnails.innerHTML = '';
      this.renderPopupSlides(this.popupSlider, this.popupThumbnails);

      $(this.popupSlider).slick({
        dots: true,
        appendDots: this.popupDots,
        arrows: false,
        infinite: false,
        adaptiveHeight: false,
        lazyLoad: 'ondemand',
        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
      });

      $(this.popupThumbnails).slick({
        slidesToShow: 4,
        
        arrows: false,
        swipeToSlide: true,
        infinite: false,
        lazyLoad: 'ondemand',
        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        variableWidth: false,
        centerMode: false,
      });



      $(this.popupSlider).on('afterChange', (event, slick, currentSlide) => {
        this.pauseAllMedia(this.popup);
        const currentSlideEl = slick.$slides[currentSlide];
        const iframe = currentSlideEl?.querySelector('iframe');
        const overlay = currentSlideEl?.querySelector('.video-iframe-overlay');

        if (iframe && iframe.src.includes('youtube.com') && overlay && overlay.style.display === 'none') {
          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }

        this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
          overlay.style.display = 'block';
          const iframe = overlay.nextElementSibling;
          if (iframe) iframe.style.pointerEvents = 'none';
        });
      });

      this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.style.display = 'none';
          const iframe = overlay.nextElementSibling;
          if (iframe) {
            iframe.style.pointerEvents = 'auto';
            iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }
        }, { once: true });
      });
    } else if (!shouldInit && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
      $(this.popupThumbnails).slick('unslick');
    }
  }

  async ensureHammerLoaded() {
    if (typeof Hammer !== 'undefined') return true;
    if (this.hammerPromise) return this.hammerPromise;

    this.hammerPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

    return this.hammerPromise;
  }

  async openPopup(index) {
    await this.ensureHammerLoaded();

    if (!this.popup || !this.popupSlider || !this.popupThumbnails || !this.popupDots) {
      console.warn('[MobileGallery] Popup elements missing, attempting to recreate');
      this.createPopup();
      await this.ensureHammerLoaded();
      if (!this.popup || !this.popupSlider || !this.popupThumbnails || !this.popupDots) {
        console.error('[MobileGallery] Failed to create popup elements');
        return;
      }
    }

    const preventPropagation = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    this.hammerInstances.forEach((h) => h.destroy());
    this.hammerInstances = [];

    const closeBtn = this.popup.querySelector('.mobile-popup-close');
    const backdrop = this.popup.querySelector('.mobile-popup-backdrop');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.closePopup.bind(this));
    }
    if (backdrop) {
      backdrop.removeEventListener('click', this.closePopup.bind(this));
    }

    if ($(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }
    if ($(this.popupThumbnails).hasClass('slick-initialized')) {
      $(this.popupThumbnails).slick('unslick');
    }

    this.popupSlider.innerHTML = '';
    this.popupThumbnails.innerHTML = '';
    this.popupDots.innerHTML = '';

    this.renderPopupSlides(this.popupSlider, this.popupThumbnails);

    this.popup.hidden = false;
    this.popup.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    const isDesktop = () => window.matchMedia('(min-width: 990px)').matches;
    const shouldInit = !isDesktop();

    if (shouldInit) {
      $(this.popupSlider).slick({
        dots: true,
        appendDots: this.popupDots,
        arrows: false,
        infinite: false,
        initialSlide: index,
        adaptiveHeight: false,
        lazyLoad: 'ondemand',
        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        swipeToSlide: true,
        touchThreshold: 8,
        waitForAnimate: false,
      });

      $(this.popupThumbnails).slick({
        slidesToShow: 4,
        
        arrows: false,
        
        swipeToSlide: true,
        infinite: false,
        lazyLoad: 'ondemand',
        speed: 250,
        cssEase: 'cubic-bezier(0.25, 1, 0.5, 1)',
        initialSlide: index,
        variableWidth: false,
        centerMode: false,
      });

      $(this.popupSlider).on('afterChange', (event, slick, currentSlide) => {
        this.pauseAllMedia(this.popup);
        const currentSlideEl = slick.$slides[currentSlide];
        const iframe = currentSlideEl?.querySelector('iframe');
        const overlay = currentSlideEl?.querySelector('.video-iframe-overlay');

        if (iframe && iframe.src.includes('youtube.com') && overlay && overlay.style.display === 'none') {
          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }

        this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
          overlay.style.display = 'block';
          const iframe = overlay.nextElementSibling;
          if (iframe) iframe.style.pointerEvents = 'none';
        });

        // Highlight active thumbnail
        this.popupThumbnails.querySelectorAll('.mobile-popup-thumb').forEach((thumb, idx) => {
          thumb.classList.toggle('active', idx === currentSlide);
        });
      });

      this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (e) => {
          preventPropagation(e);
          overlay.style.display = 'none';
          const iframe = overlay.nextElementSibling;
          if (iframe) {
            iframe.style.pointerEvents = 'auto';
            iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }
        }, { once: true });
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', this.closePopup.bind(this));
    }
    if (backdrop) {
      backdrop.addEventListener('click', this.closePopup.bind(this));
    }

    document.addEventListener('click', preventPropagation, { capture: true, once: true });
    document.addEventListener('touchstart', preventPropagation, { capture: true, once: true });
  }

  closePopup(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    this.hammerInstances.forEach((h) => h.destroy());
    this.hammerInstances = [];

    if (this.popupSlider && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }
    if (this.popupThumbnails && $(this.popupThumbnails).hasClass('slick-initialized')) {
      $(this.popupThumbnails).slick('unslick');
    }

    const closeBtn = this.popup?.querySelector('.mobile-popup-close');
    const backdrop = this.popup?.querySelector('.mobile-popup-backdrop');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.closePopup.bind(this));
    }
    if (backdrop) {
      backdrop.removeEventListener('click', this.closePopup.bind(this));
    }

    if (this.popup) {
      this.popup.hidden = true;
      this.popup.classList.remove('is-active');
     
    }
    document.body.style.overflow = '';
    this.pauseAllMedia(this.popup);
  }

  renderSlides(container) {
    container.innerHTML = '';

    this.mediaData.forEach((media, index) => {
      const slideWrap = document.createElement('div');
      slideWrap.className = 'mobile-gallery-slide-wrap';

      if (media.media_type === 'image' && media.preview_image) {
        const skeleton = document.createElement('div');
        skeleton.className = 'image-skeleton-wrapper';

        const slide = document.createElement('div');
        slide.className = 'mobile-gallery-slide';
        slide.dataset.mediaId = media.id;

        const img = document.createElement('img');
        img.src = media.preview_image.src;
        img.srcset = media.preview_image.srcset || '';
        img.sizes = '(max-width: 768px) 100vw, 800px';
        img.alt = media.alt || '';
        img.width = media.preview_image.width || '';
        img.height = media.preview_image.height || '';
        if (index === 0) {
          img.fetchPriority = 'high';
          img.loading = 'eager';
        } else {
          img.loading = 'lazy';
        }
        img.addEventListener('load', () => skeleton.classList.add('loaded'), { once: true });

        slide.appendChild(img);
        skeleton.appendChild(slide);
        slideWrap.appendChild(skeleton);
      } else if (media.media_type === 'video') {
        slideWrap.innerHTML = `<div class="mobile-gallery-slide" data-media-id="${media.id}"><video controls muted playsinline preload="none" poster="${media.preview_image?.src || ''}">${(media.sources || []).map((source) => `<source src="${source.url}" type="${source.mime_type}">`).join('')}</video></div>`;
      } else if (media.media_type === 'external_video') {
        slideWrap.innerHTML = `<div class="mobile-gallery-slide external-video" data-media-id="${media.id}"><div class="video-wrapper"><div class="video-iframe-overlay" aria-hidden="true"></div></div></div>`;
      }

      container.appendChild(slideWrap);
    });

    this.attachExternalVideoEmbeds(container);
    this.attachSlideClickHandlers();
  }

  attachSlideClickHandlers() {
    this.querySelectorAll('.mobile-gallery-slide-wrap').forEach((slide, index) => {
      slide.addEventListener('click', (e) => {
        e.preventDefault();
        this.openPopup(index);
      });
    });
  }

  attachExternalVideoEmbeds(scope) {
    scope.querySelectorAll('.mobile-gallery-slide.external-video').forEach((slide) => {
      const mediaId = slide.dataset.mediaId;
      const media = this.mediaData.find((item) => String(item.id) === String(mediaId));
      const wrapper = slide.querySelector('.video-wrapper');
      if (!media || !wrapper) return;

      let iframeSrc = '';
      if (media.host === 'youtube') {
        iframeSrc = `https://www.youtube.com/embed/${media.external_id}?enablejsapi=1&playsinline=1`;
      } else if (media.host === 'vimeo') {
        iframeSrc = `https://player.vimeo.com/video/${media.external_id}`;
      }

      if (!iframeSrc) return;
      const iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('frameborder', '0');
      iframe.style.pointerEvents = 'none';
      wrapper.appendChild(iframe);
    });
  }

 renderPopupSlides(container, thumbnailContainer) {
  const slides = this.querySelectorAll('.mobile-gallery-slide-wrap');
  container.innerHTML = '';
  thumbnailContainer.innerHTML = '';

  slides.forEach((originalSlide, index) => {
    const clone = originalSlide.cloneNode(true);
    const iframe = clone.querySelector('iframe');
    const overlay = clone.querySelector('.video-iframe-overlay');
    const img = clone.querySelector('img');
    const originalImg = originalSlide.querySelector('img');
    const video = clone.querySelector('video');
    const media = this.mediaData[index];

    // Handle YouTube videos
    if (iframe && iframe.src.includes('youtube.com')) {
      const url = new URL(iframe.src);
      url.searchParams.set('muted', '1');
      url.searchParams.set('enablejsapi', '1');

      const newIframe = document.createElement('iframe');
      newIframe.src = url.toString();
      newIframe.setAttribute('allow', 'autoplay; encrypted-media');
      newIframe.setAttribute('frameborder', '0');
      newIframe.setAttribute('allowfullscreen', 'true');
      newIframe.width = iframe.width || '100%';
      newIframe.height = iframe.height || 'auto';
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

      clone.innerHTML = '';
      clone.appendChild(wrapper);
      container.appendChild(clone);
    }
    // Handle Vimeo videos
    else if (iframe && iframe.src.includes('vimeo.com')) {
      const url = new URL(iframe.src);
      url.searchParams.set('muted', '1');

      const newIframe = document.createElement('iframe');
      newIframe.src = url.toString();
      newIframe.setAttribute('allow', 'autoplay; encrypted-media');
      newIframe.setAttribute('frameborder', '0');
      newIframe.setAttribute('allowfullscreen', 'true');
      newIframe.width = iframe.width || '100%';
      newIframe.height = iframe.height || 'auto';
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

      clone.innerHTML = '';
      clone.appendChild(wrapper);
      container.appendChild(clone);
    }
    // Handle MP4 videos
    else if (video && media) {
      container.appendChild(clone);
    }
    // Handle images with zoom/pan
    else if (img && media && media.preview_image) {
      const wrapper = document.createElement('div');
      const zoomWrapper = document.createElement('div');
      const skeletonWrapper = document.createElement('div');

      wrapper.className = 'mobile-gallery-slide';
      zoomWrapper.className = 'zoom-container';
      skeletonWrapper.className = 'image-skeleton-wrapper';

      zoomWrapper.style.overflow = 'hidden';

      const zoomImg = document.createElement('img');
      zoomImg.src = media.preview_image.src.replace(/width=\d+/, 'width=750');
      zoomImg.sizes = originalImg?.getAttribute('sizes') || '100vw';
      zoomImg.width = originalImg?.getAttribute('width') || media.preview_image.width || '';
      zoomImg.height = originalImg?.getAttribute('height') || media.preview_image.height || '';
      zoomImg.alt = media.alt || '';
      zoomImg.loading = 'eager';
      zoomImg.className = 'popup-zoom-image';
      zoomImg.style.touchAction = 'pinch-zoom pan-x pan-y';
      zoomImg.style.userSelect = 'none';

      skeletonWrapper.appendChild(zoomImg);
      zoomWrapper.appendChild(skeletonWrapper);
      wrapper.appendChild(zoomWrapper);
      clone.innerHTML = '';
      clone.appendChild(wrapper);
      container.appendChild(clone);

      const highResSrc = media.preview_image.src.replace(/width=\d+/, 'width=750');
      if (zoomImg.src !== highResSrc) {
        const preload = new Image();
        preload.src = highResSrc;
        preload.onload = () => {
          if (zoomImg.parentElement) {
            zoomImg.src = highResSrc;
          }
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
          if (zoomImg.parentElement) {
            zoomImg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
          }
        });
      };

      zoomImg.onload = () => {
        if (skeletonWrapper && skeletonWrapper.parentElement && skeletonWrapper.classList) {
          skeletonWrapper.classList.add('loaded');
        }
        const allowZoom = zoomImg.naturalWidth > 300;
       

        if (!allowZoom) {
          wrapper.className += ' zoom-disabled';
        }

        if (typeof Hammer === 'undefined') {
          return;
        }

        const hammer = new Hammer(wrapper);
        this.hammerInstances.push(hammer);

        hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });

        if (allowZoom) {
          const maxScale = Math.min(
            Math.max(750 / zoomImg.naturalWidth, 1.5),
            Math.max(750 / zoomImg.naturalHeight, 1.5),
            3
          );
          

          hammer.get('pinch').set({ enable: true });
          hammer.get('doubletap').set({ taps: 2 });

          hammer.on('pinchstart', () => {
            lastScale = scale;
          });

          hammer.on('pinchmove', (e) => {
          
            scale = Math.max(1, Math.min(lastScale * e.scale, maxScale));
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
                if (zoomImg.parentElement) {
                  zoomImg.src = highResSrc;
                  zoomImg.style.opacity = '0';
                  requestAnimationFrame(() => {
                    zoomImg.style.transition = 'opacity 0.2s ease-in-out';
                    zoomImg.style.opacity = '1';
                  });
                }
              };
            }

            if (scale < 1.5 && 1.5 <= maxScale) {
              scale = 1.5;
            } else if (scale < 2 && 2 <= maxScale) {
              scale = 2;
            } else if (scale < maxScale) {
              scale = maxScale;
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
          { passive: false }
        );
      }
    }

    // Render thumbnail
    if (media && media.preview_image) {
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'mobile-popup-thumb';
      thumbWrapper.setAttribute('data-media-id', media.id);

      const thumbSkeleton = document.createElement('div');
      thumbSkeleton.className = 'image-skeleton-wrapper';

      const thumbImg = document.createElement('img');
      thumbImg.src = media.preview_image.src.replace(/width=\d+/, 'width=100');
      thumbImg.alt = media.alt || '';
      thumbImg.width = 100;
      thumbImg.height = 100;
      thumbImg.loading = 'lazy';
      thumbImg.style.objectFit = 'cover';
      thumbImg.style.aspectRatio = '1/1';

      thumbSkeleton.appendChild(thumbImg);
      thumbWrapper.appendChild(thumbSkeleton);
      thumbnailContainer.appendChild(thumbWrapper);

      thumbImg.onload = () => {
        if (thumbSkeleton && thumbSkeleton.parentElement && thumbSkeleton.classList) {
          thumbSkeleton.classList.add('loaded');
        }
      };

      thumbWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        $(this.popupSlider).slick('slickGoTo', index);
      });
    }
  });
}

  pauseAllMedia(scope) {
    if (!scope) return;

    const videos = scope.querySelectorAll('video');
    videos.forEach((video) => {
      if (typeof video.pause === 'function') {
        try {
          video.pause();
        } catch (e) {
          console.warn('[MobileGallery] Error pausing video:', e);
        }
      }
    });

    this.pauseIframeMedia(scope);
  }

  pauseIframeMedia(scope) {
    if (!scope) return;

    const iframes = scope.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      if (iframe.src.includes('youtube.com')) {
        try {
          iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
          console.warn('[MobileGallery] Error pausing YouTube iframe:', e);
        }
      } else if (iframe.src.includes('vimeo.com')) {
        try {
          iframe.contentWindow?.postMessage('{"method":"pause"}', '*');
        } catch (e) {
          console.warn('[MobileGallery] Error pausing Vimeo iframe:', e);
        }
      }
    });
  }

  waitForSlickReady(selector, callback, interval = 50, timeout = 5000) {
    let elapsed = 0;
    const check = setInterval(() => {
      elapsed += interval;
      if ($(selector).hasClass('slick-initialized')) {
        clearInterval(check);
        callback();
      } else if (elapsed >= timeout) {
        clearInterval(check);
        console.warn('[MobileGallery] Timeout waiting for slick initialization on', selector);
      }
    }, interval);
  }
}

if (!customElements.get('mobile-gallery')) {
  customElements.define('mobile-gallery', MobileGallery);
}
