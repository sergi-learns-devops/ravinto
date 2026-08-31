'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CalorieRing } from '@/components/ui/CalorieRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { FireStreak } from '@/components/ui/FireStreak';
import { Confetti } from '@/components/ui/Confetti';
import { WeeklyGarden } from '@/components/ui/WeeklyGarden';
import { Botanical } from '@/components/ui/Botanical';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMeals } from '@/hooks/useMeals';
import { useAuthStore } from '@/stores/authStore';
import { analyticsService, WeeklySummary } from '@/services/analytics.service';
import { useTranslation } from '@/i18n';
import { api } from '@/services/api';

const mealTypeKeys = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
} as const;

const mealTypeConfig = {
  breakfast: { emoji: '🌅', color: 'from-amber-400/20 to-orange-400/20' },
  lunch: { emoji: '🌞', color: 'from-green-400/20 to-emerald-400/20' },
  dinner: { emoji: '🌙', color: 'from-indigo-400/20 to-purple-400/20' },
  snack: { emoji: '🍪', color: 'from-pink-400/20 to-rose-400/20' },
};

function getGreeting(t: any) {
  const hour = new Date().getHours();
  if (hour < 12) return t.good_morning;
  if (hour < 18) return t.good_afternoon;
  return t.good_evening;
}

export default function DashboardPage() {
  const { summary, loading } = useMeals();
  const user = useAuthStore((s) => s.user);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([]);
  const { t, locale } = useTranslation();

  const dateLocale = locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : 'es-ES';

  useEffect(() => {
    analyticsService.getStreak().then((data) => setStreak(data.streak_days)).catch(() => {});
    analyticsService.getWeekly().then(setWeekly).catch(() => {});
    api.get<any[]>('/api/workouts/daily').then(setTodayWorkouts).catch(() => {});
  }, []);

  // Trigger confetti when goal is reached
  useEffect(() => {
    if (summary && summary.total_kcal >= summary.goal_kcal * 0.95 && summary.total_kcal <= summary.goal_kcal * 1.05) {
      setShowConfetti(true);
    }
  }, [summary]);

  const firstName = user?.full_name?.split(' ')[0] || '';
  const goal = summary?.goal_kcal || user?.daily_goal_kcal || 2000;

  if (loading && !summary) {
    return (
      <AuthLayout>
        <DashboardSkeleton />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="animate-fade-in space-y-6 relative">
        {/* Decorative botanical - top right */}
        <div className="absolute -top-2 -right-2 w-20 h-28 opacity-60 pointer-events-none hidden md:block">
          <Botanical variant="leaf" color="#5BB88A" />
        </div>

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
            {getGreeting(t)}, {firstName} 🌱
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Hero Calorie Ring */}
        <Card glow="primary" className="flex flex-col items-center py-10 relative overflow-hidden">
          {/* Decorative fern */}
          <div className="absolute -bottom-4 -left-2 w-14 h-32 opacity-30 pointer-events-none">
            <Botanical variant="fern" color="#5BB88A" />
          </div>

          {loading ? (
            <div className="w-[240px] h-[240px] animate-pulse rounded-full bg-neutral-100/50 dark:bg-white/5" />
          ) : (
            <CalorieRing consumed={summary?.total_kcal || 0} goal={goal} />
          )}

          {/* Macros row */}
          {summary && (
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <AnimatedNumber
                  value={Math.round(summary.total_protein)}
                  className="text-lg text-neutral-800 dark:text-white"
                  suffix="g"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{t.protein}</p>
              </div>
              <div className="text-center">
                <AnimatedNumber
                  value={Math.round(summary.total_carbs)}
                  className="text-lg text-neutral-800 dark:text-white"
                  suffix="g"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{t.carbs}</p>
              </div>
              <div className="text-center">
                <AnimatedNumber
                  value={Math.round(summary.total_fat)}
                  className="text-lg text-neutral-800 dark:text-white"
                  suffix="g"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{t.fats}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Meals Grid */}
        {summary && summary.meals_count === 0 ? (
          <EmptyState variant="meals" />
        ) : (
        <div>
          <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-widest">
            {t.today_meals}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
              const config = mealTypeConfig[type];
              const meal = summary?.meals.find((m) => m.meal_type === type);
              const kcal = meal?.total_kcal || 0;

              return (
                <Card key={type} hover className="relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-50`} />
                  <div className="relative text-center py-2">
                    <span className="text-2xl block mb-1">{config.emoji}</span>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      {t[type]}
                    </p>
                    {kcal > 0 ? (
                      <AnimatedNumber
                        value={Math.round(kcal)}
                        className="text-xl mt-1 text-neutral-900 dark:text-white"
                        suffix=" kcal"
                      />
                    ) : (
                      <p className="text-xl font-mono font-bold text-neutral-300 dark:text-neutral-600 mt-1">—</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        )}

        {/* Weekly Garden */}
        {weekly && weekly.days.length > 0 && (
          <WeeklyGarden
            days={weekly.days.map((d) => ({
              date: d.date,
              total_kcal: d.total_kcal,
              goal,
            }))}
          />
        )}

        {/* Workout widget */}
        {todayWorkouts.length > 0 && (
          <Card glow="secondary" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-400/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-white">
                  {todayWorkouts.length} {todayWorkouts.length === 1 ? 'entrenament' : 'entrenaments'}
                </p>
                <p className="text-xs text-neutral-500">
                  <AnimatedNumber value={Math.round(todayWorkouts.reduce((s: number, w: any) => s + w.calories_burned, 0))} className="text-xs text-secondary-500" suffix=" kcal" /> {t.workout_calories.toLowerCase()}
                </p>
              </div>
            </div>
            <Link href="/workout" className="text-xs text-primary-500 font-medium hover:underline">
              {t.workout_recommendation} →
            </Link>
          </Card>
        )}

        {/* Fire Streak */}
        <FireStreak days={streak} />

        {/* Add Meal CTA - hidden on mobile (FAB exists) */}
        <div className="hidden lg:block">
          <Link href="/add-meal">
            <Button size="lg" className="w-full">
              <Plus className="w-5 h-5 mr-2" />
              {t.add_meal}
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
