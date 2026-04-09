import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo, BarChart2, Bell, Sparkles, Moon, Sun, Settings, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

const STORAGE_KEY = 'water-shizuku-v5-starlight';

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
    celebrationColor: 'rainbow',
    dailyGoal: 2000,
    forceNightMode: false // ★手動ナイトモード設定
  });

  // 時間による判定 ＋ 手動設定の組み合わせ
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      const isNightTime = hour >= 20 || hour < 5;
      // 手動設定がONなら常に真、OFFなら時間に従う
      setIsDarkMode(settings.forceNightMode || isNightTime);
    };
    checkTime();
    const timer = setInterval(checkTime, 60000);
    return () => clearInterval(timer);
  }, [settings.forceNightMode]);

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

  const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
    if (settings.hapticIntensity === 0) return;
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      const factor = settings.hapticIntensity === 2 ? 0.5 : 1;
      if (type === 'light') window.navigator.vibrate(10 * factor);
      else if (type === 'medium') window.navigator.vibrate(30 * factor);
      else if (type === 'success') window.navigator.vibrate([20 * factor, 50 * factor, 20 * factor]);
    }
  };

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
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-12 z-[60] px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-xs font-medium tracking-wider shadow-2xl text-white text-center whitespace-pre-wrap">
            {overhydrationMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="w-full flex justify-between items-center pt-2 px-2 z-50">
        <div className="flex gap-2">
          {/* ★設定ボタン */}
          <button onClick={() => { triggerHaptic('light'); setShowSettings(true); }} 
            className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-400'}`}>
            <Settings className="w-4 h-4" />
          </button>
          
          {/* ★昼夜切替ボタン（ワンタップで魔法をかける） */}
          <button onClick={() => { triggerHaptic('medium'); setSettings({...settings, forceNightMode: !settings.forceNightMode}); }} 
            className={`p-2 transition-all active:scale-90 ${isDarkMode ? 'text-yellow-200' : 'text-indigo-400'}`}>
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="text-center cursor-pointer" onClick={() => { triggerHaptic('light'); setShowConfirm(true); }}>
          <h1 className={`text-xl font-light tracking-widest mb-0.5 transition-colors ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>水神の雫</h1>
          <p className={`${isDarkMode ? 'text-indigo-300' : 'text-sky-400'} text-[9px] tracking-tighter uppercase font-medium`}>Pure Hydration</p>
        </div>

        <button onClick={() => { triggerHaptic('light'); setShowStats(!showStats); }} 
          className={`p-2 transition-colors ${isDarkMode ? 'text-indigo-300' : 'text-sky-200'}`}>
          <BarChart2 className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className={`text-[10px] uppercase tracking-widest font-bold ${isDarkMode ? 'text-indigo-400' : 'text-sky-400'}`}>Total Today</p>
          <p className={`text-4xl font-light ${isDarkMode ? 'text-white' : 'text-sky-900'}`}>{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        <div className="relative w-52 h-52 flex-shrink-0">
          <div className={`absolute inset-0 rounded-full border shadow-[inset_0_0_20px_rgba(186,230,253,0.5)] z-40 pointer-events-none ${isDarkMode ? 'border-indigo-500/30' : 'border-sky-200'}`} />
          <div className={`absolute inset-0 rounded-full overflow-hidden z-10 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-sky-50/20'}`}>
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" 
              style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(14, 165, 233, 0.4) 100%)' }}
              animate={{ height: `${waterPercentage + 11}%`, borderRadius: ["38% 42% 40% 40%", "45% 35% 42% 38%", "35% 45% 35% 45%", "38% 42% 40% 40%"], rotate: [0, 5, -3, 0] }}
              transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 13, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 17, repeat: Infinity, ease: "easeInOut" } }} 
            />
            <motion.div className="absolute bottom-[-15%] left-[-50%] right-[-50%]" 
              style={{ background: 'linear-gradient(180deg, rgba(186, 230, 253, 0.5) 0%, rgba(56, 189, 248, 0.3) 100%)' }}
              animate={{ height: `${waterPercentage + 13}%`, borderRadius: ["42% 38% 44% 36%", "38% 42% 35% 45%", "44% 36% 40% 40%", "42% 38% 44% 36%"], rotate: [0, -6, 4, 0] }}
              transition={{ height: { duration: 1.5, ease: [0.4, 0, 0.2, 1] }, borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 11, repeat: Infinity, ease: "easeInOut" } }} 
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none text-white">
            <AnimatePresence>
              {showCelebrate ? (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="flex flex-col items-center">
                  <Sparkles className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold tracking-widest text-shadow-glow">祝福の雫</span>
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
        <button onClick={() => { triggerHaptic('light'); setShowConfirm(true); }} className={`w-full py-4 rounded-2xl bg-white/10 text-slate-400 flex items-center justify-center gap-2 border border-white/5 active:bg-white/20 transition-all ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><RotateCcw size={16} /><span className="text-xs uppercase tracking-widest font-light">Reset Data</span></button>
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
                {/* ★星空モード切替スイッチ */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Moon size={18} className="text-indigo-400" />
                    <span className="text-sm font-medium">Always Starlight Mode</span>
                  </div>
                  <button onClick={() => { setSettings({...settings, forceNightMode: !settings.forceNightMode}); triggerHaptic('light'); }} 
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.forceNightMode ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <motion.div animate={{ x: settings.forceNightMode ? 26 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Haptic Feedback</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['OFF', 'Normal', 'Soft'].map((label, i) => (
                      <button key={i} onClick={() => { setSettings({...settings, hapticIntensity: i}); triggerHaptic('light'); }} className={`py-3 rounded-xl text-xs font-medium transition-all ${settings.hapticIntensity === i ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-100 dark:bg-slate-800 opacity-60'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Daily Goal: {settings.dailyGoal}ml</label>
                  <input type="range" min="1000" max="4000" step="250" value={settings.dailyGoal} onChange={(e) => setSettings({...settings, dailyGoal: parseInt(e.target.value)})} className="w-full accent-sky-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600 shadow-lg">Done</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${isDarkMode ? 'bg-slate-800 text-sky-100' : 'bg-white text-sky-900'} rounded-3xl p-8 w-full max-w-sm shadow-2xl`}>
              <p className="mb-6 font-medium">今日の記録をリセットして<br/>履歴に保存しますか？</p>
              <div className="flex flex-col gap-3">
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold">リセットして保存</button>
                <button onClick={() => setShowConfirm(false)} className="w-full py-4 bg-slate-700/20 text-slate-400 rounded-2xl">キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
