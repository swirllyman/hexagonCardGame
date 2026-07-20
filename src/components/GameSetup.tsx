import React, { useState } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { MultiplayerLobby } from './MultiplayerLobby';
import { Swords, Bot, User, Zap, Crown, Globe, Shield } from 'lucide-react';

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
  onStartGame: (setup: SetupPlayerOption[]) => void;
  onLeaveRoom: () => void;
}

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

  const [localPlayers, setLocalPlayers] = useState<SetupPlayerOption[]>([
    { id: 'player1', name: 'Commander Valerius', isAi: false, aiDifficulty: 'medium' },
    { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium' },
    { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium' },
    { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium' },
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
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-xs">
                    P{idx + 1}
                  </div>
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

          <button
            onClick={() => onStartGame(localPlayers)}
            className="w-full py-3.5 rounded-2xl gold-btn uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            Enter Arena & Commence Match
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
    </div>
  );
};
