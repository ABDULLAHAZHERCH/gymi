import { NextRequest, NextResponse } from 'next/server';
import { generateTextContent, PRIMARY_MODEL } from '@/lib/services/gemini';

interface CoachAgentContext {
  sessions?: unknown[];
  workouts?: unknown[];
  meals?: unknown[];
  goals?: unknown[];
  liveExercise?: string | null;
  liveViolations?: string[];
  liveCorrections?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = String(body?.question ?? '').trim();
    const context = (body?.context ?? {}) as CoachAgentContext;

    if (!question) {
      return NextResponse.json({ answer: 'Ask me a training or form question.' });
    }

    const prompt = `You are Gymi Agent, a concise fitness coach inside the Gymi app.
Use the user's Firebase-backed Gymi data and current form-analysis context.
Give practical next-step advice in 2-4 short sentences. Do not diagnose injuries or give medical claims.

Question:
${question}

Context JSON:
${JSON.stringify(context).slice(0, 12000)}`;

    const answer = await generateTextContent(prompt, {
      temperature: 0.35,
      maxOutputTokens: 320,
    });
    return NextResponse.json({
      answer: answer.trim(),
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
