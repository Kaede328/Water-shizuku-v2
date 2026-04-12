self.addEventListener('install', (event) => {
  self.skipWaiting();
});

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
    console.log('定期バックグラウンド同期を実行中...');
    event.waitUntil(sendHourlyNotification());
  }
});

async function sendHourlyNotification() {
  const now = new Date();
  const hour = now.getHours();
  
  // 8時〜22時の間だけ
  if (hour >= 8 && hour <= 22) {
    // 通知を表示
    await self.registration.showNotification("水神の雫", {
      body: `${hour}時の潤いの時間です。一口いかがですか？✨`,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "shizuku-daily-alert",
      renotify: true,
      vibrate: [100, 50, 100],
      data: {
        timestamp: now.getTime(),
        hour: hour
      }
    });
  }
}

// Background Fetch 成功時の処理
self.addEventListener('backgroundfetchsuccess', (event) => {
  event.waitUntil(
    self.registration.showNotification("水神の雫", {
      body: "iPhoneがしずくを起こしてくれました！潤いの時間ですよ✨",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "shizuku-bg-fetch",
    })
  );
});
