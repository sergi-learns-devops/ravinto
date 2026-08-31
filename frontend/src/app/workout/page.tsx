'use client';

import { useState, useEffect } from 'react';
import { Dumbbell, Clock, Flame, UtensilsCrossed, Droplets, Trash2 } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useTranslation } from '@/i18n';
import { api } from '@/services/api';

const disciplines = [
  'weights', 'running', 'padel', 'crossfit', 'hyrox', 'boxing',
  'swimming', 'cycling', 'yoga', 'hiit', 'functional', 'other',
] as const;

const disciplineEmojis: Record<string, string> = {
  weights: '🏋️', running: '🏃', padel: '🎾', crossfit: '🔥', hyrox: '💀',
  boxing: '🥊', swimming: '🏊', cycling: '🚴', yoga: '🧘', hiit: '⚡',
  functional: '💪', other: '🏅',
};

interface Workout {
  id: string; discipline: string; duration_min: number; intensity: string;
  workout_time: string; date: string; calories_burned: number; notes: string | null;
}

interface Recommendation {
  meal_type: string; summary: string; details: string; timing: string;
  macros: { protein_priority: string; carbs_priority: string; fat_priority: string; hydration: string };
  meal_examples: { name: string; description: string; approx_kcal: number; highlight: string }[];
}

export default function WorkoutPage() {
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [discipline, setDiscipline] = useState('');
  const [duration, setDuration] = useState('45');
  const [intensity, setIntensity] = useState('medium');
  const [workoutTime, setWorkoutTime] = useState(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );

  const fetchWorkouts = async () => {
    try {
      const data = await api.get<Workout[]>('/api/workouts/daily');
      setWorkouts(data);
      if (data.length > 0) {
        const rec = await api.get<Recommendation>(`/api/workouts/${data[data.length - 1].id}/recommendation`);
        setRecommendation(rec);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkouts(); }, []);

  const handleSave = async () => {
    if (!discipline) return;
    setSaving(true);
    try {
      await api.post('/api/workouts/', {
        discipline, duration_min: parseInt(duration), intensity, workout_time: workoutTime,
      });
      setDiscipline('');
      await fetchWorkouts();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/workouts/${id}`);
      setRecommendation(null);
      await fetchWorkouts();
    } catch {}
  };

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories_burned, 0);
  const priorityColors: Record<string, string> = {
    high: 'text-red-500', medium: 'text-amber-500', low: 'text-green-500',
  };

  const dKey = (d: string) => `d_${d}` as keyof typeof t;

  return (
    <AuthLayout>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
          {t.workout_title} 💪
        </h1>

        {/* Today's workouts */}
        {workouts.length > 0 && (
          <Card glow="secondary">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                {t.workout_today}
              </h2>
              <div className="flex items-center gap-1 text-secondary-500">
                <Flame className="w-4 h-4" />
                <AnimatedNumber value={Math.round(totalCalories)} className="text-sm" suffix=" kcal" />
              </div>
            </div>
            <div className="space-y-2">
              {workouts.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{disciplineEmojis[w.discipline] || '🏅'}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800 dark:text-white">
                        {t[dKey(w.discipline)] || w.discipline}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {w.duration_min} min · {t[`workout_${w.intensity}` as keyof typeof t]} · {w.workout_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-secondary-500">{Math.round(w.calories_burned)} kcal</span>
                    <button onClick={() => handleDelete(w.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Nutrition Recommendation */}
        {recommendation && (
          <Card glow="primary" className="space-y-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-neutral-900 dark:text-white">{t.workout_recommendation}</h2>
            </div>

            <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/10">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">{recommendation.summary}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{recommendation.details}</p>
            </div>

            {/* Macro priorities */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5">
                <p className="text-neutral-500">{t.workout_macros_protein}</p>
                <p className={`font-bold ${priorityColors[recommendation.macros.protein_priority]}`}>
                  {t[`workout_priority_${recommendation.macros.protein_priority}` as keyof typeof t]}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5">
                <p className="text-neutral-500">{t.workout_macros_carbs}</p>
                <p className={`font-bold ${priorityColors[recommendation.macros.carbs_priority]}`}>
                  {t[`workout_priority_${recommendation.macros.carbs_priority}` as keyof typeof t]}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5">
                <p className="text-neutral-500">{t.workout_macros_fat}</p>
                <p className={`font-bold ${priorityColors[recommendation.macros.fat_priority]}`}>
                  {t[`workout_priority_${recommendation.macros.fat_priority}` as keyof typeof t]}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-white/40 dark:bg-white/5">
                <Droplets className="w-3.5 h-3.5 mx-auto text-blue-400 mb-0.5" />
                <p className="text-[10px] text-blue-500">{recommendation.macros.hydration}</p>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.workout_timing}: {recommendation.timing}</span>
            </div>

            {/* Meal examples */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2 uppercase tracking-wide">
                {t.workout_examples}
              </h3>
              <div className="space-y-2">
                {recommendation.meal_examples.map((meal, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10">
                    <p className="text-sm font-medium text-neutral-800 dark:text-white">{meal.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{meal.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-primary-500 font-medium italic">{meal.highlight}</span>
                      <span className="text-xs font-mono text-neutral-400">~{meal.approx_kcal} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Add workout form */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-secondary-400" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">{t.workout_add}</h2>
          </div>

          {/* Discipline selector */}
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-2">
            {t.workout_discipline}
          </label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {disciplines.map((d) => (
              <button
                key={d}
                onClick={() => setDiscipline(d)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all border ${
                  discipline === d
                    ? 'border-primary-400 bg-primary-50/80 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-white/30 dark:border-white/5 hover:border-neutral-300 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="text-lg">{disciplineEmojis[d]}</span>
                <span className="font-medium truncate w-full text-center">{t[dKey(d)]}</span>
              </button>
            ))}
          </div>

          {/* Duration, Intensity, Time */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Input
              label={t.workout_duration}
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1" max="600"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">{t.workout_intensity}</label>
              <select value={intensity} onChange={(e) => setIntensity(e.target.value)} className="input-field">
                <option value="low">{t.workout_low}</option>
                <option value="medium">{t.workout_medium}</option>
                <option value="high">{t.workout_high}</option>
              </select>
            </div>
            <Input
              label={t.workout_time}
              type="time"
              value={workoutTime}
              onChange={(e) => setWorkoutTime(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} loading={saving} disabled={!discipline} size="lg" className="w-full">
            <Dumbbell className="w-4 h-4 mr-2" />
            {t.workout_add}
          </Button>
        </Card>
      </div>
    </AuthLayout>
  );
}
