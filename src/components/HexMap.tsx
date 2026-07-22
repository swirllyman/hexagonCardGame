import React from 'react';
import type { HexTile, PlayerState, AxialCoord, StepAnimationState, Card, ProjectedIntent, CombatFloater, EmotePayload, BloodBurst } from '../types/game';
import { hexToPixel, hexEquals, hexDistance, getFacingAngle, hexNeighborInDir, normalizeFacing, rotateFacing } from '../utils/hexGrid';
import { UnitToken } from './UnitToken';
import { CombatFloaterOverlay } from './CombatFloaterOverlay';
import { BloodParticleOverlay } from './BloodParticleOverlay';
import { AbilityVFXOverlay } from './AbilityVFXOverlay';
import { Flame, Shield, Heart, Landmark, Crown } from 'lucide-react';
import type { PlayerId } from '../types/game';

function getFactionColor(playerId?: PlayerId | null): string {
  switch (playerId) {
    case 'player1': return '#f43f5e';
    case 'player2': return '#38bdf8';
    case 'player3': return '#10b981';
    case 'player4': return '#fbbf24';
    default: return '#f59e0b';
  }
}

interface HexMapProps {
  hexGrid: HexTile[];
  players: PlayerState[];
  hoveredHex: AxialCoord | null;
  selectedCard: Card | null;
  currentActorId?: string;
  currentAnimation: StepAnimationState | null;
  gamePhase?: string;
  currentSlotIndex?: number;
  projectedIntents?: ProjectedIntent[];
  floaters?: CombatFloater[];
  bloodBursts?: BloodBurst[];
  activeEmotes?: EmotePayload[];
  localPlayerId?: string;
  onHexHover: (coord: AxialCoord | null) => void;
  onHexClick: (coord: AxialCoord) => void;
  onAnimationComplete?: () => void;
}

const HEX_RADIUS = 48;
const CENTER = { x: 380, y: 405 };

function getHexPolygonPoints(center: { x: number; y: number }, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    const px = center.x + radius * Math.cos(angleRad);
    const py = center.y + radius * Math.sin(angleRad) * 0.72;
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
  gamePhase,
  currentSlotIndex = 0,
  projectedIntents = [],
  floaters = [],
  bloodBursts = [],
  activeEmotes = [],
  localPlayerId,
  onHexHover,
  onHexClick,
  onAnimationComplete,
}) => {
  const localPlayer = players.find(p => p.id === localPlayerId) || players.find(p => !p.isAi) || players[0];

  // Filter projected intents in battle phase to only show the currently active slot action about to execute
  const filteredIntents = projectedIntents.filter(intent => {
    if (gamePhase === 'resolving') {
      return intent.slotIndex === currentSlotIndex;
    }
    return true;
  });

  const [shakeOffset, setShakeOffset] = React.useState({ x: 0, y: 0 });

  const handleShakeTrigger = React.useCallback((intensity: string, durationMs: number) => {
    const mult = intensity === 'heavy' ? 14 : intensity === 'medium' ? 8 : 4;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= durationMs) {
        clearInterval(interval);
        setShakeOffset({ x: 0, y: 0 });
      } else {
        const decay = 1 - (elapsed / durationMs);
        setShakeOffset({
          x: (Math.random() - 0.5) * mult * decay,
          y: (Math.random() - 0.5) * mult * decay,
        });
      }
    }, 25);
  }, []);

  return (
    <div className="relative w-full h-full max-h-full bg-transparent flex items-center justify-center overflow-hidden">

      <svg
        className="w-full h-full relative z-10 select-none overflow-visible transition-transform duration-75"
        style={{ transform: `translate(${shakeOffset.x.toFixed(1)}px, ${shakeOffset.y.toFixed(1)}px)` }}
        viewBox="0 0 760 640"
        preserveAspectRatio="xMidYMid meet"
      >
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

          // Distance check for targeting highlights
          const distFromLocal = localPlayer ? hexDistance(localPlayer.coord, tile.coord) : 99;

          // For movement cards, compute the specific targeted hex(es)
          const isMoveForwardCard = selectedCard?.category === 'movement' && selectedCard?.facingMoveType === 'forward';
          const isTurnCard = selectedCard?.category === 'movement' && selectedCard?.turnAmount !== undefined;
          const forwardHex = (isMoveForwardCard && localPlayer)
            ? hexNeighborInDir(localPlayer.coord, normalizeFacing(localPlayer.facing))
            : null;

          const isInRange = selectedCard && tile.terrain !== 'obstacle' && (
            isMoveForwardCard
              ? (forwardHex && hexEquals(tile.coord, forwardHex))
              : (!isTurnCard && distFromLocal <= selectedCard.range && distFromLocal > 0)
          );

          // Animation highlight targets
          const isAnimTarget = currentAnimation?.effectType === 'attack' && currentAnimation?.targetCoords?.some((tc: AxialCoord) => hexEquals(tc, tile.coord));

          let fill = 'fill-[rgba(100,160,50,0.22)]';
          let stroke = 'stroke-[rgba(160,220,70,0.55)]';
          let strokeWidth = '1.5';

          if (tile.terrain === 'obstacle') {
            fill = 'fill-[rgba(20,30,20,0.75)]';
            stroke = 'stroke-lime-800/80';
          } else if (tile.terrain === 'rune') {
            fill = 'fill-[rgba(234,179,8,0.25)]';
            stroke = 'stroke-amber-400';
            strokeWidth = '2';
          } else if (tile.terrain === 'hill') {
            fill = 'fill-[rgba(245,158,11,0.3)]';
            stroke = tile.hillController ? 'stroke-amber-300 font-extrabold' : 'stroke-yellow-400/90';
            strokeWidth = '2.5';
          }

          if (isInRange) {
            fill = 'fill-[rgba(16,185,129,0.45)]';
            stroke = 'stroke-emerald-300';
            strokeWidth = '2.5';
          }

          if (isHovered) {
            fill = 'fill-[rgba(250,204,21,0.55)]';
            stroke = 'stroke-amber-200';
            strokeWidth = '3';
          }

          if (isAnimTarget) {
            fill = 'fill-[rgba(244,63,94,0.6)]';
            stroke = 'stroke-rose-300';
            strokeWidth = '3';
          }

          return (
            <g
              key={`tile-base-${tile.coord.q},${tile.coord.r}`}
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

              {/* Bloody Hex Surface Stains & Splatters */}
              {tile.isBloody && (
                <g className="pointer-events-none opacity-90">
                  {/* Outer Splatter Stain */}
                  <path
                    d={`M ${pixel.x - 16} ${pixel.y - 4} Q ${pixel.x - 8} ${pixel.y - 16}, ${pixel.x + 8} ${pixel.y - 12} T ${pixel.x + 18} ${pixel.y + 2} T ${pixel.x + 6} ${pixel.y + 16} T ${pixel.x - 14} ${pixel.y + 10} Z`}
                    fill="#7f1d1d"
                    fillOpacity="0.75"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                  />
                  {/* Inner Dark Blood Pool */}
                  <ellipse
                    cx={pixel.x - 2}
                    cy={pixel.y + 1}
                    rx={12}
                    ry={8}
                    fill="#450a0a"
                    fillOpacity="0.85"
                  />
                  {/* Splatter Droplets */}
                  <circle cx={pixel.x - 20} cy={pixel.y - 11} r={2.8} fill="#991b1b" fillOpacity="0.9" />
                  <circle cx={pixel.x + 20} cy={pixel.y - 9} r={2.2} fill="#dc2626" fillOpacity="0.85" />
                  <circle cx={pixel.x + 14} cy={pixel.y + 18} r={3.2} fill="#7f1d1d" fillOpacity="0.9" />
                  <circle cx={pixel.x - 18} cy={pixel.y + 14} r={2.0} fill="#991b1b" fillOpacity="0.85" />
                  <circle cx={pixel.x + 5} cy={pixel.y - 21} r={2.4} fill="#b91c1c" fillOpacity="0.9" />
                  <circle cx={pixel.x - 7} cy={pixel.y - 23} r={1.6} fill="#450a0a" fillOpacity="0.85" />
                  <circle cx={pixel.x + 23} cy={pixel.y + 7} r={1.8} fill="#991b1b" fillOpacity="0.8" />
                  <circle cx={pixel.x - 23} cy={pixel.y + 3} r={2.1} fill="#7f1d1d" fillOpacity="0.85" />
                </g>
              )}

              {/* Controlled or Contested Glowing Aura */}
              {tile.terrain === 'hill' && (() => {
                const controller = tile.hillController;
                const progress = tile.hillProgress;
                const activePlayerId = controller || progress?.playerId;
                const activeColor = getFactionColor(activePlayerId);
                const isCaptured = !!controller;
                if (!activePlayerId) return null;

                return (
                  <circle
                    cx={pixel.x}
                    cy={pixel.y}
                    r={HEX_RADIUS - 8}
                    fill={activeColor}
                    fillOpacity={isCaptured ? 0.25 : 0.12}
                    stroke={activeColor}
                    strokeWidth={isCaptured ? 2 : 1}
                    className={isCaptured ? 'animate-pulse' : ''}
                  />
                );
              })()}
            </g>
          );
        })}

        {/* Pass 2: Foreground Terrain Icons, Glyphs & King of the Hill Crown Overlay */}
        {hexGrid.map((tile) => {
          const pixel = hexToPixel(tile.coord, HEX_RADIUS, CENTER);
          const occupant = players.find(p => !p.isEliminated && hexEquals(p.coord, tile.coord));
          const isHovered = hoveredHex && hexEquals(hoveredHex, tile.coord);
          const isAnimTarget = currentAnimation?.effectType === 'attack' && currentAnimation?.targetCoords?.some((tc: AxialCoord) => hexEquals(tc, tile.coord));

          return (
            <g key={`tile-fg-${tile.coord.q},${tile.coord.r}`} className="pointer-events-none">
              {/* Terrain Obstacle Pillar Glyph */}
              {tile.terrain === 'obstacle' && (
                <g transform={`translate(${pixel.x - 7}, ${pixel.y - 7})`} className="opacity-60">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                </g>
              )}

              {/* King of the Hill (KOTH) Nexus Hex Overlay */}
              {tile.terrain === 'hill' && (() => {
                const controller = tile.hillController;
                const progress = tile.hillProgress;
                const turns = progress ? progress.turnsCount : (controller ? 2 : 0);
                const activePlayerId = controller || progress?.playerId;
                const activeColor = getFactionColor(activePlayerId);
                const isCaptured = !!controller;

                const pip1Lit = turns >= 1;
                const pip2Lit = turns >= 2;

                return (
                  <g>
                    {/* Progress Pips */}
                    <circle
                      cx={pixel.x - 9}
                      cy={pixel.y - HEX_RADIUS + 8}
                      r={3.8}
                      fill={pip1Lit ? activeColor : '#1e293b'}
                      fillOpacity={pip1Lit ? 1 : 0.4}
                      stroke={pip1Lit ? '#fef08a' : '#475569'}
                      strokeWidth={1}
                    />
                    <circle
                      cx={pixel.x + 9}
                      cy={pixel.y - HEX_RADIUS + 8}
                      r={3.8}
                      fill={pip2Lit ? activeColor : '#1e293b'}
                      fillOpacity={pip2Lit ? 1 : 0.4}
                      stroke={pip2Lit ? '#fef08a' : '#475569'}
                      strokeWidth={1}
                    />

                    {/* Central Crown Icon & Label */}
                    <g transform={`translate(${pixel.x}, ${pixel.y})`}>
                      {!occupant && (
                        <>
                          <g transform="translate(-11, -14)" filter="url(#runeGlowFilter)">
                            <Crown className={`w-5 h-5 ${isCaptured ? 'text-amber-300 animate-bounce' : 'text-amber-400/90 animate-pulse'}`} />
                          </g>
                          <text
                            x={0}
                            y={14}
                            textAnchor="middle"
                            className="fill-amber-200 text-[8px] font-extrabold tracking-wider font-mono select-none"
                          >
                            {isCaptured ? 'KING OF HILL' : turns === 1 ? 'CONTESTING 1/2' : 'NEXUS HILL'}
                          </text>
                        </>
                      )}
                      {occupant && (
                        <text
                          x={0}
                          y={HEX_RADIUS - 5}
                          textAnchor="middle"
                          className="fill-amber-200 text-[8px] font-extrabold tracking-wider font-mono select-none drop-shadow"
                        >
                          {controller === occupant.id ? 'KING OF HILL' : 'CONTESTING 1/2'}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })()}

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
                  <g>
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

              {/* Axial Coordinates Overlay - show only on hover */}
              {isHovered && (
                <text
                  x={pixel.x}
                  y={pixel.y + 24}
                  textAnchor="middle"
                  className="fill-slate-200 text-[10px] font-bold font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] z-30"
                >
                  {tile.coord.q},{tile.coord.r}
                </text>
              )}

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

        {/* Turn Card Preview: Large vivid facing indicator */}
        {(() => {
          if (!selectedCard || !localPlayer || selectedCard.turnAmount === undefined) return null;
          const turnAmt = selectedCard.turnAmount;
          const newFacing = rotateFacing(localPlayer.facing, turnAmt);
          const pPx = hexToPixel(localPlayer.coord, HEX_RADIUS, CENTER);
          const newAngle = getFacingAngle(newFacing);
          const currentAngle = getFacingAngle(localPlayer.facing);

          // Build a sweep arc from current facing to new facing
          const { startAngle, endAngle, isClockwise } = getArcAngles(localPlayer.facing, newFacing, turnAmt);
          const ARC_R = 34;
          const arcPath = describeSvgArc(pPx.x, pPx.y, ARC_R, startAngle, endAngle, isClockwise);
          // Arrowhead tip at end of arc
          const endRad = (Math.PI / 180) * endAngle;
          const arcTipX = pPx.x + ARC_R * Math.cos(endRad);
          const arcTipY = pPx.y + ARC_R * Math.sin(endRad);

          return (
            <g className="pointer-events-none">
              {/* Pulsing hex ring highlight around player */}
              <polygon
                points={getHexPolygonPoints(pPx, HEX_RADIUS - 4)}
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeOpacity="0.7"
                className="animate-pulse"
              />
              <polygon
                points={getHexPolygonPoints(pPx, HEX_RADIUS + 4)}
                fill="#34d399"
                fillOpacity="0.08"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeOpacity="0.35"
                className="animate-pulse"
              />

              {/* Dimmed current facing arrow */}
              <g transform={`translate(${pPx.x}, ${pPx.y}) rotate(${currentAngle})`} opacity="0.3">
                <polygon points="18,-8 38,0 18,8 24,0" fill="#fbbf24" stroke="#090d16" strokeWidth="1" />
              </g>

              {/* Sweep arc showing rotation path */}
              <path
                d={arcPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.9"
                className="animate-pulse"
              />
              {/* Arc glow (thicker, blurred) */}
              <path
                d={arcPath}
                fill="none"
                stroke="#34d399"
                strokeWidth="10"
                strokeLinecap="round"
                strokeOpacity="0.2"
              />
              {/* Arrowhead at end of sweep arc */}
              <g transform={`translate(${arcTipX}, ${arcTipY}) rotate(${newAngle + (isClockwise ? 90 : -90)})`}>
                <polygon points="0,-5 9,5 -9,5" fill="#34d399" fillOpacity="0.95" stroke="#064e3b" strokeWidth="1" />
              </g>

              {/* Large destination arrow pointing in new facing direction */}
              <g transform={`translate(${pPx.x}, ${pPx.y}) rotate(${newAngle})`} className="animate-pulse">
                {/* Outer glow ellipse */}
                <ellipse cx={32} cy={0} rx={20} ry={14} fill="#34d399" fillOpacity="0.15" />
                {/* Big bold arrow */}
                <polygon
                  points="20,-11 46,0 20,11 28,0"
                  fill="#34d399"
                  fillOpacity="1"
                  stroke="#064e3b"
                  strokeWidth="2"
                />
              </g>

              {/* Label pill above the hex */}
              <g transform={`translate(${pPx.x}, ${pPx.y - 56})`}>
                <rect x="-38" y="-12" width="76" height="22" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" opacity="0.97" />
                <text x="0" y="4" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">
                  NEW FACING
                </text>
              </g>
            </g>
          );
        })()}

        {/* Render Projected Intent Trajectories & Threat Cones */}
        {filteredIntents.map((intent, idx) => {
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
                const prevIntent = filteredIntents.find(p => p.playerId === intent.playerId && p.slotIndex === intent.slotIndex - 1);
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
          const isLocal = localPlayerId === player.id;
          const playerEmote = activeEmotes.filter(e => e.senderId === player.id).slice(-1)[0];

          return (
            <foreignObject
              key={player.id}
              x={pixel.x - 48}
              y={pixel.y - 54}
              width={96}
              height={108}
              className="overflow-visible pointer-events-none transition-all duration-500 ease-out"
            >
              <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                <UnitToken player={player} isCurrentActor={isActor} isLocalPlayer={isLocal} activeEmote={playerEmote} />
              </div>
            </foreignObject>
          );
        })}

        {/* Realtime Ability & Spell Visual Effects (Line Renderers, Particles, Screen Flashes) */}
        <AbilityVFXOverlay
          currentAnimation={currentAnimation}
          players={players}
          hexRadius={HEX_RADIUS}
          center={CENTER}
          onShakeTrigger={handleShakeTrigger}
          onAnimationComplete={onAnimationComplete}
        />

        {/* Blood Particle Overlay */}
        <BloodParticleOverlay bursts={bloodBursts || []} hexRadius={HEX_RADIUS} center={CENTER} />

        {/* Combat Floater Overlay */}
        <CombatFloaterOverlay floaters={floaters || []} hexRadius={HEX_RADIUS} center={CENTER} />

        {/* Rune Tooltip Overlay */}
        {(() => {
          const hoveredTile = hexGrid.find(t => hoveredHex && hexEquals(t.coord, hoveredHex));
          if (!hoveredTile || hoveredTile.terrain !== 'rune') return null;

          const pixel = hexToPixel(hoveredTile.coord, HEX_RADIUS, CENTER);
          const cd = hoveredTile.runeCooldown || 0;
          const isReady = cd === 0;

          let accentColor = '#f59e0b';
          let title = 'EMPOWER RUNE';
          let desc = '+10 Damage for 2 turns';

          if (hoveredTile.runeEffect === 'heal') {
            accentColor = '#10b981';
            title = 'VITALITY RUNE';
            desc = '+15 HP & +5 HP Regen';
          } else if (hoveredTile.runeEffect === 'shield') {
            accentColor = '#38bdf8';
            title = 'SHIELD RUNE';
            desc = '+15 Shield & +5 Shield/turn';
          }

          return (
            <g transform={`translate(${pixel.x}, ${pixel.y - 58})`} className="pointer-events-none z-50">
              {/* Tooltip Card Panel */}
              <rect
                x="-80"
                y="-32"
                width="160"
                height="54"
                rx="8"
                fill="#090d16"
                stroke={accentColor}
                strokeWidth="1.8"
                opacity="0.95"
              />
              {/* Little anchor arrow pointing down */}
              <polygon
                points="-6,22 6,22 0,28"
                fill={accentColor}
              />
              <text y="-18" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="extrabold" fontFamily="monospace" letterSpacing="0.5">
                {title}
              </text>
              <text y="-5" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                {desc}
              </text>
              <text y="9" textAnchor="middle" fill={isReady ? "#34d399" : "#f43f5e"} fontSize="7.5" fontWeight="bold" fontFamily="monospace">
                {isReady ? "✦ READY TO CLAIM ✦" : `⌛ RESPAWNS IN ${cd} ROUNDS`}
              </text>
            </g>
          );
        })()}
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
