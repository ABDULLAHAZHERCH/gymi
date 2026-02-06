# FastAPI Integration Quick Reference

## TL;DR - 3 Steps to Integrate

### 1️⃣ Add WebSocket Hook
```bash
# Copy this file to your project
lib/hooks/usePoseWebSocket.ts
```

### 2️⃣ Set Environment Variable
```env
# .env.local
NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
```

### 3️⃣ Use in Component
```typescript
import { usePoseWebSocket } from '@/lib/hooks/usePoseWebSocket';

export default function CoachPage() {
  const { isConnected, sendLandmarks, lastResponse } = usePoseWebSocket({
    clientId: user?.uid,
    enabled: isStreaming,
    onMessage: (response) => {
      // Handle form feedback
      console.log(response.rep_count, response.violations);
    },
  });

  // Send landmarks when pose detected
  const handlePoseDetected = (landmarks) => {
    sendLandmarks(landmarks);
  };

  return (
    <div>
      <CameraView onPoseDetected={handlePoseDetected} />
      {lastResponse && (
        <div>
          <p>Exercise: {lastResponse.exercise_display}</p>
          <p>Reps: {lastResponse.rep_count}</p>
          <p>Feedback: {lastResponse.correction_message}</p>
        </div>
      )}
    </div>
  );
}
```

---

## API Reference

### useWebSocket Hook
```typescript
const { isConnected, sendLandmarks, lastResponse, resetSession } = usePoseWebSocket({
  serverUrl?: string;        // Default: env.NEXT_PUBLIC_FORM_COACH_URL
  clientId?: string;         // Default: gymi-{timestamp}
  enabled?: boolean;         // Default: true
  onMessage?: (response) => void;
  onError?: (error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
});
```

### FormCorrectionResponse
```typescript
{
  state: string;                      // "idle" | "scanning" | "active"
  current_exercise: string | null;    // "bicep_curl" | "squat" | etc.
  exercise_display: string;           // "Bicep Curl" (display name)
  rep_count: number;                  // Total reps counted
  rep_phase: string;                  // "up" | "down"
  is_rep_valid: boolean;              // This rep has good form
  violations: string[];               // Form issues detected
  corrections: string[];              // Suggestions to improve
  correction_message: string;         // Human-readable feedback
  joint_colors: {                     // Color feedback for joints
    [key: string]: string;            // hex color (#00ff00, etc.)
  };
  confidence: number;                 // 0-1 confidence score
  timestamp: number;                  // Server timestamp
}
```

---

## Supported Exercises

| Exercise | Status | Form Checks |
|----------|--------|-------------|
| Bicep Curl | ✅ | Elbow drift, body swing, ROM |
| Squat | ✅ | Knee valgus, depth, back angle |
| Push-up | ✅ | Elbow flare, hip sag, depth |
| Alt Bicep Curl | ✅ | Alternation, left/right balance |

---

## Message Flow

```
Frontend                  Backend
   │                         │
   │─ Pose Landmarks ───────→│
   │  {"landmarks": [...]}  │
   │                         │
   │←─ Form Feedback ────────│
   │  {"rep_count": 5, ...}  │
   │                         │
   │─ Pose Landmarks ───────→│
   │  (every frame)          │
   │                         │
   │←─ Form Feedback ────────│
```

---

## Testing

### Local Backend
```bash
# Terminal 1: Backend
cd exercise-form-correction/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
export NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000
npm run dev
```

### Production Backend
```bash
export NEXT_PUBLIC_FORM_COACH_URL=wss://exercise-form-backend.onrender.com
npm run build
npm start
```

---

## Common Patterns

### Show Connection Status
```typescript
<div className="flex items-center gap-2">
  <div className={isConnected ? 'bg-green-500' : 'bg-red-500'} />
  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
</div>
```

### Display Rep Count
```typescript
<div className="text-4xl font-bold">
  {lastResponse?.rep_count || 0}
</div>
```

### Show Form Feedback
```typescript
{lastResponse?.violations.length > 0 ? (
  <div className="text-red-600">
    {lastResponse.violations.join(', ')}
  </div>
) : (
  <div className="text-green-600">
    {lastResponse?.correction_message}
  </div>
)}
```

### Draw Joint Colors
```typescript
const jointColor = lastResponse?.joint_colors['landmark_13'];
// Use in canvas rendering
ctx.fillStyle = jointColor || '#00ff00';
```

### Reset Session
```typescript
<button onClick={resetSession}>
  Reset Session
</button>
```

---

## Deployment Checklist

- [ ] Copy `lib/hooks/usePoseWebSocket.ts` to project
- [ ] Add `NEXT_PUBLIC_FORM_COACH_URL` environment variable
- [ ] Update coach page with WebSocket integration
- [ ] Test locally with `NEXT_PUBLIC_FORM_COACH_URL=ws://localhost:8000`
- [ ] Test with production backend (`wss://exercise-form-backend.onrender.com`)
- [ ] Deploy to Vercel
- [ ] Update Vercel environment variable
- [ ] Test production deployment
- [ ] Monitor WebSocket connections

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection fails | Check `NEXT_PUBLIC_FORM_COACH_URL` is set correctly |
| No feedback | Verify landmarks are being sent (Network tab) |
| High latency | Normal: 100-200ms, check network speed |
| Connection drops | Frontend auto-reconnects, check backend logs |
| Wrong exercise detected | Send clearer pose data, ensure good lighting |

---

## Files to Copy

```
From: exercise-form-correction/
To: Gymi/

✅ Backend is ready - no changes needed
✅ Frontend hook: lib/hooks/usePoseWebSocket.ts
✅ Coach page: app/(app)/coach/page.tsx (optional full rewrite)
✅ Env: .env.local with NEXT_PUBLIC_FORM_COACH_URL
```

---

## Architecture

```
Your Next.js App (Gymi)
    ↓
usePoseWebSocket Hook
    ↓
WebSocket Client (Browser)
    ↓
  wss://exercise-form-backend.onrender.com/api/ws/pose/{clientId}
    ↓
FastAPI Server
    ↓
FormManager + Exercise Modules
    ↓
FormCorrectionResponse
    ↓
Display Feedback to User
```

---

## Performance Notes

- **Frame Rate:** Send landmarks every frame (30fps)
- **Latency:** 100-200ms typical (network + processing)
- **Bandwidth:** ~1-2 KB per message
- **CPU:** Minimal on frontend (receiving only)
- **Memory:** Auto-cleanup on disconnect

---

**Questions?** Check the full guides:
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Complete integration walkthrough
- [WEBSOCKET_SETUP.md](WEBSOCKET_SETUP.md) - Detailed setup and troubleshooting
- Backend: https://github.com/shahmir2004/exercise-form-correction
