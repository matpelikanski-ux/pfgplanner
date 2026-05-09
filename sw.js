const CACHE = 'pfg-planner-v1';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
];

// Install — cache zasobów
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache głównej strony — ignoruj błędy zewnętrznych zasobów
      return c.add('./').catch(() => {});
    })
  );
});

// Activate — usuń stare cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — Network first, cache fallback
self.addEventListener('fetch', e => {
  // Pomiń żądania do Supabase (zawsze online)
  if (e.request.url.includes('supabase.co')) return;
  // Pomiń żądania POST/PATCH/DELETE
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Zapisz w cache jeśli OK
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — zwróć z cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Fallback do głównej strony
          return caches.match('./');
        });
      })
  );
});
