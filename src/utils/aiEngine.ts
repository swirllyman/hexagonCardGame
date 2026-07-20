import type { Card, PlayerState, HexTile } from '../types/game';
import { hexDistance, getDirectionFromTo, normalizeFacing } from './hexGrid';

export function programAiTurn(
  bot: PlayerState,
  allPlayers: PlayerState[],
  _grid: HexTile[]
): (Card | null)[] {
  if (bot.isEliminated || bot.hand.length === 0) {
    return [null, null, null];
  }

  const activeEnemies = allPlayers.filter(p => p.id !== bot.id && !p.isEliminated);
  if (activeEnemies.length === 0) {
    return [bot.hand[0] || null, bot.hand[1] || null, bot.hand[2] || null];
  }

  // Find nearest enemy commander
  let nearestEnemy = activeEnemies[0];
  let minDistance = hexDistance(bot.coord, nearestEnemy.coord);

  for (const enemy of activeEnemies) {
    const dist = hexDistance(bot.coord, enemy.coord);
    if (dist < minDistance) {
      minDistance = dist;
      nearestEnemy = enemy;
    }
  }

  const targetDir = getDirectionFromTo(bot.coord, nearestEnemy.coord);
  let currentEstFacing = bot.facing;

  const isLowHp = bot.hp / bot.maxHp < 0.35;
  const availableHand = [...bot.hand];
  const queue: (Card | null)[] = [];

  // Helper score card for specific slot
  const scoreCard = (card: Card, slotIdx: number, estDist: number, estFacing: number): number => {
    let score = 10;
    const isFacingTarget = normalizeFacing(estFacing) === normalizeFacing(targetDir);

    if (card.category === 'attack') {
      if (estDist <= card.range) {
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
          score += 45; // Turn to face enemy
        } else {
          score -= 10; // Already facing target
        }
      } else if (card.facingMoveType === 'forward' || card.facingMoveType === 'sprint') {
        if (isFacingTarget && estDist > 1) {
          score += 40; // Forward move aligned toward target
        } else if (!isFacingTarget) {
          score += 10;
        }
      } else {
        if (estDist > 1) {
          score += 25;
        }
      }
    } else if (card.category === 'defense') {
      if (isLowHp) score += 60;
      if (estDist <= 2) score += 40;
    } else if (card.category === 'utility') {
      if (card.type === 'meditate' && isLowHp) score += 70;
      if (card.type === 'push' && estDist === 1) score += 45;
    }

    // Vary strategy slightly by difficulty
    if (bot.aiDifficulty === 'easy') {
      score += (Math.random() * 30 - 15);
    } else if (bot.aiDifficulty === 'hard') {
      if (slotIdx === 0 && !isFacingTarget && (card.type === 'pivot_left' || card.type === 'pivot_right')) score += 35;
      if (slotIdx === 1 && card.category === 'attack' && estDist <= 2) score += 30;
    }

    return score;
  };

  let currentEstDist = minDistance;

  for (let slot = 0; slot < 3; slot++) {
    if (availableHand.length === 0) {
      queue.push(null);
      continue;
    }

    let bestCardIdx = 0;
    let bestScore = -999;

    availableHand.forEach((card, idx) => {
      const score = scoreCard(card, slot, currentEstDist, currentEstFacing);
      if (score > bestScore) {
        bestScore = score;
        bestCardIdx = idx;
      }
    });

    const chosenCard = availableHand[bestCardIdx];
    queue.push(chosenCard);
    availableHand.splice(bestCardIdx, 1);

    // Update estimated state based on chosen card
    if (chosenCard.type === 'pivot_left') currentEstFacing = normalizeFacing(currentEstFacing + 5);
    if (chosenCard.type === 'pivot_right') currentEstFacing = normalizeFacing(currentEstFacing + 1);
    if (chosenCard.type === 'move1') currentEstDist = Math.max(0, currentEstDist - 1);
    if (chosenCard.type === 'move2') currentEstDist = Math.max(0, currentEstDist - 2);
    if (chosenCard.type === 'teleport') currentEstDist = Math.max(0, currentEstDist - 2);
  }

  return queue;
}
