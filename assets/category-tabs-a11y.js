/*
 * Tab pattern behaviour for .category-tabs (P0-E, WCAG 2.2 AA 4.1.2 / 2.1.1).
 *
 * The homepage "Shop by category" tabs and the reviews page tabs already used
 * native <button> elements, so they were operable, but they exposed no
 * role/state relationship and had no arrow-key navigation. The markup now
 * carries role="tablist"/"tab"/"tabpanel"; the selected state itself is driven
 * by an .active class toggled by each section's own controller, so this script
 * mirrors that class rather than owning selection.
 */
(function () {
  if (window.__fssCategoryTabsA11y) return;
  window.__fssCategoryTabsA11y = true;

  function tabsIn(list) {
    return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  }

  function sync(tab) {
    var selected = tab.classList.contains('active');
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    // Roving tabindex: one stop for the tablist, arrows move between tabs.
    tab.setAttribute('tabindex', selected ? '0' : '-1');
  }

  function onKeydown(e) {
    var tab = e.target.closest ? e.target.closest('[role="tab"]') : null;
    if (!tab) return;
    var list = tab.closest('[role="tablist"]');
    if (!list) return;

    var tabs = tabsIn(list);
    var i = tabs.indexOf(tab);
    if (i === -1) return;

    var next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;

    e.preventDefault();
    // Automatic activation: the panel follows focus, as the pointer flow does.
    next.focus();
    next.click();
  }

  function init() {
    var lists = document.querySelectorAll('.category-tabs[role="tablist"]');
    if (!lists.length) return;

    var observer = new MutationObserver(function (records) {
      records.forEach(function (r) { sync(r.target); });
    });

    Array.prototype.forEach.call(lists, function (list) {
      tabsIn(list).forEach(function (tab) {
        sync(tab);
        observer.observe(tab, { attributes: true, attributeFilter: ['class'] });
      });
    });

    document.addEventListener('keydown', onKeydown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
