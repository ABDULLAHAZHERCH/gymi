# FastAPI WebSocket Integration Setup Guide

## Quick Start

This guide shows how to integrate your FastAPI backend (exercise-form-correction) with Gymi's Next.js frontend.

---

## Step 1: Add the WebSocket Hook

Copy [`lib/hooks/usePoseWebSocket.ts`](lib/hooks/usePoseWebSocket.ts) to your project. This hook handles:
- WebSocket connection/disconnection
- Automatic reconnection with exponential backoff
- Message parsing and state management
- Sending landmarks to the backend
- Session reset

**Key exports:**
```typescript
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

function usePoseWebSocket(options: UsePoseWebSocketOptions): {
  isConnected: boolean;
  sendLandmarks: (landmarks: PoseLandmark[]) => void;
  lastResponse: FormCorrectionResponse | null;
  resetSession: () => Promise<void>;
  clientId: string;
}
```

---

## Step 2: Configure Environment Variables

Add to `.env.local`:

```env
# FastAPI Backend URL (WebSocket)
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com

# Or for local development:
# NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
```

**Why `NEXT_PUBLIC_`?**
- WebSocket URLs must be accessible from the browser
- Next.js cannot proxy WebSocket connections (they're client-only)
- `NEXT_PUBLIC_` prefix exposes the variable to the browser

---

## Step 3: Update Coach Page

Replace your current coach page with the WebSocket-integrated version (see [`page-websocket.tsx`](app/(app)/coach/page-websocket.tsx)):

```bash
mv app/(app)/coach/page.tsx app/(app)/coach/page-old.tsx
mv app/(app)/coach/page-websocket.tsx app/(app)/coach/page.tsx
```

Or manually update your existing page:

```typescript
'use client';

import { usePoseWebSocket, type FormCorrectionResponse } from '@/lib/hooks/usePoseWebSocket';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/lib/contexts/ToastContext';

export default function CoachPage() {
  const { user } = useAuth();
  const showToast = useToast();

  // Initialize WebSocket
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
  });

  // Send landmarks when pose is detected
  const handlePoseDetected = useCallback((landmarks) => {
    if (isConnected) {
      sendLandmarks(landmarks);
    }
  }, [isConnected, sendLandmarks]);

  // ... rest of component
}
```

---

## Step 4: Verify Backend is Running

**Production (Already Available):**
```bash
curl https://exercise-form-backend.onrender.com/health
# Expected response: {"status": "healthy", "connections": 0}
```

**Local Development:**
```bash
# Terminal 1: Backend
cd /path/to/exercise-form-correction
python -m venv venv
source venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Gymi Frontend
npm run dev

# Update .env.local:
# NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
```

---

## Step 5: Test the Integration

### Browser Console Test
Open `http://localhost:3000/coach` and run:

```javascript
// Check WebSocket is created
const ws = document.querySelector('[data-test="ws-status"]');
console.log('WS Connected:', ws?.textContent);

// Check Network tab for WebSocket connection
// Look for: GET /api/ws/pose/[client_id] → 101 Switching Protocols
```

### Full Flow Test
1. Open `/coach` in browser
2. Click "📹 Live Camera" or "📁 Upload Video"
3. Grant camera permissions (for live mode)
4. Start session (click play button)
5. Perform exercise (e.g., squats)
6. Should see:
   - ✅ Connection status: "Connected"
   - ✅ Exercise display: "Bicep Curl" (or detected exercise)
   - ✅ Rep count incrementing
   - ✅ Form feedback messages
   - ✅ Joint colors changing (green/yellow/red)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│        Gymi (Next.js Frontend)                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  Coach Page (app/(app)/coach/page.tsx) │    │
│  │  - CameraView / VideoUpload            │    │
│  │  - PoseCanvas (visualization)          │    │
│  │  - FormFeedbackCard (stats)            │    │
│  └────────────┬─────────────────────────┘    │
│               │                               │
│               │ Detects pose landmarks       │
│               │ (33-point MediaPipe format)  │
│               ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │  usePoseWebSocket Hook                  │    │
│  │  - Manages WebSocket connection        │    │
│  │  - Sends landmarks via JSON            │    │
│  │  - Receives FormCorrectionResponse    │    │
│  │  - Auto-reconnection with backoff      │    │
│  └────────────┬─────────────────────────┘    │
│               │                               │
└───────────────│───────────────────────────────┘
                │
                │ WebSocket (wss://)
                │ JSON messages
                │
┌───────────────▼───────────────────────────────┐
│  FastAPI Backend (Python)                     │
│  exercise-form-correction                     │
├───────────────────────────────────────────────┤
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │  WebSocket Endpoint                   │    │
│  │  /api/ws/pose/{client_id}            │    │
│  │  - Receives: landmarks + timestamp    │    │
│  │  - Sends: FormCorrectionResponse     │    │
│  └────────────┬─────────────────────────┘    │
│               │                               │
│               ▼                               │
│  ┌──────────────────────────────────────┐    │
│  │  FormManager (State Machine)          │    │
│  │  - Tracks session state               │    │
│  │  - Routes to exercise modules         │    │
│  │  - Counts reps (hysteresis)           │    │
│  └────────────┬─────────────────────────┘    │
│               │                               │
│               ▼                               │
│  ┌──────────────────────────────────────┐    │
│  │  Exercise Modules (Pluggable)        │    │
│  │  - Squat                             │    │
│  │  - PushUp                            │    │
│  │  - BicepCurl                         │    │
│  │  - AlternateCurl                     │    │
│  └────────────┬─────────────────────────┘    │
│               │                               │
│               ▼                               │
│  ┌──────────────────────────────────────┐    │
│  │  Form Analysis                        │    │
│  │  - Joint angle calculation            │    │
│  │  - Violation detection                │    │
│  │  - Correction suggestions             │    │
│  │  - Joint color feedback               │    │
│  └──────────────────────────────────────┘    │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Message Format Reference

### Client → Server
```json
{
  "landmarks": [
    {
      "x": 0.5,      // Normalized 0-1 (0=left, 1=right)
      "y": 0.3,      // Normalized 0-1 (0=top, 1=bottom)
      "z": -0.1,     // Depth (negative away from camera)
      "visibility": 0.99  // Confidence 0-1
    },
    // ... 33 landmarks total (MediaPipe format)
  ],
  "timestamp": 1707144000000  // Unix timestamp in ms
}
```

### Server → Client
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
  "correction_message": "Great form! Keep it up!",
  "joint_colors": {
    "landmark_11": "#00ff00",  // Shoulder - green (good)
    "landmark_13": "#ffff00",  // Elbow - yellow (warning)
    "landmark_15": "#ff0000"   // Wrist - red (bad form)
  },
  "confidence": 0.95,
  "timestamp": 1707144000000
}
```

### Joint Index Reference (MediaPipe 33-point)
```
0  - Nose
1-10  - Face
11-16 - Right arm + shoulder
12-17 - Left arm + shoulder
23-28 - Right leg + hip
24-29 - Left leg + hip
30-32 - Center body
```

---

## Troubleshooting

### Issue: WebSocket Connection Fails
```
Error: Failed to create WebSocket
```

**Solution:**
1. Check backend is running: `curl https://exercise-form-backend.onrender.com/health`
2. Verify `NEXT_PUBLIC_FORM_COACH_URL` is set correctly
3. Check browser console for CORS errors
4. For local development, ensure backend uses `--host 0.0.0.0`

### Issue: Messages Not Being Received
```
WebSocket connected but no feedback appearing
```

**Solution:**
1. Open DevTools → Network → WS tab
2. Check if WebSocket messages are being sent
3. Verify landmarks have 33 items with valid x, y, z
4. Check backend logs: `tail -f backend.log`

### Issue: Connection Drops Frequently
```
WebSocket disconnected
```

**Solution:**
1. Normal latency: 50-200ms per round-trip
2. Check network stability (run on local backend first)
3. Frontend auto-reconnects with exponential backoff
4. Check backend error logs for crashes

### Issue: Feedback Latency High
```
Several second delay between pose and feedback
```

**Solution:**
1. Expected: ~50-150ms WebSocket round-trip
2. Expected: ~33ms per frame processing (30fps)
3. Total latency: 100-200ms is normal
4. For faster feedback, ensure landmarks sent every frame

---

## Environment Configuration

### Development
```env
NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
```

**Start backend:**
```bash
cd exercise-form-correction/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production (Vercel)
```env
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
```

**Update in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com`
3. Redeploy

---

## Performance Optimization

### 1. Landmark Sending Frequency
Send landmarks every frame for real-time feedback:
```typescript
// In CameraView.tsx or video processor
const processFrame = () => {
  const landmarks = detectPose(frame);
  sendLandmarks(landmarks);  // Every frame (~30fps)
};
```

### 2. Canvas Rendering Optimization
Only redraw canvas when feedback changes:
```typescript
// Use useCallback with dependency on feedback
const handlePoseDetected = useCallback((landmarks) => {
  if (feedback?.joint_colors) {
    drawPoseOnCanvas(canvas, video, landmarks, feedback.joint_colors);
  }
}, [feedback?.joint_colors]);
```

### 3. Session Memory Management
Reset session after long sessions:
```typescript
// After 1 hour, reset to avoid memory leaks
useEffect(() => {
  if (isStreaming && sessionStats.duration > 3600) {
    resetSession();
  }
}, [sessionStats.duration, isStreaming, resetSession]);
```

---

## Backend Deployment Notes

Your FastAPI backend is already deployed on Render:
- **URL:** `https://exercise-form-backend.onrender.com`
- **WebSocket:** `wss://exercise-form-backend.onrender.com/api/ws/pose/{client_id}`
- **Health Check:** `https://exercise-form-backend.onrender.com/health`

The backend automatically:
- Detects exercise type from landmarks
- Counts reps with hysteresis (prevents flickering)
- Analyzes form violations
- Provides correction suggestions
- Colors joints (green/yellow/red) based on form quality

---

## Next Steps

1. ✅ Copy `usePoseWebSocket.ts` to `lib/hooks/`
2. ✅ Update `coach/page.tsx` with WebSocket integration
3. ✅ Add `NEXT_PUBLIC_FORM_COACH_URL` to `.env.local`
4. ✅ Test with `npm run dev`
5. ✅ Deploy to Vercel with production backend URL
6. 🔄 Monitor WebSocket connection in production
7. 🔄 Add database persistence for workout history (optional)

---

## Additional Resources

- **Backend Repository:** https://github.com/shahmir2004/exercise-form-correction
- **MediaPipe Pose:** https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
- **FastAPI WebSocket:** https://fastapi.tiangolo.com/advanced/websockets/
- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables

---

**Integration complete!** Your Gymi app now has real-time form correction. 🎉
