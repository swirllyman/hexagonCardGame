import React, { useState } from 'react';
import type { EmoteType, PlayerId, EmotePayload } from '../types/game';
import { MessageSquare, Swords, Shield, Flame, Skull, Laugh, Target, Send, X } from 'lucide-react';

interface EmoteWheelProps {
  localPlayerId: PlayerId;
  localPlayerName: string;
  activeEmotes: EmotePayload[];
  onSendEmote: (senderId: PlayerId, senderName: string, emote: EmoteType, text: string) => void;
}

const EMOTE_PRESETS: { type: EmoteType; label: string; icon: React.ReactNode }[] = [
  { type: 'swords', label: 'En Garde!', icon: <Swords className="w-4 h-4 text-amber-400" /> },
  { type: 'shield', label: 'Hold the Line!', icon: <Shield className="w-4 h-4 text-sky-400" /> },
  { type: 'fire', label: 'Burn Them All!', icon: <Flame className="w-4 h-4 text-orange-400" /> },
  { type: 'skull', label: 'You are doomed!', icon: <Skull className="w-4 h-4 text-purple-400" /> },
  { type: 'laugh', label: 'Good Game!', icon: <Laugh className="w-4 h-4 text-emerald-400" /> },
  { type: 'target', label: 'Focus Priority!', icon: <Target className="w-4 h-4 text-rose-400" /> },
];

export const EmoteWheel: React.FC<EmoteWheelProps> = ({
  localPlayerId,
  localPlayerName,
  activeEmotes,
  onSendEmote,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  const handlePresetClick = (preset: typeof EMOTE_PRESETS[number]) => {
    onSendEmote(localPlayerId, localPlayerName, preset.type, preset.label);
    setIsOpen(false);
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSendEmote(localPlayerId, localPlayerName, 'swords', customText.trim());
    setCustomText('');
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Floating Active Emotes Overlay Banner */}
      {activeEmotes.length > 0 && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none space-y-1.5 max-w-sm">
          {activeEmotes.slice(-2).map((item) => (
            <div
              key={item.id}
              className="px-3.5 py-1.5 bg-slate-950/90 border border-amber-500/50 text-amber-200 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-semibold text-amber-400">{item.senderName}:</span>
              <span>"{item.text}"</span>
            </div>
          ))}
        </div>
      )}

      {/* Emote Wheel Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
        title="Open Quick Chat & Emotes"
      >
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Emotes</span>
      </button>

      {/* Emote Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-72 fantasy-panel border border-amber-500/50 rounded-2xl p-3 shadow-2xl space-y-3 z-50 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <span className="text-xs font-bold gold-gradient-text flex items-center gap-1.5 font-mono">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Tactical Emote Deck
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Emote Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {EMOTE_PRESETS.map((preset) => (
              <button
                key={preset.type}
                onClick={() => handlePresetClick(preset)}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-[11px] font-bold text-slate-200 flex items-center gap-2 transition-all text-left"
              >
                {preset.icon}
                <span className="truncate">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Message Input */}
          <form onSubmit={handleCustomSend} className="flex gap-1.5 pt-1 border-t border-amber-500/20">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type tactical message..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-amber-100 font-sans focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!customText.trim()}
              className="p-1.5 gold-btn rounded-xl disabled:opacity-50 text-slate-950 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
