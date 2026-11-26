const CACHE_NAME = 'minutatech-shell-v2';
const PRECACHE_ASSETS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const acceptHeader = request.headers.get('accept') || '';
  // NEVER cache API calls, no-store requests, or JSON payloads
  if (
    request.cache === 'no-store' ||
    acceptHeader.includes('application/json') ||
    /(^|\/)(v1|api|auth|health)(\/|$)/.test(url.pathname)
  ) {
    return;
  }

  // Network-first for HTML navigations (only cache valid 200 OK shell responses)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put('/index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html').then((m) => m || Response.error()))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || fetched;
      })
    );
  }
});
