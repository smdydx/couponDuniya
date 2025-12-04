
// Service Worker - Disabled
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Don't intercept any requests
self.addEventListener('fetch', () => {
  // Do nothing - let requests pass through normally
});
