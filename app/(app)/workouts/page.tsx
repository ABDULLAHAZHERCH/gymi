'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getWorkouts, addWorkout, updateWorkout, deleteWorkout } from '@/lib/workouts';
import { Workout } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import WorkoutList from '@/components/features/WorkoutList';
import WorkoutForm from '@/components/features/WorkoutForm';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel, { FilterOptions } from '@/components/features/FilterPanel';
import { searchAndFilterWorkouts } from '@/lib/utils/search';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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

  // Filter and search workouts
  const filteredWorkouts = useMemo(() => {
    return searchAndFilterWorkouts(workouts, searchQuery, filters);
  }, [workouts, searchQuery, filters]);

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

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkout(null);
  };

  const handleOpenAddModal = () => {
    setEditingWorkout(null);
    setIsModalOpen(true);
  };

  return (
    <AppLayout title="Workouts">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
              Workouts
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Track your exercise sessions
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
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <FilterPanel
            type="workout"
            filters={filters}
            onFilterChange={setFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Result count */}
        {(searchQuery || Object.keys(filters).length > 0) && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Workouts List */}
        <WorkoutList
          workouts={filteredWorkouts}
          onEdit={handleEditWorkout}
          onDelete={handleDeleteWorkout}
          isLoading={workoutLoading}
        />
      </section>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <WorkoutForm
          onSubmit={editingWorkout ? handleUpdateWorkout : handleAddWorkout}
          onCancel={handleCloseModal}
          initialData={editingWorkout || undefined}
          isLoading={formLoading}
        />
      </Modal>
    </AppLayout>
  );
}
