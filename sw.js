const CACHE_NAME = 'makna-gandul-v4';
const FILES_TO_CACHE = [
  './index.html',
  './libs/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategi: network-first untuk index.html (selalu coba ambil versi terbaru dulu),
// fallback ke cache kalau offline. File lain (libs, cdn) tetap cache-first.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isHalamanUtama = event.request.mode === 'navigate' ||
                          url.pathname.endsWith('/index.html') ||
                          url.pathname.endsWith('/');

  if (isHalamanUtama) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('./index.html');
    })
  );
});
