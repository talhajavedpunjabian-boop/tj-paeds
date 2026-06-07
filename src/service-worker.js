/* eslint-disable no-restricted-globals */
// TJ Paeds Service Worker v1.1
// Strategy: Cache-first for static assets, Network-first for drug data
// Offline: serves cached drug data from Google Sheets

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';

// Take control immediately
clientsClaim();

// Clean up old precache entries
cleanupOutdatedCaches();

// ─── Precache all build assets ───────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST);

// ─── App Shell: SPA fallback ─────────────────────────────────────────────────
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// ─── Google Sheets drug data: Network-first, 24h cache ───────────────────────
// Falls back to cached CSV/HTML when offline
registerRoute(
  ({ url }) =>
    url.origin === 'https://docs.google.com' ||
    url.origin === 'https://spreadsheets.google.com',
  new NetworkFirst({
    cacheName: 'drug-data-cache',
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        maxEntries: 10,
        purgeOnQuotaError: true,
      }),
      new BroadcastUpdatePlugin(),
    ],
  })
);

// ─── Google Fonts: Stale-while-revalidate ────────────────────────────────────
registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 365 * 24 * 60 * 60, maxEntries: 20 }),
    ],
  })
);

// ─── Static assets: Cache-first, 30 days ─────────────────────────────────────
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ─── Images: Stale-while-revalidate, 60 days ─────────────────────────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxAgeSeconds: 60 * 24 * 60 * 60, maxEntries: 60 }),
    ],
  })
);

// ─── Message handler ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Cache warming: pre-fetch drug data URL sent from main app
  if (event.data?.type === 'CACHE_DRUG_DATA' && event.data.url) {
    event.waitUntil(
      caches.open('drug-data-cache').then(async (cache) => {
        try {
          const response = await fetch(event.data.url);
          if (response.ok) await cache.put(event.data.url, response);
        } catch (e) {
          // Already in cache or network unavailable — both are fine
        }
      })
    );
  }
});

// ─── Background sync: refresh drug data when back online ─────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'drug-data-refresh') {
    event.waitUntil(refreshDrugData());
  }
});

async function refreshDrugData() {
  const SHEETS_URL =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSP4TGkC6v6DCBGNeFz6GqMz13ipNEphRWZL9wVsTnHAeYfjc-DJBfpEyrceiy54i3Lvi5h8pwa1Jmc/pub?output=csv';
  try {
    const cache = await caches.open('drug-data-cache');
    const response = await fetch(SHEETS_URL, { cache: 'no-cache' });
    if (response.ok) {
      await cache.put(SHEETS_URL, response.clone());
      // Notify all clients of refresh
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(c => c.postMessage({ type: 'DRUG_DATA_REFRESHED' }));
    }
  } catch (err) {
    console.warn('[SW] Background drug data refresh failed:', err);
  }
}
