import React, { useState } from 'react';
import type { Card } from '../types/game';
import { CardTooltip } from './CardTooltip';
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
  Info 
} from 'lucide-react';

interface CardHandProps {
  hand: Card[];
  programmedQueue: (Card | null)[];
  selectedCard: Card | null;
  isLocked: boolean;
  onSelectCard: (card: Card) => void;
}

const CATEGORY_STYLES = {
  movement: { bg: 'bg-gradient-to-b from-emerald-950/90 to-slate-950', border: 'border-emerald-500/70', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Agility' },
  attack: { bg: 'bg-gradient-to-b from-rose-950/90 to-slate-950', border: 'border-rose-500/70', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', label: 'Martial' },
  defense: { bg: 'bg-gradient-to-b from-sky-950/90 to-slate-950', border: 'border-sky-500/70', text: 'text-sky-300', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40', label: 'Warding' },
  utility: { bg: 'bg-gradient-to-b from-amber-950/90 to-slate-950', border: 'border-amber-500/70', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'Sorcery' },
};

function renderCardIcon(iconName: string, className: string = 'w-4 h-4') {
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

function getFacingBadgeText(card: Card): string | null {
  if (card.facingMoveType === 'forward') return '⬆️ Ahead';
  if (card.facingMoveType === 'sprint') return '⏩ Sprint';
  if (card.facingMoveType === 'sidestep_right' || card.facingMoveType === 'sidestep_left') return '↔️ Strafe';
  if (card.facingMoveType === 'pivot_left') return '↺ Turn L';
  if (card.facingMoveType === 'pivot_right') return '↻ Turn R';
  if (card.facingMoveType === 'backstep') return '⬇️ Retreat';
  if (card.facingAttackType === 'frontal') return '🎯 Frontal';
  if (card.facingAttackType === 'line') return '⚡ Line';
  if (card.facingAttackType === 'aoe') return '💥 360°';
  return null;
}

export const CardHand: React.FC<CardHandProps> = ({
  hand,
  programmedQueue,
  selectedCard,
  isLocked,
  onSelectCard,
}) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex items-center justify-center gap-2 flex-nowrap">
        {hand.map((card) => {
          const categoryStyle = CATEGORY_STYLES[card.category];
          const isQueued = programmedQueue.some(c => c?.id === card.id);
          const isSelected = selectedCard?.id === card.id;
          const isHovered = hoveredCardId === card.id;
          const facingBadge = getFacingBadgeText(card);

          return (
            <div
              key={card.id}
              onClick={() => !isLocked && !isQueued && onSelectCard(card)}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              className={`relative w-28 h-36 rounded-xl border-2 ${categoryStyle.bg} ${categoryStyle.border} p-2 flex flex-col justify-between cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl transition-all duration-200 select-none shadow-lg ${
                isHovered ? 'z-50' : 'z-10'
              } ${
                isQueued ? 'opacity-35 grayscale pointer-events-none scale-95' : ''
              } ${isSelected ? 'ring-2 ring-amber-400 -translate-y-2 shadow-[0_0_20px_rgba(245,158,11,0.7)]' : ''}`}
            >
              {/* Floating Full Detail Tooltip */}
              {isHovered && <CardTooltip card={card} position="top" />}

              {/* Card Category Header */}
              <div className="flex items-center justify-between">
                <span className={`text-[8px] uppercase font-mono font-bold px-1 py-0.2 rounded border ${categoryStyle.badge}`}>
                  {categoryStyle.label}
                </span>
                {facingBadge ? (
                  <span className="text-[7.5px] font-mono font-bold text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
                    {facingBadge}
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-amber-200/80">R{card.range}</span>
                )}
              </div>

              {/* Central Card Graphic Icon / Sprite */}
              <div className="flex flex-col items-center my-0.5">
                {card.spriteUrl ? (
                  <img src={card.spriteUrl} alt={card.name} className="w-7 h-7 object-contain rounded-lg shadow border border-amber-500/50 mb-0.5" />
                ) : (
                  <div className={`p-1.5 rounded-full bg-slate-950/90 border border-amber-600/40 ${categoryStyle.text} mb-0.5 shadow-inner`}>
                    {renderCardIcon(card.iconName, 'w-4 h-4')}
                  </div>
                )}
                <h4 className="text-[10px] font-extrabold text-slate-100 text-center leading-tight tracking-tight">{card.name}</h4>
              </div>

              {/* Card Description */}
              <p className="text-[9px] text-slate-300 leading-none text-center line-clamp-2">
                {card.description}
              </p>

              {/* Card Stats Footer */}
              <div className="flex items-center justify-center gap-1 border-t border-slate-800/80 pt-1 font-mono">
                {card.damage && (
                  <span className="text-[9px] font-bold text-rose-400 flex items-center gap-0.5">
                    <Sword className="w-2 h-2" /> {card.damage}
                  </span>
                )}
                {card.shield && (
                  <span className="text-[9px] font-bold text-sky-400 flex items-center gap-0.5">
                    <ShieldIcon className="w-2 h-2" /> +{card.shield}
                  </span>
                )}
                {card.healAmount && (
                  <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <HeartPulse className="w-2 h-2" /> +{card.healAmount}
                  </span>
                )}
              </div>

              {/* Slot Assigned Badge Overlay */}
              {isQueued && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center font-extrabold text-amber-400 text-[10px] uppercase tracking-wider">
                  QUEUED
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
