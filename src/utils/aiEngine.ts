import type { Card, PlayerState, HexTile, AxialCoord } from '../types/game';
import {
  hexDistance,
  getDirectionFromTo,
  normalizeFacing,
  getRelativeHex,
  isValidGridCoord,
  getTurnDirectionTowards,
  getFrontalTargetHexes,
  hexEquals,
  hexNeighborInDir,
} from './hexGrid';
import { DEFAULT_MOVE_CARDS } from './cardsData';

// Archetype profiles defining strategic weights for bot personalities
export interface AiArchetype {
  name: string;
  hillWeight: number;    // Priority for King of the Hill (0,0)
  runeWeight: number;    // Priority for Arena Rune Pickups
  aggroWeight: number;   // Priority for attacking / execution
  flankWeight: number;   // Priority for tactical positioning & backstabs
  survivalWeight: number; // Priority for defensive cards & healing
}

const ARCHETYPES: AiArchetype[] = [
  {
    name: 'DOMINATOR',
    hillWeight: 3.2,
    runeWeight: 1.2,
    aggroWeight: 1.4,
    flankWeight: 1.2,
    survivalWeight: 1.0,
  },
  {
    name: 'SCAVENGER',
    hillWeight: 1.4,
    runeWeight: 3.2,
    aggroWeight: 1.1,
    flankWeight: 1.3,
    survivalWeight: 1.4,
  },
  {
    name: 'TACTICIAN',
    hillWeight: 1.8,
    runeWeight: 1.6,
    aggroWeight: 1.4,
    flankWeight: 2.8,
    survivalWeight: 1.3,
  },
  {
    name: 'BERSERKER',
    hillWeight: 1.5,
    runeWeight: 1.0,
    aggroWeight: 2.8,
    flankWeight: 1.6,
    survivalWeight: 0.7,
  },
  {
    name: 'JUGGERNAUT',
    hillWeight: 2.4,
    runeWeight: 1.8,
    aggroWeight: 1.1,
    flankWeight: 1.0,
    survivalWeight: 2.5,
  },
];

/**
 * Determine a persistent yet varied Archetype for an AI Bot
 */

function getBotArchetype(bot: PlayerState, roundSeed: number): AiArchetype {
  // Hash bot ID for consistent base archetype
  let hash = 0;
  for (let i = 0; i < bot.id.length; i++) {
    hash = (hash << 5) - hash + bot.id.charCodeAt(i);
  }
  hash = Math.abs(hash);

  // 75% chance to use signature archetype, 25% chance to pivot archetype per round for variety
  const baseIndex = hash % ARCHETYPES.length;
  const isVariantRound = (hash + roundSeed) % 4 === 0;
  const finalIndex = isVariantRound ? (baseIndex + 1) % ARCHETYPES.length : baseIndex;

  return ARCHETYPES[finalIndex];
}

/**
 * Main AI Turn Programming Entry Point
 */
export function programAiTurn(
  bot: PlayerState,
  allPlayers: PlayerState[],
  grid: HexTile[]
): (Card | null)[] {
  const targetSlotCount = Math.max(1, bot.programmedQueue?.length || 3);

  if (bot.isEliminated) {
    return Array(targetSlotCount).fill(null);
  }

  const activeEnemies = allPlayers.filter(p => p.id !== bot.id && p.teamId !== bot.teamId && !p.isEliminated);
  if (activeEnemies.length === 0) {
    return Array(targetSlotCount).fill(DEFAULT_MOVE_CARDS[0]);
  }

  // Derive archetype & dynamic context
  const roundSeed = Math.floor(Date.now() / 10000);
  const archetype = getBotArchetype(bot, roundSeed);
  const hpRatio = bot.hp / bot.maxHp;
  const isLowHp = hpRatio < 0.38;
  const isCriticalHp = hpRatio < 0.20;

  // Locate King of the Hill (0,0) tile & controller
  const hillTile = grid.find(t => t.terrain === 'hill' || (t.coord.q === 0 && t.coord.r === 0));
  const hillCoord: AxialCoord = hillTile ? hillTile.coord : { q: 0, r: 0 };
  const hillControllerId = hillTile?.hillController || null;
  const hillController = allPlayers.find(p => p.id === hillControllerId);
  const isEnemyControllingHill = hillController != null && hillController.teamId !== bot.teamId;
  const isSelfControllingHill = hillControllerId === bot.id || (hillController != null && hillController.teamId === bot.teamId);

  // Locate active arena runes
  const activeRunes = grid.filter(
    t => t.terrain === 'rune' && t.runeEffect && (!t.runeCooldown || t.runeCooldown === 0)
  );

  const availableAbilityHand = [...bot.hand];
  const queue: (Card | null)[] = [];

  let currentEstCoord: AxialCoord = bot.coord;
  let currentEstFacing: number = bot.facing;

  // Pre-compute enemies currently standing on the hill (for denial urgency scaling)
  const enemiesContestingHill = activeEnemies.filter(e => hexEquals(e.coord, hillCoord)).length;

  // Hill urgency: how badly do we need to act on the hill RIGHT NOW?
  // 0 = we own it, 1 = neutral, 2 = enemy owns it (very urgent), 3 = enemy contesting AND owns = critical
  let hillUrgency: number;
  if (isSelfControllingHill) {
    hillUrgency = 0;
  } else if (!hillControllerId) {
    hillUrgency = 1;
  } else if (isEnemyControllingHill && enemiesContestingHill === 0) {
    hillUrgency = 2; // Enemy owns but not standing on it — take now!
  } else {
    hillUrgency = 3; // Enemy owns AND is standing there — critical denial needed
  }

  for (let slot = 0; slot < targetSlotCount; slot++) {
    // Determine target primary enemy from current estimated position
    let targetEnemy = activeEnemies[0];
    let minEnemyDist = hexDistance(currentEstCoord, targetEnemy.coord);
    let bestTargetPriorityScore = -999;

    for (const enemy of activeEnemies) {
      const dist = hexDistance(currentEstCoord, enemy.coord);
      let targetPriority = 100 - dist * 10;

      // Bonus for low HP enemies (kill potential)
      if (enemy.hp <= 35) targetPriority += 60;

      // Strong bonus for targeting the enemy holding / contesting the Hill
      if (hexEquals(enemy.coord, hillCoord)) targetPriority += 100;

      // Bonus if enemy is facing away (backstab candidate)
      const enemyFacing = normalizeFacing(enemy.facing);
      const enemyBackHex = hexNeighborInDir(enemy.coord, normalizeFacing(enemyFacing + 3));
      if (hexEquals(currentEstCoord, enemyBackHex)) targetPriority += 45;

      if (targetPriority > bestTargetPriorityScore) {
        bestTargetPriorityScore = targetPriority;
        targetEnemy = enemy;
        minEnemyDist = dist;
      }
    }

    const targetDir = getDirectionFromTo(currentEstCoord, targetEnemy.coord);
    const bestTurnType = getTurnDirectionTowards(currentEstFacing, targetDir);

    // Build list of candidate action cards for this slot
    const candidateOptions: { card: Card; isFromHand: boolean; handIdx?: number }[] = [
      ...DEFAULT_MOVE_CARDS.map(mc => ({ card: mc, isFromHand: false })),
      ...availableAbilityHand.map((ac, idx) => ({ card: ac, isFromHand: true, handIdx: idx })),
    ];

    const scoredCandidates: { idx: number; score: number; option: typeof candidateOptions[0] }[] = [];

    candidateOptions.forEach((opt, idx) => {
      const card = opt.card;
      let score = 20;

      // 1. Predict position & facing outcome
      let nextCoord = currentEstCoord;
      let nextFacing = currentEstFacing;

      if (card.category === 'movement') {
        if (card.turnAmount) {
          nextFacing = normalizeFacing(currentEstFacing + card.turnAmount);
        } else {
          const moveType = card.facingMoveType || 'forward';
          const res = getRelativeHex(currentEstCoord, currentEstFacing, moveType, card.range || 1);
          nextCoord = res.targetCoord;
          nextFacing = res.newFacing;
        }
      }

      // Check map boundary & obstacle validity
      const gridTile = grid.find(t => hexEquals(t.coord, nextCoord));
      const isValidTile = grid && grid.length > 0
        ? !!gridTile
        : isValidGridCoord(nextCoord, 3);

      if (!isValidTile) {
        // Suicidal move out of bounds!
        score -= 4000;
      } else if (gridTile?.terrain === 'obstacle') {
        // Bump into obstacle pillar
        score -= 2500;
      }

      const currentHillDist = hexDistance(currentEstCoord, hillCoord);
      const nextHillDist = hexDistance(nextCoord, hillCoord);
      const isNextOnHill = hexEquals(nextCoord, hillCoord);
      const isCurrentOnHill = hexEquals(currentEstCoord, hillCoord);
      const isFacingTarget = normalizeFacing(currentEstFacing) === normalizeFacing(targetDir);
      const isNextFacingTarget = normalizeFacing(nextFacing) === normalizeFacing(targetDir);

      // Urgency multiplier: ramps up based on how critical the hill situation is
      const urgencyMult = [1.0, 1.3, 1.7, 2.2][hillUrgency];

      // -------------------------------------------------------------
      // 2. KING OF THE HILL STRATEGY (Primary strategic objective)
      // -------------------------------------------------------------
      if (isNextOnHill) {
        if (isEnemyControllingHill) {
          // CRITICAL: Denying enemy their hill strike AND stealing control
          score += 260 * archetype.hillWeight * urgencyMult;
        } else if (isSelfControllingHill && !hexEquals(currentEstCoord, hillCoord)) {
          // Teammate controls hill — step on it to reinforce / re-trigger strikes
          score += 180 * archetype.hillWeight;
        } else if (isSelfControllingHill) {
          // We own it and we're already there — maintain!
          score += 200 * archetype.hillWeight;
        } else {
          // Unclaimed hill — capture it!
          score += 220 * archetype.hillWeight * urgencyMult;
        }
      } else if (isCurrentOnHill && card.category === 'movement' && !card.turnAmount) {
        // Leaving the hill — heavy penalty unless we're about to die
        if (isCriticalHp) {
          score -= 40; // Mild penalty, survival takes priority
        } else if (isLowHp) {
          score -= 60;
        } else {
          score -= 130 * archetype.hillWeight; // Strong: don't give up control!
        }
      } else if (!isCurrentOnHill) {
        // Approaching hill bonus — scales with closeness and urgency
        if (nextHillDist < currentHillDist) {
          // More reward the closer we get (3 steps away = 1x, 2 steps = 2x, 1 step = 3x)
          const closenessMultiplier = Math.max(1, 4 - nextHillDist);
          score += 55 * archetype.hillWeight * urgencyMult * closenessMultiplier;
        } else if (nextHillDist === currentHillDist && card.category === 'movement' && card.turnAmount) {
          // Turning while off-hill: bonus if the turn aligns us toward the hill
          const hillDir = getDirectionFromTo(currentEstCoord, hillCoord);
          const distToHillFacing = Math.min(
            Math.abs(nextFacing - hillDir),
            6 - Math.abs(nextFacing - hillDir)
          );
          if (distToHillFacing <= 1) {
            score += 30 * archetype.hillWeight; // Now facing hill — good pivot!
          }
        }
      }

      // -------------------------------------------------------------
      // 3. ARENA RUNE POWERUP PICKUP STRATEGY
      // -------------------------------------------------------------
      if (activeRunes.length > 0) {
        let nearestRune = activeRunes[0];
        let minRuneDist = hexDistance(currentEstCoord, nearestRune.coord);

        for (const runeTile of activeRunes) {
          const rDist = hexDistance(currentEstCoord, runeTile.coord);
          if (rDist < minRuneDist) {
            minRuneDist = rDist;
            nearestRune = runeTile;
          }
        }

        const currentRuneDist = hexDistance(currentEstCoord, nearestRune.coord);
        const nextRuneDist = hexDistance(nextCoord, nearestRune.coord);
        const isNextOnRune = hexEquals(nextCoord, nearestRune.coord);

        let runeDesirability = 40;
        if (nearestRune.runeEffect === 'heal') {
          runeDesirability = isCriticalHp ? 220 : isLowHp ? 150 : 50;
        } else if (nearestRune.runeEffect === 'attackBoost') {
          runeDesirability = 70 * archetype.aggroWeight;
        } else if (nearestRune.runeEffect === 'shield') {
          runeDesirability = isLowHp ? 110 : 60;
        }

        if (isNextOnRune) {
          score += runeDesirability * archetype.runeWeight;
        } else if (nextRuneDist < currentRuneDist && !isCurrentOnHill) {
          score += (runeDesirability / 3) * archetype.runeWeight;
        }
      }

      // -------------------------------------------------------------
      // 4. COMBAT TACTICS, FLANKING & DISPLACEMENT
      // -------------------------------------------------------------
      if (card.category === 'attack') {
        const attackHexes = getFrontalTargetHexes(
          card.facingMoveType ? nextCoord : currentEstCoord,
          nextFacing,
          card.facingAttackType || 'frontal',
          card.range || 1
        );

        // Count hit targets
        let enemiesHit = 0;
        let totalDamage = 0;
        let hitHillOccupant = false;

        for (const enemy of activeEnemies) {
          const isHit = attackHexes.some(h => hexEquals(h, enemy.coord));
          if (isHit) {
            enemiesHit++;
            const dmg = card.damage || 0;
            totalDamage += dmg;

            if (enemy.hp <= dmg) {
              score += 160 * archetype.aggroWeight; // Lethal execution!
            }

            if (hexEquals(enemy.coord, hillCoord)) {
              hitHillOccupant = true;
            }

            // Backstab bonus: attacking enemy from behind
            const enemyFacing = normalizeFacing(enemy.facing);
            const enemyBackHex = hexNeighborInDir(enemy.coord, normalizeFacing(enemyFacing + 3));
            if (hexEquals(currentEstCoord, enemyBackHex)) {
              score += 55 * archetype.flankWeight; // Flanking Backstab!
            }
          }
        }

        if (enemiesHit > 0) {
          score += 60 + totalDamage * 1.5 * archetype.aggroWeight;
          if (enemiesHit >= 2) score += 50; // AOE multi-hit bonus!
          if (hitHillOccupant) {
            // Hitting an enemy ON the hill is critical denial — scales with urgency
            score += 90 * archetype.hillWeight * urgencyMult;
          }
        } else {
          // Attack misses target penalty
          score -= 35;
        }

        // Special Attack & Displacement Abilities
        const enemyOnHill = activeEnemies.find(e => hexEquals(e.coord, hillCoord));
        if (card.type === 'scorpion_pull' || card.type === 'hook_shot') {
          // Pulling enemy off hill = denial
          if (enemyOnHill) score += 150 * archetype.hillWeight * urgencyMult;
        } else if (card.type === 'vampiric' && isLowHp) {
          score += 80;
        }
      } else if (card.category === 'movement') {
        if (card.type === 'pivot_left' || card.type === 'pivot_right') {
          if (!isFacingTarget) {
            if (
              (card.type === 'pivot_left' && bestTurnType === 'pivot_left') ||
              (card.type === 'pivot_right' && bestTurnType === 'pivot_right')
            ) {
              score += 50; // Proper pivot toward target
            } else {
              score -= 20; // Pivot away from target
            }
          } else {
            score -= 20; // Already facing target
          }
        } else {
          const nextDist = hexDistance(nextCoord, targetEnemy.coord);
          if (nextDist < minEnemyDist && !isCurrentOnHill) {
            score += 35 * archetype.aggroWeight;
          } else if (nextDist > minEnemyDist && !isLowHp && !isCurrentOnHill) {
            score -= 25;
          }

          if (isNextFacingTarget && !isFacingTarget) {
            score += 30; // Aligns facing with target
          }
        }
      } else if (card.category === 'defense') {
        if (isLowHp) score += 80 * archetype.survivalWeight;
        if (minEnemyDist <= 2) score += 45 * archetype.survivalWeight;
        if (card.type === 'sanctuary' || card.type === 'titan_fortitude') {
          if (isCriticalHp) score += 120;
        }
      } else if (card.category === 'utility') {
        if (card.type === 'meditate' || card.type === 'blood_pact') {
          if (isLowHp) score += 90 * archetype.survivalWeight;
        }
        if (card.type === 'push' || card.type === 'repulsion_blast' || card.type === 'gravitational_surge') {
          // Displacement cards are INCREDIBLY valuable for hill denial
          const enemyOnHill = activeEnemies.find(e => hexEquals(e.coord, hillCoord));
          if (enemyOnHill) score += 180 * archetype.hillWeight * urgencyMult; // Knock enemy off central Hill!
        }
      }

      // -------------------------------------------------------------
      // 5. DIFFICULTY NOISE & ORGANIC VARIETY
      // -------------------------------------------------------------
      if (bot.aiDifficulty === 'easy') {
        score += Math.random() * 40 - 20;
      } else if (bot.aiDifficulty === 'medium') {
        score += Math.random() * 15 - 7.5;
      } else {
        // Hard mode: subtle tactical noise (0-5) so hard bots stay super smart but non-predictable
        score += Math.random() * 5;
      }

      scoredCandidates.push({ idx, score, option: opt });
    });

    // Sort options by score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Pick candidate stochastically among top options to eliminate predictability
    let chosenOption = scoredCandidates[0].option;

    if (scoredCandidates.length > 1) {
      if (bot.aiDifficulty === 'hard') {
        // 85% top choice, 15% 2nd choice if score is close
        const topScore = scoredCandidates[0].score;
        const secondScore = scoredCandidates[1].score;
        if (topScore - secondScore < 12 && Math.random() < 0.15) {
          chosenOption = scoredCandidates[1].option;
        }
      } else if (bot.aiDifficulty === 'medium') {
        // Weighted selection among top 3
        const r = Math.random();
        if (r < 0.65 || scoredCandidates.length < 2) {
          chosenOption = scoredCandidates[0].option;
        } else if (r < 0.90 || scoredCandidates.length < 3) {
          chosenOption = scoredCandidates[1].option;
        } else {
          chosenOption = scoredCandidates[2].option;
        }
      } else {
        // Easy mode: weighted pick top 4
        const pickIdx = Math.floor(Math.random() * Math.min(4, scoredCandidates.length));
        chosenOption = scoredCandidates[pickIdx].option;
      }
    }

    let chosenCard: Card;
    if (chosenOption.isFromHand && chosenOption.handIdx !== undefined) {
      chosenCard = chosenOption.card;
      availableAbilityHand.splice(chosenOption.handIdx, 1);
    } else {
      chosenCard = {
        ...chosenOption.card,
        id: `${chosenOption.card.type}-ai-slot-${slot}-${Math.random().toString(36).substring(2, 7)}`,
      };
    }

    queue.push(chosenCard);

    // Update currentEstCoord and currentEstFacing for next slot prediction
    if (chosenCard.category === 'movement') {
      if (chosenCard.turnAmount) {
        currentEstFacing = normalizeFacing(currentEstFacing + chosenCard.turnAmount);
      } else {
        const moveType = chosenCard.facingMoveType || 'forward';
        const res = getRelativeHex(currentEstCoord, currentEstFacing, moveType, chosenCard.range || 1);
        const isNextValid = grid && grid.length > 0
          ? grid.some(t => hexEquals(t.coord, res.targetCoord) && t.terrain !== 'obstacle')
          : isValidGridCoord(res.targetCoord, 3);
        if (isNextValid) {
          currentEstCoord = res.targetCoord;
        }
        currentEstFacing = res.newFacing;
      }
    }
  }

  return queue;
}
