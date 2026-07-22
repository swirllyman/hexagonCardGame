import React, { useState } from 'react';
import type { MultiplayerSeat, ConnectedPeer, PlayerId } from '../types/game';
import { TEAMS } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';
import { MultiplayerLobby } from './MultiplayerLobby';
import { PortraitSelectModal } from './PortraitSelectModal';
import { SafeImage } from './SafeImage';
import { GameLogo } from './GameLogo';
import { Bot, User, Zap, Crown, Globe, Shield, Sparkles, BookOpen, Users } from 'lucide-react';
import type { CharacterPortrait } from '../utils/characterPortraits';

import {
  loadSavedMatchPlayers,
  saveMatchPlayers,
  loadSavedActionsPerRound,
  saveActionsPerRound,
} from '../utils/matchSettingsStorage';

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
  onOpenCompendium?: () => void;
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
  onOpenCompendium,
}) => {
  const [mode, setMode] = useState<'single' | 'multiplayer'>(role !== 'single' ? 'multiplayer' : 'single');
  const [selectedModalPlayerId, setSelectedModalPlayerId] = useState<PlayerId | null>(null);

  const [localPlayers, setLocalPlayers] = useState<SetupPlayerOption[]>(loadSavedMatchPlayers);
  const [actionsPerRound, setActionsPerRound] = useState<number>(loadSavedActionsPerRound);

  React.useEffect(() => {
    saveMatchPlayers(localPlayers);
  }, [localPlayers]);

  React.useEffect(() => {
    saveActionsPerRound(actionsPerRound);
  }, [actionsPerRound]);

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

  const applyTeamPreset = (preset: 'ffa' | '2v2' | '3v1' | '2v1v1') => {
    setLocalPlayers((prev) => {
      let teamMap = [1, 2, 3, 4];
      if (preset === '2v2') teamMap = [1, 1, 2, 2];
      else if (preset === '3v1') teamMap = [1, 1, 1, 2];
      else if (preset === '2v1v1') teamMap = [1, 1, 2, 3];
      return prev.map((p, idx) => ({ ...p, teamId: teamMap[idx] }));
    });
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

  return (
    <div className="w-full max-w-3xl fantasy-sharp-panel gold-corners-bottom rounded-none p-3.5 shadow-2xl flex flex-col items-center gap-2.5 backdrop-blur-xl border border-amber-600/50">
      {/* Title Header & Top Actions Row */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
        <GameLogo size="sm" />

        <div className="flex items-center gap-2">
          {/* Card Compendium Action Button */}
          {onOpenCompendium && (
            <button
              onClick={onOpenCompendium}
              className="py-1 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 rounded-none text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Card Compendium</span>
            </button>
          )}

          {/* Mode Switcher: Local AI vs Online Multiplayer */}
          <div className="flex bg-slate-950 p-0.5 rounded-none border border-slate-800">
            <button
              onClick={() => {
                setMode('single');
                if (role !== 'single') onLeaveRoom();
              }}
              className={`py-1 px-2.5 rounded-none text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                mode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" /> Local AI
            </button>
            <button
              onClick={() => setMode('multiplayer')}
              className={`py-1 px-2.5 rounded-none text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                mode === 'multiplayer'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" /> Multiplayer
            </button>
          </div>
        </div>
      </div>

      {/* Local AI Setup */}
      {mode === 'single' && (
        <div className="w-full space-y-2">
          {/* Header Row with Title & Team Mode Presets */}
          <div className="w-full p-2 rounded-none bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Single Player Seats
            </h3>

            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => applyTeamPreset('ffa')}
                className="py-0.5 px-2 text-[10px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                1v1v1v1 (FFA)
              </button>
              <button
                type="button"
                onClick={() => applyTeamPreset('2v2')}
                className="py-0.5 px-2 text-[10px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                2v2
              </button>
              <button
                type="button"
                onClick={() => applyTeamPreset('3v1')}
                className="py-0.5 px-2 text-[10px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                3v1
              </button>
              <button
                type="button"
                onClick={() => applyTeamPreset('2v1v1')}
                className="py-0.5 px-2 text-[10px] font-extrabold uppercase rounded-none bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                2v1v1
              </button>
            </div>
          </div>

          {/* Single-Row Player Seats */}
          <div className="w-full space-y-1.5">
            {(() => {
              return localPlayers.map((p, idx) => {
              const teamId = p.teamId || (idx + 1);
              const teamConfig = TEAMS[teamId] || TEAMS[1];
              // For each team option, check if all OTHER players are on that team
              const otherPlayers = localPlayers.filter(op => op.id !== p.id);
              const isTeamLocked = (t: number) => otherPlayers.every(op => (op.teamId || 1) === t);

              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-none bg-slate-950/90 border flex items-center justify-between gap-3 shadow-inner transition-all ${teamConfig.borderClass}`}
                >
                  {/* Left: Portrait & Name */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedModalPlayerId(p.id)}
                      title="Click to select character portrait"
                      className="relative w-8 h-8 rounded-none bg-slate-900 border border-amber-500/50 hover:border-amber-400 hover:scale-105 transition-all flex items-center justify-center overflow-hidden group shadow-md flex-shrink-0 cursor-pointer"
                    >
                      <SafeImage
                        src={p.avatarUrl || FACTION_DEFAULTS[p.id]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        fallback={<span className="font-mono font-bold text-amber-400 text-xs">P{idx + 1}</span>}
                      />
                      <div className="absolute top-0 right-0 bg-slate-950/80 px-0.5 rounded-bl text-[7px] font-mono font-black text-amber-400">
                        P{idx + 1}
                      </div>
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
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
                      className="bg-slate-900 border border-slate-700/80 rounded-none px-2 py-1 text-xs text-amber-100 font-bold focus:outline-none focus:border-amber-400 w-36 font-sans"
                    />
                  </div>

                  {/* Middle: Controller & Difficulty */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlayerAi(p.id)}
                      className={`px-2 py-0.5 rounded-none text-xs font-bold flex items-center gap-1 transition-all ${
                        p.isAi
                          ? 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      }`}
                    >
                      {p.isAi ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3 text-amber-400" />}
                      {p.isAi ? 'AI Bot' : 'Human'}
                    </button>

                    {p.isAi && (
                      <select
                        value={p.aiDifficulty}
                        onChange={(e) =>
                          changeDifficulty(p.id, e.target.value as 'easy' | 'medium' | 'hard')
                        }
                        className="bg-slate-900 border border-slate-700 rounded-none px-1.5 py-0.5 text-xs font-mono text-slate-300 focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    )}
                  </div>

                  {/* Right: Team Selection & Badge */}
                  <div className="flex items-center gap-2 font-mono">
                    <select
                      value={teamId}
                      onChange={(e) => {
                        const newTeam = parseInt(e.target.value, 10);
                        setLocalPlayers(prev => prev.map(item => item.id === p.id ? { ...item, teamId: newTeam } : item));
                      }}
                      className={`bg-slate-900 border rounded-none px-2 py-0.5 text-xs font-mono font-bold focus:outline-none ${teamConfig.textClass} ${teamConfig.borderClass}`}
                    >
                      <option value={1} disabled={isTeamLocked(1)}>Team 1 (Red){isTeamLocked(1) ? ' ✗' : ''}</option>
                      <option value={2} disabled={isTeamLocked(2)}>Team 2 (Blue){isTeamLocked(2) ? ' ✗' : ''}</option>
                      <option value={3} disabled={isTeamLocked(3)}>Team 3 (Green){isTeamLocked(3) ? ' ✗' : ''}</option>
                      <option value={4} disabled={isTeamLocked(4)}>Team 4 (Yellow){isTeamLocked(4) ? ' ✗' : ''}</option>
                    </select>

                    <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-none border ${teamConfig.badgeClass}`}>
                      {teamConfig.name}
                    </span>
                  </div>
                </div>
              );
            });
            })()}
          </div>

          {/* Bottom Action Bar: Actions Per Round + Start Match */}
          {(() => {
            const allSameTeam = localPlayers.every(p => (p.teamId || 1) === (localPlayers[0].teamId || 1));
            return (
          <div className="p-2 rounded-none bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200 font-sans">Actions:</span>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-none p-0.5 gap-1 font-mono">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setActionsPerRound(count)}
                    className={`px-2.5 py-0.5 text-xs font-extrabold rounded-none transition-all ${
                      actionsPerRound === count
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-amber-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              {allSameTeam && (
                <span className="text-[10px] font-bold text-rose-400 font-mono uppercase tracking-wide animate-pulse">
                  ⚠ All players must not be on the same team
                </span>
              )}
              <button
                onClick={() => onStartGame(localPlayers, actionsPerRound)}
                disabled={allSameTeam}
                title={allSameTeam ? 'At least 2 different teams are required to start' : ''}
                className={`py-2 px-6 rounded-none uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xl font-black transition-all ${
                  allSameTeam
                    ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    : 'sharp-fight-btn text-amber-200 transform hover:scale-[1.01] cursor-pointer'
                }`}
              >
                <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                Enter Arena ({actionsPerRound} Actions/Round)
              </button>
            </div>
          </div>
            );
          })()}
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
          onOpenCompendium={onOpenCompendium}
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

