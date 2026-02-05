'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getWeightLogs, getLatestWeightLog, addWeightLog, deleteWeightLog } from '@/lib/weightLogs';
import { getWorkouts } from '@/lib/workouts';
import { getActiveGoals } from '@/lib/goals';
import { WeightLog, Workout, Goal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import { WeightChart } from '@/components/features/WeightChart';
import { WorkoutVolumeChart } from '@/components/features/WorkoutVolumeChart';
import { Plus, TrendingUp } from 'lucide-react';
import Modal from '@/components/ui/Modal';

export default function ProgressPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [weightData, workoutData, goalData] = await Promise.all([
          getWeightLogs(user.uid, 60), // Last 60 entries
          getWorkouts(user.uid, 100), // Last 100 workouts
          getActiveGoals(user.uid),
        ]);
        
        setWeightLogs(weightData);
        setWorkouts(workoutData);
        // Get weight goal if exists
        const weightGoal = goalData.find(g => g.type === 'weight');
        setActiveGoal(weightGoal || null);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        showToast('Failed to load progress data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWeight) return;

    setSubmitting(true);
    try {
      const weight = parseFloat(newWeight);
      if (weight <= 0) {
        showToast('Please enter a valid weight', 'error');
        return;
      }

      const id = await addWeightLog(user.uid, {
        weight,
        notes: newNotes.trim() || undefined,
        date: new Date(),
      });

      const newLog: WeightLog = {
        id,
        weight,
        notes: newNotes.trim() || undefined,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setWeightLogs([newLog, ...weightLogs]);
      setIsModalOpen(false);
      setNewWeight('');
      setNewNotes('');
      showToast('Weight logged successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding weight log:', error);
      showToast(error.message || 'Failed to log weight', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Progress">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading progress...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Progress">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Progress</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Track your fitness journey
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Log Weight
          </button>
        </div>

        {/* Weight Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[color:var(--foreground)]" />
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Weight Tracker</h3>
          </div>
          <WeightChart data={weightLogs} targetWeight={activeGoal?.targetWeight} />
        </div>

        {/* Workout Volume Chart */}
        <div className="rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[color:var(--foreground)]" />
            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Workout Volume</h3>
          </div>
          <WorkoutVolumeChart workouts={workouts} days={30} />
        </div>

        {/* Recent Weight Logs */}
        {weightLogs.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-[color:var(--foreground)] mb-3">Recent Logs</h3>
            <div className="space-y-2">
              {weightLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <div>
                    <p className="text-sm font-medium text-[color:var(--foreground)]">
                      {log.weight}kg
                    </p>
                    {log.notes && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">{log.notes}</p>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    {new Date(log.date).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Add Weight Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleAddWeight} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Log Weight</h2>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Weight (kg) *
              <input
                type="number"
                placeholder="70.5"
                min="0"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Notes (optional)
              <textarea
                placeholder="How are you feeling?"
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                disabled={submitting}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold dark:border-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Log Weight'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
