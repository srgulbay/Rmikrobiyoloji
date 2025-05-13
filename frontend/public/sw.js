// public/sw.js

// 1. Install aşamasında SW’ı hemen aktive et
self.addEventListener('install', event => {
    self.skipWaiting();  // eski SW varsa atla, hemen yeni SW’ı kullan
  });
  
  // 2. Active aşamasında tüm client’ları kontrol et
  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
  });
  
  // 3. Fetch olaylarını yakala (boş da bırakabilirsiniz)
  self.addEventListener('fetch', event => {
    // Burada statik varlıkları cache’leyebilir, offline desteği ekleyebilirsiniz.
    // Şimdilik passthrough:
    event.respondWith(fetch(event.request));
  });