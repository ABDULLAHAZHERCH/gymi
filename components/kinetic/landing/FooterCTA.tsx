import Link from 'next/link';

export default function KineticFooterCTA() {
  return (
    <>
      <section className="kx-foot-cta" id="pricing">
        <div className="kx-foot-cta__bg" />
        <div className="kx-foot-cta__inner">
          <div className="kx-eyebrow">[ §04 · ENLIST ]</div>
          <h2 className="kx-foot-cta__h">
            ENTER THE
            <br />
            <span className="kx-foot-cta__accent">KINETIC STATE.</span>
          </h2>
          <p className="kx-foot-cta__p">Free for 14 days. No card. Cancel anytime.</p>
          <Link href="/register" className="kx-btn kx-btn--primary kx-btn--lg">
            <span>BEGIN TRIAL</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="kx-foot">
        <div>
          GYMI<span style={{ color: '#00D1FF' }}>.</span> · KINETIC ENGINE © {new Date().getFullYear()}
        </div>
        <div className="kx-foot__links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:support@gymi.app">Support</a>
        </div>
      </footer>
    </>
  );
}
