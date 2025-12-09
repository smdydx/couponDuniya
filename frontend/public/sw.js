
// Service Worker - Clear all caches on activation
const CACHE_VERSION = 'v' + Date.now();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('All caches cleared successfully');
      return self.clients.claim();
    })
  );
});

// Don't intercept any requests - let them pass through
self.addEventListener('fetch', () => {
  // Do nothing - no caching
});

console.log('Service Worker loaded - Cache version:', CACHE_VERSION);
