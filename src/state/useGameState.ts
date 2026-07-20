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
  getFrontalTargetHexes,
  normalizeFacing,
  hexNeighborInDir,
} from '../utils/hexGrid';
import { createStandardPlayerDeck, shuffleDeck, DEFAULT_MOVE_CARDS } from '../utils/cardsData';
import { programAiTurn } from '../utils/aiEngine';
import { sound } from '../utils/sound';
import { multiplayerService } from '../services/multiplayerService';

export interface SetupPlayerOption {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  avatarUrl?: string;
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
  const [actionsPerRound, setActionsPerRound] = useState<number>(3);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [priorityPlayerIdx, setPriorityPlayerIdx] = useState<number>(0);
  const [resolvingTurnOrder, setResolvingTurnOrder] = useState<number>(0);

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [roundStartStates, setRoundStartStates] = useState<Record<PlayerId, { coord: AxialCoord; facing: number }>>({} as Record<PlayerId, { coord: AxialCoord; facing: number }>);
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
  const initGame = useCallback((setupOptions: SetupPlayerOption[], actionsCount: number = 3) => {
    const grid = generateHexGrid(4);
    setHexGrid(grid);
    setActionsPerRound(actionsCount);

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
        avatarUrl: opt.avatarUrl,
        hp: 100,
        maxHp: 100,
        shield: 0,
        coord: startPos[opt.id].coord,
        facing: startPos[opt.id].facing,
        roundStartCoord: startPos[opt.id].coord,
        roundStartFacing: startPos[opt.id].facing,
        hand,
        drawPile,
        discardPile: [],
        programmedQueue: Array(actionsCount).fill(null),
        isLocked: false,
        isEliminated: false,
        kills: 0,
        damageDealt: 0,
      };
    });

    const initialStates = setupOptions.reduce((acc, opt) => {
      acc[opt.id] = { coord: startPos[opt.id].coord, facing: startPos[opt.id].facing };
      return acc;
    }, {} as Record<PlayerId, { coord: AxialCoord; facing: number }>);
    setRoundStartStates(initialStates);

    setPlayers(initialPlayers);
    setRound(1);
    setCurrentSlotIndex(0);
    setPriorityPlayerIdx(0);
    setResolvingTurnOrder(0);
    setWinner(null);
    setSelectedHandCard(null);
    setBattleLog([]);
    setGamePhase('planning');

    addLog(`Match Started! 4 Commanders enter the arena with ${actionsCount} actions per round.`, 'system');

    // Broadcast game start if Host
    if (multiplayerService.isHost) {
      multiplayerService.sendMessage({
        type: 'START_GAME',
        senderPeerId: multiplayerService.peerId || '',
        payload: {
          players: initialPlayers,
          hexGrid: grid,
          round: 1,
          actionsPerRound: actionsCount,
          gamePhase: 'planning',
        },
      });
    }
  }, [addLog]);

  const [localPlayerId, setLocalPlayerId] = useState<PlayerId>('player1');

  // Select card from active local player hand for programming
  const assignCardToSlot = useCallback((slotIdx: number, card: Card, targetPlayerId?: PlayerId) => {
    const activeId = targetPlayerId || localPlayerId;
    setPlayers(prev => {
      return prev.map(p => {
        if (p.id !== activeId) return p;

        const newQueue = [...p.programmedQueue];

        // Check if card is a basic Move Card (not from ability hand)
        const isMoveCard = DEFAULT_MOVE_CARDS.some(mc => mc.id === card.id || mc.type === card.type) && !p.hand.some(hc => hc.id === card.id);

        if (!isMoveCard) {
          // Ability card: move from previous slot if already queued
          const existingIdx = newQueue.findIndex(c => c?.id === card.id);
          if (existingIdx !== -1) {
            newQueue[existingIdx] = null;
          }
          newQueue[slotIdx] = card;
        } else {
          // Persistent Move Card: assign a unique copy to slot
          const cardCopy: Card = {
            ...card,
            id: `${card.type}-slot-${slotIdx}-${Math.random().toString(36).substring(2, 7)}`,
          };
          newQueue[slotIdx] = cardCopy;
        }

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
        setIsAutoPlay(true);
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
      if (msg.type === 'START_GAME' && msg.payload) {
        const { players: remotePlayers, hexGrid: remoteHexGrid, actionsPerRound: remoteActions } = msg.payload;
        if (remotePlayers && remoteHexGrid) {
          const actionsCount = remoteActions || 3;
          const sanitizedPlayers = remotePlayers.map((rp: PlayerState) => ({
            ...rp,
            roundStartCoord: rp.roundStartCoord || rp.coord,
            roundStartFacing: rp.roundStartFacing !== undefined ? rp.roundStartFacing : rp.facing,
          }));
          const initialStates = remotePlayers.reduce((acc: any, rp: PlayerState) => {
            acc[rp.id] = { coord: rp.coord, facing: rp.facing };
            return acc;
          }, {} as Record<PlayerId, { coord: AxialCoord; facing: number }>);
          setRoundStartStates(initialStates);
          setActionsPerRound(actionsCount);
          setHexGrid(remoteHexGrid);
          setPlayers(sanitizedPlayers);
          setRound(1);
          setCurrentSlotIndex(0);
          setPriorityPlayerIdx(0);
          setResolvingTurnOrder(0);
          setWinner(null);
          setSelectedHandCard(null);
          setBattleLog([]);
          setGamePhase('planning');
          addLog(`Match Started! 4 Commanders enter the arena with ${actionsCount} actions per round.`, 'system');
        }
      } else if (msg.type === 'LOCK_IN_QUEUE' && msg.payload?.playerId) {
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
            setIsAutoPlay(true);
            addLog(`All Commanders have locked in queues! Phase: Resolution`, 'system');
          }
          return updated;
        });
      } else if (msg.type === 'SYNC_GAME_STATE' && msg.payload) {
        const {
          players: rPlayers,
          hexGrid: rHexGrid,
          currentSlotIndex: rSlot,
          resolvingTurnOrder: rTurnOrder,
          gamePhase: rPhase,
          currentAnimation: rAnim,
          battleLog: rLog,
          round: rRound,
          winner: rWinner,
        } = msg.payload;

        if (rPlayers) setPlayers(rPlayers);
        if (rHexGrid) setHexGrid(rHexGrid);
        if (rSlot !== undefined) setCurrentSlotIndex(rSlot);
        if (rTurnOrder !== undefined) setResolvingTurnOrder(rTurnOrder);
        if (rPhase) setGamePhase(rPhase);
        if (rAnim !== undefined) setCurrentAnimation(rAnim);
        if (rLog) setBattleLog(rLog);
        if (rRound !== undefined) setRound(rRound);
        if (rWinner !== undefined) setWinner(rWinner);
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

              const isTargetOnGrid = hexGrid.length === 0 || hexGrid.some(t => hexEquals(t.coord, targetCoord));

              if (!isTargetOnGrid) {
                // Boundary wall hit! Movement blocked
                addLog(`WALL BLOCK! ${actor.name}'s movement was blocked by the arena boundary wall!`, 'move', actor.id);
                targetCoord = actor.coord;
                updatedPlayers = updatedPlayers.map(p => p.id === actor.id ? { ...p, facing: targetFacing } : p);
              } else {
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
                }

                // Check rune pickup (if on grid and valid)
                const tileIdx = hexGrid.findIndex(t => hexEquals(t.coord, targetCoord));
                if (tileIdx !== -1) {
                  const tile = hexGrid[tileIdx];
                  if (tile.terrain === 'rune' && tile.runeEffect && (!tile.runeCooldown || tile.runeCooldown === 0)) {
                    const maxCd = tile.maxRuneCooldown || 3;
                    setHexGrid(prevGrid => prevGrid.map((t, idx) => idx === tileIdx ? { ...t, runeCooldown: maxCd } : t));

                    if (tile.runeEffect === 'attackBoost') {
                      const buffId = `attackBoost_${Date.now()}`;
                      updatedPlayers = updatedPlayers.map(p => {
                        if (p.id !== actor.id) return p;
                        const filtered = (p.buffs || []).filter(b => b.type !== 'attackBoost');
                        return {
                          ...p,
                          buffs: [...filtered, { id: buffId, type: 'attackBoost', name: 'Empowered (+10 DMG)', duration: 2, value: 10 }]
                        };
                      });
                      addLog(`🔥 ${actor.name} picked up an Empower Rune! (+10 Attack Damage for 2 rounds)`, 'rune', actor.id);
                      sound.playFireball();
                    } else if (tile.runeEffect === 'heal') {
                      const buffId = `healRegen_${Date.now()}`;
                      updatedPlayers = updatedPlayers.map(p => {
                        if (p.id !== actor.id) return p;
                        const filtered = (p.buffs || []).filter(b => b.type !== 'healRegen');
                        return {
                          ...p,
                          hp: Math.min(p.maxHp, p.hp + 15),
                          buffs: [...filtered, { id: buffId, type: 'healRegen', name: 'Vitality (+5 HP Regen)', duration: 2, value: 5 }]
                        };
                      });
                      addLog(`💚 ${actor.name} picked up a Vitality Rune! (+15 HP & +5 HP/round for 2 rounds)`, 'rune', actor.id);
                      sound.playHeal();
                    } else if (tile.runeEffect === 'shield') {
                      const buffId = `shield_${Date.now()}`;
                      updatedPlayers = updatedPlayers.map(p => {
                        if (p.id !== actor.id) return p;
                        const filtered = (p.buffs || []).filter(b => b.type !== 'shield');
                        return {
                          ...p,
                          shield: p.shield + 15,
                          buffs: [...filtered, { id: buffId, type: 'shield', name: 'Fortified (+5 Shield)', duration: 2, value: 5 }]
                        };
                      });
                      addLog(`🛡️ ${actor.name} picked up a Shield Rune! (+15 Shield & +5 Shield/round for 2 rounds)`, 'rune', actor.id);
                      sound.playShield();
                    }
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
            const baseDmg = actionCard.damage || 20;
            const attackBuff = actor.buffs?.find(b => b.type === 'attackBoost');
            const bonusDmg = attackBuff ? attackBuff.value : 0;
            const dmg = baseDmg + bonusDmg;

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

                addLog(`${actor.name} struck ${target.name} with ${actionCard.name} for ${netDamage} damage!${bonusDmg > 0 ? ' (+10 Empowered DMG)' : ''}`, 'attack', actor.id);
                
                // Add knockback logic for attacks with pushDist!
                if (actionCard.pushDist && actionCard.pushDist > 0 && !isDead) {
                  const pushDist = actionCard.pushDist;
                  const pushDir = normalizeFacing(actor.facing);
                  let currCoord = target.coord;
                  let collided = false;
                  
                  for (let step = 0; step < pushDist; step++) {
                    const nextCoord = hexNeighborInDir(currCoord, pushDir);
                    const isOnGrid = hexGrid.length === 0 || hexGrid.some(t => hexEquals(t.coord, nextCoord) && t.terrain !== 'obstacle');
                    const isOccupied = updatedPlayers.some(p => !p.isEliminated && hexEquals(p.coord, nextCoord));
                    
                    if (!isOnGrid || isOccupied) {
                      collided = true;
                      break;
                    }
                    currCoord = nextCoord;
                  }
                  
                  updatedPlayers = updatedPlayers.map(p => {
                    if (p.id === target.id) {
                      const finalHp = collided ? Math.max(0, p.hp - 10) : p.hp;
                      return { 
                        ...p, 
                        coord: currCoord, 
                        hp: finalHp, 
                        isEliminated: finalHp === 0 
                      };
                    }
                    return p;
                  });
                  
                  if (collided) {
                    addLog(`${target.name} was knocked back by ${actionCard.name} and collided! Taking 10 extra collision damage.`, 'move', actor.id);
                  } else {
                    addLog(`${target.name} was knocked back 1 hex by ${actionCard.name}.`, 'move', actor.id);
                  }
                }

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
            } else if (actionCard.type === 'push') {
              const pushDist = actionCard.pushDist || 2;
              const pushDir = normalizeFacing(actor.facing);
              const targetHexes = getFrontalTargetHexes(actor.coord, actor.facing, 'frontal', actionCard.range || 1);
              
              const hitEnemies = updatedPlayers.filter(p => 
                p.id !== actor.id && !p.isEliminated && targetHexes.some(th => hexEquals(th, p.coord))
              );

              if (hitEnemies.length > 0) {
                hitEnemies.forEach(target => {
                  let currCoord = target.coord;
                  let collided = false;
                  
                  for (let step = 0; step < pushDist; step++) {
                    const nextCoord = hexNeighborInDir(currCoord, pushDir);
                    const isOnGrid = hexGrid.length === 0 || hexGrid.some(t => hexEquals(t.coord, nextCoord) && t.terrain !== 'obstacle');
                    const isOccupied = updatedPlayers.some(p => !p.isEliminated && hexEquals(p.coord, nextCoord));
                    
                    if (!isOnGrid || isOccupied) {
                      collided = true;
                      break;
                    }
                    currCoord = nextCoord;
                  }
                  
                  const targetId = target.id;
                  updatedPlayers = updatedPlayers.map(p => {
                    if (p.id === targetId) {
                      const finalHp = collided ? Math.max(0, p.hp - 10) : p.hp;
                      return { 
                        ...p, 
                        coord: currCoord, 
                        hp: finalHp, 
                        isEliminated: finalHp === 0 
                      };
                    }
                    return p;
                  });
                  
                  if (collided) {
                    addLog(`${actor.name} pushed ${target.name} back with ${actionCard.name}, colliding with a barrier or unit! ${target.name} takes 10 collision damage.`, 'move', actor.id);
                  } else {
                    addLog(`${actor.name} pushed ${target.name} back ${pushDist} hexes with ${actionCard.name}.`, 'move', actor.id);
                  }
                });
                
                sound.playHeavyHit();
                
                setCurrentAnimation({
                  actorId: actor.id,
                  targetCoords: targetHexes,
                  actionName: actionCard.name,
                  effectType: 'push',
                });
              } else {
                addLog(`${actor.name} cast ${actionCard.name}, but no enemies were in range to push!`, 'system', actor.id);
                setCurrentAnimation({
                  actorId: actor.id,
                  targetCoords: targetHexes,
                  actionName: actionCard.name,
                  effectType: 'miss',
                });
              }
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
        if (nextSlot >= actionsPerRound) {
          // Round end! Refill hands, reset shields, rotate priority, decrease pickup cooldowns & process player buff ticks
          setRound(r => r + 1);
          setPriorityPlayerIdx(p => (p + 1) % currentPlayers.length);
          setCurrentSlotIndex(0);
          setResolvingTurnOrder(0);
          setGamePhase('planning');
          setIsAutoPlay(false);

          // Decrement pickup cooldowns on map tiles
          setHexGrid(prevGrid => prevGrid.map(t => {
            if (t.terrain === 'rune' && t.runeCooldown && t.runeCooldown > 0) {
              const nextCd = t.runeCooldown - 1;
              if (nextCd === 0) {
                const runeName = t.runeEffect === 'attackBoost' ? 'Empower' : t.runeEffect === 'shield' ? 'Shield' : 'Vitality';
                addLog(`✨ A ${runeName} Rune pickup has respawned!`, 'rune');
              }
              return { ...t, runeCooldown: nextCd };
            }
            return t;
          }));

          // Reset shields, draw cards, & process temporary player buff ticks
          updatedPlayers = updatedPlayers.map(p => {
            if (p.isEliminated) return p;

            // Process active player buff ticks & duration decay
            let currentHp = p.hp;
            let currentShield = 0; // Reset shields at end of round, then apply Fortified buff
            const remainingBuffs: PlayerState['buffs'] = [];

            (p.buffs || []).forEach(buff => {
              if (buff.type === 'healRegen') {
                currentHp = Math.min(p.maxHp, currentHp + buff.value);
                addLog(`💚 ${p.name} regenerated ${buff.value} HP from Vitality buff!`, 'rune', p.id);
              } else if (buff.type === 'shield') {
                currentShield = currentShield + buff.value;
                addLog(`🛡️ ${p.name} gained ${buff.value} Shield from Fortified buff!`, 'rune', p.id);
              }

              if (buff.duration > 1) {
                remainingBuffs.push({ ...buff, duration: buff.duration - 1 });
              } else {
                addLog(`⌛ ${p.name}'s ${buff.name} buff expired.`, 'system', p.id);
              }
            });

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
              hp: currentHp,
              hand: newHand,
              drawPile,
              discardPile,
              shield: currentShield,
              buffs: remainingBuffs,
              roundStartCoord: p.coord,
              roundStartFacing: p.facing,
              programmedQueue: Array(actionsPerRound).fill(null),
              isLocked: false,
            };
          });

          const nextRoundStates = updatedPlayers.reduce((acc, p) => {
            acc[p.id] = { coord: p.coord, facing: p.facing };
            return acc;
          }, {} as Record<PlayerId, { coord: AxialCoord; facing: number }>);
          setRoundStartStates(nextRoundStates);

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
    const isClient = !!multiplayerService.roomCode && !multiplayerService.isHost;
    if (gamePhase === 'resolving' && isAutoPlay && !isClient) {
      const intervalMs = playSpeed === 1 ? 1200 : playSpeed === 2 ? 650 : 320;
      autoPlayTimerRef.current = setTimeout(() => {
        executeNextStep();
      }, intervalMs);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [gamePhase, isAutoPlay, playSpeed, resolvingTurnOrder, currentSlotIndex, executeNextStep]);

  // Host state synchronization broadcast
  useEffect(() => {
    if (multiplayerService.isHost && gamePhase === 'resolving') {
      multiplayerService.sendMessage({
        type: 'SYNC_GAME_STATE',
        senderPeerId: multiplayerService.peerId || '',
        payload: {
          players,
          hexGrid,
          currentSlotIndex,
          resolvingTurnOrder,
          gamePhase,
          currentAnimation,
          battleLog,
          round,
          winner,
        }
      });
    }
  }, [players, hexGrid, currentSlotIndex, resolvingTurnOrder, gamePhase, currentAnimation, battleLog, round, winner]);

  // Calculate 3-slot Projected Intent Trajectories
  const projectedIntents = useMemo(() => {
    const intents: ProjectedIntent[] = [];
    players.forEach(p => {
      if (p.isEliminated) return;

      // Hide intent of other players during planning phase
      if (gamePhase === 'planning' && p.id !== localPlayerId) {
        return;
      }

      const startState = roundStartStates[p.id];
      let currCoord = startState ? startState.coord : (p.roundStartCoord || p.coord);
      let currFacing = startState ? startState.facing : (p.roundStartFacing !== undefined ? p.roundStartFacing : p.facing);

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
            const isTargetOnGrid = hexGrid.length === 0 || hexGrid.some(t => hexEquals(t.coord, res.targetCoord));
            nextCoord = isTargetOnGrid ? res.targetCoord : currCoord;
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
  }, [players, hexGrid, roundStartStates, gamePhase, localPlayerId]);

  return {
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
