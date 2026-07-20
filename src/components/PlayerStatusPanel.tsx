import React, { useState } from 'react';
import type { PlayerState } from '../types/game';
import { CardTooltip } from './CardTooltip';
import { Heart, Shield, Crown, Bot, User, Skull } from 'lucide-react';

interface PlayerStatusPanelProps {
  players: PlayerState[];
  priorityPlayerIdx: number;
  currentSlotIndex: number;
  gamePhase: string;
  localPlayerId?: string;
}

const FACTION_THEMES = {
  crimson: { bg: 'bg-slate-950/90', border: 'border-rose-600/50', badge: 'bg-rose-600', text: 'text-rose-400', banner: 'from-rose-950/60 to-slate-950' },
  azure: { bg: 'bg-slate-950/90', border: 'border-sky-600/50', badge: 'bg-sky-600', text: 'text-sky-400', banner: 'from-sky-950/60 to-slate-950' },
  emerald: { bg: 'bg-slate-950/90', border: 'border-emerald-600/50', badge: 'bg-emerald-600', text: 'text-emerald-400', banner: 'from-emerald-950/60 to-slate-950' },
  amber: { bg: 'bg-slate-950/90', border: 'border-amber-600/50', badge: 'bg-amber-600', text: 'text-amber-400', banner: 'from-amber-950/60 to-slate-950' },
};

export const PlayerStatusPanel: React.FC<PlayerStatusPanelProps> = ({
  players,
  priorityPlayerIdx,
  currentSlotIndex,
  gamePhase,
  localPlayerId,
}) => {
  const [hoveredBadge, setHoveredBadge] = useState<{ playerId: string; slotIdx: number } | null>(null);

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-5xl">
      {players.map((player, idx) => {
        const theme = FACTION_THEMES[player.faction];
        const isPriority = priorityPlayerIdx === idx;
        const isLocalPlayer = localPlayerId === player.id;
        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

        return (
          <div
            key={player.id}
            className={`relative rounded-2xl border p-2.5 flex flex-col justify-between backdrop-blur-md transition-all duration-300 ${
              player.isEliminated
                ? 'bg-slate-950/90 border-slate-800/50 opacity-40 grayscale'
                : isLocalPlayer
                ? `bg-gradient-to-b ${theme.banner} ${theme.border} ring-2 ring-amber-400/50 shadow-2xl scale-[1.01]`
                : `bg-gradient-to-b ${theme.banner} ${theme.border} shadow-xl hover:border-amber-500/50`
            }`}
          >
            {/* 1st Priority Crown Badge */}
            {isPriority && !player.isEliminated && (
              <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-300 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                <Crown className="w-3 h-3 fill-slate-950" /> 1st Priority
              </div>
            )}

            {/* Header: Player Name & Icon */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${theme.badge} shadow`} />
                <span className="font-extrabold text-xs text-slate-100 truncate tracking-tight">{player.name}</span>
                {isLocalPlayer && (
                  <span className="text-[8px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1 py-0.2 rounded">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-slate-400 flex items-center gap-1">
                {!player.isAi && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {player.isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
              </div>
            </div>

            {/* Health & Shield Gauge */}
            <div className="space-y-1 mb-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> HP
                </span>
                <span className="font-bold text-slate-200">
                  {player.hp}/{player.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-950 border border-slate-800 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    hpPercent > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpPercent > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* Shield Status */}
              {player.shield > 0 && (
                <div className="flex items-center justify-between text-[9px] font-mono text-sky-300 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-sky-400" /> Shield
                  </span>
                  <span className="font-bold">+{player.shield}</span>
                </div>
              )}
            </div>

            {/* Current Programmed Cards Preview Badges */}
            <div className="border-t border-slate-800/80 pt-1.5 mt-0.5 flex items-center justify-around">
              {[0, 1, 2].map((slotIdx) => {
                const card = player.programmedQueue[slotIdx];
                const isActiveSlot = gamePhase === 'resolving' && currentSlotIndex === slotIdx;
                const isHovered = hoveredBadge?.playerId === player.id && hoveredBadge?.slotIdx === slotIdx;

                return (
                  <div
                    key={slotIdx}
                    onMouseEnter={() => setHoveredBadge({ playerId: player.id, slotIdx })}
                    onMouseLeave={() => setHoveredBadge(null)}
                    className={`relative w-7 h-8 rounded-lg border flex items-center justify-center text-[9px] font-bold font-mono transition-all cursor-pointer ${
                      isHovered ? 'z-50' : 'z-10'
                    } ${
                      isActiveSlot
                        ? 'border-amber-400 bg-amber-500/25 text-amber-300 animate-pulse scale-110 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                        : card
                        ? 'border-amber-600/40 bg-slate-900 text-slate-200 hover:border-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-700'
                    }`}
                  >
                    {isHovered && card && <CardTooltip card={card} position="bottom" />}
                    {card ? (
                      card.spriteUrl ? (
                        <img src={card.spriteUrl} alt={card.name} className="w-5 h-5 object-contain rounded" />
                      ) : (
                        card.name.charAt(0)
                      )
                    ) : (
                      '-'
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dead Banner Overlay */}
            {player.isEliminated && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-rose-500 font-extrabold text-xs uppercase tracking-widest gap-1 border border-rose-900/50">
                <Skull className="w-5 h-5" /> ELIMINATED
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
