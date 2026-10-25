const CACHE = 'kp-inventory-v3';
const SHELL = ['./', './index.html', './pos_system.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, CDN etc. go straight to network

  // Cache key = path only (ignores ?v=... query), so index.html and pos_system.html stay separate
  const key = new Request(url.origin + url.pathname);
  const isImage = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);

  // Images/icons: cache first, update in background
  if (isImage) {
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

  // Pages, scripts, json: always network first (latest GitHub/Vercel update), cache only when offline
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
