const CACHE_NAME = 'fenimodel25-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo2.png',
  '/style.css'
];

// Install: pre-cache essential resources (failures ignored per-item)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to add each resource; ignore failures so install doesn't fail for missing files
      await Promise.all(PRECACHE_URLS.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res && res.ok) await cache.put(url, res.clone());
        } catch (e) {
          // ignore individual file failures
        }
      }));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches and take control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
        return Promise.resolve();
      })
    )).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for precached resources, otherwise network-first with image runtime caching
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((networkRes) => {
        // Runtime cache images (same-origin) for faster home-screen icon availability
        try {
          const contentType = networkRes && networkRes.headers && networkRes.headers.get('content-type');
          if (networkRes && networkRes.ok && req.destination === 'image') {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
        } catch (e) {
          // ignore caching errors
        }
        return networkRes;
      }).catch(() => {
        // If fetch fails, and request is for a navigation, try to serve cached index.html
        if (req.mode === 'navigate' || (req.headers.get && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
          return caches.match('/index.html');
        }
        return new Response(null, { status: 504, statusText: 'Network error' });
      });
    })
  );
});

// Support manual skipWaiting via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
