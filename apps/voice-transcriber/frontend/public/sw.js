/**
 * Offline shell for the Voice AI PWA.
 *
 * Hashed build assets are cached forever — their name changes when they do.
 * The HTML entry point is fetched from the network first and falls back to the
 * cache only when offline: the previous version cached the page indefinitely,
 * which meant a deployed fix could never reach an already-installed app.
 *
 * API calls are never cached. Results belong in IndexedDB, and a stale cached
 * response would be worse than an honest network error.
 */

const CACHE = 'voice-ai-v2';
const SHELL = ['/voice-ai/', '/voice-ai/index.html', '/voice-ai/segment-clock.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // allSettled: one missing file must not fail the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const isDocument = request.mode === 'navigate' || url.pathname.endsWith('.html');

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/voice-ai/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
