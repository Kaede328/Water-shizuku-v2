self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "水神の雫";
  const options = {
    body: data.body || "お水の時間ですよ✨",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/')); // 通知を押したらアプリを開く
});
