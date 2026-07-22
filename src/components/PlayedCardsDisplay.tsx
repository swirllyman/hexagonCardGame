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
  Clock
} from 'lucide-react';

interface PlayedCardsDisplayProps {
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
  previousPlayedCard,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const card = previousPlayedCard?.card || null;
  const player = previousPlayedCard?.player || null;
  const categoryStyle = card ? CATEGORY_STYLES[card.category] : null;
  const facingBadge = card ? getFacingBadgeText(card) : null;

  return (
    <div className="flex flex-col items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-2 rounded-none backdrop-blur-md shadow-2xl">
      <div 
        className="relative flex flex-col items-center gap-1.5 group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Full Detailed Tooltip on Hover */}
        {isHovered && card && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[250] pointer-events-none drop-shadow-2xl animate-fade-in">
            <CardTooltip card={card} />
          </div>
        )}

        {/* Card Box Slot: Red outline for Last Turn */}
        <div className={`relative w-24 h-32 sm:w-28 sm:h-36 fantasy-sharp-panel gold-corners-bottom p-1.5 flex flex-col justify-between transition-all duration-200 border-red-500 border-2 shadow-[0_0_18px_rgba(239,68,68,0.5)] ${
          card ? (categoryStyle?.bg || 'bg-slate-950') : 'bg-slate-950/90'
        }`}>
          {/* Header Label: LAST TURN */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-0.5 mb-0.5">
            <span className="text-[7.5px] sm:text-[8.5px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 px-1 py-0.2 bg-red-500/20 text-red-300 border border-red-400/80">
              <Clock className="w-2.5 h-2.5 text-red-400" />
              LAST TURN
            </span>
            {previousPlayedCard && (
              <span className="text-[7px] font-mono text-slate-400">
                Turn #{previousPlayedCard.stepNumber}
              </span>
            )}
          </div>

          {/* Card Content / Graphic */}
          {card ? (
            <>
              {/* Category Badge & Icon */}
              <div className="flex items-center justify-between">
                <span className={`text-[7px] font-mono font-bold px-1 py-0.2 rounded-none border ${categoryStyle?.badge}`}>
                  {categoryStyle?.label}
                </span>
                <div className={`p-0.5 rounded-none border border-slate-700/60 bg-slate-900/80 ${categoryStyle?.text}`}>
                  {renderCardIcon(card.iconName, 'w-3 h-3')}
                </div>
              </div>

              {/* Card Sprite / Title */}
              <div className="flex flex-col items-center justify-center gap-0.5 my-auto">
                <SafeImage
                  src={card.spriteUrl}
                  alt={card.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-none shadow border border-amber-500/40"
                  fallback={
                    <div className={`p-1 rounded-none bg-slate-900 border border-slate-700 ${categoryStyle?.text}`}>
                      {renderCardIcon(card.iconName, 'w-4 h-4')}
                    </div>
                  }
                />
                <span className="text-[8.5px] sm:text-[9.5px] font-extrabold text-slate-100 text-center leading-tight tracking-tight truncate max-w-full">
                  {card.name}
                </span>

                {facingBadge && (
                  <span className="text-[6.5px] font-mono font-bold text-amber-300 bg-slate-900/90 px-1 py-0.2 border border-amber-500/40">
                    {facingBadge}
                  </span>
                )}
              </div>

              {/* Range & Stat Row */}
              <div className="border-t border-slate-800/80 pt-0.5 flex items-center justify-between font-mono text-[7px]">
                <span className="text-slate-400">
                  🎯 {card.range === 0 ? 'Self' : `R${card.range}`}
                </span>
                {card.damage ? (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <Sword className="w-1.5 h-1.5" /> {card.damage}
                  </span>
                ) : card.healAmount ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
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
                No Action Yet
              </span>
            </div>
          )}
        </div>

        {/* Text Box Underneath: Displaying Who Played Which Card */}
        <div className="w-24 sm:w-28 bg-slate-950/95 border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded-none px-1.5 py-1 text-center flex flex-col items-center justify-center gap-0.5 min-h-[36px]">
          {player ? (
            <>
              <div className="flex items-center justify-center gap-1 max-w-full overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400" />
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
              No card played
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
