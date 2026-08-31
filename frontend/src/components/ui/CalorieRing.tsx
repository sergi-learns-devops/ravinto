'use client';

import { AnimatedNumber } from './AnimatedNumber';
import { useTranslation } from '@/i18n';

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 240 }: CalorieRingProps) {
  const { t } = useTranslation();
  const percentage = Math.min((consumed / goal) * 100, 100);
  const radius = (size - 28) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGradientColors = () => {
    if (percentage >= 100) return { start: '#F87171', end: '#EF4444' };
    if (percentage >= 85) return { start: '#FBBF24', end: '#F59E0B' };
    return { start: '#5BB88A', end: '#3A9D6E' };
  };

  const colors = getGradientColors();

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full opacity-30 blur-2xl"
        style={{
          background: `conic-gradient(from 0deg, ${colors.start}, ${colors.end}, transparent)`,
          transform: `rotate(${(percentage / 100) * 360 - 90}deg)`,
        }}
      />

      {/* Orbital dots */}
      <div className="absolute inset-0" style={{ animation: 'orbitalSpin 20s linear infinite' }}>
        <div
          className="absolute w-2 h-2 rounded-full bg-primary-300/50"
          style={{ top: '10%', left: '50%' }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-accent-300/40"
          style={{ top: '50%', right: '5%' }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-secondary-300/50"
          style={{ bottom: '15%', left: '15%' }}
        />
      </div>

      <svg width={size} height={size} className="-rotate-90 ring-glow">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-neutral-200/50 dark:text-white/5"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={Math.round(consumed)}
          className="text-4xl"
          gradient
        />
        <span className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
          {t.of_goal} {goal} {t.of_kcal}
        </span>
        <div className="mt-2 px-3 py-1 rounded-full bg-primary-50/80 dark:bg-primary-900/20 backdrop-blur-sm">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
            {Math.round(percentage)}% {t.percent_goal}
          </span>
        </div>
      </div>
    </div>
  );
}
