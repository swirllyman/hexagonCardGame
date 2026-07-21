import React, { useState, useRef } from 'react';
import type { Card } from '../types/game';
import { DEFAULT_MOVE_CARDS } from '../utils/cardsData';
import { CardTooltip } from './CardTooltip';
import { SafeImage } from './SafeImage';
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
  Compass,
  Sparkle
} from 'lucide-react';

interface CardHandProps {
  hand: Card[];
  programmedQueue: (Card | null)[];
  selectedCard: Card | null;
  isLocked: boolean;
  onSelectCard: (card: Card) => void;
  onDoubleClickCard?: (card: Card) => void;
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
  onDoubleClickCard,
}) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const lastClickRef = useRef<{ cardId: string; time: number } | null>(null);

  const handleCardClick = (card: Card, isQueued: boolean) => {
    if (isLocked || isQueued) return;
    const now = Date.now();
    if (
      lastClickRef.current &&
      lastClickRef.current.cardId === card.id &&
      now - lastClickRef.current.time < 350
    ) {
      lastClickRef.current = null;
      if (onDoubleClickCard) {
        onDoubleClickCard(card);
      }
    } else {
      lastClickRef.current = { cardId: card.id, time: now };
      onSelectCard(card);
    }
  };

  const renderCardItem = (card: Card, isMoveCard: boolean, index: number) => {
    const categoryStyle = CATEGORY_STYLES[card.category];
    const isQueued = !isMoveCard && programmedQueue.some(c => c?.id === card.id);
    const isSelected = selectedCard?.id === card.id || (isMoveCard && selectedCard?.type === card.type && !hand.some(hc => hc.id === selectedCard?.id));
    const isAnyHovered = hoveredCardId !== null;
    const isHovered = hoveredCardId === card.id;
    const facingBadge = getFacingBadgeText(card);

    let accordionClass = '';
    if (!isQueued) {
      if (isHovered) {
        accordionClass = 'mx-1 scale-105';
      } else if (isAnyHovered) {
        accordionClass = index > 0 ? '-ml-6' : '';
      } else {
        accordionClass = index > 0 ? '-ml-3' : '';
      }
    }

    return (
      <div
        key={card.id}
        onClick={() => handleCardClick(card, isQueued)}
        onMouseEnter={() => setHoveredCardId(card.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        className={`relative w-24 h-32 rounded-xl border-2 ${categoryStyle.bg} ${categoryStyle.border} p-1.5 flex flex-col justify-between cursor-pointer transform transition-all duration-200 select-none shadow-lg ${
          accordionClass
        } ${
          isHovered ? 'z-50 shadow-2xl' : 'z-10'
        } ${
          isQueued ? 'opacity-35 grayscale pointer-events-none scale-95' : ''
        } ${isSelected ? 'ring-2 ring-amber-400 -translate-y-2 shadow-[0_0_20px_rgba(245,158,11,0.7)]' : ''}`}
      >
        {/* Floating Full Detail Tooltip */}
        {isHovered && <CardTooltip card={card} position="top" />}

        {/* Card Category Header */}
        <div className="flex items-center justify-between gap-0.5 w-full overflow-hidden">
          <span className={`text-[6.5px] uppercase font-mono font-bold px-0.5 py-0.5 rounded border whitespace-nowrap shrink-0 leading-none ${categoryStyle.badge}`}>
            {isMoveCard ? 'Basic' : categoryStyle.label}
          </span>
          <span className="text-[6.5px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-0.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap shrink-0 leading-none shadow-inner">
            🎯 {card.range === 0 ? 'Self' : `R${card.range}`}
          </span>
        </div>

        {/* Central Card Graphic Icon / Sprite */}
        <div className="flex flex-col items-center my-0.5">
          <SafeImage
            src={card.spriteUrl}
            alt={card.name}
            className="w-5.5 h-5.5 object-contain rounded-lg shadow border border-amber-500/50 mb-0.5"
            fallback={
              <div className={`p-1 rounded-full bg-slate-950/90 border border-amber-600/40 ${categoryStyle.text} mb-0.5 shadow-inner`}>
                {renderCardIcon(card.iconName, 'w-3 h-3')}
              </div>
            }
          />
          <h4 className="text-[8.5px] font-extrabold text-slate-100 text-center leading-tight tracking-tight">{card.name}</h4>
        </div>

        {/* Card Facing / Attribute Badge */}
        <div className="flex items-center justify-center my-0.5">
          {facingBadge ? (
            <span className="inline-flex items-center gap-0.5 text-[7px] font-mono font-bold text-amber-300 bg-amber-950/90 px-1 py-0.5 rounded-full border border-amber-500/40 whitespace-nowrap shadow-inner">
              {facingBadge}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[7px] font-mono text-slate-400 bg-slate-900/60 px-1 py-0.5 rounded-full border border-slate-800 whitespace-nowrap">
              Standard
            </span>
          )}
        </div>

        {/* Card Stats Footer */}
        <div className="flex items-center justify-center gap-1 border-t border-slate-800/80 pt-0.5 font-mono">
          {isMoveCard ? (
            <span className="text-[7.5px] font-bold text-emerald-400 uppercase tracking-tight">
              ∞ Unlimited
            </span>
          ) : (
            <>
              {card.damage && (
                <span className="text-[8px] font-bold text-rose-400 flex items-center gap-0.5">
                  <Sword className="w-1.5 h-1.5" /> {card.damage}
                </span>
              )}
              {card.shield && (
                <span className="text-[8px] font-bold text-sky-400 flex items-center gap-0.5">
                  <ShieldIcon className="w-1.5 h-1.5" /> +{card.shield}
                </span>
              )}
              {card.healAmount && (
                <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <HeartPulse className="w-1.5 h-1.5" /> +{card.healAmount}
                </span>
              )}
              {!card.damage && !card.shield && !card.healAmount && (
                <span className="text-[7.5px] font-mono text-slate-400">Tactical</span>
              )}
            </>
          )}
        </div>

        {/* Slot Assigned Badge Overlay */}
        {isQueued && (
          <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center font-extrabold text-amber-400 text-[8.5px] uppercase tracking-wider">
            QUEUED
          </div>
        )}
      </div>
    );
  };

  const abilityHandCards = hand;

  return (
    <div className="w-full h-full flex items-center justify-between bg-slate-950/75 border border-amber-600/20 rounded-xl p-2.5 shadow-inner gap-4">
      {/* Move Cards Section (Left) */}
      <div className="flex flex-col items-center gap-1.5 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800/80 w-full pb-1 mb-0.5 justify-center">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Basic Movements</span>
        </div>
        <div className="flex items-center justify-center w-[320px]">
          {DEFAULT_MOVE_CARDS.map((card, index) => renderCardItem(card, true, index))}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden md:block w-px h-28 bg-slate-800/85 self-center" />

      {/* Ability Cards Section (Right) */}
      <div className="flex flex-col items-center gap-1.5 flex-[1.4]">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800/80 w-full pb-1 mb-0.5 justify-center">
          <Sparkle className="w-3.5 h-3.5 text-amber-400" />
          <span>Tactical Maneuvers</span>
          <span className="text-[7.5px] font-mono bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full leading-none">
            {abilityHandCards.length} Cards
          </span>
        </div>
        <div className="flex items-center justify-center w-[380px]">
          {abilityHandCards.map((card, index) => renderCardItem(card, false, index))}
        </div>
      </div>
    </div>
  );
};

