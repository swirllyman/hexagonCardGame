import type { Card, PlayerState, HexTile, AxialCoord } from '../types/game';
import { hexDistance, getDirectionFromTo, normalizeFacing, getRelativeHex, isValidGridCoord, getTurnDirectionTowards } from './hexGrid';
import { DEFAULT_MOVE_CARDS } from './cardsData';

export function programAiTurn(
  bot: PlayerState,
  allPlayers: PlayerState[],
  grid: HexTile[]
): (Card | null)[] {
  const targetSlotCount = Math.max(1, bot.programmedQueue?.length || 3);

  if (bot.isEliminated) {
    return Array(targetSlotCount).fill(null);
  }

  const activeEnemies = allPlayers.filter(p => p.id !== bot.id && !p.isEliminated);
  if (activeEnemies.length === 0) {
    return Array(targetSlotCount).fill(DEFAULT_MOVE_CARDS[0]);
  }

  const isLowHp = bot.hp / bot.maxHp < 0.35;
  const availableAbilityHand = [...bot.hand];
  const queue: (Card | null)[] = [];

  let currentEstCoord: AxialCoord = bot.coord;
  let currentEstFacing: number = bot.facing;

  for (let slot = 0; slot < targetSlotCount; slot++) {
    // Re-evaluate nearest enemy from current estimated position
    let nearestEnemy = activeEnemies[0];
    let minDistance = hexDistance(currentEstCoord, nearestEnemy.coord);

    for (const enemy of activeEnemies) {
      const dist = hexDistance(currentEstCoord, enemy.coord);
      if (dist < minDistance) {
        minDistance = dist;
        nearestEnemy = enemy;
      }
    }

    const targetDir = getDirectionFromTo(currentEstCoord, nearestEnemy.coord);
    const bestTurnType = getTurnDirectionTowards(currentEstFacing, targetDir);

    const candidateOptions: { card: Card; isFromHand: boolean; handIdx?: number }[] = [
      ...DEFAULT_MOVE_CARDS.map(mc => ({ card: mc, isFromHand: false })),
      ...availableAbilityHand.map((ac, idx) => ({ card: ac, isFromHand: true, handIdx: idx })),
    ];

    let bestOptionIdx = 0;
    let bestScore = -9999;

    candidateOptions.forEach((opt, idx) => {
      const card = opt.card;
      let score = 10;

      // Predict resulting position and facing
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

      // Check boundary validity
      const isNextValid = grid && grid.length > 0 
        ? grid.some(t => t.coord.q === nextCoord.q && t.coord.r === nextCoord.r) 
        : isValidGridCoord(nextCoord, 4);

      if (!isNextValid) {
        // Severe penalty for moving out of bounds
        score -= 2000;
      }

      const isFacingTarget = normalizeFacing(currentEstFacing) === normalizeFacing(targetDir);
      const isNextFacingTarget = normalizeFacing(nextFacing) === normalizeFacing(targetDir);
      const estDist = minDistance;

      if (isNextFacingTarget && !isFacingTarget && card.category === 'movement') {
        score += 30; // Bonus for turn card aligning facing with target
      }

      if (card.category === 'attack') {
        if (estDist <= (card.range || 1)) {
          score += 50 + (card.damage || 0);
          if (isFacingTarget) score += 25; // Bonus for attacking aligned target!
          if (nearestEnemy.hp <= (card.damage || 0)) {
            score += 100; // Lethal execution priority!
          }
        } else {
          score -= 20; // Out of range penalty
        }
      } else if (card.category === 'movement') {
        if (card.type === 'pivot_left' || card.type === 'pivot_right') {
          if (!isFacingTarget) {
            if ((card.type === 'pivot_left' && bestTurnType === 'pivot_left') ||
                (card.type === 'pivot_right' && bestTurnType === 'pivot_right')) {
              score += 55; // Correct turn direction towards target
            } else {
              score -= 15; // Wrong turn direction (turns away)
            }
          } else {
            score -= 15; // Already facing target
          }
        } else {
          const nextDist = hexDistance(nextCoord, nearestEnemy.coord);
          if (nextDist < estDist) {
            score += 45; // Move brings bot closer to enemy
          } else if (nextDist > estDist) {
            score -= 25; // Move takes bot further away
          }

          if (isFacingTarget && (card.facingMoveType === 'forward' || card.facingMoveType === 'sprint')) {
            if (estDist > 1) score += 20;
          }
        }
      } else if (card.category === 'defense') {
        if (isLowHp) score += 60;
        if (estDist <= 2) score += 40;
      } else if (card.category === 'utility') {
        if (card.type === 'meditate' && isLowHp) score += 70;
        if (card.type === 'push' && estDist === 1) score += 45;
      }

      // Difficulty variations
      if (bot.aiDifficulty === 'easy') {
        score += (Math.random() * 30 - 15);
      } else if (bot.aiDifficulty === 'hard') {
        if (slot === 0 && !isFacingTarget && card.type === bestTurnType) score += 35;
        if (slot === 1 && card.category === 'attack' && estDist <= 2) score += 30;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOptionIdx = idx;
      }
    });

    const chosenOption = candidateOptions[bestOptionIdx];
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

    // Update currentEstCoord and currentEstFacing for next slot
    if (chosenCard.category === 'movement') {
      if (chosenCard.turnAmount) {
        currentEstFacing = normalizeFacing(currentEstFacing + chosenCard.turnAmount);
      } else {
        const moveType = chosenCard.facingMoveType || 'forward';
        const res = getRelativeHex(currentEstCoord, currentEstFacing, moveType, chosenCard.range || 1);
        const isNextValid = grid && grid.length > 0
          ? grid.some(t => t.coord.q === res.targetCoord.q && t.coord.r === res.targetCoord.r)
          : isValidGridCoord(res.targetCoord, 4);
        if (isNextValid) {
          currentEstCoord = res.targetCoord;
        }
        currentEstFacing = res.newFacing;
      }
    }
  }

  return queue;
}
