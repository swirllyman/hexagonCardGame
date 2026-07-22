import React, { useEffect } from 'react';
import type { PlayerState, BattleLogEntry } from '../types/game';
import { TEAMS } from '../types/game';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Swords } from 'lucide-react';

interface GameOverModalProps {
  winner: PlayerState | null;
  players: PlayerState[];
  round: number;
  battleLog: BattleLogEntry[];
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  round,
  battleLog,
  onRestart,
}) => {
  const winningTeamId = winner ? winner.teamId : null;
  const teamMembers = winningTeamId ? players.filter(p => p.teamId === winningTeamId) : [];

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
      <div className="w-full max-w-lg fantasy-sharp-panel gold-corners-bottom rounded-none p-6 shadow-2xl flex flex-col items-center gap-5 text-center animate-float border border-amber-500/50 bg-slate-950">
        {/* Winner Trophy Icon */}
        <div className="w-16 h-16 rounded-none bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <div>
          <h2 className="text-2xl font-black gold-gradient-text uppercase tracking-tight font-fantasy">
            {winningTeamId ? `Team ${winningTeamId} Victory!` : 'Match Complete'}
          </h2>
          <p className="text-xs text-amber-200/70 mt-1 font-mono">
            {winningTeamId
              ? `Team ${winningTeamId} (${teamMembers.map(m => m.name).join(', ')}) conquered the arena in Round ${round}.`
              : `The arena duel concluded in Round ${round}.`}
          </p>
        </div>

        {/* Player Stats Table */}
        <div className="w-full bg-slate-950/90 border border-slate-800 rounded-none p-3 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 text-left font-mono">
            Arena Combat Statistics
          </h4>
          {players.map((p) => {
            const teamConfig = TEAMS[p.teamId || 1] || TEAMS[1];
            const isWinnerMember = winningTeamId !== null && p.teamId === winningTeamId;

            return (
              <div key={p.id} className="flex items-center justify-between text-xs font-mono py-1 px-2.5 rounded-none bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-none border ${teamConfig.badgeClass}`}>
                    T{teamConfig.id}
                  </span>
                  <span className={isWinnerMember ? 'font-bold text-amber-300' : 'text-slate-300'}>
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
            );
          })}
        </div>

        {/* Final Timeline Chronology */}
        {battleLog && battleLog.length > 0 && (
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-none p-3 flex flex-col gap-1.5 max-h-48 overflow-y-auto shadow-inner">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1 text-left font-mono">
              Final Chronology (Recent Log)
            </h4>
            <div className="flex flex-col gap-1 text-left text-[10px] font-mono leading-normal">
              {battleLog.slice(0, 15).map((log) => {
                let colorClass = 'text-slate-400';
                if (log.type === 'elimination') colorClass = 'text-rose-500 font-extrabold';
                else if (log.type === 'attack') colorClass = 'text-rose-300';
                else if (log.type === 'rune') colorClass = 'text-emerald-400 font-semibold';
                else if (log.type === 'move') colorClass = 'text-emerald-300';
                else if (log.type === 'system') colorClass = 'text-amber-300';

                return (
                  <div key={log.id} className="py-0.5 border-b border-slate-900/50 flex gap-1 items-start">
                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                    <span className={colorClass}>{log.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Play Again CTA */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-none gold-btn uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all cursor-pointer font-extrabold"
        >
          <RotateCcw className="w-4 h-4" />
          Commence New Arena Match
        </button>
      </div>
    </div>
  );
};
