'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Target } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { getMeals, addMeal, updateMeal, deleteMeal } from '@/lib/meals';
import { getActiveGoals, addGoal, updateGoal } from '@/lib/goals';
import {
  addMealOffline,
  getMealsOffline,
  updateMealOffline,
  deleteMealOffline,
  addToSyncQueue,
} from '@/lib/offline/offlineStore';
import { useOffline } from '@/lib/hooks/useOffline';
import { Meal, Goal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import MealList from '@/components/features/MealList';
import MealForm from '@/components/features/MealForm';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel, { FilterOptions } from '@/components/features/FilterPanel';
import SemicircleTargetCard from '@/components/features/SemicircleTargetCard';
import { searchAndFilterMeals } from '@/lib/utils/search';
import { triggerMealNotifications } from '@/lib/notificationTriggers';
import { useCachedData } from '@/lib/hooks/useCachedData';

type NutritionViewMode = 'today' | 'day' | 'all';

const getLocalDayKey = (value: Date | string): string => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const estimateMacrosFromCalories = (calories: number) => {
  // Practical default split: 30% protein, 40% carbs, 30% fat.
  return {
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
};

export default function NutritionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isOnline, setUid } = useOffline();

  // Cached data fetching — instant on revisit
  const {
    data: meals = [],
    loading: mealLoading,
    setData: setMeals,
  } = useCachedData<Meal[]>({
    key: `meals:${user?.uid}`,
    fetcher: useCallback(async () => {
      if (isOnline) {
        return getMeals(user!.uid);
      } else {
        return getMealsOffline(user!.uid);
      }
    }, [user, isOnline]),
    enabled: !!user,
  });

  const { data: nutritionGoals = [], setData: setNutritionGoals } = useCachedData<Goal[]>({
    key: `goals:${user?.uid}:nutrition-targets`,
    fetcher: useCallback(async () => {
      const goals = await getActiveGoals(user!.uid);
      return goals.filter((goal) => goal.type === 'calories' || goal.type === 'macros');
    }, [user]),
    enabled: !!user,
    ttl: 2 * 60 * 1000,
  });

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [viewMode, setViewMode] = useState<NutritionViewMode>('today');
  const [selectedDay, setSelectedDay] = useState(getLocalDayKey(new Date()));
  const [targetSaving, setTargetSaving] = useState(false);
  const [isTargetPanelOpen, setIsTargetPanelOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState({
    calories: '2200',
    protein: '165',
    carbs: '220',
    fat: '73',
  });

  // Set UID for sync manager
  useEffect(() => {
    if (user) setUid(user.uid);
  }, [user, setUid]);

  useEffect(() => {
    if (!nutritionGoals.length) return;

    const caloriesGoal = nutritionGoals.find((goal) => goal.type === 'calories');
    const macrosGoal = nutritionGoals.find((goal) => goal.type === 'macros');

    setTargetDraft((prev) => ({
      calories: String(caloriesGoal?.targetCaloriesPerDay ?? prev.calories),
      protein: String(macrosGoal?.targetProtein ?? prev.protein),
      carbs: String(macrosGoal?.targetCarbs ?? prev.carbs),
      fat: String(macrosGoal?.targetFat ?? prev.fat),
    }));
  }, [nutritionGoals]);

  const hasSavedTargets = useMemo(
    () => nutritionGoals.some((goal) => goal.type === 'calories' || goal.type === 'macros'),
    [nutritionGoals]
  );

  // Filter and search meals
  const filteredMeals = useMemo(() => {
    const base = searchAndFilterMeals(meals, searchQuery, filters);

    if (viewMode === 'all') {
      return base;
    }

    const targetDay = viewMode === 'today' ? getLocalDayKey(new Date()) : selectedDay;
    return base.filter((meal) => getLocalDayKey(meal.date) === targetDay);
  }, [meals, searchQuery, filters, viewMode, selectedDay]);

  const todayTotals = useMemo(() => {
    const todayKey = getLocalDayKey(new Date());
    const todayMeals = meals.filter((meal) => getLocalDayKey(meal.date) === todayKey);

    return todayMeals.reduce(
      (totals, meal) => ({
        calories: totals.calories + Number(meal.calories || 0),
        protein: totals.protein + Number(meal.protein || 0),
        carbs: totals.carbs + Number(meal.carbs || 0),
        fat: totals.fat + Number(meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const saveNutritionTargets = async () => {
    if (!user) return;

    setTargetSaving(true);
    try {
      const calories = Math.max(0, parseInt(targetDraft.calories || '0', 10));
      const protein = Math.max(0, parseInt(targetDraft.protein || '0', 10));
      const carbs = Math.max(0, parseInt(targetDraft.carbs || '0', 10));
      const fat = Math.max(0, parseInt(targetDraft.fat || '0', 10));

      const caloriesGoal = nutritionGoals.find((goal) => goal.type === 'calories');
      const macrosGoal = nutritionGoals.find((goal) => goal.type === 'macros');

      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() + 1);

      if (caloriesGoal) {
        await updateGoal(user.uid, caloriesGoal.id, {
          targetCaloriesPerDay: calories,
          title: 'Daily Calorie Target',
          description: 'Maintain your daily calorie goal',
        });
      } else {
        await addGoal(user.uid, {
          type: 'calories',
          title: 'Daily Calorie Target',
          description: 'Maintain your daily calorie goal',
          targetCaloriesPerDay: calories,
          startDate,
          targetDate,
          status: 'active',
        });
      }

      if (macrosGoal) {
        await updateGoal(user.uid, macrosGoal.id, {
          targetProtein: protein,
          targetCarbs: carbs,
          targetFat: fat,
          title: 'Daily Macro Targets',
          description: 'Hit your protein, carbs, and fat targets',
        });
      } else {
        await addGoal(user.uid, {
          type: 'macros',
          title: 'Daily Macro Targets',
          description: 'Hit your protein, carbs, and fat targets',
          targetProtein: protein,
          targetCarbs: carbs,
          targetFat: fat,
          startDate,
          targetDate,
          status: 'active',
        });
      }

      setNutritionGoals((prev = []) => {
        const retained = prev.filter((goal) => goal.type !== 'calories' && goal.type !== 'macros');
        const now = new Date();
        return [
          ...retained,
          {
            id: caloriesGoal?.id || `temp-calories-${now.getTime()}`,
            type: 'calories',
            title: 'Daily Calorie Target',
            description: 'Maintain your daily calorie goal',
            targetCaloriesPerDay: calories,
            startDate,
            targetDate,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          } as Goal,
          {
            id: macrosGoal?.id || `temp-macros-${now.getTime()}`,
            type: 'macros',
            title: 'Daily Macro Targets',
            description: 'Hit your protein, carbs, and fat targets',
            targetProtein: protein,
            targetCarbs: carbs,
            targetFat: fat,
            startDate,
            targetDate,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          } as Goal,
        ];
      });

      showToast('Nutrition targets saved', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to save nutrition targets'), 'error');
    } finally {
      setTargetSaving(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleAddMeal = async (
    data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    setFormLoading(true);
    try {
      let id: string;

      if (isOnline) {
        id = await addMeal(user.uid, data);
      } else {
        id = await addMealOffline(user.uid, data);
        await addToSyncQueue(user.uid, 'create', 'meals', id, { ...data, id });
        showToast('Saved offline — will sync when online', 'info');
      }

      const newMeal: Meal = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMeals((prev = []) => [newMeal, ...prev]);
      setIsModalOpen(false);
      if (isOnline) {
        showToast('Meal added successfully!', 'success');
        // Check calorie goal notifications
        const totalCalories = [...meals, newMeal].reduce((sum, m) => {
          const mealDate = new Date(m.date);
          const today = new Date();
          if (mealDate.toDateString() === today.toDateString()) {
            return sum + (m.calories || 0);
          }
          return sum;
        }, 0);
        triggerMealNotifications(user.uid, totalCalories).catch(() => {});
      }
    } catch (error: any) {
      console.error('Error adding meal:', error);
      showToast(getErrorMessage(error, 'Failed to add meal'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateMeal = async (
    data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !editingMeal) return;

    setFormLoading(true);
    try {
      if (isOnline) {
        await updateMeal(user.uid, editingMeal.id, data);
      } else {
        await updateMealOffline(user.uid, editingMeal.id, data);
        await addToSyncQueue(user.uid, 'update', 'meals', editingMeal.id, data);
        showToast('Updated offline — will sync when online', 'info');
      }

      setMeals((prev = []) =>
        prev.map((m) =>
          m.id === editingMeal.id
            ? { ...m, ...data, updatedAt: new Date() }
            : m
        )
      );
      setIsModalOpen(false);
      setEditingMeal(null);
      if (isOnline) showToast('Meal updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating meal:', error);
      showToast(getErrorMessage(error, 'Failed to update meal'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      if (isOnline) {
        await deleteMeal(user.uid, mealId);
      } else {
        await deleteMealOffline(user.uid, mealId);
        await addToSyncQueue(user.uid, 'delete', 'meals', mealId, null);
        showToast('Deleted offline — will sync when online', 'info');
      }

      setMeals((prev = []) => prev.filter((m) => m.id !== mealId));
      if (isOnline) showToast('Meal deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      showToast(getErrorMessage(error, 'Failed to delete meal'), 'error');
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMeal(null);
  };

  const handleOpenAddModal = () => {
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  return (
    <AppLayout title="Nutrition">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              Nutrition
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Track your meals and macros
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTargetPanelOpen((prev) => !prev)}
              className="flex h-11 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
            >
              <Target className="h-4 w-4" />
              {hasSavedTargets ? 'Edit Target' : 'Set Target'}
              {isTargetPanelOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex h-12 items-center gap-2 rounded-full bg-[color:var(--foreground)] px-6 text-sm font-semibold text-[color:var(--background)]"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Daily Nutrition Targets
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  Track calories + macros against your saved target.
                </p>
              </div>
              {!isTargetPanelOpen && (
                <button
                  type="button"
                  onClick={() => setIsTargetPanelOpen(true)}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                >
                  {hasSavedTargets ? 'Edit target' : 'Set target'}
                </button>
              )}
            </div>

            {isTargetPanelOpen && (
              <>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const calories = Math.max(0, parseInt(targetDraft.calories || '0', 10));
                      const estimated = estimateMacrosFromCalories(calories || 2200);
                      setTargetDraft((prev) => ({
                        ...prev,
                        protein: String(estimated.protein),
                        carbs: String(estimated.carbs),
                        fat: String(estimated.fat),
                      }));
                    }}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
                  >
                    Auto estimate
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="text-[11px] text-[color:var(--muted-foreground)]">
                    Calories
                    <input
                      type="number"
                      min="0"
                      value={targetDraft.calories}
                      onChange={(e) => setTargetDraft((prev) => ({ ...prev, calories: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    />
                  </label>
                  <label className="text-[11px] text-[color:var(--muted-foreground)]">
                    Protein (g)
                    <input
                      type="number"
                      min="0"
                      value={targetDraft.protein}
                      onChange={(e) => setTargetDraft((prev) => ({ ...prev, protein: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    />
                  </label>
                  <label className="text-[11px] text-[color:var(--muted-foreground)]">
                    Carbs (g)
                    <input
                      type="number"
                      min="0"
                      value={targetDraft.carbs}
                      onChange={(e) => setTargetDraft((prev) => ({ ...prev, carbs: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    />
                  </label>
                  <label className="text-[11px] text-[color:var(--muted-foreground)]">
                    Fat (g)
                    <input
                      type="number"
                      min="0"
                      value={targetDraft.fat}
                      onChange={(e) => setTargetDraft((prev) => ({ ...prev, fat: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-[color:var(--background)] px-2 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={saveNutritionTargets}
                  disabled={targetSaving}
                  className="mt-3 w-full rounded-full bg-[color:var(--foreground)] px-4 py-2 text-xs font-semibold text-[color:var(--background)] disabled:opacity-50"
                >
                  {targetSaving ? 'Saving targets...' : 'Save Nutrition Targets'}
                </button>
              </>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { name: 'Calories', value: todayTotals.calories, target: Number(targetDraft.calories || 0), suffix: ' kcal', tone: 'text-emerald-500' },
                { name: 'Protein', value: todayTotals.protein, target: Number(targetDraft.protein || 0), suffix: ' g', tone: 'text-sky-500' },
                { name: 'Carbs', value: todayTotals.carbs, target: Number(targetDraft.carbs || 0), suffix: ' g', tone: 'text-amber-500' },
                { name: 'Fat', value: todayTotals.fat, target: Number(targetDraft.fat || 0), suffix: ' g', tone: 'text-rose-500' },
              ].map((metric) => {
                return (
                  <SemicircleTargetCard
                    key={metric.name}
                    label={metric.name}
                    current={metric.value}
                    target={metric.target}
                    unit={metric.suffix}
                    colorClassName={metric.tone}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMode('today')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'today'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'day'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                By Day
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  viewMode === 'all'
                    ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                    : 'border border-zinc-200 text-[color:var(--foreground)] dark:border-zinc-800'
                }`}
              >
                All
              </button>

              {viewMode === 'day' && (
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="ml-auto rounded-lg border border-zinc-200 bg-[color:var(--background)] px-3 py-1.5 text-xs outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                />
              )}
            </div>
          </div>

          <SearchBar
            placeholder="Search meals..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <FilterPanel
            type="meal"
            filters={filters}
            onFilterChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Result count */}
        {(searchQuery || Object.keys(filters).length > 0) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Meals List */}
        <MealList
          meals={filteredMeals}
          onEdit={handleEditMeal}
          onDelete={handleDeleteMeal}
          isLoading={mealLoading}
        />
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <MealForm
          onSubmit={editingMeal ? handleUpdateMeal : handleAddMeal}
          onCancel={handleCloseModal}
          initialData={editingMeal || undefined}
          isLoading={formLoading}
        />
      </Modal>
    </AppLayout>
  );
}
