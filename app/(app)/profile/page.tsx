'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { logoutUser } from '@/lib/auth';
import { getActiveGoals, addGoal, updateGoal, deleteGoal, completeGoal } from '@/lib/goals';
import { Goal } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import ThemeToggle from '@/components/ui/ThemeToggle';
import GoalCard from '@/components/features/GoalCard';
import GoalForm from '@/components/features/GoalForm';
import Modal from '@/components/ui/Modal';
import { Plus, Target } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch active goals
  useEffect(() => {
    if (!user) return;

    const fetchGoals = async () => {
      try {
        const data = await getActiveGoals(user.uid);
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
        showToast('Failed to load goals', 'error');
      } finally {
        setGoalsLoading(false);
      }
    };

    fetchGoals();
  }, [user, showToast]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showToast('Logout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const id = await addGoal(user.uid, data);
      const newGoal: Goal = {
        ...data,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setGoals([newGoal, ...goals]);
      setIsModalOpen(false);
      showToast('Goal created successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding goal:', error);
      showToast(error.message || 'Failed to create goal', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateGoal = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !editingGoal) return;

    setFormLoading(true);
    try {
      await updateGoal(user.uid, editingGoal.id, data);
      setGoals(
        goals.map((g) =>
          g.id === editingGoal.id ? { ...g, ...data, updatedAt: new Date() } : g
        )
      );
      setIsModalOpen(false);
      setEditingGoal(null);
      showToast('Goal updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating goal:', error);
      showToast(error.message || 'Failed to update goal', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoal(user.uid, goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
      showToast('Goal deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      showToast(error.message || 'Failed to delete goal', 'error');
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
    } catch (error: any) {
      console.error('Error completing goal:', error);
      showToast(error.message || 'Failed to complete goal', 'error');
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <AppLayout title="Profile">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            {user?.displayName || 'Your Profile'}
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">{user?.email}</p>
        </div>

        <div className="space-y-4">
          {/* User Info Card */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Account Info</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Your account details</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted-foreground)]">Email:</span>
                <span className="text-[color:var(--foreground)]">{user?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted-foreground)]">Name:</span>
                <span className="text-[color:var(--foreground)]">{user?.displayName || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Appearance</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Switch between light and dark mode.
            </p>
            <div className="mt-3">
              <ThemeToggle />
            </div>
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
                onClick={() => setIsModalOpen(true)}
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-[color:var(--background)] text-sm font-semibold text-red-600 dark:border-zinc-800 disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </section>

      {/* Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        <GoalForm
          onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal}
          onCancel={handleCloseModal}
          initialData={editingGoal || undefined}
          isLoading={formLoading}
        />
      </Modal>
    </AppLayout>
  );
}
