# Documentation Index - Backend Integration for Next.js Frontend

## Overview

Complete documentation has been created to help integrate the Exercise Form Correction Backend with a Next.js frontend. This includes architecture documentation, code examples, configuration guides, and troubleshooting information.

---

## 📚 Documentation Files (All in Root Directory)

### 1. **NEXTJS_INTEGRATION_GUIDE.md** ⭐ START HERE
**Purpose:** Complete integration guide with everything needed to connect Next.js to the backend

**Sections:**
- System overview and architecture
- API endpoints (REST and WebSocket)
- Data formats and message structures
- Complete implementation steps
- Full code examples for custom hooks
- Error handling strategies
- Configuration options
- Troubleshooting guide with common issues
- API response reference

**Use this when:** Setting up the Next.js project and implementing the integration

**Key Content:**
- Environment setup instructions
- Configuration file examples
- `usePoseWebSocket` hook (copy-paste ready)
- `useChunkedVideoUpload` hook (copy-paste ready)
- MediaPipe service utilities
- Complete example component
- Data structure definitions

---

### 2. **QUICK_INTEGRATION_CHECKLIST.md** ⭐ QUICK REFERENCE
**Purpose:** Quick reference guide for rapid integration

**Sections:**
- 5-minute quick start
- Copy-paste configuration
- WebSocket usage examples
- Upload hook usage
- Landmark data structure
- Exercise types and rep phases
- Form feedback examples
- Skeleton visualization code
- API endpoints summary
- Common issues and solutions
- Complete example component

**Use this when:** Need quick lookup while coding or rapid integration

**Best for:** Quick checks and copy-paste code snippets

---

### 3. **WEBSOCKET_DETAILED_FLOW.md** 🔌 DEEP DIVE
**Purpose:** Detailed explanation of WebSocket architecture and data flow

**Sections:**
- Complete connection flow diagram
- Message flow diagram with timing
- Detailed message formats (client→server and server→client)
- Landmark index reference (33 landmarks explained)
- Form correction response structure with examples
- Connection state machine
- Backend processing pipeline (step-by-step)
- Real-world example: Squat exercise flow
- Error handling and recovery strategies
- Optimization strategies
- Performance metrics
- Client ID management
- Summary table

**Use this when:** 
- Understanding the architecture
- Debugging connection issues
- Learning how form analysis works
- Explaining to team membersWhen:** Understanding the full architecture

**Key Features:**
- Visual diagrams showing data flow
- Real example of squat rep detection across frames
- Error scenarios and recovery strategies
- Performance metrics and latency breakdown
- Detailed message examples with 33 landmarks explained

---

### 4. **REACT_TO_NEXTJS_MIGRATION.md** 🔄 ADAPTATION GUIDE
**Purpose:** Shows how the current React/Vite frontend works and how to adapt for Next.js

**Sections:**
- Current frontend architecture description
- Key differences between React/Vite and Next.js
- Step-by-step migration guide
- File structure organization
- Converting App.tsx to Next.js pages
- Hook adaptation guidelines
- Root layout setup
- Page examples (home, exercise, upload)
- Environment configuration
- Component adaptation
- Deployment strategies (Vercel and Docker)
- Common issues and solutions
- Performance optimization tips
- Migration checklist

**Use this when:** 
- Setting up Next.js structure
- Understanding component differences
- Adapting existing components
- Deploying to Vercel

**Key Sections:**
- Detailed before/after code examples
- Environment variable setup
- Deployment configuration
- Hydration error fixes

---

## 🚀 Quick Start Path

### For Immediate Integration:

1. **Start with:** [QUICK_INTEGRATION_CHECKLIST.md](QUICK_INTEGRATION_CHECKLIST.md)
   - Get environment setup in 5 minutes
   - Copy configuration file
   - Understand basic concepts

2. **Then refer to:** [NEXTJS_INTEGRATION_GUIDE.md](NEXTJS_INTEGRATION_GUIDE.md)
   - Full code examples
   - Hook implementations (copy-paste ready)
   - Error handling patterns

3. **When debugging:** [WEBSOCKET_DETAILED_FLOW.md](WEBSOCKET_DETAILED_FLOW.md)
   - Understand data flow
   - Debug connection issues
   - Trace message formats

4. **If adapting current code:** [REACT_TO_NEXTJS_MIGRATION.md](REACT_TO_NEXTJS_MIGRATION.md)
   - Server-side setup
   - Page structure
   - Component adaptation

---

## 🔗 Key Integration Points

### WebSocket Connection
**Location:** `hooks/usePoseWebSocket.ts`
**Source:** NEXTJS_INTEGRATION_GUIDE.md (Code Examples section)
**Purpose:** Real-time exercise feedback streaming
**Endpoint:** `ws://localhost:8000/api/ws/pose/{client_id}`

### Video Upload
**Location:** `hooks/useChunkedVideoUpload.ts`
**Source:** NEXTJS_INTEGRATION_GUIDE.md (Code Examples section)
**Purpose:** Resume-able large file uploads
**Endpoints:** 
- `POST /api/upload/init`
- `POST /api/upload/chunk/{id}`
- `GET /api/upload/status/{id}`
- `POST /api/upload/complete/{id}`

### Pose Detection
**Location:** `lib/mediapipe.ts`
**Purpose:** Load MediaPipe and extract landmarks
**Source:** NEXTJS_INTEGRATION_GUIDE.md (Step 5)

### Configuration
**Location:** `lib/config.ts`
**Source:** All guides (Step 1 or Step 2)
**Contents:** API URLs, WebSocket addresses, model paths

---

## 📊 Backend API Summary

### REST Endpoints

```
POST /api/upload/init          - Initialize upload session
POST /api/upload/chunk/{id}    - Upload file chunk
GET  /api/upload/status/{id}   - Check upload progress
POST /api/upload/complete/{id} - Finalize upload
POST /api/reset/{client_id}    - Reset session state
GET  /api/health               - Health check
```

### WebSocket

```
WS /api/ws/pose/{client_id}    - Real-time form analysis stream
```

**Message Format:**
- **Client sends:** `{ landmarks: [...], timestamp }`
- **Server sends:** `{ state, current_exercise, rep_count, violations, corrections, ... }`

---

## 🎯 Supported Exercises

The backend can detect and analyze:

1. **Squat** - Bodyweight or weighted
   - Form violations: Knees caving, heels lifting, back rounding
   
2. **Pushup** - Standard pushups
   - Form violations: Uneven shoulders, body sag, poor alignment
   
3. **Bicep Curl** - Dumbbell/barbell
   - Form violations: Elbow position, partial range of motion
   
4. **Detection States:**
   - `idle` - Waiting for movement
   - `scanning` - Analyzing movement
   - `active` - Counting reps

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Next.js 14+
- Backend running (Python FastAPI)

### Installation Steps

```bash
# 1. Create Next.js project
npx create-next-app@latest --typescript --tailwind

# 2. Install dependencies
npm install @mediapipe/tasks-vision

# 3. Create configuration (from NEXTJS_INTEGRATION_GUIDE.md Step 1-2)
# Copy lib/config.ts
# Copy hooks/usePoseWebSocket.ts
# Copy hooks/useChunkedVideoUpload.ts

# 4. Set environment variables
# Create .env.local with:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000

# 5. Development
npm run dev
# Open http://localhost:3000
```

---

## 📋 File Structure

After following the guide, your Next.js project should look like:

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page
├── exercise/
│   └── page.tsx              # Exercise analysis
├── upload/
│   └── page.tsx              # Video upload
│
lib/
├── config.ts                 # Configuration
└── mediapipe.ts             # MediaPipe utilities

hooks/
├── usePoseWebSocket.ts      # WebSocket connection
└── useChunkedVideoUpload.ts # File upload

components/
├── VideoPlayer.tsx
├── ExerciseDisplay.tsx
└── SkeletonOverlay.tsx

public/
└── models/
    └── pose_landmarker_lite.task
```

---

## 🔍 Key Concepts

### Client ID
Unique identifier for each session. Auto-generated as:
```
client_{timestamp}_{randomString}
```
Example: `client_1645678901234_abc123def45`

### Landmarks (33 Total)
MediaPipe Pose provides 33 landmarks per frame:
- **Key for exercises:** Shoulders (11,12), Elbows (13,14), Hips (23,24), Knees (25,26), Ankles (27,28)
- **Normalized coordinates:** x (0-1), y (0-1), z (depth 0-1), visibility (0-1)

### Rep Phases
- `idle` - No movement detected
- `down` - Descending phase (e.g., lowering in squat)
- `up` - Ascending phase (e.g., rising in squat)
- `static` - Holding position

### Form Violations
Examples detected by backend:
- "Knees caving inward"
- "Heels lifting off ground"
- "Back rounding"
- "Uneven shoulder height"

---

## ⚠️ Common Pitfalls

1. **WebSocket using http instead of ws**
   - ❌ `http://localhost:8000/api/ws/pose`
   - ✅ `ws://localhost:8000/api/ws/pose`

2. **Missing `'use client'` directive in Next.js**
   - Client components must have this at the top
   - Required for hooks like `useState`, `useEffect`

3. **CORS errors**
   - Backend includes CORS configuration
   - If issues persist, check `CORS_ORIGINS` env variable

4. **WebSocket connection never completes**
   - Ensure backend is running (`http://localhost:8000/api/health`)
   - Check firewall settings
   - Verify correct WebSocket URL format

5. **Landmarks not being sent**
   - Check if `ws.readyState === WebSocket.OPEN`
   - Verify MediaPipe model is loaded
   - Ensure video is playing with adequate lighting

---

## 📞 Support & Resources

### Within Documentation
- **Configuration Issues:** See NEXTJS_INTEGRATION_GUIDE.md → Configuration
- **WebSocket Problems:** See WEBSOCKET_DETAILED_FLOW.md → Error Handling
- **Code Examples:** See QUICK_INTEGRATION_CHECKLIST.md
- **Migration Help:** See REACT_TO_NEXTJS_MIGRATION.md

### External Resources
- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [FastAPI WebSocket Guide](https://fastapi.tiangolo.com/advanced/websockets)
- [Next.js Documentation](https://nextjs.org/docs)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## ✅ Integration Checklist

### Phase 1: Setup
- [ ] Create Next.js project with TypeScript & Tailwind
- [ ] Install `@mediapipe/tasks-vision`
- [ ] Create `lib/config.ts` with API configuration
- [ ] Set environment variables in `.env.local`

### Phase 2: Core Hooks
- [ ] Create `hooks/usePoseWebSocket.ts`
- [ ] Create `hooks/useChunkedVideoUpload.ts`
- [ ] Create `lib/mediapipe.ts`

### Phase 3: Pages & Components
- [ ] Create `app/layout.tsx` (root layout)
- [ ] Create `app/page.tsx` (home)
- [ ] Create `app/exercise/page.tsx` (analysis page)
- [ ] Create `app/upload/page.tsx` (upload page)
- [ ] Create components in `components/`

### Phase 4: Testing
- [ ] Test WebSocket connection to backend
- [ ] Test video file upload
- [ ] Test landmark detection (pose should show in console)
- [ ] Test form feedback display

### Phase 5: Deployment
- [ ] Configure production environment variables
- [ ] Deploy to Vercel
- [ ] Test in production environment
- [ ] Monitor WebSocket connections (wss://)

---

## 📖 Documentation Map

```
START HERE (5 min)
    ↓
QUICK_INTEGRATION_CHECKLIST.md
    ↓
NEXTJS_INTEGRATION_GUIDE.md (Full setup + code)
    ↑           ↑
    |           |
Need     Need code
architecture?  examples?
    |           |
    |     Copy from step 3-5
    |
WEBSOCKET_DETAILED_FLOW.md
    ↓
Debugging/Understanding


Existing React/Vite code?
    ↓
REACT_TO_NEXTJS_MIGRATION.md
    ↓
Adapt components & pages
```

---

## 🎓 Learning Order

1. **Understand the backend** (10 min)
   - Read WEBSOCKET_DETAILED_FLOW.md
   - Understand how exercises are detected

2. **Quick start setup** (15 min)
   - Follow QUICK_INTEGRATION_CHECKLIST.md
   - Get basic structure in place

3. **Implementation** (1-2 hours)
   - Follow NEXTJS_INTEGRATION_GUIDE.md steps 1-5
   - Copy hooks from code examples
   - Create pages and components

4. **Testing & Debugging** (30 min)
   - Test each endpoint
   - Refer to common issues in guides
   - Use browser DevTools for WebSocket inspection

5. **Optimization** (as needed)
   - Review performance tips in REACT_TO_NEXTJS_MIGRATION.md
   - Implement code-splitting and optimizations

---

## 🚨 When Things Go Wrong

### WebSocket Won't Connect
→ See WEBSOCKET_DETAILED_FLOW.md → Error Handling & Recovery

### Landmarks Not Detected
→ See NEXTJS_INTEGRATION_GUIDE.md → Error Handling

### Upload Fails
→ See NEXTJS_INTEGRATION_GUIDE.md → Error Handling & Troubleshooting

### Form Feedback Not Showing
→ Check message format in WEBSOCKET_DETAILED_FLOW.md

### Deployment Issues
→ See REACT_TO_NEXTJS_MIGRATION.md → Deployment & Common Issues

---

## 📞 Quick Reference Card

### URLs
```
Development:
  API:      http://localhost:8000
  WebSocket: ws://localhost:8000
  Frontend: http://localhost:3000

Production:
  API:       https://api.yourdomain.com
  WebSocket: wss://api.yourdomain.com
  Frontend:  https://yourdomain.vercel.app
```

### Key Endpoints
```
WebSocket: /api/ws/pose/{client_id}
Upload:    /api/upload/*
Health:    /api/health
Reset:     /api/reset/{client_id}
```

### Key Files to Create
```
lib/config.ts
lib/mediapipe.ts
hooks/usePoseWebSocket.ts
hooks/useChunkedVideoUpload.ts
app/layout.tsx
app/page.tsx
app/exercise/page.tsx
app/upload/page.tsx
.env.local
```

---

**Last Updated:** February 2026
**Version:** 1.0
**Status:** Complete ✅

