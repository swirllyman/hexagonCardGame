import React from 'react';
import type { PlayerState } from '../types/game';
import { getFacingAngle, normalizeFacing, DIRECTION_NAMES, DIRECTION_SHORT } from '../utils/hexGrid';
import { SafeImage } from './SafeImage';
import { Shield, Heart, Sword, Flame, Leaf, User, Navigation } from 'lucide-react';

interface UnitTokenProps {
  player: PlayerState;
  isCurrentActor?: boolean;
  isLocalPlayer?: boolean;
}

const FACTION_CRESTS = {
  crimson: { 
    bg: 'bg-gradient-to-b from-rose-600 to-rose-900', 
    border: 'border-amber-400', 
    glow: 'shadow-[0_0_18px_rgba(225,29,72,0.85)]', 
    ring: 'stroke-rose-500',
    avatarUrl: 'sprites/portrait_valerius.svg',
    icon: <Sword className="w-4 h-4 text-amber-300" /> 
  },
  azure: { 
    bg: 'bg-gradient-to-b from-sky-600 to-sky-900', 
    border: 'border-slate-300', 
    glow: 'shadow-[0_0_18px_rgba(14,165,233,0.85)]', 
    ring: 'stroke-sky-500',
    avatarUrl: 'sprites/portrait_kaelen.svg',
    icon: <Shield className="w-4 h-4 text-sky-200" /> 
  },
  emerald: { 
    bg: 'bg-gradient-to-b from-emerald-600 to-emerald-900', 
    border: 'border-amber-600', 
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.85)]', 
    ring: 'stroke-emerald-500',
    avatarUrl: 'sprites/portrait_seraphina.svg',
    icon: <Leaf className="w-4 h-4 text-emerald-300" /> 
  },
  amber: { 
    bg: 'bg-gradient-to-b from-amber-500 to-amber-800', 
    border: 'border-amber-300', 
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.85)]', 
    ring: 'stroke-amber-400',
    avatarUrl: 'sprites/portrait_ignis.svg',
    icon: <Flame className="w-4 h-4 text-amber-200" /> 
  },
};

export const UnitToken: React.FC<UnitTokenProps> = ({ player, isCurrentActor, isLocalPlayer }) => {
  const crest = FACTION_CRESTS[player.faction];
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const facingAngle = getFacingAngle(player.facing);
  const normalizedDir = normalizeFacing(player.facing);
  const dirName = DIRECTION_NAMES[normalizedDir];
  const dirShort = DIRECTION_SHORT[normalizedDir];

  const avatarSrc = player.avatarUrl || crest.avatarUrl;

  return (
    <div className={`relative flex flex-col items-center group transition-transform duration-300 ${isCurrentActor ? 'scale-115 z-30' : 'z-20'}`}>
      
      {/* YOU Floating Marker */}
      {isLocalPlayer && (
        <div className="absolute -top-7 z-40 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-[0_0_14px_rgba(34,211,238,0.9)] tracking-widest uppercase flex items-center gap-1 border border-cyan-200 animate-bounce">
          <User className="w-2.5 h-2.5 fill-slate-950" /> YOU
        </div>
      )}

      {/* Active turn golden rune aura */}
      {isCurrentActor && (
        <div className="absolute -inset-3 rounded-full border-2 border-amber-400/80 bg-amber-400/15 animate-ping pointer-events-none" />
      )}

      {/* Local Player Cyan Beacon Ring */}
      {isLocalPlayer && (
        <div className="absolute -inset-2.5 rounded-full border-2 border-cyan-400/90 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse pointer-events-none" />
      )}

      {/* Vector Hero Unit Emblem Container */}
      <div className="relative flex items-center justify-center">

        {/* Directional Vision Sector Arc & Pointer Indicator Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-500 ease-out z-10"
          style={{ transform: `rotate(${facingAngle}deg)` }}
        >
          {/* Flashlight Vision Sector Cone pointing East (Right / 0 deg) */}
          <div 
            className={`absolute left-1/2 top-1/2 -translate-y-1/2 w-20 h-14 blur-[0.5px] pointer-events-none origin-left ${
              isLocalPlayer
                ? 'bg-gradient-to-r from-cyan-400/60 via-cyan-300/30 to-transparent'
                : 'bg-gradient-to-r from-amber-400/40 via-amber-300/20 to-transparent'
            }`}
            style={{ clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)' }} 
          />

          {/* Direct Laser Sight Beam Line */}
          {isLocalPlayer && (
            <div className="absolute left-6 w-12 h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-300 to-transparent shadow-[0_0_8px_rgba(34,211,238,1)]" />
          )}

          {/* Sharp Chevron Pointer at Facing Hex */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
            <div className="relative flex items-center justify-center">
              {/* Laser Beacon Dot */}
              <div className={`absolute -right-1.5 w-3 h-3 rounded-full animate-ping opacity-90 ${
                isLocalPlayer ? 'bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,1)]' : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              }`} />

              {/* Diamond / Arrowhead */}
              <div className={`rotate-45 flex items-center justify-center transition-all ${
                isLocalPlayer
                  ? 'w-5 h-5 bg-gradient-to-br from-cyan-300 via-cyan-400 to-emerald-400 border-2 border-slate-950 shadow-[0_0_14px_rgba(34,211,238,1)] scale-110'
                  : 'w-4 h-4 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.95)]'
              }`}>
                <div className={`rounded-full ${isLocalPlayer ? 'w-2 h-2 bg-slate-950' : 'w-1.5 h-1.5 bg-slate-950'}`} />
              </div>

              {/* Direction Text Badge (counter-rotated so text stays upright) */}
              <div 
                className={`absolute -top-5 px-1.5 py-0.5 rounded text-[8px] font-mono font-black shadow-lg tracking-tighter whitespace-nowrap flex items-center gap-0.5 ${
                  isLocalPlayer
                    ? 'bg-slate-950 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)] ring-1 ring-cyan-200'
                    : 'bg-slate-950/95 border border-amber-400/90 text-amber-300'
                }`}
                style={{ transform: `rotate(-${facingAngle}deg)` }}
                title={`Facing: ${dirName}`}
              >
                {isLocalPlayer ? (
                  <>
                    <Navigation className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                    <span>FRONT ({dirShort})</span>
                  </>
                ) : (
                  <span>{dirShort}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Central Unit Token Circle */}
        <div
          className={`w-12 h-12 rounded-full border-2 ${crest.border} ${crest.bg} ${
            isLocalPlayer ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' : crest.glow
          } flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-2xl relative cursor-pointer transform hover:scale-110 transition-all z-20 overflow-hidden bg-slate-950`}
        >
          <SafeImage
            src={avatarSrc}
            alt={player.name}
            className="w-full h-full object-cover p-0.5 transition-transform duration-300 group-hover:scale-110"
            fallback={
              <div className="flex flex-col items-center justify-center">
                {crest.icon}
                <span className="text-[10px] font-mono tracking-tighter text-amber-200 uppercase mt-0.5">
                  {player.name.charAt(0)}
                </span>
              </div>
            }
          />

          {/* Active Buff Badges */}
          {player.buffs && player.buffs.length > 0 && (
            <div className="absolute -top-1 -left-1 flex gap-0.5 z-30">
              {player.buffs.map((buff) => (
                <div
                  key={buff.id}
                  className="bg-slate-950/95 border border-amber-400 text-white rounded-full p-0.5 text-[8px] flex items-center justify-center font-extrabold shadow-lg animate-pulse"
                  title={`${buff.name} (${buff.duration} turns)`}
                >
                  {buff.type === 'attackBoost' && <Flame className="w-2.5 h-2.5 text-amber-400" />}
                  {buff.type === 'healRegen' && <Heart className="w-2.5 h-2.5 text-emerald-400" />}
                  {buff.type === 'shield' && <Shield className="w-2.5 h-2.5 text-sky-400" />}
                </div>
              ))}
            </div>
          )}

          {/* Shield Protection Badge */}
          {player.shield > 0 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-b from-sky-500 to-sky-700 border border-sky-300 text-white rounded-full p-0.5 text-xs flex items-center justify-center font-extrabold shadow-lg z-30">
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
