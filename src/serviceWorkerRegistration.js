// src/serviceWorkerRegistration.js
// Registers the CRA-injected service worker in production.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[SW] Dev: served from service worker.');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Check for updates every 60 seconds when page is visible
      let updateInterval = null;
      const startChecking = () => {
        if (updateInterval) return;
        updateInterval = setInterval(() => registration.update(), 60 * 1000);
      };
      const stopChecking = () => { clearInterval(updateInterval); updateInterval = null; };

      document.addEventListener('visibilitychange', () => {
        document.hidden ? stopChecking() : startChecking();
      });
      startChecking();

      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.onstatechange = () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              console.log('[SW] New content available. Will update on next load.');
              config?.onUpdate?.(registration);
            } else {
              // First-time install
              console.log('[SW] Content cached for offline use.');
              config?.onSuccess?.(registration);
              // Warm the drug data cache
              warmDrugDataCache();
            }
          }
        };
      };
    })
    .catch((err) => console.error('[SW] Registration failed:', err));
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType && !contentType.includes('javascript'))) {
        navigator.serviceWorker.ready.then((r) => r.unregister()).then(() => window.location.reload());
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => console.log('[SW] No internet. Running in offline mode.'));
}

// Pre-warm the drug data cache so first offline use works
function warmDrugDataCache() {
  if (!navigator.serviceWorker.controller) return;
  const SHEETS_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP4TGkC6v6DCBGNeFz6GqMz13ipNEphRWZL9wVsTnHAeYfjc-DJBfpEyrceiy54i3Lvi5h8pwa1Jmc/pub?output=csv';
  navigator.serviceWorker.controller.postMessage({
    type: 'CACHE_DRUG_DATA',
    url: SHEETS_URL,
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((r) => r.unregister())
      .catch((e) => console.error(e.message));
  }
}
