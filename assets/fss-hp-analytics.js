/*
 * Mobile Homepage A/B Test (Variant B) — fss_hp_* event dispatch.
 * Pushes to the existing GTM dataLayer (GTM-PFW6SMSL); no prior fss_hp_*
 * dataLayer convention existed in this theme before this experiment.
 * Destination/schema is assumed per CLAUDE.md G0-g pending Sagi/Izza sign-off.
 */
(function () {
  var SESSION_KEY = 'fss_hp_session_id';
  var EXPOSURE_KEY = 'fss_hp_exposure_fired';

  function getSessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = 'fss_hp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return 'fss_hp_no_storage';
    }
  }

  function getDevice() {
    return window.matchMedia && window.matchMedia('(max-width: 989px)').matches ? 'mobile' : 'desktop';
  }

  function track(eventName, props) {
    window.dataLayer = window.dataLayer || [];
    var payload = {
      event: eventName,
      variant: window.fssHpVariant || 'B',
      session_id: getSessionId(),
      device: getDevice()
    };
    for (var key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        payload[key] = props[key];
      }
    }
    window.dataLayer.push(payload);
  }

  window.fssHpTrack = track;

  function fireExposureOnce() {
    try {
      if (sessionStorage.getItem(EXPOSURE_KEY)) return;
      sessionStorage.setItem(EXPOSURE_KEY, '1');
    } catch (e) {
      // storage unavailable — fire anyway rather than silently drop exposure
    }
    track('fss_hp_exposure', {});
  }

  function onClick(evt) {
    var el = evt.target.closest('[data-fss-hp-event]');
    if (!el) return;
    var eventName = el.getAttribute('data-fss-hp-event');
    var propsRaw = el.getAttribute('data-fss-hp-props');
    var props = {};
    if (propsRaw) {
      try {
        props = JSON.parse(propsRaw);
      } catch (e) {
        props = {};
      }
    }
    track(eventName, props);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // This is a mobile-only experiment. CSS hides the desktop-only markup,
    // but display:none doesn't stop scripts from running, so gate here too -
    // desktop sessions must never fire fss_hp_* events.
    if (getDevice() !== 'mobile') return;
    fireExposureOnce();
    document.addEventListener('click', onClick);
  });
})();
