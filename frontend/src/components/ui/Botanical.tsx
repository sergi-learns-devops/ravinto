'use client';

import { clsx } from 'clsx';

interface BotanicalProps {
  variant?: 'leaf' | 'branch' | 'fern';
  className?: string;
  color?: string;
}

export function Botanical({ variant = 'leaf', className, color = '#5BB88A' }: BotanicalProps) {
  if (variant === 'leaf') {
    return (
      <svg viewBox="0 0 80 120" fill="none" className={clsx('botanical-draw', className)}>
        <path
          d="M40 110 C40 110 20 80 15 55 C10 30 25 10 40 5 C55 10 70 30 65 55 C60 80 40 110 40 110Z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
          style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'drawLine 2s ease-out forwards' }}
        />
        <path
          d="M40 15 L40 105"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
          style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'drawLine 1.5s ease-out 0.5s forwards' }}
        />
        <path
          d="M40 35 C35 30 28 32 25 38"
          stroke={color}
          strokeWidth="1"
          opacity="0.25"
          strokeLinecap="round"
          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 1s ease-out 1s forwards' }}
        />
        <path
          d="M40 55 C45 50 52 52 55 58"
          stroke={color}
          strokeWidth="1"
          opacity="0.25"
          strokeLinecap="round"
          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 1s ease-out 1.2s forwards' }}
        />
        <path
          d="M40 75 C35 70 28 72 25 78"
          stroke={color}
          strokeWidth="1"
          opacity="0.25"
          strokeLinecap="round"
          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 1s ease-out 1.4s forwards' }}
        />
      </svg>
    );
  }

  if (variant === 'branch') {
    return (
      <svg viewBox="0 0 120 80" fill="none" className={clsx('botanical-draw', className)}>
        <path
          d="M10 70 C30 65 50 50 70 40 C90 30 100 20 110 15"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.3"
          style={{ strokeDasharray: 150, strokeDashoffset: 150, animation: 'drawLine 2s ease-out forwards' }}
        />
        <circle cx="45" cy="52" r="4" stroke={color} strokeWidth="1" opacity="0.25" fill="none"
          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'drawLine 0.8s ease-out 0.8s forwards' }} />
        <circle cx="70" cy="38" r="3" stroke={color} strokeWidth="1" opacity="0.2" fill="none"
          style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: 'drawLine 0.8s ease-out 1s forwards' }} />
        <circle cx="95" cy="22" r="5" stroke={color} strokeWidth="1" opacity="0.25" fill="none"
          style={{ strokeDasharray: 35, strokeDashoffset: 35, animation: 'drawLine 0.8s ease-out 1.2s forwards' }} />
      </svg>
    );
  }

  // Fern
  return (
    <svg viewBox="0 0 60 140" fill="none" className={clsx('botanical-draw', className)}>
      <path
        d="M30 130 C30 130 30 70 30 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'drawLine 1.5s ease-out forwards' }}
      />
      {[20, 35, 50, 65, 80, 95].map((y, i) => (
        <path
          key={`left-${i}`}
          d={`M30 ${y} C${25 - i} ${y - 5} ${15 - i * 0.5} ${y - 3} ${10 + i} ${y + 2}`}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
          style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: `drawLine 0.8s ease-out ${0.5 + i * 0.15}s forwards` }}
        />
      ))}
      {[25, 40, 55, 70, 85, 100].map((y, i) => (
        <path
          key={`right-${i}`}
          d={`M30 ${y} C${35 + i} ${y - 5} ${45 + i * 0.5} ${y - 3} ${50 - i} ${y + 2}`}
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
          style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: `drawLine 0.8s ease-out ${0.6 + i * 0.15}s forwards` }}
        />
      ))}
    </svg>
  );
}
