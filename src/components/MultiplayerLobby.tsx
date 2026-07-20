import React, { useState } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { Users, Copy, Check, Bot, User, Play, Radio, WifiOff, ArrowRight, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

interface MultiplayerLobbyProps {
  role: 'single' | 'host' | 'client';
  roomCode: string | null;
  seats: MultiplayerSeat[];
  connectedPeers: ConnectedPeer[];
  localPeerId: string | null;
  localPlayerId: PlayerId;
  localPlayerName: string;
  isConnecting: boolean;
  connectError: string | null;
  onHostRoom: (customCode?: string) => void;
  onJoinRoom: (code: string) => void;
  onClaimSeat: (seatId: PlayerId) => void;
  onReleaseSeat: (seatId: PlayerId) => void;
  onUpdatePlayerName: (name: string) => void;
  onUpdateSeats: (seats: MultiplayerSeat[]) => void;
  onStartGame: (setup: SetupPlayerOption[]) => void;
  onLeaveRoom: () => void;
}

const FACTION_STYLES: Record<PlayerId, { label: string; border: string; bg: string; text: string; badgeBg: string }> = {
  player1: {
    label: 'Crimson',
    border: 'border-rose-600/50',
    bg: 'bg-rose-950/20',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-600/20 text-rose-300 border-rose-500/40',
  },
  player2: {
    label: 'Azure',
    border: 'border-sky-600/50',
    bg: 'bg-sky-950/20',
    text: 'text-sky-400',
    badgeBg: 'bg-sky-600/20 text-sky-300 border-sky-500/40',
  },
  player3: {
    label: 'Emerald',
    border: 'border-emerald-600/50',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40',
  },
  player4: {
    label: 'Amber',
    border: 'border-amber-600/50',
    bg: 'bg-amber-950/20',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
  },
};

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
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
  const [tab, setTab] = useState<'host' | 'join'>('host');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>(localPlayerName);

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
          peerId: undefined,
          name: nextIsAi ? `Bot ${s.id.toUpperCase()}` : `Commander ${s.id.replace('player', 'P')}`,
        };
      }
      return s;
    });
    onUpdateSeats(updated);
  };

  const handleDifficultyChange = (seatId: PlayerId, aiDifficulty: 'easy' | 'medium' | 'hard') => {
    const updated = seats.map((s) => (s.id === seatId ? { ...s, aiDifficulty } : s));
    onUpdateSeats(updated);
  };

  const handleNameBlur = () => {
    if (editingName.trim() && editingName !== localPlayerName) {
      onUpdatePlayerName(editingName.trim());
    }
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
          {/* Room Code & Player Name Badge */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
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
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Leave
                </button>
              </div>
            </div>

            {/* Custom Nickname Input */}
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Your Display Name:</span>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Commander Nickname"
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleNameBlur}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>

          {/* Connected Players Roster Section */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                CONNECTED PLAYERS ({connectedPeers.length || 1})
              </span>
              <span className="text-slate-400 font-normal">
                {role === 'host' ? 'Host (Lead)' : 'Client (Guest)'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {connectedPeers.length > 0 ? (
                connectedPeers.map((peer) => {
                  const isSelf = peer.peerId === localPeerId;
                  const occupiedSeat = seats.find((s) => s.peerId === peer.peerId);

                  return (
                    <div
                      key={peer.peerId}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                        isSelf
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span className="font-bold text-slate-100">{peer.name}</span>
                        {peer.isHost && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            HOST
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({peer.peerId.slice(-6)})
                        </span>
                      </div>

                      <div>
                        {occupiedSeat ? (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${FACTION_STYLES[occupiedSeat.id].badgeBg}`}>
                            Seat {occupiedSeat.id.toUpperCase().replace('PLAYER', 'P')} ({FACTION_STYLES[occupiedSeat.id].label})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No Seat Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2 text-xs font-mono text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{localPlayerName} (YOU)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {role.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arena Seats & Interactive Selection Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400">
              <span>ARENA DUEL SEATS (CLICK "SELECT SEAT" TO CLAIM)</span>
              <span>LOCAL ROLE: {localPlayerId ? localPlayerId.toUpperCase() : 'SPECTATOR'}</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {seats.map((seat, idx) => {
                const style = FACTION_STYLES[seat.id];
                const isOccupiedBySelf = seat.peerId === localPeerId || (!seat.isAi && localPlayerId === seat.id && role === 'host');
                const isOccupiedByPeer = Boolean(seat.peerId && seat.peerId !== localPeerId);

                return (
                  <div
                    key={seat.id}
                    className={`p-3 rounded-2xl border ${style.border} ${style.bg} flex flex-col md:flex-row items-center justify-between gap-3 transition-all shadow-md`}
                  >
                    {/* Left: Seat info & avatar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className={`w-8 h-8 rounded-xl bg-slate-950 border ${style.border} flex items-center justify-center font-mono font-black ${style.text} text-sm shadow-inner`}>
                        P{idx + 1}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black font-mono ${style.text}`}>
                            {style.label.toUpperCase()} COMMANDER (P{idx + 1})
                          </span>

                          {isOccupiedBySelf && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> YOUR SEAT
                            </span>
                          )}

                          {seat.isAi && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
                              <Bot className="w-3 h-3 text-slate-400" /> AI BOT
                            </span>
                          )}

                          {!seat.isAi && isOccupiedByPeer && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-1">
                              <User className="w-3 h-3 text-sky-400" /> ONLINE DUELIST
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-bold text-slate-100 truncate">
                          {seat.name}
                        </span>
                      </div>
                    </div>

                    {/* Right: Seat Action Controls */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      {/* AI Difficulty Selector (Host only) */}
                      {seat.isAi && role === 'host' && (
                        <select
                          value={seat.aiDifficulty}
                          onChange={(e) => handleDifficultyChange(seat.id, e.target.value as 'easy' | 'medium' | 'hard')}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none"
                        >
                          <option value="easy">Easy Bot</option>
                          <option value="medium">Medium Bot</option>
                          <option value="hard">Hard Bot</option>
                        </select>
                      )}

                      {/* Host AI/Human Toggle Button */}
                      {role === 'host' && (
                        <button
                          onClick={() => handleToggleAi(seat.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                            seat.isAi
                              ? 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          }`}
                          title="Toggle Seat AI / Human"
                        >
                          {seat.isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-amber-400" />}
                          {seat.isAi ? 'Bot' : 'Human'}
                        </button>
                      )}

                      {/* Claim or Release Seat Button */}
                      {isOccupiedBySelf ? (
                        <button
                          onClick={() => onReleaseSeat(seat.id)}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          Release Seat
                        </button>
                      ) : (
                        <button
                          onClick={() => onClaimSeat(seat.id)}
                          disabled={isOccupiedByPeer}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
                            isOccupiedByPeer
                              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isOccupiedByPeer ? 'Occupied' : 'Select Seat'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Arena Match CTA */}
          {role === 'host' && (
            <button
              onClick={() => onStartGame(seats)}
              className="w-full py-3.5 rounded-2xl gold-btn uppercase tracking-wider text-xs font-black flex items-center justify-center gap-2 shadow-xl transform hover:scale-[1.02] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Start Online Match ({seats.filter((s) => !s.isAi).length} Players Ready)
            </button>
          )}

          {role === 'client' && (
            <div className="p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl text-center">
              <p className="text-xs text-amber-300 font-mono animate-pulse">
                Connected! Waiting for Room Host to start the match...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

