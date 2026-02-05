'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createUserProfile, hasUserProfile } from '@/lib/auth';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    goal: 'Build strength',
    weight: '',
    height: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(authLoading);

  // Check if user already has profile, redirect to home
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const checkProfile = async () => {
      try {
        const profileExists = await hasUserProfile(user.uid);
        if (profileExists) {
          // User already completed onboarding
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkProfile();
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      if (!formData.weight || !formData.height) {
        setError('Weight and height are required');
        setLoading(false);
        return;
      }

      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        name: user.displayName || '',
        email: user.email || '',
        goal: formData.goal as 'Build strength' | 'Lose weight' | 'Improve endurance' | 'Stay consistent',
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] text-[color:var(--foreground)]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
          GYMI
        </p>
        <h1 className="text-2xl font-semibold">Set your goals</h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Tell us a bit about you so we can personalize your coaching.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Primary goal
          <select
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            disabled={loading}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
          >
            <option>Build strength</option>
            <option>Lose weight</option>
            <option>Improve endurance</option>
            <option>Stay consistent</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            Weight (kg)
            <input
              type="number"
              placeholder="70"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>
          <label className="block text-sm font-medium">
            Height (cm)
            <input
              type="number"
              placeholder="175"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
