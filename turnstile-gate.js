// Turnstile gate for "Schedule a Demo" buttons on itsblend.com
// Intercepts clicks on .open-demo and any button/link with text "Schedule a Demo",
// runs an invisible Cloudflare Turnstile challenge, then opens the booking page in
// an in-page modal popup (with the calendar embedded as an iframe).
// On any Turnstile failure or load problem, falls through to opening the modal anyway
// so legitimate users are never blocked.
(function () {
  var SITE_KEY = '0x4AAAAAADDRcVk10Q1Q0J08';
  var BOOKING = 'https://calendar.app.google/gPVtuDpxGXF7qq2w7';
  var loading = false;
  var modalOpen = false;

  function showModal() {
    if (modalOpen) return;
    modalOpen = true;

    var overlay = document.createElement('div');
    overlay.id = 'blend-demo-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(15,15,20,0.65)',
      'backdrop-filter:blur(4px)',
      '-webkit-backdrop-filter:blur(4px)',
      'z-index:2147483646',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:20px',
      'animation:blendDemoFadeIn 0.2s ease'
    ].join(';') + ';';

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background:#fff',
      'border-radius:18px',
      'width:100%',
      'max-width:980px',
      'height:85vh',
      'max-height:780px',
      'position:relative',
      'overflow:hidden',
      'box-shadow:0 30px 60px rgba(0,0,0,0.35)',
      'animation:blendDemoSlideUp 0.25s cubic-bezier(0.16,1,0.3,1)'
    ].join(';') + ';';

    var closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = [
      'position:absolute',
      'top:10px',
      'right:10px',
      'width:36px',
      'height:36px',
      'border-radius:50%',
      'border:none',
      'background:#fff',
      'color:#171717',
      'font-size:22px',
      'font-weight:300',
      'line-height:1',
      'cursor:pointer',
      'z-index:10',
      'box-shadow:0 2px 8px rgba(0,0,0,0.18)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:0'
    ].join(';') + ';';

    var iframe = document.createElement('iframe');
    iframe.src = BOOKING;
    iframe.title = 'Schedule a BLEND demo';
    iframe.setAttribute('allow', 'fullscreen');
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#fff;';

    var fallback = document.createElement('div');
    fallback.style.cssText = [
      'position:absolute',
      'inset:0',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'padding:40px',
      'text-align:center',
      'background:#fffaf7',
      'font-family:Inter,system-ui,sans-serif'
    ].join(';') + ';';
    fallback.innerHTML =
      '<div style="font-size:42px;margin-bottom:8px;">&#128197;</div>' +
      '<h3 style="margin:0 0 10px;font-size:20px;color:#171717;">Calendar didn\u2019t load?</h3>' +
      '<p style="margin:0 0 20px;color:#686868;font-size:15px;max-width:440px;">' +
      'Click below to open your booking page in a new tab.</p>' +
      '<a href="' + BOOKING + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;padding:12px 24px;background:#9b5cff;color:#fff;' +
      'text-decoration:none;border-radius:999px;font-weight:600;">Open booking page</a>';

    var iframeLoaded = false;
    iframe.addEventListener('load', function () { iframeLoaded = true; });
    setTimeout(function () {
      if (!iframeLoaded) fallback.style.display = 'flex';
    }, 6000);

    function closeModal() {
      modalOpen = false;
      document.removeEventListener('keydown', onKey);
      try { document.body.removeChild(overlay); } catch (e) {}
    }
    function onKey(e) { if (e.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onKey);

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    modal.appendChild(iframe);
    modal.appendChild(fallback);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);

    if (!document.getElementById('blend-demo-anim')) {
      var style = document.createElement('style');
      style.id = 'blend-demo-anim';
      style.textContent =
        '@keyframes blendDemoFadeIn{from{opacity:0}to{opacity:1}}' +
        '@keyframes blendDemoSlideUp{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:none}}';
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
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
        if (++n > 40) return showModal();
        setTimeout(w, 100);
      })();
    };
    s.onerror = function () { showModal(); };
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
            showModal();
            try { document.body.removeChild(c); } catch (e) {}
          },
          'error-callback': function () {
            showModal();
            try { document.body.removeChild(c); } catch (e) {}
          }
        });
      } catch (e) {
        showModal();
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
