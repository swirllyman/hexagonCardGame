import React from 'react';
import type { Card } from '../types/game';
import { 
  Footprints, 
  Zap, 
  Move, 
  Sword, 
  Hammer, 
  Flame, 
  RotateCw, 
  Shield as ShieldIcon, 
  Wind, 
  Sparkles, 
  ShieldAlert, 
  HeartPulse, 
  Info,
  Target
} from 'lucide-react';

interface CardTooltipProps {
  card: Card;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const CATEGORY_STYLES = {
  movement: { bg: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950', border: 'border-emerald-500/80', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', label: 'Agility Action' },
  attack: { bg: 'bg-gradient-to-b from-rose-950 via-slate-950 to-slate-950', border: 'border-rose-500/80', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/50', label: 'Martial Action' },
  defense: { bg: 'bg-gradient-to-b from-sky-950 via-slate-950 to-slate-950', border: 'border-sky-500/80', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/50', label: 'Warding Action' },
  utility: { bg: 'bg-gradient-to-b from-amber-950 via-slate-950 to-slate-950', border: 'border-amber-500/80', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50', label: 'Sorcery Action' },
};

function renderCardIcon(iconName: string, className: string = 'w-6 h-6') {
  switch (iconName) {
    case 'Footprints': return <Footprints className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Move': return <Move className={className} />;
    case 'Sword': return <Sword className={className} />;
    case 'Hammer': return <Hammer className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'RotateCw': return <RotateCw className={className} />;
    case 'Shield': return <ShieldIcon className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    default: return <Info className={className} />;
  }
}

export const CardTooltip: React.FC<CardTooltipProps> = ({ card, position = 'top' }) => {
  const style = CATEGORY_STYLES[card.category];

  const posClasses = 
    position === 'top' ? 'bottom-full mb-3 left-1/2 -translate-x-1/2' :
    position === 'bottom' ? 'top-full mt-3 left-1/2 -translate-x-1/2' :
    position === 'left' ? 'right-full mr-3 top-1/2 -translate-y-1/2' :
    'left-full ml-3 top-1/2 -translate-y-1/2';

  return (
    <div className={`absolute ${posClasses} z-[100] w-64 ${style.bg} ${style.border} border-2 rounded-2xl p-3.5 shadow-[0_0_35px_rgba(0,0,0,0.95)] backdrop-blur-xl pointer-events-none animate-float transition-all`}>
      {/* Header Badge & Range */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.badge}`}>
          {style.label}
        </span>
        <div className="flex items-center gap-1 text-xs font-mono text-amber-200/90">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>{card.range === 0 ? 'Self' : `${card.range} Hexes`}</span>
        </div>
      </div>

      {/* Title & Large Icon / Sprite */}
      <div className="flex items-center gap-3 mb-2.5">
        {card.spriteUrl ? (
          <img src={card.spriteUrl} alt={card.name} className="w-10 h-10 object-contain rounded-xl border border-amber-500/60 shadow-lg" />
        ) : (
          <div className={`p-2 rounded-xl bg-slate-950 border border-amber-600/40 ${style.text} shadow-inner`}>
            {renderCardIcon(card.iconName, 'w-6 h-6')}
          </div>
        )}
        <div>
          <h4 className="text-sm font-extrabold text-slate-100 tracking-tight leading-snug">{card.name}</h4>
          <span className="text-[10px] text-amber-200/60 font-mono">Tactical Deck</span>
        </div>
      </div>

      {/* Complete Description */}
      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 border border-slate-800 rounded-xl p-2 mb-2.5">
        {card.description}
      </p>

      {/* Detailed Stats Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-800/80 pt-2">
        {card.damage !== undefined && (
          <div className="flex items-center justify-between bg-rose-950/50 border border-rose-800/60 px-2 py-1 rounded-lg text-rose-300">
            <span className="flex items-center gap-1 text-[10px]">
              <Sword className="w-3 h-3 text-rose-400" /> Damage
            </span>
            <span className="font-bold">{card.damage}</span>
          </div>
        )}

        {card.shield !== undefined && (
          <div className="flex items-center justify-between bg-sky-950/50 border border-sky-800/60 px-2 py-1 rounded-lg text-sky-300">
            <span className="flex items-center gap-1 text-[10px]">
              <ShieldIcon className="w-3 h-3 text-sky-400" /> Shield
            </span>
            <span className="font-bold">+{card.shield}</span>
          </div>
        )}

        {card.healAmount !== undefined && (
          <div className="flex items-center justify-between bg-emerald-950/50 border border-emerald-800/60 px-2 py-1 rounded-lg text-emerald-300">
            <span className="flex items-center gap-1 text-[10px]">
              <HeartPulse className="w-3 h-3 text-emerald-400" /> Heal
            </span>
            <span className="font-bold">+{card.healAmount}</span>
          </div>
        )}

        {card.pushDist !== undefined && (
          <div className="flex items-center justify-between bg-amber-950/50 border border-amber-800/60 px-2 py-1 rounded-lg text-amber-300">
            <span className="flex items-center gap-1 text-[10px]">
              <Wind className="w-3 h-3 text-amber-400" /> Knockback
            </span>
            <span className="font-bold">{card.pushDist} Hex</span>
          </div>
        )}
      </div>

      {/* Decorative arrow pointer */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-b-2 border-r-2 border-slate-700 transform rotate-45 pointer-events-none" />
    </div>
  );
};
