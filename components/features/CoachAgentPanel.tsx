'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader, Send, Sparkles, X } from 'lucide-react';

/**
 * Brand mark for Flex — a stylized lightning bolt that reads as "energy +
 * speed" and matches the lucide stroke weight of the rest of the UI. Renders
 * in currentColor so callers control the fill via text-* utilities.
 */
function FlexMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M14.2 2.2 L5.6 13.1 a0.7 0.7 0 0 0 0.55 1.13 H10.3 L8.55 21.1 a0.55 0.55 0 0 0 0.97 0.45 L18.4 10.7 a0.7 0.7 0 0 0 -0.55 -1.13 H13.6 L15.2 3.05 a0.6 0.6 0 0 0 -1.0 -0.85 Z" />
    </svg>
  );
}
import { getCoachSessions } from '@/lib/coachSessions';
import { getActiveGoals } from '@/lib/goals';
import { getMeals } from '@/lib/meals';
import { getRecentWorkouts } from '@/lib/workouts';
import type { CoachSession, Goal, Meal, Workout } from '@/lib/types/firestore';

interface CoachAgentPanelProps {
  uid?: string;
  liveExercise?: string | null;
  liveViolations?: string[];
  liveCorrections?: string[];
}

interface AgentMessage {
  role: 'agent' | 'user';
  text: string;
}

interface AgentContext {
  sessions: CoachSession[];
  workouts: Workout[];
  meals: Meal[];
  goals: Goal[];
}

interface AgentApiContext {
  sessions: Array<{
    detectedExercise: string;
    totalReps: number;
    validReps: number;
    accuracy: number;
    avgConfidence: number;
    violationCounts: Record<string, number>;
  }>;
  workouts: Array<{
    exercise: string;
    sets: number;
    reps: number;
    duration?: number;
    source?: string;
  }>;
  meals: Array<{
    mealName: string;
    mealType: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
  goals: Array<{
    title: string;
    type: string;
    status: string;
    targetWorkoutsPerWeek?: number;
    targetCaloriesPerDay?: number;
  }>;
  liveExercise?: string | null;
  liveViolations: string[];
  liveCorrections: string[];
}

const EMPTY_CONTEXT: AgentContext = {
  sessions: [],
  workouts: [],
  meals: [],
  goals: [],
};

function topViolation(sessions: CoachSession[], liveViolations: string[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((session) => {
    Object.entries(session.violationCounts || {}).forEach(([key, value]) => {
      counts[key] = (counts[key] ?? 0) + Number(value || 0);
    });
  });
  liveViolations.forEach((violation) => {
    counts[violation] = (counts[violation] ?? 0) + 3;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildNextStep(
  context: AgentContext,
  liveExercise?: string | null,
  liveViolations: string[] = [],
  liveCorrections: string[] = []
) {
  const latestSession = context.sessions[0];
  const issue = topViolation(context.sessions, liveViolations);
  const activeGoal = context.goals[0];

  if (liveCorrections.length > 0) {
    return liveCorrections[0];
  }

  if (issue) {
    return `Next set: slow down and focus on "${issue}" for the first 5 reps.`;
  }

  if (latestSession && latestSession.accuracy < 0.75) {
    return `Repeat ${latestSession.detectedExercise.replace(/_/g, ' ')} at lower speed before increasing reps.`;
  }

  if (activeGoal) {
    return `Work toward "${activeGoal.title}" with one clean coach-tracked set today.`;
  }

  if (liveExercise) {
    return `Keep the current ${liveExercise.replace(/_/g, ' ')} set controlled and save it when done.`;
  }

  return 'Start with a coach-tracked squat, push-up, or curl set so I can personalize the next step.';
}

function toAgentApiContext(
  context: AgentContext,
  liveExercise?: string | null,
  liveViolations: string[] = [],
  liveCorrections: string[] = []
): AgentApiContext {
  return {
    sessions: context.sessions.slice(0, 8).map((session) => ({
      detectedExercise: session.detectedExercise,
      totalReps: session.totalReps,
      validReps: session.validReps,
      accuracy: session.accuracy,
      avgConfidence: session.avgConfidence,
      violationCounts: session.violationCounts,
    })),
    workouts: context.workouts.slice(0, 8).map((workout) => ({
      exercise: workout.exercise,
      sets: workout.sets,
      reps: workout.reps,
      duration: workout.duration,
      source: workout.source,
    })),
    meals: context.meals.slice(0, 8).map((meal) => ({
      mealName: meal.mealName,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    })),
    goals: context.goals.slice(0, 5).map((goal) => ({
      title: goal.title,
      type: goal.type,
      status: goal.status,
      targetWorkoutsPerWeek: goal.targetWorkoutsPerWeek,
      targetCaloriesPerDay: goal.targetCaloriesPerDay,
    })),
    liveExercise,
    liveViolations,
    liveCorrections,
  };
}

export default function CoachAgentPanel({
  uid,
  liveExercise,
  liveViolations = [],
  liveCorrections = [],
}: CoachAgentPanelProps) {
  const [context, setContext] = useState<AgentContext>(EMPTY_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      role: 'agent',
      text: "Hey, I'm Flex — your AI form coach. Ask me what to train next, which mistakes keep repeating, or how your last set went.",
    },
  ]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    let cancelled = false;

    const loadAgentContext = async () => {
      setLoading(true);
      try {
        const [sessions, workouts, meals, goals] = await Promise.all([
          getCoachSessions(uid, 8),
          getRecentWorkouts(uid, 8),
          getMeals(uid, 12),
          getActiveGoals(uid),
        ]);
        if (!cancelled) {
          setContext({ sessions, workouts, meals, goals });
        }
      } catch {
        if (!cancelled) setContext(EMPTY_CONTEXT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAgentContext();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const activeContext = uid ? context : EMPTY_CONTEXT;

  const nextStep = useMemo(
    () => buildNextStep(activeContext, liveExercise, liveViolations, liveCorrections),
    [activeContext, liveExercise, liveViolations, liveCorrections]
  );

  const handleAsk = async () => {
    const question = input.trim();
    if (!question || asking) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
    ]);
    setInput('');

    setAsking(true);
    try {
      // Always fetch fresh data right before sending — the panel only loads
      // context once on mount, so without this the agent would answer with
      // stale snapshot from before the user saved their latest session.
      let freshContext: AgentContext = activeContext;
      if (uid) {
        try {
          const [sessions, workouts, meals, goals] = await Promise.all([
            getCoachSessions(uid, 8),
            getRecentWorkouts(uid, 8),
            getMeals(uid, 12),
            getActiveGoals(uid),
          ]);
          freshContext = { sessions, workouts, meals, goals };
          setContext(freshContext);
        } catch {
          // Fall back to whatever we already have in state.
        }
      }

      const response = await fetch('/api/coach-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: toAgentApiContext(
            freshContext,
            liveExercise,
            liveViolations,
            liveCorrections
          ),
        }),
      });
      const data = (await response.json()) as { answer?: string };
      const answer = data.answer || 'Gymi Agent did not return an answer. Try again.';
      if (!response.ok) {
        throw new Error(answer);
      }
      setMessages((prev) => [...prev, { role: 'agent', text: answer }]);
    } catch (error) {
      const text =
        error instanceof Error
          ? error.message
          : 'Gymi Agent could not reach the LLM model. Check the Gemini key and network, then try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text },
      ]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      {/* Floating action button — toggles chat. Branded "Flex" mark on a
          gradient pill so it reads as a product, not a generic chat widget. */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="group fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/40 ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
        aria-label={isOpen ? 'Close Flex coach chat' : 'Open Flex coach chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <FlexMark className="h-6 w-6 drop-shadow-sm" />
        )}
      </button>

      {/* Chat panel — stays mounted so messages persist while session is open */}
      <div
        className={`fixed bottom-36 right-5 z-40 w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right transition-all duration-200 ease-out sm:bottom-24 sm:right-6 ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-95 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="rounded-2xl border border-zinc-200 bg-[color:var(--background)] p-4 shadow-2xl dark:border-zinc-800">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-1 ring-white/20">
                <FlexMark className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Flex
                </p>
                <p className="text-[11px] text-[color:var(--muted-foreground)]">
                  Your AI form coach
                </p>
              </div>
            </div>
            {loading ? (
              <Loader className="h-4 w-4 animate-spin text-[color:var(--muted-foreground)]" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-500" />
            )}
          </div>

          <div className="mb-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/60">
            <p className="text-xs uppercase text-[color:var(--muted-foreground)]">
              Suggested next move
            </p>
            <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
              {uid ? nextStep : 'Sign in to unlock database-backed recommendations.'}
            </p>
          </div>

          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {messages.slice(-6).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 text-xs ${
                  message.role === 'agent'
                    ? 'bg-zinc-100 text-[color:var(--foreground)] dark:bg-zinc-900'
                    : 'ml-8 bg-[color:var(--foreground)] text-[color:var(--background)]'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAsk();
              }}
              placeholder="Ask Flex about form, reps, meals..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-zinc-800"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={asking}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--foreground)] text-[color:var(--background)]"
              aria-label="Send to Flex"
            >
              {asking ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
