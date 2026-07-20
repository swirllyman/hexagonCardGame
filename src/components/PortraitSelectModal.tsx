import React, { useState } from 'react';
import { CHARACTER_PORTRAITS, type CharacterPortrait } from '../utils/characterPortraits';
import { SafeImage } from './SafeImage';
import { X, Check, Sparkles, UserCheck } from 'lucide-react';

interface PortraitSelectModalProps {
  isOpen: boolean;
  playerSeatLabel: string;
  currentAvatarUrl?: string;
  onClose: () => void;
  onSelectPortrait: (portrait: CharacterPortrait) => void;
}

const FACTION_CHIPS = {
  crimson: 'bg-rose-950/80 text-rose-300 border-rose-600/50 hover:border-rose-400 shadow-rose-900/40',
  azure: 'bg-sky-950/80 text-sky-300 border-sky-600/50 hover:border-sky-400 shadow-sky-900/40',
  emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50 hover:border-emerald-400 shadow-emerald-900/40',
  amber: 'bg-amber-950/80 text-amber-300 border-amber-600/50 hover:border-amber-400 shadow-amber-900/40',
};

export const PortraitSelectModal: React.FC<PortraitSelectModalProps> = ({
  isOpen,
  playerSeatLabel,
  currentAvatarUrl,
  onClose,
  onSelectPortrait,
}) => {
  if (!isOpen) return null;

  const [selected, setSelected] = useState<CharacterPortrait>(
    CHARACTER_PORTRAITS.find((p) => p.avatarUrl === currentAvatarUrl) || CHARACTER_PORTRAITS[0]
  );

  const handleConfirm = () => {
    onSelectPortrait(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl fantasy-panel rounded-2xl p-5 shadow-2xl border border-amber-500/50 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight gold-gradient-text">
                SELECT CHARACTER PORTRAIT
              </h2>
              <p className="text-xs text-amber-200/70 font-mono">
                Choosing Portrait for <span className="text-amber-400 font-bold">{playerSeatLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 Character Sprites Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
          {CHARACTER_PORTRAITS.map((portrait) => {
            const isSelected = selected.avatarUrl === portrait.avatarUrl;
            const chipStyle = FACTION_CHIPS[portrait.faction];

            return (
              <div
                key={portrait.id}
                onClick={() => setSelected(portrait)}
                className={`group relative rounded-xl p-3 border flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 shadow-md ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/80 scale-[1.03] shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : `bg-slate-950/90 ${chipStyle}`
                }`}
              >
                {/* Active Selection Badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow z-20">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Portrait Preview Frame */}
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-900 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <SafeImage
                    src={portrait.avatarUrl}
                    alt={portrait.name}
                    className="w-full h-full object-cover"
                    fallback={<span className="text-xs font-bold text-amber-300">{portrait.name.charAt(0)}</span>}
                  />
                </div>

                {/* Character Details */}
                <div className="text-center w-full">
                  <h3 className="text-xs font-black text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                    {portrait.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{portrait.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 gold-btn rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transform hover:scale-105 transition-all"
          >
            <UserCheck className="w-4 h-4 fill-slate-950" />
            Apply Portrait
          </button>
        </div>
      </div>
    </div>
  );
};
