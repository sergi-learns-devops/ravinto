'use client';

interface GardenDay {
  date: string;
  total_kcal: number;
  goal: number;
}

interface WeeklyGardenProps {
  days: GardenDay[];
}

function PlantForDay({ kcal, goal, dayLabel }: { kcal: number; goal: number; dayLabel: string }) {
  const percentage = goal > 0 ? Math.min(kcal / goal, 1.2) : 0;
  const hasData = kcal > 0;

  // Plant height based on percentage (0 = seed, 1 = full bloom)
  const stemHeight = hasData ? 20 + percentage * 35 : 0;
  const leafSize = hasData ? 3 + percentage * 5 : 0;
  const flowerSize = percentage >= 0.8 ? 4 + (percentage - 0.8) * 15 : 0;

  // Color based on how close to goal
  const color = !hasData
    ? '#D4D1CA'
    : percentage >= 0.9 && percentage <= 1.1
      ? '#5BB88A' // On target - green
      : percentage > 1.1
        ? '#F59E0B' // Over - amber
        : '#88CCAB'; // Under - light green

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-20 flex items-end justify-center">
        {hasData ? (
          <svg width="48" height="70" viewBox="0 0 48 70" className="overflow-visible">
            {/* Ground */}
            <ellipse cx="24" cy="68" rx="10" ry="3" fill={color} opacity="0.15" />

            {/* Stem */}
            <path
              d={`M24 68 C24 68 24 ${68 - stemHeight} 24 ${68 - stemHeight}`}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                strokeDasharray: stemHeight,
                strokeDashoffset: stemHeight,
                animation: `drawLine 1s ease-out ${0.2}s forwards`,
              }}
            />

            {/* Leaves */}
            {percentage >= 0.3 && (
              <path
                d={`M24 ${60 - stemHeight * 0.4} C${20 - leafSize} ${57 - stemHeight * 0.4} ${18 - leafSize} ${55 - stemHeight * 0.4} ${20} ${53 - stemHeight * 0.4}`}
                stroke={color}
                strokeWidth="1.5"
                fill={color}
                opacity="0.3"
                strokeLinecap="round"
                style={{ animation: `scaleIn 0.5s ease-out 0.8s both` }}
              />
            )}
            {percentage >= 0.5 && (
              <path
                d={`M24 ${55 - stemHeight * 0.5} C${28 + leafSize} ${52 - stemHeight * 0.5} ${30 + leafSize} ${50 - stemHeight * 0.5} ${28} ${48 - stemHeight * 0.5}`}
                stroke={color}
                strokeWidth="1.5"
                fill={color}
                opacity="0.3"
                strokeLinecap="round"
                style={{ animation: `scaleIn 0.5s ease-out 1s both` }}
              />
            )}

            {/* Flower/top */}
            {flowerSize > 0 && (
              <circle
                cx="24"
                cy={68 - stemHeight - 3}
                r={flowerSize}
                fill={color}
                opacity="0.5"
                style={{ animation: `scaleIn 0.5s ease-out 1.2s both` }}
              />
            )}
            {percentage >= 1.0 && (
              <circle
                cx="24"
                cy={68 - stemHeight - 3}
                r={flowerSize * 0.5}
                fill="white"
                opacity="0.6"
                style={{ animation: `scaleIn 0.3s ease-out 1.4s both` }}
              />
            )}
          </svg>
        ) : (
          // Empty day - seed
          <svg width="48" height="70" viewBox="0 0 48 70">
            <ellipse cx="24" cy="66" rx="6" ry="2.5" fill="#E8E6E1" opacity="0.5" />
            <circle cx="24" cy="63" r="3" fill="#D4D1CA" opacity="0.4" />
          </svg>
        )}
      </div>
      <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 capitalize">
        {dayLabel}
      </span>
      {hasData && (
        <span className="text-[9px] font-mono text-neutral-400">
          {Math.round(kcal)}
        </span>
      )}
    </div>
  );
}

export function WeeklyGarden({ days }: WeeklyGardenProps) {
  const dayNames = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🌱</span>
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          Tu jardín semanal
        </h3>
      </div>
      <div className="flex items-end justify-between px-1">
        {days.map((day, i) => (
          <PlantForDay
            key={day.date}
            kcal={day.total_kcal}
            goal={day.goal}
            dayLabel={dayNames[i] || dayNames[new Date(day.date).getDay()]}
          />
        ))}
      </div>
      <p className="text-[10px] text-neutral-400 text-center mt-3">
        Cada día que registras, tu jardín florece 🌿
      </p>
    </div>
  );
}
