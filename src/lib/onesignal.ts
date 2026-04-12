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
