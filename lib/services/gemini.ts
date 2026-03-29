import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Gemini AI Service
 * Wrapper for Google Gemini Flash models — food image recognition
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const PRIMARY_MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
export const FALLBACK_MODELS = [
  PRIMARY_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
].filter((model, index, arr) => arr.indexOf(model) === index);

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Food recognition will not work.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const FOOD_RECOGNITION_PROMPT = `Analyze this food image. Identify all visible food items and estimate the total nutritional content for the entire meal.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation, no code fences:
{
  "food_name": "<short descriptive name for the overall meal>",
  "calories": <estimated total calories as integer>,
  "protein": <estimated grams of protein as integer>,
  "carbs": <estimated grams of carbs as integer>,
  "fat": <estimated grams of fat as integer>,
  "items": ["<item 1>", "<item 2>"],
  "confidence": "<high|medium|low>"
}

Guidelines:
- Estimate portion sizes based on visual cues (plate size, relative proportions).
- If multiple food items are visible, sum their estimated nutritional values.
- Use "high" confidence if food is clearly identifiable, "medium" if partially obscured, "low" if uncertain.
- If the image does not contain food, return: {"error": "No food detected in image"}`;

export interface FoodRecognitionResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface FoodRecognitionError {
  error: string;
}

type GeminiResponse = FoodRecognitionResult | FoodRecognitionError;

function extractLikelyJson(text: string): string {
  const trimmed = text.trim();

  // Fast path: already a valid JSON object string
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // Gemini occasionally wraps JSON with prose/code fences.
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Analyze a food image using configured Gemini Flash model
 * @param base64Image - Base64-encoded image string (without data URI prefix)
 * @param mimeType - Image MIME type (image/jpeg, image/png, image/webp)
 * @returns Structured food recognition result
 */
export async function analyzeFoodImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<FoodRecognitionResult> {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Set GEMINI_API_KEY environment variable.');
  }

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  let text = '';
  let lastError: unknown = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent structured output
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent([FOOD_RECOGNITION_PROMPT, imagePart]);
      text = result.response.text().trim();
      break;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message.toLowerCase() : '';
      const isModelMissing =
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('is not supported for generatecontent');

      if (!isModelMissing) {
        throw error;
      }
    }
  }

  if (!text) {
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('Unable to generate response from Gemini model');
  }

  // Strip markdown code fences if Gemini wraps the response
  const noCodeFences = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const cleaned = extractLikelyJson(noCodeFences);

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse Gemini response as JSON');
  }

  // Check if Gemini returned an error (e.g., no food detected)
  if ('error' in parsed) {
    throw new Error(parsed.error);
  }

  // Validate required fields with tolerant coercion.
  const data = parsed as Partial<FoodRecognitionResult> & Record<string, unknown>;
  const foodName = typeof data.food_name === 'string' ? data.food_name.trim() : '';
  const calories = toNumber(data.calories);
  const protein = toNumber(data.protein);
  const carbs = toNumber(data.carbs);
  const fat = toNumber(data.fat);

  let items: string[] = [];
  const rawItems: unknown = data.items;
  if (Array.isArray(rawItems)) {
    items = rawItems.map(String).map(i => i.trim()).filter(Boolean);
  } else if (typeof rawItems === 'string') {
    items = rawItems.split(',').map(i => i.trim()).filter(Boolean);
  }

  if (!foodName || calories === null || protein === null || carbs === null || fat === null || items.length === 0) {
    throw new Error('Could not extract structured nutrition data from model response');
  }

  const rawConfidence = typeof data.confidence === 'string' ? data.confidence.toLowerCase() : 'medium';
  const confidence: FoodRecognitionResult['confidence'] =
    rawConfidence === 'high' || rawConfidence === 'medium' || rawConfidence === 'low'
      ? rawConfidence
      : 'medium';

  return {
    food_name: foodName,
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    items,
    confidence,
  };
}

/**
 * Generate text content using Gemini with automatic model fallback
 * @param prompt - The text prompt to send to Gemini
 * @param options - Optional configuration (temperature, tokens, etc.)
 * @returns Generated text response
 */
export async function generateTextContent(
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  }
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Set GEMINI_API_KEY environment variable.');
  }

  let lastError: unknown = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 4096,
          ...(options?.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
        },
      });

      const result = await model.generateContent(prompt);
      if (process.env.NODE_ENV === 'development') {
        console.info(`[Gemini] generateTextContent succeeded with model: ${modelName}`);
      }
      return result.response.text();
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message.toLowerCase() : '';
      const isModelMissing =
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('could not download') ||
        msg.includes('unable to find');

      // If model not found, try next fallback
      if (isModelMissing) {
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // All models failed
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('All Gemini models failed to respond');
}
