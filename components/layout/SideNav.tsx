'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UtensilsCrossed, Dumbbell, Home, TrendingUp, ChevronLeft, ChevronRight, Activity } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Workout", href: "/workouts", icon: Activity },
  { label: "Coach", href: "/coach", icon: Dumbbell },
  { label: "Nutrition", href: "/nutrition", icon: UtensilsCrossed },
  { label: "Progress", href: "/progress", icon: TrendingUp },
];

const SIDEBAR_STORAGE_KEY = "gymi-sidebar-collapsed";

export default function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState));
  };

  return (
    <aside
      className={`sticky top-6 hidden h-[calc(100vh-3rem)] flex-col gap-4 rounded-3xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-sm transition-all md:flex dark:border-zinc-800 ${
        collapsed ? "w-32" : "w-60"
      }`}
    >
      <div>
        {collapsed ? (
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
            GYMI
          </p>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted-foreground)]">
            GYMI
          </p>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
                  : "text-[color:var(--muted-foreground)] hover:bg-zinc-100 dark:hover:bg-zinc-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {collapsed ? null : <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-8 items-center justify-center gap-2 rounded-full border border-zinc-200 text-xs font-semibold text-[color:var(--muted-foreground)] transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
