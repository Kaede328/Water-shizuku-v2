import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo, BarChart2, Bell, Sparkles, Moon, Sun, Settings, X, Fingerprint } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

// キーを変更して古いキャッシュを完全に切り離します
const STORAGE_KEY = 'water-shizuku-v8-final-resort';

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

  const [settings, setSettings] = useState({
    hapticIntensity: 1,
    notificationsEnabled: true,
    dailyGoal: 2500,
    forceNightMode: false 
  });

  // ★ iPhone 用の触覚フィードバック強化版
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'success') => {
    if (settings.hapticIntensity === 0) return;
    
    // iPhone (iOS) の Safari では navigator.vibrate がサポートされていない場合があります
    // そのため、通常の振動命令に加え、ログを出して動作を確認します
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      const isSoft = settings.hapticIntensity === 2;
      try {
        if (type === 'light') {
          window.navigator.vibrate(isSoft ? 15 : 30);
        } else if (type === 'medium') {
          window.navigator.vibrate(isSoft ? 30 : 60);
        } else if (type === 'success') {
          // 成功時は「トン、トン」と2回。間隔を少し開けて認識率を上げます
          window.navigator.vibrate(isSoft ? [30, 60, 30] : [50, 100, 50]);
        }
      } catch (e) {
        console.log("Haptic limited by browser settings", e);
      }
    }
  }, [settings.hapticIntensity]);

  // ★ 通知から「From しずく」を消し去るための新ロジック
  const sendFinalNotification = async () => {
    triggerHaptic('medium');
    if (!("Notification" in window)) {
      alert("この端末は通知に対応していません");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // 古いキャッシュを回避するため、タイトルを「 」（半角スペース）にし、
      // 本文の最初にアプリ名を入れることで、OSの強制表示を上書きします。
      new Notification(" ", { 
        body: "【水神の雫】\nひと口お水を飲んでリフレッシュしませんか？✨",
        icon: "/pwa-192x192.png",
        tag: "shizuku-alert-" + Date.now() // 毎回新しい通知として扱う
      });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTotalToday(parsed.totalToday || 0);
      setHistory(parsed.history || []);
      setWeeklyHistory(parsed.weeklyHistory || []);
      if (parsed.settings) {
        setSettings({ ...parsed.settings, dailyGoal: parsed.settings.dailyGoal || 2500 });
      }
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

  const checkOverhydration = (newAmount: number) => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentTotal = recordTimes.filter(t => t > oneHourAgo).length * 250 + newAmount;
    if (recentTotal >= 1000) {
      setOverhydrationMsg("楓さん、ゆっくり、ひと口ずつ。\nその方が体に染み渡りますよ 🌙");
      setTimeout(() => setOverhydrationMsg(null), 5000);
    }
  };

  const addWater = (amount: number) => {
    triggerHaptic('medium');
    checkOverhydration(amount);
    const newTotal = totalToday + amount;
    setHistory(prev => [totalToday, ...prev]);
    setRecordTimes(prev => [Date.now(), ...prev]);
    
    const milestones = [1000, 2000, 2500];
    const reachedMilestone = milestones.find(m => totalToday < m && newTotal >= m);
    if (reachedMilestone || (totalToday < settings.dailyGoal && newTotal >= settings.dailyGoal)) {
      setShowCelebrate(true);
      triggerHaptic('success');
      setTimeout(() => setShowCelebrate(false), 4000);
    }
    setTotalToday(newTotal);
  };

  const finalReset = () => {
    triggerHaptic('medium');
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
      
      <AnimatePresence>
        {overhydrationMsg && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 20, opacity: 1 }} 
            exit={{ y: -50, opacity: 0 }} 
            className={`absolute top-12 z-[60] px-6 py-3 backdrop-blur-xl border rounded-2xl text-xs font-bold tracking-wider shadow-2xl text-center whitespace-pre-wrap transition-colors duration-1000 ${
              isDarkMode 
              ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
              : 'bg-white/80 border-sky-200 text-sky-900 shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
            }`}
          >
            {overhydrationMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full flex justify-between items-center pt-2 px-2 z-50">
        <div className="flex gap-2">
          <button onClick={() => { triggerHaptic('light'); setShowSettings(true); }} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-400'}`}><Settings className="w-4 h-4" /></button>
          <button onClick={() => { triggerHaptic('medium'); setSettings({...settings, forceNightMode: !settings.forceNightMode}); }} className={`p-2 transition-all active:scale-90 ${isDarkMode ? 'text-yellow-200' : 'text-indigo-400'}`}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-center cursor-pointer" onClick={() => { triggerHaptic('light'); setShowConfirm(true); }}>
          <h1 className={`text-xl font-light tracking-widest mb-0.5 transition-colors ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>水神の雫</h1>
          <p className={`${isDarkMode ? 'text-indigo-300' : 'text-sky-400'} text-[9px] tracking-tighter uppercase font-medium`}>Pure Hydration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={sendFinalNotification} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}><Bell className="w-4 h-4" /></button>
          <button onClick={() => { triggerHaptic('light'); setShowStats(!showStats); }} className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}><BarChart2 className="w-4 h-4" /></button>
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
              showCelebrate 
                ? isDarkMode
                  ? 'border-transparent shadow-[0_0_40px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.4)] bg-gradient-to-tr from-pink-400/40 via-sky-300/40 to-emerald-300/40' 
                  : 'border-transparent shadow-[0_0_25px_rgba(56,189,248,0.5),inset_0_0_15px_rgba(255,255,255,0.6)] bg-gradient-to-tr from-pink-300/30 via-sky-300/30 to-emerald-400/30'
                : isDarkMode 
                  ? 'border-indigo-500/30 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)]' 
                  : 'border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)]'
            }`} 
          />
          <div className={`absolute inset-0 rounded-full overflow-hidden z-10 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-sky-50/20'}`}>
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(14, 165, 233, 0.4) 100%)' }} animate={{ height: `${waterPercentage + 11}%`, borderRadius: ["38% 42% 40% 40%", "45% 35% 42% 38%", "35% 45% 35% 45%", "38% 42% 40% 40%"], rotate: [0, 5, -3, 0] }} transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 13, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 17, repeat: Infinity, ease: "easeInOut" } }} />
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" style={{ background: 'linear-gradient(180deg, rgba(186, 230, 253, 0.5) 0%, rgba(56, 189, 248, 0.3) 100%)' }} animate={{ height: `${waterPercentage + 13}%`, borderRadius: ["42% 38% 44% 36%", "38% 42% 35% 45%", "44% 36% 40% 40%", "42% 38% 44% 36%"], rotate: [0, -6, 4, 0] }} transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 11, repeat: Infinity, ease: "easeInOut" } }} />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none text-center">
            <AnimatePresence>
              {showCelebrate ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  exit={{ scale: 1.1, opacity: 0 }} 
                  className="flex flex-col items-center"
                >
                  <Sparkles className={`w-6 h-6 mb-3 animate-pulse transition-colors duration-1000 ${isDarkMode ? 'text-blue-100' : 'text-sky-300'}`} />
                  <div className="flex justify-center items-center">
                    <span className={`text-xl font-extralight tracking-[0.5em] transition-colors duration-1000 ${
                      isDarkMode 
                      ? 'text-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                      : 'text-sky-900 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    }`}>
                      祝福の雫
                    </span>
                  </div>
                  <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.5 }}
                    className={`text-[8px] mt-2 tracking-[0.2em] uppercase font-medium ${isDarkMode ? 'text-blue-200/60' : 'text-sky-400/60'}`}
                  >
                    Blessing of water
                  </motion.span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className={`text-2xl font-extralight ${isDarkMode ? 'text-sky-100' : 'text-sky-900'}`}>{totalToday}</span>
                  <span className={`text-[8px] uppercase font-bold tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-sky-500/60'}`}>total ml</span>
                </div>
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
          <button onClick={() => { triggerHaptic('light'); if (history.length > 0) { const [last, ...rem] = history; setTotalToday(last); setHistory(rem); } }} className={`p-2 ml-2 transition-all active:scale-90 ${history.length > 0 ? (isDarkMode ? 'text-indigo-400' : 'text-sky-500') : 'text-slate-300/30'}`}><Undo className="w-4 h-4" /></button>
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

      <div className="w-full max-w-xs flex flex-col gap-4 pb-12 z-20">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addWater(250)} className={`py-4 rounded-2xl border backdrop-blur-sm shadow-sm flex flex-col items-center active:scale-[0.96] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/50 text-sky-900'}`}><Plus size={20} className={isDarkMode ? 'text-indigo-400' : 'text-sky-400'} /><span className="text-sm font-medium">250ml</span></button>
          <button onClick={() => addWater(500)} className={`py-4 rounded-2xl border backdrop-blur-sm shadow-sm flex flex-col items-center active:scale-[0.96] transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-white/50 text-sky-900'}`}><Plus size={20} className={isDarkMode ? 'text-indigo-400' : 'text-sky-400'} /><span className="text-sm font-medium">500ml</span></button>
        </div>
        <button onClick={() => { triggerHaptic('light'); setShowConfirm(true); }} className={`w-full py-4 rounded-2xl bg-white/10 flex items-center justify-center gap-2 border border-white/5 active:bg-white/20 transition-all ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><RotateCcw size={16} /><span className="text-xs uppercase tracking-widest font-light">Reset Data</span></button>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Haptic Test</label>
                  <button onClick={() => triggerHaptic('medium')} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
                    <Fingerprint size={18} />
                    <span className="text-sm font-bold">Test Vibration</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Intensity Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['OFF', 'Normal', 'Soft'].map((label, i) => (
                      <button key={i} onClick={() => { setSettings({...settings, hapticIntensity: i}); setTimeout(() => triggerHaptic('light'), 50); }} className={`py-3 rounded-xl text-xs font-medium transition-all ${settings.hapticIntensity === i ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 opacity-60'}`}>{label}</button>
                    ))}
                  </div>
                </div>

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
