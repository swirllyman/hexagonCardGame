import React, { useMemo } from 'react';
import type { BloodBurst, AxialCoord } from '../types/game';
import { hexToPixel } from '../utils/hexGrid';

interface BloodParticleOverlayProps {
  bursts: BloodBurst[];
  hexRadius: number;
  center: { x: number; y: number };
}

interface Particle {
  id: string;
  dx: number;
  dy: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  color: string;
  delayMs: number;
  durationMs: number;
}

const BLOOD_COLORS = [
  '#991b1b', // dark red
  '#dc2626', // red 600
  '#880808', // blood crimson
  '#f43f5e', // rose 500
  '#450a0a', // deep maroon blood
  '#7f1d1d', // red 900
  '#b91c1c', // red 700
];

function generateParticlesForBurst(burstId: string): Particle[] {
  const particles: Particle[] = [];
  const count = 26; // Number of blood droplets spraying out

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    // Spray distance outward from hex center (15px to 65px)
    const distance = 15 + Math.random() * 50;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    const color = BLOOD_COLORS[Math.floor(Math.random() * BLOOD_COLORS.length)];
    const radiusX = 2 + Math.random() * 4;
    const radiusY = 1.5 + Math.random() * 3;
    const rotation = (angle * 180) / Math.PI;
    const delayMs = Math.floor(Math.random() * 100);
    const durationMs = 900 + Math.floor(Math.random() * 400);

    particles.push({
      id: `${burstId}-p-${i}`,
      dx,
      dy,
      radiusX,
      radiusY,
      rotation,
      color,
      delayMs,
      durationMs,
    });
  }

  return particles;
}

export const BloodParticleOverlay: React.FC<BloodParticleOverlayProps> = ({ bursts, hexRadius, center }) => {
  const burstParticlesMap = useMemo(() => {
    const map = new Map<string, { coord: AxialCoord; particles: Particle[] }>();
    bursts.forEach(burst => {
      map.set(burst.id, {
        coord: burst.coord,
        particles: generateParticlesForBurst(burst.id),
      });
    });
    return map;
  }, [bursts]);

  if (bursts.length === 0) return null;

  return (
    <g className="pointer-events-none z-40">
      {Array.from(burstParticlesMap.entries()).map(([burstId, { coord, particles }]) => {
        const pixel = hexToPixel(coord, hexRadius, center);

        return (
          <g key={burstId} transform={`translate(${pixel.x}, ${pixel.y})`}>
            {/* Central Blood Spray Core Glow */}
            <circle
              cx={0}
              cy={0}
              r={hexRadius * 0.45}
              fill="rgba(185, 28, 28, 0.45)"
              className="animate-ping"
            />
            {/* Spraying Blood Droplets */}
            {particles.map(p => (
              <g
                key={p.id}
                style={{
                  transformOrigin: '0 0',
                  animationDelay: `${p.delayMs}ms`,
                  animationDuration: `${p.durationMs}ms`,
                  ['--dx' as any]: `${p.dx}px`,
                  ['--dy' as any]: `${p.dy}px`,
                }}
                className="animate-blood-spray"
              >
                <ellipse
                  cx={0}
                  cy={0}
                  rx={p.radiusX}
                  ry={p.radiusY}
                  fill={p.color}
                  transform={`rotate(${p.rotation})`}
                  opacity={0.9}
                  filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))"
                />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
};
