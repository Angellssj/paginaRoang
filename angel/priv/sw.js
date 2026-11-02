// Service worker: deja la app disponible sin conexión.
const CACHE = 'mivida-v2';
const ARCHIVOS = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './assets/fonts/jost-latin.woff2', './assets/fonts/unbounded-latin.woff2',
  './assets/brand/roang-wordmark-white.webp', './assets/brand/roang-wordmark-black.webp',
  './assets/brand/roang-icon-dark-512.webp', './assets/brand/favicon-256.png',
  './js/core.js', './js/hoy.js', './js/rutinas.js', './js/calendario.js', './js/metas.js',
  './js/fe.js', './js/finanzas.js', './js/ajustes.js', './js/bloqueo.js', './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Red primero (así ves los cambios al editar), caché como respaldo.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
