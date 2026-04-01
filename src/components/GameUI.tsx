import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Play } from 'lucide-react';

export function MainMenu({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-6">
          <Rocket className="w-16 h-16 text-[#00ffcc] animate-pulse" />
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter mb-2">AETHER STRIKE</h1>
        <p className="text-zinc-500 mb-12 uppercase tracking-widest text-sm">Deep Space Defense Protocol</p>
        
        <button 
          onClick={onStart}
          className="group relative px-12 py-4 bg-[#00ffcc] text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            INITIATE MISSION
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
        </button>

        <div className="mt-12 grid grid-cols-3 gap-8 text-zinc-500 text-xs font-mono uppercase">
          <div>[WASD] Move</div>
          <div>[SPACE] Fire</div>
          <div>[ESC] Pause</div>
        </div>
      </motion.div>
    </div>
  );
}

export function HUD({ score }: { score: number }) {
  return (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-xl">
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">Score</p>
        <p className="text-2xl font-bold text-[#00ffcc] tabular-nums">{score.toString().padStart(6, '0')}</p>
      </div>
    </div>
  );
}

export function GameOver({ score, onRestart }: { score: number; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-xl z-30">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center bg-black p-12 rounded-3xl border border-red-500/30 shadow-2xl shadow-red-500/10"
      >
        <h2 className="text-5xl font-black text-white mb-2">MISSION FAILED</h2>
        <p className="text-red-500 font-mono mb-8 uppercase">Hull Integrity Compromised</p>
        
        <div className="mb-12">
          <p className="text-zinc-500 text-sm uppercase mb-1">Final Score</p>
          <p className="text-6xl font-bold text-white">{score}</p>
        </div>

        <button 
          onClick={onRestart}
          className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all"
        >
          RETRY MISSION
        </button>
      </motion.div>
    </div>
  );
}
