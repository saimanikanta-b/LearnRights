/* eslint-disable no-restricted-globals */
/**
 * LearnRights Service Worker
 * --------------------------
 * Caching strategies:
 *  • Static assets (JS/CSS/images/fonts) — Cache-First
 *  • Navigation (HTML)                   — Network-First (fallback to cached shell)
 *  • API GET requests                    — Network-First with cache fallback
 *  • API mutating requests (POST/PUT)    — Network-only (queued via app code when offline)
 */

const CACHE_NAME = 'learnrights-v1';
const STATIC_CACHE = 'learnrights-static-v1';
const API_CACHE = 'learnrights-api-v1';

// Files to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

/* ── INSTALL ── */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] Pre-cache failed for some resources:', err);
      });
    })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests and chrome-extension requests
  if (!url.protocol.startsWith('http')) return;

  // --- API requests ---
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests
    if (request.method === 'GET') {
      event.respondWith(networkFirstAPI(request));
    }
    // Let POST/PUT/DELETE go through normally (offline queue handled in app code)
    return;
  }

  // --- Navigation requests (HTML pages) ---
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // --- Static assets (JS, CSS, images, fonts) ---
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  // --- Everything else: network first with cache fallback ---
  event.respondWith(networkFirst(request));
});

/* ── Strategies ── */

async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ offline: true, message: 'You are offline. Showing cached data.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request) || await caches.match('/index.html');
    if (cached) return cached;
    return new Response('Offline — page not available', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 503 });
  }
}

/* ── Helpers ── */

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/static/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)(\?.*)?$/i.test(url.pathname)
  );
}

/* ── Background Sync (when browser comes back online) ── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'learnrights-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' }));
      })
    );
  }
});

/* ── Listen for messages from the app ── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
