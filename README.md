# Gymi

Gymi is a Next.js fitness companion for workout logging, nutrition tracking, goal progress, and real-time AI form coaching. It is the production frontend for the separate Exercise Form Correction FastAPI backend.

## Live App

- Production app: `https://gymii.vercel.app`
- Form coach backend: `https://exercise-form-backend.onrender.com`
- Backend repository: `https://github.com/shahmir2004/exercise-form-correction`

## Current Feature Set

- Email/password and Google sign-in with Firebase Auth.
- Authenticated app shell with dashboard, mobile bottom navigation, and account settings.
- Workout logging with search, filters, program-linked workouts, and history.
- Nutrition logging with meals, meal templates, macros, and AI food photo recognition.
- Goal, weight, progress, streak, achievement, and notification tracking.
- Template/database-backed workout program generation through `/api/workout-program`.
- Real-time form coach using browser MediaPipe pose detection plus the FastAPI WebSocket backend.
- Coach-session persistence to Firestore with linked workout-summary entries.
- Gymi Agent chat on the coach page using Gemini plus Firebase-backed training context and live form mistakes.
- Offline/PWA support with service worker, manifest, offline page, IndexedDB sync helpers, and local MediaPipe runtime files.
- Metric/imperial unit support with metric stored internally.
- Dark mode and responsive app layouts.

## Tech Stack

- Next.js 16, React 19, TypeScript, App Router.
- Tailwind CSS v4 and custom kinetic landing/dashboard components.
- Firebase Auth and Firestore.
- Firebase Storage rules are present but storage writes are currently disabled.
- MediaPipe Tasks Vision for on-device pose landmarks.
- Google Gemini through server-side Next.js API routes.
- Jest with `ts-jest` for unit tests.
- Vercel for production hosting.

## Local Setup

```powershell
cd "D:\work\FYP FINAL\gymi"
npm install
npm run dev
```

Open `http://localhost:3000`.

Use a separate terminal for the form-checking backend when testing coach mode:

```powershell
cd "D:\work\FYP FINAL\form-checking-backend\backend"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

Create `.env.local` from [.env.example](.env.example).

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

NEXT_PUBLIC_FORM_COACH_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Supported optional aliases:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Alternative base URL for the form coach backend. Takes priority over `NEXT_PUBLIC_FORM_COACH_URL`. |
| `NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH` | Overrides the bundled pose model path. Defaults to `/models/pose_landmarker_lite.task`. |
| `NEXT_PUBLIC_MEDIAPIPE_WASM_PATH` | Overrides the bundled MediaPipe WASM path. Defaults to `/mediapipe/wasm`. |

For production coach mode, set:

```env
NEXT_PUBLIC_FORM_COACH_URL=https://exercise-form-backend.onrender.com
```

The app derives `wss://` automatically for WebSocket connections.

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/onboarding` | Initial profile/unit setup |
| `/home` | Authenticated dashboard |
| `/workouts` | Workout logs and program-linked workouts |
| `/nutrition` | Meals, macros, templates, and food scanner |
| `/coach` | Live form coach and Gymi Agent |
| `/programs` | Workout program library and program details |
| `/progress` | Goals, weight, charts, and achievements |
| `/achievements` | Achievement view |
| `/account` | Profile, unit preference, diagnostics, logout |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/food-recognize` | Analyze a meal photo with Gemini and return structured nutrition data |
| `GET /api/food-recognize/health` | Check Gemini key/model readiness |
| `POST /api/workout-program` | Generate a validated workout program from templates and the exercise database |
| `POST /api/workout-program/generate` | Compatibility route for older clients |
| `POST /api/coach-agent` | Ask Gymi Agent a training/form question using user context plus live coach data |

## Form Coach Integration

The coach page is implemented at [app/(app)/coach/page-websocket.tsx](<app/(app)/coach/page-websocket.tsx>). It:

1. Lazily initializes MediaPipe from bundled local assets.
2. Opens the camera and runs pose detection at a throttled frame interval.
3. Sends 33 pose landmarks to the FastAPI backend through [lib/hooks/usePoseWebSocket.ts](lib/hooks/usePoseWebSocket.ts).
4. Includes a `camera_view` preference of `auto`, `front`, `side`, or `three_quarter`.
5. Renders the backend's exercise, reps, rep phase, correction message, joint colors, confidence, signal quality, and resolved camera view.
6. Saves coach sessions to `/users/{uid}/coachSessions/{sessionId}` and mirrors a summary into `/users/{uid}/workouts`.
7. Passes recent sessions, workouts, meals, goals, live violations, and live corrections to Gymi Agent.

The shared WebSocket request/response types live in [lib/contracts/integration.ts](lib/contracts/integration.ts).

## Firebase Data Model

Firestore rules allow each authenticated user to read and write only their own data under `/users/{uid}`:

- `workouts`
- `meals`
- `mealTemplates`
- `weightLogs`
- `goals`
- `achievements`
- `notifications`
- `workoutPrograms`
- `coachSessions`

The rules are in [firebase/firestore.rules](firebase/firestore.rules). Firebase Storage writes are blocked for now in [firebase/storage.rules](firebase/storage.rules).

## AI Features

### Food Recognition

`POST /api/food-recognize` accepts a base64 JPEG, PNG, or WebP image up to 4 MB. It calls Gemini server-side, requests strict JSON, validates/coerces the response, and returns calories, protein, carbs, fat, visible items, and confidence.

### Workout Programs

`POST /api/workout-program` currently uses deterministic program templates and the local exercise database, not an LLM. It validates questionnaire fields, applies equipment and experience adjustments, validates the generated structure, and returns a program for the client to save in Firestore.

### Gymi Agent

`POST /api/coach-agent` uses Gemini text generation. The prompt is built from recent coach sessions, workouts, meals, goals, and live form-coach mistakes. If `GEMINI_API_KEY` is missing or Gemini is unavailable, the route returns an explicit `llm_unavailable` response.

## Project Layout

```text
app/
  (app)/                 Authenticated app routes
  (auth)/                Login, register, onboarding
  api/                   Server-side Gemini and program routes
  page.tsx               Landing page
components/
  features/              Domain UI such as coach, meals, programs, workouts
  kinetic/               Landing/dashboard visual system
  layout/                App shell, navigation, notifications
  providers/             Auth, theme, units, error boundary
  ui/                    Reusable primitives
lib/
  contracts/             Shared integration types
  data/                  Exercise database and program templates
  hooks/                 Coach WebSocket, uploads, offline/cache helpers
  offline/               IndexedDB/offline sync helpers
  services/              Gemini, pose detection, program generation
  utils/                 Units, validation, search, export, errors
firebase/
  firestore.rules
  storage.rules
public/
  mediapipe/wasm/        Vendored MediaPipe runtime
  models/                Vendored pose landmarker model
  manifest.json
  sw.js
```

## Scripts

```powershell
npm run dev      # Local Next.js development server
npm run build    # Production build
npm run start    # Start production build
npm run lint     # ESLint
npm test         # Jest tests
```

Current Jest test files cover search, units, validation, and time formatting utilities.

## Deployment Notes

- Deploy the Gymi repo to Vercel.
- Add Firebase public config values in Vercel environment variables.
- Add `GEMINI_API_KEY` and optional `GEMINI_MODEL` for food recognition and Gymi Agent.
- Set `NEXT_PUBLIC_FORM_COACH_URL=https://exercise-form-backend.onrender.com`.
- Keep the backend CORS settings aligned with the Gymi production domain and Vercel preview URLs.
- Confirm the bundled MediaPipe model and WASM assets exist under `public/models` and `public/mediapipe/wasm` before demoing coach mode.

## Full Documentation

- [docs/README.md](docs/README.md) - broader architecture and feature documentation.
- [docs/DEV_PLAN.md](docs/DEV_PLAN.md) - development plan and phase history.
- [docs/EXHIBITION_RELEASE.md](docs/EXHIBITION_RELEASE.md) - exhibition/demo release notes.

## License

Built as a Final Year Project for 2025/2026. This repository is private.
