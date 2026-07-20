import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';

interface ResolutionOverlayProps {
  currentSlotIndex: number;
  resolvingTurnOrder: number;
  isAutoPlay: boolean;
  playSpeed: number;
  onExecuteStep: () => void;
  onToggleAutoPlay: () => void;
  onChangeSpeed: (speed: number) => void;
}

export const ResolutionOverlay: React.FC<ResolutionOverlayProps> = ({
  currentSlotIndex,
  resolvingTurnOrder,
  isAutoPlay,
  playSpeed,
  onExecuteStep,
  onToggleAutoPlay,
  onChangeSpeed,
}) => {
  return (
    <div className="w-full max-w-xl fantasy-panel rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-2.5 border border-amber-600/40 backdrop-blur-md animate-float">
      <div className="flex items-center justify-between w-full border-b border-slate-800/80 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-xs font-black uppercase tracking-wider gold-gradient-text">
            Resolving Slot {currentSlotIndex + 1} of 3
          </h3>
        </div>
        <span className="text-[10px] font-mono text-amber-200/70">Turn Step #{resolvingTurnOrder + 1}</span>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-center gap-3 w-full my-0.5">
        {/* Play/Pause Auto-step */}
        <button
          onClick={onToggleAutoPlay}
          className={`flex-1 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
            isAutoPlay
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-400'
          }`}
        >
          {isAutoPlay ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause Auto Play
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" /> Auto Play Turn
            </>
          )}
        </button>

        {/* Step Next Action Button */}
        <button
          onClick={onExecuteStep}
          disabled={isAutoPlay}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-amber-600/40 text-amber-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <SkipForward className="w-3.5 h-3.5 text-amber-400" />
          Step Next
        </button>

        {/* Speed Toggle */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          {[1, 2, 4].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg transition-all ${
                playSpeed === spd
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-amber-200 hover:bg-slate-900'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
