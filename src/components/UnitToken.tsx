import React from 'react';
import type { PlayerState } from '../types/game';
import { getFacingAngle } from '../utils/hexGrid';
import { Shield, Heart, Sword, Flame, Leaf } from 'lucide-react';

interface UnitTokenProps {
  player: PlayerState;
  isCurrentActor?: boolean;
}

const FACTION_CRESTS = {
  crimson: { 
    bg: 'bg-gradient-to-b from-rose-600 to-rose-900', 
    border: 'border-amber-400', 
    glow: 'shadow-[0_0_18px_rgba(225,29,72,0.85)]', 
    ring: 'stroke-rose-500',
    icon: <Sword className="w-4 h-4 text-amber-300" /> 
  },
  azure: { 
    bg: 'bg-gradient-to-b from-sky-600 to-sky-900', 
    border: 'border-slate-300', 
    glow: 'shadow-[0_0_18px_rgba(14,165,233,0.85)]', 
    ring: 'stroke-sky-500',
    icon: <Shield className="w-4 h-4 text-sky-200" /> 
  },
  emerald: { 
    bg: 'bg-gradient-to-b from-emerald-600 to-emerald-900', 
    border: 'border-amber-600', 
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.85)]', 
    ring: 'stroke-emerald-500',
    icon: <Leaf className="w-4 h-4 text-emerald-300" /> 
  },
  amber: { 
    bg: 'bg-gradient-to-b from-amber-500 to-amber-800', 
    border: 'border-amber-300', 
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.85)]', 
    ring: 'stroke-amber-400',
    icon: <Flame className="w-4 h-4 text-amber-200" /> 
  },
};

export const UnitToken: React.FC<UnitTokenProps> = ({ player, isCurrentActor }) => {
  const crest = FACTION_CRESTS[player.faction];
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const facingAngle = getFacingAngle(player.facing);

  return (
    <div className={`relative flex flex-col items-center group transition-transform duration-300 ${isCurrentActor ? 'scale-115 z-30' : 'z-20'}`}>
      {/* Active turn golden rune aura */}
      {isCurrentActor && (
        <div className="absolute -inset-3 rounded-full border-2 border-amber-400/80 bg-amber-400/15 animate-ping pointer-events-none" />
      )}

      {/* Vector Fantasy Hero Unit Emblem Container */}
      <div className="relative flex items-center justify-center">

        {/* Directional Vision Arc & Pointer Indicator Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-out z-10"
          style={{ transform: `rotate(${facingAngle}deg)` }}
        >
          {/* Front Vision Sector Arc Glow */}
          <div className="absolute -top-3.5 w-10 h-10 border-t-2 border-amber-400/80 rounded-t-full bg-gradient-to-t from-transparent to-amber-400/20 blur-[1px]" />

          {/* Sharp Chevron Arrow Pointing to Facing Hex */}
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 translate-x-1 flex items-center justify-center rotate-90">
            <div className="w-3.5 h-3.5 bg-gradient-to-r from-amber-400 to-amber-300 border border-slate-900 rotate-45 shadow-[0_0_8px_rgba(251,191,36,0.9)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
            </div>
          </div>
        </div>

        {/* Central Unit Token Circle */}
        <div
          className={`w-12 h-12 rounded-full border-2 ${crest.border} ${crest.bg} ${crest.glow} flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-2xl relative cursor-pointer transform hover:scale-110 transition-all z-20`}
        >
          {/* Heraldic Faction Icon */}
          <div className="flex items-center justify-center">
            {crest.icon}
          </div>
          <span className="text-[10px] font-mono tracking-tighter text-amber-200 uppercase mt-0.5">
            {player.name.charAt(0)}
          </span>

          {/* Shield Protection Badge */}
          {player.shield > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-b from-sky-500 to-sky-700 border border-sky-300 text-white rounded-full p-0.5 text-xs flex items-center justify-center font-extrabold shadow-lg z-30">
              <Shield className="w-3 h-3 text-sky-200" />
              <span className="text-[9px] ml-0.5 font-mono">{player.shield}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Fantasy Health Bar Gauge */}
      <div className="mt-1 flex flex-col items-center w-16">
        <div className="w-full bg-slate-950 border border-slate-700/80 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : hpPercent > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-slate-200 mt-0.5">
          <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
          <span>{player.hp}</span>
        </div>
      </div>
    </div>
  );
};
