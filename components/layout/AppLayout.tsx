import type { ReactNode } from "react";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SideNav from "@/components/layout/SideNav";
import PageTransition from "@/components/providers/PageTransition";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

type AppLayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl gap-6 px-4 py-6 md:px-6">
        <SideNav />
        <div className="flex w-full flex-col rounded-3xl bg-[color:var(--background)] md:border md:border-zinc-200 md:shadow-sm dark:md:border-zinc-800">
          <PageHeader title={title ?? "GYMI"} />
          <PageTransition>
            <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
              {children}
            </div>
          </PageTransition>
        </div>
      </div>
      <BottomNav />
      <OfflineIndicator />
    </div>
  );
}
