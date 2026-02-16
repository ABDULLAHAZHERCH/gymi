import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8 md:max-w-lg">
        <div className="rounded-2xl border border-zinc-200/80 bg-[color:var(--background)] p-8 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:shadow-zinc-900/40 sm:p-10">
          {children}
        </div>

        {/* Footer branding */}
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Gymi — Your personal fitness companion
        </p>
      </div>
    </div>
  );
}
