
const CACHE_NAME = 'saiyan-tracker-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/img/goku-base.png',
  './assets/img/goku-ssj.png',
  './assets/img/goku-ssj2.png',
  './assets/img/goku-ssj3.png',
  './assets/img/goku-ssj4.png',
  './assets/img/goku-ssj5.png',
  './assets/audio/check-ssj.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
