import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8 md:max-w-lg">
        <div className="rounded-3xl border border-zinc-200 bg-[color:var(--background)] p-6 shadow-sm dark:border-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}
