const CACHE_NAME = 'saiyan-tracker-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://img.icons8.com/color/192/dragon-ball.png',
  'https://img.icons8.com/color/512/dragon-ball.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-base.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj2.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj3.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj4.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/img/goku-ssj5.png',
  'https://raw.githubusercontent.com/Luchovilla7/tracker-saiyajin/refs/heads/main/audio/check-ssj.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      ).then(results => {
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn('No se pudieron cachear algunos iconos:', failed);
        }
        return cache;
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});