class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.mediaData = [];
    this.wrapper = null;
    this.main = null;
    this.zoomEnabled = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Use a throttled or debounced mousemove listener if performance is a concern
    // For now, keeping it as is, but be aware of frequent updates.
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
  }

  connectedCallback() {
    console.log('ConnectedCallback: ProductGallery component initialized.');
    const raw = this.querySelector('[data-product-media]');
    if (!raw) {
      console.log('ConnectedCallback: No [data-product-media] found. Exiting.');
      return;
    }

    try {
      this.mediaData = JSON.parse(raw.innerHTML.trim());
      console.log('ConnectedCallback: Media data parsed successfully.', this.mediaData);
    } catch (err) {
      console.error('ConnectedCallback: Invalid JSON in [data-product-media] element.', err);
      return;
    }

    this.wrapper = this.querySelector('.custom-product-gallery');
    this.main = this.querySelector('[data-main-media-wrapper]');
    if (!this.wrapper || !this.main) {
      console.error('ConnectedCallback: Missing .custom-product-gallery or [data-main-media-wrapper]. Exiting.');
      return;
    }
    console.log('ConnectedCallback: Wrapper and Main elements assigned.');

    this.initThumbnails();
    console.log('ConnectedCallback: initThumbnails called.');

    const currentActiveThumbnail = this.querySelector('.thumbnail-btn.is-active');

    if (!currentActiveThumbnail && this.mediaData.length > 0) {
      // If no thumbnail is active (e.g., first load), set the first one as active in JavaScript.
      console.log('ConnectedCallback: No active thumbnail found, setting first media as active.');
      this.setActiveMedia(this.mediaData[0].id);
    } else if (currentActiveThumbnail) {
      // If one is already active from Liquid, ensure JS knows which one it is.
      this.activeMediaId = currentActiveThumbnail.getAttribute('data-media-id');
      console.log('ConnectedCallback: Active thumbnail found from Liquid:', this.activeMediaId);

      const firstMedia = this.mediaData.find(m => m.id == this.activeMediaId);
      const mainImageContainer = this.main?.querySelector('[data-zoom-container]');

      if (mainImageContainer && firstMedia && firstMedia.media_type === 'image' && firstMedia.preview_image) {
        const img = mainImageContainer.querySelector('img');
        if (img && img.complete) {
          console.log('ConnectedCallback: Main image complete, initializing zoom.');
          this.initZoom(mainImageContainer, firstMedia, true);
        } else if (img) {
          console.log('ConnectedCallback: Main image not complete, setting onload for zoom.');
          img.onload = () => {
            mainImageContainer.querySelector('.image-skeleton-wrapper')?.classList.add('loaded');
            this.initZoom(mainImageContainer, firstMedia, true);
          };
        }
      }
    }

    window.addEventListener('resize', this.handleResize.bind(this));
    console.log('ConnectedCallback: Resize listener added.');

    this.main.addEventListener('click', (e) => {
      console.log('Main image click event detected.');
      const container = e.target.closest('.main-image-container');
      if (container) {
        const media = this.mediaData.find((m) => m.id == this.activeMediaId);
        const popup = document.getElementById('product-gallery-popup'); // Get popup reference here
        if (media && media.media_type !== 'model' && popup && popup.hidden) {
          console.log('Main image click: Opening popup for mediaId:', this.activeMediaId);
          this.openPopup(this.activeMediaId);
        } else if (media && media.media_type === 'model') {
          console.log('Main image click: Media type is model, not opening popup.');
        } else if (popup && !popup.hidden) {
          console.log('Main image click: Popup is already open, not re-opening.');
        } else {
          console.log('Main image click: Conditions not met to open popup.');
        }
      }
    });
  }

  handleResize() {
    console.log('handleResize: Window resized.');
    const activeId = this.activeMediaId;
    const container = this.main?.querySelector('[data-zoom-container]');
    const media = this.mediaData.find((m) => m.id == activeId);

    if (!container || !media || media.media_type !== 'image' || !media.preview_image) {
      console.log('handleResize: Not an image, container not found, or preview_image missing. Exiting.');
      return;
    }

    // Remove existing zoom elements if they exist
    const oldResult = container.querySelector('.zoom-result');
    const oldLens = container.querySelector('.zoom-lens');
    if (oldResult) oldResult.remove();
    if (oldLens) oldLens.remove();

    // Reset the zoomInitialized state for the container
    container.dataset.zoomInitialized = 'false';
    console.log('handleResize: Removed old zoom elements and reset zoomInitialized.');

    const img = container.querySelector('img');
    if (!img) return;

    // Clear any previous onload handler to prevent multiple calls
    img.onload = null;
    console.log('handleResize: Cleared img.onload.');

    requestAnimationFrame(() => {
      if (this.isDesktop()) {
        if (img.complete) {
          console.log('handleResize: Desktop and image complete, re-initializing zoom.');
          this.initZoom(container, media);
        } else {
          console.log('handleResize: Desktop and image not complete, setting onload for re-initialization of zoom.');
          img.onload = () => {
            this.initZoom(container, media);
          };
        }
      } else {
        console.log('handleResize: Not desktop, not initializing zoom.');
      }
    });
  }

  initThumbnails() {
    console.log('initThumbnails: Initializing thumbnail event listeners.');
    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const mediaId = btn.getAttribute('data-media-id');
      const media = this.mediaData.find(m => m.id == mediaId);
      const isVideoThumb = media && (media.media_type === 'video' || media.media_type === 'external_video');

      console.log(`initThumbnails: Processing thumbnail for mediaId: ${mediaId}`);

      btn.addEventListener('click', (e) => {
        console.log(`Thumbnail click event for mediaId: ${mediaId}`);
        // If it's a video thumbnail or if the current thumbnail is already active,
        // or if it's explicitly an overlay click (though overlay isn't in this HTML),
        // open the popup. Otherwise, just set the active media.
        if (isVideoThumb || this.activeMediaId === mediaId) {
          console.log(`Thumbnail click: Opening popup for ${mediaId}.`);
          this.openPopup(mediaId);
        } else {
          console.log(`Thumbnail click: Setting active media for ${mediaId}.`);
          this.setActiveMedia(mediaId);
        }
      });

      let hoverTimer;
      btn.addEventListener('mouseenter', () => {
        console.log(`Thumbnail mouseenter for mediaId: ${mediaId}`);
        if (this.activeMediaId === mediaId) {
          console.log('Thumbnail mouseenter: Already active, skipping hover action.');
          return;
        }
        hoverTimer = setTimeout(() => {
          console.log(`Thumbnail hover: Setting active media for ${mediaId}.`);
          this.setActiveMedia(mediaId);
        }, 150);
      });

      btn.addEventListener('mouseleave', () => {
        console.log(`Thumbnail mouseleave for mediaId: ${mediaId}`);
        clearTimeout(hoverTimer);
      });
    });
  }

  setActiveMedia(id) {
    console.log(`setActiveMedia: Attempting to set active media to ID: ${id}`);
    if (this.activeMediaId == id) { // Use == for comparison as ID might be string/number
      console.log(`setActiveMedia: Media ${id} is already active, skipping.`);
      return;
    }
    this.activeMediaId = id;
    const media = this.mediaData.find((m) => m.id == id);
    if (!media || !this.main) {
      console.error(`setActiveMedia: Media or main element not found for ID: ${id}`);
      return;
    }

    this.main.innerHTML = ''; // Clear previous main media content

    // Reset zoom initialized state for the main container when changing media
    const existingMainContainer = this.main.querySelector('.main-image-container');
    if (existingMainContainer) {
      existingMainContainer.dataset.zoomInitialized = 'false';
    }

    const container = document.createElement('div');
    container.className = 'main-image-container';
    container.setAttribute('data-media-id', id);

    if (media.media_type == 'image' || media.media_type === 'video' || media.media_type === 'external_video') {
      container.setAttribute('data-zoom-container', '');
      if (media.media_type === 'video' || media.media_type === 'external_video') {
        container.classList.add('is-video-preview');
      }
      this.main.appendChild(container);
      console.log(`setActiveMedia: Appended main container for media type: ${media.media_type}`);

      if (media.media_type === 'image' && media.preview_image) {
        const img = document.createElement('img');
        const skeletonWrapper = document.createElement('div');
        img.alt = media.alt || '';
        img.className = 'main-product-image';
        skeletonWrapper.className = 'image-skeleton-wrapper';
        img.src = media.preview_image.src;
        img.sizes = media.preview_image.sizes || '';
        img.width = media.preview_image.width || '';
        img.height = media.preview_image.height || '';
        img.loading = 'lazy'; // Changed to lazy for performance
        container.appendChild(skeletonWrapper);
        skeletonWrapper.appendChild(img);
        console.log(`setActiveMedia: Image element created for ID: ${id}`);

        img.onload = () => {
          console.log(`setActiveMedia: Image for ID ${id} loaded. Initializing zoom.`);
          skeletonWrapper.classList.add('loaded');
          this.initZoom(container, media, true); // <--- Pass true for forceStart
        };
      }
    } else if (media.media_type == 'model') {
      this.main.appendChild(container);
      const model = document.createElement('model-viewer');
      model.src = media.url;
      model.setAttribute('alt', media.alt);
      model.setAttribute('camera-controls', 'true');
      model.setAttribute('camera-orbit', '0deg 75deg 2m');
      model.setAttribute('data-shopify-feature', '1.12');
      container.appendChild(model);
      console.log(`setActiveMedia: Model viewer created for ID: ${id}`);
    }

    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const btnId = btn.getAttribute('data-media-id');
      const isActive = btnId == String(id); // Ensure ID comparison is consistent
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
        console.log(`setActiveMedia: Thumbnail ${btnId} set to active.`);
      }
    });
    console.log(`setActiveMedia: Finished setting active media to ID: ${id}`);
  }

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  initZoom(container, media, forceStart = false) {
    console.log(`initZoom: Called for media ID: ${media.id}, forceStart: ${forceStart}`);
    if (!this.isDesktop()) {
      console.log('initZoom: Not desktop, skipping zoom initialization.');
      return;
    }
    const img = container.querySelector('img');
    if (!img || !media.preview_image || container.dataset.zoomInitialized === 'true') {
      console.log('initZoom: Conditions not met to initialize zoom (img/media missing or already initialized, or preview_image missing).');
      return;
    }

    // Ensure we're not re-initializing if already active
    if (this.activeMediaId != media.id) {
        console.log('initZoom: Active media ID mismatch, not initializing zoom.');
        return;
    }

    container.dataset.zoomInitialized = 'true';
    console.log('initZoom: Zoom initialized for container.');

    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';
    container.appendChild(zoomResult);

    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.style.zIndex = '100';
    container.appendChild(lens);

    const zoomImg = new Image();
    // Safely access preview_image properties
    const imgWidth = media.preview_image.width || img.naturalWidth;
    const imgHeight = media.preview_image.height || img.naturalHeight;

    const imgAspect = imgWidth / imgHeight;
    const zoomWidth = 1600; // Use a high-res for zoom image
    const zoomHeight = Math.round(zoomWidth / imgAspect);
    zoomImg.src = media.preview_image.src.replace(/width=\d+/, `width=${zoomWidth}`).replace(/height=\d+/, `height=${zoomHeight}`);
    zoomImg.style.transform = 'scale(0.7)';
    zoomImg.style.transformOrigin = 'center';
    zoomResult.appendChild(zoomImg);

    zoomImg.onload = () => {
      console.log('initZoom: Zoom image loaded.');
      const minZoomRatio = 1.2;
      const zoomRatio = zoomImg.naturalWidth / img.clientWidth;
      if (zoomImg.naturalWidth < 750 || zoomRatio < minZoomRatio) {
        console.log('initZoom: Zoom conditions not met (image too small or ratio too low). Removing zoom elements.');
        zoomResult.remove();
        lens.remove();
        return;
      }

      const isLandscape = imgWidth > imgHeight;
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

        if (!zoomW || !zoomH) {
          console.warn('initZoom: Zoom result width or height is zero. Skipping further setup.');
          return;
        }

        const lensW = zoomW / scaleX;
        const lensH = zoomH / scaleY;

        lens.style.width = `${Math.min(lensW, img.clientWidth)}px`;
        lens.style.height = `${Math.min(lensH, img.clientHeight)}px`;
        console.log('initZoom: Lens dimensions calculated and set.');

        const announcementBarSection = document.querySelector('.announcement-bar-section');
        const headerWrapper = document.querySelector('.header-wrapper');

        const updateZoomTop = () => {
          const threshold = (announcementBarSection?.offsetHeight || 0) + (headerWrapper?.offsetHeight || 0);
          document.documentElement.style.setProperty('--header-height', `${threshold}px`);

          if (!isLandscape) {
            zoomResult.style.top = '14px';
            zoomResult.style.height = `calc(98vh - ${threshold}px)`;
          } else {
            zoomResult.style.top = ''; // Reset to default
            zoomResult.style.height = ''; // Reset to default
          }
          console.log('initZoom: Zoom top position updated.');
        };

        updateZoomTop();
        // Remove existing listener before adding to prevent duplicates
        window.removeEventListener('scroll', updateZoomTop);
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

      // Ensure listeners are only added once
      container.removeEventListener('mousemove', moveLens);
      container.addEventListener('mousemove', moveLens);

      container.removeEventListener('mouseenter', this._handleZoomMouseEnter);
      this.containerMouseEnterHandler = () => {
        console.log('initZoom: Mouseenter on main image container. Showing zoom.');
        zoomResult.style.display = 'block';
        lens.style.display = 'block';
      };
      container.addEventListener('mouseenter', this.containerMouseEnterHandler);

      container.removeEventListener('mouseleave', this._handleZoomMouseLeave);
      this.containerMouseLeaveHandler = () => {
        console.log('initZoom: Mouseleave on main image container. Hiding zoom.');
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      };
      container.addEventListener('mouseleave', this.containerMouseLeaveHandler);

      zoomResult.removeEventListener('mouseenter', this._handleZoomResultMouseEnter);
      this.zoomResultMouseEnterHandler = () => {
        console.log('initZoom: Mouseenter on zoom result. Hiding zoom.');
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      };
      zoomResult.addEventListener('mouseenter', this.zoomResultMouseEnterHandler);

      if (forceStart && this.lastMouseX && this.lastMouseY) {
        console.log('initZoom: forceStart is true. Attempting to start zoom at last mouse position.');
        const rect = img.getBoundingClientRect();
        const inside = this.lastMouseX > rect.left && this.lastMouseX < rect.right && this.lastMouseY > rect.top && this.lastMouseY < rect.bottom;
        if (inside) {
          console.log('initZoom: Mouse was inside image, showing zoom and moving lens.');
          zoomResult.style.display = 'block';
          lens.style.display = 'block';
          moveLens({ clientX: this.lastMouseX, clientY: this.lastMouseY });
        } else {
          console.log('initZoom: Mouse was NOT inside image, not showing zoom on forceStart.');
        }
      }
    };
  }

  renderPopup() {
    console.log('renderPopup: Checking if popup exists.');
    if (document.getElementById('product-gallery-popup')) {
      console.log('renderPopup: Popup already exists. Skipping creation.');
      return;
    }

    const popupHTML = document.createElement('div');
    popupHTML.innerHTML = `
      <div id="product-gallery-popup" class="product-popup-overlay" hidden>
        <div class="product-popup-backdrop"></div>
        <div class="product-popup" role="dialog" aria-modal="true">
          <button class="popup-close" type="button" aria-label="Close popup">×</button>
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
    console.log('renderPopup: Popup HTML appended to body.');
  }

  openPopup(mediaId) {
    console.log(`openPopup: Attempting to open popup for mediaId: ${mediaId}`);
    // Only render the popup structure if it doesn't exist
    this.renderPopup();
    const popup = document.getElementById('product-gallery-popup');
    const viewer = popup.querySelector('[data-popup-viewer]');
    const tabImages = popup.querySelector('[data-tab-content="images"]');
    const tabVideos = popup.querySelector('[data-tab-content="videos"]');
    const tabs = popup.querySelectorAll('.popup-tab');

    if (!popup || !viewer || tabs.length === 0) {
      console.warn('openPopup: Required popup elements not found, cannot proceed.');
      return;
    }

    const titleContainer = popup.querySelector('[data-popup-title]'); // Assuming you might have this element
    if (titleContainer) {
      titleContainer.textContent = this.getAttribute('data-product-title') || '';
    }

    const clickedMedia = this.mediaData.find((m) => m.id == mediaId);
    const defaultTab = clickedMedia && (clickedMedia.media_type === 'video' || clickedMedia.media_type === 'external_video') ? 'videos' : 'images';
    console.log(`openPopup: Determined default tab: ${defaultTab} for mediaId: ${mediaId}`);

    if (!popup.hidden) {
      console.log(`openPopup: Popup already visible, rendering and updating active thumbnail for ${mediaId}.`);
      this.renderPopupViewer(mediaId, viewer);
      this.updatePopupThumbActive(mediaId);
      return;
    }

    popup.hidden = false;
    document.body.style.overflow = 'hidden';
    console.log('openPopup: Popup visibility set to true, body overflow hidden.');

    this.renderPopupViewer(mediaId, viewer);
    console.log(`openPopup: Initial call to renderPopupViewer for mediaId: ${mediaId}`);

    // Clear and re-populate thumbnails each time, in case media data changes (unlikely for product gallery)
    tabImages.innerHTML = '';
    tabVideos.innerHTML = '';
    console.log('openPopup: Cleared popup tab contents.');

    this.mediaData.forEach((media) => {
      let btn;

      if (media.media_type === 'image' && media.preview_image) {
        btn = document.createElement('button');
        btn.className = 'popup-thumb';
        btn.type = 'button';
        btn.setAttribute('data-media-id', media.id);

        const skeletonWrapper = document.createElement('div');
        const img = document.createElement('img');
        img.src = media.preview_image.src;
        img.alt = media.alt || '';
        img.width = media.preview_image.width;
        img.height = media.preview_image.height;
        skeletonWrapper.className = 'image-skeleton-wrapper';

        btn.appendChild(skeletonWrapper);
        skeletonWrapper.appendChild(img);

        img.onload = () => {
          skeletonWrapper.classList.add('loaded');
        };

        btn.addEventListener('click', () => {
          console.log(`Popup thumbnail click for mediaId: ${media.id}`);
          const zoomedViewer = popup.querySelector(
            '.popup-media-viewer.is-zoomed-simple',
          );

          if (zoomedViewer) {
            console.log('Popup thumbnail click: Zoomed viewer detected, resetting zoom.');
            zoomedViewer.classList.remove('is-zoomed-simple');
            const inner = zoomedViewer.querySelector('.popup-media-inner');
            if (inner) {
              inner.style.left = '0px';
              inner.style.top = '0px';
            }
          }

          this.renderPopupViewer(media.id, viewer);
          this.updatePopupThumbActive(media.id);
          console.log(`Popup thumbnail click: renderPopupViewer called for ${media.id}`);
        });

        tabImages.appendChild(btn);
      } else if (
        media.media_type === 'video' ||
        media.media_type === 'external_video'
      ) {
        btn = this.renderVideoThumbItem(media);
        btn.addEventListener('click', () => {
          console.log(`Popup video thumbnail click for mediaId: ${media.id}`);
          this.renderPopupViewer(
            media.id,
            document.querySelector('[data-popup-viewer]')
          );
          this.updatePopupThumbActive(media.id);
        });
        tabVideos.appendChild(btn);
      }
    });
    console.log('openPopup: Populated popup thumbnails.');

    // Set active tab based on defaultTab
    tabs.forEach((tab) => {
      const isMatch = tab.dataset.tab === defaultTab;
      tab.classList.toggle('is-active', isMatch);
    });
    tabImages.classList.toggle('hidden', defaultTab !== 'images');
    tabVideos.classList.toggle('hidden', defaultTab !== 'videos');
    console.log(`openPopup: Set active tab to ${defaultTab}.`);

    tabs.forEach((tab) => {
      // Remove existing click listener to prevent duplicates if openPopup is called multiple times
      tab.removeEventListener('click', this._handlePopupTabClick);
      this._handlePopupTabClick = () => { // Store handler for removal
        console.log(`Popup tab click: ${tab.dataset.tab} tab clicked.`);
        tabs.forEach((t) => t.classList.remove('is-active'));
        tab.classList.add('is-active');

        const type = tab.dataset.tab;
        tabImages.classList.toggle('hidden', type !== 'images');
        tabVideos.classList.toggle('hidden', type !== 'videos');

        const zoomedViewer = popup.querySelector(
          '.popup-media-viewer.is-zoomed-simple',
        );

        if (zoomedViewer) {
          console.log('Popup tab click: Zoomed viewer detected, resetting zoom.');
          zoomedViewer.classList.remove('is-zoomed-simple');
          const inner = zoomedViewer.querySelector('.popup-media-inner');
          if (inner) {
            inner.style.left = '0px';
            inner.style.top = '0px';
          }
        }

        let firstMedia = null;
        if (type === 'images') {
          firstMedia = this.mediaData.find((m) => m.media_type === 'image');
        } else if (type === 'videos') {
          firstMedia = this.mediaData.find(
            (m) =>
              m.media_type === 'video' || m.media_type === 'external_video',
          );
        }

        if (firstMedia) {
          console.log(`Popup tab click: Rendering viewer for first media in ${type} tab: ${firstMedia.id}`);
          this.renderPopupViewer(firstMedia.id, viewer);
          this.updatePopupThumbActive(firstMedia.id);
        } else {
          console.log(`Popup tab click: No media found for ${type} tab.`);
        }
      };
      tab.addEventListener('click', this._handlePopupTabClick);
    });

    this.updatePopupThumbActive(mediaId);
    console.log(`openPopup: Initial active popup thumbnail set to ${mediaId}.`);

    popup.querySelector('.popup-close').onclick = this.closePopup.bind(this);
    popup.querySelector('.product-popup-backdrop').onclick = this.closePopup.bind(this);
    document.addEventListener('keydown', this.handleEscClose);
    console.log('openPopup: Close listeners added.');
  }

  renderPopupViewer(mediaId, viewer) {
    console.log(`renderPopupViewer: Rendering viewer for mediaId: ${mediaId}`);
    const media = this.mediaData.find((m) => m.id == mediaId);
    if (!media) {
      console.error(`renderPopupViewer: Media not found for ID: ${mediaId}`);
      viewer.innerHTML = '<p>Media not found.</p>';
      return;
    }

    viewer.innerHTML = ''; // Clear previous content
    viewer.classList.remove('popup-media-viewer-media-zoom-img');
    viewer.classList.remove('is-zoomed-simple');

    if (media.media_type === 'image') {
      console.log('renderPopupViewer: Media type is image.');
      viewer.classList.add('popup-media-viewer-media-zoom-img');

      const inner = document.createElement('div');
      inner.className = 'popup-media-inner';

      const skeletonWrapper = document.createElement('div');
      skeletonWrapper.className = 'image-skeleton-wrapper';

      const img = document.createElement('img');
      // Use higher resolution if available, otherwise fallback to preview_image.src
      img.src = media.preview_image?.src ? media.preview_image.src.replace(/width=\d+/, 'width=1600') : '';
      img.alt = media.alt || '';
      img.loading = 'eager';
      img.className = 'popup-media-zoom-img';

      img.style.transition = 'transform 0.3s ease, transform-origin 0.1s ease';
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';

      skeletonWrapper.appendChild(img);
      inner.appendChild(skeletonWrapper);
      viewer.appendChild(inner);
      console.log('renderPopupViewer: Image elements appended to viewer.');

      img.onload = () => {
        skeletonWrapper.classList.add('loaded');
        console.log(`renderPopupViewer: Image for ID ${media.id} loaded in popup.`);
      };

      let isZoomed = false;

      // Ensure previous event listeners are removed before adding new ones
      viewer.removeEventListener('mousemove', this._handlePopupMouseMove);
      this._handlePopupMouseMove = (e) => { // Store handler for removal
        if (!isZoomed) return;

        const rect = viewer.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
      };
      viewer.addEventListener('mousemove', this._handlePopupMouseMove);

      viewer.removeEventListener('click', this._handlePopupClick);
      this._handlePopupClick = () => { // Store handler for removal
        isZoomed = !isZoomed;
        viewer.classList.toggle('is-zoomed-simple', isZoomed);
        console.log(`renderPopupViewer: Viewer clicked, isZoomed: ${isZoomed}`);

        // Safely check for naturalWidth/Height before calculating aspect ratio
        const isLandscape = img.naturalWidth && img.naturalHeight ? img.naturalWidth > img.naturalHeight : true;
        const zoomLevel = isLandscape ? 1.5 : 1.2;

        img.style.transform = isZoomed ? `scale(${zoomLevel})` : 'scale(1)';
      };
      viewer.addEventListener('click', this._handlePopupClick);

      return;
    }

    // --- External Video ---
    if (
      media.media_type === 'external_video' &&
      media.external_id &&
      media.host
    ) {
      console.log('renderPopupViewer: Media type is external video.');
      let embedUrl = '';
      if (media.host === 'youtube') {
        embedUrl = `https://www.youtube.com/embed/${media.external_id}`; // Corrected YouTube URL
      } else if (media.host === 'vimeo') {
        embedUrl = `https://player.vimeo.com/video/${media.external_id}`;
      }

      if (embedUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl + '?autoplay=1&rel=0';
        iframe.allow =
          'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.frameBorder = '0';
        iframe.style.width = '100%';
        iframe.style.aspectRatio = '16/9';
        viewer.appendChild(iframe);
        console.log(`renderPopupViewer: External video iframe appended for ID: ${media.id}`);
        return;
      }
    }

    // --- Video ---
    if (media.media_type === 'video') {
      console.log('renderPopupViewer: Media type is native video.');
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';

      const validSource = (media.sources || []).find((s) =>
        s.mime_type?.includes('mp4')
      );

      if (validSource) {
        const source = document.createElement('source');
        source.src = validSource.url;
        source.type = validSource.mime_type;
        video.appendChild(source);
        viewer.appendChild(video);
        console.log(`renderPopupViewer: Native video appended for ID: ${media.id}`);
      } else {
        viewer.innerHTML = '<p>Video format not supported or no valid source found.</p>';
        console.warn(`renderPopupViewer: No valid video source found for ID: ${media.id}`);
      }

      return;
    }

    // --- Model ---
    if (media.media_type === 'model') {
      console.log('renderPopupViewer: Media type is 3D model.');
      const model = document.createElement('model-viewer');
      model.src = media.url;
      model.setAttribute('alt', media.alt || '3D model');
      model.setAttribute('camera-controls', 'true');
      model.setAttribute('camera-orbit', '0deg 75deg 2m');
      model.setAttribute('data-shopify-feature', '1.12'); // Or relevant feature tag
      model.style.width = '100%';
      model.style.height = '100%';
      viewer.appendChild(model);
      console.log(`renderPopupViewer: 3D model appended for ID: ${media.id}`);
      return;
    }

    // --- Fallback ---
    viewer.innerHTML = '<p>Unsupported media type.</p>';
    console.warn(`renderPopupViewer: Unsupported media type for ID: ${media.id}`);
  }

  renderVideoThumbItem(media) {
    console.log(`renderVideoThumbItem: Creating video thumbnail for media ID: ${media.id}`);
    const btn = document.createElement('button');
    btn.className = 'popup-thumb video-thumb-item'; // Added popup-thumb class for consistency
    btn.type = 'button';
    btn.setAttribute('data-media-id', media.id);

    // Safely access preview_image properties
    const thumbnailSrc = media.preview_image?.src || '';
    const videoTitle = media.alt || 'Untitled video';

    btn.innerHTML = `
      <div class="video-thumb-image">
        <img src="${thumbnailSrc}" width="130" height="80" loading="lazy" alt="${videoTitle}" />
      </div>
      <div class="video-thumb-meta">
        <p class="video-title">${videoTitle}</p>
      </div>
    `;

    return btn;
  }

  updatePopupThumbActive(mediaId) {
    console.log(`updatePopupThumbActive: Setting active thumbnail in popup to ${mediaId}`);
    const popup = document.getElementById('product-gallery-popup');
    if (!popup) {
      console.warn('updatePopupThumbActive: Popup not found.');
      return;
    }
    const thumbs = popup.querySelectorAll('[data-media-id]');

    thumbs.forEach((thumb) => {
      const thumbId = thumb.getAttribute('data-media-id');
      const isActive = thumbId == String(mediaId); // Ensure mediaId is compared as a string
      thumb.classList.toggle('is-active', isActive);
      if (isActive) {
        // Scroll active thumbnail into view if necessary
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        console.log(`updatePopupThumbActive: Popup thumbnail ${thumbId} set to active.`);
      }
    });
  }

  closePopup() {
    console.log('closePopup: Closing popup.');
    const popup = document.getElementById('product-gallery-popup');
    const viewer = popup?.querySelector('[data-popup-viewer]');

    if (viewer) {
      viewer.innerHTML = ''; // Clear media content
      viewer.classList.remove('is-zoomed-simple');
      viewer.classList.remove('popup-media-viewer-media-zoom-img');
      // Remove specific event listeners attached to the viewer for zoom
      viewer.removeEventListener('mousemove', this._handlePopupMouseMove);
      viewer.removeEventListener('click', this._handlePopupClick);
    }

    if (popup) popup.hidden = true;
    document.body.style.overflow = ''; // Reset overflow
    console.log('closePopup: Popup hidden, body overflow reset.');

    document.removeEventListener('keydown', this.handleEscClose);
  }

  // Use an arrow function for handleEscClose to maintain 'this' context
  handleEscClose = (e) => {
    if (e.key === 'Escape') {
      console.log('handleEscClose: Escape key pressed.');
      this.closePopup();
    }
  };
}

customElements.define('product-gallery', ProductGallery);