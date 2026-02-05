'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getUserProfile } from '@/lib/auth';
import { getWorkouts } from '@/lib/workouts';
import { getMeals } from '@/lib/meals';
import { getGoals } from '@/lib/goals';
import { getWeightLogs } from '@/lib/weightLogs';
import { Workout, Meal, UserProfile } from '@/lib/types/firestore';
import { Goal, WeightLog } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import {
  ExportData,
  exportWorkoutsCSV,
  exportMealsCSV,
  exportWeightLogsCSV,
  exportAllDataJSON,
} from '@/lib/utils/export';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [profile, workoutsData, mealsData, goalsData, logsData] = await Promise.all([
          getUserProfile(user.uid).catch(() => null),
          getWorkouts(user.uid).catch(() => []),
          getMeals(user.uid).catch(() => []),
          getGoals(user.uid).catch(() => []),
          getWeightLogs(user.uid, 1000).catch(() => []),
        ]);

        setUserProfile(profile);
        setWorkouts(workoutsData);
        setMeals(mealsData);
        setGoals(goalsData);
        setWeightLogs(logsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleExportWorkoutsCSV = () => {
    if (workouts.length === 0) {
      showToast('No workouts to export', 'info');
      return;
    }

    exportWorkoutsCSV(workouts);
    showToast(`Exported ${workouts.length} workouts`, 'success');
  };

  const handleExportMealsCSV = () => {
    if (meals.length === 0) {
      showToast('No meals to export', 'info');
      return;
    }

    exportMealsCSV(meals);
    showToast(`Exported ${meals.length} meals`, 'success');
  };

  const handleExportWeightLogsCSV = () => {
    if (weightLogs.length === 0) {
      showToast('No weight logs to export', 'info');
      return;
    }

    exportWeightLogsCSV(weightLogs);
    showToast(`Exported ${weightLogs.length} weight logs`, 'success');
  };

  const handleExportAllJSON = () => {
    if (!userProfile) {
      showToast('User profile not loaded', 'error');
      return;
    }

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        name: userProfile.name,
        goal: userProfile.goal,
      },
      workouts,
      meals,
      goals,
      weightLogs,
    };

    exportAllDataJSON(exportData);
    showToast('Full backup exported successfully', 'success');
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await signOut(auth);
        showToast('Logged out successfully', 'success');
      } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout', 'error');
      }
    }
  };

  return (
    <AppLayout title="Settings">
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Settings</h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Manage your account and data
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-4">
            Account
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Name</label>
              <p className="text-[color:var(--foreground)] font-medium">
                {userProfile?.name || 'Loading...'}
              </p>
            </div>
            <div>
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Email</label>
              <p className="text-[color:var(--foreground)] font-medium">
                {user?.email || 'Loading...'}
              </p>
            </div>
            <div>
              <label className="text-sm text-zinc-600 dark:text-zinc-400">Goal</label>
              <p className="text-[color:var(--foreground)] font-medium">
                {userProfile?.goal || 'Loading...'}
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Data Export Section */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)] mb-2">
            Export Data
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Download your data for backup or analysis
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Export Workouts CSV */}
              <button
                onClick={handleExportWorkoutsCSV}
                disabled={workouts.length === 0}
                className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-[color:var(--foreground)]">
                    Workouts CSV
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {workouts.length} entries
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Export Meals CSV */}
              <button
                onClick={handleExportMealsCSV}
                disabled={meals.length === 0}
                className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-[color:var(--foreground)]">Meals CSV</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {meals.length} entries
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Export Weight Logs CSV */}
              <button
                onClick={handleExportWeightLogsCSV}
                disabled={weightLogs.length === 0}
                className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-[color:var(--foreground)]">
                    Weight Logs CSV
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {weightLogs.length} entries
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Export All JSON */}
              <button
                onClick={handleExportAllJSON}
                className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <FileJson className="w-5 h-5 text-amber-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-[color:var(--foreground)]">
                    Full Backup (JSON)
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    All data included
                  </div>
                </div>
                <Download className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          )}

          {/* Import Notice */}
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Data import functionality is coming soon. For now, you can
              export your data for backup purposes.
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>GYMI v0.1.0</p>
          <p className="mt-1">Your AI-powered fitness companion</p>
        </div>
      </section>
    </AppLayout>
  );
}
