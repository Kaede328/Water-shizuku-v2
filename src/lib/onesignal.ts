import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  try {
    // ブラウザ環境でない場合はスキップ
    if (typeof window === 'undefined') return;

    // 現在のホスト名を確認
    const hostname = window.location.hostname;
    const isAllowedDomain = hostname === 'kaede328.github.io' || hostname === 'localhost' || hostname === '127.0.0.1';

    // 許可されたドメインでない場合は初期化をスキップ（エラーを避けるため）
    if (!isAllowedDomain) {
      console.log(`OneSignal initialization skipped on unauthorized domain: ${hostname}`);
      return;
    }

    // すでに初期化されている場合はスキップ
    if ((window as any).OneSignal && (window as any).OneSignal.initialized) {
      console.log('OneSignal is already initialized');
      return;
    }

    await OneSignal.init({
      appId: 'de7c6192-9789-48bb-af64-3c63254b3981',
      allowLocalhostAsSecureOrigin: true, // 開発環境での動作を許可
      notifyButton: {
        enable: true,
        displayPredicate: null, // 常に表示させる設定
        size: 'medium',
        position: 'bottom-right',
        offset: {
          bottom: '20px',
          right: '20px',
          left: '0px'
        },
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': '通知を受け取る',
          'tip.state.subscribed': '通知は有効です',
          'tip.state.blocked': '通知がブロックされています',
          'message.prenotify': '通知を有効にしますか？',
          'message.action.subscribed': 'ありがとうございます！',
          'message.action.subscribing': '登録中...',
          'message.action.resubscribed': '通知を再開しました',
          'message.action.unsubscribed': '通知を停止しました',
          'dialog.main.title': '通知設定',
          'dialog.main.button.subscribe': '購読する',
          'dialog.main.button.unsubscribe': '解除する',
          'dialog.blocked.title': '通知がブロックされています',
          'dialog.blocked.message': 'ブラウザの設定から通知を許可してください'
        }
      },
    });
    console.log('OneSignal initialized successfully');
  } catch (err: any) {
    // 「すでに初期化済み」のエラーは無視する
    if (err && err.message && err.message.includes('already initialized')) {
      console.log('OneSignal was already initialized (caught error)');
      return;
    }
    console.error('Error initializing OneSignal:', err);
  }
};

/**
 * テスト通知を送信する
 */
export const sendTestNotification = async () => {
  try {
    if (!OneSignal.Notifications.permission) {
      alert('通知の許可が必要です。画面右下のベルマークから許可してください。');
      return;
    }

    // OneSignalのAPI経由で通知を送るにはサーバーサイドが必要なため、
    // クライアントサイドでは「通知が有効か」の確認と、
    // 擬似的な成功メッセージを表示します。
    // 実際の定期通知はブラウザのスケジュール機能で実装します。
    
    // ブラウザ標準の通知APIを使用してテスト
    if (Notification.permission === 'granted') {
      new Notification('水神の雫', {
        body: 'お水を飲む時間ですよ💧（テスト通知）',
        icon: '/Water-shizuku-v2/Icon.jpg'
      });
    } else {
      alert('ブラウザの通知許可がありません。');
    }
  } catch (error) {
    console.error('Test notification error:', error);
  }
};
