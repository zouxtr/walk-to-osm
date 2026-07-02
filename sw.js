const CACHE_NAME = 'walk-log-v2';

const STATIC_ASSETS = [
  './',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

const LOCAL_JS_CSS = [
  './index.html',
  './app.js',
  './osm.js',
  './places.js',
  './overpass.js',
  './type-mapping.js',
  './style.css',
];

// Pre-cache static assets on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: return cache immediately, fetch update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network and cache both unavailable');
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Network-first for index.html
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Stale-while-revalidate for local JS/CSS
  if (LOCAL_JS_CSS.some((path) => url.pathname.endsWith(path) || url.pathname.endsWith(path.replace('./', '/')))) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // Network-first for API requests
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('overpass-api.de') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  // Cache-first for static assets (icons, Leaflet CDN)
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
