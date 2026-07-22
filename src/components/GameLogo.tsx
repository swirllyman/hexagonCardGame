import React from 'react';

interface GameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const GameLogo: React.FC<GameLogoProps> = ({
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
          <img
            src="sprites/hex_clash_logo.png"
            alt="Hex Clash Icon"
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            onError={(e) => {
              // Hide image fallback if missing
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-tight leading-none gold-gradient-text flex items-center gap-1.5 whitespace-nowrap">
            HEX CLASH
          </span>
          {showSubtitle && (
            <span className="text-[9px] font-mono text-amber-200/70 font-normal leading-none">
              Tactical Command
            </span>
          )}
        </div>
      </div>
    );
  }

  const isLg = size === 'lg';

  return (
    <div className={`flex flex-col items-center text-center select-none relative group ${className}`}>
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-sky-500/10 blur-xl rounded-full opacity-70 animate-pulse pointer-events-none" />

      {/* Main Logo Banner Container */}
      <div className="relative flex flex-col items-center">
        {/* Hexagon Clash Graphic */}
        <div className={`relative ${isLg ? 'w-48 h-48 mb-2' : 'w-32 h-32 mb-1'} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
          <img
            src="sprites/hex_clash_logo.png"
            alt="Hex Clash Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]"
          />
        </div>

        {/* Dynamic Title Text */}
        <div className="relative flex flex-col items-center">
          <h1
            className={`font-black tracking-wider gold-gradient-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-fantasy ${
              isLg ? 'text-4xl' : 'text-2xl'
            }`}
            style={{
              letterSpacing: '0.08em',
            }}
          >
            HEX CLASH
          </h1>

          {showSubtitle && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-500/60" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300/90 tracking-[0.25em] uppercase drop-shadow">
                Tactical Command Duel
              </span>
              <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-500/60" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
