'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { analyticsService, WeeklySummary } from '@/services/analytics.service';
import { useAuthStore } from '@/stores/authStore';

export default function HistoryPage() {
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const goal = user?.daily_goal_kcal || 2000;

  useEffect(() => {
    analyticsService
      .getWeekly()
      .then(setWeekly)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = weekly?.days.map((d) => ({
    name: new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    kcal: d.total_kcal,
    date: d.date,
  })) || [];

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-6">
          Historial
        </h1>

        {/* Weekly Chart */}
        <Card className="mb-6">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wide">
            Últimos 7 días
          </h2>

          {loading ? (
            <div className="h-[200px] animate-pulse bg-neutral-100 dark:bg-[#2E3530] rounded-lg" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#A8A49C' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#A8A49C' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine y={goal} stroke="#5BB88A" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Bar
                    dataKey="kcal"
                    radius={[6, 6, 0, 0]}
                    fill="#5BB88A"
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary-400" />
              Consumido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-primary-400" style={{ width: 12 }} />
              Objetivo ({goal} kcal)
            </span>
          </div>
        </Card>

        {/* Weekly Stats */}
        {weekly && (
          <Card className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Total semanal</p>
                <p className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
                  {Math.round(weekly.total_kcal).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Media diaria</p>
                <p className="text-xl font-mono font-bold text-neutral-900 dark:text-white">
                  {Math.round(weekly.average_kcal).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400">kcal/día</p>
              </div>
            </div>
          </Card>
        )}

        {/* Daily breakdown */}
        <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">
          Detalle diario
        </h2>
        <div className="space-y-2">
          {chartData.map((day) => {
            const percentage = Math.min((day.kcal / goal) * 100, 100);
            const isOver = day.kcal > goal;

            return (
              <Card key={day.date} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-800 dark:text-white capitalize">
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                  </p>
                  <div className="w-full h-2 bg-neutral-100 dark:bg-[#2E3530] rounded-full mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-400' : day.kcal > 0 ? 'bg-primary-400' : 'bg-neutral-200'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-bold ${isOver ? 'text-red-500' : 'text-neutral-800 dark:text-white'}`}>
                    {day.kcal > 0 ? Math.round(day.kcal) : '—'}
                  </p>
                  {day.kcal > 0 && <p className="text-[10px] text-neutral-400">kcal</p>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AuthLayout>
  );
}
