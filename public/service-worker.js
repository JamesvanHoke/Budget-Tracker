// Designate what we want to cache, usually everything in the public folder

const FILES_TO_CACHE = [
  "/",
  "./index.html",
  "./indexdb.js",
  "./styles.css",
  "./index.js",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",
  "./manifest.json",
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Cache files on service worker install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Clears unneeded cache files
self.addEventListener("activate", (e) => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  e.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// On fetch requests stores the response to our cache and will respond with the cached version if we have it on failed requests
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(e.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(e.request.url, response.clone());
            }
            return response;
          })
          .catch((err) => caches.match(e.request));
      })
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((response) => {
        return response || fetch(e.request);
      });
    })
  );
});
