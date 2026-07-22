import React from 'react';
import type { PlayerState, EmotePayload } from '../types/game';
import { TEAMS } from '../types/game';
import { getFacingAngle, normalizeFacing, DIRECTION_NAMES } from '../utils/hexGrid';
import { SafeImage } from './SafeImage';
import { Shield, Heart, Sword, Flame, Leaf, Navigation, Swords, MessageSquare, Skull, Laugh, Target, ShieldAlert } from 'lucide-react';

interface UnitTokenProps {
  player: PlayerState;
  isCurrentActor?: boolean;
  isLocalPlayer?: boolean;
  activeEmote?: EmotePayload;
}

const FACTION_CRESTS = {
  crimson: { 
    bg: 'bg-gradient-to-b from-rose-600 to-rose-900', 
    border: 'border-amber-400', 
    glow: 'shadow-[0_0_18px_rgba(225,29,72,0.85)]', 
    ring: 'stroke-rose-500',
    avatarUrl: 'sprites/unit_bladesman.jpg',
    standingSpriteUrl: 'sprites/sprite_bladesman_stand.jpg',
    icon: <Sword className="w-4 h-4 text-amber-300" /> 
  },
  azure: { 
    bg: 'bg-gradient-to-b from-sky-600 to-sky-900', 
    border: 'border-slate-300', 
    glow: 'shadow-[0_0_18px_rgba(14,165,233,0.85)]', 
    ring: 'stroke-sky-500',
    avatarUrl: 'sprites/unit_paladin.jpg',
    standingSpriteUrl: 'sprites/sprite_paladin_stand.jpg',
    icon: <Shield className="w-4 h-4 text-sky-200" /> 
  },
  emerald: { 
    bg: 'bg-gradient-to-b from-emerald-600 to-emerald-900', 
    border: 'border-amber-600', 
    glow: 'shadow-[0_0_18px_rgba(16,185,129,0.85)]', 
    ring: 'stroke-emerald-500',
    avatarUrl: 'sprites/unit_serpent_queen.jpg',
    standingSpriteUrl: 'sprites/sprite_naga_stand.jpg',
    icon: <Leaf className="w-4 h-4 text-emerald-300" /> 
  },
  amber: { 
    bg: 'bg-gradient-to-b from-amber-500 to-amber-800', 
    border: 'border-amber-300', 
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.85)]', 
    ring: 'stroke-amber-400',
    avatarUrl: 'sprites/unit_treant_golem.jpg',
    standingSpriteUrl: 'sprites/sprite_golem_stand.jpg',
    icon: <Flame className="w-4 h-4 text-amber-200" /> 
  },
};

export const UnitToken: React.FC<UnitTokenProps> = ({ player, isCurrentActor, isLocalPlayer, activeEmote }) => {
  const crest = FACTION_CRESTS[player.faction];
  const teamConfig = TEAMS[player.teamId || 1] || TEAMS[1];
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const shieldPercent = player.shield > 0 ? Math.max(0, Math.min(100, (player.shield / player.maxHp) * 100)) : 0;
  const isNotMovable = (player.buffs || []).some(b => b.type === 'unyielding' || (b.type as string) === 'rooted' || (b.type as string) === 'immobilized');
  const facingAngle = getFacingAngle(player.facing);
  const normalizedDir = normalizeFacing(player.facing);
  const dirName = DIRECTION_NAMES[normalizedDir];

  const avatarSrc = player.avatarUrl || crest.avatarUrl;
  const isEmoteActive = activeEmote && (Date.now() - activeEmote.timestamp < 4000);

  return (
    <div className={`relative flex flex-col items-center group transition-transform duration-300 ${isCurrentActor ? 'scale-115 z-30' : 'z-20'}`}>
      
      {/* Floating Tactical Emote Speech Bubble above unit */}
      {isEmoteActive && (
        <div className="absolute -top-16 z-50 flex flex-col items-center pointer-events-none animate-bounce">
          <div className="px-2.5 py-1 bg-slate-950/95 border-2 border-amber-400 text-amber-200 rounded-xl text-[11px] font-bold shadow-[0_0_18px_rgba(245,158,11,0.7)] flex items-center gap-1.5 backdrop-blur-md whitespace-nowrap">
            {activeEmote.emote === 'swords' && <Swords className="w-3.5 h-3.5 text-amber-400" />}
            {activeEmote.emote === 'shield' && <Shield className="w-3.5 h-3.5 text-sky-400" />}
            {activeEmote.emote === 'fire' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
            {activeEmote.emote === 'skull' && <Skull className="w-3.5 h-3.5 text-purple-400" />}
            {activeEmote.emote === 'laugh' && <Laugh className="w-3.5 h-3.5 text-emerald-400" />}
            {activeEmote.emote === 'target' && <Target className="w-3.5 h-3.5 text-rose-400" />}
            {activeEmote.emote === 'gg' && <MessageSquare className="w-3.5 h-3.5 text-amber-400" />}
            <span className="font-mono text-amber-300 font-extrabold">{activeEmote.text}</span>
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-400 -mt-0.5" />
        </div>
      )}

      {/* Floating Dark Fantasy HP & Status Bar above unit */}
      <div className="absolute -top-10 z-40 flex flex-col items-center pointer-events-none gap-0.5">
        {/* Team Badge */}
        <span className={`px-1.5 py-0.2 text-[8px] font-mono font-black uppercase rounded-none border shadow-md ${teamConfig.badgeClass}`}>
          T{teamConfig.id}
        </span>

        {/* Row containing Immovable Shield Icon and Unit HP Bar Container */}
        <div className="flex items-center gap-1">
          {/* Immovable Shield Icon anchored to the left of health bar */}
          {isNotMovable && (
            <div 
              className="z-50 bg-slate-950 border border-amber-400 text-amber-300 p-0.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse flex items-center justify-center shrink-0"
              title="Immovable / Cannot be moved"
            >
              <ShieldAlert className="w-3 h-3 text-amber-300 fill-amber-500/40" />
            </div>
          )}

          {/* Unit HP Bar Container */}
          <div className={`w-16 bg-slate-950/90 border rounded-sm h-3.5 overflow-hidden shadow-2xl relative flex items-center justify-center transition-all duration-300 ${
            player.shield > 0 
              ? 'border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.85)] ring-1 ring-sky-400/50' 
              : 'border-slate-900'
          }`}>
            {/* Fill level */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-800 via-rose-600 to-red-500 transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />

            {/* Blue Overshield Layer on active shield */}
            {player.shield > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-400/80 via-cyan-300/80 to-blue-500/80 backdrop-blur-[0.5px] border-r-2 border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse transition-all duration-300 z-10"
                style={{ width: `${Math.min(100, hpPercent + shieldPercent)}%`, opacity: 0.85 }}
              />
            )}

            {/* Numeric Health Text */}
            <span className="relative z-20 text-[9px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tight flex items-center gap-0.5">
              {player.hp}
              {player.shield > 0 && (
                <span className="text-sky-200 text-[8px] font-extrabold ml-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                  (+{player.shield})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>


      {/* Active turn golden rune aura */}
      {isCurrentActor && (
        <div className="absolute -inset-3 rounded-full border-2 border-amber-400/80 bg-amber-400/15 animate-ping pointer-events-none" />
      )}

      {/* Local Player Cyan Beacon Ring */}
      {isLocalPlayer && (
        <div className="absolute -inset-0.5 rounded-full border border-cyan-400/50 shadow-[0_0_6px_rgba(34,211,238,0.4)] pointer-events-none" />
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
                className="absolute -top-5 flex items-center justify-center"
                style={{ transform: `rotate(-${facingAngle}deg)` }}
                title={`Facing: ${dirName}`}
              >
                {isLocalPlayer ? (
                  <Navigation className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                ) : (
                  <Navigation className="w-3 h-3 text-amber-400 fill-amber-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ground Base Glow Ellipse */}
        <div className={`w-12 h-3 rounded-full blur-[1px] absolute -bottom-1 z-10 pointer-events-none ${
          isLocalPlayer ? 'bg-cyan-400/40 border border-cyan-300/80 shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 'bg-amber-500/30 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
        }`} />

        {/* Clean Vector Unit Emblem Token */}
        <div
          className={`w-11 h-11 rounded-full border-2 ${crest.border} ${crest.bg} ${
            isLocalPlayer ? 'ring-1 ring-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : crest.glow
          } flex items-center justify-center text-white font-extrabold text-xs shadow-2xl relative cursor-pointer transform hover:scale-110 transition-all duration-200 z-20 overflow-hidden bg-slate-950`}
        >
          {/* Active Status Aura Rings */}
          {player.buffs && player.buffs.length > 0 && (
            <div className="absolute inset-0 rounded-full pointer-events-none z-10 opacity-70">
              {player.buffs.some(b => b.type === 'attackBoost') && (
                <div className="absolute -inset-1 rounded-full border-2 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse" />
              )}
              {player.buffs.some(b => b.type === 'unyielding') && (
                <div className="absolute -inset-1.5 rounded-full border-2 border-amber-300 shadow-[0_0_14px_rgba(251,191,36,1)] animate-pulse" />
              )}
              {player.buffs.some(b => b.type === 'healRegen') && (
                <div className="absolute -inset-1 rounded-full border border-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-ping" />
              )}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
};
