import React, { useState } from 'react';
import type { MultiplayerSeat, PlayerId } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { Users, Copy, Check, Bot, User, Play, Radio, WifiOff, ArrowRight } from 'lucide-react';

interface MultiplayerLobbyProps {
  role: 'single' | 'host' | 'client';
  roomCode: string | null;
  seats: MultiplayerSeat[];
  isConnecting: boolean;
  connectError: string | null;
  onHostRoom: (customCode?: string) => void;
  onJoinRoom: (code: string) => void;
  onUpdateSeats: (seats: MultiplayerSeat[]) => void;
  onStartGame: (setup: SetupPlayerOption[]) => void;
  onLeaveRoom: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  role,
  roomCode,
  seats,
  isConnecting,
  connectError,
  onHostRoom,
  onJoinRoom,
  onUpdateSeats,
  onStartGame,
  onLeaveRoom,
}) => {
  const [tab, setTab] = useState<'host' | 'join'>('host');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAi = (seatId: PlayerId) => {
    const updated = seats.map((s) => {
      if (s.id === seatId) {
        const nextIsAi = !s.isAi;
        return {
          ...s,
          isAi: nextIsAi,
          name: nextIsAi ? `Bot ${s.id.toUpperCase()}` : `Commander ${s.id.replace('player', 'P')}`,
        };
      }
      return s;
    });
    onUpdateSeats(updated);
  };

  const handleNameChange = (seatId: PlayerId, name: string) => {
    const updated = seats.map((s) => (s.id === seatId ? { ...s, name } : s));
    onUpdateSeats(updated);
  };

  const handleDifficultyChange = (seatId: PlayerId, aiDifficulty: 'easy' | 'medium' | 'hard') => {
    const updated = seats.map((s) => (s.id === seatId ? { ...s, aiDifficulty } : s));
    onUpdateSeats(updated);
  };

  return (
    <div className="w-full space-y-4">
      {/* Sub-tabs: Host vs Join */}
      {role === 'single' && (
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('host')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'host'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Host Online Room
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Join Room Code
          </button>
        </div>
      )}

      {/* Host Room view */}
      {tab === 'host' && role === 'single' && (
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-center">
          <p className="text-xs text-slate-300">
            Create a real-time room to invite friends or open multiple tabs to duel!
          </p>
          <button
            onClick={() => onHostRoom()}
            disabled={isConnecting}
            className="w-full py-2.5 gold-btn rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg"
          >
            {isConnecting ? (
              <span className="animate-pulse">Initializing WebRTC Peer...</span>
            ) : (
              <>
                <Radio className="w-4 h-4" /> Create Room & Generate Code
              </>
            )}
          </button>
        </div>
      )}

      {/* Join Room view */}
      {tab === 'join' && role === 'single' && (
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <label className="text-xs font-bold font-mono text-slate-300 block">Enter Room Code (e.g. HEX-8A4B):</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="HEX-XXXX"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-amber-300 uppercase tracking-wider font-bold focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => onJoinRoom(joinCodeInput)}
              disabled={isConnecting || !joinCodeInput.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {isConnecting ? 'Connecting...' : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          {connectError && (
            <p className="text-xs text-rose-400 font-mono flex items-center gap-1">
              <WifiOff className="w-3.5 h-3.5" /> {connectError}
            </p>
          )}
        </div>
      )}

      {/* Active Room Lobby Display */}
      {role !== 'single' && roomCode && (
        <div className="space-y-4">
          {/* Room Code Badge */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest block">Room Access Code</span>
              <span className="text-lg font-black font-mono gold-gradient-text tracking-wider">{roomCode}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={onLeaveRoom}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition-all"
              >
                Leave
              </button>
            </div>
          </div>

          {/* Seat Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400">
              <span>ARENA SEATS ({seats.filter((s) => !s.isAi).length} HUMAN / {seats.filter((s) => s.isAi).length} AI)</span>
              <span>ROLE: {role === 'host' ? 'HOST (ROOM LEAD)' : 'CLIENT DUELIST'}</span>
            </div>

            {seats.map((seat, idx) => (
              <div
                key={seat.id}
                className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 shadow-inner"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-xs">
                    P{idx + 1}
                  </div>
                  <input
                    type="text"
                    value={seat.name}
                    disabled={role !== 'host'}
                    onChange={(e) => handleNameChange(seat.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400 w-36 font-sans disabled:opacity-75"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={role !== 'host'}
                    onClick={() => handleToggleAi(seat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      seat.isAi
                        ? 'bg-slate-900 text-slate-400 border border-slate-700'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    }`}
                  >
                    {seat.isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
                    {seat.isAi ? 'AI Bot' : 'Human'}
                  </button>

                  {seat.isAi && role === 'host' && (
                    <select
                      value={seat.aiDifficulty}
                      onChange={(e) => handleDifficultyChange(seat.id, e.target.value as 'easy' | 'medium' | 'hard')}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none"
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

          {/* Start Arena Match CTA */}
          {role === 'host' && (
            <button
              onClick={() => onStartGame(seats)}
              className="w-full py-3 rounded-2xl gold-btn uppercase tracking-wider text-xs font-black flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Start Online Match
            </button>
          )}

          {role === 'client' && (
            <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-mono animate-pulse">
                Connected! Waiting for Host to start the match...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
