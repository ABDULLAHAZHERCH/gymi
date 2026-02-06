# FastAPI WebSocket Integration Guide for Gymi

## Backend Architecture Overview

Your FastAPI backend provides real-time exercise form correction via WebSocket. Here's what it does:

### WebSocket Endpoint
- **URL:** `wss://exercise-form-backend.onrender.com/api/ws/pose/{client_id}`
- **Protocol:** JSON-based messaging
- **Connection:** One connection per user/session
- **Real-time:** Processes pose landmarks frame-by-frame

### Message Flow

**Client → Server:**
```json
{
  "landmarks": [
    {"x": 0.5, "y": 0.3, "z": -0.1, "visibility": 0.99},
    // ... 33 landmarks total (MediaPipe format)
  ],
  "timestamp": 1234567890.123
}
```

**Server → Client:**
```json
{
  "state": "active",
  "current_exercise": "bicep_curl",
  "exercise_display": "Bicep Curl",
  "rep_count": 5,
  "rep_phase": "up",
  "is_rep_valid": true,
  "violations": [],
  "corrections": [],
  "correction_message": "Good form! Keep it up!",
  "joint_colors": {
    "left_elbow": "green",
    "right_elbow": "green"
  },
  "confidence": 0.95,
  "timestamp": 1234567890.123
}
```

### Supported Exercises
- ✅ Squat (rep counting + form checks)
- ✅ Push-up (form analysis)
- ✅ Bicep Curl (standing/seated)
- ✅ Alternate Bicep Curl

### Form Feedback
The backend analyzes:
- **Rep counting** with hysteresis (stable counting)
- **Form violations** (knee valgus, elbow flare, depth issues)
- **Joint angle analysis** with color-coded feedback
- **Confidence scoring** for exercise detection

---

## Integration Steps for Next.js

### 1. Create WebSocket Service Hook

**File:** `lib/hooks/usePoseWebSocket.ts`

```typescript
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FormCorrectionResponse {
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

interface UsePoseWebSocketOptions {
  serverUrl?: string;
  clientId?: string;
  enabled?: boolean;
  onMessage?: (response: FormCorrectionResponse) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function usePoseWebSocket(options: UsePoseWebSocketOptions = {}) {
  const {
    serverUrl = process.env.NEXT_PUBLIC_FORM_COACH_URL || 'wss://exercise-form-backend.onrender.com',
    clientId = `gymi-${Date.now()}`,
    enabled = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<FormCorrectionResponse | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || wsRef.current) return;

    try {
      const wsUrl = `${serverUrl}/api/ws/pose/${clientId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const response: FormCorrectionResponse = JSON.parse(event.data);
          setLastResponse(response);
          onMessage?.(response);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        const wsError = new Error('WebSocket connection error');
        onError?.(wsError);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          setTimeout(() => connect(), backoffMs);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      onError?.(error as Error);
    }
  }, [enabled, serverUrl, clientId, onMessage, onError, onConnect, onDisconnect]);

  // Send landmarks to server
  const sendLandmarks = useCallback((landmarks: PoseLandmark[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          landmarks,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to send landmarks:', error);
    }
  }, []);

  // Reset session on server
  const resetSession = useCallback(async () => {
    try {
      const response = await fetch(
        `${serverUrl}/reset/${clientId}`,
        { method: 'POST' }
      );
      const data = await response.json();
      console.log('Session reset:', data);
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }, [serverUrl, clientId]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    sendLandmarks,
    lastResponse,
    resetSession,
    clientId,
  };
}
```

---

### 2. Integrate with Coach Page

**File:** `app/(app)/coach/page.tsx`

Update your existing coach page to use the WebSocket hook:

```typescript
'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import CameraView from '@/components/features/CameraView';
import PoseCanvas from '@/components/features/PoseCanvas';
import FormFeedbackCard from '@/components/features/FormFeedbackCard';
import { usePoseWebSocket, type FormCorrectionResponse } from '@/lib/hooks/usePoseWebSocket';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/hooks/useToast';

export default function CoachPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState<FormCorrectionResponse | null>(null);
  const [exerciseMode, setExerciseMode] = useState<'live' | 'upload'>('live');

  // Initialize WebSocket connection (only if user is logged in)
  const { isConnected, sendLandmarks, lastResponse, resetSession } = usePoseWebSocket({
    clientId: user?.uid || `guest-${Date.now()}`,
    enabled: isStreaming,
    onMessage: (response) => {
      setFeedback(response);
    },
    onConnect: () => {
      showToast('Connected to form analysis', 'success');
    },
    onError: (error) => {
      showToast(`Connection error: ${error.message}`, 'error');
    },
    onDisconnect: () => {
      showToast('Disconnected from form analysis', 'warning');
    },
  });

  // Handle pose detection (receives from CameraView or video processor)
  const handlePoseDetected = useCallback((landmarks: Array<{x: number; y: number; z: number; visibility: number}>) => {
    if (isConnected) {
      sendLandmarks(landmarks);
    }

    // Also draw on canvas for visualization
    if (canvasRef.current && videoRef.current) {
      drawPoseCanvas(canvasRef.current, videoRef.current, landmarks, feedback?.joint_colors || {});
    }
  }, [isConnected, sendLandmarks, feedback?.joint_colors]);

  const handleStartSession = () => {
    setIsStreaming(true);
    showToast('Starting form analysis...', 'info');
  };

  const handleStopSession = () => {
    setIsStreaming(false);
    setFeedback(null);
    showToast('Form analysis stopped', 'info');
  };

  const handleReset = async () => {
    await resetSession();
    setFeedback(null);
    showToast('Session reset', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            AI Form Coach
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Real-time exercise form analysis with instant feedback
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setExerciseMode('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              exerciseMode === 'live'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            📹 Live Camera
          </button>
          <button
            onClick={() => setExerciseMode('upload')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              exerciseMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            📁 Upload Video
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
              {exerciseMode === 'live' ? (
                <CameraView
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isStreaming={isStreaming}
                  onPoseDetected={handlePoseDetected}
                  onStart={handleStartSession}
                  onStop={handleStopSession}
                />
              ) : (
                <VideoUpload
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isStreaming={isStreaming}
                  onPoseDetected={handlePoseDetected}
                  onStart={handleStartSession}
                  onStop={handleStopSession}
                />
              )}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="lg:col-span-1">
            {feedback ? (
              <>
                <FormFeedbackCard feedback={feedback} />
                <button
                  onClick={handleReset}
                  className="w-full mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  🔄 Reset
                </button>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  {isStreaming ? 'Waiting for pose detection...' : 'Start a session to see feedback'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-6 flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-slate-600 dark:text-slate-400">
            {isConnected ? 'Connected to form analysis' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function for drawing pose on canvas
function drawPoseCanvas(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: Array<{x: number; y: number; z: number; visibility: number}>,
  jointColors: Record<string, string>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw video frame
  ctx.drawImage(video, 0, 0);

  // Draw skeleton (simplified - connect major joints)
  const connections = [
    [11, 13, 15], // right arm
    [12, 14, 16], // left arm
    [11, 23, 25, 27], // right leg
    [12, 24, 26, 28], // left leg
  ];

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  connections.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) {
      const from = landmarks[chain[i]];
      const to = landmarks[chain[i + 1]];
      if (from && to && from.visibility > 0.5 && to.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
        ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
        ctx.stroke();
      }
    }
  });

  // Draw joints with colors
  landmarks.forEach((landmark, index) => {
    if (landmark.visibility > 0.5) {
      const color = jointColors[`landmark_${index}`] || '#00ff00';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
```

---

### 3. Environment Configuration

**File:** `.env.local`

```env
# Form Coach Backend
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com

# For local development
# NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
```

---

### 4. Update Package.json (if needed)

Your existing dependencies should work. The WebSocket API is built into modern browsers. If you need additional support:

```bash
npm install ws  # If using Server-Side WebSocket support
npm install browser-env  # If using isomorphic code
```

---

## Data Flow Diagram

```
┌──────────────────────┐
│   Next.js Frontend   │
│    (Gymi Coach)      │
└──────────┬───────────┘
           │
           │ 1. Camera Stream / Video Upload
           │    (MediaPipe Pose Landmarking)
           ↓
┌──────────────────────┐
│  CameraView / Video  │
│   Processor (Local)  │
│  Extracts 33 Points  │
└──────────┬───────────┘
           │
           │ 2. Send Landmarks via WebSocket
           │    {"landmarks": [...], "timestamp": ...}
           ↓
┌──────────────────────────────┐
│   FastAPI Backend            │
│  (exercise-form-correction)  │
│                              │
│  ├─ FormManager (State)      │
│  ├─ ExerciseClassifier       │
│  ├─ Squat / PushUp / etc.    │
│  └─ Rep Counter + Validator  │
└──────────┬───────────────────┘
           │
           │ 3. Receive Feedback Response
           │    FormCorrectionResponse
           │    (reps, violations, colors)
           ↓
┌──────────────────────┐
│  FormFeedbackCard    │
│  PoseCanvas (Visual) │
│  Exercise Display    │
└──────────────────────┘
```

---

## Key Integration Points

### 1. **MediaPipe Integration (Client-Side)**
The landmarks come from MediaPipe (already in your coach page):
```typescript
// This is the 33-point pose from MediaPipe
const landmarks = poseData.landmarks.map(l => ({
  x: l.x,
  y: l.y,
  z: l.z,
  visibility: l.visibility
}));

// Send to backend
sendLandmarks(landmarks);
```

### 2. **Real-Time Feedback Display**
The response from backend contains all you need:
```typescript
{
  rep_count: 5,
  violations: ["knee valgus", "depth too shallow"],
  correction_message: "Lower your hips more",
  joint_colors: {"left_knee": "red", "right_knee": "yellow"},
  confidence: 0.95
}
```

### 3. **Error Handling & Reconnection**
The hook automatically:
- Reconnects on disconnect (with exponential backoff)
- Handles message parsing errors
- Manages connection state

### 4. **Session Management**
- Each user gets unique `clientId` (user.uid in Gymi)
- Server maintains separate state per client
- Reset endpoint clears session state

---

## Testing the Integration

### 1. **Local Testing**
```bash
# Terminal 1: Start backend
cd /path/to/exercise-form-correction/backend
python -m venv venv
source venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Gymi frontend
npm run dev

# Update .env.local:
# NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
```

### 2. **Test WebSocket Connection**
Open browser console:
```javascript
// Should see "✅ WebSocket connected"
// Check Network tab → WS tab for message flow
```

### 3. **Test Feedback Loop**
1. Start live camera or upload video
2. Perform exercise (e.g., squats)
3. Should see real-time feedback:
   - Rep count increments
   - Form corrections appear
   - Joints change colors (green/yellow/red)

---

## Production Deployment

### Backend (Already Deployed)
- **URL:** `wss://exercise-form-backend.onrender.com`
- Backend is managed by your team at Shahmir's repo

### Frontend (Gymi on Vercel)
Update environment variable in Vercel dashboard:
```
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
```

---

## Common Issues & Solutions

### Issue: WebSocket Connection Fails
**Solution:**
- Check backend is running: `curl https://exercise-form-backend.onrender.com/health`
- Verify CORS headers from backend (should be configured)
- Check browser console for connection errors

### Issue: Landmarks Not Being Processed
**Solution:**
- Ensure CameraView is detecting poses (check MediaPipe output)
- Verify landmarks array has 33 items with valid x, y, z values
- Check WebSocket message is being sent (Network tab)

### Issue: Feedback Delayed
**Solution:**
- Normal latency: 50-200ms for WebSocket round-trip
- Backend processes ~30fps (33ms per frame)
- Network speed affects total latency

### Issue: Session State Not Persisting
**Solution:**
- Backend uses in-memory managers (cleared on server restart)
- For persistence, add database (already has Supabase support)
- Check `client_id` is consistent across requests

---

## Extending the Integration

### Add New Exercise Support
The backend is pluggable. To add support for a new exercise (e.g., Lunge):

1. **Backend** (modify Shahmir's repo):
   ```python
   # backend/exercises/lunge.py
   class LungeModule(BaseExercise):
       # Implement form checks
       pass
   ```

2. **Frontend** (Gymi):
   ```typescript
   // Update exercise selector
   const supportedExercises = ['squat', 'pushup', 'bicep_curl', 'lunge'];
   ```

### Add Database Persistence
For workout history, add to Gymi:

```typescript
// After receiving feedback, save to Firestore
const saveWorkoutRep = async (rep: FormCorrectionResponse) => {
  await addDoc(collection(db, `users/${user.uid}/workouts`), {
    exercise: rep.current_exercise,
    repNumber: rep.rep_count,
    isValid: rep.is_rep_valid,
    violations: rep.violations,
    timestamp: new Date(rep.timestamp),
  });
};
```

---

## Summary

Your FastAPI backend is ready to integrate! The WebSocket provides:
- ✅ Real-time form feedback
- ✅ Exercise detection
- ✅ Rep counting
- ✅ Form violation detection
- ✅ Joint color feedback

Use the `usePoseWebSocket` hook to connect your Next.js frontend to the backend. The hook handles connection management, message parsing, and error handling automatically.

**Next Steps:**
1. Copy `usePoseWebSocket.ts` to your project
2. Update `coach/page.tsx` with WebSocket integration
3. Add `NEXT_PUBLIC_FORM_COACH_URL` to environment
4. Test with camera or video upload
5. Deploy to Vercel with production backend URL
