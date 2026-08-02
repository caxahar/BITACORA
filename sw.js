const CACHE_NAME = 'habits-shell-v2'; // <- subir este número purga cualquier caché vieja al instante
const SHELL_FILES = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear el backend (Apps Script / JSONP) -- siempre red real.
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    return;
  }

  // NETWORK-FIRST: siempre intenta traer la versión fresca primero.
  // La caché queda solo como respaldo para cuando no hay conexión --
  // así manifest.json / íconos / index.html nunca vuelven a quedar
  // "pegados" en una versión vieja como pasó antes (ver CACHE_NAME).
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
