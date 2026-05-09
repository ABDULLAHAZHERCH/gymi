'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import KineticNav from '@/components/kinetic/landing/Nav';
import KineticHero from '@/components/kinetic/landing/Hero';
import KineticTicker from '@/components/kinetic/landing/Ticker';
import KineticFeatureSlides from '@/components/kinetic/landing/FeatureSlides';
import KineticHowItWorks from '@/components/kinetic/landing/HowItWorks';
import KineticFooterCTA from '@/components/kinetic/landing/FooterCTA';

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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[#00D1FF]" />
      </div>
    );
  }

  return (
    <div className="kinetic-root dark" style={{ colorScheme: 'dark' }}>
      <KineticNav />
      <main>
        <KineticHero />
        <KineticTicker />
        <KineticFeatureSlides />
        <KineticHowItWorks />
        <KineticFooterCTA />
      </main>
    </div>
  );
}
