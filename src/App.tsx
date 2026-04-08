/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, RotateCcw, Undo } from 'lucide-react';

// Constants
const DAILY_GOAL = 2500;
const CYCLE_MAX = 1000;
const RESET_HOUR = 4;

type DrinkType = 'water' | 'tea' | 'juice';

interface AppState {
  totalToday: number;
  lastResetDate: string;
  history: number[];
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('water-shizuku-v2-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        totalToday: parsed.totalToday ?? 0,
        lastResetDate: parsed.lastResetDate ?? new Date().toISOString(),
        history: parsed.history ?? [],
      };
    }
    return {
      totalToday: 0,
      lastResetDate: new Date().toISOString(),
      history: [],
    };
  });

  const [drinkType, setDrinkType] = useState<DrinkType>('water');

  // Initialization check
  useEffect(() => {
    const savedAmount = localStorage.getItem('water-amount');
    const savedState = localStorage.getItem('water-shizuku-v2-state');
    if (!savedAmount && !savedState) {
      setState(prev => ({ ...prev, totalToday: 0, history: [] }));
    }
  }, []);

  // Auto Reset Logic
  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const lastReset = new Date(state.lastResetDate);
      const today4AM = new Date();
      today4AM.setHours(RESET_HOUR, 0, 0, 0);

      if (lastReset < today4AM && now >= today4AM) {
        localStorage.clear();
        window.location.href = window.location.href;
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastResetDate]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('water-shizuku-v2-state', JSON.stringify(state));
  }, [state]);

  const addWater = (amount: number) => {
    setState(prev => ({
      ...prev,
      // Store current total at the beginning of history for Undo
      history: [prev.totalToday, ...prev.history],
      totalToday: prev.totalToday + amount,
    }));
  };

  const undoWater = () => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const [lastValue, ...remainingHistory] = prev.history;
      return {
        ...prev,
        totalToday: lastValue,
        history: remainingHistory,
      };
    });
  };

  // Logic for cycle and badges
  const currentCycleAmount = state.totalToday % CYCLE_MAX;
  const waterPercentage = (currentCycleAmount / CYCLE_MAX) * 100;
  
  const getBadgeActive = (index: number) => {
    if (index === 0) return state.totalToday >= 1000;
    if (index === 1) return state.totalToday >= 2000;
    if (index === 2) return state.totalToday >= 2500;
    return false;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-sky-100 to-white text-sky-900 font-sans selection:bg-sky-200 overflow-hidden flex flex-col items-center justify-between py-4 px-6">
      
      {/* Header - Minimal */}
      <header className="text-center pt-2">
        <h1 className="text-xl font-light tracking-widest mb-0.5">水神の雫</h1>
        <p className="text-sky-400 text-[9px] tracking-tighter uppercase">Pure Hydration</p>
      </header>

      {/* Stats - Compact */}
      <div className="w-full flex justify-around max-w-xs">
        <div className="text-center">
          <p className="text-[8px] uppercase tracking-widest text-sky-400 mb-0.5">Today</p>
          <p className="text-lg font-light">{state.totalToday}<span className="text-[9px] ml-0.5">ml</span></p>
        </div>
        <div className="text-center">
          <p className="text-[8px] uppercase tracking-widest text-sky-400 mb-0.5">Goal</p>
          <p className="text-lg font-light">{DAILY_GOAL}<span className="text-[9px] ml-0.5">ml</span></p>
        </div>
      </div>

      {/* Crystal Sphere */}
      <div className="relative w-56 h-56 group flex-shrink-0 my-2">
        <div className="absolute inset-0 rounded-full border border-white/40 shadow-[inset_0_0_25px_rgba(255,255,255,0.5),0_6px_15px_rgba(0,0,0,0.05)] backdrop-blur-[1px] z-10" />
        <div className="absolute inset-0 rounded-full overflow-hidden bg-white/10">
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-sky-400/30"
            initial={{ height: 0 }}
            animate={{ height: `${waterPercentage}%` }}
            transition={{ type: 'spring', stiffness: 40, damping: 15 }}
          >
            <div className="absolute -top-2 left-0 right-0 h-4 bg-sky-400/20 rounded-[100%] animate-wave" />
          </motion.div>
        </div>
        <div className="absolute top-5 left-5 w-8 h-8 bg-white/20 rounded-full blur-lg z-20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          <span className="text-2xl font-extralight tracking-tighter">{currentCycleAmount}</span>
          <span className="text-[8px] uppercase tracking-[0.2em] text-sky-500/60">ml / 1000</span>
        </div>
      </div>

      {/* Crescent Badges */}
      <div className="flex gap-4 h-6 items-center my-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative w-5 h-5">
            <div 
              className={`w-full h-full rounded-full transition-all duration-1000 ${
                getBadgeActive(i) 
                  ? 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' 
                  : 'bg-sky-200/20'
              }`}
              style={{
                boxShadow: getBadgeActive(i) ? 'inset -2px 0px 0px 0px rgba(0,0,0,0.1), 0 0 8px #fbbf24' : 'none',
                clipPath: 'circle(50% at 50% 50%)',
                maskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)',
                WebkitMaskImage: 'radial-gradient(circle at 70% 30%, transparent 45%, black 46%)'
              }}
            />
          </div>
        ))}
      </div>

      {/* Controls Section */}
      <div className="w-full max-w-xs flex flex-col gap-3 pb-10 z-[9999] relative" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={undoWater}
            disabled={state.history.length === 0}
            className={`p-3 rounded-full transition-all active:scale-95 relative z-[9999] ${
              state.history.length > 0 ? 'text-sky-500 hover:bg-sky-100' : 'text-sky-200'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <Undo className="w-6 h-6" />
          </button>

          <div className="flex bg-white/40 backdrop-blur-md rounded-full p-1 shadow-sm border border-white/50 flex-1 justify-center relative z-[9999]" style={{ pointerEvents: 'auto' }}>
            {(['water', 'tea', 'juice'] as DrinkType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDrinkType(type)}
                className={`px-3 py-1.5 rounded-full transition-all duration-300 text-[8px] tracking-widest ${
                  drinkType === type ? 'bg-white text-sky-600 shadow-sm' : 'text-sky-400'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-[9999]" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => addWater(250)}
            className="bg-white/60 active:bg-white active:scale-[0.98] py-3 rounded-xl border border-white/50 shadow-sm flex flex-col items-center justify-center gap-0.5 transition-transform"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-light">250<span className="text-[8px] ml-0.5">ml</span></span>
          </button>
          <button
            onClick={() => addWater(500)}
            className="bg-white/60 active:bg-white active:scale-[0.98] py-3 rounded-xl border border-white/50 shadow-sm flex flex-col items-center justify-center gap-0.5 transition-transform"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-light">500<span className="text-[8px] ml-0.5">ml</span></span>
          </button>
        </div>

        {/* Refined Reset Button - Subtle Design with Guaranteed Functionality */}
        <button 
          onClick={() => { 
            if (window.confirm('今日の記録をリセットして、0mlに戻しますか？')) {
              localStorage.clear(); 
              window.location.reload(); 
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-white/50 backdrop-blur-sm text-slate-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98] relative border border-white/40 shadow-sm"
          style={{ zIndex: 9999, pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[9px] tracking-[0.2em] uppercase font-light">Reset Daily Data</span>
        </button>
      </div>


      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0) scaleX(1); }
          50% { transform: translateY(-1px) scaleX(1.02); }
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}




