(function () {
  'use strict';

  const onReady = (fn) =>
    (document.readyState === 'loading')
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn();

  const debounce = (fn, wait = 150) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  };

  const reqAnimationFrame = (() => {
    let q = [], scheduled = false;
    const run = () => { scheduled = false; const jobs = q; q = []; for (const f of jobs) f(); };
    return (fn) => { q.push(fn); if (!scheduled) { scheduled = true; requestAnimationFrame(run); } };
  })();

  onReady(() => {
    const headers = document.querySelectorAll('.accordion-header');
    if (!headers.length) return;

    headers.forEach((header) => {
      const content = header.nextElementSibling;
      if (!content) return;
      content.style.overflow = content.style.overflow || 'hidden';
      content.style.transition = content.style.transition || 'max-height 0.3s ease, opacity 0.2s ease';

      const expanded = header.getAttribute('aria-expanded') === 'true';
      content.style.opacity = expanded ? '1' : '0';
      content.style.maxHeight = expanded ? content.scrollHeight + 'px' : '0';

      const links = content.querySelectorAll('a');
      links.forEach((a) => a.setAttribute('tabindex', expanded ? '0' : '-1'));
      content.setAttribute('aria-hidden', expanded ? 'false' : 'true');

      if (!header.id) header.id = `acc-h-${Math.random().toString(36).slice(2,7)}`;
      if (!content.id) content.id = `acc-p-${Math.random().toString(36).slice(2,7)}`;
      header.setAttribute('role', header.getAttribute('role') || 'button');
      header.setAttribute('aria-controls', content.id);
      content.setAttribute('role', content.getAttribute('role') || 'region');
      content.setAttribute('aria-labelledby', header.id);
    });

    const stateByAccordion = new WeakMap();

    const findAccordionRoot = (el) =>
      el.closest('.accordion') || el.closest('[data-accordion-root]') || document;

    const getContent = (header) => header?.nextElementSibling;

    const setLinksTabindex = (content, enabled) => {
      if (!content) return;
      content.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', enabled ? '0' : '-1'));
    };

    const openItem = (header) => {
      const content = getContent(header);
      if (!content) return;

      header.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');
      setLinksTabindex(content, true);

      reqAnimationFrame(() => {
        const h = content.scrollHeight;
        content.style.maxHeight = h + 'px';
        content.style.opacity = '1';
      });
    };

    const closeItem = (header) => {
      const content = getContent(header);
      if (!content) return;

      header.setAttribute('aria-expanded', 'false');
      setLinksTabindex(content, false);

      reqAnimationFrame(() => {
        content.style.maxHeight = '0';
        content.style.opacity = '0';
      });

      const onEnd = (ev) => {
        if (ev.propertyName !== 'max-height') return;
        content.removeEventListener('transitionend', onEnd);
        content.setAttribute('aria-hidden', 'true');
      };
      content.addEventListener('transitionend', onEnd, { once: true });
    };

    const toggleItem = (header) => {
      if (!header) return;
      const accordionRoot = findAccordionRoot(header);
      const content = getContent(header);
      if (!content) return;

      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      const current = stateByAccordion.get(accordionRoot);
      if (current && current !== header) closeItem(current);

      if (isExpanded) {
        closeItem(header);
        stateByAccordion.set(accordionRoot, null);
      } else {
        openItem(header);
        stateByAccordion.set(accordionRoot, header);
      }
    };

    headers.forEach((header) => {
      if (header.getAttribute('aria-expanded') === 'true') {
        const root = findAccordionRoot(header);
        stateByAccordion.set(root, header);
      }
    });

    document.addEventListener('click', (e) => {
      const header = e.target.closest('.accordion-header');
      if (!header) return;
      e.preventDefault(); 
      toggleItem(header);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      const header = e.target.closest('.accordion-header');
      if (!header) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem(header);
      }
    }, { passive: false });

    const ro = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const header = document.getElementById(target.getAttribute('aria-labelledby'));
        if (!header) continue;
        if (header.getAttribute('aria-expanded') === 'true') {
          reqAnimationFrame(() => { target.style.maxHeight = target.scrollHeight + 'px'; });
        }
      }
    });
    document.querySelectorAll('.accordion-header + *').forEach((panel) => ro.observe(panel));

    window.addEventListener('resize', debounce(() => {
      document.querySelectorAll('.accordion-header[aria-expanded="true"] + *')
        .forEach((panel) => { panel.style.maxHeight = panel.scrollHeight + 'px'; });
    }, 150), { passive: true });
  });
})();
