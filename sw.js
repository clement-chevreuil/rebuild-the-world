const CACHE_NAME = 'life-projects-v6';
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

  './arene/index.html',
  './arene/css/style.css',
  './arene/js/data.js',
  './arene/js/sprites.js',
  './arene/js/battle.js',
  './arene/js/game.js',

  './grimoire/index.html',
  './grimoire/css/base.css',
  './grimoire/css/composants.css',
  './grimoire/css/ecrans.css',
  './grimoire/js/data/aspects.js',
  './grimoire/js/data/heros.js',
  './grimoire/js/data/ennemis.js',
  './grimoire/js/data/cartes.js',
  './grimoire/js/data/etages.js',
  './grimoire/js/data/evenements.js',
  './grimoire/js/data/reliques.js',
  './grimoire/js/rendu/sprites.js',
  './grimoire/js/moteur/pioche.js',
  './grimoire/js/moteur/combat.js',
  './grimoire/js/moteur/donjon.js',
  './grimoire/js/moteur/sauvegarde.js',
  './grimoire/js/moteur/ameliorations.js',
  './grimoire/js/ui/composant-barre.js',
  './grimoire/js/ui/composant-carte.js',
  './grimoire/js/ui/composant-ennemi.js',
  './grimoire/js/ui/composant-noeud.js',
  './grimoire/js/ecrans/ecran-carte.js',
  './grimoire/js/ecrans/ecran-combat.js',
  './grimoire/js/ecrans/ecran-recompense.js',
  './grimoire/js/ecrans/ecran-repos.js',
  './grimoire/js/ecrans/ecran-evenement.js',
  './grimoire/js/ecrans/ecran-fin.js',
  './grimoire/js/app.js',

  './read/index.html',
  './read/css/style.css',
  './read/js/schema.js',
  './read/js/db.js',
  './read/js/markdown.js',
  './read/js/app.js',
  './read/js/document.js',
  './read/html/document.html',
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
