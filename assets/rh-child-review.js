/* Read-only filtering within a dedicated preview section. No fetch, cart or storage writes. */
(function () {
  'use strict';
  function compact(value) { return String(value || '').trim().toLowerCase().replace(/[‐‑–—]/g, '-'); }
  function tokens(value) {
    return String(value || '').toLowerCase().replace(/dumbbells/g, 'dumbbell').replace(/[^a-z0-9.]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  }
  function matching(cards, query) {
    var exact = cards.filter(function (card) { return compact(card.dataset.sku) === compact(query) && compact(query) !== ''; });
    if (exact.length) return exact;
    var wanted = tokens(query);
    return cards.filter(function (card) {
      var available = tokens(card.dataset.title + ' ' + card.dataset.sku);
      return wanted.every(function (word) { return available.indexOf(word) !== -1; });
    });
  }
  function mount(root) {
    if (root.dataset.rhMounted) return;
    root.dataset.rhMounted = '1';
    var cards = Array.from(root.querySelectorAll('[data-rh-card]'));
    var input = root.querySelector('[data-rh-query]');
    var count = root.querySelector('[data-rh-count]');
    var warning = root.querySelector('[data-rh-warning]');
    var empty = root.querySelector('[data-rh-empty]');
    var unique = new Set(cards.map(function (card) { return card.dataset.productId; }));
    if (cards.length !== Number(root.dataset.expectedCount) || unique.size !== cards.length) {
      warning.hidden = false;
      warning.textContent = 'HOLD: expected 54 distinct child products, rendered ' + cards.length + ' cards / ' + unique.size + ' unique IDs. Do not treat this preview as complete.';
    }
    function apply() {
      var shown = new Set(matching(cards, input.value));
      cards.forEach(function (card) { card.hidden = !shown.has(card); });
      count.textContent = shown.size + ' of ' + cards.length + ' child products';
      empty.hidden = shown.size !== 0;
    }
    input.value = new URLSearchParams(window.location.search).get('q') || '';
    input.addEventListener('input', apply);
    apply();
  }
  function init(scope) {
    if (scope.matches && scope.matches('[data-rh-review]')) mount(scope);
    scope.querySelectorAll('[data-rh-review]').forEach(mount);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { compact: compact, tokens: tokens, matching: matching };
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);
  document.addEventListener('shopify:section:load', function (event) { init(event.target); });
})();
