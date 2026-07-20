import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { 
  PlayerState, 
  PlayerId, 
  HexTile, 
  Card, 
  BattleLogEntry, 
  GamePhase, 
  StepAnimationState, 
  AxialCoord,
  ProjectedIntent,
  NetworkMessage
} from '../types/game';
import { 
  generateHexGrid, 
  getStartingPositions, 
  hexEquals, 
  getRelativeHex,
  rotateFacing,
  getFrontalTargetHexes
} from '../utils/hexGrid';
import { createStandardPlayerDeck, shuffleDeck } from '../utils/cardsData';
import { programAiTurn } from '../utils/aiEngine';
import { sound } from '../utils/sound';
import { multiplayerService } from '../services/multiplayerService';

export interface SetupPlayerOption {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
}

const FACTION_MAPPING = {
  player1: 'crimson' as const,
  player2: 'azure' as const,
  player3: 'emerald' as const,
  player4: 'amber' as const,
};

export function useGameState() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [round, setRound] = useState<number>(1);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [priorityPlayerIdx, setPriorityPlayerIdx] = useState<number>(0);
  const [resolvingTurnOrder, setResolvingTurnOrder] = useState<number>(0);

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [hexGrid, setHexGrid] = useState<HexTile[]>([]);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  
  const [selectedHandCard, setSelectedHandCard] = useState<Card | null>(null);
  const [hoveredHex, setHoveredHex] = useState<AxialCoord | null>(null);
  
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1x, 2x, 4x
  const [winner, setWinner] = useState<PlayerState | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<StepAnimationState | null>(null);

  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to add combat/move logs
  const addLog = useCallback((text: string, type: BattleLogEntry['type'] = 'system', playerId?: PlayerId) => {
    const entry: BattleLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round,
      slot: gamePhase === 'resolving' ? currentSlotIndex + 1 : undefined,
      text,
      type,
      playerId,
    };
    setBattleLog(prev => [entry, ...prev]);
  }, [round, gamePhase, currentSlotIndex]);

  // Start new match
  const initGame = useCallback((setupOptions: SetupPlayerOption[]) => {
    const grid = generateHexGrid(4);
    setHexGrid(grid);

    const startPos = getStartingPositions(4);

    const initialPlayers: PlayerState[] = setupOptions.map((opt) => {
      const fullDeck = createStandardPlayerDeck();
      const shuffled = shuffleDeck(fullDeck);
      const hand = shuffled.slice(0, 5);
      const drawPile = shuffled.slice(5);

      return {
        id: opt.id,
        name: opt.name,
        isAi: opt.isAi,
        aiDifficulty: opt.aiDifficulty,
        faction: FACTION_MAPPING[opt.id],
        hp: 100,
        maxHp: 100,
        shield: 0,
        coord: startPos[opt.id].coord,
        facing: startPos[opt.id].facing,
        hand,
        drawPile,
        discardPile: [],
        programmedQueue: [null, null, null],
        isLocked: false,
        isEliminated: false,
        kills: 0,
        damageDealt: 0,
      };
    });

    setPlayers(initialPlayers);
    setRound(1);
    setCurrentSlotIndex(0);
    setPriorityPlayerIdx(0);
    setResolvingTurnOrder(0);
    setWinner(null);
    setSelectedHandCard(null);
    setBattleLog([]);
    setGamePhase('planning');

    addLog('Match Started! 4 Commanders enter the hexagonal arena.', 'system');
  }, [addLog]);

  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>('player1');

  // Select card from active local player hand for programming
  const assignCardToSlot = useCallback((slotIdx: number, card: Card, targetPlayerId?: PlayerId) => {
    const activeId = targetPlayerId || localPlayerId;
    setPlayers(prev => {
      return prev.map(p => {
        if (p.id !== activeId) return p;

        const newQueue = [...p.programmedQueue];
        const existingIdx = newQueue.findIndex(c => c?.id === card.id);
        if (existingIdx !== -1) {
          newQueue[existingIdx] = null;
        }

        newQueue[slotIdx] = card;
        return { ...p, programmedQueue: newQueue };
      });
    });
    sound.playCardSelect();
  }, [localPlayerId]);

  const unassignSlot = useCallback((slotIdx: number, targetPlayerId?: PlayerId) => {
    const activeId = targetPlayerId || localPlayerId;
    setPlayers(prev => {
      return prev.map(p => {
        if (p.id !== activeId) return p;
        const newQueue = [...p.programmedQueue];
        newQueue[slotIdx] = null;
        return { ...p, programmedQueue: newQueue };
      });
    });
    sound.playClick();
  }, [localPlayerId]);

  // Lock in player hand & check if all players are ready
  const lockInPlanning = useCallback((targetPlayerId?: PlayerId) => {
    const pId = targetPlayerId || localPlayerId;

    setPlayers(prevPlayers => {
      let updated = prevPlayers.map(p => {
        if (p.id === pId) {
          return { ...p, isLocked: true };
        }
        return p;
      });

      // Broadcast queue to multiplayer network
      const targetPlayer = updated.find(p => p.id === pId);
      if (targetPlayer) {
        multiplayerService.sendMessage({
          type: 'LOCK_IN_QUEUE',
          senderPeerId: multiplayerService.peerId || '',
          senderPlayerId: pId,
          payload: { playerId: pId, programmedQueue: targetPlayer.programmedQueue },
        });
      }

      // Check if all non-eliminated players (or in single player, human + AIs) are locked
      const activePlayers = updated.filter(p => !p.isEliminated);
      const allHumansLocked = activePlayers.filter(p => !p.isAi).every(p => p.isLocked);

      if (allHumansLocked) {
        // Compute AI moves for any AI seats
        updated = updated.map(p => {
          if (p.isEliminated) return p;
          if (p.isAi) {
            const aiQueue = programAiTurn(p, updated, hexGrid);
            return { ...p, programmedQueue: aiQueue, isLocked: true };
          }
          return p;
        });

        setCurrentSlotIndex(0);
        setResolvingTurnOrder(0);
        setGamePhase('resolving');
        addLog(`Round ${round} Planning locked by all Commanders. Commencing execution!`, 'system');
      } else {
        addLog(`${targetPlayer?.name || pId} has locked in their tactical queue!`, 'system');
      }

      return updated;
    });

    sound.playClick();
  }, [localPlayerId, hexGrid, round, addLog]);

  // Network Sync Listener
  useEffect(() => {
    const unsubscribe = multiplayerService.onMessage((msg: NetworkMessage) => {
      if (msg.type === 'LOCK_IN_QUEUE' && msg.payload?.playerId) {
        const { playerId, programmedQueue } = msg.payload;
        setPlayers(prev => {
          let updated = prev.map(p => {
            if (p.id === playerId) {
              return { ...p, programmedQueue, isLocked: true };
            }
            return p;
          });

          // Check if everyone is now locked
          const activePlayers = updated.filter(p => !p.isEliminated);
          const allHumansLocked = activePlayers.filter(p => !p.isAi).every(p => p.isLocked);

          if (allHumansLocked && gamePhase === 'planning') {
            updated = updated.map(p => {
              if (p.isEliminated) return p;
              if (p.isAi) {
                const aiQueue = programAiTurn(p, updated, hexGrid);
                return { ...p, programmedQueue: aiQueue, isLocked: true };
              }
              return p;
            });

            setCurrentSlotIndex(0);
            setResolvingTurnOrder(0);
            setGamePhase('resolving');
            addLog(`All Commanders have locked in queues! Phase: Resolution`, 'system');
          }
          return updated;
        });
      } else if (msg.type === 'EMOTE' && msg.payload) {
        const { senderName, text } = msg.payload;
        addLog(`[Emote] ${senderName}: ${text}`, 'system');
        sound.playCardSelect();
      }
    });

    return () => unsubscribe();
  }, [hexGrid, gamePhase, addLog]);


  // Execute single resolution step for current active player in current slot
  const executeNextStep = useCallback(() => {
    if (gamePhase !== 'resolving') return;

    setPlayers(currentPlayers => {
      const activePlayers = currentPlayers.filter(p => !p.isEliminated);
      if (activePlayers.length <= 1) return currentPlayers;

      // Determine executing player based on priority index rotation
      const order = [];
      for (let i = 0; i < currentPlayers.length; i++) {
        order.push((priorityPlayerIdx + i) % currentPlayers.length);
      }

      const actingPlayerIdx = order[resolvingTurnOrder];
      const actor = currentPlayers[actingPlayerIdx];

      let updatedPlayers = [...currentPlayers];

      if (!actor.isEliminated) {
        const actionCard = actor.programmedQueue[currentSlotIndex];

        if (actionCard) {
          // Execute card effect
          if (actionCard.category === 'movement') {
            sound.playMove();
            let targetCoord = actor.coord;
            let targetFacing = actor.facing;

            if (actionCard.turnAmount) {
              targetFacing = rotateFacing(actor.facing, actionCard.turnAmount);
              updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, facing: targetFacing } : p);
              addLog(`${actor.name} played ${actionCard.name} and rotated facing.`, 'move', actor.id);
            } else {
              const moveType = actionCard.facingMoveType || 'forward';
              const res = getRelativeHex(actor.coord, actor.facing, moveType, actionCard.range);
              targetCoord = res.targetCoord;
              targetFacing = res.newFacing;

              // Check collision with another unit
              const occupantIdx = updatedPlayers.findIndex(p => !p.isEliminated && p.id !== actor.id && hexEquals(p.coord, targetCoord));
              
              if (occupantIdx !== -1) {
                // Collision bump! Both take 10 collision damage
                const occupant = updatedPlayers[occupantIdx];
                addLog(`COLLISION! ${actor.name} bumped into ${occupant.name}! Both take 10 collision damage.`, 'move', actor.id);
                
                updatedPlayers = updatedPlayers.map(p => {
                  if (p.id === actor.id || p.id === occupant.id) {
                    const newHp = Math.max(0, p.hp - 10);
                    return { ...p, hp: newHp, isEliminated: newHp === 0 };
                  }
                  return p;
                });
                sound.playHeavyHit();
              } else {
                // Move cleanly
                updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, coord: targetCoord, facing: targetFacing } : p);
                addLog(`${actor.name} played ${actionCard.name} and stepped to (${targetCoord.q}, ${targetCoord.r}).`, 'move', actor.id);

                // Check rune pickup
                const tile = hexGrid.find(t => hexEquals(t.coord, targetCoord));
                if (tile && tile.terrain === 'rune' && tile.runeEffect) {
                  if (tile.runeEffect === 'heal') {
                    updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, hp: Math.min(p.maxHp, p.hp + 20) } : p);
                    addLog(`${actor.name} triggered a Healing Rune! (+20 HP)`, 'rune', actor.id);
                    sound.playHeal();
                  } else if (tile.runeEffect === 'shield') {
                    updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, shield: p.shield + 20 } : p);
                    addLog(`${actor.name} picked up a Shield Rune! (+20 Shield)`, 'rune', actor.id);
                    sound.playShield();
                  }
                }
              }
            }

            setCurrentAnimation({
              actorId: actor.id,
              fromCoord: actor.coord,
              toCoord: targetCoord,
              actionName: actionCard.name,
              effectType: 'move',
            });
          } 
          else if (actionCard.category === 'attack') {
            const dmg = actionCard.damage || 20;
            const targetHexes = getFrontalTargetHexes(actor.coord, actor.facing, actionCard.facingAttackType || 'frontal', actionCard.range);

            const hitEnemies = updatedPlayers.filter(p => 
              p.id !== actor.id && !p.isEliminated && targetHexes.some(th => hexEquals(th, p.coord))
            );

            if (hitEnemies.length > 0) {
              hitEnemies.forEach(target => {
                const netDamage = Math.max(0, dmg - target.shield);
                const remShield = Math.max(0, target.shield - dmg);
                const newHp = Math.max(0, target.hp - netDamage);
                const isDead = newHp === 0;

                updatedPlayers = updatedPlayers.map(p => {
                  if (p.id === target.id) {
                    return { ...p, hp: newHp, shield: remShield, isEliminated: isDead };
                  }
                  if (p.id === actor.id) {
                    return { 
                      ...p, 
                      damageDealt: p.damageDealt + netDamage, 
                      kills: isDead ? p.kills + 1 : p.kills 
                    };
                  }
                  return p;
                });

                addLog(`${actor.name} struck ${target.name} for ${netDamage} damage!`, 'attack', actor.id);
                if (isDead) {
                  sound.playElimination();
                  addLog(`💀 ${target.name} WAS ELIMINATED!`, 'elimination', target.id);
                }
              });

              if (actionCard.type === 'fireball') sound.playFireball();
              else if (actionCard.type === 'heavy') sound.playHeavyHit();
              else sound.playSlash();

              setCurrentAnimation({
                actorId: actor.id,
                targetCoords: targetHexes,
                actionName: actionCard.name,
                effectType: 'attack',
                damageDealt: dmg,
              });
            } else {
              addLog(`${actor.name} used ${actionCard.name} towards facing, but no enemies were in range!`, 'attack', actor.id);
              setCurrentAnimation({
                actorId: actor.id,
                targetCoords: targetHexes,
                actionName: actionCard.name,
                effectType: 'miss',
              });
            }
          }
          else if (actionCard.category === 'defense') {
            if (actionCard.type === 'shield') {
              updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, shield: p.shield + (actionCard.shield || 30) } : p);
              addLog(`${actor.name} activated ${actionCard.name} (+30 Shield).`, 'defense', actor.id);
              sound.playShield();
            } else if (actionCard.type === 'counter') {
              updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, shield: p.shield + 15 } : p);
              addLog(`${actor.name} prepared a Riposte Counter-Strike.`, 'defense', actor.id);
              sound.playShield();
            }
          }
          else if (actionCard.category === 'utility') {
            if (actionCard.type === 'meditate') {
              updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, hp: Math.min(p.maxHp, p.hp + (actionCard.healAmount || 20)) } : p);
              addLog(`${actor.name} cast ${actionCard.name} and healed 20 HP.`, 'system', actor.id);
              sound.playHeal();
            }
          }
        }
      }

      // Check remaining alive players
      const remainingAlive = updatedPlayers.filter(p => !p.isEliminated);
      if (remainingAlive.length <= 1) {
        const champ = remainingAlive[0] || null;
        setWinner(champ);
        setGamePhase('gameover');
        if (champ) {
          sound.playVictory();
          addLog(`🏆 CHAMPION! ${champ.name} has defeated all rivals and won the match!`, 'system', champ.id);
        }
        return updatedPlayers;
      }

      // Step turn rotation
      const nextTurnOrder = resolvingTurnOrder + 1;
      if (nextTurnOrder >= currentPlayers.length) {
        // Current slot complete! Advance to next slot or end round
        const nextSlot = currentSlotIndex + 1;
        if (nextSlot >= 3) {
          // Round end! Refill hands, reset shields, rotate priority
          setRound(r => r + 1);
          setPriorityPlayerIdx(p => (p + 1) % currentPlayers.length);
          setCurrentSlotIndex(0);
          setResolvingTurnOrder(0);
          setGamePhase('planning');
          setIsAutoPlay(false);

          // Reset shields & draw cards
          updatedPlayers = updatedPlayers.map(p => {
            if (p.isEliminated) return p;

            // Remove played cards from hand
            const playedCardIds = p.programmedQueue.filter((c): c is Card => c !== null).map(c => c.id);
            let newHand = p.hand.filter(c => !playedCardIds.includes(c.id));
            let drawPile = [...p.drawPile];
            let discardPile = [...p.discardPile, ...p.hand.filter(c => playedCardIds.includes(c.id))];

            // Draw back to 5
            while (newHand.length < 5) {
              if (drawPile.length === 0) {
                drawPile = shuffleDeck(discardPile);
                discardPile = [];
              }
              if (drawPile.length === 0) break;
              newHand.push(drawPile.shift()!);
            }

            return {
              ...p,
              hand: newHand,
              drawPile,
              discardPile,
              shield: 0, // Reset shields at end of round
              programmedQueue: [null, null, null],
              isLocked: false,
            };
          });

          addLog(`--- Round ${round + 1} Planning Phase ---`, 'system');
        } else {
          setCurrentSlotIndex(nextSlot);
          setResolvingTurnOrder(0);
        }
      } else {
        setResolvingTurnOrder(nextTurnOrder);
      }

      return updatedPlayers;
    });
  }, [gamePhase, resolvingTurnOrder, currentSlotIndex, priorityPlayerIdx, round, hexGrid, addLog]);

  // Handle Auto-Play timer for resolution playback
  useEffect(() => {
    if (gamePhase === 'resolving' && isAutoPlay) {
      const intervalMs = playSpeed === 1 ? 1200 : playSpeed === 2 ? 650 : 320;
      autoPlayTimerRef.current = setTimeout(() => {
        executeNextStep();
      }, intervalMs);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [gamePhase, isAutoPlay, playSpeed, resolvingTurnOrder, currentSlotIndex, executeNextStep]);

  // Calculate 3-slot Projected Intent Trajectories
  const projectedIntents = useMemo(() => {
    const intents: ProjectedIntent[] = [];
    players.forEach(p => {
      if (p.isEliminated) return;
      let currCoord = p.coord;
      let currFacing = p.facing;

      p.programmedQueue.forEach((card, slotIdx) => {
        if (!card) return;

        let nextCoord = currCoord;
        let nextFacing = currFacing;
        let targetCoords: AxialCoord[] = [];

        if (card.category === 'movement') {
          if (card.turnAmount) {
            nextFacing = rotateFacing(currFacing, card.turnAmount);
            targetCoords = [nextCoord];
          } else {
            const res = getRelativeHex(currCoord, currFacing, card.facingMoveType || 'forward', card.range);
            nextCoord = res.targetCoord;
            nextFacing = res.newFacing;
            targetCoords = [nextCoord];
          }
        } else if (card.category === 'attack') {
          targetCoords = getFrontalTargetHexes(currCoord, currFacing, card.facingAttackType || 'frontal', card.range);
        } else {
          targetCoords = [currCoord];
        }

        intents.push({
          playerId: p.id,
          slotIndex: slotIdx,
          card,
          fromCoord: currCoord,
          fromFacing: currFacing,
          toCoord: nextCoord,
          toFacing: nextFacing,
          targetCoords,
          type: card.category,
        });

        currCoord = nextCoord;
        currFacing = nextFacing;
      });
    });
    return intents;
  }, [players]);

  return {
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
  };
}
