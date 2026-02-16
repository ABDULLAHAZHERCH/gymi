# Quick Integration Checklist for Next.js Frontend

## 🚀 Quick Start (5 minutes)

### 1. Environment Setup
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH=/models/pose_landmarker_lite.task
```

### 2. Create Configuration File
**File: `lib/config.ts`**
```typescript
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8000',
  },
  upload: {
    chunkSize: 5 * 1024 * 1024, // 5MB
  }
};
```

### 3. Copy Hooks from Main Guide
- `hooks/usePoseWebSocket.ts` - WebSocket connection
- `hooks/useChunkedVideoUpload.ts` - Upload functionality

### 4. Install MediaPipe
```bash
npm install @mediapipe/tasks-vision
```

---

## 🔌 WebSocket Connection

### Basic Usage
```typescript
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';

const { isConnected, sendLandmarks, connect, disconnect, latestResponse } 
  = usePoseWebSocket({
    url: 'ws://localhost:8000/api/ws/pose',
    onResponse: (response) => {
      console.log('Rep count:', response.rep_count);
      console.log('Feedback:', response.corrections);
    },
  });

// Connect when ready
<button onClick={connect}>Start Analysis</button>

// Send landmarks (33 landmarks from MediaPipe)
sendLandmarks(landmarks, timestamp);

// Disconnect
<button onClick={disconnect}>Stop</button>
```

### Response Structure
```typescript
interface FormCorrectionResponse {
  state: 'idle' | 'scanning' | 'active';
  current_exercise: 'SQUAT' | 'PUSHUP' | 'BICEP_CURL' | null;
  exercise_display: string;       // e.g., "Squat - Active"
  rep_count: number;              // e.g., 5
  rep_phase: string;              // 'up' | 'down' | 'idle' | 'static'
  is_rep_valid: boolean;
  violations: string[];           // Form issues
  corrections: string[];          // Suggestions
  correction_message: string;     // Primary feedback
  joint_colors: Record<string, string>; // For visualization
  confidence: number;             // 0-1
  timestamp: number;
}
```

---

## 📤 Video Upload

### Basic Usage
```typescript
import { useChunkedVideoUpload } from '@/hooks/useChunkedVideoUpload';

const { upload, progress, isUploading } = useChunkedVideoUpload({
  apiBaseUrl: 'http://localhost:8000',
  chunkSize: 5 * 1024 * 1024,
  onProgress: (p) => console.log(`${p.progress}%`),
  onComplete: (result) => console.log('File:', result.file_path),
});

// Upload file
const handleFileSelect = async (file: File) => {
  await upload(file);
};
```

### Upload Progress
```typescript
if (progress.status === 'uploading') {
  return <ProgressBar value={progress.progress} max={100} />;
}
```

---

## 📊 Landmark Data Structure

Each frame sends 33 landmarks (MediaPipe Pose):

```json
{
  "landmarks": [
    { "x": 0.45, "y": 0.32, "z": 0.1, "visibility": 0.95 },
    // ... 32 more landmarks
  ],
  "timestamp": 1645678901234
}
```

**Key Joints:**
- 11/12: Shoulders
- 13/14: Elbows
- 15/16: Wrists
- 23/24: Hips
- 25/26: Knees
- 27/28: Ankles

---

## 🎯 Exercise Detection

### Supported Exercises
1. **Squat** - Bodyweight or weighted
2. **Pushup** - Standard pushups
3. **Bicep Curl** - Dumbbell/barbell
4. **Idle** - No exercise detected

### Rep Phases
- `idle` - No movement
- `down` - Descending phase
- `up` - Ascending phase
- `static` - Holding position

---

## ✅ Validation & Feedback

### Form Feedback Example
```typescript
{
  "violations": [
    "Knees caving inward",
    "Heels lifting off ground"
  ],
  "corrections": [
    "Keep knees aligned with toes",
    "Keep weight in heels"
  ],
  "correction_message": "Keep knees aligned with toes",
  "is_rep_valid": false
}
```

### Display in UI
```tsx
{analysis?.correction_message && (
  <div className="bg-yellow-100 p-4 rounded">
    {analysis.correction_message}
  </div>
)}

{analysis?.violations && analysis.violations.length > 0 && (
  <div className="bg-red-100 p-4 rounded">
    {analysis.violations.map((v) => (
      <div key={v}>⚠️ {v}</div>
    ))}
  </div>
)}
```

---

## 🖼️ Skeleton Visualization

### Draw Joints with Colors
```typescript
function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  jointColors: Record<string, string>
) {
  // Typical color coding:
  // 🟢 Green (#22c55e) - Good form
  // 🔴 Red (#ef4444) - Poor form
  // 🟡 Yellow (#eab308) - Warning
  
  landmarks.forEach((landmark, i) => {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.fillStyle = jointColors[JOINT_NAMES[i]] || '#FF0000';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
```

---

## 🔗 API Endpoints Summary

### Upload Endpoints
```
POST /api/upload/init                    - Start upload
POST /api/upload/chunk/{id}              - Send chunk
GET  /api/upload/status/{id}             - Check progress
POST /api/upload/complete/{id}           - Finish upload
```

### WebSocket
```
WS /api/ws/pose/{client_id}              - Stream landmarks
```

### Utilities
```
POST /api/reset/{client_id}              - Reset session
GET  /api/health                         - Health check
```

---

## 🐛 Common Issues & Solutions

### "WebSocket is closed before connection is established"
- ✅ Ensure backend is running
- ✅ Check WebSocket URL format (ws://, not http://)
- ✅ Verify CORS configuration

### "No landmarks detected"
- ✅ Check MediaPipe model is loaded
- ✅ Ensure good lighting and camera angle
- ✅ Verify person is visible in frame

### "Upload chunk fails"
- ✅ Check network connection
- ✅ Reduce chunk size if needed
- ✅ Verify server storage space

### "Latency in form feedback"
- ✅ Reduce video resolution
- ✅ Lower landmarks sending frequency
- ✅ Check network ping

---

## 📝 Example: Complete Exercise Component

```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import { usePoseWebSocket } from '@/hooks/usePoseWebSocket';
import { config } from '@/lib/config';

export function ExerciseCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  const { isConnected, sendLandmarks, connect } = usePoseWebSocket({
    url: config.api.wsUrl + '/api/ws/pose',
    onResponse: (response) => {
      setRepCount(response.rep_count);
      setFeedback(response.correction_message);
    },
  });

  const startCapture = async () => {
    // 1. Connect WebSocket
    connect();

    // 2. Load MediaPipe
    const { FilesetResolver, PoseLandmarker } = await import(
      '@mediapipe/tasks-vision'
    );
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: config.pose.modelPath,
      },
      runningMode: 'VIDEO',
    });

    // 3. Get user camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // 4. Process frames
    const processFrame = () => {
      if (videoRef.current != null && isConnected) {
        const result = poseLandmarker.detectForVideo(videoRef.current, Date.now());
        
        if (result.landmarks && result.landmarks[0]) {
          const landmarks = result.landmarks[0].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          }));
          
          sendLandmarks(landmarks, Date.now());
        }
      }
      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
      />
      
      <div className="mt-4 space-y-4">
        <button
          onClick={startCapture}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Start Exercise
        </button>

        <div className="text-2xl font-bold">Reps: {repCount}</div>
        
        {feedback && (
          <div className="p-4 bg-yellow-100 rounded-lg">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎬 Using Uploaded Videos

1. **Upload video file** using chunked upload
2. **Get file path** from upload completion response
3. **Load video** in `<video>` element
4. **Process frames** with MediaPipe
5. **Send landmarks** via WebSocket
6. **Display feedback** from responses

```typescript
const filePath = `/uploads/${uploadId}.mp4`;
<video src={filePath} controls />
```

---

## 🔐 Security Considerations

- ✅ Validate file types on frontend & backend
- ✅ Set file size limits (max 5GB)
- ✅ Use HTTPS/WSS in production
- ✅ Implement request rate limiting
- ✅ Add user authentication if needed
- ✅ Validate all landmark data

---

## 📚 Additional Resources

- Full guide: `NEXTJS_INTEGRATION_GUIDE.md`
- MediaPipe: https://developers.google.com/mediapipe
- FastAPI WebSocket: https://fastapi.tiangolo.com/advanced/websockets
- Next.js: https://nextjs.org/docs

---

## 🆘 Need Help?

Check the full integration guide for:
- Detailed code examples
- Error handling strategies
- Performance optimization
- Troubleshooting guide
- Complete API reference

