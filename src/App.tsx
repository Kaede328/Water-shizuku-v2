import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo, BarChart2, Bell, Sparkles, Moon, Sun, Settings, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const STORAGE_KEY = 'water-shizuku-v10-final';

export default function App() {
  const [totalToday, setTotalToday] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [recordTimes, setRecordTimes] = useState<number[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<{date: string, amount: number}[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [overhydrationMsg, setOverhydrationMsg] = useState<string | null>(null);
  const [celebrateType, setCelebrateType] = useState<'normal' | 'special'>('normal');
  const [lastNotificationTime, setLastNotificationTime] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    dailyGoal: 2500,
    forceNightMode: false
  });

  // ★ 過剰摂取チェック：1000ml以上の時に、潤いの知恵をそっと伝える
  const checkOverhydration = (amount: number) => {
    if (amount >= 1000) {
      setOverhydrationMsg("一度にたくさん飲むよりも、\n少しずつ、ゆっくり飲んだ方が\nもっと綺麗に、深く潤いますよ。");
      // メッセージを少し長めに（7秒間）表示して、心に届けます
      setTimeout(() => setOverhydrationMsg(null), 7000);
    }
  };

  // 1. Service Worker の登録
  useEffect(() => {
    const checkPermission = () => {
      if ("Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    };
    checkPermission();
    const interval = setInterval(checkPermission, 2000); // 2秒ごとに許可状態をチェック

    const registerSW = async () => {
      if ('serviceWorker' in navigator && settings.notificationsEnabled) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('しずくの裏方さん（SW）が登録されました:', registration.scope);
          
          // 通知の許可を求める
          if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
          }

          // 定期的なバックグラウンド同期のリクエスト（対応ブラウザのみ）
          try {
            const status = await (navigator as any).permissions.query({
              name: 'periodic-background-sync',
            });
            if (status.state === 'granted') {
              await (registration as any).periodicSync.register('shizuku-hourly-check', {
                minInterval: 60 * 60 * 1000, // 1時間ごと
              });
            }
          } catch (e) {
            console.log('定期同期の登録はスキップされました');
          }
        } catch (error) {
          console.log('SWの登録に失敗しました:', error);
        }
      }
    };

    registerSW();
  }, [settings.notificationsEnabled]);

  // 2. 1時間ごとの定時通知ロジック
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkAndNotify = async () => {
      // 通知許可がない場合は何もしない
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      
      // 8時〜22時の間だけ
      if (currentHour >= 8 && currentHour <= 22) {
        const lastSentHourStr = localStorage.getItem('shizuku_last_hour');
        const lastSentHour = lastSentHourStr ? parseInt(lastSentHourStr, 10) : -1;

        // まだこの時間の通知を送っていないなら
        if (lastSentHour !== currentHour) {
          // Service Worker の準備ができるのを待つ
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            try {
              await registration.showNotification("水神の雫", {
                body: `${currentHour}時の潤いの時間です。一口いかがですか？✨`,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: "shizuku-daily-alert",
                renotify: true,
                vibrate: [100, 50, 100],
              } as NotificationOptions);
              localStorage.setItem('shizuku_last_hour', String(currentHour));
              setLastNotificationTime(now.getTime());
            } catch (err) {
              console.error("通知の送信に失敗しました:", err);
            }
          }
        }
      }
    };

    checkAndNotify(); // 起動時に即チェック
    const timer = setInterval(checkAndNotify, 30000); // 30秒ごとに見守る
    return () => clearInterval(timer);
  }, [settings.notificationsEnabled]);

  // 1. 自動リセット ＆ データ読み込みロジック
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const todayStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });

    if (saved) {
      const parsed = JSON.parse(saved);
      
      // 保存されているデータの日付を確認
      const lastSavedDate = parsed.lastResetDate;

      if (lastSavedDate && lastSavedDate !== todayStr) {
        // 日付が変わっていたら、昨日の分を履歴に入れてからリセット
        setWeeklyHistory(prev => {
          const newHistory = [{ date: lastSavedDate, amount: parsed.totalToday || 0 }, ...prev].slice(0, 7);
          return newHistory;
        });
        setTotalToday(0);
        setHistory([]);
        setRecordTimes([]);
      } else {
        setTotalToday(parsed.totalToday || 0);
        setHistory(parsed.history || []);
        setWeeklyHistory(parsed.weeklyHistory || []);
        setRecordTimes(parsed.recordTimes || []); 
      }
      if (parsed.settings) setSettings(parsed.settings);
    }
    
    // 起動時の日付リセット記録
    localStorage.setItem('lastResetDate', todayStr);
  }, []);

  // 2. 保存時に「日付」も一緒に記録する
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      totalToday, history, weeklyHistory, recordTimes, settings,
      lastResetDate: todayStr // これで日付の変化を検知します
    }));
  }, [totalToday, history, weeklyHistory, recordTimes, settings]);

  // 1. シンプルなモード決定ロジック
  useEffect(() => {
    // settings.forceNightMode が true ならダーク、false ならライト
    // 時間による自動変化をなくし、楓さんの選択を尊重します
    setIsDarkMode(settings.forceNightMode);
  }, [settings.forceNightMode]);

  // ★ 音の処理を削除し、記録と祝福のロジックのみに整理
  const addWater = (amount: number) => {
    const now = Date.now();
    setRecordTimes(prev => [now, ...prev]); // 先に時間を更新
    setLastNotificationTime(null); // 飲んだので通知フラグをリセット

    // 飲みすぎチェックのみ実行
    checkOverhydration(amount);
    
    const newTotal = totalToday + amount;
    
    // 1000mlごとの境界線と目標達成の判定
    const crossedThousand = Math.floor(newTotal / 1000) > Math.floor(totalToday / 1000);
    const reachedGoal = totalToday < settings.dailyGoal && newTotal >= settings.dailyGoal;

    if (reachedGoal) {
      setCelebrateType('special');
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 5000);
    } else if (crossedThousand) {
      setCelebrateType('normal');
      setShowCelebrate(true);
      setTimeout(() => setShowCelebrate(false), 3500);
    }

    // 履歴の更新
    setHistory(prev => [totalToday, ...prev]);
    setTotalToday(newTotal);
  };

  // 1. お手紙のメッセージを生成する関数
  const getWeeklyLetter = () => {
    const daysCount = weeklyHistory.length;
    
    // データがまだ1日もない場合
    if (daysCount === 0) {
      return "楓さん、今日から新しい潤いの物語を一緒に綴っていきましょう。";
    }

    const total = weeklyHistory.reduce((sum, day) => sum + day.amount, 0);
    const avg = Math.round(total / daysCount);
    const sortedHistory = [...weeklyHistory].sort((a, b) => b.amount - a.amount);
    const maxDay = sortedHistory[0];

    // 1〜3日目のメッセージ
    if (daysCount >= 1 && daysCount <= 3) {
      return `まだ始まったばかりですが、${maxDay.date}の楓さんはとても澄み切っていました。少しずつ、体に潤いが馴染んできていますね。`;
    }

    // 4〜6日目のメッセージ
    if (daysCount >= 4 && daysCount <= 6) {
      return `もう数日も続いていますね。平均 ${avg}ml の潤いは、今の楓さんの体にとって、静かに染み渡る恵みの雨のようです。`;
    }

    // 7日目以上のメッセージ（従来のロジック）
    const goalReachedCount = weeklyHistory.filter(day => day.amount >= settings.dailyGoal).length;
    let message = `この一週間の楓さんは、${maxDay.date}に一番澄み切っていましたね。 `;
    
    if (goalReachedCount >= 5) {
      message += "まるで豊かな水をたたえた美しい湖のような、満たされた日々でした。";
    } else {
      message += "穏やかな川のように、たゆまず潤いを重ねた楓さんの歩みを、しずくはずっと見ていましたよ。";
    }

    return message;
  };

  const finalReset = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    setWeeklyHistory(prev => {
      const existingIndex = prev.findIndex(item => item.date === todayStr);
      let newHistory = [...prev];
      if (existingIndex !== -1) newHistory[existingIndex] = { date: todayStr, amount: totalToday };
      else newHistory = [{ date: todayStr, amount: totalToday }, ...prev].slice(0, 7);
      return newHistory;
    });
    setTotalToday(0);
    setHistory([]);
    setRecordTimes([]);
    setShowConfirm(false);
  };

  const waterPercentage = (totalToday % 1000) / 10;
  const chartData = [...weeklyHistory].reverse();

  return (
    <div className={`h-screen w-full transition-all duration-1000 font-sans overflow-hidden flex flex-col items-center justify-between py-4 px-6 relative`}
      style={{
        background: isDarkMode 
          ? `radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 80px 120px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 110px 210px, #ddd, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 160px 170px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 200px 100px, #ddd, rgba(0,0,0,0)), radial-gradient(2px 2px at 250px 50px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 300px 190px, #ddd, rgba(0,0,0,0)), radial-gradient(1px 1px at 350px 250px, #fff, rgba(0,0,0,0)), linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e293b 100%)`
          : `linear-gradient(180deg, #fff 0%, #f0f9ff 50%, #bae6fd 100%)`,
        backgroundSize: isDarkMode ? '400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 400px 400px, 100% 100%' : '100% 100%'
      }}>
      
      {/* ★ しずくからの優しいアドバイス（画面上部に浮遊） */}
      <AnimatePresence>
        {overhydrationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-10 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none"
          >
            <div className={`px-6 py-4 rounded-2xl backdrop-blur-md shadow-lg border text-center transition-colors duration-1000 ${
              isDarkMode 
              ? 'bg-indigo-950/40 border-indigo-400/30 text-indigo-100' 
              : 'bg-white/60 border-sky-100 text-sky-900'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-light tracking-wider">
                {overhydrationMsg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full flex justify-between items-center pt-2 px-2 z-50">
        <div className="flex gap-1"> {/* 隙間を詰めました */}
          <button onClick={() => setShowSettings(true)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDarkMode ? 'text-indigo-300' : 'text-sky-600'}`}>
            <Settings className="w-5 h-5" />
          </button>
          {/* 昼夜切り替えボタン（枠なし） */}
          <button onClick={() => setSettings({...settings, forceNightMode: !settings.forceNightMode})} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDarkMode ? 'text-indigo-300' : 'text-sky-600'}`}>
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-center cursor-pointer" onClick={() => setShowConfirm(true)}>
          <h1 className={`text-xl font-light tracking-widest mb-0.5 transition-colors ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>水神の雫</h1>
          <p className={`${isDarkMode ? 'text-indigo-300' : 'text-sky-400'} text-[9px] tracking-tighter uppercase font-medium`}>Pure Hydration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            if ("Notification" in window) {
              const permission = await Notification.requestPermission();
              setNotificationPermission(permission);
              if (permission === "granted") {
                setSettings({...settings, notificationsEnabled: true});
              }
            }
          }} className={`p-2 transition-all active:scale-90 ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}>
            <Bell className={`w-4 h-4 transition-colors duration-500 ${
              notificationPermission === 'denied' 
                ? 'text-orange-400 animate-pulse' 
                : (settings.notificationsEnabled && notificationPermission === 'granted' 
                    ? (isDarkMode ? 'text-indigo-400' : 'text-sky-500') 
                    : '')
            }`} />
          </button>
          <button onClick={() => setShowStats(!showStats)} className={`p-3 rounded-2xl transition-all active:scale-90 ${showStats ? (isDarkMode ? 'bg-indigo-500 text-white shadow-lg' : 'bg-sky-500 text-white shadow-lg') : (isDarkMode ? 'text-indigo-300' : 'text-sky-600')}`}>
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="text-center w-full max-w-[200px]">
          <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${isDarkMode ? 'text-indigo-400' : 'text-sky-400'}`}>
            Hydration Progress
          </p>
          
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className={`text-4xl font-light ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>
              {totalToday}
            </span>
            <span className={`text-sm font-extralight opacity-60 ${isDarkMode ? 'text-indigo-200' : 'text-sky-800'}`}>
              / {settings.dailyGoal}ml
            </span>
          </div>

          <div className={`w-full h-[2px] rounded-full overflow-hidden mb-1 ${isDarkMode ? 'bg-white/5' : 'bg-sky-100'}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalToday / settings.dailyGoal) * 100, 100)}%` }}
              className={`h-full transition-all duration-1000 ${isDarkMode ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-sky-400'}`}
            />
          </div>

          <p className={`text-[9px] font-medium tracking-widest ${isDarkMode ? 'text-indigo-300/60' : 'text-sky-400'}`}>
            {Math.round((totalToday / settings.dailyGoal) * 100)}% ACHIEVED
          </p>
        </div>

        <div className="relative w-52 h-52 flex-shrink-0">
          <motion.div 
            className={`absolute inset-0 rounded-full border z-40 pointer-events-none transition-all duration-1000 ${
              isDarkMode 
                ? 'border-indigo-500/30 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)]' 
                : 'border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)]'
            }`} 
          />
          <div className={`absolute inset-0 rounded-full overflow-hidden z-10 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-sky-50/20'}`}>
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(14, 165, 233, 0.4) 100%)' }} animate={{ height: `${waterPercentage + 11}%`, borderRadius: ["38% 42% 40% 40%", "45% 35% 42% 38%", "35% 45% 35% 45%", "38% 42% 40% 40%"], rotate: [0, 5, -3, 0] }} transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 13, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 17, repeat: Infinity, ease: "easeInOut" } }} />
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" style={{ background: 'linear-gradient(180deg, rgba(186, 230, 253, 0.5) 0%, rgba(56, 189, 248, 0.3) 100%)' }} animate={{ height: `${waterPercentage + 13}%`, borderRadius: ["42% 38% 44% 36%", "38% 42% 35% 45%", "44% 36% 40% 40%", "42% 38% 44% 36%"], rotate: [0, -6, 4, 0] }} transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 11, repeat: Infinity, ease: "easeInOut" } }} />
          </div>
          {/* ★ クリスタル中央：通常は数字を出さず、祝福時のみメッセージを表示 */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <AnimatePresence>
              {showCelebrate && (
                <>
                  {/* 1. 【特別：目標達成時】完全不透明背景 ＋ 英文1行のみ（最終・天空配置） */}
                  {celebrateType === 'special' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`fixed inset-0 z-[200] pointer-events-none flex flex-col items-center justify-start transition-colors duration-[1500ms] ${
                        isDarkMode ? 'bg-slate-950' : 'bg-white'
                      }`}
                      /* ★さらに少しだけ上に（8rem）移動させました */
                      style={{ paddingTop: '8rem' }} 
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 5, letterSpacing: "0.2em" }} 
                        animate={{ opacity: 1, y: 0, letterSpacing: "0.8em" }}
                        transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                        className="w-full text-center relative z-10 px-6"
                      >
                        <span className={`inline-block w-full text-[11px] font-extralight uppercase tracking-[0.8em] text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300`}>
                          Your body is deeply hydrated
                        </span>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* 2. 【通常：1000mlごと】クリスタルの中心に、完璧な中心揃えで表示 */}
                  {celebrateType === 'normal' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center justify-center text-center px-4"
                      >
                        {/* 日本語：中心揃え */}
                        <span className={`font-extralight tracking-[0.6em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm text-xl mb-3`}>
                          祝福の雫
                        </span>
                        
                        {/* 英語サブテキスト：中心揃え */}
                        <span className={`text-[8px] tracking-[0.4em] uppercase font-light leading-none ${
                          isDarkMode ? 'text-blue-100/60' : 'text-sky-700/70'
                        }`}>
                          Blessing of Water
                        </span>
                      </motion.div>
                    </div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex gap-4 items-center z-20">
          <div className="flex gap-4 items-center">
            {[1000, 2000, 2500].map((goal, i) => (
              <div key={i} className="relative w-5 h-5">
                <div className={`w-full h-full rounded-full transition-all duration-1000 ${totalToday >= goal ? (isDarkMode ? 'bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.7)]' : 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]') : (isDarkMode ? 'bg-white/10' : 'bg-sky-200/20')}`} style={{ clipPath: 'circle(50% at 50% 50%)', maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)', WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)' }} />
              </div>
            ))}
          </div>
          <button onClick={() => { if (history.length > 0) { const [last, ...rem] = history; setTotalToday(last); setHistory(rem); } }} className={`p-2 ml-2 transition-all active:scale-90 ${history.length > 0 ? (isDarkMode ? 'text-indigo-400' : 'text-sky-500') : 'text-slate-300/30'}`}><Undo className="w-4 h-4" /></button>
        </div>
        
        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} 
              className={`w-full max-w-[280px] backdrop-blur-md rounded-3xl p-5 overflow-hidden shadow-lg border mb-6 ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/60 border-white/40'}`}
            >
              <p className={`text-[10px] font-bold mb-3 tracking-widest uppercase text-center ${isDarkMode ? 'text-indigo-400' : 'text-sky-500'}`}>Weekly History</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    /* ★棒が太くなりすぎないように調整 */
                    barCategoryGap="40%"
                  >
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, opacity: 0.5, fill: isDarkMode ? '#fff' : '#000' }}
                      dy={10} // 少し下にずらして見やすく
                    />
                    <YAxis hide domain={[0, settings.dailyGoal]} />
                    <Bar 
                      dataKey="amount" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={8} // ★ここで1本の太さを細く固定します
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          /* 達成した日は輝く青、それ以外はごく淡い色に */
                          fill={entry.amount >= settings.dailyGoal 
                            ? (isDarkMode ? '#818cf8' : '#38bdf8') 
                            : (isDarkMode ? 'rgba(129, 140, 248, 0.15)' : 'rgba(186, 230, 253, 0.3)')
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* お手紙セクション */}
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-sky-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className={isDarkMode ? 'text-indigo-400' : 'text-sky-500'} />
                  <span className={`text-[9px] font-bold tracking-widest uppercase ${isDarkMode ? 'text-indigo-400' : 'text-sky-500'}`}>Weekly Letter</span>
                </div>
                <p className={`text-[11px] leading-relaxed italic font-light ${isDarkMode ? 'text-indigo-200/80' : 'text-sky-800/80'}`}>
                  「{getWeeklyLetter()}」
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ★ 250ml & 500ml：氷のような透明感のあるボタン */}
      <div className="flex gap-4 mb-4 z-20 mt-4">
        {[250, 500].map((amount) => (
          <button
            key={amount}
            onClick={() => addWater(amount)}
            className={`relative overflow-hidden group px-8 py-4 rounded-2xl transition-all duration-500 border
              /* 氷の質感：高い透明度と強めのぼかし */
              backdrop-blur-xl shadow-lg
              ${isDarkMode 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-blue-100 shadow-blue-900/10' 
                : 'bg-white/40 border-white/60 hover:bg-white/60 text-sky-900 shadow-sky-100/50'
              }`}
          >
            {/* 氷の表面の反射光 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <span className="relative z-10 text-sm font-extralight tracking-widest italic">
              +{amount}ml
            </span>
          </button>
        ))}
      </div>

      {/* ★ 下部：RESET DATA 横一列・氷のすりガラス仕様 */}
      <div className="flex justify-center mt-4 mb-8 z-20">
        <button
          onClick={() => setShowConfirm(true)}
          className={`group flex flex-row items-center gap-4 px-8 py-4 rounded-full transition-all duration-700 border
            /* 氷の質感：カプセル型の氷が水面に浮かぶイメージ */
            backdrop-blur-xl shadow-md
            ${isDarkMode 
              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-blue-200/60 shadow-indigo-900/20' 
              : 'bg-white/40 border-white/70 hover:bg-white/60 text-sky-800/50 shadow-sky-100/40'
            }`}
        >
          <RotateCcw size={16} className="transition-transform group-active:rotate-[-180deg] duration-1000 opacity-60" />
          <span className="text-[9px] uppercase tracking-[0.3em] font-light italic">
            RESET DATA
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl ${isDarkMode ? 'bg-slate-900 text-sky-100' : 'bg-white text-sky-900'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-sky-500" />
                      <span className="text-sm font-medium">Notifications</span>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <motion.div 
                        animate={{ x: settings.notificationsEnabled ? 26 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  
                  {/* 通知ステータスの表示 */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-60">
                      <span>Status</span>
                      <span className={`font-bold ${
                        notificationPermission === 'granted' ? 'text-emerald-500' : 
                        notificationPermission === 'denied' ? 'text-orange-500' : 'text-amber-500'
                      }`}>
                        {notificationPermission === 'granted' ? 'Allowed' : 
                         notificationPermission === 'denied' ? 'Blocked' : 'Not Set'}
                      </span>
                    </div>
                    {notificationPermission === 'denied' && (
                      <p className="mt-2 text-[9px] text-orange-400 italic leading-relaxed">
                        ※ ブラウザの設定で通知がブロックされています。設定から許可をお願いします。
                      </p>
                    )}
                    
                    {/* テスト通知ボタン */}
                    <div className="mt-4">
                      <button
                        onClick={async () => {
                          const registration = await navigator.serviceWorker.ready;
                          if (registration) {
                            await registration.showNotification("水神の雫：テスト", {
                              body: "通知の準備はバッチリです！しずくの声が届いていますか？✨",
                              icon: "/pwa-192x192.png",
                              badge: "/pwa-192x192.png",
                              tag: "shizuku-test",
                            });
                          }
                        }}
                        className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isDarkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                        }`}
                      >
                        Test Notification
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                    <Sparkles size={12} /> Daily Goal: {settings.dailyGoal}ml
                  </label>
                  <input type="range" min="1000" max="4000" step="250" value={settings.dailyGoal} onChange={(e) => setSettings({...settings, dailyGoal: parseInt(e.target.value)})} className="w-full accent-sky-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={`rounded-[32px] p-8 w-full max-w-sm shadow-2xl transition-colors duration-1000 ${
                isDarkMode ? 'bg-slate-800 text-sky-100' : 'bg-white text-sky-900'
              }`}
            >
              <p className={`mb-8 font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-sky-950'}`}>
                今日の記録をリセットして<br/>履歴に保存しますか？
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 active:scale-[0.98]">リセットして保存</button>
                <button onClick={() => setShowConfirm(false)} className={`w-full py-4 rounded-2xl font-medium ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
