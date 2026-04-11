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

// バックグラウンドでの定期実行（ブラウザが許可する場合）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'shizuku-hourly-check') {
    event.waitUntil(sendHourlyNotification());
  }
});

async function sendHourlyNotification() {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 8 && hour <= 22) {
    await self.registration.showNotification("水神の雫", {
      body: `${hour}時の潤いの時間です。一口いかがですか？✨`,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "shizuku-daily-alert",
      renotify: true,
    });
  }
}
