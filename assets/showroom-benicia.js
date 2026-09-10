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

    // Check a Model form: in-place (AJAX) submit through the native contact form.
    // Falls back to a normal submit when JS or fetch is unavailable.
    var card0 = document.querySelector('[data-sr-form-card]');
    var formEl0 = card0 && card0.querySelector('#ShowroomCheckModel');
    // Cache the pristine form markup so "New Request" can restore it without a reload.
    if (card0 && formEl0 && formEl0.querySelector('button[type="submit"]')) {
      window.__srFormHTML = card0.innerHTML;
    }

    function showSuccess(card) {
      var tpl = document.querySelector('[data-sr-success-tpl]');
      if (tpl && 'content' in tpl) {
        card.innerHTML = '';
        card.appendChild(tpl.content.cloneNode(true));
      }
      // Fire exactly once, only after Shopify accepts the submission.
      push('check_model_submit', { location: 'check_model_form' });
      var succ = card.querySelector('.sr-form-success');
      if (succ) { try { succ.focus(); } catch (e) {} }
    }

    function showErrors(form, html) {
      var box = form.querySelector('[data-sr-errors]');
      var msg = '';
      try {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var node = doc.querySelector('#ShowroomCheckModel [data-sr-errors]') || doc.querySelector('#ShowroomCheckModel .sr-form-errors');
        if (node) msg = node.innerHTML;
      } catch (e) {}
      if (!box) {
        box = document.createElement('div');
        box.className = 'sr-form-errors';
        box.setAttribute('data-sr-errors', '');
        box.setAttribute('role', 'alert');
        form.insertBefore(box, form.firstChild);
      }
      box.innerHTML = msg || 'Sorry, something went wrong. Please review the form and try again.';
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      try { box.focus(); } catch (e) {}
    }

    if (window.fetch) {
      document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form || form.id !== 'ShowroomCheckModel') return;
        // Let native HTML5 validation handle invalid input (submit won't fire when invalid).
        e.preventDefault();
        var card = form.closest('[data-sr-form-card]');
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var action = form.getAttribute('action') || '/contact';
        fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin'
        })
          .then(function (res) { return res.text().then(function (t) { return { url: res.url, text: t }; }); })
          .then(function (o) {
            var ok = /[?&]contact_posted=true/.test(o.url) || /[?&]contact_posted=true/.test(o.text);
            if (ok && card) { showSuccess(card); }
            else { showErrors(form, o.text); if (btn) btn.disabled = false; }
          })
          .catch(function () { if (btn) btn.disabled = false; form.submit(); });
      });

      // "New Request" — restore the form in the same card, no page reload.
      document.addEventListener('click', function (e) {
        var nr = e.target.closest('[data-sr-new-request]');
        if (!nr) return;
        e.preventDefault();
        var card = nr.closest('[data-sr-form-card]');
        if (card && window.__srFormHTML) {
          card.innerHTML = window.__srFormHTML;
          var f = card.querySelector('#ShowroomCheckModel');
          var first = f && f.querySelector('input:not([type="hidden"]), select, textarea');
          if (first) { try { first.focus(); } catch (e) {} }
        }
      });
    }

    // Video walkthrough: click-to-play overlay (no autoplay)
    document.querySelectorAll('[data-sr-video]').forEach(function (wrap) {
      var video = wrap.querySelector('video');
      var btn = wrap.querySelector('[data-sr-video-play]');
      if (!video || !btn) return;
      btn.addEventListener('click', function () { video.play(); });
      video.addEventListener('play', function () { wrap.classList.add('is-playing'); });
      video.addEventListener('pause', function () { wrap.classList.remove('is-playing'); });
      video.addEventListener('ended', function () { wrap.classList.remove('is-playing'); });
    });

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
