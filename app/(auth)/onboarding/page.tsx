'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { createUserProfile, hasUserProfile } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { triggerWelcomeNotification } from '@/lib/notificationTriggers';
import { UnitSystem, lbsToKg, ftInToCm } from '@/lib/utils/units';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [formData, setFormData] = useState({
    goal: 'Build strength',
    weight: '',
    height: '',
    heightFt: '',
    heightIn: '',
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
          router.push('/home');
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

      // Validate weight
      if (!formData.weight) {
        setError('Weight is required');
        setLoading(false);
        return;
      }

      // Validate height
      if (unitSystem === 'metric' && !formData.height) {
        setError('Height is required');
        setLoading(false);
        return;
      }
      if (unitSystem === 'imperial' && !formData.heightFt) {
        setError('Height (feet) is required');
        setLoading(false);
        return;
      }

      // Convert to metric for storage
      const weightKg = unitSystem === 'imperial'
        ? lbsToKg(parseFloat(formData.weight))
        : parseFloat(formData.weight);

      const heightCm = unitSystem === 'imperial'
        ? ftInToCm(parseInt(formData.heightFt), parseInt(formData.heightIn || '0'))
        : parseFloat(formData.height);

      await createUserProfile(user.uid, {
        name: user.displayName || '',
        email: user.email || '',
        goal: formData.goal as 'Build strength' | 'Lose weight' | 'Improve endurance' | 'Stay consistent',
        weight: weightKg,
        height: heightCm,
        unitSystem,
      });

      // Send welcome notification
      triggerWelcomeNotification(user.uid).catch(() => {});

      router.push('/home');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save profile'));
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

        {/* Unit System Toggle */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Measurement Units</p>
          <div className="flex rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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

        {/* Weight & Height */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium">
            Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
            <input
              type="number"
              placeholder={unitSystem === 'imperial' ? '154' : '70'}
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              disabled={loading}
              min="0"
              step={unitSystem === 'imperial' ? '1' : '0.1'}
              className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
            />
          </label>

          {unitSystem === 'metric' ? (
            <label className="block text-sm font-medium">
              Height (cm)
              <input
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                disabled={loading}
                min="0"
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
              />
            </label>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">Height</p>
              <div className="flex gap-2 mt-2">
                <label className="flex-1">
                  <input
                    type="number"
                    placeholder="5"
                    value={formData.heightFt}
                    onChange={(e) => setFormData({ ...formData, heightFt: e.target.value })}
                    disabled={loading}
                    min="0"
                    max="8"
                    className="w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
                  />
                  <span className="text-xs text-[color:var(--muted-foreground)] mt-0.5 block">ft</span>
                </label>
                <label className="flex-1">
                  <input
                    type="number"
                    placeholder="9"
                    value={formData.heightIn}
                    onChange={(e) => setFormData({ ...formData, heightIn: e.target.value })}
                    disabled={loading}
                    min="0"
                    max="11"
                    className="w-full rounded-2xl border border-zinc-200 bg-[color:var(--background)] px-4 py-3 text-sm shadow-sm outline-none focus:border-black dark:border-zinc-800 disabled:opacity-50"
                  />
                  <span className="text-xs text-[color:var(--muted-foreground)] mt-0.5 block">in</span>
                </label>
              </div>
            </div>
          )}
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
