
const CACHE_NAME = 'saiyan-tracker-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './img/goku-base.png',
  './img/goku-ssj.png',
  './img/goku-ssj2.png',
  './img/goku-ssj3.png',
  './img/goku-ssj4.png',
  './img/goku-ssj5.png',
  './audio/check-ssj.mp3'
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
