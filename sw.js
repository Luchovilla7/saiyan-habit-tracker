const CACHE_NAME = 'saiyan-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://img.icons8.com/color/192/dragon-ball.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => k !== CACHE_NAME && caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // El evento fetch es obligatorio para que aparezca el botón de instalar
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});