import React, { useState } from 'react';
import type { Card } from '../types/game';
import { CardTooltip } from './CardTooltip';
import { SafeImage } from './SafeImage';
import { Lock, X, Play } from 'lucide-react';

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
  const isFull = programmedQueue.every(c => c !== null);

  const slotCount = programmedQueue.length;
  const gridColsClass = slotCount === 3 ? 'grid-cols-3' : 'grid-cols-5';
  const slotHeightClass = slotCount > 5 ? 'h-14' : slotCount === 5 ? 'h-16' : 'h-20';

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Dynamic Action Programmer Slots */}
      <div className={`grid ${gridColsClass} gap-1.5 w-full`}>
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
              className={`relative ${slotHeightClass} rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-0.5 text-center cursor-pointer transition-all duration-200 ${
                isHovered ? 'z-50' : 'z-10'
              } ${
                card
                  ? 'border-amber-500/80 bg-slate-800/90 border-solid shadow-md'
                  : selectedCard
                  ? 'border-emerald-400/80 bg-emerald-950/20 hover:bg-emerald-950/40 animate-pulse'
                  : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'
              }`}
            >
              {/* Floating Tooltip when card in slot is hovered */}
              {isHovered && card && <CardTooltip card={card} position="top" />}
              {/* Slot Number Badge */}
              <div className="absolute -top-2 left-1 bg-slate-900 border border-slate-700 text-[8px] font-mono font-bold text-amber-400 px-1 py-0.2 rounded-full">
                S{slotIdx + 1}
              </div>

              {card ? (
                <div className="flex flex-col items-center w-full relative px-0.5">
                  {!isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnassignSlot(slotIdx);
                      }}
                      className="absolute -top-1 -right-1 text-slate-400 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <SafeImage
                    src={card.spriteUrl}
                    alt={card.name}
                    className={`${slotCount > 5 ? 'w-4 h-4' : 'w-5 h-5'} object-contain rounded my-0.5 shadow`}
                    fallback={<span className="text-[9px] font-bold text-amber-400 my-0.5">{card.name.charAt(0)}</span>}
                  />
                  <span className={`${slotCount > 5 ? 'text-[8.5px]' : 'text-[9.5px]'} font-bold text-slate-100 line-clamp-1 leading-tight`}>{card.name}</span>
                </div>
              ) : (
                <div className="text-slate-500 text-[9px] flex flex-col items-center leading-none">
                  <span>Empty</span>
                  {slotCount <= 5 && <span className="text-[7.5px] text-slate-600">Tap</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lock In & Submit Queue Button */}
      <button
        onClick={onLockIn}
        disabled={!isFull || isLocked}
        className={`w-full py-2 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all duration-200 ${
          isLocked
            ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            : isFull
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 hover:scale-[1.01]'
            : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="w-3.5 h-3.5" />
            Actions Locked
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            Lock In Cards & Battle!
          </>
        )}
      </button>
    </div>
  );
};
