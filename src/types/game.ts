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
  | 'about_face'
  | 'backstep'
  | 'attack'
  | 'melee' 
  | 'heavy' 
  | 'fireball' 
  | 'whirlwind' 
  | 'shield' 
  | 'push' 
  | 'teleport' 
  | 'counter' 
  | 'meditate'
  | 'thunder'
  | 'iron_wall'
  | 'frost_nova'
  | 'vampiric'
  // 20 Ability Cards
  | 'scorpion_pull'
  | 'hook_shot'
  | 'gravitational_surge'
  | 'swap_strike'
  | 'repulsion_blast'
  | 'chain_lightning'
  | 'blasphemous_burst'
  | 'supernova'
  | 'seismic_slam'
  | 'blade_storm'
  | 'parry_dash'
  | 'reflection_barrier'
  | 'sanctuary'
  | 'spectral_shield'
  | 'bounty_hunter'
  | 'berserk_fury'
  | 'overcharge'
  | 'shadow_cloak'
  | 'titan_fortitude'
  | 'blood_pact'
  // 10 Anti-Bump & Unyielding Abilities
  | 'anchor_stance'
  | 'juggernaut_aura'
  | 'iron_roots'
  | 'spiked_bulwark'
  | 'immovable_wall'
  | 'shockwave_repel'
  | 'counter_bump'
  | 'kinetic_absorber'
  | 'stone_footing'
  | 'unyielding_bastion'
  // 10 Advanced Movement Abilities
  | 'dash_forward'
  | 'sidestep_evasion'
  | 'ghost_strafe'
  | 'backflip_vault'
  | 'shadow_step'
  | 'phase_blink'
  | 'bulwark_charge'
  | 'tumble_roll'
  | 'sky_vault'
  | 'warp_leap';

export type FacingMoveType = 
  | 'forward' 
  | 'sprint' 
  | 'sidestep_left' 
  | 'sidestep_right' 
  | 'backstep' 
  | 'pivot_left' 
  | 'pivot_right' 
  | 'about_face'
  | 'teleport_nearest'
  | 'phase_step'
  | 'roll_flip';

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
  pullDist?: number;
  healAmount?: number;
  buffType?: 'attackBoost' | 'shield' | 'healRegen' | 'unyielding';
  buffDuration?: number;
  buffValue?: number;
  isUnyieldingSlot?: boolean; // Instant 1-turn unyielding for current turn slot
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

export interface PlayerBuff {
  id: string;
  type: 'attackBoost' | 'shield' | 'healRegen' | 'unyielding';
  name: string;
  duration: number; // turns remaining
  value: number;
}

export interface TeamConfig {
  id: number;
  name: string;
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  ringClass: string;
}

export const TEAMS: Record<number, TeamConfig> = {
  1: {
    id: 1,
    name: 'Team 1',
    colorHex: '#ef4444',
    bgClass: 'bg-rose-950/40',
    borderClass: 'border-rose-500',
    textClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    ringClass: 'ring-rose-500',
  },
  2: {
    id: 2,
    name: 'Team 2',
    colorHex: '#38bdf8',
    bgClass: 'bg-sky-950/40',
    borderClass: 'border-sky-500',
    textClass: 'text-sky-400',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
    ringClass: 'ring-sky-500',
  },
  3: {
    id: 3,
    name: 'Team 3',
    colorHex: '#34d399',
    bgClass: 'bg-emerald-950/40',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    ringClass: 'ring-emerald-500',
  },
  4: {
    id: 4,
    name: 'Team 4',
    colorHex: '#fbbf24',
    bgClass: 'bg-amber-950/40',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    ringClass: 'ring-amber-500',
  },
};

export type CardAnimStage = 'idle' | 'playing_turn';

export interface PlayedCardRecord {
  player: PlayerState;
  card: Card | null;
  slotIndex: number;
  stepNumber: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  faction: FactionId;
  teamId: number;
  avatarUrl?: string;
  peerId?: string;
  hp: number;
  maxHp: number;
  shield: number;
  coord: AxialCoord;
  facing: number; // 0 to 5 hex directions
  roundStartCoord?: AxialCoord;
  roundStartFacing?: number;
  hand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  programmedQueue: (Card | null)[];
  isLocked: boolean;
  isEliminated: boolean;
  kills: number;
  damageDealt: number;
  buffs?: PlayerBuff[];
}

export type TerrainType = 'flat' | 'obstacle' | 'rune' | 'hill';

export interface HexTile {
  coord: AxialCoord;
  terrain: TerrainType;
  runeEffect?: 'heal' | 'shield' | 'attackBoost';
  runeCooldown?: number;
  maxRuneCooldown?: number;
  hillController?: PlayerId | null;
  hillProgress?: { playerId: PlayerId; turnsCount: number; lastSlotProcessed?: number } | null;
  isBloody?: boolean;
  bloodSeed?: number;
}

export interface BloodBurst {
  id: string;
  coord: AxialCoord;
  createdAt: number;
}

export type GamePhase = 'setup' | 'planning' | 'resolving' | 'ended' | 'gameover';

export interface BattleLogEntry {
  id: string;
  timestamp: string;
  round: number;
  slot?: number;
  text: string;
  type: 'move' | 'attack' | 'defense' | 'elimination' | 'system' | 'rune' | 'hill';
  playerId?: PlayerId;
}

export type LineStyle = 'beam' | 'lightning' | 'chain' | 'dash_stream' | 'cleave_arc' | 'siphon' | 'shockwave_ring';

export interface LineRendererSpec {
  style: LineStyle;
  color: string;
  glowColor?: string;
  width?: number;
  dashArray?: string;
  durationMs?: number;
}

export type ParticleType = 
  | 'fire_sparks' 
  | 'ice_crystals' 
  | 'electric_arcs' 
  | 'blood_drops' 
  | 'holy_glow' 
  | 'shadow_mist' 
  | 'shockwave_rings' 
  | 'dust_debris'
  | 'vortex_implode'
  | 'energy_gather';

export interface ParticleSpec {
  type: ParticleType;
  color: string;
  count: number;
  spreadRadius?: number;
  durationMs?: number;
}

export interface ScreenShakeSpec {
  intensity: 'mild' | 'medium' | 'heavy';
  durationMs: number;
}

export interface ColorFlashSpec {
  color: string;
  opacity: number;
  durationMs: number;
}

export interface AbilityVFXConfig {
  travelTimeMs?: number;
  windupTimeMs?: number;
  impactTimeMs?: number;
  lineRenderer?: LineRendererSpec;
  particles?: ParticleSpec[];
  screenShake?: ScreenShakeSpec;
  colorFlash?: ColorFlashSpec;
  hasGhostTrails?: boolean;
  hasShockwaveRipple?: boolean;
}

export interface StepAnimationState {
  actorId: PlayerId;
  fromCoord?: AxialCoord;
  toCoord?: AxialCoord;
  targetCoords?: AxialCoord[];
  actionName: string;
  cardType?: CardType;
  effectType: 'move' | 'attack' | 'shield' | 'push' | 'heal' | 'miss' | 'collision';
  damageDealt?: number;
  vfxConfig?: AbilityVFXConfig;
  phase?: 'windup' | 'travel' | 'impact' | 'decay';
  startTime?: number;
  travelTimeMs?: number;
  totalDurationMs?: number;
}


export type MultiplayerRole = 'single' | 'host' | 'client';

export interface MultiplayerSeat {
  id: PlayerId;
  name: string;
  isAi: boolean;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  teamId: number;
  peerId?: string;
  isReady?: boolean;
  avatarUrl?: string;
}

export interface ConnectedPeer {
  peerId: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
  assignedSeatId?: PlayerId | null;
}

export type FloaterType = 'damage' | 'crit' | 'shield_absorb' | 'miss' | 'collision' | 'heal' | 'shield_up' | 'rune' | 'hill';

export interface CombatFloater {
  id: string;
  coord: AxialCoord;
  text: string;
  type: FloaterType;
  createdAt: number;
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

