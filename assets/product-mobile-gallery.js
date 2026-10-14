if (!customElements.get('mobile-gallery')) {
const CHAT_BUBBLE_SELECTOR = '#gorgias-chat-container iframe#chat-button';
const CHAT_BUBBLE_HIT_SIZE = 72;
// Popup image: phone-resolution display file, larger file fetched on zoom (capped at the original).
const POPUP_DISPLAY_WIDTH = 1080;
const POPUP_ZOOM_WIDTH = 2048;

const updateScrollCue = (el) => {
  const more = el.scrollWidth - el.clientWidth;
  el.classList.toggle('has-more-left', more > 1 && el.scrollLeft > 1);
  el.classList.toggle('has-more-right', more > 1 && el.scrollLeft < more - 1);
};

// A mouse can't drag a native scroll row, so drag-to-scroll it by hand. A drag that moved
// more than a few pixels swallows the click that follows, so releasing over a thumbnail
// doesn't also select it. Touch keeps native scrolling.
const enableMouseDragScroll = (el) => {
  let startX = 0;
  let startScroll = 0;
  let dragged = false;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px per ms, smoothed
  let glide = null;
  let glideTimeout = null;

  const stopGlide = () => {
    if (glide) cancelAnimationFrame(glide);
    glide = null;
    clearTimeout(glideTimeout);
  };
  const onMove = (e) => {
    const dx = e.clientX - startX;
    if (!dragged && Math.abs(dx) > 5) {
      dragged = true;
      // Scroll-snap pulls the row back to the nearest thumbnail on every assignment, which
      // made the drag stutter; switch it off while the mouse is held.
      el.classList.add('is-drag-scrolling');
    }
    if (!dragged) return;
    e.preventDefault();
    el.scrollLeft = startScroll - dx;
    const now = performance.now();
    if (now > lastT) velocity = 0.8 * ((lastX - e.clientX) / (now - lastT)) + 0.2 * velocity;
    lastX = e.clientX;
    lastT = now;
  };
  // Page-level listeners only while the button is held, so rebuilt strips leave nothing behind.
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    if (!dragged) return;
    // Short glide in the drag direction, then hand back to scroll-snap.
    let v = performance.now() - lastT > 80 ? 0 : velocity;
    let prev = performance.now();
    const step = (now) => {
      const dt = now - prev;
      prev = now;
      el.scrollLeft += v * dt;
      v *= Math.pow(0.95, dt / 16);
      if (Math.abs(v) > 0.02) {
        glide = requestAnimationFrame(step);
      } else {
        glide = null;
        el.classList.remove('is-drag-scrolling');
      }
    };
    glide = requestAnimationFrame(step);
    // Animation frames pause in background tabs; never leave the strip stuck in drag mode.
    clearTimeout(glideTimeout);
    glideTimeout = setTimeout(() => {
      stopGlide();
      el.classList.remove('is-drag-scrolling');
    }, 1200);
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    stopGlide();
    dragged = false;
    velocity = 0;
    startX = lastX = e.clientX;
    lastT = performance.now();
    startScroll = el.scrollLeft;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
  el.addEventListener('click', (e) => {
    if (!dragged) return;
    dragged = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault());
};

const sizedSrc = (src, width) =>
  /width=\d+/.test(src) ? src.replace(/width=\d+/, `width=${width}`) : `${src}${src.includes('?') ? '&' : '?'}width=${width}`;

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
    // One bound reference, so removeEventListener actually matches what was added.
    // A fresh .bind(this) per call never matched, and close handlers piled up per open.
    this.boundClosePopup = this.closePopup.bind(this);
    this.boundPopupKeydown = this.handlePopupKeydown.bind(this);
    // Incremented per openPopup call; a call that resumes after a newer one started bails out.
    this.openToken = 0;
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

    this.setSliderAspectRatio();

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
    // Slide click handlers are attached by renderSlides(); attaching them here as well
    // made a single tap run openPopup() twice.
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
    if (this.chatOverlapBound) {
      window.removeEventListener('scroll', this.chatOverlapBound);
      window.removeEventListener('resize', this.chatOverlapBound);
      this.chatOverlapBound = null;
      document.body.classList.remove('mobile-gallery-chat-overlap');
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
    const previewImage = featuredMedia?.preview_image || {};

    let ratio = Number(previewImage.aspect_ratio) || Number(featuredMedia?.aspect_ratio);
    if ((!ratio || !Number.isFinite(ratio)) && previewImage.width && previewImage.height) {
      ratio = Number(previewImage.width) / Number(previewImage.height);
    }
    if (!ratio || !Number.isFinite(ratio) || ratio <= 0) return;

    this.style.setProperty('--mobile-gallery-aspect-ratio', String(ratio));
  }

  checkAndInit(isDesktop) {
    if (!this.slider || !this.dots) return;
    const shouldInit = !isDesktop();

    if (shouldInit && !this.slickInitialized) {
      this.renderSlides(this.slider);
      $(this.slider).slick({
        // A thumbnail strip + "x of y" counter replaces slick's dots (see renderThumbStrip).
        dots: false,
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
      this.renderThumbStrip();
      $(this.slider)
        .off('afterChange.mobileGalleryStrip')
        .on('afterChange.mobileGalleryStrip', (event, slick, currentSlide) => this.updateThumbStrip(currentSlide));
    } else if (!shouldInit && this.slickInitialized) {
      $(this.slider).off('afterChange.mobileGalleryStrip');
      $(this.slider).slick('unslick');
      this.slickInitialized = false;
      this.dots.innerHTML = '';
      this.querySelector('.mobile-gallery-counter')?.remove();
    }
  }

  // Thumbnail strip + "x of y" counter under the inline slider. Built from the slides that
  // were actually rendered (renderSlides skips unrenderable media), so the count is real.
  renderThumbStrip() {
    const slides = this.slider.querySelectorAll('.mobile-gallery-slide-wrap');
    this.dots.innerHTML = '';
    this.querySelector('.mobile-gallery-counter')?.remove();
    if (slides.length < 2) return; // one image: nothing to navigate

    const strip = document.createElement('div');
    strip.className = 'mobile-gallery-thumbs';
    strip.setAttribute('aria-label', 'Product media');

    slides.forEach((slide, index) => {
      const mediaId = slide.querySelector('[data-media-id]')?.dataset.mediaId;
      const media = this.mediaData.find((item) => String(item.id) === String(mediaId));
      const isVideo = media && (media.media_type === 'video' || media.media_type === 'external_video');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-gallery-thumb';
      btn.dataset.slideIndex = index;
      btn.setAttribute('aria-label', `${isVideo ? 'Video' : 'Image'} ${index + 1} of ${slides.length}`);
      if (isVideo) btn.classList.add('is-video');

      const src = media?.preview_image?.src;
      if (src) {
        const img = document.createElement('img');
        img.src = /width=\d+/.test(src) ? src.replace(/width=\d+/, 'width=150') : `${src}${src.includes('?') ? '&' : '?'}width=150`;
        img.alt = '';
        img.width = 64;
        img.height = 64;
        img.loading = 'lazy';
        btn.appendChild(img);
      }
      if (isVideo) {
        const badge = document.createElement('span');
        badge.className = 'mobile-gallery-thumb__play';
        badge.setAttribute('aria-hidden', 'true');
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => $(this.slider).slick('slickGoTo', index));
      strip.appendChild(btn);
    });
    this.dots.appendChild(strip);
    strip.addEventListener('scroll', () => updateScrollCue(strip), { passive: true });
    enableMouseDragScroll(strip);

    const counter = document.createElement('div');
    counter.className = 'mobile-gallery-counter';
    counter.setAttribute('aria-live', 'polite');
    this.slider.parentElement.appendChild(counter);

    this.updateThumbStrip($(this.slider).slick('slickCurrentSlide') || 0);
    updateScrollCue(strip);
    this.watchChatOverlap();
  }

  // The fixed chat bubble (Gorgias) sits bottom-right and covered thumbnails/arrows as the page
  // scrolled. Fade it out only while it actually overlaps a gallery control.
  watchChatOverlap() {
    if (this.chatOverlapBound) return;
    let frame = null;
    const check = () => {
      frame = null;
      const bubble = document.querySelector(CHAT_BUBBLE_SELECTOR);
      const overlapping = !!bubble && !this.closest('[hidden]') && this.isCoveringControls(bubble.getBoundingClientRect());
      document.body.classList.toggle('mobile-gallery-chat-overlap', overlapping);
    };
    this.chatOverlapBound = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', this.chatOverlapBound, { passive: true });
    window.addEventListener('resize', this.chatOverlapBound, { passive: true });
    check();
  }

  isCoveringControls(frameRect) {
    if (!frameRect.width || !frameRect.height) return false;
    // The chat iframe (~300x150) is mostly transparent; the visible round button sits in its
    // bottom-right corner, so only test that corner.
    const size = Math.min(CHAT_BUBBLE_HIT_SIZE, frameRect.width, frameRect.height);
    const bubbleRect = { left: frameRect.right - size, right: frameRect.right, top: frameRect.bottom - size, bottom: frameRect.bottom };
    const controls = this.querySelectorAll('.mobile-gallery-thumbs, .slick-arrow, .mobile-gallery-counter');
    return [...controls].some((el) => {
      const r = el.getBoundingClientRect();
      return r.width && r.left < bubbleRect.right && r.right > bubbleRect.left && r.top < bubbleRect.bottom && r.bottom > bubbleRect.top;
    });
  }

  updateThumbStrip(currentSlide) {
    const strip = this.dots.querySelector('.mobile-gallery-thumbs');
    if (!strip) return;
    const thumbs = strip.querySelectorAll('.mobile-gallery-thumb');
    let active = null;
    thumbs.forEach((thumb) => {
      const isActive = Number(thumb.dataset.slideIndex) === currentSlide;
      thumb.classList.toggle('is-active', isActive);
      if (isActive) {
        thumb.setAttribute('aria-current', 'true');
        active = thumb;
      } else {
        thumb.removeAttribute('aria-current');
      }
    });

    const counter = this.querySelector('.mobile-gallery-counter');
    if (counter) counter.textContent = `${currentSlide + 1} of ${thumbs.length}`;

    // Scroll the strip itself (not the page) so the selected thumbnail stays centred in view.
    if (active) {
      const left = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }

  checkAndInitPopup(isDesktop) {
    if (!this.popupSlider || !this.popupThumbnails || !this.popupDots) {
      this.createPopup();
      if (!this.popupSlider || !this.popupThumbnails || !this.popupDots) return;
    }
    // openPopup() rebuilds and initialises the popup sliders on every open, so the only
    // job left here is tearing them down when the viewport crosses into desktop.
    if (isDesktop() && $(this.popupSlider).hasClass('slick-initialized')) {
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
    const token = ++this.openToken;
    await this.ensureHammerLoaded();
    // A newer openPopup() started while this one waited for Hammer; let that one build the popup.
    if (token !== this.openToken) return;

    if (!this.popup || !this.popupSlider || !this.popupThumbnails || !this.popupDots) {
      console.warn('[MobileGallery] Popup elements missing, attempting to recreate');
      this.createPopup();
      if (!this.popup || !this.popupSlider || !this.popupThumbnails || !this.popupDots) {
        console.error('[MobileGallery] Failed to create popup elements');
        return;
      }
    }

    this.hammerInstances.forEach((h) => h.destroy());
    this.hammerInstances = [];

    const closeBtn = this.popup.querySelector('.mobile-popup-close');
    const backdrop = this.popup.querySelector('.mobile-popup-backdrop');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.boundClosePopup);
    }
    if (backdrop) {
      backdrop.removeEventListener('click', this.boundClosePopup);
    }

    // Namespaced so each open replaces the previous handler instead of stacking another one.
    $(this.popupSlider).off('afterChange.mobileGallery');

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

    // Restored on close, so the customer lands back where they were on the page.
    this.popupScrollY = window.scrollY;

    this.popup.hidden = false;
    this.popup.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    let counter = this.popup.querySelector('.mobile-popup-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'mobile-popup-counter';
      counter.setAttribute('aria-live', 'polite');
      this.popup.appendChild(counter);
    }

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

      this.setUpPopupStrip();
      this.syncPopupThumbs(index, true);

      $(this.popupSlider).on('afterChange.mobileGallery', (event, slick, currentSlide) => {
        this.pauseAllMedia(this.popup);
        const currentSlideEl = slick.$slides[currentSlide];
        const iframe = currentSlideEl?.querySelector('iframe');
        const overlay = currentSlideEl?.querySelector('.video-iframe-overlay');

        if (iframe && iframe.src.includes('youtube.com') && overlay && overlay.style.display === 'none') {
          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }

        this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
          overlay.style.display = 'block';
          const iframe = this.overlayIframe(overlay);
          if (iframe) iframe.style.pointerEvents = 'none';
        });

        // Chrome can drop a paused video's decoded frame while its slide is off-screen,
        // so on return it showed a blank/frozen frame with no controls for a few seconds.
        // Seeking to the current time makes it repaint the frame.
        const video = currentSlideEl?.querySelector('video');
        if (video && video.readyState >= 2 && video.currentTime > 0) {
          video.currentTime = video.currentTime;
        }

        this.syncPopupThumbs(currentSlide);
      });

      this.popupSlider.querySelectorAll('.video-iframe-overlay').forEach((overlay) => {
        // Not { once: true }: the overlay is shown again after every slide change, so it
        // has to keep working for play → change slide → return → replay.
        overlay.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          overlay.style.display = 'none';
          const iframe = this.overlayIframe(overlay);
          if (iframe) {
            iframe.style.pointerEvents = 'auto';
            iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          }
        });
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', this.boundClosePopup);
    }
    if (backdrop) {
      backdrop.addEventListener('click', this.boundClosePopup);
    }
    document.removeEventListener('keydown', this.boundPopupKeydown);
    document.addEventListener('keydown', this.boundPopupKeydown);
    // No document-level click/touchstart blocker here: it swallowed the customer's next tap
    // wherever it landed, so Close or a thumbnail needed a second tap after opening.
  }

  // The overlay is a sibling of .video-wrapper (which holds the iframe), not of the iframe itself.
  overlayIframe(overlay) {
    return overlay.parentElement?.querySelector('iframe') || null;
  }

  // < > buttons (for a mouse) and mouse drag-scrolling on the popup strip, set up once per
  // popup element; the strip itself is rebuilt on every open.
  setUpPopupStrip() {
    const strip = this.popupThumbnails;
    if (!strip) return;
    if (!strip.parentElement.classList.contains('mobile-popup-thumbs-nav')) {
      const nav = document.createElement('div');
      nav.className = 'mobile-popup-thumbs-nav';
      strip.before(nav);
      nav.appendChild(strip);
      [['prev', -1, 'Previous thumbnails', '‹'], ['next', 1, 'More thumbnails', '›']].forEach(([name, dir, label, glyph]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `thumbnails-nav-btn thumbnails-nav-btn--${name}`;
        btn.setAttribute('aria-label', label);
        btn.textContent = glyph;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          strip.scrollBy({ left: dir * Math.max(strip.clientWidth * 0.8, 80), behavior: 'smooth' });
        });
        nav.appendChild(btn);
      });
    }
    if (!strip.dataset.scrollReady) {
      strip.dataset.scrollReady = 'true';
      strip.addEventListener('scroll', () => updateScrollCue(strip), { passive: true });
      enableMouseDragScroll(strip);
    }
    strip.scrollLeft = 0;
    updateScrollCue(strip);
  }

  // Highlight the thumbnail for the current slide and scroll the strip only when it is out of view.
  syncPopupThumbs(currentSlide, instant = false) {
    if (!this.popupThumbnails) return;
    const thumbs = this.popupThumbnails.querySelectorAll('.mobile-popup-thumb');
    thumbs.forEach((thumb) => {
      thumb.classList.toggle('active', Number(thumb.dataset.slideIndex) === currentSlide);
    });

    const counter = this.popup?.querySelector('.mobile-popup-counter');
    if (counter) {
      counter.hidden = thumbs.length < 2;
      counter.textContent = `${currentSlide + 1} of ${thumbs.length}`;
    }

    const strip = this.popupThumbnails;
    const active = [...thumbs].find((t) => Number(t.dataset.slideIndex) === currentSlide);
    if (!active) return;
    const start = active.offsetLeft;
    const end = start + active.offsetWidth;
    if (start >= strip.scrollLeft && end <= strip.scrollLeft + strip.clientWidth) return;
    const left = start < strip.scrollLeft ? start - 8 : end - strip.clientWidth + 8;
    strip.scrollTo({ left: Math.max(0, left), behavior: instant ? 'auto' : 'smooth' });
    updateScrollCue(strip);
  }

  closePopup(e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    this.hammerInstances.forEach((h) => h.destroy());
    this.hammerInstances = [];

    if (this.popupSlider) {
      $(this.popupSlider).off('afterChange.mobileGallery');
    }
    if (this.popupSlider && $(this.popupSlider).hasClass('slick-initialized')) {
      $(this.popupSlider).slick('unslick');
    }
    if (this.popupThumbnails && $(this.popupThumbnails).hasClass('slick-initialized')) {
      $(this.popupThumbnails).slick('unslick');
    }

    const closeBtn = this.popup?.querySelector('.mobile-popup-close');
    const backdrop = this.popup?.querySelector('.mobile-popup-backdrop');
    if (closeBtn) {
      closeBtn.removeEventListener('click', this.boundClosePopup);
    }
    if (backdrop) {
      backdrop.removeEventListener('click', this.boundClosePopup);
    }

    document.removeEventListener('keydown', this.boundPopupKeydown);

    if (this.popup) {
      this.popup.hidden = true;
      this.popup.classList.remove('is-active');

    }
    document.body.style.overflow = '';
    this.pauseAllMedia(this.popup);

    if (typeof this.popupScrollY === 'number' && Math.abs(window.scrollY - this.popupScrollY) > 1) {
      window.scrollTo(0, this.popupScrollY);
    }
  }

  // Escape closes; arrow keys step slides (tablets / small laptop windows with a keyboard).
  handlePopupKeydown(e) {
    if (!this.popup || this.popup.hidden) return;
    if (e.key === 'Escape') {
      this.closePopup();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && $(this.popupSlider).hasClass('slick-initialized')) {
      e.preventDefault();
      $(this.popupSlider).slick(e.key === 'ArrowRight' ? 'slickNext' : 'slickPrev');
    }
  }

  renderSlides(container) {
    container.innerHTML = '';

    this.mediaData.forEach((media, index) => {
      const slideWrap = document.createElement('div');
      slideWrap.className = 'mobile-gallery-slide-wrap';

      if (media.media_type === 'video') {
        // No native controls in the inline slider: on Android Chrome a horizontal drag over
        // them is taken as seeking, so the swipe never reaches slick and the customer is
        // stuck on a video slide. Tapping the slide opens the popup, which adds controls.
        slideWrap.innerHTML = `<div class="mobile-gallery-slide mobile-gallery-slide--video" data-media-id="${media.id}"><video muted playsinline preload="none" poster="${media.preview_image?.src || ''}">${(media.sources || []).map((source) => `<source src="${source.url}" type="${source.mime_type}">`).join('')}</video><span class="mobile-gallery-video-play" aria-hidden="true"></span></div>`;
      } else if (media.media_type === 'external_video') {
        slideWrap.innerHTML = `<div class="mobile-gallery-slide external-video" data-media-id="${media.id}"><div class="video-wrapper"><div class="video-iframe-overlay" aria-hidden="true"></div></div></div>`;
      } else if (media.preview_image) {
        // Images, plus 3D models and any other previewable media shown via their preview
        // image. Previously only 'image' was handled, so a 3D model (media_type 'model')
        // fell through every branch and produced an empty slide and an extra pagination dot.
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
      } else {
        // Nothing renderable for this media — skip it rather than leaving an empty slide.
        return;
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
    // Look media up by id: renderSlides() skips unrenderable media, so a slide's position
    // doesn't always match its position in mediaData.
    const slideMediaId = originalSlide.querySelector('[data-media-id]')?.dataset.mediaId;
    const media = this.mediaData.find((item) => String(item.id) === String(slideMediaId));

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
      // The inline slide has no controls and a play badge (see renderSlides); the popup
      // is where the video is played, so give it controls and drop the badge.
      video.controls = true;
      clone.querySelector('.mobile-gallery-video-play')?.remove();
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
      zoomImg.src = sizedSrc(media.preview_image.src, POPUP_DISPLAY_WIDTH);
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

      const originalWidth = Number(media.preview_image.width) || 0;
      const highResWidth = originalWidth ? Math.min(POPUP_ZOOM_WIDTH, originalWidth) : POPUP_ZOOM_WIDTH;
      const highResSrc = sizedSrc(media.preview_image.src, highResWidth);
      let highResRequested = false;
      const loadHighRes = () => {
        if (highResRequested || highResWidth <= POPUP_DISPLAY_WIDTH) return;
        highResRequested = true;
        const preload = new Image();
        preload.src = highResSrc;
        preload.onload = () => {
          if (zoomImg.parentElement) zoomImg.src = highResSrc;
        };
      };
      let zoomReady = false;

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
        // onload fires again when the high-res file swaps in; set up gestures only once.
        if (zoomReady) return;
        zoomReady = true;
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
          // Zoom as far as the source file has detail for (up to 3x); the old formula was
          // built around a 750px file and capped most images at 1.5x.
          const sourceRatio = (originalWidth || zoomImg.naturalWidth) / Math.max(1, zoomImg.clientWidth);
          const maxScale = Math.min(3, Math.max(1.5, sourceRatio / 1.5));


          hammer.get('pinch').set({ enable: true });
          hammer.get('doubletap').set({ taps: 2 });

          hammer.on('pinchstart', () => {
            lastScale = scale;
            loadHighRes();
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
            loadHighRes();

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
   
            const imgWidth = zoomImg.clientWidth * scale;
            const imgHeight = zoomImg.clientHeight * scale;

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
      thumbWrapper.dataset.slideIndex = index;

      const thumbSkeleton = document.createElement('div');
      thumbSkeleton.className = 'image-skeleton-wrapper';

      const thumbImg = document.createElement('img');
      thumbImg.src = sizedSrc(media.preview_image.src, 200);
      thumbImg.alt = media.alt || '';
      thumbImg.width = 100;
      thumbImg.height = 100;
      thumbImg.loading = 'lazy';
      thumbImg.style.objectFit = 'contain';
      thumbImg.style.aspectRatio = '1/1';

      thumbSkeleton.appendChild(thumbImg);
      thumbWrapper.appendChild(thumbSkeleton);
      if (media.media_type === 'video' || media.media_type === 'external_video') {
        thumbWrapper.classList.add('is-video');
        const badge = document.createElement('span');
        badge.className = 'mobile-popup-thumb__play';
        badge.setAttribute('aria-hidden', 'true');
        thumbWrapper.appendChild(badge);
      }
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

customElements.define('mobile-gallery', MobileGallery);
}
