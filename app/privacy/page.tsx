import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — GYMI',
  description: 'Privacy Policy for GYMI fitness web application.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[color:var(--background)]/80 backdrop-blur-lg dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-black tracking-tight">
            GYMI
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Last updated: February 16, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              1. Introduction
            </h2>
            <p>
              GYMI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a fitness
              tracking web application. This Privacy Policy explains how we collect,
              use, and protect your information when you use our service at{' '}
              <a
                href="https://gymii.vercel.app"
                className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
              >
                gymii.vercel.app
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              2. Information We Collect
            </h2>
            <p>When you use GYMI, we may collect the following information:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>
                <strong className="text-[color:var(--foreground)]">Account information:</strong>{' '}
                Name, email address, and profile photo (when signing in with Google).
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Fitness data:</strong>{' '}
                Workouts, meals, weight logs, goals, and achievements you choose to log.
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Body metrics:</strong>{' '}
                Height, weight, and fitness goals provided during onboarding.
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Usage data:</strong>{' '}
                Feature interactions, preferences (e.g., unit system, theme), and device information.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              3. How We Use Your Information
            </h2>
            <p>Your data is used to:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Provide and personalize the GYMI fitness tracking experience.</li>
              <li>Display your workout history, nutrition logs, and progress charts.</li>
              <li>Calculate achievements, streaks, and insights.</li>
              <li>Generate in-app notifications and reminders.</li>
              <li>Improve our service and fix issues.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              4. Data Storage & Security
            </h2>
            <p>
              Your data is stored securely in Google Firebase (Firestore). We use
              Firebase Authentication to manage your account. All data is
              protected by Firestore security rules that ensure only you can
              access your own data.
            </p>
            <p>
              We do not sell, rent, or share your personal data with third
              parties for marketing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              5. Third-Party Services
            </h2>
            <p>GYMI uses the following third-party services:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>
                <strong className="text-[color:var(--foreground)]">Firebase (Google):</strong>{' '}
                Authentication and database services.{' '}
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
                >
                  Firebase Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Vercel:</strong>{' '}
                Hosting and deployment.{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
                >
                  Vercel Privacy Policy
                </a>
              </li>
              <li>
                <strong className="text-[color:var(--foreground)]">Google Sign-In:</strong>{' '}
                OAuth authentication. We receive your name, email, and profile
                photo from your Google account when you choose to sign in with Google.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              6. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Access all fitness data stored in your account.</li>
              <li>Export your data at any time (CSV or JSON) from the account settings.</li>
              <li>Delete your account and associated data.</li>
              <li>Update your personal information and preferences.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              7. Cookies & Local Storage
            </h2>
            <p>
              GYMI uses browser local storage and IndexedDB for offline
              functionality and caching. We do not use third-party tracking
              cookies. Firebase may set authentication-related cookies to
              maintain your session.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              8. Children&apos;s Privacy
            </h2>
            <p>
              GYMI is not intended for use by children under 13. We do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated date. Continued use of GYMI
              after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              10. Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              through our GitHub repository at{' '}
              <a
                href="https://github.com/ABDULLAHAZHERCH/gymi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
              >
                github.com/ABDULLAHAZHERCH/gymi
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm font-bold tracking-tight">GYMI</span>
            <div className="flex items-center gap-4 text-xs text-[color:var(--muted-foreground)]">
              <Link href="/privacy" className="font-medium text-[color:var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[color:var(--foreground)]">
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
