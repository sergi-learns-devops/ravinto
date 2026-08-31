'use client';

import { useState, useEffect } from 'react';
import { User, Target, Ruler, Activity, LogOut, Sparkles, Palette, Trash2, Download } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageCards } from '@/components/ui/LanguageCards';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { api } from '@/services/api';

const genderOptions = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
  { value: 'other', label: 'Otro' },
];

const goalOptions = [
  { value: 'lose', label: 'Perder peso', emoji: '📉' },
  { value: 'maintain', label: 'Mantener', emoji: '⚖️' },
  { value: 'gain', label: 'Ganar masa', emoji: '💪' },
];

const activityOptions = [
  { value: 'sedentary', label: 'Sedentario', desc: 'Poco o nada de ejercicio' },
  { value: 'light', label: 'Ligero', desc: 'Ejercicio 1-3 días/semana' },
  { value: 'moderate', label: 'Moderado', desc: 'Ejercicio 3-5 días/semana' },
  { value: 'active', label: 'Activo', desc: 'Ejercicio 6-7 días/semana' },
  { value: 'very_active', label: 'Muy activo', desc: 'Ejercicio intenso diario' },
];

interface Recommendations {
  bmr: number;
  tdee: number;
  recommended_kcal: number;
  recommended_protein_g: number;
  recommended_carbs_g: number;
  recommended_fat_g: number;
  formula: string;
  message: string;
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Profile state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [carbsGoal, setCarbsGoal] = useState('');
  const [fatGoal, setFatGoal] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load user data from API on mount
  useEffect(() => {
    authService.getMe().then((data) => {
      setUser(data);
      setFullName(data.full_name || '');
      setAge(data.age?.toString() || '');
      setGender(data.gender || '');
      setHeightCm(data.height_cm?.toString() || '');
      setWeightKg(data.weight_kg?.toString() || '');
      setGoal(data.goal || '');
      setActivityLevel(data.activity_level || '');
      setDailyGoal(data.daily_goal_kcal?.toString() || '2000');
      setProteinGoal(data.protein_goal_g?.toString() || '');
      setCarbsGoal(data.carbs_goal_g?.toString() || '');
      setFatGoal(data.fat_goal_g?.toString() || '');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload: Record<string, unknown> = { full_name: fullName };
      if (age) payload.age = parseInt(age);
      if (gender) payload.gender = gender;
      if (heightCm) payload.height_cm = parseFloat(heightCm);
      if (weightKg) payload.weight_kg = parseFloat(weightKg);
      if (goal) payload.goal = goal;
      if (activityLevel) payload.activity_level = activityLevel;
      if (dailyGoal) payload.daily_goal_kcal = parseInt(dailyGoal);
      if (proteinGoal) payload.protein_goal_g = parseInt(proteinGoal);
      if (carbsGoal) payload.carbs_goal_g = parseInt(carbsGoal);
      if (fatGoal) payload.fat_goal_g = parseInt(fatGoal);

      const updated = await api.patch<any>('/api/auth/me', payload);
      setUser(updated);
      setMessage('✅ Perfil actualizado');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const recs = await api.get<Recommendations>('/api/auth/me/recommendations');
      setRecommendations(recs);
    } catch (err) {
      setMessage('Completa edad, género, altura y peso para ver recomendaciones');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoadingRecs(false);
    }
  };

  const applyRecommendations = async () => {
    setSaving(true);
    try {
      const updated = await api.post<any>('/api/auth/me/apply-recommendations');
      setUser(updated);
      setDailyGoal(updated.daily_goal_kcal?.toString() || '');
      setProteinGoal(updated.protein_goal_g?.toString() || '');
      setCarbsGoal(updated.carbs_goal_g?.toString() || '');
      setFatGoal(updated.fat_goal_g?.toString() || '');
      setRecommendations(null);
      setMessage('✅ Objetivos actualizados con las recomendaciones');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Error al aplicar recomendaciones');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/auth/me');
      logout();
    } catch {
      setMessage('❌ Error al eliminar la cuenta');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <AuthLayout>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
          Mi perfil
        </h1>

        {message && (
          <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm text-center">
            {message}
          </div>
        )}

        {/* Avatar + Basic Info */}
        <Card>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-300">
                {initials}
              </span>
            </div>
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">{user?.full_name}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
            </div>
          </div>
          <Input
            label="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Card>

        {/* Body measurements */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Medidas corporales</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Edad"
              type="number"
              placeholder="25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="13"
              max="120"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                {genderOptions.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Altura (cm)"
              type="number"
              placeholder="170"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              min="50"
              max="300"
            />
            <Input
              label="Peso (kg)"
              type="number"
              placeholder="70"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              min="20"
              max="500"
            />
          </div>
        </Card>

        {/* Goal & Activity */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-secondary-400" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Objetivo y actividad</h2>
          </div>

          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
            ¿Cuál es tu objetivo?
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {goalOptions.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`p-3 rounded-lg text-center text-sm transition-all border ${
                  goal === g.value
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-[#3D4A42] hover:border-neutral-300 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <span className="text-lg block mb-0.5">{g.emoji}</span>
                <span className="font-medium">{g.label}</span>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
            Nivel de actividad
          </label>
          <div className="space-y-2">
            {activityOptions.map((a) => (
              <button
                key={a.value}
                onClick={() => setActivityLevel(a.value)}
                className={`w-full p-3 rounded-lg text-left text-sm transition-all border ${
                  activityLevel === a.value
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-[#3D4A42] hover:border-neutral-300'
                }`}
              >
                <span className={`font-medium ${activityLevel === a.value ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-700 dark:text-neutral-200'}`}>
                  {a.label}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">{a.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Calorie & Macro Goals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-400" />
              <h2 className="font-semibold text-neutral-900 dark:text-white">Objetivos nutricionales</h2>
            </div>
            <button
              onClick={fetchRecommendations}
              disabled={loadingRecs}
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingRecs ? 'Calculando...' : 'Calcular recomendación'}
            </button>
          </div>

          {recommendations && (
            <div className="mb-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-2">
                {recommendations.message}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-primary-600 dark:text-primary-400 mb-3">
                <span>Metabolismo basal: {Math.round(recommendations.bmr)} kcal</span>
                <span>Gasto total (TDEE): {Math.round(recommendations.tdee)} kcal</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                <div className="p-2 rounded bg-white dark:bg-[#1A1F1C]">
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">{Math.round(recommendations.recommended_kcal)}</p>
                  <p className="text-neutral-500">kcal</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#1A1F1C]">
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">{recommendations.recommended_protein_g}g</p>
                  <p className="text-neutral-500">proteína</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#1A1F1C]">
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">{recommendations.recommended_carbs_g}g</p>
                  <p className="text-neutral-500">carbos</p>
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#1A1F1C]">
                  <p className="font-mono font-bold text-neutral-900 dark:text-white">{recommendations.recommended_fat_g}g</p>
                  <p className="text-neutral-500">grasas</p>
                </div>
              </div>
              <Button onClick={applyRecommendations} size="sm" className="w-full">
                Aplicar estas recomendaciones
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Objetivo calórico diario (kcal)"
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                min="500"
                max="10000"
              />
            </div>
            <Input
              label="Proteína (g)"
              type="number"
              placeholder="—"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
            />
            <Input
              label="Carbohidratos (g)"
              type="number"
              placeholder="—"
              value={carbsGoal}
              onChange={(e) => setCarbsGoal(e.target.value)}
            />
            <Input
              label="Grasas (g)"
              type="number"
              placeholder="—"
              value={fatGoal}
              onChange={(e) => setFatGoal(e.target.value)}
            />
          </div>
        </Card>

        {/* Save button */}
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
          Guardar cambios
        </Button>

        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-accent-400" />
            <h2 className="font-semibold text-neutral-900 dark:text-white">Apariencia</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Tema</p>
              <ThemeToggle />
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Idioma</p>
              <LanguageCards />
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card>
          <h2 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-400" />
            Cuenta
          </h2>
          <div className="space-y-3">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me/export`}
              onClick={(e) => {
                e.preventDefault();
                const token = require('@/stores/authStore').useAuthStore.getState().accessToken;
                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me/export`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .then(r => r.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ravinto_export_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  });
              }}
              className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm text-neutral-600 dark:text-neutral-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-primary-500" />
              Exportar dades (CSV)
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
            <div className="border-t border-neutral-200/50 dark:border-white/5 pt-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar mi cuenta y datos
              </button>
              <p className="text-[11px] text-neutral-400 mt-1.5 px-3">
                Esta acción es irreversible. Se borrarán todos tus datos.
              </p>
            </div>
          </div>
        </Card>

        {/* Delete confirmation modal */}
        <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="¿Eliminar tu cuenta?">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                ⚠️ Esta acción no se puede deshacer
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                Se eliminarán permanentemente tu cuenta, historial de comidas, alimentos favoritos y toda tu información personal.
              </p>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Escribe <strong>eliminar</strong> para confirmar:
            </p>
            <Input
              placeholder="Escribe 'eliminar'"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                disabled={deleteConfirmText !== 'eliminar'}
                loading={deleting}
                onClick={handleDeleteAccount}
              >
                Eliminar cuenta
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthLayout>
  );
}
