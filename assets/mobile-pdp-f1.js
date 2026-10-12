(() => {
  const pilotHandles = new Set([
    'french-fitness-tahoe-assisted-chin-dip-new',
    'french-fitness-fsr90-functional-trainer-smith-squat-rack-machine-new',
    'french-fitness-monster-p-l-hack-squat-leg-press-new',
    'bowflex-treadclimber-tc5000-remanufactured',
    'french-fitness-rack-rig-seal-row-pad-attachment-new'
  ]);
  const match = window.location.pathname.match(/^\/products\/([^/?#]+)/);
  const handle = match ? decodeURIComponent(match[1]) : '';
  if (!pilotHandles.has(handle)) return;

  const mobile = window.matchMedia('(max-width: 749px)');
  const optionStates = new Map();
  let descriptionState = null;
  let galleryState = null;

  document.body.classList.add('f1-mobile-pdp');
  document.documentElement.dataset.f1MobilePdp = 'increment-1';
  window.__F1MobilePDP = {
    active: true,
    handle,
    increment: 1,
    scope: 'pilot-mobile-only'
  };

  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const key = (value) => normalize(value).toLowerCase();
  const uid = (prefix) => prefix + '-' + Math.random().toString(36).slice(2, 9);

  const parsePrice = (input) => {
    const fieldPrice = input.dataset.fieldPrice || '';
    const direct = fieldPrice.match(/-?[\d,.]+/);
    if (direct) return Number(direct[0].replace(/,/g, '')) || 0;
    const parts = String(input.value || '').split(':::').slice(1);
    return parts.reduce((sum, part) => {
      const number = Number(String(part).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(number) ? sum + number : sum;
    }, 0);
  };

  const formatPrice = (value) => {
    const absolute = Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? '-$' + absolute : '+$' + absolute;
  };

  const optionGroupKind = (title) => {
    const text = key(title);
    if (text.includes('cable attachments')) return 'cable';
    if (text.includes('accessories') || text.includes('add ons') || text.includes('add-ons')) return 'accessories';
    return '';
  };

  const updateGroupSummary = (state) => {
    const rows = Array.from(state.content.querySelectorAll('.product-options__accordion')).filter((row) => row.style.display !== 'none');
    const checked = Array.from(state.content.querySelectorAll('input[data-customization-option]:checked:not(:disabled)')).filter((input) => {
      const name = key(input.dataset.fieldName);
      return name && !name.includes('no thanks') && !name.includes('none');
    });
    const total = checked.reduce((sum, input) => sum + parsePrice(input), 0);
    const typeLabel = state.kind === 'cable' ? 'attachment types' : 'optional add ons';
    let text = rows.length + ' ' + typeLabel + ' · ' + (checked.length ? checked.length + ' selected' : 'none selected');
    if (checked.length && Math.abs(total) > 0.005) text += ' · ' + formatPrice(total);
    state.summary.textContent = text;
  };

  const setGroupOpen = (state, open) => {
    state.open = open;
    state.content.hidden = !open;
    state.toggle.setAttribute('aria-expanded', String(open));
    state.header.classList.toggle('is-open', open);
    state.toggle.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + state.label);
  };

  const collapseOptionGroups = () => {
    document.querySelectorAll('.product__info-wrapper .product-option__item').forEach((item) => {
      if (optionStates.has(item)) return;
      const title = item.querySelector(':scope > .product-options__category-title');
      if (!title) return;
      const label = normalize(title.childNodes.length ? title.textContent : '');
      const kind = optionGroupKind(label);
      if (!kind) return;

      const originalChildren = Array.from(item.children);
      const header = document.createElement('div');
      const summary = document.createElement('div');
      const toggle = document.createElement('button');
      const content = document.createElement('div');
      const contentId = uid('f1-option-content');

      header.className = 'f1-option-group-header';
      summary.className = 'f1-option-group-summary';
      toggle.className = 'f1-option-group-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-controls', contentId);
      toggle.innerHTML = '<span aria-hidden="true"></span>';
      content.className = 'f1-option-group-content';
      content.id = contentId;

      item.insertBefore(header, item.firstChild);
      header.appendChild(title);
      header.appendChild(summary);
      header.appendChild(toggle);
      originalChildren.filter((node) => node !== title).forEach((node) => content.appendChild(node));
      item.appendChild(content);
      item.classList.add('f1-option-group');

      const state = { item, title, originalChildren, header, summary, toggle, content, kind, label, open: false };
      optionStates.set(item, state);
      updateGroupSummary(state);
      setGroupOpen(state, false);

      const toggleOpen = () => setGroupOpen(state, !state.open);
      toggle.addEventListener('click', toggleOpen);
      header.addEventListener('click', (event) => {
        if (event.target.closest('a, button')) return;
        toggleOpen();
      });
      content.addEventListener('change', () => updateGroupSummary(state));
      content.addEventListener('click', () => window.setTimeout(() => updateGroupSummary(state), 0));
    });
  };

  const restoreOptionGroups = () => {
    optionStates.forEach((state, item) => {
      state.originalChildren.forEach((node) => item.appendChild(node));
      state.header.remove();
      state.content.remove();
      item.classList.remove('f1-option-group');
    });
    optionStates.clear();
  };

  const classifyDescriptionNode = (node) => {
    const heading = key(node.querySelector?.('.product__extra_info-title, h2, h3')?.textContent || '');
    const identity = key((node.className || '') + ' ' + (node.id || ''));

    if (/download|manual/.test(heading)) return 'downloads';
    if (/warranty/.test(heading)) return 'warranty';
    if (/frequently asked|\bfaq\b|questions/.test(heading)) return 'faq';
    if (/set includes|what.?s included|package inclusions|rig frame pieces|attachments & accessories|accessories included/.test(heading)) return 'included';
    if (/tech spec|weight stack|smith bar|shipping dimensions|comparison chart|compare similar|dimensions & weight/.test(heading)) return 'tech';
    if (/description|all-in-one|all in one|ultimate|remanufacturing process/.test(heading)) return 'overview';
    if (/feature|benefit|buying guide|accessory feature|recommended|other french fitness|product video/.test(heading)) return 'features';

    if (/product__extra_warranty/.test(identity)) return 'warranty';
    if (/product__extra_smith|comparision-chart|comparison-chart/.test(identity)) return 'tech';
    if (/product__extra_accessories/.test(identity)) return 'included';
    if (/product__extra_overview/.test(identity)) return 'features';

    const full = key(node.textContent).slice(0, 240);
    if (/download|manual|prop\s*65|california residents/.test(full)) return 'downloads';
    if (/frequently asked|\bfaq\b/.test(full)) return 'faq';
    if (/warranty/.test(full)) return 'warranty';
    if (/tech spec|shipping dimensions|dimensions & weight/.test(full)) return 'tech';
    if (/set includes|what.?s included|package inclusions/.test(full)) return 'included';
    if (/description|all-in-one|all in one|ultimate|remanufacturing process/.test(full)) return 'overview';
    return 'features';
  };

  const teaserFor = (nodes, fallback) => {
    for (const node of nodes) {
      const clone = node.cloneNode(true);
      clone.querySelectorAll('script, style, svg, button, .product__extra_info-title, h1, h2, h3').forEach((child) => child.remove());
      const text = normalize(clone.textContent);
      if (!text) continue;
      return text.length > 92 ? text.slice(0, 89).trimEnd() + '…' : text;
    }
    return fallback;
  };

  const buildDescriptionAccordions = () => {
    if (descriptionState) return;
    const wrap = document.querySelector('.product__extra_info-wrap');
    if (!wrap) return;
    const nodes = Array.from(wrap.children).filter((node) => !node.matches('.f1-description-accordions, script, style, template'));
    if (!nodes.length) return;

    const definitions = [
      ['overview', 'Overview', 'Product overview and key details'],
      ['tech', 'Tech Specs', 'Dimensions, specifications and performance details'],
      ['included', 'What’s Included', 'Included components and accessories'],
      ['features', 'Features & Benefits', 'Features, benefits and buying guidance'],
      ['faq', 'FAQ', 'Common product questions'],
      ['warranty', 'Warranty', 'Coverage and warranty details'],
      ['downloads', 'Downloads', 'Manuals, downloads and Prop 65 information']
    ];
    const buckets = Object.fromEntries(definitions.map(([name]) => [name, []]));
    const originals = nodes.map((node) => {
      const marker = document.createComment('f1-mobile-pdp-original-position');
      wrap.insertBefore(marker, node);
      buckets[classifyDescriptionNode(node)].push(node);
      return { node, marker };
    });

    const container = document.createElement('div');
    container.className = 'f1-description-accordions';
    wrap.insertBefore(container, originals[0].marker);

    definitions.forEach(([name, label, fallback]) => {
      const bucket = buckets[name];
      if (!bucket.length) return;
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      const labelNode = document.createElement('span');
      const teaser = document.createElement('span');
      const icon = document.createElement('span');
      const panel = document.createElement('div');

      details.className = 'f1-description-accordion';
      summary.className = 'f1-description-summary';
      labelNode.className = 'f1-description-label';
      teaser.className = 'f1-description-teaser';
      icon.className = 'f1-description-chevron';
      icon.setAttribute('aria-hidden', 'true');
      panel.className = 'f1-description-panel';
      labelNode.textContent = label;
      teaser.textContent = teaserFor(bucket, fallback);

      summary.append(labelNode, teaser, icon);
      details.append(summary, panel);
      bucket.forEach((node) => panel.appendChild(node));
      container.appendChild(details);
    });

    descriptionState = { wrap, container, originals };
  };

  const restoreDescription = () => {
    if (!descriptionState) return;
    descriptionState.originals.forEach(({ node, marker }) => {
      marker.parentNode.insertBefore(node, marker.nextSibling);
      marker.remove();
    });
    descriptionState.container.remove();
    descriptionState = null;
  };

  const thumbnailUrl = (src) => {
    try {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('width', '120');
      return url.toString();
    } catch (error) {
      return src;
    }
  };

  const setupGallery = () => {
    if (galleryState) return;
    const gallery = document.querySelector('mobile-gallery');
    const slider = gallery?.querySelector('.mobile-gallery-slider');
    const dots = gallery?.querySelector('.mobile-gallery-dots');
    const mediaEl = document.querySelector('[data-product-media]');
    if (!gallery || !slider || !dots || !mediaEl) return;

    let media;
    try {
      media = JSON.parse(mediaEl.innerHTML.trim());
    } catch (error) {
      return;
    }

    const imageMedia = media
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.media_type === 'image' && item.preview_image?.src)
      .slice(0, 6);
    if (!imageMedia.length) return;

    const nav = document.createElement('div');
    nav.className = 'f1-mobile-gallery-thumbnails';
    nav.setAttribute('role', 'group');
    nav.setAttribute('aria-label', 'Product image thumbnails');

    imageMedia.forEach(({ item, index }, position) => {
      const button = document.createElement('button');
      const image = document.createElement('img');
      button.type = 'button';
      button.className = 'f1-mobile-gallery-thumb';
      button.dataset.slideIndex = String(index);
      button.setAttribute('aria-label', 'View product image ' + (position + 1));
      image.src = thumbnailUrl(item.preview_image.src);
      image.alt = item.alt || '';
      image.width = 56;
      image.height = 56;
      image.loading = 'lazy';
      button.appendChild(image);
      nav.appendChild(button);
    });

    dots.insertAdjacentElement('beforebegin', nav);
    galleryState = { gallery, slider, dots, nav, media, imageMedia, bound: false };

    const bind = (attempt = 0) => {
      if (!galleryState || galleryState.slider !== slider) return;
      const jq = window.jQuery;
      if (!jq || !jq(slider).hasClass('slick-initialized')) {
        if (attempt < 50) window.setTimeout(() => bind(attempt + 1), 100);
        return;
      }
      if (galleryState.bound) return;
      galleryState.bound = true;
      const update = (index) => {
        nav.querySelectorAll('.f1-mobile-gallery-thumb').forEach((button) => {
          const active = Number(button.dataset.slideIndex) === Number(index);
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-current', active ? 'true' : 'false');
        });
      };
      nav.addEventListener('click', (event) => {
        const button = event.target.closest('.f1-mobile-gallery-thumb');
        if (!button) return;
        jq(slider).slick('slickGoTo', Number(button.dataset.slideIndex));
      });
      jq(slider).on('afterChange.f1MobilePdp', (_event, _slick, currentSlide) => update(currentSlide));
      const current = jq(slider).slick('slickCurrentSlide') || 0;
      update(current);
    };
    bind();
  };

  const restoreGallery = () => {
    if (!galleryState) return;
    if (window.jQuery) window.jQuery(galleryState.slider).off('.f1MobilePdp');
    galleryState.nav.remove();
    galleryState = null;
  };

  const applyMode = () => {
    if (mobile.matches) {
      collapseOptionGroups();
      buildDescriptionAccordions();
      setupGallery();
    } else {
      restoreOptionGroups();
      restoreDescription();
      restoreGallery();
    }
  };

  const start = () => {
    applyMode();
    if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', applyMode);
    else if (typeof mobile.addListener === 'function') mobile.addListener(applyMode);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
