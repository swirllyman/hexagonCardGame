import React, { useState, useEffect } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { PortraitSelectModal } from './PortraitSelectModal';
import { SafeImage } from './SafeImage';
import { Users, Copy, Check, Bot, User, Play, Radio, WifiOff, ArrowRight, ShieldCheck, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import type { CharacterPortrait } from '../utils/characterPortraits';

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
  onHostRoom: (customCode?: string, preferredName?: string) => void;
  onJoinRoom: (code: string, preferredName?: string) => void;
  onClaimSeat: (seatId: PlayerId) => void;
  onReleaseSeat: (seatId: PlayerId) => void;
  onUpdatePlayerName: (name: string) => void;
  onUpdateSeats: (seats: MultiplayerSeat[]) => void;
  onStartGame: (setup: SetupPlayerOption[], actionsPerRound?: number) => void;
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

const DEFAULT_SEAT_AVATARS: Record<PlayerId, string> = {
  player1: 'sprites/portrait_valerius.svg',
  player2: 'sprites/portrait_kaelen.svg',
  player3: 'sprites/portrait_seraphina.svg',
  player4: 'sprites/portrait_ignis.svg',
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
  const [actionsPerRound, setActionsPerRound] = useState<number>(3);
  const [tab, setTab] = useState<'host' | 'join'>('host');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [preferredNameInput, setPreferredNameInput] = useState<string>('Commander Duelist');
  const [copied, setCopied] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>(localPlayerName);
  const [selectedModalPlayerId, setSelectedModalPlayerId] = useState<PlayerId | null>(null);

  useEffect(() => {
    if (localPlayerName) {
      setEditingName(localPlayerName);
    }
  }, [localPlayerName]);

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

  const handleSelectPortrait = (portrait: CharacterPortrait) => {
    if (!selectedModalPlayerId) return;
    const updated = seats.map((s) =>
      s.id === selectedModalPlayerId ? { ...s, avatarUrl: portrait.avatarUrl } : s
    );
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
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold font-mono text-slate-300 block">Your Commander Name:</label>
            <input
              type="text"
              value={preferredNameInput}
              onChange={(e) => setPreferredNameInput(e.target.value)}
              placeholder="e.g. Commander Valerius"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          <p className="text-xs text-slate-300 text-center">
            Create a real-time room to invite friends or open multiple tabs to duel!
          </p>
          <button
            onClick={() => onHostRoom(undefined, preferredNameInput)}
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
          <div className="space-y-1">
            <label className="text-xs font-bold font-mono text-slate-300 block">Your Commander Name:</label>
            <input
              type="text"
              value={preferredNameInput}
              onChange={(e) => setPreferredNameInput(e.target.value)}
              placeholder="e.g. Duelist Kaelen"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>

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
              onClick={() => onJoinRoom(joinCodeInput, preferredNameInput)}
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
        <div className="space-y-2.5">
          {/* Room Code Header */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest block">ROOM CODE:</span>
              <span className="text-base font-black font-mono gold-gradient-text tracking-wider">{roomCode}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={onLeaveRoom}
                className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" /> Leave
              </button>
            </div>
          </div>

          {/* Connected Peers Summary Pill */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400/90 px-1">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-400" />
              PEERS IN LOBBY ({connectedPeers.length || 1})
            </span>
            <span className="text-slate-400 font-normal">
              ROLE: {localPlayerId ? localPlayerId.toUpperCase() : 'SPECTATOR'}
            </span>
          </div>

          {/* Arena Seats & Interactive Selection Grid */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 gap-1.5">
              {seats.map((seat, idx) => {
                const style = FACTION_STYLES[seat.id];
                const isOccupiedBySelf = seat.peerId === localPeerId || (!seat.isAi && localPlayerId === seat.id && role === 'host');
                const isOccupiedByPeer = Boolean(seat.peerId && seat.peerId !== localPeerId);

                return (
                  <div
                    key={seat.id}
                    className={`p-2 px-3 rounded-xl border ${style.border} ${style.bg} flex items-center justify-between gap-2 transition-all shadow-sm`}
                  >
                    {/* Left: Seat info & avatar */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Selectable Character Portrait Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedModalPlayerId(seat.id)}
                        title="Click to select character portrait"
                        className={`relative w-8 h-8 rounded-lg bg-slate-950 border ${style.border} hover:border-amber-400 hover:scale-105 transition-all flex items-center justify-center overflow-hidden group shadow-md flex-shrink-0 cursor-pointer`}
                      >
                        <SafeImage
                          src={seat.avatarUrl || DEFAULT_SEAT_AVATARS[seat.id]}
                          alt={seat.name}
                          className="w-full h-full object-cover"
                          fallback={<span className={`font-mono font-black ${style.text} text-xs`}>P{idx + 1}</span>}
                        />
                        <div className="absolute top-0 right-0 bg-slate-950/80 px-0.5 rounded-bl text-[7px] font-mono font-black text-amber-400">
                          P{idx + 1}
                        </div>
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        </div>
                      </button>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black font-mono ${style.text}`}>
                            {style.label.toUpperCase()} (P{idx + 1})
                          </span>

                          {isOccupiedBySelf && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> YOU
                            </span>
                          )}

                          {seat.isAi && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5 text-slate-400" /> BOT
                            </span>
                          )}

                          {!seat.isAi && isOccupiedByPeer && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5 text-sky-400" /> ONLINE
                            </span>
                          )}
                        </div>

                        {isOccupiedBySelf ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleNameBlur}
                              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                              className="bg-slate-900 border border-amber-500/50 rounded px-2 py-0.5 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400 w-32 font-sans"
                              placeholder="Set Name"
                            />
                            <button
                              onClick={handleNameBlur}
                              className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {seat.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Seat Action Controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* AI Difficulty Selector (Host only) */}
                      {seat.isAi && role === 'host' && (
                        <select
                          value={seat.aiDifficulty}
                          onChange={(e) => handleDifficultyChange(seat.id, e.target.value as 'easy' | 'medium' | 'hard')}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300 focus:outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Med</option>
                          <option value="hard">Hard</option>
                        </select>
                      )}

                      {/* Host AI/Human Toggle Button */}
                      {role === 'host' && (
                        <button
                          onClick={() => handleToggleAi(seat.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                            seat.isAi
                              ? 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          }`}
                          title="Toggle Seat AI / Human"
                        >
                          {seat.isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3 text-amber-400" />}
                          {seat.isAi ? 'Bot' : 'Human'}
                        </button>
                      )}

                      {/* Claim or Release Seat Button */}
                      {isOccupiedBySelf ? (
                        <button
                          onClick={() => onReleaseSeat(seat.id)}
                          className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded text-[10px] font-bold transition-all shadow-sm"
                        >
                          Release
                        </button>
                      ) : (
                        <button
                          onClick={() => onClaimSeat(seat.id)}
                          disabled={isOccupiedByPeer}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-sm ${
                            isOccupiedByPeer
                              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
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
            <div className="w-full space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-2 shadow-inner">
                <span className="text-xs font-bold text-amber-200 font-sans">Actions Per Round:</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 gap-1 font-mono">
                  {[3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setActionsPerRound(count)}
                      className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded transition-all ${
                        actionsPerRound === count
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-amber-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onStartGame(seats, actionsPerRound)}
                className="w-full py-2.5 rounded-xl gold-btn uppercase tracking-wider text-xs font-black flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.01] transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" /> Start Match ({actionsPerRound} Actions/Round)
              </button>
            </div>
          )}

          {role === 'client' && (
            <div className="p-2 bg-slate-950/80 border border-amber-500/30 rounded-lg text-center">
              <p className="text-[11px] text-amber-300 font-mono animate-pulse">
                Connected! Waiting for Room Host to start...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Character Portrait Selection Modal */}
      <PortraitSelectModal
        isOpen={selectedModalPlayerId !== null}
        playerSeatLabel={
          selectedModalPlayerId
            ? `Seat ${selectedModalPlayerId.toUpperCase()}`
            : ''
        }
        currentAvatarUrl={
          seats.find((s) => s.id === selectedModalPlayerId)?.avatarUrl
        }
        onClose={() => setSelectedModalPlayerId(null)}
        onSelectPortrait={handleSelectPortrait}
      />
    </div>
  );
};


