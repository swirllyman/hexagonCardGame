import React, { useState } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { MultiplayerLobby } from './MultiplayerLobby';
import { PortraitSelectModal } from './PortraitSelectModal';
import { SafeImage } from './SafeImage';
import { Swords, Bot, User, Zap, Crown, Globe, Shield, Sparkles } from 'lucide-react';
import type { CharacterPortrait } from '../utils/characterPortraits';

interface GameSetupProps {
  role: 'single' | 'host' | 'client';
  roomCode: string | null;
  seats: MultiplayerSeat[];
  connectedPeers: ConnectedPeer[];
  localPeerId: string | null;
  localPlayerId: PlayerId;
  localPlayerName: string;
  isConnecting: boolean;
  connectError: string | null;
  onHostRoom: (customCode?: string, preferredName?: string) => void;
  onJoinRoom: (code: string, preferredName?: string) => void;
  onClaimSeat: (seatId: PlayerId) => void;
  onReleaseSeat: (seatId: PlayerId) => void;
  onUpdatePlayerName: (name: string) => void;
  onUpdateSeats: (seats: MultiplayerSeat[]) => void;
  onStartGame: (setup: SetupPlayerOption[], actionsCount?: number) => void;
  onLeaveRoom: () => void;
}

const FACTION_DEFAULTS: Record<PlayerId, string> = {
  player1: 'sprites/portrait_valerius.svg',
  player2: 'sprites/portrait_kaelen.svg',
  player3: 'sprites/portrait_seraphina.svg',
  player4: 'sprites/portrait_ignis.svg',
};

export const GameSetup: React.FC<GameSetupProps> = ({
  role,
  roomCode,
  seats,
  connectedPeers,
  localPeerId,
  localPlayerId,
  localPlayerName,
  isConnecting,
  connectError,
  onHostRoom,
  onJoinRoom,
  onClaimSeat,
  onReleaseSeat,
  onUpdatePlayerName,
  onUpdateSeats,
  onStartGame,
  onLeaveRoom,
}) => {
  const [mode, setMode] = useState<'single' | 'multiplayer'>(role !== 'single' ? 'multiplayer' : 'single');
  const [selectedModalPlayerId, setSelectedModalPlayerId] = useState<PlayerId | null>(null);

  const [localPlayers, setLocalPlayers] = useState<SetupPlayerOption[]>([
    { id: 'player1', name: 'Commander Valerius', isAi: false, aiDifficulty: 'medium', avatarUrl: 'sprites/portrait_valerius.svg' },
    { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium', avatarUrl: 'sprites/portrait_kaelen.svg' },
    { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium', avatarUrl: 'sprites/portrait_seraphina.svg' },
    { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium', avatarUrl: 'sprites/portrait_ignis.svg' },
  ]);

  const togglePlayerAi = (id: string) => {
    setLocalPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextIsAi = !p.isAi;
          return {
            ...p,
            isAi: nextIsAi,
            name: nextIsAi ? `Bot ${p.id.toUpperCase()}` : `Player ${p.id.replace('player', '')}`,
          };
        }
        return p;
      })
    );
  };

  const changeDifficulty = (id: string, difficulty: 'easy' | 'medium' | 'hard') => {
    setLocalPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, aiDifficulty: difficulty } : p))
    );
  };

  const handleSelectPortrait = (portrait: CharacterPortrait) => {
    if (!selectedModalPlayerId) return;
    setLocalPlayers((prev) =>
      prev.map((item) =>
        item.id === selectedModalPlayerId
          ? { ...item, avatarUrl: portrait.avatarUrl }
          : item
      )
    );
  };

  const [actionsPerRound, setActionsPerRound] = useState<number>(3);

  return (
    <div className="w-full max-w-lg fantasy-panel rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-3 backdrop-blur-xl border border-amber-600/40 max-h-[92vh] overflow-y-auto">
      {/* Title Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          <Swords className="w-4 h-4" />
        </div>
        <h1 className="text-lg font-black tracking-tight gold-gradient-text">HEX CLASH</h1>
        <span className="text-[10px] font-mono text-amber-200/70 uppercase tracking-widest">
          Tactical Command Duel
        </span>
      </div>

      {/* Mode Switcher: Local AI vs Online Multiplayer */}
      <div className="w-full flex bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => {
            setMode('single');
            if (role !== 'single') onLeaveRoom();
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            mode === 'single'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Local AI Duel
        </button>
        <button
          onClick={() => setMode('multiplayer')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            mode === 'multiplayer'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Realtime Multiplayer
        </button>
      </div>

      {/* Local AI Setup */}
      {mode === 'single' && (
        <div className="w-full space-y-3">
          <div className="w-full space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5 font-mono">
              <Crown className="w-3.5 h-3.5" /> Configure Single Player Seats
            </h3>
            {localPlayers.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3 shadow-inner"
              >
                <div className="flex items-center gap-3">
                  {/* Selectable Character Portrait Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedModalPlayerId(p.id)}
                    title="Click to select character portrait"
                    className="relative w-9 h-9 rounded-xl bg-slate-900 border border-amber-500/50 hover:border-amber-400 hover:scale-105 transition-all flex items-center justify-center overflow-hidden group shadow-md flex-shrink-0 cursor-pointer"
                  >
                    <SafeImage
                      src={p.avatarUrl || FACTION_DEFAULTS[p.id]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      fallback={<span className="font-mono font-bold text-amber-400 text-xs">P{idx + 1}</span>}
                    />
                    <div className="absolute top-0 right-0 bg-slate-950/80 px-1 rounded-bl text-[8px] font-mono font-black text-amber-400">
                      P{idx + 1}
                    </div>
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    </div>
                  </button>

                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalPlayers((prev) =>
                        prev.map((item) => (item.id === p.id ? { ...item, name: val } : item))
                      );
                    }}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-amber-100 font-bold focus:outline-none focus:border-amber-400 w-44 font-sans"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlayerAi(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      p.isAi
                        ? 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    }`}
                  >
                    {p.isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
                    {p.isAi ? 'AI Bot' : 'Human'}
                  </button>

                  {p.isAi && (
                    <select
                      value={p.aiDifficulty}
                      onChange={(e) =>
                        changeDifficulty(p.id, e.target.value as 'easy' | 'medium' | 'hard')
                      }
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions Per Round Match Setting */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200 font-sans">Actions Per Round:</span>
            </div>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 gap-1 font-mono">
              {[3, 5, 10].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setActionsPerRound(count)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                    actionsPerRound === count
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-amber-200'
                  }`}
                >
                  {count} {count === 3 ? '(Std)' : count === 5 ? '(Ext)' : '(Max)'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStartGame(localPlayers, actionsPerRound)}
            className="w-full py-3.5 rounded-2xl gold-btn uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Enter Arena ({actionsPerRound} Actions/Round)
          </button>
        </div>
      )}

      {/* Online Multiplayer Lobby */}
      {mode === 'multiplayer' && (
        <MultiplayerLobby
          role={role}
          roomCode={roomCode}
          seats={seats}
          connectedPeers={connectedPeers}
          localPeerId={localPeerId}
          localPlayerId={localPlayerId}
          localPlayerName={localPlayerName}
          isConnecting={isConnecting}
          connectError={connectError}
          onHostRoom={onHostRoom}
          onJoinRoom={onJoinRoom}
          onClaimSeat={onClaimSeat}
          onReleaseSeat={onReleaseSeat}
          onUpdatePlayerName={onUpdatePlayerName}
          onUpdateSeats={onUpdateSeats}
          onStartGame={onStartGame}
          onLeaveRoom={onLeaveRoom}
        />
      )}

      {/* Character Portrait Selection Modal */}
      <PortraitSelectModal
        isOpen={selectedModalPlayerId !== null}
        playerSeatLabel={
          selectedModalPlayerId
            ? `Player ${selectedModalPlayerId.replace('player', '')}`
            : ''
        }
        currentAvatarUrl={
          localPlayers.find((lp) => lp.id === selectedModalPlayerId)?.avatarUrl
        }
        onClose={() => setSelectedModalPlayerId(null)}
        onSelectPortrait={handleSelectPortrait}
      />
    </div>
  );
};

