# WebSocket Architecture & Flow Documentation

## Overview

The Exercise Form Correction system uses **WebSocket** for real-time bidirectional communication between the frontend and backend. This enables:
- **Real-time feedback** on exercise form
- **Immediate rep counting** as user performs exercises
- **Live violation detection** with corrections
- **Low latency** communication

---

## WebSocket Connection Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     WEBSOCKET CONNECTION LIFECYCLE                        │
└──────────────────────────────────────────────────────────────────────────┘

1. INITIALIZATION
   ┌─────────────────────────────────────────────────────────────┐
   │ Frontend: usePoseWebSocket({                                │
   │   url: 'ws://localhost:8000/api/ws/pose',                  │
   │   clientId: 'client_123456789'  // Unique per session      │
   │ })                                                          │
   └──────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
2. ESTABLISH CONNECTION
   ┌─────────────────────────────────────────────────────────────┐
   │ ws = new WebSocket('ws://localhost:8000/api/ws/pose/...')  │
   │ ws.onopen: setIsConnected(true)                            │
   └──────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
3. BACKEND ACCEPTS CONNECTION
   ┌─────────────────────────────────────────────────────────────┐
   │ @router.websocket("/ws/pose/{client_id}")                  │
   │ async def pose_websocket(websocket, client_id):            │
   │   await manager.connect(websocket, client_id) ✅            │
   │   form_manager = FormManager()  // Initialize per client   │
   └──────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
4. CONNECTION ESTABLISHED ✅
   │
   ├─► All pending messages sent
   ├─► onConnect() callback fired
   └─► Ready to send/receive data
```

---

## Message Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME MESSAGE LOOP                            │
└──────────────────────────────────────────────────────────────────────────┘

FRONTEND (React/Next.js)                      BACKEND (FastAPI)
─────────────────────────────────────────────────────────────────

1. VIDEO FRAME
   │
   ├─► MediaPipe detects 33 landmarks
   │   (0:nose, 11/12:shoulders, 25/26:knees, etc.)
   │
   └─► Normalize coordinates (0-1 range)
       │
       │ {
       │   landmarks: [
       │     {x: 0.45, y: 0.32, z: 0.1, visibility: 0.95},
       │     {x: 0.48, y: 0.28, z: 0.11, visibility: 0.94},
       │     // ... 31 more landmarks
       │   ],
       │   timestamp: 1645678901234
       │ }
       │
       ▼
       ws.send(JSON.stringify(message))
                │
                ├──────────────────────────────────────────────┐
                │ WebSocket Transport (Few milliseconds)        │
                │                                               │
                ▼
       @router.websocket("/ws/pose/{client_id}")
       data = await websocket.receive_json() ◄─────────────────┘
           │
           ├─► Extract landmarks and timestamp
           │
           └─► form_manager.process_frame(landmarks)
               │
               ├─► Exercise Detection
               │   (Compare joint angles to exercise templates)
               │
               ├─► Rep Counting
               │   (Identify rep phases: down/up)
               │
               ├─► Form Validation
               │   (Check for violations like knees caving in)
               │
               └─► Generate Feedback
                   (Corrections and violation messages)
                   │
                   ▼
       response = FormCorrectionResponse(
         state="active",
         current_exercise="SQUAT",
         rep_count=5,
         rep_phase="down",
         violations=["Knees too far forward"],
         corrections=["Keep knees aligned with toes"],
         correction_message="Keep knees aligned with toes",
         joint_colors={
           "left_knee": "#ef4444",  // red = bad form
           "right_knee": "#ef4444"
         },
         confidence=0.92,
         timestamp=1645678901234
       )
           │
           ▼
       await manager.send_response(client_id, response)
       websocket.send_json(response.model_dump())
                │
                ├──────────────────────────────────────────────┐
                │ WebSocket Transport (Few milliseconds)        │
                │                                               │
                ▼
   ws.onmessage = (event) => {
     const response = JSON.parse(event.data)
     │
     ├─► updateFormDisplay(response.exercise_display)
     │   Display: "Squat - Active"
     │
     ├─► updateRepCount(response.rep_count)
     │   Display: "5"
     │
     ├─► updateFeedback(response.correction_message)
     │   Display: "Keep knees aligned with toes"
     │
     ├─► colorizeJoints(response.joint_colors)
     │   Paint skeleton: bad joints in red, good in green
     │
     └─► storeAnalysisData(response)
   }
       │
       ▼
   [UI Updates - Real-time Exercise Feedback]


2. THIS LOOP REPEATS
   ~~~~~~~~~~~~~~
   • 15-30 times per second (video FPS dependent)
   • Each cycle: ~100-300ms total latency
   • Maintains state across frames
```

---

## Detailed Message Formats

### CLIENT → SERVER: Landmark Frame

**Topic**: Pose landmark data from MediaPipe

```json
{
  "landmarks": [
    {
      "x": 0.45,          // Horizontal position (0-1)
      "y": 0.32,          // Vertical position (0-1)
      "z": 0.1,           // Depth relative to body (0-1)
      "visibility": 0.95  // Confidence (0-1)
    },
    {
      "x": 0.48,
      "y": 0.28,
      "z": 0.11,
      "visibility": 0.94
    }
    // ... 31 more landmarks (total 33)
  ],
  "timestamp": 1645678901234.567  // Milliseconds since epoch
}
```

**Landmark Index Reference** (33 total landmarks):
```
0   - Nose                    | 17  - Left Pinky
1   - Left Eye Inner          | 18  - Right Pinky
2   - Left Eye                | 19  - Left Index
3   - Left Eye Outer          | 20  - Right Index
4   - Right Eye Inner         | 21  - Left Thumb
5   - Right Eye               | 22  - Right Thumb
6   - Right Eye Outer         | 23  - Left Hip ⭐
7   - Left Ear                | 24  - Right Hip ⭐
8   - Right Ear               | 25  - Left Knee ⭐
9   - Mouth Left              | 26  - Right Knee ⭐
10  - Mouth Right             | 27  - Left Ankle ⭐
11  - Left Shoulder ⭐         | 28  - Right Ankle ⭐
12  - Right Shoulder ⭐        | 29  - Left Heel
13  - Left Elbow ⭐           | 30  - Right Heel
14  - Right Elbow ⭐          | 31  - Left Foot Index
15  - Left Wrist ⭐           | 32  - Right Foot Index
16  - Right Wrist ⭐          |

⭐ = Critical joints for exercise detection
```

### SERVER → CLIENT: Form Correction Response

**Topic**: Real-time form analysis and feedback

```json
{
  "state": "active",
  // System state: idle (waiting) | scanning (detecting) | active (counting)
  
  "current_exercise": "SQUAT",
  // Detected exercise type
  // Options: SQUAT | PUSHUP | BICEP_CURL | null
  
  "exercise_display": "Squat - Active",
  // Human-readable exercise status
  
  "rep_count": 5,
  // Number of valid repetitions completed
  
  "rep_phase": "down",
  // Current phase of movement: idle | up | down | static
  
  "is_rep_valid": true,
  // Whether the most recent rep had acceptable form
  
  "violations": [
    "Knees caving inward",
    "Heels lifting off ground"
  ],
  // List of form issues detected in current frame
  
  "corrections": [
    "Keep knees aligned with toes",
    "Keep weight in heels"
  ],
  // List of suggested form improvements
  
  "correction_message": "Keep knees aligned with toes",
  // Primary feedback message to display to user
  
  "joint_colors": {
    "left_shoulder": "#22c55e",      // green = good form
    "right_shoulder": "#22c55e",
    "left_hip": "#22c55e",
    "right_hip": "#22c55e",
    "left_knee": "#ef4444",          // red = poor form
    "right_knee": "#ef4444",         // red = poor form
    "left_ankle": "#22c55e",
    "right_ankle": "#22c55e"
  },
  // Color coding for skeleton visualization
  // Green (#22c55e) = Good form
  // Red (#ef4444) = Poor form
  // Yellow (#eab308) = Warning
  
  "confidence": 0.92,
  // Model confidence in detection (0-1)
  // >0.8 is considered high confidence
  
  "timestamp": 1645678901234567
  // Server timestamp for synchronization
}
```

---

## Connection State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET STATE MACHINE                             │
└─────────────────────────────────────────────────────────────────────────┘


                         ┌──────────────┐
                         │   CREATED    │
                         └──────┬───────┘
                                │
                   call connect()│
                                │
                                ▼
                     ┌──────────────────────┐
                     │   CONNECTING         │
                     │ (DNS, TCP, wait)     │
                     └──────┬───────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
         success                      timeout/error
              │                           │
              ▼                           ▼
    ┌──────────────────┐        ┌──────────────┐
    │    OPEN ✅       │        │    ERROR     │
    │ (Ready to send)  │        │ (Try again)  │
    └────────┬─────────┘        └──────────────┘
             │ sendLandmarks()              │
             │ (Frames loop)                │
             │                       manual retry/
    ┌────────▼──────────┐           auto-reconnect
    │   SENDING/RECV    │                │
    │   (Active)        │─────────────────┘
    └────────┬──────────┘
             │ call disconnect()
             │ OR connection drops
             │
             ▼
    ┌──────────────────┐
    │    CLOSING       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │    CLOSED 🔴     │
    │ (Can reconnect)  │
    └──────────────────┘


States:
  🟦 CREATED      - Hook initialized, not connected
  🟨 CONNECTING   - Establishing WebSocket connection
  🟢 OPEN         - Connected, ready to send/receive
  🔄 SENDING/RECV - Actively streaming landmarks & receiving feedback
  🟠 CLOSING      - Connection being terminated gracefully
  🔴 CLOSED       - Connection terminated, can reconnect
  🔴 ERROR        - Connection failed, needs retry
```

---

## Backend Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│            BACKEND PROCESSING FOR EACH FRAME (Per Landmark Message)      │
└──────────────────────────────────────────────────────────────────────────┘


receive_json()
    │ Raw landmark data from client
    │
    ▼
form_manager.process_frame(landmarks)
    │
    ├─► 1. MOTION ANALYSIS
    │    ├─► Smooth landmarks (reduce noise)
    │    ├─► Calculate joint angles
    │    ├─► Detect movement velocity
    │    ├─► Calculate confidence scores
    │    └─► Output: MotionAnalysis(confidence, angles, velocity)
    │
    ├─► 2. EXERCISE DETECTION
    │    ├─► Compare angle patterns to templates:
    │    │   ├─► Squat: hip, knee, ankle angles
    │    │   ├─► Pushup: shoulder, elbow, wrist angles
    │    │   └─► Bicep Curl: elbow flexion/extension
    │    ├─► Calculate similarity score (0-1)
    │    ├─► If score > threshold → Exercise detected
    │    └─► Output: ExerciseType (SQUAT | PUSHUP | etc.)
    │
    ├─► 3. REP PHASE DETECTION
    │    ├─► Current phase: Up, Down, Static, Idle
    │    ├─► Compare to previous frames
    │    ├─► Determine if transitioning between phases
    │    └─► Output: rep_phase, phase_transition_flag
    │
    ├─► 4. REP COUNTING & VALIDATION
    │    ├─► If phase transitions from Down→Up: Increment counter
    │    ├─► Buffer recent frames for validation
    │    ├─► Validate rep quality:
    │    │   ├─► Full range of motion?
    │    │   ├─► Proper timing?
    │    │   └─► Good form throughout?
    │    ├─► Set is_rep_valid flag
    │    └─► Output: rep_count, is_rep_valid
    │
    ├─► 5. FORM VALIDATION
    │    ├─► Compare key angles to ideal ranges:
    │    │   ├─► Knee alignment
    │    │   ├─► Heel position
    │    │   ├─► Spine alignment
    │    │   ├─► Joint extension/flexion
    │    │   └─► Balance indicators
    │    ├─► Collect all violations
    │    ├─► Generate corrections
    │    └─► Output: violations[], corrections[], joint_colors
    │
    └─► 6. BUILD RESPONSE
         └─► Combine all results into FormCorrectionResponse
             └─► Send back to client


Timing:
  • Each frame processing: ~30-50ms
  • Network round-trip: ~20-100ms
  • Total end-to-end latency: 50-150ms (typical)
```

---

## Data Flow Example: Squat Exercise

```
FRAME 1: Startup (t=0ms)
─────────────────────────
Client: { landmarks: [...], timestamp: 0 }
         └─► No clear posture yet
Server: {
  state: "scanning",
  current_exercise: null,
  exercise_display: "Scanning for exercise...",
  rep_count: 0,
  confidence: 0.45
}


FRAME 15: Squat Detected (t=500ms)
──────────────────────────────────
Client: { landmarks: [...shoulder low, knee bent...], timestamp: 500 }
         └─► Squat pose detected (angles match template)
Server: {
  state: "active",
  current_exercise: "SQUAT",
  exercise_display: "Squat - Active",
  rep_count: 0,
  rep_phase: "down",
  violations: [],
  corrections: [],
  joint_colors: {
    "left_knee": "#22c55e",   ← Good form
    "right_knee": "#22c55e"   ← Good form
  },
  confidence: 0.92
}


FRAME 30: Bottom Position (t=1000ms)
────────────────────────────────────
Client: { landmarks: [...knees at 90°, hips low...], timestamp: 1000 }
         └─► Maximum depth achieved
Server: {
  state: "active",
  current_exercise: "SQUAT",
  exercise_display: "Squat - Active",
  rep_count: 0,
  rep_phase: "down",       ← Still going down
  violations: ["Knees caving inward"],
  corrections: ["Align knees with toes"],
  correction_message: "Align knees with toes",
  joint_colors: {
    "left_knee": "#ef4444",  ← Poor form (caving in)
    "right_knee": "#ef4444"  ← Poor form (caving in)
  },
  confidence: 0.88
}


FRAME 45: Ascending (t=1500ms)
──────────────────────────────
Client: { landmarks: [...knee angle increasing, standing up...], timestamp: 1500 }
         └─► Movement reversal detected
Server: {
  state: "active",
  current_exercise: "SQUAT",
  exercise_display: "Squat - Active",
  rep_count: 0,
  rep_phase: "up",         ← Phase changed to "up"
  violations: [],          ← Form improved
  corrections: [],
  correction_message: "Great form! Keep it up!",
  joint_colors: {
    "left_knee": "#22c55e", ← Good form
    "right_knee": "#22c55e" ← Good form
  },
  confidence: 0.94
}


FRAME 60: Standing (t=2000ms)
────────────────────────────
Client: { landmarks: [...fully upright...], timestamp: 2000 }
         └─► Return to standing position
Server: {
  state: "active",
  current_exercise: "SQUAT",
  exercise_display: "Squat - Active",
  rep_count: 1,            ← REP COUNTED! ✅
  rep_phase: "idle",       ← Waiting for next rep
  is_rep_valid: false,     ← Knee alignment issue during rep
  violations: [],
  corrections: [],
  joint_colors: {
    "left_knee": "#22c55e",
    "right_knee": "#22c55e"
  },
  confidence: 0.94
}

(Cycle repeats for next Rep...)
```

---

## Error Handling & Recovery

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET ERROR SCENARIOS                             │
└──────────────────────────────────────────────────────────────────────────┘


1. CONNECTION REFUSED
   ┌─────────────────────────────────────────────────────┐
   │ ws.onerror(): "Connection refused"                  │
   │ Likely cause: Backend not running                   │
   │ Action: frontend should                             │
   │  • Show: "Server not available"                     │
   │  • Retry with exponential backoff                   │
   │  • Check health endpoint: /api/health               │
   └─────────────────────────────────────────────────────┘


2. CONNECTION TIMEOUT
   ┌─────────────────────────────────────────────────────┐
   │ No onopen event within timeout period               │
   │ Likely cause: Network latency, firewall blocking    │
   │ Action:                                             │
   │  • Auto-reconnect with increasing delays            │
   │  • Show: "Connecting..." state                      │
   │  • Inform user of connection attempts               │
   └─────────────────────────────────────────────────────┘


3. MESSAGE SEND FAILS
   ┌─────────────────────────────────────────────────────┐
   │ ws.send() throws or ws.readyState != OPEN           │
   │ Likely cause: Connection closed unexpectedly        │
   │ Action:                                             │
   │  • Queue messages (max 5 pending)                   │
   │  • Auto-reconnect                                   │
   │  • Resume sending when connection restored          │
   └─────────────────────────────────────────────────────┘


4. INVALID JSON RESPONSE
   ┌─────────────────────────────────────────────────────┐
   │ JSON.parse(event.data) throws SyntaxError           │
   │ Likely cause: Client/server version mismatch        │
   │ Action:                                             │
   │  • Log error but don't crash                        │
   │  • Continue accepting frames                        │
   │  • Show warning to user                             │
   └─────────────────────────────────────────────────────┘


5. CONNECTION DROPPED
   ┌─────────────────────────────────────────────────────┐
   │ onclose event triggered                             │
   │ Likely causes:                                      │
   │  • Network interrupted (WiFi disconnected)          │
   │  • Backend crashed/restarted                        │
   │  • Session timeout (idle too long)                  │
   │ Action:                                             │
   │  • Auto-reconnect with exponential backoff          │
   │  • Reset state machine to CREATED                   │
   │  • Show: "Reconnecting..." message                  │
   │  • Resume analysis once reconnected                 │
   └─────────────────────────────────────────────────────┘


RECOMMENDED RECONNECTION STRATEGY:
──────────────────────────────────
const RECONNECT_DELAYS = [
  500,      // 1st attempt: 500ms
  1000,     // 2nd: 1s
  2000,     // 3rd: 2s
  5000,     // 4th: 5s
  10000,    // 5th: 10s
];

attempt = 0;
while (!connected && attempt < RECONNECT_DELAYS.length) {
  await sleep(RECONNECT_DELAYS[attempt]);
  try {
    reconnect();
    break;
  } catch {
    attempt++;
  }
}
```

---

## Optimization Strategies

### 1. Message Batching (Not Recommended - Use Real-time)
```
❌ DON'T: Send landmarks every 500ms in batches
   → Increases latency, defeats real-time purpose

✅ DO: Send landmarks per frame (30-60Hz)
   → Enables smooth real-time feedback
```

### 2. Data Compression
```javascript
// Optional: Compress landmark data
function compressLandmarks(landmarks) {
  // Round to 2 decimal places to save bandwidth
  return landmarks.map(lm => ({
    x: Math.round(lm.x * 100) / 100,
    y: Math.round(lm.y * 100) / 100,
    z: Math.round(lm.z * 100) / 100,
    v: Math.round(lm.visibility * 100) / 100
  }));
}
```

### 3. Frame Skipping (Adaptive)
```javascript
// If processor is overloaded, skip every Nth frame
let frameCount = 0;
function shouldProcessFrame() {
  frameCount++;
  return frameCount % SKIP_FRAMES === 0; // SKIP_FRAMES = 1 (no skip) to 3
}
```

### 4. Client-side Validation
```javascript
// Don't send frames with low confidence
if (landmarks.every(lm => lm.visibility > 0.5)) {
  sendLandmarks(landmarks, timestamp);
} else {
  console.log('Low confidence frame, skipping...');
}
```

---

## Performance Metrics

```
Typical Latency Breakdown:
─────────────────────────
Client Processing:        10-20ms (MediaPipe + normalization)
Network (Client→Server):  20-50ms (WiFi typical)
Server Processing:        30-50ms (Form analysis)
Network (Server→Client):  20-50ms (WiFi typical)
Frontend Rendering:       10-20ms (React state update)
                         ─────────
TOTAL:                    100-190ms E2E latency

At 30fps:  Frame every 33ms  → Overlap = ~3-6 frames in flight
At 60fps:  Frame every 17ms  → Overlap = ~6-11 frames in flight

Perceptual Impact: User sees feedback ~2-6 frames after movement
This is acceptable for exercise correction feedback.
```

---

## Client ID Management

```
The client_id uniquely identifies each user session:

const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                   ↑              ↑          ↑
                Prefix       Timestamp    Random

Example: client_1645678901234_abc123def45

✅ Benefits:
  • Unique per browser session
  • Stable during page reloads
  • Prevents session collisions
  • Enables server-side state tracking

⚠️ Important:
  • Store in ref to prevent re-generation on re-renders
  • Use same clientId for reconnection attempts
  • Reset on user logout
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Protocol** | WebSocket (ws://, wss://) |
| **URL Pattern** | `/api/ws/pose/{client_id}` |
| **Update Frequency** | Every video frame (15-60Hz) |
| **Message Size** | ~500 bytes per frame |
| **Latency** | 100-200ms typical |
| **Supported Exercises** | Squat, Pushup, Bicep Curl |
| **Key Benefit** | Real-time form feedback |
| **Scalability** | Per-client FormManager isolates state |

