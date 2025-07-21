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
    if (!raw) {
      
      return;
    }

    try {
      this.mediaData = JSON.parse(raw.innerHTML.trim());
     
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
  

    this.initThumbnails();
   

    const currentActiveThumbnail = this.querySelector('.thumbnail-btn.is-active');

    if (!currentActiveThumbnail && this.mediaData.length > 0) {
    
      this.setActiveMedia(this.mediaData[0].id);
    } else if (currentActiveThumbnail) {
      this.activeMediaId = currentActiveThumbnail.getAttribute('data-media-id');
     

      const firstMedia = this.mediaData.find(m => m.id == this.activeMediaId);
      const mainImageContainer = this.main?.querySelector('[data-zoom-container]');

      if (mainImageContainer && firstMedia && firstMedia.media_type === 'image' && firstMedia.preview_image) {
        const img = mainImageContainer.querySelector('img');
        if (img && img.complete) {
         
          this.initZoom(mainImageContainer, firstMedia, true);
        } else if (img) {
          
          img.onload = () => {
            mainImageContainer.querySelector('.image-skeleton-wrapper')?.classList.add('loaded');
            this.initZoom(mainImageContainer, firstMedia, true);
          };
        }
      }
    }

    window.addEventListener('resize', this.handleResize.bind(this));
  

    this.main.addEventListener('click', (e) => {
     
      const container = e.target.closest('.main-image-container');
      if (container) {
        const media = this.mediaData.find((m) => m.id == this.activeMediaId);
        const popup = document.getElementById('product-gallery-popup');
        if (media && media.media_type !== 'model' && popup && popup.hidden) {
         
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
   
    const activeId = this.activeMediaId;
    const container = this.main?.querySelector('[data-zoom-container]');
    const media = this.mediaData.find((m) => m.id == activeId);

    if (!container || !media || media.media_type !== 'image' || !media.preview_image) {
     
      return;
    }

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
      } else {
        console.log('handleResize: Not desktop, not initializing zoom.');
      }
    });
  }

  initThumbnails() {
  
    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const mediaId = btn.getAttribute('data-media-id');
      const media = this.mediaData.find(m => m.id == mediaId);
      const isVideoThumb = media && (media.media_type === 'video' || media.media_type === 'external_video');

     

      btn.addEventListener('click', (e) => {
        
        if (isVideoThumb || this.activeMediaId === mediaId) {
         
          this.openPopup(mediaId);
        } else {
         
          this.setActiveMedia(mediaId);
        }
      });

      let hoverTimer;
      btn.addEventListener('mouseenter', () => {
        
        if (this.activeMediaId === mediaId) {
         
          return;
        }
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
    
    if (this.activeMediaId == id) {
     
      return;
    }
    this.activeMediaId = id;
    const media = this.mediaData.find((m) => m.id == id);
    if (!media || !this.main) {
      console.error(`setActiveMedia: Media or main element not found for ID: ${id}`);
      return;
    }

    this.main.innerHTML = '';

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
        img.loading = 'lazy';
        container.appendChild(skeletonWrapper);
        skeletonWrapper.appendChild(img);
        

        img.onload = () => {
          
          skeletonWrapper.classList.add('loaded');
          this.initZoom(container, media, true);
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
      
    }

    const buttons = this.querySelectorAll('.thumbnail-btn');
    buttons.forEach((btn) => {
      const btnId = btn.getAttribute('data-media-id');
      const isActive = btnId == String(id);
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
       
      }
    });
   
  }

  isDesktop() {
    return window.matchMedia('(min-width: 990px)').matches;
  }

  initZoom(container, media, forceStart = false) {
    
    if (!this.isDesktop()) {
    
      return;
    }
    const img = container.querySelector('img');
    if (!img || !media.preview_image || container.dataset.zoomInitialized === 'true') {
     
      return;
    }

    if (this.activeMediaId != media.id) {
       
        return;
    }

    container.dataset.zoomInitialized = 'true';
   

    const zoomResult = document.createElement('div');
    zoomResult.className = 'zoom-result';
    container.appendChild(zoomResult);

    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.style.zIndex = '100';
    container.appendChild(lens);

    const zoomImg = new Image();
    const imgWidth = media.preview_image.width || img.naturalWidth;
    const imgHeight = media.preview_image.height || img.naturalHeight;

    const imgAspect = imgWidth / imgHeight;
    const zoomWidth = 1600;
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

      container.removeEventListener('mousemove', moveLens);
      container.addEventListener('mousemove', moveLens);

      container.removeEventListener('mouseenter', this._handleZoomMouseEnter);
      this._handleZoomMouseEnter = () => {
        
        zoomResult.style.display = 'block';
        lens.style.display = 'block';
      };
      container.addEventListener('mouseenter', this._handleZoomMouseEnter);

      container.removeEventListener('mouseleave', this._handleZoomMouseLeave);
      this._handleZoomMouseLeave = () => {
       
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      };
      container.addEventListener('mouseleave', this._handleZoomMouseLeave);

      zoomResult.removeEventListener('mouseenter', this._handleZoomResultMouseEnter);
      this._handleZoomResultMouseEnter = () => {
        
        zoomResult.style.display = 'none';
        lens.style.display = 'none';
      };
      zoomResult.addEventListener('mouseenter', this._handleZoomResultMouseEnter);

      if (forceStart && this.lastMouseX && this.lastMouseY) {
       
        const rect = img.getBoundingClientRect();
        const inside = this.lastMouseX > rect.left && this.lastMouseX < rect.right && this.lastMouseY > rect.top && this.lastMouseY < rect.bottom;
        if (inside) {
         
          zoomResult.style.display = 'block';
          lens.style.display = 'block';
          moveLens({ clientX: this.lastMouseX, clientY: this.lastMouseY });
        } else {
          
        }
      }
    };
  }

  // --- Start of modified renderPopup ---
  renderPopup() {
    // Only append the popup HTML if it doesn't already exist in the DOM
    if (!document.getElementById('product-gallery-popup')) {
      
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
      
    } else {
     
    }
  }
  // --- End of modified renderPopup ---

  // --- Start of modified openPopup ---
  openPopup(mediaId) {
   
    // Ensure the popup HTML structure is in the DOM
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

    const titleContainer = popup.querySelector('[data-popup-title]');
    if (titleContainer) {
      titleContainer.textContent = this.getAttribute('data-product-title') || '';
    }

    const clickedMedia = this.mediaData.find((m) => m.id == mediaId);
    const defaultTab = clickedMedia && (clickedMedia.media_type === 'video' || clickedMedia.media_type === 'external_video') ? 'videos' : 'images';
   

    // If popup is already open, just update its content and return
    if (!popup.hidden) {
            this.renderPopupViewer(mediaId, viewer);
      this.updatePopupThumbActive(mediaId);
      return;
    }

    // First, make the popup visible
    popup.hidden = false;
    document.body.style.overflow = 'hidden';
   

    // Then, render the initial viewer content
    this.renderPopupViewer(mediaId, viewer);
    

    // Populate thumbnails and set up tabs only once when opening for the first time
    // or if they were cleared/not populated (e.g., if popup was removed from DOM)
    if (tabImages.innerHTML === '' && tabVideos.innerHTML === '') {
     
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
           
            const zoomedViewer = popup.querySelector(
              '.popup-media-viewer.is-zoomed-simple',
            );

            if (zoomedViewer) {
             
              zoomedViewer.classList.remove('is-zoomed-simple');
              const inner = zoomedViewer.querySelector('.popup-media-inner');
              if (inner) {
                inner.style.left = '0px';
                inner.style.top = '0px';
              }
            }

            this.renderPopupViewer(media.id, viewer);
            this.updatePopupThumbActive(media.id);
           
          });

          tabImages.appendChild(btn);
        } else if (
          media.media_type === 'video' ||
          media.media_type === 'external_video'
        ) {
          btn = this.renderVideoThumbItem(media);
          btn.addEventListener('click', () => {
           
            this.renderPopupViewer(
              media.id,
              document.querySelector('[data-popup-viewer]')
            );
            this.updatePopupThumbActive(media.id);
          });
          tabVideos.appendChild(btn);
        }
      });
     

      // Setup tab listeners
      tabs.forEach((tab) => {
        tab.removeEventListener('click', this._handlePopupTabClick); // Ensure no duplicate listeners
        this._handlePopupTabClick = () => {
         
          tabs.forEach((t) => t.classList.remove('is-active'));
          tab.classList.add('is-active');

          const type = tab.dataset.tab;
          tabImages.classList.toggle('hidden', type !== 'images');
          tabVideos.classList.toggle('hidden', type !== 'videos');

          const zoomedViewer = popup.querySelector(
            '.popup-media-viewer.is-zoomed-simple',
          );

          if (zoomedViewer) {
           
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
            
            this.renderPopupViewer(firstMedia.id, viewer);
            this.updatePopupThumbActive(firstMedia.id);
          } else {
           
          }
        };
        tab.addEventListener('click', this._handlePopupTabClick);
      });
    }

    // Set active tab based on clicked media
    tabs.forEach((tab) => {
      const isMatch = tab.dataset.tab === defaultTab;
      tab.classList.toggle('is-active', isMatch);
    });
    tabImages.classList.toggle('hidden', defaultTab !== 'images');
    tabVideos.classList.toggle('hidden', defaultTab !== 'videos');
   

    this.updatePopupThumbActive(mediaId);
   

    popup.querySelector('.popup-close').onclick = this.closePopup.bind(this);
    popup.querySelector('.product-popup-backdrop').onclick = this.closePopup.bind(this);
    document.addEventListener('keydown', this.handleEscClose);
   
  }
  // --- End of modified openPopup ---


  renderPopupViewer(mediaId, viewer) {
   
    const media = this.mediaData.find((m) => m.id == mediaId);
    if (!media) {
      console.error(`renderPopupViewer: Media not found for ID: ${mediaId}`);
      return;
    }

    // Stop and remove current media before adding new one
    const currentMediaElement = viewer.firstElementChild;
    if (currentMediaElement) {
        if (currentMediaElement.tagName === 'VIDEO') {
            currentMediaElement.pause();
            currentMediaElement.currentTime = 0;
        } else if (currentMediaElement.tagName === 'IFRAME') {
            try {
                currentMediaElement.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                currentMediaElement.contentWindow.postMessage('{ "method": "pause" }', '*');
            } catch (e) {
                console.warn("Failed to send pause message to iframe:", e);
            }
        } else if (currentMediaElement.tagName === 'MODEL-VIEWER') {
            currentMediaElement.pause();
        }
        currentMediaElement.remove(); // This is the crucial change: only remove the media element
    }

    viewer.classList.remove('popup-media-viewer-media-zoom-img');
    viewer.classList.remove('is-zoomed-simple');

    let newMediaElement; // Declare a variable to hold the new media element

    if (media.media_type === 'image') {
      
      viewer.classList.add('popup-media-viewer-media-zoom-img');

      const inner = document.createElement('div');
      inner.className = 'popup-media-inner';

      const skeletonWrapper = document.createElement('div');
      skeletonWrapper.className = 'image-skeleton-wrapper';

      const img = document.createElement('img');
      img.src = media.preview_image?.src ? media.preview_image.src.replace(/width=\d+/, 'width=1600') : '';
      img.alt = media.alt || '';
      img.loading = 'eager';
      img.className = 'popup-media-zoom-img';

      img.style.transition = 'transform 0.3s ease, transform-origin 0.1s ease';
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';

      skeletonWrapper.appendChild(img);
      inner.appendChild(skeletonWrapper);
      newMediaElement = inner; // Assign the new image container to newMediaElement
     

      img.onload = () => {
        skeletonWrapper.classList.add('loaded');
       
      };

      let isZoomed = false;

      viewer.removeEventListener('mousemove', this._handlePopupMouseMove);
      this._handlePopupMouseMove = (e) => {
        if (!isZoomed) return;

        const rect = viewer.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
      };
      viewer.addEventListener('mousemove', this._handlePopupMouseMove);

      viewer.removeEventListener('click', this._handlePopupClick);
      this._handlePopupClick = () => {
        isZoomed = !isZoomed;
        viewer.classList.toggle('is-zoomed-simple', isZoomed);
       

        const isLandscape = img.naturalWidth && img.naturalHeight ? img.naturalWidth > img.naturalHeight : true;
        const zoomLevel = isLandscape ? 1.5 : 1.2;

        img.style.transform = isZoomed ? `scale(${zoomLevel})` : 'scale(1)';
      };
      viewer.addEventListener('click', this._handlePopupClick);

    } else if (
      media.media_type === 'external_video' &&
      media.external_id &&
      media.host
    ) {
      
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
        newMediaElement = iframe; // Assign the new iframe to newMediaElement
       
      }
    } else if (media.media_type === 'video') {
      
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
        newMediaElement = video; // Assign the new video to newMediaElement
       
      } else {
        newMediaElement = document.createElement('p');
        newMediaElement.textContent = 'Video format not supported or no valid source found.';
        console.warn(`renderPopupViewer: No valid video source found for ID: ${media.id}`);
      }
    } else if (media.media_type === 'model') {
      
      const model = document.createElement('model-viewer');
      model.src = media.url;
      model.setAttribute('alt', media.alt || '3D model');
      model.setAttribute('camera-controls', 'true');
      model.setAttribute('camera-orbit', '0deg 75deg 2m');
      model.setAttribute('data-shopify-feature', '1.12');
      model.style.width = '100%';
      model.style.height = '100%';
      newMediaElement = model; // Assign the new model-viewer to newMediaElement
     
    } else {
      newMediaElement = document.createElement('p');
      newMediaElement.textContent = 'Unsupported media type.';
      console.warn(`renderPopupViewer: Unsupported media type for ID: ${media.id}`);
    }

    if (newMediaElement) {
        viewer.appendChild(newMediaElement); // Append the newly created media element
        
    }
  }

  renderVideoThumbItem(media) {
    
    const btn = document.createElement('button');
    btn.className = 'popup-thumb video-thumb-item';
    btn.type = 'button';
    btn.setAttribute('data-media-id', media.id);

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
   
    const popup = document.getElementById('product-gallery-popup');
    if (!popup) {
      console.warn('updatePopupThumbActive: Popup not found.');
      return;
    }
    const thumbs = popup.querySelectorAll('[data-media-id]');

    thumbs.forEach((thumb) => {
      const thumbId = thumb.getAttribute('data-media-id');
      const isActive = thumbId == String(mediaId);
      thumb.classList.toggle('is-active', isActive);
      if (isActive) {
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
       
      }
    });
  }

  closePopup() {

    const popup = document.getElementById('product-gallery-popup');
    const viewer = popup?.querySelector('[data-popup-viewer]');

    if (viewer) {
        // Stop and remove current media when closing
        const currentMediaElement = viewer.firstElementChild;
        if (currentMediaElement) {
            if (currentMediaElement.tagName === 'VIDEO') {
                currentMediaElement.pause();
                currentMediaElement.currentTime = 0;
            } else if (currentMediaElement.tagName === 'IFRAME') {
                try {
                    currentMediaElement.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    currentMediaElement.contentWindow.postMessage('{ "method": "pause" }', '*');
                } catch (e) {
                    console.warn("Failed to send pause message to iframe on close:", e);
                }
            } else if (currentMediaElement.tagName === 'MODEL-VIEWER') {
                currentMediaElement.pause();
            }
            currentMediaElement.remove();
        }

      viewer.classList.remove('is-zoomed-simple');
      viewer.classList.remove('popup-media-viewer-media-zoom-img');
      viewer.removeEventListener('mousemove', this._handlePopupMouseMove);
      viewer.removeEventListener('click', this._handlePopupClick);
    }

    if (popup) popup.hidden = true;
    document.body.style.overflow = '';
   

    document.removeEventListener('keydown', this.handleEscClose);
  }

  handleEscClose = (e) => {
    if (e.key === 'Escape') {
      
      this.closePopup();
    }
  };
}

customElements.define('product-gallery', ProductGallery);