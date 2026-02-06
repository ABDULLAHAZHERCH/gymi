'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getMeals, addMeal, updateMeal, deleteMeal } from '@/lib/meals';
import { Meal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import MealList from '@/components/features/MealList';
import MealForm from '@/components/features/MealForm';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel, { FilterOptions } from '@/components/features/FilterPanel';
import { searchAndFilterMeals } from '@/lib/utils/search';

export default function NutritionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});

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

  // Filter and search meals
  const filteredMeals = useMemo(() => {
    return searchAndFilterMeals(meals, searchQuery, filters);
  }, [meals, searchQuery, filters]);

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
          <button
            onClick={handleOpenAddModal}
            className="flex h-12 items-center gap-2 rounded-full bg-[color:var(--foreground)] px-6 text-sm font-semibold text-[color:var(--background)]"
          >
            <Plus className="h-5 w-5" />
            Add
          </button>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
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
