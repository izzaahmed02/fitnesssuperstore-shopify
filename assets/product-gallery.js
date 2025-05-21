class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.mediaData = [];
    this.wrapper = null;
    this.main = null;
    this.zoomEnabled = false;
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

    if (this.isDesktop()) {
      this.initZoom(container, media);
    }
  }

  initThumbnails() {
    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const mediaId = btn.getAttribute('data-media-id');

      // btn.addEventListener('click', (e) => {
      //   const isOverlay = e.target.closest('.thumbnail-overlay');

      //   if (isOverlay) {
      //     this.openPopup(mediaId);
      //   } else {
      //     this.setActiveMedia(mediaId);
      //   }
      // });

      // btn.addEventListener('click', () => this.setActiveMedia(mediaId));

      btn.addEventListener('click', (e) => {
        const isOverlay = e.target.classList.contains('thumbnail-overlay');
        if (isOverlay) {
          this.openPopup(mediaId);
        } else {
          this.setActiveMedia(mediaId);
        }
      });
      btn.addEventListener('mouseenter', () => this.setActiveMedia(mediaId));
    });
  }

  setActiveMedia(id) {
    this.activeMediaId = id;

    const media = this.mediaData.find((m) => m.id == id);
    if (!media || !this.main) return;

    this.main.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'main-image-container';
    container.setAttribute('data-media-id', id);
    container.setAttribute('data-zoom-container', '');

    this.main.appendChild(container);
    if (media.media_type === 'image') {
      this.initZoom(container, media);
    }

    if (media.media_type === 'image') {
      const img = document.createElement('img');
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      img.alt = media.alt || '';
      img.className = 'main-product-image';
      img.loading = 'eager';
      img.width = media.preview_image.width;
      img.height = media.preview_image.height;

      container.appendChild(img);

      const preload = new Image();
      preload.src = media.preview_image.src;
      preload.onload = () => {
        img.src = preload.src;
      };

      this.main.appendChild(container);
      this.initZoom(container, media);
    } else if (media.media_type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      const source = document.createElement('source');
      source.src = media.sources[0].url;
      source.type = media.sources[0].mime_type;
      video.appendChild(source);
      container.appendChild(video);
      this.main.appendChild(container);
    } else {
      const msg = document.createElement('p');
      msg.textContent = 'Preview available in popup only.';
      container.appendChild(msg);
      this.main.appendChild(container);
    }

    // const allThumbs = this.querySelectorAll('.thumbnail-btn');
    // allThumbs.forEach((thumb) => {
    //   if (thumb.getAttribute('data-media-id') === String(id)) {
    //     thumb.classList.add('is-active');
    //   } else {
    //     thumb.classList.remove('is-active');
    //   }
    // });

    const allThumbs = this.querySelectorAll('.thumbnail-btn');
    allThumbs.forEach((thumb) => {
      thumb.classList.toggle(
        'is-active',
        thumb.getAttribute('data-media-id') === String(id),
      );
    });
  }

  isDesktop() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }
  initZoom(container, media) {
    if (!this.isDesktop()) return;

    const img = container.querySelector('img');
    if (!img) return;

    // Zoom target
    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';

    // Zoomed image
    const zoomImg = document.createElement('img');
    zoomImg.src = media.preview_image.src.replace(/width=\d+/, 'width=2048');
    zoomResult.appendChild(zoomImg);
    container.appendChild(zoomResult);

    // LENS
    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    container.appendChild(lens);

    const moveLens = (e) => {
      const rect = img.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const lensWidth = lens.offsetWidth / 2;
      const lensHeight = lens.offsetHeight / 2;

      let left = x - lensWidth;
      let top = y - lensHeight;

      left = Math.max(0, Math.min(left, img.width - lens.offsetWidth));
      top = Math.max(0, Math.min(top, img.height - lens.offsetHeight));

      lens.style.left = `${left}px`;
      lens.style.top = `${top}px`;

      // Zoom scroll
      const scaleX = zoomImg.offsetWidth / img.width;
      const scaleY = zoomImg.offsetHeight / img.height;
      zoomResult.scrollLeft = x * scaleX - zoomResult.clientWidth / 2;
      zoomResult.scrollTop = y * scaleY - zoomResult.clientHeight / 2;
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
  }

  renderPopup() {
    if (document.getElementById('product-gallery-popup')) return;

    const popupHTML = document.createElement('div');
    popupHTML.innerHTML = `
      <div id="product-gallery-popup" class="product-popup-overlay" hidden>
        <div class="product-popup-backdrop"></div>
        <div class="product-popup" role="dialog" aria-modal="true">
          <button class="popup-close" type="button" aria-label="Close popup">&times;</button>
          <div class="popup-content">
            <div class="popup-media-viewer" data-popup-viewer></div>
            <div class="popup-sidebar">
              <div class="popup-tabs">
                <button class="popup-tab is-active" data-tab="images">Images</button>
                <button class="popup-tab" data-tab="videos">Videos</button>
              </div>
              <div class="popup-thumbnails" data-tab-content="images"></div>
              <div class="popup-thumbnails hidden" data-tab-content="videos"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(popupHTML.firstElementChild);
  }

  openPopup(mediaId) {
    const popup = document.getElementById('product-gallery-popup');
    const viewer = popup.querySelector('[data-popup-viewer]');
    const tabImages = popup.querySelector('[data-tab-content="images"]');
    const tabVideos = popup.querySelector('[data-tab-content="videos"]');
    const tabs = popup.querySelectorAll('.popup-tab');
    const titleContainer = popup.querySelector('[data-popup-title]');

    if (titleContainer)
      titleContainer.textContent =
        this.getAttribute('data-product-title') || '';

    popup.hidden = false;
    document.body.style.overflow = 'hidden';

    this.renderPopupViewer(mediaId, viewer);

    tabImages.innerHTML = '';
    tabVideos.innerHTML = '';

    this.mediaData.forEach((media) => {
      const btn = document.createElement('button');
      btn.className = 'popup-thumb';
      btn.type = 'button';
      btn.setAttribute('data-media-id', media.id);

      const img = document.createElement('img');
      img.src = media.preview_image.src;
      img.alt = media.alt || '';
      img.width = media.preview_image.width;
      img.height = media.preview_image.height;

      btn.appendChild(img);
      btn.addEventListener('click', () =>
        this.renderPopupViewer(media.id, viewer),
      );

      if (media.media_type === 'image') {
        tabImages.appendChild(btn);
      } else if (media.media_type === 'video') {
        tabVideos.appendChild(btn);
      }
    });

    // Tabs
    tabs.forEach((tab) => {
      tab.onclick = () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');

        const type = tab.dataset.tab;
        tabImages.classList.toggle('hidden', type !== 'images');
        tabVideos.classList.toggle('hidden', type !== 'videos');
      };
    });

    this.updatePopupThumbActive(mediaId);

    popup.querySelector('.popup-close').onclick = this.closePopup.bind(this);
    popup.querySelector('.product-popup-backdrop').onclick =
      this.closePopup.bind(this);
    document.addEventListener('keydown', this.handleEscClose);
  }

  renderPopupViewer(mediaId, target) {
    const media = this.mediaData.find((m) => m.id == mediaId);
    if (!media) return;

    target.innerHTML = '';

    if (media.media_type === 'image') {
      const img = document.createElement('img');
      img.src = media.preview_image.src.replace(/width=\d+/, 'width=1200');
      img.alt = media.alt || '';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      target.appendChild(img);
    } else if (media.media_type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      const source = document.createElement('source');
      source.src = media.sources[0].url;
      source.type = media.sources[0].mime_type;

      video.appendChild(source);
      video.style.maxWidth = '100%';
      target.appendChild(video);
    }

    this.updatePopupThumbActive(mediaId);
  }

  updatePopupThumbActive(mediaId) {
    const popup = document.getElementById('product-gallery-popup');
    const thumbs = popup.querySelectorAll('.popup-thumb');

    thumbs.forEach((thumb) => {
      const thumbId =
        thumb.closest('[data-media-id]')?.getAttribute('data-media-id') ||
        thumb.getAttribute('data-media-id');
      thumb.classList.toggle('is-active', thumbId === String(mediaId));
    });
  }

  closePopup() {
    const popup = document.getElementById('product-gallery-popup');
    popup.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleEscClose);
  }

  handleEscClose = (e) => {
    if (e.key === 'Escape') this.closePopup();
  };
}

customElements.define('product-gallery', ProductGallery);
