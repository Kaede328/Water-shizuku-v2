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

  const waterPercentage = (totalToday % 1000) / 10;

  return (
    <div className="h-screen w-full bg-gradient-to-b from-white to-sky-100 text-sky-900 font-sans overflow-hidden flex flex-col items-center justify-between py-4 px-6 relative">
      
      <header className="text-center pt-2 cursor-pointer" onClick={() => setShowConfirm(true)}>
        <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
        <p className="text-sky-400 text-[9px] tracking-tighter uppercase font-medium">Pure Hydration</p>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Total Today</p>
          <p className="text-4xl font-light">{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        {/* クリスタル球体 */}
        <div className="relative w-56 h-56 flex-shrink-0 overflow-hidden rounded-full">
          {/* ガラスの質感 */}
          <div className="absolute inset-0 rounded-full border border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)] z-40 pointer-events-none" />
          
          <div className="absolute inset-0 overflow-hidden bg-sky-50/20 z-10">
            {/* 揺れる水面 */}
            <motion.div 
              className="absolute bottom-0 left-[-50%] right-[-50%] bg-sky-400/30"
              animate={{ 
                height: `${waterPercentage}%`,
                borderRadius: ["38% 42% 40% 40%", "45% 35% 45% 35%", "40% 40% 35% 45%", "38% 42% 40% 40%"],
                rotate: [0, 3, -2, 0]
              }}
              transition={{ 
                height: { duration: 1.2, ease: "easeOut" },
                borderRadius: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 10, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            {/* 重なる波のレイヤー */}
            <motion.div 
              className="absolute bottom-0 left-[-50%] right-[-50%] bg-sky-300/20"
              animate={{ 
                height: `${waterPercentage + 2}%`,
                borderRadius: ["45% 35% 45% 35%", "40% 40% 38% 42%", "35% 45% 35% 45%", "45% 35% 45% 35%"],
                rotate: [0, -5, 4, 0]
              }}
              transition={{ 
                height: { duration: 1.2, ease: "easeOut" },
                borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
            <span className="text-2xl font-extralight">{totalToday % 1000}</span>
            <span className="text-[8px] text-sky-500/60 uppercase font-bold tracking-widest">ml / 1000</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full">
        {/* ★修正：透明感のある水色の三日月バッジとUndo */}
        <div className="flex gap-4 items-center z-20">
          <div className="flex gap-4 items-center relative">
            {[1000, 2000, 2500].map((goal, i) => (
              <div key={i} className="relative w-5 h-5">
                {/* 達成時の美しい水色の輝き */}
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                    totalToday >= goal ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.7)]' : 'bg-sky-100/30'
                  }`}
                  style={{
                    boxShadow: totalToday >= goal ? 'inset -3px 0px 0px 0px rgba(255,255,255,0.4), 0 0 12px rgba(56,189,248,0.6)' : 'none',
                    clipPath: 'circle(50% at 50% 50%)',
                    maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)',
                    WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)',
                    touchAction: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <button onClick={undoWater} className={`p-2 ml-2 transition-all active:scale-90 ${history.length > 0 ? 'text-sky-500' : 'text-sky-200'}`} style={{ pointerEvents: 'auto', cursor: 'pointer', touchAction: 'manipulation' }}>
            <Undo className="w-4 h-4" />
          </button>
        </div>
        <div className="h-8" /> 
      </div>

      <div className="w-full max-w-xs flex flex-col gap-4 pb-16 z-20">
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => addWater(250)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center transition-all active:scale-[0.96]">
            <Plus size={20} className="text-sky-400" />
            <span className="text-sm font-medium">250ml</span>
          </button>
          <button onClick={() => addWater(500)} className="bg-white/60 py-4 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center transition-all active:scale-[0.96]">
            <Plus size={20} className="text-sky-400" />
            <span className="text-sm font-medium">500ml</span>
          </button>
        </div>

        <button 
          onClick={() => setShowConfirm(true)}
          className="w-full py-4 rounded-2xl bg-white/50 text-slate-400 flex items-center justify-center gap-2 border border-white/40 mb-4 transition-all active:bg-white/80"
          style={{ cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
        >
          <RotateCcw size={16} />
          <span className="text-xs uppercase tracking-widest font-light">Reset Data</span>
        </button>
      </div>

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
                <button onClick={finalReset} className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold active:bg-sky-600 transition-all active:scale-[0.98]">リセットする</button>
                <button onClick={() => setShowConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl active:bg-slate-200 transition-all active:scale-[0.98]">キャンセル</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
