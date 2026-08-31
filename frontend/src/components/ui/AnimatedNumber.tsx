'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  gradient?: boolean;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  className,
  gradient = false,
  suffix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      className={clsx(
        'font-mono font-bold tabular-nums number-animate',
        gradient && 'gradient-text',
        className
      )}
    >
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}
