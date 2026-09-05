/* Issue #800: progressively enhance the existing Remanufactured-only players.
 * Sources, condition gating, placement and product data remain in their sections.
 * One controller covers extra-info and HGS-extra-info without a pricing dependency.
 */
(() => {
  'use strict';
  if (window.__fssRemanVideo800) return;
  window.__fssRemanVideo800 = true;
  const selector = '.remanufacturing-process-video .custom-video-wrapper';
  let nextId = 0;

  function enhance(wrapper) {
    if (wrapper.dataset.fssRemanEnhanced === 'true') return;
    const original = wrapper.querySelector('.custom-video-poster');
    const video = wrapper.querySelector('video.custom-video');
    if (!original || !video) return;

    const opener = document.createElement('button');
    opener.type = 'button';
    opener.className = original.className + ' fss-reman-open';
    opener.setAttribute('aria-label', 'Play our remanufacturing process video');
    opener.setAttribute('aria-expanded', 'false');
    Array.from(original.childNodes).forEach(node => opener.appendChild(node.cloneNode(true)));
    opener.querySelectorAll('svg').forEach(svg => {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    });
    if (!video.id) {
      do { video.id = 'fss-reman-video-' + (++nextId); }
      while (document.getElementById(video.id) !== video);
    }
    opener.setAttribute('aria-controls', video.id);
    video.controls = true;
    video.playsInline = true;
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.setAttribute('aria-label', 'Our remanufacturing process video');

    const stage = document.createElement('div');
    stage.className = 'fss-reman-stage';
    const closer = document.createElement('button');
    closer.type = 'button';
    closer.className = 'fss-reman-close';
    closer.textContent = 'Close video';
    closer.setAttribute('aria-controls', video.id);
    const status = document.createElement('span');
    status.className = 'fss-reman-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    // Replacing the poster drops its legacy click listeners. Capture below also
    // prevents a later legacy DOMContentLoaded handler from starting it twice.
    original.replaceWith(stage);
    stage.append(opener, video, closer, status);
    wrapper.dataset.fssRemanEnhanced = 'true';
    let active = false;
    let generation = 0;

    function reset(returnFocus) {
      active = false;
      generation += 1;
      video.pause();
      try { video.currentTime = 0; } catch (_) { video.load(); }
      video.hidden = true;
      video.style.setProperty('display', 'none', 'important');
      closer.hidden = true;
      opener.hidden = false;
      opener.setAttribute('aria-expanded', 'false');
      wrapper.dataset.fssRemanOpen = 'false';
      status.textContent = '';
      if (returnFocus && opener.isConnected) opener.focus({ preventScroll: true });
    }

    function open(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (active) return;
      active = true;
      const request = ++generation;
      opener.hidden = true;
      opener.setAttribute('aria-expanded', 'true');
      video.hidden = false;
      video.style.setProperty('display', 'block', 'important');
      closer.hidden = false;
      wrapper.dataset.fssRemanOpen = 'true';
      closer.focus({ preventScroll: true });
      try {
        const playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {
            if (active && request === generation) {
              status.textContent = 'Playback did not start. Use the video controls to play, or close the video.';
            }
          });
        }
      } catch (_) {
        status.textContent = 'Playback did not start. Use the video controls to play, or close the video.';
      }
    }
    opener.addEventListener('click', open, true);
    closer.addEventListener('click', event => { event.preventDefault(); reset(true); });
    wrapper.addEventListener('keydown', event => {
      if (active && event.key === 'Escape' && !document.fullscreenElement) {
        event.preventDefault();
        event.stopPropagation();
        reset(true);
      }
    });
    // Cancel a late play completion after a fast close.
    video.addEventListener('play', () => { if (!active) { video.pause(); try { video.currentTime = 0; } catch (_) {} } });
    video.addEventListener('error', () => {
      if (active) status.textContent = 'The video could not load. Close the video and try again.';
    });
    reset(false);
  }

  function scan(root) {
    if (root.matches && root.matches(selector)) enhance(root);
    if (root.querySelectorAll) root.querySelectorAll(selector).forEach(enhance);
  }
  function start() {
    scan(document);
    document.addEventListener('shopify:section:load', event => scan(event.target));
    // Product section swaps do not always dispatch the theme-editor event.
    const root = document.getElementById('MainContent');
    if (root) new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === 1) scan(node);
      }));
    }).observe(root, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
