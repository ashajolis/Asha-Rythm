// ═══════════════════════════════════════
//  Asha · My Life Rhythm — Service Worker
// ═══════════════════════════════════════
const CACHE = 'asha-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
];

// ── Install: cache all core files ──────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: serve from cache, refresh in background ─────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Google Fonts — network first, cache fallback
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        fetch(e.request)
          .then(res => { cache.put(e.request, res.clone()); return res; })
          .catch(() => caches.match(e.request))
      )
    );
    return;
  }

  // Same-origin — cache first, background refresh
  if (url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => null);

        return cached || networkFetch || caches.match('./index.html');
      })
    );
  }
});

// ── Message: allow client to force update ──────────────
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
