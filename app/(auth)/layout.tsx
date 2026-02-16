import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-zinc-100/50 via-transparent to-zinc-100/30 dark:from-zinc-900/30 dark:to-zinc-900/10" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-6 sm:px-4 sm:py-8 md:max-w-lg">
        <div className="rounded-2xl border border-zinc-200/80 bg-[color:var(--background)] p-6 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:shadow-zinc-900/40 sm:p-8 md:p-10">
          {children}
        </div>

        {/* Footer branding */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
            <Link href="/privacy" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-400">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/terms" className="transition-colors hover:text-zinc-600 dark:hover:text-zinc-400">
              Terms
            </Link>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Gymi — Your personal fitness companion
          </p>
        </div>
      </div>
    </div>
  );
}
