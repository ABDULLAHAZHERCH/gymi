'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getWorkouts, addWorkout, updateWorkout, deleteWorkout } from '@/lib/workouts';
import { getMeals, addMeal, updateMeal, deleteMeal } from '@/lib/meals';
import { Workout, Meal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import WorkoutList from '@/components/features/WorkoutList';
import WorkoutForm from '@/components/features/WorkoutForm';
import MealList from '@/components/features/MealList';
import MealForm from '@/components/features/MealForm';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel, { FilterOptions } from '@/components/features/FilterPanel';
import { searchAndFilterWorkouts, searchAndFilterMeals } from '@/lib/utils/search';

type Tab = 'workouts' | 'meals';

export default function LogsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('workouts');

  // Workout states
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Meal states
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});

  // Fetch workouts on mount
  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      try {
        const data = await getWorkouts(user.uid);
        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setWorkoutLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  // Fetch meals on mount
  useEffect(() => {
    if (!user) return;

    const fetchMeals = async () => {
      try {
        const data = await getMeals(user.uid);
        setMeals(data);
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        setMealLoading(false);
      }
    };

    fetchMeals();
  }, [user]);

  // Refresh data
  const handleRefresh = async () => {
    if (!user) return;

    try {
      const [workoutsData, mealsData] = await Promise.all([
        getWorkouts(user.uid),
        getMeals(user.uid),
      ]);
      setWorkouts(workoutsData);
      setMeals(mealsData);
      showToast('Data refreshed', 'success', 2000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
    }
  };

  // Filter and search workouts/meals
  const filteredWorkouts = useMemo(() => {
    return searchAndFilterWorkouts(workouts, searchQuery, filters);
  }, [workouts, searchQuery, filters]);

  const filteredMeals = useMemo(() => {
    return searchAndFilterMeals(meals, searchQuery, filters);
  }, [meals, searchQuery, filters]);

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleAddWorkout = async (
    data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const id = await addWorkout(user.uid, data);
      const newWorkout: Workout = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setWorkouts([newWorkout, ...workouts]);
      setIsModalOpen(false);
      showToast('Workout added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding workout:', error);
      showToast(error.message || 'Failed to add workout', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateWorkout = async (
    data: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user || !editingWorkout) return;

    setFormLoading(true);
    try {
      await updateWorkout(user.uid, editingWorkout.id, data);
      setWorkouts(
        workouts.map((w) =>
          w.id === editingWorkout.id
            ? { ...w, ...data, updatedAt: new Date() }
            : w
        )
      );
      setIsModalOpen(false);
      setEditingWorkout(null);
      showToast('Workout updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating workout:', error);
      showToast(error.message || 'Failed to update workout', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }

    try {
      await deleteWorkout(user.uid, workoutId);
      setWorkouts(workouts.filter((w) => w.id !== workoutId));
      showToast('Workout deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting workout:', error);
      showToast(error.message || 'Failed to delete workout', 'error');
    }
  };

  // Meal handlers
  const handleAddMeal = async (
    data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const id = await addMeal(user.uid, data);
      const newMeal: Meal = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMeals([newMeal, ...meals]);
      setIsModalOpen(false);
      showToast('Meal added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding meal:', error);
      showToast(error.message || 'Failed to add meal', 'error');
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
      await updateMeal(user.uid, editingMeal.id, data);
      setMeals(
        meals.map((m) =>
          m.id === editingMeal.id
            ? { ...m, ...data, updatedAt: new Date() }
            : m
        )
      );
      setIsModalOpen(false);
      setEditingMeal(null);
      showToast('Meal updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating meal:', error);
      showToast(error.message || 'Failed to update meal', 'error');
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
      await deleteMeal(user.uid, mealId);
      setMeals(meals.filter((m) => m.id !== mealId));
      showToast('Meal deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      showToast(error.message || 'Failed to delete meal', 'error');
    }
  };

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setEditingWorkout(null);
    setIsModalOpen(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkout(null);
    setEditingMeal(null);
  };

  const handleOpenAddModal = () => {
    setEditingWorkout(null);
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  return (
    <AppLayout title="Logs">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              Logs
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)] md:hidden">
              Pull down to refresh
            </p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Track your workouts and meals
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex h-12 items-center gap-2 rounded-full bg-[color:var(--foreground)] px-6 text-sm font-semibold text-[color:var(--background)]"
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]'
                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            }`}
          >
            💪 Workouts
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'meals'
                ? 'border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]'
                : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            }`}
          >
            🍽️ Meals
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <SearchBar
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <FilterPanel
            type={activeTab === 'workouts' ? 'workout' : 'meal'}
            filters={filters}
            onFilterChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Result count */}
        {(searchQuery || Object.keys(filters).length > 0) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {activeTab === 'workouts'
              ? `${filteredWorkouts.length} workout${filteredWorkouts.length !== 1 ? 's' : ''} found`
              : `${filteredMeals.length} meal${filteredMeals.length !== 1 ? 's' : ''} found`}
          </p>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <WorkoutList
            workouts={filteredWorkouts}
            onEdit={handleEditWorkout}
            onDelete={handleDeleteWorkout}
            isLoading={workoutLoading}
          />
        )}

        {/* Meals Tab */}
        {activeTab === 'meals' && (
          <MealList
            meals={filteredMeals}
            onEdit={handleEditMeal}
            onDelete={handleDeleteMeal}
            isLoading={mealLoading}
          />
        )}
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        {activeTab === 'workouts' ? (
          <WorkoutForm
            onSubmit={editingWorkout ? handleUpdateWorkout : handleAddWorkout}
            onCancel={handleCloseModal}
            initialData={editingWorkout || undefined}
            isLoading={formLoading}
          />
        ) : (
          <MealForm
            onSubmit={editingMeal ? handleUpdateMeal : handleAddMeal}
            onCancel={handleCloseModal}
            initialData={editingMeal || undefined}
            isLoading={formLoading}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
