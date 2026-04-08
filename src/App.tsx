import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, RotateCcw, Undo } from 'lucide-react';

const STORAGE_KEY = 'water-shizuku-v2-final';

export default function App() {
  const [totalToday, setTotalToday] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTotalToday(parsed.totalToday || 0);
      setHistory(parsed.history || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalToday, history }));
  }, [totalToday, history]);

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
    localStorage.clear();
    setTotalToday(0);
    setHistory([]);
    setShowConfirm(false);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-white to-sky-100 text-sky-900 font-sans overflow-hidden flex flex-col items-center justify-between py-4 px-6 relative">
      
      <header className="text-center pt-2 cursor-pointer" onClick={() => setShowConfirm(true)}>
        <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
        <p className="text-sky-400 text-[9px] tracking-tighter uppercase">Pure Hydration</p>
      </header>

      {/* メイン表示エリア */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-sky-400">Total Today</p>
          <p className="text-4xl font-light">{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        <div className="relative w-56 h-56 flex-shrink-0">
          <div 
            className="absolute inset-0 rounded-full border border-sky-200 z-10" 
            style={{ boxShadow: 'inset 0 0 20px rgba(186, 230, 253, 0.5)' }}
          />
          <div className="absolute inset-0 rounded-full overflow-hidden bg-sky-50/20">
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-sky-400/30"
              animate={{ height: `${(totalToday % 1000) / 10}%` }}
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
            <span className="text-2xl font-extralight">{totalToday % 1000}</span>
            <span className="text-[8px] text-sky-500/60 uppercase">ml / 1000</span>
          </div>
        </div>
      </div>

      {/* 三日月バッジとUndoの列 */}
      <div className="flex flex-col items-center w-full">
        <div className="flex gap-4 items-center z-20">
          <div className="flex gap-4 items-center">
            {[1000, 2000, 2500].map((goal, i) => (
              <div key={i} className="relative w-5 h-5">
                <div 
                  className={`w-full h-full rounded-full transition-all duration-1000 ${
                    totalToday >= goal ? 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' : 'bg-sky-200/20'
                  }`}
                  style={{
                    boxShadow: totalToday >= goal ? 'inset -2px 0px 0px 0px rgba(0,0,0,0.1), 0 0 8px #fbbf24' : 'none',
                    clipPath: 'circle(50% at 50% 50%)',
                    maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)',
                    WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)'
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={undoWater} className={`p-2 ml-2 transition-all active:scale-90 ${history.length > 0 ? 'text-sky-500' : 'text-sky-200'}`}>
            <Undo className="w-4 h-4" />
          </button>
        </div>
        
        {/* 🌸 楓さんのための「ひといき」スペース */}
        <div className="h-8" /> 
      </div>

      {/* 操作エリア */}
      <div className="w-full max-w-xs flex flex-col gap-4 pb-16 z-20">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addWater(250)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center transition-all active:scale-[0.96]">
            <Plus size={20} className="text-sky-400" />
            <span className="text-sm">250ml</span>
          </button>
          <button onClick={() => addWater(500)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center transition-all active:scale-[0.96]">
            <Plus size={20} className="text-sky-400" />
            <span className="text-sm">500ml</span>
          </button>
        </div>

        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full py-4 rounded-2xl bg-white/50 text-slate-400 flex items-center justify-center gap-2 border border-white/40 mb-4 transition-all active:bg-white/80"
        >
          <RotateCcw size={16} />
          <span className="text-xs uppercase tracking-widest font-light">Reset Data</span>
        </button>
      </div>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-sky-900/40 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <p className="text-sky-900 mb-6 font-medium">今日の記録をリセットして<br/>0mlに戻しますか？</p>
              <div className="flex flex-col gap-3">
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600">リセットする</button>
                <button onClick={() => setShowConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl active:bg-slate-200">キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
