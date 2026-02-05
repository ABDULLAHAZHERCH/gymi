import AppLayout from "@/components/layout/AppLayout";

export default function CoachPage() {
  return (
    <AppLayout title="Coach">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900">AI Coach</h2>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          Live form guidance and rep counting will land in Phase 5.
        </p>
      </section>
    </AppLayout>
  );
}
