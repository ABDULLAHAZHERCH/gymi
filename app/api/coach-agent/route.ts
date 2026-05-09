import { NextRequest, NextResponse } from 'next/server';
import { generateTextContent, PRIMARY_MODEL } from '@/lib/services/gemini';

interface SessionSummary {
  detectedExercise?: string;
  totalReps?: number;
  validReps?: number;
  accuracy?: number;
  avgConfidence?: number;
  violationCounts?: Record<string, number>;
}

interface WorkoutSummary {
  exercise?: string;
  sets?: number;
  reps?: number;
  duration?: number;
  source?: string;
}

interface MealSummary {
  mealName?: string;
  mealType?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface GoalSummary {
  title?: string;
  type?: string;
  status?: string;
  targetWorkoutsPerWeek?: number;
  targetCaloriesPerDay?: number;
}

interface CoachAgentContext {
  sessions?: SessionSummary[];
  workouts?: WorkoutSummary[];
  meals?: MealSummary[];
  goals?: GoalSummary[];
  liveExercise?: string | null;
  liveViolations?: string[];
  liveCorrections?: string[];
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ');
}

function summarizeSessions(sessions: SessionSummary[] = []): string {
  if (sessions.length === 0) return 'No coach sessions logged yet.';
  const violationTotals: Record<string, number> = {};
  let totalReps = 0;
  let validReps = 0;
  sessions.forEach((s) => {
    totalReps += s.totalReps ?? 0;
    validReps += s.validReps ?? 0;
    Object.entries(s.violationCounts ?? {}).forEach(([k, v]) => {
      violationTotals[k] = (violationTotals[k] ?? 0) + Number(v || 0);
    });
  });
  const accuracy = totalReps > 0 ? Math.round((validReps / totalReps) * 100) : 0;
  const topViolations = Object.entries(violationTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${humanizeKey(k)} (${v}x)`)
    .join(', ');
  const recent = sessions
    .slice(0, 3)
    .map((s) => {
      const ex = humanizeKey(s.detectedExercise ?? 'unknown');
      const acc = Math.round(((s.accuracy ?? 0) * 100));
      return `${ex}: ${s.validReps ?? 0}/${s.totalReps ?? 0} valid reps (${acc}% accuracy)`;
    })
    .join('; ');
  return [
    `Recent sessions: ${recent}.`,
    `Overall: ${validReps}/${totalReps} valid reps across ${sessions.length} sessions (${accuracy}% accuracy).`,
    topViolations ? `Most common form errors: ${topViolations}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function summarizeWorkouts(workouts: WorkoutSummary[] = []): string {
  if (workouts.length === 0) return 'No recent workouts logged.';
  const lines = workouts
    .slice(0, 5)
    .map((w) => `${w.exercise ?? 'workout'} ${w.sets ?? 0}x${w.reps ?? 0}`)
    .join(', ');
  return `Last ${Math.min(workouts.length, 5)} workouts: ${lines}.`;
}

function summarizeMeals(meals: MealSummary[] = []): string {
  if (meals.length === 0) return 'No meals logged.';
  const totals = meals.reduce(
    (acc, m) => {
      acc.calories += m.calories ?? 0;
      acc.protein += m.protein ?? 0;
      acc.carbs += m.carbs ?? 0;
      acc.fat += m.fat ?? 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return `Recent ${meals.length} meals total: ${Math.round(totals.calories)} kcal, ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat.`;
}

function summarizeGoals(goals: GoalSummary[] = []): string {
  if (goals.length === 0) return 'No active goals set.';
  return goals
    .slice(0, 3)
    .map((g) => {
      const parts = [g.title ?? g.type ?? 'goal'];
      if (g.targetWorkoutsPerWeek) parts.push(`${g.targetWorkoutsPerWeek} workouts/week`);
      if (g.targetCaloriesPerDay) parts.push(`${g.targetCaloriesPerDay} kcal/day`);
      if (g.status) parts.push(`(${g.status})`);
      return parts.join(' — ');
    })
    .join('; ');
}

function summarizeLive(context: CoachAgentContext): string {
  if (!context.liveExercise && (!context.liveViolations || context.liveViolations.length === 0)) {
    return 'No live form-analysis data right now.';
  }
  const parts: string[] = [];
  if (context.liveExercise) parts.push(`Currently doing: ${humanizeKey(context.liveExercise)}.`);
  if (context.liveViolations && context.liveViolations.length > 0) {
    parts.push(`Live form errors: ${context.liveViolations.join('; ')}.`);
  }
  if (context.liveCorrections && context.liveCorrections.length > 0) {
    parts.push(`Suggested corrections: ${context.liveCorrections.join('; ')}.`);
  }
  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body?.question ?? '').trim();
    const context = (body?.context ?? {}) as CoachAgentContext;

    if (!question) {
      return NextResponse.json({ answer: 'Ask me a training or form question.' });
    }

    const prompt = `You are Gymi Agent, an expert fitness coach inside the Gymi app. You give personalized advice based on the user's real training data from Firebase plus their live form-analysis feed.

USER'S TRAINING DATA:
- ${summarizeSessions(context.sessions)}
- ${summarizeWorkouts(context.workouts)}
- ${summarizeMeals(context.meals)}
- Goals: ${summarizeGoals(context.goals)}
- Live: ${summarizeLive(context)}

USER'S QUESTION:
${question}

INSTRUCTIONS:
- Reference specific numbers from the user's data when relevant (reps, accuracy, calories, exercises).
- If they're currently doing an exercise with form errors, address those first.
- Give concrete, actionable next steps — what to do in their next set, meal, or session.
- Reply in 3-5 complete sentences. Always finish your sentences fully. No medical or injury diagnoses.
- Do not use markdown headers or lists; reply as flowing prose.`;

    const answer = await generateTextContent(prompt, {
      temperature: 0.4,
      maxOutputTokens: 2048,
    });

    const cleaned = answer.trim();
    if (!cleaned) {
      return NextResponse.json(
        {
          answer:
            'Gymi Agent did not produce a reply this time. Try rephrasing the question or asking again.',
          model: PRIMARY_MODEL,
          source: 'gemini',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      answer: cleaned,
      model: PRIMARY_MODEL,
      source: 'gemini',
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('GEMINI_API_KEY')
        ? 'Gymi Agent needs GEMINI_API_KEY in .env.local before it can answer with the LLM.'
        : 'Gymi Agent could not reach the LLM model. Check the Gemini key and network, then try again.';

    return NextResponse.json(
      {
        answer: message,
        error: 'llm_unavailable',
        model: PRIMARY_MODEL,
        source: 'gemini',
      },
      { status: 503 }
    );
  }
}
