# React/Vite to Next.js Migration Guide

This guide explains how the current frontend works and how to adapt it for Next.js integration.

---

## Current Frontend Architecture (React/Vite)

### Current Structure
```
frontend/
├── src/
│   ├── App.tsx              ← Main component
│   ├── config.ts            ← Configuration
│   ├── components/
│   │   ├── VideoPlayer.tsx
│   │   ├── ExerciseDisplay.tsx
│   │   └── SkeletonOverlay.tsx
│   ├── hooks/
│   │   ├── usePoseStream.ts      ← WebSocket hook
│   │   ├── useChunkedUpload.ts   ← Upload hook
│   │   └── useVideoProcessor.ts  ← Video processing
│   └── pose/
│       ├── PoseDetector.ts       ← MediaPipe integration
│       └── MotionBuffer.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### How It Works (Current Implementation)

```typescript
// 1. Video Processor detects pose landmarks
useVideoProcessor({
  onPoseResult: (result) => setCurrentLandmarks(result.landmarks)
})

// 2. WebSocket connection sends landmarks
usePoseStream({
  autoConnect: false,
  onResponse: (response) => setFormResponse(response)
})

// 3. Effect manages connection based on video processing state
useEffect(() => {
  if (isProcessing && !isConnected) {
    connect();  // Connect when video playback starts
  }
}, [isProcessing, isConnected, connect]);

// 4. Another effect sends landmarks to backend
useEffect(() => {
  if (currentLandmarks && isConnected && isProcessing) {
    sendLandmarks(currentLandmarks, performance.now());
  }
}, [currentLandmarks, isConnected, isProcessing, sendLandmarks]);

// 5. Display updates from WebSocket responses
<ExerciseDisplay formResponse={formResponse} />
```

---

## Key Differences: React/Vite vs Next.js

| Aspect | React/Vite | Next.js |
|--------|-----------|---------|
| **File Structure** | Traditional React | App Router (App/) or Pages Router |
| **Client/Server** | All client-side | SSR + Client components |
| **Component Syntax** | useState, useEffect | "use client" directive needed |
| **Import Paths** | Relative imports | @/ alias preferred |
| **Environment Variables** | VITE_* prefix | NEXT_PUBLIC_* prefix |
| **API Routes** | External (separate backend) | Can use route handlers (optional) |
| **Deployment** | Vercel (static) | Vercel (with serverless functions) |

---

## Step-by-Step Next.js Migration

### Step 1: Project Setup

```bash
npx create-next-app@latest exercise-analyzer --typescript --tailwind
cd exercise-analyzer

# Install dependencies
npm install @mediapipe/tasks-vision
```

### Step 2: Organize Folder Structure

```
app/
├── layout.tsx              ← Root layout
├── page.tsx                ← Home page
├── exercise/
│   └── page.tsx           ← Exercise analysis page
├── upload/
│   └── page.tsx           ← Video upload page
│
lib/
├── config.ts              ← Configuration (same as current)
├── mediapipe.ts           ← MediaPipe utilities
│
hooks/
├── usePoseWebSocket.ts    ← WebSocket (paste from guide)
├── useChunkedVideoUpload.ts ← Upload (paste from guide)
├── usePoseProcessor.ts    ← NEW: Extract from current useVideoProcessor
│
components/
├── VideoPlayer.tsx        ← Adapt from current
├── ExerciseDisplay.tsx    ← Adapt from current
├── SkeletonOverlay.tsx    ← Adapt from current
│
public/
└── models/
    └── pose_landmarker_lite.task
```

### Step 3: Convert App.tsx to page.tsx

**Current (React/Vite):**
```typescript
// App.tsx
import { useState, useEffect } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { usePoseStream } from './hooks/usePoseStream';

function App() {
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  
  const { isConnected, sendLandmarks, connect } = usePoseStream({
    autoConnect: false,
  });
  
  useEffect(() => {
    if (isProcessing && !isConnected) {
      connect();
    }
  }, [isProcessing, isConnected, connect]);
  
  return <VideoPlayer ... />;
}

export default App;
```

**Converted (Next.js):**
```typescript
// app/exercise/page.tsx
'use client';  // ← IMPORTANT: Must be client component

import { useState, useEffect } from 'react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { config } from '@/lib/config';

export default function ExercisePage() {
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  
  const wsUrl = config.api.wsUrl + '/api/ws/pose';
  const { isConnected, sendLandmarks, connect } = usePoseWebSocket({
    url: wsUrl,
    autoConnect: false,
  });
  
  useEffect(() => {
    if (isProcessing && !isConnected) {
      connect();
    }
  }, [isProcessing, isConnected, connect]);
  
  return <VideoPlayer ... />;
}
```

**Key Differences:**
- ✅ Add `'use client'` at top
- ✅ Export as `export default function` (not `function App`)
- ✅ Use `@/` alias for imports
- ✅ Use same hooks as before

### Step 4: Convert Hooks (Minimal Changes Required)

**Current (React/Vite) - usePoseStream.ts:**
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../config';

export function usePoseStream(options: UsePoseStreamOptions = {}): UsePoseStreamReturn {
  // Implementation
}
```

**Converted (Next.js) - hooks/usePoseWebSocket.ts:**
```typescript
'use client';  // ← Add this

import { useState, useEffect, useRef, useCallback } from 'react';

// Config url should be passed in, not imported from config
export function usePoseWebSocket(options: UsePoseWebSocketOptions): ... {
  // Same implementation
}
```

**Why the change?**
- Next.js prefers props over hardcoded imports for better testability
- Makes hook reusable across different components with different configs

### Step 5: Create Root Layout

**app/layout.tsx:**
```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Exercise Form Analyzer',
  description: 'Real-time exercise form correction',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Step 6: Create Pages

**app/page.tsx (Home):**
```typescript
'use client';

import Link from 'next/link';
import { Activity, Upload, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Exercise Form Analyzer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Video Card */}
          <Link href="/upload" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <Upload className="w-12 h-12 text-blue-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Upload Video</h2>
              <p className="text-gray-400">Upload a video file for analysis</p>
            </div>
          </Link>

          {/* Live Analysis Card */}
          <Link href="/exercise" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <Activity className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Live Analysis</h2>
              <p className="text-gray-400">Real-time exercise form correction</p>
            </div>
          </Link>

          {/* Stats Card */}
          <Link href="/stats" className="group">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <BarChart3 className="w-12 h-12 text-purple-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Statistics</h2>
              <p className="text-gray-400">View your exercise history</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

**app/exercise/page.tsx:**
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { useChunkedVideoUpload } from '@/hooks/useChunkedVideoUpload';
import { config } from '@/lib/config';
import { loadMediaPipeTask, extractLandmarksFromPoseLandmarkerResult } from '@/lib/mediapipe';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ExerciseDisplay } from '@/components/ExerciseDisplay';

export default function ExercisePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [analysis, setAnalysis] = useState(null);

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
      setAnalysis(response);
    },
  });

  // Auto-connect/disconnect based on processing state
  useEffect(() => {
    if (isProcessing && !isConnected) {
      connect();
    } else if (!isProcessing && isConnected) {
      disconnect();
    }
  }, [isProcessing, isConnected, connect, disconnect]);

  // Send landmarks when available
  useEffect(() => {
    if (landmarks && isConnected && isProcessing) {
      sendLandmarks(landmarks, performance.now());
    }
  }, [landmarks, isConnected, isProcessing, sendLandmarks]);

  const startAnalysis = async () => {
    try {
      setIsProcessing(true);

      // Load MediaPipe
      const poseLandmarker = await loadMediaPipeTask(config.pose.modelPath);

      // Process video frames
      const processFrame = () => {
        if (!videoRef.current || !isProcessing) return;

        const result = poseLandmarker.detectForVideo(
          videoRef.current,
          performance.now()
        );

        const detectedLandmarks = extractLandmarksFromPoseLandmarkerResult(result);
        if (detectedLandmarks.length > 0) {
          setLandmarks(detectedLandmarks);
        }

        requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setIsProcessing(false);
    }
  };

  const stopAnalysis = () => {
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Exercise Analysis</h1>

        <VideoPlayer
          videoElement={videoRef.current}
          landmarks={landmarks}
          jointColors={analysis?.joint_colors}
        />

        <div className="mt-6 flex gap-4">
          <button
            onClick={startAnalysis}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-lg"
          >
            {isProcessing ? 'Analyzing...' : 'Start Analysis'}
          </button>

          {isProcessing && (
            <button
              onClick={stopAnalysis}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Stop
            </button>
          )}
        </div>

        {analysis && <ExerciseDisplay response={analysis} />}
      </div>
    </div>
  );
}
```

**app/upload/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useChunkedVideoUpload } from '@/hooks/useChunkedVideoUpload';
import { config } from '@/lib/config';
import { Upload } from 'lucide-react';

export default function UploadPage() {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const { upload, progress, isUploading } = useChunkedVideoUpload({
    apiBaseUrl: config.api.baseUrl,
    onComplete: (result) => {
      setUploadedFile(result.file_path);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('video/')) {
      upload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

        {/* Upload Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors"
        >
          {!isUploading && !uploadedFile && (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-medium mb-2">Drop your video here</p>
              <p className="text-gray-400 mb-4">or click to browse</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <label htmlFor="fileInput">
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer">
                  Browse Files
                </button>
              </label>
            </>
          )}

          {isUploading && (
            <>
              <p className="text-lg font-medium mb-4">Uploading...</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{progress.progress}%</p>
            </>
          )}

          {uploadedFile && (
            <>
              <p className="text-lg font-medium text-green-400 mb-4">Upload Complete!</p>
              <p className="text-gray-400 mb-4">{uploadedFile}</p>
              <a
                href={uploadedFile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                View Video
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Environment Configuration

**.env.local:**
```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# For production with SSL
# NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_BASE_URL=wss://api.yourdomain.com

# MediaPipe
NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH=/models/pose_landmarker_lite.task
```

**next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Component Adaptation

### VideoPlayer Component

**Current (React/Vite):**
```typescript
// components/VideoPlayer.tsx
export interface VideoPlayerProps {
  videoElement: HTMLVideoElement | null;
  // ...
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoElement,
  // ...
}) => {
  // Implementation
};
```

**Adapted (Next.js):**
```typescript
// components/VideoPlayer.tsx
'use client';

import React from 'react';

interface VideoPlayerProps {
  videoElement: HTMLVideoElement | null;
  // ... (same props)
}

export function VideoPlayer({ videoElement, ...props }: VideoPlayerProps) {
  // Implementation (mostly unchanged)
}
```

**Changes:**
- Add `'use client'` directive
- Use `function` instead of `const`
- Remove React.FC (optional in Next.js)

---

## Deployment

### Vercel Deployment (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Import project in Vercel
# https://vercel.com/new

# 3. Set environment variables in Vercel dashboard:
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_BASE_URL=wss://api.yourdomain.com

# 4. Deploy
# Automatic on push to main
```

### Docker Deployment (Alternative)

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000
      NEXT_PUBLIC_WS_BASE_URL: ws://backend:8000
    depends_on:
      - backend
  
  backend:
    build: .
    ports:
      - "8000:8000"
```

---

## Common Issues & Solutions

### Issue 1: WebSocket URL is wrong in production

**Problem:**
```
ws://localhost:8000 in browser after deployment
```

**Solution:**
```env
# .env.local (development)
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# Set in Vercel dashboard (production)
NEXT_PUBLIC_WS_BASE_URL=wss://api.yourproduction.com
```

### Issue 2: CORS errors

**Solution:** Backend is already configured with CORS. If still getting errors:

```python
# backend/main.py - update CORS settings
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourfrontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: MediaPipe model not loading

**Problem:**
```
404: /models/pose_landmarker_lite.task not found
```

**Solution:**
```bash
# Download model and place in public/models/
mkdir -p public/models
# Download from: https://storage.googleapis.com/mediapipe-assets/pose_landmarker_lite.task
# Save to: public/models/pose_landmarker_lite.task
```

### Issue 4: Hydration errors in Next.js

**Problem:**
```
Text content does not match between server and client
```

**Solution:** Ensure client components only render on client:
```typescript
'use client';

import { useEffect, useState } from 'react';

export function MyComponent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return <div>Content</div>;
}
```

---

## Performance Tips for Next.js

1. **Use Dynamic Imports for Heavy Libraries**
```typescript
import dynamic from 'next/dynamic';

const ExerciseAnalyzer = dynamic(() => import('@/components/ExerciseAnalyzer'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

2. **Optimize Images**
```typescript
import Image from 'next/image';

<Image
  src="/thumbnail.jpg"
  alt="Exercise"
  width={640}
  height={480}
  priority
/>
```

3. **Use React.memo for Video Player**
```typescript
export const VideoPlayer = React.memo(function VideoPlayer(props) {
  // Component
});
```

4. **Code Splitting**
```typescript
// pages are automatically code-split by Next.js
// /app/exercise/page.tsx is loaded only when needed
```

---

## Summary of Changes

| Item | React/Vite | Next.js |
|------|-----------|---------|
| **Entry Point** | src/main.tsx | app/layout.tsx + page.tsx |
| **Client Directive** | Not needed | `'use client'` required |
| **Imports** | Relative | @/ alias preferred |
| **Env Variables** | VITE_* | NEXT_PUBLIC_* |
| **Deployment** | Vercel (static) | Vercel (with functions) |
| **Hook Changes** | Minimal | Add config url as prop |
| **Component Syntax** | React.FC | function (preferred) |
| **Build** | vite build | npm run build |
| **Dev Server** | npm run dev | npm run dev |

---

## Migration Checklist

- [ ] Create Next.js project
- [ ] Install dependencies (@mediapipe/tasks-vision)
- [ ] Create lib/config.ts with API configuration
- [ ] Copy hooks from integration guide
  - [ ] usePoseWebSocket.ts (from guide, add 'use client')
  - [ ] useChunkedVideoUpload.ts (from guide, add 'use client')
- [ ] Copy MediaPipe utilities
- [ ] Create app/layout.tsx
- [ ] Create app/page.tsx (home)
- [ ] Create app/exercise/page.tsx
- [ ] Create app/upload/page.tsx
- [ ] Adapt components
  - [ ] VideoPlayer.tsx (add 'use client')
  - [ ] ExerciseDisplay.tsx (add 'use client')
  - [ ] SkeletonOverlay.tsx (add 'use client')
- [ ] Set up environment variables (.env.local)
- [ ] Download MediaPipe model to public/models/
- [ ] Test locally (npm run dev)
- [ ] Deploy to Vercel
- [ ] Set production environment variables
- [ ] Verify WebSocket connection (wss://)
- [ ] Test file uploads
- [ ] Monitor performance

