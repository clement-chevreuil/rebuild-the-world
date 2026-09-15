const CACHE_NAME = 'life-projects-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',

  './vendor-pack/vendor/bootstrap/bootstrap.min.css',
  './vendor-pack/vendor/bootstrap/bootstrap.bundle.min.js',
  './vendor-pack/vendor/sqlite/sql-wasm-base64.js',
  './vendor-pack/vendor/sqlite/sql-wasm.js',
  './vendor-pack/vendor/sqlite/sqlite-manager.js',
  './vendor-pack/vendor/fs-sync/disk-sync.js',

  './closet/index.html',
  './closet/css/style.css',
  './closet/js/schema.js',
  './closet/js/db.js',
  './closet/js/app.js',

  './food/index.html',
  './food/css/style.css',
  './food/js/schema.js',
  './food/js/db.js',
  './food/js/app.js',

  './pixel-art/index.html',
  './pixel-art/css/style.css',
  './pixel-art/js/history.js',
  './pixel-art/js/canvas.js',
  './pixel-art/js/export.js',
  './pixel-art/js/app.js',

  './read/index.html',
  './read/css/style.css',
  './read/js/pages-manifest.js',
  './read/js/menu-script.js',
  './read/html/creer-page.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    // cache.addAll est atomique : un seul asset manquant annulerait toute la mise en cache
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
