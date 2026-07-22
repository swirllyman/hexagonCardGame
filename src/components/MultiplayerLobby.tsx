import React, { useState, useEffect } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import { TEAMS } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { PortraitSelectModal } from './PortraitSelectModal';
import { SafeImage } from './SafeImage';
import { Users, Copy, Check, Bot, User, Play, Radio, WifiOff, ArrowRight, ShieldCheck, LogOut, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
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
  onOpenCompendium?: () => void;
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

import { loadSavedActionsPerRound, saveActionsPerRound } from '../utils/matchSettingsStorage';

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
  onOpenCompendium,
}) => {
  const [actionsPerRound, setActionsPerRound] = useState<number>(loadSavedActionsPerRound);
  const [tab, setTab] = useState<'host' | 'join'>('host');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [preferredNameInput, setPreferredNameInput] = useState<string>('Commander Duelist');
  const [copied, setCopied] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>(localPlayerName);
  const [selectedModalPlayerId, setSelectedModalPlayerId] = useState<PlayerId | null>(null);

  useEffect(() => {
    saveActionsPerRound(actionsPerRound);
  }, [actionsPerRound]);

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

  const applyTeamPreset = (preset: 'ffa' | '2v2' | '3v1' | '2v1v1') => {
    let teamMap = [1, 2, 3, 4];
    if (preset === '2v2') teamMap = [1, 1, 2, 2];
    else if (preset === '3v1') teamMap = [1, 1, 1, 2];
    else if (preset === '2v1v1') teamMap = [1, 1, 2, 3];
    const updated = seats.map((s, idx) => ({ ...s, teamId: teamMap[idx] }));
    onUpdateSeats(updated);
  };

  const handleTeamChange = (seatId: PlayerId, teamId: number) => {
    const updated = seats.map(s => s.id === seatId ? { ...s, teamId } : s);
    onUpdateSeats(updated);
  };

  return (
    <div className="w-full space-y-4">
      {/* Sub-tabs: Host vs Join */}
      {role === 'single' && (
        <div className="flex bg-slate-950 p-1 rounded-none border border-slate-800">
          <button
            onClick={() => setTab('host')}
            className={`flex-1 py-1.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'host'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Host Online Room
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-1.5 rounded-none text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
        <div className="p-4 bg-slate-950/80 rounded-none border border-slate-800 space-y-3">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold font-mono text-slate-300 block">Your Commander Name:</label>
            <input
              type="text"
              value={preferredNameInput}
              onChange={(e) => setPreferredNameInput(e.target.value)}
              placeholder="e.g. Commander Valerius"
              className="w-full bg-slate-900 border border-slate-700 rounded-none px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          <p className="text-xs text-slate-300 text-center">
            Create a real-time room to invite friends or open multiple tabs to duel!
          </p>
          <button
            onClick={() => onHostRoom(undefined, preferredNameInput)}
            disabled={isConnecting}
            className="w-full py-2.5 gold-btn rounded-none font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg cursor-pointer"
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
        <div className="p-4 bg-slate-950/80 rounded-none border border-slate-800 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold font-mono text-slate-300 block">Your Commander Name:</label>
            <input
              type="text"
              value={preferredNameInput}
              onChange={(e) => setPreferredNameInput(e.target.value)}
              placeholder="e.g. Duelist Kaelen"
              className="w-full bg-slate-900 border border-slate-700 rounded-none px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          <label className="text-xs font-bold font-mono text-slate-300 block">Enter Room Code (e.g. HEX-8A4B):</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="HEX-XXXX"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-none px-3 py-2 text-sm font-mono text-amber-300 uppercase tracking-wider font-bold focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => onJoinRoom(joinCodeInput, preferredNameInput)}
              disabled={isConnecting || !joinCodeInput.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-none text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-none flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400/80 uppercase tracking-widest block">ROOM CODE:</span>
              <span className="text-base font-black font-mono gold-gradient-text tracking-wider">{roomCode}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenCompendium && (
                <button
                  onClick={onOpenCompendium}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  title="Cards Compendium"
                >
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>Cards</span>
                </button>
              )}
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-200 rounded-none text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={onLeaveRoom}
                className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 border border-rose-800 text-rose-300 rounded-none text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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

          {/* Team Presets Bar (Host Only) */}
          {role === 'host' && (
            <div className="p-2 rounded-none bg-slate-950/90 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase font-mono text-amber-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" /> Team Mode Presets:
              </span>
              <div className="grid grid-cols-4 gap-1 font-mono">
                <button type="button" onClick={() => applyTeamPreset('ffa')} className="py-1 px-1 text-[9px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer">1v1v1v1 (FFA)</button>
                <button type="button" onClick={() => applyTeamPreset('2v2')} className="py-1 px-1 text-[9px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer">2v2</button>
                <button type="button" onClick={() => applyTeamPreset('3v1')} className="py-1 px-1 text-[9px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer">3v1</button>
                <button type="button" onClick={() => applyTeamPreset('2v1v1')} className="py-1 px-1 text-[9px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer">2v1v1</button>
              </div>
            </div>
          )}

          {/* Arena Seats & Interactive Selection Grid */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 gap-1.5">
              {(() => {
                return seats.map((seat, idx) => {
                const style = FACTION_STYLES[seat.id];
                const isOccupiedBySelf = seat.peerId === localPeerId || (!seat.isAi && localPlayerId === seat.id && role === 'host');
                const isOccupiedByPeer = Boolean(seat.peerId && seat.peerId !== localPeerId);
                const teamId = seat.teamId || (idx + 1);
                const teamConfig = TEAMS[teamId] || TEAMS[1];
                // Disable a team option if all OTHER seats are already on that team
                const otherSeats = seats.filter(s => s.id !== seat.id);
                const isTeamLocked = (t: number) => otherSeats.every(s => (s.teamId || 1) === t);

                return (
                  <div
                    key={seat.id}
                    className={`p-2 px-3 rounded-none border ${teamConfig.borderClass} ${style.bg} flex items-center justify-between gap-3 transition-all shadow-sm`}
                  >
                    {/* Left: Seat info & avatar & name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Selectable Character Portrait Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedModalPlayerId(seat.id)}
                        title="Click to select character portrait"
                        className={`relative w-8 h-8 rounded-none bg-slate-950 border ${style.border} hover:border-amber-400 hover:scale-105 transition-all flex items-center justify-center overflow-hidden group shadow-md flex-shrink-0 cursor-pointer`}
                      >
                        <SafeImage
                          src={seat.avatarUrl || DEFAULT_SEAT_AVATARS[seat.id]}
                          alt={seat.name}
                          className="w-full h-full object-cover"
                          fallback={<span className={`font-mono font-black ${style.text} text-xs`}>P{idx + 1}</span>}
                        />
                        <div className="absolute top-0 right-0 bg-slate-950/80 px-0.5 rounded-none text-[7px] font-mono font-black text-amber-400">
                          P{idx + 1}
                        </div>
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                        </div>
                      </button>

                      <div className="flex items-center gap-2 min-w-0">
                        {isOccupiedBySelf ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleNameBlur}
                              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                              className="bg-slate-900 border border-amber-500/50 rounded-none px-2 py-0.5 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400 w-32 font-sans"
                              placeholder="Set Name"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {seat.name}
                          </span>
                        )}

                        {isOccupiedBySelf && (
                          <span className="px-1 py-0.2 rounded-none text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-0.5 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> YOU
                          </span>
                        )}

                        {seat.isAi && (
                          <span className="px-1 py-0.2 rounded-none text-[8px] font-bold bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-0.5 shrink-0">
                            <Bot className="w-2.5 h-2.5 text-slate-400" /> BOT
                          </span>
                        )}

                        {!seat.isAi && isOccupiedByPeer && (
                          <span className="px-1 py-0.2 rounded-none text-[8px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/50 flex items-center gap-0.5 shrink-0">
                            <User className="w-2.5 h-2.5 text-sky-400" /> ONLINE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Team Selection & Seat Action Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                      {/* Team Selector & Badge */}
                      <div className="flex items-center gap-1.5">
                        {role === 'host' || isOccupiedBySelf ? (
                          <select
                            value={teamId}
                            onChange={(e) => handleTeamChange(seat.id, parseInt(e.target.value, 10))}
                            className={`bg-slate-900 border rounded-none px-1.5 py-0.5 text-[10px] font-mono font-bold focus:outline-none ${teamConfig.textClass} ${teamConfig.borderClass}`}
                          >
                          <option value={1} disabled={isTeamLocked(1)}>Team 1 (Red){isTeamLocked(1) ? ' ✗' : ''}</option>
                            <option value={2} disabled={isTeamLocked(2)}>Team 2 (Blue){isTeamLocked(2) ? ' ✗' : ''}</option>
                            <option value={3} disabled={isTeamLocked(3)}>Team 3 (Green){isTeamLocked(3) ? ' ✗' : ''}</option>
                            <option value={4} disabled={isTeamLocked(4)}>Team 4 (Yellow){isTeamLocked(4) ? ' ✗' : ''}</option>
                          </select>
                        ) : null}
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded-none border ${teamConfig.badgeClass}`}>
                          {teamConfig.name}
                        </span>
                      </div>

                      {/* AI Difficulty Selector (Host only) */}
                      {seat.isAi && role === 'host' && (
                        <select
                          value={seat.aiDifficulty}
                          onChange={(e) => handleDifficultyChange(seat.id, e.target.value as 'easy' | 'medium' | 'hard')}
                          className="bg-slate-900 border border-slate-700 rounded-none px-1.5 py-0.5 text-[10px] font-mono text-slate-300 focus:outline-none"
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
                          className={`px-2 py-0.5 rounded-none text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
                          className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-none text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Release
                        </button>
                      ) : (
                        <button
                          onClick={() => onClaimSeat(seat.id)}
                          disabled={isOccupiedByPeer}
                          className={`px-2 py-0.5 rounded-none text-[10px] font-black transition-all flex items-center gap-1 shadow-sm ${
                            isOccupiedByPeer
                              ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold uppercase cursor-pointer'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {isOccupiedByPeer ? 'Occupied' : 'Select Seat'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>

          {/* Start Arena Match CTA */}
          {role === 'host' && (() => {
            const allSameTeam = seats.every(s => (s.teamId || 1) === (seats[0].teamId || 1));
            return (
            <div className="w-full space-y-1.5">
              <div className="p-2 rounded-none bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-2 shadow-inner">
                <span className="text-xs font-bold text-amber-200 font-sans">Actions Per Round:</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-none p-0.5 gap-1 font-mono">
                  {[3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setActionsPerRound(count)}
                      className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-none transition-all ${
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
              {allSameTeam && (
                <span className="text-[10px] font-bold text-rose-400 font-mono uppercase tracking-wide animate-pulse text-center block">
                  ⚠ All players must not be on the same team
                </span>
              )}
              <button
                onClick={() => onStartGame(seats, actionsPerRound)}
                disabled={allSameTeam}
                title={allSameTeam ? 'At least 2 different teams are required to start' : ''}
                className={`w-full py-2.5 rounded-none uppercase tracking-wider text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                  allSameTeam
                    ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    : 'sharp-fight-btn transform hover:scale-[1.01] cursor-pointer text-amber-200'
                }`}
              >
                <Play className="w-4 h-4 fill-amber-300 text-amber-300" /> Start Match ({actionsPerRound} Actions/Round)
              </button>
            </div>
            );
          })()}

          {role === 'client' && (
            <div className="p-2 bg-slate-950/80 border border-amber-500/30 rounded-none text-center">
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


