/*********************** Family cards (Rubber Hex + Turf) ************************/
/*
 * Turns the family-page card in Boost collection/search grids into one card with
 * labeled choices. Image, configuration label, price and link always come from
 * the selected choice's own product (/products/<handle>.js), so they agree.
 * Only the cards listed in FAMILIES are touched; every other card is unchanged.
 */
(function () {
  var FAMILIES = {
    // Turf family page 10380015927612
    '10380015927612': {
      title: 'French Fitness Gym Turf Roll',
      subtitle: '82 ft × 6.5 ft',
      indicator: '3 Turf Grades',
      action: 'View turf options',
      defaultIndex: 1,
      secondary: function (prices) { return prices.length + ' grades from ' + money(Math.min.apply(null, prices)); },
      choices: [
        { label: 'V1 Base', config: 'V1 Base', keywords: ['v1', 'base'], handle: 'french-fitness-artificial-grass-synthetic-lawn-turf-flooring-roll-82-x-6-5-v1-base' },
        { label: 'V2 Plus', config: 'V2 Plus', keywords: ['v2', 'plus'], handle: 'french-fitness-artificial-grass-synthetic-lawn-turf-flooring-roll-82-x-6-5-v2-plus' },
        { label: 'V3 Premium', config: 'V3 Premium', keywords: ['v3', 'premium'], handle: 'french-fitness-artificial-grass-synthetic-lawn-turf-flooring-roll-82-x-6-5-v3-premium' }
      ]
    },
    // Rubber Hex family page 10353232380220
    '10353232380220': {
      title: 'French Fitness Rubber Hex Dumbbells',
      subtitle: '',
      indicator: 'Singles & Sets',
      action: 'Choose weight or set',
      defaultIndex: 0,
      secondary: function (prices) { return 'Singles from ' + money(prices[1]) + ' each'; },
      choices: [
        { label: 'Sets', config: '5–50 lb set — dumbbells only', keywords: ['set', 'sets'], handle: 'french-fitness-rubber-coated-hex-dumbbell-set-5-50-lbs-new' },
        { label: 'Singles', config: '2.5 lb single dumbbell', suffix: ' each', keywords: ['single', 'singles'], handle: 'french-fitness-rubber-coated-hex-dumbbell-2-5-lbs-single-new' }
      ]
    }
  };

  var STYLE_ID = 'fs-family-style';
  var CSS =
    '.fs-family{margin:6px 0 4px}' +
    '.fs-family__subtitle{font-size:14px;color:#555;margin:2px 0 6px}' +
    '.fs-family__indicator{font-size:12px;font-weight:700;color:#D12E06;text-transform:uppercase;letter-spacing:.3px;margin:0 0 6px}' +
    '.fs-family__choices{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 6px}' +
    '.fs-family__choice{border:1px solid #D12E06;background:#fff;color:#D12E06;border-radius:4px;padding:6px 10px;font-size:13px;font-weight:600;line-height:1.1;cursor:pointer}' +
    '.fs-family__choice.is-selected{background:#D12E06;color:#fff}' +
    '.fs-family__config{font-size:14px;font-weight:700;color:#23232B;margin:2px 0 0}' +
    '.fs-family__from{font-size:13px;color:#555;margin:4px 0 0}' +
    '.fs-family__action{display:inline-block;margin:6px 0 0;font-size:14px;font-weight:700;color:#D12E06;text-decoration:underline}' +
    '@media (max-width:749px){.fs-family__choice{padding:6px 8px;font-size:12px}}';

  var cache = {};

  function money(cents) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  function getProduct(handle) {
    if (!cache[handle]) {
      cache[handle] = fetch('/products/' + handle + '.js', { credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error('fetch ' + handle + ' ' + r.status);
        return r.json();
      });
    }
    return cache[handle];
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function imageUrl(src, width) {
    if (!src) return '';
    var url = src.indexOf('//') === 0 ? 'https:' + src : src;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'width=' + width;
  }

  // An explicit search (e.g. "v3 turf") opens on the matching choice instead of the default.
  function startIndex(fam) {
    var q = (new URLSearchParams(window.location.search).get('q') || '').toLowerCase().split(/[^a-z0-9]+/);
    for (var i = 0; i < fam.choices.length; i++) {
      var kw = fam.choices[i].keywords || [];
      for (var k = 0; k < kw.length; k++) if (q.indexOf(kw[k]) !== -1) return i;
    }
    return fam.defaultIndex;
  }

  function apply(card, fam, products, index) {
    var choice = fam.choices[index];
    var p = products[index];
    var url = '/products/' + p.handle;

    card.querySelectorAll('a.boost-sd__product-link').forEach(function (a) { a.setAttribute('href', url); });

    var img = card.querySelector('img.boost-sd__product-image-img--main');
    if (img && p.featured_image) {
      img.removeAttribute('srcset');
      img.setAttribute('src', imageUrl(p.featured_image, 500));
      img.setAttribute('alt', p.title);
    }

    card.querySelectorAll('.fs-family__choice').forEach(function (b, i) {
      b.classList.toggle('is-selected', i === index);
      b.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });

    var cfg = card.querySelector('.fs-family__config');
    if (cfg) cfg.textContent = choice.config;

    var price = card.querySelector('.boost-sd__product-price .boost-sd__format-currency');
    if (price) price.textContent = money(p.price) + (choice.suffix || '');
    var hidden = card.querySelector('.boost-sd__product-price .boost-sd__visually-hidden');
    if (hidden) hidden.textContent = 'Price ' + money(p.price) + (choice.suffix || '') + ', ' + choice.config;

    var action = card.querySelector('.fs-family__action');
    if (action) action.setAttribute('href', url);
  }

  function enhance(card) {
    var id = card.getAttribute('data-product-id');
    var fam = FAMILIES[id];
    if (!fam || card.getAttribute('data-fs-family') === 'pending' || card.getAttribute('data-fs-family') === 'done') return;
    card.setAttribute('data-fs-family', 'pending');

    Promise.all(fam.choices.map(function (c) { return getProduct(c.handle); }))
      .then(function (products) {
        injectStyle();

        var title = card.querySelector('.boost-sd__product-title');
        if (title) title.textContent = fam.title;

        var box = document.createElement('div');
        box.className = 'fs-family';
        var html = '';
        if (fam.subtitle) html += '<div class="fs-family__subtitle">' + fam.subtitle + '</div>';
        html += '<div class="fs-family__indicator">' + fam.indicator + '</div><div class="fs-family__choices" role="group" aria-label="' + fam.indicator + '">';
        fam.choices.forEach(function (c, i) {
          html += '<button type="button" class="fs-family__choice" data-index="' + i + '">' + c.label + '</button>';
        });
        html += '</div><div class="fs-family__config"></div>';
        box.innerHTML = html;

        var titleLink = title ? title.closest('a') : null;
        (titleLink || title || card).insertAdjacentElement('afterend', box);

        var priceBox = card.querySelector('.boost-sd__product-price');
        if (priceBox) {
          var from = document.createElement('div');
          from.className = 'fs-family__from';
          from.textContent = fam.secondary(products.map(function (p) { return p.price; }));
          var action = document.createElement('a');
          action.className = 'fs-family__action';
          action.textContent = fam.action + ' →';
          priceBox.insertAdjacentElement('afterend', from);
          from.insertAdjacentElement('afterend', action);
        }

        box.querySelectorAll('.fs-family__choice').forEach(function (b) {
          b.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            apply(card, fam, products, Number(b.getAttribute('data-index')));
          });
        });

        apply(card, fam, products, startIndex(fam));
        card.setAttribute('data-fs-family', 'done');
      })
      .catch(function () {
        card.removeAttribute('data-fs-family'); // leave the original Boost card untouched
      });
  }

  function run() {
    Object.keys(FAMILIES).forEach(function (id) {
      document.querySelectorAll('.boost-sd__product-item[data-product-id="' + id + '"]').forEach(enhance);
    });
  }

  if (window.boostWidgetIntegration && typeof window.boostWidgetIntegration.regisCustomization === 'function') {
    window.boostWidgetIntegration.regisCustomization(run);
  }
  if (document.body) {
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  }
  run();
})();
