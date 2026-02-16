'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Activity, Dumbbell, TrendingUp, Utensils, ChevronRight, Zap } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If logged in, redirect to /home
  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[color:var(--background)]/80 backdrop-blur-lg dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-black tracking-tight">GYMI</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[color:var(--foreground)] px-5 py-2 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] dark:border-zinc-800 dark:bg-zinc-900">
            <Zap className="h-3 w-3" />
            AI-Powered Fitness Coaching
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
            Your fitness journey
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              starts here.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[color:var(--muted-foreground)] sm:text-lg">
            Track workouts, log nutrition, set goals, and get AI-powered coaching — all in one beautifully simple app.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-8 py-3.5 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-90 sm:w-auto"
            >
              Start Your Journey
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-full border border-zinc-200 px-8 py-3.5 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 sm:w-auto"
            >
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to level up
            </h2>
            <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
              Simple tools, powerful results.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Activity,
                title: 'Workout Tracking',
                desc: 'Log exercises, sets, reps, and weight. Track your progress over time.',
              },
              {
                icon: Utensils,
                title: 'Nutrition Diary',
                desc: 'Track meals, calories, and macros. Stay on top of your diet.',
              },
              {
                icon: TrendingUp,
                title: 'Progress Insights',
                desc: 'Visualize your journey with charts, streaks, and achievements.',
              },
              {
                icon: Dumbbell,
                title: 'AI Coach',
                desc: 'Get real-time form correction and personalized guidance.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-6 transition-shadow hover:shadow-md dark:border-zinc-800"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <feature.icon className="h-5 w-5 text-[color:var(--foreground)]" />
                </div>
                <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to transform your fitness?
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted-foreground)]">
            Join GYMI today. It&apos;s free to get started.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] px-8 py-3.5 text-sm font-semibold text-[color:var(--background)] transition-opacity hover:opacity-90"
          >
            Create Free Account
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm font-bold tracking-tight">GYMI</span>
            <div className="flex items-center gap-4 text-xs text-[color:var(--muted-foreground)]">
              <Link href="/privacy" className="transition-colors hover:text-[color:var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[color:var(--foreground)]">
                Terms
              </Link>
              <span>&copy; {new Date().getFullYear()} GYMI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
