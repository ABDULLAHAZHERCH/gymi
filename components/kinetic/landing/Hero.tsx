'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ShaderBg from '@/components/kinetic/ShaderBg';
import AnimatedDumbbell from '@/components/kinetic/AnimatedDumbbell';

export default function KineticHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [seqLabel, setSeqLabel] = useState<string>('—');

  useEffect(() => {
    setSeqLabel(`SEQ-${Math.floor(Date.now() / 1000) % 1_000_000}`);
  }, []);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      node.style.setProperty('--mx', String(mx));
      node.style.setProperty('--my', String(my));
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="kx-hero" ref={heroRef}>
      <ShaderBg className="kx-hero__shader" intensity={1.05} />
      <div className="kx-hero__scanlines" />
      <div className="kx-hero__noise" />

      <div className="kx-hero__inner">
        <div className="kx-hero__copy">
          <div className="kx-badge">
            <span className="kx-badge__pulse" />
            <span>V2.0 · KINETIC RELEASE</span>
            <span className="kx-badge__sep">·</span>
            <span style={{ color: '#CCFF00' }}>LIVE NOW</span>
          </div>

          <h1 className="kx-hero__title">
            <span className="kx-hero__title-line">
              <span className="kx-hero__title-mute">YOUR PERSONAL</span>
            </span>
            <span className="kx-hero__title-line">
              <span className="kx-hero__title-glitch" data-text="AI COACH">AI COACH</span>
            </span>
            <span className="kx-hero__title-line">
              <span className="kx-hero__title-mute kx-hero__title-italic">in your</span>
              <span className="kx-hero__title-pocket">POCKET.</span>
            </span>
          </h1>

          <p className="kx-hero__sub">
            Train smarter with computer-vision form analysis, adaptive programming, and
            instant nutrition AI. Built for athletes who measure everything.
          </p>

          <div className="kx-hero__cta">
            <Link href="/register" className="kx-btn kx-btn--primary kx-btn--lg">
              <span>START FREE TRIAL</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
              </svg>
            </Link>
            <Link href="/login" className="kx-btn kx-btn--ghost kx-btn--lg">
              <span className="kx-btn__dot" />
              SIGN IN
            </Link>
          </div>

          <div className="kx-hero__meta">
            <div>
              <div className="kx-hero__meta-num">
                4.9<span style={{ color: '#00D1FF' }}>★</span>
              </div>
              <div className="kx-hero__meta-lbl">App store</div>
            </div>
            <div className="kx-hero__meta-divider" />
            <div>
              <div className="kx-hero__meta-num">
                50<span style={{ color: '#00D1FF' }}>K</span>
              </div>
              <div className="kx-hero__meta-lbl">Active</div>
            </div>
            <div className="kx-hero__meta-divider" />
            <div>
              <div className="kx-hero__meta-num">
                1<span style={{ color: '#00D1FF' }}>M+</span>
              </div>
              <div className="kx-hero__meta-lbl">Workouts</div>
            </div>
          </div>
        </div>

        <div className="kx-hero__visual">
          <div className="kx-hero__orbit">
            <div className="kx-hero__orbit-ring kx-hero__orbit-ring--1" />
            <div className="kx-hero__orbit-ring kx-hero__orbit-ring--2" />
            <div className="kx-hero__orbit-ring kx-hero__orbit-ring--3" />

            <AnimatedDumbbell size={420} />

            <div className="kx-hud kx-hud--tl">
              <div className="kx-hud__tick" />
              <div className="kx-hud__lbl">FORM</div>
              <div className="kx-hud__val">98<span>%</span></div>
            </div>
            <div className="kx-hud kx-hud--tr">
              <div className="kx-hud__tick" />
              <div className="kx-hud__lbl">TEMPO</div>
              <div className="kx-hud__val">2.1<span>s</span></div>
            </div>
            <div className="kx-hud kx-hud--bl">
              <div className="kx-hud__tick" />
              <div className="kx-hud__lbl">RPE</div>
              <div className="kx-hud__val">7.5</div>
            </div>
            <div className="kx-hud kx-hud--br">
              <div className="kx-hud__tick" />
              <div className="kx-hud__lbl">LOAD</div>
              <div className="kx-hud__val">+12<span>%</span></div>
            </div>

            <svg className="kx-hero__sweep" viewBox="0 0 500 500">
              <circle cx="250" cy="250" r="200" fill="none" stroke="#00D1FF" strokeWidth="0.6" opacity="0.3" />
              <circle
                cx="250" cy="250" r="200"
                fill="none" stroke="#00D1FF" strokeWidth="2"
                strokeDasharray="40 1216" strokeLinecap="round"
              >
                <animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle cx="250" cy="250" r="170" fill="none" stroke="#CCFF00" strokeWidth="0.4" opacity="0.25" strokeDasharray="2 6" />
              {[0, 60, 120, 180, 240, 300].map(a => (
                <line
                  key={a}
                  x1="250" y1="40" x2="250" y2="56"
                  stroke="#00D1FF" strokeWidth="1.2"
                  transform={`rotate(${a} 250 250)`}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="kx-hero__corner kx-hero__corner--tl">[ KINETIC.SYS ]</div>
      <div className="kx-hero__corner kx-hero__corner--tr">[ ENGINE://ONLINE ]</div>
      <div className="kx-hero__corner kx-hero__corner--bl">REC ●</div>
      <div className="kx-hero__corner kx-hero__corner--br" suppressHydrationWarning>{seqLabel}</div>
    </section>
  );
}
