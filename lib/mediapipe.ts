'use client';

/**
 * MediaPipe Pose Landmarker service.
 *
 * Lazy-loads the @mediapipe/tasks-vision package and creates a PoseLandmarker
 * configured for real-time VIDEO mode. Provides helper to extract normalised
 * landmarks from the detection result.
 */

import type { PoseLandmark } from '@/lib/contracts/integration';

// Keep a singleton so we don't re-initialise on every component mount
let poseLandmarkerPromise: Promise<unknown> | null = null;

interface RawPoseLandmark {
  x?: number;
  y?: number;
  z?: number;
  visibility?: number;
}

interface PoseDetectionResult {
  landmarks?: RawPoseLandmark[][];
}

/**
 * Lazily creates (or returns the cached) PoseLandmarker instance.
 */
export async function getPoseLandmarker(modelPath: string) {
  if (poseLandmarkerPromise) return poseLandmarkerPromise;

  poseLandmarkerPromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import(
      '@mediapipe/tasks-vision'
    );

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'GPU', // fall back to CPU automatically
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });

    return landmarker;
  })();

  return poseLandmarkerPromise;
}

/**
 * Extract the first person's landmarks from a PoseLandmarker result.
 * Returns an array of 33 landmarks or an empty array if none detected.
 */
export function extractLandmarks(result: unknown): PoseLandmark[] {
  const landmarks = (result as PoseDetectionResult | null)?.landmarks;

  if (!landmarks || landmarks.length === 0) {
    return [];
  }

  return landmarks[0].map((lm) => ({
    x: Number.isFinite(lm.x) ? (lm.x as number) : 0,
    y: Number.isFinite(lm.y) ? (lm.y as number) : 0,
    z: Number.isFinite(lm.z) ? (lm.z as number) : 0,
    visibility: Number.isFinite(lm.visibility)
      ? (lm.visibility as number)
      : 1,
  }));
}

/**
 * Reset the singleton so a fresh landmarker can be created (e.g. on error).
 */
export function resetPoseLandmarker() {
  poseLandmarkerPromise = null;
}
