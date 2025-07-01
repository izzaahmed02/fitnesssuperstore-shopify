// Updated ProductGallery class with landscape-specific zoom layout handling
class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.mediaData = [];
    this.wrapper = null;
    this.main = null;
    this.zoomEnabled = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
  }

  connectedCallback() {
    const raw = this.querySelector('[data-product-media]');
    if (!raw) return;

    try {
      this.mediaData = JSON.parse(raw.innerHTML.trim());
    } catch (err) {
      console.error('Invalid JSON in <template>', err);
      return;
    }

    this.wrapper = this.querySelector('.custom-product-gallery');
    this.main = this.querySelector('[data-main-media-wrapper]');

    this.initThumbnails();

    if (this.mediaData.length > 0) {
      this.setActiveMedia(this.mediaData[0].id);
    }

    window.addEventListener('resize', this.handleResize.bind(this));

    this.main.addEventListener('click', (e) => {
      const container = e.target.closest('.main-image-container');
      if (container) {
        this.openPopup(this.activeMediaId);
      }
    });
  }

  handleResize() {
    const activeId = this.activeMediaId;
    const container = this.main?.querySelector('[data-zoom-container]');
    const media = this.mediaData.find((m) => m.id == activeId);

    if (!container || !media || media.media_type !== 'image') return;

    const oldResult = container.querySelector('.zoom-result');
    const oldLens = container.querySelector('.zoom-lens');
    if (oldResult) oldResult.remove();
    if (oldLens) oldLens.remove();
    container.dataset.zoomInitialized = 'false';

    const img = container.querySelector('img');
    if (!img) return;
    img.onload = null;

    requestAnimationFrame(() => {
      if (this.isDesktop()) {
        if (img.complete) {
          this.initZoom(container, media);
        } else {
          img.onload = () => {
            this.initZoom(container, media);
          };
        }
      }
    });
  }

  initThumbnails() {
    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const mediaId = btn.getAttribute('data-media-id');
      const isVideoThumb = btn.classList.contains('is-video');

      btn.addEventListener('click', (e) => {
        const isOverlay = e.target.classList.contains('thumbnail-overlay');
        if (isOverlay || isVideoThumb) {
          this.openPopup(mediaId);
        } else if (this.activeMediaId !== mediaId) {
          this.setActiveMedia(mediaId);
        }
      });

      let hoverTimer;
      btn.addEventListener('mouseenter', () => {
        if (this.activeMediaId === mediaId) return;
        hoverTimer = setTimeout(() => {
          this.setActiveMedia(mediaId);
        }, 150);
      });

      btn.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
      });
    });
  }

  setActiveMedia(id) {
    if (this.activeMediaId === id) return;
    this.activeMediaId = id;
    const media = this.mediaData.find((m) => m.id == id);
    if (!media || !this.main) return;

    this.main.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'main-image-container';
    container.setAttribute('data-media-id', id);
    container.setAttribute('data-zoom-container', '');
    if (media.media_type === 'video' || media.media_type === 'external_video') {
      container.classList.add('is-video-preview');
    }
    this.main.appendChild(container);

    if (media.media_type === 'image') {
      const img = document.createElement('img');
      const skeletonWrapper = document.createElement('div');
      img.alt = media.alt || '';
      img.className = 'main-product-image';
      skeletonWrapper.className = 'image-skeleton-wrapper';
      img.src = media.preview_image.src;
      img.sizes = media.preview_image.sizes || '';
      img.width = media.preview_image.width || '';
      img.height = media.preview_image.height || '';
      img.loading = 'eager';
      container.appendChild(skeletonWrapper);
      skeletonWrapper.appendChild(img);

      img.onload = () => {
        skeletonWrapper.classList.add('loaded');
        this.initZoom(container, media, true);
      };
    }
  }

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  initZoom(container, media, forceStart = false) {
    if (!this.isDesktop()) return;
    const img = container.querySelector('img');
    if (!img || !media.preview_image || container.dataset.zoomInitialized === 'true') return;
    container.dataset.zoomInitialized = 'true';

    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';
    container.appendChild(zoomResult);

    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.style.zIndex = '100';
    container.appendChild(lens);

    const zoomImg = new Image();
    const imgAspect = media.preview_image.width / media.preview_image.height;
    const zoomWidth = 1000;
    const zoomHeight = Math.round(zoomWidth / imgAspect);
    zoomImg.src = media.preview_image.src.replace(/width=\d+/, `width=${zoomWidth}`).replace(/height=\d+/, `height=${zoomHeight}`);
    zoomImg.style.transform = 'scale(0.7)';
    zoomImg.style.transformOrigin = 'center';
    zoomResult.appendChild(zoomImg);

    zoomImg.onload = () => {
      const minZoomRatio = 1.2;
      const zoomRatio = zoomImg.naturalWidth / img.clientWidth;
      if (zoomImg.naturalWidth < 750 || zoomRatio < minZoomRatio) {
        zoomResult.remove();
        lens.remove();
        return;
      }

      const isLandscape = media.preview_image.width > media.preview_image.height;
      const scaleX = zoomImg.naturalWidth / img.clientWidth;
      const scaleY = zoomImg.naturalHeight / img.clientHeight;

      requestAnimationFrame(() => {
        const prevDisplay = zoomResult.style.display;
        const prevVisibility = zoomResult.style.visibility;
        zoomResult.style.visibility = 'hidden';
        zoomResult.style.display = 'block';

        const zoomW = zoomResult.offsetWidth;
        const zoomH = zoomResult.offsetHeight;

        zoomResult.style.display = prevDisplay;
        zoomResult.style.visibility = prevVisibility;

        if (!zoomW || !zoomH) return;

        const lensW = zoomW / scaleX;
        const lensH = zoomH / scaleY;

        lens.style.width = `${Math.min(lensW, img.clientWidth)}px`;
        lens.style.height = `${Math.min(lensH, img.clientHeight)}px`;

        const announcementBarSection = document.querySelector('.announcement-bar-section');
        const headerWrapper = document.querySelector('.header-wrapper');

        const updateZoomTop = () => {
          const threshold = (announcementBarSection?.offsetHeight || 0) + (headerWrapper?.offsetHeight || 0);
          document.documentElement.style.setProperty('--header-height', `${threshold}px`);

          if (!isLandscape) {
            zoomResult.style.top = '0px';
            zoomResult.style.height = `calc(98vh - ${threshold}px)`;
          } else {
            zoomResult.style.top = '';
            zoomResult.style.height = '';
          }
        };

        updateZoomTop();
        window.addEventListener('scroll', updateZoomTop, { passive: true });
      });

      let frameId;
      const moveLens = (e) => {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          const rect = img.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const lensHalfW = lens.offsetWidth / 2;
          const lensHalfH = lens.offsetHeight / 2;
          let left = x - lensHalfW;
          let top = y - lensHalfH;

          left = Math.max(0, Math.min(left, img.clientWidth - lens.offsetWidth));
          top = Math.max(0, Math.min(top, img.clientHeight - lens.offsetHeight));

          lens.style.left = `${left}px`;
          lens.style.top = `${top}px`;

          const scaleX = zoomImg.naturalWidth / img.clientWidth;
          const scaleY = zoomImg.naturalHeight / img.clientHeight;

          zoomResult.scrollLeft = (left + lensHalfW) * scaleX - zoomResult.clientWidth / 2;
          zoomResult.scrollTop = (top + lensHalfH) * scaleY - zoomResult.clientHeight / 2;
        });
      };

      container.addEventListener('mousemove', moveLens);
      container.addEventListener('mouseenter', () => {
        zoomResult.style.display = 'block';
        lens.style.display = 'block';
      });
      container.addEventListener('mouseleave', () => {
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      });

      zoomResult.addEventListener('mouseenter', () => {
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      });

      if (forceStart && this.lastMouseX && this.lastMouseY) {
        const rect = img.getBoundingClientRect();
        const inside = this.lastMouseX > rect.left && this.lastMouseX < rect.right && this.lastMouseY > rect.top && this.lastMouseY < rect.bottom;
        if (inside) {
          zoomResult.style.display = 'block';
          lens.style.display = 'block';
          moveLens({ clientX: this.lastMouseX, clientY: this.lastMouseY });
        }
      }
    };
  }

  // other methods remain unchanged...
}

customElements.define('product-gallery', ProductGallery);
