import type { ReactNode } from "react";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

type MobileLayoutProps = {
  title?: string;
  children: ReactNode;
};

export default function MobileLayout({ title, children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-black md:px-4 md:py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-white md:min-h-[720px] md:rounded-3xl md:border md:border-zinc-200 md:shadow-sm">
        <PageHeader title={title ?? "GYMI"} />
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
