'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Plus, ScanBarcode } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useMeals } from '@/hooks/useMeals';
import { FoodItem } from '@/services/foods.service';
import { foodsService, CreateFoodData } from '@/services/foods.service';
import { useTranslation } from '@/i18n';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function AddMealPage() {
  const router = useRouter();
  const { results, loading: searchLoading, search, clearResults } = useFoodSearch();
  const { createMeal } = useMeals();
  const { t } = useTranslation();

  const mealTypes: { value: MealType; label: string; emoji: string }[] = [
    { value: 'breakfast', label: t.breakfast, emoji: '🌅' },
    { value: 'lunch', label: t.lunch, emoji: '🌞' },
    { value: 'dinner', label: t.dinner, emoji: '🌙' },
    { value: 'snack', label: t.snack, emoji: '🍪' },
  ];

  const [query, setQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [saving, setSaving] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Manual food creation
  const [manualName, setManualName] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      search(value);
    } else {
      clearResults();
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    try {
      const food = await foodsService.getByBarcode(barcode);
      setSelectedFood(food);
    } catch {
      // Food not found, show message
      setQuery(barcode);
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery('');
    clearResults();
  };

  const handleSave = async () => {
    if (!selectedFood) return;

    setSaving(true);
    try {
      await createMeal({
        meal_type: mealType,
        items: [{ food_item_id: selectedFood.id, quantity_grams: parseFloat(quantity) }],
      });
      router.push('/dashboard');
    } catch {
      // error handled in hook
    } finally {
      setSaving(false);
    }
  };

  const handleManualCreate = async () => {
    if (!manualName || !manualKcal) return;

    setSaving(true);
    try {
      const data: CreateFoodData = {
        name: manualName,
        kcal_per_100g: parseFloat(manualKcal),
        protein_per_100g: parseFloat(manualProtein) || 0,
        carbs_per_100g: parseFloat(manualCarbs) || 0,
        fat_per_100g: parseFloat(manualFat) || 0,
      };
      const food = await foodsService.create(data);
      setSelectedFood(food);
      setShowManual(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const estimatedKcal = selectedFood
    ? Math.round((selectedFood.kcal_per_100g * parseFloat(quantity || '0')) / 100)
    : 0;

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2E3530]">
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
          </button>
          <h1 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
            Añadir comida
          </h1>
        </div>

        {/* Meal Type Selection */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {mealTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setMealType(type.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                mealType === type.value
                  ? 'bg-primary-400 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-[#2E3530] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <span>{type.emoji}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Search or selected food */}
        {!selectedFood ? (
          <>
            {/* Search Input + Scanner button */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t.search_food}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-400/25 active:scale-95 transition-all"
                aria-label="Escanear código de barras"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            {searchLoading && (
              <div className="text-center py-4 text-sm text-neutral-500">{t.loading}</div>
            )}

            <div className="space-y-2 mb-4">
              {results.map((food) => (
                <Card
                  key={food.id}
                  hover
                  className="flex items-center justify-between p-3"
                  onClick={() => handleSelectFood(food)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-white truncate">
                      {food.name}
                    </p>
                    {food.brand && (
                      <p className="text-xs text-neutral-400 truncate">{food.brand}</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-mono font-bold text-primary-500">
                      {Math.round(food.kcal_per_100g)}
                    </p>
                    <p className="text-[10px] text-neutral-400">kcal/100g</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Manual creation button */}
            <button
              onClick={() => setShowManual(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              <Plus className="w-4 h-4" />
              {t.create_manual}
            </button>

            {/* Barcode Scanner */}
            {showScanner && (
              <BarcodeScanner
                onScan={handleBarcodeScan}
                onClose={() => setShowScanner(false)}
              />
            )}
          </>
        ) : (
          <>
            {/* Selected food card */}
            <Card className="mb-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{selectedFood.name}</p>
                  {selectedFood.brand && (
                    <p className="text-xs text-neutral-400">{selectedFood.brand}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-xs text-primary-500 hover:underline"
                >
                  Cambiar
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-xs mb-4">
                <div>
                  <p className="text-neutral-400">Kcal</p>
                  <p className="font-mono font-medium text-neutral-800 dark:text-white">
                    {Math.round(selectedFood.kcal_per_100g)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Prot</p>
                  <p className="font-mono font-medium text-neutral-800 dark:text-white">
                    {Math.round(selectedFood.protein_per_100g)}g
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Carbs</p>
                  <p className="font-mono font-medium text-neutral-800 dark:text-white">
                    {Math.round(selectedFood.carbs_per_100g)}g
                  </p>
                </div>
                <div>
                  <p className="text-neutral-400">Grasas</p>
                  <p className="font-mono font-medium text-neutral-800 dark:text-white">
                    {Math.round(selectedFood.fat_per_100g)}g
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-neutral-400 text-center">por 100g</p>
            </Card>

            {/* Quantity input */}
            <div className="mb-6">
              <Input
                label="Cantidad (gramos)"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="5000"
              />
              <p className="mt-2 text-center text-lg font-mono font-bold text-primary-500">
                {estimatedKcal} kcal
              </p>
            </div>

            {/* Save button */}
            <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
              Añadir a {mealTypes.find((t) => t.value === mealType)?.label?.toLowerCase()}
            </Button>
          </>
        )}

        {/* Manual creation modal */}
        <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="Crear alimento">
          <div className="space-y-3">
            <Input
              label="Nombre"
              placeholder="Ej: Tortilla de patatas casera"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
            />
            <Input
              label="Calorías por 100g"
              type="number"
              placeholder="150"
              value={manualKcal}
              onChange={(e) => setManualKcal(e.target.value)}
              required
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Proteína (g)"
                type="number"
                placeholder="0"
                value={manualProtein}
                onChange={(e) => setManualProtein(e.target.value)}
              />
              <Input
                label="Carbos (g)"
                type="number"
                placeholder="0"
                value={manualCarbs}
                onChange={(e) => setManualCarbs(e.target.value)}
              />
              <Input
                label="Grasas (g)"
                type="number"
                placeholder="0"
                value={manualFat}
                onChange={(e) => setManualFat(e.target.value)}
              />
            </div>
            <Button onClick={handleManualCreate} loading={saving} className="w-full mt-4">
              Crear alimento
            </Button>
          </div>
        </Modal>
      </div>
    </AuthLayout>
  );
}
