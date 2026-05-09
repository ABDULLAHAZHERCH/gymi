'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function KineticNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`kx-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <Link href="/" className="kx-nav__logo">
        <span className="kx-nav__logo-mark">
          <span className="kx-nav__logo-bar" />
        </span>
        <span>
          GYMI<span style={{ color: '#00D1FF' }}>.</span>
        </span>
      </Link>
      <nav className="kx-nav__links">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#docs">Docs</a>
      </nav>
      <div className="kx-nav__cta">
        <Link href="/login" className="kx-nav__signin">Sign in</Link>
        <Link href="/register" className="kx-btn kx-btn--primary kx-btn--sm">
          Start trial
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
