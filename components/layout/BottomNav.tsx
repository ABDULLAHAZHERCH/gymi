'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UtensilsCrossed, Dumbbell, Home, TrendingUp, Activity, Ellipsis, FolderKanban } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Workout", href: "/workouts", icon: Activity },
  { label: "Coach", href: "/coach", icon: Dumbbell },
  { label: "Nutrition", href: "/nutrition", icon: UtensilsCrossed },
];

const MORE_ITEMS = [
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Programs", href: "/programs", icon: FolderKanban },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!moreOpen) return;

      const target = event.target as Node | null;
      if (!target) return;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [moreOpen]);

  const isMoreActive = MORE_ITEMS.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-[color:var(--background)] px-3 py-2 backdrop-blur md:hidden dark:border-zinc-800">
      <div ref={menuRef} className="relative mx-auto flex w-full max-w-md items-center gap-2">
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

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-2 text-[11px] font-semibold tracking-wide transition-all ${
            isMoreActive || moreOpen
              ? "flex-[1.4] bg-black text-white"
              : "text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
          aria-label="Open more pages"
          aria-expanded={moreOpen}
        >
          <Ellipsis className="h-4 w-4" aria-hidden="true" />
          <span className={isMoreActive || moreOpen ? "block" : "hidden sm:block"}>More</span>
        </button>

        {moreOpen && (
          <div className="absolute bottom-14 right-0 w-44 rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-2 shadow-xl dark:border-zinc-800">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                    isActive
                      ? "bg-black text-white"
                      : "text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
