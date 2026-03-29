import { NextRequest, NextResponse } from 'next/server';
import { analyzeFoodImage } from '@/lib/services/gemini';

const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image too large. Maximum size is 4MB.' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "image" field. Expected a base64-encoded string.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = body.mimeType || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid MIME type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
    let base64Image = body.image;
    if (base64Image.startsWith('data:')) {
      const commaIndex = base64Image.indexOf(',');
      if (commaIndex !== -1) {
        base64Image = base64Image.substring(commaIndex + 1);
      }
    }

    // Basic base64 validation - check size after stripping
    const estimatedBytes = (base64Image.length * 3) / 4;
    if (estimatedBytes > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image too large. Maximum size is 4MB.' },
        { status: 400 }
      );
    }

    // Call Gemini API
    const result = await analyzeFoodImage(base64Image, mimeType);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isDev = process.env.NODE_ENV !== 'production';

    // Handle specific error cases
    if (message === 'No food detected in image') {
      return NextResponse.json(
        { success: false, error: message },
        { status: 422 }
      );
    }

    if (message.includes('API key') || message.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Food recognition service is not configured.',
          ...(isDev ? { detail: message } : {}),
        },
        { status: 503 }
      );
    }

    const lower = message.toLowerCase();

    const isAuthError =
      lower.includes('api_key_invalid') ||
      lower.includes('api key not valid') ||
      lower.includes('permission denied') ||
      lower.includes('unauthorized');

    if (isAuthError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key is invalid or unauthorized. Check GEMINI_API_KEY.',
          ...(isDev ? { detail: message } : {}),
        },
        { status: 503 }
      );
    }

    const isRateLimited =
      lower.includes('429') ||
      lower.includes('quota') ||
      lower.includes('resource has been exhausted') ||
      lower.includes('rate limit') ||
      lower.includes('too many requests');

    if (isRateLimited) {
      const isQuotaUnavailable = lower.includes('limit: 0') || lower.includes('quota exceeded for metric');
      const retryMatch = lower.match(/please retry in\s+([0-9]+(?:\.[0-9]+)?)s/);
      const retryAfter = retryMatch ? String(Math.max(1, Math.ceil(Number(retryMatch[1])))) : '60';

      if (isQuotaUnavailable) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gemini quota is unavailable for this API key/project. Enable Gemini API billing/quota or use another key.',
            ...(isDev ? { detail: message } : {}),
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Gemini API rate limit reached. Please wait ${retryAfter} seconds and try again.`,
          ...(isDev ? { detail: message } : {}),
        },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter },
        }
      );
    }

    const isParseOrShapeError =
      lower.includes('parse') ||
      lower.includes('structured nutrition data') ||
      lower.includes('invalid response structure');

    if (isParseOrShapeError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI response was malformed. Please try a clearer meal photo.',
          ...(isDev ? { detail: message } : {}),
        },
        { status: 502 }
      );
    }

    console.error('[food-recognize] Error:', message);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze food image. Please try again.',
        ...(isDev ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
