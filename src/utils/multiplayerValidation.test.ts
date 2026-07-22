import { generateHexGrid, getStartingPositions } from './hexGrid';
import { programAiTurn } from './aiEngine';
import type { PlayerState, NetworkMessage, GamePhase } from '../types/game';
import type { SetupPlayerOption } from '../state/useGameState';

/**
 * Validation Suite for Multiplayer State Synchronization & Bot Takeover
 */
export function runMultiplayerValidationTests() {
  console.log('--- Running Multiplayer Validation & Bot Takeover Tests ---');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testsFailed++;
    }
  }

  // 1. Setup Mock Match
  const grid = generateHexGrid(3);
  const startPos = getStartingPositions(3);

  const mockSetup: SetupPlayerOption[] = [
    { id: 'player1', name: 'Host Valerius', isAi: false, aiDifficulty: 'medium', teamId: 1, peerId: 'peer_host_123' },
    { id: 'player2', name: 'Client Kaelen', isAi: false, aiDifficulty: 'medium', teamId: 2, peerId: 'peer_client_456' },
    { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium', teamId: 3 },
    { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium', teamId: 4 },
  ];

  let players: PlayerState[] = mockSetup.map((opt) => ({
    id: opt.id,
    name: opt.name,
    isAi: opt.isAi,
    aiDifficulty: opt.aiDifficulty,
    faction: opt.id === 'player1' ? 'crimson' : opt.id === 'player2' ? 'azure' : opt.id === 'player3' ? 'emerald' : 'amber',
    teamId: opt.teamId || 1,
    peerId: opt.peerId,
    hp: 100,
    maxHp: 100,
    shield: 0,
    coord: startPos[opt.id].coord,
    facing: startPos[opt.id].facing,
    hand: [],
    drawPile: [],
    discardPile: [],
    programmedQueue: [null, null, null],
    isLocked: false,
    isEliminated: false,
    kills: 0,
    damageDealt: 0,
  }));

  // Test 1: START_GAME message serialization
  const startGameMsg: NetworkMessage = {
    type: 'START_GAME',
    senderPeerId: 'peer_host_123',
    payload: {
      players,
      hexGrid: grid,
      actionsPerRound: 3,
      gamePhase: 'planning',
    },
  };

  assert(startGameMsg.payload.players.length === 4, 'START_GAME contains 4 players');
  assert(startGameMsg.payload.players[1].peerId === 'peer_client_456', 'Client peerId preserved in START_GAME');

  // Test 2: Host locks in queue, Client locks in queue
  players[0].isLocked = true; // Host locked
  assert(players[0].isLocked === true, 'Host player locked in queue');

  // Check all humans locked condition when Client is still unlocked
  let aliveHumans = players.filter((p) => !p.isEliminated && !p.isAi);
  let allHumansLocked = aliveHumans.every((p) => p.isLocked);
  assert(allHumansLocked === false, 'Not all humans locked when Client is unlocked');

  // Test 3: Player 2 Disconnects (Peer Drop Edge Case)
  const disconnectedPeerId = 'peer_client_456';
  console.log(`Simulating disconnect for peerId: ${disconnectedPeerId}...`);

  players = players.map((p) => {
    if (p.peerId === disconnectedPeerId) {
      return {
        ...p,
        isAi: true, // Bot takeover!
        peerId: undefined,
        name: `Bot ${p.name.replace(/^Commander\s+/, '')}`,
      };
    }
    return p;
  });

  assert(players[1].isAi === true, 'Disconnected player converted to AI bot');
  assert(players[1].peerId === undefined, 'Disconnected player peerId cleared');
  assert(players[1].name.includes('Bot'), 'Disconnected player renamed to Bot');

  // Test 4: Re-evaluate lock-in state after disconnect
  aliveHumans = players.filter((p) => !p.isEliminated && !p.isAi);
  allHumansLocked = aliveHumans.length === 0 || aliveHumans.every((p) => p.isLocked);
  assert(allHumansLocked === true, 'All remaining human players are now locked after bot takeover!');

  // Test 5: Bot turn auto-programming for takeover bot
  if (allHumansLocked) {
    players = players.map((p) => {
      if (p.isAi && !p.isEliminated) {
        const aiQueue = programAiTurn(p, players, grid);
        return { ...p, programmedQueue: aiQueue, isLocked: true };
      }
      return p;
    });
  }

  assert(players[1].programmedQueue.every((c) => c !== null), 'Takeover bot successfully programmed 3 action cards');

  // Test 6: SYNC_GAME_STATE payload completeness
  const syncStateMsg: NetworkMessage = {
    type: 'SYNC_GAME_STATE',
    senderPeerId: 'peer_host_123',
    payload: {
      players,
      hexGrid: grid,
      currentSlotIndex: 0,
      resolvingTurnOrder: 0,
      gamePhase: 'resolving' as GamePhase,
      round: 1,
      priorityPlayerIdx: 0,
      previousPlayedCard: null,
      roundStartStates: { player1: { coord: { q: 0, r: 0 }, facing: 0 } },
    },
  };

  assert(syncStateMsg.payload.priorityPlayerIdx !== undefined, 'SYNC_GAME_STATE contains priorityPlayerIdx');
  assert(syncStateMsg.payload.roundStartStates !== undefined, 'SYNC_GAME_STATE contains roundStartStates');

  console.log(`--- Validation Complete: ${testsPassed} passed, ${testsFailed} failed ---`);
  return testsFailed === 0;
}
