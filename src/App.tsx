import { useState, useEffect } from 'react';
import { useGameState } from './state/useGameState';
import { useMultiplayer } from './hooks/useMultiplayer';
import { HexMap } from './components/HexMap';
import { CardHand } from './components/CardHand';
import { ActionQueue } from './components/ActionQueue';
import { ResolutionOverlay } from './components/ResolutionOverlay';
import { PlayedCardsDisplay } from './components/PlayedCardsDisplay';
import { CardAnimationOrchestrator } from './components/CardAnimationOrchestrator';
import { PlayerStatusPanel } from './components/PlayerStatusPanel';
import { BattleLog } from './components/BattleLog';
import { GameSetup } from './components/GameSetup';
import { CardCompendiumModal } from './components/CardCompendiumModal';
import { GameOverModal } from './components/GameOverModal';
import { EmoteWheel } from './components/EmoteWheel';
import { GameLogo } from './components/GameLogo';
import { sound } from './utils/sound';
import { Volume2, VolumeX, HelpCircle, Shield, RotateCcw, Globe, Coins, Hourglass, BookOpen, Swords, Gift, Skull, Trophy } from 'lucide-react';

export function App() {
  const {
    gamePhase,
    round,
    actionsPerRound,
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
    previousPlayedCard,
    projectedIntents,
    floaters,
    bloodBursts,
    activeEmotes,
    usedEmoteThisRound,
    sendEmote,
    localPlayerId,
    setLocalPlayerId,
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
    clearAnimation,
    cardAnimStage,
    animatingRecord,
  } = useGameState();

  const multiplayer = useMultiplayer();

  // Sync multiplayer localPlayerId with game state localPlayerId
  useEffect(() => {
    if (multiplayer.localPlayerId) {
      setLocalPlayerId(multiplayer.localPlayerId);
    }
  }, [multiplayer.localPlayerId, setLocalPlayerId]);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showCompendium, setShowCompendium] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [showMatchEndedNext, setShowMatchEndedNext] = useState<boolean>(false);

  // Show the "Next" button after 3s in the 'ended' phase
  useEffect(() => {
    if (gamePhase === 'ended') {
      setShowMatchEndedNext(false);
      const timer = setTimeout(() => setShowMatchEndedNext(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowMatchEndedNext(false);
    }
  }, [gamePhase]);

  const controlledPlayer = players.find((p) => p.id === localPlayerId) || players.find((p) => !p.isAi) || players[0];
  const isOnlineMatch = multiplayer.role !== 'single';

  useEffect(() => {
    const handleResize = () => {
      const targetWidth = 1440;
      const targetHeight = 860;
      const scaleX = window.innerWidth / targetWidth;
      const scaleY = window.innerHeight / targetHeight;
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 30 second timer for online planning phase
  useEffect(() => {
    if (!isOnlineMatch || gamePhase !== 'planning') {
      setTimeLeft(30);
      return;
    }

    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // If local player is alive and unlocked, lock them in
          if (controlledPlayer && !controlledPlayer.isEliminated && !controlledPlayer.isLocked) {
            lockInPlanning(controlledPlayer.id);
          } else {
            // If local player is already eliminated or locked, lock in any active player to trigger phase resolution
            const unlockedAlive = players.find(p => !p.isEliminated && !p.isLocked);
            if (unlockedAlive) {
              lockInPlanning(unlockedAlive.id);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnlineMatch, gamePhase, round, controlledPlayer, lockInPlanning, players]);

  const activePlayers = players.filter(p => !p.isEliminated);
  const otherActivePlayers = activePlayers.filter(p => p.id !== controlledPlayer?.id);
  const allOthersLocked = otherActivePlayers.length > 0 && otherActivePlayers.every(p => p.isLocked);
  const waitingOnYou = allOthersLocked && controlledPlayer && !controlledPlayer.isLocked && gamePhase === 'planning';

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="game-viewport">
      <div 
        className="scale-wrapper text-slate-100 p-2 font-sans select-none relative"
        style={{ '--ui-scale': scale } as React.CSSProperties}
      >
        {/* Card Animation Orchestrator (Screenshot 1: Player status slot -> showcase -> Yellow box & Screenshot 2: Yellow box -> showcase -> Red box) */}
        <CardAnimationOrchestrator
          cardAnimStage={cardAnimStage}
          animatingRecord={animatingRecord}
          players={players}
          playSpeed={playSpeed}
        />

        {/* Styled Dark Fantasy RPG Top Header Bar */}
      <header className="relative z-[100] h-11 flex-shrink-0 w-full flex items-center justify-between px-3 fantasy-sharp-panel gold-corners-bottom rounded-none backdrop-blur-md shadow-2xl mb-1.5 border-amber-600/50 bg-slate-950/95">
        <div className="flex items-center gap-3 min-w-0">
          <GameLogo size="sm" />

          {/* Node Route Map Path Header */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-none text-slate-400 font-mono text-[10px]">
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span className="text-slate-600">•</span>
            <Swords className="w-3 h-3 text-rose-400" />
            <span className="text-slate-600">•</span>
            <Gift className="w-3 h-3 text-amber-300" />
            <span className="text-slate-600">•</span>
            <Swords className="w-3 h-3 text-rose-500 font-bold animate-pulse" />
            <span className="text-slate-600">•</span>
            <Skull className="w-3 h-3 text-amber-500" />
          </div>

          {/* Gold Currency Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/40 border border-amber-500/50 rounded-none font-mono text-xs font-black text-amber-300 shadow-md">
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>555</span>
          </div>

          {/* Round & Phase Indicator */}
          <span className="text-[10px] font-mono text-amber-200/90 bg-slate-900 px-2.5 py-0.5 rounded-none border border-amber-600/40 whitespace-nowrap flex-shrink-0">
            Round {round} — {gamePhase === 'planning' ? 'Planning' : gamePhase === 'ended' ? 'Match Ended' : 'Resolution'}
          </span>

          {/* Hourglass 30s Round Timer Badge */}
          <div className="flex items-center gap-1.5 px-3 py-0.5 bg-slate-900 border border-amber-500/60 rounded-none font-mono text-xs font-bold text-amber-300 flex-shrink-0">
            <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{isOnlineMatch && gamePhase === 'planning' ? `${timeLeft}s` : '30'}</span>
          </div>

          {/* Multiplayer Room Badge */}
          {multiplayer.role !== 'single' && multiplayer.roomCode && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/40 rounded-none font-mono text-[10px] text-amber-300 whitespace-nowrap flex-shrink-0">
              <Globe className="w-3 h-3 text-amber-400" />
              <span>ROOM: {multiplayer.roomCode}</span>
            </div>
          )}
        </div>

        {/* Speed Controls & Settings */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-none p-0.5 text-slate-400 text-[10px]">
            <button
              onClick={() => setPlaySpeed(1)}
              className={`px-2 py-0.5 rounded-none font-mono font-bold ${playSpeed === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-slate-200'}`}
            >
              1x
            </button>
            <button
              onClick={() => setPlaySpeed(2)}
              className={`px-2 py-0.5 rounded-none font-mono font-bold ${playSpeed === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-slate-200'}`}
            >
              2x
            </button>
            <button
              onClick={() => setPlaySpeed(3)}
              className={`px-2 py-0.5 rounded-none font-mono font-bold ${playSpeed === 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'hover:text-slate-200'}`}
            >
              3x
            </button>
          </div>

          {gamePhase !== 'setup' && (
            <EmoteWheel
              localPlayerId={controlledPlayer?.id || 'player1'}
              localPlayerName={controlledPlayer?.name || 'Commander'}
              activeEmotes={activeEmotes}
              hasUsedEmote={controlledPlayer?.id ? !!usedEmoteThisRound[controlledPlayer.id] : false}
              onSendEmote={(senderId, senderName, emote, text) => {
                const ok = sendEmote(senderId, senderName, emote, text);
                if (ok) {
                  multiplayer.sendEmote(senderId, senderName, emote, text);
                }
              }}
            />
          )}

          {gamePhase !== 'setup' && (
            <button
              onClick={() => {
                if (multiplayer.role === 'host') {
                  multiplayer.kickAllPeers();
                }
                setGamePhase('setup');
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-200 rounded-none text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Reset Match"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>New Match</span>
            </button>
          )}

          <button
            onClick={() => setShowCompendium(true)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-200 rounded-none text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Open Card Compendium"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Cards</span>
          </button>

          <button
            onClick={() => setShowRules(!showRules)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-amber-200 rounded-none text-[11px] font-bold flex items-center gap-1 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Rules</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-600/40 text-slate-300 rounded-none text-[11px] transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Card Compendium Modal */}
      <CardCompendiumModal
        isOpen={showCompendium}
        onClose={() => setShowCompendium(false)}
      />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md fantasy-sharp-panel gold-corners-bottom border border-amber-500/50 rounded-none p-5 text-slate-200 space-y-3 shadow-2xl bg-slate-950">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 gold-gradient-text font-fantasy">
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
              className="w-full py-2 gold-btn font-extrabold rounded-none text-xs uppercase cursor-pointer"
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
            connectedPeers={multiplayer.connectedPeers}
            localPeerId={multiplayer.localPeerId}
            localPlayerId={multiplayer.localPlayerId}
            localPlayerName={multiplayer.localPlayerName}
            isConnecting={multiplayer.isConnecting}
            connectError={multiplayer.connectError}
            onHostRoom={multiplayer.hostRoom}
            onJoinRoom={multiplayer.joinRoom}
            onClaimSeat={multiplayer.claimSeat}
            onReleaseSeat={multiplayer.releaseSeat}
            onUpdatePlayerName={multiplayer.updatePlayerName}
            onUpdateSeats={multiplayer.updateSeats}
            onStartGame={initGame}
            onLeaveRoom={multiplayer.leaveRoom}
            onOpenCompendium={() => setShowCompendium(true)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
          {/* Left: Vertical Player Status Column */}
          <div className="hidden lg:flex flex-col w-64 flex-shrink-0 h-full min-h-0 overflow-hidden">
            <PlayerStatusPanel
              players={players}
              priorityPlayerIdx={priorityPlayerIdx}
              currentSlotIndex={currentSlotIndex}
              gamePhase={gamePhase}
              localPlayerId={multiplayer.localPlayerId}
              vertical
            />
          </div>

          {/* Right side: Hex Map + Battle Log + Bottom Dock */}
          <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
            {/* Hex Map + Battle Log */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 overflow-hidden">
              {/* Hex Canvas */}
              <div className="col-span-12 lg:col-span-9 flex flex-col h-full min-h-0 overflow-hidden">
                {/* Mobile: Player Status Bar (shown only on smaller screens) */}
                <div className="flex-shrink-0 lg:hidden">
                  <PlayerStatusPanel
                    players={players}
                    priorityPlayerIdx={priorityPlayerIdx}
                    currentSlotIndex={currentSlotIndex}
                    gamePhase={gamePhase}
                    localPlayerId={multiplayer.localPlayerId}
                  />
                </div>

                <div className="flex-1 min-h-0 w-full overflow-hidden">
                  <HexMap
                    hexGrid={hexGrid}
                    players={players}
                    hoveredHex={hoveredHex}
                    selectedCard={gamePhase === 'resolving' ? null : selectedHandCard}
                    currentActorId={
                      gamePhase === 'resolving'
                        ? players[(priorityPlayerIdx + resolvingTurnOrder) % players.length]?.id
                        : undefined
                    }
                    currentAnimation={currentAnimation}
                    gamePhase={gamePhase}
                    currentSlotIndex={currentSlotIndex}
                    projectedIntents={projectedIntents}
                    floaters={floaters}
                    bloodBursts={bloodBursts}
                    activeEmotes={activeEmotes}
                    localPlayerId={localPlayerId}
                    onHexHover={setHoveredHex}
                    onHexClick={() => {}}
                    onAnimationComplete={clearAnimation}
                  />
                </div>
              </div>

              {/* Right 3 Cols: Battle Log Sidebar */}
              <div className="hidden lg:flex lg:col-span-3 h-full min-h-0 flex-col overflow-hidden">
                <BattleLog logs={battleLog} />
              </div>
            </div>

            {/* Bottom Dock Control Panel */}
            <div className="relative z-40 flex-shrink-0 w-full fantasy-sharp-panel gold-corners-bottom rounded-none border-amber-600/50 p-2 flex flex-col md:flex-row items-stretch justify-between gap-3 shadow-2xl backdrop-blur-md">
              {waitingOnYou && (
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-rose-600 to-rose-700 border border-rose-400 text-slate-100 font-extrabold text-[10px] px-4 py-1.5 rounded-full shadow-xl animate-bounce uppercase tracking-wider flex items-center gap-1.5 z-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-100 animate-ping" />
                  Everyone is waiting on you! Lock in to start the round
                </div>
              )}
              {gamePhase === 'planning' && controlledPlayer && (
                <>
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
                      onDoubleClickCard={(card) => {
                        const firstEmptyIdx = controlledPlayer.programmedQueue.findIndex(slot => slot === null);
                        if (firstEmptyIdx !== -1) {
                          assignCardToSlot(firstEmptyIdx, card, controlledPlayer.id);
                          setSelectedHandCard(null);
                        }
                      }}
                    />
                  </div>

                  <div className={`w-full ${actionsPerRound > 5 ? 'md:w-[420px]' : actionsPerRound === 5 ? 'md:w-[360px]' : 'md:w-80'} flex-shrink-0`}>
                    <ActionQueue
                      programmedQueue={controlledPlayer.programmedQueue}
                      selectedCard={selectedHandCard}
                      isLocked={controlledPlayer.isLocked}
                      onAssignSlot={(slotIdx, card) => assignCardToSlot(slotIdx, card, controlledPlayer.id)}
                      onUnassignSlot={(slotIdx) => unassignSlot(slotIdx, controlledPlayer.id)}
                      onLockIn={() => lockInPlanning(controlledPlayer.id)}
                    />
                  </div>
                </>
              )}

              {gamePhase === 'resolving' && (
                <div className="w-full flex flex-col md:flex-row items-center justify-start gap-4 md:gap-8 px-1">
                  {/* Last Turn (Red) Display with Hover Tooltip & Who Played Text Box */}
                  <PlayedCardsDisplay
                    previousPlayedCard={previousPlayedCard}
                  />

                  <div className="w-full md:w-auto max-w-xl flex justify-center">
                    <ResolutionOverlay
                      currentSlotIndex={currentSlotIndex}
                      resolvingTurnOrder={resolvingTurnOrder}
                      isAutoPlay={isAutoPlay}
                      playSpeed={playSpeed}
                      totalSlots={actionsPerRound}
                      isClient={multiplayer.role === 'client'}
                      onExecuteStep={executeNextStep}
                      onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
                      onChangeSpeed={setPlaySpeed}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Match Ended Board Floating Overlay */}
        {gamePhase === 'ended' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-start pt-36 bg-slate-950/40 backdrop-blur-[1px] transition-all" style={{ pointerEvents: showMatchEndedNext ? 'auto' : 'none' }}>
            <div className="animate-match-ended flex flex-col items-center justify-center px-7 py-4 bg-slate-950/95 border-2 border-amber-500/90 shadow-[0_0_45px_rgba(245,158,11,0.55),inset_0_0_14px_rgba(245,158,11,0.2)] fantasy-sharp-panel max-w-md text-center">
              <div className="flex items-center justify-center gap-2 border-b border-amber-500/50 pb-2 mb-2 w-full">
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                <span className="text-amber-300 font-fantasy text-3xl tracking-widest uppercase font-extrabold drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                  Match Ended
                </span>
                <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <p className="text-amber-100/90 font-sans text-xs font-semibold tracking-wide mb-3">
                {winner ? `Team ${winner.teamId} (${winner.name}) claims victory!` : 'The battle has concluded!'}
              </p>
              <button
                onClick={() => setGamePhase('gameover')}
                className={`mt-1 px-6 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 border border-amber-300 font-fantasy text-slate-950 text-sm font-extrabold uppercase tracking-widest shadow-[0_0_18px_rgba(245,158,11,0.5)] transition-all duration-200 hover:scale-105 ${
                  showMatchEndedNext ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
                } transition-all duration-500`}
              >
                View Results
              </button>
            </div>
          </div>
        )}

        {/* Game Over Summary Modal */}
        {gamePhase === 'gameover' && (
          <GameOverModal
            winner={winner}
            players={players}
            round={round}
            battleLog={battleLog}
            onRestart={() => {
              if (multiplayer.role === 'host') {
                multiplayer.kickAllPeers();
              }
              setGamePhase('setup');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
