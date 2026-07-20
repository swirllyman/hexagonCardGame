import type { AxialCoord, HexTile } from '../types/game';

// Pointy-topped hex directions (0 to 5)
export const HEX_DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },   // 0: East
  { q: 0, r: 1 },   // 1: South-East
  { q: -1, r: 1 },  // 2: South-West
  { q: -1, r: 0 },  // 3: West
  { q: 0, r: -1 },  // 4: North-West
  { q: 1, r: -1 },  // 5: North-East
];

export const DIRECTION_NAMES = ['East', 'South-East', 'South-West', 'West', 'North-West', 'North-East'];

export function getAxialS(coord: AxialCoord): number {
  return -coord.q - coord.r;
}

export function hexEquals(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const sa = getAxialS(a);
  const sb = getAxialS(b);
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(sa - sb)) / 2;
}

export function isValidGridCoord(coord: AxialCoord, mapRadius: number = 4): boolean {
  return hexDistance({ q: 0, r: 0 }, coord) <= mapRadius;
}

export function getTurnDirectionTowards(currentFacing: number, targetFacing: number): 'pivot_left' | 'pivot_right' | 'none' {
  const normCurrent = normalizeFacing(currentFacing);
  const normTarget = normalizeFacing(targetFacing);
  if (normCurrent === normTarget) return 'none';
  const rightDist = (normTarget - normCurrent + 6) % 6;
  const leftDist = (normCurrent - normTarget + 6) % 6;
  return rightDist <= leftDist ? 'pivot_right' : 'pivot_left';
}


export function hexAdd(a: AxialCoord, b: AxialCoord): AxialCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function hexScale(a: AxialCoord, k: number): AxialCoord {
  return { q: a.q * k, r: a.r * k };
}

export function normalizeFacing(dir: number): number {
  return ((dir % 6) + 6) % 6;
}

export function hexNeighborInDir(coord: AxialCoord, dir: number): AxialCoord {
  const normalizedDir = normalizeFacing(dir);
  return hexAdd(coord, HEX_DIRECTIONS[normalizedDir]);
}

export function hexNeighbors(coord: AxialCoord): AxialCoord[] {
  return HEX_DIRECTIONS.map(dir => hexAdd(coord, dir));
}

export function getFacingAngle(facing: number): number {
  return normalizeFacing(facing) * 60;
}

export function rotateFacing(facing: number, turnSteps: number): number {
  return normalizeFacing(facing + turnSteps);
}

export function getDirectionFromTo(from: AxialCoord, to: AxialCoord): number {
  if (hexEquals(from, to)) return 0;
  
  let bestDir = 0;
  let bestDist = 999;
  
  for (let d = 0; d < 6; d++) {
    const next = hexNeighborInDir(from, d);
    const dist = hexDistance(next, to);
    if (dist < bestDist) {
      bestDist = dist;
      bestDir = d;
    }
  }
  return bestDir;
}

export function getRelativeHex(
  coord: AxialCoord, 
  facing: number, 
  moveType: string, 
  distance: number = 1
): { targetCoord: AxialCoord; newFacing: number } {
  const normFacing = normalizeFacing(facing);
  
  switch (moveType) {
    case 'forward':
    case 'sprint': {
      const stepDist = moveType === 'sprint' ? Math.max(1, distance) : 1;
      const delta = hexScale(HEX_DIRECTIONS[normFacing], stepDist);
      return { targetCoord: hexAdd(coord, delta), newFacing: normFacing };
    }
    case 'sidestep_left': {
      const dir = normalizeFacing(normFacing + 5);
      return { targetCoord: hexNeighborInDir(coord, dir), newFacing: normFacing };
    }
    case 'sidestep_right': {
      const dir = normalizeFacing(normFacing + 1);
      return { targetCoord: hexNeighborInDir(coord, dir), newFacing: normFacing };
    }
    case 'backstep': {
      const dir = normalizeFacing(normFacing + 3);
      return { targetCoord: hexNeighborInDir(coord, dir), newFacing: normFacing };
    }
    case 'pivot_left': {
      const newF = normalizeFacing(normFacing + 5);
      return { targetCoord: coord, newFacing: newF };
    }
    case 'pivot_right': {
      const newF = normalizeFacing(normFacing + 1);
      return { targetCoord: coord, newFacing: newF };
    }
    case 'about_face': {
      const newF = normalizeFacing(normFacing + 3);
      return { targetCoord: coord, newFacing: newF };
    }
    default: {
      const delta = hexScale(HEX_DIRECTIONS[normFacing], distance);
      return { targetCoord: hexAdd(coord, delta), newFacing: normFacing };
    }
  }
}

export function getFrontalTargetHexes(
  coord: AxialCoord, 
  facing: number, 
  attackType: string = 'frontal', 
  range: number = 1
): AxialCoord[] {
  const normFacing = normalizeFacing(facing);
  const targets: AxialCoord[] = [];

  if (attackType === 'line') {
    let curr = coord;
    for (let r = 1; r <= range; r++) {
      curr = hexNeighborInDir(curr, normFacing);
      targets.push(curr);
    }
  } else if (attackType === 'cleave_arc') {
    // Front 3 hexes: facing-1, facing, facing+1
    const dirs = [
      normalizeFacing(normFacing + 5),
      normFacing,
      normalizeFacing(normFacing + 1),
    ];
    for (const d of dirs) {
      targets.push(hexNeighborInDir(coord, d));
    }
  } else if (attackType === 'aoe') {
    // 360 degree 1-ring neighbors
    return hexNeighbors(coord);
  } else {
    // Frontal: hexes straight ahead along facing up to range
    let curr = coord;
    for (let r = 1; r <= range; r++) {
      curr = hexNeighborInDir(curr, normFacing);
      targets.push(curr);
    }
  }

  return targets;
}

// Convert Axial hex coordinate to Screen Pixel (x, y) for Pointy-topped hexes
export function hexToPixel(coord: AxialCoord, radius: number, center: { x: number; y: number }): { x: number; y: number } {
  const x = radius * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = radius * ((3 / 2) * coord.r);
  return {
    x: center.x + x,
    y: center.y + y,
  };
}

// Generate Symmetrical Hex Grid around center (0,0) of radius N
export function generateHexGrid(mapRadius: number = 4): HexTile[] {
  const tiles: HexTile[] = [];

  for (let q = -mapRadius; q <= mapRadius; q++) {
    const r1 = Math.max(-mapRadius, -q - mapRadius);
    const r2 = Math.min(mapRadius, -q + mapRadius);
    for (let r = r1; r <= r2; r++) {
      const coord: AxialCoord = { q, r };
      const distFromCenter = hexDistance({ q: 0, r: 0 }, coord);

      let terrain: 'flat' | 'obstacle' | 'rune' = 'flat';
      let runeEffect: 'heal' | 'shield' | 'attackBoost' | undefined;
      let runeCooldown: number | undefined;
      let maxRuneCooldown: number | undefined;

      // Place central rune and obstacle pillars for tactical play
      if (distFromCenter === 0) {
        terrain = 'rune';
        runeEffect = 'attackBoost';
        runeCooldown = 0;
        maxRuneCooldown = 3;
      } else if (distFromCenter === 2 && (q === 0 || r === 0 || q + r === 0)) {
        terrain = 'rune';
        runeEffect = Math.abs(q) === 2 ? 'heal' : 'shield';
        runeCooldown = 0;
        maxRuneCooldown = 3;
      } else if (distFromCenter === 3 && (q === 1 || q === -1) && (r === 2 || r === -2)) {
        terrain = 'obstacle';
      }

      tiles.push({ coord, terrain, runeEffect, runeCooldown, maxRuneCooldown });
    }
  }

  return tiles;
}

// 4 Corner Starting Positions for Player 1, 2, 3, 4
export function getStartingPositions(mapRadius: number = 4): { [key: string]: { coord: AxialCoord; facing: number } } {
  return {
    player1: { coord: { q: 0, r: -mapRadius }, facing: 1 },         // Top (North)
    player2: { coord: { q: mapRadius, r: 0 }, facing: 3 },          // Right (East)
    player3: { coord: { q: 0, r: mapRadius }, facing: 4 },          // Bottom (South)
    player4: { coord: { q: -mapRadius, r: 0 }, facing: 0 },         // Left (West)
  };
}

// Find all hexes within range R
export function hexesInRange(center: AxialCoord, range: number): AxialCoord[] {
  const results: AxialCoord[] = [];
  for (let q = -range; q <= range; q++) {
    const r1 = Math.max(-range, -q - range);
    const r2 = Math.min(range, -q + range);
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}

// Linear interpolation for line-of-sight / line path drawing
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hexRound(fracQ: number, fracR: number): AxialCoord {
  const fracS = -fracQ - fracR;
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  let s = Math.round(fracS);

  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

export function hexLineDraw(a: AxialCoord, b: AxialCoord): AxialCoord[] {
  const dist = hexDistance(a, b);
  if (dist === 0) return [a];
  
  const results: AxialCoord[] = [];

  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    const q = lerp(a.q, b.q, t);
    const r = lerp(a.r, b.r, t);
    results.push(hexRound(q, r));
  }
  return results;
}
