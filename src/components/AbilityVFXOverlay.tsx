import React, { useEffect, useState, useRef } from 'react';
import type { StepAnimationState, PlayerState } from '../types/game';
import { hexToPixel } from '../utils/hexGrid';

interface AbilityVFXOverlayProps {
  currentAnimation: StepAnimationState | null;
  players: PlayerState[];
  hexRadius: number;
  center: { x: number; y: number };
  onShakeTrigger?: (intensity: string, durationMs: number) => void;
  onAnimationComplete?: () => void;
}

interface ParticleInstance {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  maxLife: number;
  life: number;
  type: string;
}

export const AbilityVFXOverlay: React.FC<AbilityVFXOverlayProps> = ({
  currentAnimation,
  players,
  hexRadius,
  center,
  onShakeTrigger,
  onAnimationComplete,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [particles, setParticles] = useState<ParticleInstance[]>([]);
  const [flashOpacity, setFlashOpacity] = useState<number>(0);
  const [flashColor, setFlashColor] = useState<string>('#ffffff');
  const animFrameRef = useRef<number | null>(null);

  const actor = currentAnimation ? players.find(p => p.id === currentAnimation.actorId) : null;
  const fromPx = (currentAnimation?.fromCoord && actor)
    ? hexToPixel(currentAnimation.fromCoord, hexRadius, center)
    : (actor ? hexToPixel(actor.coord, hexRadius, center) : { x: 0, y: 0 });

  const targetCoords = currentAnimation?.targetCoords || (currentAnimation?.toCoord ? [currentAnimation.toCoord] : []);
  const targetPx = targetCoords.length > 0
    ? hexToPixel(targetCoords[0], hexRadius, center)
    : (currentAnimation?.toCoord ? hexToPixel(currentAnimation.toCoord, hexRadius, center) : fromPx);

  // Initialize Particles & Screen Shake / Flash on animation start
  useEffect(() => {
    if (!currentAnimation) {
      setProgress(0);
      setParticles([]);
      setFlashOpacity(0);
      return;
    }

    const vfx = currentAnimation.vfxConfig;
    if (vfx?.screenShake && onShakeTrigger) {
      onShakeTrigger(vfx.screenShake.intensity, vfx.screenShake.durationMs);
    }

    if (vfx?.colorFlash) {
      setFlashColor(vfx.colorFlash.color);
      setFlashOpacity(vfx.colorFlash.opacity);
    }

    // Spawn Particles
    if (vfx?.particles && vfx.particles.length > 0) {
      const newParticles: ParticleInstance[] = [];
      let pId = 0;

      vfx.particles.forEach(spec => {
        const count = spec.count || 20;
        const color = spec.color || '#fbbf24';
        const type = spec.type;
        const spread = spec.spreadRadius || 40;

        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * spread;
          
          let vx = Math.cos(angle) * (1 + Math.random() * 3);
          let vy = Math.sin(angle) * (1 + Math.random() * 3);
          let px = targetPx.x + Math.cos(angle) * (dist * 0.2);
          let py = targetPx.y + Math.sin(angle) * (dist * 0.2);

          let size = 2 + Math.random() * 4;
          let maxLife = 20 + Math.random() * 25;
          let initialOpacity = 0.9;

          if (type === 'vortex_implode') {
            px = targetPx.x + Math.cos(angle) * (40 + Math.random() * 30);
            py = targetPx.y + Math.sin(angle) * (40 + Math.random() * 30);
            vx = (targetPx.x - px) * 0.08;
            vy = (targetPx.y - py) * 0.08;
          } else if (type === 'energy_gather') {
            px = fromPx.x + Math.cos(angle) * (35 + Math.random() * 25);
            py = fromPx.y + Math.sin(angle) * (35 + Math.random() * 25);
            vx = (fromPx.x - px) * 0.07;
            vy = (fromPx.y - py) * 0.07;
          } else if (type === 'holy_glow') {
            px = fromPx.x + (Math.random() - 0.5) * 30;
            py = fromPx.y + (Math.random() - 0.5) * 30;
            vx = (Math.random() - 0.5) * 1.5;
            vy = - (1 + Math.random() * 2);
          } else if (type === 'dust_debris') {
            px = fromPx.x + (Math.random() - 0.5) * (spread * 0.5);
            py = fromPx.y + (Math.random() - 0.5) * (spread * 0.5) + 8;
            vx = (Math.random() - 0.5) * 0.5;
            vy = -(0.2 + Math.random() * 0.4);
            size = 1.2 + Math.random() * 1.5;
            maxLife = 10 + Math.random() * 8;
            initialOpacity = 0.45;
          }

          newParticles.push({
            id: pId++,
            x: px,
            y: py,
            vx,
            vy,
            size,
            color,
            opacity: initialOpacity,
            maxLife,
            life: 0,
            type,
          });
        }
      });

      setParticles(newParticles);
    }
  }, [currentAnimation]);

  // Main Render Loop for Progress, Particles & Flash decay
  useEffect(() => {
    if (!currentAnimation) return;

    const startTime = currentAnimation.startTime || Date.now();
    const duration = currentAnimation.totalDurationMs || 450;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      // Fade out flash
      if (flashOpacity > 0) {
        setFlashOpacity(prev => Math.max(0, prev - 0.04));
      }

      // Update particles
      let activePtsCount = 0;
      setParticles(prev => {
        const nextPts = prev.map(pt => ({
          ...pt,
          x: pt.x + pt.vx,
          y: pt.y + pt.vy,
          opacity: Math.max(0, 1 - (pt.life / pt.maxLife)),
          life: pt.life + 1,
        })).filter(pt => pt.life < pt.maxLife && pt.opacity > 0);
        activePtsCount = nextPts.length;
        return nextPts;
      });

      if (p < 1 || activePtsCount > 0) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentAnimation]);

  if (!currentAnimation) return null;

  const lineSpec = currentAnimation.vfxConfig?.lineRenderer;
  const lineStyle = lineSpec?.style;
  const lineColor = lineSpec?.color || '#f43f5e';
  const glowColor = lineSpec?.glowColor || lineColor;
  const lineWidth = lineSpec?.width || 5;

  const fadeAlpha = Math.max(0, 1 - Math.max(0, (progress - 0.55) / 0.45));

  // Compute Current Projectile / Beam Head Position based on progress
  const projX = fromPx.x + (targetPx.x - fromPx.x) * progress;
  const projY = fromPx.y + (targetPx.y - fromPx.y) * progress;

  // Generate procedural fractal zigzag points for Lightning line renderers
  const getLightningPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.floor(dist / 15));

    let path = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const midX = x1 + dx * t;
      const midY = y1 + dy * t;
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);
      const offset = (Math.random() - 0.5) * 18;
      path += ` L ${(midX + perpX * offset).toFixed(1)} ${(midY + perpY * offset).toFixed(1)}`;
    }
    path += ` L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    return path;
  };

  return (
    <g className="pointer-events-none z-40">
      <defs>
        <filter id="vfxGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="projectileGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="1" />
          <stop offset="60%" stopColor={glowColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Screen Color Flash Overlay */}
      {flashOpacity > 0 && (
        <rect
          x="-200"
          y="-200"
          width="1200"
          height="1000"
          fill={flashColor}
          fillOpacity={flashOpacity}
        />
      )}

      {/* LINE RENDERERS GROUP */}
      <g style={{ opacity: fadeAlpha }}>
        {/* 1. BEAM / LASER LINE RENDERER */}
        {lineStyle === 'beam' && (
        <g filter="url(#vfxGlow)">
          {/* Background Outer Glow Beam */}
          <line
            x1={fromPx.x}
            y1={fromPx.y}
            x2={projX}
            y2={projY}
            stroke={glowColor}
            strokeWidth={lineWidth * 2}
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Inner Bright Core Beam */}
          <line
            x1={fromPx.x}
            y1={fromPx.y}
            x2={projX}
            y2={projY}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeLinecap="round"
            opacity="0.95"
          />
          {/* Projectile Orb Head */}
          <circle
            cx={projX}
            cy={projY}
            r={lineWidth * 2.2}
            fill="url(#projectileGlow)"
          />
        </g>
      )}

      {/* 2. JAGGED LIGHTNING LINE RENDERER */}
      {lineStyle === 'lightning' && (
        <g filter="url(#vfxGlow)">
          <path
            d={getLightningPath(fromPx.x, fromPx.y, targetPx.x, targetPx.y)}
            fill="none"
            stroke={glowColor}
            strokeWidth={lineWidth * 1.8}
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d={getLightningPath(fromPx.x, fromPx.y, targetPx.x, targetPx.y)}
            fill="none"
            stroke="#ffffff"
            strokeWidth={lineWidth * 0.7}
            strokeLinecap="round"
            opacity="0.95"
          />
        </g>
      )}

      {/* 3. CHAIN / TETHER LINE RENDERER */}
      {lineStyle === 'chain' && (
        <g filter="url(#vfxGlow)">
          <line
            x1={fromPx.x}
            y1={fromPx.y}
            x2={projX}
            y2={projY}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeDasharray="6,4"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Hook / Harpoon Head */}
          <circle cx={projX} cy={projY} r={6} fill={lineColor} stroke="#ffffff" strokeWidth="1.5" />
        </g>
      )}

      {/* 4. DASH STREAM & GHOST TRAILS */}
      {lineStyle === 'dash_stream' && (
        <g filter="url(#vfxGlow)">
          <line
            x1={fromPx.x}
            y1={fromPx.y}
            x2={projX}
            y2={projY}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeDasharray="10,6"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Ghost Trail Silhouettes */}
          {[0.25, 0.5, 0.75].map((stepRatio, idx) => {
            if (progress < stepRatio) return null;
            const gx = fromPx.x + (targetPx.x - fromPx.x) * stepRatio;
            const gy = fromPx.y + (targetPx.y - fromPx.y) * stepRatio;
            return (
              <circle
                key={`ghost-${idx}`}
                cx={gx}
                cy={gy}
                r={hexRadius * 0.5}
                fill={lineColor}
                fillOpacity={0.25 * (1 - stepRatio)}
                stroke={glowColor}
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />
            );
          })}
        </g>
      )}

      {/* 5. EXPANDING SHOCKWAVE RING */}
      {(lineStyle === 'shockwave_ring' || currentAnimation.vfxConfig?.hasShockwaveRipple) && (
        <circle
          cx={targetPx.x}
          cy={targetPx.y}
          r={hexRadius * (0.3 + progress * 1.6)}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.max(1, lineWidth * (1 - progress))}
          strokeOpacity={0.9 * (1 - progress)}
          filter="url(#vfxGlow)"
        />
      )}

      {/* 6. SIPHON DUAL-HELIX STREAM */}
      {lineStyle === 'siphon' && (
        <g filter="url(#vfxGlow)">
          <line
            x1={targetPx.x}
            y1={targetPx.y}
            x2={fromPx.x}
            y2={fromPx.y}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeDasharray="5,3"
            opacity="0.9"
          />
          <circle cx={fromPx.x + (targetPx.x - fromPx.x) * (1 - progress)} cy={fromPx.y + (targetPx.y - fromPx.y) * (1 - progress)} r={5} fill={lineColor} />
        </g>
      )}
      </g>

      {/* 7. PARTICLES LAYER */}
      {particles.map(p => (
        <circle
          key={`pt-${p.id}`}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={p.color}
          fillOpacity={p.opacity}
          filter="url(#vfxGlow)"
        />
      ))}
    </g>
  );
};
