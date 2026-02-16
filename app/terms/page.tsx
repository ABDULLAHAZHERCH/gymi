import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — GYMI',
  description: 'Terms of Service for GYMI fitness web application.',
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Last updated: February 16, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[color:var(--muted-foreground)]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using GYMI (&quot;the Service&quot;), available at{' '}
              <a
                href="https://gymii.vercel.app"
                className="font-medium text-[color:var(--foreground)] underline underline-offset-4"
              >
                gymii.vercel.app
              </a>
              , you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              2. Description of Service
            </h2>
            <p>
              GYMI is a web-based fitness tracking application that allows users to:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Log workouts including exercises, sets, reps, and weights.</li>
              <li>Track meals, calories, and macronutrients.</li>
              <li>Set and monitor fitness goals.</li>
              <li>Track body weight over time.</li>
              <li>View progress insights, achievements, and streaks.</li>
              <li>Access AI-powered form coaching (where available).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              3. User Accounts
            </h2>
            <p>
              To use GYMI, you must create an account using email/password or
              Google Sign-In. You are responsible for:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Providing accurate and up-to-date information.</li>
              <li>Notifying us if you suspect unauthorized use of your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              4. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; data.</li>
              <li>Interfere with or disrupt the Service or related infrastructure.</li>
              <li>Upload malicious content or spam.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use automated tools to scrape or extract data from the Service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              5. User Content & Data
            </h2>
            <p>
              You retain ownership of all fitness data, workout logs, meal
              entries, and other content you create within GYMI. By using the
              Service, you grant us a limited license to store, process, and
              display your data solely for the purpose of providing the Service
              to you.
            </p>
            <p>
              You may export your data at any time using the built-in export
              feature (CSV or JSON format). You may delete your account and
              all associated data at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              6. Health & Fitness Disclaimer
            </h2>
            <p>
              GYMI is a fitness tracking tool and is <strong className="text-[color:var(--foreground)]">not</strong> a
              substitute for professional medical advice, diagnosis, or
              treatment. The Service does not provide medical or health advice.
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2">
              <li>Always consult a qualified healthcare provider before starting any fitness program.</li>
              <li>AI coaching features provide general guidance and may not be suitable for all users.</li>
              <li>We are not liable for any injuries or health issues resulting from following data or suggestions in the app.</li>
              <li>Calorie and macro calculations are estimates and should not be used as medical nutrition guidance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              7. Service Availability
            </h2>
            <p>
              We strive to keep GYMI available at all times, but we do not
              guarantee uninterrupted access. The Service may be temporarily
              unavailable due to maintenance, updates, or circumstances beyond
              our control. We are not liable for any loss or inconvenience caused
              by downtime.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              8. Intellectual Property
            </h2>
            <p>
              The GYMI name, logo, design, and application code are the
              intellectual property of the GYMI team. You may not copy,
              reproduce, or distribute any part of the Service without written
              permission, except for your own personal data which you own.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              9. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, GYMI and its developers
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to
              loss of data, loss of profits, or personal injury arising from
              your use of the Service.
            </p>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              10. Account Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account if you
              violate these Terms. You may delete your account at any time
              through the account settings. Upon termination, your data will be
              permanently deleted from our systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              11. Changes to Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time. Changes
              will be posted on this page with an updated date. Your continued
              use of the Service after changes are posted constitutes acceptance
              of the revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[color:var(--foreground)]">
              12. Contact
            </h2>
            <p>
              If you have questions about these Terms, please reach out through
              our GitHub repository at{' '}
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
              <Link href="/privacy" className="hover:text-[color:var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="font-medium text-[color:var(--foreground)]">
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
