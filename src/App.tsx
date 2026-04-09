import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo, BarChart2, Bell, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'water-shizuku-v3-final';

export default function App() {
  const [totalToday, setTotalToday] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<{date: string, amount: number}[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  // ★触覚フィードバックを呼び出す関数
  const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
    if (window.navigator && window.navigator.vibrate) {
      if (type === 'light') window.navigator.vibrate(10); // 短く軽い
      if (type === 'medium') window.navigator.vibrate(30); // 少し強め
      if (type === 'success') window.navigator.vibrate([10, 30, 10, 30]); // トントン、というリズム
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTotalToday(parsed.totalToday || 0);
      setHistory(parsed.history || []);
      setWeeklyHistory(parsed.weeklyHistory || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalToday, history, weeklyHistory }));
  }, [totalToday, history, weeklyHistory]);

  const requestNotification = async () => {
    triggerHaptic('light'); // ボタン操作音の代わり
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('通知をオンにしました。8:00〜22:00の間、1時間ごとにリマインドします。');
      setInterval(() => {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 8 && hour < 22) {
          new Notification("水神の雫", { body: "楓さん、水分補給の時間ですよ。", icon: "./Icon.jpg" });
        }
      }, 3600000);
    }
  };

  const addWater = (amount: number) => {
    triggerHaptic('medium'); // 水を足した時の手応え
    const newTotal = totalToday + amount;
    setHistory(prev => [totalToday, ...prev]);
    
    if ((totalToday < 1000 && newTotal >= 1000) || 
        (totalToday < 2000 && newTotal >= 2000) || 
        (totalToday < 2500 && newTotal >= 2500)) {
      setShowCelebrate(true);
      triggerHaptic('success'); // 祝福の特別なリズム
      setTimeout(() => setShowCelebrate(false), 3000);
    }
    setTotalToday(newTotal);
  };

  const undoWater = () => {
    triggerHaptic('light');
    if (history.length === 0) return;
    const [lastValue, ...remaining] = history;
    setTotalToday(lastValue);
    setHistory(remaining);
  };

  const finalReset = () => {
    triggerHaptic('medium');
    const todayStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    setWeeklyHistory(prev => {
      const existingIndex = prev.findIndex(item => item.date === todayStr);
      if (existingIndex !== -1) {
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = { date: todayStr, amount: totalToday };
        return updatedHistory;
      }
      return [{ date: todayStr, amount: totalToday }, ...prev].slice(0, 7);
    });
    setTotalToday(0);
    setHistory([]);
    setShowConfirm(false);
  };

  const waterPercentage = (totalToday % 1000) / 10;

  return (
    <div className="h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-sky-50 to-sky-200 text-sky-900 font-sans overflow-hidden flex flex-col items-center justify-between py-4 px-6 relative">
      <header className="w-full flex justify-between items-center pt-2 px-2 z-50">
        <button onClick={requestNotification} className="p-2 text-sky-200 active:text-sky-400 transition-colors"><Bell className="w-4 h-4" /></button>
        <div className="text-center cursor-pointer" onClick={() => { triggerHaptic('light'); setShowConfirm(true); }}>
          <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
          <p className="text-sky-400 text-[9px] tracking-tighter uppercase font-medium">Pure Hydration</p>
        </div>
        <button onClick={() => { triggerHaptic('light'); setShowStats(!showStats); }} className="p-2 text-sky-200 active:text-sky-400 transition-colors"><BarChart2 className="w-4 h-4" /></button>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Total Today</p>
          <p className="text-4xl font-light">{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        <div className="relative w-52 h-52 flex-shrink-0">
          <AnimatePresence>
            {showCelebrate && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
                className="absolute inset-0 rounded-full overflow-hidden z-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-200/50 via-sky-300/60 to-indigo-200/50 blur-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 rounded-full border border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)] z-40 pointer-events-none" />
          <div className="absolute inset-0 rounded-full overflow-hidden bg-sky-50/20 z-10">
            {/* ★1層目：深層の波（奥行きと深み） */}
            <motion.div 
              className="absolute bottom-[-15%] left-[-50%] right-[-50%]"
              style={{
                background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.5) 100%)',
              }}
              animate={{ 
                height: `${waterPercentage + 11}%`,
                borderRadius: ["42% 38% 44% 36%", "36% 44% 38% 42%", "42% 38% 44% 36%"],
                rotate: [0, 4, -4, 0] 
              }}
              transition={{ 
                height: { duration: 1.2, ease: "easeInOut" }, 
                borderRadius: { duration: 11, repeat: Infinity, ease: "linear" }, // 長い周期でゆったり
                rotate: { duration: 13, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            {/* ★2層目：表層の波（透明感と光の反射） */}
            <motion.div 
              className="absolute bottom-[-15%] left-[-50%] right-[-50%]"
              style={{
                background: 'linear-gradient(180deg, rgba(186, 230, 253, 0.3) 0%, rgba(56, 189, 248, 0.2) 100%)',
              }}
              animate={{ 
                height: `${waterPercentage + 13}%`,
                borderRadius: ["38% 42% 36% 44%", "44% 36% 42% 38%", "38% 42% 36% 44%"],
                rotate: [0, -5, 5, 0] // 逆方向に少し大きく揺らす
              }}
              transition={{ 
                height: { duration: 1.2, ease: "easeInOut" },
                borderRadius: { duration: 7, repeat: Infinity, ease: "linear" }, // 短い周期で細かく
                rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
            <AnimatePresence>
              {showCelebrate ? (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="flex flex-col items-center text-white">
                  <Sparkles className="w-8 h-8 mb-2" />
                  <span className="text-xl font-bold tracking-widest">祝福の雫</span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-extralight">{totalToday % 1000}</span>
                  <span className="text-[8px] text-sky-500/60 uppercase font-bold tracking-widest">ml / 1000</span>
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
                <div className={`w-full h-full rounded-full transition-all duration-1000 ${totalToday >= goal ? 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]' : 'bg-sky-200/20'}`} style={{ boxShadow: totalToday >= goal ? 'inset -2px 0px 0px 0px rgba(255,255,255,0.3), 0 0 10px rgba(56,189,248,0.5)' : 'none', clipPath: 'circle(50% at 50% 50%)', maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)', WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)' }} />
              </div>
            ))}
          </div>
          <button onClick={undoWater} className={`p-2 ml-2 transition-all active:scale-90 ${history.length > 0 ? 'text-sky-500' : 'text-sky-200'}`}><Undo className="w-4 h-4" /></button>
        </div>
        <AnimatePresence>
          {showStats && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="w-full max-w-[240px] bg-white/40 backdrop-blur-sm rounded-2xl p-4 overflow-hidden shadow-sm">
              <p className="text-[10px] text-sky-500 font-bold mb-3 tracking-widest uppercase text-center">Last 7 Days</p>
              <div className="flex flex-col gap-2">
                {weeklyHistory.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-sky-400">{item.date}</span>
                    <div className="flex-1 mx-3 h-1 bg-sky-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400" style={{ width: `${Math.min((item.amount / 2500) * 100, 100)}%` }} />
                    </div>
                    <span className="font-medium text-sky-600">{item.amount}ml</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-4 pb-12 z-20">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addWater(250)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center active:scale-[0.96] transition-all"><Plus size={20} className="text-sky-400" /><span className="text-sm font-medium">250ml</span></button>
          <button onClick={() => addWater(500)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center active:scale-[0.96] transition-all"><Plus size={20} className="text-sky-400" /><span className="text-sm font-medium">500ml</span></button>
        </div>
        <button onClick={() => { triggerHaptic('light'); setShowConfirm(true); }} className="w-full py-4 rounded-2xl bg-white/50 text-slate-400 flex items-center justify-center gap-2 border border-white/40 active:bg-white/80 transition-all"><RotateCcw size={16} /><span className="text-xs uppercase tracking-widest font-light">Reset Data</span></button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-sky-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <p className="text-sky-900 mb-6 font-medium">今日の記録をリセットして<br/>履歴に保存しますか？</p>
              <div className="flex flex-col gap-3">
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600 transition-all">リセットして保存</button>
                <button onClick={() => { triggerHaptic('light'); setShowConfirm(false); }} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl active:bg-slate-200 transition-all">キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
