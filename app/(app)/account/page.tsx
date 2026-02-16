'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUnits } from '@/components/providers/UnitProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { UserProfile } from '@/lib/types/firestore';
import { displayWeight, displayHeight } from '@/lib/utils/units';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { User, Save, Ruler, Shield, FileText, ExternalLink } from 'lucide-react';

type Tab = 'profile' | 'preferences' | 'about';

export default function AccountPage() {
  const { user } = useAuth();
  const { unitSystem, setUnitSystem } = useUnits();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(user.uid);
        if (data) {
          setProfile(data);
          setEditName(data.name || user.displayName || '');
          setEditGoal(data.goal || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: editName.trim(),
        goal: editGoal as UserProfile['goal'],
      });
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update profile'), 'error');
    } finally {
      setSaving(false);
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

                  <label className="block text-sm font-medium">
                    Fitness Goal
                    <select
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-[color:var(--background)] px-4 py-2.5 text-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                    >
                      <option value="Build strength">Build strength</option>
                      <option value="Lose weight">Lose weight</option>
                      <option value="Improve endurance">Improve endurance</option>
                      <option value="Stay consistent">Stay consistent</option>
                    </select>
                  </label>

                  {profile && (
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                      <div>
                        <p className="text-xs text-[color:var(--muted-foreground)]">Weight</p>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {displayWeight(profile.weight, unitSystem)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[color:var(--muted-foreground)]">Height</p>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {displayHeight(profile.height, unitSystem)}
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
