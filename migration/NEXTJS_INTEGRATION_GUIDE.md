# Exercise Form Correction Backend Integration Guide
## For Next.js Frontend Implementation

This guide provides complete documentation for integrating the Exercise Form Correction Backend with a Next.js frontend application.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [WebSocket Connection](#websocket-connection)
5. [Data Formats](#data-formats)
6. [Implementation Steps](#implementation-steps)
7. [Code Examples](#code-examples)
8. [Error Handling](#error-handling)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

The Exercise Form Correction system is a real-time exercise analysis platform that:
- Detects exercise type from pose landmarks
- Validates exercise form in real-time
- Provides feedback on form corrections
- Counts exercise repetitions
- Supports video file uploads with chunked transfer

### Technology Stack
- **Backend**: FastAPI (Python)
- **WebSocket**: Real-time pose frame streaming
- **APIs**: REST for uploads, WebSocket for streaming
- **CORS**: Enabled for cross-origin requests

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Video Upload   │  │  Pose Detection │  │  WebSocket   │ │
│  │   (HTTP REST)   │  │   (MediaPipe)   │  │  (Real-time) │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
└───────────┼──────────────────────┼────────────────┼──────────┘
            │                      │                │
    ┌───────▼─────────┐    ┌──────▼───────┐  ┌────▼─────────┐
    │ /api/upload/*   │    │ MediaPipe    │  │ /api/ws/pose │
    │ (Chunked)       │    │ Landmarks    │  │ /{client_id} │
    └─────────────────┘    └──────┬───────┘  └────┬─────────┘
            │                      │                │
    ┌───────▼─────────────────────▼────────────────▼─────────┐
    │               FastAPI Backend Server                    │
    │  ┌──────────────────┐  ┌────────────────────────────┐   │
    │  │   Form Manager   │  │  Exercise State Machine    │   │
    │  │   (Rep Counter)  │  │  (Squat, Pushup, etc.)     │   │
    │  └──────────────────┘  └────────────────────────────┘   │
    │  ┌──────────────────────────────────────────────────┐   │
    │  │  Form Validation & Correction Engine             │   │
    │  │  (Joint angles, position, range of motion)       │   │
    │  └──────────────────────────────────────────────────┘   │
    └────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### REST Endpoints

#### 1. Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "connections": 5
}
```

#### 2. Initialize Upload Session
```
POST /api/upload/init
Content-Type: application/json

{
  "filename": "my_exercise.mp4",
  "total_size": 52428800,
  "total_chunks": 10,
  "file_hash": "abc123" // optional
}
```

**Response:**
```json
{
  "upload_id": "abc123def456",
  "chunk_size": 5242880
}
```

#### 3. Upload Chunk
```
POST /api/upload/chunk/{upload_id}?chunk_index={index}
Content-Type: multipart/form-data

chunk: <binary file chunk>
```

**Response:**
```json
{
  "chunk_index": 0,
  "uploaded_chunks": 1,
  "total_chunks": 10,
  "progress": 10.0
}
```

#### 4. Get Upload Status
```
GET /api/upload/status/{upload_id}
```

**Response:**
```json
{
  "upload_id": "abc123def456",
  "uploaded_chunks": [0, 1, 2],
  "total_chunks": 10,
  "progress": 30.0,
  "status": "in_progress"
}
```

#### 5. Complete Upload
```
POST /api/upload/complete/{upload_id}
```

**Response:**
```json
{
  "status": "complete",
  "filename": "my_exercise.mp4",
  "file_path": "/uploads/my_exercise_12345.mp4",
  "size": 52428800
}
```

#### 6. Reset Session
```
POST /api/reset/{client_id}
```

**Response:**
```json
{
  "status": "reset",
  "client_id": "client_123"
}
```

---

## WebSocket Connection

### Connection Details

**URL Pattern:**
```
ws://localhost:8000/api/ws/pose/{client_id}
wss://yourdomain.com/api/ws/pose/{client_id}  // Production
```

### WebSocket Message Format

#### Client → Server (Sends Landmarks)

```typescript
interface LandmarkMessage {
  landmarks: Array<{
    x: number;        // 0-1 (normalized to video width)
    y: number;        // 0-1 (normalized to video height)
    z: number;        // depth (0-1)
    visibility: number; // 0-1 (confidence)
  }>;
  timestamp: number;  // milliseconds from epoch
}
```

**Example:**
```json
{
  "landmarks": [
    {"x": 0.45, "y": 0.32, "z": 0.1, "visibility": 0.95},
    {"x": 0.48, "y": 0.28, "z": 0.11, "visibility": 0.94},
    // ... 33 total landmarks
  ],
  "timestamp": 1645678901234
}
```

#### Server → Client (Receives Form Correction)

```typescript
interface FormCorrectionResponse {
  state: 'idle' | 'scanning' | 'active';
  current_exercise: string | null;  // e.g., 'SQUAT', 'PUSHUP'
  exercise_display: string;         // e.g., 'Squat - Scanning'
  rep_count: number;                // e.g., 5
  rep_phase: string;                // e.g., 'down', 'up', 'idle'
  is_rep_valid: boolean;            // whether last rep had good form
  violations: string[];             // e.g., ['Knees too far forward']
  corrections: string[];            // e.g., ['Keep back straighter']
  correction_message: string;       // Primary correction for UI
  joint_colors: Record<string, string>;  // RGBA colors for skeleton
  confidence: number;               // 0-1 detection confidence
  timestamp: number;                // server timestamp
}
```

**Example:**
```json
{
  "state": "active",
  "current_exercise": "SQUAT",
  "exercise_display": "Squat - Active",
  "rep_count": 5,
  "rep_phase": "down",
  "is_rep_valid": true,
  "violations": [],
  "corrections": [],
  "correction_message": "Great form! Keep it up!",
  "joint_colors": {
    "left_shoulder": "#22c55e",
    "right_shoulder": "#22c55e",
    "left_hip": "#22c55e",
    "right_hip": "#22c55e"
  },
  "confidence": 0.92,
  "timestamp": 1645678901234
}
```

### Supported Exercises

- `SQUAT` - Bodyweight or weighted squats
- `PUSHUP` - Standard pushups
- `BICEP_CURL` - Dumbbell or barbell bicep curls
- `IDLE` - No exercise detected

### Rep Phases

- `idle` - No movement detected
- `up` - Ascending phase of movement
- `down` - Descending phase of movement
- `static` - Stationary hold

---

## Data Formats

### Pose Landmarks Structure

MediaPipe Pose provides 33 landmarks for human body detection:

```typescript
interface PoseLandmark {
  // Index  | Body Part
  // 0      | Nose
  // 1      | Left Eye Inner
  // 2      | Left Eye
  // 3      | Left Eye Outer
  // 4      | Right Eye Inner
  // 5      | Right Eye
  // 6      | Right Eye Outer
  // 7      | Left Ear
  // 8      | Right Ear
  // 9      | Mouth Left
  // 10     | Mouth Right
  // 11     | Left Shoulder
  // 12     | Right Shoulder
  // 13     | Left Elbow
  // 14     | Right Elbow
  // 15     | Left Wrist
  // 16     | Right Wrist
  // 17     | Left Pinky
  // 18     | Right Pinky
  // 19     | Left Index
  // 20     | Right Index
  // 21     | Left Thumb
  // 22     | Right Thumb
  // 23     | Left Hip
  // 24     | Right Hip
  // 25     | Left Knee
  // 26     | Right Knee
  // 27     | Left Ankle
  // 28     | Right Ankle
  // 29     | Left Heel
  // 30     | Right Heel
  // 31     | Left Foot Index
  // 32     | Right Foot Index
  
  x: number;        // 0-1 normalized coordinate
  y: number;        // 0-1 normalized coordinate
  z: number;        // relative depth
  visibility: number; // 0-1 detection confidence
}
```

---

## Implementation Steps

### Step 1: Environment Setup

Create `.env.local`:
```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # for development
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000     # for development

# Production
# NEXT_PUBLIC_API_BASE_URL=https://api.example.com
# NEXT_PUBLIC_WS_BASE_URL=wss://api.example.com

# MediaPipe Model (optional if using Google's CDN)
NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH=/models/pose_landmarker_lite.task
```

### Step 2: Create Configuration

Create `lib/config.ts`:
```typescript
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000',
    endpoints: {
      health: '/api/health',
      uploadInit: '/api/upload/init',
      uploadChunk: '/api/upload/chunk',
      uploadStatus: '/api/upload/status',
      uploadComplete: '/api/upload/complete',
      reset: '/api/reset',
      ws: {
        pose: '/api/ws/pose',
      }
    }
  },
  pose: {
    modelPath: process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH || '/models/pose_landmarker_lite.task',
  },
  upload: {
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxRetries: 3,
  }
};
```

### Step 3: Create WebSocket Hook

Create `hooks/usePoseWebSocket.ts`:

```typescript
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface FormCorrectionResponse {
  state: 'idle' | 'scanning' | 'active';
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  timestamp: number;
}

interface UsePoseWebSocketOptions {
  url: string;
  clientId?: string;
  autoConnect?: boolean;
  onResponse?: (response: FormCorrectionResponse) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function usePoseWebSocket(options: UsePoseWebSocketOptions) {
  const {
    url,
    clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    autoConnect = false,
    onResponse,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [latestResponse, setLatestResponse] = useState<FormCorrectionResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const mountedRef = useRef(true);
  const connectingRef = useRef(false);

  const callbacksRef = useRef({ onResponse, onError, onConnect, onDisconnect });
  
  useEffect(() => {
    callbacksRef.current = { onResponse, onError, onConnect, onDisconnect };
  }, [onResponse, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(() => {
    if (connectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    const wsUrl = `${url}/${clientId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }

      console.log('WebSocket connected');
      connectingRef.current = false;
      setIsConnected(true);
      setIsConnecting(false);
      callbacksRef.current.onConnect?.();

      // Send queued messages
      while (pendingMessagesRef.current.length > 0) {
        const msg = pendingMessagesRef.current.shift();
        if (msg) ws.send(msg);
      }
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;

      try {
        const response: FormCorrectionResponse = JSON.parse(event.data);
        setLatestResponse(response);
        callbacksRef.current.onResponse?.(response);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      const err = new Error('WebSocket error');
      setError(err);
      callbacksRef.current.onError?.(err);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;

      console.log('WebSocket disconnected');
      connectingRef.current = false;
      setIsConnected(false);
      setIsConnecting(false);
      callbacksRef.current.onDisconnect?.();
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [url, clientId]);

  const sendLandmarks = useCallback((landmarks: PoseLandmark[], timestamp: number) => {
    const message = JSON.stringify({
      landmarks: landmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility,
      })),
      timestamp,
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      pendingMessagesRef.current.push(message);
      if (pendingMessagesRef.current.length > 5) {
        pendingMessagesRef.current.shift();
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connectingRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!autoConnect) return;
    if (wsRef.current || connectingRef.current) return;

    const timer = setTimeout(() => {
      if (mountedRef.current && !wsRef.current && !connectingRef.current) {
        connect();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [autoConnect, connect]);

  return {
    isConnected,
    isConnecting,
    latestResponse,
    error,
    connect,
    disconnect,
    sendLandmarks,
  };
}
```

### Step 4: Create Chunked Upload Hook

Create `hooks/useChunkedVideoUpload.ts`:

```typescript
'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadProgress {
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  status: 'idle' | 'initializing' | 'uploading' | 'paused' | 'completing' | 'complete' | 'error';
  error?: string;
  uploadId?: string;
  filePath?: string;
}

interface UseChunkedVideoUploadOptions {
  apiBaseUrl: string;
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: { filename: string; file_path: string; size: number }) => void;
  onError?: (error: Error) => void;
}

export function useChunkedVideoUpload(options: UseChunkedVideoUploadOptions) {
  const {
    apiBaseUrl,
    chunkSize = 5 * 1024 * 1024,
    maxRetries = 3,
    onProgress,
    onComplete,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgress>({
    progress: 0,
    uploadedChunks: 0,
    totalChunks: 0,
    status: 'idle',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const uploadIdRef = useRef<string | null>(null);
  const isPausedRef = useRef(false);

  const updateProgress = useCallback((update: Partial<UploadProgress>) => {
    setProgress((prev) => {
      const newProgress = { ...prev, ...update };
      onProgress?.(newProgress);
      return newProgress;
    });
  }, [onProgress]);

  const uploadChunk = async (
    uploadId: string,
    chunk: Blob,
    chunkIndex: number,
    retries = 0
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk);

      const response = await fetch(
        `${apiBaseUrl}/api/upload/chunk/${uploadId}?chunk_index=${chunkIndex}`,
        {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }

      if (retries < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, retries)));
        return uploadChunk(uploadId, chunk, chunkIndex, retries + 1);
      }

      throw error;
    }
  };

  const upload = useCallback(async (file: File) => {
    abortControllerRef.current = new AbortController();
    isPausedRef.current = false;

    const totalChunks = Math.ceil(file.size / chunkSize);

    updateProgress({
      status: 'initializing',
      totalChunks,
      uploadedChunks: 0,
      progress: 0,
    });

    try {
      // Initialize upload
      const initResponse = await fetch(`${apiBaseUrl}/api/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          total_size: file.size,
          total_chunks: totalChunks,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!initResponse.ok) {
        throw new Error(`Failed to initialize upload: ${initResponse.statusText}`);
      }

      const { upload_id } = await initResponse.json();
      uploadIdRef.current = upload_id;

      updateProgress({
        status: 'uploading',
        uploadId: upload_id,
      });

      // Check for existing progress
      let uploadedChunks = new Set<number>();
      try {
        const statusResponse = await fetch(
          `${apiBaseUrl}/api/upload/status/${upload_id}`
        );
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          uploadedChunks = new Set(status.uploaded_chunks || []);
        }
      } catch {
        // Ignore
      }

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        if (isPausedRef.current) {
          updateProgress({ status: 'paused' });
          return;
        }

        if (uploadedChunks.has(i)) {
          updateProgress({
            uploadedChunks: uploadedChunks.size,
            progress: (uploadedChunks.size / totalChunks) * 100,
          });
          continue;
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(upload_id, chunk, i);
        uploadedChunks.add(i);

        const progressPercent = (uploadedChunks.size / totalChunks) * 100;
        updateProgress({
          uploadedChunks: uploadedChunks.size,
          progress: Math.round(progressPercent),
        });
      }

      // Complete upload
      updateProgress({ status: 'completing' });
      const completeResponse = await fetch(
        `${apiBaseUrl}/api/upload/complete/${upload_id}`,
        { method: 'POST', signal: abortControllerRef.current.signal }
      );

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const result = await completeResponse.json();

      updateProgress({
        status: 'complete',
        progress: 100,
        filePath: result.file_path,
      });

      onComplete?.(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      updateProgress({
        status: 'error',
        error: err.message,
      });
      onError?.(err);
    }
  }, [apiBaseUrl, chunkSize, updateProgress, onComplete, onError]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const resume = useCallback(async (file: File) => {
    isPausedRef.current = false;
    // Re-trigger upload from paused state
    await upload(file);
  }, [upload]);

  const cancel = useCallback(async () => {
    abortControllerRef.current?.abort();
    setProgress({
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      status: 'idle',
    });
  }, []);

  return {
    upload,
    pause,
    resume,
    cancel,
    progress,
    isUploading: progress.status === 'uploading',
  };
}
```

### Step 5: Create MediaPipe Service

Create `lib/mediapipe.ts`:

```typescript
export async function loadMediaPipeTask(modelPath: string) {
  const { FilesetResolver, PoseLandmarker } = await import(
    '@mediapipe/tasks-vision'
  );

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: modelPath,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  });

  return poseLandmarker;
}

export function extractLandmarksFromPoseLandmarkerResult(result: any) {
  if (!result.landmarks || result.landmarks.length === 0) {
    return [];
  }

  return result.landmarks[0].map((landmark: any) => ({
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  }));
}
```

### Step 6: Create Exercise Component

Create `components/ExerciseAnalyzer.tsx`:

```typescript
'use client';

import { useRef, useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { useChunkedVideoUpload } from '@/hooks/useChunkedVideoUpload';
import { loadMediaPipeTask, extractLandmarksFromPoseLandmarkerResult } from '@/lib/mediapipe';

interface FormCorrectionResponse {
  state: string;
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  timestamp: number;
}

interface ExerciseAnalyzerProps {
  videoUrl: string;
  onAnalysisUpdate?: (response: FormCorrectionResponse) => void;
}

export function ExerciseAnalyzer({ videoUrl, onAnalysisUpdate }: ExerciseAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FormCorrectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsUrl = config.api.wsUrl + config.api.endpoints.ws.pose;
  const {
    isConnected,
    sendLandmarks,
    connect,
    disconnect,
    latestResponse,
  } = usePoseWebSocket({
    url: wsUrl,
    onResponse: (response) => {
      setAnalysis(response);
      onAnalysisUpdate?.(response);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Initialize MediaPipe
  useEffect(() => {
    let poseLandmarker: any;

    async function initMediaPipe() {
      try {
        poseLandmarker = await loadMediaPipeTask(config.pose.modelPath);
        setIsInitialized(true);
      } catch (err) {
        setError(`Failed to initialize MediaPipe: ${(err as Error).message}`);
      }
    }

    initMediaPipe();

    return () => {
      if (poseLandmarker) {
        poseLandmarker.close();
      }
    };
  }, []);

  // Processing loop
  useEffect(() => {
    if (!videoRef.current || !isInitialized || !isAnalyzing) return;

    let animationFrameId: number;
    let poseLandmarker: any;

    async function processingLoop() {
      // Note: You need to store poseLandmarker from initialization
      // This is a simplified example
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const processFrame = async () => {
        try {
          // Detect pose
          const result = poseLandmarker.detectForVideo(
            video,
            performance.now()
          );

          const landmarks = extractLandmarksFromPoseLandmarkerResult(result);
          
          if (landmarks.length > 0 && isConnected) {
            sendLandmarks(landmarks, performance.now());
          }

          // Draw video and overlay
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Draw skeleton based on joint_colors from analysis
          if (analysis?.joint_colors) {
            drawSkeleton(ctx, landmarks, analysis.joint_colors);
          }

          animationFrameId = requestAnimationFrame(processFrame);
        } catch (err) {
          console.error('Processing error:', err);
        }
      };

      processFrame();
    }

    if (poseLandmarker) {
      processingLoop();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnalyzing, isInitialized, isConnected, sendLandmarks, analysis?.joint_colors]);

  const startAnalysis = async () => {
    if (!videoRef.current) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Set canvas dimensions
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      // Connect WebSocket
      connect();

      // Start video
      await videoRef.current.play();
    } catch (err) {
      setError((err as Error).message);
      setIsAnalyzing(false);
    }
  };

  const stopAnalysis = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsAnalyzing(false);
    disconnect();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto"
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
        />
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={startAnalysis}
            disabled={!isInitialized || isAnalyzing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg"
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>

          {isAnalyzing && (
            <button
              onClick={stopAnalysis}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Stop
            </button>
          )}
        </div>

        {analysis && (
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <p className="text-lg font-semibold">{analysis.exercise_display}</p>
            <p className="text-2xl font-bold text-green-400 mt-2">
              Reps: {analysis.rep_count}
            </p>
            {analysis.correction_message && (
              <p className="text-yellow-400 mt-2">{analysis.correction_message}</p>
            )}
            {analysis.violations.length > 0 && (
              <div className="mt-2 text-red-400">
                <p>Issues:</p>
                <ul className="list-disc list-inside">
                  {analysis.violations.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  jointColors: Record<string, string>
) {
  // Draw connections between joints
  const connections = [
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    [11, 23], [12, 24], // Shoulders to hips
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28], // Right leg
  ];

  connections.forEach(([start, end]) => {
    if (landmarks[start] && landmarks[end]) {
      const from = landmarks[start];
      const to = landmarks[end];

      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from.x * ctx.canvas.width, from.y * ctx.canvas.height);
      ctx.lineTo(to.x * ctx.canvas.width, to.y * ctx.canvas.height);
      ctx.stroke();
    }
  });

  // Draw landmarks
  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(
        landmark.x * ctx.canvas.width,
        landmark.y * ctx.canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  });
}
```

---

## Code Examples

### Example 1: Basic WebSocket Connection

```typescript
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { config } from '@/lib/config';

export function PoseDetector() {
  const wsUrl = config.api.wsUrl + '/api/ws/pose';
  
  const {
    isConnected,
    sendLandmarks,
    connect,
    disconnect,
    latestResponse,
  } = usePoseWebSocket({
    url: wsUrl,
    onResponse: (response) => {
      console.log('Rep count:', response.rep_count);
      console.log('Corrections:', response.corrections);
    },
    onError: (error) => {
      console.error('Connection error:', error);
    },
  });

  return (
    <div>
      <button onClick={connect}>
        {isConnected ? 'Connected' : 'Connect to Backend'}
      </button>
      
      {latestResponse && (
        <div>
          <p>Exercise: {latestResponse.exercise_display}</p>
          <p>Reps: {latestResponse.rep_count}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Video Upload

```typescript
import { useChunkedVideoUpload } from '@/hooks/useChunkedVideoUpload';
import { config } from '@/lib/config';

export function VideoUploader() {
  const { upload, progress, isUploading } = useChunkedVideoUpload({
    apiBaseUrl: config.api.baseUrl,
    onComplete: (result) => {
      console.log('Upload complete:', result.file_path);
    },
    onProgress: (p) => {
      console.log(`Progress: ${p.progress}%`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### Example 3: Real-time Form Validation

```typescript
import { useState } from 'react';
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { config } from '@/lib/config';

export function FormValidator() {
  const [feedback, setFeedback] = useState<string[]>([]);
  const [repCount, setRepCount] = useState(0);

  const { sendLandmarks, connect } = usePoseWebSocket({
    url: config.api.wsUrl + '/api/ws/pose',
    onResponse: (response) => {
      setRepCount(response.rep_count);
      setFeedback(response.corrections);
    },
  });

  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold">Reps: {repCount}</h2>
      
      {feedback.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500">
          <p className="font-bold">Feedback:</p>
          <ul>
            {feedback.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={connect}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Connect
      </button>
    </div>
  );
}
```

---

## Error Handling

### WebSocket Connection Errors

```typescript
const { error, isConnected } = usePoseWebSocket({
  url: wsUrl,
  onError: (error) => {
    if (error.message.includes('WebSocket')) {
      // Handle connection errors
      console.log('Connection failed, retrying...');
      // Implement exponential backoff retry logic
    }
  },
});

// Monitor connection status
if (!isConnected && wasConnected) {
  // Handle disconnection
  console.log('Connection lost');
  // Implement auto-reconnect logic
}
```

### Upload Errors

```typescript
const { upload, progress } = useChunkedVideoUpload({
  apiBaseUrl,
  maxRetries: 3,
  onError: (error) => {
    if (error.message.includes('Chunk')) {
      // Retry chunk upload
      console.log('Chunk failed, will retry automatically');
    }
    if (error.message.includes('initialize')) {
      // Handle initialization errors
      console.log('Upload session failed');
    }
  },
});

if (progress.status === 'error') {
  console.log('Error:', progress.error);
  // Provide user feedback and retry option
}
```

### Landmark Processing Errors

```typescript
try {
  const result = await poseLandmarker.detectForVideo(video, timestamp);
  const landmarks = extractLandmarksFromPoseLandmarkerResult(result);
  
  if (landmarks.length === 0) {
    console.warn('No landmark detected in frame');
    return;
  }

  if (landmarks.some(lm => lm.visibility < 0.5)) {
    console.warn('Low confidence landmarks detected');
  }

  sendLandmarks(landmarks, timestamp);
} catch (error) {
  console.error('Pose detection failed:', error);
}
```

---

## Configuration

### Environment Variables

```env
# Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# For production with SSL/TLS
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_BASE_URL=wss://api.yourdomain.com

# MediaPipe
NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH=/models/pose_landmarker_lite.task
```

### CORS Configuration (Backend)

The backend is pre-configured with CORS support. Default allowed origins:
- `*` (all origins - development)
- `http://localhost:3000`
- `http://localhost:5173`
- `https://exercise-form-correction.vercel.app`
- `https://*.vercel.app`

To add more origins, set the `CORS_ORIGINS` environment variable:
```bash
CORS_ORIGINS="http://localhost:3000,https://myapp.com"
```

### Upload Configuration

Default settings (configurable in backend):
- Chunk size: 5MB
- Max file size: 5GB
- Chunk directory: `./uploads/chunks`
- Upload directory: `./uploads`

---

## Troubleshooting

### WebSocket Connection Issues

**Problem**: "Connection Refused" error
```
Error: WebSocket is closed before the connection is established
```

**Solutions**:
1. Verify backend is running: `GET http://localhost:8000/api/health`
2. Check WebSocket URL format
3. Ensure CORS is properly configured
4. Check firewall/network settings

**Problem**: WebSocket keeps disconnecting
```
onclose event triggered frequently
```

**Solutions**:
1. Implement exponential backoff reconnection
2. Check browser console for specific errors
3. Verify client_id is stable (not changing on each connection attempt)
4. Check backend for resource limits

### Pose Detection Issues

**Problem**: "No landmarks detected"
- Ensure MediaPipe model is loaded correctly
- Check video quality and lighting
- Verify person is visible in frame
- Ensure camera/video permissions are granted

**Problem**: Low confidence landmarks
```
Visibility score < 0.5 for many joints
```

**Solutions**:
1. Improve lighting conditions
2. Ensure better camera angle
3. Move closer to camera
4. Check camera resolution and FPS

### Upload Issues

**Problem**: Chunk upload fails
```
Error: Chunk upload failed
```

**Solutions**:
1. Check chunk size setting (default 5MB)
2. Verify server storage space
3. Check network connection stability
4. Review server logs for permission issues

**Problem**: Upload times out
```
Timeout after X seconds
```

**Solutions**:
1. Reduce chunk size
2. Check network speed
3. Increase timeout value
4. Check server CPU/memory usage

### Performance Issues

**Problem**: High latency in WebSocket communication
- Reduce landmarks update frequency
- Compress landmark data if needed
- Check network latency with `ping`
- Monitor server resources

**Problem**: Video processing is choppy
- Reduce video resolution
- Lower processing frame rate
- Close other browser tabs
- Upgrade system specs

---

## API Response Reference

### Full FormCorrectionResponse Structure

```typescript
{
  // System state
  "state": "active",                    // idle|scanning|active
  
  // Exercise detection
  "current_exercise": "SQUAT",          // SQUAT|PUSHUP|BICEP_CURL|null
  "exercise_display": "Squat - Active",
  
  // Rep tracking
  "rep_count": 5,
  "rep_phase": "down",                  // idle|up|down|static
  "is_rep_valid": true,
  
  // Form feedback
  "violations": [                       // List of form violations detected
    "Knees caving inward",
    "Heels lifting off ground"
  ],
  "corrections": [                      // Suggested corrections
    "Keep knees aligned with toes",
    "Keep weight in heels"
  ],
  "correction_message": "Keep knees aligned with toes",  // Primary message
  
  // Visualization
  "joint_colors": {                     // Colors for skeleton visualization
    "left_shoulder": "#22c55e",         // green for good form
    "right_shoulder": "#22c55e",
    "left_hip": "#ef4444",              // red for poor form
    "right_hip": "#ef4444"
  },
  
  // Confidence
  "confidence": 0.92,                   // 0-1 detection confidence
  
  // Timing
  "timestamp": 1645678901234000
}
```

---

## Support & Resources

- **Backend Repository**: [exercise-form-correction](https://github.com/yourrepo/exercise-form-correction)
- **MediaPipe Documentation**: https://developers.google.com/mediapipe
- **FastAPI WebSocket**: https://fastapi.tiangolo.com/advanced/websockets/
- **Next.js Documentation**: https://nextjs.org/docs

