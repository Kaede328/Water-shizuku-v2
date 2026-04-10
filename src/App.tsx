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

  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    dailyGoal: 2500,
    forceNightMode: false 
  });

  // ★ 通知：iPhoneの自動付与(from しずく)と繋がって1行に見えるように
  const sendFinalNotification = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("水神の雫", { 
        // 本文から「From しずく」を消し、iPhoneの自動付与に任せます
        body: "ひと口お水を飲んでリフレッシュしませんか？✨",
        icon: "/pwa-192x192.png",
        tag: "shizuku-daily-alert"
      });
    }
  };

  // ★ 過剰摂取チェック：1000ml以上の時に、潤いの知恵をそっと伝える
  const checkOverhydration = (amount: number) => {
    if (amount >= 1000) {
      setOverhydrationMsg("一度にたくさん飲むよりも、\n少しずつ、ゆっくり飲んだ方が\nもっと綺麗に、深く潤いますよ。");
      // メッセージを少し長めに（7秒間）表示して、心に届けます
      setTimeout(() => setOverhydrationMsg(null), 7000);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTotalToday(parsed.totalToday || 0);
      setHistory(parsed.history || []);
      setWeeklyHistory(parsed.weeklyHistory || []);
      if (parsed.settings) setSettings(parsed.settings);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalToday, history, weeklyHistory, settings }));
  }, [totalToday, history, weeklyHistory, settings]);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      const isNightTime = hour >= 20 || hour < 5;
      setIsDarkMode(settings.forceNightMode || isNightTime);
    };
    checkTime();
    const timer = setInterval(checkTime, 60000);
    return () => clearInterval(timer);
  }, [settings.forceNightMode]);

  // ★ 1時間ごとの自動通知ロジック
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkHydration = () => {
      // 最後に飲んだ時間（記録がない場合は現在時刻を起点にする）
      const lastDrink = recordTimes[0] || Date.now();
      const oneHour = 60 * 60 * 1000;
      const now = Date.now();

      // 1時間以上経過しており、かつその1時間の間でまだ通知を送っていない場合
      if (now - lastDrink >= oneHour && (!lastNotificationTime || lastNotificationTime < lastDrink)) {
        sendFinalNotification();
        setLastNotificationTime(now); // 送信済みとして記録
      }
    };

    // 1分ごとに状況を確認
    const hydrationTimer = setInterval(checkHydration, 60000);
    return () => clearInterval(hydrationTimer);
  }, [recordTimes, lastNotificationTime, settings.notificationsEnabled]);

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
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-400'}`}><Settings className="w-4 h-4" /></button>
          <button onClick={() => setSettings({...settings, forceNightMode: !settings.forceNightMode})} className={`p-2 transition-all active:scale-90 ${isDarkMode ? 'text-yellow-200' : 'text-indigo-400'}`}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-center cursor-pointer" onClick={() => setShowConfirm(true)}>
          <h1 className={`text-xl font-light tracking-widest mb-0.5 transition-colors ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>水神の雫</h1>
          <p className={`${isDarkMode ? 'text-indigo-300' : 'text-sky-400'} text-[9px] tracking-tighter uppercase font-medium`}>Pure Hydration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={sendFinalNotification} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}><Bell className="w-4 h-4" /></button>
          <button onClick={() => setShowStats(!showStats)} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}><BarChart2 className="w-4 h-4" /></button>
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
                  {/* 1. 【特別：目標達成時】全画面を広く使った祝福演出 */}
                  {celebrateType === 'special' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`fixed inset-0 z-[200] pointer-events-none flex flex-col items-center justify-center transition-colors duration-[2000ms] ${
                        isDarkMode ? 'bg-indigo-950/40' : 'bg-white/60'
                      }`}
                    >
                      {/* 背景の大きな虹色のオーロラ */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: [0, 0.4, 0], // 不透明度を上げてハッキリと
                          scale: [1, 1.2, 1] 
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-tr from-blue-300/40 via-purple-300/40 to-pink-300/40 blur-[100px]"
                      />
                      
                      {/* 画面中央に大きく表示されるテキスト */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center justify-center text-center px-6 relative z-10"
                      >
                        <motion.div
                          animate={{ y: [-5, 5, -5], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <Sparkles 
                            className={`mb-6 ${isDarkMode ? 'text-blue-100' : 'text-sky-300'} w-12 h-12`} 
                          />
                        </motion.div>
                        
                        <span className={`font-extralight tracking-[0.7em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg text-5xl`}>
                          祝福の雫
                        </span>
                        
                        <motion.span 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 0.7 }} 
                          transition={{ delay: 1.0 }}
                          className={`text-[10px] mt-6 tracking-[0.5em] uppercase font-light ${isDarkMode ? 'text-blue-100' : 'text-sky-700'}`}
                        >
                          Your body is deeply hydrated
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* 2. 【通常：1000mlごと】クリスタルの中心に浮かぶ祝福 */}
                  {celebrateType === 'normal' && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center justify-center text-center px-4"
                      >
                        <motion.div
                          animate={{ y: [-3, 3, -3], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Sparkles 
                            className={`mb-3 ${isDarkMode ? 'text-blue-100' : 'text-sky-300'} w-5 h-5`} 
                          />
                        </motion.div>
                        
                        <span className={`font-extralight tracking-[0.6em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm text-xl`}>
                          祝福の雫
                        </span>
                        
                        <span className={`text-[8px] mt-4 tracking-[0.4em] uppercase font-light ${
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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={`w-full max-w-[280px] backdrop-blur-md rounded-3xl p-5 overflow-hidden shadow-lg border ${isDarkMode ? 'bg-slate-900/60 border-white/10' : 'bg-white/60 border-white/40'}`}>
              <p className={`text-[10px] font-bold mb-4 tracking-widest uppercase text-center ${isDarkMode ? 'text-indigo-400' : 'text-sky-500'}`}>Weekly History</p>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={[0, settings.dailyGoal]} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount >= settings.dailyGoal ? (isDarkMode ? '#818cf8' : '#38bdf8') : (isDarkMode ? '#312e81' : '#bae6fd')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ★ 250ml & 500ml：氷のような透明感のあるボタン */}
      <div className="flex gap-4 mb-8 z-20">
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
      <div className="flex justify-center mt-12 mb-8 z-20">
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
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Daily Goal: {settings.dailyGoal}ml</label>
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
