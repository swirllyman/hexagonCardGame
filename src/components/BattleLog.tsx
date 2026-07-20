import React from 'react';
import type { BattleLogEntry } from '../types/game';
import { Scroll, Shield, Sword, Footprints, Skull, Sparkles } from 'lucide-react';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  return (
    <div className="w-full h-full flex-1 fantasy-panel rounded-2xl p-3 shadow-xl flex flex-col backdrop-blur-md overflow-hidden border border-amber-600/30">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
          <Scroll className="w-3.5 h-3.5 text-amber-400" /> Chronicle Feed
        </h3>
        <span className="text-[10px] font-mono text-amber-200/60">{logs.length} Events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8 text-xs italic font-sans">
            Awaiting battle actions...
          </div>
        ) : (
          logs.map((log) => {
            let icon = <Sparkles className="w-3 h-3 text-slate-400 inline mr-1.5" />;
            let textColor = 'text-slate-300';

            if (log.type === 'move') {
              icon = <Footprints className="w-3 h-3 text-emerald-400 inline mr-1.5" />;
              textColor = 'text-emerald-300';
            } else if (log.type === 'attack') {
              icon = <Sword className="w-3 h-3 text-rose-400 inline mr-1.5" />;
              textColor = 'text-rose-300';
            } else if (log.type === 'defense') {
              icon = <Shield className="w-3 h-3 text-sky-400 inline mr-1.5" />;
              textColor = 'text-sky-300';
            } else if (log.type === 'elimination') {
              icon = <Skull className="w-3 h-3 text-rose-500 inline mr-1.5" />;
              textColor = 'text-rose-400 font-bold';
            } else if (log.type === 'rune') {
              icon = <Sparkles className="w-3 h-3 text-amber-400 inline mr-1.5" />;
              textColor = 'text-amber-300';
            }

            return (
              <div
                key={log.id}
                className="py-1 px-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start justify-between text-[11px] leading-tight"
              >
                <div className="flex items-center">
                  {icon}
                  <span className={textColor}>{log.text}</span>
                </div>
                <span className="text-[9px] text-amber-200/50 ml-2 whitespace-nowrap">
                  R{log.round} {log.slot ? `S${log.slot}` : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
