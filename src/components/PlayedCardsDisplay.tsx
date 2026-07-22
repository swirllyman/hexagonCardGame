import React, { useState } from 'react';
import type { PlayedCardRecord, Card } from '../types/game';
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
  Clock,
  Sparkle
} from 'lucide-react';

interface PlayedCardsDisplayProps {
  currentPlayedCard: PlayedCardRecord | null;
  previousPlayedCard: PlayedCardRecord | null;
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
  if (card.facingMoveType === 'about_face') return '🔄 180°';
  if (card.facingMoveType === 'backstep') return '⬇️ Retreat';
  if (card.facingAttackType === 'frontal') return '🎯 Frontal';
  if (card.facingAttackType === 'line') return '⚡ Line';
  if (card.facingAttackType === 'aoe') return '💥 360°';
  return null;
}

export const PlayedCardsDisplay: React.FC<PlayedCardsDisplayProps> = ({
  currentPlayedCard,
  previousPlayedCard,
}) => {
  const [hoveredCardType, setHoveredCardType] = useState<'previous' | 'current' | null>(null);

  const renderSingleCardSlot = (
    record: PlayedCardRecord | null,
    type: 'previous' | 'current'
  ) => {
    const isCurrent = type === 'current';
    const card = record?.card || null;
    const player = record?.player || null;
    const isHovered = hoveredCardType === type;

    // Color definitions for highlights
    // Red for Previous, Yellow for Current
    const borderColor = isCurrent 
      ? 'border-yellow-400 border-2 shadow-[0_0_20px_rgba(250,204,21,0.6)]' 
      : 'border-red-500 border-2 shadow-[0_0_20px_rgba(239,68,68,0.6)]';

    const headerBadge = isCurrent
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/80'
      : 'bg-red-500/20 text-red-300 border-red-400/80';

    const headerTitle = isCurrent ? '⚡ CURRENT CARD' : '⏪ LAST TURN';
    const headerIcon = isCurrent ? <Sparkle className="w-3 h-3 text-yellow-400 animate-pulse" /> : <Clock className="w-3 h-3 text-red-400" />;

    const categoryStyle = card ? CATEGORY_STYLES[card.category] : null;
    const facingBadge = card ? getFacingBadgeText(card) : null;

    return (
      <div className="flex flex-col items-center gap-1.5 min-w-0">
        {/* Top Header Tag */}
        <div className={`flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 border rounded-none shadow-md ${headerBadge}`}>
          {headerIcon}
          <span>{headerTitle}</span>
        </div>

        {/* Card Box Frame */}
        <div
          onMouseEnter={() => setHoveredCardType(type)}
          onMouseLeave={() => setHoveredCardType(null)}
          className={`relative w-20 sm:w-22 h-28 sm:h-30 rounded-none p-1.5 flex flex-col justify-between select-none cursor-pointer transition-all duration-200 ${borderColor} ${
            card ? (categoryStyle?.bg || 'bg-slate-950') : 'bg-slate-950/80 border-dashed opacity-60'
          } ${isHovered ? 'scale-105 z-50 shadow-2xl' : 'z-10'}`}
        >
          {/* Full Detail Hover Tooltip */}
          {isHovered && card && <CardTooltip card={card} position="top" />}

          {card ? (
            <>
              {/* Card Category Header */}
              <div className="flex items-center justify-between gap-0.5 w-full overflow-hidden">
                <span className={`text-[6px] uppercase font-mono font-bold px-0.5 py-0.5 rounded-none border whitespace-nowrap shrink-0 leading-none ${categoryStyle?.badge}`}>
                  {categoryStyle?.label}
                </span>
                <span className="text-[6px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-0.5 py-0.5 rounded-none flex items-center gap-0.5 whitespace-nowrap shrink-0 leading-none shadow-inner">
                  🎯 {card.range === 0 ? 'Self' : `R${card.range}`}
                </span>
              </div>

              {/* Central Card Graphic Icon / Sprite */}
              <div className="flex flex-col items-center my-0.5">
                <SafeImage
                  src={card.spriteUrl}
                  alt={card.name}
                  className="w-5 h-5 object-contain rounded-none shadow border border-amber-500/50 mb-0.5"
                  fallback={
                    <div className={`p-1 rounded-none bg-slate-950/90 border border-amber-600/40 ${categoryStyle?.text} mb-0.5 shadow-inner`}>
                      {renderCardIcon(card.iconName, 'w-2.5 h-2.5')}
                    </div>
                  }
                />
                <h4 className="text-[8px] font-extrabold text-slate-100 text-center leading-tight tracking-tight">{card.name}</h4>
              </div>

              {/* Card Facing Badge */}
              <div className="flex items-center justify-center my-0.5">
                {facingBadge ? (
                  <span className="inline-flex items-center gap-0.5 text-[6.5px] font-mono font-bold text-amber-300 bg-amber-950/90 px-1 py-0.2 rounded-none border border-amber-500/40 whitespace-nowrap shadow-inner">
                    {facingBadge}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[6.5px] font-mono text-slate-400 bg-slate-900/60 px-1 py-0.2 rounded-none border border-slate-800 whitespace-nowrap">
                    Standard
                  </span>
                )}
              </div>

              {/* Card Stats Footer */}
              <div className="flex items-center justify-center gap-1 border-t border-slate-800/80 pt-0.5 font-mono">
                {card.damage ? (
                  <span className="text-[7.5px] font-bold text-rose-400 flex items-center gap-0.5">
                    <Sword className="w-1.5 h-1.5" /> {card.damage}
                  </span>
                ) : card.shield ? (
                  <span className="text-[7.5px] font-bold text-sky-400 flex items-center gap-0.5">
                    <ShieldIcon className="w-1.5 h-1.5" /> +{card.shield}
                  </span>
                ) : card.healAmount ? (
                  <span className="text-[7.5px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <HeartPulse className="w-1.5 h-1.5" /> +{card.healAmount}
                  </span>
                ) : (
                  <span className="text-[7px] font-mono text-slate-400">Tactical</span>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-1 gap-1">
              <span className="text-slate-500 text-xs">🃏</span>
              <span className="text-[7.5px] font-mono text-slate-400 leading-tight">
                {isCurrent ? 'Awaiting Action...' : 'No Action Yet'}
              </span>
            </div>
          )}
        </div>

        {/* Text Box Underneath: Displaying Who Played Which Card */}
        <div className={`w-24 sm:w-28 bg-slate-950/95 border ${
          isCurrent ? 'border-yellow-500/60 shadow-[0_0_10px_rgba(250,204,21,0.2)]' : 'border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
        } rounded-none px-1.5 py-1 text-center flex flex-col items-center justify-center gap-0.5 min-h-[36px]`}>
          {player ? (
            <>
              <div className="flex items-center justify-center gap-1 max-w-full overflow-hidden">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-yellow-400 animate-ping' : 'bg-red-400'}`} />
                <span className="text-[8.5px] font-extrabold text-slate-100 truncate tracking-tight">
                  {player.name}
                </span>
              </div>
              <span className="text-[7.5px] font-mono text-amber-300/90 truncate max-w-full">
                {card ? card.name : 'Passed (Empty Slot)'}
              </span>
            </>
          ) : (
            <span className="text-[7.5px] font-mono text-slate-500 italic">
              {isCurrent ? 'Waiting for turn...' : 'No card played'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 border border-slate-800 p-2 rounded-none backdrop-blur-md shadow-2xl">
      {/* Left Slot: Previous Card (Red) */}
      {renderSingleCardSlot(previousPlayedCard, 'previous')}

      {/* Right Slot: Current Card (Yellow) */}
      {renderSingleCardSlot(currentPlayedCard, 'current')}
    </div>
  );
};
