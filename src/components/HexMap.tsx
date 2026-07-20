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

function getArcAngles(fromFacing: number, toFacing: number, turnAmount?: number): { startAngle: number; endAngle: number; isClockwise: boolean } {
  const normFrom = ((fromFacing % 6) + 6) % 6;
  const normTo = ((toFacing % 6) + 6) % 6;

  let isClockwise = true;
  if (turnAmount !== undefined) {
    isClockwise = turnAmount > 0;
  } else {
    isClockwise = (normFrom + 1) % 6 === normTo;
  }

  let startAngle = normFrom * 60;
  let endAngle = normTo * 60;

  if (isClockwise) {
    if (endAngle <= startAngle) {
      endAngle += 360;
    }
  } else {
    if (endAngle >= startAngle) {
      endAngle -= 360;
    }
  }

  return { startAngle, endAngle, isClockwise };
}

function describeSvgArc(
  cx: number, 
  cy: number, 
  r: number, 
  startAngleDeg: number, 
  endAngleDeg: number, 
  isClockwise: boolean
): string {
  const startRad = (Math.PI / 180) * startAngleDeg;
  const endRad = (Math.PI / 180) * endAngleDeg;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const sweepFlag = isClockwise ? 1 : 0;
  const angleDiff = Math.abs(endAngleDeg - startAngleDeg);
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
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

              {/* Powerup Rune Pickups & Border Cooldown Pips */}
              {tile.terrain === 'rune' && (() => {
                const maxCd = tile.maxRuneCooldown || 3;
                const cd = tile.runeCooldown || 0;
                const isReady = cd === 0;

                let accentColor = '#f59e0b';
                let IconComponent = Flame;
                let iconClass = 'text-amber-400';

                if (tile.runeEffect === 'heal') {
                  accentColor = '#10b981';
                  IconComponent = Heart;
                  iconClass = 'text-emerald-400';
                } else if (tile.runeEffect === 'shield') {
                  accentColor = '#38bdf8';
                  IconComponent = Shield;
                  iconClass = 'text-sky-400';
                }

                // Calculate Pip Positions around hex border
                const pipRadius = HEX_RADIUS - 5;
                const pips = [];
                for (let i = 0; i < maxCd; i++) {
                  const angleRad = -Math.PI / 2 + (i * 2 * Math.PI / maxCd);
                  const px = pixel.x + pipRadius * Math.cos(angleRad);
                  const py = pixel.y + pipRadius * Math.sin(angleRad);
                  const isPipLit = isReady || (i < cd);

                  pips.push(
                    <g key={`pip-${i}`}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isReady ? 3.5 : 2.8}
                        fill={isPipLit ? accentColor : '#1e293b'}
                        fillOpacity={isPipLit ? (isReady ? 0.95 : 0.8) : 0.3}
                        stroke={isPipLit ? (isReady ? '#fef08a' : accentColor) : '#475569'}
                        strokeWidth={isReady ? 1.2 : 0.8}
                        className={isReady ? 'animate-pulse' : ''}
                      />
                    </g>
                  );
                }

                return (
                  <g className="pointer-events-none">
                    {/* Render Hex Border Cooldown Pips */}
                    {pips}

                    {/* Center Pickup Icon or Cooldown Countdown */}
                    {!occupant && (
                      <g transform={`translate(${pixel.x}, ${pixel.y})`}>
                        {isReady ? (
                          <g transform="translate(-10, -10)" filter="url(#runeGlowFilter)">
                            <IconComponent className={`w-5 h-5 ${iconClass} animate-pulse`} />
                          </g>
                        ) : (
                          <g className="flex flex-col items-center justify-center">
                            <g transform="translate(-7, -11)" className="opacity-30">
                              <IconComponent className={`w-3.5 h-3.5 ${iconClass}`} />
                            </g>
                            <circle cx={0} cy={2} r={7.5} fill="#090d16" stroke={accentColor} strokeWidth="1.2" opacity="0.95" />
                            <text
                              x={0}
                              y={5}
                              textAnchor="middle"
                              className="fill-amber-300 text-[9px] font-extrabold font-mono select-none"
                            >
                              {cd}
                            </text>
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })()}

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
          const isTurn = isMove && intent.fromFacing !== intent.toFacing;
          const strokeColor = intent.playerId === 'player1' ? '#f59e0b' : '#38bdf8';

          return (
            <g key={`intent-${intent.playerId}-${intent.slotIndex}-${idx}`} className="pointer-events-none">
              {/* Dashed Trajectory Line for Linear Movement */}
              {isMove && !hexEquals(intent.fromCoord, intent.toCoord) && (() => {
                const prevIntent = projectedIntents.find(p => p.playerId === intent.playerId && p.slotIndex === intent.slotIndex - 1);
                let lineStartX = fromPx.x;
                let lineStartY = fromPx.y;

                if (prevIntent && prevIntent.fromFacing !== prevIntent.toFacing && hexEquals(prevIntent.toCoord, intent.fromCoord)) {
                  const { endAngle } = getArcAngles(prevIntent.fromFacing, prevIntent.toFacing, prevIntent.card.turnAmount);
                  const endRad = (Math.PI / 180) * endAngle;
                  lineStartX = fromPx.x + 20 * Math.cos(endRad);
                  lineStartY = fromPx.y + 20 * Math.sin(endRad);
                }

                return (
                  <>
                    <line
                      x1={lineStartX}
                      y1={lineStartY}
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
                );
              })()}

              {/* Curved Rotation Arc Indicator for Turn Actions */}
              {isTurn && (() => {
                const { startAngle, endAngle, isClockwise } = getArcAngles(intent.fromFacing, intent.toFacing, intent.card.turnAmount);
                const arcPath = describeSvgArc(toPx.x, toPx.y, 20, startAngle, endAngle, isClockwise);
                const endRad = (Math.PI / 180) * endAngle;
                const tipX = toPx.x + 20 * Math.cos(endRad);
                const tipY = toPx.y + 20 * Math.sin(endRad);
                const tipFacingAngle = getFacingAngle(intent.toFacing);

                return (
                  <g key={`turn-arc-${idx}`}>
                    {/* Glowing Curved Rotation Arc */}
                    <path
                      d={arcPath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      strokeDasharray="4,2"
                      opacity="0.95"
                    />
                    {/* Arrowhead at end of Arc pointing in new facing direction */}
                    <g transform={`translate(${tipX}, ${tipY}) rotate(${tipFacingAngle})`}>
                      <polygon
                        points="0,-4 10,0 0,4"
                        fill={strokeColor}
                        fillOpacity="1"
                      />
                    </g>
                  </g>
                );
              })()}

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

              {/* Slot Badge Marker at Movement / Turn Location */}
              {isMove && (
                <g transform={`translate(${toPx.x}, ${toPx.y - (isTurn ? 24 : 20)})`}>
                  <rect
                    x={isTurn ? "-14" : "-10"}
                    y="-7"
                    width={isTurn ? "28" : "20"}
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
                    S{intent.slotIndex + 1}{isTurn ? (intent.card.turnAmount && intent.card.turnAmount > 0 ? ' ↻' : ' ↺') : ''}
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
