import { useState } from 'react';
import { useGameState } from './state/useGameState';
import { useMultiplayer } from './hooks/useMultiplayer';
import { HexMap } from './components/HexMap';
import { CardHand } from './components/CardHand';
import { ActionQueue } from './components/ActionQueue';
import { ResolutionOverlay } from './components/ResolutionOverlay';
import { PlayerStatusPanel } from './components/PlayerStatusPanel';
import { BattleLog } from './components/BattleLog';
import { GameSetup } from './components/GameSetup';
import { GameOverModal } from './components/GameOverModal';
import { EmoteWheel } from './components/EmoteWheel';
import { sound } from './utils/sound';
import { Swords, Volume2, VolumeX, HelpCircle, Shield, RotateCcw, Globe } from 'lucide-react';

export function App() {
  const {
    gamePhase,
    round,
    currentSlotIndex,
    priorityPlayerIdx,
    resolvingTurnOrder,
    players,
    hexGrid,
    battleLog,
    selectedHandCard,
    hoveredHex,
    isAutoPlay,
    playSpeed,
    winner,
    currentAnimation,
    projectedIntents,
    localPlayerId,
    initGame,
    assignCardToSlot,
    unassignSlot,
    lockInPlanning,
    executeNextStep,
    setSelectedHandCard,
    setHoveredHex,
    setIsAutoPlay,
    setPlaySpeed,
    setGamePhase,
  } = useGameState();

  const multiplayer = useMultiplayer();

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  const controlledPlayer = players.find((p) => p.id === localPlayerId) || players.find((p) => !p.isAi) || players[0];

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="h-screen w-screen max-h-screen max-w-screen overflow-hidden text-slate-100 flex flex-col p-2 font-sans select-none">
      {/* Compact Top Header Bar */}
      <header className="h-11 flex-shrink-0 w-full flex items-center justify-between px-3 fantasy-panel rounded-xl backdrop-blur-md shadow-md mb-2 border border-amber-600/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-400">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight leading-none gold-gradient-text flex items-center gap-1.5">
              HEX CLASH <span className="text-amber-200/80 font-mono text-[10px] font-normal">Tactical Command</span>
            </h1>
          </div>

          <span className="text-[10px] font-mono text-amber-200/90 bg-slate-950 px-2.5 py-0.5 rounded-full border border-amber-600/40">
            Round {round} — {gamePhase === 'planning' ? 'Planning Phase' : gamePhase === 'resolving' ? 'Resolution Phase' : 'Arena Setup'}
          </span>

          {/* Multiplayer Room Badge */}
          {multiplayer.role !== 'single' && multiplayer.roomCode && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/40 rounded-full font-mono text-[10px] text-amber-300">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>ROOM: {multiplayer.roomCode}</span>
            </div>
          )}
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-2">
          {gamePhase !== 'setup' && (
            <EmoteWheel
              localPlayerId={controlledPlayer?.id || 'player1'}
              localPlayerName={controlledPlayer?.name || 'Commander'}
              activeEmotes={multiplayer.activeEmotes}
              onSendEmote={multiplayer.sendEmote}
            />
          )}

          {gamePhase !== 'setup' && (
            <button
              onClick={() => setGamePhase('setup')}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Reset Match"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>New Match</span>
            </button>
          )}

          <button
            onClick={() => setShowRules(!showRules)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Rules</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-slate-300 rounded-lg text-[11px] transition-all"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md fantasy-panel border border-amber-500/50 rounded-3xl p-5 text-slate-200 space-y-3 shadow-2xl">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 gold-gradient-text">
              <Shield className="w-4 h-4 text-amber-400" /> How to Play Hex Clash
            </h3>
            <ul className="text-xs space-y-2 list-disc list-inside text-slate-300 leading-relaxed font-sans">
              <li><strong>Objective:</strong> Defeat all 3 rival Commanders to win!</li>
              <li><strong>Planning Phase:</strong> Pick 3 action cards into Slot 1, Slot 2, and Slot 3.</li>
              <li><strong>Realtime Multiplayer:</strong> Share room code to play live against friends across tabs or devices!</li>
              <li><strong>Resolution Phase:</strong> Watch actions execute in rotating priority order.</li>
              <li><strong>Collisions:</strong> Bumping into occupied hexes deals 10 collision damage.</li>
              <li><strong>Runes:</strong> Stepping on map runes grants +20 HP, +20 Shield, or bonus DMG.</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2 gold-btn font-extrabold rounded-xl text-xs uppercase"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Main Fullscreen Body */}
      {gamePhase === 'setup' ? (
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <GameSetup
            role={multiplayer.role}
            roomCode={multiplayer.roomCode}
            seats={multiplayer.seats}
            isConnecting={multiplayer.isConnecting}
            connectError={multiplayer.connectError}
            onHostRoom={multiplayer.hostRoom}
            onJoinRoom={multiplayer.joinRoom}
            onUpdateSeats={multiplayer.updateSeats}
            onStartGame={initGame}
            onLeaveRoom={multiplayer.leaveRoom}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Top Arena Dashboard & Battlefield */}
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 overflow-hidden">
            {/* Left 9 Cols: Player Status + Hex Canvas */}
            <div className="col-span-12 lg:col-span-9 flex flex-col h-full min-h-0 overflow-hidden gap-2">
              {/* 4 Player Status Bar */}
              <div className="flex-shrink-0">
                <PlayerStatusPanel
                  players={players}
                  priorityPlayerIdx={priorityPlayerIdx}
                  currentSlotIndex={currentSlotIndex}
                  gamePhase={gamePhase}
                />
              </div>

              {/* Center Interactive SVG Hexagon Battlefield */}
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <HexMap
                  hexGrid={hexGrid}
                  players={players}
                  hoveredHex={hoveredHex}
                  selectedCard={selectedHandCard}
                  currentActorId={
                    gamePhase === 'resolving'
                      ? players[(priorityPlayerIdx + resolvingTurnOrder) % players.length]?.id
                      : undefined
                  }
                  currentAnimation={currentAnimation}
                  projectedIntents={projectedIntents}
                  onHexHover={setHoveredHex}
                  onHexClick={() => {}}
                />
              </div>
            </div>

            {/* Right 3 Cols: Battle Log Sidebar */}
            <div className="hidden lg:flex lg:col-span-3 h-full min-h-0 flex-col overflow-hidden">
              <BattleLog logs={battleLog} />
            </div>
          </div>

          {/* Bottom Dock Control Panel */}
          <div className="relative z-40 flex-shrink-0 w-full fantasy-panel border border-amber-600/40 rounded-xl p-2 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
            {gamePhase === 'planning' && controlledPlayer && (
              <>
                <div className="w-full md:w-80 flex-shrink-0">
                  <ActionQueue
                    programmedQueue={controlledPlayer.programmedQueue}
                    selectedCard={selectedHandCard}
                    isLocked={controlledPlayer.isLocked}
                    onAssignSlot={(slotIdx, card) => assignCardToSlot(slotIdx, card, controlledPlayer.id)}
                    onUnassignSlot={(slotIdx) => unassignSlot(slotIdx, controlledPlayer.id)}
                    onLockIn={() => lockInPlanning(controlledPlayer.id)}
                  />
                </div>

                <div className="w-full flex-1 min-w-0">
                  <CardHand
                    hand={controlledPlayer.hand}
                    programmedQueue={controlledPlayer.programmedQueue}
                    selectedCard={selectedHandCard}
                    isLocked={controlledPlayer.isLocked}
                    onSelectCard={(card) => {
                      if (selectedHandCard?.id === card.id) {
                        setSelectedHandCard(null);
                      } else {
                        setSelectedHandCard(card);
                      }
                    }}
                  />
                </div>
              </>
            )}

            {gamePhase === 'resolving' && (
              <div className="w-full flex justify-center">
                <ResolutionOverlay
                  currentSlotIndex={currentSlotIndex}
                  resolvingTurnOrder={resolvingTurnOrder}
                  isAutoPlay={isAutoPlay}
                  playSpeed={playSpeed}
                  onExecuteStep={executeNextStep}
                  onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
                  onChangeSpeed={setPlaySpeed}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Over Summary Modal */}
      {gamePhase === 'gameover' && (
        <GameOverModal
          winner={winner}
          players={players}
          round={round}
          onRestart={() => setGamePhase('setup')}
        />
      )}
    </div>
  );
}

export default App;
