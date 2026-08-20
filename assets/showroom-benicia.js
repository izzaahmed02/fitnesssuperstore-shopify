/* Benicia Showroom landing page — shared behaviour for the showroom-* sections.
   Guarded so it initialises once even if several sections include it. */
(function () {
  if (window.__srShowroomInit) return;
  window.__srShowroomInit = true;

  function push(name, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: name };
    if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) payload[k] = extra[k]; } }
    window.dataLayer.push(payload);
  }

  function init() {
    // Click-based events (call, directions, video walkthrough)
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-sr-event]');
      if (!el) return;
      var name = el.getAttribute('data-sr-event');
      if (name === 'check_model_submit') return; // handled on form submit
      push(name, { location: el.getAttribute('data-sr-location') || '' });
    });

    // Check a Model form: submit event + contact-method input typing
    var form = document.getElementById('ShowroomCheckModel');
    if (form) {
      form.addEventListener('submit', function () { push('check_model_submit', { location: 'check_model_form' }); });
    }

    // Gallery carousel: arrows + dots
    document.querySelectorAll('[data-sr-carousel]').forEach(function (root) {
      var track = root.querySelector('[data-sr-track]');
      var slides = track ? Array.prototype.slice.call(track.querySelectorAll('.sr-slide')) : [];
      if (!track || slides.length === 0) return;
      var dotsWrap = root.parentNode.querySelector('[data-sr-dots]');
      var prev = root.querySelector('[data-sr-prev]');
      var next = root.querySelector('[data-sr-next]');

      function centerFor(sl) { return sl.offsetLeft - (track.clientWidth - sl.offsetWidth) / 2; }
      function current() {
        var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = Infinity;
        slides.forEach(function (sl, i) {
          var m = sl.offsetLeft + sl.offsetWidth / 2, d = Math.abs(m - mid);
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      }
      function go(i) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        track.scrollTo({ left: centerFor(slides[i]), behavior: 'smooth' });
      }
      if (prev) prev.addEventListener('click', function () { go(current() - 1); });
      if (next) next.addEventListener('click', function () { go(current() + 1); });

      var dots = [];
      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Go to photo ' + (i + 1));
          if (i === 0) b.setAttribute('aria-current', 'true');
          b.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
        var raf;
        track.addEventListener('scroll', function () {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            var c = current();
            dots.forEach(function (d, i) {
              if (i === c) { d.setAttribute('aria-current', 'true'); }
              else { d.removeAttribute('aria-current'); }
            });
          });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
