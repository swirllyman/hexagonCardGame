import React, { useState } from 'react';
import type { Card } from '../types/game';
import { CardTooltip } from './CardTooltip';
import { SafeImage } from './SafeImage';
import { Lock, X, Play, Sparkles } from 'lucide-react';

interface ActionQueueProps {
  programmedQueue: (Card | null)[];
  selectedCard: Card | null;
  isLocked: boolean;
  onAssignSlot: (slotIdx: number, card: Card) => void;
  onUnassignSlot: (slotIdx: number) => void;
  onLockIn: () => void;
}

export const ActionQueue: React.FC<ActionQueueProps> = ({
  programmedQueue,
  selectedCard,
  isLocked,
  onAssignSlot,
  onUnassignSlot,
  onLockIn,
}) => {
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);

  const slotCount = programmedQueue.length;
  const gridColsClass = slotCount === 3 ? 'grid-cols-3' : 'grid-cols-5';
  const slotHeightClass = slotCount > 5 ? 'h-16' : slotCount === 5 ? 'h-20' : 'h-24';
  const imageSizeClass = slotCount > 5 ? 'w-6 h-6' : slotCount === 5 ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11';

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-950/75 border border-amber-600/20 rounded-xl p-2.5 shadow-inner">
      <div className="flex flex-col gap-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-1">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Tactical Timeline
          </span>
          <span className="text-[8px] font-mono text-slate-500">
            {programmedQueue.filter(Boolean).length} / {slotCount} Slots
          </span>
        </div>

        {/* Dynamic Action Programmer Slots */}
        <div className={`grid ${gridColsClass} gap-2 w-full`}>
          {programmedQueue.map((card, slotIdx) => {
            const isHovered = hoveredSlotIdx === slotIdx;

            return (
              <div
                key={slotIdx}
                onMouseEnter={() => setHoveredSlotIdx(slotIdx)}
                onMouseLeave={() => setHoveredSlotIdx(null)}
                onClick={() => {
                  if (isLocked) return;
                  if (card) {
                    onUnassignSlot(slotIdx);
                  } else if (selectedCard) {
                    onAssignSlot(slotIdx, selectedCard);
                  }
                }}
                className={`relative ${slotHeightClass} rounded-xl border-2 flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-all duration-300 ${
                  isHovered ? 'z-50 scale-[1.03] shadow-lg' : 'z-10'
                } ${
                  card
                    ? 'border-amber-500/60 bg-gradient-to-b from-slate-900 to-slate-950 shadow-md border-solid'
                    : selectedCard
                    ? 'border-emerald-500/50 border-dashed bg-emerald-950/10 hover:bg-emerald-950/25 hover:border-emerald-400 animate-pulse'
                    : 'border-slate-800/80 border-dashed bg-slate-950/45 hover:border-slate-700/60'
                }`}
              >
                {/* Floating Tooltip when card in slot is hovered */}
                {isHovered && card && <CardTooltip card={card} position="top" />}
                {/* Slot Number Badge */}
                <div className="absolute -top-2 left-1.5 bg-slate-950 border border-slate-800 text-[8px] font-mono font-bold text-slate-400 px-1 py-0.2 rounded-full z-20">
                  S{slotIdx + 1}
                </div>

                {card ? (
                  <div className="flex flex-col items-center justify-center w-full relative h-full gap-1 py-0.5">
                    {!isLocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassignSlot(slotIdx);
                        }}
                        className="absolute -top-1.5 -right-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 rounded-full p-0.5 border border-slate-800 shadow z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <div className="flex items-center justify-center bg-slate-900/80 border border-amber-500/40 rounded-lg p-1 shadow-inner">
                      <SafeImage
                        src={card.spriteUrl}
                        alt={card.name}
                        className={`${imageSizeClass} object-contain`}
                        fallback={
                          <span className="text-xs font-extrabold text-amber-400">{card.name.charAt(0)}</span>
                        }
                      />
                    </div>
                    <span className="text-[9.5px] font-extrabold text-slate-200 line-clamp-1 leading-tight tracking-tight">{card.name}</span>
                  </div>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center justify-center gap-0.5 h-full opacity-65 hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3.5 h-3.5 text-slate-700 animate-pulse" />
                    <span className="text-[7.5px] font-mono font-bold tracking-tight uppercase">Empty</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lock In & Submit Queue Button */}
      <button
        onClick={onLockIn}
        disabled={isLocked}
        className={`w-full py-2.5 mt-2.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md ${
          isLocked
            ? 'bg-slate-900 text-slate-500 border border-slate-800/80 cursor-not-allowed'
            : 'gold-btn animate-pulse hover:scale-[1.02]'
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" />
            Actions Locked
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            Lock In & Battle
          </>
        )}
      </button>
    </div>
  );
};
