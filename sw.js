const CACHE_NAME = 'walk-log-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './osm.js',
  './places.js',
  './overpass.js',
  './type-mapping.js',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Network-first for API calls
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('overpass-api.de') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('tile.openstreetmap.org')
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
