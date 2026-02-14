'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { UserProfile } from '@/lib/types/firestore';
import AppLayout from '@/components/layout/AppLayout';
import { User, Save, Shield } from 'lucide-react';

export default function AccountPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');

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

  return (
    <AppLayout title="Account">
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Account Settings
          </h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Manage your profile and preferences
          </p>
        </div>

        <div className="space-y-4">
          {/* Profile Info */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              Profile Information
            </p>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 opacity-60 cursor-not-allowed"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Name
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Fitness Goal
                  <select
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 dark:focus:border-white"
                  >
                    <option value="Build strength">Build strength</option>
                    <option value="Lose weight">Lose weight</option>
                    <option value="Improve endurance">Improve endurance</option>
                    <option value="Stay consistent">Stay consistent</option>
                  </select>
                </label>

                {profile && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[color:var(--muted-foreground)]">Weight</p>
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        {profile.weight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[color:var(--muted-foreground)]">Height</p>
                      <p className="text-sm font-medium text-[color:var(--foreground)]">
                        {profile.height} cm
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Account Security Info */}
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm dark:border-zinc-800">
            <p className="text-sm font-semibold text-[color:var(--foreground)] flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Account
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
              Security and account details
            </p>
            <div className="mt-3 space-y-2">
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
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
