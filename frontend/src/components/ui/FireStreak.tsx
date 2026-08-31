'use client';

import { AnimatedNumber } from './AnimatedNumber';

interface FireStreakProps {
  days: number;
}

export function FireStreak({ days }: FireStreakProps) {
  if (days <= 0) return null;

  const intensity = Math.min(days / 30, 1); // 0 to 1 over 30 days
  const flameSize = 28 + intensity * 16; // 28px to 44px

  return (
    <div className="glass-card flex items-center gap-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute -left-4 -top-4 w-24 h-24 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, rgba(255,164,74,${0.15 + intensity * 0.15}), transparent)`,
        }}
      />

      {/* Fire container */}
      <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
        {/* Particles */}
        {days >= 3 && (
          <>
            <div className="absolute fire-particle" style={{ left: '30%', bottom: '60%', animationDelay: '0s' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary-300/70" />
            </div>
            <div className="absolute fire-particle" style={{ left: '60%', bottom: '50%', animationDelay: '0.6s' }}>
              <div className="w-1 h-1 rounded-full bg-orange-300/60" />
            </div>
            {days >= 7 && (
              <div className="absolute fire-particle" style={{ left: '45%', bottom: '70%', animationDelay: '1.2s' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-300/50" />
              </div>
            )}
          </>
        )}

        {/* Flame SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="fire-animate"
          style={{ width: flameSize, height: flameSize }}
        >
          <defs>
            <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="40%" stopColor="#F97316" />
              <stop offset="80%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
          </defs>
          <path
            d="M12 2C12 2 7 7 7 12C7 14.5 8.5 16.5 10 17.5C9 16 9.5 14 11 12.5C11 12.5 11.5 15 13 16.5C14.5 18 13 20 12 21C12 21 19 18 19 12C19 7 12 2 12 2Z"
            fill="url(#fireGradient)"
          />
          {/* Inner flame */}
          <path
            d="M12 8C12 8 9.5 11 9.5 13C9.5 14.5 10.5 15.5 11.5 16C11 15 11.5 13.5 12.5 12.5C12.5 12.5 13 14 14 15C14.5 15.5 14.5 16.5 14 17C14 17 16.5 15.5 16.5 13C16.5 10.5 12 8 12 8Z"
            fill="#FDE047"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="relative z-10">
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={days}
            className="text-2xl text-secondary-500"
          />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {days === 1 ? 'día' : 'días'}
          </span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {days >= 30 ? '🏆 ¡Racha legendaria!' :
           days >= 14 ? '⭐ ¡Imparable!' :
           days >= 7 ? '💪 ¡Gran racha!' :
           days >= 3 ? '🌱 ¡Sigue así!' :
           '✨ ¡Buen comienzo!'}
        </p>
      </div>
    </div>
  );
}
