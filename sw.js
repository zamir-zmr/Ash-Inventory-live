/* KP HARDWARE — Service Worker v32
   Meets all PWA installability criteria:
   - fetch handler present (required by Chrome)
   - cache-first for core assets, network-first for dynamic
   - proper activate: old cache cleanup
*/

const CACHE_NAME = 'kp-hw-v32';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon-64.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* ── Install: cache core assets ── */
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_ASSETS).catch(function () {
        /* If some icon files are missing, still install */
        return cache.add('./index.html');
      });
    })
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: REQUIRED for installability ──
   Strategy:
   - HTML pages  → Network first, fall back to cache
   - Assets/CDN  → Cache first, fall back to network
   - Firebase/API → Network only (never cache)
*/
self.addEventListener('fetch', function (e) {
  var url = e.request.url;

  /* Skip non-GET, chrome-extension, Firebase, googleapis data requests */
  if (e.request.method !== 'GET') return;
  if (url.includes('firebaseio.com') ||
      url.includes('googleapis.com/identitytoolkit') ||
      url.includes('firebaseapp.com') ||
      url.startsWith('chrome-extension://')) {
    return; /* Let browser handle normally */
  }

  /* CDN assets → cache first */
  if (url.includes('cdnjs.cloudflare.com') ||
      url.includes('cdn.jsdelivr.net') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com') ||
      url.includes('gstatic.com/firebasejs') ||
      url.includes('sweetalert2')) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        if (cached) return cached;
        return fetch(e.request).then(function (resp) {
          if (!resp || resp.status !== 200) return resp;
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
          return resp;
        }).catch(function () { return new Response('', { status: 503 }); });
      })
    );
    return;
  }

  /* Local app files → network first, cache fallback */
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
      var clone = resp.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(e.request, clone); });
      return resp;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
