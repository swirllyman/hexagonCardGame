import React from 'react';
import type { PlayedCardRecord, Card, CardAnimStage, PlayerState } from '../types/game';
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
  Sparkle
} from 'lucide-react';

interface CardAnimationOrchestratorProps {
  cardAnimStage: CardAnimStage;
  animatingRecord: PlayedCardRecord | null;
  players: PlayerState[];
  playSpeed: number;
}

const CATEGORY_STYLES = {
  movement: { bg: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950', border: 'border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400', label: 'Agility Action' },
  attack: { bg: 'bg-gradient-to-b from-rose-950 via-slate-950 to-slate-950', border: 'border-rose-500', text: 'text-rose-300', badge: 'bg-rose-500/30 text-rose-200 border-rose-400', label: 'Martial Action' },
  defense: { bg: 'bg-gradient-to-b from-sky-950 via-slate-950 to-slate-950', border: 'border-sky-500', text: 'text-sky-300', badge: 'bg-sky-500/30 text-sky-200 border-sky-400', label: 'Warding Action' },
  utility: { bg: 'bg-gradient-to-b from-amber-950 via-slate-950 to-slate-950', border: 'border-amber-500', text: 'text-amber-300', badge: 'bg-amber-500/30 text-amber-200 border-amber-400', label: 'Sorcery Action' },
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

export const CardAnimationOrchestrator: React.FC<CardAnimationOrchestratorProps> = ({
  cardAnimStage,
  animatingRecord,
  players,
  playSpeed,
}) => {
  if (!animatingRecord || cardAnimStage !== 'playing_turn') {
    return null;
  }

  const card = animatingRecord.card;
  const player = animatingRecord.player;
  const categoryStyle = card ? CATEGORY_STYLES[card.category] : null;
  const facingBadge = card ? getFacingBadgeText(card) : null;

  // Calculate player index in list to project pop-out origin from player's status bar slot on the left
  const playerIdx = Math.max(0, players.findIndex(p => p.id === player.id));
  const startY = -140 + playerIdx * 75; // Y offset from player status card slot
  const startX = -60;

  const speedMult = playSpeed === 1 ? 1.5 : playSpeed === 2 ? 0.75 : 0.375;
  const animDuration = `${1.2 * (speedMult / 1.5) * 1.5}s`;

  return (
    <div
      key={`${player.id}_${animatingRecord.slotIndex}_${animatingRecord.stepNumber}`}
      className="absolute z-[150] pointer-events-none flex flex-col items-center justify-center animate-pop-hold-glide-to-red"
      style={{
        left: '220px',
        top: '280px',
        '--start-x': `${startX}px`,
        '--start-y': `${startY}px`,
        '--anim-duration': animDuration,
      } as React.CSSProperties}
    >
      <div className={`relative w-48 h-68 fantasy-sharp-panel gold-corners-bottom border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.85),inset_0_0_20px_rgba(250,204,21,0.25)] p-3 flex flex-col justify-between ${
        card ? (categoryStyle?.bg || 'bg-slate-950') : 'bg-slate-950'
      } bg-slate-950`}>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/50 pb-1.5 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-yellow-300 flex items-center gap-1">
            <Sparkle className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
            EXECUTING ACTION
          </span>
          <span className="text-[9px] font-mono text-amber-200/80 font-bold bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2">
            Slot #{animatingRecord.slotIndex + 1}
          </span>
        </div>

        {/* Player Identity Badge */}
        <div className="flex items-center justify-center gap-2 bg-amber-950/90 border border-yellow-500/60 py-1.5 px-3 rounded-none mb-1.5 shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-xs font-black text-amber-100 uppercase tracking-wide">
            {player.name}
          </span>
        </div>

        {/* Central Graphic / Card Sprite */}
        {card ? (
          <div className="flex flex-col items-center justify-center gap-1.5 flex-1 my-1">
            <SafeImage
              src={card.spriteUrl}
              alt={card.name}
              className="w-12 h-12 object-contain rounded-none shadow-xl border-2 border-yellow-400"
              fallback={
                <div className={`p-2 rounded-none bg-slate-950 border border-amber-500/60 ${categoryStyle?.text} shadow-inner`}>
                  {renderCardIcon(card.iconName, 'w-8 h-8')}
                </div>
              }
            />
            <h3 className="text-base font-extrabold text-slate-100 text-center leading-tight tracking-tight drop-shadow-md">
              {card.name}
            </h3>
            {facingBadge && (
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 border border-amber-500/50">
                {facingBadge}
              </span>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
            <span className="text-2xl mb-1">🃏</span>
            <span className="text-xs font-mono font-bold text-amber-200/80">Passed (Empty Slot)</span>
          </div>
        )}

        {/* Footer Stats */}
        <div className="border-t border-amber-500/40 pt-1.5 flex items-center justify-between font-mono text-[9.5px]">
          <span className="text-amber-300 font-bold uppercase">
            {card ? categoryStyle?.label : 'Passive Round'}
          </span>
          {card && (
            <span className="text-amber-200">
              🎯 {card.range === 0 ? 'Self' : `R${card.range}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
