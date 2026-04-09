import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo, BarChart2, Bell } from 'lucide-react';

const STORAGE_KEY = 'water-shizuku-v2-final';

export default function App() {
  const [totalToday, setTotalToday] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<{date: string, amount: number}[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStats, setShowStats] = useState(false);

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

  // 通知の許可を求める関数
  const requestNotification = async () => {
    if (!("Notification" in window)) {
      alert("このブラウザはデスクトップ通知をサポートしていません。");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('通知がオンになりました！1時間ごとにリマインドします（アプリが開いている間）');
      // 1時間ごとに通知を出すタイマー（簡易版）
      setInterval(() => {
        new Notification("水神の雫", {
          body: "楓さん、そろそろお水を一杯いかがですか？",
          icon: "./Icon.jpg"
        });
      }, 3600000); // 3600000ミリ秒 = 1時間
    } else {
      alert('通知が拒否されました。ブラウザの設定から許可してください。');
    }
  };

  const addWater = (amount: number) => {
    setHistory(prev => [totalToday, ...prev]);
    setTotalToday(prev => prev + amount);
  };

  const undoWater = () => {
    if (history.length === 0) return;
    const [lastValue, ...remaining] = history;
    setTotalToday(lastValue);
    setHistory(remaining);
  };

  const finalReset = () => {
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
    <div className="h-screen w-full bg-gradient-to-b from-white to-sky-100 text-sky-900 font-sans overflow-hidden flex flex-col items-center justify-between py-4 px-6 relative">
      <header className="text-center pt-2 flex flex-col items-center">
        <div className="cursor-pointer" onClick={() => setShowConfirm(true)}>
          <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
          <p className="text-sky-400 text-[9px] tracking-tighter uppercase font-medium">Pure Hydration</p>
        </div>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Total Today</p>
          <p className="text-4xl font-light">{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        <div className="relative w-52 h-52 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)] z-40 pointer-events-none" />
          <div className="absolute inset-0 rounded-full overflow-hidden bg-sky-50/20 z-10">
            <motion.div 
              className="absolute bottom-[-10%] left-[-50%] right-[-50%] bg-sky-400/30"
              animate={{ 
                height: `${waterPercentage + 10}%`,
                borderRadius: ["38% 42% 40% 40%", "41% 39% 41% 39%", "40% 40% 39% 41%"],
                rotate: [0, 2, -2, 0] 
              }}
              transition={{ height: { duration: 1 }, borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
            <span className="text-2xl font-extralight">{totalToday % 1000}</span>
            <span className="text-[8px] text-sky-500/60 uppercase font-bold tracking-widest">ml / 1000</span>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex gap-6 items-center z-20">
          <div className="flex gap-3 items-center">
            {[1000, 2000, 2500].map((goal, i) => (
              <div key={i} className="relative w-4 h-4">
                <div 
                  className={`w-full h-full rounded-full transition-all duration-1000 ${totalToday >= goal ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]' : 'bg-sky-200/20'}`}
                  style={{
                    boxShadow: totalToday >= goal ? 'inset -2px 0px 0px 0px rgba(255,255,255,0.3), 0 0 8px rgba(56,189,248,0.5)' : 'none',
                    clipPath: 'circle(50% at 50% 50%)',
                    maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)',
                    WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)'
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={requestNotification} className="p-2 text-sky-400 active:scale-90"><Bell className="w-4 h-4" /></button>
            <button onClick={() => setShowStats(!showStats)} className="p-2 text-sky-400 active:scale-90"><BarChart2 className="w-4 h-4" /></button>
            <button onClick={undoWater} className={`p-2 transition-all active:scale-90 ${history.length > 0 ? 'text-sky-500' : 'text-sky-200'}`}><Undo className="w-4 h-4" /></button>
          </div>
        </div>

        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-[240px] bg-white/40 backdrop-blur-sm rounded-2xl p-4 overflow-hidden"
            >
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
        <button onClick={() => setShowConfirm(true)} className="w-full py-4 rounded-2xl bg-white/50 text-slate-400 flex items-center justify-center gap-2 border border-white/40 active:bg-white/80 transition-all"><RotateCcw size={16} /><span className="text-xs uppercase tracking-widest font-light">Reset Data</span></button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-sky-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
              <p className="text-sky-900 mb-6 font-medium">今日の記録をリセットして<br/>履歴に保存しますか？</p>
              <div className="flex flex-col gap-3">
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600 transition-all">リセットして保存</button>
                <button onClick={() => setShowConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl active:bg-slate-200 transition-all">キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
