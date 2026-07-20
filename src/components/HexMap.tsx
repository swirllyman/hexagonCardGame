import React from 'react';
import type { HexTile, PlayerState, AxialCoord, StepAnimationState, Card, ProjectedIntent } from '../types/game';
import { hexToPixel, hexEquals, hexDistance, getFacingAngle } from '../utils/hexGrid';
import { UnitToken } from './UnitToken';
import { Flame, Shield, Heart, Landmark } from 'lucide-react';

interface HexMapProps {
  hexGrid: HexTile[];
  players: PlayerState[];
  hoveredHex: AxialCoord | null;
  selectedCard: Card | null;
  currentActorId?: string;
  currentAnimation: StepAnimationState | null;
  projectedIntents?: ProjectedIntent[];
  onHexHover: (coord: AxialCoord | null) => void;
  onHexClick: (coord: AxialCoord) => void;
}

const HEX_RADIUS = 42;
const CENTER = { x: 380, y: 320 };

function getHexPolygonPoints(center: { x: number; y: number }, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    const px = center.x + radius * Math.cos(angleRad);
    const py = center.y + radius * Math.sin(angleRad);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}

export const HexMap: React.FC<HexMapProps> = ({
  hexGrid,
  players,
  hoveredHex,
  selectedCard,
  currentActorId,
  currentAnimation,
  projectedIntents = [],
  onHexHover,
  onHexClick,
}) => {
  const humanPlayer = players.find(p => p.id === 'player1');

  return (
    <div className="relative w-full h-full max-h-full fantasy-panel rounded-2xl border border-amber-600/30 shadow-2xl flex items-center justify-center overflow-hidden">
      {/* Background Rune Array Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950/90 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#d9770608_1px,transparent_1px),linear-gradient(to_bottom,#d9770608_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <svg className="w-full h-full relative z-10 select-none overflow-visible" viewBox="0 0 760 640" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="runeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <radialGradient id="attackGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Render Hex Tiles */}
        {hexGrid.map((tile) => {
          const pixel = hexToPixel(tile.coord, HEX_RADIUS, CENTER);
          const points = getHexPolygonPoints(pixel, HEX_RADIUS - 2);

          const isHovered = hoveredHex && hexEquals(hoveredHex, tile.coord);
          const occupant = players.find(p => !p.isEliminated && hexEquals(p.coord, tile.coord));

          // Distance check for targeting highlights
          const distFromHuman = humanPlayer ? hexDistance(humanPlayer.coord, tile.coord) : 99;
          const isInRange = selectedCard && distFromHuman <= selectedCard.range && distFromHuman > 0;

          // Animation highlight targets
          const isAnimTarget = currentAnimation?.targetCoords?.some(tc => hexEquals(tc, tile.coord));

          let fill = 'fill-slate-900/95';
          let stroke = 'stroke-slate-800/80';
          let strokeWidth = '1.2';

          if (tile.terrain === 'obstacle') {
            fill = 'fill-slate-800/90';
            stroke = 'stroke-amber-900/50';
          } else if (tile.terrain === 'rune') {
            fill = 'fill-amber-950/40';
            stroke = 'stroke-amber-500/80';
            strokeWidth = '2';
          }

          if (isInRange) {
            fill = 'fill-emerald-950/60';
            stroke = 'stroke-emerald-400';
            strokeWidth = '2';
          }

          if (isHovered) {
            fill = 'fill-amber-950/70';
            stroke = 'stroke-amber-300';
            strokeWidth = '2.5';
          }

          if (isAnimTarget) {
            fill = 'fill-rose-950/80';
            stroke = 'stroke-rose-400';
            strokeWidth = '3';
          }

          return (
            <g
              key={`${tile.coord.q},${tile.coord.r}`}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => onHexHover(tile.coord)}
              onMouseLeave={() => onHexHover(null)}
              onClick={() => onHexClick(tile.coord)}
            >
              {/* Tile Polygon */}
              <polygon
                points={points}
                className={`${fill} ${stroke} transition-colors duration-200`}
                strokeWidth={strokeWidth}
              />

              {/* Terrain Obstacle Pillar Glyph */}
              {tile.terrain === 'obstacle' && (
                <g transform={`translate(${pixel.x - 7}, ${pixel.y - 7})`} className="pointer-events-none opacity-60">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                </g>
              )}

              {/* Powerup Rune Vector Glyph */}
              {tile.terrain === 'rune' && !occupant && (
                <g transform={`translate(${pixel.x - 10}, ${pixel.y - 10})`} className="pointer-events-none" filter="url(#runeGlowFilter)">
                  {tile.runeEffect === 'heal' && <Heart className="w-5 h-5 text-emerald-400 animate-pulse" />}
                  {tile.runeEffect === 'shield' && <Shield className="w-5 h-5 text-sky-400 animate-pulse" />}
                  {tile.runeEffect === 'attackBoost' && <Flame className="w-5 h-5 text-amber-400 animate-pulse" />}
                </g>
              )}

              {/* Axial Coordinates Overlay */}
              <text
                x={pixel.x}
                y={pixel.y + 24}
                textAnchor="middle"
                className="fill-slate-600/50 text-[9px] font-mono pointer-events-none"
              >
                {tile.coord.q},{tile.coord.r}
              </text>

              {/* Attack Impact Explosion Glow */}
              {isAnimTarget && (
                <circle
                  cx={pixel.x}
                  cy={pixel.y}
                  r={HEX_RADIUS * 0.8}
                  fill="url(#attackGlow)"
                  className="animate-ping"
                />
              )}
            </g>
          );
        })}

        {/* Render Ground Facing Direction Arrows */}
        {players.map(p => {
          if (p.isEliminated) return null;
          const pPx = hexToPixel(p.coord, HEX_RADIUS, CENTER);
          const angle = getFacingAngle(p.facing);
          return (
            <g
              key={`facing-arrow-${p.id}`}
              transform={`translate(${pPx.x}, ${pPx.y}) rotate(${angle})`}
              className="pointer-events-none transition-transform duration-500 ease-out"
            >
              <polygon
                points="16,-7 30,0 16,7 20,0"
                fill="#fbbf24"
                fillOpacity="0.85"
                stroke="#090d16"
                strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* Render Projected Intent Trajectories & Threat Cones */}
        {projectedIntents.map((intent, idx) => {
          const fromPx = hexToPixel(intent.fromCoord, HEX_RADIUS, CENTER);
          const toPx = hexToPixel(intent.toCoord, HEX_RADIUS, CENTER);
          const player = players.find(p => p.id === intent.playerId);
          if (!player || player.isEliminated) return null;

          const isMove = intent.type === 'movement';
          const isAttack = intent.type === 'attack';
          const strokeColor = intent.playerId === 'player1' ? '#f59e0b' : '#38bdf8';

          return (
            <g key={`intent-${intent.playerId}-${intent.slotIndex}-${idx}`} className="pointer-events-none">
              {/* Dashed Trajectory Line for Movement */}
              {isMove && !hexEquals(intent.fromCoord, intent.toCoord) && (
                <>
                  <line
                    x1={fromPx.x}
                    y1={fromPx.y}
                    x2={toPx.x}
                    y2={toPx.y}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {/* Projected Destination Arrow Marker */}
                  <g transform={`translate(${toPx.x}, ${toPx.y}) rotate(${getFacingAngle(intent.toFacing)})`}>
                    <polygon
                      points="12,-5 22,0 12,5"
                      fill={strokeColor}
                      fillOpacity="0.9"
                    />
                  </g>
                </>
              )}

              {/* Target Hex Highlight for Attacks */}
              {isAttack && intent.targetCoords.map((tCoord, tIdx) => {
                const tPx = hexToPixel(tCoord, HEX_RADIUS, CENTER);
                return (
                  <circle
                    key={`atk-target-${tIdx}`}
                    cx={tPx.x}
                    cy={tPx.y}
                    r={HEX_RADIUS * 0.75}
                    fill="#f43f5e"
                    fillOpacity="0.3"
                    stroke="#f43f5e"
                    strokeWidth="1.8"
                    strokeDasharray="4,2"
                    className="animate-pulse"
                  />
                );
              })}

              {/* Slot Badge Marker at Movement Target */}
              {isMove && (
                <g transform={`translate(${toPx.x}, ${toPx.y - 20})`}>
                  <rect
                    x="-10"
                    y="-7"
                    width="20"
                    height="14"
                    rx="4"
                    fill="#090d16"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    S{intent.slotIndex + 1}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render Commander Units */}
        {players.map((player) => {
          if (player.isEliminated) return null;

          const pixel = hexToPixel(player.coord, HEX_RADIUS, CENTER);
          const isActor = currentActorId === player.id;

          return (
            <foreignObject
              key={player.id}
              x={pixel.x - 32}
              y={pixel.y - 36}
              width={64}
              height={72}
              className="overflow-visible pointer-events-none transition-all duration-500 ease-out"
            >
              <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                <UnitToken player={player} isCurrentActor={isActor} />
              </div>
            </foreignObject>
          );
        })}
      </svg>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 bg-slate-950/90 border border-amber-600/30 rounded-xl px-3 py-1.5 text-[11px] text-amber-100/90 backdrop-blur-md flex items-center gap-4 shadow-lg font-mono">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Center Shrine (+DMG)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-emerald-400" />
          <span>Heal Rune</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span>Shield Rune</span>
        </div>
      </div>
    </div>
  );
};
