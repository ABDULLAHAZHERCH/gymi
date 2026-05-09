/**
 * Centralized configuration for the Exercise Form Correction backend integration.
 */

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_FORM_COACH_URL ||
  'http://localhost:8000';

// Derive WebSocket and HTTP base URLs from the single env var
function toWsUrl(url: string): string {
  return url
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, '');
}

function toHttpUrl(url: string): string {
  return url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/$/, '');
}

export const config = {
  api: {
    /** HTTP(S) base URL for REST calls */
    baseUrl: toHttpUrl(rawBaseUrl),
    /** WS(S) base URL for WebSocket connections */
    wsUrl: toWsUrl(rawBaseUrl),
    endpoints: {
      health: '/api/health',
      uploadInit: '/api/upload/init',
      uploadChunk: '/api/upload/chunk',
      uploadStatus: '/api/upload/status',
      uploadComplete: '/api/upload/complete',
      uploadCancel: '/api/upload',
      uploadFiles: '/api/upload/files',
      reset: '/api/reset',
      ws: {
        pose: '/api/ws/pose',
      },
    },
  },
  pose: {
    /** Path to MediaPipe Pose Landmarker model (served from public/) */
    modelPath:
      process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH ||
      '/models/pose_landmarker_lite.task',
  },
  upload: {
    /** Chunk size for video upload (5 MB) */
    chunkSize: 5 * 1024 * 1024,
    maxRetries: 3,
  },
} as const;
