'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCachedData } from '@/lib/hooks/useCachedData';
import {
  activateProgram,
  archiveProgram,
  completeProgram,
  getProgram,
} from '@/lib/workoutPrograms';
import { WorkoutProgram } from '@/lib/types/firestore';
import ProgramDisplay from '@/components/features/ProgramDisplay';
import { useToast } from '@/lib/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils/errorMessages';

interface ProgramDetailClientProps {
  programId: string;
}

export default function ProgramDetailClient({ programId }: ProgramDetailClientProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    data: program,
    loading,
    setData: setProgram,
  } = useCachedData<WorkoutProgram | null>({
    key: `program:${user?.uid}:${programId}`,
    fetcher: useCallback(() => getProgram(user!.uid, programId), [user, programId]),
    enabled: !!user,
  });

  const updateStatus = async (status: WorkoutProgram['status']) => {
    if (!user || !program) return;

    try {
      if (status === 'completed') {
        await completeProgram(user.uid, program.id);
      } else if (status === 'archived') {
        await archiveProgram(user.uid, program.id);
      } else {
        await activateProgram(user.uid, program.id);
      }

      setProgram((prev) => {
        if (!prev) {
          return null;
        }

        return {
          ...prev,
          status,
          updatedAt: new Date(),
          completedAt: status === 'completed' ? new Date() : prev.completedAt,
          startedAt: status === 'active' ? new Date() : prev.startedAt,
        };
      });

      showToast(`Program marked ${status}`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update program status'), 'error');
    }
  };

  return (
    <AppLayout title="Program Detail">
      <section className="space-y-4">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Programs
        </Link>

        {loading ? (
          <div className="space-y-3">
            <div className="h-36 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
            <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
        ) : !program ? (
          <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-6 text-center shadow-sm dark:border-zinc-800">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[color:var(--muted-foreground)]" />
            <p className="text-sm font-semibold text-[color:var(--foreground)]">Program not found</p>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              This program may have been deleted or is not accessible.
            </p>
            <Link
              href="/programs"
              className="mt-4 inline-flex rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-[color:var(--foreground)] dark:border-zinc-800"
            >
              Go to Programs
            </Link>
          </div>
        ) : (
          <ProgramDisplay
            program={program}
            onComplete={() => updateStatus('completed')}
            onArchive={() => updateStatus('archived')}
          />
        )}
      </section>
    </AppLayout>
  );
}
