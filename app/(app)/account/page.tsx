'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUnits } from '@/components/providers/UnitProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { getWeightLogs } from '@/lib/weightLogs';
import { getActiveGoals } from '@/lib/goals';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { UserProfile } from '@/lib/types/firestore';
import { displayWeight, displayHeight } from '@/lib/utils/units';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { User, Save, Ruler, Shield, FileText, ExternalLink, Bot, Loader2, CircleCheck, TriangleAlert } from 'lucide-react';
import { useCachedData } from '@/lib/hooks/useCachedData';

type Tab = 'profile' | 'preferences' | 'about';

type FoodRecognizeHealthResponse = {
  success: boolean;
  configured: boolean;
  primaryModel: string;
  primaryAvailable?: boolean;
  primaryGenerateCapable?: boolean;
  runtimeStatus?: 'ok' | 'quota' | 'auth' | 'model' | 'error';
  runtimeDetail?: string;
  error?: string;
  detail?: string;
};

export default function AccountPage() {
  const { user } = useAuth();
  const { unitSystem, setUnitSystem } = useUnits();
  const { showToast } = useToast();

  const { data: profile } = useCachedData<UserProfile | null>({
    key: `profile:${user?.uid}`,
    fetcher: useCallback(() => getUserProfile(user!.uid), [user]),
    enabled: !!user,
    ttl: 10 * 60 * 1000,
  });

  const loading = profile === undefined && !!user;
  const { data: progressSnapshot } = useCachedData<{
    latestWeightKg: number | null;
    activeGoalTitle: string | null;
  }>({
    key: `account:progress-snapshot:${user?.uid}`,
    fetcher: useCallback(async () => {
      const [weights, goals] = await Promise.all([
        getWeightLogs(user!.uid, 1).catch(() => []),
        getActiveGoals(user!.uid).catch(() => []),
      ]);

      const latestWeight = weights[0]?.weight ?? null;
      const weightGoal = goals.find((g) => g.type === 'weight');
      const fallbackGoal = goals[0];

      return {
        latestWeightKg: latestWeight,
        activeGoalTitle: weightGoal?.title ?? fallbackGoal?.title ?? null,
      };
    }, [user]),
    enabled: !!user,
    ttl: 2 * 60 * 1000,
    staleTime: 60 * 1000,
  });

  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [checkingAiStatus, setCheckingAiStatus] = useState(false);
  const [aiHealth, setAiHealth] = useState<FoodRecognizeHealthResponse | null>(null);

  // Initialize form fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || user?.displayName || '');
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: editName.trim(),
      });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update profile'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkAiStatus = async () => {
    setCheckingAiStatus(true);
    try {
      const response = await fetch('/api/food-recognize/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = (await response.json()) as FoodRecognizeHealthResponse;
      setAiHealth(data);

      if (response.ok && data.success) {
        showToast('AI food scanner is ready.', 'success');
      } else {
        showToast(data.error || data.runtimeDetail || 'AI status check failed.', 'warning');
      }
    } catch {
      showToast('Failed to check AI status. Please try again.', 'error');
      setAiHealth({
        success: false,
        configured: false,
        primaryModel: 'unknown',
        error: 'Network error while checking AI status.',
      });
    } finally {
      setCheckingAiStatus(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { key: 'preferences', label: 'Preferences', icon: <Ruler className="w-4 h-4" /> },
    { key: 'about', label: 'About', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <AppLayout title="Account">
      <section className="space-y-5">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)] sm:text-2xl">
            Account Settings
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Manage your profile and preferences
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100/60 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all sm:text-sm ${
                activeTab === tab.key
                  ? 'bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm'
                  : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-5 shadow-sm dark:border-zinc-800">
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-medium">
                    Email
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 opacity-60 cursor-not-allowed"
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Name
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-[color:var(--background)] px-4 py-2.5 text-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    />
                  </label>

                  {profile && (
                    <div className="space-y-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                        Progress Snapshot
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[color:var(--muted-foreground)]">Latest logged weight</p>
                          <p className="text-sm font-medium text-[color:var(--foreground)]">
                            {progressSnapshot?.latestWeightKg != null
                              ? displayWeight(progressSnapshot.latestWeightKg, unitSystem)
                              : displayWeight(profile.weight, unitSystem)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--muted-foreground)]">Height</p>
                          <p className="text-sm font-medium text-[color:var(--foreground)]">
                            {displayHeight(profile.height, unitSystem)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[color:var(--muted-foreground)]">Active goal (from Progress)</p>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {progressSnapshot?.activeGoalTitle || 'No active goal set'}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-5 shadow-sm dark:border-zinc-800">
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-1">
                  <Ruler className="w-4 h-4" />
                  Measurement Units
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                  Choose how weight and height are displayed throughout the app
                </p>
                <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      unitSystem === 'metric'
                        ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                        : 'bg-[color:var(--background)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
                    }`}
                  >
                    Metric (kg, cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      unitSystem === 'imperial'
                        ? 'bg-[color:var(--foreground)] text-[color:var(--background)]'
                        : 'bg-[color:var(--background)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
                    }`}
                  >
                    Imperial (lbs, ft)
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-5 shadow-sm dark:border-zinc-800">
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4" />
                  AI Food Scanner
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)] mb-4">
                  Check if the Gemini API key, model, and quota are ready for meal scanning.
                </p>

                <button
                  type="button"
                  onClick={checkAiStatus}
                  disabled={checkingAiStatus}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  {checkingAiStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {checkingAiStatus ? 'Checking AI status...' : 'Check AI Status'}
                </button>

                {aiHealth && (
                  <div className={`mt-3 rounded-xl border p-3 text-xs ${
                    aiHealth.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                  }`}>
                    <p className="flex items-center gap-1.5 font-semibold">
                      {aiHealth.success ? <CircleCheck className="w-3.5 h-3.5" /> : <TriangleAlert className="w-3.5 h-3.5" />}
                      {aiHealth.success ? 'AI scanner is ready' : 'AI scanner needs attention'}
                    </p>
                    <p className="mt-1">
                      Model: <span className="font-medium">{aiHealth.primaryModel}</span>
                    </p>
                    {aiHealth.runtimeStatus ? (
                      <p>
                        Runtime: <span className="font-medium">{aiHealth.runtimeStatus}</span>
                      </p>
                    ) : null}
                    <p className="mt-1">
                      {aiHealth.runtimeDetail || aiHealth.error || 'No additional details available.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Account Info */}
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-5 shadow-sm dark:border-zinc-800">
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" />
                  Account Details
                </p>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-foreground)]">Account created</span>
                    <span className="text-[color:var(--foreground)]">
                      {user?.metadata.creationTime
                        ? new Date(user.metadata.creationTime).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-foreground)]">Last login</span>
                    <span className="text-[color:var(--foreground)]">
                      {user?.metadata.lastSignInTime
                        ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[color:var(--muted-foreground)]">Auth method</span>
                    <span className="text-[color:var(--foreground)]">
                      {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Links */}
              <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-5 shadow-sm dark:border-zinc-800">
                <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  Legal
                </p>
                <div className="space-y-1">
                  <Link
                    href="/privacy"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  >
                    Privacy Policy
                    <ExternalLink className="w-3.5 h-3.5 text-[color:var(--muted-foreground)]" />
                  </Link>
                  <Link
                    href="/terms"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  >
                    Terms of Service
                    <ExternalLink className="w-3.5 h-3.5 text-[color:var(--muted-foreground)]" />
                  </Link>
                </div>
              </div>

              {/* App Info */}
              <p className="text-center text-xs text-[color:var(--muted-foreground)]">
                GYMI v0.1.0 — Your personal fitness companion
              </p>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
