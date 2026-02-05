'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Dumbbell, Home, User, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Logs", href: "/logs", icon: BookOpen },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Coach", href: "/coach", icon: Dumbbell },
  { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-[color:var(--background)] px-3 py-2 backdrop-blur md:hidden dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-md items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 text-[11px] font-semibold tracking-wide transition-all ${
                isActive
                  ? "flex-[1.4] bg-black text-white"
                  : "text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className={isActive ? "block" : "hidden sm:block"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
