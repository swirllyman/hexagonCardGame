import React, { useEffect } from 'react';
import type { PlayerState } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Swords } from 'lucide-react';

interface GameOverModalProps {
  winner: PlayerState | null;
  players: PlayerState[];
  round: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  round,
  onRestart,
}) => {
  useEffect(() => {
    if (winner && !winner.isAi) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
      });
    }
  }, [winner]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg fantasy-panel rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center animate-float border border-amber-500/50">
        {/* Winner Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <div>
          <h2 className="text-2xl font-black gold-gradient-text uppercase tracking-tight">
            {winner ? `${winner.name} Victory!` : 'Match Complete'}
          </h2>
          <p className="text-xs text-amber-200/70 mt-1 font-mono">
            The arena duel concluded in Round {round}.
          </p>
        </div>

        {/* Player Stats Table */}
        <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 text-left font-mono">
            Arena Combat Statistics
          </h4>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs font-mono py-1 px-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${p.id === winner?.id ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                <span className={p.id === winner?.id ? 'font-bold text-amber-300' : 'text-slate-300'}>
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Swords className="w-3 h-3" /> {p.damageDealt} DMG
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Skull className="w-3 h-3" /> {p.kills} Kills
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Play Again CTA */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-2xl gold-btn uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Commence New Arena Match
        </button>
      </div>
    </div>
  );
};
