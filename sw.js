// Circle of Fifths — Service Worker
// Caches all app files for full offline support on iPad

const CACHE_NAME = 'cof-app-v1';
const ASSETS = [
  './',
  './index.html',
  './Circle Of Fifths App.html',
  './ai-features.jsx',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './manifest.json',
  // CDN scripts — cache on first fetch
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
];

// Install: pre-cache local assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local files immediately; CDN files best-effort
      const local  = ASSETS.filter(a => a.startsWith('.'));
      const remote = ASSETS.filter(a => !a.startsWith('.'));
      return cache.addAll(local).then(() =>
        Promise.allSettled(remote.map(url =>
          fetch(url).then(r => cache.put(url, r)).catch(() => {})
        ))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local, network-first for AI API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept AI/API calls — always go to network
  if (url.hostname.includes('anthropic') || url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
