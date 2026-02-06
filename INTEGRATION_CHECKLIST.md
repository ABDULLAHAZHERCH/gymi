# Integration Checklist & Implementation Guide

## 📋 Complete Integration Checklist

### Phase 1: Preparation
- [ ] Review `BACKEND_INTEGRATION_SUMMARY.md` (overview)
- [ ] Understand the architecture (see diagram in summary)
- [ ] Check backend is running: `curl https://exercise-form-backend.onrender.com/health`

### Phase 2: File Setup
- [ ] Copy `lib/hooks/usePoseWebSocket.ts` (provided in INTEGRATION_GUIDE.md)
- [ ] Create `.env.local` file with `NEXT_PUBLIC_FORM_COACH_URL`
- [ ] Review `app/(app)/coach/page-websocket.tsx` (optional full rewrite)

### Phase 3: Environment Configuration
- [ ] Add to `.env.local`:
  ```env
  NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
  ```
- [ ] For local testing, use `ws://localhost:8000`
- [ ] Verify `NEXT_PUBLIC_` prefix is used (browser-accessible)

### Phase 4: Code Integration
- [ ] Import hook in coach page:
  ```typescript
  import { usePoseWebSocket } from '@/lib/hooks/usePoseWebSocket';
  ```
- [ ] Initialize WebSocket:
  ```typescript
  const { isConnected, sendLandmarks, lastResponse } = usePoseWebSocket({
    clientId: user?.uid,
    enabled: isStreaming,
    onMessage: (response) => setFeedback(response),
  });
  ```
- [ ] Send landmarks when pose detected:
  ```typescript
  const handlePoseDetected = (landmarks) => {
    sendLandmarks(landmarks);
  };
  ```
- [ ] Display feedback in UI

### Phase 5: Testing
- [ ] Test locally: `npm run dev` with `ws://localhost:8000`
- [ ] Test with production: `npm run dev` with `wss://exercise-form-backend.onrender.com`
- [ ] Check browser console for connection logs
- [ ] Verify Network tab shows WebSocket messages
- [ ] Perform exercises and verify feedback

### Phase 6: Deployment
- [ ] Build project: `npm run build` (should succeed)
- [ ] Commit and push to GitHub
- [ ] Verify Vercel deployment
- [ ] Add env var to Vercel dashboard:
  ```
  NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
  ```
- [ ] Redeploy on Vercel
- [ ] Test production URL

### Phase 7: Monitoring
- [ ] Monitor WebSocket connections in prod
- [ ] Check latency (should be 100-200ms)
- [ ] Monitor error logs
- [ ] Track session statistics

---

## 🔧 Implementation Code Examples

### Example 1: Minimal Integration
```typescript
'use client';

import { usePoseWebSocket } from '@/lib/hooks/usePoseWebSocket';

export default function CoachPage() {
  const [feedback, setFeedback] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Connect to backend
  const { isConnected, sendLandmarks } = usePoseWebSocket({
    clientId: 'user-123',
    enabled: isStreaming,
    onMessage: (response) => setFeedback(response),
  });

  // Send landmarks from camera
  const handlePoseDetected = (landmarks) => {
    if (isConnected) {
      sendLandmarks(landmarks);
    }
  };

  return (
    <div>
      <CameraView onPoseDetected={handlePoseDetected} />
      {feedback && (
        <div>
          <p>Exercise: {feedback.exercise_display}</p>
          <p>Reps: {feedback.rep_count}</p>
          <p>Feedback: {feedback.correction_message}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Full Integration with Stats
```typescript
'use client';

import { usePoseWebSocket } from '@/lib/hooks/usePoseWebSocket';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';

export default function CoachPage() {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [stats, setStats] = useState({
    totalReps: 0,
    validReps: 0,
    violations: [],
  });

  // Initialize WebSocket with user ID
  const { isConnected, sendLandmarks, lastResponse, resetSession } = usePoseWebSocket({
    clientId: user?.uid || `guest-${Date.now()}`,
    enabled: isStreaming,
    onMessage: (response) => {
      setFeedback(response);

      // Track statistics
      setStats((prev) => {
        const isNewRep = response.rep_count > prev.totalReps;
        return {
          totalReps: response.rep_count,
          validReps: prev.validReps + (isNewRep && response.is_rep_valid ? 1 : 0),
          violations: response.violations,
        };
      });
    },
    onConnect: () => console.log('✅ Connected'),
    onError: (error) => console.error('❌ Error:', error),
  });

  const handlePoseDetected = (landmarks) => {
    sendLandmarks(landmarks);
  };

  const handleReset = async () => {
    await resetSession();
    setFeedback(null);
    setStats({ totalReps: 0, validReps: 0, violations: [] });
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Video */}
      <CameraView
        isStreaming={isStreaming}
        onPoseDetected={handlePoseDetected}
        onStart={() => setIsStreaming(true)}
        onStop={() => setIsStreaming(false)}
      />

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4">
          <div className="text-xl font-bold">
            {feedback.exercise_display} - Rep {feedback.rep_count}
          </div>

          <div className="text-lg">
            {feedback.is_rep_valid ? '✅' : '⚠️'} {feedback.correction_message}
          </div>

          {feedback.violations.length > 0 && (
            <div className="text-red-600">
              Form Issues: {feedback.violations.join(', ')}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Reps</div>
              <div className="text-2xl font-bold">{stats.totalReps}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Valid Reps</div>
              <div className="text-2xl font-bold text-green-600">{stats.validReps}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-2xl font-bold">
                {stats.totalReps > 0
                  ? Math.round((stats.validReps / stats.totalReps) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Advanced with Database
```typescript
'use client';

import { usePoseWebSocket } from '@/lib/hooks/usePoseWebSocket';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/AuthProvider';

export default function CoachPage() {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionStart, setSessionStart] = useState(0);

  const { sendLandmarks, lastResponse } = usePoseWebSocket({
    clientId: user?.uid,
    enabled: isStreaming,
    onMessage: async (response) => {
      // Save each rep to Firestore
      if (response.current_exercise && response.rep_count > 0) {
        await addDoc(collection(db, `users/${user.uid}/workouts`), {
          exercise: response.current_exercise,
          exerciseDisplay: response.exercise_display,
          repNumber: response.rep_count,
          repPhase: response.rep_phase,
          isValid: response.is_rep_valid,
          violations: response.violations,
          corrections: response.corrections,
          confidenceScore: response.confidence,
          timestamp: new Date(response.timestamp),
          sessionStart: new Date(sessionStart),
        });
      }
    },
  });

  const handleStart = () => {
    setSessionStart(Date.now());
    setIsStreaming(true);
  };

  const handlePoseDetected = (landmarks) => {
    sendLandmarks(landmarks);
  };

  return (
    // Your UI
  );
}
```

---

## 📊 Testing Scenarios

### Scenario 1: Live Camera (Real-Time)
```
1. Open /coach
2. Select "📹 Live Camera"
3. Click Play button
4. Grant camera permission
5. Perform squat motion
6. Expected:
   - Rep count increments (0 → 1 → 2...)
   - Feedback updates in real-time
   - Joint colors show form quality
   - Violations/corrections appear
```

### Scenario 2: Upload Video (Pre-recorded)
```
1. Open /coach
2. Select "📁 Upload Video"
3. Upload workout video (mp4)
4. Click Start
5. Video plays with analysis overlay
6. Expected:
   - Same feedback as live camera
   - Pose displayed on canvas
   - Rep counting matches video length
```

### Scenario 3: Connection Loss & Recovery
```
1. Start streaming
2. Disconnect network (dev tools → offline)
3. Expected:
   - UI shows "Disconnected"
   - Backend continues processing (silent)
4. Reconnect network
5. Expected:
   - Auto-reconnects within 5s
   - Feedback resumes
   - No data loss
```

### Scenario 4: Multi-User
```
1. User A: Open coach on Device A
2. User B: Open coach on Device B
3. Both start streaming
4. Expected:
   - Separate WebSocket connections
   - Independent feedback per user
   - No interference between sessions
```

---

## 🚀 Deployment Steps

### Step 1: Local Testing
```bash
# Terminal 1: Backend (if testing locally)
cd exercise-form-correction/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
npm run dev
# Update .env.local with ws://localhost:8000
```

### Step 2: Test with Production Backend
```bash
# Update .env.local
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com

# Test
npm run dev
# Verify connection works with production backend
```

### Step 3: Build and Deploy
```bash
# Build
npm run build

# Verify build succeeds
npm run start

# Push to GitHub
git add .
git commit -m "Add WebSocket integration for form coach"
git push

# Vercel auto-deploys on push
```

### Step 4: Configure Vercel
1. Go to Vercel Dashboard
2. Select your Gymi project
3. Settings → Environment Variables
4. Add:
   ```
   Name: NEXT_PUBLIC_FORM_COACH_URL
   Value: wss://exercise-form-backend.onrender.com
   ```
5. Redeploy (or push to trigger redeploy)

### Step 5: Verify Production
```bash
# Test live URL
open https://gymi.vercel.app/coach
# Perform exercises, verify feedback
```

---

## 🔍 Debugging Guide

### Issue: WebSocket Won't Connect

**Symptom:** Status shows "🔴 Disconnected"

**Debug Steps:**
```javascript
// In browser console
// 1. Check URL
console.log(process.env.NEXT_PUBLIC_FORM_COACH_URL);

// 2. Check if backend is up
fetch('https://exercise-form-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log);

// 3. Check for CORS/network errors
// Open Network tab → WS section
// Look for red X or 403 errors
```

### Issue: Landmarks Not Sending

**Symptom:** WebSocket connected but no feedback

**Debug Steps:**
```javascript
// 1. Check pose detection working
// In CameraView console:
console.log('Landmarks:', landmarks.length); // Should be 33

// 2. Check landmarks format
console.log('First landmark:', landmarks[0]);
// Should be: {x: 0.5, y: 0.3, z: -0.1, visibility: 0.99}

// 3. Monitor WebSocket messages
// Network tab → WS → Messages
// Should see continuous JSON with landmarks
```

### Issue: Feedback Delayed

**Symptom:** Delay between movement and feedback

**Acceptable Latency:**
- WebSocket round-trip: 50-150ms
- Backend processing: 33-100ms
- Total: 100-250ms is normal

**To Improve:**
- Check network speed
- Ensure backend is running
- Verify no CPU throttling on browser
- Use local backend (ws://localhost:8000) for fastest response

### Issue: Rep Count Not Incrementing

**Symptom:** Rep count stays at 0

**Debug Steps:**
```javascript
// Check what exercise is detected
lastResponse?.current_exercise // Should not be null

// Check if violations blocking reps
lastResponse?.violations.length // Should be 0 or 1

// Check form quality
lastResponse?.is_rep_valid // Should be true
```

---

## 📈 Performance Optimization

### 1. Reduce Message Frequency
```typescript
// Only send every other frame (15fps instead of 30fps)
const frameCount = useRef(0);
const handlePoseDetected = (landmarks) => {
  frameCount.current++;
  if (frameCount.current % 2 === 0) {
    sendLandmarks(landmarks);
  }
};
```

### 2. Optimize Canvas Rendering
```typescript
// Only redraw when feedback changes
const handlePoseDetected = useCallback((landmarks) => {
  if (!shouldRedraw) return;
  drawPoseOnCanvas(canvas, video, landmarks, feedback.joint_colors);
}, [shouldRedraw, feedback.joint_colors]);
```

### 3. Session Cleanup
```typescript
// Reset after long sessions to free memory
useEffect(() => {
  if (isStreaming && sessionDuration > 3600) { // 1 hour
    resetSession();
  }
}, [sessionDuration]);
```

---

## 📚 File Reference

### Created Files
- `lib/hooks/usePoseWebSocket.ts` - WebSocket management hook
- `app/(app)/coach/page-websocket.tsx` - Full integration example

### Configuration Files
- `.env.local` - Environment variables
- `next.config.ts` - No changes needed
- `package.json` - No new dependencies needed

### Documentation Files
- `INTEGRATION_GUIDE.md` - Complete integration walkthrough
- `WEBSOCKET_SETUP.md` - Setup and troubleshooting
- `BACKEND_INTEGRATION_SUMMARY.md` - Overview and features
- `BACKEND_INTEGRATION_QUICK_START.md` - Quick reference
- `INTEGRATION_CHECKLIST.md` - This file

---

## ✅ Success Criteria

Your integration is complete when:

- [ ] WebSocket connects without errors
- [ ] Feedback updates in real-time (every frame)
- [ ] Rep count increments correctly
- [ ] Form violations display correctly
- [ ] Joint colors show form quality
- [ ] Correction messages are helpful
- [ ] Connection auto-recovers from disconnects
- [ ] Works on production URL
- [ ] Performance acceptable (< 300ms latency)
- [ ] Multiple users can stream simultaneously

---

## 🎉 Next Steps

After integration:

1. **Monitor Production**
   - Check WebSocket connections daily
   - Monitor error logs
   - Track user engagement

2. **Collect Feedback**
   - Ask users about form feedback quality
   - Track which exercises are most used
   - Identify missing exercises

3. **Enhance Experience**
   - Add workout history (save reps to DB)
   - Add achievement badges
   - Add leaderboards
   - Add exercise tutorials

4. **Scale Backend**
   - Monitor server load
   - Add database persistence
   - Cache common landmarks
   - Consider video upload processing

5. **Add More Exercises**
   - Deadlift module
   - Plank module
   - Lunge module
   - Custom exercise builder

---

**Ready to integrate? Start with Step 1 above!** ✨

For detailed help, see:
- `INTEGRATION_GUIDE.md` - Step-by-step integration
- `WEBSOCKET_SETUP.md` - Troubleshooting
- `BACKEND_INTEGRATION_QUICK_START.md` - API reference
