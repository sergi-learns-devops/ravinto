'use client';

import { useEffect, useState } from 'react';

function getTimeColors() {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 10) {
    // Morning - warm sunrise
    return {
      blob1: 'rgba(255, 190, 125, 0.12)',
      blob2: 'rgba(255, 164, 74, 0.08)',
      blob3: 'rgba(91, 184, 138, 0.06)',
    };
  } else if (hour >= 10 && hour < 17) {
    // Day - fresh green/blue
    return {
      blob1: 'rgba(91, 184, 138, 0.10)',
      blob2: 'rgba(167, 139, 250, 0.07)',
      blob3: 'rgba(96, 165, 250, 0.05)',
    };
  } else if (hour >= 17 && hour < 21) {
    // Evening - warm sunset
    return {
      blob1: 'rgba(251, 146, 60, 0.10)',
      blob2: 'rgba(167, 139, 250, 0.08)',
      blob3: 'rgba(244, 114, 182, 0.06)',
    };
  } else {
    // Night - deep calm
    return {
      blob1: 'rgba(99, 102, 241, 0.08)',
      blob2: 'rgba(167, 139, 250, 0.06)',
      blob3: 'rgba(91, 184, 138, 0.04)',
    };
  }
}

export function AuroraBackground() {
  const [colors, setColors] = useState(getTimeColors);

  useEffect(() => {
    // Update every 30 minutes
    const interval = setInterval(() => setColors(getTimeColors()), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 - Top left, slow drift */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-80"
        style={{
          background: `radial-gradient(circle, ${colors.blob1}, transparent 70%)`,
          top: '-20%',
          left: '-10%',
          animation: 'auroraFloat1 25s ease-in-out infinite',
        }}
      />
      {/* Blob 2 - Bottom right */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-80"
        style={{
          background: `radial-gradient(circle, ${colors.blob2}, transparent 70%)`,
          bottom: '-15%',
          right: '-5%',
          animation: 'auroraFloat2 30s ease-in-out infinite',
        }}
      />
      {/* Blob 3 - Center floating */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-60"
        style={{
          background: `radial-gradient(circle, ${colors.blob3}, transparent 70%)`,
          top: '40%',
          left: '30%',
          animation: 'auroraFloat3 20s ease-in-out infinite',
        }}
      />
    </div>
  );
}
