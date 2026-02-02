const CACHE_NAME = 'saiyan-pwa-v24';
const STATIC_ASSETS = [
  'index.html',
  'index.tsx',
  'manifest.json',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Roboto:wght@400;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// Instalación: Cachear activos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Saiyan Cache: Pre-caching assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estrategia Network-First con Fallback a Cache para navegación
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Manejo especial para navegación (evita el 404 al recargar o abrir desde home)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('index.html');
      })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate para el resto de activos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});