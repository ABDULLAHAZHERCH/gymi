'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { getActiveGoals, addGoal, updateGoal, deleteGoal, completeGoal } from '@/lib/goals';
import { getWeightLogs, addWeightLog } from '@/lib/weightLogs';
import { getAchievements } from '@/lib/achievements';
import { getInsights, type Insight } from '@/lib/reports';
import { calculateStreaks } from '@/lib/achievements';
import { getWorkouts } from '@/lib/workouts';
import { Goal, WeightLog, Achievement } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import GoalCard from '@/components/features/GoalCard';
import GoalForm from '@/components/features/GoalForm';
import StreakIndicator from '@/components/features/StreakIndicator';
import Modal from '@/components/ui/Modal';
import { WeightChart } from '@/components/features/WeightChart';
import { Plus, Target, TrendingUp, Award, Lightbulb, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalFormLoading, setGoalFormLoading] = useState(false);
  
  // Weight tracking states
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [weightSubmitting, setWeightSubmitting] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  // Achievements & Insights states
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [streakInfo, setStreakInfo] = useState({ current: 0, longest: 0, total: 0 });

  // Fetch active goals, weight logs, achievements, insights
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [goalsData, weightsData, achievementsData, insightsData, workoutsData] = await Promise.all([
          getActiveGoals(user.uid),
          getWeightLogs(user.uid, 30),
          getAchievements(user.uid).catch(() => []),
          getInsights(user.uid).catch(() => []),
          getWorkouts(user.uid, 500).catch(() => []),
        ]);
        setGoals(goalsData);
        setWeightLogs(weightsData);
        setAchievements(achievementsData);
        setInsights(insightsData);

        const weightGoal = goalsData.find(g => g.type === 'weight');
        setActiveGoal(weightGoal || null);

        // Calculate streaks
        const workoutDates = workoutsData.map((w) => w.date);
        const streaks = calculateStreaks(workoutDates);
        setStreakInfo({
          current: streaks.currentStreak,
          longest: streaks.longestStreak,
          total: workoutsData.length,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load data', 'error');
      } finally {
        setGoalsLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleAddGoal = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    setGoalFormLoading(true);
    try {
      const id = await addGoal(user.uid, data);
      const newGoal: Goal = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setGoals([newGoal, ...goals]);
      setIsGoalModalOpen(false);
      showToast('Goal created successfully!', 'success');
    } catch (error) {
      console.error('Error adding goal:', error);
      showToast(getErrorMessage(error, 'Failed to create goal'), 'error');
    } finally {
      setGoalFormLoading(false);
    }
  };

  const handleUpdateGoal = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !editingGoal) return;

    setGoalFormLoading(true);
    try {
      await updateGoal(user.uid, editingGoal.id, data);
      setGoals(
        goals.map((g) =>
          g.id === editingGoal.id ? { ...g, ...data, updatedAt: new Date() } : g
        )
      );
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      showToast('Goal updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating goal:', error);
      showToast(getErrorMessage(error, 'Failed to update goal'), 'error');
    } finally {
      setGoalFormLoading(false);
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWeight) return;

    setWeightSubmitting(true);
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
      setIsWeightModalOpen(false);
      setNewWeight('');
      setNewNotes('');
      showToast('Weight logged successfully!', 'success');
    } catch (error) {
      console.error('Error adding weight log:', error);
      showToast(getErrorMessage(error, 'Failed to log weight'), 'error');
    } finally {
      setWeightSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoal(user.uid, goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
      showToast('Goal deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast(getErrorMessage(error, 'Failed to delete goal'), 'error');
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    if (!user) return;

    try {
      await completeGoal(user.uid, goalId);
      setGoals(
        goals.map((g) =>
          g.id === goalId ? { ...g, status: 'completed' as const, completedAt: new Date() } : g
        )
      );
      showToast('Goal completed! 🎉', 'success');
    } catch (error) {
      console.error('Error completing goal:', error);
      showToast(getErrorMessage(error, 'Failed to complete goal'), 'error');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <AppLayout title="Progress">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            My Progress
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Track your fitness journey
          </p>
        </div>

        <div className="space-y-4">
          {/* Streak & Achievements Preview */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Achievements
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {achievements.length} badge{achievements.length !== 1 ? 's' : ''} earned
                </p>
              </div>
              <Link
                href="/achievements"
                className="flex items-center gap-1 text-xs font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
              >
                View All
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <StreakIndicator
              currentStreak={streakInfo.current}
              longestStreak={streakInfo.longest}
              totalWorkouts={streakInfo.total}
            />

            {/* Recent achievements */}
            {achievements.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {achievements.slice(0, 5).map((a) => (
                    <span
                      key={a.id}
                      title={a.title}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs"
                    >
                      <span>{a.icon}</span>
                      <span className="text-[color:var(--foreground)] font-medium">{a.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
              <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4" />
                Insights
              </p>
              <div className="space-y-2">
                {insights.slice(0, 4).map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900"
                  >
                    <span className="text-lg shrink-0">{insight.icon}</span>
                    <p className="text-xs text-[color:var(--foreground)] leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight Tracker Section */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Weight Tracker
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Monitor your weight progress
                </p>
              </div>
              <button
                onClick={() => setIsWeightModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Log
              </button>
            </div>

            {weightLogs.length > 0 ? (
              <>
                <WeightChart data={weightLogs} targetWeight={activeGoal?.targetWeight} />
                
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-[color:var(--foreground)] mb-3">Recent Logs</h4>
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
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-[color:var(--muted-foreground)]" />
                </div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">No weight logs yet</p>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                  Start tracking your weight to see progress
                </p>
              </div>
            )}
          </div>

          {/* Goals Section */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  My Goals
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Track your fitness objectives
                </p>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                New Goal
              </button>
            </div>

            {goalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-[color:var(--muted-foreground)]">Loading goals...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-[color:var(--muted-foreground)]" />
                </div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">No goals yet</p>
                <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
                  Create your first goal to start tracking progress
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progress={0} // TODO: Calculate actual progress
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onComplete={handleCompleteGoal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={handleCloseGoalModal}>
        <GoalForm
          onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal}
          onCancel={handleCloseGoalModal}
          initialData={editingGoal || undefined}
          isLoading={goalFormLoading}
        />
      </Modal>

      {/* Weight Modal */}
      <Modal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)}>
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
                disabled={weightSubmitting}
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
                disabled={weightSubmitting}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white disabled:opacity-50"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(false)}
              disabled={weightSubmitting}
              className="flex h-12 flex-1 items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold dark:border-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={weightSubmitting}
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] disabled:opacity-50"
            >
              {weightSubmitting ? 'Logging...' : 'Log Weight'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
