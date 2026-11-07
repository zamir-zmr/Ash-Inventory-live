/* KP Hardware Inventory — Service Worker v33
   PWA installability requirements met:
   ✓ fetch handler present and responds
   ✓ HTTPS assumed (served from GitHub/Vercel)
   ✓ manifest linked with correct fields
*/

const CACHE = 'kp-inventory-v33';
const SHELL = [
  './',
  './index.html',
  './pos_system.html',
  './manifest.json',
  './favicon-64.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => c.add('./index.html')))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Skip non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // Firebase / analytics — always network, never cache
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseapp.com')
  ) return;

  // CDN assets (cross-origin) — cache first, network fallback
  const isCDN = (
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('unpkg.com')
  );
  if (isCDN) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        }).catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
    return;
  }

  // Same-origin: cache key strips query so versioned URLs hit same entry
  const key = new Request(url.origin + url.pathname);
  const isImage = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);

  if (isImage) {
    // Cache first, background update
    e.respondWith(
      caches.match(key).then(cached => {
        const net = fetch(req).then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // Pages / scripts / json: network first, cache fallback (always get latest)
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() =>
      caches.match(key).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
