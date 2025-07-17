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
    e.stopPropagation(); // Prevent event bubbling
    const container = e.target.closest('.main-image-container');
    if (container) {
      const media = this.mediaData.find((m) => m.id == this.activeMediaId);
      if (media.media_type != 'model') {
        this.openPopup(this.activeMediaId);
      }
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


  updateMainThumbActive(mediaId) {
  const thumbs = this.querySelectorAll('.custom-gallery-thumbnails .thumbnail-btn');
  thumbs.forEach((thumb) => {
    const thumbId = thumb.getAttribute('data-media-id');
    thumb.classList.toggle('is-active', thumbId === String(mediaId));
  });
}
  

 setActiveMedia(id) {
   console.log('Setting active media: ${id}');
  if (this.activeMediaId === id) return;
  this.activeMediaId = id;
  const media = this.mediaData.find((m) => m.id == id);
  if (!media || !this.main) return;

  this.main.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'main-image-container';
  container.setAttribute('data-media-id', id);
  if (media.media_type == 'image' || media.media_type === 'video' || media.media_type === 'external_video') {
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

      // Check if image is already loaded (e.g., cached)
      if (img.complete) {
        console.log('Image ${id} is cached, initializing zoom immediately');
        skeletonWrapper.classList.add('loaded');
        this.initZoom(container, media, true);
      } else {
        console.log('Image ${id} is not cached, waiting for onload');
        img.onload = () => {
          console.log('Image ${id} loaded, initializing zoom');
          skeletonWrapper.classList.add('loaded');
          this.initZoom(container, media, true);
        };
      }
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
  }
}

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  initZoom(container, media, forceStart = false) {
    console.log('Initializing zoom for media: ${media.id}, forceStart: ${forceStart}');
  if (!this.isDesktop()) return;
  const img = container.querySelector('img');
  if (!img || !media.preview_image || container.dataset.zoomInitialized === 'true') return;

  // Reset zoom initialization flag
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
          zoomResult.style.top = '14px';
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
renderPopup() {
  if (document.getElementById('product-gallery-popup')) return;

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
    `;
  document.body.appendChild(popupHTML.firstElementChild);
}

openPopup(mediaId) {


  const popup = document.getElementById('product-gallery-popup');
  if (!popup) {
    console.log('Rendering new popup');
    this.renderPopup();
  } else {
    console.log('Using existing popup');
  }

  const viewer = popup.querySelector('[data-popup-viewer]');
  const tabImages = popup.querySelector('[data-tab-content="images"]');
  const tabVideos = popup.querySelector('[data-tab-content="videos"]');
  const tabs = popup.querySelectorAll('.popup-tab');
  if (tabs.length === 0) return;

  const clickedMedia = this.mediaData.find((m) => m.id == mediaId);
  if (!clickedMedia) {
    console.error(`Media not found for ID: ${mediaId}`);
    return;
  }

  const defaultTab = clickedMedia.media_type === 'video' || clickedMedia.media_type === 'external_video' ? 'videos' : 'images';

  this.activeMediaId = mediaId;
  this.updateMainThumbActive(mediaId);

  // Preload and render viewer
/*  if (clickedMedia.media_type === 'image') {
    console.log(`Preloading image for media: ${mediaId}`);
    const preloadImg = new Image();
    preloadImg.src = clickedMedia.preview_image.src.replace(/width=\d+/, 'width=1600');
    preloadImg.onload = () => {
      console.log(`Image preloaded for media: ${mediaId}`);
      this.renderPopupViewer(mediaId, viewer);
    };
    preloadImg.onerror = (e) => {
      console.error(`Preload failed for media ${mediaId}:`, e);
      this.renderPopupViewer(mediaId, viewer); // Fallback to render without preload
    };
  } else {
    console.log(`Rendering non-image media: ${mediaId}`);
    this.renderPopupViewer(mediaId, viewer);
  } */

/*  if (popup.hidden) {
    console.log('Showing popup');
    popup.hidden = false;
    document.body.style.overflow = 'hidden';
  } */

  tabImages.innerHTML = '';
  tabVideos.innerHTML = '';

  this.mediaData.forEach((media) => {
    let btn;
    if (media.media_type === 'image') {
      btn = document.createElement('button');
      btn.className = 'popup-thumb';
      btn.type = 'button';
      btn.setAttribute('data-media-id', media.id);

      const skeletonWrapper = document.createElement('div');
      skeletonWrapper.className = 'image-skeleton-wrapper';
      const img = document.createElement('img');
      img.src = media.preview_image.src;
      img.alt = media.alt || '';
      img.width = media.preview_image.width;
      img.height = media.preview_image.height;
      skeletonWrapper.appendChild(img);
      btn.appendChild(skeletonWrapper);

      img.onload = () => skeletonWrapper.classList.add('loaded');

      btn.addEventListener('click', () => {
        this.activeMediaId = media.id;
        this.renderPopupViewer(media.id, viewer);
        this.updatePopupThumbActive(media.id);
        this.updateMainThumbActive(media.id);
      });

      let hoverTimer;
      btn.addEventListener('mouseenter', () => {
        if (this.activeMediaId === media.id) return;
        hoverTimer = setTimeout(() => {
          this.activeMediaId = media.id;
          this.renderPopupViewer(media.id, viewer);
          this.updatePopupThumbActive(media.id);
          this.updateMainThumbActive(media.id);
        }, 150);
      });
      btn.addEventListener('mouseleave', () => clearTimeout(hoverTimer));

      tabImages.appendChild(btn);
    } else if (media.media_type === 'video' || media.media_type === 'external_video') {
      btn = this.renderVideoThumbItem(media);
      tabVideos.appendChild(btn);
    }
  });

  tabs.forEach((tab) => {
    const isMatch = tab.dataset.tab === defaultTab;
    tab.classList.toggle('is-active', isMatch);
    tabImages.classList.toggle('hidden', defaultTab !== 'images');
    tabVideos.classList.toggle('hidden', defaultTab !== 'videos');

    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const type = tab.dataset.tab;
      tabImages.classList.toggle('hidden', type !== 'images');
      tabVideos.classList.toggle('hidden', type !== 'videos');

      const zoomedViewer = popup.querySelector('.popup-media-viewer.is-zoomed');
      if (zoomedViewer) {
        zoomedViewer.classList.remove('is-zoomed');
        const inner = zoomedViewer.querySelector('.popup-media-inner');
        if (inner) {
          inner.style.left = '0px';
          inner.style.top = '0px';
        }
      }

      let firstMedia = null;
      if (type === 'images') firstMedia = this.mediaData.find((m) => m.media_type === 'image');
      else if (type === 'videos') firstMedia = this.mediaData.find((m) => m.media_type === 'video' || m.media_type === 'external_video');

      if (firstMedia) {
        this.activeMediaId = firstMedia.id;
        this.renderPopupViewer(firstMedia.id, viewer);
        this.updatePopupThumbActive(firstMedia.id);
        this.updateMainThumbActive(firstMedia.id);
      }
    };
  });

  this.updatePopupThumbActive(mediaId);

  popup.querySelector('.popup-close').onclick = this.closePopup.bind(this);
  popup.querySelector('.product-popup-backdrop').onclick = this.closePopup.bind(this);
  document.addEventListener('keydown', this.handleEscClose);
}

renderPopupViewer(mediaId, viewer) {
  console.log('Rendering popup viewer for media: ${mediaId}');
  const media = this.mediaData.find((m) => m.id == mediaId);
  if (!media) return;

  // Clear only if necessary (e.g., different media type)
  const currentMediaType = viewer.dataset.currentMediaType;
  if (currentMediaType !== media.media_type) {
    viewer.innerHTML = '';
    viewer.classList.remove('popup-media-viewer-media-zoom-img');
    viewer.dataset.currentMediaType = media.media_type;
  }

  if (media.media_type === 'image') {
    viewer.classList.add('popup-media-viewer-media-zoom-img');

    let inner = viewer.querySelector('.popup-media-inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'popup-media-inner';
      viewer.appendChild(inner);
    }

    let skeletonWrapper = inner.querySelector('.image-skeleton-wrapper');
    if (!skeletonWrapper) {
      skeletonWrapper = document.createElement('div');
      skeletonWrapper.className = 'image-skeleton-wrapper';
      inner.appendChild(skeletonWrapper);
    }

    let img = skeletonWrapper.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'popup-media-zoom-img';
      img.alt = media.alt || '';
      img.loading = 'eager';
      img.style.transition = 'transform 0.3s ease, transform-origin 0.1s ease';
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';
      skeletonWrapper.appendChild(img);
    }

    img.src = media.preview_image.src.replace(/width=\d+/, 'width=1600');

    img.onload = () => {
      skeletonWrapper.classList.add('loaded');
    };

    let isZoomed = false;

    function handleMouseMove(e) {
      if (!isZoomed) return;
      const rect = viewer.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    }

    viewer.removeEventListener('mousemove', handleMouseMove); // Prevent duplicate listeners
    viewer.addEventListener('mousemove', handleMouseMove);

    viewer.onclick = () => {
      isZoomed = !isZoomed;
      viewer.classList.toggle('is-zoomed-simple', isZoomed);
      const isLandscape = img.naturalWidth > img.naturalHeight;
      const zoomLevel = isLandscape ? 1.5 : 1.2;
      img.style.transform = isZoomed ? `scale(${zoomLevel})` : 'scale(1)';
    };

    return;
  }

  // External Video
  if (media.media_type === 'external_video' && media.external_id && media.host) {
    let embedUrl = '';
    if (media.host === 'youtube') {
      embedUrl = `https://www.youtube.com/embed/${media.external_id}`;
    } else if (media.host === 'vimeo') {
      embedUrl = `https://player.vimeo.com/video/${media.external_id}`;
    }

    if (embedUrl) {
      let iframe = viewer.querySelector('iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.frameBorder = '0';
        iframe.style.width = '100%';
        iframe.style.aspectRatio = '16/9';
        viewer.appendChild(iframe);
      }
      iframe.src = embedUrl + '?autoplay=1&rel=0';
      return;
    }
  }

  // Video
  if (media.media_type === 'video') {
    let video = viewer.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';
      viewer.appendChild(video);
    }

    const validSource = (media.sources || []).find((s) => s.mime_type?.includes('mp4'));
    if (validSource) {
      let source = video.querySelector('source');
      if (!source) {
        source = document.createElement('source');
        video.appendChild(source);
      }
      source.src = validSource.url;
      source.type = validSource.mime_type;
      video.load(); // Reload video to apply new source
    } else {
      viewer.innerHTML = '<p>Video format not supported.</p>';
    }
    return;
  }

  // Fallback
  viewer.innerHTML = '<p>Unsupported media type.</p>';
}


renderVideoThumbItem(media) {
  const btn = document.createElement('button');
  btn.className = 'video-thumb-item';
  btn.type = 'button';
  btn.setAttribute('data-media-id', media.id);

  const thumbnailSrc = media.preview_image?.src || '';
  const videoTitle = media.alt || 'Untitled video';

  btn.innerHTML = `
    <div class="video-thumb-image">
      <img src="${thumbnailSrc}" width="130" height="80" loading="lazy" />
    </div>
    <div class="video-thumb-meta">
      <p class="video-title">${videoTitle}</p>
    </div>
  `;

  btn.addEventListener('click', () => {
    this.activeMediaId = media.id; // Update active media
    this.renderPopupViewer(media.id, document.querySelector('[data-popup-viewer]'));
    this.updatePopupThumbActive(media.id);
    this.updateMainThumbActive(media.id); // Sync main gallery thumbnails
  });

  let hoverTimer;
  btn.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      this.activeMediaId = media.id; // Update active media
      this.renderPopupViewer(media.id, document.querySelector('[data-popup-viewer]'));
      this.updatePopupThumbActive(media.id);
      this.updateMainThumbActive(media.id); // Sync main gallery thumbnails
    }, 150);
  });
  btn.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
  });

  return btn;
}

  updatePopupThumbActive(mediaId) {
    const popup = document.getElementById('product-gallery-popup');
    const thumbs = popup.querySelectorAll('[data-media-id]');

    thumbs.forEach((thumb) => {
      const thumbId = thumb.getAttribute('data-media-id');
      thumb.classList.toggle('is-active', thumbId === String(mediaId));
    });
  }

  closePopup() {
    const popup = document.getElementById('product-gallery-popup');
    const viewer = popup.querySelector('[data-popup-viewer]');

    if (viewer) viewer.innerHTML = '';
    viewer.classList.remove('is-zoomed');

    popup.hidden = true;
    document.body.style.overflow = '';

    document.removeEventListener('keydown', this.handleEscClose);
  }

  handleEscClose = (e) => {
    if (e.key === 'Escape') this.closePopup();
  };

}

customElements.define('product-gallery', ProductGallery);
