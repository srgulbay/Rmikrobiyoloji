// public/sw.js
console.log('Service Worker dosyası çalışıyor. v2'); // Sürüm güncellendiğini görmek için

self.addEventListener('install', event => {
  console.log('[Service Worker] Yükleniyor...');
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Aktive ediliyor...');
  event.waitUntil(self.clients.claim()); 
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Eğer istek kendi origin'imizden değilse (örn: ui-avatars.com, googleapis.com),
  // Service Worker müdahale etmesin, tarayıcı normal şekilde halletsin.
  if (requestUrl.origin !== self.location.origin) {
    // console.log('[Service Worker] Cross-origin istek pas geçiliyor:', requestUrl.href);
    return; // event.respondWith() çağrılmadığı için tarayıcı normal fetch yapar.
  }

  // Sadece GET isteklerini ele alalım (veya ihtiyaca göre diğerleri)
  if (event.request.method !== 'GET') {
    // console.log('[Service Worker] GET olmayan istek pas geçiliyor:', event.request.method, requestUrl.href);
    return; 
  }

  // Kendi origin'imizden gelen GET istekleri için (örn: API çağrıları, lokal varlıklar)
  // İleride cache stratejileri (cache-first, network-first vb.) buraya eklenebilir.
  // Şimdilik sadece network'e yönlendirip, hata durumunda basit bir yanıt veriyoruz.
  // console.log('[Service Worker] Yerel kaynak için fetch:', requestUrl.href);
  event.respondWith(
    fetch(event.request)
      .catch(error => {
        console.warn('[Service Worker] Yerel kaynak fetch hatası:', event.request.url, error);
        return new Response(`Kaynak getirilemedi: ${event.request.url}`, {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Mesajı Alındı.');
  let notificationData = {};
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = { title: 'Rmikrobiyoloji Platformu', body: event.data.text(), icon: '/pwa-192x192.png', data: { url: '/' } };
    }
  } else {
    notificationData = { title: 'Rmikrobiyoloji Platformu', body: 'Yeni bir bildiriminiz var!', icon: '/pwa-192x192.png', data: { url: '/' } };
  }
  const title = notificationData.title || 'Yeni Bildirim';
  const options = {
    body: notificationData.body || 'Detayları görmek için tıklayın.',
    icon: notificationData.icon || '/pwa-192x192.png',
    badge: notificationData.badge || '/pwa-badge-96x96.png',
    vibrate: [100, 50, 100],
    tag: notificationData.tag || 'genel-bildirim',
    renotify: notificationData.renotify !== undefined ? notificationData.renotify : true,
    data: notificationData.data || { url: '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Bildirime tıklandı.');
  event.notification.close();
  const urlToOpen = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // URL'nin origin + pathname kısmını karşılaştır, query string'leri ihmal et
        const clientPath = new URL(client.url).pathname;
        const targetPath = new URL(urlToOpen, self.location.origin).pathname;
        if (clientPath === targetPath && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
