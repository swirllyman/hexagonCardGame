export type PlayerId = 'player1' | 'player2' | 'player3' | 'player4';

export interface AxialCoord {
  q: number; // Column
  r: number; // Row
}

export type FactionId = 'crimson' | 'azure' | 'emerald' | 'amber';

export interface FactionConfig {
  id: FactionId;
  name: string;
  colorHex: string;
  glowColor: string;
  bgGradient: string;
  borderClass: string;
  textClass: string;
  avatarIcon: string;
}

export type CardCategory = 'movement' | 'attack' | 'defense' | 'utility';

export type CardType = 
  | 'move1' 
  | 'move2' 
  | 'sidestep' 
  | 'pivot_left'
  | 'pivot_right'
  | 'backstep'
  | 'melee' 
  | 'heavy' 
  | 'fireball' 
  | 'whirlwind' 
  | 'shield' 
  | 'push' 
  | 'teleport' 
  | 'counter' 
  | 'meditate';

export type FacingMoveType = 
  | 'forward' 
  | 'sprint' 
  | 'sidestep_left' 
  | 'sidestep_right' 
  | 'backstep' 
  | 'pivot_left' 
  | 'pivot_right' 
  | 'about_face';

export type FacingAttackType = 'frontal' | 'cleave_arc' | 'line' | 'aoe';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  category: CardCategory;
  range: number;
  damage?: number;
  shield?: number;
  pushDist?: number;
  healAmount?: number;
  iconName: string;
  spriteUrl?: string;
  facingMoveType?: FacingMoveType;
  facingAttackType?: FacingAttackType;
  turnAmount?: number; // -1 for turn left 60, +1 for turn right 60, +3 for 180
}

export interface ProjectedIntent {
  playerId: PlayerId;
  slotIndex: number;
  card: Card;
  fromCoord: AxialCoord;
  fromFacing: number;
  toCoord: AxialCoord;
  toFacing: number;
  targetCoords: AxialCoord[];
  type: CardCategory;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  faction: FactionId;
  hp: number;
  maxHp: number;
  shield: number;
  coord: AxialCoord;
  facing: number; // 0 to 5 hex directions
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  programmedQueue: (Card | null)[];
  isLocked: boolean;
  isEliminated: boolean;
  kills: number;
  damageDealt: number;
}

export type TerrainType = 'flat' | 'obstacle' | 'rune';

export interface HexTile {
  coord: AxialCoord;
  terrain: TerrainType;
  runeEffect?: 'heal' | 'shield' | 'attackBoost';
}

export type GamePhase = 'setup' | 'planning' | 'resolving' | 'gameover';

export interface BattleLogEntry {
  id: string;
  timestamp: string;
  round: number;
  slot?: number;
  text: string;
  type: 'move' | 'attack' | 'defense' | 'elimination' | 'system' | 'rune';
  playerId?: PlayerId;
}

export interface StepAnimationState {
  actorId: PlayerId;
  fromCoord?: AxialCoord;
  toCoord?: AxialCoord;
  targetCoords?: AxialCoord[];
  actionName: string;
  effectType: 'move' | 'attack' | 'shield' | 'push' | 'heal' | 'miss' | 'collision';
  damageDealt?: number;
}

export type MultiplayerRole = 'single' | 'host' | 'client';

export interface MultiplayerSeat {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  peerId?: string;
  isReady?: boolean;
}

export interface ConnectedPeer {
  peerId: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
  assignedSeatId?: PlayerId | null;
}

export type EmoteType = 'swords' | 'shield' | 'fire' | 'skull' | 'laugh' | 'gg' | 'target';

export interface EmotePayload {
  id: string;
  senderId: PlayerId;
  senderName: string;
  emote: EmoteType;
  text: string;
  timestamp: number;
}

export type NetworkMessageType =
  | 'LOBBY_STATE'
  | 'CLAIM_SEAT'
  | 'RELEASE_SEAT'
  | 'UPDATE_PLAYER_INFO'
  | 'START_GAME'
  | 'LOCK_IN_QUEUE'
  | 'EMOTE'
  | 'SYNC_GAME_STATE'
  | 'STEP_EXECUTE';

export interface NetworkMessage {
  type: NetworkMessageType;
  senderPeerId: string;
  senderPlayerId?: PlayerId;
  payload: any;
}

