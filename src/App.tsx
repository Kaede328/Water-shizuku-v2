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
      
      {/* 予備のリセットスイッチも兼ねたヘッダー */}
      <header className="text-center pt-2 cursor-pointer z-50" onClick={() => setShowConfirm(true)}>
        <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
        <p className="text-sky-400 text-[9px] tracking-tighter uppercase font-medium">Pure Hydration</p>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold">Total Today</p>
          <p className="text-4xl font-light">{totalToday}<span className="text-sm ml-1">ml</span></p>
        </div>

        {/* 繊細なゆらぎのクリスタル球体 */}
        <div className="relative w-56 h-56 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border border-sky-200 shadow-[inset_0_0_20px_rgba(186,230,253,0.5)] z-40 pointer-events-none" />
          
          <div className="absolute inset-0 rounded-full overflow-hidden bg-sky-50/20 z-10">
            {/* 繊細なメインの波 */}
            <motion.div 
              className="absolute bottom-[-10%] left-[-50%] right-[-50%] bg-sky-400/30"
              animate={{ 
                height: `${waterPercentage + 10}%`,
                // 形の変化（borderRadius）の幅を「40%」前後にぎゅっと縮めて、変形を小さくしました
                borderRadius: ["39% 41% 40% 40%", "41% 39% 41% 39%", "40% 40% 39% 41%"],
                // 揺れる角度（rotate）を「2度」まで小さくして、暴れないようにしました
                rotate: [0, 2, -2, 0] 
              }}
              transition={{ 
                height: { duration: 1 }, // スピードは元の「1秒」に戻しました
                borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut" }, // 4秒周期で細かく動きます
                rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" } 
              }}
            />
            {/* 繊細なサブの波（逆回転で干渉を表現） */}
            <motion.div 
              className="absolute bottom-[-10%] left-[-50%] right-[-50%] bg-sky-300/20"
              animate={{ 
                height: `${waterPercentage + 12}%`,
                borderRadius: ["41% 39% 41% 39%", "40% 40% 39% 41%", "39% 41% 40% 40%"],
                rotate: [0, -3, 3, 0] // サブも揺れ幅は最小限に
              }}
              transition={{ 
                height: { duration: 1 },
                borderRadius: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
            <span className="text-2xl font-extralight">{totalToday % 1000}</span>
            <span className="text-[8px] text-sky-500/60 uppercase font-bold tracking-widest">ml / 1000</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full">
        {/* 水色の月のバッジとUndo */}
        <div className="flex gap-4 items-center z-20">
          <div className="flex gap-4 items-center">
            {[1000, 2000, 2500].map((goal, i) => (
              <div key={i} className="relative w-5 h-5">
                <div 
                  className={`w-full h-full rounded-full transition-all duration-1000 ${
                    totalToday >= goal ? 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]' : 'bg-sky-200/20'
                  }`}
                  style={{
                    boxShadow: totalToday >= goal ? 'inset -2px 0px 0px 0px rgba(255,255,255,0.3), 0 0 10px rgba(56,189,248,0.5)' : 'none',
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
        <div className="h-8" /> 
      </div>

      {/* 操作エリア */}
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
        >
          <RotateCcw size={16} />
          <span className="text-xs uppercase tracking-widest font-light">Reset Data</span>
        </button>
      </div>

      {/* 自作の確認ダイアログ */}
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
