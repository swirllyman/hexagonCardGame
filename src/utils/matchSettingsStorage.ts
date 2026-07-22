import type { SetupPlayerOption } from '../state/useGameState';

const STORAGE_KEY_PLAYERS = 'hex_clash_match_setup_players';
const STORAGE_KEY_ACTIONS = 'hex_clash_match_setup_actions_per_round';

export const DEFAULT_LOCAL_PLAYERS: SetupPlayerOption[] = [
  { id: 'player1', name: 'Commander Valerius', isAi: false, aiDifficulty: 'medium', teamId: 1, avatarUrl: 'sprites/portrait_valerius.svg' },
  { id: 'player2', name: 'Bot Kaelen', isAi: true, aiDifficulty: 'medium', teamId: 2, avatarUrl: 'sprites/portrait_kaelen.svg' },
  { id: 'player3', name: 'Bot Seraphina', isAi: true, aiDifficulty: 'medium', teamId: 3, avatarUrl: 'sprites/portrait_seraphina.svg' },
  { id: 'player4', name: 'Bot Ignis', isAi: true, aiDifficulty: 'medium', teamId: 4, avatarUrl: 'sprites/portrait_ignis.svg' },
];

export const loadSavedMatchPlayers = (): SetupPlayerOption[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (!saved) return DEFAULT_LOCAL_PLAYERS;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed.map((p, idx) => ({
        id: p.id || DEFAULT_LOCAL_PLAYERS[idx].id,
        name: typeof p.name === 'string' && p.name.trim() ? p.name : DEFAULT_LOCAL_PLAYERS[idx].name,
        isAi: typeof p.isAi === 'boolean' ? p.isAi : DEFAULT_LOCAL_PLAYERS[idx].isAi,
        aiDifficulty: ['easy', 'medium', 'hard'].includes(p.aiDifficulty) ? p.aiDifficulty : 'medium',
        teamId: typeof p.teamId === 'number' && p.teamId >= 1 && p.teamId <= 4 ? p.teamId : (idx + 1),
        avatarUrl: p.avatarUrl || DEFAULT_LOCAL_PLAYERS[idx].avatarUrl,
      }));
    }
  } catch (err) {
    console.error('Failed to load saved match players:', err);
  }
  return DEFAULT_LOCAL_PLAYERS;
};

export const saveMatchPlayers = (players: SetupPlayerOption[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  } catch (err) {
    console.error('Failed to save match players:', err);
  }
};

export const loadSavedActionsPerRound = (): number => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIONS);
    if (saved) {
      const val = parseInt(saved, 10);
      if ([3, 5, 10].includes(val)) return val;
    }
  } catch (err) {
    console.error('Failed to load saved actions per round:', err);
  }
  return 3;
};

export const saveActionsPerRound = (actions: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIONS, actions.toString());
  } catch (err) {
    console.error('Failed to save actions per round:', err);
  }
};
