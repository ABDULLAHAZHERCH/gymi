'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Activity,
  TrendingUp,
  ChevronRight,
  Zap,
  Camera,
  Brain,
  Target,
  Smartphone,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Stitch Design System Tokens                                         */
/* ------------------------------------------------------------------ */
// Canvas: bg-[#0e0e0f]
// Section: bg-[#131314]
// Card: bg-[#201f21]
// Hover: bg-[#2c2c2d]
// Primary Action: #00D1FF
// Secondary Action / Success: #CCFF00

function FloatingIcon({
  icon: Icon,
  delay,
  duration,
  x,
  y,
  size,
  color = "text-[#00D1FF]/20"
}: {
  icon: typeof Activity;
  delay: number;
  duration: number;
  x: string;
  y: string;
  size: number;
  color?: string;
}) {
  return (
    <div
      className={`floating-icon absolute ${color}`}
      style={{
        left: x,
        top: y,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <Icon size={size} />
    </div>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const step = Math.ceil(target / 40);
          let current = 0;
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(interval);
            } else {
              setCount(current);
            }
          }, 30);
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById(`counter-${target}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <span id={`counter-${target}`}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[#00D1FF]" />
      </div>
    );
  }

  const features = [
    {
      icon: Target,
      title: 'AI Workout Form Coach',
      desc: 'Real-time kinetic tracking. Your device camera becomes a precision form analyzer.',
      color: 'text-[#00D1FF]',
      glow: 'shadow-[0_0_30px_rgba(0,209,255,0.08)]'
    },
    {
      icon: Camera,
      title: 'AI Meal Recognition',
      desc: 'Instant nutritional breakdown from a single photo. No more manual barcode scanning.',
      color: 'text-[#CCFF00]',
      glow: 'shadow-[0_0_30px_rgba(204,255,0,0.05)]'
    },
    {
      icon: Activity,
      title: 'Complete Tracking',
      desc: 'Volume, intensity, streaks, and PRs—all visualized in a head-up display.',
      color: 'text-[#00D1FF]',
      glow: 'shadow-[0_0_30px_rgba(0,209,255,0.08)]'
    },
    {
      icon: Zap,
      title: 'Smart Programming',
      desc: 'Generative routines that adapt to your fatigue levels, equipment, and goals.',
      color: 'text-white',
      glow: 'shadow-[0_0_30px_rgba(255,255,255,0.05)]'
    },
  ];

  const steps = [
    { icon: Smartphone, title: 'Position Device', desc: 'Step back so your full body is in frame.' },
    { icon: Brain, title: 'AI Analyzes', desc: 'Our engine detects joints and evaluates angles.' },
    { icon: TrendingUp, title: 'Get Feedback', desc: 'Receive instant visual cues to perfect your lift.' }
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white selection:bg-[#00D1FF]/30 font-sans dark" style={{ colorScheme: 'dark' }}>
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full bg-[#131314]/80 backdrop-blur-2xl border-b border-transparent">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <span className="text-xl font-black tracking-[-0.05em] uppercase">
            GYMI<span className="text-[#00D1FF]">.</span>
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-br from-[#69daff] to-[#00c0ea] px-6 py-2.5 text-sm font-bold text-[#002a35] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-[1400px] px-6 pt-36 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        {/* Abstract Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00D1FF] opacity-[0.07] blur-[120px] pointer-events-none rounded-[100%]" />
        
        <div className="relative z-10 flex flex-col items-start w-full leading-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#CCFF00] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
            V1.0 Early Access
          </div>

          <h1 className="text-6xl font-black tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl relative uppercase">
            Your Personal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-[#00D1FF]">
              AI Fitness Coach
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-zinc-400 sm:text-xl">
            A high-contrast, immersive environment bridging the gap between high-performance athletic engineering and seamless digital tracking. 
          </p>

          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group flex items-center justify-center gap-3 rounded-[0.75rem] bg-gradient-to-br from-[#69daff] to-[#00c0ea] px-10 py-5 text-base font-black text-[#002a35] transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              Start Free Trial
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center rounded-[0.75rem] bg-[#2c2c2d]/50 border border-[#484849] px-10 py-5 text-base font-bold text-white backdrop-blur-md transition-colors hover:bg-[#2c2c2d] w-full sm:w-auto"
            >
              See It In Action
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="bg-[#131314] py-16">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 divide-x divide-zinc-800">
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter text-white md:text-5xl">
                4.9<span className="text-[#00D1FF]">★</span>
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500">App Store Rating</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter text-white md:text-5xl">
                <AnimatedCounter target={1} suffix="M+" />
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Workouts Logged</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter text-white md:text-5xl">
                <AnimatedCounter target={50} suffix="K+" />
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Active Athletes</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tracking-tighter text-white md:text-5xl">
                <AnimatedCounter target={99} suffix="%" />
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Form Improvement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 bg-[#0e0e0f]">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter md:text-6xl max-w-2xl">
              Engineered For <span className="text-[#00D1FF]">Performance</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex flex-col justify-between rounded-2xl bg-[#201f21] p-8 transition-transform hover:-translate-y-2 ${feature.glow}`}
              >
                <div>
                  <feature.icon className={`mb-6 h-8 w-8 ${feature.color}`} />
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm font-medium leading-relaxed text-[#adaaab]">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 md:py-32 bg-[#131314] overflow-hidden">
        {/* Glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CCFF00] opacity-[0.03] blur-[150px] pointer-events-none rounded-[100%]" />
        
        <div className="relative z-10 mx-auto max-w-[1400px] px-6">
          <div className="mb-16 md:text-right">
            <h2 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">
              How It <span className="text-[#CCFF00]">Works</span>
            </h2>
            <p className="md:ml-auto mt-4 max-w-sm text-sm font-medium leading-relaxed text-[#adaaab]">
              Three frictionless steps to elite form correction. No wearables required.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-zinc-800" />
            
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center p-6 bg-[#262627]/40 backdrop-blur-3xl rounded-3xl border border-[#484849]/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#201f21] text-[#CCFF00] text-xl font-black border border-[#CCFF00]/20 mb-6">
                  {i + 1}
                </div>
                <step.icon className="h-8 w-8 text-white mb-4" />
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-[#adaaab] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 bg-[#0e0e0f] text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-5xl font-black uppercase tracking-tighter md:text-7xl mb-8">
            Enter The <span className="text-[#00D1FF]">Kinetic</span> State
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[0.75rem] bg-gradient-to-br from-[#69daff] to-[#00c0ea] px-12 py-6 text-xl font-black text-[#002a35] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#0e0e0f] py-12">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <span className="text-lg font-black uppercase tracking-tight">GYMI<span className="text-[#00D1FF]">.</span></span>
          <div className="flex gap-6 text-sm font-medium text-zinc-600">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
