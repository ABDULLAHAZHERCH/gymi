/// <reference lib="webworker" />

const CACHE_NAME = 'gymi-v4';

// All app routes to precache on install
const APP_ROUTES = [
  '/',
  '/home',
  '/workouts',
  '/nutrition',
  '/progress',
  '/coach',
  '/achievements',
  '/account',
  '/login',
  '/register',
  '/privacy',
  '/terms',
];

const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - precache static assets, then warm app routes in background
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Always cache critical static assets
      await cache.addAll(STATIC_ASSETS).catch(() => {});

      // Warm-cache all app routes (best-effort, don't block install)
      const routePromises = APP_ROUTES.map((route) =>
        fetch(route, { credentials: 'same-origin' })
          .then((res) => {
            if (res && res.status === 200) {
              return cache.put(route, res);
            }
          })
          .catch(() => {}) // Ignore failures — user may be offline during install
      );
      await Promise.allSettled(routePromises);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for navigations, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (Firebase, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / dev requests
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // --- Page navigations (HTML documents) ---
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache every successful page navigation
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: try to serve cached version of this page
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Try matching just the pathname (ignore query strings)
            return caches.match(url.pathname).then((pathCached) => {
              if (pathCached) return pathCached;
              // Last resort: offline fallback page
              return caches.match('/offline.html');
            });
          });
        })
    );
    return;
  }

  // --- Static assets (JS, CSS, fonts, images) — cache-first ---
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // --- API / data requests — network-first ---
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((c) => c || new Response('{"error":"offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })))
    );
    return;
  }

  // --- Default: network-first with cache fallback ---
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((c) => c || new Response('Offline', { status: 503 })))
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Script loaded');
