'use client';

import { useState, FormEvent } from 'react';
import { loginUser, signInWithGoogle } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils/errorMessages';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      await loginUser(formData.email, formData.password);
      router.push('/home');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to log in'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { isNewUser } = await signInWithGoogle();
      router.push(isNewUser ? '/onboarding' : '/home');
    } catch (err) {
      setError(getErrorMessage(err, 'Google sign-in failed'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const isDisabled = loading || googleLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--foreground)] shadow-lg">
          <span className="text-xl font-black text-[color:var(--background)]">G</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Welcome back</h1>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Sign in to continue your fitness journey
        </p>
      </header>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isDisabled}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-[color:var(--background)] text-sm font-medium transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800/60"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[color:var(--background)] px-3 text-[color:var(--muted-foreground)]">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={isDisabled}
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-200 bg-[color:var(--background)] py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:focus:border-blue-400 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={isDisabled}
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-200 bg-[color:var(--background)] py-3 pl-10 pr-11 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:focus:border-blue-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isDisabled}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--foreground)] text-sm font-semibold text-[color:var(--background)] transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-[color:var(--muted-foreground)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-[color:var(--foreground)] underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
