import React, { useState } from 'react';
import type { PlayerState } from '../types/game';
import { CardTooltip } from './CardTooltip';
import { SafeImage } from './SafeImage';
import { Heart, Shield, Crown, Bot, User, Skull, Flame } from 'lucide-react';

interface PlayerStatusPanelProps {
  players: PlayerState[];
  priorityPlayerIdx: number;
  currentSlotIndex: number;
  gamePhase: string;
  localPlayerId?: string;
  vertical?: boolean;
}

const FACTION_THEMES = {
  crimson: { bg: 'bg-slate-950/90', border: 'border-rose-600/50', badge: 'bg-rose-600', text: 'text-rose-400', banner: 'from-rose-950/60 to-slate-950', avatarUrl: 'sprites/avatar_crimson.svg' },
  azure: { bg: 'bg-slate-950/90', border: 'border-sky-600/50', badge: 'bg-sky-600', text: 'text-sky-400', banner: 'from-sky-950/60 to-slate-950', avatarUrl: 'sprites/avatar_azure.svg' },
  emerald: { bg: 'bg-slate-950/90', border: 'border-emerald-600/50', badge: 'bg-emerald-600', text: 'text-emerald-400', banner: 'from-emerald-950/60 to-slate-950', avatarUrl: 'sprites/avatar_emerald.svg' },
  amber: { bg: 'bg-slate-950/90', border: 'border-amber-600/50', badge: 'bg-amber-600', text: 'text-amber-400', banner: 'from-amber-950/60 to-slate-950', avatarUrl: 'sprites/avatar_amber.svg' },
};

export const PlayerStatusPanel: React.FC<PlayerStatusPanelProps> = ({
  players,
  priorityPlayerIdx,
  currentSlotIndex,
  gamePhase,
  localPlayerId,
  vertical = false,
}) => {
  const [hoveredBadge, setHoveredBadge] = useState<{ playerId: string; slotIdx: number } | null>(null);

  return (
    <div className={`w-full ${
      vertical
        ? 'flex flex-col gap-2 pt-5 pb-0.5 px-0.5'
        : 'grid grid-cols-2 md:grid-cols-4 gap-2 max-w-5xl pt-3 pb-0.5 px-1'
    }`}>
      {players.map((player, idx) => {
        const theme = FACTION_THEMES[player.faction];
        const isPriority = priorityPlayerIdx === idx;
        const isLocalPlayer = localPlayerId === player.id;
        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));

        const cardQueue = player.programmedQueue.map((card, slotIdx) => {
          const isActiveSlot = gamePhase === 'resolving' && currentSlotIndex === slotIdx;
          const isHovered = hoveredBadge?.playerId === player.id && hoveredBadge?.slotIdx === slotIdx;
          const hasHover = hoveredBadge?.playerId === player.id;
          const queueLen = player.programmedQueue.filter(Boolean).length;
          const badgeSizeClass = vertical
            ? 'w-5 h-5'
            : (queueLen > 6 ? 'w-5 h-7' : queueLen > 4 ? 'w-6 h-8' : 'w-7 h-9');

          const verticalStackClass = vertical
            ? slotIdx > 0
              ? isHovered
                ? 'mt-1'
                : hasHover
                ? '-mt-3'
                : '-mt-2'
              : ''
            : '';

          return (
            <div
              key={slotIdx}
              onMouseEnter={() => setHoveredBadge({ playerId: player.id, slotIdx })}
              onMouseLeave={() => setHoveredBadge(null)}
              style={{ zIndex: isHovered ? 50 : isActiveSlot ? 40 : slotIdx + 1 }}
              className={`relative ${badgeSizeClass} ${verticalStackClass} rounded-md border flex items-center justify-center text-[8.5px] font-bold font-mono transition-all duration-150 cursor-pointer shrink-0 shadow-md ${
                isHovered
                  ? vertical
                    ? 'scale-125 shadow-xl shadow-amber-500/30 border-amber-400 bg-slate-800 text-slate-100 ring-1 ring-amber-300 z-50'
                    : 'scale-125 -translate-y-2 shadow-xl shadow-amber-500/30 border-amber-400 bg-slate-800 text-slate-100 ring-1 ring-amber-300'
                  : isActiveSlot
                  ? 'border-amber-400 bg-amber-500/30 text-amber-300 animate-pulse scale-110 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : card
                  ? 'border-amber-600/50 bg-gradient-to-b from-slate-800 to-slate-900 text-slate-200 hover:border-amber-400'
                  : 'border-slate-800/80 bg-slate-950/80 text-slate-700'
              }`}
            >
              {isHovered && card && <CardTooltip card={card} position={vertical ? 'left' : 'bottom'} />}
              <span className="absolute top-0.5 left-0.5 text-[6px] font-mono leading-none text-slate-500 opacity-70">
                {slotIdx + 1}
              </span>
              {card ? (
                <SafeImage
                  src={card.spriteUrl}
                  alt={card.name}
                  className={`${vertical ? 'w-2.5 h-2.5' : queueLen > 6 ? 'w-3 h-3' : 'w-3.5 h-3.5'} object-contain rounded ${vertical ? '' : 'mt-1'}`}
                  fallback={<span className={`text-[7px] font-bold text-amber-400 ${vertical ? '' : 'mt-1'}`}>{card.name.charAt(0)}</span>}
                />
              ) : (
                <span className={`text-slate-600 text-[7px] ${vertical ? '' : 'mt-1'}`}>-</span>
              )}
            </div>
          );
        });

        return (
          <div
            key={player.id}
            className={vertical ? 'flex gap-1 items-start' : ''}
          >
            {/* Player Card */}
            <div
              className={`relative rounded-2xl border p-1.5 flex flex-col backdrop-blur-md transition-all duration-300 ${
                vertical ? 'flex-1 min-w-0' : 'w-full'
              } ${
                player.isEliminated
                  ? 'bg-slate-950/90 border-slate-800/50 opacity-40 grayscale'
                  : isLocalPlayer
                  ? `bg-gradient-to-b ${theme.banner} ${theme.border} ring-2 ring-amber-400/50 shadow-2xl scale-[1.01]`
                  : `bg-gradient-to-b ${theme.banner} ${theme.border} shadow-xl hover:border-amber-500/50`
              }`}
            >
              {/* 1st Priority Crown Badge */}
              {isPriority && !player.isEliminated && (
                <div className="absolute -top-2.5 right-2 bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-300 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider z-20">
                  <Crown className="w-3 h-3 fill-slate-950" /> 1st Priority
                </div>
              )}

              {/* Header: Player Name & Avatar Icon */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1 min-w-0">
                  <SafeImage
                    src={player.avatarUrl || theme.avatarUrl}
                    alt={player.faction}
                    className="w-3.5 h-3.5 rounded-full object-cover shadow"
                    fallback={<div className={`w-2.5 h-2.5 rounded-full ${theme.badge} shadow`} />}
                  />
                  <span className="font-extrabold text-[11px] text-slate-100 truncate tracking-tight">{player.name}</span>
                  {isLocalPlayer && (
                    <span className="text-[7px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1 py-0 rounded">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-slate-400 flex items-center gap-0.5">
                  {!player.isAi && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {player.isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3 text-amber-400" />}
                </div>
              </div>

              {/* Health & Shield Gauge */}
              <div className="space-y-0">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="flex items-center gap-0.5 text-slate-300">
                    <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" /> HP
                  </span>
                  <span className="font-bold text-slate-200">
                    {player.hp}/{player.maxHp}
                  </span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800 h-1.5 rounded-full overflow-hidden p-px shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hpPercent > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpPercent > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>

                {/* Shield Status */}
                {player.shield > 0 && (
                  <div className="flex items-center justify-between text-[8px] font-mono text-sky-300">
                    <span className="flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5 text-sky-400" /> Shield
                    </span>
                    <span className="font-bold">+{player.shield}</span>
                  </div>
                )}

                {/* Active Player Buff Chips */}
                {player.buffs && player.buffs.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {player.buffs.map((buff) => (
                      <div
                        key={buff.id}
                        className="flex items-center gap-0.5 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[7px] font-mono px-1 py-px rounded"
                      >
                        {buff.type === 'attackBoost' && <Flame className="w-2 h-2 text-amber-400" />}
                        {buff.type === 'healRegen' && <Heart className="w-2 h-2 text-emerald-400" />}
                        {buff.type === 'shield' && <Shield className="w-2 h-2 text-sky-400" />}
                        <span>{buff.name} ({buff.duration}t)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Horizontal Card Queue (bottom, non-vertical mode only) */}
              {!vertical && (
                <div className="border-t border-slate-800/80 pt-1.5 mt-0.5 flex items-center justify-center w-full overflow-visible min-h-[36px]">
                  <div className="flex items-center justify-center flex-nowrap py-1">
                    {cardQueue}
                  </div>
                </div>
              )}

              {/* Dead Banner Overlay */}
              {player.isEliminated && (
                <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex flex-col items-center justify-center text-rose-500 font-extrabold text-xs uppercase tracking-widest gap-1 border border-rose-900/50">
                  <Skull className="w-5 h-5" /> ELIMINATED
                </div>
              )}
            </div>

            {/* Vertical Card Queue (right side, vertical mode only) */}
            {vertical && (
              <div className="flex-shrink-0 flex flex-col items-center py-1">
                {cardQueue}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
