// NOVAUDIOVISUAL · service worker
// Páginas y datos .json: red primero (siempre lo último) y caché si no hay señal.
// Estáticos y fuentes: caché primero. Subir VERSION en cada cambio de archivos estáticos.
// La API del radar (otro dominio) nunca pasa por aquí.
const VERSION = 'nova-v3';
const CORE = [
  './', './index.html', './novaudiovisual-trabajos.html', './novaudiovisual-fondos.html', './novaudiovisual-licitaciones.html', './fondos.json',
  './nova.css', './lucide.min.js', './manifest.json', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;

  if (req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
