import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FALLBACK_MODELS, PRIMARY_MODEL } from '@/lib/services/gemini';

interface GeminiModelInfo {
  name: string;
  supportedGenerationMethods?: string[];
}

function normalizeModelName(modelName: string): string {
  return modelName.startsWith('models/') ? modelName : `models/${modelName}`;
}

function hasGenerateContent(model?: GeminiModelInfo): boolean {
  if (!model?.supportedGenerationMethods) {
    return false;
  }

  return model.supportedGenerationMethods.includes('generateContent');
}

export async function GET() {
  const isDev = process.env.NODE_ENV !== 'production';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        primaryModel: PRIMARY_MODEL,
        fallbackModels: FALLBACK_MODELS,
        error: 'GEMINI_API_KEY is missing.',
      },
      { status: 503 }
    );
  }

  try {
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await fetch(listModelsUrl, { cache: 'no-store' });

    if (!listResponse.ok) {
      const detail = await listResponse.text();
      return NextResponse.json(
        {
          success: false,
          configured: true,
          primaryModel: PRIMARY_MODEL,
          fallbackModels: FALLBACK_MODELS,
          error: `Failed to list Gemini models (${listResponse.status}).`,
          ...(isDev ? { detail } : {}),
        },
        { status: 502 }
      );
    }

    const payload = (await listResponse.json()) as { models?: GeminiModelInfo[] };
    const models = payload.models || [];
    const modelMap = new Map(models.map(model => [model.name, model]));

    const normalizedPrimary = normalizeModelName(PRIMARY_MODEL);
    const normalizedFallbacks = FALLBACK_MODELS.map(normalizeModelName);

    const availableFallbacks = normalizedFallbacks.filter(model => modelMap.has(model));
    const generateCapableFallbacks = availableFallbacks.filter(model => hasGenerateContent(modelMap.get(model)));

    const probeModelName =
      generateCapableFallbacks[0]?.replace(/^models\//, '') ||
      normalizedPrimary.replace(/^models\//, '');

    let runtimeStatus: 'ok' | 'quota' | 'auth' | 'model' | 'error' = 'ok';
    let runtimeDetail = 'Probe request succeeded.';

    try {
      const client = new GoogleGenerativeAI(apiKey);
      const probeModel = client.getGenerativeModel({ model: probeModelName });
      await probeModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Reply with exactly: OK' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4,
          temperature: 0,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();

      if (
        lower.includes('429') ||
        lower.includes('quota') ||
        lower.includes('resource has been exhausted')
      ) {
        runtimeStatus = 'quota';
        runtimeDetail = 'API key is valid, but quota/rate limit is currently exceeded.';
      } else if (
        lower.includes('api_key_invalid') ||
        lower.includes('api key not valid') ||
        lower.includes('unauthorized') ||
        lower.includes('permission denied')
      ) {
        runtimeStatus = 'auth';
        runtimeDetail = 'API key is invalid or unauthorized for Gemini API.';
      } else if (
        lower.includes('404') ||
        lower.includes('not found') ||
        lower.includes('not supported for generatecontent')
      ) {
        runtimeStatus = 'model';
        runtimeDetail = `Configured model \"${probeModelName}\" is not available for generateContent.`;
      } else {
        runtimeStatus = 'error';
        runtimeDetail = 'Unexpected error while probing Gemini generateContent.';
      }

      if (isDev) {
        runtimeDetail = `${runtimeDetail} ${message}`;
      }
    }

    const primaryModelInfo = modelMap.get(normalizedPrimary);
    const primaryAvailable = Boolean(primaryModelInfo);
    const primaryGenerateCapable = hasGenerateContent(primaryModelInfo);

    const success = runtimeStatus === 'ok' && generateCapableFallbacks.length > 0;
    const statusCode = success ? 200 : runtimeStatus === 'quota' ? 429 : 503;

    return NextResponse.json(
      {
        success,
        configured: true,
        primaryModel: PRIMARY_MODEL,
        primaryAvailable,
        primaryGenerateCapable,
        fallbackModels: FALLBACK_MODELS,
        availableFallbackModels: availableFallbacks.map(model => model.replace(/^models\//, '')),
        generateCapableFallbackModels: generateCapableFallbacks.map(model => model.replace(/^models\//, '')),
        probeModel: probeModelName,
        runtimeStatus,
        runtimeDetail,
      },
      { status: statusCode }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        configured: true,
        primaryModel: PRIMARY_MODEL,
        fallbackModels: FALLBACK_MODELS,
        error: 'Health check failed.',
        ...(isDev ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
