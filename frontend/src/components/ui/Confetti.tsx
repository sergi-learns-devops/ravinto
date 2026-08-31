'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: 'circle' | 'square' | 'star';
}

const COLORS = ['#5BB88A', '#FFA44A', '#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FBBF24'];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40, // center-ish
    y: -10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    shape: (['circle', 'square', 'star'] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setParticles(createParticles(40));
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
            border: p.shape === 'star' ? `${p.size / 3}px solid transparent` : 'none',
            borderBottom: p.shape === 'star' ? `${p.size}px solid ${p.color}` : 'none',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${2 + Math.random()}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
