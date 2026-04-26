// Turnstile gate for "Schedule a Demo" buttons on itsblend.com
// Intercepts clicks on .open-demo and any button/link with text "Schedule a Demo",
// runs an invisible Cloudflare Turnstile challenge, then opens the booking page in a new tab.
// On any Turnstile failure or load problem, falls through to opening the URL anyway
// so legitimate users are never blocked.
(function () {
  var SITE_KEY = '0x4AAAAAADDRcVk10Q1Q0J08';
  var BOOKING = 'https://calendar.app.google/gPVtuDpxGXF7qq2w7';
  var loading = false;

  function openCal() {
    window.open(BOOKING, '_blank', 'noopener');
  }

  function ensureScript(cb) {
    if (typeof turnstile !== 'undefined') return cb();
    if (loading) return setTimeout(function () { ensureScript(cb); }, 150);
    loading = true;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    s.onload = function () {
      var n = 0;
      (function w() {
        if (typeof turnstile !== 'undefined') return cb();
        if (++n > 40) return openCal();
        setTimeout(w, 100);
      })();
    };
    s.onerror = function () { openCal(); };
    document.head.appendChild(s);
  }

  function runGate() {
    ensureScript(function () {
      var c = document.createElement('div');
      c.style.cssText = 'position:fixed;bottom:0;right:0;visibility:hidden;';
      document.body.appendChild(c);
      try {
        turnstile.render(c, {
          sitekey: SITE_KEY,
          size: 'invisible',
          callback: function () {
            openCal();
            try { document.body.removeChild(c); } catch (e) {}
          },
          'error-callback': function () {
            openCal();
            try { document.body.removeChild(c); } catch (e) {}
          }
        });
      } catch (e) {
        openCal();
        try { document.body.removeChild(c); } catch (err) {}
      }
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('a, button');
    var b = t && (
      t.classList.contains('open-demo') ||
      /^\s*schedule a demo\s*$/i.test(t.textContent)
    ) ? t : null;
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    runGate();
  }, true);
})();
