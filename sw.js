const CACHE_NAME = 'saiyan-tracker-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/img/goku-base.png',
  '/assets/img/goku-ssj.png',
  '/assets/img/goku-ssj2.png',
  '/assets/img/goku-ssj3.png',
  '/assets/img/goku-ssj4.png',
  '/assets/img/goku-ssj5.png',
  '/assets/audio/check-ssj.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si el archivo está en caché, lo servimos.
      if (response) return response;

      // Si no, intentamos buscarlo en la red.
      return fetch(event.request).catch(() => {
        // FALLBACK CRÍTICO: Si falla la red y es una navegación (abrir la app),
        // servimos el index.html desde el caché para evitar el 404.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});