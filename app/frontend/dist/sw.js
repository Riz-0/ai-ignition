/* ============================================================
   The 2am Shoppers — PWA service worker
   Strategy: stale-while-revalidate for app shell, network-first
   for everything else, with an offline fallback to the cached
   index.html. Keeps the bundle small and the demo reliable.
   ============================================================ */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `2am-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `2am-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't touch the Vite HMR / dev API (proxy) — those must hit the network.
  if (url.origin === location.origin && url.pathname.startsWith('/api')) return;

  // Cross-origin (fonts, QR API, etc.) — stale-while-revalidate
  if (url.origin !== location.origin) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // App shell navigations → network-first, fall back to cached index/offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || (await caches.match('/index.html')) || (await caches.match('/offline.html'));
        })
    );
    return;
  }

  // Static assets — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.status === 200 && res.type !== 'opaque') {
        cache.put(req, res.clone());
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
