import React from 'react';
import type { CombatFloater } from '../types/game';
import { hexToPixel } from '../utils/hexGrid';

interface CombatFloaterOverlayProps {
  floaters: CombatFloater[];
  hexRadius: number;
  center: { x: number; y: number };
}

export const CombatFloaterOverlay: React.FC<CombatFloaterOverlayProps> = ({ floaters, hexRadius, center }) => {
  if (floaters.length === 0) return null;

  // Group floaters by coord key so same-tile floaters stack vertically
  const coordGroups = new Map<string, CombatFloater[]>();
  floaters.forEach(f => {
    const key = `${f.coord.q},${f.coord.r}`;
    if (!coordGroups.has(key)) coordGroups.set(key, []);
    coordGroups.get(key)!.push(f);
  });

  const FLOATER_HEIGHT = 30; // px per stacked floater row
  const FLOATER_WIDTH = 120;
  const FLOATER_H = 28;

  return (
    <g className="pointer-events-none z-50">
      {floaters.map(f => {
        const key = `${f.coord.q},${f.coord.r}`;
        const group = coordGroups.get(key)!;
        const stackIndex = group.indexOf(f);

        const pixel = hexToPixel(f.coord, hexRadius, center);

        // Stack upward from center: first floater is at top, subsequent ones below
        const yOffset = stackIndex * FLOATER_HEIGHT;

        let fontSize = 7.5;
        let prefixIcon = '';
        let badgeBg = 'bg-rose-950/90 border-rose-500 text-rose-100 font-bold';
        let glow = 'rgba(239, 68, 68, 0.7)';

        switch (f.type) {
          case 'crit':
            glow = 'rgba(245, 158, 11, 0.8)';
            fontSize = 9;
            prefixIcon = '💥 ';
            badgeBg = 'bg-amber-950/90 border-amber-400 text-amber-100 font-extrabold scale-110';
            break;
          case 'damage':
            glow = 'rgba(239, 68, 68, 0.7)';
            fontSize = 7.5;
            prefixIcon = '⚔️ ';
            badgeBg = 'bg-red-950/90 border-red-500 text-red-100 font-bold';
            break;
          case 'shield_absorb':
            glow = 'rgba(56, 189, 248, 0.7)';
            fontSize = 6.5;
            prefixIcon = '🛡️ ';
            badgeBg = 'bg-sky-950/90 border-sky-400 text-sky-100 font-bold';
            break;
          case 'miss':
            glow = 'rgba(148, 163, 184, 0.5)';
            fontSize = 6.5;
            prefixIcon = '💨 ';
            badgeBg = 'bg-slate-900/90 border-slate-500 text-slate-300 font-semibold';
            break;
          case 'collision':
            glow = 'rgba(234, 179, 8, 0.8)';
            fontSize = 7;
            prefixIcon = '💥 ';
            badgeBg = 'bg-yellow-950/90 border-yellow-400 text-yellow-100 font-extrabold';
            break;
          case 'heal':
            glow = 'rgba(52, 211, 153, 0.8)';
            fontSize = 7;
            prefixIcon = '💚 ';
            badgeBg = 'bg-emerald-950/90 border-emerald-400 text-emerald-100 font-bold';
            break;
          case 'shield_up':
            glow = 'rgba(56, 189, 248, 0.8)';
            fontSize = 6.5;
            prefixIcon = '🛡️ ';
            badgeBg = 'bg-cyan-950/90 border-cyan-400 text-cyan-100 font-bold';
            break;
          case 'rune':
            glow = 'rgba(168, 85, 247, 0.8)';
            fontSize = 6.5;
            prefixIcon = '✦ ';
            badgeBg = 'bg-purple-950/90 border-purple-400 text-purple-100 font-bold';
            break;
          case 'hill':
            glow = 'rgba(234, 179, 8, 0.9)';
            fontSize = 7.5;
            prefixIcon = '👑 ';
            badgeBg = 'bg-amber-950/95 border-amber-400 text-amber-200 font-extrabold shadow-lg animate-pulse';
            break;
        }

        return (
          <foreignObject
            key={f.id}
            x={pixel.x - FLOATER_WIDTH / 2}
            y={pixel.y - 60 + yOffset}
            width={FLOATER_WIDTH}
            height={FLOATER_H}
            className="overflow-visible pointer-events-none z-50"
          >
            <div className="w-full h-full flex items-center justify-center animate-damage-float">
              <div
                className={`px-1.5 py-0.5 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-0.5 font-mono transition-all transform ${badgeBg}`}
                style={{
                  boxShadow: `0 0 8px ${glow}`,
                  fontSize: `${fontSize}px`,
                }}
              >
                <span>{prefixIcon}</span>
                <span>{f.text}</span>
              </div>
            </div>
          </foreignObject>
        );
      })}
    </g>
  );
};
