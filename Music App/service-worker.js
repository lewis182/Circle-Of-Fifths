/* Score Analyser — Service Worker
   Caches the app shell for fast, reliable loading on iPad.
   API calls (OpenRouter) always go to the network — they cannot be cached.
*/

const CACHE_NAME = 'score-analyser-v2';

// Files that make up the app shell
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve shell from cache; everything else (API, CDN) goes to network
self.addEventListener('fetch', event => {
  // Always use network for API and external CDN requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for local app shell files
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
